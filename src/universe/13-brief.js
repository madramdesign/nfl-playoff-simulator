// "What is happening in the NFL?": a short brief computed by fixed rules from the data on this page (DEC-009).
function renderBrief(host) {
  var st = store.get(), now = refNow();
  var fi = focusInfo(st.focus), fset = focusSet(st.focus), scope = fi.level === "league" ? "" : fi.level === "team" ? "the " + TEAMS[fi.team].nick : "the " + fi.label;
  var lines = buildBrief({ M: st.model, payload: st.payload, sim: st.sim && st.sim.r, focus: fset, scope: scope, events: focusEvents(filterByTime(st.model ? st.model.events : [], st.timeRange, now), fset) });
  clearNode(host);
  host.appendChild(el("div", { class: "u-mhead" }, [
    el("h2", { id: "u-brief-title", text: fset ? "What is happening with " + scope + "?" : "What is happening in the NFL?" }),
    el("button", { type: "button", class: "u-x", "aria-label": "Close", text: "×", onclick: closeBrief })]));
  host.appendChild(el("p", { class: "u-label", text: "Computed from the data on this page, not written by an AI model. " + (fset ? "Narrowed to " + scope + " (the focus); a game counts when either team is in it. " : "") + "Events " + RANGE_PHRASE[st.timeRange] + "; " + dataStatusText() + (st.sim ? "; simulation: " + st.sim.n.toLocaleString() + " seasons, " + MODE_NAMES[st.sim.mode] + " win chances" : "") + "." }));
  if (st.model && st.model.fixture) host.appendChild(el("p", { class: "u-warnline", text: "Fixture data: these lines describe synthetic test data." }));
  var ol = el("ol", { class: "u-brief" });
  lines.forEach(function (l) {
    var go = null;
    if (l.gi != null || l.gameKey) go = el("button", { type: "button", class: "u-btn u-small", text: "Open game", onclick: function () { closeBrief(); openGame(l.gameKey || GAMES[l.gi][0]); } });
    else if (l.team != null) go = el("button", { type: "button", class: "u-btn u-small", text: "Open " + TEAMS[l.team].a, onclick: function () { closeBrief(); openTeam(l.team); } });
    ol.appendChild(el("li", { "data-line": l.id }, [el("b", { text: l.label }), el("p", { text: l.text }), el("div", { class: "u-blinks" }, [go, l.url ? el("a", { href: l.url, target: "_blank", rel: "noopener", class: "u-btn u-small", text: "Source" }) : null])]));
  });
  host.appendChild(ol);
}
var briefLastFocus = null;
function openBrief() {
  var m = byId("uBrief"), box = m.querySelector(".u-mbox");
  briefLastFocus = document.activeElement;
  renderBrief(box); m.hidden = false;
  var b = box.querySelector(".u-x"); if (b) b.focus();
}
// Keeps Tab inside the open dialog (Esc closes it; see 99-boot.js).
function trapBriefFocus(e) {
  var m = byId("uBrief"); if (m.hidden || e.key !== "Tab") return;
  var f = Array.prototype.filter.call(m.querySelectorAll("a[href],button:not([disabled]),[tabindex]:not([tabindex='-1'])"), function (n) { return n.offsetParent !== null || n === document.activeElement; });
  if (!f.length) return;
  var first = f[0], last = f[f.length - 1];
  if (!m.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
  else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}
function closeBrief() { var m = byId("uBrief"); if (m.hidden) return; m.hidden = true; if (briefLastFocus && briefLastFocus.focus) briefLastFocus.focus(); }
