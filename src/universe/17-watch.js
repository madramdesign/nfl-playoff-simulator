// Intelligence depth (M5): a watchlist with in-page alerts, "what changed" across time windows, and conflicting
// injury reports shown side by side. Everything is descriptive: nothing here feeds the forecast. The rules are pure
// functions (tested in test/universe.test.js); the page code below them only draws their results.
// No browser notifications, no sound and no network calls: alerts come from data the page already holds.
var DAY_MS = 24 * HOUR;
var ALERT_TYPES = ["injury", "qb_change", "transaction"];   // these always alert for a watched team
var ALERT_MIN_IMPORTANCE = BREAKING_MIN;                    // anything else needs the feed's "breaking" score
var ALERT_COOLDOWN_MS = 10 * 60e3;                          // one alert per team in this span; later items are folded into it
var ALERT_MAX_AGE_MS = 7 * DAY_MS;                          // an item that happened longer ago than this is stale: no alert
var SEEN_CAP = 400, ALERT_CAP = 30, WATCH_CAP = 32, KEY_MAX = 160;

// ---- watchlist state: {teams [{a, at}], since, seen [[key, ms]], cool {abbr: ms}, alerts [...]} ----
// since: the baseline. An item first seen at or before it never alerts. It starts at the first visit and only moves
// forward (when old keys leave the bounded seen list), so a key that was dropped can never alert again.
function emptyWatch() { return { teams: [], since: null, seen: [], cool: {}, alerts: [] }; }
function trimSeen(s) {
  if (s.seen.length <= SEEN_CAP) return s;
  s.seen.sort(function (a, b) { return a[1] - b[1]; });
  var cut = s.seen.splice(0, s.seen.length - SEEN_CAP), hi = cut[cut.length - 1][1];
  if (s.since == null || hi > s.since) s.since = hi;
  return s;
}
// Whatever was stored is treated as untrusted: unknown teams, wrong types and oversize lists are dropped.
function sanitizeWatch(raw) {
  var s = emptyWatch(); if (!raw || typeof raw !== "object") return s;
  var have = dict(), keys = dict();
  (Array.isArray(raw.teams) ? raw.teams : []).forEach(function (t) {
    if (!t || typeof t.a !== "string" || TIDX[t.a] == null || have[t.a] || s.teams.length >= WATCH_CAP) return;
    have[t.a] = 1; s.teams.push({ a: t.a, at: num(t.at) != null ? t.at : 0 });
  });
  if (num(raw.since) != null) s.since = raw.since;
  (Array.isArray(raw.seen) ? raw.seen : []).forEach(function (p) {
    if (!Array.isArray(p) || typeof p[0] !== "string" || !p[0] || p[0].length > KEY_MAX || num(p[1]) == null || keys[p[0]]) return;
    keys[p[0]] = 1; s.seen.push([p[0], p[1]]);
  });
  trimSeen(s);
  if (raw.cool && typeof raw.cool === "object") Object.keys(raw.cool).forEach(function (a) { if (have[a] && num(raw.cool[a]) != null) s.cool[a] = raw.cool[a]; });
  (Array.isArray(raw.alerts) ? raw.alerts : []).forEach(function (a) {
    if (!a || typeof a !== "object" || typeof a.team !== "string" || TIDX[a.team] == null || num(a.at) == null || typeof a.title !== "string" || s.alerts.length >= ALERT_CAP) return;
    s.alerts.push({ id: typeof a.id === "string" && a.id.length <= 60 ? a.id : "a" + a.at + "-" + a.team, team: a.team, at: a.at, count: Math.max(1, Math.round(num(a.count) || 1)),
      type: EV_TYPES.indexOf(a.type) >= 0 ? a.type : "news", title: a.title.slice(0, 300), url: safeUrl(a.url), publisher: String(a.publisher || "").slice(0, 80),
      imp: num(a.imp), ts: num(a.ts), dateOnly: a.dateOnly === true, read: a.read === true });
  });
  return s;
}
function isWatched(s, abbr) { return !!s && s.teams.some(function (t) { return t.a === abbr; }); }
// Star or unstar. Watching starts now: nothing already on the page alerts for a newly starred team.
function toggleWatch(s, abbr, now) {
  if (TIDX[abbr] == null) return s;
  var n = Object.assign({}, s, { teams: s.teams.slice(), cool: Object.assign({}, s.cool) });
  if (isWatched(s, abbr)) { n.teams = n.teams.filter(function (t) { return t.a !== abbr; }); delete n.cool[abbr]; }
  else if (n.teams.length < WATCH_CAP) n.teams.push({ a: abbr, at: now });
  else return s;
  return n;
}
function unreadCount(s) { return s ? s.alerts.filter(function (a) { return !a.read; }).length : 0; }
function markRead(s, id) {
  if (!s.alerts.some(function (a) { return !a.read && (id == null || a.id === id); })) return s;
  return Object.assign({}, s, { alerts: s.alerts.map(function (a) { return !a.read && (id == null || a.id === id) ? Object.assign({}, a, { read: true }) : a; }) });
}
function clearAlerts(s) { return s.alerts.length ? Object.assign({}, s, { alerts: [] }) : s; }

// One key per item. The page's own curated news has list positions for ids, which shift when an item is added, so its
// link is the key instead.
function alertKey(e) { return (e.origin === "page" && e.url ? "page:" + e.url : String(e.id)).slice(0, KEY_MAX); }
// When the page could first have known the item: the fabric's seenAt, else the item's own time. Items with a date and
// no time count until the end of that day, so one dated today is not mistaken for old.
function eventKnownAt(e) { var t = isFinite(e.seen) ? e.seen : e.ts; return e.dateOnly ? t + DAY_MS - 1 : t; }
function alertWorthy(e) { return ALERT_TYPES.indexOf(e.type) >= 0 || (e.importance != null && e.importance >= ALERT_MIN_IMPORTANCE); }

