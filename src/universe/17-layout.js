// Panel layout: the viewer can move panels (drag a header, or the grip and arrow keys), hide and show them (the Panels
// menu), resize them (bottom and right edges) and change the map's share of the width (the divider). The layout is
// saved per browser under "layout" in the saved preferences; storage may be blocked or empty, so every read goes through
// sanitizeLayout, which keeps only known panel ids and clamped sizes (the same allowlisting as URL state) and falls back
// to the defaults. The first half of this file is pure (tested in test/layout.test.js); the second half touches the page
// and runs only from boot.
//
// Wide screens (>= 1100 px) have three zones: the left column (under the map controls), the panel column (right of the
// map) and the bottom row. A zone is one column, or a grid when it is wide enough (the bottom row; the panel column once
// the divider makes it wider), where a panel can also span columns. Phones keep one panel at a time behind tabs; there
// the order is the tab order (`tabs`), which is separate from the wide arrangement, and hiding applies to both.
var LAYOUT_V = 1;
var LAYOUT_ZONES = ["left", "right", "bottom"];
var ZONE_LABEL = { left: "left column", right: "panel column", bottom: "bottom row" };
var PANEL_IDS = ["feed", "media", "tv", "games", "teams", "health"];   // also the default tab order on phones
var PANEL_NAMES = { feed: "Intelligence feed", media: "Media", tv: "NFL TV", games: "Games", teams: "Teams", health: "System health" };
var DEFAULT_ZONES = { left: ["teams"], right: ["tv", "feed", "media", "health"], bottom: ["games"] };
// Sizes in CSS pixels. The grid numbers must match the wide layout in 00-universe.css: a 252 px left column, a
// zero-width divider track and three 8 px gaps, a map at least 320 px and a panel column at least 300 px wide.
var LIM = { minH: 120, maxH: 1600, stepH: 20, maxSpan: 4, minSplit: 0.3, maxSplit: 0.9, stepSplit: 0.02, colMin: 300, gap: 8,
  fixedW: 276, mapMin: 320, panMin: 300, defPanW: 384 };

