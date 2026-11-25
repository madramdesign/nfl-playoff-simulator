// The NFL data fabric: every external read goes through here (docs/ARCHITECTURE.md). It merges the sources allowed by
// `scopes` into one /api/universe payload (lib/contract.js), turning what it sees into events with provenance.
"use strict";
const fs = require("fs");
const path = require("path");
const { createSource, fetchWithRetry } = require("./source");
const pub = require("./adapters/public");
const espn = require("./adapters/espn");
const media = require("./adapters/media");
const sleeper = require("./adapters/sleeper");
const lineHistory = require("./lines");
const nws = require("./adapters/nws");
const oddsApi = require("./adapters/oddsapi");
const { ABBRS, team } = require("./entities");
const { hash, newsImportance, confidence, injuryWeight, clusterNews } = require("./score");

const ROOT = path.join(__dirname, "..", "..");
const MIN = 60000, HOUR = 60 * MIN;
const seasonFor = (t) => { const d = new Date(t); return d.getUTCMonth() >= 2 ? d.getUTCFullYear() : d.getUTCFullYear() - 1; };
const plain = (s) => String(s || "").toLowerCase().replace(/\b(jr|sr|ii|iii|iv|v)\b\.?/g, "").replace(/[^a-z]/g, "");
const lastName = (s) => plain(String(s || "").replace(/\b(Jr|Sr|II|III|IV|V)\b\.?/g, "").trim().split(/\s+/).pop());
const TX_IMPORTANCE = { traded: 60, placed_ir: 35, activated: 30, released: 25, claimed: 20, waived: 15, signed: 15, promoted: 10, other: 10 };
const WX_IMPORTANCE = { snow: 50, wind: 45, rain: 30, cold: 25 };
// an official warning outranks a forecast flag; by NWS's own severity
const NWS_IMPORTANCE = { Extreme: 85, Severe: 70, Moderate: 50, Minor: 35, Unknown: 30 };
const GAME_EVENT_KEEP = 36 * HOUR;
// The fantasy block: Sleeper's most added and dropped players, named and placed on a team through nflverse's roster
// crosswalk (sleeper_id). A player the crosswalk does not know is counted, never guessed at. Null without Sleeper data.
function fantasyBlock(sl, ro) {
  if (!sl) return null;
  const by = (ro && ro.bySleeper) || {}, missed = { adds: 0, drops: 0 };
  const name = (kind) => (sl[kind] || []).map((x) => {
    if (x.defense) { const tm = team(x.defense); return { name: (tm ? tm.name : x.defense) + " defense", team: x.defense, pos: "DEF", count: x.count, sleeperId: x.sleeperId, gsisId: null }; }
    const p = by[x.sleeperId]; if (!p) { missed[kind]++; return null; }
    return { name: p.name, team: p.team, pos: p.pos, count: x.count, sleeperId: x.sleeperId, gsisId: p.gsisId };
  }).filter(Boolean);
  return { source: "sleeper-trending", lookbackHours: sleeper.LOOKBACK_HOURS, week: sl.state ? sl.state.week : null, adds: name("adds"), drops: name("drops"),
    unmatched: missed, crosswalk: ro ? "nflverse-rosters" : null };
}
// A game window: a game in progress, or one due to start within 15 minutes and not over (up to 4 hours after its
// scheduled kickoff, so a late start or a delay still counts).
function liveWindow(games, t) {
  return (games || []).some((g) => {
    if (g.state === "in") return true;
    const k = Date.parse(g.kickoff);
    return g.state === "pre" && Number.isFinite(k) && k - t <= 15 * MIN && t - k <= 4 * HOUR;
  });
}
// When a game change happened, given that it was not in data fetched at `lo` and was in data fetched at `hi` (ms).
// anchor: a known planned time (the scheduled kickoff), used when it falls inside the gap. Gaps of up to two minutes
// (the server checking on its own during games) count as exact; longer ones are marked as an estimate, with the gap.
const EXACT_GAP_MS = 2 * MIN;
function gameTime(lo, hi, anchor) {
  if (!Number.isFinite(hi)) hi = Date.now();
  if (!Number.isFinite(lo) || lo > hi) lo = hi;
  const ts = Number.isFinite(anchor) ? Math.min(hi, Math.max(lo, anchor)) : hi;
  const data = hi - lo > EXACT_GAP_MS ? { tsEstimated: true, between: [new Date(lo).toISOString(), new Date(hi).toISOString()] } : {};
  return { ts: new Date(ts).toISOString(), data };
}

// Why a source is switched off where it is (FABRIC_OFF), shown with its status.
const OFF_NOTES = {
  "rss-espn": "Off on GitHub's servers: ESPN's network answers them with an empty HTTP 202 (seen Nov. 24-25, 2026). The hosted and local servers read it.",
};

