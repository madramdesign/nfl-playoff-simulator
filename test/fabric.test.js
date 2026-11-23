// Data fabric tests: normalizers on synthetic payloads, entity resolution, scoring, the circuit breaker, and the whole
// fabric with fake sources, including failures. No network. Run: node test/fabric.test.js (also run by test/run.js).
"use strict";
const assert = require("assert");
const path = require("path");
const root = path.join(__dirname, "..");
const C = require(path.join(root, "lib/contract.js"));
const ent = require(path.join(root, "lib/fabric/entities.js"));
const score = require(path.join(root, "lib/fabric/score.js"));
const util = require(path.join(root, "lib/fabric/util.js"));
const pub = require(path.join(root, "lib/fabric/adapters/public.js"));
const espn = require(path.join(root, "lib/fabric/adapters/espn.js"));
const { createSource, fetchWithRetry } = require(path.join(root, "lib/fabric/source.js"));
const { createFabric } = require(path.join(root, "lib/fabric"));
const media = require(path.join(root, "lib/fabric/adapters/media.js"));
const T = ent.ABBRS;
const tests = [];
const test = (name, fn) => tests.push([name, fn]);

// ---------- synthetic provider payloads (invented values, real shapes) ----------
const GAMES_CSV = [
  "game_id,season,game_type,week,gameday,gametime,away_team,away_score,home_team,home_score,location,espn,away_moneyline,home_moneyline,spread_line,total_line,roof,stadium,away_qb_name,home_qb_name",
  "2026_09_TB_CAR,2026,REG,9,2026-11-01,13:00,TB,,CAR,,Home,,,,,,outdoors,Bank of America Stadium,,",
  "2026_10_DAL_NYG,2026,REG,10,2026-11-15,13:00,DAL,20,NYG,24,Home,900000010,,,,,outdoors,MetLife Stadium,Dallas Starter,Fixture Passer",
  "2026_11_IND_HOU,2026,REG,11,2026-11-19,20:15,IND,3,HOU,26,Home,900000001,500,-700,12.5,44.5,closed,NRG Stadium,,",
  "2026_11_MIA_BUF,2026,REG,11,2026-11-22,13:00,MIA,,BUF,,Home,900000002,600,-850,14.5,44.5,outdoors,Highmark Stadium,,",
  "2026_11_MIN_SF,2026,REG,11,2026-11-22,20:20,MIN,,SF,,Neutral,900000003,120,-140,3,46.5,outdoors,Estadio Banorte,,",
  "2026_11_JAX_NYG,2026,REG,11,2026-11-22,16:25,JAX,,NYG,,Home,900000004,-250,210,-6,46.5,,MetLife Stadium,,",
  "2026_12_NYG_IND,2026,REG,12,2026-11-29,13:00,NYG,,IND,,Home,900000005,,,,,,Lucas Oil Stadium,,",
  "2025_11_NYG_CHI,2025,REG,11,2025-11-16,13:00,NYG,20,CHI,24,Home,,,,,,,Soldier Field,,",
].join("\n");
const INJ_CSV = [
  "season,game_type,team,week,position,full_name,report_primary_injury,report_status,practice_status",
  "2026,REG,NYG,11,QB,Fixture Passer,Ankle,Out,Did Not Participate In Practice",
  "2026,REG,NYG,11,CB,Fixture Corner,Hamstring,Questionable,Limited Participation in Practice",
  "2026,REG,NYG,11,WR,Gabriel Fixture,Toe,Out,Did Not Participate In Practice",
  "2026,REG,NYG,11,QB,Backup Passer,Shoulder,Out,Did Not Participate In Practice",
  "2026,REG,LA,11,WR,Fixture Wideout,Knee,Doubtful,Did Not Participate In Practice",
  "2026,REG,NYG,10,RB,Old Week Back,Foot,Out,",
  "2026,REG,KC,11,T,Fixture Tackle,Shoulder,,Full Participation in Practice",
].join("\n");
const RSS = '<?xml version="1.0"?><rss version="2.0"><channel><title>x</title>' +
  '<item><title><![CDATA[Giants QB ruled out for Sunday &amp; more]]></title><link>https://example.com/a</link><pubDate>Sat, 21 Nov 2026 07:47:52 EST</pubDate></item>' +
  '<item><title>Fantasy rankings for Week 11</title><link>https://example.com/b</link></item>' +
  '<item><title>No link item</title></item><item><title>Insecure link</title><link>http://example.com/c</link></item></channel></rss>';
const SB = { week: { number: 11 }, events: [
  { id: "900000002", date: "2026-11-22T18:00Z", competitions: [{ status: { period: 3, displayClock: "8:03", type: { state: "in" } }, neutralSite: false,
    venue: { fullName: "Highmark Stadium", address: { city: "Orchard Park" }, indoor: false }, broadcasts: [{ names: ["CBS"] }],
    situation: { possession: "15", down: 2, distance: 7, yardLine: 35, downDistanceText: "2nd & 7 at BUF 35", isRedZone: false, homeTimeouts: 3, awayTimeouts: 2, lastPlay: { probability: { homeWinPercentage: 0.81 } } },
    competitors: [{ homeAway: "home", score: "17", team: { abbreviation: "BUF" } }, { homeAway: "away", score: "10", team: { abbreviation: "MIA" } }],
    odds: [{ provider: { name: "Book" }, moneyline: { home: { open: { odds: "-600" }, close: { odds: "-900" } }, away: { open: { odds: "+450" }, close: { odds: "+600" } } },
      pointSpread: { home: { open: { line: "-11.5" }, close: { line: "-16.5" } } }, total: { over: { open: { line: "o45.5" }, close: { line: "o44.5" } } } }] }] },
  { id: "900000099", date: "2026-11-24T01:15Z", competitions: [{ status: { period: 0, displayClock: "0:00", type: { state: "pre" } },
    competitors: [{ homeAway: "home", score: "0", team: { abbreviation: "WSH" } }, { homeAway: "away", score: "0", team: { abbreviation: "CIN" } }],
    odds: [{ provider: { name: "Book" }, moneyline: { home: { open: { odds: "+150" }, close: { odds: "+220" } }, away: { open: { odds: "-170" }, close: { odds: "-260" } } },
      pointSpread: { home: { open: { line: "+3.5" }, close: { line: "+6" } } }, total: { over: { open: { line: "o52.5" }, close: { line: "o53.5" } } } }] }] },
  { id: "bad", competitions: [{ competitors: [{ homeAway: "home", team: { abbreviation: "XXX" } }, { homeAway: "away", team: { abbreviation: "NYG" } }] }] },
] };
const NEWS = { articles: [
  { headline: "Giants starting QB ruled out vs. Jaguars", published: "2026-11-21T15:00:00Z", links: { web: { href: "https://example.com/n1" } }, categories: [{ type: "team", teamId: 19 }] },
  { headline: "No link", published: "2026-11-21T15:00:00Z" }] };
const ESPN_INJ = { injuries: [{ id: "19", injuries: [
  { status: "Out", date: "2026-11-21T01:38Z", athlete: { displayName: "Fixture Passer", position: { abbreviation: "QB" }, links: [{ href: "https://www.espn.com/nfl/player/_/id/123/x" }] }, details: { type: "Ankle" } },
  { status: "Injured Reserve", date: "2026-11-20T01:38Z", athlete: { displayName: "Fixture Corner", position: { abbreviation: "CB" } }, details: {} },
  { status: "Out", date: "2026-11-20T01:38Z", athlete: { displayName: "Gabe Fixture", position: { abbreviation: "WR" } }, details: {} },
  { status: "Active", athlete: { displayName: "Healthy Player" } }] }] };
const TX = { transactions: [{ date: "2026-11-20T08:00Z", description: "Placed QB Fixture Passer on injured reserve.", team: { id: "19" } }, { date: "2026-11-20T08:00Z", description: "Waived RB Nobody.", team: { id: "999" } }] };
const SUMMARY = { header: { competitions: [{ status: { period: 3, displayClock: "8:03", type: { state: "in" } }, competitors: [{ homeAway: "home", score: "17", team: { abbreviation: "BUF" } }, { homeAway: "away", score: "10", team: { abbreviation: "MIA" } }] }] },
  winprobability: [{ homeWinPercentage: 0.8 }, { homeWinPercentage: 0.84 }, { homeWinPercentage: 7 }],
  scoringPlays: [{ period: { number: 1 }, clock: { displayValue: "9:12" }, team: { abbreviation: "BUF" }, text: "Field goal", awayScore: 0, homeScore: 3 }],
  drives: { previous: [{ plays: [{ period: { number: 3 }, clock: { displayValue: "8:40" }, text: "Pass for 6", type: { text: "Pass" } }] }] },
  injuries: [{ team: { abbreviation: "MIA" }, injuries: [{ athlete: { displayName: "X", position: { abbreviation: "LB" } }, status: "Questionable" }] }] };
