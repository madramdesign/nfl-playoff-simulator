// The /api/universe contract, version 1. Shared by the data fabric (which produces it), the page (which reads it)
// and the tests (which check both against it). Field-by-field description: docs/DATA_MODEL.md.
// No dependencies; works in Node and, if ever needed, the browser.
"use strict";

const VERSION = 1;
const EVENT_TYPES = ["news", "injury", "transaction", "odds_move", "weather", "game", "qb_change", "model", "playoff_move"];
const GAME_STATES = ["pre", "in", "post"];
const SOURCE_STATUS = ["ok", "stale", "down", "disabled", "pending"];
// scope: "public" sources may appear in anything committed or published (snapshot, event files, the static page);
// "local" sources (ESPN's JSON, DEC-006) are served only by the local server and never written to the repository.
const SOURCE_SCOPES = ["public", "local"];
const BREAKER_STATES = ["closed", "open", "half-open"];
const INJURY_STATUS = ["Out", "Doubtful", "Questionable", "Injured Reserve", "Physically Unable to Perform", "Suspended", "Day-To-Day", "Other"];

const isObj = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
const isIso = (x) => typeof x === "string" && !Number.isNaN(Date.parse(x));
const isNum = (x) => typeof x === "number" && Number.isFinite(x);
const isProb = (x) => isNum(x) && x >= 0 && x <= 1;

