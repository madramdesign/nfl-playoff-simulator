// Media center (milestone M8, docs/MEDIA_ARCHITECTURE.md): official league and team YouTube channels, their latest
// videos, and official NFL podcasts. Everything plays click-to-load: no player exists until the viewer asks for one.
// Every address is checked against a strict allowlist here, on top of the contract check on the server; an address that
// fails is simply not rendered, and the plain YouTube link is offered instead. No address is ever built from a title.

// ---- allowlists (pure) ----
// Players load single videos only. A channel's live stream is a link to its live page on YouTube: YouTube's
// live_stream embed showed "This video is unavailable" in testing (Nov. 21, 2026), even for a channel streaming all day.
var EMBED_RE = /^https:\/\/www\.youtube(-nocookie)?\.com\/embed\/[A-Za-z0-9_-]{11}$/;
var THUMB_RE = /^https:\/\/i\.ytimg\.com\/[A-Za-z0-9_\-\/.]+$/;
var WATCH_RE = /^https:\/\/www\.youtube\.com\/(watch\?v=[A-Za-z0-9_-]{11}|channel\/UC[A-Za-z0-9_-]{22}(\/live)?)$/;
function safeEmbedSrc(u) { return typeof u === "string" && EMBED_RE.test(u) ? u : null; }
function safeThumbSrc(u) { return typeof u === "string" && THUMB_RE.test(u) && u.indexOf("..") < 0 ? u : null; }
function safeYouTubeLink(u) { return typeof u === "string" && WATCH_RE.test(u) ? u : null; }
// Podcast audio: only a clip of the NFL's own Omny account, optionally behind the measurement redirects its feeds use.
// Mirrors PODCAST_AUDIO in lib/contract.js (a test checks they are identical). Episode pages: omny.fm show pages only.
var PODCAST_AUDIO_RE = new RegExp("^https://(?:pdrl\\.fm/[0-9a-f]{4,12}/|(?:www\\.)?podtrac\\.com/pts/redirect\\.mp3/|claritaspod\\.com/measure/){0,4}" +
  "traffic\\.omny\\.fm/d/clips/e73c998e-6e60-432f-8610-ae210140c5b1/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/audio\\.mp3(?:\\?[A-Za-z0-9_=&%.-]*)?$");
var PODCAST_PAGE_RE = /^https:\/\/(www\.)?omny\.fm\/shows\/[A-Za-z0-9_\-\/]+$/;
function safeAudioSrc(u) { return typeof u === "string" && u.length < 1000 && PODCAST_AUDIO_RE.test(u) ? u : null; }
function safeHttpsLink(u) { return typeof u === "string" && PODCAST_PAGE_RE.test(u) ? u : null; }
// Attributes for the players, in one place so tests can check them: no autoplay, no preloading, the referrer YouTube
// needs (it refuses embeds without one) and no referrer at all for podcast hosts.
function playerFrameAttrs(src, title) {
  return { src: src, title: title + " (YouTube player)", referrerpolicy: "strict-origin-when-cross-origin", allow: "encrypted-media; picture-in-picture; fullscreen", allowfullscreen: true };
}
function audioAttrs(src, label) { return { controls: true, preload: "none", src: src, referrerpolicy: "no-referrer", "aria-label": label, "data-label": label }; }
var NEW_TAB = " (opens in a new tab)";

