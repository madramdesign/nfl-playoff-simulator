// Where the MCP server gets the /api/universe payload: the data fabric (lib/fabric) in normal use, or a JSON file named
// by NFLU_FIXTURE in tests. Scopes follow DEC-006: the server is a local tool, so it may use local sources unless
// NFLU_SCOPES=public restricts it.
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const C = require(path.join(ROOT, "lib", "contract.js"));
const { ABBRS } = require(path.join(ROOT, "lib", "fabric", "entities.js"));
const { injuryWeight } = require(path.join(ROOT, "lib", "fabric", "score.js"));

function parseScopes(raw, log) {
  if (raw == null || String(raw).trim() === "") return ["public", "local"];
  const list = String(raw).split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  const bad = list.filter((s) => !C.SOURCE_SCOPES.includes(s));
  if (bad.length || !list.includes("public")) {
    log("NFLU_SCOPES=" + JSON.stringify(raw) + " is not understood; using public sources only");
    return ["public"];
  }
  return C.SOURCE_SCOPES.filter((s) => list.includes(s));
}

// Drops everything a fixture holds from sources outside the allowed scopes, so NFLU_SCOPES behaves the same with a
// fixture as with the fabric (which never loads those sources). Games whose state came from an excluded source are
// dropped rather than relabelled: the fixture does not say what a permitted source would have shown.
function restrictToScopes(u, scopes) {
  const allowed = (id) => !!(u.sources[id] && scopes.includes(u.sources[id].scope));
  if (Object.keys(u.sources).every(allowed)) return u;
  const sources = Object.fromEntries(Object.entries(u.sources).filter(([id]) => allowed(id)));
  const games = u.games.filter((g) => allowed(g.source)).map((g) => Object.assign({}, g, {
    odds: g.odds && allowed(g.odds.source) ? g.odds : null,
    weather: g.weather && allowed(g.weather.source) ? g.weather : null,
    winProb: g.winProb && allowed(g.winProb.source) ? g.winProb : null,
  }));
  const injuries = {};
  for (const [a, t] of Object.entries(u.injuries)) {
    const players = t.players.filter((p) => !p.source || allowed(p.source)).map((p) => {
      const q = Object.assign({}, p);
      if (q.also && q.also.source && !allowed(q.also.source)) { delete q.also; delete q.disagree; }
      return q;
    });
    if (!players.length) continue;
    if (players.length === t.players.length) { injuries[a] = Object.assign({}, t, { players }); continue; }
    const n = (s) => players.filter((p) => p.status === s).length;
    injuries[a] = { burden: Math.round(players.reduce((s, p) => s + injuryWeight(p.status, p.pos, p.starter), 0) * 100) / 100,
      out: n("Out"), doubtful: n("Doubtful"), questionable: n("Questionable"), ir: n("Injured Reserve"),
      // same rule as lib/fabric/index.js: only the quarterback known to have started the last game counts
      qbOut: players.some((p) => p.pos === "QB" && p.starter === true && ["Out", "Doubtful", "Injured Reserve", "Suspended", "Physically Unable to Perform"].includes(p.status)),
      reportWeek: t.reportWeek == null ? null : t.reportWeek, players };
  }
  return Object.assign({}, u, {
    sources, games, injuries,
    events: u.events.filter((e) => allowed(e.source)),
    transactions: u.transactions.filter((x) => !x.source || allowed(x.source)),
  });
}

function withTimeout(promise, ms) {
  let timer;
  return Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(Object.assign(new Error("timeout"), { code: "TIMEOUT" })), ms); })])
    .finally(() => clearTimeout(timer));
}

// fetchImpl: tests only (a fake fetch for the fabric); the server never passes one.
function createProvider({ env = process.env, log = () => {}, fetchImpl } = {}) {
  const scopes = parseScopes(env.NFLU_SCOPES, log);
  const fixture = env.NFLU_FIXTURE ? path.resolve(env.NFLU_FIXTURE) : null;
  const timeoutMs = Number(env.NFLU_TIMEOUT_MS) > 0 ? Number(env.NFLU_TIMEOUT_MS) : 25000;
  let fabric = null, fixtureData = null;

  function getFabric() {
    // cacheDir null: the MCP server keeps last-good answers in memory only and never writes files.
    if (!fabric) fabric = require(path.join(ROOT, "lib", "fabric")).createFabric(Object.assign({ scopes, cacheDir: null }, fetchImpl ? { fetchImpl } : {}));
    return fabric;
  }

  async function universe() {
    if (fixture) {
      if (!fixtureData) {
        const raw = JSON.parse(fs.readFileSync(fixture, "utf8"));
        const errs = C.validateUniverse(raw, ABBRS);
        if (errs.length) throw new Error("fixture " + fixture + " fails the universe contract: " + errs.slice(0, 5).join("; "));
        fixtureData = restrictToScopes(raw, scopes);
      }
      return fixtureData;
    }
    const f = getFabric();
    try {
      return await withTimeout(f.universe(), timeoutMs);
    } catch (err) {
      if (err && err.code === "TIMEOUT") {
        // the load keeps running in the background; the next call usually gets it
        const wait = timeoutMs >= 1000 ? Math.round(timeoutMs / 1000) + " s" : timeoutMs + " ms";
        const e = new Error("the data sources did not all answer within " + wait + " (the first call after start fetches every source); try again shortly. " +
          "Sources shown as down without a lastError may still be loading.");
        e.health = f.health().sources;
        throw e;
      }
      throw err;
    }
  }

  return { universe, scopes, mode: fixture ? "fixture" : "live", fixture };
}

module.exports = { createProvider, parseScopes, restrictToScopes };
