// Writes synthetic fixtures for the /api/universe and /api/game contracts. Matchups are real schedule facts;
// every score, line, injury, transaction and headline is invented and labelled as a fixture. Nothing here is
// copied from any provider (DEC-006). Run: node test/fixtures/make-fixtures.js
"use strict";
const fs = require("fs"), path = require("path");
const GEN = "2026-11-22T19:30:00Z";
const ago = (min) => new Date(Date.parse(GEN) - min * 60000).toISOString();
const ahead = (min) => new Date(Date.parse(GEN) + min * 60000).toISOString();
const url = (n) => "https://example.com/fixture/" + n;

function src(id, label, tier, scope, status = "ok", ageSec = 40) {
  const down = status === "down";
  return { id, label, tier, scope, status, breaker: down ? "open" : "closed", lastOk: down ? null : ago(ageSec / 60),
    lastError: down ? "timeout after 8000 ms" : status === "stale" ? "answered 503" : null, ageSec: down ? null : ageSec,
    latencyMs: down ? 8000 : 90, fails: down ? 3 : status === "stale" ? 1 : 0, records: down ? 0 : 10, maxStaleSec: 900 };
}
const sources = {
  "nflverse-games": src("nflverse-games", "nflverse schedule and lines", 2, "public", "ok", 6 * 3600),
  "nflverse-injuries": src("nflverse-injuries", "nflverse injury report", 2, "public", "ok", 7 * 3600),
  "open-meteo": src("open-meteo", "Open-Meteo forecast", 2, "public", "ok", 1500),
  "rss-yahoo": src("rss-yahoo", "Yahoo Sports NFL RSS", 2, "public", "ok", 300),
  "rss-espn": src("rss-espn", "ESPN NFL RSS", 2, "public", "stale", 5400),
  "curated-news": src("curated-news", "Curated news (data/news.json)", 2, "public", "ok", 9 * 3600),
  "espn-scoreboard": src("espn-scoreboard", "ESPN scoreboard (local only)", 2, "local", "ok", 15),
  "espn-injuries": src("espn-injuries", "ESPN injuries (local only)", 2, "local", "ok", 600),
  "espn-transactions": src("espn-transactions", "ESPN transactions (local only)", 2, "local", "down"),
  "espn-news": src("espn-news", "ESPN news (local only)", 2, "local", "ok", 240),
};

function game(id, away, home, kickoffMin, extra) {
  return Object.assign({ id, gid: "2026_12_" + away + "_" + home, week: 12, kickoff: ahead(kickoffMin), away, home, state: "pre", period: 0, clock: "0:00",
    awayScore: 0, homeScore: 0, situation: null, venue: { name: "Fixture Stadium", city: "Fixture City", indoor: false, neutral: false },
    broadcast: null, odds: null, weather: null, winProb: null, source: "nflverse-games" }, extra);
}
const odds = (source, provider, so, sc, to, tc, hp0, hp1) => ({ source, provider, spread: { open: so, current: sc }, total: { open: to, current: tc },
  homeML: { open: null, current: null }, awayML: { open: null, current: null }, homeProb: { open: hp0, current: hp1 } });
const wx = (source, tempF, windMph, gustMph, precipProb, flags) => ({ source, tempF, windMph, gustMph, precipProb, precipIn: precipProb > 50 ? 0.12 : 0, snowIn: 0, summary: null, flags });