// The alert rules. events: the model's events; s: watch state; opts.fixture: the data is synthetic.
// Returns {state, fired, merged}: fired are new alerts (shown as toasts); merged are alerts that only grew, inside
// their team's cooldown (no new toast). state is the same object when nothing changed.
//  - fixture data never alerts and is never remembered
//  - the first run only sets the baseline to now
//  - an item is considered once (its key is remembered whether or not it alerts)
//  - it alerts only for a watched team, starred before the item was first seen, when alertWorthy and not stale
//  - all of a team's items in one pass make one alert with a count; within the cooldown they join the last alert
function planAlerts(events, s, now, opts) {
  if ((opts && opts.fixture) || !s) return { state: s, fired: [], merged: [] };
  var first = s.since == null, n = { teams: s.teams, since: first ? now : s.since, seen: s.seen.slice(), cool: Object.assign({}, s.cool), alerts: s.alerts.slice() };
  var dirty = first, have = dict(), watched = dict(), groups = dict(), order = [];
  n.seen.forEach(function (p) { have[p[0]] = 1; });
  n.teams.forEach(function (t) { watched[t.a] = t.at; });
  (events || []).forEach(function (e) {
    if (!e || e.id == null) return;
    var te = eventKnownAt(e), key = alertKey(e);
    if (!isFinite(te) || te <= n.since || have[key]) return;
    have[key] = 1; n.seen.push([key, Math.min(te, now)]); dirty = true;
    if (first || !alertWorthy(e) || !isFinite(e.ts) || now - e.ts > ALERT_MAX_AGE_MS) return;
    var abbr = null;
    (e.teams || []).some(function (i) { var a = TEAMS[i] && TEAMS[i].a; if (a && watched[a] != null && te > watched[a]) { abbr = a; return true; } return false; });
    if (!abbr) return;
    if (!groups[abbr]) { groups[abbr] = []; order.push(abbr); }
    groups[abbr].push(e);
  });
  var fired = [], merged = [];
  order.forEach(function (abbr) {
    var list = groups[abbr].sort(function (a, b) { return (b.importance == null ? -1 : b.importance) - (a.importance == null ? -1 : a.importance) || b.ts - a.ts; }), lead = list[0];
    var leadOf = function (a) { return Object.assign(a, { type: lead.type, title: String(lead.title).slice(0, 300), url: lead.url || null, publisher: String(lead.publisher || "").slice(0, 80), imp: lead.importance, ts: lead.ts, dateOnly: !!lead.dateOnly }); };
    var last = n.cool[abbr], cooling = last != null && now >= last && now - last < ALERT_COOLDOWN_MS, k = -1;
    if (cooling) for (var j = 0; j < n.alerts.length; j++) if (n.alerts[j].team === abbr) { k = j; break; }
    if (k >= 0) {
      var cur = Object.assign({}, n.alerts[k], { count: n.alerts[k].count + list.length, read: false });
      if ((lead.importance == null ? -1 : lead.importance) > (cur.imp == null ? -1 : cur.imp)) leadOf(cur);
      n.alerts[k] = cur; merged.push(cur);
    } else {
      var a = leadOf({ id: "a" + now + "-" + abbr, team: abbr, at: now, count: list.length, read: false });
      n.alerts.unshift(a);
      if (cooling) merged.push(a); else { n.cool[abbr] = now; fired.push(a); }
    }
  });
  if (!dirty) return { state: s, fired: [], merged: [] };
  if (n.alerts.length > ALERT_CAP) n.alerts.length = ALERT_CAP;
  trimSeen(n);
  return { state: n, fired: fired, merged: merged };
}
var WC_TYPE_LABEL = { qb_change: "Quarterback changes", injury: "Injuries", transaction: "Transactions", news: "News", odds_move: "Line moves", game: "Game updates",
  weather: "Weather flags", playoff_move: "Playoff moves", model: "Model events" };
var ALERT_ONE = { qb_change: "quarterback change", injury: "injury report", transaction: "transaction", news: "breaking news", odds_move: "line move", game: "game update",
  weather: "weather flag", playoff_move: "playoff move", model: "model event" };
// Pure: the words of an alert. The headline is the source's own; nothing is added to it.
function alertText(a) {
  var T = TEAMS[TIDX[a.team]], nick = T ? T.nick : a.team;
  return a.count > 1 ? { head: a.count + " new items for the " + nick, body: a.title, tail: "Most important of the " + a.count + " shown" }
    : { head: "New for the " + nick + ": " + (ALERT_ONE[a.type] || "item"), body: a.title, tail: "" };
}

// ---- visits: when this browser was last here, and the playoff chances it saw then ----
var VISIT_GAP_MS = 30 * 60e3;   // returning after this long is a new visit; a reload sooner continues the same one
function sanitizePo(p) {
  if (!p || typeof p !== "object" || num(p.at) == null || [0, 1, 2].indexOf(p.mode) < 0 || !Array.isArray(p.v) || p.v.length !== TEAMS.length) return null;
  if (!p.v.every(function (x) { return num(x) != null && x >= 0 && x <= 1; })) return null;
  return { at: p.at, mode: p.mode, n: num(p.n), v: p.v.slice() };
}
// stored: {last, prev, po, prevPo} or anything else. Returns the record for this page load: prev is when the previous
// visit ended (null on a first visit) and prevPo the simulation kept from it.
function rollVisit(stored, now) {
  var s = stored && typeof stored === "object" ? stored : {}, last = num(s.last);
  if (last == null || last > now + FUTURE_SKEW_MS) return { last: now, prev: null, po: null, prevPo: null };
  if (now - last > VISIT_GAP_MS) return { last: now, prev: last, po: null, prevPo: sanitizePo(s.po) };
  return { last: now, prev: num(s.prev), po: sanitizePo(s.po), prevPo: sanitizePo(s.prevPo) };
}

