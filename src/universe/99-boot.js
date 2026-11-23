// Boot: state from defaults, then saved preferences, then the URL (the URL wins); render from the embedded snapshot at
// once; start the simulation and, when served by a server, the polling. Without a DOM (tests) nothing here runs.
var store = null;
var URL_DEFAULTS = { view: "universe", mode: "geo", layers: DEFAULT_LAYERS, timeRange: DEFAULT_RANGE };
function initialState(search, saved) {
  var allow = { teams: TEAMS.map(function (t) { return t.a; }), layers: LAYER_IDS, focus: FOCUS.ids };
  var s = sanitizeState({ mode: saved.mode, layers: saved.layers, timeRange: saved.timeRange }, allow), u = parseUrlState(search, allow);
  var st = Object.assign({ view: "universe", mode: HAS_GEO ? "geo" : "div", layers: DEFAULT_LAYERS.slice(), timeRange: DEFAULT_RANGE, focus: null, team: null, game: null, asOf: null }, s, u);   // asOf: [S-C time machine]
  if (st.mode === "geo" && !HAS_GEO) st.mode = "div";
  if (st.team && st.game) st.game = null;
  return st;
}
NFLU.initialState = initialState;

function boot() {
  var saved = lsGet(), init = initialState(location.search, saved), sm = null;
  try { sm = savedSimMode(ROOT.localStorage.getItem("nfl-picks-2026")); } catch (e) { /* storage blocked */ }
  if (sm != null && sm !== MODE) setMode(sm);
  var fab = D.fabric && looksLikeUniverse(D.fabric) ? D.fabric : null;
  var mtab = ["videos", "live", "podcasts"].indexOf(saved.mediaTab) >= 0 ? saved.mediaTab : "videos", mkind = VIDEO_KINDS.some(function (k) { return k[0] === saved.mediaKind; }) ? saved.mediaKind : "all";
  var chips = Array.isArray(saved.feedTypes) ? saved.feedTypes.filter(function (c) { return FEED_CHIPS.some(function (x) { return x[0] === c; }); }) : [];
  store = createStore(Object.assign(init, { search: "", feedTypes: chips, payload: fab, origin: fab ? "snapshot" : "none", fetchedAt: null, pollFails: 0, pollError: null,
    mediaTab: mtab, mediaKind: mkind, mediaShorts: saved.mediaShorts === true, mediaBlocked: false,
    breaker: "closed", model: buildModel(fab), sim: null, simBusy: false, simError: null, deepProgress: null, deepError: null, mobileTab: "feed" }));
  watchMediaBlocks();   // before anything renders a thumbnail, so the first refusal is heard

  buildRail(byId("uRail"));
  buildMap(byId("uMap"));
  buildTabs(byId("uTabs"));
  buildFocusBar(byId("uFocus"));
  buildHistory();   // [S-C time machine] the replay banner (18-history.js)
  buildFeedPanel(byId("uFeedHost"));
  // the media host sits between the feed and health in the right column (one column and a "Media" tab on phones)
  var mediaHost = el("div", { class: "u-host", id: "uMediaHost" }), hh = byId("uHealthHost");
  hh.parentNode.insertBefore(mediaHost, hh);
  buildMediaPanel(mediaHost);
  buildPlayer(byId("uapp"));
  buildHealthPanel(byId("uHealthHost"));
  buildTeamsPanel(byId("uTeamsHost"));
  buildGamesPanel(byId("uGamesHost"));
  renderFooter(byId("uFoot"));

  byId("uAsk").addEventListener("click", openBrief);
  byId("uStatus").addEventListener("click", focusHealth);
  byId("uTheme").addEventListener("click", cycleTheme);
  Array.prototype.forEach.call(document.querySelectorAll(".u-viewsw [data-view]"), function (b) { b.addEventListener("click", function () { store.set({ view: b.getAttribute("data-view") }); }); });
  var sTimer = 0, sBox = byId("uSearch");
  sBox.addEventListener("input", function () { clearTimeout(sTimer); sTimer = setTimeout(function () { store.set({ search: sBox.value }); }, 150); });
  byId("uDrawer").querySelector(".u-x").addEventListener("click", function () { closeDrawer(); });
  byId("uBrief").addEventListener("click", function (e) { if (e.target === byId("uBrief")) closeBrief(); });
  document.addEventListener("keydown", trapBriefFocus);
  document.addEventListener("keydown", function (e) { trapFocusIn(byId("uPlayer"), e); });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (!byId("uPlayer").hidden) { closePlayer(); return; }
    if (!byId("uBrief").hidden) { closeBrief(); return; }
    if (!byId("uDrawer").hidden) closeDrawer();
  });
  byId("uTicker").addEventListener("focusin", function () { this.classList.add("is-paused"); });
  byId("uTicker").addEventListener("focusout", function () { this.classList.remove("is-paused"); });

  store.subscribe(function (st, ch) {
    var has = function () { for (var i = 0; i < arguments.length; i++) if (ch.indexOf(arguments[i]) >= 0) return true; return false; };
    if (has("view", "mode", "layers", "timeRange", "focus", "team", "game")) writeUrlSoon(st, URL_DEFAULTS);
    if (has("mode", "layers", "timeRange")) lsSet({ mode: st.mode, layers: st.layers, timeRange: st.timeRange });
    if (has("view")) applyView();
    if (has("model", "origin")) requestBaseSim();
    if (has("focus")) { renderFocusBar(); fitFocus(); }
    if (has("mode", "layers", "timeRange", "model", "sim", "search", "team", "game", "focus")) drawMapSoon();
    if (has("feedTypes", "timeRange", "model", "search", "focus")) renderFeed();
    if (has("timeRange", "model", "focus")) renderTicker(byId("uTicker"));
    if (has("model", "sim", "search", "focus")) renderGames();
    if (has("sim", "model", "search", "team", "focus")) renderTeamsPanel();
    if (has("payload", "origin", "pollFails", "sim", "simBusy", "simError", "fetchedAt", "breaker")) { renderHealth(); renderStatus(); refreshBadges(); }
    if (has("mode", "layers", "timeRange", "sim", "simBusy", "simError", "deepProgress", "deepError", "payload", "origin")) renderRail();
    if (has("team", "game", "view") || (has("sim", "model", "pollFails", "mediaBlocked") && (st.team || st.game))) renderDrawer();
    if (has("mobileTab")) renderTabs();
    // [S-C time machine] a new replay time redraws only what is replayed: the feed, the ticker and the map's badges
    if (has("asOf")) { writeUrlSoon(st, URL_DEFAULTS); drawMapSoon(); renderFeed(); renderTicker(byId("uTicker")); }
    if (has("asOf", "model", "payload", "view")) renderHistory();
    if (has("model", "timeRange", "search", "team", "focus", "mediaTab", "mediaKind", "mediaShorts", "payload", "mediaBlocked")) renderMedia();
  });

  applyView(); renderRail(); renderTabs(); renderStatus(); renderFocusBar(); fitFocus(); renderHistory();   // renderHistory: [S-C time machine]
  drawMap(); renderFeed(); renderMedia(); renderTicker(byId("uTicker")); renderGames(); renderTeamsPanel(); renderHealth(); refreshBadges(); renderDrawer();
  bootWatch();   // S-D: watchlist alerts and the "What changed" panel (17-watch.js)
  requestBaseSim(true);
  startPolling();
  setInterval(function () { refreshBadges(); renderStatus(); }, 5000);
  setInterval(function () { if (store.get("view") === "universe") renderFeed(); }, 60000);
  if (ROOT.matchMedia) { var mq = ROOT.matchMedia("(prefers-reduced-motion: reduce)"); if (mq.addEventListener) mq.addEventListener("change", function () { renderTicker(byId("uTicker")); }); }
  NFLU.booted = true;
  NFLU.store = store;
}

if (HAS_DOM && document.getElementById("uapp")) {
  var startUniverse = function () {
    try { boot(); }
    catch (e) {
      uReport("boot", e);
      // The command center failed: fall back to the simulator exactly as before.
      var u = byId("uBody"); if (u) u.hidden = true;
      var sv = byId("simView"); if (sv) sv.hidden = false;
      if (typeof ROOT.nflSimStart === "function") ROOT.nflSimStart();
    }
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", startUniverse); else startUniverse();
}
