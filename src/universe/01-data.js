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
    color: u ? u.color : null, alt: u ? u.alt || null : null, stadium: u && u.stadium ? u.stadium : null, aliases: u ? u.aliases || [] : [] };
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
    // clockKnown false: a score source with no quarter or clock (The Odds API, DEC-027); checkedAt: when that source last
    // listed this game, so a game it stopped listing ages on its own; scoreAt: the provider's own update time
    clockKnown: !(f && f.clockKnown === false), checkedAt: f && isFinite(Date.parse(f.checkedAt || "")) ? f.checkedAt : null, scoreAt: f && isFinite(Date.parse(f.scoreAt || "")) ? f.scoreAt : null,
    situation: f ? f.situation || null : null, venue: f ? f.venue || null : null, broadcast: f ? f.broadcast || null : null,
    odds: f ? f.odds || null : null, weather: f ? f.weather || null : null, alerts: f ? cleanAlerts(f.alerts) : [], market: f ? cleanMarket(f.market) : null, books: f ? cleanBooks(f.books) : [], winProb: f ? f.winProb || null : null, source: f ? f.source || null : null,
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
    gameId: typeof e.gameId === "string" ? e.gameId : null, data: e.data && typeof e.data === "object" ? e.data : {}, dateOnly: false, origin: "feed",
    // already there when the server started watching its source: the real time is unknown and earlier than this
    before: e.data && typeof e.data === "object" && isFinite(Date.parse(e.data.beforeWatch)) ? Date.parse(e.data.beforeWatch) : null
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
  evs.sort(eventOrder);
  return evs;
}
// newest first; items with an unknown time (already there when watching began) after every item with a real time
function eventOrder(a, b) { return (a.before != null ? 1 : 0) - (b.before != null ? 1 : 0) || b.ts - a.ts || (b.importance || 0) - (a.importance || 0); }