// ---- what changed ----
var WC_WINDOWS = [["visit", "Since my last visit"], ["24h", "24 hours"], ["7d", "7 days"]];
var WC_TYPE_ORDER = ["qb_change", "injury", "transaction", "news", "odds_move", "game", "weather", "playoff_move", "model"];
var WC_TOP = 3, WC_MOVERS = 5, WC_MIN_MOVE = 0.005, WC_NOISE = 0.03;
function windowSince(win, visit, now) { return win === "24h" ? now - DAY_MS : win === "7d" ? now - 7 * DAY_MS : visit && num(visit.prev) != null ? visit.prev : null; }
// Events in the window and the focus, grouped by type in a fixed order. "Since my last visit" goes by when an item was
// first seen (it is new to the viewer even if it was published earlier); the fixed windows go by when it happened,
// like the feed's time range.
function changedEvents(events, win, since, now, set) {
  var list = focusEvents(events || [], set).filter(function (e) {
    if (win === "visit") return eventKnownAt(e) > since;
    return isFinite(e.ts) && e.ts >= since && e.ts <= now + FUTURE_SKEW_MS;
  });
  var by = dict();
  list.forEach(function (e) { (by[e.type] = by[e.type] || []).push(e); });
  var groups = WC_TYPE_ORDER.filter(function (t) { return by[t]; }).map(function (t) {
    var top = by[t].slice().sort(function (a, b) { return (b.importance == null ? -1 : b.importance) - (a.importance == null ? -1 : a.importance) || b.ts - a.ts; });
    return { type: t, label: WC_TYPE_LABEL[t], count: top.length, top: top.slice(0, WC_TOP) };
  });
  return { total: list.length, groups: groups };
}
// The dated forecasts on the page: the saved forecast (D.prev, a date with no time, so it spans that day) and the
// simulation this browser kept from the last visit (only when it used the same win-chance mode as now).
function forecastBaselines(prev, visit, simMode) {
  var out = [];
  if (prev && Array.isArray(prev.playoffs) && /^\d{4}-\d{2}-\d{2}$/.test(prev.date || "")) {
    var lo = Date.parse(prev.date + "T00:00:00Z"), po = null;
    if (Array.isArray(prev.teams) && prev.teams.length === prev.playoffs.length) { po = []; prev.teams.forEach(function (a, k) { if (TIDX[a] != null) po[TIDX[a]] = prev.playoffs[k]; }); }
    else if (prev.playoffs.length === TEAMS.length) po = prev.playoffs;
    if (isFinite(lo) && po) out.push({ kind: "saved", lo: lo, hi: lo + DAY_MS, dateOnly: true, po: po, mode: 2 });
  }
  var vp = visit && visit.prevPo;
  if (vp && vp.mode === simMode && Array.isArray(vp.v) && vp.v.length === TEAMS.length) out.push({ kind: "visit", lo: vp.at, hi: vp.at, dateOnly: false, po: vp.v, mode: vp.mode });
  return out;
}
// The forecast dated nearest the start of the window. rel: "start" (dated where the window begins), "older" (the
// comparison reaches back before the window) or "inside" (it covers only the later part). One further from the
// window's start than the window is long is not a comparison for this window: tooFar.
function pickBaseline(cands, since, now) {
  if (since == null || !cands || !cands.length) return null;
  var span = Math.max(1, now - since), tol = span * 0.1, best = null;
  cands.forEach(function (c) {
    var dist = c.hi < since ? since - c.hi : c.lo > since ? c.lo - since : 0;
    var x = Object.assign({}, c, { dist: dist, rel: dist <= tol ? "start" : c.hi < since ? "older" : "inside" });
    if (!best || x.dist < best.dist || (x.dist === best.dist && !x.dateOnly && best.dateOnly)) best = x;
  });
  best.tooFar = best.dist > span;
  return best;
}
function topMovers(from, to, set) {
  var out = [];
  for (var i = 0; i < TEAMS.length; i++) {
    if ((set && !set[i]) || num(from[i]) == null || num(to[i]) == null) continue;
    var d = to[i] - from[i]; if (Math.abs(d) >= WC_MIN_MOVE) out.push({ team: i, from: from[i], to: to[i], delta: d });
  }
  return out.sort(function (a, b) { return Math.abs(b.delta) - Math.abs(a.delta); });
}
// ctx: {win, now, visit, events, focus (id or null), meta {has, origin, generatedAt, fetchedAt, fails, fixture},
//       sim {po [share per team], mode, n} or null, prev (D.prev), history (D.history)}.
// Everything returned is computed from those inputs. Where there is nothing to compare with, the state says why
// instead of reporting zero:
//   events.state   "no-baseline" (no earlier visit), "no-feed" (no feed data), "not-covered" (the data on the page
//                  is older than the window), "none" (data covers the window and nothing is in it) or "ok"
//   forecast.state "waiting" (no simulation yet), "no-baseline" (why: first-visit | none | too-far) or "ok"
function whatChanged(ctx) {
  var win = WC_WINDOWS.some(function (w) { return w[0] === ctx.win; }) ? ctx.win : "24h", now = ctx.now, since = windowSince(win, ctx.visit, now);
  var fi = focusInfo(ctx.focus), set = focusSet(ctx.focus), meta = ctx.meta || {};
  var out = { win: win, since: since, fixture: !!meta.fixture, scope: { id: fi.id, level: fi.level, label: fi.level === "league" ? "NFL" : fi.level === "team" ? TEAMS[fi.team].name : fi.label } };
  // how far the data on the page reaches: a live answer reaches now; a snapshot or a feed that stopped reaches its own time
  var dataAt = !meta.has ? null : meta.origin === "live" ? (meta.fails > 0 && num(meta.fetchedAt) != null ? meta.fetchedAt : now) : num(meta.generatedAt);
  var ev = { state: "no-baseline", total: 0, groups: [], feedMissing: !meta.has, dataAt: dataAt, partial: false };
  if (since != null) {
    var c = changedEvents(ctx.events, win, since, now, set);
    ev.total = c.total; ev.groups = c.groups;
    ev.partial = dataAt != null && dataAt < now - FUTURE_SKEW_MS && dataAt > since;
    ev.state = c.total ? "ok" : !meta.has ? "no-feed" : dataAt != null && dataAt <= since ? "not-covered" : "none";
  }
  out.events = ev;
  var fc = { state: "waiting" };
  if (ctx.sim && ctx.sim.po) {
    if (since == null) fc = { state: "no-baseline", why: "first-visit" };
    else {
      var b = pickBaseline(forecastBaselines(ctx.prev, ctx.visit, ctx.sim.mode), since, now);
      if (!b) fc = { state: "no-baseline", why: "none" };
      else if (b.tooFar) fc = { state: "no-baseline", why: "too-far", baseline: b };
      else {
        var mv = topMovers(b.po, ctx.sim.po, set);
        fc = { state: "ok", baseline: b, moved: mv.length, movers: mv.slice(0, WC_MOVERS), noise: mv.length > 0 && Math.abs(mv[0].delta) < WC_NOISE, modeDiffers: b.mode !== ctx.sim.mode, mode: ctx.sim.mode, n: ctx.sim.n };
      }
    }
  }
  out.forecast = fc;
  // week over week from the weekly history: numbered by week, not dated, so it is offered only beside the 7-day window
  var H = ctx.history; out.weekly = null;
  if (win === "7d" && H && H.po && H.po.length >= 2 && H.weeks) {
    var k = H.po.length, wm = topMovers(H.po[k - 2], H.po[k - 1], set);
    out.weekly = { week: H.weeks[k - 1], prevWeek: H.weeks[k - 2], moved: wm.length, movers: wm.slice(0, WC_MOVERS) };
  }
  return out;
}