const YT_ATOM = (author, ids) => '<?xml version="1.0"?><feed xmlns:yt="http://www.youtube.com/xml/schemas/2015"><author><name>' + author + '</name></author>' +
  ids.map(([id, title, when, short]) => '<entry><yt:videoId>' + id + '</yt:videoId><title>' + title + '</title><link rel="alternate" href="https://www.youtube.com/' + (short ? "shorts/" : "watch?v=") + id + '"/><published>' + when + '</published></entry>').join("") + '</feed>';
const YT_NFL = YT_ATOM("NFL", [["aaaaaaaaaa1", "Dolphins vs. Bills Highlights | Week 11", "2026-11-21T15:00:00+00:00"], ["aaaaaaaaaa2", "Week 11 game previews", "2026-11-20T15:00:00+00:00"], ["bad id", "Broken entry", "2026-11-20T15:00:00+00:00"]]);
const YT_TEAM = YT_ATOM("Buffalo Bills", [["bbbbbbbbbb1", "Sean McDermott Press Conference | Dolphins Week", "2026-11-21T14:00:00+00:00"], ["bbbbbbbbbb2", "Practice sights &amp; sounds", "2026-11-21T13:00:00+00:00", true], ["aaaaaaaaaa1", "Dolphins vs. Bills Highlights | Week 11", "2026-11-21T15:00:00+00:00"]]);
const POD = (show, n) => '<?xml version="1.0"?><rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"><channel><title>' + show + '</title>' +
  Array.from({ length: n }, (_, k) => '<item><title>Episode ' + k + ': Giants and Jets news</title><link>https://example.com/ep' + k + '</link><pubDate>Sat, 21 Nov 2026 0' + (k % 10) + ':00:00 +0000</pubDate>' +
    '<enclosure url="https://podtrac.com/pts/redirect.mp3/traffic.omny.fm/d/clips/e73c998e-6e60-432f-8610-ae210140c5b1/00000000-0000-4000-8000-00000000000' + (k % 2) + '/00000000-0000-4000-8000-0000000000' + String(10 + k).padStart(2, "0") + '/audio.mp3?utm_source=Podcast" type="audio/mpeg"/><itunes:duration>' + (k ? "00:30:00" : "1800") + '</itunes:duration><guid>g' + k + '</guid></item>').join("") +
  '<item><title>Insecure</title><pubDate>Sat, 21 Nov 2026 00:00:00 +0000</pubDate><enclosure url="http://example.com/x.mp3"/></item>' +
  '<item><title>Not the NFL account</title><pubDate>Sat, 21 Nov 2026 00:00:00 +0000</pubDate><enclosure url="https://traffic.omny.fm/d/clips/00000000-0000-0000-0000-000000000000/00000000-0000-4000-8000-000000000000/00000000-0000-4000-8000-0000000000ff/audio.mp3"/></item></channel></rss>';
const meteo = (n, windMph) => Array.from({ length: n }, () => ({ hourly: { time: Array.from({ length: 216 }, (_, h) => new Date(Date.UTC(2026, 10, 21) + h * 3600000).toISOString().slice(0, 16)),
  temperature_2m: Array(216).fill(40), wind_speed_10m: Array(216).fill(windMph), wind_gusts_10m: Array(216).fill(windMph + 8), precipitation_probability: Array(216).fill(70),
  precipitation: Array(216).fill(0.1), snowfall: Array(216).fill(0) } }));

// ---------- entities ----------
test("provider abbreviations resolve to the page's", () => {
  assert.strictEqual(ent.teamAbbr("WSH"), "WAS"); assert.strictEqual(ent.teamAbbr("LA"), "LAR"); assert.strictEqual(ent.teamAbbr("JAC"), "JAX");
  assert.strictEqual(ent.teamAbbr("espn:28"), "WAS"); assert.strictEqual(ent.teamByEspnId("19"), "NYG"); assert.strictEqual(ent.teamAbbr("XXX"), null);
  assert.strictEqual(new Set(ent.TEAMS.map((t) => t.espnId)).size, 32, "32 distinct ESPN ids");
});
test("headline matching finds teams and skips shared city names", () => {
  assert.deepStrictEqual(ent.teamsInText("New York Giants beat the Jets").sort(), ["NYG", "NYJ"]);
  assert.deepStrictEqual(ent.teamsInText("New York weather delays practice"), []);
  assert.deepStrictEqual(ent.teamsInText("Bills-Dolphins preview").sort(), ["BUF", "MIA"]);
  assert.ok(!ent.teamsInText("Ramsey signs").includes("LAR"), "whole words only");
});

// ---------- parsing ----------
test("Eastern kickoff times convert with daylight saving", () => {
  assert.strictEqual(util.easternToIso("2026-11-22", "13:00"), "2026-11-22T18:00:00.000Z");
  assert.strictEqual(util.easternToIso("2026-09-13", "13:00"), "2026-09-13T17:00:00.000Z");
});
test("CSV parser handles quotes, commas and blank lines", () => {
  const r = util.parseCsv('a,b\n"x, y","he said ""hi"""\n\n1,2\n');
  assert.deepStrictEqual(r, [{ a: "x, y", b: 'he said "hi"' }, { a: "1", b: "2" }]);
});
test("RSS keeps unmodified headlines with https links only", () => {
  const items = pub.normalizeRss(RSS, "rss-yahoo", "Yahoo Sports");
  assert.strictEqual(items.length, 2);
  assert.strictEqual(items[0].title, "Giants QB ruled out for Sunday & more");
  assert.deepStrictEqual(items[0].teams, ["NYG"]);
  assert.strictEqual(items[0].ts, "2026-11-21T12:47:52.000Z");
  assert.strictEqual(items[1].ts, null);
  assert.throws(() => pub.normalizeRss("<html>not a feed</html>", "rss-yahoo", "Y"), /not an RSS/);
});

// ---------- public adapters ----------
test("nflverse games: current week, kickoff in UTC, home-side spread, no-vig chance", () => {
  const g = pub.normalizeGames(GAMES_CSV, 2026, Date.parse("2026-11-21T16:00:00Z"));
  assert.strictEqual(g.week, 11, "an old unscored game does not pin the week"); assert.strictEqual(g.games.length, 4);
  assert.strictEqual(g.starters.NYG, "Fixture Passer", "last starting quarterback recorded");
  const buf = g.games.find((x) => x.home === "BUF");
  assert.strictEqual(buf.id, "900000002"); assert.strictEqual(buf.kickoff, "2026-11-22T18:00:00.000Z");
  assert.strictEqual(buf.odds.spread.current, -14.5, "nflverse +14.5 (home favored) becomes -14.5");
  assert.ok(buf.odds.homeProb.current > 0.85 && buf.odds.homeProb.current < 0.9);
  assert.strictEqual(g.games.find((x) => x.home === "HOU").state, "post");
  assert.strictEqual(g.games.find((x) => x.home === "HOU").venue.indoor, true);
  assert.strictEqual(g.games.find((x) => x.home === "SF").venue.neutral, true);
  assert.strictEqual(g.games.find((x) => x.home === "NYG").venue.indoor, false, "blank roof falls back to the stadium's");
});
test("nflverse injuries: latest week, game status only", () => {
  const r = pub.normalizeInjuries(INJ_CSV, 2026);
  assert.strictEqual(r.week, 11); assert.deepStrictEqual(Object.keys(r.teams).sort(), ["LAR", "NYG"]);
  assert.strictEqual(r.teams.NYG.length, 4);
});
test("weather picks the kickoff hour and flags wind and rain", () => {
  const games = pub.normalizeGames(GAMES_CSV, 2026, Date.parse("2026-11-21T16:00:00Z")).games;
  const targets = pub.weatherTargets(games, Date.parse("2026-11-21T12:00:00Z"));
  assert.ok(targets.length >= 2 && !targets.some((t) => t.id === "900000001"), "indoor and finished games skipped");
  assert.ok(targets.some((t) => t.id === "900000003"), "neutral site located from teams.json");
  const w = pub.normalizeWeather(meteo(targets.length, 16), targets);
  const any = w[targets[0].id]; assert.deepStrictEqual(any.flags, ["wind", "rain"]); assert.strictEqual(any.source, "open-meteo");
  assert.throws(() => pub.normalizeWeather(meteo(1, 5), targets), /expected/);
});
const NWS_POINT = { properties: { forecastHourly: "https://api.weather.gov/gridpoints/OKX/30,46/forecast/hourly" } };
const nwsHourly = (kickoff, over = {}) => ({ properties: { periods: [-2, -1, 0, 1, 2].map((h) => Object.assign({ startTime: new Date(Date.parse(kickoff) + h * 3600000).toISOString().replace(".000Z", "+00:00"),
  temperature: 40 + h, temperatureUnit: "F", windSpeed: "5 mph", probabilityOfPrecipitation: { value: 10 }, shortForecast: "Sunny" }, h === 0 ? over : {})) } });
