// The Odds API live scores (backlog F57, DEC-027): /v4/sports/americanfootball_nfl/scores. Each game's score, whether
// it is completed, and the provider's last update time. Nothing else: no quarter, game clock, possession or win
// probability, so a game from here is marked clockKnown: false and the page computes no in-game chance for it.
// Costs (checked Nov. 26, 2026): 1 credit a call, 2 with daysFrom. Without daysFrom the answer has live and upcoming
// games only, so a game that has just finished drops out; one daysFrom=1 call collects its final.
// Terms (Aug. 31, 2026): may be shown in a website and stored, not redistributed as an API, feed or downloadable file.
// So these scores reach the hosted page only; the snapshot runs never switch the source on, and lib/contract.js refuses
// them in a public snapshot. The key goes in the x-api-key header (oddsapi.js fetchJson), never in a URL.
"use strict";
const { fetchJson, BY_NAME } = require("./oddsapi");

const BASE = "https://api.the-odds-api.com/v4/sports/americanfootball_nfl/scores/";
const MIN = 60000, HOUR = 60 * MIN;
// A game is watched from 2 minutes before kickoff to 4.5 hours after, and while it is still live up to 8 hours after.
const WINDOW_BEFORE_MS = 2 * MIN, WINDOW_AFTER_MS = 4.5 * HOUR, LIVE_CAP_MS = 8 * HOUR;
// Credits kept back for the odds source: below this many left, live scores pause, with one look every PROBE_MS to see
// whether the plan's credits have renewed.
const RESERVE = 500, PROBE_MS = 6 * HOUR;
// One call every ... ms, by credits left: [at least, ms]. The slowest band stays well under the page's 3 minutes for
// "live" (LIVE_GAME_MAX_AGE_SEC), so a game does not flicker between live and out of date. An answer without the credits
// header gets the 60-second band: without knowing the credits left, the reserve cannot be kept, so it goes slower.
const PACE = [[5000, 30000], [1000, 60000], [RESERVE, 90000]], UNKNOWN_MS = 60000;
// A game still not completed after this many daysFrom asks is marked lost (it stops costing calls).
const FINAL_ASKS = 3;
const KEEP_MS = 4 * 86400000;   // games are kept this long after kickoff (a week's finals for the payload)

const iso = (v) => (typeof v === "string" && Number.isFinite(Date.parse(v)) ? new Date(Date.parse(v)).toISOString() : null);
const lower = (s) => String(s || "").toLowerCase();
// The same game when the two teams match in either order (a neutral-site game may be listed with home and away the
// other way round) and the kickoffs are within 36 hours. reversed(): listed the other way round.
const sameGame = (a, b) => ((a.home === b.home && a.away === b.away) || (a.home === b.away && a.away === b.home)) && Math.abs(Date.parse(a.kickoff) - Date.parse(b.kickoff)) < 36 * HOUR;
const reversed = (a, b) => a.home === b.away && a.away === b.home && a.home !== b.home;

function scoresUrl({ daysFrom = 0 } = {}) { return BASE + "?dateFormat=iso" + (daysFrom ? "&daysFrom=" + daysFrom : ""); }
function fetchScores(key, nowMs, { daysFrom = 0, fetchImpl, timeoutMs } = {}) { return fetchJson(scoresUrl({ daysFrom }), key, nowMs, { fetchImpl, timeoutMs }); }

// A team's score from the answer's list: a whole number written as text ("17"), 0 to 999. Anything else is null.
function scoreOf(list, name) {
  const o = list.find((x) => x && typeof x.name === "string" && lower(x.name) === lower(name));
  const s = o ? (typeof o.score === "number" ? String(o.score) : o.score) : null;
  return typeof s === "string" && /^\d{1,3}$/.test(s.trim()) ? Number(s.trim()) : null;
}

// The answer -> {games: [{pid, home, away, kickoff, state, awayScore, homeScore, scoreAt, completed}], unmatched, unscored}.
// state: post when completed, in when it has scores, else pre. Teams the canonical list does not know are counted, never
// guessed; a completed game without both scores is counted as unscored and left out (nothing true can be said of it).
function normalizeScores(json) {
  const games = [], seen = new Set(); let unmatched = 0, unscored = 0;
  for (const e of Array.isArray(json) ? json : []) {
    if (!e || typeof e !== "object" || typeof e.id !== "string" || !e.id || seen.has(e.id)) continue;
    seen.add(e.id);
    const home = BY_NAME.get(lower(e.home_team)), away = BY_NAME.get(lower(e.away_team)), kickoff = iso(e.commence_time);
    if (!home || !away || !kickoff) { unmatched++; continue; }
    const list = Array.isArray(e.scores) ? e.scores : [];
    const hs = scoreOf(list, e.home_team), as = scoreOf(list, e.away_team), both = hs != null && as != null, completed = e.completed === true;
    if (completed && !both) { unscored++; continue; }
    games.push({ pid: e.id.slice(0, 64), home, away, kickoff, state: completed ? "post" : both ? "in" : "pre",
      awayScore: both ? as : null, homeScore: both ? hs : null, scoreAt: iso(e.last_update), completed });
  }
  return { games, unmatched, unscored };
}

