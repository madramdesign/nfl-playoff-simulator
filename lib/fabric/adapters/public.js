// Public-scope adapters: sources whose terms allow showing and storing what we keep (docs/NFL_DATA_SOURCE_REGISTRY.md).
// Each exports a pure normalize function (tested on fixtures) and a source definition for lib/fabric/index.js.
"use strict";
const fs = require("fs");
const path = require("path");
const { parseCsv, num, easternToIso, parseRss } = require("../util");
const { teamAbbr, team, teamsInText, ENT } = require("../entities");

const URLS = {
  games: "https://raw.githubusercontent.com/nflverse/nfldata/master/data/games.csv",
  injuries: (season) => "https://github.com/nflverse/nflverse-data/releases/download/injuries/injuries_" + season + ".csv",
  depthCharts: (season) => "https://github.com/nflverse/nflverse-data/releases/download/depth_charts/depth_charts_" + season + ".csv",
  rosters: (season) => "https://github.com/nflverse/nflverse-data/releases/download/weekly_rosters/roster_weekly_" + season + ".csv",
  openMeteo: "https://api.open-meteo.com/v1/forecast",
  rss: { "rss-yahoo": ["https://sports.yahoo.com/nfl/rss.xml", "Yahoo Sports"], "rss-espn": ["https://www.espn.com/espn/rss/nfl/news", "ESPN"] },
};
const PLAYOFF = { WC: "wildcard", DIV: "divisional", CON: "conference", SB: "superbowl" };
const implied = (ml) => (ml < 0 ? -ml / (-ml + 100) : 100 / (ml + 100));

// --- nflverse games file: this week's schedule, final scores and one sportsbook line per game ---
// The current week is the one holding the earliest unplayed game that has not long since kicked off (a game left
// unscored weeks ago, e.g. postponed, must not pin the week). Also returns each team's most recent starting
// quarterback, from the season's played games, so injury weights can tell a starter from a backup. The weeks just
// before and after (`prev`, `next`) come along too, so the fabric can move on the moment the live feed shows a week
// over and keep the last week's finals until the simulation's own data has them.
function normalizeGames(text, season, now = Date.now()) {
  const rows = parseCsv(text).filter((r) => r.season === String(season) && (r.game_type === "REG" || PLAYOFF[r.game_type]));
  if (!rows.length) throw new Error("no games for season " + season);
  const kick = (r) => Date.parse(easternToIso(r.gameday, r.gametime));
  const order = (r) => (r.game_type === "REG" ? 0 : 100) + Number(r.week);
  const open = rows.filter((r) => num(r.home_score) == null && kick(r) >= now - 36 * 3600000);
  const past = rows.filter((r) => kick(r) <= now);
  const cur = open.length ? open.reduce((a, r) => (order(r) < order(a) ? r : a))
    : (past.length ? past : rows).reduce((a, r) => (order(r) > order(a) ? r : a));
  const starters = {};
  for (const r of rows.filter((r) => num(r.home_score) != null).sort((x, y) => order(x) - order(y))) {
    const h = teamAbbr(r.home_team), a = teamAbbr(r.away_team);
    if (h && r.home_qb_name) starters[h] = r.home_qb_name;
    if (a && r.away_qb_name) starters[a] = r.away_qb_name;
  }
  const week = Number(cur.week), type = cur.game_type;
  const toGame = (r) => {
    const week = Number(r.week);
    const away = teamAbbr(r.away_team), home = teamAbbr(r.home_team);
    if (!away || !home) throw new Error("unknown team in " + r.game_id);
    const neutral = r.location === "Neutral", st = team(home).stadium, roof = (r.roof || "").toLowerCase();
    const indoor = roof === "dome" || roof === "closed" || (!roof && !neutral && (st.roof === "dome" || st.roof === "fixed"));
    const hs = num(r.home_score), as = num(r.away_score);
    const sp = num(r.spread_line), tot = num(r.total_line), hm = num(r.home_moneyline), am = num(r.away_moneyline);
    let odds = null;
    if (sp != null || tot != null || (hm != null && am != null)) {
      const hp = hm != null && am != null ? Math.round((implied(hm) / (implied(hm) + implied(am))) * 1e4) / 1e4 : null;
      odds = { source: "nflverse-games", provider: "nflverse (one book)", spread: { open: null, current: sp == null ? null : -sp }, total: { open: null, current: tot },
        homeML: { open: null, current: hm }, awayML: { open: null, current: am }, homeProb: { open: null, current: hp } };
    }
    return { id: r.espn || r.game_id, gid: r.game_id, week, kickoff: easternToIso(r.gameday, r.gametime), away, home,
      state: hs != null ? "post" : "pre", period: hs != null ? 4 : 0, clock: "0:00", awayScore: as || 0, homeScore: hs || 0, situation: null,
      venue: { name: r.stadium || (neutral ? "Neutral site" : st.name), city: neutral ? null : st.city, indoor, neutral, roof: roof || st.roof },
      broadcast: null, odds, weather: null, winProb: null, source: "nflverse-games" };
  };
  const games = rows.filter((r) => r.game_type === type && Number(r.week) === week).map(toGame);
  const orders = [...new Set(rows.map(order))].sort((x, y) => x - y), ci = orders.indexOf(order(cur));
  const weekAt = (o) => {
    if (o == null) return null;
    const rs = rows.filter((r) => order(r) === o);
    return { week: Number(rs[0].week), seasonType: rs[0].game_type === "REG" ? "regular" : PLAYOFF[rs[0].game_type], games: rs.map(toGame) };
  };
  return { season, week, seasonType: type === "REG" ? "regular" : PLAYOFF[type], games, starters, prev: weekAt(orders[ci - 1]), next: weekAt(orders[ci + 1]) };
}