test("National Weather Service forecast: kickoff hour, wind ranges, snow wording, bad shapes", () => {
  const t = { id: "g1", kickoff: "2026-11-29T18:00:00Z", roof: "outdoors" };
  let w = pub.normalizeNws(nwsHourly(t.kickoff, { temperature: 20, windSpeed: "10 to 20 mph", probabilityOfPrecipitation: { value: 70 }, shortForecast: "Snow Showers Likely" }), t);
  assert.strictEqual(w.source, "nws"); assert.strictEqual(w.tempF, 20); assert.strictEqual(w.windMph, 20, "the higher figure of a range");
  assert.deepStrictEqual(w.flags, ["wind", "rain", "snow", "cold"]); assert.strictEqual(w.gustMph, null); assert.strictEqual(w.snowIn, null, "no amounts are invented");
  w = pub.normalizeNws(nwsHourly(t.kickoff, { temperature: 0, temperatureUnit: "C", windSpeed: "", probabilityOfPrecipitation: { value: null } }), t);
  assert.strictEqual(w.tempF, 32); assert.strictEqual(w.windMph, null); assert.strictEqual(w.precipProb, null); assert.deepStrictEqual(w.flags, []);
  assert.strictEqual(pub.normalizeNws(nwsHourly("2026-12-20T18:00:00Z"), t), null, "no forecast hour near kickoff means no forecast");
  assert.strictEqual(pub.normalizeNws(nwsHourly(t.kickoff), Object.assign({}, t, { roof: "retractable" })).summary, "Retractable roof: may be closed");
  assert.throws(() => pub.normalizeNws({ properties: {} }, t), /no forecast periods/);
  assert.strictEqual(pub.nwsHourlyUrl(NWS_POINT), NWS_POINT.properties.forecastHourly);
  assert.throws(() => pub.nwsHourlyUrl({ properties: { forecastHourly: "https://evil.example/gridpoints/OKX/30,46/forecast/hourly" } }), /no hourly forecast address/, "only an api.weather.gov address is followed");
  assert.throws(() => pub.nwsHourlyUrl({}), /no hourly forecast address/);
});

// ---------- ESPN adapters (local scope) ----------
test("ESPN scoreboard: live state, possession, open and current lines", () => {
  const s = espn.normalizeScoreboard(SB);
  assert.strictEqual(s.games.length, 2, "unknown team skipped");
  const g = s.games[0];
  assert.strictEqual(g.situation.possession, "MIA"); assert.strictEqual(g.winProb.home, 0.81);
  assert.deepStrictEqual(g.odds.spread, { open: -11.5, current: -16.5 }); assert.deepStrictEqual(g.odds.total, { open: 45.5, current: 44.5 });
  assert.ok(g.odds.homeProb.current > g.odds.homeProb.open);
  assert.strictEqual(s.games[1].home, "WAS");
});
test("ESPN news, injuries, transactions and summary", () => {
  const n = espn.normalizeNews(NEWS); assert.strictEqual(n.length, 1); assert.deepStrictEqual(n[0].teams.sort(), ["JAX", "NYG"], "tagged team plus teams named in the headline");
  const i = espn.normalizeInjuries(ESPN_INJ); assert.strictEqual(i.teams.NYG.length, 3, "Active players skipped"); assert.strictEqual(i.teams.NYG[0].espnId, "123");
  const x = espn.normalizeTransactions(TX); assert.strictEqual(x.length, 1); assert.strictEqual(x[0].kind, "placed_ir");
  const d = espn.normalizeSummary(SUMMARY, "900000002", Date.parse("2026-11-22T19:30:00Z"));
  assert.deepStrictEqual(C.validateGameDetail(d, T), []); assert.strictEqual(d.winProb.length, 2, "out-of-range probability dropped");
});

// ---------- scoring ----------
test("noise headlines rank low; quarterback injuries rank high", () => {
  const now = Date.parse("2026-11-21T16:00:00Z"), ts = "2026-11-21T15:00:00Z";
  const qb = score.newsImportance({ title: "Giants QB ruled out with ankle injury", tier: 2, ts, teams: ["NYG"], now });
  const fantasy = score.newsImportance({ title: "Fantasy rankings for Week 11", tier: 2, ts, teams: ["NYG"], now });
  assert.ok(qb >= 70 && fantasy <= 15, qb + " vs " + fantasy);
  assert.ok(score.injuryWeight("Out", "QB", true) > score.injuryWeight("Out", "QB", false));
  assert.ok(score.injuryWeight("Out", "QB", null) > score.injuryWeight("Questionable", "WR", null));
  const real = score.newsImportance({ title: "Giants place Jaxson Dart on injured reserve", tier: 2, ts, teams: ["NYG"], now });
  for (const t of ["Eagles fired up for Cowboys rematch", "Jersey retirement ceremony set for Eagles legend"])
    assert.ok(score.newsImportance({ title: t, tier: 2, ts, teams: ["PHI"], now }) < real, t + " must rank below a real roster move");
  const later = score.newsImportance({ title: "Eagles practice notes", tier: 2, ts: "2026-11-24T15:00:00Z", teams: ["PHI"], now });
  assert.ok(later <= score.newsImportance({ title: "Eagles practice notes", tier: 2, ts: "2026-11-21T16:00:00Z", teams: ["PHI"], now }), "a future date is never extra-recent");
});
test("the same story from two publishers becomes one corroborated item", () => {
  const items = [
    { title: "Giants QB ruled out for Sunday against Jaguars", url: "https://e.com/1", ts: "2026-11-21T15:00:00Z", publisher: "Yahoo Sports", source: "rss-yahoo", tier: 2, teams: ["NYG"] },
    { title: "Giants rule out QB for Sunday vs. Jaguars", url: "https://e.com/2", ts: "2026-11-21T16:00:00Z", publisher: "ESPN", source: "rss-espn", tier: 2, teams: ["NYG"] },
    { title: "Chiefs sign kicker", url: "https://e.com/3", ts: "2026-11-21T16:00:00Z", publisher: "ESPN", source: "rss-espn", tier: 2, teams: ["KC"] }];
  const c = score.clusterNews(items);
  assert.strictEqual(c.length, 2); assert.strictEqual(c.find((x) => x.teams.includes("NYG")).members.length, 2);
  assert.ok(score.confidence(2, 2) > score.confidence(2, 1));
  const two = (a, b) => score.clusterNews([{ title: a, url: "https://e.com/x", ts: "2026-11-21T15:00:00Z", publisher: "P1", source: "rss-yahoo", tier: 2, teams: ["KC"] },
    { title: b, url: "https://e.com/y", ts: "2026-11-21T15:30:00Z", publisher: "P2", source: "rss-espn", tier: 2, teams: ["KC"] }]).length;
  assert.strictEqual(two("Chiefs sign kicker", "Chiefs release kicker"), 2, "opposite actions are different stories");
  assert.strictEqual(two("Giants QB Jaxson Dart ruled out for Sunday", "Giants WR Malik Nabers ruled out for Sunday"), 2, "different players are different stories");
  assert.strictEqual(two("Chiefs sign kicker Harrison Mevis", "Chiefs sign kicker Mevis to active roster"), 1, "same player and action merge");
});

// ---------- source wrapper: breaker, cache, timeout ----------
test("breaker opens after repeated failures, serves the last good data, and recovers", async () => {
  let fail = false, calls = 0, t = 1000000;
  const s = createSource({ id: "x", label: "x", ttlMs: 1000, maxFailures: 3, cooldownMs: 60000, maxStaleSec: 3600, load: async () => { calls++; if (fail) throw new Error("boom"); return [1, 2]; } });
  let r = await s.get({ now: t }); assert.strictEqual(r.mode, "live"); assert.deepStrictEqual(r.data, [1, 2]);
  fail = true;
  for (let k = 1; k <= 3; k++) { t += 2000; r = await s.get({ force: true, now: t }); assert.deepStrictEqual(r.data, [1, 2], "last good data still served"); }
  assert.strictEqual(s.status(t).breaker, "open"); assert.strictEqual(s.status(t).status, "stale");
  const before = calls; t += 2000; r = await s.get({ now: t }); assert.strictEqual(calls, before, "no call while open"); assert.strictEqual(r.mode, "stale");
  fail = false; t += 61000; assert.strictEqual(s.status(t).breaker, "half-open");
  r = await s.get({ now: t }); await new Promise((ok) => setImmediate(ok));
  assert.strictEqual(s.status(t).breaker, "closed", "one good probe closes it"); assert.strictEqual(s.status(t).status, "ok");
});
test("a source that never answered is down, not empty-as-healthy", async () => {
  const s = createSource({ id: "y", label: "y", load: async () => { throw new Error("nope"); } });
  const r = await s.get(); assert.strictEqual(r.mode, "unavailable"); assert.strictEqual(r.data, null); assert.strictEqual(s.status().status, "down");
});
test("fetch gives up after its deadline", async () => {
  const hang = (_u, o) => new Promise((_ok, bad) => o.signal.addEventListener("abort", () => { const e = new Error("aborted"); e.name = "AbortError"; bad(e); }));
  await assert.rejects(fetchWithRetry("https://example.com", { timeoutMs: 30, retries: 0, fetchImpl: hang }), /timeout after 30 ms/);
});

