// NFL TV (DEC-022): a panel that plays official videos one after another: the teams' newest press conferences and media
// sessions, then the league channel's newest videos (the `youtube-reel` source picks them and checks with YouTube's oEmbed
// that each may be embedded at all). The NFL also blocks its own videos, and team videos with its game footage, on sites
// it has not approved, and only the player can tell: so the page uses YouTube's official IFrame Player API, loaded only
// when the panel plays, and moves to the next video whenever the player reports one it cannot play here. A video that
// will never play here is remembered in this browser, so it is not tried again; when none is left, the panel shows links.
// It starts by itself, muted, only where that is welcome: a wide screen, no request for reduced motion or reduced data,
// not turned off by the viewer (remembered), the panel open, and a host that does not block outside players. Anywhere
// else a tap starts it, with sound. YouTube's rules for its player (Required Minimum Functionality) are kept: playback
// starts by itself only while more than half of the player is on screen, the player is at least 200 by 200 pixels, no
// other player on the page starts by itself, nothing covers it, and YouTube's terms are linked beside it. The NFL Channel and the NFL's live game streams cannot be embedded (NFL.com offers no
// embed; the NFL turns embedding off for its YouTube game streams), so they are links.
var tvPanel = null;
var tvState = { key: null, tapped: false, sound: false, player: null, slot: null, ids: [], i: -1, current: null, skipped: 0, failed: dict(), nowEl: null,
  ready: false, held: false, view: false, ratio: 0, w: 0, h: 0, io: null };
var NFL_CHANNEL_LIVE = "https://www.nfl.com/watch/nfl-channel-live";
var TV_API = "https://www.youtube.com/iframe_api", TV_HOST = "https://www.youtube-nocookie.com";
var TV_ID_RE = /^[A-Za-z0-9_-]{11}$/, TV_BAD_MAX = 60;

// ---- pure parts ----
// The ids to play, in order: well formed, each once, none of those known not to play here.
function tvQueue(ids, bad) {
  var seen = dict();
  return (Array.isArray(ids) ? ids : []).filter(function (id) { return typeof id === "string" && TV_ID_RE.test(id) && !(bad && bad[id]) && !seen[id] && (seen[id] = 1); });
}
// After video i (-1: before the first), the next to play, round and round; a video in bad is skipped. -1: none left.
function tvStep(ids, i, bad) {
  var n = (ids || []).length;
  for (var k = 1; k <= n; k++) { var j = (((i + k) % n) + n) % n; if (!(bad && bad[ids[j]])) return j; }
  return -1;
}
// The player's settings: starts by itself only when it may (play), muted unless the viewer started it, plays inline on
// phones, and suggests only videos from the same channel when one ends.
function tvVars(sound, play) { return { autoplay: play ? 1 : 0, mute: sound ? 0 : 1, playsinline: 1, rel: 0 }; }
// Whether playback may start by itself (YouTube's Required Minimum Functionality): the page showing, more than half of
// the player visible, and the player at least 200 by 200 pixels.
function tvInView(ratio, w, h, hidden) { return !hidden && ratio > 0.5 && w >= 200 && h >= 200; }
// The player's error codes that mean this video will not play on this site, whenever it is tried (remembered): 100 gone
// or private, 101 and 150 its owner does not allow it here. Others (2 a bad request, 5 the browser's player failed)
// may pass, so they are skipped for this visit only.
function tvLasting(code) { return code === 100 || code === 101 || code === 150; }
// The remembered list with ids added: each once, newest last, at most TV_BAD_MAX.
function tvRemember(list, ids) {
  var out = (Array.isArray(list) ? list : []).filter(function (id) { return typeof id === "string" && TV_ID_RE.test(id) && ids.indexOf(id) < 0; });
  return out.concat(ids.filter(function (id) { return TV_ID_RE.test(id); })).slice(-TV_BAD_MAX);
}
// Whether the player may start by itself (muted). env: {wide, reducedMotion, saveData, off, blocked, closed, count}.
function tvAutoplay(env) {
  return !!(env && env.wide && !env.reducedMotion && !env.saveData && !env.off && !env.blocked && !env.closed && env.count > 0);
}
NFLU.tvQueue = tvQueue; NFLU.tvStep = tvStep; NFLU.tvVars = tvVars; NFLU.tvInView = tvInView; NFLU.tvLasting = tvLasting; NFLU.tvRemember = tvRemember; NFLU.tvAutoplay = tvAutoplay;