// ---- conflicting injury reports: both kept, in the order the feed lists them, with no winner ----
function injPublisher(id, sources) { return id === "espn-injuries" ? "ESPN" : id === "nflverse-injuries" ? "nflverse" : id ? sourceLabel(id, sources || {}) : "unnamed source"; }
function reportOf(source, status, detail, sources) {
  return { source: typeof source === "string" ? source : null, publisher: injPublisher(typeof source === "string" ? source : null, sources),
    status: typeof status === "string" && status ? status : "status not given", detail: detail || null };
}
function alsoDetail(o) {
  var bits = [];
  if (o.week != null && isFinite(+o.week)) bits.push("week " + (+o.week) + " report");
  if (typeof o.practice === "string" && o.practice) bits.push("practice: " + o.practice);
  return bits.join(" · ") || null;
}
// p: a player from the payload's injuries. null when the data holds only one report for the player.
function injuryReports(p, sources) {
  if (!p || typeof p !== "object" || !p.also || typeof p.also !== "object") return null;
  return { name: String(p.name || ""), pos: p.pos ? String(p.pos) : "", agree: p.disagree !== true,
    reports: [reportOf(p.source, p.status, typeof p.type === "string" && p.type ? p.type : null, sources), reportOf(p.also.source, p.also.status, alsoDetail(p.also), sources)] };
}
// e: a normalized injury event; the second report rides in data.other (see lib/fabric/index.js).
function eventReports(e, sources) {
  var o = e && e.type === "injury" && e.data && e.data.other;
  if (!o || typeof o !== "object") return null;
  var p = e.players && e.players[0];
  return { name: p ? p.name : "", pos: p ? p.pos : "", agree: e.data.disagree !== true,
    reports: [Object.assign(reportOf(e.source, e.data.status || e.subtype, null, sources), e.publisher ? { publisher: e.publisher } : null), reportOf(o.source, o.status, alsoDetail(o), sources)] };
}
// What can be compared for one team: which injury sources are in the data, how many players both list, how many differ.
function injuryCompareSummary(inj, sources) {
  var names = [], add = function (id) { var n = injPublisher(id, sources); if (id && names.indexOf(n) < 0) names.push(n); }, both = 0, differ = 0;
  matchSources(sources, ["espn-injuries", "nflverse-injuries"]).forEach(function (s) { if (s && (s.status === "ok" || s.status === "stale")) add(s.id); });
  ((inj && inj.players) || []).forEach(function (p) {
    if (!p || typeof p !== "object") return;
    if (typeof p.source === "string") add(p.source);
    if (p.also && typeof p.also === "object") { both++; if (typeof p.also.source === "string") add(p.also.source); if (p.disagree === true) differ++; }
  });
  return { sources: names, comparable: names.length >= 2, both: both, differ: differ };
}

Object.assign(NFLU, { emptyWatch: emptyWatch, sanitizeWatch: sanitizeWatch, toggleWatch: toggleWatch, isWatched: isWatched, unreadCount: unreadCount, markRead: markRead,
  clearAlerts: clearAlerts, planAlerts: planAlerts, alertWorthy: alertWorthy, alertKey: alertKey, alertText: alertText, rollVisit: rollVisit, windowSince: windowSince,
  changedEvents: changedEvents, forecastBaselines: forecastBaselines, pickBaseline: pickBaseline, whatChanged: whatChanged, injuryReports: injuryReports,
  eventReports: eventReports, injuryCompareSummary: injuryCompareSummary,
  WATCH: { COOLDOWN_MS: ALERT_COOLDOWN_MS, MAX_AGE_MS: ALERT_MAX_AGE_MS, SEEN_CAP: SEEN_CAP, ALERT_CAP: ALERT_CAP, MIN_IMPORTANCE: ALERT_MIN_IMPORTANCE, TYPES: ALERT_TYPES, VISIT_GAP_MS: VISIT_GAP_MS, WINDOWS: WC_WINDOWS } });

// ================= page code (needs a DOM; nothing below runs in the tests) =================
var watchState = null, visitState = null, changesPanel = null, toastHost = null, bellBtn = null, bellPop = null, wcWin = null;
var TOAST_MS = 12000, TOAST_MAX = 3;
function getWatch() { if (!watchState) watchState = sanitizeWatch(lsGet().watch); return watchState; }
function setWatch(next) {
  if (!next || next === watchState) return;
  watchState = next; lsSet({ watch: next });
  if (store) store.set({ watch: next });
}
function storageWorks() { try { ROOT.localStorage.setItem("nflu-probe", "1"); ROOT.localStorage.removeItem("nflu-probe"); return true; } catch (e) { return false; } }
function timeText(ms) { try { return new Date(ms).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); } catch (e) { return new Date(ms).toString().slice(4, 21); } }

