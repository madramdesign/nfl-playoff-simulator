// Panel helper: every panel has an id, a title, a move grip, a collapse toggle (remembered), a freshness badge driven by the
// sources it depends on, and four states (loading, error with retry, empty, content). All content goes through render(),
// which clears any earlier error or empty state first and waits while the viewer has hidden the panel (17-layout.js).
var PANELS = {};
// Re-rendering replaces nodes; this puts keyboard focus back on the equivalent element afterwards (matched by data-fk,
// data-game, data-team or data-chip), so a poll or a finished simulation never drops focus to the page.
function focusKey(n) {
  if (!n || !n.getAttribute) return null;
  var k = n.getAttribute("data-fk"); if (k) return "k:" + k;
  if (n.hasAttribute("data-game")) return "g:" + n.getAttribute("data-game");
  if (n.hasAttribute("data-team")) return "t:" + n.getAttribute("data-team") + ":" + n.tagName;
  if (n.hasAttribute("data-chip")) return "c:" + n.getAttribute("data-chip");
  return null;
}
function keepFocus(container, fn) {
  var a = HAS_DOM ? document.activeElement : null, key = a && a !== container && container.contains(a) ? focusKey(a) : null;
  fn();
  if (!key) return;
  var cands = container.querySelectorAll("[data-fk],[data-game],[data-team],[data-chip]");
  for (var i = 0; i < cands.length; i++) if (focusKey(cands[i]) === key) { try { cands[i].focus({ preventScroll: true }); } catch (e) { cands[i].focus(); } return; }
}
function Panel(o) {
  // a panel the viewer has never toggled starts as o.collapsed says (a function, so it can depend on the screen width)
  var defCollapsed = function () { return !!(o.collapsed && o.collapsed()); };
  var saved = lsGet().collapsed || {}, collapsed = Object.prototype.hasOwnProperty.call(saved, o.id) ? !!saved[o.id] : defCollapsed();
  var badge = el("span", { class: "u-badge", "data-state": "loading", text: "…" });
  var btn = el("button", { type: "button", class: "u-collapse", "aria-expanded": collapsed ? "false" : "true", "aria-controls": "u-pb-" + o.id, title: "Collapse or expand" }, [el("span", { "aria-hidden": "true", text: "▾" })]);
  // the grip: drag handle on wide screens (the whole header drags too) and the keyboard move control (17-layout.js)
  var name = (typeof PANEL_NAMES !== "undefined" && PANEL_NAMES[o.id]) || o.title;
  var grip = el("button", { type: "button", class: "u-grip", "aria-label": "Move " + name, "aria-describedby": "uMoveHint", title: "Drag to move · arrow keys move one place",
    onkeydown: function (e) { layoutKey(o.id, e); } });
  var tools = el("div", { class: "u-ptools" });
  var body = el("div", { class: "u-pbody", id: "u-pb-" + o.id }), h2 = el("h2", { id: "u-ph-" + o.id, text: o.title });
  var root = el("section", { class: "u-panel" + (collapsed ? " is-collapsed" : "") + (o.cls ? " " + o.cls : ""), id: "u-panel-" + o.id, "data-panel": o.id, "aria-labelledby": "u-ph-" + o.id }, [
    el("header", { class: "u-phead" }, [grip, h2, badge, tools, btn]), body]);
  var p = { id: o.id, root: root, body: body, tools: tools, badge: badge, sources: o.sources || [], state: "loading", lastFn: null, hidden: false, pending: false };
  function setCollapsed(c) {
    root.classList.toggle("is-collapsed", c); btn.setAttribute("aria-expanded", c ? "false" : "true");
    onPanelFold(o.id);
  }
  btn.addEventListener("click", function () {
    var c = !root.classList.contains("is-collapsed");
    setCollapsed(c);
    var s = lsGet().collapsed || {}; s[o.id] = c ? 1 : 0; lsSet({ collapsed: s });
  });
  p.resetCollapsed = function () { setCollapsed(defCollapsed()); };
  function setState(s) { p.state = s; root.setAttribute("data-state", s); }
  // A hidden panel is not drawn: the latest render is kept and runs when the panel is shown again.
  p.render = function (fn) {
    p.lastFn = fn;
    if (p.hidden) { p.pending = true; return; }
    p.pending = false;
    try { keepFocus(body, function () { clearNode(body); fn(body); }); setState("ok"); }
    catch (e) { uReport("panel " + o.id, e); p.error("This panel could not be drawn (" + (e && e.message || e) + ").", function () { p.render(fn); }); }
  };
  p.setHidden = function (h) {
    h = !!h;
    if (h === p.hidden) return;
    p.hidden = h;
    if (!h && p.pending && p.lastFn) p.render(p.lastFn);
  };
  // these show the latest state themselves, so a render held back while hidden is out of date
  p.loading = function (msg) { p.pending = false; clearNode(body); body.appendChild(el("p", { class: "u-state u-loading", role: "status", text: msg || "Loading…" })); setState("loading"); };
  p.empty = function (msg) { p.pending = false; clearNode(body); body.appendChild(el("p", { class: "u-state u-empty", text: msg })); setState("empty"); };
  p.error = function (msg, retry) {
    p.pending = false;
    clearNode(body);
    body.appendChild(el("div", { class: "u-state u-error", role: "alert" }, [el("p", { text: msg }), retry ? el("button", { type: "button", class: "u-btn", text: "Retry", onclick: retry }) : null]));
    setState("error");
  };
  p.setTitle = function (t) { h2.textContent = t; };
  p.refreshBadge = function (now) {
    var f = o.badge ? o.badge(now) : freshness(p.sources, { payload: store.get("payload"), origin: store.get("origin"), fetchedAt: store.get("fetchedAt"), fails: store.get("pollFails") }, now);
    badge.textContent = f.label; badge.setAttribute("data-state", f.state); badge.title = f.title || "";
  };
  setState("loading");
  PANELS[o.id] = p;
  return p;
}
// For panels that still show the model's own data when no feed is loaded (games from the build, curated news).
function buildOrFeedBadge(ids) {
  return function (now) {
    if (!store.get("payload")) return { state: "model", label: "BUILD · " + (D.built || "?"), title: "No live feed or snapshot: showing what was built into the page on " + (D.built || "?") + "." };
    return freshness(ids, { payload: store.get("payload"), origin: store.get("origin"), fetchedAt: store.get("fetchedAt"), fails: store.get("pollFails") }, now);
  };
}
function refreshBadges() { var now = Date.now(); for (var k in PANELS) { try { PANELS[k].refreshBadge(now); } catch (e) { uReport("badge", e); } } }