// ---- the player ----
// The videos not to try: those remembered in this browser, and those that failed during this visit.
function tvBad() {
  var bad = dict(), list = lsGet().tvBad;
  (Array.isArray(list) ? list : []).forEach(function (id) { if (typeof id === "string") bad[id] = 1; });
  for (var id in tvState.failed) bad[id] = 1;
  return bad;
}
// YouTube's IFrame Player API, loaded once and only when NFL TV is about to play. done(true) when it is ready, done(false)
// when it cannot load (no network, or a page policy that refuses outside scripts).
var tvApi = { state: "idle", waiting: [] };
function tvLoadApi(done) {
  if (ROOT.YT && typeof ROOT.YT.Player === "function" && tvApi.state !== "loading") return done(true);
  if (tvApi.state === "failed") return done(false);
  tvApi.waiting.push(done);
  if (tvApi.state === "loading") return;
  tvApi.state = "loading";
  var timer = null;
  var finish = function (ok) {
    if (tvApi.state !== "loading") return;
    tvApi.state = ok ? "ready" : "failed";
    clearTimeout(timer);
    var w = tvApi.waiting; tvApi.waiting = [];
    w.forEach(function (f) { try { f(ok); } catch (e) { uReport("NFL TV", e); } });
  };
  var prev = ROOT.onYouTubeIframeAPIReady;
  ROOT.onYouTubeIframeAPIReady = function () { if (typeof prev === "function") { try { prev(); } catch (e) { /* not ours */ } } finish(!!(ROOT.YT && ROOT.YT.Player)); };
  timer = setTimeout(function () { finish(false); }, 15000);
  try {
    var s = document.createElement("script");
    s.src = TV_API; s.async = true;
    s.onerror = function () { finish(false); };
    document.head.appendChild(s);
  } catch (e) { finish(false); }
}
// Is the player on screen enough? Kept current by an IntersectionObserver (which also sees the columns' own scrolling)
// and by the page being hidden or shown; a change starts a video held back, or pauses a muted one that left the screen.
function tvWatch(box) {
  tvState.view = false; tvState.ratio = 0;
  var r0 = box.getBoundingClientRect ? box.getBoundingClientRect() : { width: 0, height: 0 };
  tvState.w = r0.width; tvState.h = r0.height;
  if (typeof ROOT.IntersectionObserver !== "function") {   // no observer: judged once, from the window alone
    var vh = ROOT.innerHeight || 0, vis = Math.max(0, Math.min(r0.bottom, vh) - Math.max(r0.top, 0));
    tvState.ratio = r0.height ? vis / r0.height : 0; tvViewCheck();
    return;
  }
  tvState.io = new ROOT.IntersectionObserver(function (entries) {
    var e = entries[entries.length - 1];
    tvState.ratio = e.intersectionRatio; tvState.w = e.boundingClientRect.width; tvState.h = e.boundingClientRect.height;
    tvViewCheck();
  }, { threshold: [0, 0.25, 0.5, 0.51, 0.75, 1] });
  tvState.io.observe(box);
}
function tvViewCheck() {
  tvState.view = tvInView(tvState.ratio, tvState.w, tvState.h, !!document.hidden);
  var p = tvState.player;
  if (!p || !tvState.ready) return;
  try {
    if (tvState.view && tvState.held) { tvState.held = false; p.playVideo(); }
    else if (!tvState.view && !tvState.sound && !tvState.held) {
      var st = p.getPlayerState();
      if (st === 1 || st === 3) { p.pauseVideo(); tvState.held = true; }   // muted and off screen: wait until it is back
    }
  } catch (e) { uReport("NFL TV", e); }
}
function tvDestroy() {
  var p = tvState.player;
  if (tvState.io) { try { tvState.io.disconnect(); } catch (e) { /* gone */ } }
  tvState.player = null; tvState.slot = null; tvState.current = null; tvState.nowEl = null; tvState.io = null; tvState.ready = false; tvState.held = false; tvState.view = false;
  if (p && typeof p.destroy === "function") { try { p.destroy(); } catch (e) { /* already gone */ } }
}
function tvVideo(id) { return (mediaRefs().reel || []).filter(function (v) { return v.videoId === id; })[0] || null; }
function tvCaption() {
  var box = tvState.nowEl;
  if (!box) return;
  // counted among the videos that may still play here
  var v = tvVideo(tvState.current), bad = tvBad(), left = tvState.ids.filter(function (id) { return !bad[id]; }), n = left.length, at = left.indexOf(tvState.current);
  clearNode(box);
  box.appendChild(el("span", { class: "u-tvtitle", text: v ? (v.channel ? v.channel + ": " : "") + v.title : "Loading…" }));
  box.appendChild(el("span", { text: " " + (tvState.sound ? "" : "Muted: unmute in the player. ") + (n > 1 && at >= 0 ? "Video " + (at + 1) + " of " + n + ". " : "") +
    (tvState.skipped ? tvState.skipped + " skipped: their owners do not let this site show them. " : "") }));
  if (n > 1) box.appendChild(el("button", { type: "button", class: "u-linkbtn", "data-fk": "tv-next", text: "Next video", onclick: function () { tvNext(); } }));
  box.appendChild(document.createTextNode(" · "));
  box.appendChild(el("button", { type: "button", class: "u-linkbtn", "data-fk": "tv-off", text: "Turn off NFL TV", onclick: function () { tvState.tapped = false; lsSet({ tvOff: true }); renderTv(); } }));
}
// Play the next video that may still play here; with none left, the panel shows its links instead.
function tvNext() {
  var p = tvState.player;
  if (!p) return;
  var j = tvStep(tvState.ids, tvState.i, tvBad());
  if (j < 0) { tvDestroy(); tvState.key = null; renderTv(); return; }
  tvState.i = j; tvState.current = tvState.ids[j];
  // off screen, the next video is only made ready; it starts when the player is back in view
  try { if (tvState.view) p.loadVideoById(tvState.current); else { p.cueVideoById(tvState.current); tvState.held = true; } } catch (e) { uReport("NFL TV", e); }
  tvCaption();
}
// The player could not play the current video here: skip it, and remember it when that will not change.
function tvFailed(code) {
  var id = tvState.current;
  if (!id || !tvState.player) return;
  tvState.failed[id] = 1; tvState.skipped++;
  if (tvLasting(code)) lsSet({ tvBad: tvRemember(lsGet().tvBad, [id]) });
  tvNext();
}
function tvStart(slot) {
  if (tvState.slot !== slot) return;   // a later drawing replaced this one while the API was loading
  var j = tvStep(tvState.ids, -1, tvBad());
  if (j < 0) { tvState.key = null; tvState.slot = null; renderTv(); return; }
  tvState.i = j; tvState.current = tvState.ids[j];
  tvState.held = !tvState.view;   // out of view now: loaded, and started once it is in view
  tvState.player = new ROOT.YT.Player(slot, { host: TV_HOST, width: "100%", height: "100%", videoId: tvState.current, playerVars: tvVars(tvState.sound, tvState.view),
    events: {
      onReady: function (e) {
        try { var f = e.target.getIframe(); f.title = "NFL TV: official NFL and team videos (YouTube player)"; } catch (x) { /* cosmetic */ }
        tvState.ready = true; tvViewCheck();
      },
      onStateChange: function (e) { if (e && e.data === 0) tvNext(); },   // 0: the video ended
      onError: function (e) { tvFailed(e && e.data); } } });
  tvCaption();
}

