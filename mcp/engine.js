// The page's simulation engine, loaded once from public/index.html the same way scripts/snapshot.js does, plus a
// 60-second cache of simulation results keyed by their arguments. Nothing here writes anywhere: picks live only in
// the arguments of one call.
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const PAGE = path.join(ROOT, "public", "index.html");
const DEFAULT_SEED = 20261116;     // the engine's own default (rng(seed==null?20261116:seed) in the page)
const CACHE_MS = 60000;
const STALE_SEC = 48 * 3600;       // the daily refresh rebuilds the page; two days without one counts as stale

let loaded = null;

function load() {
  if (loaded) return loaded;
  const at = Date.now();
  try {
    const html = fs.readFileSync(PAGE, "utf8");
    const m = html.match(/<script id="engine">([\s\S]*?)<\/script>/);
    if (!m) throw new Error("no <script id=\"engine\"> in public/index.html");
    let src = m[1];
    // Tests pin the season data (NFLU_ENGINE_DATA: a file holding one `var D=...` line) so that fixture matchups do
    // not depend on which games the daily build has already counted. The engine code is still the page's own.
    const pinned = process.env.NFLU_ENGINE_DATA;
    if (pinned) {
      if (!/^var D=.*$/m.test(src)) throw new Error("no `var D=` line in the engine script to pin");
      const data = fs.readFileSync(pinned, "utf8").trim();
      src = src.replace(/^var D=.*$/m, () => data);
    }
    const E = new Function(src + ";return {simulate,seedsToday,baseProb,GAMES,TM,D,HFA,SHRINK,blendProb:typeof blendProb==='function'?blendProb:null,changeWatch:typeof changeWatch==='function'?changeWatch:null,explainChange:typeof explainChange==='function'?explainChange:null}")();
    if (!Array.isArray(E.GAMES) || !Array.isArray(E.TM) || E.TM.length !== 32 || typeof E.simulate !== "function") throw new Error("engine globals missing or malformed");
    const gameIndex = new Map(E.GAMES.map((g, i) => [g[0], i]));
    const pairIndex = new Map(E.GAMES.map((g, i) => [E.TM[g[2]].a + "@" + E.TM[g[3]].a, i]));
    const teamIndex = new Map(E.TM.map((t, i) => [t.a, i]));
    const builtMs = Date.parse(E.D.built);
    loaded = { ok: true, E, gameIndex, pairIndex, teamIndex, builtMs: Number.isNaN(builtMs) ? null : builtMs, loadedAt: at, mtimeMs: fs.statSync(PAGE).mtimeMs };
  } catch (err) {
    loaded = { ok: false, error: String((err && err.message) || err).slice(0, 300), loadedAt: at };
  }
  return loaded;
}

// The engine as a source entry, in the same shape as the fabric's sources, so answers can name it with a status.
function sourceStatus() {
  const L = load();
  const base = { id: "engine", label: "Season data and simulation engine built into public/index.html", tier: 2, scope: "public" };
  if (!L.ok) return Object.assign(base, { status: "down", lastOk: null, ageSec: null, lastError: L.error, builtAt: null });
  const ageSec = L.builtMs ? Math.max(0, Math.round((Date.now() - L.builtMs) / 1000)) : null;
  let status = ageSec != null && ageSec > STALE_SEC ? "stale" : "ok", lastError = null;
  try {
    if (fs.statSync(PAGE).mtimeMs !== L.mtimeMs) { status = "stale"; lastError = "public/index.html was rebuilt after this server loaded it; restart the MCP server to use the new build"; }
  } catch (_) { /* the file vanished after loading; the loaded copy still works */ }
  return Object.assign(base, { status, builtAt: L.E.D.built, lastOk: L.builtMs ? new Date(L.builtMs).toISOString() : null, ageSec, lastError,
    gamesPlayed: L.E.D.played.length, gamesRemaining: L.E.GAMES.length, maxStaleSec: STALE_SEC });
}

const cache = new Map();
const r3 = (x) => Math.round(x * 1000) / 1000;

// simulate(picksArray, sims, seed) -> per-team shares. picksArray[i]: 0 simulate, 1 away wins, 2 home wins.
function simulate(picks, sims, seed) {
  const L = load();
  if (!L.ok) throw new Error("engine unavailable: " + L.error);
  const s = seed == null ? DEFAULT_SEED : seed;
  const key = picks.join("") + "|" + sims + "|" + s;
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && now - hit.at < CACHE_MS) return Object.assign({ cached: true }, hit.v);
  const { E } = L;
  const t0 = Date.now();
  const r = E.simulate(picks, 0, sims, null, false, null, s);
  const n = r.n;
  const teams = E.TM.map((t, i) => ({
    team: t.a, i, playoffs: r3(r.po[i] / n), winDivision: r3(r.dv[i] / n), topSeed: r3(r.seedC[i][0] / n),
    seeds: r.seedC[i].map((c) => r3(c / n)), reachSuperBowl: r3(r.rSB[i] / n), winSuperBowl: r3(r.wSB[i] / n), projectedWins: Math.round((r.sw[i] / n) * 10) / 10,
  }));
  const v = { sims: n, seed: s, open: r.open, ms: Date.now() - t0, teams };
  for (const [k, e] of cache) if (now - e.at >= CACHE_MS) cache.delete(k);
  if (cache.size >= 50) cache.delete(cache.keys().next().value);
  cache.set(key, { at: now, v });
  return Object.assign({ cached: false }, v);
}

module.exports = { load, sourceStatus, simulate, DEFAULT_SEED, PAGE };