// ---- stars (hooks in 11-teams.js) ----
function flipWatch(i) { var T = TEAMS[i]; if (T) setWatch(toggleWatch(getWatch(), T.a, Date.now())); }
function watchStar(i) {
  var T = TEAMS[i], on = isWatched(getWatch(), T.a);
  return el("button", { type: "button", class: "u-star", "data-fk": "watch-" + T.a, "aria-pressed": on ? "true" : "false", "aria-label": (on ? "Stop watching the " : "Watch the ") + T.nick,
    title: on ? "Watching the " + T.nick + ": alerts appear under the bell. Click to stop." : "Watch the " + T.nick + " for alerts", text: on ? "★" : "☆", onclick: function (e) { e.stopPropagation(); flipWatch(i); } });
}
function watchButton(i) {
  var T = TEAMS[i], on = isWatched(getWatch(), T.a);
  return el("button", { type: "button", class: "u-btn", "data-fk": "watch-team", "aria-pressed": on ? "true" : "false", text: (on ? "★ Watching" : "☆ Watch"),
    title: on ? "Stop alerts for the " + T.nick : "Alert me in this page when new injuries, quarterback changes, transactions or breaking news arrive for the " + T.nick, onclick: function () { flipWatch(i); } });
}

// ---- conflicting reports (hooks in 11-teams.js and 09-feed.js) ----
function reportsNode(v) {
  return el("div", { class: "u-cmp", role: "group", "aria-label": "Two reports" + (v.name ? " for " + v.name : "") + ", side by side" }, v.reports.map(function (r) {
    return el("div", { class: "u-cmp-cell" }, [el("span", { class: "u-cmp-pub", text: r.publisher }), el("b", { text: r.status }), r.detail ? el("small", { text: r.detail }) : null]);
  }));
}
function injuryRow(p, sources) {
  var v = injuryReports(p, sources), head = [el("b", { text: String(p.name || "") }), " " + (p.pos || "")];
  if (!v) return el("li", {}, head.concat([" · " + (p.status || "status not given") + (p.type ? " (" + p.type + ")" : "") + (p.source ? " · " + sourceLabel(p.source) : "")]));
  if (v.agree) return el("li", {}, head.concat([" · " + v.reports[0].status + (p.type ? " (" + p.type + ")" : "") + " · " + v.reports[0].publisher + " and " + v.reports[1].publisher + " agree"]));
  return el("li", { class: "u-inj-conflict" }, head.concat([" ", el("span", { class: "u-chip is-warn", text: "Sources disagree" }), reportsNode(v)]));
}
function injuryList(inj, payload) {
  var S = payload && payload.sources, sum = injuryCompareSummary(inj, S), ps = (inj.players || []).filter(function (p) { return p && typeof p === "object"; });
  var note = !sum.sources.length ? "The data does not name a source for these reports, so they cannot be compared with a second one."
    : !sum.comparable ? "One injury source in this data (" + sum.sources[0] + "), so there is no second report to compare with. A single report is not a confirmed one."
    : sum.sources.join(" and ") + ": " + sum.both + " player" + (sum.both === 1 ? "" : "s") + " listed by both" + (sum.differ ? ", " + sum.differ + " with different statuses. Both reports are shown side by side as published; this page does not pick one. The counts and burden index above use the report shown first."
      : sum.both ? ", none with different statuses." : "; no player here appears in both, so nothing can be compared.");
  return [el("ul", { class: "u-list" }, ps.map(function (p) { return injuryRow(p, S); })), el("p", { class: "u-note", "data-cmp": sum.comparable ? (sum.differ ? "differ" : "same") : "single", text: note })];
}
function eventConflictNode(e) {
  var v = eventReports(e, store && store.get("payload") ? store.get("payload").sources : null);
  if (!v || v.agree) return null;
  return el("div", { class: "u-ev-cmp" }, [el("span", { class: "u-chip is-warn", text: "Sources disagree" }), reportsNode(v)]);
}

