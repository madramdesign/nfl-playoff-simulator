// The map: three modes on one SVG (geographic, divisions, intelligence scatter), zoom and pan in geographic mode, and
// the layers from 07-layers.js drawn in registry order. Positions are in the 960x600 map box.
var MAP_W = 960, MAP_H = 600, DETAIL_K = 1.6;

// ---- game helpers shared with the panels ----
var MODE_NAMES = ["Sportsbooks", "Results", "Blend"];
// sources: optional map to read labels from (defaults to the current payload's).
function sourceLabel(id, sources) {
  var S = sources || (store && store.get("payload") ? store.get("payload").sources : null), s = id && hasOwn(S, id) ? S[id] : null;
  return s && typeof s.label === "string" ? s.label : id === "open-meteo" ? "Open-Meteo" : id || "unknown source";
}
// Is this in-progress game live on this page right now (see gameIsLive in 01-data.js)?
function isLiveGame(x) { return !!store && gameIsLive(x, store.get("model"), liveMeta(), Date.now()); }
// Home win chance shown for a game. Live (by the rules above): the feed's in-game chance when it gives one, else this
// page's in-game model; the simulation uses the same number. Otherwise the page's pregame chance. Null when final.
function gameHomeProb(x, live) {
  if (x.state === "post") return null;
  if (x.state === "in" && (live == null ? isLiveGame(x) : live)) {
    if (x.winProb && num(x.winProb.home) != null) return x.winProb.home;
    if (x.gi >= 0 && x.awayScore != null) return pageLiveProb(x);
  }
  if (x.gi >= 0) return modeProb(x.gi);
  var hp = x.odds && x.odds.homeProb; return hp && hp.current != null ? hp.current : null;
}
function gameProbSource(x, live) {
  live = live == null ? x.state === "in" && isLiveGame(x) : live;
  if (live && x.winProb && num(x.winProb.home) != null) return "live, " + sourceLabel(x.winProb.source) + "; the simulation uses this number";
  if (live && x.gi >= 0) return "live, this page's in-game model; the simulation uses this number";
  var pre = x.state === "in" ? "before kickoff; the in-game data is not live, so it is not used" : "";
  if (x.gi >= 0) return MODE_NAMES[MODE] + (LINE[x.gi] != null && MODE !== 1 ? " (posted line)" : " (ratings)") + (pre ? ", " + pre : "");
  return x.odds ? "market, " + sourceLabel(x.odds.source) : "";
}
// "Q3 8:03" when live; with the data's age when an in-progress game is not live on this page.
function staleNote(x) {
  if (x.state !== "in" || isLiveGame(x)) return "";
  var a = store ? gameDataAge(x, store.get("model"), liveMeta(), Date.now()) : null;
  return a == null ? "not live: age unknown" : "last update " + fmtAge(a) + " ago";
}
// Where a game's line comes from, in words: provider, source, and open -> current when an opening line exists.
function lineText(x) {
  var o = x.odds, home = teamAbbr(x.home);
  if (o) {
    var sp = o.spread || {}, tot = o.total || {}, parts = [];
    if (sp.current != null) parts.push(home + " " + fmtSigned(sp.current) + (sp.open != null && sp.open !== sp.current ? " (open " + fmtSigned(sp.open) + ")" : ""));
    if (tot.current != null) parts.push("total " + tot.current + (tot.open != null && tot.open !== tot.current ? " (open " + tot.open + ")" : ""));
    var hasOpen = sp.open != null || tot.open != null || (o.homeProb && o.homeProb.open != null);
    var nv = /^nflverse/.test(o.source || "");
    return { text: parts.join(", ") || "no line", src: (o.provider ? o.provider + ", " : "") + sourceLabel(o.source) + (hasOpen ? ", open → current" : ", current only"),
      short: (nv ? "nflverse, one book" : (o.provider || "Sportsbook") + " via " + sourceLabel(o.source).replace(/\s*\(.*\)$/, "")) + (hasOpen ? ", open → now" : ", current") };
  }
  if (x.gi >= 0 && x.line != null) return { text: "Moneyline " + home + " " + fmtPct(x.line) + (x.total != null ? ", total " + x.total : ""), src: "nflverse, one book, margin removed, as of the build (" + (D.built || "") + ")", short: "nflverse, one book, at build" };
  return { text: "no line posted", src: "", short: "" };
}
// Line movement: the feed's open -> current, else the saved forecast's line -> now. size > 0 means toward the home team.
function gameLineMove(x) {
  var o = x.odds, home = teamAbbr(x.home), away = teamAbbr(x.away);
  if (o && o.homeProb && o.homeProb.open != null && o.homeProb.current != null) {
    var d = o.homeProb.current - o.homeProb.open;
    return { size: d, label: (d > 0 ? home : away) + " ▲" + Math.abs(Math.round(d * 100)), text: "home win chance " + fmtPct(o.homeProb.open) + " at open, " + fmtPct(o.homeProb.current) + " now (" + (o.provider || "") + ", " + sourceLabel(o.source) + ")" };
  }
  if (o && o.spread && o.spread.open != null && o.spread.current != null && o.spread.open !== o.spread.current) {
    var ds = o.spread.current - o.spread.open;
    return { size: -ds / 25, label: (ds < 0 ? home : away) + " " + Math.abs(ds).toFixed(1) + " pts", text: "home spread " + fmtSigned(o.spread.open) + " at open, " + fmtSigned(o.spread.current) + " now (" + (o.provider || "") + ", " + sourceLabel(o.source) + ")" };
  }
  var P = D.prev;
  if (x.gi >= 0 && P && P.lines && P.lines[x.gid] != null && x.line != null) {
    var dl = x.line - P.lines[x.gid];
    return { size: dl, label: (dl > 0 ? home : away) + " ▲" + Math.abs(Math.round(dl * 100)), text: "home win chance " + fmtPct(P.lines[x.gid]) + " in the forecast saved " + P.date + ", " + fmtPct(x.line) + " at the build (nflverse)" };
  }
  return null;
}
function weatherText(w) {
  if (!w) return "";
  var p = [];
  if (w.summary) p.push(w.summary);
  if (w.tempF != null) p.push(Math.round(w.tempF) + "°F");
  if (w.windMph != null) p.push("wind " + Math.round(w.windMph) + " mph" + (w.gustMph != null ? ", gusts " + Math.round(w.gustMph) : ""));
  if (w.precipProb != null) p.push(Math.round(w.precipProb) + "% chance of precipitation");
  if (w.flags && w.flags.length) p.push("flags: " + w.flags.join(", "));
  return p.join(", ");
}
// DEC-013: a visible credit beside weather; Open-Meteo requires the link.
function weatherCredit(srcId) {
  if (srcId === "open-meteo") return el("span", { class: "u-credit" }, ["Weather: ", el("a", { href: "https://open-meteo.com/", target: "_blank", rel: "noopener", text: "Open-Meteo" })]);
  return el("span", { class: "u-credit", text: "Weather: " + sourceLabel(srcId) });
}

