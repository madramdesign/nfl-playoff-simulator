// The MCP server's tools. All are read-only: they read the universe payload (lib/fabric or a fixture), the page's
// engine and data/snapshots/, and return JSON. None writes a file, saves a pick, fetches a caller-supplied address or
// acts on any account. Every answer names the sources it drew on, with status and scope, and lists the ones that are
// not "ok" under unavailableSources, so missing data is never presented as "nothing to report".
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const C = require(path.join(ROOT, "lib", "contract.js"));
const ENT = require(path.join(ROOT, "lib", "fabric", "entities.js"));
const engine = require("./engine");
const { validate, isObj, hasOwn } = require("./validate");
const { createProvider } = require("./universe");

const SNAP_DIR = path.join(ROOT, "data", "snapshots");
const ABBRS = ENT.ABBRS;
const r1 = (x) => Math.round(x * 10) / 10;
const r3 = (x) => Math.round(x * 1000) / 1000;
const margin95 = (n) => r3(1.96 * 0.5 / Math.sqrt(n));   // worst case, at a 50% chance

// Sources each kind of answer depends on (ids from lib/fabric/index.js). Sources actually referenced by the returned
// items are added on top, so a new source still shows up.
const GAME_SOURCES = ["nflverse-games", "espn-scoreboard", "open-meteo"];
const LIVE_SOURCES = ["espn-scoreboard", "nflverse-games"];
const INJURY_SOURCES = ["nflverse-injuries", "espn-injuries"];
const NEWS_SOURCES = ["rss-yahoo", "rss-espn", "espn-news", "curated-news"];
const ODDS_SOURCES = ["nflverse-games", "espn-scoreboard"];
const WEATHER_SOURCES = ["open-meteo", "nflverse-games", "espn-scoreboard"];

// What kind of statement each event type is (facts, claims and estimates stay apart: CLAUDE.md).
const BASIS = {
  news: "reported claim (headline; follow the link for the story)",
  qb_change: "reported change, curated from a cited source",
  injury: "source report (injury designation)",
  transaction: "source report (team transaction)",
  game: "source fact (score or final)",
  odds_move: "market data (line movement)",
  weather: "forecast",
  model: "model estimate",
  playoff_move: "model estimate",
};

// ---------- argument schemas ----------
const TEAM = { type: "string", enum: ABBRS,
  description: "Team abbreviation as the page uses it (BUF, NYG, LAR, WAS, JAX, ...). Case-insensitive; provider forms such as WSH, JAC or LA are mapped." };
const CONFERENCE = { type: "string", enum: ["AFC", "NFC"], description: "Conference (case-insensitive)." };
const EVENT_TYPE = { type: "string", enum: C.EVENT_TYPES, description: "Event type: " + C.EVENT_TYPES.join(", ") + "." };
const HOURS = { type: "number", minimum: 1, maximum: 720, description: "Only items whose time (ts) is within this many hours before the data's generatedAt." };
const LIMIT = { type: "integer", minimum: 1, maximum: 100, description: "Maximum items to return (default 20)." };
const SIMS = { type: "integer", minimum: 1000, maximum: 100000, description: "Simulated seasons (default 20000). More is slower and steadier." };
const SEED = { type: "integer", minimum: 0, maximum: 2147483647, description: "Random seed (default: the engine's fixed seed, so answers repeat)." };
const PICKS = { type: "object", minProperties: 1, maxProperties: 300,
  description: "Map of engine game id (e.g. \"2026_12_NYG_IND\"; nflverse form, so the Rams appear as LA) to the winning team's abbreviation. Game ids come from get_team (remainingGames), get_games (engine.gameId) or search.",
  propertyNames: { type: "string", pattern: "^\\d{4}_\\d{2}_[A-Z]{2,3}_[A-Z]{2,3}$" },
  additionalProperties: TEAM };
const obj = (properties, required) => Object.assign({ type: "object", properties, additionalProperties: false }, required ? { required } : {});

class ToolError extends Error {
  constructor(message, { details = {}, used = [] } = {}) { super(message); this.details = details; this.used = used; }
}

// ---------- shared views ----------
const statusOf = (u, id) => (u && u.sources[id]) || null;
const scopeOf = (u, id) => { const s = statusOf(u, id); return s ? s.scope : null; };
const pick = (u, ids) => ids.map((id) => statusOf(u, id)).filter(Boolean);
function refsOf(u, games) {
  const ids = new Set();
  for (const g of games) for (const id of [g.source, g.odds && g.odds.source, g.weather && g.weather.source, g.winProb && g.winProb.source]) if (id) ids.add(id);
  return pick(u, [...ids]);
}
function snapshotsStatus(info) {
  const base = { id: "forecast-snapshots", label: "Saved daily forecasts (data/snapshots/)", tier: 2, scope: "public" };
  if (!info || !info.snap) return Object.assign(base, { status: "down", lastOk: null, ageSec: null, lastError: (info && info.error) || "no snapshot file could be read" });
  const at = Date.parse(info.snap.date + "T12:00:00Z");
  return Object.assign(base, { status: "ok", lastOk: Number.isNaN(at) ? null : new Date(at).toISOString(), ageSec: Number.isNaN(at) ? null : Math.max(0, Math.round((Date.now() - at) / 1000)), lastError: null });
}

