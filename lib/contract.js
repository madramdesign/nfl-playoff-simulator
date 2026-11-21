// The /api/universe contract, version 1. Shared by the data fabric (which produces it), the page (which reads it)
// and the tests (which check both against it). Field-by-field description: docs/DATA_MODEL.md.
// No dependencies; works in Node and, if ever needed, the browser.
"use strict";

const VERSION = 1;
const EVENT_TYPES = ["news", "injury", "transaction", "odds_move", "weather", "game", "qb_change", "model", "playoff_move"];
const GAME_STATES = ["pre", "in", "post"];
const SOURCE_STATUS = ["ok", "stale", "down", "disabled", "pending"];
// scope: "public" sources may appear in anything committed or published (snapshot, event files, the static page);
// "local" sources (ESPN's JSON, DEC-006) are served only by the local server and never written to the repository.
const SOURCE_SCOPES = ["public", "local"];
const BREAKER_STATES = ["closed", "open", "half-open"];
const INJURY_STATUS = ["Out", "Doubtful", "Questionable", "Injured Reserve", "Physically Unable to Perform", "Suspended", "Day-To-Day", "Other"];

const isObj = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
const isIso = (x) => typeof x === "string" && !Number.isNaN(Date.parse(x));
const isNum = (x) => typeof x === "number" && Number.isFinite(x);
const isProb = (x) => isNum(x) && x >= 0 && x <= 1;