// ---- model events (F22): worked out by this page from the build's data, never taken from a feed ----
// Two kinds, both dated by the build's day and labelled as model estimates: a team's playoff chance moving since the
// saved forecast by 3 points or more and by more than the two simulations' noise (playoff_move), and a game where the
// ratings and the posted line disagree by DISAGREE_MIN or more (model). Their importance stays under BREAKING_MIN: a
// model estimate is never breaking news.
var MOVE_MIN = 0.03, MODEL_IMP_MAX = 65;
var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// "2026-11-24" -> "Nov 24"; anything else unchanged
function savedDate(d) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || ""); return m ? MONTHS[+m[2] - 1] + " " + (+m[3]) : d; }
// "Nov. 23, 2026" (the build's date) -> that day at 00:00 UTC in ms, like the dated items in the curated news file
function builtDay(s) {
  var m = /^([A-Z][a-z]{2})[a-z]*\.? (\d{1,2}), (\d{4})$/.exec(String(s || "").trim()), k = m ? MONTHS.indexOf(m[1]) : -1;
  return k < 0 ? null : Date.UTC(+m[3], k, +m[2]);
}
// Pure: each team's playoff chance in the saved forecast P and now. why: explainChange()'s result (with the split) or,
// for a forecast too old to split, {now: [chance by team], n}. [{team, was, now, total, parts or null}]
function playoffMoves(P, why) {
  if (!P || !why || !Array.isArray(P.teams) || !Array.isArray(P.playoffs)) return [];
  if (Array.isArray(why.teams)) return why.teams.map(function (x) { return { team: x.team, was: x.was, now: x.now, total: x.total, parts: { own: x.own, others: x.others, lines: x.lines, ratings: x.ratings, rest: x.rest } }; });
  if (!Array.isArray(why.now)) return [];
  return TEAMS.map(function (t, i) {
    var j = P.teams.indexOf(t.a), was = j >= 0 ? num(P.playoffs[j]) : null, now = num(why.now[i]);
    return was == null || now == null ? null : { team: i, was: was, now: now, total: now - was, parts: null };
  }).filter(Boolean);
}
// The 95% margin of the difference between two independent simulations' shares (n1 and n2 seasons).
function moveMargin(was, now, n1, n2) { return 1.96 * Math.sqrt(was * (1 - was) / n1 + now * (1 - now) / n2); }
var PART_NAMES = { own: "own results", others: "other teams' results", lines: "betting lines", ratings: "team ratings" };
function modelEvent(x) {
  return Object.assign({ subtype: null, players: [], url: null, confidence: null, sourceCount: 1, sources: [], gameId: null, data: {}, dateOnly: true, origin: "model", before: null, source: "page-model" }, x,
    { tsMs: x.ts, seen: x.ts });
}
function playoffMoveEvents(P, why, day) {
  var n1 = P && P.sims >= 1000 ? P.sims : 20000, n2 = why && why.n >= 1000 ? why.n : 20000, out = [];
  playoffMoves(P, why).forEach(function (m) {
    var d = m.total;
    if (!isFinite(d) || Math.abs(d) < Math.max(MOVE_MIN, moveMargin(m.was, m.now, n1, n2))) return;
    var T = TEAMS[m.team], parts = m.parts ? Object.keys(PART_NAMES).map(function (k) { return [k, m.parts[k]]; })
      .filter(function (p) { return Math.abs(p[1]) >= 0.01; }).sort(function (a, b) { return Math.abs(b[1]) - Math.abs(a[1]); }).slice(0, 2) : [];
    out.push(modelEvent({ id: "pm-" + (P.date || "prev") + "-" + T.a, type: "playoff_move", subtype: d > 0 ? "up" : "down", ts: day, teams: [m.team],
      title: T.nick + " playoff chance " + fmtPct(m.was) + " \u2192 " + fmtPct(m.now) + " (" + fmtSigned(d * 100, 0) + " points) since the forecast saved on " + savedDate(P.date) +
        (parts.length ? ": " + parts.map(function (p) { return PART_NAMES[p[0]] + " " + fmtSigned(p[1] * 100, 0); }).join(", ") : ""),
      publisher: "This page's simulation", importance: Math.min(MODEL_IMP_MAX, Math.round(30 + 2.5 * Math.abs(d) * 100)), data: { was: m.was, now: m.now, parts: m.parts } }));
  });
  return out;
}
// Games not yet started (by the feed, when it knows them) where the two ratings and the posted line disagree.
function marketGapEvents(day, M) {
  var out = [];
  disagreementGames().forEach(function (dg) {
    var g = GAMES[dg.gi], x = M && M.gameByKey ? M.gameByKey[g[0]] : null; if (x && x.state && x.state !== "pre") return;
    var rb = dg.ratings, H = TEAMS[g[3]], pts = Math.round(Math.abs(dg.diff) * 100);
    out.push(modelEvent({ id: "mm-" + g[0] + "-" + pts, type: "model", subtype: "market-gap", ts: day, teams: [g[2], g[3]], gameId: g[0],
      title: "Model and market disagree on " + TEAMS[g[2]].a + " at " + H.a + ": the ratings give the " + H.nick + " " + fmtPct(rb) + ", the posted line " + fmtPct(g[6]) + " (" + pts + " points)",
      publisher: "This page's ratings", importance: Math.min(MODEL_IMP_MAX, 30 + 2 * pts), data: { model: rb, market: g[6] } }));
  });
  return out;
}
// The model with this page's model events in its event list (replacing any from before). why: the comparison run.
function withModelEvents(M, why) {
  if (!M || !Array.isArray(M.events)) return M;
  var day = builtDay(D.built); if (day == null) return M;
  var evs = M.events.filter(function (e) { return e.origin !== "model"; }).concat(marketGapEvents(day, M), D.prev && why && why.unavailable !== "error" && why.unavailable !== "none" ? playoffMoveEvents(D.prev, why, day) : []);
  evs.sort(eventOrder);
  return Object.assign({}, M, { events: evs });
}
NFLU.builtDay = builtDay; NFLU.playoffMoves = playoffMoves; NFLU.playoffMoveEvents = playoffMoveEvents; NFLU.marketGapEvents = marketGapEvents; NFLU.withModelEvents = withModelEvents; NFLU.savedDate = savedDate;