// ---- alerts: toasts and the bell ----
function showToast(a) {
  if (!toastHost) return;
  var t = alertText(a), timer = 0, node;
  var close = function () { clearTimeout(timer); if (node.parentNode) node.parentNode.removeChild(node); };
  var arm = function () { clearTimeout(timer); timer = setTimeout(close, TOAST_MS); };
  node = el("div", { class: "u-toast", "data-alert": a.id, onmouseenter: function () { clearTimeout(timer); }, onmouseleave: arm, onfocusin: function () { clearTimeout(timer); }, onfocusout: arm }, [
    el("button", { type: "button", class: "u-toast-main", title: "Open the team center", onclick: function () { close(); setWatch(markRead(getWatch(), a.id)); openTeam(TIDX[a.team]); } }, [el("b", { text: t.head }), el("span", { text: t.body })]),
    el("button", { type: "button", class: "u-x", "aria-label": "Dismiss this alert", text: "×", onclick: function () { var had = node.contains(document.activeElement); close(); if (had && bellBtn) bellBtn.focus(); } })]);
  while (toastHost.children.length >= TOAST_MAX) toastHost.removeChild(toastHost.firstChild);
  toastHost.appendChild(node); arm();
}
function processAlerts() {
  var M = store.get("model"); if (!M) return;
  var r = planAlerts(M.events, getWatch(), Date.now(), { fixture: M.fixture });
  setWatch(r.state);
  r.fired.forEach(function (a) { try { showToast(a); } catch (e) { uReport("toast", e); } });
}
function renderBell() {
  if (!bellBtn) return;
  var s = getWatch(), n = unreadCount(s), cnt = bellBtn.querySelector(".u-bell-n");
  cnt.textContent = n > 9 ? "9+" : String(n); cnt.hidden = !n;
  bellBtn.setAttribute("aria-label", "Alerts: " + (n ? n + " unread" : "none unread") + ", watching " + s.teams.length + " team" + (s.teams.length === 1 ? "" : "s"));
  bellBtn.classList.toggle("has-unread", n > 0);
  if (bellPop && !bellPop.hidden) drawBellPop();
}
function drawBellPop() {
  var s = getWatch(), now = Date.now(), M = store.get("model");
  keepFocus(bellPop, function () {
    clearNode(bellPop);
    bellPop.appendChild(el("div", { class: "u-mhead" }, [el("h2", { id: "u-bell-title", text: "Alerts" }), el("button", { type: "button", class: "u-x", "data-fk": "bell-x", "aria-label": "Close alerts", text: "×", onclick: function () { closeBell(true); } })]));
    if (M && M.fixture) bellPop.appendChild(el("p", { class: "u-warnline", text: "Fixture data is loaded: synthetic items never raise alerts." }));
    if (s.alerts.length) {
      bellPop.appendChild(el("ul", { class: "u-alerts" }, s.alerts.map(function (a) {
        var t = alertText(a), i = TIDX[a.team];
        return el("li", { class: a.read ? null : "is-unread" }, [
          el("div", { class: "u-ev-top" }, [teamChip(i), el("b", { text: t.head }), el("span", { class: "u-ev-time", title: timeText(a.at), text: fmtRel(a.at, now) })]),
          a.url ? el("a", { href: a.url, target: "_blank", rel: "noopener", class: "u-ev-title", text: t.body }) : el("span", { class: "u-ev-title", text: t.body }),
          el("div", { class: "u-ev-meta" }, [a.publisher ? el("span", { class: "u-ev-pub", text: a.publisher }) : null, t.tail ? el("span", { text: t.tail }) : null,
            a.ts != null ? el("span", { text: a.dateOnly ? "dated " + fmtDateUTC(a.ts) : "reported " + timeText(a.ts) }) : null])]);
      })));
      bellPop.appendChild(el("div", { class: "u-actions" }, [el("button", { type: "button", class: "u-btn u-small", "data-fk": "bell-clear", text: "Clear alerts", onclick: function () { setWatch(clearAlerts(getWatch())); } })]));
    } else bellPop.appendChild(el("p", { class: "u-state u-empty", text: s.teams.length ? "No alerts yet for the teams you watch." : "No alerts: you are not watching any team." }));
    bellPop.appendChild(el("h3", { text: "Watching" }));
    if (s.teams.length) bellPop.appendChild(el("ul", { class: "u-watching" }, s.teams.map(function (t) {
      var T = TEAMS[TIDX[t.a]];
      return el("li", {}, [el("button", { type: "button", class: "u-tchip", "data-team": T.i, title: "Open " + T.name, style: T.color ? { "--tc": T.color } : null, text: T.a }),
        el("span", { text: " " + T.nick + " " }), el("button", { type: "button", class: "u-btn u-small", "data-fk": "unwatch-" + T.a, "aria-label": "Stop watching the " + T.nick, text: "Remove", onclick: function () { setWatch(toggleWatch(getWatch(), T.a, Date.now())); } })]);
    })));
    else bellPop.appendChild(el("p", { class: "u-note", text: "Star a team (☆) in the Teams panel or in a team center to watch it." }));
    bellPop.appendChild(el("p", { class: "u-note", text: "A watched team alerts for injuries, quarterback changes, transactions and breaking news (importance " + ALERT_MIN_IMPORTANCE + " or more) first seen after you starred it: once per item, and at most one alert per team every " + Math.round(ALERT_COOLDOWN_MS / 60e3) + " minutes, with a count. Shown in this page only; nothing is sent anywhere." +
      (storageWorks() ? " The list is kept in this browser." : " This browser is not saving it (storage is blocked), so it lasts until the page is closed.") }));
    bellPop.appendChild(el("button", { type: "button", class: "u-btn u-small", "data-fk": "bell-changes", text: "What changed", onclick: function () { closeBell(false); focusChanges(); } }));
  });
}
function placeBell() {
  // under the bell, right edges aligned, kept inside the window (on a phone the bell can sit at the left of a wrapped bar)
  var r = bellBtn.getBoundingClientRect(), cw = document.documentElement.clientWidth, w = bellPop.offsetWidth;
  bellPop.style.top = Math.max(8, Math.round(r.bottom + 6)) + "px";
  bellPop.style.left = Math.round(Math.max(8, Math.min(r.right - w, cw - w - 8))) + "px";
}
function openBell() {
  bellPop.hidden = false; bellBtn.setAttribute("aria-expanded", "true");
  placeBell(); drawBellPop();
  var x = bellPop.querySelector(".u-x"); if (x) x.focus({ preventScroll: true });
}
// Closing marks what was shown as read. refocus: put keyboard focus back on the bell.
function closeBell(refocus) {
  if (!bellPop || bellPop.hidden) return;
  bellPop.hidden = true; bellBtn.setAttribute("aria-expanded", "false");
  setWatch(markRead(getWatch(), null));
  if (refocus) bellBtn.focus();
}
function buildBell() {
  var top = byId("uTop"), before = byId("uTheme"); if (!top) return;
  bellBtn = el("button", { type: "button", class: "u-bell", id: "uBell", "aria-haspopup": "dialog", "aria-expanded": "false", "aria-controls": "uBellPop", title: "Alerts for the teams you watch",
    onclick: function () { if (bellPop.hidden) openBell(); else closeBell(true); } }, [
    svgEl("svg", { viewBox: "0 0 24 24", width: "16", height: "16", "aria-hidden": "true" }, [svgEl("path", { d: "M12 3a5 5 0 0 0-5 5v3.6L5.4 15.5h13.2L17 11.6V8a5 5 0 0 0-5-5zM9.8 18a2.3 2.3 0 0 0 4.4 0z", fill: "currentColor" })]),
    el("span", { class: "u-bell-n", hidden: true, text: "0" })]);
  var ref = before && before.parentNode === top ? before : null;
  // wide screens: the panel sits low in the left column, so the top bar gets a way to it (narrow screens have the Changes tab)
  top.insertBefore(el("button", { type: "button", class: "u-theme u-wcbtn", id: "uChangesBtn", text: "What changed", title: "What is new since your last visit, in 24 hours or in 7 days", onclick: focusChanges }), ref);
  top.insertBefore(bellBtn, ref);
  bellPop = el("div", { class: "u-bellpop", id: "uBellPop", role: "dialog", "aria-labelledby": "u-bell-title", hidden: true });
  toastHost = el("div", { class: "u-toasts", id: "uToasts", role: "log", "aria-live": "polite", "aria-label": "Watchlist alerts" });
  var app = byId("uapp"); app.appendChild(bellPop); app.appendChild(toastHost);
  bellPop.addEventListener("click", function (e) { var t = e.target.closest ? e.target.closest("[data-team]") : null; if (t) { closeBell(false); openTeam(+t.getAttribute("data-team")); } });
  document.addEventListener("click", function (e) { if (!bellPop.hidden && !bellPop.contains(e.target) && !bellBtn.contains(e.target) && document.documentElement.contains(e.target)) closeBell(false); });
  // capture phase: Esc closes only the alerts list when it is open, not the drawer behind it
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !bellPop.hidden) { e.stopPropagation(); closeBell(true); } }, true);
  ROOT.addEventListener("resize", function () { if (!bellPop.hidden) placeBell(); });
}