function validateUniverse(u, teamAbbrs) {
  const errs = [];
  const err = (path, msg) => { if (errs.length < 50) errs.push(path + ": " + msg); };
  const team = (path, a) => { if (typeof a !== "string" || (teamAbbrs && !teamAbbrs.includes(a))) err(path, "unknown team " + JSON.stringify(a)); };
  if (!isObj(u)) return ["root: not an object"];
  if (u.v !== VERSION) err("v", "expected version " + VERSION);
  if (!isIso(u.generatedAt)) err("generatedAt", "not an ISO time");
  if (!isNum(u.season)) err("season", "not a number");
  if (u.week != null && !isNum(u.week)) err("week", "not a number");

  if (!isObj(u.sources)) err("sources", "missing");
  else for (const [id, s] of Object.entries(u.sources)) {
    const p = "sources." + id;
    if (s.id !== id) err(p + ".id", "must equal its key");
    if (!SOURCE_STATUS.includes(s.status)) err(p + ".status", JSON.stringify(s.status));
    if (!BREAKER_STATES.includes(s.breaker)) err(p + ".breaker", JSON.stringify(s.breaker));
    if (s.lastOk != null && !isIso(s.lastOk)) err(p + ".lastOk", "not ISO");
    if (!isNum(s.tier) || s.tier < 1 || s.tier > 4) err(p + ".tier", "1-4");
    if (typeof s.label !== "string") err(p + ".label", "missing");
    if (!SOURCE_SCOPES.includes(s.scope)) err(p + ".scope", "public or local");
  }

  if (!Array.isArray(u.games)) err("games", "missing");
  else u.games.forEach((g, k) => {
    const p = "games[" + k + "]";
    if (typeof g.id !== "string") err(p + ".id", "string");
    if (typeof g.source !== "string" || (isObj(u.sources) && !u.sources[g.source])) err(p + ".source", "a source id listed in sources");
    if (g.odds && isObj(u.sources) && !u.sources[g.odds.source]) err(p + ".odds.source", "not listed in sources");
    if (g.weather && isObj(u.sources) && !u.sources[g.weather.source]) err(p + ".weather.source", "not listed in sources");
    team(p + ".away", g.away); team(p + ".home", g.home);
    if (!GAME_STATES.includes(g.state)) err(p + ".state", JSON.stringify(g.state));
    if (!isIso(g.kickoff)) err(p + ".kickoff", "not ISO");
    if (!isNum(g.awayScore) || !isNum(g.homeScore)) err(p, "scores must be numbers");
    if (!isNum(g.period)) err(p + ".period", "number");
    if (g.odds != null) {
      const o = g.odds;
      if (typeof o.provider !== "string") err(p + ".odds.provider", "string");
      if (typeof o.source !== "string") err(p + ".odds.source", "source id");
      for (const f of ["spread", "total", "homeML", "awayML", "homeProb"]) {
        if (o[f] == null) continue;
        if (!isObj(o[f])) { err(p + ".odds." + f, "object {open,current}"); continue; }
        for (const w of ["open", "current"]) if (o[f][w] != null && !isNum(o[f][w])) err(p + ".odds." + f + "." + w, "number or null");
      }
      if (o.homeProb) for (const w of ["open", "current"]) if (o.homeProb[w] != null && !isProb(o.homeProb[w])) err(p + ".odds.homeProb." + w, "0-1");
    }
    if (g.weather != null) {
      const w = g.weather;
      if (!Array.isArray(w.flags)) err(p + ".weather.flags", "array");
      if (typeof w.source !== "string") err(p + ".weather.source", "string");
    }
    if (g.situation != null && !isObj(g.situation)) err(p + ".situation", "object or null");
    if (!isObj(g.venue)) err(p + ".venue", "object");
  });

  if (!Array.isArray(u.events)) err("events", "missing");
  else {
    const seen = new Set();
    u.events.forEach((e, k) => {
      const p = "events[" + k + "]";
      if (typeof e.id !== "string") err(p + ".id", "string");
      else if (seen.has(e.id)) err(p + ".id", "duplicate " + e.id); else seen.add(e.id);
      if (!EVENT_TYPES.includes(e.type)) err(p + ".type", JSON.stringify(e.type));
      if (!isIso(e.ts)) err(p + ".ts", "not ISO");
      if (!isIso(e.seenAt)) err(p + ".seenAt", "not ISO");
      if (!Array.isArray(e.teams)) err(p + ".teams", "array"); else e.teams.forEach((a, j) => team(p + ".teams[" + j + "]", a));
      if (typeof e.title !== "string" || !e.title) err(p + ".title", "non-empty string");
      if (e.url != null && !/^https:\/\//.test(e.url)) err(p + ".url", "https URL or null");
      if (typeof e.source !== "string") err(p + ".source", "string");
      else if (isObj(u.sources) && !u.sources[e.source]) err(p + ".source", "not listed in sources: " + e.source);
      if (!isNum(e.importance) || e.importance < 0 || e.importance > 100) err(p + ".importance", "0-100");
      if (!isProb(e.confidence)) err(p + ".confidence", "0-1");
      if (!isNum(e.sourceCount) || e.sourceCount < 1) err(p + ".sourceCount", ">= 1");
      if (!Array.isArray(e.sources)) err(p + ".sources", "array");
    });
  }

  if (!isObj(u.injuries)) err("injuries", "missing");
  else for (const [a, t] of Object.entries(u.injuries)) {
    team("injuries." + a, a);
    if (!isNum(t.burden)) err("injuries." + a + ".burden", "number");
    if (!Array.isArray(t.players)) err("injuries." + a + ".players", "array");
    else t.players.forEach((pl, j) => { if (!INJURY_STATUS.includes(pl.status)) err("injuries." + a + ".players[" + j + "].status", JSON.stringify(pl.status)); });
  }

  if (!Array.isArray(u.transactions)) err("transactions", "missing");
  else u.transactions.forEach((t, k) => { team("transactions[" + k + "].team", t.team); if (!isIso(t.date)) err("transactions[" + k + "].date", "not ISO"); });
  return errs;
}

// A snapshot that will be committed or embedded in the published page: the same shape, but every source must be public
// and nothing may come from a local-only source.
function validatePublicSnapshot(u, teamAbbrs) {
  const errs = validateUniverse(u, teamAbbrs);
  if (!isObj(u) || !isObj(u.sources)) return errs;
  for (const [id, s] of Object.entries(u.sources)) if (s.scope !== "public") errs.push("sources." + id + ": local source in a public snapshot");
  (u.events || []).forEach((e, k) => { const s = u.sources[e.source]; if (s && s.scope !== "public") errs.push("events[" + k + "]: from local source " + e.source); });
  const local = (id) => !u.sources[id] || u.sources[id].scope !== "public";
  (u.games || []).forEach((g, k) => {
    if (g.odds && local(g.odds.source)) errs.push("games[" + k + "].odds: from non-public source " + g.odds.source);
    if (g.weather && local(g.weather.source)) errs.push("games[" + k + "].weather: from non-public source " + g.weather.source);
    if (local(g.source)) errs.push("games[" + k + "]: from non-public source " + g.source);
    if (g.situation != null || g.winProb != null || g.state === "in") errs.push("games[" + k + "]: live state comes only from local sources");
  });
  for (const [a, t] of Object.entries(u.injuries || {})) (t.players || []).forEach((p, j) => {
    if (local(p.source)) errs.push("injuries." + a + ".players[" + j + "]: from non-public source " + p.source);
    if (p.also && local(p.also.source)) errs.push("injuries." + a + ".players[" + j + "].also: from non-public source " + p.also.source);
  });
  (u.transactions || []).forEach((x, k) => { if (local(x.source)) errs.push("transactions[" + k + "]: from non-public source " + x.source); });
  (u.events || []).forEach((e, k) => { const o = e.data && e.data.other; if (o && local(o.source)) errs.push("events[" + k + "].data.other: from non-public source " + o.source); });
  return errs;
}

// GET /api/game/<id>: one game's detail. Local scope (built from ESPN's game summary).
function validateGameDetail(d, teamAbbrs) {
  const errs = [];
  const err = (path, msg) => { if (errs.length < 50) errs.push(path + ": " + msg); };
  if (!isObj(d)) return ["root: not an object"];
  if (d.v !== VERSION) err("v", "expected version " + VERSION);
  if (typeof d.id !== "string") err("id", "string");
  if (!isIso(d.generatedAt)) err("generatedAt", "not ISO");
  if (typeof d.source !== "string") err("source", "string");
  if (!SOURCE_SCOPES.includes(d.scope)) err("scope", "public or local");
  const h = d.header;
  if (!isObj(h)) err("header", "object");
  else {
    for (const f of ["away", "home"]) if (typeof h[f] !== "string" || (teamAbbrs && !teamAbbrs.includes(h[f]))) err("header." + f, "team");
    if (!GAME_STATES.includes(h.state)) err("header.state", JSON.stringify(h.state));
    for (const f of ["period", "awayScore", "homeScore"]) if (!isNum(h[f])) err("header." + f, "number");
  }
  if (!Array.isArray(d.winProb)) err("winProb", "array");
  else d.winProb.forEach((w, k) => { if (!isProb(w.home)) err("winProb[" + k + "].home", "0-1"); });
  for (const f of ["scoring", "plays", "injuries"]) if (!Array.isArray(d[f])) err(f, "array");
  (d.scoring || []).forEach((s, k) => { if (!isNum(s.period) || typeof s.text !== "string") err("scoring[" + k + "]", "period and text"); });
  return errs;
}

module.exports = { VERSION, EVENT_TYPES, GAME_STATES, SOURCE_STATUS, SOURCE_SCOPES, INJURY_STATUS, validateUniverse, validatePublicSnapshot, validateGameDetail };