// ---- colors: power diverges blue (stronger) / orange (weaker) around grey; momentum green up / red down ----
function mixHex(a, b, t) {
  var pa = [1, 3, 5].map(function (k) { return parseInt(a.slice(k, k + 2), 16); }), pb = [1, 3, 5].map(function (k) { return parseInt(b.slice(k, k + 2), 16); });
  return "#" + pa.map(function (v, k) { var x = Math.round(v + (pb[k] - v) * t).toString(16); return x.length < 2 ? "0" + x : x; }).join("");
}
function powerColor(p) { var t = clamp(p / 8, -1, 1); return t >= 0 ? mixHex("#8b95a7", "#2f7fe8", t) : mixHex("#8b95a7", "#e2711d", -t); }
function momentumColor(m) { if (m == null) return "#8b95a7"; var t = clamp(m / 0.25, -1, 1); return t >= 0 ? mixHex("#8b95a7", "#1fa463", t) : mixHex("#8b95a7", "#d93f3f", -t); }

// ---- positions ----
var GEO_BASE = TEAMS.map(function (t) { return t.stadium && typeof geoProject === "function" ? geoProject(t.stadium.lat, t.stadium.lon) : null; });
var HAS_GEO = GEO_BASE.every(function (p) { return !!p; });
// Two teams sharing a stadium (MetLife, SoFi) get pushed apart on screen so both nodes are visible.
var GEO_OFFSET = TEAMS.map(function () { return 0; });
(function () {
  for (var i = 0; i < NT; i++) for (var j = i + 1; j < NT; j++) {
    if (!GEO_BASE[i] || !GEO_BASE[j]) continue;
    if (Math.abs(GEO_BASE[i][0] - GEO_BASE[j][0]) < 2 && Math.abs(GEO_BASE[i][1] - GEO_BASE[j][1]) < 2) { GEO_OFFSET[i] = -8; GEO_OFFSET[j] = 8; }
  }
})();
var DIV_BLOCKS = (function () {
  var out = [], bw = 214, bh = 262, gap = 12;
  for (var d = 0; d < 8; d++) {
    var conf = d < 4 ? 0 : 1, k = d % 4, x0 = conf ? 494 : 22;
    out.push({ x: x0 + (k % 2) * (bw + gap), y: 44 + Math.floor(k / 2) * (bh + gap), w: bw, h: bh });
  }
  return out;
})();
var view = { k: 1, tx: 0, ty: 0 };
function geoPos(i) { var b = GEO_BASE[i]; return [b[0] * view.k + view.tx + GEO_OFFSET[i], b[1] * view.k + view.ty]; }
function divOrder(po) {
  var ord = [];
  for (var d = 0; d < 8; d++) ord[d] = DIVT[d].slice().sort(function (a, b) { return po ? po[b] - po[a] || teamPower(b) - teamPower(a) : teamPower(b) - teamPower(a); });
  return ord;
}
function intelScale() {
  var mx = 0; for (var i = 0; i < NT; i++) mx = Math.max(mx, Math.abs(teamPower(i)));
  mx = Math.ceil(mx + 0.5);
  return { mx: mx, X: function (v) { return 80 + (v + mx) / (2 * mx) * 840; }, Y: function (v) { return 520 - v * 460; } };
}
function positions(mode, po) {
  if (mode === "geo") return TEAMS.map(function (t, i) { return geoPos(i); });
  if (mode === "div") {
    var ord = divOrder(po), pos = [];
    ord.forEach(function (ts, d) { var b = DIV_BLOCKS[d]; ts.forEach(function (t, k) { pos[t] = [b.x + 26, b.y + 58 + k * 54]; }); });
    return pos;
  }
  var S = intelScale();
  return TEAMS.map(function (t, i) { return [S.X(teamPower(i)), S.Y(po ? po[i] : 0.5)]; });
}

