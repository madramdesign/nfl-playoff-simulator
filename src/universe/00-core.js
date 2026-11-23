// NFL Universe core: namespace, DOM helpers, a small store, formatting, time ranges and URL state.
// Everything in this file is pure or touches the page only when called. The closure exposes NFLU on the global object
// so test/universe.test.js can reach the pure functions without a DOM.
var ROOT = typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : this;
var HAS_DOM = typeof document !== "undefined" && typeof document.createElement === "function";
var NFLU = ROOT.NFLU = { version: 1, booted: false };
var SVGNS = "http://www.w3.org/2000/svg";

// ---- DOM helpers ----
function setAttrs(e, a, isSvg) {
  if (!a) return;
  for (var k in a) {
    var v = a[k];
    if (v == null || v === false) continue;
    if (k === "text") e.textContent = v;
    else if (k === "class") { if (isSvg) e.setAttribute("class", v); else e.className = v; }
    else if (k.slice(0, 2) === "on" && typeof v === "function") e.addEventListener(k.slice(2), v);
    else if (k === "style" && typeof v === "object") { for (var p in v) e.style.setProperty(p, v[p]); }
    // links come from outside feeds: only web addresses, never javascript: or data: URLs
    else if ((k === "href" || k === "src") && !/^(https?:\/\/|#|\?|\/[^\/])/i.test(String(v))) continue;
    else if (k.slice(0, 2) === "on") continue;
    else e.setAttribute(k, v === true ? "" : String(v));
  }
}
function addKids(e, kids) {
  if (kids == null || kids === false) return;
  if (!Array.isArray(kids)) kids = [kids];
  for (var i = 0; i < kids.length; i++) {
    var k = kids[i];
    if (k == null || k === false) continue;
    if (Array.isArray(k)) addKids(e, k);
    else e.appendChild(typeof k === "object" ? k : document.createTextNode(String(k)));
  }
}
function el(tag, attrs, kids) { var e = document.createElement(tag); setAttrs(e, attrs, false); addKids(e, kids); return e; }
function svgEl(tag, attrs, kids) { var e = document.createElementNS(SVGNS, tag); setAttrs(e, attrs, true); addKids(e, kids); return e; }
function byId(id) { return document.getElementById(id); }
function clearNode(n) { while (n && n.firstChild) n.removeChild(n.firstChild); return n; }
function uReport(where, err) { try { console.error("[NFL Universe] " + where + ":", err); } catch (e) { /* no console */ } }

// ---- store: one state object, shallow patches, subscribers told which keys changed ----
function createStore(init) {
  var st = Object.assign({}, init), subs = [];
  return {
    get: function (k) { return k ? st[k] : st; },
    set: function (patch) {
      var ch = [];
      for (var k in patch) if (st[k] !== patch[k]) { st[k] = patch[k]; ch.push(k); }
      if (ch.length) subs.slice().forEach(function (f) { try { f(st, ch); } catch (e) { uReport("subscriber", e); } });
      return ch;
    },
    subscribe: function (f) { subs.push(f); return function () { var i = subs.indexOf(f); if (i >= 0) subs.splice(i, 1); }; }
  };
}

// ---- formatting (all inputs are numbers from D, the payload or a simulation) ----
var MON3 = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function fmtPct(x) { if (x == null || !isFinite(x)) return "–"; var v = x * 100; return v <= 0 ? "0%" : v < 1 ? "<1%" : v >= 100 ? "100%" : v > 99 ? ">99%" : Math.round(v) + "%"; }
function fmtSigned(v, dec) { if (v == null || !isFinite(v)) return "–"; var s = Math.abs(v).toFixed(dec == null ? 1 : dec); return (+s === 0 ? "" : v > 0 ? "+" : "−") + s; }
function fmtAge(sec) {
  if (sec == null || !isFinite(sec)) return "unknown age";
  sec = Math.max(0, Math.round(sec));
  if (sec < 60) return sec + "s"; if (sec < 3600) return Math.round(sec / 60) + "m"; if (sec < 86400 * 2) return Math.round(sec / 3600) + "h";
  return Math.round(sec / 86400) + "d";
}
function fmtDateUTC(ms) { var d = new Date(ms); return MON3[d.getUTCMonth()] + " " + d.getUTCDate(); }
function fmtRel(ms, now, dateOnly) {
  if (ms == null || !isFinite(ms)) return "";
  if (dateOnly) return fmtDateUTC(ms);
  var s = (now - ms) / 1000;
  if (s < 45) return "now"; if (s < 3600) return Math.round(s / 60) + "m"; if (s < 86400) return Math.round(s / 3600) + "h";
  if (s < 7 * 86400) return Math.round(s / 86400) + "d";
  var d = new Date(ms); return MON3[d.getMonth()] + " " + d.getDate();
}
function fmtKick(iso) {
  var t = Date.parse(iso); if (!isFinite(t)) return "";
  var d = new Date(t);
  try { return d.toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit", timeZoneName: "short" }); } catch (e) { return d.toString().slice(0, 21); }
}

// ---- time ranges: one enum, one filter, shared by the map and every panel ----
var TIME_RANGES = ["live", "1h", "6h", "12h", "24h", "48h", "7d", "30d", "season"];
var HOUR = 3600e3;
var RANGE_MS = { live: 30 * 60e3, "1h": HOUR, "6h": 6 * HOUR, "12h": 12 * HOUR, "24h": 24 * HOUR, "48h": 48 * HOUR, "7d": 168 * HOUR, "30d": 720 * HOUR, season: Infinity };
var RANGE_LABEL = { live: "Live", "1h": "1 hour", "6h": "6 hours", "12h": "12 hours", "24h": "24 hours", "48h": "48 hours", "7d": "7 days", "30d": "30 days", season: "Season" };
var RANGE_PHRASE = { live: "in the last 30 minutes", "1h": "in the last hour", "6h": "in the last 6 hours", "12h": "in the last 12 hours", "24h": "in the last 24 hours",
  "48h": "in the last 48 hours", "7d": "in the last 7 days", "30d": "in the last 30 days", season: "this season" };
var DEFAULT_RANGE = "7d";
var FUTURE_SKEW_MS = 5 * 60e3;   // items stamped up to five minutes ahead (clock skew) still count as now

function itemTime(x) {
  if (x == null) return NaN;
  if (typeof x.tsMs === "number") return x.tsMs;
  if (typeof x.ts === "number") return x.ts;
  if (typeof x.ts === "string") return Date.parse(x.ts);
  return NaN;
}
// items: anything with ts (ISO or ms) or tsMs; in-progress games (state "in") always pass the live range.
function filterByTime(items, range, now) {
  if (TIME_RANGES.indexOf(range) < 0) range = DEFAULT_RANGE;
  if (!Array.isArray(items)) return [];
  if (range === "season") return items.slice();
  var span = RANGE_MS[range];
  return items.filter(function (x) {
    if (range === "live" && x && (x.state === "in" || x.live === true)) return true;
    var t = itemTime(x);
    if (!isFinite(t)) return false;
    return t >= now - span && t <= now + FUTURE_SKEW_MS;
  });
}

// ---- URL state ----
var VIEWS = ["universe", "sim"];
var MAP_MODES = ["geo", "div", "intel"];
var URL_KEYS = ["view", "mode", "layers", "timeRange", "focus", "team", "game"];
var GAME_ID_RE = /^[A-Za-z0-9_-]{1,40}$/;
var LAYER_ID_RE = /^[a-z][a-z0-9-]{0,23}$/;

function parseQuery(search) {
  var out = {};
  String(search || "").replace(/^\?/, "").split("&").forEach(function (part) {
    if (!part) return;
    var i = part.indexOf("="), k = i < 0 ? part : part.slice(0, i), v = i < 0 ? "" : part.slice(i + 1);
    try { k = decodeURIComponent(k.replace(/\+/g, " ")); v = decodeURIComponent(v.replace(/\+/g, " ")); } catch (e) { return; }
    if (!(k in out)) out[k] = v;
  });
  return out;
}
function uniqList(a) { var o = []; a.forEach(function (x) { if (o.indexOf(x) < 0) o.push(x); }); return o; }
// raw: {key: string} (from the URL) or values saved earlier (layers may be an array). Anything not on an allowlist is dropped.
// allow: {teams: [abbr], layers: [id], focus: [id]}; without lists, the shape checks above are used.
function sanitizeState(raw, allow) {
  allow = allow || {}; raw = raw || {};
  var out = {};
  if (VIEWS.indexOf(raw.view) >= 0) out.view = raw.view;
  if (MAP_MODES.indexOf(raw.mode) >= 0) out.mode = raw.mode;
  if (TIME_RANGES.indexOf(raw.timeRange) >= 0) out.timeRange = raw.timeRange;
  if (raw.layers != null) {
    var L = Array.isArray(raw.layers) ? raw.layers : String(raw.layers) === "none" ? [] : String(raw.layers).split(",");
    if (Array.isArray(raw.layers) || String(raw.layers) === "none") {
      out.layers = uniqList(L.filter(function (id) { return allow.layers ? allow.layers.indexOf(id) >= 0 : LAYER_ID_RE.test(id); }));
    } else {
      var ok = uniqList(L.filter(function (id) { return allow.layers ? allow.layers.indexOf(id) >= 0 : LAYER_ID_RE.test(id); }));
      if (ok.length) out.layers = ok;
    }
  }
  if (typeof raw.team === "string" && raw.team) {
    var t = raw.team.toUpperCase();
    if (allow.teams ? allow.teams.indexOf(t) >= 0 : /^[A-Z]{2,3}$/.test(t)) out.team = t;
  }
  if (typeof raw.focus === "string" && raw.focus) {
    var f = raw.focus.toUpperCase();
    if (allow.focus ? allow.focus.indexOf(f) >= 0 : /^[A-Z]{2,3}(-[A-Z]{4,5})?$/.test(f)) out.focus = f;
  }
  if (typeof raw.game === "string" && GAME_ID_RE.test(raw.game)) out.game = raw.game;
  return out;
}
function parseUrlState(search, allow) { return sanitizeState(parseQuery(search), allow); }
function sameList(a, b) { if (!a || !b || a.length !== b.length) return false; for (var i = 0; i < a.length; i++) if (b.indexOf(a[i]) < 0) return false; return true; }
// Our keys only, defaults left out so shared links stay short. extra: other query parameters to keep, as [[k, v]].
function serializeUrlState(st, defaults, extra) {
  defaults = defaults || {};
  var parts = [];
  (extra || []).forEach(function (kv) { if (URL_KEYS.indexOf(kv[0]) < 0) parts.push(encodeURIComponent(kv[0]) + "=" + encodeURIComponent(kv[1])); });
  URL_KEYS.forEach(function (k) {
    var v = st[k];
    if (v == null || v === "") return;
    if (k === "layers") {
      if (defaults.layers && sameList(v, defaults.layers)) return;
      parts.push("layers=" + (v.length ? v.map(encodeURIComponent).join(",") : "none"));
      return;
    }
    if (defaults[k] === v) return;
    parts.push(k + "=" + encodeURIComponent(v));
  });
  return parts.length ? "?" + parts.join("&") : "";
}

// ---- saved preferences (per browser; never required) ----
var LS_KEY = "nflu-v1";
function lsGet() { try { var o = JSON.parse(ROOT.localStorage.getItem(LS_KEY) || "{}"); return o && typeof o === "object" ? o : {}; } catch (e) { return {}; } }
function lsSet(patch) { try { var o = lsGet(); for (var k in patch) o[k] = patch[k]; ROOT.localStorage.setItem(LS_KEY, JSON.stringify(o)); } catch (e) { /* storage blocked */ } }

var urlTimer = 0;
function writeUrlSoon(st, defaults) {
  if (!HAS_DOM || !ROOT.history || !ROOT.history.replaceState) return;
  clearTimeout(urlTimer);
  urlTimer = setTimeout(function () {
    try {
      var q = parseQuery(location.search), extra = [];
      for (var k in q) extra.push([k, q[k]]);
      var qs = serializeUrlState(st, defaults, extra);
      if (qs !== location.search && !(qs === "" && location.search === "?")) ROOT.history.replaceState(null, "", location.pathname + qs + location.hash);
    } catch (e) { /* file: pages in some browsers refuse; the state still lives in the page */ }
  }, 250);
}

Object.assign(NFLU, { TIME_RANGES: TIME_RANGES, RANGE_MS: RANGE_MS, DEFAULT_RANGE: DEFAULT_RANGE, filterByTime: filterByTime, parseQuery: parseQuery,
  sanitizeState: sanitizeState, parseUrlState: parseUrlState, serializeUrlState: serializeUrlState, VIEWS: VIEWS, MAP_MODES: MAP_MODES,
  createStore: createStore, fmtPct: fmtPct, fmtAge: fmtAge, fmtSigned: fmtSigned, setAttrs: setAttrs });
