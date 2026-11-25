// Official media (public scope): the NFL's and teams' YouTube channel feeds and the league's podcast feeds.
// Rules: docs/MEDIA_ARCHITECTURE.md. Only ids, titles, times and the providers' own URLs are kept.
"use strict";
const { decode, blocks } = require("../util");
const { teamsInText, TEAMS, ENT } = require("../entities");
const { UA } = require("../source");

const YT_FEED = (id) => "https://www.youtube.com/feeds/videos.xml?channel_id=" + id;
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/, CHANNEL_ID = /^UC[A-Za-z0-9_-]{22}$/;
const TITLE_MAX = 300;   // YouTube titles are at most 100 characters; this only stops absurd input
const cap = (s) => (s.length > TITLE_MAX ? s.slice(0, TITLE_MAX - 1) + "…" : s);

// The channels to read: the league's, then each team's verified official channel (shared/teams.json).
function channelList() {
  const out = [];
  for (const c of ENT.leagueChannels || []) out.push({ team: null, name: c.name, channelId: c.channelId });
  for (const t of TEAMS) if (t.youtube && t.youtube.channelId) out.push({ team: t.a, name: t.name, channelId: t.youtube.channelId });
  return out.filter((c) => CHANNEL_ID.test(c.channelId)).map((c) => Object.assign(c, {
    // liveUrl: the channel's live page on YouTube, which shows the stream when there is one. A link, not an embed:
    // YouTube's live_stream embed showed "This video is unavailable" in testing, even for a channel that streams all day.
    url: "https://www.youtube.com/channel/" + c.channelId, liveUrl: "https://www.youtube.com/channel/" + c.channelId + "/live" }));
}