// ---------- whole fabric with fake sources ----------
function fakeFetch(broken = new Set()) {
  return async (url) => {
    const host = new URL(url).host + new URL(url).pathname;
    const body = (b, text) => ({ ok: true, status: 200, json: async () => b, text: async () => (text != null ? text : JSON.stringify(b)) });
    for (const k of broken) if (url.includes(k)) return { ok: false, status: 503, json: async () => ({}), text: async () => "" };
    if (host.includes("nfldata")) return body(null, GAMES_CSV);
    if (host.includes("injuries_")) return body(null, INJ_CSV);
    if (host.includes("open-meteo")) { const n = new URL(url).searchParams.get("latitude").split(",").length; return body(n === 1 ? meteo(1, 9)[0] : meteo(n, 9)); }
    if (host.startsWith("api.weather.gov/points/")) return host.includes("51.") ? { ok: false, status: 404, json: async () => ({}), text: async () => "" } : body(NWS_POINT);
    if (host.startsWith("api.weather.gov/gridpoints/")) return body(nwsHourly("2026-11-22T18:00:00Z", { windSpeed: "22 mph", shortForecast: "Windy" }));
    if (host.includes("yahoo") || host.includes("espn.com/espn/rss")) return body(null, RSS);
    if (host.endsWith("/scoreboard")) return body(SB);
    if (host.endsWith("/news")) return body(NEWS);
    if (host.endsWith("/injuries")) return body(ESPN_INJ);
    if (host.endsWith("/transactions")) return body(TX);
    if (host.endsWith("/summary")) return body(SUMMARY);
    if (host.includes("youtube.com/feeds")) return body(null, url.includes("UCDVYQ4Zhbm3S2dlz7P1GBDg") ? YT_NFL : url.includes("UCcEvCxUe2Sm5W6MliEUv0vg") ? YT_TEAM : YT_ATOM("Other team", []));
    if (host.includes("omnycontent")) return body(null, POD("Fixture show", 6));
    return { ok: false, status: 404, json: async () => ({}), text: async () => "" };
  };
}
const NOW = () => Date.parse("2026-11-21T16:00:00Z");
test("public fabric output passes the public-snapshot contract", async () => {
  const f = createFabric({ scopes: ["public"], cacheDir: null, season: 2026, now: NOW, fetchImpl: fakeFetch() });
  const u = await f.universe();
  assert.deepStrictEqual(C.validatePublicSnapshot(u, T), []);
  assert.ok(!Object.keys(u.sources).some((id) => id.startsWith("espn-")), "no ESPN JSON sources in public scope");
  assert.ok(u.events.some((e) => e.type === "weather"), "flagged weather becomes an event");
  assert.ok(u.games.some((g) => g.weather) && u.games.every((g) => !g.weather || g.weather.source === "open-meteo"), "Open-Meteo is used while it answers");
  assert.strictEqual(u.sources.nws.status, "ok"); assert.strictEqual(u.sources.nws.records, 0); assert.ok(/Not requested/.test(u.sources.nws.note), "the backup is not asked when it is not needed");
});
test("weather falls back to the National Weather Service when Open-Meteo refuses", async () => {
  const seen = [];
  const base = fakeFetch(new Set(["open-meteo"]));
  const f = createFabric({ scopes: ["public"], cacheDir: null, season: 2026, now: NOW, fetchImpl: async (url, o) => { seen.push(url); return base(url, o); } });
  const u = await f.universe();
  assert.deepStrictEqual(C.validatePublicSnapshot(u, T), []);
  assert.strictEqual(u.sources["open-meteo"].status, "down", "the refused source is still reported down");
  assert.strictEqual(u.sources.nws.status, "ok"); assert.ok(u.sources.nws.records >= 1 && /Backup for/.test(u.sources.nws.note));
  const wx = u.games.filter((g) => g.weather);
  assert.ok(wx.length >= 1 && wx.every((g) => g.weather.source === "nws" && !g.venue.indoor), "outdoor games carry the backup forecast, named as such");
  const ev = u.events.find((e) => e.type === "weather");
  assert.ok(ev && ev.source === "nws" && ev.publisher === "National Weather Service" && ev.sources[0].url === "https://www.weather.gov/", "weather events credit the source that gave them");
  assert.ok(seen.filter((x) => x.includes("api.weather.gov")).every((x) => /^https:\/\/api\.weather\.gov\/(points|gridpoints)\//.test(x)), "only the two documented addresses are called");
});
test("full fabric merges ESPN onto nflverse and flags injury disagreement", async () => {
  const f = createFabric({ scopes: ["public", "local"], cacheDir: null, season: 2026, now: NOW, fetchImpl: fakeFetch() });
  const u = await f.universe();
  assert.deepStrictEqual(C.validateUniverse(u, T), []);
  const buf = u.games.find((g) => g.home === "BUF");
  assert.strictEqual(buf.source, "espn-scoreboard"); assert.strictEqual(buf.state, "in"); assert.strictEqual(buf.odds.source, "espn-scoreboard");
  assert.ok(u.games.some((g) => g.home === "WAS"), "a game only ESPN knows is still listed");
  const corner = u.injuries.NYG.players.find((p) => p.name === "Fixture Corner");
  assert.strictEqual(corner.disagree, true); assert.strictEqual(corner.also.status, "Questionable");
  assert.strictEqual(u.injuries.NYG.players.filter((p) => /Fixture$/.test(p.name)).length, 1, "Gabe / Gabriel Fixture matched as one player");
  assert.strictEqual(u.injuries.NYG.players.find((p) => p.name === "Fixture Passer").starter, true);
  assert.strictEqual(u.injuries.NYG.players.find((p) => p.name === "Backup Passer").starter, false);
  assert.strictEqual(u.injuries.NYG.qbOut, true, "the last starter is out");
  assert.strictEqual(u.injuries.NYG.reportWeek, 11);
  assert.ok(!u.events.some((e) => e.type === "odds_move" && e.gameId === "900000002"), "no line-move event for a game in progress");
  const mv = u.events.find((e) => e.type === "odds_move" && e.gameId === "900000099");
  assert.ok(mv && mv.data.open === 3.5 && mv.data.current === 6, "a moved pre-game line becomes an event");
  assert.ok(u.events.some((e) => e.type === "transaction"));
  const d = await f.game("900000002"); assert.deepStrictEqual(C.validateGameDetail(d, T), []);
  assert.strictEqual(await f.game("../etc"), null, "game ids are digits only");
  const team = await f.team("nyg"); assert.strictEqual(team.team.a, "NYG"); assert.ok(team.events.every((e) => e.teams.includes("NYG")));
});
test("the public check rejects every path for local data", () => {
  const base = JSON.parse(JSON.stringify(require(path.join(root, "test/fixtures/universe.public.json"))));
  assert.deepStrictEqual(C.validatePublicSnapshot(base, T), []);
  const bad = (mutate, why) => { const u = JSON.parse(JSON.stringify(base)); mutate(u); assert.ok(C.validatePublicSnapshot(u, T).length > 0, why); };
  bad((u) => { u.sources["espn-injuries"] = Object.assign({}, u.sources["nflverse-injuries"], { id: "espn-injuries", scope: "local" }); }, "a local source listed");
  bad((u) => { const t = Object.values(u.injuries)[0]; t.players[0].source = "espn-injuries"; }, "an injury player from ESPN");
  bad((u) => { const t = Object.values(u.injuries)[0]; t.players[0].also = { source: "espn-injuries", status: "Out" }; }, "an injury comparison with ESPN");
  bad((u) => { u.transactions.push({ date: u.generatedAt, team: "NYG", text: "x", kind: "other", source: "espn-transactions" }); }, "a transaction from ESPN");
  bad((u) => { u.events[0].data = { other: { source: "espn-injuries" } }; }, "an event citing ESPN");
  bad((u) => { u.games[0].state = "in"; }, "a live game state");
  bad((u) => { u.games[0].source = "espn-scoreboard"; }, "a game from the ESPN scoreboard");
  bad((u) => { u.games[0].odds = Object.assign({}, u.games[0].odds || {}, { source: "espn-scoreboard", provider: "x" }); }, "odds from ESPN");
});
test("fresh snapshots never publish yesterday's cache; public and local caches are separate", async () => {
  const os = require("os"), fs = require("fs");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nflu-cache-"));
  try {
    let csv = GAMES_CSV;
    const fetchWith = () => async (url) => (url.includes("nfldata") ? { ok: true, status: 200, json: async () => null, text: async () => csv } : fakeFetch()(url));
    let t = Date.parse("2026-11-21T16:00:00Z");
    const day1 = createFabric({ scopes: ["public"], cacheDir: dir, season: 2026, now: () => t, fetchImpl: fetchWith() });
    let u = await day1.universe({ fresh: true });
    assert.strictEqual(u.games.find((g) => g.home === "BUF").state, "pre");
    // next day: the schedule now has BUF final; a new process with the same cache folder
    csv = GAMES_CSV.replace("2026_11_MIA_BUF,2026,REG,11,2026-11-22,13:00,MIA,,BUF,", "2026_11_MIA_BUF,2026,REG,11,2026-11-22,13:00,MIA,10,BUF,30");
    t += 86400000;
    const day2 = createFabric({ scopes: ["public"], cacheDir: dir, season: 2026, now: () => t, fetchImpl: fetchWith() });
    u = await day2.universe({ fresh: true });
    assert.strictEqual(u.games.find((g) => g.home === "BUF").state, "post", "fresh run uses today's data, not the cache");
    assert.ok(u.sources["nflverse-games"].ageSec < 5, "age describes the data used");
    // a cached (non-fresh) read of old data reports its real age, not the age of a refresh that landed later
    const day3 = createFabric({ scopes: ["public"], cacheDir: dir, season: 2026, now: () => t + 2 * 86400000, fetchImpl: fetchWith() });
    u = await day3.universe();
    assert.ok(u.sources["nflverse-games"].ageSec >= 2 * 86400 - 5, "stale cache is reported with its age");
    assert.strictEqual(u.sources["nflverse-games"].status, "stale");
    // local runs use their own folder
    const both = createFabric({ scopes: ["public", "local"], cacheDir: dir, season: 2026, now: () => t, fetchImpl: fakeFetch() });
    await both.universe({ fresh: true });
    assert.notStrictEqual(both.cacheDir, day1.cacheDir);
    assert.ok(fs.readdirSync(day1.cacheDir).every((f) => !f.startsWith("espn-")), "no ESPN cache in the public folder");
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
test("kickoff and score events survive later polls and restarts", async () => {
  const os = require("os"), fs = require("fs");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nflu-ev-"));
  try {
    let board = JSON.parse(JSON.stringify(SB)), t = Date.parse("2026-11-22T17:00:00Z");
    const c0 = board.events[0].competitions[0];
    c0.status = { period: 0, displayClock: "0:00", type: { state: "pre" } }; c0.competitors.forEach((x) => (x.score = "0"));
    const f = (url) => (url.endsWith("/scoreboard") ? Promise.resolve({ ok: true, status: 200, json: async () => board, text: async () => "" }) : fakeFetch()(url));
    const fab = createFabric({ scopes: ["public", "local"], cacheDir: dir, season: 2026, now: () => t, fetchImpl: f });
    await fab.universe({ fresh: true });
    board = JSON.parse(JSON.stringify(SB)); t += 3600000;            // now in the 3rd quarter, 10-17
    let u = await fab.universe({ fresh: true });
    assert.ok(u.events.some((e) => e.subtype === "kickoff" && e.gameId === "900000002"));
    assert.ok(u.events.some((e) => e.subtype === "score" && e.gameId === "900000002"));
    t += 60000; u = await fab.universe({ fresh: true });
    assert.ok(u.events.some((e) => e.subtype === "score"), "still there on the next poll");
    const again = createFabric({ scopes: ["public", "local"], cacheDir: dir, season: 2026, now: () => t + 60000, fetchImpl: f });
    u = await again.universe({ fresh: true });
    assert.ok(u.events.some((e) => e.subtype === "kickoff"), "still there after a restart");
    const first = u.events.find((e) => e.subtype === "kickoff");
    assert.ok(Date.parse(first.ts) <= t, "time is when it was first seen");
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
test("headlines without a publication time keep their first-seen time", async () => {
  const os = require("os"), fs = require("fs");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nflu-rss-"));
  try {
    let t = Date.parse("2026-11-21T16:00:00Z");
    const fab = createFabric({ scopes: ["public"], cacheDir: dir, season: 2026, now: () => t, fetchImpl: fakeFetch() });
    const ts1 = (await fab.universe({ fresh: true })).events.find((e) => e.url === "https://example.com/b").ts;
    t += 3 * 3600000;
    const ts2 = (await fab.universe({ fresh: true })).events.find((e) => e.url === "https://example.com/b").ts;
    assert.strictEqual(ts1, ts2);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
test("one failing source degrades only itself", async () => {
  const f = createFabric({ scopes: ["public", "local"], cacheDir: null, season: 2026, now: NOW, fetchImpl: fakeFetch(new Set(["yahoo", "nfl/injuries"])) });
  const u = await f.universe();
  assert.deepStrictEqual(C.validateUniverse(u, T), []);
  assert.strictEqual(u.sources["rss-yahoo"].status, "down"); assert.strictEqual(u.sources["espn-injuries"].status, "down");
  assert.strictEqual(u.sources["nflverse-games"].status, "ok"); assert.ok(u.games.length >= 4);
  assert.ok(u.injuries.NYG, "nflverse injuries still shown when ESPN's fail");
});
test("everything down still yields a valid, empty, honest payload", async () => {
  const f = createFabric({ scopes: ["public", "local"], cacheDir: null, season: 2026, now: NOW, fetchImpl: async () => { throw new Error("offline"); } });
  const u = await f.universe();
  assert.deepStrictEqual(C.validateUniverse(u, T), []);
  const net = Object.values(u.sources).filter((s) => !["curated-news", "open-meteo", "nws"].includes(s.id));
  assert.ok(net.length >= 8 && net.every((s) => s.status === "down"), "every network source reports down");
  assert.strictEqual(u.sources["open-meteo"].records, 0); assert.ok(/unavailable/i.test(u.sources["open-meteo"].note || ""), "weather says why it has nothing");
  assert.strictEqual(u.sources["curated-news"].status, "ok", "the local file still reads"); assert.strictEqual(u.games.length, 0);
});
test("server routes answer, validate ids and refuse path tricks", async () => {
  const srv = require(path.join(root, "server.js"));
  srv.setFabric(createFabric({ scopes: ["public", "local"], cacheDir: null, season: 2026, now: NOW, fetchImpl: fakeFetch() }));
  await new Promise((ok) => srv.server.listen(0, "127.0.0.1", ok));
  const base = "http://127.0.0.1:" + srv.server.address().port;
  const http = require("http");
  const get = (p) => new Promise((ok, bad) => http.get(base + p, (res) => { let b = ""; res.on("data", (c) => (b += c)); res.on("end", () => ok({ status: res.statusCode, body: b, type: res.headers["content-type"] })); }).on("error", bad));
  try {
    let r = await get("/api/universe"); assert.strictEqual(r.status, 200); assert.deepStrictEqual(C.validateUniverse(JSON.parse(r.body), T), []);
    r = await get("/api/universe?since=2099-01-01T00:00:00Z"); assert.strictEqual(JSON.parse(r.body).events.length, 0, "since trims events");
    r = await get("/api/universe?since=2000-01-01T00:00:00Z"); assert.ok(JSON.parse(r.body).events.length > 0, "since keeps newer events");
    r = await get("/api/health"); assert.strictEqual(r.status, 200); assert.ok(JSON.parse(r.body).sources["nflverse-games"]);
    r = await get("/api/game/900000002"); assert.strictEqual(r.status, 200); assert.deepStrictEqual(C.validateGameDetail(JSON.parse(r.body), T), []);
    r = await get("/api/game/abc"); assert.strictEqual(r.status, 404);
    r = await get("/api/game/123456789"); assert.strictEqual(r.status, 404, "only games in the current payload");
    const raw = (line, headers = "Host: 127.0.0.1\r\n") => new Promise((ok) => { const net = require("net"); const sock = net.connect(srv.server.address().port, "127.0.0.1", () => sock.write(line + "\r\n" + headers + "Connection: close\r\n\r\n"));
      let b = ""; sock.on("data", (c) => (b += c)); sock.on("close", () => ok(b)); sock.on("error", () => ok(b)); });
    let rb = await raw("GET /api/health HTTP/1.1", "Host: evil.example\r\n"); assert.ok(/^HTTP\/1\.1 403/.test(rb), "foreign Host refused on the API");
    rb = await raw("GET http://[::1 HTTP/1.1"); assert.ok(rb === "" || /^HTTP\/1\.1 (400|404)/.test(rb), "malformed request line answered or dropped");
    r = await get("/api/health"); assert.strictEqual(r.status, 200, "server still up after a malformed request");
    r = await get("/api/team/NYG"); assert.strictEqual(r.status, 200);
    r = await get("/api/team/XYZ"); assert.strictEqual(r.status, 404);
    r = await get("/api/nothing"); assert.strictEqual(r.status, 404);
    r = await get("/%2e%2e/server.js"); assert.strictEqual(r.status, 404, "no files outside public/ (URL parsing removes the dots before the guard)");
    r = await get("/"); assert.strictEqual(r.status, 200); assert.ok(/text\/html/.test(r.type));
    // public hosting: no ESPN scoreboard without the local scope, and a per-client request cap
    process.env.FABRIC_SCOPES = "public";
    r = await get("/api/live"); assert.strictEqual(r.status, 404, "/api/live is off without the local scope");
    process.env.RATE_LIMIT = "3";
    const codes = [];
    for (let i = 0; i < 300; i++) { codes.push((await get("/api/health")).status); if (codes[i] === 429) break; }
    assert.strictEqual(codes[codes.length - 1], 429, "the request cap answers 429");
    r = await get("/"); assert.strictEqual(r.status, 200, "the page itself is not rate limited");
  } finally { delete process.env.FABRIC_SCOPES; delete process.env.RATE_LIMIT; await new Promise((ok) => srv.server.close(ok)); srv.setFabric(null); }
});
test("YouTube feeds: video ids checked, Shorts and press conferences recognised, teams matched", () => {
  const c = { team: "BUF", name: "Buffalo Bills", channelId: "UCcEvCxUe2Sm5W6MliEUv0vg" };
  const v = media.normalizeYoutubeFeed(YT_TEAM, c);
  assert.strictEqual(v.length, 3);
  assert.strictEqual(v[0].kind, "press"); assert.deepStrictEqual(v[0].teams.sort(), ["BUF", "MIA"]);
  assert.strictEqual(v[1].kind, "short"); assert.strictEqual(v[1].title, "Practice sights & sounds");
  assert.strictEqual(v[0].embedUrl, "https://www.youtube-nocookie.com/embed/bbbbbbbbbb1");
  assert.strictEqual(media.normalizeYoutubeFeed(YT_NFL, { team: null, name: "NFL", channelId: "UCDVYQ4Zhbm3S2dlz7P1GBDg" }).length, 2, "malformed video id dropped");
  assert.throws(() => media.normalizeYoutubeFeed("<html></html>", c), /not a YouTube feed/);
  assert.strictEqual(media.videoKind("Head coach meets the media", false), "press");
  assert.strictEqual(media.videoKind("Week 12 Highlights", false), "highlights");
});
test("podcast feeds: newest episodes only, https audio only, durations parsed", () => {
  const e = media.normalizePodcastFeed(POD("Fixture show", 6), "Fixture show", 4);
  assert.strictEqual(e.length, 4); assert.ok(e.every((x) => x.audioUrl.startsWith("https://")));
  assert.strictEqual(e[0].durationSec, 1800); assert.strictEqual(e[1].durationSec, 1800);
  assert.deepStrictEqual(e[0].teams.sort(), ["NYG", "NYJ"]);
  assert.strictEqual(media.normalizePodcastFeed(POD("x", 0), "x").length, 0, "an insecure enclosure is skipped");
});
test("large feeds are read only until enough items have arrived", async () => {
  let sent = 0, cancelled = false;
  const chunk = new TextEncoder().encode("<item><title>t</title></item>".repeat(50));
  const body = new ReadableStream({ pull(ctl) { if (sent >= 1000) return ctl.close(); sent++; ctl.enqueue(chunk); }, cancel() { cancelled = true; } });
  const text = await media.readHead("https://example.com/huge.rss", { items: 4, fetchImpl: async () => ({ ok: true, status: 200, body }) });
  assert.ok(cancelled, "download stopped"); assert.ok(sent < 10, "read " + sent + " of 1000 chunks"); assert.ok(text.split("</item>").length - 1 >= 4);
});
test("media block: deduplicated, valid, public, and one failing channel is only noted", async () => {
  const f = createFabric({ scopes: ["public"], cacheDir: null, season: 2026, now: NOW, fetchImpl: fakeFetch(new Set(["UCbpj2JAUMb8G_oQQFPeGrhg"])) });
  const u = await f.universe();
  assert.deepStrictEqual(C.validatePublicSnapshot(u, T), []);
  assert.strictEqual(u.media.videos.filter((v) => v.videoId === "aaaaaaaaaa1").length, 1, "the same video from two channels appears once");
  assert.ok(u.media.channels.length >= 18 && u.media.channels[0].name === "NFL");
  assert.ok(u.media.podcasts.length > 0 && u.media.podcasts.length <= 30);
  assert.strictEqual(u.sources["youtube-official"].status, "ok"); assert.ok(/Baltimore Ravens/.test(u.sources["youtube-official"].note || ""), "the failing channel is named");
  const dead = createFabric({ scopes: ["public"], cacheDir: null, season: 2026, now: NOW, fetchImpl: fakeFetch(new Set(["youtube.com/feeds", "omnycontent"])) });
  const d = await dead.universe();
  assert.strictEqual(d.sources["youtube-official"].status, "down"); assert.strictEqual(d.media.videos.length, 0);
  assert.deepStrictEqual(C.validateUniverse(d, T), [], "no media still yields a valid payload");
});
test("the contract refuses media pointing anywhere but the providers", () => {
  const u = JSON.parse(JSON.stringify(require(path.join(root, "test/fixtures/universe.sample.json"))));
  const bad = (mut, why) => { const x = JSON.parse(JSON.stringify(u)); mut(x.media); assert.ok(C.validateUniverse(x, T).length > 0, why); };
  bad((m) => { m.videos[0].embedUrl = "https://evil.example/embed/" + m.videos[0].videoId; }, "foreign embed host");
  bad((m) => { m.videos[0].thumb = "http://i.ytimg.com/x.jpg"; }, "non-https image");
  bad((m) => { m.channels[0].liveUrl = "javascript:alert(1)"; }, "script URL");
  bad((m) => { m.channels[0].liveUrl = "https://www.youtube.com/channel/UCxxxxxxxxxxxxxxxxxxxxxx/live"; }, "live page of another channel");
  bad((m) => { m.videos[0].videoId = "../../etc"; }, "malformed id");
  bad((m) => { m.podcasts[0].audioUrl = "http://example.com/a.mp3"; }, "insecure audio");
  bad((m) => { m.videos[1].videoId = m.videos[0].videoId; m.videos[1].url = m.videos[0].url; m.videos[1].embedUrl = m.videos[0].embedUrl; }, "duplicate video");
});
test("feed parsing survives bad entities and stays linear on unclosed tags", () => {
  assert.strictEqual(util.decode("a&#99999999;b&#xD800;c&amp;d"), "a�b�c&d", "out-of-range references become U+FFFD");
  const big = "<rss><channel>" + "<item><title>x".repeat(40000);
  let t = Date.now(); util.parseRss(big); media.normalizePodcastFeed(big, "x"); media.normalizeYoutubeFeed("<feed>" + "<entry><yt:videoId>x".repeat(40000), { team: null, name: "N", channelId: "UCDVYQ4Zhbm3S2dlz7P1GBDg" });
  assert.ok(Date.now() - t < 400, "40,000 unclosed items parsed in " + (Date.now() - t) + " ms");
  const feed = YT_ATOM("Buffalo Bills", [["ccccccccccc", "A bad &#99999999; title", "2026-11-21T10:00:00+00:00"]]);
  assert.strictEqual(media.normalizeYoutubeFeed(feed, { team: "BUF", name: "Buffalo Bills", channelId: "UCcEvCxUe2Sm5W6MliEUv0vg" }).length, 1, "one bad entity does not drop the feed");
});
test("only the configured channel's own entries are kept", () => {
  const x = '<feed><entry><yt:videoId>ddddddddddd</yt:videoId><yt:channelId>UCaaaaaaaaaaaaaaaaaaaaaa</yt:channelId><title>Someone else</title><published>2026-11-21T10:00:00+00:00</published></entry>' +
    '<entry><yt:videoId>eeeeeeeeeee</yt:videoId><yt:channelId>UCcEvCxUe2Sm5W6MliEUv0vg</yt:channelId><title>Ours</title><published>2026-11-21T10:00:00+00:00</published></entry></feed>';
  assert.deepStrictEqual(media.normalizeYoutubeFeed(x, { team: "BUF", name: "Buffalo Bills", channelId: "UCcEvCxUe2Sm5W6MliEUv0vg" }).map((v) => v.videoId), ["eeeeeeeeeee"]);
});
test("video kinds and strict team matching on real-world titles", () => {
  const k = media.videoKind;
  assert.strictEqual(k("Dan Campbell meets with the media", false), "press");
  assert.strictEqual(k("Locker room scrum after the win", false), "press");
  assert.strictEqual(k("Official Postgame Show | Week 11", false), "video");
  assert.strictEqual(k("Postgame Highlights vs. Raiders", false), "highlights");
  assert.strictEqual(k("Highlights from the Podium Club", false), "highlights");
  assert.strictEqual(k("Week 12 Game Preview + Predictions", false), "preview");
  assert.strictEqual(k("Practice day #shorts", false), "short");
  const strict = (t) => ent.teamsInText(t, { strict: true }).sort();
  assert.deepStrictEqual(strict("Dallas Turner just ran you over"), []);
  assert.deepStrictEqual(strict("Washington State hosts Indy 500 champion in Miami (OH)"), []);
  assert.deepStrictEqual(strict("Bucs at Niners: what to watch"), ["SF", "TB"]);
  assert.deepStrictEqual(strict("Giants vs. Jaguars"), ["JAX", "NYG"]);
  assert.deepStrictEqual(ent.teamsInText("Dallas Cowboys news").sort(), ["DAL"], "the full name still matches");
});
test("podcast episodes: official account only, one copy per episode, credited to its own show", () => {
  const ep = (show, program, clip, when) => ({ id: "pod-" + clip, show, title: "t " + clip, published: when, url: null, durationSec: null, teams: [], source: "podcasts-nfl", clip, native: null,
    audioUrl: "https://traffic.omny.fm/d/clips/e73c998e-6e60-432f-8610-ae210140c5b1/" + program + "/" + clip + "/audio.mp3" });
  const P1 = "00000000-0000-4000-8000-000000000001", P2 = "00000000-0000-4000-8000-000000000002", C1 = "00000000-0000-4000-8000-0000000000c1";
  const list = [Object.assign(ep("Show A", P2, C1, "2026-11-21T10:00:00Z"), { native: false }), Object.assign(ep("Show B", P2, C1, "2026-11-21T10:00:00Z"), { native: true }),
    Object.assign(ep("Show A", P1, "00000000-0000-4000-8000-0000000000c2", "2026-11-21T12:00:00Z"), { native: true })];
  const d = media.dedupeEpisodes(list);
  assert.strictEqual(d.length, 2); assert.strictEqual(d.find((e) => e.id === "pod-" + C1).show, "Show B", "kept under its own show");
  assert.ok(Date.parse(d[0].published) >= Date.parse(d[1].published), "newest first");
  assert.ok(!("clip" in d[0]) && !("native" in d[0]), "helper fields removed");
  const feed = POD("x", 3), prog = "00000000-0000-4000-8000-000000000000";
  assert.ok(media.normalizePodcastFeed(feed, "x", 4, prog).every((e) => typeof e.native === "boolean"));
  assert.strictEqual(media.officialAudio("https://traffic.omny.fm/d/clips/00000000-0000-0000-0000-000000000000/" + P1 + "/" + C1 + "/audio.mp3"), null, "another Omny account is refused");
});
test("per-channel quotas keep every channel; the snapshot keeps 3 videos and 1 Short each", () => {
  const vids = [];
  for (let c = 0; c < 3; c++) for (let n = 0; n < 40; n++) vids.push({ videoId: "v" + c + "_" + n, channelId: "ch" + c, kind: n % 4 === 0 ? "short" : "video", published: new Date(Date.UTC(2026, 10, 21) - (c === 2 ? 5 * 86400000 : 0) - n * 60000).toISOString() });
  const q = media.quota(vids, { perChannel: 8, shorts: 3 });
  for (let c = 0; c < 3; c++) assert.strictEqual(q.filter((v) => v.channelId === "ch" + c).length, 11, "channel " + c + " keeps 8 + 3 even when older");
  assert.ok(q.every((v, k) => k === 0 || Date.parse(q[k - 1].published) >= Date.parse(v.published)), "newest first");
  const s2 = media.snapshotMedia({ channels: [], videos: vids, podcasts: [] });
  for (let c = 0; c < 3; c++) { const mine = s2.videos.filter((v) => v.channelId === "ch" + c); assert.strictEqual(mine.length, 4); assert.strictEqual(mine.filter((v) => v.kind === "short").length, 1); }
});
test("the contract accepts only exact provider addresses and listed channels; cleanMedia drops the rest", () => {
  const u = JSON.parse(JSON.stringify(require(path.join(root, "test/fixtures/universe.sample.json"))));
  const bad = (mut, why) => { const x = JSON.parse(JSON.stringify(u)); mut(x.media); assert.ok(C.validateUniverse(x, T).length > 0, why); return x; };
  const v0 = u.media.videos[0];
  bad((m) => { m.videos[0].url = "https://www.youtube.com/redirect?q=https://evil.example&v=" + v0.videoId; }, "redirect link ending in the id");
  bad((m) => { m.channels[0].url = "https://www.youtube.com/redirect?q=evil"; }, "any youtube.com path as channel url");
  bad((m) => { m.videos[0].channelId = "UCaaaaaaaaaaaaaaaaaaaaaa"; }, "a video from an unlisted channel");
  bad((m) => { m.videos[0].thumb = "https://i.ytimg.com/vi/" + v0.videoId + "/x.jpg?\"onerror"; }, "thumbnail with extra characters");
  bad((m) => { m.podcasts[0].audioUrl = "https://evil.example/a.mp3"; }, "audio on another host");
  bad((m) => { m.podcasts[0].audioUrl = "https://127.0.0.1:1/x"; }, "audio on a local address");
  bad((m) => { m.podcasts[0].url = "https://evil.example/ep"; }, "episode page on another host");
  bad((m) => { m.videos[0].title = "x".repeat(600); }, "absurdly long title");
  const dirty = JSON.parse(JSON.stringify(u.media));
  dirty.videos.push(Object.assign({}, dirty.videos[0]), Object.assign({}, dirty.videos[1], { videoId: "zzzzzzzzzzz", url: "https://evil.example/" }));
  dirty.podcasts.push(Object.assign({}, dirty.podcasts[0], { audioUrl: "javascript:alert(1)" }));
  const clean = C.cleanMedia(dirty);
  assert.strictEqual(clean.videos.length, u.media.videos.length); assert.strictEqual(clean.podcasts.length, u.media.podcasts.length);
  const pubBad = JSON.parse(JSON.stringify(require(path.join(root, "test/fixtures/universe.public.json"))));
  pubBad.sources["youtube-official"].scope = "local";
  assert.ok(C.validatePublicSnapshot(pubBad, T).some((e) => /media\.videos/.test(e)), "public snapshot refuses media from a local source");
});
test("the pool never runs more than n at once and stops after an error; a stalled feed times out", async () => {
  let live = 0, peak = 0, started = 0;
  await media.pool([1, 2, 3, 4, 5, 6, 7, 8], 3, async () => { live++; peak = Math.max(peak, live); await new Promise((r) => setTimeout(r, 5)); live--; });
  assert.strictEqual(peak, 3);
  await assert.rejects(media.pool([1, 2, 3, 4, 5, 6, 7, 8], 2, async (x) => { started++; if (x === 1) throw new Error("boom"); await new Promise((r) => setTimeout(r, 5)); }), /boom/);
  assert.ok(started <= 3, "started " + started + " tasks after a failure");
  const stalled = { ok: true, status: 200, body: new ReadableStream({ pull() { return new Promise(() => {}); } }) };
  const t = Date.now();
  await assert.rejects(media.readHead("https://example.com/slow.rss", { timeoutMs: 60, fetchImpl: async () => stalled }), /timeout after 60 ms/);
  assert.ok(Date.now() - t < 1000);
});
test("synthetic fixtures satisfy the contracts", () => {
  assert.deepStrictEqual(C.validateUniverse(require(path.join(root, "test/fixtures/universe.sample.json")), T), []);
  assert.deepStrictEqual(C.validatePublicSnapshot(require(path.join(root, "test/fixtures/universe.public.json")), T), []);
  assert.deepStrictEqual(C.validateGameDetail(require(path.join(root, "test/fixtures/game.sample.json")), T), []);
});

// ---- [S-C time machine] the event archive embedded in the page (scripts/event-archive.js); synthetic events only ----
const arch = require(path.join(root, "scripts/event-archive.js"));
const archEv = (id, seenAt, extra) => Object.assign({ id, type: "news", subtype: null, ts: "2026-11-20T12:00:00.000Z", seenAt, teams: ["NYG"], players: [], title: "Synthetic " + id, url: "https://example.test/" + id,
  source: "rss-yahoo", publisher: "Fixture", importance: 40, confidence: 0.7, sourceCount: 1, sources: [{ publisher: "Fixture", url: "https://example.test/" + id }], gameId: null, data: {} }, extra || {});
const archFile = (day, events) => ({ name: day + ".json", text: JSON.stringify({ date: day, recordedAt: day + "T20:00:00.000Z", events }) });
const ARCH_PUBLIC = new Set(["rss-yahoo", "rss-espn", "nflverse-games", "curated-news"]);
test("event archive: public sources only, bad events left out, duplicates keep the earliest first sighting", () => {
  const files = [
    archFile("2026-11-10", [archEv("too-old", "2026-11-10T15:00:00.000Z")]),
    archFile("2026-11-21", [archEv("a", "2026-11-21T16:00:00.000Z"), archEv("dup", "2026-11-21T16:30:00.000Z", { title: "First sighting" }), archEv("local", "2026-11-21T16:00:00.000Z", { source: "espn-news" }),
      archEv("local-other", "2026-11-21T16:00:00.000Z", { data: { other: { source: "espn-injuries" } } }), archEv("bad-url", "2026-11-21T16:00:00.000Z", { url: "javascript:alert(1)" }),
      archEv("bad-team", "2026-11-21T16:00:00.000Z", { teams: ["XXX"] }), archEv("bad-seen", "not a time"), archEv("bad-type", "2026-11-21T16:00:00.000Z", { type: "rumor" }), null, { id: "no-title", seenAt: "2026-11-21T16:00:00.000Z" }]),
    archFile("2026-11-23", [archEv("dup", "2026-11-23T10:00:00.000Z", { title: "Seen again" }), archEv("same", "2026-11-23T11:00:00.000Z"), archEv("changed", "2026-11-23T11:30:00.000Z"),
      archEv("rich", "2026-11-23T12:00:00.000Z", { sourceCount: 2, sources: [{ publisher: "A", url: "https://example.test/a" }, { publisher: "B", url: "https://example.test/b" }], players: [{ name: "Fixture Passer", pos: "QB", extra: 1 }], gameId: "900000004", data: { flags: ["x"] } })]),
    { name: "2026-11-22.json", text: "{ not json" }, { name: "../../etc/passwd", text: "{}" }, { name: "2026-11-24.json", text: JSON.stringify({ events: [archEv("tomorrow", "2026-11-24T01:00:00.000Z")] }) }, null,
  ];
  const latestEvents = [archEv("same", "2026-11-23T17:00:00.000Z"), archEv("changed", "2026-11-23T17:00:00.000Z", { importance: 55 })];
  const { archive: a, report: r } = arch.buildEventArchive(files, { today: "2026-11-23", publicSources: ARCH_PUBLIC, abbrs: T, latestEvents });
  assert.deepStrictEqual(a.events.map((e) => e.id), ["a", "dup", "same", "changed", "rich"]);
  assert.deepStrictEqual(a.files, ["2026-11-21", "2026-11-23"]);
  assert.deepStrictEqual(r.skippedFiles, ["2026-11-22"]);
  assert.deepStrictEqual([r.invalid, r.nonPublic, r.duplicates, r.trimmed, r.refs], [6, 2, 1, 0, 1]);
  const by = Object.fromEntries(a.events.map((e) => [e.id, e]));
  assert.strictEqual(by.dup.seenAt, "2026-11-21T16:30:00.000Z"); assert.strictEqual(by.dup.title, "First sighting");
  assert.deepStrictEqual(by.same, { id: "same", seenAt: "2026-11-23T11:00:00.000Z" }, "identical to the snapshot: stored as a reference with the archive's own first-seen time");
  assert.strictEqual(by.changed.title, "Synthetic changed"); assert.strictEqual(by.changed.importance, 40, "an event the snapshot has since revised keeps its body as first recorded");
  assert.deepStrictEqual(Object.keys(by.a).sort(), ["confidence", "id", "importance", "publisher", "seenAt", "source", "teams", "title", "ts", "type", "url"], "empty fields are left out");
  assert.deepStrictEqual(by.rich.players, [{ name: "Fixture Passer", pos: "QB" }]); assert.strictEqual(by.rich.sources.length, 2); assert.strictEqual(by.rich.gameId, "900000004");
  assert.strictEqual(a.from, "2026-11-21T16:00:00.000Z"); assert.strictEqual(a.to, "2026-11-23T12:00:00.000Z");
  assert.ok(!JSON.stringify(a).includes("espn"), "nothing from a local source reaches the archive");
  assert.deepStrictEqual(arch.validateEventArchive(a, ARCH_PUBLIC, T), []);
  const empty = arch.buildEventArchive([], { today: "2026-11-23", publicSources: ARCH_PUBLIC, abbrs: T });
  assert.deepStrictEqual([empty.archive.events, empty.archive.from], [[], null]); assert.deepStrictEqual(arch.validateEventArchive(empty.archive, ARCH_PUBLIC, T), []);
});
test("event archive: bounded in days and bytes; the check refuses local data, duplicates and oversize", () => {
  const day = (d) => "2026-11-" + String(d).padStart(2, "0");
  const files = []; for (let d = 10; d <= 23; d++) files.push(archFile(day(d), Array.from({ length: 30 }, (_, k) => archEv("e" + d + "-" + k, day(d) + "T" + String(10 + (k % 10)) + ":00:00.000Z"))));
  const opts = { today: "2026-11-23", publicSources: ARCH_PUBLIC, abbrs: T };
  const week = arch.buildEventArchive(files, opts);
  assert.strictEqual(arch.ARCHIVE_DAYS, 7); assert.deepStrictEqual(week.archive.files, [17, 18, 19, 20, 21, 22, 23].map(day)); assert.strictEqual(week.archive.events.length, 210);
  assert.ok(week.report.bytes <= arch.ARCHIVE_MAX_BYTES && week.report.trimmed === 0);
  const small = arch.buildEventArchive(files, Object.assign({ maxBytes: 20000 }, opts)), sa = small.archive;
  assert.ok(Buffer.byteLength(JSON.stringify(sa)) <= 20000, "never larger than the cap");
  assert.ok(sa.events.length > 0 && sa.events.length % 30 === 0 && small.report.trimmed === 210 - sa.events.length, "whole oldest days are dropped first");
  assert.ok(sa.from > day(17) + "T23" && sa.events.every((e) => e.seenAt >= sa.from) && sa.to === week.archive.to, "the newest days are kept and `from` moves forward to say where the archive now begins");
  const tiny = arch.buildEventArchive(files, Object.assign({ maxBytes: 3000 }, opts)).archive;
  assert.ok(Buffer.byteLength(JSON.stringify(tiny)) <= 3000 && tiny.events.length > 0 && tiny.events.length < 30 && tiny.events.every((e) => e.seenAt >= tiny.from), "a single day over the cap loses its oldest events");
  assert.deepStrictEqual(arch.validateEventArchive(sa, ARCH_PUBLIC, T, 20000), []);
  const bad = (f) => { const c = JSON.parse(JSON.stringify(sa)); f(c); return arch.validateEventArchive(c, ARCH_PUBLIC, T, 20000).length > 0; };
  assert.ok(bad((c) => { c.events[1].source = "espn-news"; }), "a local source");
  assert.ok(bad((c) => { c.events[1].data = { other: { source: "espn-injuries" } }; }), "local data inside an event");
  assert.ok(bad((c) => { c.events[1].id = c.events[0].id; }), "a duplicate id");
  assert.ok(bad((c) => { c.events[1].url = "http://example.test/x"; }), "a link that is not https");
  assert.ok(bad((c) => { c.events[1] = { id: "ref", seenAt: c.events[1].seenAt, importance: 99 }; }), "a reference carrying more than id and seenAt");
  assert.ok(bad((c) => { c.from = "2026-11-25T00:00:00.000Z"; }), "a wrong start time");
  assert.ok(bad((c) => { c.events[1].title = "x".repeat(21000); }), "an oversize archive");
  assert.deepStrictEqual(arch.validateEventArchive(null), ["not an event archive"]); assert.deepStrictEqual(arch.validateEventArchive({ v: 2, events: [] }), ["not an event archive"]);
});
test("event archive: the committed event files build a valid archive within the page budget", () => {
  const fsx = require("fs"), dir = path.join(root, "data/fabric/events");
  const names = fsx.existsSync(dir) ? fsx.readdirSync(dir).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort() : [];
  if (!names.length) return;   // a checkout with no record yet: nothing to check
  const pubIds = new Set(Object.keys(createFabric({ scopes: ["public"], cacheDir: null }).sources)), localIds = Object.keys(createFabric({ scopes: ["local"], cacheDir: null }).sources);
  const files = names.map((name) => ({ name, text: fsx.readFileSync(path.join(dir, name), "utf8") }));
  const { archive: a, report: r } = arch.buildEventArchive(files, { today: names[names.length - 1].slice(0, 10), publicSources: pubIds, abbrs: T });
  assert.deepStrictEqual(arch.validateEventArchive(a, pubIds, T), []);
  assert.ok(a.events.length > 0 && r.bytes <= arch.ARCHIVE_MAX_BYTES && r.nonPublic === 0, JSON.stringify(r));
  assert.ok(localIds.length > 0 && a.events.every((e) => !localIds.includes(e.source)), "no local-scope source in the real record");
});

(async () => {
  let failed = 0;
  for (const [name, fn] of tests) {
    try { await fn(); } catch (err) { failed++; console.error("FAIL " + name + "\n  " + (err && err.stack || err).split("\n").slice(0, 4).join("\n  ")); }
  }
  if (failed) { console.error(failed + " of " + tests.length + " fabric tests failed"); process.exit(1); }
  console.log("ok: " + tests.length + " fabric tests pass");
})();
