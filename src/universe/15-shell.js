// The shell: top bar, left rail (map mode, time range, layers, simulation), tabs on narrow screens, the detail drawer,
// the view switch (command center / simulator) and the color theme.
var MODE_LABELS = { geo: "Geographic", div: "Divisions", intel: "Intelligence" };
var TAB_LABELS = [["feed", "Feed"], ["media", "Media"], ["games", "Games"], ["teams", "Teams"], ["health", "Health"]];
function prefersReduced() { try { return ROOT.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } }

// ---- theme: the command center defaults to dark; the simulator keeps following the system unless a choice was made ----
function applyTheme() {
  var pref = lsGet().theme, view = store.get("view"), eff = pref || (view === "universe" ? "dark" : "auto");
  if (eff === "auto") document.documentElement.removeAttribute("data-theme"); else document.documentElement.setAttribute("data-theme", eff);
  var b = byId("uTheme"); if (b) { b.textContent = "Theme: " + (eff === "auto" ? "Auto" : eff === "dark" ? "Dark" : "Light"); b.setAttribute("aria-label", "Color theme: " + b.textContent.slice(7) + ". Click to change."); }
}
function cycleTheme() {
  var cur = document.documentElement.getAttribute("data-theme") || "auto", next = cur === "dark" ? "light" : cur === "light" ? "auto" : "dark";
  lsSet({ theme: next }); applyTheme();
}