// ---- pure ----
function clampH(h) { return Math.max(LIM.minH, Math.min(LIM.maxH, Math.round(h))); }
function clampSpan(w) { return Math.max(1, Math.min(LIM.maxSpan, Math.round(w))); }
function clampSplit(s) { return Math.round(Math.max(LIM.minSplit, Math.min(LIM.maxSplit, s)) * 1000) / 1000; }
function layoutIds(ids) { return Array.isArray(ids) && ids.length ? ids : PANEL_IDS; }
function copyLayout(L) { return JSON.parse(JSON.stringify(L)); }
function sameLayout(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
// keeps known, unique ids in order; `seen` is shared so one id cannot sit in two zones
function cleanIdList(a, ids, seen) {
  var out = [];
  if (!Array.isArray(a)) return out;
  for (var i = 0; i < a.length && i < 64; i++) {
    var id = a[i];
    if (typeof id === "string" && ids.indexOf(id) >= 0 && !seen[id]) { seen[id] = 1; out.push(id); }
  }
  return out;
}
function defaultLayout(ids) {
  ids = layoutIds(ids);
  var seen = {}, out = { v: LAYOUT_V, zones: {}, tabs: [], hidden: [], sizes: {}, split: null };
  LAYOUT_ZONES.forEach(function (z) { out.zones[z] = cleanIdList(DEFAULT_ZONES[z], ids, seen); });
  ids.forEach(function (id) { if (!seen[id]) { seen[id] = 1; out.zones.right.push(id); } });   // a panel with no default place
  out.tabs = cleanIdList(PANEL_IDS.concat(ids), ids, {});
  return out;
}
// raw: whatever was saved (or nothing). Returns a complete layout over exactly `ids`.
function sanitizeLayout(raw, ids) {
  ids = layoutIds(ids);
  var def = defaultLayout(ids);
  if (!raw || typeof raw !== "object" || Array.isArray(raw) || raw.v !== LAYOUT_V) return def;
  var out = { v: LAYOUT_V, zones: {}, tabs: [], hidden: [], sizes: {}, split: null }, seen = {}, ts = {};
  var rz = raw.zones && typeof raw.zones === "object" && !Array.isArray(raw.zones) ? raw.zones : null;
  LAYOUT_ZONES.forEach(function (z) { out.zones[z] = cleanIdList(rz ? rz[z] : def.zones[z], ids, seen); });
  // a panel the saved layout does not place (one added since it was saved) goes where the defaults put it: in its default
  // zone, before the next panel the defaults put after it (so NFL TV, first by default, arrives at the top)
  LAYOUT_ZONES.forEach(function (z) {
    var dz = def.zones[z];
    dz.forEach(function (id, k) {
      if (seen[id]) return;
      seen[id] = 1;
      var next = dz.slice(k + 1).map(function (x) { return out.zones[z].indexOf(x); }).filter(function (i) { return i >= 0; })[0];
      if (next == null) out.zones[z].push(id); else out.zones[z].splice(next, 0, id);
    });
  });
  out.tabs = cleanIdList(raw.tabs, ids, ts);
  def.tabs.forEach(function (id) { if (!ts[id]) out.tabs.push(id); });
  out.hidden = cleanIdList(raw.hidden, ids, {});
  if (out.hidden.length >= ids.length) out.hidden = [];   // never everything hidden
  var rs = raw.sizes && typeof raw.sizes === "object" && !Array.isArray(raw.sizes) ? raw.sizes : null;
  if (rs) ids.forEach(function (id) {
    var s = Object.prototype.hasOwnProperty.call(rs, id) ? rs[id] : null, e = {};
    if (!s || typeof s !== "object") return;
    if (typeof s.h === "number" && isFinite(s.h)) e.h = clampH(s.h);
    if (typeof s.w === "number" && isFinite(s.w)) e.w = clampSpan(s.w);
    if (e.h != null || e.w != null) out.sizes[id] = e;
  });
  if (typeof raw.split === "number" && isFinite(raw.split)) out.split = clampSplit(raw.split);
  return out;
}
function zoneOf(L, id) { for (var i = 0; i < LAYOUT_ZONES.length; i++) if (L.zones[LAYOUT_ZONES[i]].indexOf(id) >= 0) return LAYOUT_ZONES[i]; return null; }
function flatOrder(L) { var o = []; LAYOUT_ZONES.forEach(function (z) { o = o.concat(L.zones[z]); }); return o; }
function isShown(L, id) { return L.hidden.indexOf(id) < 0; }
// Puts id at `index` of `zone` (counted after taking it out of wherever it was). Never mutates L.
function movePanel(L, id, zone, index) {
  var out = copyLayout(L);
  if (LAYOUT_ZONES.indexOf(zone) < 0 || !zoneOf(out, id)) return out;
  LAYOUT_ZONES.forEach(function (z) { var i = out.zones[z].indexOf(id); if (i >= 0) out.zones[z].splice(i, 1); });
  var list = out.zones[zone], at = typeof index === "number" && isFinite(index) ? Math.max(0, Math.min(list.length, Math.round(index))) : list.length;
  list.splice(at, 0, id);
  return out;
}
// The drop target of a drag: before another panel of that zone, or at its end (beforeId null or not in the zone).
function placeBefore(L, id, zone, beforeId) {
  var list = (L.zones[zone] || []).filter(function (x) { return x !== id; }), i = beforeId == null ? -1 : list.indexOf(beforeId);
  return movePanel(L, id, zone, i < 0 ? list.length : i);
}
// One place earlier (delta < 0) or later, counting only shown panels. scope "tabs": the phone tab order. Otherwise the
// wide order: left column, panel column, bottom row; past the end of a zone the panel moves into the next zone.
function moveBy(L, id, delta, scope) {
  var out = copyLayout(L), vis = function (x) { return isShown(out, x); };
  if (!delta || !isShown(out, id)) return out;
  var step = delta > 0 ? 1 : -1;
  if (scope === "tabs") {
    var v = out.tabs.filter(vis), p = v.indexOf(id), nb = v[p + step];
    if (p < 0 || nb == null) return out;
    out.tabs.splice(out.tabs.indexOf(id), 1);
    out.tabs.splice(out.tabs.indexOf(nb) + (step > 0 ? 1 : 0), 0, id);
    return out;
  }
  var z = zoneOf(out, id);
  if (!z) return out;
  var list = out.zones[z], vz = list.filter(vis), n = vz[vz.indexOf(id) + step];
  if (n != null) {
    list.splice(list.indexOf(id), 1);
    list.splice(list.indexOf(n) + (step > 0 ? 1 : 0), 0, id);
    return out;
  }
  var zi = LAYOUT_ZONES.indexOf(z) + step;
  if (zi < 0 || zi >= LAYOUT_ZONES.length) return out;
  list.splice(list.indexOf(id), 1);
  if (step > 0) out.zones[LAYOUT_ZONES[zi]].unshift(id); else out.zones[LAYOUT_ZONES[zi]].push(id);
  return out;
}
// At least one panel always stays shown.
function setHidden(L, id, hide) {
  var out = copyLayout(L), i = out.hidden.indexOf(id), all = flatOrder(out);
  if (all.indexOf(id) < 0) return out;
  if (hide && i < 0 && all.length - out.hidden.length > 1) out.hidden.push(id);
  if (!hide && i >= 0) out.hidden.splice(i, 1);
  return out;
}
// patch: {h} in pixels and/or {w} in columns; null clears that size (back to the default).
function setSize(L, id, patch) {
  var out = copyLayout(L), has = function (k) { return patch && Object.prototype.hasOwnProperty.call(patch, k); };
  if (!zoneOf(out, id)) return out;
  var e = Object.assign({}, out.sizes[id]);
  if (has("h")) { if (patch.h == null) delete e.h; else if (typeof patch.h === "number" && isFinite(patch.h)) e.h = clampH(patch.h); }
  if (has("w")) { if (patch.w == null) delete e.w; else if (typeof patch.w === "number" && isFinite(patch.w)) e.w = clampSpan(patch.w); }
  if (e.h == null && e.w == null) delete out.sizes[id]; else out.sizes[id] = e;
  return out;
}
function setSplit(L, s) {
  var out = copyLayout(L);
  if (s == null) out.split = null; else if (typeof s === "number" && isFinite(s)) out.split = clampSplit(s);
  return out;
}
// How many columns a zone of this width holds (at least one, at most LIM.maxSpan).
function zoneCols(width, colMin, gap) {
  colMin = colMin || LIM.colMin; gap = gap == null ? LIM.gap : gap;
  if (!(width > 0)) return 1;
  return Math.max(1, Math.min(LIM.maxSpan, Math.floor((width + gap) / (colMin + gap))));
}
// Columns a panel spans: its own width if set; otherwise, when the zone's shown panels fit in one row, the columns are
// shared out (the first panels take any remainder, so no column is left empty), else one column each.
// idx: the panel's place among the zone's shown panels.
function spanFor(L, id, zone, cols, nInZone, idx) {
  cols = Math.max(1, Math.floor(cols) || 1);
  var s = L.sizes[id], w = s && s.w, n = Math.max(1, nInZone || 1);
  if (w == null) w = n > cols ? 1 : Math.floor(cols / n) + ((idx || 0) < cols % n ? 1 : 0);
  return Math.max(1, Math.min(cols, w));
}
// Rows a grid zone needs for these spans, placed in order (a span that does not fit starts a new row, as CSS grid does).
function gridRows(spans, cols) {
  var rows = 0, used = cols;
  spans.forEach(function (sp) { sp = Math.max(1, Math.min(cols, sp)); if (used + sp > cols) { rows++; used = 0; } used += sp; });
  return Math.max(1, rows);
}
// The panel column's width for a map share (null: the default 384 px). The clamp keeps both sides usable at any width.
function panelWidthCss(split) {
  if (split == null || !isFinite(split)) return null;
  return "clamp(" + LIM.panMin + "px, calc((100% - " + LIM.fixedW + "px) * " + (1 - clampSplit(split)).toFixed(3) + "), calc(100% - " + (LIM.fixedW + LIM.mapMin) + "px))";
}
// Map share for a divider dragged to x, given the map's left edge and the panel column's right edge.
function splitAt(x, mapLeft, panelsRight) {
  var avail = panelsRight - mapLeft - 2 * LIM.gap, mapW = x - mapLeft - LIM.gap;
  return avail > 0 ? clampSplit(mapW / avail) : null;
}
function describePos(L, id, wide) {
  var name = PANEL_NAMES[id] || id, vis = function (x) { return isShown(L, x); };
  if (!wide) { var t = L.tabs.filter(vis); return name + ": tab " + (t.indexOf(id) + 1) + " of " + t.length; }
  var z = zoneOf(L, id), v = z ? L.zones[z].filter(vis) : [];
  return name + ": " + (v.indexOf(id) + 1) + " of " + v.length + " in the " + ZONE_LABEL[z];
}
function loadLayout(ids) { return sanitizeLayout(lsGet().layout, ids); }

NFLU.layout = { V: LAYOUT_V, ZONES: LAYOUT_ZONES, PANEL_IDS: PANEL_IDS, PANEL_NAMES: PANEL_NAMES, LIM: LIM, defaultLayout: defaultLayout,
  sanitizeLayout: sanitizeLayout, movePanel: movePanel, placeBefore: placeBefore, moveBy: moveBy, setHidden: setHidden, setSize: setSize,
  setSplit: setSplit, zoneCols: zoneCols, spanFor: spanFor, gridRows: gridRows, panelWidthCss: panelWidthCss, splitAt: splitAt, describePos: describePos,
  zoneOf: zoneOf, flatOrder: flatOrder, clampH: clampH, clampSpan: clampSpan, clampSplit: clampSplit, loadLayout: loadLayout };

// ---- the page ----
var LAYOUT = null;   // the current layout; null until initLayout ran (and stays null if it failed: the page keeps the default CSS layout)
var lay = { ids: [], slots: {}, handles: {}, zones: {}, mark: null, live: null, menu: null, btn: null, drag: null, storage: false };
var WIDE_MQ = "(min-width: 1100px)";
function isWide() { try { return ROOT.matchMedia(WIDE_MQ).matches; } catch (e) { return (ROOT.innerWidth || 0) >= 1100; } }
function storageWorks() { try { var k = LS_KEY + "-probe"; ROOT.localStorage.setItem(k, "1"); ROOT.localStorage.removeItem(k); return true; } catch (e) { return false; } }
function announce(msg) { if (lay.live) lay.live.textContent = msg; }
// Puts nodes into parent in this order, moving only the ones out of place (a moved node loses focus in some browsers).
function orderChildren(parent, nodes) {
  var ref = parent.firstElementChild;
  nodes.forEach(function (n) { if (!n) return; if (n === ref) ref = ref.nextElementSibling; else parent.insertBefore(n, ref); });
}
function pauseMedia(node) { Array.prototype.forEach.call(node.querySelectorAll("audio,video"), function (m) { try { m.pause(); } catch (e) { /* ignore */ } }); }

function initLayout() {
  try {
    lay.zones = { left: byId("uZoneLeft"), right: byId("uZoneRight"), bottom: byId("uZoneBottom") };
    if (!lay.zones.left || !lay.zones.right || !lay.zones.bottom) return;
    lay.ids = PANEL_IDS.filter(function (id) { return PANELS[id] && PANELS[id].root.parentNode; });
    lay.storage = storageWorks();
    LAYOUT = loadLayout(lay.ids);
    lay.ids.forEach(function (id) {
      var slot = PANELS[id].root.parentNode, name = PANEL_NAMES[id];
      lay.slots[id] = slot;
      slot.setAttribute("data-slot", id);
      var rh = el("div", { class: "u-rh", role: "separator", tabindex: "0", "aria-orientation": "horizontal", "aria-label": "Height of " + name,
        "aria-valuemin": String(LIM.minH), "aria-valuemax": String(LIM.maxH), title: "Drag to resize · arrow keys · double-click to reset" });
      var rw = el("div", { class: "u-rw", role: "separator", tabindex: "0", "aria-orientation": "vertical", "aria-label": "Width of " + name + " in columns",
        "aria-valuemin": "1", title: "Drag to resize · arrow keys · double-click to reset", hidden: true });
      slot.appendChild(rh); slot.appendChild(rw);
      lay.handles[id] = { h: rh, w: rw };
      wireResize(id, rh, "h"); wireResize(id, rw, "w");
    });
    lay.mark = el("div", { class: "u-dropmark", "aria-hidden": "true", hidden: true });
    byId("uapp").appendChild(lay.mark);
    lay.live = byId("uLayoutLive");
    byId("uBody").addEventListener("pointerdown", onHeadDown);
    wireSplit(byId("uSplit"));
    wireMenu();
    var fitSoon = function () { (ROOT.requestAnimationFrame || setTimeout)(fitZones); };
    if (ROOT.ResizeObserver) { var ro = new ROOT.ResizeObserver(fitSoon); LAYOUT_ZONES.forEach(function (z) { ro.observe(lay.zones[z]); }); }
    else ROOT.addEventListener("resize", fitSoon);
    try {
      var mq = ROOT.matchMedia(WIDE_MQ), onBp = function () { closeMenu(false); applyLayout(); };
      if (mq.addEventListener) mq.addEventListener("change", onBp); else if (mq.addListener) mq.addListener(onBp);
    } catch (e) { /* no matchMedia: the window resize above still refits */ }
    applyLayout();
  } catch (e) {
    uReport("layout", e);
    LAYOUT = null;   // the fixed default layout from the style sheet still works
  }
}
function saveLayout() { lsSet({ layout: LAYOUT }); }
function commitLayout(L2) { LAYOUT = L2; saveLayout(); applyLayout(); }
function applyLayout() {
  if (!LAYOUT) return;
  try {
    var body = byId("uBody");
    LAYOUT_ZONES.forEach(function (z) { orderChildren(lay.zones[z], LAYOUT.zones[z].map(function (id) { return lay.slots[id]; })); });
    lay.ids.forEach(function (id) {
      var s = lay.slots[id], p = PANELS[id], hide = !isShown(LAYOUT, id), h = LAYOUT.sizes[id] && LAYOUT.sizes[id].h;
      if (hide && !s.hidden) pauseMedia(s);
      s.hidden = hide;
      if (p.setHidden) p.setHidden(hide);
      if (h) { s.style.setProperty("--h", h + "px"); s.classList.add("has-h"); } else { s.style.removeProperty("--h"); s.classList.remove("has-h"); }
      s.classList.toggle("is-folded", p.root.classList.contains("is-collapsed"));
    });
    LAYOUT_ZONES.forEach(function (z) {
      var n = LAYOUT.zones[z].filter(function (id) { return lay.slots[id] && isShown(LAYOUT, id); }).length;
      lay.zones[z].classList.toggle("is-empty", !n);
      body.classList.toggle("u-no" + z, !n);
    });
    var pw = panelWidthCss(LAYOUT.split);
    if (pw) body.style.setProperty("--u-panw", pw); else body.style.removeProperty("--u-panw");
    renderTabs();
    if (lay.menu && !lay.menu.hidden) drawMenu();
    fitZones();
  } catch (e) { uReport("layout", e); }
}
// Column counts, spans, handle states and the default height of grid cells: these depend on rendered sizes.
function fitZones() {
  if (!LAYOUT) return;
  try {
    var wide = isWide();
    LAYOUT_ZONES.forEach(function (z) {
      var zel = lay.zones[z], cols = !wide || z === "left" ? 1 : zoneCols(zel.clientWidth);
      var vis = LAYOUT.zones[z].filter(function (id) { return lay.slots[id] && isShown(LAYOUT, id); });
      zel.setAttribute("data-cols", String(cols)); zel.style.setProperty("--cols", String(cols));
      if (z === "right" && cols > 1) {
        // panels without a height of their own share the column's height by rows
        var rows = gridRows(vis.map(function (id, i) { return spanFor(LAYOUT, id, z, cols, vis.length, i); }), cols);
        zel.style.setProperty("--u-defh", Math.max(240, Math.floor((zel.clientHeight - LIM.gap * (rows - 1)) / rows)) + "px");
      }
      vis.forEach(function (id, i) {
        var s = lay.slots[id], span = spanFor(LAYOUT, id, z, cols, vis.length, i), hd = lay.handles[id];
        s.style.gridColumn = wide && cols > 1 ? "span " + span : "";
        hd.w.hidden = !wide || cols < 2;
        hd.w.setAttribute("aria-valuemax", String(cols)); hd.w.setAttribute("aria-valuenow", String(span));
        hd.w.setAttribute("aria-valuetext", span + " of " + cols + " columns");
        if (wide) { var ht = Math.round(s.getBoundingClientRect().height); hd.h.setAttribute("aria-valuenow", String(ht)); hd.h.setAttribute("aria-valuetext", ht + " pixels"); }
      });
    });
    syncSplit();
  } catch (e) { uReport("layout fit", e); }
}
// Panel() calls this when its collapse button is used.
function onPanelFold(id) {
  if (id === "tv") renderTv();   // folding NFL TV stops its player; opening it follows the usual rules
  if (!LAYOUT || !lay.slots[id]) return;
  lay.slots[id].classList.toggle("is-folded", PANELS[id].root.classList.contains("is-collapsed"));
  fitZones();
}
function resetLayout() {
  LAYOUT = defaultLayout(lay.ids);
  lay.ids.forEach(function (id) { if (PANELS[id].resetCollapsed) PANELS[id].resetCollapsed(); });
  lsSet({ layout: null, collapsed: {} });
  applyLayout();
  announce("Layout reset to the default.");
}

// ---- moving with the keyboard (the grip in each header) or the menu's arrows ----
function layoutKey(id, e) {
  var k = e.key, d = k === "ArrowUp" || k === "ArrowLeft" ? -1 : k === "ArrowDown" || k === "ArrowRight" ? 1 : 0;
  if (!d || !LAYOUT) return;
  e.preventDefault();
  movePanelBy(id, d, e.currentTarget);
}
function movePanelBy(id, d, focusEl) {
  var wide = isWide(), L2 = moveBy(LAYOUT, id, d, wide ? "wide" : "tabs");
  if (sameLayout(L2, LAYOUT)) { announce((PANEL_NAMES[id] || id) + " cannot move further that way."); return; }
  commitLayout(L2);
  if (focusEl && focusEl.isConnected && document.activeElement !== focusEl) focusEl.focus();
  if (wide && lay.slots[id] && lay.slots[id].scrollIntoView) lay.slots[id].scrollIntoView({ block: "nearest" });
  announce(describePos(LAYOUT, id, wide) + ".");
}

// ---- dragging a panel by its header (wide screens) ----
function onHeadDown(e) {
  if (e.button !== 0 || !LAYOUT || !isWide() || lay.drag) return;
  var t = e.target, head = t.closest ? t.closest(".u-phead") : null;
  if (!head || t.closest("a,input,select,textarea,.u-ptools,.u-collapse")) return;
  var slot = head.closest("[data-slot]");
  if (!slot || !lay.slots[slot.getAttribute("data-slot")]) return;
  lay.drag = { id: slot.getAttribute("data-slot"), slot: slot, head: head, pid: e.pointerId, x: e.clientX, y: e.clientY, on: false, target: null };
  document.addEventListener("pointermove", onDragMove);
  document.addEventListener("pointerup", onDragEnd);
  document.addEventListener("pointercancel", cancelDrag);
  document.addEventListener("keydown", onDragKey, true);
}
function onDragMove(e) {
  var d = lay.drag;
  if (!d || e.pointerId !== d.pid) return;
  if (e.buttons === 0) { stopDrag(); return; }   // the release was missed (focus left the window): drop nothing
  if (!d.on) {
    if (Math.abs(e.clientX - d.x) + Math.abs(e.clientY - d.y) < 6) return;
    d.on = true;
    try { d.head.setPointerCapture(e.pointerId); } catch (er) { /* the document listeners still follow the pointer */ }
    document.documentElement.classList.add("u-dragging");
    d.slot.classList.add("is-dragging");
  }
  e.preventDefault();
  d.target = dropTarget(e.clientX, e.clientY);
  showMark(d.target);
  dragScroll(e.clientX, e.clientY);
}
function onDragEnd(e) {
  var d = lay.drag;
  if (!d || (e && e.pointerId !== d.pid)) return;
  var t = d.target, on = d.on;
  stopDrag();
  if (!on || !t) return;
  var L2 = placeBefore(LAYOUT, d.id, t.zone, t.before);
  if (sameLayout(L2, LAYOUT)) return;
  commitLayout(L2);
  announce(describePos(LAYOUT, d.id, true) + ".");
}
function onDragKey(e) { if (e.key === "Escape" && lay.drag) { e.preventDefault(); e.stopPropagation(); cancelDrag(); } }
function cancelDrag(e) { if (lay.drag && (!e || e.pointerId == null || e.pointerId === lay.drag.pid)) stopDrag(); }
function stopDrag() {
  var d = lay.drag;
  lay.drag = null;
  document.removeEventListener("pointermove", onDragMove);
  document.removeEventListener("pointerup", onDragEnd);
  document.removeEventListener("pointercancel", cancelDrag);
  document.removeEventListener("keydown", onDragKey, true);
  document.documentElement.classList.remove("u-dragging");
  if (d) { d.slot.classList.remove("is-dragging"); try { d.head.releasePointerCapture(d.pid); } catch (e) { /* not captured */ } }
  showMark(null);
}
// The part of a zone the viewer can see: its box cut to every scrolling ancestor, so a drop never lands in a zone's
// scrolled-away part (the left column, for one, scrolls inside .u-left).
function visibleRect(node) {
  var r = node.getBoundingClientRect(), b = { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
  for (var p = node.parentElement; p && p !== document.body; p = p.parentElement) {
    var cs = getComputedStyle(p);
    if (!/(auto|scroll|hidden)/.test(cs.overflow + cs.overflowX + cs.overflowY)) continue;
    var q = p.getBoundingClientRect();
    b.left = Math.max(b.left, q.left); b.top = Math.max(b.top, q.top); b.right = Math.min(b.right, q.right); b.bottom = Math.min(b.bottom, q.bottom);
  }
  return { left: b.left, top: b.top, right: b.right, bottom: b.bottom, width: Math.max(0, b.right - b.left), height: Math.max(0, b.bottom - b.top) };
}
// The zone under the pointer and the shown panel the dragged one would go before (null: the zone's end).
function dropTarget(x, y) {
  var d = lay.drag;
  for (var i = 0; i < LAYOUT_ZONES.length; i++) {
    var z = LAYOUT_ZONES[i], zel = lay.zones[z], r = visibleRect(zel);
    if (!r.width || !r.height || x < r.left || x > r.right || y < r.top || y > r.bottom) continue;
    var cols = +zel.getAttribute("data-cols") || 1;
    var ids = LAYOUT.zones[z].filter(function (id) { return id !== d.id && lay.slots[id] && isShown(LAYOUT, id); });
    for (var j = 0; j < ids.length; j++) {
      var rr = lay.slots[ids[j]].getBoundingClientRect();
      if (cols < 2 ? y < rr.top + rr.height / 2 : y < rr.top || (y <= rr.bottom && x < rr.left + rr.width / 2)) return { zone: z, before: ids[j], rect: rr, cols: cols, end: false };
    }
    return { zone: z, before: null, rect: ids.length ? lay.slots[ids[ids.length - 1]].getBoundingClientRect() : null, cols: cols, end: true };
  }
  return null;
}
function showMark(t) {
  LAYOUT_ZONES.forEach(function (z) { if (lay.zones[z]) lay.zones[z].classList.toggle("is-droptarget", !!t && t.zone === z); });
  var m = lay.mark;
  if (!m) return;
  if (!t || !t.rect) { m.hidden = true; return; }
  var r = t.rect, s = m.style;
  if (t.cols > 1) { s.left = (t.end ? r.right + 2 : r.left - 5) + "px"; s.top = r.top + "px"; s.width = "3px"; s.height = r.height + "px"; }
  else { s.left = r.left + "px"; s.top = (t.end ? r.bottom + 2 : r.top - 5) + "px"; s.width = r.width + "px"; s.height = "3px"; }
  m.hidden = false;
}
function dragScroll(x, y) {
  LAYOUT_ZONES.forEach(function (z) {
    var sc = z === "left" ? lay.zones[z].parentNode : lay.zones[z], r = sc.getBoundingClientRect();
    if (sc.scrollHeight <= sc.clientHeight || x < r.left || x > r.right) return;
    if (y < r.top + 40 && y > r.top - 20) sc.scrollTop -= 14; else if (y > r.bottom - 40 && y < r.bottom + 20) sc.scrollTop += 14;
  });
}

// Follows one pointer from a handle until release. Listens on the document (so a lost pointer capture cannot strand it),
// ends on a missed release, and Escape cancels: done(true) commits, done(false) puts the saved layout back.
function trackPointer(e, el, cls, onMove, done) {
  var pid = e.pointerId, root = document.documentElement, over = false;
  try { el.setPointerCapture(pid); } catch (er) { /* the document listeners still follow the pointer */ }
  root.classList.add(cls);
  function move(ev) { if (ev.pointerId !== pid) return; if (ev.buttons === 0) end(false); else onMove(ev); }
  function up(ev) { if (ev.pointerId === pid) end(true); }
  function cancel(ev) { if (ev.pointerId === pid) end(false); }
  function key(ev) { if (ev.key === "Escape") { ev.preventDefault(); ev.stopPropagation(); end(false); } }
  function end(ok) {
    if (over) return;
    over = true;
    document.removeEventListener("pointermove", move); document.removeEventListener("pointerup", up);
    document.removeEventListener("pointercancel", cancel); document.removeEventListener("keydown", key, true);
    root.classList.remove(cls);
    try { el.releasePointerCapture(pid); } catch (er) { /* not captured */ }
    done(ok);
  }
  document.addEventListener("pointermove", move); document.addEventListener("pointerup", up);
  document.addEventListener("pointercancel", cancel); document.addEventListener("keydown", key, true);
}

// ---- resizing from the bottom (height) and right (width in columns) edges ----
function wireResize(id, hd, axis) {
  hd.addEventListener("pointerdown", function (e) {
    if (e.button !== 0 || !LAYOUT || !isWide()) return;
    e.preventDefault(); e.stopPropagation();
    var s = lay.slots[id], r = s.getBoundingClientRect(), zel = lay.zones[zoneOf(LAYOUT, id)];
    var cols = +zel.getAttribute("data-cols") || 1, colW = (zel.clientWidth - LIM.gap * (cols - 1)) / cols, st = { x: e.clientX, y: e.clientY, v: null };
    trackPointer(e, hd, axis === "h" ? "u-rowresize" : "u-colresize", function (ev) {
      if (axis === "h") { st.v = clampH(r.height + ev.clientY - st.y); s.style.setProperty("--h", st.v + "px"); s.classList.add("has-h"); }
      else { st.v = Math.max(1, Math.min(cols, Math.round((r.width + ev.clientX - st.x + LIM.gap) / (colW + LIM.gap)))); s.style.gridColumn = "span " + st.v; }
    }, function (ok) {
      if (ok && st.v != null) commitLayout(setSize(LAYOUT, id, axis === "h" ? { h: st.v } : { w: st.v }));
      else applyLayout();   // undo the live preview
    });
  });
  hd.addEventListener("dblclick", function () {
    if (!LAYOUT) return;
    commitLayout(setSize(LAYOUT, id, axis === "h" ? { h: null } : { w: null }));
    announce(PANEL_NAMES[id] + ": " + (axis === "h" ? "height" : "width") + " reset.");
  });
  hd.addEventListener("keydown", function (e) {
    if (!LAYOUT) return;
    var k = e.key, d = axis === "h" ? (k === "ArrowUp" ? -1 : k === "ArrowDown" ? 1 : 0) : (k === "ArrowLeft" ? -1 : k === "ArrowRight" ? 1 : 0);
    if (!d) return;
    e.preventDefault();
    if (axis === "h") {
      var cur = Math.round(lay.slots[id].getBoundingClientRect().height);
      commitLayout(setSize(LAYOUT, id, { h: cur + d * (e.shiftKey ? 4 : 1) * LIM.stepH }));
    } else {
      var z = zoneOf(LAYOUT, id), zel = lay.zones[z], cols = +zel.getAttribute("data-cols") || 1;
      var shown = LAYOUT.zones[z].filter(function (x) { return isShown(LAYOUT, x); }), span = spanFor(LAYOUT, id, z, cols, shown.length, shown.indexOf(id));
      commitLayout(setSize(LAYOUT, id, { w: Math.max(1, Math.min(cols, span + d)) }));
    }
    if (document.activeElement !== hd) hd.focus();
  });
}

// ---- the divider between the map and the panel column ----
function currentSplit() {
  var m = byId("uMap").getBoundingClientRect().width, p = lay.zones.right.getBoundingClientRect().width;
  return m + p > 0 ? m / (m + p) : null;
}
function syncSplit() {
  var sp = byId("uSplit");
  if (!sp || !isWide()) return;
  var v = currentSplit();
  if (v == null) return;
  sp.setAttribute("aria-valuenow", String(Math.round(clampSplit(v) * 100)));   // inside aria-valuemin/max; the text has the real share
  sp.setAttribute("aria-valuetext", "Map " + Math.round(v * 100) + "% of the width");
}
function wireSplit(sp) {
  if (!sp) return;
  sp.addEventListener("pointerdown", function (e) {
    if (e.button !== 0 || !LAYOUT || !isWide()) return;
    e.preventDefault();
    var body = byId("uBody"), mapL = byId("uMap").getBoundingClientRect().left, panR = lay.zones.right.getBoundingClientRect().right, v = null;
    trackPointer(e, sp, "u-colresize", function (ev) {
      v = splitAt(ev.clientX, mapL, panR);
      if (v != null) body.style.setProperty("--u-panw", panelWidthCss(v));
    }, function (ok) {
      if (ok && v != null) commitLayout(setSplit(LAYOUT, v)); else applyLayout();
    });
  });
  sp.addEventListener("dblclick", function () { if (!LAYOUT) return; commitLayout(setSplit(LAYOUT, null)); announce("Map width reset."); });
  sp.addEventListener("keydown", function (e) {
    if (!LAYOUT) return;
    var k = e.key, cur = currentSplit(), v = null;
    if (k === "ArrowLeft" || k === "ArrowRight") v = (cur == null ? 0.66 : cur) + (k === "ArrowLeft" ? -1 : 1) * (e.shiftKey ? 4 : 1) * LIM.stepSplit;
    else if (k === "Home") v = LIM.minSplit; else if (k === "End") v = LIM.maxSplit;
    if (v == null) return;
    e.preventDefault();
    commitLayout(setSplit(LAYOUT, v));
  });
}

// ---- the Panels menu in the top bar ----
function wireMenu() {
  var btn = byId("uPanels"), menu = byId("uPanelsMenu");
  if (!btn || !menu) return;
  lay.btn = btn; lay.menu = menu;
  btn.addEventListener("click", function () { if (menu.hidden) openMenu(); else closeMenu(true); });
  menu.addEventListener("change", function (e) {
    var id = e.target.getAttribute && e.target.getAttribute("data-show");
    if (!id || !LAYOUT) return;
    commitLayout(setHidden(LAYOUT, id, !e.target.checked));
    announce(PANEL_NAMES[id] + (isShown(LAYOUT, id) ? " shown." : " hidden."));
  });
  menu.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("button") : null;
    if (!b || !LAYOUT) return;
    if (b.hasAttribute("data-mv")) movePanelBy(b.getAttribute("data-id"), +b.getAttribute("data-mv"));
    else if (b.id === "uResetLayout") resetLayout();
  });
  document.addEventListener("pointerdown", function (e) { if (!menu.hidden && !menu.contains(e.target) && !btn.contains(e.target)) closeMenu(false); });
  // focus moving anywhere else (Tab out, or a drawer, the brief or a player opening and taking focus) closes it too,
  // so the menu never stays open behind something that opened over it
  document.addEventListener("focusin", function (e) { if (!menu.hidden && !menu.contains(e.target) && !btn.contains(e.target)) closeMenu(false); });
  // capture, so Escape closes the menu without also closing the drawer behind it
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !menu.hidden) { e.stopPropagation(); closeMenu(true); } }, true);
}
function openMenu() {
  if (!lay.menu || !LAYOUT) return;
  drawMenu();
  lay.menu.hidden = false; lay.menu.style.right = "";
  lay.btn.setAttribute("aria-expanded", "true");
  // the top bar rises above an open drawer only while its menu is open, so the menu is never covered and the bar
  // (two rows on narrower screens) never covers the drawer's close button otherwise
  var top = lay.btn.closest ? lay.btn.closest(".u-top") : null; if (top) top.classList.add("is-menu-open");
  // keep it on screen when the button sits near the left edge (phones)
  var r = lay.menu.getBoundingClientRect();
  if (r.left < 8) lay.menu.style.right = Math.round(r.left - 8) + "px";
  var first = lay.menu.querySelector("input,button");
  if (first) first.focus();
}
function closeMenu(focusBtn) {
  if (!lay.menu || lay.menu.hidden) return;
  lay.menu.hidden = true;
  lay.btn.setAttribute("aria-expanded", "false");
  var top = lay.btn.closest ? lay.btn.closest(".u-top") : null; if (top) top.classList.remove("is-menu-open");
  if (focusBtn) lay.btn.focus();
}
function drawMenu() {
  var m = lay.menu, wide = isWide(), order = wide ? flatOrder(LAYOUT) : LAYOUT.tabs, nShown = order.filter(function (id) { return isShown(LAYOUT, id); }).length;
  var scope = wide ? "wide" : "tabs";
  keepFocus(m, function () {
    clearNode(m);
    m.appendChild(el("p", { class: "u-mtitle", text: wide ? "Panels" : "Panels and tabs" }));
    m.appendChild(el("ul", { class: "u-mlist" }, order.map(function (id) {
      var shown = isShown(LAYOUT, id), name = PANEL_NAMES[id], last = shown && nShown <= 1;
      var canUp = shown && !sameLayout(moveBy(LAYOUT, id, -1, scope), LAYOUT), canDown = shown && !sameLayout(moveBy(LAYOUT, id, 1, scope), LAYOUT);
      return el("li", { class: "u-mrow" + (shown ? "" : " is-off") }, [
        el("label", { for: "u-show-" + id, title: last ? "One panel always stays shown" : "" }, [
          el("input", { type: "checkbox", id: "u-show-" + id, "data-show": id, "data-fk": "show-" + id, checked: shown, disabled: last }),
          el("span", { text: name }),
          wide ? el("small", { text: ZONE_LABEL[zoneOf(LAYOUT, id)] }) : null]),
        // aria-disabled rather than disabled, so the focused arrow keeps focus when its panel reaches the end
        el("button", { type: "button", class: "u-mv", "data-mv": "-1", "data-id": id, "data-fk": "up-" + id, "aria-disabled": canUp ? "false" : "true", "aria-label": "Move " + name + " earlier", text: "↑" }),
        el("button", { type: "button", class: "u-mv", "data-mv": "1", "data-id": id, "data-fk": "down-" + id, "aria-disabled": canDown ? "false" : "true", "aria-label": "Move " + name + " later", text: "↓" })]);
    })));
    m.appendChild(el("p", { class: "u-note", text: wide
      ? "Drag a panel by its header to move it, or focus its grip and use the arrow keys. Drag a panel's bottom or right edge to resize it, and the line beside the map to change the map's width; double-click an edge or the line to reset it."
      : "The arrows change the order of the tabs." }));
    m.appendChild(el("p", { class: "u-note", text: lay.storage ? "The layout is saved in this browser." : "This browser is not keeping settings for this page, so the layout resets when the page reloads." }));
    m.appendChild(el("button", { type: "button", class: "u-btn u-small u-mreset", id: "uResetLayout", "data-fk": "reset-layout", text: "Reset layout" }));
  });
}
