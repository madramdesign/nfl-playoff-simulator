// Carry-forward for the daily public snapshot (backlog F01). The snapshot runs where a source can be unreachable for
// the whole run, and a fresh runner has no cache to fall back on, so a failed source used to vanish from the published
// page. Here each failed source's part of the payload is taken from the previous published snapshot instead, and the
// source is reported as stale with its original lastOk and its true age. Nothing old is ever shown as fresh, nothing is
// carried from a local source, and nothing older than MAX_AGE_DAYS is carried at all. Pure: no files, no clock.
"use strict";

const MAX_AGE_DAYS = 7;
// What each source contributes to the payload, so what can be carried for it. Sources missing here (depth charts, the
// roster crosswalk) only shape other parts; when they fail, those parts fall back to their older rules instead.
const CARRIES = {
  "nflverse-games": ["games", "events"],
  "nflverse-injuries": ["injuries", "events"],
  "open-meteo": ["weather", "events"],
  "rss-yahoo": ["events"], "rss-espn": ["events"], "curated-news": ["events"],
  "youtube-official": ["videos"], "podcasts-nfl": ["podcasts"],
  "sleeper-trending": ["fantasy"],
};

const usable = (s) => s && s.scope === "public" && (s.status === "ok" || s.status === "stale") && Number.isFinite(Date.parse(s.lastOk));
const failed = (s) => !s || s.status === "down" || s.status === "pending";

// prev: the previous published snapshot (or null); next: this run's payload; now: ms. Returns
// {u, carried: [source ids], tooOld: [source ids]}. `u` is a new object; `next` is not changed.
function carryForward(prev, next, now) {
  const u = JSON.parse(JSON.stringify(next)), carried = [], tooOld = [];
  if (!prev || typeof prev !== "object" || !prev.sources) return { u, carried, tooOld };
  for (const id of Object.keys(CARRIES)) {
    const was = prev.sources[id], is = u.sources[id];
    if (!is || !failed(is) || !usable(was)) continue;
    const ok = Date.parse(was.lastOk);
    if (now - ok > MAX_AGE_DAYS * 86400000) { tooOld.push(id); continue; }
    for (const part of CARRIES[id]) carryPart(part, id, prev, u);
    u.sources[id] = Object.assign({}, was, { status: "stale", ageSec: Math.max(0, Math.round((now - ok) / 1000)), lastError: is.lastError || was.lastError || null,
      fails: is.fails, breaker: is.breaker, carriedFrom: prev.generatedAt || null });
    carried.push(id);
  }
  if (carried.length) {
    // the fabric's order: items with a known time newest first, items already there when watching began last
    const bw = (e) => (e.data && e.data.beforeWatch ? 1 : 0);
    u.events.sort((x, y) => bw(x) - bw(y) || Date.parse(y.ts) - Date.parse(x.ts));
    u.events = u.events.slice(0, 500);
  }
  return { u, carried, tooOld };
}

function carryPart(part, id, prev, u) {
  if (part === "events") {
    const have = new Set(u.events.map((e) => e.id));
    for (const e of prev.events || []) if (e.source === id && !have.has(e.id)) u.events.push(e);
  } else if (part === "games") {
    if (!u.games.length && Array.isArray(prev.games) && prev.games.length) { u.games = prev.games; u.week = prev.week; u.seasonType = prev.seasonType; }
  } else if (part === "injuries") {
    if (!Object.keys(u.injuries || {}).length && prev.injuries) u.injuries = prev.injuries;
  } else if (part === "weather") {
    const old = new Map((prev.games || []).filter((g) => g.weather && g.weather.source === id).map((g) => [g.id, g.weather]));
    for (const g of u.games) if (!g.weather && old.has(g.id) && !(g.venue && g.venue.indoor)) g.weather = old.get(g.id);
  } else if (part === "videos" || part === "podcasts") {
    const pm = prev.media; if (!pm || !Array.isArray(pm[part])) return;
    u.media = u.media || { channels: pm.channels || [], videos: [], podcasts: [] };
    if (!u.media[part].length) u.media[part] = pm[part].filter((x) => x.source === id);
    if (!u.media.channels.length && Array.isArray(pm.channels)) u.media.channels = pm.channels;
  } else if (part === "fantasy") {
    if (!u.fantasy && prev.fantasy) u.fantasy = prev.fantasy;
  }
}

module.exports = { carryForward, CARRIES, MAX_AGE_DAYS };