const games = [
  game("fx-1", "MIA", "BUF", -90, { state: "in", period: 3, clock: "8:03", awayScore: 10, homeScore: 17, source: "espn-scoreboard",
    situation: { possession: "MIA", down: 2, distance: 7, yardLine: 35, text: "2nd & 7 at BUF 35", redZone: false, awayTimeouts: 2, homeTimeouts: 3 },
    winProb: { home: 0.78, source: "espn-scoreboard" }, odds: odds("espn-scoreboard", "Sportsbook (fixture)", -14.5, -16.5, 45.5, 44.5, 0.86, 0.89),
    weather: wx("open-meteo", 38, 18, 29, 20, ["wind"]) }),
  game("fx-2", "NO", "CHI", -200, { state: "post", period: 4, clock: "0:00", awayScore: 13, homeScore: 27, source: "espn-scoreboard",
    odds: odds("nflverse-games", "nflverse (one book)", null, -11.5, null, 48.5, null, 0.83), weather: wx("open-meteo", 51, 9, 15, 70, ["rain"]) }),
  game("fx-3", "TEN", "DAL", 30, { venue: { name: "Fixture Dome", city: "Fixture City", indoor: true, neutral: false },
    odds: odds("nflverse-games", "nflverse (one book)", null, -7.5, null, 54.5, null, 0.71) }),
  game("fx-4", "JAX", "NYG", 210, { odds: odds("nflverse-games", "nflverse (one book)", null, 6, null, 46.5, null, 0.31), weather: wx("open-meteo", 47, 11, 19, 75, ["rain"]) }),
  game("fx-5", "MIN", "SF", 420, { venue: { name: "Fixture Neutral Site", city: "Mexico City", indoor: false, neutral: true }, odds: odds("nflverse-games", "nflverse (one book)", null, -3, null, 46.5, null, 0.58), weather: wx("open-meteo", 64, 6, 10, 5, []) }),
  game("fx-6", "CIN", "WAS", 1500, { odds: odds("nflverse-games", "nflverse (one book)", null, 6, null, 53.5, null, 0.33), weather: wx("open-meteo", 31, 7, 12, 10, []) }),
];

let n = 0;
function ev(type, subtype, minAgo, teams, title, source, publisher, importance, confidence, extra) {
  n++;
  return Object.assign({ id: "fx-ev-" + n, type, subtype, ts: ago(minAgo), seenAt: ago(Math.max(0, minAgo - 2)), teams, players: [], title,
    url: null, source, publisher, importance, confidence, sourceCount: 1, sources: [{ publisher, url: null }], gameId: null, data: {} }, extra);
}
const events = [
  ev("injury", "Out", 50, ["NYG"], "Fixture QB One (QB) listed Out", "espn-injuries", "ESPN", 96, 0.85, { players: [{ name: "Fixture QB One", pos: "QB" }], data: { status: "Out", starter: true } }),
  ev("news", null, 55, ["NYG"], "Fixture headline: Giants starting quarterback ruled out for Sunday", "rss-yahoo", "Yahoo Sports", 88, 0.89,
    { url: url(1), sourceCount: 2, sources: [{ publisher: "Yahoo Sports", url: url(1) }, { publisher: "ESPN", url: url(2) }] }),
  ev("odds_move", "spread", 40, ["MIA", "BUF"], "MIA at BUF: home spread moved -14.5 to -16.5", "espn-scoreboard", "Sportsbook via ESPN", 55, 0.9, { gameId: "fx-1", data: { open: -14.5, current: -16.5 } }),
  ev("weather", "wind", 25, ["MIA", "BUF"], "MIA at BUF: wind 18 mph, gusts 29 mph at kickoff", "open-meteo", "Open-Meteo", 40, 0.8, { gameId: "fx-1", data: { windMph: 18, gustMph: 29 } }),
  ev("game", "final", 20, ["NO", "CHI"], "Final: NO 13, CHI 27", "espn-scoreboard", "ESPN", 45, 0.99, { gameId: "fx-2" }),
  ev("game", "score", 6, ["MIA", "BUF"], "BUF touchdown: MIA 10, BUF 17 (3rd quarter)", "espn-scoreboard", "ESPN", 35, 0.99, { gameId: "fx-1" }),
  ev("transaction", "signed", 300, ["PHI"], "Fixture: signed WR Fixture Receiver to the practice squad", "espn-transactions", "ESPN", 15, 0.95, { data: { kind: "signed" } }),
  ev("transaction", "placed_ir", 420, ["DET"], "Fixture: placed DE Fixture Edge on injured reserve", "espn-transactions", "ESPN", 38, 0.95, { data: { kind: "placed_ir" } }),
  ev("injury", "Questionable", 600, ["KC"], "Fixture Tackle (T) listed Questionable", "nflverse-injuries", "nflverse", 16, 0.8, { players: [{ name: "Fixture Tackle", pos: "T" }], data: { status: "Questionable", starter: null } }),
  ev("qb_change", null, 1440, ["IND"], "Fixture: Colts name a new starting quarterback", "curated-news", "Fixture Publisher", 80, 0.85, { url: url(3), sources: [{ publisher: "Fixture Publisher", url: url(3) }] }),
  ev("news", null, 90, [], "Fixture headline: league announces schedule note", "rss-espn", "ESPN", 12, 0.85, { url: url(4), sources: [{ publisher: "ESPN", url: url(4) }] }),
  ev("news", null, 3000, ["SEA"], "Fixture headline: Seahawks activate linebacker from injured reserve", "rss-yahoo", "Yahoo Sports", 30, 0.85, { url: url(5), sources: [{ publisher: "Yahoo Sports", url: url(5) }] }),
  ev("news", null, 20000, ["DAL"], "Fixture headline: Cowboys open practice window for receiver", "espn-news", "ESPN", 22, 0.85, { url: url(6), sources: [{ publisher: "ESPN", url: url(6) }] }),
].sort((a, b) => Date.parse(b.ts) - Date.parse(a.ts));