function lineView(o, u) {
  const pair = (x) => (x ? { open: x.open == null ? null : x.open, current: x.current == null ? null : x.current,
    move: x.open != null && x.current != null ? Math.round((x.current - x.open) * 100) / 100 : null } : null);
  return { source: o.source, sourceScope: scopeOf(u, o.source), provider: o.provider, spreadHome: pair(o.spread), total: pair(o.total),
    homeWinProbNoVig: o.homeProb ? { open: o.homeProb.open, current: o.homeProb.current } : null,
    moneyline: { home: o.homeML || null, away: o.awayML || null } };
}
function weatherView(w, u) {
  return { source: w.source, sourceScope: scopeOf(u, w.source), tempF: w.tempF, windMph: w.windMph, gustMph: w.gustMph, precipProb: w.precipProb,
    precipIn: w.precipIn, snowIn: w.snowIn, summary: w.summary, flags: w.flags, basis: "forecast for the kickoff hour" };
}
function engineFor(g, L) {
  if (!L || !L.ok) return null;
  const { E } = L;
  let k, matchedBy = "gameId";
  if (g.gid && L.gameIndex.has(g.gid)) k = L.gameIndex.get(g.gid);
  else { k = L.pairIndex.get(g.away + "@" + g.home); matchedBy = "teams"; }
  if (k === undefined) {
    const ia = L.teamIndex.get(g.away), ih = L.teamIndex.get(g.home);
    const played = E.D.played.some((p) => p[0] === ia && p[1] === ih);
    return { gameId: null, note: played ? "Already counted as played in the engine data (built " + E.D.built + ")." : "Not among the engine's remaining regular-season games." };
  }
  const row = E.GAMES[k];
  const out = { gameId: row[0], week: row[1], matchedBy, stillOpenInEngine: true, modelHomeChance: r3(E.baseProb(k)),
    basis: row[6] != null ? "model estimate: the sportsbook line at build, used as it stands" : "model estimate: blend of spread and results ratings (no line at build)" };
  if (g.state === "post" && g.awayScore !== g.homeScore) {
    const w = g.homeScore > g.awayScore ? g.home : g.away;
    out.note = "Final in the feed (" + w + " won), but the engine data built " + E.D.built + " still simulates it. To apply the result, call run_simulation with picks {\"" + row[0] + "\": \"" + w + "\"}.";
  } else if (g.state === "post") out.note = "Final in the feed as a tie; the engine cannot apply ties.";
  else if (g.state === "in") out.note = "In progress; simulations treat it from its pregame chance (live score not applied).";
  return out;
}
function gameView(g, u, L) {
  const v = { id: g.id, gid: g.gid || null, week: g.week, kickoff: g.kickoff, away: g.away, home: g.home, state: g.state,
    score: g.state === "pre" ? null : { away: g.awayScore, home: g.homeScore }, period: g.state === "in" ? g.period : null, clock: g.state === "in" ? g.clock : null,
    source: g.source, sourceScope: scopeOf(u, g.source), venue: g.venue, broadcast: g.broadcast || null,
    line: g.odds ? lineView(g.odds, u) : null, weather: g.weather ? weatherView(g.weather, u) : null };
  if (!g.odds) v.lineNote = "No line from the in-scope sources.";
  if (!g.weather) v.weatherNote = g.venue && g.venue.indoor ? "Indoor or closed roof." : "No forecast for this game.";
  if (g.state === "in") {
    v.situation = g.situation || null;
    v.winProb = g.winProb ? { home: g.winProb.home, source: g.winProb.source, sourceScope: scopeOf(u, g.winProb.source), basis: "the source's own in-game estimate" } : null;
  }
  const e = engineFor(g, L);
  if (e) v.engine = e;
  return v;
}
function eventView(e, u) {
  return { id: e.id, type: e.type, subtype: e.subtype, basis: BASIS[e.type] || "source report", ts: e.ts, seenAt: e.seenAt, teams: e.teams, players: e.players || [],
    title: e.title, url: e.url || null, publisher: e.publisher || null, source: e.source, sourceScope: scopeOf(u, e.source), importance: e.importance,
    confidence: e.confidence, sourceCount: e.sourceCount, sources: e.sources || [], gameId: e.gameId || null, data: e.data || {} };
}
function filterEvents(u, { types, team, hours, minImportance, limit = 20 }) {
  const ref = Date.parse(u.generatedAt);
  let list = u.events.slice().sort((x, y) => Date.parse(y.ts) - Date.parse(x.ts));
  if (types) list = list.filter((e) => types.includes(e.type));
  if (team) list = list.filter((e) => e.teams.includes(team));
  if (hours) list = list.filter((e) => Date.parse(e.ts) >= ref - hours * 3600000);
  if (minImportance != null) list = list.filter((e) => e.importance >= minImportance);
  return { total: list.length, items: list.slice(0, limit).map((e) => eventView(e, u)),
    window: hours ? { field: "ts", from: new Date(ref - hours * 3600000).toISOString(), to: u.generatedAt } : null };
}
function injuryView(t) {
  return { burden: t.burden, out: t.out, doubtful: t.doubtful, questionable: t.questionable, injuredReserve: t.ir, startingQbOut: t.qbOut,
    players: t.players.map((p) => ({ name: p.name, pos: p.pos || null, status: p.status, injury: p.type || null, returnDate: p.returnDate || null, reportedAt: p.date || null,
      starter: p.starter == null ? null : p.starter, source: p.source || null, otherReport: p.also || null, sourcesDisagree: !!p.disagree })) };
}
function okCount(list) { return list.filter((s) => s.status === "ok").length; }

// Season records from the engine's finished games (D.played rows: [away, home, awayScore, homeScore]).
function records(E) {
  const R = E.TM.map(() => ({ w: 0, l: 0, t: 0, pf: 0, pa: 0, dw: 0, dl: 0, dt: 0, cw: 0, cl: 0, ct: 0 }));
  for (const [a, h, x, y] of E.D.played) {
    const div = E.TM[a].d === E.TM[h].d, conf = E.TM[a].c === E.TM[h].c;
    const add = (i, mine, theirs) => {
      const r = R[i], k = mine > theirs ? "w" : mine < theirs ? "l" : "t";
      r[k]++; r.pf += mine; r.pa += theirs;
      if (div) r["d" + k]++;
      if (conf) r["c" + k]++;
    };
    add(a, x, y); add(h, y, x);
  }
  return R;
}
const wlt = (w, l, t) => w + "-" + l + (t ? "-" + t : "");
function recordView(r) {
  const g = r.w + r.l + r.t;
  return { wins: r.w, losses: r.l, ties: r.t, pct: g ? r3((r.w + r.t / 2) / g) : null, pointsFor: r.pf, pointsAgainst: r.pa, net: r.pf - r.pa,
    division: wlt(r.dw, r.dl, r.dt), conference: wlt(r.cw, r.cl, r.ct) };
}
function teamInfo(a) {
  const t = ENT.team(a);
  return { team: t.a, name: t.name, conference: t.conf, division: t.div };
}