// ---- the whole model for one payload ----
// Pure: the payload's fantasy block (Sleeper's most added and dropped players), checked again here. Each list keeps
// Sleeper's order; `rank` is the 1-based place in it. present is false when the payload has no block.
function normFantasy(payload) {
  var f = payload && payload.fantasy && typeof payload.fantasy === "object" ? payload.fantasy : null;
  var out = { present: !!f, week: null, lookbackHours: null, adds: [], drops: [], unmatched: { adds: 0, drops: 0 }, source: null };
  if (!f) return out;
  out.week = Number.isInteger(f.week) ? f.week : null;
  out.lookbackHours = num(f.lookbackHours);
  out.source = typeof f.source === "string" ? f.source : null;
  ["adds", "drops"].forEach(function (k) {
    (Array.isArray(f[k]) ? f[k] : []).forEach(function (x) {
      if (!x || typeof x !== "object" || typeof x.name !== "string" || !x.name || TIDX[x.team] == null || num(x.count) == null) return;
      out[k].push({ name: x.name, team: TIDX[x.team], pos: typeof x.pos === "string" ? x.pos : "", count: num(x.count), rank: out[k].length + 1 });
    });
    if (f.unmatched && num(f.unmatched[k]) != null) out.unmatched[k] = num(f.unmatched[k]);
  });
  return out;
}
// Pure: a game's NWS alerts, checked again: event, severity, times and an https link only.
var ALERT_SEVERITY = ["Extreme", "Severe", "Moderate", "Minor", "Unknown"];
function cleanAlerts(list) {
  return (Array.isArray(list) ? list : []).filter(function (a) { return a && typeof a === "object" && typeof a.event === "string" && a.event; }).map(function (a) {
    return { event: a.event.slice(0, 80), severity: ALERT_SEVERITY.indexOf(a.severity) >= 0 ? a.severity : "Unknown", headline: typeof a.headline === "string" ? a.headline.slice(0, 300) : "",
      onset: isFinite(Date.parse(a.onset)) ? Date.parse(a.onset) : null, ends: isFinite(Date.parse(a.ends)) ? Date.parse(a.ends) : null, url: safeUrl(a.url) };
  });
}
NFLU.cleanAlerts = cleanAlerts;
// Pure: a game's consensus line across sportsbooks (The Odds API), checked again; null when unusable.
function cleanMarket(m) {
  if (!m || typeof m !== "object" || !(m.books >= 1) || !isFinite(Date.parse(m.at))) return null;
  var hp = num(m.homeProb);
  var out = { source: String(m.source || ""), provider: String(m.provider || ""), books: Math.floor(m.books), spread: num(m.spread), total: num(m.total),
    homeProb: hp != null && hp >= 0 && hp <= 1 ? hp : null, at: Date.parse(m.at) };
  return out.spread == null && out.total == null && out.homeProb == null ? null : out;
}
// Pure: each sportsbook's lines (local server only), checked again.
function cleanBooks(list) {
  return (Array.isArray(list) ? list : []).filter(function (b) { return b && typeof b === "object" && typeof b.title === "string" && b.title; }).slice(0, 30).map(function (b) {
    var hp = num(b.homeProb);
    return { title: b.title.slice(0, 60), spread: num(b.spread), total: num(b.total), homePrice: num(b.homePrice), awayPrice: num(b.awayPrice), homeProb: hp != null && hp >= 0 && hp <= 1 ? hp : null };
  });
}
// Pure: the consensus in words: "Median of 7 US sportsbooks: WAS +6.5, total 47.5, WAS 31% to win (margin removed)."
function marketText(m, homeAbbr) {
  if (!m) return null;
  var sg = function (v) { return (v > 0 ? "+" : v < 0 ? "\u2212" : "") + Math.abs(v); }, parts = [];
  if (m.spread != null) parts.push(homeAbbr + " " + sg(m.spread));
  if (m.total != null) parts.push("total " + m.total);
  if (m.homeProb != null) parts.push(homeAbbr + " " + Math.round(m.homeProb * 100) + "% to win (margin removed)");
  return "Median of " + m.books + " US sportsbook" + (m.books === 1 ? "" : "s") + ": " + parts.join(", ") + ".";
}
NFLU.cleanMarket = cleanMarket; NFLU.cleanBooks = cleanBooks; NFLU.marketText = marketText;
// Pure: the payload's line history, checked again: {gameId: [{at ms|null, open, source, provider, spread, total}]}.
function normLines(payload) {
  var l = payload && payload.lines && typeof payload.lines === "object" ? payload.lines : null, out = dict();
  if (!l) return out;
  Object.keys(l).forEach(function (id) {
    if (!Array.isArray(l[id])) return;
    var list = l[id].filter(function (o) { return o && typeof o === "object" && (o.at === null ? o.open === true : isFinite(Date.parse(o.at))) && (num(o.spread) != null || num(o.total) != null); })
      .map(function (o) { return { at: o.at === null ? null : Date.parse(o.at), open: o.open === true, source: String(o.source || ""), provider: o.provider ? String(o.provider) : "", spread: num(o.spread), total: num(o.total) }; });
    if (list.length) out[id] = list;
  });
  return out;
}
// Pure: one game's line history in words, home spread first ("open −11.5 → Nov 21, 4:37 PM −14.5 ▲"), from its main
// source (the one with the most observations). Moves of 1.5 points or more are marked ▲. Null with fewer than 2 points.
var LINE_BIG = 1.5;
function lineHistoryText(list, homeAbbr) {
  if (!Array.isArray(list) || list.length < 2) return null;
  var count = {}; list.forEach(function (o) { count[o.source] = (count[o.source] || 0) + 1; });
  var src = Object.keys(count).sort(function (a, b) { return count[b] - count[a]; })[0];
  var xs = list.filter(function (o) { return o.source === src && o.spread != null; }).slice(-8);
  if (xs.length < 2) return null;
  var fmt = function (v) { return (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v); };
  var when = function (o) { return o.open ? "open" : new Date(o.at).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); };
  var parts = xs.map(function (o, k) { var big = k > 0 && Math.abs(o.spread - xs[k - 1].spread) >= LINE_BIG; return when(o) + " " + fmt(o.spread) + (big ? " ▲" : ""); });
  var d = xs[xs.length - 1].spread - xs[0].spread;
  return "Line history, " + homeAbbr + " spread (" + (xs[0].provider || src) + "): " + parts.join(" → ") + ". " +
    (d === 0 ? "No net change." : "Net move " + fmt(d) + " points" + (d < 0 ? ", toward " + homeAbbr : ", away from " + homeAbbr) + ".") + (parts.some(function (p) { return /▲$/.test(p); }) ? " ▲ marks a move of 1.5 points or more between two looks." : "");
}
NFLU.normLines = normLines; NFLU.lineHistoryText = lineHistoryText;
// Pure: for each big move in a game's line history (main source, as above), the feed items about either team dated
// between the two looks: what was known around the move, not what caused it. An opening line has no time, so for the
// first move the window is the 7 days before the later look (marked). Items whose own time is unknown are left out.
// events: the model's events (ts ms, teams as indices); teams: [away, home]. Newest move first, at most 3, 4 items each.
var BETWEEN_TYPES = ["injury", "transaction", "qb_change", "news", "weather"], OPEN_WINDOW_MS = 7 * 86400000;
function betweenLooks(list, events, teams) {
  if (!Array.isArray(list) || list.length < 2) return [];
  var count = {}; list.forEach(function (o) { count[o.source] = (count[o.source] || 0) + 1; });
  var src = Object.keys(count).sort(function (a, b) { return count[b] - count[a]; })[0];
  var xs = list.filter(function (o) { return o.source === src; }), out = [];
  for (var k = 1; k < xs.length; k++) {
    var a = xs[k - 1], b = xs[k]; if (b.at == null) continue;
    var dS = a.spread != null && b.spread != null ? b.spread - a.spread : null, dT = a.total != null && b.total != null ? b.total - a.total : null;
    if (!((dS != null && Math.abs(dS) >= LINE_BIG) || (dT != null && Math.abs(dT) >= 2))) continue;
    var lo = a.at != null ? a.at : b.at - OPEN_WINDOW_MS, hi = b.at;
    var evs = (events || []).filter(function (e) {
      return BETWEEN_TYPES.indexOf(e.type) >= 0 && e.before == null && !e.dateOnly && isFinite(e.ts) && e.ts > lo && e.ts <= hi && (e.teams || []).some(function (t) { return teams.indexOf(t) >= 0; });
    }).sort(function (x, y) { return (y.importance || 0) - (x.importance || 0) || y.ts - x.ts; }).slice(0, 4);
    out.push({ from: a, to: b, dSpread: dS, dTotal: dT, openWindow: a.at == null, events: evs });
  }
  return out.reverse().slice(0, 3);
}
NFLU.betweenLooks = betweenLooks;
// Pure: one team's entries in the fantasy lists.
function teamFantasy(F, i) {
  var pick = function (l) { return (l || []).filter(function (x) { return x.team === i; }); };
  return { adds: pick(F && F.adds), drops: pick(F && F.drops) };
}
NFLU.normFantasy = normFantasy; NFLU.teamFantasy = teamFantasy;
// Pure: the payload's recent finals (the last week's scores, kept after it moved on) that the simulation's data does
// not have yet: matched to a game the engine still simulates and not already among this week's games from the feed
// (a schedule-only placeholder for the same game does not hide its final).
function recentFinalGames(payload, games) {
  var used = {}; (games || []).forEach(function (x) { if (x.gi >= 0 && x.fromFeed) used[x.gi] = 1; });
  return ((payload && Array.isArray(payload.recentFinals)) ? payload.recentFinals : []).filter(function (f) {
    return f && typeof f === "object" && TIDX[f.away] != null && TIDX[f.home] != null && Number.isInteger(f.awayScore) && Number.isInteger(f.homeScore) && f.awayScore >= 0 && f.homeScore >= 0;
  }).map(function (f) {
    // a final that names its game matches only that game (never a later meeting of the same teams)
    var gi = typeof f.gid === "string" && f.gid ? GAMES.findIndex(function (g) { return g[0] === f.gid; }) : matchGameIndex(f);
    return gi >= 0 && !used[gi] ? (used[gi] = 1, mergeGame(gi, Object.assign({}, f, { state: "post" }))) : null;
  }).filter(Boolean);
}
// Every game whose result the page should count: this week's games and the recent finals.
function resultGames(M) { return M ? (M.games || []).concat(M.recentFinals || []) : []; }
NFLU.recentFinalGames = recentFinalGames; NFLU.resultGames = resultGames;
function buildModel(payload) {
  var g = buildGames(payload), inj = dict(), srcs = dict();
  if (payload && payload.sources) Object.keys(payload.sources).forEach(function (k) { var s = payload.sources[k]; if (s && typeof s === "object") srcs[k] = s; });
  if (payload && payload.injuries) Object.keys(payload.injuries).forEach(function (a) { var t = payload.injuries[a]; if (TIDX[a] != null && t && typeof t === "object") inj[TIDX[a]] = t; });
  var gameByKey = dict();
  var recent = recentFinalGames(payload, g.games);
  // the feed's games first, then the recent finals, then schedule-only placeholders: a key goes to the first that has it
  var fed = g.games.filter(function (x) { return x.fromFeed; }), pad = g.games.filter(function (x) { return !x.fromFeed; });
  fed.concat(recent, pad).forEach(function (x) { [x.key, x.gid, x.id].forEach(function (k) { if (k && !gameByKey[k]) gameByKey[k] = x; }); });
  return { week: g.week, games: g.games, recentFinals: recent, gameByKey: gameByKey, events: buildEvents(payload), injuries: inj, sources: srcs, media: normMedia(payload), fantasy: normFantasy(payload), lines: normLines(payload),
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
  // a source switched off on purpose (no key on this server, or refused here: DEC-024) is not a fault, so not "degraded";
  // one still loading after a start (DEC-025) is counted as loading
  var on = ss.filter(function (s) { return s.status !== "disabled"; });
  var loading = on.filter(function (s) { return s.status === "pending"; }).length;
  var bad = on.length - loading - on.filter(function (s) { return s.status === "ok"; }).length;
  var tip = ss.map(function (s) { var a = ageOf(s); return s.label + ": " + s.status + (a != null ? ", " + fmtAge(a) + " old" : ""); }).join("; ");
  if (meta.origin === "snapshot") return { state: "snapshot", label: "SNAPSHOT · " + (youngest == null ? "age unknown" : fmtAge(youngest) + " old"), title: "Saved snapshot, not live. " + tip };
  var allStale = !ss.some(function (s) { return s.status === "ok"; });
  if (meta.fails > 0 || allStale) return { state: "stale", label: "STALE · " + (youngest == null ? "age unknown" : fmtAge(youngest)), title: (meta.fails > 0 ? "The feed stopped answering; showing the last data received. " : "Every source here is stale. ") + tip };
  return { state: "live", label: "LIVE · " + fmtAge(youngest) + (bad ? " · " + bad + " degraded" : "") + (loading ? " · " + loading + " loading" : ""), title: tip, degraded: bad, loading: loading };
}

// The top bar's status: every source in the payload, read the same way as a panel badge.
function pillState(meta, now) { return freshness(["*"], meta, now); }

// ---- live games: a game is in progress on this page only when its data is live, answering, ok and recent ----
var LIVE_GAME_MAX_AGE_SEC = 180;
function gameSource(x, M) { return x && M && x.source && hasOwn(M.sources, x.source) ? M.sources[x.source] : null; }
// Age in seconds of the data behind game x (its source's age plus the time since this payload), or null if unknown.
// A game stamped with when its source last listed it (checkedAt) is at least that old, however fresh the source is.
function gameDataAge(x, M, meta, now) {
  var s = gameSource(x, M); if (!s) return null;
  var base = meta && meta.origin === "live" && meta.fetchedAt ? Math.max(0, (now - meta.fetchedAt) / 1000) : M.generatedAt != null ? Math.max(0, (now - M.generatedAt) / 1000) : 0;
  var ck = Date.parse(x.checkedAt || ""), own = isFinite(ck) && M.generatedAt != null ? Math.max(0, (M.generatedAt - ck) / 1000) + base : null;
  if (num(s.ageSec) != null) return Math.max(s.ageSec + base, own == null ? 0 : own);
  var t = Date.parse(s.lastOk || ""); return isFinite(t) && M.generatedAt != null ? Math.max(Math.max(0, (M.generatedAt - t) / 1000) + base, own == null ? 0 : own) : own;
}
function gameIsLive(x, M, meta, now) {
  if (!x || x.state !== "in" || !M || !meta || meta.origin !== "live" || meta.fails > 0) return false;
  var s = gameSource(x, M); if (!s || s.status !== "ok") return false;
  var age = gameDataAge(x, M, meta, now);
  return age != null && age <= LIVE_GAME_MAX_AGE_SEC;
}

Object.assign(NFLU, { buildGames: buildGames, buildEvents: buildEvents, buildModel: buildModel, freshness: freshness, matchSources: matchSources,
  looksLikeUniverse: looksLikeUniverse, TEAMS: TEAMS, BREAKING_MIN: BREAKING_MIN, pillState: pillState, gameIsLive: gameIsLive, gameDataAge: gameDataAge, TIDX: TIDX });