// --- nflverse injury report: the latest week's game status per team ---
const NV_STATUS = { Out: "Out", Doubtful: "Doubtful", Questionable: "Questionable" };
function normalizeInjuries(text, season) {
  const rows = parseCsv(text).filter((r) => r.season === String(season));
  if (!rows.length) throw new Error("no injury rows for season " + season);
  const week = Math.max(...rows.map((r) => Number(r.week) || 0));
  const teams = {};
  for (const r of rows) {
    if (Number(r.week) !== week || !NV_STATUS[r.report_status]) continue;
    const a = teamAbbr(r.team); if (!a) continue;
    (teams[a] = teams[a] || []).push({ name: r.full_name, pos: r.position || null, status: NV_STATUS[r.report_status], type: r.report_primary_injury || null,
      practice: r.practice_status || null, returnDate: null, date: null, espnId: null, gsisId: r.gsis_id || null, starter: null, source: "nflverse-injuries" });
  }
  return { week, teams };
}

// --- nflverse depth charts: every team's chart as of its newest snapshot ---
// The season file holds a dated snapshot of every chart for every day since spring (about 80 MB, not in date order),
// so it is scanned once for each team's newest `dt` and only those rows are parsed. Rank 1 at a slot is the starter.
// Columns (checked Nov. 23, 2026): dt, team, player_name, espn_id, gsis_id, pos_grp, pos_abb, pos_slot, pos_rank, ...
function normalizeDepthCharts(text) {
  const nl = text.indexOf("\n"); if (nl < 0) throw new Error("depth charts: no rows");
  const header = text.slice(0, nl).replace(/\r$/, "");
  if (!/^dt,team,/.test(header)) throw new Error("depth charts: unexpected columns " + header.slice(0, 60));
  const newest = new Map();
  let i = nl + 1;
  while (i < text.length) {   // first pass: newest snapshot time per team, reading only the first two fields
    const e = text.indexOf("\n", i), end = e < 0 ? text.length : e, c1 = text.indexOf(",", i), c2 = c1 < 0 ? -1 : text.indexOf(",", c1 + 1);
    if (c2 > 0 && c2 < end) { const dt = text.slice(i, c1), tm = text.slice(c1 + 1, c2); if (!newest.has(tm) || dt > newest.get(tm)) newest.set(tm, dt); }
    i = end + 1;
  }
  const keep = [header];
  i = nl + 1;
  while (i < text.length) {   // second pass: only each team's newest rows
    const e = text.indexOf("\n", i), end = e < 0 ? text.length : e, c1 = text.indexOf(",", i), c2 = c1 < 0 ? -1 : text.indexOf(",", c1 + 1);
    if (c2 > 0 && c2 < end && newest.get(text.slice(c1 + 1, c2)) === text.slice(i, c1)) keep.push(text.slice(i, end).replace(/\r$/, ""));
    i = end + 1;
  }
  const teams = {}, asOf = {};
  for (const r of parseCsv(keep.join("\n"))) {
    const a = teamAbbr(r.team), rank = num(r.pos_rank); if (!a || !r.player_name || rank == null) continue;
    (teams[a] = teams[a] || []).push({ name: r.player_name, gsisId: r.gsis_id || null, espnId: r.espn_id || null, group: r.pos_grp || null, slot: r.pos_abb || null, rank });
    if (!asOf[a] || r.dt > asOf[a]) asOf[a] = r.dt;
  }
  if (!Object.keys(teams).length) throw new Error("depth charts: no usable rows");
  return { asOf, teams };
}

