// The NFL data fabric: every external read goes through here (docs/ARCHITECTURE.md). It merges the sources allowed by
// `scopes` into one /api/universe payload (lib/contract.js), turning what it sees into events with provenance.
"use strict";
const fs = require("fs");
const path = require("path");
const { createSource, fetchWithRetry } = require("./source");
const pub = require("./adapters/public");
const espn = require("./adapters/espn");
const media = require("./adapters/media");
const { ABBRS, team } = require("./entities");
const { hash, newsImportance, confidence, injuryWeight, clusterNews } = require("./score");

const ROOT = path.join(__dirname, "..", "..");
const MIN = 60000, HOUR = 60 * MIN;
const seasonFor = (t) => { const d = new Date(t); return d.getUTCMonth() >= 2 ? d.getUTCFullYear() : d.getUTCFullYear() - 1; };
const plain = (s) => String(s || "").toLowerCase().replace(/\b(jr|sr|ii|iii|iv|v)\b\.?/g, "").replace(/[^a-z]/g, "");
const lastName = (s) => plain(String(s || "").replace(/\b(Jr|Sr|II|III|IV|V)\b\.?/g, "").trim().split(/\s+/).pop());
const TX_IMPORTANCE = { traded: 60, placed_ir: 35, activated: 30, released: 25, claimed: 20, waived: 15, signed: 15, promoted: 10, other: 10 };
const WX_IMPORTANCE = { snow: 50, wind: 45, rain: 30, cold: 25 };
const GAME_EVENT_KEEP = 36 * HOUR;

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
  const add = (d) => { if (scopes.includes(d.scope)) defs.push(d); };

  add({ id: "nflverse-games", label: "nflverse schedule and lines", scope: "public", tier: 2, ttlMs: 30 * MIN, maxStaleSec: 26 * 3600,
    load: async () => pub.normalizeGames(await get(pub.URLS.games, { as: "text", timeoutMs: 30000 }), season, now()) });
  add({ id: "nflverse-injuries", label: "nflverse injury report", scope: "public", tier: 2, ttlMs: 3 * HOUR, maxStaleSec: 30 * 3600,
    load: async () => pub.normalizeInjuries(await get(pub.URLS.injuries(season), { as: "text", timeoutMs: 30000 }), season) });
  add({ id: "open-meteo", label: "Open-Meteo forecast", scope: "public", tier: 2, ttlMs: 30 * MIN, maxStaleSec: 3 * 3600,
    load: async () => {
      // targets come from the public schedule only, never from local sources
      const r = sources["nflverse-games"] ? await sources["nflverse-games"].get({ now: now() }) : null;
      const targets = r && r.data ? pub.weatherTargets(r.data.games, now()) : [];
      if (!targets.length) return { forecasts: {}, note: r && r.data ? "No outdoor games in the next 8 days; nothing requested" : "Schedule unavailable; nothing requested" };
      return { forecasts: pub.normalizeWeather(await get(pub.weatherUrl(targets), { timeoutMs: 10000 }), targets), note: null };
    } });
  // Backup weather: the National Weather Service, asked only for outdoor games Open-Meteo has no current forecast for
  // (Open-Meteo's free limit is counted per network address, so shared hosts can be refused). US stadiums only.
  const nwsGrid = new Map();   // "lat,lon" -> hourly forecast address; a stadium's grid cell does not change
  add({ id: "nws", label: "National Weather Service forecast (backup)", scope: "public", tier: 1, ttlMs: 60 * MIN, maxStaleSec: 6 * 3600,
    load: async () => {
      const r = sources["nflverse-games"] ? await sources["nflverse-games"].get({ now: now() }) : null;
      if (!r || !r.data) return { forecasts: {}, note: "Schedule unavailable; nothing requested" };
      const targets = pub.weatherTargets(r.data.games, now());
      const om = sources["open-meteo"] ? await sources["open-meteo"].get({ now: now() }) : null;
      const have = om && om.data && (om.mode === "live" || om.mode === "cached") ? om.data.forecasts || {} : {};
      const need = targets.filter((t) => !have[t.id]);
      if (!need.length) return { forecasts: {}, note: targets.length ? "Not requested: Open-Meteo has a current forecast for every outdoor game" : "No outdoor games in the next 8 days; nothing requested" };
      const forecasts = {}, o = { timeoutMs: 10000, headers: { accept: "application/geo+json" } };
      let failed = 0, outside = 0, last = null;
      for (const t of need) {
        const key = t.at[0].toFixed(4) + "," + t.at[1].toFixed(4);
        try {
          if (!nwsGrid.has(key)) nwsGrid.set(key, pub.nwsHourlyUrl(await get(pub.URLS.nwsPoint(t.at[0], t.at[1]), o)));
          const w = pub.normalizeNws(await get(nwsGrid.get(key), o), t);
          if (w) forecasts[t.id] = w;
        } catch (err) { if (/answered 404/.test(String(err && err.message))) outside++; else { failed++; last = err; } }
      }
      if (failed && !Object.keys(forecasts).length) throw last;
      const bits = [outside ? outside + " outside the United States" : null, failed ? failed + " not answered" : null].filter(Boolean);
      return { forecasts, note: "Backup for " + need.length + " game" + (need.length > 1 ? "s" : "") + " without a current Open-Meteo forecast" + (bits.length ? " (" + bits.join(", ") + ")" : "") };
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
  add({ id: "espn-scoreboard", label: "ESPN scoreboard (local only)", scope: "local", tier: 2, ttlMs: 15000, maxStaleSec: 10 * 60,
    load: async () => espn.normalizeScoreboard(await get(espn.URLS.scoreboard)) });
  add({ id: "espn-news", label: "ESPN news (local only)", scope: "local", tier: 2, ttlMs: 5 * MIN, maxStaleSec: HOUR / 1000,
    load: async () => espn.normalizeNews(await get(espn.URLS.news)) });
  add({ id: "espn-injuries", label: "ESPN injuries (local only)", scope: "local", tier: 2, ttlMs: 30 * MIN, maxStaleSec: 3 * 3600,
    load: async () => espn.normalizeInjuries(await get(espn.URLS.injuries, { timeoutMs: 20000 })) });
  add({ id: "espn-transactions", label: "ESPN transactions (local only)", scope: "local", tier: 2, ttlMs: 30 * MIN, maxStaleSec: 6 * 3600,
    load: async () => espn.normalizeTransactions(await get(espn.URLS.transactions)) });

  const sources = Object.fromEntries(defs.map((d) => [d.id, createSource(Object.assign({ cacheDir }, d))]));

  // Persisted state: first-seen times (the point-in-time clock) and recent game events (kickoffs, scores), which are
  // only observable as changes between polls and must not vanish after the poll that saw them.
  const stateFile = cacheDir ? path.join(cacheDir, "state.json") : null;
  let seen = {}, gameEvents = [];
  if (stateFile) try { const s = JSON.parse(fs.readFileSync(stateFile, "utf8")); seen = s.seen || {}; gameEvents = s.gameEvents || []; } catch (_) {}
  const seenAt = (id) => (seen[id] = seen[id] || new Date(now()).toISOString());
  function saveState() {
    if (!stateFile) return;
    const t = now();
    for (const [k, v] of Object.entries(seen)) if (Date.parse(v) < t - 45 * 86400000) delete seen[k];
    gameEvents = gameEvents.filter((e) => Date.parse(e.ts) >= t - GAME_EVENT_KEEP);
    try { fs.mkdirSync(cacheDir, { recursive: true }); fs.writeFileSync(stateFile, JSON.stringify({ seen, gameEvents })); } catch (_) {}
  }

  function toGame(e) {
    const st = team(e.home).stadium;
    return { id: e.id, gid: null, week: null, kickoff: e.kickoff, away: e.away, home: e.home, state: e.state, period: e.period, clock: e.clock, awayScore: e.awayScore, homeScore: e.homeScore,
      situation: e.situation, venue: e.venue || { name: st.name, city: st.city, indoor: st.roof === "dome" || st.roof === "fixed", neutral: false }, broadcast: e.broadcast,
      odds: e.odds, weather: null, winProb: e.winProb, source: "espn-scoreboard" };
  }

  const prevState = new Map();   // game id -> {state, awayScore, homeScore} at the last computation
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

    // games: nflverse base, ESPN overlay joined on the ESPN event id nflverse records, weather from Open-Meteo
    const nv = data("nflverse-games"), sb = data("espn-scoreboard");
    const games = (nv ? nv.games : []).map((g) => Object.assign({}, g));
    const kicks = games.map((g) => Date.parse(g.kickoff));
    const inWindow = (k) => !games.length || (k >= Math.min(...kicks) - 3 * 86400000 && k <= Math.max(...kicks) + 3 * 86400000);
    if (sb) for (const e of sb.games) {
      const g = games.find((x) => x.id === e.id) || games.find((x) => x.away === e.away && x.home === e.home && Math.abs(Date.parse(x.kickoff) - Date.parse(e.kickoff)) < 4 * 86400000);
      if (!g) { if (inWindow(Date.parse(e.kickoff))) games.push(toGame(e)); continue; }
      Object.assign(g, { id: e.id, state: e.state, period: e.period, clock: e.clock, awayScore: e.awayScore, homeScore: e.homeScore, situation: e.situation,
        winProb: e.winProb, broadcast: e.broadcast || g.broadcast, source: "espn-scoreboard", odds: e.odds || g.odds, kickoff: e.kickoff || g.kickoff });
      if (e.venue) g.venue = Object.assign({}, g.venue, { indoor: g.venue.indoor || e.venue.indoor });
    }
    // a current Open-Meteo forecast first, then the backup, then an older Open-Meteo forecast
    const wx = (data("open-meteo") || {}).forecasts || {}, wxB = (data("nws") || {}).forecasts || {};
    const wxNow = got["open-meteo"] && (got["open-meteo"].mode === "live" || got["open-meteo"].mode === "cached");
    for (const g of games) g.weather = g.venue.indoor ? null : (wxNow && wx[g.id]) || wxB[g.id] || wx[g.id] || null;
    games.sort((a, b) => Date.parse(a.kickoff) - Date.parse(b.kickoff));
    lastGameIds = new Set(games.map((g) => g.id));

    const events = [];
    const push = (e) => events.push(Object.assign({ subtype: null, players: [], url: null, sourceCount: 1, gameId: null, data: {} }, e, { seenAt: seenAt(e.id) }));
    const stamp = (id) => seen[id] || new Date(t).toISOString();

    for (const g of games) {
      const label = g.away + " " + g.awayScore + ", " + g.home + " " + g.homeScore;
      const prev = prevState.get(g.id);
      const keep = (e) => { if (!gameEvents.some((x) => x.id === e.id)) gameEvents.push(Object.assign({}, e, { seenAt: seenAt(e.id) })); };
      if (prev && prev.state === "pre" && g.state === "in") { const id = "game-" + hash(g.id, "kickoff");
        keep({ id, type: "game", subtype: "kickoff", ts: stamp(id), teams: [g.away, g.home], title: "Kickoff: " + g.away + " at " + g.home, source: g.source, publisher: "ESPN",
          importance: 30, confidence: 0.99, sourceCount: 1, sources: [], players: [], url: null, gameId: g.id, data: {} }); }
      if (prev && g.state === "in" && (prev.awayScore !== g.awayScore || prev.homeScore !== g.homeScore)) {
        const who = g.homeScore - prev.homeScore > g.awayScore - prev.awayScore ? g.home : g.away, id = "game-" + hash(g.id, g.awayScore, g.homeScore);
        keep({ id, type: "game", subtype: "score", ts: stamp(id), teams: [g.away, g.home], title: who + " scores: " + label + " (Q" + g.period + " " + g.clock + ")", source: g.source,
          publisher: "ESPN", importance: 35, confidence: 0.99, sourceCount: 1, sources: [], players: [], url: null, gameId: g.id, data: {} });
      }
      prevState.set(g.id, { state: g.state, awayScore: g.awayScore, homeScore: g.homeScore });
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
        const wPub = w.source === "nws" ? ["National Weather Service", "https://www.weather.gov/"] : ["Open-Meteo", "https://open-meteo.com/"];
        push({ id, type: "weather", subtype: w.flags[0], ts: seen[id] || at(w.source), teams: [g.away, g.home],
          title: g.away + " at " + g.home + ": " + [w.windMph != null ? "wind " + Math.round(w.windMph) + " mph" + (w.gustMph ? ", gusts " + Math.round(w.gustMph) : "") : null,
            w.precipProb != null ? "precipitation chance " + w.precipProb + "%" : null, w.tempF != null ? Math.round(w.tempF) + "°F" : null].filter(Boolean).join(", ") + " at kickoff",
          source: w.source, publisher: wPub[0], importance: Math.max(...w.flags.map((f) => WX_IMPORTANCE[f] || 20)), confidence: 0.7,
          sources: [{ publisher: wPub[0], url: wPub[1] }], gameId: g.id, data: { flags: w.flags } });
      }
    }
    for (const e of gameEvents) if (Date.parse(e.ts) >= t - GAME_EVENT_KEEP && sources[e.source]) push(e);

    // injuries: nflverse's weekly report (public) and ESPN's list (local), compared player by player. Quarterback
    // starters come from nflverse's record of who started each team's last game.
    const injuries = {};
    const nvInj = data("nflverse-injuries"), esInj = data("espn-injuries"), starters = (nv && nv.starters) || {};
    // same full name, or same first initial and last name ("C.J." / "CJ"); a shared last name alone is not enough
    const initLast = (s) => plain(String(s || "").trim().charAt(0)) + "|" + lastName(s);
    const isStarter = (a, p) => (p.pos === "QB" && starters[a] ? plain(p.name) === plain(starters[a]) || initLast(p.name) === initLast(starters[a]) : p.starter);
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
        reportWeek: nvInj ? nvInj.week : null, players: list };
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
    const evs = [...byId.values()].sort((x, y) => Date.parse(y.ts) - Date.parse(x.ts)).slice(0, 500);
    saveState();
    // status describes the data actually used in this payload, not a refresh that landed afterwards
    const st = {}; for (const [id, s] of Object.entries(sources)) st[id] = s.status(t, got[id]);
    for (const id of ["open-meteo", "nws"]) if (st[id] && data(id)) st[id].note = data(id).note || null;
    for (const id of ["youtube-official", "podcasts-nfl"]) { const d = data(id); if (st[id] && d && d.failed && d.failed.length) st[id].note = "No answer from: " + d.failed.join(", "); }

    // media: official channels (configuration), their latest videos, and the latest podcast episodes
    let mediaBlock;
    if (sources["youtube-official"] || sources["podcasts-nfl"]) {
      const seenVid = new Set();
      const unique = ((data("youtube-official") || {}).videos || []).filter((v) => !seenVid.has(v.videoId) && seenVid.add(v.videoId));
      const videos = media.quota(unique, { perChannel: 8, shorts: 3 });   // every channel keeps its newest videos
      const podcasts = ((data("podcasts-nfl") || {}).episodes || []).slice().sort((x, y) => Date.parse(y.published) - Date.parse(x.published)).slice(0, 30);
      // the contract is enforced here, at the boundary: an item that fails it is dropped, not served
      mediaBlock = require("../contract").cleanMedia({ channels: media.channelList(), videos, podcasts });
    }
    const u = { v: 1, generatedAt: new Date(t).toISOString(), season, week: nv ? nv.week : sb ? sb.week : null, seasonType: nv ? nv.seasonType : "regular",
      sources: st, games, events: evs, injuries, transactions };
    if (mediaBlock) u.media = mediaBlock;
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

  return { universe, health, game, team: teamSlice, sources, scopes, cacheDir };
}

module.exports = { createFabric, seasonFor };