// ---- view switch ----
var simStarted = false;
function applyView() {
  var v = store.get("view"), sim = v === "sim";
  document.documentElement.classList.toggle("u-view-sim", sim);
  document.documentElement.classList.toggle("u-view-universe", !sim);
  byId("uBody").hidden = sim;
  var fb = byId("uFocus"); if (fb) fb.hidden = sim;
  var sv = byId("simView"); if (sv) sv.hidden = !sim;
  Array.prototype.forEach.call(document.querySelectorAll("[data-view]"), function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-view") === v ? "true" : "false"); });
  if (sim) { closePlayer(); closeDrawer(true); if (typeof ROOT.nflSimStart === "function") { ROOT.nflSimStart(); simStarted = true; } }
  else if (simStarted) {
    // the simulator may have changed the win-chance mode: rerun if it did (the key includes MODE) and redraw what shows it
    requestBaseSim(); renderRail(); renderGames(); renderTeamsPanel(); drawMapSoon();
  }
  document.title = sim ? "NFL Playoff Simulator · NFL Universe" : "NFL Universe";
  applyTheme();
}
function openSimulator(i) {
  store.set({ view: "sim", team: null, game: null });
  if (i != null) {
    var sel = byId("team");
    if (sel) { sel.value = String(i); try { sel.dispatchEvent(new Event("change")); } catch (e) { /* very old browser */ } }
  }
  ROOT.scrollTo(0, 0);
}

// ---- drawer (team center or game detail) ----
var drawerFocus = null, drawerKey = "";
function openTeam(i) { if (i == null || !TEAMS[i]) return; store.set({ team: TEAMS[i].a, game: null, view: "universe" }); }
function openGame(key) { if (!key) return; store.set({ game: String(key), team: null, view: "universe" }); }
function closeDrawer(silent) { if (store.get("team") || store.get("game")) store.set({ team: null, game: null }); if (!silent && drawerFocus && drawerFocus.focus) drawerFocus.focus(); }
function renderDrawer() {
  var st = store.get(), d = byId("uDrawer"), body = d.querySelector(".u-dbody"), key = st.team ? "t:" + st.team : st.game ? "g:" + st.game : "";
  if (!key || st.view !== "universe") { if (!d.hidden) { d.hidden = true; document.documentElement.classList.remove("u-drawer-open"); } drawerKey = ""; return; }
  if (st.game && !findGame(st.game)) {
    // a game id from the URL may belong to the live feed: wait for the first answer before dropping it
    if (canPoll() && !poll.everOk && poll.fails === 0) return;
    store.set({ game: null }); return;
  }
  var fresh = key !== drawerKey, top = fresh ? 0 : body.scrollTop;
  if (fresh && d.hidden) drawerFocus = document.activeElement;
  keepFocus(body, function () {
    clearNode(body);
    try { if (st.team) renderTeamCenter(TIDX[st.team], body); else renderGameDetail(st.game, body); }
    catch (e) { uReport("drawer", e); body.appendChild(el("p", { class: "u-state u-error", text: "This view could not be drawn (" + (e && e.message || e) + ")." })); }
  });
  d.hidden = false; document.documentElement.classList.add("u-drawer-open");
  body.scrollTop = top;
  if (fresh) { drawerKey = key; var x = d.querySelector(".u-x"); if (x) x.focus({ preventScroll: true }); }
}

// ---- focus bar: NFL, then conference, division and team, each level shown once the one above it is chosen ----
function buildFocusBar(host) {
  if (!host) return;
  host.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("[data-focus]") : null;
    if (b) { store.set({ focus: b.getAttribute("data-focus") || null }); return; }
    var o = e.target.closest ? e.target.closest("[data-focus-open]") : null;
    if (o) openTeam(+o.getAttribute("data-focus-open"));
  });
}
function renderFocusBar() {
  var host = byId("uFocus"); if (!host) return;
  var f = focusInfo(store.get("focus")), conf = f.conf ? FOCUS.byId[f.conf] : null, dv = f.div ? FOCUS.byId[f.div] : null;
  var btn = function (id, text, on, title) { return el("button", { type: "button", class: !on && id && (id === f.conf || id === f.div) ? "is-path" : null, "data-focus": id || "", "data-fk": "focus-" + (id || "nfl"), "aria-pressed": on ? "true" : "false", title: title || null, text: text }); };
  var group = function (label, kids) { return el("div", { class: "u-seg u-fgroup", role: "group", "aria-label": label }, kids); };
  var sep = function () { return el("span", { class: "u-fsep", "aria-hidden": "true", text: "\u203a" }); };
  keepFocus(host, function () {
    clearNode(host);
    host.appendChild(el("span", { class: "u-flabel", text: "Focus" }));
    host.appendChild(group("League and conference", [btn(null, "NFL", f.level === "league", "The whole league")].concat(FOCUS.confs.map(function (c) { return btn(c.id, c.label, f.level === "conf" && f.id === c.id, c.teams.length + " teams"); }))));
    if (conf) { host.appendChild(sep()); host.appendChild(group(conf.label + " divisions", conf.divs.map(function (d) { return btn(d.id, d.short, f.level === "div" && f.id === d.id, d.label); }))); }
    if (dv) { host.appendChild(sep()); host.appendChild(group(dv.label + " teams", dv.teams.map(function (i) { return btn(TEAMS[i].a, TEAMS[i].a, f.team === i, TEAMS[i].name); }))); }
    host.appendChild(el("span", { class: "u-fnote", text: f.level === "league" ? "All 32 teams" : f.level === "team" ? f.label + " \u00b7 " + dv.label : f.label + " \u00b7 " + f.teams.length + " teams" }));
    if (f.level === "team") host.appendChild(el("button", { type: "button", class: "u-btn u-fopen", "data-fk": "focus-open", "data-focus-open": f.team, text: "Team center" }));
  });
  host.classList.toggle("is-on", f.level !== "league");
}