// ---- hosts that refuse outside media (pure parts) ----
// Some places that show a copy of this page refuse images, players and audio from other sites (claude.ai's artifact
// viewer does). The browser reports each refusal as a "securitypolicyviolation" event. The first one that names a
// YouTube or podcast address switches the page to links: every video opens on YouTube and every episode on its own page.
var MEDIA_HOST_RE = /^https?:\/\/([a-z0-9-]+\.)*(youtube\.com|youtube-nocookie\.com|ytimg\.com|omny\.fm|pdrl\.fm|podtrac\.com|claritaspod\.com)(?=[\/:?#]|$)/i;
var MEDIA_DIRECTIVE_RE = /^(img-src|media-src|frame-src|child-src|default-src)(-elem)?$/;
function isMediaBlock(e) {
  if (!e || typeof e !== "object") return false;
  var d = String(e.effectiveDirective || e.violatedDirective || "").split(" ")[0];
  return MEDIA_DIRECTIVE_RE.test(d) && MEDIA_HOST_RE.test(String(e.blockedURI || e.blockedURL || ""));
}
// What a video does when chosen: "play" in the page's player, "link" to YouTube in a new tab, or "text" (no address).
function videoAction(v, blocked) { return v.embed && !blocked ? "play" : v.url ? "link" : "text"; }
// What an episode offers: "play" (an audio player), "page" (its episode page), "file" (its audio file in a new tab), "none".
function podcastAction(p, blocked) { return p.audio && !blocked ? "play" : p.url ? "page" : p.audio ? "file" : "none"; }
var BLOCKED_NOTE = "The site showing this page blocks video players and audio from other sites, so videos open on YouTube and episodes on their own page, each in a new tab.";
function mediaBlocked() { return !!(store && store.get("mediaBlocked")); }

// ---- normalising the payload's media block (pure) ----
var MEDIA_KINDS = ["press", "highlights", "preview", "short", "video"];
function mediaTeam(a) { return typeof a === "string" && TIDX[a] != null ? TIDX[a] : null; }
function mediaTeams(list) { var out = []; (Array.isArray(list) ? list : []).forEach(function (a) { var i = mediaTeam(a); if (i != null && out.indexOf(i) < 0) out.push(i); }); return out; }
function normMedia(payload) {
  var m = payload && payload.media && typeof payload.media === "object" ? payload.media : null;
  var out = { present: !!m, channels: [], videos: [], podcasts: [], reel: [] };
  if (!m) return out;
  var seenCh = dict(), seenV = dict(), seenP = dict();
  (Array.isArray(m.channels) ? m.channels : []).forEach(function (c) {
    if (!c || typeof c !== "object" || typeof c.channelId !== "string" || seenCh[c.channelId]) return;
    var live = safeYouTubeLink(c.liveUrl);
    if (live && live !== "https://www.youtube.com/channel/" + c.channelId + "/live") live = null;   // only this channel's own live page
    var ch = { name: String(c.name || ""), team: mediaTeam(c.team), channelId: c.channelId, url: safeYouTubeLink(c.url), live: live };
    if (!ch.name || (!ch.url && !ch.live)) return;
    seenCh[c.channelId] = 1; out.channels.push(ch);
  });
  (Array.isArray(m.videos) ? m.videos : []).forEach(function (v) {
    if (!v || typeof v !== "object" || typeof v.title !== "string" || !v.title || typeof v.videoId !== "string" || seenV[v.videoId]) return;
    var t = Date.parse(v.published); if (!isFinite(t)) return;
    var teams = mediaTeams(v.teams), own = mediaTeam(v.team);
    if (own != null && teams.indexOf(own) < 0) teams.unshift(own);
    seenV[v.videoId] = 1;
    out.videos.push({ id: String(v.id || "yt-" + v.videoId), videoId: v.videoId, title: v.title, channel: String(v.channel || ""), team: own, teams: teams,
      kind: MEDIA_KINDS.indexOf(v.kind) >= 0 ? v.kind : "video", ts: t, tsMs: t, url: safeYouTubeLink(v.url), embed: safeEmbedSrc(v.embedUrl), thumb: safeThumbSrc(v.thumb), source: v.source || null });
  });
  (Array.isArray(m.podcasts) ? m.podcasts : []).forEach(function (e) {
    if (!e || typeof e !== "object" || typeof e.title !== "string" || !e.title) return;
    var t = Date.parse(e.published), key = String(e.id || e.audioUrl || e.title); if (!isFinite(t) || seenP[key]) return;
    seenP[key] = 1;
    out.podcasts.push({ id: key, show: String(e.show || ""), title: e.title, ts: t, tsMs: t, url: safeHttpsLink(e.url), audio: safeAudioSrc(e.audioUrl),
      durationSec: num(e.durationSec), teams: mediaTeams(e.teams), source: e.source || null });
  });
  out.videos.sort(function (a, b) { return b.ts - a.ts; });
  out.podcasts.sort(function (a, b) { return b.ts - a.ts; });
  // NFL TV's reel: the payload's order, only videos above that have a checked embed address, each once
  var byVid = dict(), seenR = dict(); out.videos.forEach(function (v) { byVid[v.videoId] = v; });
  out.reel = (Array.isArray(m.reel) ? m.reel : []).filter(function (id) { return typeof id === "string" && byVid[id] && byVid[id].embed && !seenR[id] && (seenR[id] = 1); }).slice(0, 12).map(function (id) { return byVid[id]; });
  return out;
}

// ---- selections (pure) ----
var VIDEO_KINDS = [["all", "All"], ["press", "Press conferences"], ["highlights", "Highlights"], ["preview", "Previews"]];
function videoMatches(v, q) {
  if (!q) return true;
  var tm = searchTeams(q);
  return v.teams.some(function (t) { return tm[t]; }) || (v.title + " " + v.channel).toLowerCase().indexOf(q) >= 0;
}
// kind: "all" or one kind; Shorts appear only when shorts is true.
function filterVideos(videos, kind, shorts, range, now, query) {
  var q = (query || "").trim().toLowerCase();
  return filterByTime(videos || [], range, now).filter(function (v) {
    if (v.kind === "short" && !shorts) return false;
    if (kind && kind !== "all" && v.kind !== kind) return false;
    return videoMatches(v, q);
  });
}
function filterPodcasts(pods, range, now, query) {
  var q = (query || "").trim().toLowerCase(), tm = q ? searchTeams(q) : null;
  return filterByTime(pods || [], range, now).filter(function (p) {
    return !q || p.teams.some(function (t) { return tm[t]; }) || (p.show + " " + p.title).toLowerCase().indexOf(q) >= 0;
  });
}
function teamVideos(videos, i, n) {
  return (videos || []).filter(function (v) { return v.team === i || v.teams.indexOf(i) >= 0; }).slice(0, n || 6);
}
// Videos for a game: both teams named first, then either team; the last 7 days; newest first within each group.
function gameVideos(videos, away, home, now, n) {
  var recent = filterByTime(videos || [], "7d", now);
  var both = recent.filter(function (v) { return v.teams.indexOf(away) >= 0 && v.teams.indexOf(home) >= 0; });
  var either = recent.filter(function (v) { return both.indexOf(v) < 0 && (v.teams.indexOf(away) >= 0 || v.teams.indexOf(home) >= 0); });
  return both.concat(either).slice(0, n || 4);
}
// NFL channels first, then teams by name; a selected team's channel goes to the very top.
function channelOrder(channels, sel) {
  return (channels || []).slice().sort(function (a, b) {
    var ka = a.team != null && a.team === sel ? 0 : a.team == null ? 1 : 2, kb = b.team != null && b.team === sel ? 0 : b.team == null ? 1 : 2;
    return ka - kb || a.name.localeCompare(b.name);
  });
}
function videoCounts(videos) { var n = dict(); (videos || []).forEach(function (v) { v.teams.forEach(function (t) { n[t] = (n[t] || 0) + 1; }); }); return n; }
function fmtDuration(s) { if (s == null || s <= 0) return ""; var m = Math.round(s / 60); return m >= 60 ? Math.floor(m / 60) + " h " + (m % 60) + " min" : m + " min"; }

// ---- rendering ----
var mediaPanel = null;
function mediaRefs() { return store.get("model") ? store.get("model").media : normMedia(null); }
// One video: the thumbnail and title open the player when the embed address passed the allowlist; otherwise they are a
// plain link to YouTube; with neither, the title is shown as text. Where the host blocks outside media, there is no
// thumbnail and the title is the link.
function videoItem(v, now, compact) {
  var blocked = mediaBlocked(), act = videoAction(v, blocked);
  var head = blocked ? [el("span", { class: "u-vtitle", text: v.title }), act === "link" ? el("span", { class: "u-vout", "aria-hidden": "true", text: " ↗" }) : null]
    : [v.thumb ? el("img", { src: v.thumb, alt: "", width: "160", height: "90", loading: "lazy", referrerpolicy: "no-referrer", class: "u-vthumb" }) : el("span", { class: "u-vthumb u-vnothumb", "aria-hidden": "true" }),
      el("span", { class: "u-vtitle", text: v.title })];
  var label = (act === "play" ? "Play: " : "Watch on YouTube: ") + v.title + " (" + v.channel + ")" + (act === "play" ? "" : NEW_TAB);
  var key = "v:" + v.videoId + (compact ? ":c" : "");
  var main = act === "play" ? el("button", { type: "button", class: "u-vmain", "data-fk": key, "aria-label": label, onclick: function () { openPlayer({ src: v.embed, url: v.url, title: v.title, channel: v.channel, key: key }); } }, head)
    : act === "link" ? el("a", { class: "u-vmain", href: v.url, target: "_blank", rel: "noopener", "data-fk": key, "aria-label": label }, head)
    : el("div", { class: "u-vmain" }, head);
  return el("li", { class: "u-vid" + (compact ? " is-compact" : "") + (blocked ? " is-linkonly" : "") }, [main,
    el("div", { class: "u-vmeta" }, [el("span", { class: "u-vkind", text: v.kind === "press" ? "press" : v.kind === "short" ? "short" : v.kind }), el("span", { text: v.channel }),
      el("time", { datetime: new Date(v.ts).toISOString(), text: fmtRel(v.ts, now) }), v.teams.slice(0, 3).map(teamChip),
      v.url && act === "play" ? el("a", { href: v.url, target: "_blank", rel: "noopener", class: "u-vyt", text: "YouTube", "aria-label": "YouTube" + NEW_TAB }) : null])]);
}
// One episode's controls: the audio player, or links where the host blocks outside audio.
function podcastControls(p, label, playing) {
  var act = podcastAction(p, mediaBlocked());
  if (act === "play") return [p.audio === playing ? el("p", { class: "u-note", text: "Playing in the bar above." }) : el("audio", audioAttrs(p.audio, label)),
    p.url ? el("a", { href: p.url, target: "_blank", rel: "noopener", class: "u-podlink", text: "Episode page", "aria-label": "Episode page" + NEW_TAB }) : null];
  if (act === "page") return [el("a", { href: p.url, target: "_blank", rel: "noopener", class: "u-btn u-small", text: "Listen on the episode page ↗", "aria-label": "Listen on the episode page: " + label + NEW_TAB })];
  if (act === "file") return [el("a", { href: p.audio, target: "_blank", rel: "noopener noreferrer", class: "u-btn u-small", text: "Open the audio file ↗", "aria-label": "Open the audio file: " + label + NEW_TAB })];
  return [el("p", { class: "u-note", text: "No playable audio address for this episode." })];
}
// Called when the host refuses outside media: a player already open loses its frame and keeps the YouTube link.
function onMediaBlocked() {
  var m = byId("uPlayer"), f = m && !m.hidden ? m.querySelector(".u-frame") : null;
  if (f) f.parentNode.replaceChild(el("p", { class: "u-state u-warnline", text: "The site showing this page blocks YouTube's player. Use Watch on YouTube below; it opens in a new tab." }), f);
}
function watchMediaBlocks() {
  if (!HAS_DOM || typeof document.addEventListener !== "function") return;
  document.addEventListener("securitypolicyviolation", function (e) {
    if (!isMediaBlock(e) || mediaBlocked()) return;
    store.set({ mediaBlocked: true });
    onMediaBlocked();
  });
}
// A link to the channel's live page. Its wording never says the channel is live: YouTube shows that on the page.
function liveButton(ch) {
  if (ch.live) return el("a", { class: "u-btn u-small", href: ch.live, target: "_blank", rel: "noopener", "data-fk": "live:" + ch.channelId,
    "aria-label": "Live page ↗ " + ch.name + " on YouTube" + NEW_TAB + "; YouTube shows a stream only if the channel is streaming", text: "Live page ↗" });
  return ch.url ? el("a", { class: "u-btn u-small", href: ch.url, target: "_blank", rel: "noopener", text: "Channel on YouTube ↗", "aria-label": "Channel on YouTube ↗ " + ch.name + NEW_TAB }) : null;
}
// Whether a media source is out (down, or not answered yet) for this payload.
function mediaSourceOut(id) {
  var M = store.get("model"), s = M && M.sources && hasOwn(M.sources, id) ? M.sources[id] : null;
  return !s ? "missing" : s.status === "down" ? "down" : s.status === "pending" ? "pending" : null;
}
function outageText(id, what) {
  var o = mediaSourceOut(id);
  return o === "down" ? "The " + what + " source is unavailable right now (see System health); this does not mean there are no " + what + "."
    : o === "pending" ? "The " + what + " source has not answered yet." : null;
}
// A playing podcast survives redraws: its <audio> element is moved (not re-created) into the "Now playing" bar.
function keepPlaying() {
  if (!mediaPanel || !mediaPanel.now) return;
  var a = Array.prototype.filter.call(mediaPanel.body.querySelectorAll("audio"), function (x) { return !x.paused && !x.ended; })[0];
  if (!a) return;
  var bar = mediaPanel.now; clearNode(bar);
  bar.appendChild(el("span", { class: "u-note", text: "Now playing: " + (a.getAttribute("data-label") || "podcast episode") }));
  bar.appendChild(a);
  bar.appendChild(el("button", { type: "button", class: "u-linkbtn", text: "Stop", onclick: function () { a.pause(); clearNode(bar); bar.hidden = true; } }));
  bar.hidden = false;
}
function nowPlayingSrc() { var a = mediaPanel && mediaPanel.now && !mediaPanel.now.hidden ? mediaPanel.now.querySelector("audio") : null; return a ? a.getAttribute("src") : null; }
function buildMediaPanel(host) {
  mediaPanel = Panel({ id: "media", title: "Media", sources: ["youtube-official", "podcasts-nfl"], cls: "u-mediapanel" });
  var tabs = el("div", { class: "u-chips u-mtabs", role: "group", "aria-label": "Media" });
  [["videos", "Latest videos"], ["live", "Live pages"], ["podcasts", "Podcasts"]].forEach(function (t) {
    tabs.appendChild(el("button", { type: "button", class: "u-chipbtn", "data-mtab": t[0], "aria-pressed": "false", text: t[1], onclick: function () { store.set({ mediaTab: t[0] }); lsSet({ mediaTab: t[0] }); } }));
  });
  mediaPanel.root.insertBefore(tabs, mediaPanel.body);
  mediaPanel.mtabs = tabs;
  mediaPanel.now = el("div", { class: "u-nowplaying", "aria-live": "polite", hidden: true });
  mediaPanel.root.insertBefore(mediaPanel.now, mediaPanel.body);
  mediaPanel.body.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target.closest("[data-team]") : null;
    if (t && t.classList.contains("u-tchip")) { e.preventDefault(); openTeam(+t.getAttribute("data-team")); }
  });
  mediaPanel.loading("Loading media…");
  host.appendChild(mediaPanel.root);
}
function renderMedia() {
  if (!mediaPanel) return;
  keepPlaying();   // before the list is rebuilt, so a playing episode keeps playing
  var st = store.get(), md = mediaRefs(), tab = st.mediaTab, now = refNow(), q = (st.search || "").trim().toLowerCase();
  Array.prototype.forEach.call(mediaPanel.mtabs.children, function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-mtab") === tab ? "true" : "false"); });
  if (!md.present) {
    mediaPanel.empty(st.payload ? "This data has no media section (an older snapshot, or the media sources have not run yet). Nothing here means no data, not no videos." : "No media: no server answered and this build has no snapshot.");
    mediaPanel.body.appendChild(mediaCredit());
    return;
  }
  mediaPanel.render(function (body) {
    if (st.model.fixture) body.appendChild(el("p", { class: "u-warnline", text: "Fixture data: invented videos and episodes; the players will show YouTube's error for the fake ids." }));
    if (st.mediaBlocked && tab !== "live") body.appendChild(el("p", { class: "u-note u-mblocked", text: BLOCKED_NOTE }));
    if (tab === "live") {
      var sel = st.team && TIDX[st.team] != null ? TIDX[st.team] : null;
      body.appendChild(el("p", { class: "u-note", text: "Each link opens the official channel's live page on YouTube in a new tab. YouTube shows a stream there only if the channel is streaming; this page cannot tell in advance and never marks a channel as live. Full NFL game broadcasts are not on these channels; each game card names its TV network." }));
      var fset = focusSet(st.focus), chs = channelOrder(md.channels, sel).filter(function (c) { return !fset || c.team == null || fset[c.team]; }).filter(function (c) { return !q || (c.name.toLowerCase().indexOf(q) >= 0) || (c.team != null && searchTeams(q)[c.team]); });
      if (!chs.length) body.appendChild(el("p", { class: "u-state u-empty", text: q ? "No channel matches “" + q + "”." : "No channels in this data." }));
      body.appendChild(el("ul", { class: "u-chlist" }, chs.map(function (c) {
        return el("li", {}, [el("span", { class: "u-chname" }, [c.team != null ? teamChip(c.team) : el("span", { class: "u-tchip u-nflchip", text: "NFL" }), " " + c.name]), liveButton(c)]);
      })));
    } else if (tab === "podcasts") {
      var pods = focusEvents(filterPodcasts(md.podcasts, st.timeRange, now, q), focusSet(st.focus)), pOut = outageText("podcasts-nfl", "podcast");
      if (!pods.length) body.appendChild(el("p", { class: "u-state u-empty", text: pOut || "No podcast episodes " + RANGE_PHRASE[st.timeRange] + (q ? " matching “" + q + "”" : "") + "." }));
      else if (pOut) body.appendChild(el("p", { class: "u-warnline", text: pOut }));
      var playing = nowPlayingSrc();
      body.appendChild(el("ul", { class: "u-podlist" }, pods.slice(0, 30).map(function (p) {
        var label = p.show + ": " + p.title;
        return el("li", { class: "u-pod" }, [
          el("div", { class: "u-podshow" }, [el("b", { text: p.show }), " · ", el("time", { datetime: new Date(p.ts).toISOString(), text: fmtRel(p.ts, now) }), p.durationSec ? " · " + fmtDuration(p.durationSec) : "", p.teams.slice(0, 3).map(teamChip)]),
          el("div", { class: "u-podtitle", text: p.title })].concat(podcastControls(p, label, playing)));
      })));
      body.appendChild(el("p", { class: "u-note", text: mediaBlocked() ? "Episodes open on the NFL's podcast host (Omny)." : "Pressing play loads the episode from the NFL's podcast host (Omny) through the measurement services its feed uses (Podtrac, Claritas, pdrl.fm)." }));
    } else {
      var kinds = el("div", { class: "u-chips u-vkinds", role: "group", "aria-label": "Video type" });
      VIDEO_KINDS.forEach(function (k) { kinds.appendChild(el("button", { type: "button", class: "u-chipbtn", "data-fk": "vk:" + k[0], "aria-pressed": st.mediaKind === k[0] ? "true" : "false", text: k[1], onclick: function () { store.set({ mediaKind: k[0] }); lsSet({ mediaKind: k[0] }); } })); });
      kinds.appendChild(el("button", { type: "button", class: "u-chipbtn", "data-fk": "vk:shorts", "aria-pressed": st.mediaShorts ? "true" : "false", text: "Include Shorts", onclick: function () { store.set({ mediaShorts: !store.get("mediaShorts") }); lsSet({ mediaShorts: store.get("mediaShorts") }); } }));
      body.appendChild(kinds);
      var vids = focusEvents(filterVideos(md.videos, st.mediaKind, st.mediaShorts, st.timeRange, now, q), focusSet(st.focus)), vOut = outageText("youtube-official", "video");
      if (!vids.length) body.appendChild(el("p", { class: "u-state u-empty", text: vOut || "No " + (st.mediaKind === "all" ? "videos" : VIDEO_KINDS.filter(function (k) { return k[0] === st.mediaKind; })[0][1].toLowerCase()) + " " + RANGE_PHRASE[st.timeRange] + (q ? " matching “" + q + "”" : "") + "." }));
      else if (vOut) body.appendChild(el("p", { class: "u-warnline", text: vOut }));
      body.appendChild(el("ul", { class: "u-vlist" }, vids.slice(0, 60).map(function (v) { return videoItem(v, now); })));
    }
    body.appendChild(mediaCredit());
  });
}
function mediaCredit() {
  var blocked = mediaBlocked();
  return el("p", { class: "u-credit u-mcredit" }, ["Video: YouTube · official channels. Podcasts: official NFL shows. " + (blocked ? "Opened on YouTube or the show's own page" : "Played in YouTube's own player or the feed's own audio file") + "; nothing is copied.",
    blocked ? null : [" ", ytTerms()]]);
}
// YouTube API Services Developer Policies III.A.1, III.A.2 and III.F.2.a: wherever YouTube's player is used, name YouTube
// as the source and link its Terms of Service and Google's Privacy Policy.
var YT_TERMS = "https://www.youtube.com/t/terms", GOOGLE_PRIVACY = "https://policies.google.com/privacy";
function ytTerms() {
  return el("span", { class: "u-ytterms" }, ["This page uses YouTube API Services: ", el("a", { href: YT_TERMS, target: "_blank", rel: "noopener", text: "YouTube Terms of Service" }), ", ",
    el("a", { href: GOOGLE_PRIVACY, target: "_blank", rel: "noopener", text: "Google Privacy Policy" }), "."]);
}

// ---- player dialog: built on demand, torn down on close so playback stops ----
var playerLastFocus = null, playerKey = null;
var INERT_IDS = ["uTop", "uBody", "uDrawer", "uBrief", "simView"];   // everything behind the player
function setBehindInert(on) { INERT_IDS.forEach(function (id) { var n = byId(id); if (n) { if (on) n.setAttribute("inert", ""); else n.removeAttribute("inert"); } }); }
function openPlayer(o) {
  var m = byId("uPlayer"); if (!m) return;
  var box = m.querySelector(".u-mbox"), src = safeEmbedSrc(o.src), url = safeYouTubeLink(o.url);
  playerLastFocus = document.activeElement; playerKey = o.key || null;
  clearNode(box);
  box.appendChild(el("div", { class: "u-mhead" }, [el("h2", { id: "u-player-title", class: "u-ptitle", text: o.title }), el("button", { type: "button", class: "u-x", "aria-label": "Close the player", text: "×", onclick: closePlayer })]));
  if (src) box.appendChild(el("div", { class: "u-frame" }, [el("iframe", playerFrameAttrs(src, o.title))]));
  else box.appendChild(el("p", { class: "u-state u-warnline", text: "This address is not on the page's list of YouTube players, so it is not loaded here." }));
  setBehindInert(true);
  box.appendChild(el("p", { class: "u-note" }, [o.channel ? o.channel + " · " : "", url ? el("a", { href: url, target: "_blank", rel: "noopener", text: "Watch on YouTube", "aria-label": "Watch on YouTube" + NEW_TAB }) : "No YouTube link available.",
    " · ", el("button", { type: "button", class: "u-linkbtn", text: "Close player", onclick: closePlayer })]));
  // keys pressed inside YouTube's player go to YouTube, not to this page, so Esc cannot close it from there
  box.appendChild(el("p", { class: "u-note", text: "Keyboard: while the video has focus, press Tab to leave the player, then Esc or Close player." }));
  box.appendChild(el("p", { class: "u-credit", text: "Video: YouTube (privacy-enhanced player where the channel allows it). Nothing plays until you press play." }));
  m.hidden = false;
  var x = box.querySelector(".u-x"); if (x) x.focus();
}
function closePlayer() {
  var m = byId("uPlayer"); if (!m || m.hidden) return;
  clearNode(m.querySelector(".u-mbox"));   // removing the iframe stops playback
  m.hidden = true;
  setBehindInert(false);
  // back to the control that opened the player; if a refresh redrew it meanwhile, to its replacement
  var back = playerLastFocus && document.contains(playerLastFocus) ? playerLastFocus : playerKey ? document.querySelector('[data-fk="' + playerKey + '"]') : null;
  if (back && back.focus) back.focus();
}
function buildPlayer(root) {
  var m = el("div", { class: "u-modal u-player", id: "uPlayer", role: "dialog", "aria-modal": "true", "aria-labelledby": "u-player-title", hidden: true }, [el("div", { class: "u-mbox u-pbox" })]);
  m.addEventListener("click", function (e) { if (e.target === m) closePlayer(); });
  root.appendChild(m);
}
// Tab stays inside an open dialog (the brief or the player).
function trapFocusIn(m, e) {
  if (!m || m.hidden || e.key !== "Tab") return;
  var f = Array.prototype.filter.call(m.querySelectorAll("a[href],button:not([disabled]),iframe,audio,[tabindex]:not([tabindex='-1'])"), function (n) { return n.offsetParent !== null || n === document.activeElement; });
  if (!f.length) return;
  var first = f[0], last = f[f.length - 1];
  if (!m.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
  else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

// ---- connections: team drawer and game drawer ----
function teamMediaSection(i) {
  var md = mediaRefs(), now = refNow(), kids = [];
  var ch = md.channels.filter(function (c) { return c.team === i; })[0];
  if (ch) kids.push(el("div", { class: "u-actions" }, [liveButton(ch), el("span", { class: "u-note", text: "The official channel's live page; YouTube shows a stream there only if one is on." })]));
  var vids = teamVideos(md.videos, i, 6), vOut = md.present ? outageText("youtube-official", "video") : null;
  if (vids.length) kids.push(el("ul", { class: "u-vlist" }, vids.map(function (v) { return videoItem(v, now, true); })));
  else kids.push(el("p", { class: "u-note", text: vOut || (md.present ? "No recent videos for this team in the current data." : "No media in the current data.") }));
  kids.push(el("p", { class: "u-credit", text: "Video: YouTube · official channels." }));
  return section("Video", kids);
}
function gameMediaSection(x) {
  var md = mediaRefs(); if (!md.present || x.away == null || x.home == null) return null;
  var vids = gameVideos(md.videos, x.away, x.home, refNow(), 4);
  if (!vids.length) return section("Video", [el("p", { class: "u-note", text: "No videos naming either team in the last 7 days." })]);
  return section("Video", [el("ul", { class: "u-vlist" }, vids.map(function (v) { return videoItem(v, refNow(), true); })), el("p", { class: "u-credit", text: "Video: YouTube · official channels." })]);
}
// Map layer: count of each team's videos in the time range (search applies too).
function renderVideoCounts(c, g) {
  var md = c.M ? c.M.media : null; if (!md || !md.present) return;
  var n = videoCounts(filterVideos(md.videos, "all", true, c.range, c.now, c.query));
  for (var k in n) badgeAt(c, g, +k, "s", "u-b-vid", c.detail || c.mode !== "geo" ? String(n[k]) : null, TEAMS[+k].name + ": " + n[k] + " video" + (n[k] > 1 ? "s" : "") + " " + RANGE_PHRASE[c.range] + " (official YouTube channels)");
}

Object.assign(NFLU, { isMediaBlock: isMediaBlock, videoAction: videoAction, podcastAction: podcastAction, safeEmbedSrc: safeEmbedSrc, safeThumbSrc: safeThumbSrc, safeAudioSrc: safeAudioSrc, safeYouTubeLink: safeYouTubeLink, safeHttpsLink: safeHttpsLink, normMedia: normMedia,
  PODCAST_AUDIO_RE: PODCAST_AUDIO_RE, playerFrameAttrs: playerFrameAttrs, audioAttrs: audioAttrs,
  filterVideos: filterVideos, filterPodcasts: filterPodcasts, teamVideos: teamVideos, gameVideos: gameVideos, channelOrder: channelOrder, videoCounts: videoCounts });
