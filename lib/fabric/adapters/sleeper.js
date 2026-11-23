// Sleeper's public read-only API (docs.sleeper.com, checked Nov. 23, 2026): no token; stay under 1,000 calls a
// minute; free for non-commercial use; credit Sleeper for trending data. Used here: the current NFL week, and the
// players most added and dropped across Sleeper fantasy leagues. Never any league or user data, and nothing that
// writes.
"use strict";
const { teamAbbr } = require("../entities");

const BASE = "https://api.sleeper.app/v1";
const LOOKBACK_HOURS = 24, LIMIT = 25;
const URLS = {
  state: BASE + "/state/nfl",
  trending: (kind) => BASE + "/players/nfl/trending/" + kind + "?lookback_hours=" + LOOKBACK_HOURS + "&limit=" + LIMIT,
};

// {week, season, seasonType} from /state/nfl.
function normalizeState(s) {
  if (!s || typeof s !== "object") throw new Error("sleeper state: not an object");
  const week = Number(s.week), season = Number(s.season);
  if (!Number.isInteger(week) || !Number.isInteger(season)) throw new Error("sleeper state: no week or season");
  return { week, season, seasonType: typeof s.season_type === "string" ? s.season_type : null };
}
// [{sleeperId, count}] from a trending list. A team defence's id is its abbreviation ("DEN"); it is kept with `team`.
function normalizeTrending(list) {
  if (!Array.isArray(list)) throw new Error("sleeper trending: not a list");
  const out = [], seen = new Set();
  for (const x of list) {
    if (!x || typeof x !== "object") continue;
    const id = typeof x.player_id === "string" ? x.player_id : typeof x.player_id === "number" ? String(x.player_id) : null, count = Number(x.count);
    if (!id || !/^[A-Za-z0-9]{1,12}$/.test(id) || seen.has(id) || !Number.isFinite(count) || count < 0) continue;
    seen.add(id);
    out.push({ sleeperId: id, count: Math.round(count), defense: /^[A-Z]{2,3}$/.test(id) && teamAbbr(id) ? teamAbbr(id) : null });
  }
  return out;
}

module.exports = { URLS, LOOKBACK_HOURS, LIMIT, normalizeState, normalizeTrending };