const injuries = {
  NYG: { burden: 1.42, out: 2, doubtful: 0, questionable: 1, ir: 1, qbOut: true, players: [
    { name: "Fixture QB One", pos: "QB", status: "Out", type: "Ankle", returnDate: null, date: ago(50), espnId: null, starter: true, source: "espn-injuries" },
    { name: "Fixture Corner", pos: "CB", status: "Out", type: "Hamstring", returnDate: null, date: ago(900), espnId: null, starter: true, source: "espn-injuries" },
    { name: "Fixture Guard", pos: "G", status: "Questionable", type: "Knee", returnDate: null, date: ago(900), espnId: null, starter: false, source: "espn-injuries" },
    { name: "Fixture Back", pos: "RB", status: "Injured Reserve", type: "Foot", returnDate: null, date: ago(9000), espnId: null, starter: null, source: "nflverse-injuries" }] },
  KC: { burden: 0.11, out: 0, doubtful: 0, questionable: 1, ir: 0, qbOut: false, players: [
    { name: "Fixture Tackle", pos: "T", status: "Questionable", type: "Shoulder", returnDate: null, date: ago(600), espnId: null, starter: null, source: "nflverse-injuries" }] },
};
const transactions = [
  { date: ago(300), team: "PHI", text: "Fixture: signed WR Fixture Receiver to the practice squad", kind: "signed", source: "espn-transactions" },
  { date: ago(420), team: "DET", text: "Fixture: placed DE Fixture Edge on injured reserve", kind: "placed_ir", source: "espn-transactions" },
];
// media: real official channel ids (public facts), invented videos and episodes
sources["youtube-official"] = src("youtube-official", "Official NFL and team YouTube channels", 1, "public", "ok", 900);
sources["podcasts-nfl"] = src("podcasts-nfl", "Official NFL podcasts", 1, "public", "ok", 3 * 3600);
const ch = (team, name, channelId) => ({ team, name, channelId, url: "https://www.youtube.com/channel/" + channelId, liveUrl: "https://www.youtube.com/channel/" + channelId + "/live" });
const channels = [ch(null, "NFL", "UCDVYQ4Zhbm3S2dlz7P1GBDg"), ch("BUF", "Buffalo Bills", "UCcEvCxUe2Sm5W6MliEUv0vg"), ch("KC", "Kansas City Chiefs", "UC-hXefb6XBFSubWz6Ezf_lA")];
const vid = (n, channel, team, teams, kind, title, minAgo) => {
  const videoId = "fxVideo" + String(n).padStart(4, "0");
  return { id: "yt-" + videoId, videoId, channelId: channel.channelId, channel: channel.name, team, teams, kind, title, published: ago(minAgo),
    url: "https://www.youtube.com/watch?v=" + videoId, embedUrl: "https://www.youtube-nocookie.com/embed/" + videoId, thumb: "https://i.ytimg.com/vi/" + videoId + "/mqdefault.jpg", source: "youtube-official" };
};
const media = {
  channels,
  videos: [
    vid(1, channels[1], "BUF", ["BUF", "MIA"], "press", "Fixture: Bills head coach press conference before Dolphins game", 120),
    vid(2, channels[0], null, ["MIA", "BUF"], "highlights", "Fixture: Dolphins vs. Bills highlights | Week 12", 30),
    vid(3, channels[2], "KC", ["KC"], "short", "Fixture: practice clip #shorts", 400),
    vid(4, channels[0], null, [], "preview", "Fixture: full week 12 game previews", 1500),
    vid(5, channels[2], "KC", ["KC"], "video", "Fixture: Chiefs locker room after the win", 2900),
  ],
  podcasts: [
    // real address shape (NFL Omny account, measurement redirect), invented show and episode ids
    { id: "pod-1", show: "Fixture Daily (NFL)", title: "Fixture: Week 12 preview episode", published: ago(300), url: "https://omny.fm/shows/fixture-daily/fixture-week-12-preview",
      audioUrl: "https://podtrac.com/pts/redirect.mp3/traffic.omny.fm/d/clips/e73c998e-6e60-432f-8610-ae210140c5b1/00000000-0000-4000-8000-000000000001/00000000-0000-4000-8000-0000000000a1/audio.mp3?utm_source=Podcast",
      durationSec: 1800, teams: [], source: "podcasts-nfl" },
    { id: "pod-2", show: "Fixture Morning Show (NFL)", title: "Fixture: Giants quarterback news", published: ago(900), url: null,
      audioUrl: "https://traffic.omny.fm/d/clips/e73c998e-6e60-432f-8610-ae210140c5b1/00000000-0000-4000-8000-000000000002/00000000-0000-4000-8000-0000000000a2/audio.mp3",
      durationSec: null, teams: ["NYG"], source: "podcasts-nfl" },
  ],
};
const note = "Synthetic fixture: real matchups, invented data. For development and tests only.";
const full = { v: 1, _fixture: note, generatedAt: GEN, season: 2026, week: 12, seasonType: "regular", sources, games, events, injuries, transactions, media };