// ---- visits ----
function saveVisit() { lsSet({ visit: visitState }); }
function noteSim() {
  var s = store.get("sim"); if (!s || !s.r || !visitState) return;
  var v = []; for (var i = 0; i < TEAMS.length; i++) v.push(Math.round(s.r.po[i] / s.r.n * 1000) / 1000);
  visitState.po = { at: Date.now(), mode: s.mode, n: s.r.n, v: v }; visitState.last = Date.now(); saveVisit();
}

// ---- the "What changed" panel ----
function focusChanges() {
  var p = changesPanel; if (!p) return;
  if (store.get("view") !== "universe") store.set({ view: "universe" });
  if (ROOT.matchMedia && ROOT.matchMedia("(max-width: 1099px)").matches) store.set({ mobileTab: "changes" });
  if (p.root.classList.contains("is-collapsed")) p.root.querySelector(".u-collapse").click();
  p.root.scrollIntoView({ behavior: prefersReduced() ? "auto" : "smooth", block: "nearest" });
  p.root.classList.add("is-flash"); setTimeout(function () { p.root.classList.remove("is-flash"); }, 1500);
  var b = p.body.querySelector("[aria-pressed='true']"); if (b) b.focus({ preventScroll: true });
}
function changesCtx() {
  var st = store.get(), P = st.payload, r = st.sim && st.sim.r, po = null;
  if (r) { po = []; for (var i = 0; i < TEAMS.length; i++) po.push(r.po[i] / r.n); }
  return { win: wcWin, now: Date.now(), visit: visitState, events: st.model ? st.model.events : [], focus: st.focus,
    meta: { has: !!P, origin: st.origin, generatedAt: P ? Date.parse(P.generatedAt) : null, fetchedAt: st.fetchedAt, fails: st.pollFails, fixture: !!(st.model && st.model.fixture) },
    sim: po ? { po: po, mode: st.sim.mode, n: r.n } : null, prev: D.prev, history: D.history };
}
function moverList(movers) {
  return el("ul", { class: "u-list u-movers" }, movers.map(function (m) {
    return el("li", {}, [el("button", { type: "button", class: "u-tlink", "data-team": m.team, text: TEAMS[m.team].a }), " " + fmtPct(m.from) + " to " + fmtPct(m.to) + " ",
      el("b", { class: m.delta > 0 ? "u-up" : "u-down", text: "(" + fmtSigned(m.delta * 100, 0) + ")" })]);
  }));
}
function windowPhrase(c) {
  return c.win === "24h" ? "the last 24 hours" : c.win === "7d" ? "the last 7 days" : c.since != null ? "your last visit (" + timeText(c.since) + ")" : "your last visit";
}
function renderChanges() {
  if (!changesPanel) return;
  var c = whatChanged(changesCtx()), st = store.get(), now = c.since != null ? Math.max(Date.now(), refNow()) : Date.now(), fset = focusSet(st.focus);
  var scopeText = c.scope.level === "league" ? "the whole NFL" : c.scope.label + " (the focus; items with no team are left out)";
  changesPanel.render(function (body) {
    body.appendChild(el("div", { class: "u-seg", role: "group", "aria-label": "Window" }, WC_WINDOWS.map(function (w) {
      return el("button", { type: "button", "data-fk": "wc-" + w[0], "aria-pressed": c.win === w[0] ? "true" : "false", text: w[1], onclick: function () { wcWin = w[0]; lsSet({ wcWindow: wcWin }); renderChanges(); } });
    })));
    body.appendChild(el("p", { class: "u-wc-scope", "data-scope": c.scope.id || "NFL" }, [el("b", { text: c.scope.level === "league" ? "NFL" : c.scope.label }), " · " + (c.win === "visit" ? "since " : "") + windowPhrase(c) + ". Showing " + scopeText + "."]));
    if (c.fixture) body.appendChild(el("p", { class: "u-warnline", text: "Fixture data: synthetic items for development, not real news." }));
    // -- events --
    var E = c.events, kids = [];
    if (E.state === "no-baseline") kids.push(el("p", { class: "u-note", "data-wc": "no-baseline", text: "No earlier visit is recorded in this browser (a first visit, or its storage is blocked or was cleared), so there is nothing to compare with. Choose 24 hours or 7 days instead." }));
    else if (E.state === "no-feed") kids.push(el("p", { class: "u-note", "data-wc": "no-feed", text: "No feed data is loaded (no server answered and this build has no snapshot), so new events cannot be listed. That is not the same as nothing happening." }));
    else if (E.state === "not-covered") kids.push(el("p", { class: "u-note", "data-wc": "not-covered", text: "The data on this page was saved " + timeText(E.dataAt) + ", before this window began, so it cannot show what is new in it. That is not the same as nothing happening." }));
    else if (E.state === "none") kids.push(el("p", { class: "u-note", "data-wc": "none", text: "No new events for " + (c.scope.level === "league" ? "the NFL" : c.scope.label) + " in this window in the data on this page." }));
    else {
      kids.push(el("p", { class: "u-wc-total", text: E.total + " new event" + (E.total === 1 ? "" : "s") + ": " + E.groups.map(function (g) { return g.count + " " + g.label.toLowerCase(); }).join(", ") + "." }));
      E.groups.forEach(function (g) {
        var chip = FEED_CHIPS.filter(function (x) { return x[2] && x[2].indexOf(g.type) >= 0; })[0];
        kids.push(el("div", { class: "u-wc-group", "data-type": g.type }, [
          el("h4", {}, [g.label + " ", el("span", { class: "u-wc-n", text: String(g.count) })]),
          el("ul", { class: "u-evlist" }, eventRows(g.top, now).rows),
          g.count > g.top.length ? el("p", { class: "u-note" }, [(g.count - g.top.length) + " more. ",
            c.win !== "visit" && chip ? el("button", { type: "button", class: "u-btn u-small", "data-fk": "wc-feed-" + g.type, text: "Show all in the feed", onclick: function () { store.set({ feedTypes: [chip[0]], timeRange: c.win, mobileTab: "feed" }); } }) : "The most important " + g.top.length + " are shown."]) : null]));
      });
    }
    if (E.state !== "no-baseline" && E.state !== "no-feed" && E.state !== "not-covered") {
      if (E.feedMissing) kids.push(el("p", { class: "u-warnline", text: "No feed data is loaded: only the curated news built into the page is counted." }));
      else if (E.partial) kids.push(el("p", { class: "u-warnline", "data-wc": "partial", text: "The data on this page reaches " + timeText(E.dataAt) + "; anything after that is not in it." }));
    }
    body.appendChild(el("section", { class: "u-wc-sec" }, [el("h3", { text: "New events" }), kids]));
    // -- playoff chances --
    var F = c.forecast, fk = [];
    if (F.state === "waiting") fk.push(el("p", { class: "u-note", text: "Waiting for the simulation." }));
    else if (F.state === "no-baseline") fk.push(el("p", { class: "u-note", "data-wc": "fc-" + F.why, text: F.why === "first-visit" ? "No earlier visit, so no earlier forecast to compare with."
      : F.why === "too-far" ? "The nearest dated forecast on this page is " + (F.baseline.kind === "saved" ? "the one saved " + fmtDateUTC(F.baseline.lo) : "from your visit on " + timeText(F.baseline.lo)) + ", further from the start of this window than the window is long, so no movement is shown for it. Try a longer window."
      : "This page carries no dated forecast to compare with, so no movement can be shown." }));
    else {
      var b = F.baseline, what = b.kind === "saved" ? "the forecast saved " + fmtDateUTC(b.lo) : "the simulation this browser kept from your last visit (" + timeText(b.lo) + ")";
      fk.push(el("p", { class: "u-note", "data-wc": "fc-" + b.rel, text: "Playoff chance now (" + (F.n ? F.n.toLocaleString() + " simulated seasons, " : "") + MODE_NAMES[F.mode] + ") against " + what + "." +
        (b.rel === "older" ? " That forecast is older than this window, so the change includes movement from before it." : b.rel === "inside" ? " That forecast was made after this window began, so earlier movement in the window is not included." : "") +
        (F.modeDiffers ? " The saved forecast used Blend win chances and this simulation uses " + MODE_NAMES[F.mode] + ", so part of any difference is the method." : "") }));
      if (F.movers.length) {
        fk.push(moverList(F.movers));
        fk.push(el("p", { class: "u-note", text: (F.moved > F.movers.length ? "The " + F.movers.length + " largest of " + F.moved + " teams that moved half a point or more. " : "") + (F.noise ? "All of these are under 3 points, which is within simulation noise." : "Differences under 3 points are within simulation noise.") }));
      } else fk.push(el("p", { class: "u-note", text: "No team" + (fset ? " in focus" : "") + " moved by half a point or more against that forecast." }));
    }
    if (c.weekly) {
      fk.push(el("h4", { text: "Week " + c.weekly.prevWeek + " to week " + c.weekly.week }));
      fk.push(c.weekly.movers.length ? moverList(c.weekly.movers) : el("p", { class: "u-note", text: "No team" + (fset ? " in focus" : "") + " moved by half a point or more." }));
      fk.push(el("p", { class: "u-note", text: "From the weekly history, rebuilt after each completed week. Those steps are numbered by week and carry no date on this page; they are listed beside the 7-day window because a week is seven days." }));
    }
    body.appendChild(el("section", { class: "u-wc-sec" }, [el("h3", { text: "Playoff chances" }), fk]));
    body.appendChild(el("p", { class: "u-note", text: "Computed from the data on this page by fixed rules. Descriptive only: none of it feeds the forecast." }));
  });
}
function buildChangesPanel() {
  var left = byId("uTeamsHost"); if (!left || !left.parentNode) return;
  var host = el("div", { class: "u-host", id: "uChangesHost" });
  left.parentNode.insertBefore(host, left.nextSibling);
  var fids = ["rss-*", "espn-*", "curated-news", "nflverse-*", "open-meteo", "nws"];
  changesPanel = Panel({ id: "changes", title: "What changed", sources: fids, badge: buildOrFeedBadge(fids) });
  host.appendChild(changesPanel.root);
  changesPanel.body.addEventListener("click", function (e) { var t = e.target.closest ? e.target.closest("[data-team]") : null; if (t) { e.preventDefault(); openTeam(+t.getAttribute("data-team")); } });
}