// ---- geometry helpers for layers ----
function arcMid(p, q, bend) { var mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2, dx = q[0] - p[0], dy = q[1] - p[1]; return [mx - dy * bend, my + dx * bend]; }
function arcPath(p, q, bend) { var m = arcMid(p, q, bend); return "M" + p[0].toFixed(1) + " " + p[1].toFixed(1) + "Q" + m[0].toFixed(1) + " " + m[1].toFixed(1) + " " + q[0].toFixed(1) + " " + q[1].toFixed(1); }
function curveMid(p, q, bend) { var m = arcMid(p, q, bend); return [(p[0] + 2 * m[0] + q[0]) / 4, (p[1] + 2 * m[1] + q[1]) / 4]; }
// Neutral site: its projected position, pulled onto the map's edge (with a label) when it lies outside the box.
function neutralSite(x) {
  var v = x.venue, sites = (UT && UT.neutralSites) || {}, s = v && typeof v.name === "string" && hasOwn(sites, v.name) ? sites[v.name] : null;
  if (!s && v && v.city) Object.keys(sites).forEach(function (k) { if (!s && sites[k].city === v.city) s = sites[k]; });
  return s ? { city: s.city, lat: s.lat, lon: s.lon } : null;
}
function gameSitePos(c, x) {
  if (x.neutral && c.mode === "geo") {
    var s = neutralSite(x);
    if (s && typeof geoProject === "function") { var b = geoProject(s.lat, s.lon); return clampToBox([b[0] * view.k + view.tx, b[1] * view.k + view.ty]).p; }
    return null;
  }
  return c.pos[x.home];
}
function clampToBox(p) { var m = 14, q = [clamp(p[0], m, MAP_W - m), clamp(p[1], m, MAP_H - m)]; return { p: q, edge: q[0] !== p[0] || q[1] !== p[1] }; }
function linkMid(c, x) {
  if (x.away == null || x.home == null) return null;
  return curveMid(c.pos[x.away], c.pos[x.home], 0.12);
}
// Draws away -> home (or away -> site <- home for a neutral site in geographic mode). Returns a label point.
function drawGameLink(c, g, x, cls) {
  var p = c.pos[x.away], q = c.pos[x.home], live = x.state === "in" && isLiveGame(x);
  var tip = teamAbbr(x.away) + " at " + teamAbbr(x.home) + (live ? ", live" : x.state === "in" ? ", in progress (" + staleNote(x) + ")" : x.state === "post" ? ", final" : "") + ". Enter opens the game.";
  // one keyboard stop per game: the link itself, or the site marker for a neutral-site game
  var attrs = function (d, focus) { return { d: d, class: cls, "data-game": x.key, "data-tip": tip, tabindex: focus ? "0" : null, role: focus ? "button" : null, "aria-label": focus ? tip : null }; };
  if (x.neutral && c.mode === "geo") {
    var s = neutralSite(x);
    if (s && typeof geoProject === "function") {
      var b = geoProject(s.lat, s.lon), cb = clampToBox([b[0] * view.k + view.tx, b[1] * view.k + view.ty]), sp = cb.p;
      g.appendChild(svgEl("path", attrs(arcPath(p, sp, 0.1), false)));
      g.appendChild(svgEl("path", attrs(arcPath(q, sp, -0.1), false)));
      g.appendChild(svgEl("rect", { x: sp[0] - 5, y: sp[1] - 5, width: 10, height: 10, transform: "rotate(45 " + sp[0].toFixed(1) + " " + sp[1].toFixed(1) + ")", class: "u-site", "data-game": x.key, "data-tip": tip + " Neutral site: " + s.city + ".", tabindex: "0", role: "button", "aria-label": tip + " Neutral site: " + s.city + "." }));
      g.appendChild(svgEl("text", { x: sp[0] + (sp[0] > MAP_W - 120 ? -10 : 10), y: sp[1] + (cb.edge && sp[1] > MAP_H - 30 ? -8 : 4), "text-anchor": sp[0] > MAP_W - 120 ? "end" : "start", class: "u-sitelab", text: s.city + (cb.edge ? " →" : "") }));
      return sp;
    }
    g.appendChild(svgEl("path", attrs(arcPath(p, q, 0.12), true)));
    var mm = curveMid(p, q, 0.12);
    g.appendChild(svgEl("text", { x: mm[0], y: mm[1] + 14, "text-anchor": "middle", class: "u-sitelab", text: "neutral site" }));
    return mm;
  }
  g.appendChild(svgEl("path", attrs(arcPath(p, q, 0.12), true)));
  return curveMid(p, q, 0.12);
}
var BADGE_SLOTS = { ne: [0.75, -0.75], e: [1.15, 0.05], se: [0.75, 0.85], sw: [-0.8, 0.85], nw: [-0.85, -0.75] };
function badgeAt(c, g, i, slot, cls, text, tip, rad) {
  var p = c.pos[i], o = BADGE_SLOTS[slot] || BADGE_SLOTS.e, R = c.r + 5, x = p[0] + o[0] * R, y = p[1] + o[1] * R;
  var r = text ? Math.max(rad || 0, 4 + text.length * 2.4) : Math.min(rad || 3, 4);
  var gg = svgEl("g", { class: "u-badge-g " + cls + (c.dim(i) ? " is-dim" : ""), "data-tip": tip, "data-team": i });
  gg.appendChild(svgEl("circle", { cx: x.toFixed(1), cy: y.toFixed(1), r: r.toFixed(1) }));
  if (text) gg.appendChild(svgEl("text", { x: x.toFixed(1), y: (y + 3).toFixed(1), "text-anchor": "middle", text: text }));
  g.appendChild(gg);
}