// This answer laid over what earlier answers showed. Games this answer has are stamped checkedAt (when we last saw
// them); a game once final stays final; a game that was live and is missing (it finished, and answers without daysFrom
// leave finished games out) waits for its final, which the next call asks for with daysFrom. If that call does not list
// it at all, or FINAL_ASKS such calls still show it unfinished, it is marked lost and not asked for again: it keeps its
// last score and checkedAt, so the page shows its age, and it no longer keeps calls going.
function fold(held, fresh, { nowMs, daysFrom = 0 }) {
  const at = new Date(nowMs).toISOString(), byId = new Map(), inAnswer = new Set();
  for (const g of (held && Array.isArray(held.games) ? held.games : [])) byId.set(g.pid, g);
  for (const g of fresh.games) {
    inAnswer.add(g.pid);
    const old = byId.get(g.pid);
    if (old && old.state === "post" && g.state !== "post") { byId.set(g.pid, Object.assign({}, old, { checkedAt: at })); continue; }
    // a live game listed for a moment without scores keeps its last scores rather than going back to "not started"
    if (old && old.state === "in" && g.state === "pre") { byId.set(g.pid, Object.assign({}, old, { checkedAt: at })); continue; }
    // still live in a daysFrom answer: the count of final asks carries on (a plain answer listing it starts it again)
    byId.set(g.pid, Object.assign({}, g, { checkedAt: at }, daysFrom && old && old.finalAsks && g.state === "in" ? { finalAsks: old.finalAsks } : {}));
  }
  const pending = new Set(held && Array.isArray(held.pendingFinal) ? held.pendingFinal : []);
  if (daysFrom) for (const pid of pending) {
    const g = byId.get(pid);
    if (!g || g.state !== "in") continue;
    const asks = (g.finalAsks || 0) + 1;
    byId.set(pid, Object.assign({}, g, { finalAsks: asks }, !inAnswer.has(pid) || asks >= FINAL_ASKS ? { lost: true } : {}));
  }
  for (const [pid, g] of byId) {
    if (inAnswer.has(pid) || g.state !== "in" || g.lost) { pending.delete(pid); continue; }
    if (!daysFrom) pending.add(pid);
  }
  for (const [pid, g] of byId) if (nowMs - Date.parse(g.kickoff) > KEEP_MS) { byId.delete(pid); pending.delete(pid); }
  const games = [...byId.values()].sort((a, b) => Date.parse(a.kickoff) - Date.parse(b.kickoff) || (a.pid < b.pid ? -1 : 1));
  return { games, pendingFinal: [...pending].sort(), unmatched: fresh.unmatched || 0, unscored: fresh.unscored || 0 };
}

// Whether to call now and how: {call, daysFrom, watching, why}. schedule: the nflverse games around this week (or null
// when the schedule is unavailable); held: this source's last data. A game is watched inside its window unless already
// final (in the schedule or here); a game seen live is watched up to LIVE_CAP_MS after kickoff, even if the schedule
// does not list it. Below the credit reserve, one look every PROBE_MS.
function plan({ schedule, held, nowMs }) {
  const heldGames = held && Array.isArray(held.games) ? held.games : [], sched = Array.isArray(schedule) ? schedule : [];
  const finalHere = (g) => heldGames.some((h) => h.state === "post" && sameGame(h, g));
  const liveHere = (g) => heldGames.some((h) => h.state === "in" && !h.lost && sameGame(h, g));
  const finalThere = (h) => sched.some((g) => g.state === "post" && sameGame(h, g));
  const watch = [];
  for (const g of sched) {
    const k = Date.parse(g.kickoff);
    if (!Number.isFinite(k) || g.state === "post" || finalHere(g)) continue;
    if (nowMs >= k - WINDOW_BEFORE_MS && nowMs <= k + (liveHere(g) ? LIVE_CAP_MS : WINDOW_AFTER_MS)) watch.push(g);
  }
  for (const h of heldGames) if (h.state === "in" && !h.lost && nowMs - Date.parse(h.kickoff) <= LIVE_CAP_MS && !finalThere(h) && !watch.some((g) => sameGame(h, g))) watch.push(h);
  const pending = held && Array.isArray(held.pendingFinal) && held.pendingFinal.length > 0;
  if (!watch.length && !pending) return { call: false, daysFrom: 0, watching: 0, why: schedule ? "idle" : "no-schedule" };
  const c = held && held.credits, last = Date.parse((held && held.calledAt) || "");
  if (c && c.remaining != null && c.remaining < RESERVE && Number.isFinite(last) && nowMs - last < PROBE_MS) return { call: false, daysFrom: 0, watching: watch.length, why: "paused" };
  return { call: true, daysFrom: pending ? 1 : 0, watching: watch.length, why: null };
}

// How long to wait before the next call, from the credits the last answer reported.
function intervalFor(credits) {
  const r = credits && credits.remaining;
  if (r == null) return UNKNOWN_MS;
  for (const [floor, ms] of PACE) if (r >= floor) return ms;
  return PROBE_MS;
}

module.exports = { scoresUrl, fetchScores, normalizeScores, fold, plan, intervalFor, sameGame, reversed, FINAL_ASKS, BASE, RESERVE, PROBE_MS, PACE, WINDOW_BEFORE_MS, WINDOW_AFTER_MS, LIVE_CAP_MS };