// Called once from boot() in 99-boot.js, after the store exists and the other panels are built.
function bootWatch() {
  var saved = lsGet();
  visitState = rollVisit(saved.visit, Date.now()); saveVisit();
  wcWin = WC_WINDOWS.some(function (w) { return w[0] === saved.wcWindow; }) ? saved.wcWindow : visitState.prev != null ? "visit" : "24h";
  store.set({ watch: getWatch() });
  buildBell(); buildChangesPanel();
  store.subscribe(function (st, ch) {
    var has = function () { for (var i = 0; i < arguments.length; i++) if (ch.indexOf(arguments[i]) >= 0) return true; return false; };
    if (has("model")) { visitState.last = Date.now(); saveVisit(); processAlerts(); }
    if (has("sim")) noteSim();
    if (has("watch")) { renderBell(); renderTeamsPanel(); if (st.team) renderDrawer(); }
    if (has("view") && st.view !== "universe") closeBell(false);
    if (has("model", "sim", "focus", "origin", "payload", "pollFails")) renderChanges();
  });
  document.addEventListener("visibilitychange", function () { if (document.hidden && visitState) { visitState.last = Date.now(); saveVisit(); } });
  processAlerts(); renderBell(); renderChanges();
  setInterval(function () { if (store.get("view") === "universe") renderChanges(); }, 5 * 60e3);
}