// The latest saved forecast made from a different build than the engine's (the page's what-changed view uses the
// same rule: a snapshot of the very build being compared would show nothing).
// NFLU_SNAPSHOT_DIR: tests only, to read saved forecasts from a temporary folder
const snapDir = () => process.env.NFLU_SNAPSHOT_DIR || SNAP_DIR;
function readSnapshot(L) {
  let files;
  try { files = fs.readdirSync(snapDir()).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort().reverse(); }
  catch (err) { return { error: "data/snapshots/ could not be read: " + err.message, skipped: [] }; }
  if (!files.length) return { error: "data/snapshots/ holds no snapshot", skipped: [] };
  const skipped = [];
  let fallback = null;
  for (const f of files) {
    let snap;
    try { snap = JSON.parse(fs.readFileSync(path.join(snapDir(), f), "utf8")); }
    catch (err) { skipped.push({ file: "data/snapshots/" + f, reason: "unreadable: " + err.message.slice(0, 120) }); continue; }
    if (!Array.isArray(snap.teams) || !Array.isArray(snap.playoffs)) { skipped.push({ file: "data/snapshots/" + f, reason: "missing teams or playoffs" }); continue; }
    if (!fallback) fallback = { file: f, snap };
    if (L.ok && snap.built === L.E.D.built) { skipped.push({ file: "data/snapshots/" + f, reason: "made from the same build as the engine data (" + snap.built + "), so it would show no change" }); continue; }
    return { file: "data/snapshots/" + f, snap, skipped };
  }
  if (fallback) return { file: "data/snapshots/" + fallback.file, snap: fallback.snap, skipped, sameBuild: true };
  return { error: "no readable snapshot in data/snapshots/", skipped };
}