function createFabric(opts = {}) {
  const scopes = (opts.scopes || ["public", "local"]).slice().sort();
  const now = opts.now || (() => Date.now());
  const season = opts.season || seasonFor(now());
  // One cache folder per scope set, so a public-only run can never read a cache written with local data (DEC-006).
  const cacheRoot = opts.cacheDir === undefined ? path.join(ROOT, ".cache", "fabric") : opts.cacheDir;
  const cacheDir = cacheRoot ? path.join(cacheRoot, scopes.join("+")) : null;
  const root = opts.root || ROOT;
  const fetchImpl = opts.fetchImpl || fetch;
  const get = (url, o = {}) => fetchWithRetry(url, Object.assign({ fetchImpl }, o));
  const defs = [];
  // Sources switched off where they cannot work (FABRIC_OFF or opts.off: source ids; DEC-024): reported "disabled" with
  // the reason, never fetched, and no cached copy read, so nothing old is shown, and nothing is carried forward.
  const off = new Set((opts.off || String(process.env.FABRIC_OFF || "").split(",")).map((x) => String(x).trim()).filter(Boolean));
  const add = (d) => { if (scopes.includes(d.scope)) defs.push(off.has(d.id) ? Object.assign({}, d, { enabled: false, cacheDir: null }) : d); };

  add({ id: "nflverse-games", label: "nflverse schedule and lines", scope: "public", tier: 2, ttlMs: 30 * MIN, maxStaleSec: 26 * 3600,
    load: async () => pub.normalizeGames(await get(pub.URLS.games, { as: "text", timeoutMs: 30000 }), season, now()) });
  add({ id: "nflverse-injuries", label: "nflverse injury report", scope: "public", tier: 2, ttlMs: 3 * HOUR, maxStaleSec: 30 * 3600,
    load: async () => pub.normalizeInjuries(await get(pub.URLS.injuries(season), { as: "text", timeoutMs: 30000 }), season) });
  // depth charts: an 80 MB season file, so at most twice a day; its own snapshot times say how current each chart is
  add({ id: "nflverse-depth", label: "nflverse depth charts", scope: "public", tier: 2, ttlMs: 12 * HOUR, maxStaleSec: 48 * 3600,
    load: async () => pub.normalizeDepthCharts(await get(pub.URLS.depthCharts(season), { as: "text", timeoutMs: 120000 })) });
  add({ id: "nflverse-rosters", label: "nflverse weekly rosters (player ids)", scope: "public", tier: 2, ttlMs: 12 * HOUR, maxStaleSec: 48 * 3600,
    load: async () => pub.normalizeRosters(await get(pub.URLS.rosters(season), { as: "text", timeoutMs: 60000 }), season) });
  // Sleeper: three small read-only calls an hour (their limit is 1,000 a minute)
  add({ id: "sleeper-trending", label: "Sleeper trending players", scope: "public", tier: 2, ttlMs: HOUR, maxStaleSec: 6 * 3600,
    load: async () => ({ state: sleeper.normalizeState(await get(sleeper.URLS.state, { timeoutMs: 15000 })),
      adds: sleeper.normalizeTrending(await get(sleeper.URLS.trending("add"), { timeoutMs: 15000 })),
      drops: sleeper.normalizeTrending(await get(sleeper.URLS.trending("drop"), { timeoutMs: 15000 })) }) });
  add({ id: "open-meteo", label: "Open-Meteo forecast", scope: "public", tier: 2, ttlMs: 30 * MIN, maxStaleSec: 3 * 3600,
    load: async () => {
      // targets come from the public schedule only, never from local sources
      const r = sources["nflverse-games"] ? await sources["nflverse-games"].get({ now: now() }) : null;
      const targets = r && r.data ? pub.weatherTargets(r.data.games.concat(r.data.next ? r.data.next.games : []), now()) : [];
      if (!targets.length) return { forecasts: {}, note: r && r.data ? "No outdoor games in the next 8 days; nothing requested" : "Schedule unavailable; nothing requested" };
      return { forecasts: pub.normalizeWeather(await get(pub.weatherUrl(targets), { timeoutMs: 10000 }), targets), note: null };
    } });
  // National Weather Service alerts (F29): outdoor games in the next two days, three stadiums at a time; a point outside
  // NWS coverage (a neutral site abroad) answers 4xx and is skipped, not counted as a failure
  add({ id: "nws-alerts", label: "National Weather Service alerts", scope: "public", tier: 1, ttlMs: 30 * MIN, maxStaleSec: 3 * 3600,
    load: async () => {
      const r = sources["nflverse-games"] ? await sources["nflverse-games"].get({ now: now() }) : null, t0 = now();
      const targets = r && r.data ? pub.weatherTargets(r.data.games.concat(r.data.next ? r.data.next.games : []), t0).filter((x) => Date.parse(x.kickoff) - t0 < 2 * 86400000) : [];
      const alerts = {}, pages = {}, failed = [], outside = [];
      for (let i = 0; i < targets.length; i += 3) {
        await Promise.all(targets.slice(i, i + 3).map(async (tg) => {
          pages[tg.id] = nws.pageFor(tg.at[0], tg.at[1]);
          try { alerts[tg.id] = nws.normalizeAlerts(await get(nws.alertsUrl(tg.at[0], tg.at[1]), { timeoutMs: 10000, headers: { accept: "application/geo+json" } })).filter((x) => nws.overlapsGame(x, tg.kickoff)); }
          catch (e) { (/answered 4\d\d/.test(String(e && e.message)) ? outside : failed).push(tg.id); }
        }));
      }
      if (targets.length && failed.length === targets.length) throw new Error("no answer from NWS for any stadium");
      return { alerts, pages, checked: targets.length, failed, outside,
        note: !targets.length ? (r && r.data ? "No outdoor games in the next two days; nothing requested" : "Schedule unavailable; nothing requested") : failed.length ? "No answer for " + failed.length + " of " + targets.length + " stadiums" : null };
    } });
  for (const [id, [url, publisher]] of Object.entries(pub.URLS.rss))
    add({ id, label: publisher + " NFL RSS", scope: "public", tier: 2, ttlMs: 10 * MIN, maxStaleSec: 2 * 3600,
      load: async () => pub.normalizeRss(await get(url, { as: "text" }), id, publisher) });
  add({ id: "curated-news", label: "Curated news (data/news.json)", scope: "public", tier: 2, ttlMs: 10 * MIN, maxStaleSec: 4 * 86400,
    load: async () => pub.normalizeCurated(pub.readCurated(root), now()) });
  // official media (docs/MEDIA_ARCHITECTURE.md): one failing channel or show is reported, not fatal
  add({ id: "youtube-official", label: "Official NFL and team YouTube channels", scope: "public", tier: 1, ttlMs: 30 * MIN, maxStaleSec: 6 * 3600,
    load: async () => {
      const chans = media.channelList(), failed = [];
      const lists = await media.pool(chans, 4, async (c) => {
        try { return media.normalizeYoutubeFeed(await get(media.YT_FEED(c.channelId), { as: "text", timeoutMs: 10000, retries: 0 }), c); }
        catch (_) { failed.push(c.name); return []; }
      });
      if (chans.length && failed.length === chans.length) throw new Error("no channel feed answered");
      return { videos: lists.flat(), failed };
    } });
  // NFL TV (DEC-022): whether each candidate (the teams' newest press sessions, the league's newest videos) may be embedded, from YouTube's oEmbed
  // endpoint (no key), three at a time. Answers are remembered (`known`: id -> true or false), so a video is checked once;
  // a refusal (401, 403) or a missing video (404) is a "no", not a failure. The payload's reel is built from the current
  // feed with these answers, so a check made on an older copy of the feed never names videos that are no longer there.
  add({ id: "youtube-reel", label: "NFL TV: official videos that may be embedded", scope: "public", tier: 1, ttlMs: 30 * MIN, maxStaleSec: 6 * 3600,
    load: async () => {
      // the feeds as fresh as they are about to be: when they are being fetched now, wait for that answer
      const yt = sources["youtube-official"];
      let r = yt ? await yt.get({ now: now() }) : null;
      if (yt && yt._state.inflight) { await yt._state.inflight; r = { data: yt._state.data }; }
      const cands = r && r.data ? media.reelCandidates(r.data.videos, leagueChannel()) : [];
      const held = (sources["youtube-reel"] && sources["youtube-reel"]._state.data) || {}, known = {};
      for (const v of cands) if (held.known && typeof held.known[v.videoId] === "boolean") known[v.videoId] = held.known[v.videoId];
      if (!cands.length) return { known, reel: [], checked: 0, failed: 0, note: r && r.data ? "No press sessions or league videos to check" : "YouTube feeds unavailable; nothing checked" };
      const todo = cands.filter((v) => !(v.videoId in known)), failed = [];
      await media.pool(todo, 3, async (v) => {
        try { await get(media.OEMBED(v.videoId), { timeoutMs: 8000, retries: 0 }); known[v.videoId] = true; }
        catch (e) { if (/answered (401|403|404)\b/.test(String(e && e.message))) known[v.videoId] = false; else failed.push(v.videoId); }
      });
      if (todo.length && failed.length === todo.length && !Object.keys(known).length) throw new Error("no answer from YouTube's embed check");
      const no = cands.filter((v) => known[v.videoId] === false).length;
      return { known, reel: cands.map((v) => v.videoId).filter((id) => known[id] === true), checked: todo.length, failed: failed.length,
        note: no ? no + " of the " + cands.length + " videos picked do not allow embedding" : failed.length ? "No answer for " + failed.length + " of " + todo.length : null };
    } });
  add({ id: "podcasts-nfl", label: "Official NFL podcasts", scope: "public", tier: 1, ttlMs: 6 * HOUR, maxStaleSec: 2 * 86400,
    load: async () => {
      const failed = [];
      const lists = await media.pool(media.PODCASTS, 2, async ([show, url]) => {
        try { return media.normalizePodcastFeed(await media.readHead(url, { items: 6, fetchImpl }), show, 4, media.feedProgram(url)); }
        catch (_) { failed.push(show); return []; }
      });
      if (failed.length === media.PODCASTS.length) throw new Error("no podcast feed answered");
      return { episodes: media.dedupeEpisodes(lists.flat()), failed };
    } });
  // The Odds API (F04/F23): off unless the owner sets ODDS_API_KEY. 3 credits a look, at most one look every 11 hours
  // per place it runs (the local server; GitHub's data fetch, whose cache carries the last look between runs): about
  // 13 credits a day in all, under the free 500 a month. Each book's prices reach the payload only when the local scope
  // is on; without it they are dropped as soon as they arrive, so no public run or its cache holds them (terms: no
  // re-serving the raw feed; GitHub caches of a public repository can be read by pull requests).
  const oddsKey = opts.oddsApiKey !== undefined ? String(opts.oddsApiKey || "") : String(process.env.ODDS_API_KEY || "").trim();
  add({ id: "odds-api", label: oddsKey ? "The Odds API (US sportsbooks)" : "The Odds API (off: no key)", scope: "public", tier: 2, ttlMs: 11 * HOUR, maxStaleSec: 26 * 3600,
    enabled: !!oddsKey, maxFailures: 2, cooldownMs: 6 * HOUR, minIntervalMs: 11 * HOUR,
    load: async () => {
      const t0 = now(), held = sources["odds-api"] && sources["odds-api"]._state.data, prevCredits = held ? held.credits : null;
      if (!oddsApi.budgetAllows(prevCredits, t0)) throw new Error("credit floor reached: " + prevCredits.remaining + " left this month");
      const r = await oddsApi.fetchOdds(oddsKey, t0, { fetchImpl }), n = oddsApi.normalizeOdds(r.json, t0);
      if (!scopes.includes("local")) n.games = n.games.map((g) => Object.assign({}, g, { books: [] }));
      return Object.assign(n, { credits: r.credits });
    } });
  add({ id: "espn-scoreboard", label: "ESPN scoreboard (local only)", scope: "local", tier: 2, ttlMs: 15000, maxStaleSec: 10 * 60,
    load: async () => espn.normalizeScoreboard(await get(espn.URLS.scoreboard)) });
  add({ id: "espn-news", label: "ESPN news (local only)", scope: "local", tier: 2, ttlMs: 5 * MIN, maxStaleSec: HOUR / 1000,
    load: async () => espn.normalizeNews(await get(espn.URLS.news)) });
  add({ id: "espn-injuries", label: "ESPN injuries (local only)", scope: "local", tier: 2, ttlMs: 30 * MIN, maxStaleSec: 3 * 3600,
    load: async () => espn.normalizeInjuries(await get(espn.URLS.injuries, { timeoutMs: 20000 })) });
  add({ id: "espn-transactions", label: "ESPN transactions (local only)", scope: "local", tier: 2, ttlMs: 30 * MIN, maxStaleSec: 6 * 3600,
    load: async () => espn.normalizeTransactions(await get(espn.URLS.transactions)) });

  const sources = Object.fromEntries(defs.map((d) => [d.id, createSource(Object.assign({ cacheDir }, d))]));
  function leagueChannel() { return (media.channelList().find((c) => c.team == null) || {}).channelId; }

  // Persisted state: first-seen times (the point-in-time clock) and recent game events (kickoffs, scores), which are
  // only observable as changes between polls and must not vanish after the poll that saw them.
  const stateFile = cacheDir ? path.join(cacheDir, "state.json") : null;
  // firstData: when each source first had data in this folder. Items with no time of their own that were first seen
  // then were already there when watching began: their real time is unknown and before that moment, so they are marked
  // (data.beforeWatch) instead of looking brand new after every fresh start.
  let seen = {}, gameEvents = [], firstData = {}, lineHist = {};
  if (stateFile) try {
    const s = JSON.parse(fs.readFileSync(stateFile, "utf8")); seen = s.seen || {}; gameEvents = s.gameEvents || []; firstData = s.firstData || {}; lineHist = s.lines || {};
    if (!s.firstData) {   // a folder from before firstData existed: its earliest first-seen time is when watching began
      const v = Object.values(seen).map(Date.parse).filter(Number.isFinite);
      if (v.length) { const start = new Date(Math.min(...v)).toISOString(); for (const d of defs) firstData[d.id] = start; }
    }
  } catch (_) {}
  const seenAt = (id) => (seen[id] = seen[id] || new Date(now()).toISOString());
  function saveState() {
    if (!stateFile) return;
    const t = now();
    for (const [k, v] of Object.entries(seen)) if (Date.parse(v) < t - 45 * 86400000) delete seen[k];
    gameEvents = gameEvents.filter((e) => Date.parse(e.ts) >= t - GAME_EVENT_KEEP);
    try { fs.mkdirSync(cacheDir, { recursive: true }); fs.writeFileSync(stateFile, JSON.stringify({ seen, gameEvents, firstData, lines: lineHist })); } catch (_) {}
  }
  // The start of watching, when event e's only time is its first-seen time and it was first seen in the first
  // computation that had its source's data; otherwise null. Game events are changes seen live, never a backlog.
  const WATCH_START_MS = 10000;
  function beforeWatch(e) {
    if (e.type === "game") return null;
    const s = Date.parse(seen[e.id]), f = Date.parse(firstData[e.source]), ts = Date.parse(e.ts);
    if (!Number.isFinite(s) || !Number.isFinite(f) || !Number.isFinite(ts)) return null;
    return Math.abs(ts - s) < 2000 && s - f >= -1000 && s - f < WATCH_START_MS ? firstData[e.source] : null;
  }

  function toGame(e) {
    const st = team(e.home).stadium;
    return { id: e.id, gid: null, week: null, kickoff: e.kickoff, away: e.away, home: e.home, state: e.state, period: e.period, clock: e.clock, awayScore: e.awayScore, homeScore: e.homeScore,
      situation: e.situation, venue: e.venue || { name: st.name, city: st.city, indoor: st.roof === "dome" || st.roof === "fixed", neutral: false }, broadcast: e.broadcast,
      odds: e.odds, weather: null, winProb: e.winProb, source: "espn-scoreboard" };
  }

  const prevState = new Map();   // game id -> {state, awayScore, homeScore, at: when that data was fetched}
  let memo = null, inflight = null, lastGameIds = new Set();

  // fresh: fetch every source now instead of serving cache while refreshing (used by the daily snapshot)
  function universe({ fresh = false } = {}) {
    const t = now();
    if (!fresh && memo && t - memo.at < 5000) return Promise.resolve(memo.u);
    if (inflight) return inflight;                       // one computation at a time; concurrent callers share it
    inflight = compute(t, fresh).finally(() => { inflight = null; });
    return inflight;
  }

  async function compute(t, fresh) {
    const got = {};
    await Promise.all(Object.entries(sources).map(async ([id, s]) => { got[id] = await s.get({ now: t, force: fresh }); }));
    const data = (id) => (got[id] && got[id].data) || null;
    const at = (id) => (got[id] && got[id].at ? new Date(got[id].at).toISOString() : new Date(t).toISOString());
    for (const id of Object.keys(sources)) if (!firstData[id] && data(id)) firstData[id] = new Date(t).toISOString();

    // games: nflverse base, ESPN overlay joined on the ESPN event id nflverse records, weather from Open-Meteo
    const nv = data("nflverse-games"), sb = data("espn-scoreboard");
    // one week's nflverse games with ESPN's scoreboard laid over them; ESPN games nflverse does not list are added when
    // they fall within that week, but never a game the schedule has in another week (ESPN keeps showing last week's
    // games for a day or two after the schedule moves on)
    const sameGame = (x, e) => x.id === e.id || (x.away === e.away && x.home === e.home && Math.abs(Date.parse(x.kickoff) - Date.parse(e.kickoff)) < 4 * 86400000);
    const scheduled = nv ? [].concat(nv.prev ? nv.prev.games : [], nv.games, nv.next ? nv.next.games : []) : [];
    const withScoreboard = (base) => {
      const list = (base || []).map((g) => Object.assign({}, g));
      const kicks = list.map((g) => Date.parse(g.kickoff));
      const inWindow = (k) => !list.length || (k >= Math.min(...kicks) - 3 * 86400000 && k <= Math.max(...kicks) + 3 * 86400000);
      if (sb) for (const e of sb.games) {
        const g = list.find((x) => sameGame(x, e));
        if (!g) { if (inWindow(Date.parse(e.kickoff)) && !scheduled.some((x) => sameGame(x, e))) list.push(toGame(e)); continue; }
        Object.assign(g, { id: e.id, state: e.state, period: e.period, clock: e.clock, awayScore: e.awayScore, homeScore: e.homeScore, situation: e.situation,
          winProb: e.winProb, broadcast: e.broadcast || g.broadcast, source: "espn-scoreboard", odds: e.odds || g.odds, kickoff: e.kickoff || g.kickoff });
        if (e.venue) g.venue = Object.assign({}, g.venue, { indoor: g.venue.indoor || e.venue.indoor });
      }
      return list;
    };
    let games = withScoreboard(nv ? nv.games : []), week = nv ? nv.week : sb ? sb.week : null, seasonType = nv ? nv.seasonType : "regular", ended = null;
    // Week rollover: the moment the live feed shows every game of the schedule's week final (or ESPN's scoreboard has
    // already moved to the next regular-season week), the next week is shown, instead of waiting hours for the schedule
    // file to record the last score. The finished week's games still give their finals (events, recentFinals).
    if (nv && nv.next && nv.next.games.length) {
      const ofWeek = games.filter((g) => g.week === nv.week && g.gid);
      const allFinal = ofWeek.length > 0 && ofWeek.every((g) => g.state === "post");
      const espnAhead = sb && nv.seasonType === "regular" && nv.next.seasonType === "regular" && sb.week === nv.next.week;
      if (allFinal || espnAhead) { ended = ofWeek; games = withScoreboard(nv.next.games); week = nv.next.week; seasonType = nv.next.seasonType; }
    }
    // the last week's finals, so the page can count a result its simulation data does not have yet: the week just rolled
    // past, else the schedule's previous week
    const finalGames = (ended || (nv && nv.prev ? nv.prev.games : [])).filter((g) => g.state === "post" && Number.isFinite(g.awayScore) && Number.isFinite(g.homeScore));
    const wx = (data("open-meteo") || {}).forecasts || {};
    for (const g of games) g.weather = g.venue.indoor ? null : wx[g.id] || null;
    // NWS alerts (F29) in force around a game's kickoff
    const nwsData = data("nws-alerts") || {};
    for (const g of games) {
      const al = nwsData.alerts && nwsData.alerts[g.id];
      if (al && al.length) g.alerts = al.map((x) => Object.assign({}, x, { source: "nws-alerts", url: (nwsData.pages && nwsData.pages[g.id]) || null }));
    }
    // The Odds API: the median line across US books on each game; each book's own prices only on the local server
    const oa = data("odds-api");
    if (oa) for (const m of oa.games || []) {
      const g = games.find((x) => x.home === m.home && x.away === m.away && Math.abs(Date.parse(x.kickoff) - Date.parse(m.kickoff)) < 36 * HOUR);
      if (!g) continue;
      g.market = Object.assign({ source: "odds-api", provider: "The Odds API", at: at("odds-api") }, m.consensus);
      if (scopes.includes("local")) g.books = m.books.map((b) => Object.assign({ source: "odds-api" }, b));
    }
    // line history (F23): each source's line, stamped with when that source's data was fetched
    lineHist = lineHistory.observeLines(lineHist, games, (sid) => at(sid), t);
    games.sort((a, b) => Date.parse(a.kickoff) - Date.parse(b.kickoff));
    lastGameIds = new Set(games.concat(finalGames).map((g) => g.id));

    const events = [];
    const push = (e) => events.push(Object.assign({ subtype: null, players: [], url: null, sourceCount: 1, gameId: null, data: {} }, e, { seenAt: seenAt(e.id) }));
    const stamp = (id) => seen[id] || new Date(t).toISOString();

    for (const g of games.concat(ended || [])) {
      const label = g.away + " " + g.awayScore + ", " + g.home + " " + g.homeScore;
      const prev = prevState.get(g.id);
      const keep = (e) => { if (!gameEvents.some((x) => x.id === e.id)) gameEvents.push(Object.assign({}, e, { seenAt: seenAt(e.id) })); };
      // A change is only known to have happened between the last data that did not show it (prev.at) and the first
      // that did (seenNow, the source's own fetch time). gameTime() dates it inside that gap and says how sure it is.
      const seenNow = Date.parse(at(g.source));
      if (prev && prev.state === "pre" && g.state === "in") { const id = "game-" + hash(g.id, "kickoff");
        const w = gameTime(prev.at, seenNow, Date.parse(g.kickoff));
        keep({ id, type: "game", subtype: "kickoff", ts: seen[id] || w.ts, teams: [g.away, g.home], title: "Kickoff: " + g.away + " at " + g.home, source: g.source, publisher: "ESPN",
          importance: 30, confidence: 0.99, sourceCount: 1, sources: [], players: [], url: null, gameId: g.id, data: w.data }); }
      if (prev && g.state === "in" && (prev.awayScore !== g.awayScore || prev.homeScore !== g.homeScore)) {
        const da = g.awayScore - prev.awayScore, dh = g.homeScore - prev.homeScore, id = "game-" + hash(g.id, g.awayScore, g.homeScore);
        // one team up by at most a touchdown with a two-point try is one score; anything else may be several, so the
        // title does not name a scorer it cannot be sure of
        const one = (da === 0) !== (dh === 0) && Math.max(da, dh) > 0 && Math.max(da, dh) <= 8, who = dh > da ? g.home : g.away;
        const w = gameTime(prev.at, seenNow, null);
        keep({ id, type: "game", subtype: "score", ts: seen[id] || w.ts, teams: [g.away, g.home], title: (one ? who + " scores: " : "Score update: ") + label + " (Q" + g.period + " " + g.clock + ")", source: g.source,
          publisher: "ESPN", importance: 35, confidence: 0.99, sourceCount: 1, sources: [], players: [], url: null, gameId: g.id, data: w.data });
      }
      prevState.set(g.id, { state: g.state, awayScore: g.awayScore, homeScore: g.homeScore, at: Number.isFinite(seenNow) ? seenNow : t });
      if (g.state === "post") {
        // dated by when the game was played (kickoff plus a typical 3 h 15 min), not by when a feed first reported it
        const id = "game-" + hash(g.id, "final"), ended = Math.min(t, Date.parse(g.kickoff) + 3.25 * HOUR);
        push({ id, type: "game", subtype: "final", ts: new Date(Number.isFinite(ended) ? ended : t).toISOString(), teams: [g.away, g.home], title: "Final: " + label, source: g.source,
          publisher: g.source === "espn-scoreboard" ? "ESPN" : "nflverse", importance: 45, confidence: 0.99, sources: [], gameId: g.id, data: { tsEstimated: true } }); }
      const o = g.odds;
      if (o && o.spread.open != null && o.spread.current != null && g.state === "pre") {
        const d = o.spread.current - o.spread.open, id = "odds-" + hash(g.id, o.spread.current);
        if (Math.abs(d) >= 1.5) push({ id, type: "odds_move", subtype: "spread", ts: stamp(id), teams: [g.away, g.home],
          title: g.away + " at " + g.home + ": home spread moved " + o.spread.open + " to " + o.spread.current, source: o.source, publisher: o.provider,
          importance: Math.min(100, Math.round(30 + 10 * Math.abs(d))), confidence: 0.9, sources: [], gameId: g.id, data: { open: o.spread.open, current: o.spread.current } });
      }
      if (g.weather && g.weather.flags.length && g.state === "pre") {
        const w = g.weather, id = "wx-" + hash(g.id, w.flags.join(","));
        push({ id, type: "weather", subtype: w.flags[0], ts: seen[id] || at("open-meteo"), teams: [g.away, g.home],
          title: g.away + " at " + g.home + ": " + [w.windMph != null ? "wind " + Math.round(w.windMph) + " mph" + (w.gustMph ? ", gusts " + Math.round(w.gustMph) : "") : null,
            w.precipProb != null ? "precipitation chance " + w.precipProb + "%" : null, w.tempF != null ? Math.round(w.tempF) + "°F" : null].filter(Boolean).join(", ") + " at kickoff",
          source: "open-meteo", publisher: "Open-Meteo", importance: Math.max(...w.flags.map((f) => WX_IMPORTANCE[f] || 20)), confidence: 0.7,
          sources: [{ publisher: "Open-Meteo", url: "https://open-meteo.com/" }], gameId: g.id, data: { flags: w.flags } });
      }
      // NWS alerts: the warning's own words and issue time, credited to the National Weather Service
      for (const al of (g.state !== "post" && g.alerts) || []) {
        const id = "nws-" + hash(al.id, g.id), until = al.ends ? " until " + new Date(al.ends).toISOString() : "";
        push({ id, type: "weather", subtype: "nws-alert", ts: al.sent || at("nws-alerts"), teams: [g.away, g.home],
          title: al.event + " at " + (g.venue && g.venue.city ? g.venue.city : g.home) + " for " + g.away + " at " + g.home + (al.headline ? ": " + al.headline : until),
          url: al.url, source: "nws-alerts", publisher: "National Weather Service", importance: NWS_IMPORTANCE[al.severity] || 30, confidence: 0.95,
          sources: [{ publisher: "National Weather Service", url: al.url }], gameId: g.id, data: { severity: al.severity, onset: al.onset, ends: al.ends } });
      }
    }
    for (const e of gameEvents) if (Date.parse(e.ts) >= t - GAME_EVENT_KEEP && sources[e.source]) push(e);

    // injuries: nflverse's weekly report (public) and ESPN's list (local), compared player by player. Quarterback
    // starters come from nflverse's record of who started each team's last game.
    const injuries = {};
    const nvInj = data("nflverse-injuries"), esInj = data("espn-injuries"), starters = (nv && nv.starters) || {};
    // same full name, or same first initial and last name ("C.J." / "CJ"); a shared last name alone is not enough
    const initLast = (s) => plain(String(s || "").trim().charAt(0)) + "|" + lastName(s);
    const lastStart = (a, p) => (p.pos === "QB" && starters[a] ? plain(p.name) === plain(starters[a]) || initLast(p.name) === initLast(starters[a]) : p.starter);
    // The team's current depth chart decides first: rank 1 at any offensive or defensive slot (or kicker, punter, long
    // snapper) is a starter; a lower rank is not. Matched by the player's nflverse or ESPN id, else by full name on the
    // same team. Players not on the chart (often those on injured reserve) fall back to the older rules.
    const depth = data("nflverse-depth");
    const ST_STARTERS = new Set(["PK", "P", "LS"]);
    const depthRank = (a, p) => {
      const rows = depth && depth.teams[a]; if (!rows) return null;
      const mine = rows.filter((r) => (p.gsisId && r.gsisId === p.gsisId) || (p.espnId && r.espnId === String(p.espnId)) || (!p.gsisId && !p.espnId && plain(r.name) === plain(p.name)));
      const counted = mine.filter((r) => r.group !== "Special Teams" || ST_STARTERS.has(r.slot));
      return counted.length ? Math.min(...counted.map((r) => r.rank)) : null;
    };
    const isStarter = (a, p) => {
      const rank = depthRank(a, p);
      if (rank != null) { p.depthRank = rank; p.starterSource = "depth chart"; return rank === 1; }
      const s = lastStart(a, p); p.starterSource = s == null ? null : p.pos === "QB" && starters[a] ? "last start" : p.source === "espn-injuries" ? "ESPN" : null;
      return s;
    };
    const pubName = (src) => (src === "espn-injuries" ? "ESPN" : "nflverse");
    for (const a of ABBRS) {
      const list = [];
      for (const p of (esInj && esInj.teams[a]) || []) list.push(Object.assign({}, p));
      for (const p of (nvInj && nvInj.teams[a]) || []) {
        let m = list.find((x) => plain(x.name) === plain(p.name));
        if (!m) {   // nicknames ("Gabe" / "Gabriel"): same last name and position, and only one such player
          const c = list.filter((x) => !x.also && x.source !== p.source && lastName(x.name) === lastName(p.name) && (!x.pos || !p.pos || x.pos === p.pos));
          if (c.length === 1) m = c[0];
        }
        if (!m) { list.push(Object.assign({}, p)); continue; }
        m.also = { source: p.source, status: p.status, practice: p.practice, week: nvInj.week };
        if (m.status !== p.status && !(m.status === "Injured Reserve" && p.status === "Out")) m.disagree = true;
      }
      if (!list.length) continue;
      let burden = 0;
      for (const p of list) {
        p.starter = isStarter(a, p);
        const w = injuryWeight(p.status, p.pos, p.starter); burden += w;
        if (w * 100 >= 25 || (p.disagree && w * 100 >= 10)) {
          const id = "inj-" + hash(a, plain(p.name), p.status);
          push({ id, type: "injury", subtype: p.status, ts: p.date || stamp(id), teams: [a], players: [{ name: p.name, pos: p.pos }],
            title: p.name + " (" + (p.pos || "?") + ") listed " + p.status + (p.disagree ? " (nflverse's week " + p.also.week + " report: " + p.also.status + ")" : ""),
            source: p.source, publisher: pubName(p.source), importance: Math.round(Math.min(100, w * 100)), confidence: p.disagree ? 0.6 : p.also ? 0.92 : 0.85,
            sourceCount: p.also ? 2 : 1, sources: [{ publisher: pubName(p.source), url: null }].concat(p.also ? [{ publisher: pubName(p.also.source), url: null }] : []),
            data: { status: p.status, starter: p.starter, disagree: !!p.disagree, other: p.also || null } });
        }
      }
      injuries[a] = { burden: Math.round(burden * 100) / 100, out: list.filter((p) => p.status === "Out").length, doubtful: list.filter((p) => p.status === "Doubtful").length,
        questionable: list.filter((p) => p.status === "Questionable").length, ir: list.filter((p) => p.status === "Injured Reserve").length,
        // true only when the quarterback who started the team's last game is out; unknown starters do not count
        qbOut: list.some((p) => p.pos === "QB" && p.starter === true && ["Out", "Doubtful", "Injured Reserve", "Suspended", "Physically Unable to Perform"].includes(p.status)),
        reportWeek: nvInj ? nvInj.week : null, depthAsOf: depth && depth.asOf[a] ? depth.asOf[a] : null, players: list };
    }

    // transactions
    const transactions = (data("espn-transactions") || []).slice().sort((x, y) => Date.parse(y.date) - Date.parse(x.date));
    for (const x of transactions) {
      const imp = Math.min(100, Math.round((TX_IMPORTANCE[x.kind] || 10) * (/\bQB\b/.test(x.text) ? 1.6 : 1)));
      push({ id: "tx-" + hash(x.team, x.text, x.date), type: "transaction", subtype: x.kind, ts: x.date, teams: [x.team], title: x.text, source: x.source, publisher: "ESPN",
        importance: imp, confidence: 0.95, sources: [{ publisher: "ESPN", url: null }], data: { kind: x.kind } });
    }

    // headlines: clustered across publishers and scored. An item with no publication time takes the time we first saw
    // it. A story keeps the id it was first recorded under even if the feed's representative copy changes.
    const items = [];
    for (const id of ["rss-yahoo", "rss-espn", "espn-news"]) for (const it of data(id) || []) {
      const iid = "item-" + hash(it.url);
      items.push(Object.assign({}, it, { iid, ts: it.ts || seenAt(iid) }));
    }
    for (const c of data("curated-news") || []) {
      if (c.kind === "qb_change") push({ id: "cur-" + hash(c.url), type: "qb_change", subtype: null, ts: c.ts, teams: c.teams, title: c.title, url: c.url, source: "curated-news",
        publisher: c.publisher, importance: 85, confidence: confidence(2), sources: [{ publisher: c.publisher, url: c.url }], data: { dateOnly: true } });
      else items.push(Object.assign({}, c, { iid: "item-" + hash(c.url) }));
    }
    for (const cl of clusterNews(items)) {
      const pubs = [...new Map(cl.members.map((m) => [m.publisher, { publisher: m.publisher, url: m.url }])).values()];
      const ids = cl.members.map((m) => "news-" + hash(m.url)).sort();
      const id = ids.find((x) => seen[x]) || ids[0];
      push({ id, type: "news", subtype: null, ts: cl.ts, teams: cl.teams, title: cl.title, url: cl.url, source: cl.source, publisher: cl.publisher,
        importance: newsImportance({ title: cl.title, tier: cl.tier, sourceCount: pubs.length, ts: cl.ts, teams: cl.teams, now: t }), confidence: confidence(cl.tier, pubs.length),
        sourceCount: pubs.length, sources: pubs, data: cl.dateOnly ? { dateOnly: true } : {} });
    }

    const byId = new Map(); for (const e of events) if (!byId.has(e.id)) byId.set(e.id, e);
    for (const e of byId.values()) { const b = beforeWatch(e); if (b) e.data = Object.assign({}, e.data, { beforeWatch: b }); }
    // newest first; items whose time is unknown (already there when watching began) after every item with a real time
    const evs = [...byId.values()].sort((x, y) => (x.data.beforeWatch ? 1 : 0) - (y.data.beforeWatch ? 1 : 0) || Date.parse(y.ts) - Date.parse(x.ts)).slice(0, 500);
    saveState();
    // status describes the data actually used in this payload, not a refresh that landed afterwards
    const st = {}; for (const [id, s] of Object.entries(sources)) st[id] = s.status(t, got[id]);
    if (st["open-meteo"] && data("open-meteo")) st["open-meteo"].note = data("open-meteo").note || null;
    if (st["nws-alerts"] && data("nws-alerts")) st["nws-alerts"].note = data("nws-alerts").note || null;
    for (const id of off) if (st[id]) st[id].note = OFF_NOTES[id] || "Off here (FABRIC_OFF)";
    if (st["odds-api"]) {
      const d = data("odds-api"), c = d && d.credits;
      st["odds-api"].note = !oddsKey ? "Off: set ODDS_API_KEY on the server to switch it on" : [c && c.remaining != null ? c.remaining + " credits left this month (" + oddsApi.CREDITS_PER_CALL + " a look)" : null,
        d && d.unmatched ? d.unmatched + " games with team names not recognised" : null].filter(Boolean).join("; ") || null;
    }
    for (const id of ["youtube-official", "podcasts-nfl"]) { const d = data(id); if (st[id] && d && d.failed && d.failed.length) st[id].note = "No answer from: " + d.failed.join(", "); }
    if (st["youtube-reel"] && data("youtube-reel")) st["youtube-reel"].note = data("youtube-reel").note || null;

    // media: official channels (configuration), their latest videos, and the latest podcast episodes
    let mediaBlock;
    if (sources["youtube-official"] || sources["podcasts-nfl"]) {
      const seenVid = new Set();
      const unique = ((data("youtube-official") || {}).videos || []).filter((v) => !seenVid.has(v.videoId) && seenVid.add(v.videoId));
      const videos = media.quota(unique, { perChannel: 8, shorts: 3 });   // every channel keeps its newest videos
      const podcasts = ((data("podcasts-nfl") || {}).episodes || []).slice().sort((x, y) => Date.parse(y.published) - Date.parse(x.published)).slice(0, 30);
      // the contract is enforced here, at the boundary: an item that fails it is dropped, not served
      // NFL TV: this feed's candidates that the embed check has said yes to
      const known = (data("youtube-reel") || {}).known || {};
      const reel = media.reelCandidates(unique, leagueChannel()).map((v) => v.videoId).filter((id) => known[id] === true);
      mediaBlock = require("../contract").cleanMedia({ channels: media.channelList(), videos, podcasts, reel });
    }
    const u = { v: 1, generatedAt: new Date(t).toISOString(), season, week, seasonType,
      sources: st, games, events: evs, injuries, transactions, lines: Object.fromEntries(games.filter((g) => lineHist[g.id]).map((g) => [g.id, lineHist[g.id]])) };
    if (finalGames.length) u.recentFinals = finalGames.map((g) => ({ id: g.id, gid: g.gid || null, week: g.week, kickoff: g.kickoff, away: g.away, home: g.home,
      awayScore: g.awayScore, homeScore: g.homeScore, source: g.source }));
    if (mediaBlock) u.media = mediaBlock;
    const fantasy = fantasyBlock(data("sleeper-trending"), data("nflverse-rosters"));
    if (fantasy) u.fantasy = fantasy;
    memo = { at: t, u };
    return u;
  }

  function health() { const t = now(); return { generatedAt: new Date(t).toISOString(), sources: Object.fromEntries(Object.entries(sources).map(([id, s]) => [id, s.status(t)])) }; }

  // /api/game/<id>: local scope only (ESPN summary), only for games in the current payload, cached per game
  const summaries = new Map();
  async function game(id) {
    id = String(id);
    if (!scopes.includes("local") || !/^\d{6,12}$/.test(id)) return null;
    if (!lastGameIds.has(id)) await universe();
    if (!lastGameIds.has(id)) return null;
    if (!summaries.has(id)) {
      if (summaries.size >= 40) summaries.delete(summaries.keys().next().value);
      summaries.set(id, createSource({ id: "espn-summary-" + id, label: "ESPN game summary", scope: "local", tier: 2, ttlMs: 15000, maxStaleSec: 600, cacheDir: null,
        load: async () => espn.normalizeSummary(await get(espn.URLS.summary(id)), id, now()) }));
    }
    const r = await summaries.get(id).get({ now: now() });
    return r.data ? Object.assign({}, r.data, { mode: r.mode }) : null;
  }

  async function teamSlice(abbr) {
    const a = ABBRS.find((x) => x === String(abbr).toUpperCase()); if (!a) return null;
    const u = await universe();
    return { v: 1, generatedAt: u.generatedAt, team: team(a), injuries: u.injuries[a] || null, games: u.games.filter((g) => g.away === a || g.home === a),
      events: u.events.filter((e) => e.teams.includes(a)), transactions: u.transactions.filter((x) => x.team === a), sources: u.sources };
  }

  // The server's own heartbeat. Without it the fabric refreshes only when a page asks, so after a quiet spell its
  // first answer is old data and a kickoff or score is dated by when someone next looked. During a game window it
  // recomputes every liveMs (scores, kickoffs and their events stay current with no page open); otherwise every idleMs,
  // which is enough to notice the next window opening. timers: injectable for tests.
  function startWatch({ liveMs = 20000, idleMs = 5 * MIN, setTimer = setTimeout, clearTimer = clearTimeout } = {}) {
    let timer = null, stopped = false;
    const tick = async () => {
      if (stopped) return;
      let next = idleMs;
      try { const u = await universe(); if (liveWindow(u.games, now())) next = liveMs; } catch (_) { /* the next tick tries again */ }
      if (!stopped) { timer = setTimer(tick, next); if (timer && timer.unref) timer.unref(); }
    };
    timer = setTimer(tick, 0); if (timer && timer.unref) timer.unref();
    return { stop() { stopped = true; clearTimer(timer); } };
  }

  return { universe, health, game, team: teamSlice, sources, scopes, cacheDir, startWatch };
}

module.exports = { createFabric, seasonFor, liveWindow, gameTime };
