// Data model: joins the engine's data (D, GAMES, TM), the team entities (UT) and the feed payload
// (/api/universe when a server answers, otherwise the snapshot embedded at build as D.fabric).
// Nothing here invents a value: a missing field stays missing and the interface says so.
var EV_TYPES = ["news", "injury", "transaction", "odds_move", "weather", "game", "qb_change", "model", "playoff_move"];
var STATE_RANK = { pre: 0, "in": 1, post: 2 };
var BREAKING_MIN = 70;           // importance at or above this counts as breaking (the fabric's own 0-100 rule score)

// Lookups keyed by data from outside (team abbreviations, game and event ids) use prototype-free objects, so a value like
// "constructor" can never resolve to something built in.
function dict() { return Object.create(null); }
function hasOwn(o, k) { return !!o && Object.prototype.hasOwnProperty.call(o, k); }
var TIDX = dict();
TM.forEach(function (t, i) { TIDX[t.a] = i; });

// Team entity i: the engine's team row plus shared/teams.json when the two agree on the abbreviation.
var TEAMS = TM.map(function (t, i) {
  var u = UT && UT.teams && UT.teams[i] && UT.teams[i].a === t.a ? UT.teams[i] : null;
  return { i: i, a: t.a, nick: t.n, name: u ? u.name : t.n, conf: t.c ? "NFC" : "AFC", c: t.c, d: t.d, div: t.dn,
    color: u ? u.color : null, stadium: u && u.stadium ? u.stadium : null, aliases: u ? u.aliases || [] : [] };
});
function teamName(i) { return TEAMS[i] ? TEAMS[i].name : "?"; }
function teamAbbr(i) { return TEAMS[i] ? TEAMS[i].a : "?"; }