// ---------- tools ----------
const TOOLS = [
  {
    name: "get_games", title: "This week's games",
    description: "This week's games from the data fabric: state (pre/in/post), score, period and clock, the line with its source (spread from the home side, total, no-vig home win chance, open and current), kickoff-hour weather with its source, and the matching engine game id with the model's home chance. Flags games the feed shows as final that the engine data still simulates.",
    inputSchema: obj({ team: TEAM, state: { type: "string", enum: C.GAME_STATES, description: "Only games in this state." } }),
    openWorld: true,
    async run(a, ctx) {
      const u = await ctx.universe(), L = engine.load();
      let games = u.games;
      if (a.team) games = games.filter((g) => g.away === a.team || g.home === a.team);
      if (a.state) games = games.filter((g) => g.state === a.state);
      const used = [...pick(u, GAME_SOURCES), ...refsOf(u, games), engine.sourceStatus()];
      const notes = [];
      if (!u.games.length) notes.push(okCount(pick(u, ["nflverse-games", "espn-scoreboard"])) ? "The schedule sources list no games for this week." : "No schedule source answered, so an empty list does not mean there are no games.");
      return ctx.answer(used, { season: u.season, week: u.week, seasonType: u.seasonType, count: games.length, games: games.map((g) => gameView(g, u, L)),
        units: "spreadHome is from the home team's side (negative: home favored); homeWinProbNoVig is the moneyline with the bookmaker margin removed; nflverse gives one current line and no opening line.", notes });
    },
  },
  {
    name: "get_live_games", title: "Games in progress",
    description: "Games in progress now, with score, period, clock, down and distance, and the source's own win estimate. Says plainly when no live-score source is in scope or the scoreboard is stale or down.",
    inputSchema: obj({}),
    openWorld: true,
    async run(a, ctx) {
      const u = await ctx.universe(), L = engine.load();
      const live = u.games.filter((g) => g.state === "in");
      const sb = statusOf(u, "espn-scoreboard");
      const notes = [];
      if (!sb) notes.push("No live-score source is in scope (scopes: " + ctx.scopes.join(", ") + "). The public schedule source updates about once a day, so games in progress may not appear here.");
      else if (sb.status !== "ok") notes.push("The live scoreboard is " + sb.status + (sb.lastOk ? " (last good answer " + sb.lastOk + ")" : " and has not answered") + "; what follows may be out of date or missing.");
      else if (!live.length) notes.push("No game is in progress according to the scoreboard.");
      const counts = { pre: 0, in: 0, post: 0 };
      for (const g of u.games) counts[g.state] = (counts[g.state] || 0) + 1;
      return ctx.answer([...pick(u, LIVE_SOURCES), ...refsOf(u, live)], {
        liveSource: sb ? { id: sb.id, status: sb.status, scope: sb.scope, ageSec: sb.ageSec } : null, counts, games: live.map((g) => gameView(g, u, L)), notes });
    },
  },
  {
    name: "get_injuries", title: "Injury reports",
    description: "Injury designations by team from the in-scope injury sources, player by player with source, plus a descriptive burden index (not a model input). Where two sources disagree, both are shown.",
    inputSchema: obj({ team: TEAM }),
    openWorld: true,
    async run(a, ctx) {
      const u = await ctx.universe();
      const srcs = pick(u, INJURY_SOURCES);
      const notes = ["burden is a descriptive index (status weight times position weight, summed); it is not a model input (DEC-007)."];
      const partial = srcs.some((s) => s.status !== "ok");
      if (!srcs.length) notes.push("No injury source is in scope.");
      if (a.team) {
        const t = u.injuries[a.team] || null;
        if (!t) notes.push(!okCount(srcs) ? "No injury source answered; the absence of entries says nothing about this team." :
          "No injury listed for " + a.team + " by the in-scope injury sources" + (partial ? ", but some injury sources are unavailable, so this is not a full all-clear." : "."));
        else if (partial) notes.push("Some injury sources are unavailable; the list may be incomplete.");
        return ctx.answer(srcs, { team: a.team, injuries: t ? injuryView(t) : null, notes });
      }
      const teams = {};
      for (const [k, t] of Object.entries(u.injuries)) teams[k] = injuryView(t);
      if (partial) notes.push("Some injury sources are unavailable; teams missing from this list are not confirmed healthy.");
      return ctx.answer(srcs, { teamCount: Object.keys(teams).length, teams, notes });
    },
  },
  {
    name: "get_news", title: "League news",
    description: "Headlines (clustered across publishers) and curated quarterback changes, newest first, with publisher, link, corroboration count and rule-based importance and confidence. Headlines are reported claims; follow the link for the story.",
    inputSchema: obj({ team: TEAM, hours: HOURS, limit: LIMIT }),
    openWorld: true,
    async run(a, ctx) {
      const u = await ctx.universe();
      const r = filterEvents(u, { types: ["news", "qb_change"], team: a.team, hours: a.hours, limit: a.limit });
      const srcs = pick(u, NEWS_SOURCES);
      const extra = pick(u, [...new Set(r.items.map((e) => e.source))]);
      const notes = ["importance and confidence are rules (lib/fabric/score.js), not judgments."];
      if (!okCount(srcs)) notes.push("No headline source answered; an empty or short list does not mean there is no news.");
      else if (srcs.some((s) => s.status !== "ok")) notes.push("Some headline sources are unavailable; coverage is partial.");
      return ctx.answer([...srcs, ...extra], { total: r.total, returned: r.items.length, window: r.window, items: r.items, notes });
    },
  },
  {
    name: "get_events", title: "Intelligence events",
    description: "The unified event feed (news, injury, transaction, odds_move, weather, game, qb_change, model, playoff_move), newest first, filterable by type, team, time window and minimum importance. Each event carries its source, publisher, time it happened (ts) and time first seen (seenAt).",
    inputSchema: obj({ type: EVENT_TYPE, team: TEAM, hours: HOURS, minImportance: { type: "number", minimum: 0, maximum: 100, description: "Only events with importance at or above this (0-100)." }, limit: LIMIT }),
    openWorld: true,
    async run(a, ctx) {
      const u = await ctx.universe();
      const r = filterEvents(u, { types: a.type ? [a.type] : null, team: a.team, hours: a.hours, minImportance: a.minImportance, limit: a.limit });
      return ctx.answer(Object.values(u.sources), { total: r.total, returned: r.items.length, window: r.window, items: r.items,
        notes: ["Events come from every source; a source listed under unavailableSources contributes nothing new while it is down or stale."] });
    },
  },
  {
    name: "get_odds", title: "Betting lines",
    description: "Lines for this week's games: home spread, total, no-vig home win chance and moneylines, each with open and current values and the source and provider, plus the line the engine was built with.",
    inputSchema: obj({ team: TEAM }),
    openWorld: true,
    async run(a, ctx) {
      const u = await ctx.universe(), L = engine.load();
      const games = a.team ? u.games.filter((g) => g.away === a.team || g.home === a.team) : u.games;
      const rows = games.map((g) => {
        const row = { id: g.id, gid: g.gid || null, away: g.away, home: g.home, kickoff: g.kickoff, state: g.state, line: g.odds ? lineView(g.odds, u) : null };
        if (!g.odds) row.lineNote = "No line from the in-scope sources.";
        const e = engineFor(g, L);
        if (e && e.gameId) row.engineLine = { gameId: e.gameId, homeWinProbAtBuild: L.E.GAMES[L.gameIndex.get(e.gameId)][6], asOf: L.E.D.built, source: "engine" };
        return row;
      });
      const oddsRefs = pick(u, [...new Set(games.filter((g) => g.odds).map((g) => g.odds.source))]);
      return ctx.answer([...pick(u, ODDS_SOURCES), ...oddsRefs, engine.sourceStatus()], { count: rows.length, games: rows,
        units: "spreadHome is from the home team's side (negative: home favored); homeWinProbNoVig is the moneyline with the margin removed; move is current minus open. homeWinProbAtBuild is null when no line was posted at build." });
    },
  },
  {
    name: "get_weather", title: "Game weather",
    description: "Kickoff-hour forecasts for this week's outdoor games (temperature, wind, gusts, precipitation) with descriptive flags (wind, rain, snow, cold). Indoor games are marked. Flags describe conditions; they are not model inputs.",
    inputSchema: obj({}),
    openWorld: true,
    async run(a, ctx) {
      const u = await ctx.universe();
      const om = statusOf(u, "open-meteo");
      const rows = u.games.map((g) => {
        const row = { id: g.id, gid: g.gid || null, away: g.away, home: g.home, kickoff: g.kickoff, state: g.state, venue: g.venue, indoor: !!(g.venue && g.venue.indoor),
          weather: g.weather ? weatherView(g.weather, u) : null };
        if (!g.weather) row.note = row.indoor ? "Indoor or closed roof; no weather applies." : !om ? "No weather source is in scope." : om.status !== "ok" && om.status !== "stale" ? "The weather source is " + om.status + "." :
          "No forecast: forecasts are fetched only for outdoor games that have not finished and kick off within 8 days.";
        return row;
      });
      return ctx.answer([...pick(u, WEATHER_SOURCES), ...refsOf(u, u.games)], { count: rows.length, flagged: rows.filter((r) => r.weather && r.weather.flags.length).map((r) => ({ id: r.id, away: r.away, home: r.home, flags: r.weather.flags })),
        games: rows, notes: ["Flags: wind = sustained 15 mph or more or gusts 25 or more; rain = precipitation chance 60% or more; snow; cold = 25°F or below. Descriptions only, not model inputs (DEC-007)."] });
    },
  },
  {
    name: "get_team", title: "Team profile",
    description: "One team: identity, record, engine ratings in points (spread-based, results-based, Elo, scoring margin, EPA, and the blend the engine uses) with league ranks, remaining games with engine game ids and win chances, this week's game, injuries, recent events and transactions.",
    inputSchema: obj({ team: TEAM }, ["team"]),
    openWorld: true,
    async run(a, ctx) {
      const L = engine.load();
      const notes = [];
      let u = null;
      try { u = await ctx.universe(); } catch (err) { notes.push("Live data unavailable: " + err.message); }
      const t = ENT.team(a.team);
      const out = { team: { abbr: t.a, name: t.name, nick: t.nick, conference: t.conf, division: t.div, stadium: { name: t.stadium.name, city: t.stadium.city, roof: t.stadium.roof } } };
      if (L.ok) {
        const { E } = L, D = E.D, i = L.teamIndex.get(a.team);
        out.record = Object.assign(recordView(records(E)[i]), { asOf: D.built });
        const R = (arr, label) => (Array.isArray(arr) ? { points: r1(arr[i] / 25), rank: 1 + arr.filter((x) => x > arr[i]).length, label } : null);
        const blend = D.rate.map((x, k) => (x + (D.rate2 || D.rate)[k]) / 2);
        out.ratings = {
          unit: "points better (+) or worse (-) than an average team on a neutral field; rank 1 is the best of 32",
          homeFieldPoints: r1(E.HFA / 25),
          spread: R(D.rate, "Spread-based rating, fitted to this season's sportsbook point spreads"),
          results: R(D.rate2, "Results rating: opponent-adjusted scoring margin and EPA margin, including the quarterback adjustment"),
          elo: R(D.rateL, "Elo"),
          scoringMargin: R(D.rateP, "Opponent-adjusted scoring margin"),
          efficiencyEPA: R(D.rateE, "Opponent-adjusted efficiency (EPA per play)"),
          blend: R(blend, "Average of the spread and results ratings: what the engine uses for playoff games and for games with no posted line"),
        };
        const qs = D.qbShift && D.qbShift[i];
        if (qs) out.quarterbackAdjustment = { qb: qs.qb, previousStarter: qs.was || null, shiftPoints: qs.shift, starts: qs.starts == null ? null : qs.starts, games: qs.games == null ? null : qs.games,
          note: "Change to the results rating for the current starter; null shift means no estimate." };
        if (Array.isArray(D.luck)) out.fumbleLuckPoints = { points: Math.round(D.luck[i]), note: "Points gained (+) or lost from fumble recoveries this season; the results rating removes it, the record does not." };
        out.remainingGames = [];
        E.GAMES.forEach((g, k) => {
          if (g[2] !== i && g[3] !== i) return;
          const home = g[3] === i, ph = E.baseProb(k);
          out.remainingGames.push({ gameId: g[0], week: g[1], date: g[5], opponent: E.TM[home ? g[2] : g[3]].a, site: home ? "home" : "away", neutral: !!g[4],
            winChance: r3(home ? ph : 1 - ph), basis: g[6] != null ? "sportsbook line at build" : "ratings blend" });
        });
      } else notes.push("Engine unavailable: " + L.error);
      if (u) {
        const inj = u.injuries[a.team] || null;
        out.thisWeek = u.games.filter((g) => g.away === a.team || g.home === a.team).map((g) => gameView(g, u, L));
        out.injuries = inj ? injuryView(inj) : null;
        if (!inj) notes.push(okCount(pick(u, INJURY_SOURCES)) ? "No injury listed by the in-scope injury sources" + (pick(u, INJURY_SOURCES).some((s) => s.status !== "ok") ? " (some are unavailable)." : ".") : "No injury source answered.");
        out.recentEvents = filterEvents(u, { team: a.team, limit: 15 }).items;
        out.transactions = u.transactions.filter((x) => x.team === a.team).slice(0, 10);
      }
      out.notes = notes;
      return ctx.answer([...(u ? Object.values(u.sources) : []), engine.sourceStatus()], out);
    },
  },
  {
    name: "get_standings", title: "Standings",
    description: "Standings computed from the engine's finished games (wins, losses, ties, win percentage, points, division and conference records), grouped by division, plus the seeds if the season ended today under the engine's tiebreakers.",
    inputSchema: obj({ conference: CONFERENCE }),
    openWorld: false,
    async run(a, ctx) {
      const L = engine.load();
      if (!L.ok) throw new ToolError("The engine could not be loaded: " + L.error, { used: [engine.sourceStatus()] });
      const { E } = L, R = records(E);
      const today = E.seedsToday();
      const conferences = [];
      for (const [ci, name] of [[0, "AFC"], [1, "NFC"]]) {
        if (a.conference && a.conference !== name) continue;
        const divs = [];
        E.TM.forEach((t, i) => {
          if (t.c !== ci) return;
          let d = divs.find((x) => x.division === t.dn);
          if (!d) divs.push((d = { division: t.dn, teams: [] }));
          d.teams.push(Object.assign({ team: t.a }, recordView(R[i])));
        });
        for (const d of divs) d.teams.sort((x, y) => (y.pct || 0) - (x.pct || 0) || y.net - x.net);
        conferences.push({ conference: name, divisions: divs, seedsIfSeasonEndedToday: today[ci].map((ti, k) => ({ seed: k + 1, team: E.TM[ti].a })) });
      }
      return ctx.answer([engine.sourceStatus()], { asOf: E.D.built, gamesPlayed: E.D.played.length, conferences,
        notes: ["Teams within a division are listed by win percentage, then net points, for display only; seedsIfSeasonEndedToday applies the engine's NFL tiebreakers (three rare steps are skipped).",
          "Results come from the engine data built " + E.D.built + "; games finished since then are not included (get_games shows the live feed)."] });
    },
  },
  {
    name: "get_playoff_odds", title: "Playoff odds",
    description: "Model estimates from the engine's Monte Carlo simulation of the rest of the season: chance to make the playoffs, win the division, get the top seed, reach and win the Super Bowl, and projected wins. Blend mode (posted sportsbook line where there is one, else the average of two ratings).",
    inputSchema: obj({ team: TEAM, sims: SIMS }),
    openWorld: false,
    async run(a, ctx) {
      const L = engine.load();
      if (!L.ok) throw new ToolError("The engine could not be loaded: " + L.error, { used: [engine.sourceStatus()] });
      const sims = a.sims || 20000;
      const s = engine.simulate(L.E.GAMES.map(() => 0), sims, null);
      let teams = s.teams.map((t) => Object.assign(teamInfo(t.team), { playoffs: t.playoffs, winDivision: t.winDivision, topSeed: t.topSeed,
        reachSuperBowl: t.reachSuperBowl, winSuperBowl: t.winSuperBowl, projectedWins: t.projectedWins }, a.team === t.team ? { seedChances: t.seeds } : {}));
      teams = a.team ? teams.filter((t) => t.team === a.team) : teams.sort((x, y) => y.playoffs - x.playoffs || y.winSuperBowl - x.winSuperBowl);
      return ctx.answer([engine.sourceStatus()], { basis: "model estimate", sims: s.sims, seed: s.seed, monteCarloMargin95: margin95(s.sims), engineBuiltAt: L.E.D.built,
        gamesRemaining: s.open, cached: s.cached, teams,
        notes: ["Chances are shares of simulated seasons (0-1). Differences smaller than monteCarloMargin95 are noise.",
          "Games finished after the engine data was built are simulated as open; get_games flags them and run_simulation can apply them as picks.",
          "seedChances (with a team argument) lists the chance of seeds 1 to 7."] });
    },
  },
  {
    name: "run_simulation", title: "What-if simulation",
    description: "Simulate the rest of the season with chosen winners for some games and compare with no picks: playoff, division and Super Bowl chances for every team, and the change. Picks map engine game ids to winners and apply to this one calculation only; nothing is saved.",
    inputSchema: obj({ picks: PICKS, sims: SIMS, seed: SEED }, ["picks"]),
    openWorld: false,
    async run(a, ctx) {
      const L = engine.load();
      if (!L.ok) throw new ToolError("The engine could not be loaded: " + L.error, { used: [engine.sourceStatus()] });
      const { E } = L;
      const picks = E.GAMES.map(() => 0), applied = [], invalid = [];
      for (const [gid, w] of Object.entries(a.picks)) {
        const k = L.gameIndex.get(gid);
        if (k === undefined) { invalid.push(gid + ": not one of the engine's " + E.GAMES.length + " remaining games (finished games are already counted; get_team lists game ids)"); continue; }
        const g = E.GAMES[k], away = E.TM[g[2]].a, home = E.TM[g[3]].a;
        if (w !== away && w !== home) { invalid.push(gid + ": " + w + " does not play in this game (" + away + " at " + home + ")"); continue; }
        picks[k] = w === home ? 2 : 1;
        const ph = E.baseProb(k);
        applied.push({ gameId: gid, week: g[1], away, home, winner: w, modelChanceOfThisResult: r3(w === home ? ph : 1 - ph) });
      }
      if (invalid.length) throw new ToolError("Some picks are invalid; nothing was simulated.", { details: { invalidPicks: invalid }, used: [engine.sourceStatus()] });
      const sims = a.sims || 20000;
      const withPicks = engine.simulate(picks, sims, a.seed), base = engine.simulate(E.GAMES.map(() => 0), sims, a.seed);
      const teams = withPicks.teams.map((t, i) => {
        const b = base.teams[i];
        return Object.assign(teamInfo(t.team), { playoffs: t.playoffs, playoffsBefore: b.playoffs, playoffsChange: r3(t.playoffs - b.playoffs),
          winDivision: t.winDivision, winDivisionBefore: b.winDivision, winDivisionChange: r3(t.winDivision - b.winDivision),
          winSuperBowl: t.winSuperBowl, winSuperBowlBefore: b.winSuperBowl, winSuperBowlChange: r3(t.winSuperBowl - b.winSuperBowl) });
      }).sort((x, y) => Math.abs(y.playoffsChange) - Math.abs(x.playoffsChange) || y.playoffs - x.playoffs);
      return ctx.answer([engine.sourceStatus()], { basis: "model estimate", picks: applied, sims: withPicks.sims, seed: withPicks.seed, monteCarloMargin95: margin95(withPicks.sims),
        engineBuiltAt: E.D.built, teams,
        notes: ["Nothing is saved: the picks apply to this calculation only.", "Both runs use the same seed and number of seasons; changes smaller than monteCarloMargin95 are noise."] });
    },
  },
  {
    name: "get_what_changed", title: "What changed",
    description: "Compares the current engine forecast with the latest saved daily forecast from an earlier build (data/snapshots/): teams whose playoff chance moved 3 points or more, sportsbook lines that moved 2 points of win chance or more, lines posted since, and results added. Names the snapshot date. For forecasts saved from Nov. 24, 2026 (version 2), each mover's change is split into own results, other teams' results, betting lines, team ratings and a remainder (a first-order model estimate).",
    inputSchema: obj({}),
    openWorld: false,
    async run(a, ctx) {
      const L = engine.load();
      if (!L.ok) throw new ToolError("The engine could not be loaded: " + L.error, { used: [engine.sourceStatus()] });
      const info = readSnapshot(L);
      const used = [engine.sourceStatus(), snapshotsStatus(info)];
      if (!info.snap) throw new ToolError("No saved forecast to compare with: " + info.error, { details: { skipped: info.skipped }, used });
      const { E } = L, snap = info.snap;
      const sims = Number.isInteger(snap.sims) && snap.sims >= 1000 && snap.sims <= 100000 ? snap.sims : 20000;
      const cur = engine.simulate(E.GAMES.map(() => 0), sims, null);
      const movers = [];
      let largestPlayoffChange = null, largestLineChange = null;
      cur.teams.forEach((t) => {
        const j = snap.teams.indexOf(t.team);
        if (j < 0 || snap.playoffs[j] == null) return;
        const m = { team: t.team, before: snap.playoffs[j], now: t.playoffs, change: r3(t.playoffs - snap.playoffs[j]) };
        if (!largestPlayoffChange || Math.abs(m.change) > Math.abs(largestPlayoffChange.change)) largestPlayoffChange = m;
        if (Math.abs(m.change) >= 0.03) movers.push(m);
      });
      movers.sort((x, y) => Math.abs(y.change) - Math.abs(x.change));
      // F04: the split, when the saved forecast carries the per-game figures (version 2) and the engine can compute it
      let explanation = { available: false, reason: "The saved forecast predates the per-game figures needed to split the change (saved from Nov. 24, 2026 on)." };
      if (snap.v >= 2 && E.changeWatch && E.explainChange) {
        const w = E.changeWatch(snap), ex = w ? E.explainChange(snap, E.simulate(E.GAMES.map(() => 0), 0, sims, null, false, w)) : null;
        if (ex) {
          const byTeam = new Map(ex.teams.map((x) => [E.TM[x.team].a, x]));
          for (const m of movers) {
            const x = byTeam.get(m.team); if (!x) continue;
            m.why = { ownResults: r3(x.own), otherResults: r3(x.others), lines: r3(x.lines), ratings: r3(x.ratings), rest: r3(x.rest),
              results: x.results.slice(0, 4).map((g) => ({ gameId: g.id, away: E.TM[g.away].a, home: E.TM[g.home].a, awayScore: g.awayScore, homeScore: g.homeScore, homeChanceThen: g.was, effect: r3(g.effect) })),
              lineAndRatingMoves: x.moves.slice(0, 4).map((v) => ({ gameId: v.id, kind: v.kind, homeChanceThen: r3(v.was), homeChanceNow: r3(v.now), effect: r3(v.effect) })) };
          }
          explanation = { available: true, resultsMatched: ex.results, resultsSince: ex.resultsSince,
            method: "First order: each result's surprise (result minus the chance it had in the saved forecast) times what the game was worth to the team then, and each change in a remaining game's chance times what it is worth now. rest is what that leaves: effects between games, results without saved figures, and simulation noise." };
        } else explanation = { available: false, reason: "The saved forecast's teams or figures do not match this engine's data." };
      }
      const lineMoves = [], newLines = [], lines = snap.lines || {};
      E.GAMES.forEach((g) => {
        if (g[6] == null) return;
        const before = hasOwn(lines, g[0]) ? lines[g[0]] : null, away = E.TM[g[2]].a, home = E.TM[g[3]].a;
        if (before == null) { newLines.push({ gameId: g[0], away, home, homeWinProbNow: g[6] }); return; }
        const m = { gameId: g[0], away, home, homeWinProbBefore: before, homeWinProbNow: g[6], change: r3(g[6] - before) };
        if (!largestLineChange || Math.abs(m.change) > Math.abs(largestLineChange.change)) largestLineChange = m;
        if (Math.abs(m.change) >= 0.02) lineMoves.push(m);
      });
      lineMoves.sort((x, y) => Math.abs(y.change) - Math.abs(x.change));
      const notes = [];
      if (info.sameBuild) notes.push("Every readable snapshot was made from the current build, so no change is expected.");
      notes.push("Both forecasts use the engine's fixed seed and " + sims + " simulated seasons; playoff changes come from new results, lines and ratings. Line values are sportsbook home win chances (no-vig) from the build data.");
      return ctx.answer(used, { comparedWith: { file: info.file, date: snap.date || null, built: snap.built || null, sims: snap.sims || null }, skippedSnapshots: info.skipped,
        current: { built: E.D.built, sims: cur.sims, seed: cur.seed }, resultsAdded: Number.isInteger(snap.played) ? E.D.played.length - snap.played : null,
        thresholds: { playoffs: 0.03, line: 0.02 }, playoffMovers: movers, explanation, lineMoves, newLines, largestPlayoffChange, largestLineChange, notes });
    },
  },
  {
    name: "get_source_health", title: "Source health",
    description: "Every data source the server can use: status (ok, stale, down, disabled, pending), scope (public or local), tier, age of the last good answer, circuit-breaker state, last error, plus the engine build and the saved forecasts.",
    inputSchema: obj({}),
    openWorld: true,
    async run(a, ctx) {
      let list = [], error = null;
      try { list = Object.values((await ctx.universe()).sources); } catch (err) { error = err.message; list = err.health ? Object.values(err.health) : []; }
      const all = [...list, engine.sourceStatus(), snapshotsStatus(readSnapshot(engine.load()))];
      const summary = {};
      for (const s of all) summary[s.status] = (summary[s.status] || 0) + 1;
      const notes = [];
      if (error) notes.push("The fabric did not finish loading: " + error);
      if (!ctx.scopes.includes("local")) notes.push("Local-only sources (ESPN JSON: live scoreboard, injuries, transactions, news) are excluded because NFLU_SCOPES=public.");
      return ctx.answer(all, { summary, sources: all.map((s) => ({ id: s.id, label: s.label, tier: s.tier, scope: s.scope, status: s.status, breaker: s.breaker || null,
        ageSec: s.ageSec == null ? null : s.ageSec, maxStaleSec: s.maxStaleSec == null ? null : s.maxStaleSec, lastOk: s.lastOk || null, lastError: s.lastError || null,
        fails: s.fails == null ? null : s.fails, latencyMs: s.latencyMs == null ? null : s.latencyMs, records: s.records == null ? null : s.records, builtAt: s.builtAt })), notes });
    },
  },
  {
    name: "search", title: "Search",
    description: "Case-insensitive search across team names and aliases, event titles (headlines, injuries, transactions, game events), injured players' names and engine game ids. Results grouped by kind.",
    inputSchema: obj({ query: { type: "string", minLength: 1, maxLength: 200, description: "Text to look for (1-200 characters)." } }, ["query"]),
    openWorld: true,
    async run(a, ctx) {
      const q = a.query.trim().toLowerCase();
      if (!q) throw new ToolError("query is blank");
      const L = engine.load();
      const notes = [];
      const teams = [];
      for (const t of ENT.TEAMS) {
        const fields = [t.a, t.name, t.nick, t.stadium.city, ...t.aliases];
        const hit = fields.find((f) => String(f).toLowerCase().includes(q));
        if (hit) teams.push({ team: t.a, name: t.name, conference: t.conf, division: t.div, matched: hit });
      }
      let u = null;
      try { u = await ctx.universe(); } catch (err) { notes.push("Events and injuries not searched: " + err.message); }
      let events = [], injuries = [], eventTotal = 0;
      if (u) {
        const ev = u.events.filter((e) => e.title.toLowerCase().includes(q)).sort((x, y) => Date.parse(y.ts) - Date.parse(x.ts));
        eventTotal = ev.length;
        events = ev.slice(0, 20).map((e) => ({ id: e.id, type: e.type, basis: BASIS[e.type] || "source report", ts: e.ts, title: e.title, teams: e.teams, url: e.url || null, source: e.source, sourceScope: scopeOf(u, e.source) }));
        for (const [team, t] of Object.entries(u.injuries)) for (const p of t.players) {
          if (String(p.name).toLowerCase().includes(q)) injuries.push({ team, name: p.name, pos: p.pos || null, status: p.status, source: p.source || null });
        }
      }
      const games = [];
      if (L.ok) {
        const teamHits = teams.length <= 2 ? new Set(teams.map((t) => L.teamIndex.get(t.team))) : new Set();
        L.E.GAMES.forEach((g) => {
          if (games.length >= 20) return;
          if (g[0].toLowerCase().includes(q) || teamHits.has(g[2]) || teamHits.has(g[3])) games.push({ gameId: g[0], week: g[1], date: g[5], away: L.E.TM[g[2]].a, home: L.E.TM[g[3]].a });
        });
      }
      return ctx.answer([...(u ? Object.values(u.sources) : []), engine.sourceStatus()], { query: a.query,
        counts: { teams: teams.length, events: eventTotal, injuries: injuries.length, games: games.length },
        teams, events, injuries: injuries.slice(0, 50), games, notes });
    },
  },
];