// Public variant: what a committed snapshot may contain (public sources only, no live state).
const pubSources = Object.fromEntries(Object.entries(sources).filter(([, s]) => s.scope === "public"));
const pub = { v: 1, _fixture: note + " Public-only variant.", generatedAt: GEN, season: 2026, week: 12, seasonType: "regular", sources: pubSources,
  games: games.map((g) => Object.assign({}, g, { state: g.state === "post" ? "post" : "pre", period: 0, clock: "0:00", situation: null, winProb: null, source: "nflverse-games",
    odds: g.odds && pubSources[g.odds.source] ? g.odds : null, awayScore: g.state === "post" ? g.awayScore : 0, homeScore: g.state === "post" ? g.homeScore : 0 })),
  events: events.filter((e) => pubSources[e.source]),
  injuries: Object.fromEntries(Object.entries(injuries).map(([a, t]) => [a, Object.assign({}, t, { players: t.players.filter((p) => pubSources[p.source]) })]).filter(([, t]) => t.players.length)),
  transactions: [], media };

const detail = { v: 1, id: "fx-1", generatedAt: GEN, source: "espn-scoreboard", scope: "local", _fixture: note,
  header: { away: "MIA", home: "BUF", state: "in", period: 3, clock: "8:03", awayScore: 10, homeScore: 17 },
  winProb: [0.86, 0.84, 0.88, 0.8, 0.83, 0.9, 0.86, 0.79, 0.82, 0.78].map((home, k) => ({ play: k + 1, home })),
  scoring: [
    { period: 1, clock: "9:12", team: "BUF", text: "Fixture: 34-yard field goal", awayScore: 0, homeScore: 3 },
    { period: 2, clock: "4:40", team: "MIA", text: "Fixture: 12-yard touchdown pass", awayScore: 7, homeScore: 3 },
    { period: 2, clock: "0:05", team: "BUF", text: "Fixture: 1-yard touchdown run", awayScore: 7, homeScore: 10 },
    { period: 3, clock: "12:20", team: "MIA", text: "Fixture: 41-yard field goal", awayScore: 10, homeScore: 10 },
    { period: 3, clock: "9:01", team: "BUF", text: "Fixture: 22-yard touchdown pass", awayScore: 10, homeScore: 17 }],
  plays: [{ period: 3, clock: "8:40", team: "MIA", text: "Fixture: pass short right for 6 yards", type: "Pass" }, { period: 3, clock: "8:03", team: "MIA", text: "Fixture: run up the middle for 3 yards", type: "Rush" }],
  injuries: [{ team: "MIA", name: "Fixture Linebacker", pos: "LB", status: "Questionable" }] };

const dir = __dirname;
fs.writeFileSync(path.join(dir, "universe.sample.json"), JSON.stringify(full, null, 1));
fs.writeFileSync(path.join(dir, "universe.public.json"), JSON.stringify(pub, null, 1));
fs.writeFileSync(path.join(dir, "game.sample.json"), JSON.stringify(detail, null, 1));
console.log("fixtures written:", games.length, "games,", events.length, "events;", pub.events.length, "public events");