function validateUniverse(u, teamAbbrs) {
  const errs = [];
  const err = (path, msg) => { if (errs.length < 50) errs.push(path + ": " + msg); };
  const team = (path, a) => { if (typeof a !== "string" || (teamAbbrs && !teamAbbrs.includes(a))) err(path, "unknown team " + JSON.stringify(a)); };
  if (!isObj(u)) return ["root: not an object"];
  if (u.v !== VERSION) err("v", "expected version " + VERSION);
  if (!isIso(u.generatedAt)) err("generatedAt", "not an ISO time");
  if (!isNum(u.season)) err("season", "not a number");
  if (u.week != null && !isNum(u.week)) err("week", "not a number");

  if (!isObj(u.sources)) err("sources", "missing");
  else for (const [id, s] of Object.entries(u.sources)) {
    const p = "sources." + id;
    if (s.id !== id) err(p + ".id", "must equal its key");
    if (!SOURCE_STATUS.includes(s.status)) err(p + ".status", JSON.stringify(s.status));
    if (!BREAKER_STATES.includes(s.breaker)) err(p + ".breaker", JSON.stringify(s.breaker));
    if (s.lastOk != null && !isIso(s.lastOk)) err(p + ".lastOk", "not ISO");
    if (!isNum(s.tier) || s.tier < 1 || s.tier > 4) err(p + ".tier", "1-4");
    if (typeof s.label !== "string") err(p + ".label", "missing");
    if (!SOURCE_SCOPES.includes(s.scope)) err(p + ".scope", "public or local");
  }

  if (!Array.isArray(u.games)) err("games", "missing");
  else u.games.forEach((g, k) => {
    const p = "games[" + k + "]";
    if (typeof g.id !== "string") err(p + ".id", "string");
    if (typeof g.source !== "string" || (isObj(u.sources) && !u.sources[g.source])) err(p + ".source", "a source id listed in sources");
    if (g.odds && isObj(u.sources) && !u.sources[g.odds.source]) err(p + ".odds.source", "not listed in sources");
    if (g.weather && isObj(u.sources) && !u.sources[g.weather.source]) err(p + ".weather.source", "not listed in sources");
    team(p + ".away", g.away); team(p + ".home", g.home);
    if (!GAME_STATES.includes(g.state)) err(p + ".state", JSON.stringify(g.state));
    if (!isIso(g.kickoff)) err(p + ".kickoff", "not ISO");
    if (!isNum(g.awayScore) || !isNum(g.homeScore)) err(p, "scores must be numbers");
    if (!isNum(g.period)) err(p + ".period", "number");
    if (g.odds != null) {
      const o = g.odds;
      if (typeof o.provider !== "string") err(p + ".odds.provider", "string");
      if (typeof o.source !== "string") err(p + ".odds.source", "source id");
      for (const f of ["spread", "total", "homeML", "awayML", "homeProb"]) {
        if (o[f] == null) continue;
        if (!isObj(o[f])) { err(p + ".odds." + f, "object {open,current}"); continue; }
        for (const w of ["open", "current"]) if (o[f][w] != null && !isNum(o[f][w])) err(p + ".odds." + f + "." + w, "number or null");
      }
      if (o.homeProb) for (const w of ["open", "current"]) if (o.homeProb[w] != null && !isProb(o.homeProb[w])) err(p + ".odds.homeProb." + w, "0-1");
    }
    if (g.weather != null) {
      const w = g.weather;
      if (!Array.isArray(w.flags)) err(p + ".weather.flags", "array");
      if (typeof w.source !== "string") err(p + ".weather.source", "string");
    }
    if (g.situation != null && !isObj(g.situation)) err(p + ".situation", "object or null");
    if (g.alerts != null) {
      if (!Array.isArray(g.alerts)) err(p + ".alerts", "array");
      else g.alerts.forEach((x, j) => {
        const q = p + ".alerts[" + j + "]";
        if (!isObj(x) || typeof x.event !== "string" || !x.event) return err(q, "an alert with an event name");
        if (!["Extreme", "Severe", "Moderate", "Minor", "Unknown"].includes(x.severity)) err(q + ".severity", JSON.stringify(x.severity));
        if (typeof x.source !== "string" || (isObj(u.sources) && !u.sources[x.source])) err(q + ".source", "a listed source");
        for (const f of ["sent", "onset", "ends", "expires"]) if (x[f] != null && !isIso(x[f])) err(q + "." + f, "ISO or null");
        if (x.url != null && !/^https:\/\//.test(x.url)) err(q + ".url", "https URL or null");
      });
    }
    // market (optional): a consensus across sportsbooks (median spread and total, median no-vig home chance)
    if (g.market != null) {
      const m = g.market, q = p + ".market";
      if (!isObj(m)) err(q, "object or null");
      else {
        if (typeof m.source !== "string" || (isObj(u.sources) && !u.sources[m.source])) err(q + ".source", "a listed source");
        if (typeof m.provider !== "string") err(q + ".provider", "string");
        if (!Number.isInteger(m.books) || m.books < 1) err(q + ".books", "integer >= 1");
        for (const f of ["spread", "total"]) if (m[f] != null && !isNum(m[f])) err(q + "." + f, "number or null");
        if (m.homeProb != null && !isProb(m.homeProb)) err(q + ".homeProb", "0-1 or null");
        if (!isIso(m.at)) err(q + ".at", "ISO");
        if (m.lastUpdate != null && !isIso(m.lastUpdate)) err(q + ".lastUpdate", "ISO or null");
      }
    }
    // books (optional, local server only): each sportsbook's own lines and prices
    if (g.books != null) {
      if (!Array.isArray(g.books)) err(p + ".books", "array");
      else g.books.forEach((b, j) => {
        const q = p + ".books[" + j + "]";
        if (!isObj(b) || typeof b.key !== "string" || typeof b.title !== "string") return err(q, "a book with key and title");
        if (typeof b.source !== "string" || (isObj(u.sources) && !u.sources[b.source])) err(q + ".source", "a listed source");
        for (const f of ["spread", "total", "homePrice", "awayPrice"]) if (b[f] != null && !isNum(b[f])) err(q + "." + f, "number or null");
        if (b.homeProb != null && !isProb(b.homeProb)) err(q + ".homeProb", "0-1 or null");
        if (b.lastUpdate != null && !isIso(b.lastUpdate)) err(q + ".lastUpdate", "ISO or null");
      });
    }
    if (!isObj(g.venue)) err(p + ".venue", "object");
  });

  if (!Array.isArray(u.events)) err("events", "missing");
  else {
    const seen = new Set();
    u.events.forEach((e, k) => {
      const p = "events[" + k + "]";
      if (typeof e.id !== "string") err(p + ".id", "string");
      else if (seen.has(e.id)) err(p + ".id", "duplicate " + e.id); else seen.add(e.id);
      if (!EVENT_TYPES.includes(e.type)) err(p + ".type", JSON.stringify(e.type));
      if (!isIso(e.ts)) err(p + ".ts", "not ISO");
      if (!isIso(e.seenAt)) err(p + ".seenAt", "not ISO");
      if (!Array.isArray(e.teams)) err(p + ".teams", "array"); else e.teams.forEach((a, j) => team(p + ".teams[" + j + "]", a));
      if (typeof e.title !== "string" || !e.title) err(p + ".title", "non-empty string");
      if (e.url != null && !/^https:\/\//.test(e.url)) err(p + ".url", "https URL or null");
      if (typeof e.source !== "string") err(p + ".source", "string");
      else if (isObj(u.sources) && !u.sources[e.source]) err(p + ".source", "not listed in sources: " + e.source);
      if (!isNum(e.importance) || e.importance < 0 || e.importance > 100) err(p + ".importance", "0-100");
      if (!isProb(e.confidence)) err(p + ".confidence", "0-1");
      if (!isNum(e.sourceCount) || e.sourceCount < 1) err(p + ".sourceCount", ">= 1");
      if (!Array.isArray(e.sources)) err(p + ".sources", "array");
    });
  }

  if (!isObj(u.injuries)) err("injuries", "missing");
  else for (const [a, t] of Object.entries(u.injuries)) {
    team("injuries." + a, a);
    if (!isNum(t.burden)) err("injuries." + a + ".burden", "number");
    if (!Array.isArray(t.players)) err("injuries." + a + ".players", "array");
    else t.players.forEach((pl, j) => { if (!INJURY_STATUS.includes(pl.status)) err("injuries." + a + ".players[" + j + "].status", JSON.stringify(pl.status)); });
  }

  if (!Array.isArray(u.transactions)) err("transactions", "missing");
  else u.transactions.forEach((t, k) => { team("transactions[" + k + "].team", t.team); if (!isIso(t.date)) err("transactions[" + k + "].date", "not ISO"); });
  if (u.media != null) validateMedia(u.media, err, team, u.sources);
  if (u.fantasy != null) validateFantasy(u.fantasy, err, team, u.sources);
  if (u.lines != null) validateLines(u.lines, err, u.sources);
  // recentFinals (optional): the last week's final scores, kept after the payload moves on to the next week
  if (u.recentFinals != null) {
    if (!Array.isArray(u.recentFinals)) err("recentFinals", "array");
    else u.recentFinals.forEach((f, k) => {
      const p = "recentFinals[" + k + "]";
      if (!isObj(f) || typeof f.id !== "string") return err(p, "a final with an id");
      team(p + ".away", f.away); team(p + ".home", f.home);
      if (f.gid != null && typeof f.gid !== "string") err(p + ".gid", "string or null");
      if (!isIso(f.kickoff)) err(p + ".kickoff", "ISO");
      for (const s of ["awayScore", "homeScore"]) if (!Number.isInteger(f[s]) || f[s] < 0) err(p + "." + s, "whole number >= 0");
      if (typeof f.source !== "string" || (isObj(u.sources) && !u.sources[f.source])) err(p + ".source", "a listed source");
    });
  }
  return errs;
}

// lines (optional): each game's line history {gameId: [{at ISO|null, open?, source, provider, spread, total, homeProb}]}.
// Only observed values; an opening line without a known time has at null and open true.
function validateLines(l, err, sources) {
  if (!isObj(l)) return err("lines", "object");
  for (const [id, list] of Object.entries(l)) {
    if (!Array.isArray(list)) { err("lines." + id, "array"); continue; }
    list.forEach((o, k) => {
      const p = "lines." + id + "[" + k + "]";
      if (!isObj(o)) return err(p, "object");
      if (o.at === null ? o.open !== true : !isIso(o.at)) err(p + ".at", "ISO, or null for an opening line");
      if (typeof o.source !== "string" || (isObj(sources) && !sources[o.source])) err(p + ".source", "a listed source");
      for (const f of ["spread", "total"]) if (o[f] != null && !isNum(o[f])) err(p + "." + f, "number or null");
      if (o.homeProb != null && !isProb(o.homeProb)) err(p + ".homeProb", "0-1 or null");
    });
  }
}

// fantasy (optional): Sleeper's most added and dropped players over `lookbackHours`, named through nflverse's roster
// crosswalk. Counts are what Sleeper reports; unmatched players are counted, never named.
function validateFantasy(f, err, team, sources) {
  if (!isObj(f)) return err("fantasy", "object");
  if (typeof f.source !== "string" || (isObj(sources) && !sources[f.source])) err("fantasy.source", "a listed source");
  if (!isNum(f.lookbackHours) || f.lookbackHours <= 0) err("fantasy.lookbackHours", "positive number");
  if (f.week != null && !Number.isInteger(f.week)) err("fantasy.week", "integer or null");
  for (const k of ["adds", "drops"]) {
    if (!Array.isArray(f[k])) { err("fantasy." + k, "array"); continue; }
    f[k].forEach((x, j) => {
      const p = "fantasy." + k + "[" + j + "]";
      if (!isObj(x)) return err(p, "object");
      if (typeof x.name !== "string" || !x.name) err(p + ".name", "non-empty string");
      team(p + ".team", x.team);
      if (!isNum(x.count) || x.count < 0) err(p + ".count", "number >= 0");
      if (typeof x.sleeperId !== "string" || !x.sleeperId) err(p + ".sleeperId", "string");
    });
  }
  if (!isObj(f.unmatched) || !isNum(f.unmatched.adds) || !isNum(f.unmatched.drops)) err("fantasy.unmatched", "{adds, drops} counts");
}

// media (optional): official channels, videos and podcast episodes (docs/MEDIA_ARCHITECTURE.md). Every address must be
// exactly the form built from its id, on the provider's own domain; podcast audio must be a clip of the NFL's own Omny
// account (optionally behind the measurement redirects its feeds use). cleanMedia drops any item that fails.
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/, CHANNEL_ID = /^UC[A-Za-z0-9_-]{22}$/;
const MEDIA_KINDS = ["press", "highlights", "preview", "short", "video"];
const TITLE_MAX = 500;
const NFL_OMNY_ORG = "e73c998e-6e60-432f-8610-ae210140c5b1";
const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const PODCAST_AUDIO = new RegExp("^https://(?:pdrl\\.fm/[0-9a-f]{4,12}/|(?:www\\.)?podtrac\\.com/pts/redirect\\.mp3/|claritaspod\\.com/measure/){0,4}" +
  "traffic\\.omny\\.fm/d/clips/" + NFL_OMNY_ORG + "/(" + UUID + ")/(" + UUID + ")/audio\\.mp3(?:\\?[A-Za-z0-9_=&%.-]*)?$");
const PODCAST_PAGE = /^https:\/\/(www\.)?omny\.fm\/shows\/[A-Za-z0-9_\-\/]+$/;
const isTitle = (s) => typeof s === "string" && s.length > 0 && s.length <= TITLE_MAX;

function channelProblems(c) {
  const out = [];
  if (!isObj(c)) return ["not an object"];
  if (!CHANNEL_ID.test(c.channelId || "")) out.push("channelId: YouTube channel id");
  if (typeof c.name !== "string" || !c.name) out.push("name: non-empty");
  if (c.url !== "https://www.youtube.com/channel/" + c.channelId) out.push("url: this channel's page on youtube.com");
  // a link to the channel's live page; YouTube's live_stream embed showed "unavailable" in testing (Nov. 21, 2026)
  if (c.liveUrl !== "https://www.youtube.com/channel/" + c.channelId + "/live") out.push("liveUrl: this channel's live page on youtube.com");
  return out;
}
function videoProblems(v, channelIds) {
  const out = [];
  if (!isObj(v)) return ["not an object"];
  const id = VIDEO_ID.test(v.videoId || "") ? v.videoId : null;
  if (!id) out.push("videoId: YouTube video id");
  if (!CHANNEL_ID.test(v.channelId || "")) out.push("channelId: YouTube channel id");
  else if (channelIds && !channelIds.has(v.channelId)) out.push("channelId: not one of the listed official channels");
  if (!MEDIA_KINDS.includes(v.kind)) out.push("kind: " + JSON.stringify(v.kind));
  if (!isTitle(v.title)) out.push("title: 1-" + TITLE_MAX + " characters");
  if (!isIso(v.published)) out.push("published: not ISO");
  if (v.url !== "https://www.youtube.com/watch?v=" + id) out.push("url: this video's watch page");
  if (v.embedUrl !== "https://www.youtube-nocookie.com/embed/" + id && v.embedUrl !== "https://www.youtube.com/embed/" + id) out.push("embedUrl: this video's YouTube embed");
  if (v.thumb != null && !new RegExp("^https://i\\.ytimg\\.com/vi/" + id + "/[a-z0-9_]+\\.jpg$").test(v.thumb)) out.push("thumb: this video's image on i.ytimg.com");
  return out;
}
function podcastProblems(e) {
  const out = [];
  if (!isObj(e)) return ["not an object"];
  if (typeof e.show !== "string" || !e.show || !isTitle(e.title)) out.push("show and title");
  if (!isIso(e.published)) out.push("published: not ISO");
  if (typeof e.audioUrl !== "string" || e.audioUrl.length > 1000 || !PODCAST_AUDIO.test(e.audioUrl)) out.push("audioUrl: a clip of the NFL's Omny account");
  if (e.url != null && !(typeof e.url === "string" && PODCAST_PAGE.test(e.url))) out.push("url: an omny.fm show page or null");
  return out;
}
function validateMedia(m, err, team, sources) {
  if (!isObj(m)) return err("media", "object");
  for (const f of ["channels", "videos", "podcasts"]) if (!Array.isArray(m[f])) err("media." + f, "array");
  const chIds = new Set((m.channels || []).filter(isObj).map((c) => c.channelId));
  (m.channels || []).forEach((c, k) => {
    channelProblems(c).forEach((x) => err("media.channels[" + k + "]", x));
    if (isObj(c) && c.team != null) team("media.channels[" + k + "].team", c.team);
  });
  const ids = new Set();
  (m.videos || []).forEach((v, k) => {
    const p = "media.videos[" + k + "]";
    videoProblems(v, chIds).forEach((x) => err(p, x));
    if (!isObj(v)) return;
    if (ids.has(v.videoId)) err(p + ".videoId", "duplicate"); ids.add(v.videoId);
    if (v.team != null) team(p + ".team", v.team);
    (v.teams || []).forEach((a, j) => team(p + ".teams[" + j + "]", a));
    if (sources && !sources[v.source]) err(p + ".source", "not listed in sources");
  });
  (m.podcasts || []).forEach((e, k) => {
    const p = "media.podcasts[" + k + "]";
    podcastProblems(e).forEach((x) => err(p, x));
    if (isObj(e) && sources && !sources[e.source]) err(p + ".source", "not listed in sources");
  });
}
// The media block with every failing or duplicate item removed (used by the fabric before serving).
function cleanMedia(m) {
  if (!isObj(m)) return { channels: [], videos: [], podcasts: [] };
  const channels = (m.channels || []).filter((c) => !channelProblems(c).length);
  const chIds = new Set(channels.map((c) => c.channelId)), seen = new Set();
  const videos = (m.videos || []).filter((v) => !videoProblems(v, chIds).length && !seen.has(v.videoId) && seen.add(v.videoId));
  const podcasts = (m.podcasts || []).filter((e) => !podcastProblems(e).length);
  return Object.assign({}, m, { channels, videos, podcasts });
}

// A snapshot that will be committed or embedded in the published page: the same shape, but every source must be public
// and nothing may come from a local-only source.
function validatePublicSnapshot(u, teamAbbrs) {
  const errs = validateUniverse(u, teamAbbrs);
  if (!isObj(u) || !isObj(u.sources)) return errs;
  for (const [id, s] of Object.entries(u.sources)) if (s.scope !== "public") errs.push("sources." + id + ": local source in a public snapshot");
  (u.events || []).forEach((e, k) => { const s = u.sources[e.source]; if (s && s.scope !== "public") errs.push("events[" + k + "]: from local source " + e.source); });
  const local = (id) => !u.sources[id] || u.sources[id].scope !== "public";
  (u.games || []).forEach((g, k) => {
    if (g.odds && local(g.odds.source)) errs.push("games[" + k + "].odds: from non-public source " + g.odds.source);
    if (g.weather && local(g.weather.source)) errs.push("games[" + k + "].weather: from non-public source " + g.weather.source);
    (g.alerts || []).forEach((x, j) => { if (x && local(x.source)) errs.push("games[" + k + "].alerts[" + j + "]: from non-public source " + x.source); });
    if (g.market && local(g.market.source)) errs.push("games[" + k + "].market: from non-public source " + g.market.source);
    // each book's prices may be shown by the local server but never published (The Odds API terms: no re-serving)
    if (g.books != null) errs.push("games[" + k + "].books: each sportsbook's prices stay on the local server");
    if (local(g.source)) errs.push("games[" + k + "]: from non-public source " + g.source);
    if (g.situation != null || g.winProb != null || g.state === "in") errs.push("games[" + k + "]: live state comes only from local sources");
  });
  for (const [a, t] of Object.entries(u.injuries || {})) (t.players || []).forEach((p, j) => {
    if (local(p.source)) errs.push("injuries." + a + ".players[" + j + "]: from non-public source " + p.source);
    if (p.also && local(p.also.source)) errs.push("injuries." + a + ".players[" + j + "].also: from non-public source " + p.also.source);
  });
  (u.transactions || []).forEach((x, k) => { if (local(x.source)) errs.push("transactions[" + k + "]: from non-public source " + x.source); });
  (u.events || []).forEach((e, k) => { const o = e.data && e.data.other; if (o && local(o.source)) errs.push("events[" + k + "].data.other: from non-public source " + o.source); });
  if (u.media) for (const f of ["videos", "podcasts"]) (u.media[f] || []).forEach((x, k) => { if (local(x.source)) errs.push("media." + f + "[" + k + "]: from non-public source " + x.source); });
  if (u.fantasy && local(u.fantasy.source)) errs.push("fantasy: from non-public source " + u.fantasy.source);
  for (const [id, list] of Object.entries(u.lines || {})) (Array.isArray(list) ? list : []).forEach((o, k) => { if (o && local(o.source)) errs.push("lines." + id + "[" + k + "]: from non-public source " + o.source); });
  (u.recentFinals || []).forEach((f, k) => { if (f && local(f.source)) errs.push("recentFinals[" + k + "]: from non-public source " + f.source); });
  return errs;
}

// GET /api/game/<id>: one game's detail. Local scope (built from ESPN's game summary).
function validateGameDetail(d, teamAbbrs) {
  const errs = [];
  const err = (path, msg) => { if (errs.length < 50) errs.push(path + ": " + msg); };
  if (!isObj(d)) return ["root: not an object"];
  if (d.v !== VERSION) err("v", "expected version " + VERSION);
  if (typeof d.id !== "string") err("id", "string");
  if (!isIso(d.generatedAt)) err("generatedAt", "not ISO");
  if (typeof d.source !== "string") err("source", "string");
  if (!SOURCE_SCOPES.includes(d.scope)) err("scope", "public or local");
  const h = d.header;
  if (!isObj(h)) err("header", "object");
  else {
    for (const f of ["away", "home"]) if (typeof h[f] !== "string" || (teamAbbrs && !teamAbbrs.includes(h[f]))) err("header." + f, "team");
    if (!GAME_STATES.includes(h.state)) err("header.state", JSON.stringify(h.state));
    for (const f of ["period", "awayScore", "homeScore"]) if (!isNum(h[f])) err("header." + f, "number");
  }
  if (!Array.isArray(d.winProb)) err("winProb", "array");
  else d.winProb.forEach((w, k) => { if (!isProb(w.home)) err("winProb[" + k + "].home", "0-1"); });
  for (const f of ["scoring", "plays", "injuries"]) if (!Array.isArray(d[f])) err(f, "array");
  (d.scoring || []).forEach((s, k) => { if (!isNum(s.period) || typeof s.text !== "string") err("scoring[" + k + "]", "period and text"); });
  return errs;
}

module.exports = { VERSION, EVENT_TYPES, GAME_STATES, SOURCE_STATUS, SOURCE_SCOPES, INJURY_STATUS, MEDIA_KINDS, VIDEO_ID, CHANNEL_ID, PODCAST_AUDIO, NFL_OMNY_ORG,
  validateUniverse, validatePublicSnapshot, validateGameDetail, cleanMedia };
