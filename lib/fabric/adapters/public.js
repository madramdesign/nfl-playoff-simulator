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
  openMeteo: "https://api.open-meteo.com/v1/forecast",
  nwsPoint: (lat, lon) => "https://api.weather.gov/points/" + Number(lat).toFixed(4) + "," + Number(lon).toFixed(4),
  rss: { "rss-yahoo": ["https://sports.yahoo.com/nfl/rss.xml", "Yahoo Sports"], "rss-espn": ["https://www.espn.com/espn/rss/nfl/news", "ESPN"] },
};
const PLAYOFF = { WC: "wildcard", DIV: "divisional", CON: "conference", SB: "superbowl" };
const implied = (ml) => (ml < 0 ? -ml / (-ml + 100) : 100 / (ml + 100));

// --- nflverse games file: this week's schedule, final scores and one sportsbook line per game ---
// The current week is the one holding the earliest unplayed game that has not long since kicked off (a game left
// unscored weeks ago, e.g. postponed, must not pin the week). Also returns each team's most recent starting
// quarterback, from the season's played games, so injury weights can tell a starter from a backup.
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
  const games = rows.filter((r) => r.game_type === type && Number(r.week) === week).map((r) => {
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
  });
  return { season, week, seasonType: type === "REG" ? "regular" : PLAYOFF[type], games, starters };
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
      practice: r.practice_status || null, returnDate: null, date: null, espnId: null, starter: null, source: "nflverse-injuries" });
  }
  return { week, teams };
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
// Descriptive flags, the same thresholds for every weather source. snowWord: the source's own forecast text says snow
// (used where no snowfall amount is given).
function weatherFlags(w, snowWord) {
  const flags = [];
  if ((w.windMph != null && w.windMph >= 15) || (w.gustMph != null && w.gustMph >= 25)) flags.push("wind");
  if (w.precipProb != null && w.precipProb >= 60) flags.push("rain");
  if ((w.snowIn != null && w.snowIn > 0) || snowWord) flags.push("snow");
  if (w.tempF != null && w.tempF <= 25) flags.push("cold");
  return flags;
}
// api.weather.gov hourly forecast for one stadium (US only; no gusts or amounts in this product, so those stay null).
// The point lookup gives the forecast address: only an api.weather.gov address is accepted.
function nwsHourlyUrl(point) {
  const u = point && point.properties && point.properties.forecastHourly;
  if (typeof u !== "string" || !/^https:\/\/api\.weather\.gov\/gridpoints\/[A-Z]{3}\/\d{1,3},\d{1,3}\/forecast\/hourly$/.test(u)) throw new Error("no hourly forecast address for this point");
  return u;
}
function normalizeNws(json, t) {
  const periods = json && json.properties && Array.isArray(json.properties.periods) ? json.properties.periods : null;
  if (!periods) throw new Error("no forecast periods");
  const want = Date.parse(t.kickoff); let best = null, gap = Infinity;
  for (const p of periods) { const d = Math.abs(Date.parse(p && p.startTime) - want); if (d < gap) { gap = d; best = p; } }
  if (!best || gap > 2 * 3600000) return null;
  const n = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);
  let tempF = n(best.temperature);
  if (tempF != null && best.temperatureUnit === "C") tempF = Math.round((tempF * 9 / 5 + 32) * 10) / 10;
  // "10 mph" or "10 to 15 mph": the higher figure, so a flag is not missed
  const speeds = /mph/i.test(String(best.windSpeed || "")) ? (String(best.windSpeed).match(/\d+(\.\d+)?/g) || []).map(Number) : [];
  const pop = best.probabilityOfPrecipitation && n(best.probabilityOfPrecipitation.value);
  const text = typeof best.shortForecast === "string" ? best.shortForecast.slice(0, 60) : "";
  const w = { source: "nws", tempF, windMph: speeds.length ? Math.max(...speeds) : null, gustMph: null, precipProb: pop == null ? null : pop, precipIn: null, snowIn: null,
    summary: t.roof === "retractable" ? "Retractable roof: may be closed" : null, flags: [] };
  w.flags = weatherFlags(w, /snow|flurr|blizzard/i.test(text));
  return w;
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
    w.flags = weatherFlags(w, false);
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

module.exports = { URLS, normalizeGames, normalizeInjuries, normalizeWeather, normalizeNws, nwsHourlyUrl, weatherFlags, weatherTargets, weatherUrl, normalizeRss, normalizeCurated, readCurated };