// --- nflverse weekly rosters: the newest week's players with their ids on other services (the player crosswalk) ---
function normalizeRosters(text, season) {
  const rows = parseCsv(text).filter((r) => r.season === String(season));
  if (!rows.length) throw new Error("no roster rows for season " + season);
  const week = Math.max(...rows.map((r) => Number(r.week) || 0)), bySleeper = {}, byGsis = {};
  for (const r of rows) {
    if (Number(r.week) !== week || !r.gsis_id) continue;
    const a = teamAbbr(r.team); if (!a) continue;
    const p = { name: r.full_name, team: a, pos: r.position || null, status: r.status || null, gsisId: r.gsis_id, espnId: r.espn_id || null, sleeperId: r.sleeper_id || null };
    byGsis[p.gsisId] = p;
    if (p.sleeperId) bySleeper[p.sleeperId] = p;
  }
  return { week, byGsis, bySleeper, players: Object.keys(byGsis).length };
}

// --- Open-Meteo: conditions at the kickoff hour for outdoor games in the next 8 days ---
function venueLatLon(g) {
  if (!g.venue.neutral) { const s = team(g.home).stadium; return [s.lat, s.lon]; }
  const site = Object.entries(ENT.neutralSites).find(([name, v]) => (g.venue.name || "").includes(name) || (g.venue.city || "") === v.city);
  return site ? [site[1].lat, site[1].lon] : null;
}
function weatherTargets(games, now) {
  return games.filter((g) => g.state !== "post" && !g.venue.indoor && Date.parse(g.kickoff) - now < 8 * 86400000 && Date.parse(g.kickoff) - now > -4 * 3600000)
    .map((g) => ({ id: g.id, at: venueLatLon(g), kickoff: g.kickoff, roof: g.venue.roof })).filter((t) => t.at);
}
function weatherUrl(targets) {
  const q = new URLSearchParams({ latitude: targets.map((t) => t.at[0]).join(","), longitude: targets.map((t) => t.at[1]).join(","),
    hourly: "temperature_2m,wind_speed_10m,wind_gusts_10m,precipitation_probability,precipitation,snowfall",
    wind_speed_unit: "mph", temperature_unit: "fahrenheit", precipitation_unit: "inch", forecast_days: "9", timezone: "UTC" });
  return URLS.openMeteo + "?" + q.toString();
}
function normalizeWeather(json, targets) {
  const list = Array.isArray(json) ? json : [json];
  if (list.length !== targets.length) throw new Error("expected " + targets.length + " locations, got " + list.length);
  const out = {};
  targets.forEach((t, k) => {
    const h = list[k].hourly; if (!h || !h.time) return;
    const want = Date.parse(t.kickoff); let best = -1, gap = Infinity;
    h.time.forEach((tm, j) => { const d = Math.abs(Date.parse(tm + "Z") - want); if (d < gap) { gap = d; best = j; } });
    if (best < 0 || gap > 2 * 3600000) return;
    const v = (f) => (h[f] ? h[f][best] : null);
    const w = { source: "open-meteo", tempF: v("temperature_2m"), windMph: v("wind_speed_10m"), gustMph: v("wind_gusts_10m"), precipProb: v("precipitation_probability"),
      precipIn: v("precipitation"), snowIn: v("snowfall") == null ? null : Math.round((v("snowfall") / 2.54) * 100) / 100, summary: t.roof === "retractable" ? "Retractable roof: may be closed" : null, flags: [] };
    if ((w.windMph != null && w.windMph >= 15) || (w.gustMph != null && w.gustMph >= 25)) w.flags.push("wind");
    if (w.precipProb != null && w.precipProb >= 60) w.flags.push("rain");
    if (w.snowIn != null && w.snowIn > 0) w.flags.push("snow");
    if (w.tempF != null && w.tempF <= 25) w.flags.push("cold");
    out[t.id] = w;
  });
  return out;
}

// --- RSS headlines (DEC-012: shown unmodified with publisher and link) ---
function normalizeRss(xml, sourceId, publisher) {
  return parseRss(xml).slice(0, 60).map((it) => ({ title: it.title, url: it.link, ts: it.ts, publisher, source: sourceId, tier: 2, teams: teamsInText(it.title) }));
}

// --- curated news: data/news.json, own-words items with real links ---
function normalizeCurated(json, now, days = 10) {
  const cutoff = new Date(now - days * 86400000).toISOString().slice(0, 10);
  return (json.items || []).filter((n) => n.date >= cutoff && teamAbbr(n.team) && /^https:\/\//.test(n.url || "")).map((n) => ({
    // the file holds a date, not a time: noon UTC keeps it on the right calendar day in US time zones; shown as a date only
    title: n.headline || n.summary, url: n.url, ts: n.date + "T12:00:00.000Z", dateOnly: true, publisher: n.source || "Curated", source: "curated-news", tier: 2,
    teams: [teamAbbr(n.team)], kind: n.kind || "news", summary: n.summary }));
}
function readCurated(root) { return JSON.parse(fs.readFileSync(path.join(root, "data", "news.json"), "utf8")); }

module.exports = { URLS, normalizeGames, normalizeInjuries, normalizeDepthCharts, normalizeRosters, normalizeWeather, weatherTargets, weatherUrl, normalizeRss, normalizeCurated, readCurated };