// ---- the map component ----
var map = { svg: null, land: null, base: null, layerG: {}, raf: 0, host: null, msg: null, legend: null, tip: null };
function buildMap(host) {
  map.host = host;
  var svg = svgEl("svg", { viewBox: "0 0 " + MAP_W + " " + MAP_H, class: "u-map", role: "group", "aria-label": "League map", preserveAspectRatio: "xMidYMid meet" });
  map.land = svgEl("g", { class: "u-land" });
  if (typeof GEO !== "undefined") GEO.states.forEach(function (s) { map.land.appendChild(svgEl("path", { d: s[1], "data-state": s[0] })); });
  map.base = svgEl("g", { class: "u-base" });
  svg.appendChild(map.land); svg.appendChild(map.base);
  LAYERS.forEach(function (l) { var g = svgEl("g", { class: "u-layer u-layer-" + l.id }); map.layerG[l.id] = g; svg.appendChild(g); });
  map.svg = svg;
  var ctl = el("div", { class: "u-mapctl", role: "group", "aria-label": "Zoom" }, [
    el("button", { type: "button", "aria-label": "Zoom in", text: "+", onclick: function () { zoomAt(MAP_W / 2, MAP_H / 2, 1.5); } }),
    el("button", { type: "button", "aria-label": "Zoom out", text: "−", onclick: function () { zoomAt(MAP_W / 2, MAP_H / 2, 1 / 1.5); } }),
    el("button", { type: "button", "aria-label": "Reset zoom", text: "↺", onclick: function () { view.k = 1; view.tx = 0; view.ty = 0; drawMapSoon(); } })]);
  map.msg = el("div", { class: "u-mapmsg", role: "status" });
  map.legend = el("details", { class: "u-legend" }, [el("summary", { text: "Legend" }), el("div", { class: "u-lgbody" })]);
  map.legend.addEventListener("toggle", function () { if (!map.legendSync) lsSet({ legend: map.legend.open ? 1 : 0 }); });
  map.tip = el("div", { class: "u-tip", role: "tooltip", hidden: true });
  clearNode(host);
  host.appendChild(el("div", { class: "u-mapwrap" }, [svg, ctl, map.msg, map.legend, map.tip]));
  wireMapInput(svg);
}
function toBox(evt) {
  var m = map.svg.getScreenCTM(); if (!m) return [MAP_W / 2, MAP_H / 2];
  var pt = map.svg.createSVGPoint(); pt.x = evt.clientX; pt.y = evt.clientY; var r = pt.matrixTransform(m.inverse()); return [r.x, r.y];
}
function clampView() {
  if (view.k <= 1) { view.k = 1; view.tx = 0; view.ty = 0; return; }
  view.tx = clamp(view.tx, MAP_W - MAP_W * view.k, 0); view.ty = clamp(view.ty, MAP_H - MAP_H * view.k, 0);
}
function zoomAt(x, y, f) {
  if (store.get("mode") !== "geo") return;
  var k2 = clamp(view.k * f, 1, 8); f = k2 / view.k;
  view.tx = x - (x - view.tx) * f; view.ty = y - (y - view.ty) * f; view.k = k2; clampView(); drawMapSoon();
}
function wireMapInput(svg) {
  var pts = {}, last = null, moved = 0, pinch = null;
  svg.addEventListener("wheel", function (e) {
    if (store.get("mode") !== "geo") return;
    e.preventDefault(); var p = toBox(e); zoomAt(p[0], p[1], Math.exp(-clamp(e.deltaY, -120, 120) * 0.0022));
  }, { passive: false });
  svg.addEventListener("pointerdown", function (e) {
    pts[e.pointerId] = [e.clientX, e.clientY]; moved = 0; last = toBox(e);
    var ids = Object.keys(pts);
    if (ids.length === 2) { var a = pts[ids[0]], b = pts[ids[1]]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), k: view.k }; }
  });
  svg.addEventListener("pointermove", function (e) {
    if (!pts[e.pointerId]) { showTip(e); return; }
    pts[e.pointerId] = [e.clientX, e.clientY];
    var ids = Object.keys(pts);
    if (store.get("mode") !== "geo") return;
    if (ids.length === 2 && pinch) {
      var a = pts[ids[0]], b = pts[ids[1]], d = Math.hypot(a[0] - b[0], a[1] - b[1]);
      var mid = toBox({ clientX: (a[0] + b[0]) / 2, clientY: (a[1] + b[1]) / 2 });
      zoomAt(mid[0], mid[1], (pinch.k * d / pinch.d) / view.k); moved = 99; return;
    }
    var p = toBox(e);
    if (last && view.k > 1) { var dx = p[0] - last[0], dy = p[1] - last[1]; moved += Math.abs(dx) + Math.abs(dy); if (moved > 3) { try { svg.setPointerCapture(e.pointerId); } catch (er) { /* ignore */ } view.tx += dx; view.ty += dy; clampView(); drawMapSoon(); } }
    last = p;
  });
  var end = function (e) { delete pts[e.pointerId]; if (Object.keys(pts).length < 2) pinch = null; last = null; };
  svg.addEventListener("pointerup", end); svg.addEventListener("pointercancel", end);
  svg.addEventListener("pointerleave", function () { if (map.tip) map.tip.hidden = true; });
  svg.addEventListener("click", function (e) {
    if (moved > 3) { moved = 0; return; }
    var t = e.target.closest ? e.target.closest("[data-team],[data-game],[data-gi]") : null;
    if (!t) return;
    if (t.hasAttribute("data-team")) openTeam(+t.getAttribute("data-team"));
    else if (t.hasAttribute("data-game")) openGame(t.getAttribute("data-game"));
    else if (t.hasAttribute("data-gi")) openGame(GAMES[+t.getAttribute("data-gi")][0]);
  });
  svg.addEventListener("keydown", function (e) {
    var t = e.target; if (!(e.key === "Enter" || e.key === " ") || !t.hasAttribute) return;
    if (t.hasAttribute("data-team")) { e.preventDefault(); openTeam(+t.getAttribute("data-team")); }
    else if (t.hasAttribute("data-game")) { e.preventDefault(); openGame(t.getAttribute("data-game")); }
    else if (t.hasAttribute("data-gi")) { e.preventDefault(); openGame(GAMES[+t.getAttribute("data-gi")][0]); }
  });
  svg.addEventListener("focusin", function (e) { var t = e.target; if (t.getAttribute && t.getAttribute("data-tip")) placeTip(t.getAttribute("data-tip"), t.getBoundingClientRect()); });
  svg.addEventListener("focusout", function () { map.tip.hidden = true; });
}
function showTip(e) {
  var t = e.target.closest ? e.target.closest("[data-tip]") : null;
  if (!t) { map.tip.hidden = true; return; }
  placeTip(t.getAttribute("data-tip"), { left: e.clientX, top: e.clientY, width: 0, height: 0 });
}
function placeTip(text, r) {
  var wrap = map.host.getBoundingClientRect(), tip = map.tip;
  tip.textContent = text; tip.hidden = false;
  var x = r.left - wrap.left + r.width / 2 + 12, y = r.top - wrap.top + r.height / 2 + 12;
  if (x + 280 > wrap.width) x = Math.max(4, x - 300);
  if (y + tip.offsetHeight > wrap.height) y = Math.max(4, y - tip.offsetHeight - 24);
  tip.style.left = x + "px"; tip.style.top = y + "px";
}
function drawMapSoon() { if (map.raf) return; map.raf = (ROOT.requestAnimationFrame || setTimeout)(function () { map.raf = 0; drawMap(); }); }
function drawBase(mode, po) {
  var b = map.base; clearNode(b);
  map.land.style.display = mode === "geo" ? "" : "none";
  map.land.setAttribute("transform", "translate(" + view.tx.toFixed(2) + "," + view.ty.toFixed(2) + ") scale(" + view.k.toFixed(4) + ")");
  if (mode === "div") {
    b.appendChild(svgEl("text", { x: 22, y: 30, class: "u-conflabel u-conf0", text: "AFC" }));
    b.appendChild(svgEl("text", { x: 494, y: 30, class: "u-conflabel u-conf1", text: "NFC" }));
    var ord = divOrder(po);
    ord.forEach(function (ts, d) {
      var bl = DIV_BLOCKS[d];
      b.appendChild(svgEl("rect", { x: bl.x, y: bl.y, width: bl.w, height: bl.h, rx: 8, class: "u-divbox" }));
      b.appendChild(svgEl("text", { x: bl.x + 12, y: bl.y + 22, class: "u-divlabel", text: TM[DIVT[d][0]].dn }));
      ts.forEach(function (t, k) {
        var y = bl.y + 58 + k * 54, x0 = bl.x + 44, x1 = bl.x + bl.w - 12, v = po ? po[t] : null;
        b.appendChild(svgEl("text", { x: x0, y: y - 4, class: "u-divteam", text: TEAMS[t].a + " " + TEAMS[t].nick }));
        b.appendChild(svgEl("text", { x: x1, y: y - 4, class: "u-divpct", "text-anchor": "end", text: v == null ? "…" : fmtPct(v) }));
        b.appendChild(svgEl("rect", { x: x0, y: y + 3, width: x1 - x0, height: 5, rx: 2.5, class: "u-bartrack" }));
        if (v != null && v > 0.003) b.appendChild(svgEl("rect", { x: x0, y: y + 3, width: Math.max(2, (x1 - x0) * v).toFixed(1), height: 5, rx: 2.5, class: "u-barfill" }));
        b.appendChild(svgEl("text", { x: x0, y: y + 21, class: "u-divsub", text: recStr(recordOf(t, store.get("model"))) + " · power " + fmtSigned(teamPower(t)) }));
      });
    });
  } else if (mode === "intel") {
    var S = intelScale();
    for (var v = -S.mx; v <= S.mx; v += S.mx > 6 ? 2 : 1) {
      b.appendChild(svgEl("line", { x1: S.X(v), x2: S.X(v), y1: S.Y(0), y2: S.Y(1), class: v === 0 ? "u-axis0" : "u-grid" }));
      b.appendChild(svgEl("text", { x: S.X(v), y: S.Y(0) + 16, "text-anchor": "middle", class: "u-tick", text: fmtSigned(v, 0) || "0" }));
    }
    [0, 0.25, 0.5, 0.75, 1].forEach(function (p) {
      b.appendChild(svgEl("line", { x1: S.X(-S.mx), x2: S.X(S.mx), y1: S.Y(p), y2: S.Y(p), class: p === 0.5 ? "u-axis0" : "u-grid" }));
      b.appendChild(svgEl("text", { x: S.X(-S.mx) - 8, y: S.Y(p) + 4, "text-anchor": "end", class: "u-tick", text: Math.round(p * 100) + "%" }));
    });
    b.appendChild(svgEl("text", { x: S.X(0), y: S.Y(0) + 36, "text-anchor": "middle", class: "u-axislab", text: "Team power: points per game vs an average team (spread and results ratings blended)" }));
    b.appendChild(svgEl("text", { x: 18, y: S.Y(0.5), "text-anchor": "middle", class: "u-axislab", transform: "rotate(-90 18 " + S.Y(0.5) + ")", text: "Playoff chance (simulation)" }));
    [[S.X(S.mx), S.Y(1) - 14, "end", "Stronger and likely in \u2197"], [S.X(-S.mx), S.Y(1) - 14, "start", "\u2196 Likely in, rated weaker"],
     [S.X(S.mx), S.Y(0) + 58, "end", "Stronger but on the outside \u2198"], [S.X(-S.mx), S.Y(0) + 58, "start", "\u2199 Weaker and likely out"]].forEach(function (q) {
      b.appendChild(svgEl("text", { x: q[0], y: q[1], "text-anchor": q[2], class: "u-quad", text: q[3] }));
    });
  }
}
function drawMap() {
  if (!map.svg) return;
  var st = store.get(), mode = st.mode, simr = st.sim && st.sim.r, po = simr ? Array.prototype.map.call(simr.po, function (v) { return v / simr.n; }) : null;
  if (mode === "geo" && !HAS_GEO) mode = "div";
  map.svg.setAttribute("data-mode", mode);
  var q = (st.search || "").trim().toLowerCase(), match = q ? searchTeams(q) : null, selTeam = st.team != null && TIDX[st.team] != null ? TIDX[st.team] : null;
  var now = refNow(), ctx = {
    mode: mode, k: mode === "geo" ? view.k : 1, detail: mode !== "geo" || view.k >= DETAIL_K, pos: positions(mode, po), po: po, r0: simr || null,
    r: mode === "div" ? 9 : mode === "intel" ? 7.5 : 6.5, M: st.model, now: now, range: st.timeRange,
    events: searchEvents(filterByTime(st.model ? st.model.events : [], st.timeRange, now), q), sel: { team: selTeam, game: st.game },
    dim: function (i) { return !!match && !match[i]; }
  };
  drawBase(mode, po);
  LAYERS.forEach(function (l) {
    var g = map.layerG[l.id]; clearNode(g);
    var on = st.layers.indexOf(l.id) >= 0 && l.modes.indexOf(mode) >= 0;
    g.style.display = on ? "" : "none";
    if (!on) return;
    try { l.render(ctx, g); } catch (e) { uReport("layer " + l.id, e); }
  });
  map.msg.textContent = mode === "intel" && !po ? "Simulating seasons for the playoff chances…" : mode === "geo" && !HAS_GEO ? "Map outlines unavailable" : "";
  map.msg.hidden = !map.msg.textContent;
  drawLegend(mode, st);
}
function drawLegend(mode, st) {
  var L = map.legend.querySelector(".u-lgbody"); clearNode(L);
  // open by default only on wide screens in geographic mode (where the corner is empty); a choice the viewer made sticks
  var pref = lsGet().legend, wide = !!(ROOT.matchMedia && ROOT.matchMedia("(min-width: 1100px)").matches), want = pref === 1 || pref === 0 ? pref === 1 : wide && mode === "geo";
  if (map.legend.open !== want && map.legendMode !== mode) { map.legendSync = true; map.legend.open = want; setTimeout(function () { map.legendSync = false; }, 0); }
  map.legendMode = mode;
  var on = function (id) { return st.layers.indexOf(id) >= 0 && layerById(id).modes.indexOf(mode) >= 0; };
  var row = function (sw, text) { return el("div", { class: "u-lgrow" }, [sw, el("span", { text: text })]); };
  var grad = function (a, b, c) { return el("span", { class: "u-lgrad", style: { background: "linear-gradient(90deg," + a + "," + b + "," + c + ")" } }); };
  if (on("teams")) L.appendChild(mode === "intel" ? row(grad("#d93f3f", "#8b95a7", "#1fa463"), "Node color: playoff chance last week, down to up (momentum)") : row(grad("#e2711d", "#8b95a7", "#2f7fe8"), "Node color: power, weaker to stronger"));
  if (on("playoff")) L.appendChild(row(el("span", { class: "u-lsw u-lsw-ring" }), "Ring: playoff chance"));
  if (on("live") || on("upcoming") || on("final")) L.appendChild(row(el("span", { class: "u-lsw u-lsw-link" }), "Line: away to home this week; red is live"));
  if (on("injuries") || on("news") || on("qb") || on("transactions")) L.appendChild(row(el("span", { class: "u-lsw u-lsw-badges" }), "Badges: injuries, news, transactions, QB (descriptive)"));
  if (on("weather")) L.appendChild(el("div", { class: "u-lgrow" }, [el("span", { class: "u-lsw u-lsw-wx" }), weatherCredit("open-meteo")]));
  if (mode === "geo") L.appendChild(el("div", { class: "u-lgrow u-lgnote", text: view.k >= DETAIL_K ? "Zoomed in: team labels and counts" : "Zoom in for team labels and counts" }));
}
function searchTeams(q) {
  var m = {}, any = false;
  TEAMS.forEach(function (t, i) {
    var hay = [t.a, t.name, t.nick, t.div, t.conf, t.stadium ? t.stadium.city : ""].concat(t.aliases).join(" ").toLowerCase();
    if (hay.indexOf(q) >= 0) { m[i] = 1; any = true; }
  });
  return any ? m : {};
}
function searchEvents(evs, q) {
  if (!q) return evs;
  var tm = searchTeams(q);
  return evs.filter(function (e) {
    if (e.teams.some(function (t) { return tm[t]; })) return true;
    var hay = (e.title + " " + e.publisher + " " + e.players.map(function (p) { return p.name || ""; }).join(" ")).toLowerCase();
    return hay.indexOf(q) >= 0;
  });
}
// "Now" for time filters: the later of this computer's clock and the payload's own time, so a server clock a little
// ahead of the browser does not hide fresh items.
function refNow() {
  var t = Date.now(), P = store.get("payload");
  if (P) { var g = Date.parse(P.generatedAt); if (isFinite(g) && g > t) return g; }
  return t;
}
NFLU.powerColor = powerColor; NFLU.lineText = lineText; NFLU.gameLineMove = gameLineMove; NFLU.gameHomeProb = gameHomeProb;