// ---- left rail ----
function buildRail(host) {
  clearNode(host);
  var toggle = el("button", { type: "button", class: "u-railtoggle", "aria-expanded": "false", text: "Map controls", onclick: function () { var o = host.classList.toggle("is-open"); toggle.setAttribute("aria-expanded", o ? "true" : "false"); } });
  var modes = el("div", { class: "u-seg", role: "group", "aria-label": "Map mode" });
  MAP_MODES.forEach(function (m) {
    modes.appendChild(el("button", { type: "button", "data-mode": m, text: MODE_LABELS[m], disabled: m === "geo" && !HAS_GEO, onclick: function () { store.set({ mode: m }); } }));
  });
  [["Network", "Team network view: planned for a later phase"], ["Schedule", "Schedule view: planned for a later phase"]].forEach(function (x) { modes.appendChild(el("button", { type: "button", disabled: true, title: x[1], text: x[0] + " · soon" })); });
  var range = el("select", { id: "uRange", "aria-label": "Time range" });
  TIME_RANGES.forEach(function (r) { range.appendChild(el("option", { value: r, text: RANGE_LABEL[r] })); });
  range.appendChild(el("option", { value: "history", disabled: true, title: "Replaying the feed as it stood at an earlier time needs the dated event archive; planned for a later phase", text: "History (later phase)" }));
  range.addEventListener("change", function () { if (TIME_RANGES.indexOf(range.value) >= 0) store.set({ timeRange: range.value }); });
  var layers = el("div", { class: "u-layers" });
  LAYER_GROUPS.forEach(function (gname) {
    var box = el("fieldset", { class: "u-lgroup" }, [el("legend", { text: gname })]);
    LAYERS.filter(function (l) { return l.group === gname; }).forEach(function (l) {
      var cb = el("input", { type: "checkbox", id: "u-l-" + l.id, "data-layer": l.id });
      cb.addEventListener("change", function () {
        var cur = store.get("layers").slice(), k = cur.indexOf(l.id);
        if (cb.checked && k < 0) cur.push(l.id); if (!cb.checked && k >= 0) cur.splice(k, 1);
        store.set({ layers: LAYER_IDS.filter(function (id) { return cur.indexOf(id) >= 0; }) });
      });
      box.appendChild(el("label", { class: "u-lrow", for: "u-l-" + l.id, "data-layer-row": l.id }, [cb, el("span", { text: l.label }), el("small", { class: "u-lnote" })]));
    });
    layers.appendChild(box);
  });
  var simBox = el("div", { class: "u-simbox", id: "uSimBox" });
  host.appendChild(toggle);
  host.appendChild(el("div", { class: "u-railbody" }, [
    el("h3", { text: "Map" }), modes,
    el("h3", {}, [el("label", { for: "uRange", text: "Time range" })]), range,
    el("h3", { text: "Layers" }), layers,
    el("h3", { text: "Simulation" }), simBox]));
}
function renderRail() {
  var st = store.get();
  Array.prototype.forEach.call(document.querySelectorAll("[data-mode]"), function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-mode") === st.mode ? "true" : "false"); });
  var rs = byId("uRange"); if (rs && rs.value !== st.timeRange) rs.value = st.timeRange;
  LAYERS.forEach(function (l) {
    var cb = byId("u-l-" + l.id), row = cb && cb.parentNode; if (!cb) return;
    cb.checked = st.layers.indexOf(l.id) >= 0;
    var avail = l.modes.indexOf(st.mode) >= 0, note = row.querySelector(".u-lnote");
    row.classList.toggle("is-na", !avail);
    var srcNote = "";
    if (avail && l.sourceIds.length) { var f = freshness(l.sourceIds, { payload: st.payload, origin: st.origin, fetchedAt: st.fetchedAt, fails: st.pollFails }, Date.now()); if (f.state === "unavailable") srcNote = "no data"; else if (f.state === "stale") srcNote = "stale"; else if (f.state === "snapshot") srcNote = "snapshot"; }
    note.textContent = avail ? srcNote : "not in this mode";
  });
  var sb = byId("uSimBox"); if (!sb) return;
  keepFocus(sb, function () { drawSimBox(sb, st); });
}
// Pure: the simulation's own description. Numbers are labelled with the mode they were computed in (s.mode), which can
// differ for a moment from the page's current mode after the simulator view changed it.
function simSummary(s, curMode) {
  if (!s) return "";
  var out = "Win chances: " + MODE_NAMES[s.mode] + (s.mode !== curMode ? " (rerunning in " + MODE_NAMES[curMode] + "…)" : "") + ".";
  var bits = [];
  if (s.finals) bits.push(s.finals + " final" + (s.finals > 1 ? "s" : "") + " counted as results");
  if (s.ties) bits.push(s.ties + " tied final" + (s.ties > 1 ? "s" : "") + " simulated instead (the engine cannot pick ties)");
  if (s.lives) bits.push(s.lives + " live game" + (s.lives > 1 ? "s" : "") + " at " + (s.feedLive === s.lives ? "the feed's in-game chance" : s.feedLive ? "the feed's or this page's in-game chance" : "this page's in-game chance"));
  if (s.staleLive) bits.push(s.staleLive + " in-progress game" + (s.staleLive > 1 ? "s" : "") + " with out-of-date data simulated from the pregame chance");
  return out + (bits.length ? " From the feed: " + bits.join("; ") + "." : "");
}
NFLU.simSummary = simSummary;
function drawSimBox(sb, st) {
  clearNode(sb);
  var s = st.sim;
  sb.appendChild(el("p", { class: "u-note", text: st.simBusy ? "Simulating " + SIM_BASE_N.toLocaleString() + " seasons…" : s ? s.n.toLocaleString() + " seasons" + (s.deep ? " (deep run)" : "") + " · " + (s.where === "worker" ? "background worker" : "main thread") + " · " + (s.ms / 1000).toFixed(1) + " s" : st.simError ? "Simulation failed: " + st.simError : "Waiting…" }));
  sb.appendChild(el("p", { class: "u-note", text: s ? simSummary(s, MODE) : "Win chances: " + MODE_NAMES[MODE] + "." }));
  var dp = st.deepProgress;
  var btn = el("button", { type: "button", class: "u-btn", "data-fk": "deep-run", disabled: dp != null || sim.ok === false, text: dp != null ? "Running… " + Math.round(dp * 100) + "%" : "Deep run: 100,000 seasons", onclick: runDeep,
    title: sim.ok === false ? "Needs Web Workers, which this browser refused for this page" : "Ten independent batches of 10,000 seasons with different seeds, summed" });
  sb.appendChild(btn);
  if (dp != null) sb.appendChild(el("div", { class: "u-progress", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": "100", "aria-valuenow": String(Math.round(dp * 100)) }, [el("i", { style: { width: Math.round(dp * 100) + "%" } })]));
  if (st.deepError) sb.appendChild(el("p", { class: "u-note u-warnline", text: st.deepError }));
}

// ---- top bar status pill ----
function renderStatus() {
  var b = byId("uStatus"), st = store.get(), f = overallFreshness(Date.now());
  var txt = f.label + (st.origin === "snapshot" ? " · live feeds unavailable" : st.origin === "none" ? " · no live feeds" : "");
  b.textContent = txt; b.setAttribute("data-state", f.state);
  b.title = dataStatusText() + ". Click for system health.";
}
function focusHealth() {
  if (ROOT.matchMedia && ROOT.matchMedia("(max-width: 1099px)").matches) store.set({ mobileTab: "health" });
  var p = PANELS.health; if (!p) return;
  if (p.root.classList.contains("is-collapsed")) p.root.querySelector(".u-collapse").click();
  p.root.scrollIntoView({ behavior: prefersReduced() ? "auto" : "smooth", block: "nearest" });
  p.root.classList.add("is-flash"); setTimeout(function () { p.root.classList.remove("is-flash"); }, 1500);
}
function buildTabs(host) {
  clearNode(host);
  host.setAttribute("role", "tablist");
  TAB_LABELS.forEach(function (t) { host.appendChild(el("button", { type: "button", role: "tab", "data-tab-btn": t[0], text: t[1], onclick: function () { store.set({ mobileTab: t[0] }); } })); });
}
function renderTabs() {
  var cur = store.get("mobileTab");
  byId("uBody").setAttribute("data-tab", cur);
  Array.prototype.forEach.call(document.querySelectorAll("[data-tab-btn]"), function (b) { b.setAttribute("aria-selected", b.getAttribute("data-tab-btn") === cur ? "true" : "false"); });
}
function renderFooter(host) {
  clearNode(host);
  host.appendChild(el("p", {}, ["Schedule, results and betting lines: nflverse. ", D.qbCredit ? "Quarterback values: nfelo (nfeloapp.com). " : "", "Weather: ",
    el("a", { href: "https://open-meteo.com/", target: "_blank", rel: "noopener", text: "Open-Meteo" }), ". Headlines link to their publishers and are shown as published. ",
    "Injury burden, weather flags and news importance are descriptions, not part of the forecast. An independent fan project, not affiliated with the NFL, any team or any publisher."]));
}