// Applies conveniences (case, provider abbreviations, whitespace) to declared arguments before validation. Built with
// Object.fromEntries so a key such as "__proto__" stays plain data.
function normalize(schema, raw) {
  if (!isObj(raw)) return raw;
  const props = schema.properties || {};
  const team = (v) => (typeof v === "string" ? ENT.teamAbbr(v.trim()) || v : v);
  return Object.fromEntries(Object.entries(raw).map(([k, v]) => {
    const s = hasOwn(props, k) ? props[k] : null;
    if (s === TEAM) return [k, team(v)];
    if ((s === CONFERENCE) && typeof v === "string") return [k, v.trim().toUpperCase()];
    if (s === EVENT_TYPE && typeof v === "string") return [k, v.trim().toLowerCase()];
    if (s === PICKS && isObj(v)) return [k, Object.fromEntries(Object.entries(v).map(([g, w]) => [g.trim().toUpperCase(), team(w)]))];
    return [k, v];
  }));
}

function createTools({ env = process.env, log = () => {}, fetchImpl } = {}) {
  const provider = createProvider({ env, log, fetchImpl });
  const byName = new Map(TOOLS.map((t) => [t.name, t]));

  function list() {
    return TOOLS.map((t) => ({ name: t.name, title: t.title, description: t.description, inputSchema: t.inputSchema,
      annotations: { title: t.title, readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: !!t.openWorld } }));
  }

  function result(body, isError) {
    const out = { content: [{ type: "text", text: JSON.stringify(body) }], structuredContent: body };
    if (isError) out.isError = true;
    return out;
  }

  async function call(name, rawArgs) {
    const tool = byName.get(name);
    if (!tool) return null;
    const ctx = { scopes: provider.scopes, mode: provider.mode, u: null };
    ctx.universe = async () => { if (!ctx.u) ctx.u = await provider.universe(); return ctx.u; };
    ctx.answer = (used, body) => {
      const seen = new Set(), srcs = [];
      for (const s of used) if (s && !seen.has(s.id)) { seen.add(s.id); srcs.push(s); }
      const head = { generatedAt: new Date().toISOString(), mode: ctx.mode, scopes: ctx.scopes };
      if (ctx.u) { head.dataAsOf = ctx.u.generatedAt; if (ctx.mode === "fixture") head.fixture = ctx.u._fixture || "Synthetic test fixture; values are invented."; }
      head.sources = srcs.map((s) => ({ id: s.id, label: s.label, status: s.status, scope: s.scope, ageSec: s.ageSec == null ? null : s.ageSec, lastOk: s.lastOk || null }));
      head.unavailableSources = srcs.filter((s) => s.status !== "ok").map((s) => ({ id: s.id, status: s.status, scope: s.scope, lastOk: s.lastOk || null, lastError: s.lastError || null }));
      return Object.assign(head, body);
    };
    const args = normalize(tool.inputSchema, rawArgs == null ? {} : rawArgs);
    const errs = validate(tool.inputSchema, args);
    if (errs.length) return result(ctx.answer([], { error: "Invalid arguments for " + name + ": " + errs.join("; "), errors: errs }), true);
    try {
      return result(await tool.run(args, ctx), false);
    } catch (err) {
      if (err instanceof ToolError) return result(ctx.answer(err.used, Object.assign({ error: err.message }, err.details)), true);
      if (err && err.health) return result(ctx.answer(Object.values(err.health), { error: err.message }), true);
      log("tool " + name + " failed: " + ((err && err.stack) || err));
      return result(ctx.answer([], { error: "Internal error in " + name + ": " + ((err && err.message) || String(err)) }), true);
    }
  }

  return { list, call, has: (n) => byName.has(n), scopes: provider.scopes, mode: provider.mode };
}

module.exports = { createTools, TOOLS };