// Kinds, checked in this order: Shorts; highlights (even "postgame highlights"); shows (a "postgame show" is not a press
// conference); press conferences and media sessions; previews; everything else.
const PRESS = /\b(press conference|presser|media availability|(meets?|speaks?|talks?|address(es|ed)?)( with| to)? (the )?(media|press)|scrum|postgame|post-game|podium)\b/i;
function videoKind(title, isShort) {
  if (isShort || /#shorts?\b/i.test(title)) return "short";
  if (/\bhighlights?\b/i.test(title)) return "highlights";
  if (/\b(pre|post)-?game show\b/i.test(title)) return "video";
  if (PRESS.test(title)) return "press";
  if (/\b(preview|previews|predictions?|keys to the game|what to watch)\b/i.test(title)) return "preview";
  return "video";
}

// One channel's Atom feed -> videos. An entry that names a different channel is dropped (official channels only).
function normalizeYoutubeFeed(xml, channel) {
  if (!/<feed[\s>]/.test(xml)) throw new Error("not a YouTube feed");
  const out = [];
  for (const b of blocks(xml, "entry")) {
    const vid = (b.match(/<yt:videoId>([^<]+)<\/yt:videoId>/) || [])[1];
    const own = (b.match(/<yt:channelId>([^<]+)<\/yt:channelId>/) || [])[1];
    if (own && own !== channel.channelId) continue;
    const title = cap(decode((b.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || ""));
    const published = Date.parse((b.match(/<published>([^<]+)<\/published>/) || [])[1] || "");
    if (!vid || !VIDEO_ID.test(vid) || !title || !Number.isFinite(published)) continue;
    const isShort = /href="https:\/\/www\.youtube\.com\/shorts\//.test(b);
    const teams = [...new Set((channel.team ? [channel.team] : []).concat(teamsInText(title, { strict: true })))];
    // no views at all: almost always a live stream scheduled for later (teams post press conferences that way)
    const views = (b.match(/<media:statistics[^>]*\bviews="(\d+)"/) || [])[1];
    const v = { id: "yt-" + vid, videoId: vid, channelId: channel.channelId, channel: channel.name, team: channel.team, teams, kind: videoKind(title, isShort), title,
      published: new Date(published).toISOString(), url: "https://www.youtube.com/watch?v=" + vid, embedUrl: "https://www.youtube-nocookie.com/embed/" + vid,
      thumb: "https://i.ytimg.com/vi/" + vid + "/mqdefault.jpg", source: "youtube-official" };
    if (views === "0") v.upcoming = true;
    out.push(v);
  }
  return out;
}

// Per channel, the newest `perChannel` videos plus the newest `shorts` Shorts, so a busy channel cannot push a quiet
// one out of a global cap.
function quota(videos, { perChannel = 8, shorts = 3, max = 400 } = {}) {
  const by = new Map();
  for (const v of videos.slice().sort((x, y) => Date.parse(y.published) - Date.parse(x.published))) {
    const c = by.get(v.channelId) || { n: 0, s: 0, list: [] };
    if (v.kind === "short" ? c.s++ < shorts : c.n++ < perChannel) c.list.push(v);
    by.set(v.channelId, c);
  }
  return [...by.values()].flatMap((c) => c.list).sort((x, y) => Date.parse(y.published) - Date.parse(x.published)).slice(0, max);
}
// What the published static page carries: 3 videos and 1 Short per channel, plus any video in the NFL TV reel.
function snapshotMedia(m) {
  if (!m) return m;
  const keep = new Set(m.reel || []), base = quota(m.videos || [], { perChannel: 3, shorts: 1 }), have = new Set(base.map((v) => v.videoId));
  const extra = (m.videos || []).filter((v) => keep.has(v.videoId) && !have.has(v.videoId));
  return Object.assign({}, m, { videos: base.concat(extra).sort((x, y) => Date.parse(y.published) - Date.parse(x.published)) });
}

// NFL TV (DEC-022): the page plays the teams' newest press conferences and media sessions, then the league channel's
// newest videos, skipping in the viewer's browser any the owner does not let this site show. The NFL blocks its own
// videos, and team videos with its game footage, on sites it has not approved; press sessions are mostly the teams'
// own footage, so they are the ones that play. Whether a video may be embedded at all comes from YouTube's oEmbed
// endpoint (no key): it answers 401 when the owner has turned embedding off (the NFL does so for its live game streams)
// and 404 when the video is gone. That check cannot see a block that depends on the site, so the page handles those.
const REEL_SIZE = 12, REEL_PER_TEAM = 2, REEL_LEAGUE = 2;
const OEMBED = (videoId) => "https://www.youtube.com/oembed?format=json&url=" + encodeURIComponent("https://www.youtube.com/watch?v=" + videoId);
// The candidates, in playing order: team press sessions, newest first, at most two a team (a team posting six in an
// afternoon does not fill the reel); then the league channel's newest videos; last, press sessions the feed shows with
// no views (`upcoming`: a live stream that has probably not begun; the page skips one still waiting when it comes up).
// Shorts are left out (they are vertical).
// Drawn from each channel's newest videos as the media block keeps them (quota), so every candidate is in the block.
function reelCandidates(videos, leagueId, n = REEL_SIZE) {
  const seen = new Set(), per = {};
  const pool = quota((videos || []).filter((v) => v && v.kind !== "short" && VIDEO_ID.test(v.videoId) && !seen.has(v.videoId) && seen.add(v.videoId)), { perChannel: 8, shorts: 0 });
  const league = pool.filter((v) => v.channelId === leagueId).slice(0, REEL_LEAGUE);
  const press = pool.filter((v) => v.kind === "press" && v.team && v.channelId !== leagueId && (per[v.team] = (per[v.team] || 0) + 1) <= REEL_PER_TEAM);
  const picked = press.filter((v) => !v.upcoming).concat(press.filter((v) => v.upcoming)).slice(0, Math.max(0, n - league.length));
  return picked.filter((v) => !v.upcoming).concat(league, picked.filter((v) => v.upcoming)).slice(0, n);
}

// Official NFL podcasts (public RSS on Omny). The feeds hold thousands of episodes (one is 57 MB), so only the start
// is read: readHead stops after the first few items.
// the audio address rule lives in the contract, so the adapter and the validator cannot drift apart
const { PODCAST_AUDIO: AUDIO_RE, NFL_OMNY_ORG } = require("../../contract");
const PODCASTS = [
  ["NFL Daily with Gregg Rosenthal", "https://www.omnycontent.com/d/playlist/e73c998e-6e60-432f-8610-ae210140c5b1/9ce11dad-e86a-444f-ba83-ae27003475be/deff018f-4b51-4501-937c-ae27003475d1/podcast.rss"],
  ["NFL: Good Morning Football", "https://www.omnycontent.com/d/playlist/e73c998e-6e60-432f-8610-ae210140c5b1/b3c7466a-617e-42e6-8e1c-ae270033f8bb/30912f7a-374b-4a82-8cbc-ae270033f8d7/podcast.rss"],
  ["NFL: The Insiders", "https://www.omnycontent.com/d/playlist/e73c998e-6e60-432f-8610-ae210140c5b1/0414225e-5167-477f-9f83-ae390070e4d2/3e412703-0644-468e-9001-ae390070e4db/podcast.rss"],
  ["NFL News Hub", "https://www.omnycontent.com/d/playlist/e73c998e-6e60-432f-8610-ae210140c5b1/0e61fe66-e985-446f-bc46-ae27003599da/c1b3eaa8-db6b-4865-ac29-ae27003599f6/podcast.rss"],
  ["The NFL Report", "https://www.omnycontent.com/d/playlist/e73c998e-6e60-432f-8610-ae210140c5b1/e922fbd8-b608-413a-ac83-b06d015154b4/0e338dc3-13b3-4ce0-b822-b06d01535c12/podcast.rss"],
  ["NFL Game Previews", "https://www.omnycontent.com/d/playlist/e73c998e-6e60-432f-8610-ae210140c5b1/17f66cbd-39c9-4b46-8d74-aefd0118b02d/85385c67-8a55-44fa-8545-aefd01193582/podcast.rss"],
];
const feedProgram = (url) => url.split("/")[6];
// Episode audio: https, an optional measurement redirect (pdrl.fm, Podtrac, Claritas) and then the NFL's own Omny
// account's clip file. Anything else is not played. Returns {program, clip} or null.
function officialAudio(u) { const m = typeof u === "string" && u.length < 1000 ? u.match(AUDIO_RE) : null; return m ? { program: m[1], clip: m[2] } : null; }
function duration(s) {
  if (!s) return null; s = String(s).trim();
  if (/^\d+$/.test(s)) return Number(s);
  const p = s.split(":").map(Number); if (p.some((x) => !Number.isFinite(x))) return null;
  return p.reduce((a, x) => a * 60 + x, 0);
}
function normalizePodcastFeed(xml, show, limit = 4, program = null) {
  if (!/<rss[\s>]|<channel[\s>]/i.test(xml)) throw new Error("not an RSS feed");
  const out = [];
  for (const b of blocks(xml, "item", limit * 4)) {
    if (out.length >= limit) break;
    const title = cap(decode((b.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || ""));
    const audio = decode((b.match(/<enclosure[^>]*\surl="([^"]+)"/i) || [])[1] || "");
    const link = decode((b.match(/<link>([\s\S]*?)<\/link>/i) || [])[1] || "");
    const pub = Date.parse(decode((b.match(/<pubDate>([\s\S]*?)<\/pubDate>/i) || [])[1] || ""));
    const off = officialAudio(audio);
    if (!title || !off || !Number.isFinite(pub)) continue;
    out.push({ id: "pod-" + off.clip, show, title, published: new Date(pub).toISOString(), url: /^https:\/\/(www\.)?omny\.fm\/shows\/[A-Za-z0-9_\-\/]+$/.test(link) ? link : null,
      audioUrl: audio, durationSec: duration((b.match(/<itunes:duration>([^<]+)<\/itunes:duration>/i) || [])[1]), teams: teamsInText(title, { strict: true }),
      source: "podcasts-nfl", clip: off.clip, native: program ? off.program === program : null });
  }
  return out;
}
// The same episode is often cross-posted to several shows' feeds; keep one copy, preferring the show it belongs to.
function dedupeEpisodes(list) {
  const by = new Map();
  for (const e of list) { const k = e.clip || e.id, have = by.get(k); if (!have || (!have.native && e.native)) by.set(k, e); }
  return [...by.values()].map(({ clip, native, ...e }) => e).sort((x, y) => Date.parse(y.published) - Date.parse(x.published));
}

// Reads a response body only until `items` closing tags have arrived (or maxBytes), then stops the download.
async function readHead(url, { items = 4, tag = "</item>", maxBytes = 2e6, timeoutMs = 15000, fetchImpl = fetch } = {}) {
  const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, { headers: { "user-agent": UA }, signal: ctl.signal });
    if (!res.ok) throw new Error("answered " + res.status);
    if (!res.body || typeof res.body.getReader !== "function") return await res.text();
    const reader = res.body.getReader(), dec = new TextDecoder(); let text = "", seen = 0, from = 0;
    const aborted = new Promise((_, bad) => ctl.signal.addEventListener("abort", () => bad(Object.assign(new Error("aborted"), { name: "AbortError" }))));
    for (;;) {
      const { done, value } = await Promise.race([reader.read(), aborted]);
      if (done) break;
      text += dec.decode(value, { stream: true });
      for (let k = text.indexOf(tag, from); k >= 0; k = text.indexOf(tag, k + tag.length)) { seen++; from = k + tag.length; }
      if (seen >= items || text.length >= maxBytes) { try { await reader.cancel(); } catch (_) {} break; }
    }
    return text;
  } catch (err) {
    throw err.name === "AbortError" ? new Error("timeout after " + timeoutMs + " ms") : err;
  } finally { clearTimeout(timer); }
}

// Runs tasks with at most `n` in flight; after a task throws, no new task starts and the first error is rethrown.
async function pool(list, n, fn) {
  const out = new Array(list.length); let i = 0, failed = null;
  await Promise.all(Array.from({ length: Math.min(n, list.length) }, async () => {
    while (i < list.length && !failed) { const k = i++; try { out[k] = await fn(list[k], k); } catch (e) { failed = failed || e; } }
  }));
  if (failed) throw failed;
  return out;
}

module.exports = { YT_FEED, PODCASTS, NFL_OMNY_ORG, channelList, videoKind, normalizeYoutubeFeed, quota, snapshotMedia, feedProgram, officialAudio, REEL_SIZE, OEMBED, reelCandidates,
  normalizePodcastFeed, dedupeEpisodes, readHead, pool };