// ---- the panel ----
function tvEnv() {
  var mm = function (q) { try { return ROOT.matchMedia(q).matches; } catch (e) { return false; } };
  var conn = ROOT.navigator && ROOT.navigator.connection;
  return { wide: isWide(), reducedMotion: mm("(prefers-reduced-motion: reduce)"), saveData: !!(conn && conn.saveData), off: lsGet().tvOff === true,
    blocked: mediaBlocked(), closed: !tvPanel || tvPanel.hidden || tvPanel.root.classList.contains("is-collapsed") };
}
function buildTvPanel(host) {
  tvPanel = Panel({ id: "tv", title: "NFL TV", sources: ["youtube-reel", "youtube-official"], cls: "u-tvpanel" });
  tvPanel.loading("Loading NFL TV…");
  host.appendChild(tvPanel.root);
  // a panel hidden from the Panels menu or folded stops playing; shown or opened again, it follows the same rules
  var setHidden = tvPanel.setHidden;
  tvPanel.setHidden = function (h) { setHidden(h); renderTv(); };
  try { ROOT.matchMedia(WIDE_MQ).addListener(function () { renderTv(); }); } catch (e) { /* older browsers: the next render decides */ }
  try { document.addEventListener("visibilitychange", function () { tvViewCheck(); }); } catch (e) { /* no page visibility: the observer decides */ }
}
function tvLinks(md) {
  var league = (md.channels || []).filter(function (c) { return c.team == null && c.live; })[0];
  return el("p", { class: "u-tvlinks" }, [
    el("a", { href: NFL_CHANNEL_LIVE, target: "_blank", rel: "noopener", text: "NFL Channel, live on NFL.com ↗" }),
    league ? el("a", { href: league.live, target: "_blank", rel: "noopener", text: "NFL on YouTube: live page ↗" }) : null]);
}
function tvList(body, note, reel) {
  body.appendChild(el("p", { class: "u-note", text: note }));
  if (reel.length) body.appendChild(el("ul", { class: "u-list" }, reel.slice(0, 4).map(function (v) {
    return el("li", {}, [el("a", { href: v.url, target: "_blank", rel: "noopener", text: (v.channel ? v.channel + ": " : "") + v.title + " ↗" })]); })));
}
function renderTv() {
  if (!tvPanel) return;
  var md = mediaRefs(), env = tvEnv(), bad = tvBad();
  var reel = (md.reel || []).filter(function (v) { return v.embed && v.url; });
  var ids = tvQueue(reel.map(function (v) { return v.videoId; }), bad);
  env.count = ids.length;
  var playing = ids.length > 0 && !env.blocked && !env.closed && (tvAutoplay(env) || tvState.tapped);
  var mode = env.closed ? "closed" : !md.present ? "nodata" : env.blocked ? "blocked" : !ids.length ? (reel.length ? "none" : "empty")
    : playing ? (tvApi.state === "failed" ? "noapi" : "play") : "poster";
  // a player already going keeps the video it is on; a new reel takes over from the next video
  if (mode === "play" && tvState.slot && tvState.sound === !!tvState.tapped && tvState.key && tvState.key.indexOf("play|") === 0) {
    tvState.ids = ids; tvState.i = ids.indexOf(tvState.current); tvCaption();
    return;
  }
  var key = mode + "|" + (mode === "play" ? !!tvState.tapped : ids.join(",") + "|" + reel.length + "|" + env.off);
  if (key === tvState.key && tvPanel.body.firstChild) return;   // the same thing, already showing
  tvState.key = key;
  tvDestroy();
  if (mode === "closed") { clearNode(tvPanel.body); return; }   // stops a playing video; drawn again when opened
  tvPanel.render(function (body) {
    if (mode === "nodata") body.appendChild(el("p", { class: "u-note", text: "No media data yet." }));
    else if (mode === "empty") body.appendChild(el("p", { class: "u-note", text: "No official video can be played here right now: the newest ones do not allow other sites to show them." }));
    else if (mode === "none") tvList(body, "The newest videos picked for NFL TV cannot be shown on this site (their owners, usually the NFL, block it), so these open on YouTube:", reel);
    else if (mode === "blocked") tvList(body, "The site showing this page blocks video players from other sites, so these open on YouTube:", reel);
    else if (mode === "noapi") tvList(body, "YouTube's player could not be loaded here, so these open on YouTube:", reel);
    else if (mode === "play") {
      var slot = el("div", {}), box = el("div", { class: "u-tvframe" }, [slot]);
      body.appendChild(box);
      var now = el("p", { class: "u-tvnow", text: "Loading YouTube's player…" });
      body.appendChild(now);
      tvState.slot = slot; tvState.nowEl = now; tvState.sound = !!tvState.tapped; tvState.ids = ids; tvState.i = -1; tvState.skipped = 0;
      tvWatch(box);
      tvLoadApi(function (ok) {
        if (tvState.slot !== slot) return;
        if (ok) tvStart(slot); else { tvState.key = null; tvState.slot = null; renderTv(); }
      });
    } else {
      var first = tvVideo(ids[0]) || reel[0];
      body.appendChild(el("button", { type: "button", class: "u-tvposter", "data-fk": "tv-play", "aria-label": "Play NFL TV: " + ids.length + " official videos, starting with " + first.title,
        onclick: function () { tvState.tapped = true; lsSet({ tvOff: false }); renderTv(); } }, [
          first.thumb ? el("img", { src: first.thumb, alt: "", width: "320", height: "180", loading: "lazy", referrerpolicy: "no-referrer" }) : null,
          el("span", { class: "u-tvplay", "aria-hidden": "true", text: "▶" }), el("span", { class: "u-tvcap", text: first.title })]));
      body.appendChild(el("p", { class: "u-note", text: env.off ? "Turned off: it will not start by itself until you play it again." : "Starts by itself, muted, on wide screens; tap to play here." }));
    }
    body.appendChild(tvLinks(md));
    if (mode === "play" || mode === "poster") body.appendChild(el("p", { class: "u-credit" }, ["Played in YouTube's own player. ", ytTerms()]));
  });
}