function safeUrl(u) { return typeof u === "string" && /^https:\/\//.test(u) ? u : null; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function num(v) { return typeof v === "number" && isFinite(v) ? v : null; }

// ---- games: the feed's games for the current week, matched to the engine's GAMES rows ----
// An ordered away-at-home pair happens at most once in a regular season, so it identifies the row even when weeks or
// ids disagree; the nflverse id (gid) is tried first.
function matchGameIndex(f) {
  var a = TIDX[f.away], h = TIDX[f.home], gi = -1, k;
  if (a == null || h == null) return -1;
  if (f.gid) for (k = 0; k < GAMES.length; k++) if (GAMES[k][0] === f.gid) return k;
  for (k = 0; k < GAMES.length; k++) if (GAMES[k][2] === a && GAMES[k][3] === h) { gi = k; break; }
  return gi;
}
function mergeGame(gi, f) {
  var G = gi >= 0 ? GAMES[gi] : null;
  return {
    key: f ? f.id : G[0], id: f ? f.id : null, gid: G ? G[0] : (f && f.gid) || null, gi: gi,
    week: G ? G[1] : f.week, away: G ? G[2] : TIDX[f.away], home: G ? G[3] : TIDX[f.home],
    state: f && STATE_RANK[f.state] != null ? f.state : "pre", kickoff: f ? f.kickoff : null, dateLabel: G ? G[5] : null,
    awayScore: f ? num(f.awayScore) : null, homeScore: f ? num(f.homeScore) : null, period: f ? num(f.period) : null, clock: f ? f.clock : null,
    situation: f ? f.situation || null : null, venue: f ? f.venue || null : null, broadcast: f ? f.broadcast || null : null,
    odds: f ? f.odds || null : null, weather: f ? f.weather || null : null, winProb: f ? f.winProb || null : null, source: f ? f.source || null : null,
    neutral: G ? !!G[4] : !!(f && f.venue && f.venue.neutral), line: G ? G[6] : null, total: G ? G[7] : null, fromFeed: !!f
  };
}
// Returns {week, games}: every feed game (most advanced state wins when a matchup repeats) plus the engine's other games
// from the same week, so the strip shows the full slate whether or not a feed answered.
function buildGames(payload) {
  var byPair = dict(), order = [];
  ((payload && payload.games) || []).forEach(function (f) {
    if (!f || TIDX[f.away] == null || TIDX[f.home] == null) return;
    var k = f.away + "@" + f.home, cur = byPair[k];
    if (!cur) { byPair[k] = f; order.push(k); }
    else if ((STATE_RANK[f.state] || 0) > (STATE_RANK[cur.state] || 0)) byPair[k] = f;
  });
  var out = [], used = {}, weeks = {};
  order.forEach(function (k) {
    var f = byPair[k], gi = matchGameIndex(f);
    if (gi >= 0) { used[gi] = 1; weeks[GAMES[gi][1]] = (weeks[GAMES[gi][1]] || 0) + 1; }
    out.push(mergeGame(gi, f));
  });
  var week = null, best = 0;
  for (var w in weeks) if (weeks[w] > best) { best = weeks[w]; week = +w; }
  if (week == null) {
    var minW = Infinity; GAMES.forEach(function (g) { if (g[1] < minW) minW = g[1]; });
    week = payload && typeof payload.week === "number" && GAMES.some(function (g) { return g[1] === payload.week; }) ? payload.week : isFinite(minW) ? minW : null;
  }
  GAMES.forEach(function (g, gi) { if (g[1] === week && !used[gi]) out.push(mergeGame(gi, null)); });
  out.sort(function (x, y) {
    var r = { "in": 0, pre: 1, post: 2 };
    if (r[x.state] !== r[y.state]) return r[x.state] - r[y.state];
    var tx = Date.parse(x.kickoff || "") || 0, ty = Date.parse(y.kickoff || "") || 0;
    if (x.state === "post") return ty - tx;
    return (tx || Infinity) - (ty || Infinity) || (x.gi - y.gi);
  });
  return { week: week, games: out };
}

// ---- events: the feed's events plus the page's own curated news (D.news), de-duplicated by link ----
function normEvent(e) {
  var t = Date.parse(e.ts);
  return {
    id: String(e.id), type: EV_TYPES.indexOf(e.type) >= 0 ? e.type : "news", subtype: e.subtype || null, ts: t, tsMs: t,
    seen: Date.parse(e.seenAt), teams: (Array.isArray(e.teams) ? e.teams : []).map(function (a) { return typeof a === "string" ? TIDX[a] : undefined; }).filter(function (i) { return i != null; }),
    players: (Array.isArray(e.players) ? e.players : []).filter(function (p) { return p && typeof p === "object"; }).map(function (p) { return { name: String(p.name || ""), pos: p.pos ? String(p.pos) : "" }; }),
    title: String(e.title || ""), url: safeUrl(e.url), publisher: String(e.publisher || e.source || ""),
    source: typeof e.source === "string" ? e.source : null, importance: num(e.importance) != null ? clamp(e.importance, 0, 100) : null,
    confidence: num(e.confidence) != null ? clamp(e.confidence, 0, 1) : null, sourceCount: Math.max(1, num(e.sourceCount) || 1),
    sources: (Array.isArray(e.sources) ? e.sources : []).filter(function (s) { return s && typeof s === "object"; }).map(function (s) { return { publisher: String(s.publisher || ""), url: safeUrl(s.url) }; }),
    gameId: typeof e.gameId === "string" ? e.gameId : null, data: e.data && typeof e.data === "object" ? e.data : {}, dateOnly: false, origin: "feed"
  };
}
// D.news: dated (no time), so it is placed at the start of that day in UTC and shown with the date only. It carries no
// importance score; it is listed by date and never given an importance bar.
function pageNewsEvents(skipUrls) {
  return (D.news || []).map(function (n, k) {
    if (!n || !n.url || hasOwn(skipUrls, n.url) || !/^\d{4}-\d{2}-\d{2}$/.test(n.date || "")) return null;
    var t = Date.parse(n.date + "T00:00:00Z");
    return { id: "page-news-" + k, type: n.kind === "qb_change" ? "qb_change" : n.kind === "injury" ? "injury" : "news", subtype: n.kind || null, ts: t, tsMs: t, seen: t,
      teams: typeof n.team === "number" && TEAMS[n.team] ? [n.team] : [], players: [], title: String(n.headline || n.summary || ""), url: safeUrl(n.url),
      publisher: n.source || "", source: "page-news", importance: null, confidence: null, sourceCount: 1, sources: [{ publisher: n.source, url: n.url }],
      gameId: null, data: { from: n.from, to: n.to }, dateOnly: true, origin: "page" };
  }).filter(Boolean);
}
function buildEvents(payload) {
  var evs = [], urls = dict(), seen = dict();
  ((payload && Array.isArray(payload.events) && payload.events) || []).forEach(function (e) {
    if (!e || typeof e !== "object" || typeof e.title !== "string" || !e.title || seen[e.id]) return;
    var n = normEvent(e); if (!isFinite(n.ts)) return;
    seen[e.id] = 1; if (n.url) urls[n.url] = 1; evs.push(n);
  });
  evs = evs.concat(pageNewsEvents(urls));
  evs.sort(function (a, b) { return b.ts - a.ts || (b.importance || 0) - (a.importance || 0); });
  return evs;
}

// ---- the whole model for one payload ----
function buildModel(payload) {
  var g = buildGames(payload), inj = dict(), srcs = dict();
  if (payload && payload.sources) Object.keys(payload.sources).forEach(function (k) { var s = payload.sources[k]; if (s && typeof s === "object") srcs[k] = s; });
  if (payload && payload.injuries) Object.keys(payload.injuries).forEach(function (a) { var t = payload.injuries[a]; if (TIDX[a] != null && t && typeof t === "object") inj[TIDX[a]] = t; });
  var gameByKey = dict();
  g.games.forEach(function (x) { gameByKey[x.key] = x; if (x.gid) gameByKey[x.gid] = x; if (x.id) gameByKey[x.id] = x; });
  return { week: g.week, games: g.games, gameByKey: gameByKey, events: buildEvents(payload), injuries: inj, sources: srcs,
    generatedAt: payload ? Date.parse(payload.generatedAt) : null, fixture: !!(payload && payload._fixture), season: payload ? payload.season : null };
}
// Loose shape check for a payload from the network: the full contract lives in lib/contract.js (server side).
function looksLikeUniverse(u) {
  return !!u && typeof u === "object" && u.v === 1 && typeof u.generatedAt === "string" && isFinite(Date.parse(u.generatedAt)) &&
    Array.isArray(u.games) && Array.isArray(u.events) && u.sources && typeof u.sources === "object";
}

// ---- freshness: one badge rule for every panel ----
// ids: source ids (a trailing * matches a prefix); meta: {payload, origin "live"|"snapshot"|"none", fetchedAt, fails}.
function matchSources(sources, ids) {
  var out = [];
  if (!sources) return out;
  Object.keys(sources).forEach(function (sid) {
    var hit = (ids || []).some(function (p) { return p.slice(-1) === "*" ? sid.indexOf(p.slice(0, -1)) === 0 : sid === p; });
    if (hit) out.push(sources[sid]);
  });
  return out;
}
function freshness(ids, meta, now) {
  var P = meta && meta.payload;
  if (!ids || !ids.length) return { state: "model", label: "MODEL · built " + (D.built || "?"), title: "Computed on this page from the model data built " + (D.built || "") + "." };
  if (!P) return { state: "unavailable", label: "UNAVAILABLE", title: "No feed data: no server answered and no snapshot was embedded in this build." };
  if (P._fixture) return { state: "fixture", label: "FIXTURE · not live", title: "Synthetic test data, not real and not live: " + P._fixture };
  var ss = matchSources(P.sources, ids);
  if (!ss.length) return { state: "unavailable", label: "UNAVAILABLE", title: "None of this panel's sources are in the current data." };
  var usable = ss.filter(function (s) { return s.status === "ok" || s.status === "stale"; });
  if (!usable.length) return { state: "unavailable", label: "UNAVAILABLE", title: ss.map(function (s) { return s.label + ": " + (s.lastError || s.status); }).join("; ") };
  var gen = Date.parse(P.generatedAt), base = meta.origin === "live" && meta.fetchedAt ? Math.max(0, (now - meta.fetchedAt) / 1000) : Math.max(0, (now - gen) / 1000);
  var ageOf = function (s) { if (num(s.ageSec) != null) return s.ageSec + base; var t = Date.parse(s.lastOk || ""); return isFinite(t) && isFinite(gen) ? Math.max(0, (gen - t) / 1000) + base : null; };
  var ages = usable.map(ageOf).filter(function (a) { return a != null; }), youngest = ages.length ? Math.min.apply(null, ages) : null;
  var bad = ss.length - ss.filter(function (s) { return s.status === "ok"; }).length;
  var tip = ss.map(function (s) { var a = ageOf(s); return s.label + ": " + s.status + (a != null ? ", " + fmtAge(a) + " old" : ""); }).join("; ");
  if (meta.origin === "snapshot") return { state: "snapshot", label: "SNAPSHOT · " + (youngest == null ? "age unknown" : fmtAge(youngest) + " old"), title: "Saved snapshot, not live. " + tip };
  var allStale = !ss.some(function (s) { return s.status === "ok"; });
  if (meta.fails > 0 || allStale) return { state: "stale", label: "STALE · " + (youngest == null ? "age unknown" : fmtAge(youngest)), title: (meta.fails > 0 ? "The feed stopped answering; showing the last data received. " : "Every source here is stale. ") + tip };
  return { state: "live", label: "LIVE · " + fmtAge(youngest) + (bad ? " · " + bad + " degraded" : ""), title: tip, degraded: bad };
}

// The top bar's status: every source in the payload, read the same way as a panel badge.
function pillState(meta, now) { return freshness(["*"], meta, now); }

// ---- live games: a game is in progress on this page only when its data is live, answering, ok and recent ----
var LIVE_GAME_MAX_AGE_SEC = 180;
function gameSource(x, M) { return x && M && x.source && hasOwn(M.sources, x.source) ? M.sources[x.source] : null; }
// Age in seconds of the data behind game x (its source's age plus the time since this payload), or null if unknown.
function gameDataAge(x, M, meta, now) {
  var s = gameSource(x, M); if (!s) return null;
  var base = meta && meta.origin === "live" && meta.fetchedAt ? Math.max(0, (now - meta.fetchedAt) / 1000) : M.generatedAt != null ? Math.max(0, (now - M.generatedAt) / 1000) : 0;
  if (num(s.ageSec) != null) return s.ageSec + base;
  var t = Date.parse(s.lastOk || ""); return isFinite(t) && M.generatedAt != null ? Math.max(0, (M.generatedAt - t) / 1000) + base : null;
}
function gameIsLive(x, M, meta, now) {
  if (!x || x.state !== "in" || !M || !meta || meta.origin !== "live" || meta.fails > 0) return false;
  var s = gameSource(x, M); if (!s || s.status !== "ok") return false;
  var age = gameDataAge(x, M, meta, now);
  return age != null && age <= LIVE_GAME_MAX_AGE_SEC;
}

Object.assign(NFLU, { buildGames: buildGames, buildEvents: buildEvents, buildModel: buildModel, freshness: freshness, matchSources: matchSources,
  looksLikeUniverse: looksLikeUniverse, TEAMS: TEAMS, BREAKING_MIN: BREAKING_MIN, pillState: pillState, gameIsLive: gameIsLive, gameDataAge: gameDataAge, TIDX: TIDX });
