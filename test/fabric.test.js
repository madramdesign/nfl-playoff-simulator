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
// a key in the shell that runs the tests must never switch on The Odds API against the real service
delete process.env.ODDS_API_KEY;
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
// Depth charts and weekly rosters in nflverse's real column layout (checked Nov. 23, 2026); rows deliberately out of
// date order, an older NYG snapshot, and an unknown team.
const DEPTH_CSV = [
  "dt,team,player_name,espn_id,gsis_id,pos_grp_id,pos_grp,pos_id,pos_name,pos_abb,pos_slot,pos_rank",
  "2026-11-20T10:00:00Z,NYG,Fixture Corner,,00-0000002,1,Base 3-4 D,1,Left Cornerback,LCB,1,1",
  "2026-11-22T10:00:00Z,NYG,Fixture Passer,123,00-0000001,2,3WR 1TE,1,Quarterback,QB,1,1",
  "2026-11-22T10:00:00Z,NYG,Backup Passer,,00-0000004,2,3WR 1TE,1,Quarterback,QB,1,2",
  "2026-11-22T10:00:00Z,NYG,Fixture Corner,,00-0000002,1,Base 3-4 D,1,Left Cornerback,LCB,1,2",
  "2026-11-22T10:00:00Z,NYG,Fixture Returner,,00-0000006,3,Special Teams,3,Kick Returner,KR,1,1",
  "2026-11-21T09:00:00Z,KC,Fixture Tackle,,00-0000005,2,3WR 1TE,4,Left Tackle,LT,1,1",
  "2026-11-22T09:00:00Z,XXX,Nobody,,,2,3WR 1TE,1,Quarterback,QB,1,1",
].join("\n");
const ROSTER_CSV = [
  "season,team,position,status,full_name,gsis_id,espn_id,sleeper_id,week",
  "2026,NYG,QB,ACT,Fixture Passer,00-0000001,123,111,10",
  "2026,NYG,QB,ACT,Fixture Passer,00-0000001,123,111,11",
  "2026,BUF,WR,ACT,Fixture Wideout,00-0000009,,222,11",
  "2026,NYG,CB,ACT,Fixture Corner,00-0000002,,,11",
  "2025,NYG,QB,ACT,Old Season,00-0000010,,333,17",
].join("\n");
// NWS active alerts in its real shape (checked Nov. 24, 2026): times carry a local offset; one relevant warning, plus a
// flood advisory, a test message and a duplicate that must all be dropped.
const nwsFeature = (id, event, severity, extra) => ({ id: "https://api.weather.gov/alerts/" + id, type: "Feature", geometry: null,
  properties: Object.assign({ id: "urn:oid:" + id, event, severity, certainty: "Likely", urgency: "Expected", status: "Actual", messageType: "Alert",
    sent: "2026-11-21T09:10:00-05:00", effective: "2026-11-21T09:10:00-05:00", onset: "2026-11-22T10:00:00-05:00", ends: "2026-11-22T19:00:00-05:00",
    expires: "2026-11-22T19:00:00-05:00", headline: event + " issued November 21 by NWS Buffalo NY", areaDesc: "Southern Erie", senderName: "NWS Buffalo NY" }, extra || {}) });
const NWS_FC = { type: "FeatureCollection", title: "Current watches, warnings, and advisories", updated: "2026-11-21T14:00:00+00:00", features: [
  nwsFeature("w1", "Wind Advisory", "Moderate"), nwsFeature("w1", "Wind Advisory", "Moderate"), nwsFeature("f1", "Coastal Flood Advisory", "Moderate"),
  nwsFeature("t1", "Winter Storm Warning", "Severe", { status: "Test" })] };
const SLEEPER_STATE = { week: 11, season: "2026", season_type: "regular" };
const SLEEPER_ADD = [{ player_id: "111", count: 500 }, { player_id: "DEN", count: 40 }, { player_id: "999", count: 10 }, { player_id: "111", count: 1 }, { player_id: "bad id!", count: 5 }, { count: 3 }, { player_id: "777", count: -4 }];
const SLEEPER_DROP = [{ player_id: "222", count: 300 }];
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
test("nflverse games: the weeks before and after come along (rollover and recent finals)", () => {
  const g = pub.normalizeGames(GAMES_CSV, 2026, Date.parse("2026-11-21T16:00:00Z"));
  assert.ok(g.prev && g.prev.week === 10 && g.prev.games.length === 1 && g.prev.games[0].state === "post" && g.prev.games[0].homeScore === 24, "the previous week, with its final");
  assert.ok(g.next && g.next.week === 12 && g.next.seasonType === "regular" && g.next.games.length === 1 && g.next.games[0].home === "IND" && g.next.games[0].state === "pre", "the next week");
  const last = pub.normalizeGames(GAMES_CSV.split("\n").filter((l) => !/_12_/.test(l)).join("\n"), 2026, Date.parse("2026-11-21T16:00:00Z"));
  assert.strictEqual(last.next, null, "no next week: none");
});
// A scoreboard with every week-11 game the schedule has not scored shown final (and the week-12 game not yet listed).
const sbFinal = (id, date, home, away, hs, as) => ({ id, date, competitions: [{ status: { period: 4, displayClock: "0:00", type: { state: "post" } },
  competitors: [{ homeAway: "home", score: String(hs), team: { abbreviation: home } }, { homeAway: "away", score: String(as), team: { abbreviation: away } }] }] });
const SB_DONE = { week: { number: 11 }, events: [sbFinal("900000002", "2026-11-22T18:00Z", "BUF", "MIA", 26, 9), sbFinal("900000003", "2026-11-23T01:20Z", "SF", "MIN", 35, 10),
  sbFinal("900000004", "2026-11-22T21:25Z", "NYG", "JAX", 23, 18)] };
const sbFetch = (sbJson) => { const base = fakeFetch(); return async (url, o) => (String(url).includes("/scoreboard") ? { ok: true, status: 200, json: async () => sbJson, text: async () => JSON.stringify(sbJson) } : base(url, o)); };
test("week rollover: the live feed showing the week over moves the payload to the next week at once", async () => {
  const later = () => Date.parse("2026-11-24T05:00:00Z");
  const u = await createFabric({ scopes: ["public", "local"], cacheDir: null, season: 2026, now: later, fetchImpl: sbFetch(SB_DONE) }).universe();
  assert.strictEqual(u.week, 12, "the next week, before the schedule file has the last score");
  assert.deepStrictEqual(u.games.map((g) => g.away + "@" + g.home), ["NYG@IND"]);
  assert.ok(u.games[0].weather && u.games[0].weather.source === "open-meteo", "the new week's outdoor game already has its forecast (fetched with the next week)");
  assert.deepStrictEqual(u.recentFinals.map((f) => f.away + "@" + f.home + " " + f.awayScore + "-" + f.homeScore).sort(), ["IND@HOU 3-26", "JAX@NYG 18-23", "MIA@BUF 9-26", "MIN@SF 10-35"], "the finished week's finals are kept");
  assert.ok(u.recentFinals.find((f) => f.home === "SF").source === "espn-scoreboard" && u.recentFinals.find((f) => f.home === "HOU").source === "nflverse-games", "each from where its score came");
  assert.ok(u.events.some((e) => e.subtype === "final" && /Final: MIN 10, SF 35/.test(e.title)), "the finals still reach the feed");
  assert.deepStrictEqual(C.validateUniverse(u, T), []);
  // ESPN already on the next week while the schedule still waits for a score: also moves on
  const ahead = { week: { number: 12 }, events: [{ id: "900000005", date: "2026-11-29T18:00Z", competitions: [{ status: { period: 0, displayClock: "0:00", type: { state: "pre" } },
    competitors: [{ homeAway: "home", score: "0", team: { abbreviation: "IND" } }, { homeAway: "away", score: "0", team: { abbreviation: "NYG" } }] }] }] };
  const u2 = await createFabric({ scopes: ["public", "local"], cacheDir: null, season: 2026, now: later, fetchImpl: sbFetch(ahead) }).universe();
  assert.ok(u2.week === 12 && u2.games.length === 1 && u2.games[0].source === "espn-scoreboard", "ESPN's next week shown, joined to the schedule");
  // ESPN still listing last week's finals near the new week's first game (Thanksgiving): they are not added to it
  const tgCsv = GAMES_CSV.replace("2026_12_NYG_IND,2026,REG,12,2026-11-29,13:00", "2026_12_NYG_IND,2026,REG,12,2026-11-26,13:00");
  const tgFetch = (sbJson) => { const f = sbFetch(sbJson); return async (url, o) => (String(url).includes("/nfldata/") ? { ok: true, status: 200, json: async () => null, text: async () => tgCsv } : f(url, o)); };
  const mnf = JSON.parse(JSON.stringify(SB_DONE)); mnf.events[2].date = "2026-11-24T01:15Z";   // a Monday night game, 2.7 days before Thanksgiving
  const u4 = await createFabric({ scopes: ["public", "local"], cacheDir: null, season: 2026, now: later, fetchImpl: tgFetch(mnf) }).universe();
  assert.deepStrictEqual(u4.games.map((g) => g.away + "@" + g.home), ["NYG@IND"], "last week's games stay out of the new week even within three days of it");
  // one game still going: no rollover
  const going = JSON.parse(JSON.stringify(SB_DONE)); going.events[1].competitions[0].status.type.state = "in"; going.events[1].competitions[0].status.period = 4;
  const u3 = await createFabric({ scopes: ["public", "local"], cacheDir: null, season: 2026, now: later, fetchImpl: sbFetch(going) }).universe();
  assert.ok(u3.week === 11 && u3.games.length === 4, "while one game is in progress the week stays");
  assert.deepStrictEqual(u3.recentFinals.map((f) => f.home), ["NYG"], "the previous week's finals instead (week 10)");
});
test("the public snapshot keeps the schedule's previous week's finals; a local final never reaches it", async () => {
  const u = await createFabric({ scopes: ["public"], cacheDir: null, season: 2026, now: NOW, fetchImpl: fakeFetch() }).universe();
  assert.ok(u.week === 11 && u.recentFinals.length === 1 && u.recentFinals[0].source === "nflverse-games");
  assert.deepStrictEqual(C.validatePublicSnapshot(u, T), []);
  const bad = JSON.parse(JSON.stringify(u)); bad.sources["espn-scoreboard"] = Object.assign({}, bad.sources["nflverse-games"], { id: "espn-scoreboard", scope: "local" });
  bad.recentFinals[0].source = "espn-scoreboard";
  assert.ok(C.validatePublicSnapshot(bad, T).some((e) => /^recentFinals\[0\]: from non-public source/.test(e)));
  const worse = JSON.parse(JSON.stringify(u)); worse.recentFinals[0].awayScore = -3; worse.recentFinals[0].home = "XXX"; worse.recentFinals[0].kickoff = "soon";
  assert.strictEqual(C.validateUniverse(worse, T).filter((e) => /^recentFinals/.test(e)).length, 3, "bad score, team and time refused");
});
test("FantasyPros: only each team's top-projected quarterback is kept; the raw answer never enters the repository", () => {
  const os = require("os"), fs = require("fs"), { spawnSync } = require("child_process");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nflu-fp-"));
  const py = (args, opts) => spawnSync("python3", ["-I"].concat(args), Object.assign({ cwd: root, encoding: "utf8", env: { PATH: process.env.PATH } }, opts));
  try {
    // an answer in the documented shape (invented values): two Bills, a Jaguar and a Ram under FantasyPros's own ids, bad rows
    const answer = { sport: "NFL", week: 12, players: [
      { name: "Fixture Allen", team_id: "BUF", stats: { points: 22.14 } }, { name: "Bills Backup", team_id: "BUF", stats: { points: 3.2 } },
      { name: "Fixture Lawrence", team_id: "JAC", stats: { points: "15.0" } }, { name: "Fixture Stafford", team_id: "LAR", stats: { points: 18 } },
      { name: "No Points", team_id: "NYG", stats: {} }, { name: "", team_id: "DAL", stats: { points: 9 } }, "not a player", { name: "No Team", stats: { points: 30 } },
      { name: "Free Agent", team_id: "FA", stats: { points: 0 } }] };
    fs.writeFileSync(path.join(dir, "answer.json"), JSON.stringify(answer));
    const r = py(["scripts/fetch_fantasypros.py", "--from-file", path.join(dir, "answer.json"), "--out", path.join(dir, "out")]);
    assert.strictEqual(r.status, 0, r.stderr);
    const kept = JSON.parse(fs.readFileSync(path.join(dir, "out", "qb_top.json"), "utf8"));
    assert.deepStrictEqual(kept.teams, { BUF: { name: "Fixture Allen", points: 22.1 }, JAX: { name: "Fixture Lawrence", points: 15 }, LA: { name: "Fixture Stafford", points: 18 } },
      "each team's top quarterback under nflverse's team codes; rows without a team, name or points left out");
    assert.ok(kept.week === 12 && kept.credit === "Quarterback projections are based on data obtained from FantasyPros" && kept.source === "FantasyPros API" && /^\d{4}-\d\d-\d\dT/.test(kept.fetched));
    assert.deepStrictEqual(fs.readdirSync(path.join(dir, "out")), ["qb_top.json"], "nothing else written");
    assert.ok(!fs.readFileSync(path.join(dir, "out", "qb_top.json"), "utf8").includes("Bills Backup"), "no other player's projection");
    assert.ok(/answer keys: players, sport, week \| players: 9 \| week: 12 \| teams with a quarterback: 3/.test(r.stdout), "the log shows the answer's shape, not its contents");
    const inside = py(["scripts/fetch_fantasypros.py", "--from-file", path.join(dir, "answer.json"), "--out", path.join(dir, "out2"), "--raw", path.join(root, "data", "fantasypros")]);
    assert.ok(inside.status !== 0 && /outside this repository/.test(inside.stderr) && !fs.existsSync(path.join(dir, "out2")), "the raw answer may not be kept inside the repository");
    fs.writeFileSync(path.join(dir, "odd.json"), JSON.stringify({ message: "rate limited" }));
    const odd = py(["scripts/fetch_fantasypros.py", "--from-file", path.join(dir, "odd.json"), "--out", path.join(dir, "out3")]);
    assert.ok(odd.status !== 0 && /keys: message/.test(odd.stderr) && !fs.existsSync(path.join(dir, "out3")), "an answer of another shape: a clear failure naming its keys, nothing written");
    fs.writeFileSync(path.join(dir, "empty.json"), JSON.stringify({ week: 12, players: [{ name: "No Points", team_id: "BUF", stats: {} }] }));
    const empty = py(["scripts/fetch_fantasypros.py", "--from-file", path.join(dir, "empty.json"), "--out", path.join(dir, "out4")]);
    assert.ok(empty.status !== 0 && /no team's quarterback could be read/.test(empty.stderr) && !fs.existsSync(path.join(dir, "out4")), "players but none usable: a failure, no empty file");
    assert.strictEqual(py(["scripts/fetch_fantasypros.py"]).status === 0, false, "no key: no call, a failure");
    const ignored = spawnSync("git", ["check-ignore", "-q", "data/fantasypros/qb_projections.json"], { cwd: root }).status === 0 && spawnSync("git", ["check-ignore", "-q", "data/fantasypros/qb_top.json"], { cwd: root }).status !== 0;
    assert.ok(ignored, "git ignores any raw FantasyPros file but keeps the derived one");
    const wf = fs.readFileSync(path.join(root, ".github/workflows/fantasypros.yml"), "utf8");
    assert.ok(/git add data\/fantasypros\/qb_top\.json\n/.test(wf) && !/git add data\/fantasypros\n/.test(wf), "the workflow commits the derived file only");
    // the build: a team whose top projection is not its last starter is flagged; the same starter and a low projection are not
    fs.writeFileSync(path.join(dir, "games.csv"), GAMES_CSV);
    fs.writeFileSync(path.join(dir, "qb_top.json"), JSON.stringify({ fetched: "2026-11-24T12:00:00+00:00", week: 12, teams: {
      NYG: { name: "Other Passer", points: 18 }, DAL: { name: "Dallas Starter Jr.", points: 17 }, IND: { name: "Low One", points: 3 }, XXX: { name: "Nobody", points: 30 } } }));
    const code = "import sys, json, datetime; sys.path.insert(0, 'scripts'); import build; " +
      "t = open(sys.argv[1]).read(); print(json.dumps(build.fantasypros_qb(t, 2026, sys.argv[2], datetime.date(2026, 11, 25)))); print(json.dumps(build.fantasypros_qb(t, 2026, sys.argv[2], datetime.date(2026, 12, 2))))";
    const b = py(["-c", code, path.join(dir, "games.csv"), path.join(dir, "qb_top.json")]);
    assert.strictEqual(b.status, 0, b.stderr);
    const [fresh, old] = b.stdout.trim().split("\n").filter((l) => l.startsWith("{") || l === "null").map((l) => JSON.parse(l));
    assert.deepStrictEqual(Object.values(fresh.teams), [{ proj: "Other Passer", last: "Fixture Passer", points: 18 }], "only the Giants are flagged (a suffix such as Jr. is not a different quarterback)");
    const names = py(["-c", "import sys; sys.path.insert(0, 'scripts'); import build; print([build._plain(n) for n in ['Patrick Mahomes II', 'Patrick Mahomes', 'Anthony Richardson Sr.', 'Michael Penix Jr.', 'Marvin Harrison III', 'Jrue Holiday', 'C.J. Stroud']])"]);
    assert.strictEqual(names.stdout.trim(), "['patrickmahomes', 'patrickmahomes', 'anthonyrichardson', 'michaelpenix', 'marvinharrison', 'jrueholiday', 'cjstroud']", "suffixes dropped as whole words only");
    assert.ok(fresh.week === 12 && fresh.fetched === "2026-11-24", "with the week and the day it was fetched");
    assert.strictEqual(old, null, "more than four days old: not used");
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
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
    if (host.includes("depth_charts_")) return body(null, DEPTH_CSV);
    if (host.includes("roster_weekly_")) return body(null, ROSTER_CSV);
    if (host.endsWith("api.sleeper.app/v1/state/nfl")) return body(SLEEPER_STATE);
    if (host.endsWith("/trending/add")) return body(SLEEPER_ADD);
    if (host.endsWith("/trending/drop")) return body(SLEEPER_DROP);
    if (host.includes("api.weather.gov/alerts/active")) {   // a point south of 25°N stands for a neutral site abroad: outside NWS coverage
      const lat = Number(new URL(url).searchParams.get("point").split(",")[0]);
      return lat < 25 ? { ok: false, status: 400, json: async () => ({}), text: async () => "" } : body(NWS_FC);
    }
    if (host.includes("open-meteo")) { const n = new URL(url).searchParams.get("latitude").split(",").length; return body(n === 1 ? meteo(1, 9)[0] : meteo(n, 9)); }
    if (host.includes("yahoo") || host.includes("espn.com/espn/rss")) return body(null, RSS);
    if (host.endsWith("/scoreboard")) return body(SB);
    if (host.endsWith("/news")) return body(NEWS);
    if (host.endsWith("/injuries")) return body(ESPN_INJ);
    if (host.endsWith("/transactions")) return body(TX);
    if (host.endsWith("/summary")) return body(SUMMARY);
    if (host.endsWith("youtube.com/oembed")) {   // YouTube's embed check: the second league video has embedding turned off
      const vid = new URL(new URL(url).searchParams.get("url")).searchParams.get("v");
      return vid === "aaaaaaaaaa2" ? { ok: false, status: 401, json: async () => ({}), text: async () => "Unauthorized" } : body({ type: "video", title: "x" });
    }
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
    // one touchdown 20 seconds after the last look: the scorer is named and the time is exact
    board.events[0].competitions[0].competitors.forEach((x) => { if (x.homeAway === "home") x.score = String(Number(x.score) + 7); });
    t += 20000; u = await fab.universe({ fresh: true });
    const td = u.events.find((e) => e.subtype === "score" && e.gameId === "900000002" && e.ts === new Date(t).toISOString());
    assert.ok(td && /^BUF scores: /.test(td.title) && !td.data.tsEstimated, "one score, seen within 20 s: " + (td && td.title));
    const again = createFabric({ scopes: ["public", "local"], cacheDir: dir, season: 2026, now: () => t + 60000, fetchImpl: f });
    u = await again.universe({ fresh: true });
    assert.ok(u.events.some((e) => e.subtype === "kickoff"), "still there after a restart");
    const first = u.events.find((e) => e.subtype === "kickoff");
    assert.ok(Date.parse(first.ts) <= t, "never later than when it was first seen");
    // seen an hour after the last look: dated by the scheduled kickoff inside that hour, and marked as an estimate
    assert.strictEqual(first.ts, "2026-11-22T18:00:00.000Z");
    assert.ok(first.data.tsEstimated && first.data.between.length === 2, "an estimate, with the gap it fell in");
    const sc = u.events.find((e) => e.subtype === "score" && e.gameId === "900000002" && /MIA 10, BUF 17/.test(e.title));
    assert.ok(/^Score update: /.test(sc.title), "both teams scored between looks: no single scorer is named (" + sc.title + ")");
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
test("game changes are dated inside the gap they were seen in; long gaps are marked as estimates", () => {
  const { gameTime } = require(path.join(root, "lib/fabric"));
  const T0 = Date.parse("2026-11-22T17:50:00Z"), K = Date.parse("2026-11-22T18:00:00Z"), M = 60000;
  assert.deepStrictEqual(gameTime(T0, T0 + 20000, null), { ts: new Date(T0 + 20000).toISOString(), data: {} }, "a 20-second gap: the time it was seen, exact");
  assert.deepStrictEqual(gameTime(K - 10000, K + 10000, K), { ts: new Date(K).toISOString(), data: {} }, "the scheduled kickoff inside a short gap");
  const late = gameTime(T0, T0 + 22 * M, K);
  assert.strictEqual(late.ts, new Date(K).toISOString(), "a 22-minute gap: dated by the scheduled kickoff it contains");
  assert.deepStrictEqual(late.data, { tsEstimated: true, between: [new Date(T0).toISOString(), new Date(T0 + 22 * M).toISOString()] }, "and marked as an estimate with the gap");
  assert.strictEqual(gameTime(K + 5 * M, K + 30 * M, K).ts, new Date(K + 5 * M).toISOString(), "a kickoff that was still to come at the last look is no earlier than that look");
  assert.strictEqual(gameTime(T0, T0 + 30 * M, null).data.tsEstimated, true, "a score seen after a long gap is an estimate");
  assert.strictEqual(gameTime(NaN, T0, K).ts, new Date(T0).toISOString(), "no earlier look: the time it was seen");
});
test("the heartbeat checks every 20 s in a game window and every 5 min otherwise, and stops when asked", async () => {
  const { liveWindow } = require(path.join(root, "lib/fabric"));
  const t = Date.parse("2026-11-22T19:00:00Z"), M = 60000, g = (state, kickMs) => ({ state, kickoff: new Date(kickMs).toISOString() });
  assert.ok(liveWindow([g("in", t - 60 * M)], t), "a game in progress");
  assert.ok(liveWindow([g("pre", t + 10 * M)], t), "kickoff within 15 minutes");
  assert.ok(liveWindow([g("pre", t - 30 * M)], t), "a late start still counts");
  assert.ok(!liveWindow([g("pre", t + 20 * M)], t) && !liveWindow([g("pre", t - 5 * 60 * M)], t), "too early, or a game that never started");
  assert.ok(!liveWindow([g("post", t - 60 * M)], t) && !liveWindow([], t) && !liveWindow(null, t), "finished games or none");
  const run = async (board) => {
    const f = (url) => (url.endsWith("/scoreboard") ? Promise.resolve({ ok: true, status: 200, json: async () => board, text: async () => "" }) : fakeFetch()(url));
    const fab = createFabric({ scopes: ["public", "local"], cacheDir: null, season: 2026, now: () => t, fetchImpl: f });
    const delays = [], fns = [];
    const w = fab.startWatch({ setTimer: (fn, ms) => { delays.push(ms); fns.push(fn); return { n: fns.length }; }, clearTimer: () => {} });
    await fns[0](); await fns[1]();
    w.stop(); await fns[2]();
    return delays;
  };
  const live = JSON.parse(JSON.stringify(SB));
  assert.ok(live.events.some((e) => e.competitions[0].status.type.state === "in"), "the fixture has a game in progress");
  assert.deepStrictEqual(await run(live), [0, 20000, 20000], "in a window: every 20 seconds; after stop() nothing more is scheduled");
  const done = JSON.parse(JSON.stringify(SB));
  done.events.forEach((e) => { e.competitions[0].status = { period: 4, displayClock: "0:00", type: { state: "post" } }; });
  assert.deepStrictEqual(await run(done), [0, 300000, 300000], "no window: every 5 minutes");
});
test("depth charts: each team's newest snapshot only, by rank; bad input is refused", () => {
  const d = pub.normalizeDepthCharts(DEPTH_CSV);
  assert.deepStrictEqual(d.asOf, { NYG: "2026-11-22T10:00:00Z", KC: "2026-11-21T09:00:00Z" }, "newest snapshot per team, rows out of date order; unknown teams dropped");
  assert.strictEqual(d.teams.NYG.length, 4, "the older NYG snapshot is left out");
  assert.strictEqual(d.teams.NYG.find((r) => r.name === "Fixture Corner").rank, 2, "rank from the newest snapshot");
  assert.deepStrictEqual(d.teams.NYG.find((r) => r.name === "Fixture Passer"), { name: "Fixture Passer", gsisId: "00-0000001", espnId: "123", group: "3WR 1TE", slot: "QB", rank: 1 });
  assert.throws(() => pub.normalizeDepthCharts("team,dt\nNYG,x"), /unexpected columns/);
  assert.throws(() => pub.normalizeDepthCharts(""), /no rows/);
  assert.throws(() => pub.normalizeDepthCharts(DEPTH_CSV.split("\n")[0] + "\n2026-11-22T10:00:00Z,XXX,Nobody,,,1,g,1,n,QB,1,1"), /no usable rows/);
});
test("weekly rosters: the newest week of the season, indexed by nflverse and Sleeper ids", () => {
  const r = pub.normalizeRosters(ROSTER_CSV, 2026);
  assert.strictEqual(r.week, 11);
  assert.strictEqual(r.players, 3, "three players in week 11; last season's row is ignored");
  assert.deepStrictEqual(r.bySleeper["111"], { name: "Fixture Passer", team: "NYG", pos: "QB", status: "ACT", gsisId: "00-0000001", espnId: "123", sleeperId: "111" });
  assert.ok(!r.bySleeper["333"] && r.bySleeper["222"].team === "BUF" && r.byGsis["00-0000002"].sleeperId === null, "no Sleeper id: indexed by nflverse id only");
  assert.throws(() => pub.normalizeRosters(ROSTER_CSV, 2030), /no roster rows/);
});
test("Sleeper: state and trending lists are checked, de-duplicated, and team defences recognised", () => {
  const sl = require(path.join(root, "lib/fabric/adapters/sleeper.js"));
  assert.deepStrictEqual(sl.normalizeState(SLEEPER_STATE), { week: 11, season: 2026, seasonType: "regular" });
  assert.throws(() => sl.normalizeState({ week: "x" }), /no week/);
  assert.throws(() => sl.normalizeState(null), /not an object/);
  assert.deepStrictEqual(sl.normalizeTrending(SLEEPER_ADD), [{ sleeperId: "111", count: 500, defense: null }, { sleeperId: "DEN", count: 40, defense: "DEN" }, { sleeperId: "999", count: 10, defense: null }],
    "duplicates, bad ids, missing ids and negative counts dropped");
  assert.throws(() => sl.normalizeTrending({}), /not a list/);
  assert.ok(/lookback_hours=24&limit=25$/.test(sl.URLS.trending("add")) && sl.URLS.state === "https://api.sleeper.app/v1/state/nfl", "read-only endpoints, 24 hours, top 25");
});
test("depth charts mark injured starters; Sleeper trends are named through the roster crosswalk", async () => {
  const f = createFabric({ scopes: ["public", "local"], cacheDir: null, season: 2026, now: NOW, fetchImpl: fakeFetch() });
  const u = await f.universe();
  assert.deepStrictEqual(C.validateUniverse(u, T), []);
  const nyg = u.injuries.NYG, p = (n) => nyg.players.find((x) => x.name === n);
  assert.strictEqual(nyg.depthAsOf, "2026-11-22T10:00:00Z");
  assert.ok(p("Fixture Passer").starter === true && p("Fixture Passer").starterSource === "depth chart" && p("Fixture Passer").depthRank === 1, "matched by ESPN id: starter");
  assert.ok(p("Fixture Corner").starter === false && p("Fixture Corner").depthRank === 2, "rank 2 on the newest chart: backup, though an older chart had him first");
  assert.strictEqual(p("Backup Passer").starter, false);
  assert.strictEqual(nyg.qbOut, true, "the depth chart's starting quarterback is out");
  assert.deepStrictEqual(u.fantasy, { source: "sleeper-trending", lookbackHours: 24, week: 11,
    adds: [{ name: "Fixture Passer", team: "NYG", pos: "QB", count: 500, sleeperId: "111", gsisId: "00-0000001" }, { name: "Denver Broncos defense", team: "DEN", pos: "DEF", count: 40, sleeperId: "DEN", gsisId: null }],
    drops: [{ name: "Fixture Wideout", team: "BUF", pos: "WR", count: 300, sleeperId: "222", gsisId: "00-0000009" }], unmatched: { adds: 1, drops: 0 }, crosswalk: "nflverse-rosters" },
    "named through the crosswalk; a defence by its team; a player the crosswalk lacks is counted, not named");
  const pubU = await createFabric({ scopes: ["public"], cacheDir: null, season: 2026, now: NOW, fetchImpl: fakeFetch() }).universe();
  assert.deepStrictEqual(C.validatePublicSnapshot(pubU, T), [], "all three sources are public: allowed in the published snapshot");
  assert.ok(pubU.fantasy && pubU.injuries.NYG.depthAsOf, "and present there");
});
test("each new source can fail alone", async () => {
  const noSleeper = await createFabric({ scopes: ["public"], cacheDir: null, season: 2026, now: NOW, fetchImpl: fakeFetch(new Set(["api.sleeper.app"])) }).universe();
  assert.ok(!("fantasy" in noSleeper) && noSleeper.sources["sleeper-trending"].status === "down", "Sleeper down: no fantasy block, the source reported down");
  assert.deepStrictEqual(C.validateUniverse(noSleeper, T), []);
  const noRoster = await createFabric({ scopes: ["public"], cacheDir: null, season: 2026, now: NOW, fetchImpl: fakeFetch(new Set(["roster_weekly_"])) }).universe();
  assert.deepStrictEqual(noRoster.fantasy.adds.map((x) => x.name), ["Denver Broncos defense"], "no crosswalk: only the team defence can be named");
  assert.deepStrictEqual(noRoster.fantasy.unmatched, { adds: 2, drops: 1 });
  assert.strictEqual(noRoster.fantasy.crosswalk, null);
  const noDepth = await createFabric({ scopes: ["public"], cacheDir: null, season: 2026, now: NOW, fetchImpl: fakeFetch(new Set(["depth_charts_"])) }).universe();
  assert.ok(noDepth.injuries.NYG.depthAsOf === null && noDepth.injuries.NYG.players.every((x) => x.starterSource !== "depth chart"), "no depth chart: the older starter rules apply");
  assert.strictEqual(noDepth.injuries.NYG.players.find((x) => x.name === "Fixture Passer").starter, true, "the last starting quarterback is still known");
});
test("daily snapshot: a failed source keeps yesterday's part, shown stale with its true age (F01)", async () => {
  const { carryForward, MAX_AGE_DAYS } = require(path.join(root, "lib/fabric/carry.js"));
  // the second run two hours later, while the fixture's games are still ahead (so weather is still requested)
  const t0 = Date.parse("2026-11-22T09:37:00Z"), t1 = t0 + 2 * 3600000, DOWN = new Set(["yahoo", "espn.com/espn/rss", "open-meteo", "youtube.com/feeds", "omnycontent", "api.sleeper.app"]);
  const prev = await createFabric({ scopes: ["public"], cacheDir: null, season: 2026, now: () => t0, fetchImpl: fakeFetch() }).universe({ fresh: true });
  const next = await createFabric({ scopes: ["public"], cacheDir: null, season: 2026, now: () => t1, fetchImpl: fakeFetch(DOWN) }).universe({ fresh: true });
  const ids = ["rss-yahoo", "rss-espn", "open-meteo", "youtube-official", "podcasts-nfl", "sleeper-trending"];
  assert.ok(ids.every((id) => next.sources[id].status === "down") && !next.fantasy && !next.events.some((e) => e.source === "rss-yahoo"),
    "the failing run lost those sources: " + JSON.stringify(ids.map((id) => id + " " + next.sources[id].status)) + " fantasy " + !!next.fantasy);
  const before = JSON.stringify(next);
  const { u, carried, tooOld } = carryForward(prev, next, t1);
  assert.strictEqual(JSON.stringify(next), before, "the run's own payload is not changed");
  assert.deepStrictEqual(carried.slice().sort(), ids.slice().sort());
  assert.deepStrictEqual(tooOld, []);
  for (const id of ids) {
    const s = u.sources[id];
    assert.ok(s.status === "stale" && s.lastOk === prev.sources[id].lastOk && s.ageSec === 7200 && s.carriedFrom === prev.generatedAt, id + ": stale, original lastOk, true age");
  }
  assert.ok(u.events.some((e) => e.source === "rss-yahoo") && u.events.some((e) => e.source === "open-meteo"), "headlines and weather flags carried");
  assert.ok(u.games.some((g) => g.weather && g.weather.source === "open-meteo"), "game weather carried");
  assert.ok(u.media.videos.length === prev.media.videos.length && u.media.podcasts.length === prev.media.podcasts.length, "videos and episodes carried");
  assert.deepStrictEqual(u.fantasy, prev.fantasy, "fantasy trends carried");
  assert.ok(u.sources["nflverse-games"].status === "ok" && u.generatedAt === next.generatedAt, "working sources and the run's own time are untouched");
  const k = u.events.findIndex((e) => e.data.beforeWatch);
  assert.ok(k < 0 || u.events.slice(k).every((e) => e.data.beforeWatch), "carried events keep the feed's order");
  assert.deepStrictEqual(C.validatePublicSnapshot(u, T), [], "still a valid public snapshot");
  assert.deepStrictEqual(C.validateUniverse(u, T), []);
  // too old: nothing carried, the source stays down
  const late = carryForward(prev, next, t0 + (MAX_AGE_DAYS + 1) * 86400000);
  assert.deepStrictEqual(late.carried, []);
  assert.deepStrictEqual(late.tooOld.slice().sort(), ids.slice().sort());
  assert.ok(ids.every((id) => late.u.sources[id].status === "down") && !late.u.fantasy, "too old to carry: shown as down");
  // nothing to carry from, or nothing to carry
  assert.deepStrictEqual(carryForward(null, next, t1).carried, []);
  assert.deepStrictEqual(carryForward(prev, prev, t1).carried, [], "a run with every source working carries nothing");
  const badPrev = JSON.parse(JSON.stringify(prev)); badPrev.sources["rss-yahoo"].status = "down"; badPrev.sources["sleeper-trending"].scope = "local";
  const partial = carryForward(badPrev, next, t1).carried;
  assert.ok(!partial.includes("rss-yahoo") && !partial.includes("sleeper-trending") && partial.includes("rss-espn"), "never from a source that was itself down, never from a local source");
});
test("the snapshot script keeps yesterday's data through a failed run and reports it", async () => {
  const os = require("os"), fs = require("fs");
  const { writeSnapshot } = require(path.join(root, "scripts/fabric-snapshot.js"));
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nflu-snap-")), quiet = () => {};
  try {
    const t0 = Date.parse("2026-11-22T09:37:00Z"), t1 = t0 + 2 * 3600000;
    const fab = (t, broken) => createFabric({ scopes: ["public"], cacheDir: null, season: 2026, now: () => t, fetchImpl: fakeFetch(broken) });
    const r0 = await writeSnapshot({ fabric: fab(t0), dir, now: () => t0, log: quiet, warn: quiet });
    assert.ok(r0 && r0.carried.length === 0 && r0.down.length === 0, "a good run carries nothing");
    const good = JSON.parse(fs.readFileSync(path.join(dir, "latest.json"), "utf8"));
    const r1 = await writeSnapshot({ fabric: fab(t1, new Set(["yahoo", "espn.com/espn/rss", "youtube.com/feeds"])), dir, now: () => t1, log: quiet, warn: quiet });
    const snap = JSON.parse(fs.readFileSync(path.join(dir, "latest.json"), "utf8"));
    assert.deepStrictEqual(r1.carried.slice().sort(), ["rss-espn", "rss-yahoo", "youtube-official"]);
    assert.ok(snap.sources["rss-yahoo"].status === "stale" && snap.sources["rss-yahoo"].lastOk === good.sources["rss-yahoo"].lastOk, "published as stale with its old time");
    assert.ok(snap.events.some((e) => e.source === "rss-yahoo") && snap.media.videos.length === good.media.videos.length, "headlines and videos kept");
    assert.deepStrictEqual(C.validatePublicSnapshot(snap, T), []);
    const runs = JSON.parse(fs.readFileSync(path.join(dir, "runs.json"), "utf8"));
    assert.ok(runs.length === 2 && runs[1].carried.length === 3 && runs[1].stale.includes("rss-yahoo") && runs[1].at === new Date(t1).toISOString(), "both runs reported, the second with what it carried");
    const day = JSON.parse(fs.readFileSync(path.join(dir, "events", "2026-11-22.json"), "utf8"));
    assert.ok(day.events.length > 0 && day.events.length === new Set(day.events.map((e) => e.id)).size, "the day's event record has no duplicates after the second run");
    fs.writeFileSync(path.join(dir, "runs.json"), "not json");
    await writeSnapshot({ fabric: fab(t1), dir, now: () => t1, log: quiet, warn: quiet });
    assert.strictEqual(JSON.parse(fs.readFileSync(path.join(dir, "runs.json"), "utf8")).length, 1, "a broken run report is started again, not a reason to fail");
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
test("the refresh keeps GitHub's fresh snapshot instead of fetching again (DEC-021)", async () => {
  const os = require("os"), fs = require("fs");
  const S = require(path.join(root, "scripts/fabric-snapshot.js"));
  assert.deepStrictEqual([S.keepHours(["--keep-if-fresh", "4"]), S.keepHours(["--keep-if-fresh=2.5"]), S.keepHours([]), S.keepHours(["--keep-if-fresh"]), S.keepHours(["--keep-if-fresh", "x"]), S.keepHours(["--keep-if-fresh", "0"]), S.keepHours(["--keep-if-fresh", "99"])],
    [4, 2.5, null, null, null, null, null], "the option's hours; anything unclear means fetch");
  const g = { generatedAt: "2026-11-24T07:07:00Z" }, at = Date.parse(g.generatedAt), H = 3600000;
  assert.deepStrictEqual([S.isFresh(g, 4, at + 3.9 * H), S.isFresh(g, 4, at + 4 * H), S.isFresh(g, 4, at - 4 * 60000), S.isFresh(g, 4, at - 10 * 60000), S.isFresh(null, 4, at), S.isFresh({ generatedAt: "x" }, 4, at)],
    [true, false, true, false, false, false], "under the hours, never from the future beyond five minutes");
  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  assert.ok(/^node scripts\/request-fetch\.js --if-stale 8 && node scripts\/fabric-snapshot\.js --keep-if-fresh 8 && /.test(pkg.scripts.refresh), "npm run refresh asks GitHub for a fetch when main's snapshot is stale (DEC-023), then keeps a snapshot under 8 hours old");
  const wf = fs.readFileSync(path.join(root, ".github/workflows/data-fetch.yml"), "utf8");
  assert.ok(/run: node scripts\/fabric-snapshot\.js\n/.test(wf) && /ODDS_API_KEY: \$\{\{ secrets\.ODDS_API_KEY \}\}/.test(wf) && /group: data-refresh/.test(wf) && /github\.ref == 'refs\/heads\/main'/.test(wf),
    "the workflow always fetches, passes the optional key, shares the refresh queue and runs only from main");
  assert.ok(/cron: "17 \*\/3 \* \* \*"/.test(wf) && /uses: actions\/cache@v4\n\s+with:\n\s+path: \.cache\/fabric\/public\n\s+key: fabric-public-\$\{\{ github\.run_id \}\}\n\s+restore-keys: fabric-public-/.test(wf),
    "every 3 hours, with the fabric's public cache kept between runs");
  const fp = fs.readFileSync(path.join(root, ".github/workflows/fantasypros.yml"), "utf8");
  assert.ok(/- name: Fetch\n\s+if: steps\.key\.outputs\.set == 'true'/.test(fp) && /- name: Commit\n\s+if: steps\.key\.outputs\.set == 'true'/.test(fp) && /echo "set=false"/.test(fp),
    "the FantasyPros job stops quietly without its key");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nflu-keep-")), quiet = () => {};
  try {
    const t0 = Date.parse("2026-11-24T07:07:00Z"); let made = 0;
    const makeFabric = () => { made++; return createFabric({ scopes: ["public"], cacheDir: null, season: 2026, now: () => t0, fetchImpl: fakeFetch() }); };
    const first = await S.main({ argv: ["--keep-if-fresh", "4"], dir, now: () => t0, makeFabric, log: quiet, warn: quiet });
    assert.ok(made === 1 && first && !first.kept && first.at, "nothing published yet: it fetches");
    const lines = [], kept = await S.main({ argv: ["--keep-if-fresh", "4"], dir, now: () => t0 + 2.5 * H, makeFabric, log: (m) => lines.push(m), warn: quiet });
    assert.ok(kept.kept === true && made === 1 && /^fabric snapshot kept: the published one from 2026-11-24T07:07:00.000Z is under 4 hours old; no source was down then$/.test(lines[0]), "fresh: kept, nothing fetched, and it says so");
    const later = await S.main({ argv: ["--keep-if-fresh", "4"], dir, now: () => t0 + 5 * H, makeFabric, log: quiet, warn: quiet });
    assert.ok(made === 2 && !later.kept, "older than the hours: it fetches again");
    await S.main({ argv: [], dir, now: () => t0 + 5.1 * H, makeFabric, log: quiet, warn: quiet });
    assert.strictEqual(made, 3, "without the option it always fetches (the GitHub job)");
    fs.writeFileSync(path.join(dir, "latest.json"), JSON.stringify({ generatedAt: new Date(t0 + 5.2 * H).toISOString(), sources: {} }));
    await S.main({ argv: ["--keep-if-fresh", "4"], dir, now: () => t0 + 5.2 * H, makeFabric, log: quiet, warn: quiet });
    assert.strictEqual(made, 4, "a published file that fails the contract is never kept");
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
test("refresh status: has today's refresh run, and was it degraded? (F01 parts 3-4)", () => {
  const { refreshStatus } = require(path.join(root, "scripts/refresh-status.js"));
  const now = Date.parse("2026-11-23T18:23:00Z");   // 1:23 PM Eastern on Nov. 23
  const run = (at, o) => Object.assign({ at, ok: ["nflverse-games"], stale: [], down: [], carried: [] }, o);
  let s = refreshStatus({ snapshotDays: ["2026-11-22"], runs: [run("2026-11-22T12:00:00Z")], now });
  assert.ok(s.today === "2026-11-23" && !s.refreshedToday && !s.degraded && /No refresh yet today/.test(s.summary), "yesterday's refresh does not count");
  s = refreshStatus({ snapshotDays: ["2026-11-22", "2026-11-23"], runs: [run("2026-11-23T09:40:00Z", { stale: ["rss-yahoo"], carried: ["rss-yahoo"] })], now });
  assert.ok(s.refreshedToday && !s.degraded, "one carried source is not yet worth an issue");
  s = refreshStatus({ snapshotDays: ["2026-11-23"], runs: [run("2026-11-23T09:40:00Z", { stale: ["rss-yahoo", "rss-espn"], carried: ["rss-yahoo", "rss-espn"], down: ["nflverse-depth"] })], now });
  assert.ok(s.degraded && s.lost.length === 3 && /carried from the previous snapshot: rss-yahoo, rss-espn/.test(s.summary) && /down: nflverse-depth/.test(s.summary), "two or more lost or carried: degraded, with a summary");
  s = refreshStatus({ snapshotDays: ["2026-11-23"], runs: [run("2026-11-23T04:59:00Z", { down: ["a", "b"] })], latest: { generatedAt: "2026-11-23T09:00:00Z", sources: {} }, now });
  assert.ok(!s.degraded, "a run just before midnight Eastern belongs to the day before");
  assert.ok(!refreshStatus({ snapshotDays: null, runs: "nonsense", now }).degraded, "missing or broken inputs before any refresh are not an alarm");
  // no run report committed: the published snapshot itself is read
  const latest = (gen, sources) => ({ generatedAt: gen, sources });
  const srcs = { "rss-yahoo": { id: "rss-yahoo", status: "stale", carriedFrom: "2026-11-22T09:37:00Z" }, "open-meteo": { id: "open-meteo", status: "down" }, "nflverse-games": { id: "nflverse-games", status: "ok" } };
  s = refreshStatus({ snapshotDays: ["2026-11-23"], runs: [], latest: latest("2026-11-23T17:46:00Z", srcs), now });
  assert.ok(s.degraded && s.lost.slice().sort().join() === "open-meteo,rss-yahoo" && /no run report/.test(s.summary), "no run report: the snapshot's carried and down sources count");
  s = refreshStatus({ snapshotDays: ["2026-11-23"], runs: [], latest: latest("2026-11-23T17:46:00Z", { "nflverse-games": { id: "nflverse-games", status: "ok" } }), now });
  assert.ok(!s.degraded, "a clean published snapshot is fine");
  s = refreshStatus({ snapshotDays: ["2026-11-23"], runs: [], latest: latest("2026-11-21T17:47:00Z", srcs), now });
  assert.ok(s.degraded && /no data-fabric snapshot was written today/.test(s.summary), "refreshed today but the fabric snapshot is from an earlier day: degraded");
  s = refreshStatus({ snapshotDays: ["2026-11-23"], runs: [run("2026-11-23T17:46:00Z")], latest: latest("2026-11-23T17:46:00Z", srcs), now });
  assert.ok(!s.degraded, "today's run report wins over the snapshot when there is one");
});
test("source check: only problems present in both checks count (F30)", async () => {
  const sc = require(path.join(root, "scripts/source-check.js"));
  const a = { at: "2026-11-23T11:41:00Z", down: { "rss-yahoo": "fetch failed", "open-meteo": "timeout" }, contract: ["x", "y"] };
  const b = { at: "2026-11-23T12:01:00Z", down: { "rss-yahoo": "answered 404", "sleeper-trending": "fetch failed" }, contract: ["y", "z"] };   // sleeper and z fail only the second time
  const p = sc.persistentProblems(a, b);
  assert.deepStrictEqual(p, { down: { "rss-yahoo": "answered 404" }, contract: ["y"] }, "the outage that cleared is dropped; the second check's wording is kept");
  assert.ok(sc.hasProblems(p) && !sc.hasProblems(sc.persistentProblems(a, { at: "", down: {}, contract: [] })));
  const shifted = sc.persistentProblems({ down: {}, contract: ["events[12].ts: not ISO"] }, { down: {}, contract: ["events[14].ts: not ISO"] });
  assert.deepStrictEqual(shifted.contract, ["events[14].ts: not ISO"], "the same contract problem at a shifted position still counts");
  const text = sc.report(p, a, b);
  assert.ok(/`rss-yahoo`: answered 404/.test(text) && /contract problems/.test(text) && /11:41:00Z and 2026-11-23T12:01:00Z/.test(text), "the issue text names the source, the error and both check times");
  const once = await sc.checkOnce(createFabric({ scopes: ["public"], cacheDir: null, season: 2026, now: NOW, fetchImpl: fakeFetch(new Set(["yahoo"])) }));
  assert.ok(once.down["rss-yahoo"] && !once.down["nflverse-games"] && Array.isArray(once.contract), "a real check against fake sources finds the failing one");
});
test("line history: observations only when a line changes, opening lines once, kept per source (F23)", () => {
  const L = require(path.join(root, "lib/fabric/lines.js"));
  const t = Date.parse("2026-11-20T12:00:00Z"), iso = (ms) => new Date(ms).toISOString();
  const g = (spread, src = "espn-scoreboard", open = -11.5) => ({ id: "g1", kickoff: "2026-11-22T18:00:00Z", odds: { source: src, provider: "DraftKings", spread: { open, current: spread }, total: { open: 47.5, current: 45.5 }, homeProb: { open: null, current: 0.8 } } });
  let h = L.observeLines(null, [g(-14.5)], () => iso(t), t);
  assert.deepStrictEqual(h.g1.map((o) => [o.at, !!o.open, o.spread]), [[null, true, -11.5], [iso(t), false, -14.5]], "the opening line once, with no time, then the current line");
  h = L.observeLines(h, [g(-14.5)], () => iso(t + 3600e3), t + 3600e3);
  assert.strictEqual(h.g1.length, 2, "an unchanged line adds nothing");
  h = L.observeLines(h, [g(-16.5)], () => iso(t + 7200e3), t + 7200e3);
  assert.deepStrictEqual(h.g1.slice(-1)[0].spread, -16.5);
  h = L.observeLines(h, [{ id: "g1", kickoff: "2026-11-22T18:00:00Z", odds: { source: "nflverse-games", provider: "nflverse (one book)", spread: { open: null, current: -15 }, total: { open: null, current: 45 }, homeProb: { open: null, current: 0.8 } } }], () => iso(t + 7200e3), t + 7200e3);
  assert.strictEqual(h.g1.filter((o) => o.source === "nflverse-games").length, 1, "another source is its own series");
  const mv = L.movesOf(h.g1, "espn-scoreboard");
  assert.ok(mv.length === 2 && mv[0].dSpread === -3 && mv[0].big && mv[1].dSpread === -2 && mv[1].big, "moves between looks; 1.5 points or more is big");
  let many = null; for (let i = 0; i < 80; i++) many = L.observeLines(many, [g(-10 - i * 0.5)], () => iso(t + i * 60e3), t);
  assert.ok(many.g1.length === L.MAX_PER_GAME && many.g1[0].open && many.g1[1].spread === -10 - (80 - L.MAX_PER_GAME + 1) * 0.5, "capped, oldest dropped, the opening line kept");
  assert.deepStrictEqual(L.observeLines(h, [g(-16.5)], () => iso(t), Date.parse("2026-12-10T00:00:00Z")), {}, "dropped some days after kickoff");
  const merged = L.mergeLines({ g1: h.g1.slice(0, 2) }, { g1: h.g1 });
  assert.strictEqual(merged.g1.length, h.g1.length, "merging keeps each observation once");
  assert.ok(merged.g1[0].open, "opening line first");
});
test("line history in the fabric survives a restart and reaches the payload; the contract checks it", async () => {
  const os = require("os"), fs = require("fs");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nflu-lines-"));
  try {
    let csv = GAMES_CSV, t = Date.parse("2026-11-21T12:00:00Z");
    const f = (url) => (String(url).includes("/nfldata/") ? Promise.resolve({ ok: true, status: 200, json: async () => ({}), text: async () => csv }) : fakeFetch()(url));
    const mk = () => createFabric({ scopes: ["public"], cacheDir: dir, season: 2026, now: () => t, fetchImpl: f });
    let u = await mk().universe({ fresh: true });
    const g = u.games.find((x) => x.away === "MIA" && x.home === "BUF");
    assert.ok(u.lines[g.id] && u.lines[g.id].length === 1, "first look: one observation");
    csv = GAMES_CSV.replace("Home,900000002,600,-850,14.5,", "Home,900000002,700,-1000,16.5,"); t += 6 * 3600e3;
    u = await mk().universe({ fresh: true });   // a new fabric on the same folder: a restart
    assert.deepStrictEqual(u.lines[g.id].map((o) => o.spread), [-14.5, -16.5], "the line move is kept across a restart");
    assert.deepStrictEqual(C.validateUniverse(u, T), []);
    assert.deepStrictEqual(C.validatePublicSnapshot(u, T), [], "nflverse lines are public");
    const bad = JSON.parse(JSON.stringify(u)); bad.lines[g.id][0].at = "yesterday"; bad.lines[g.id][1].source = "nowhere";
    assert.ok(C.validateUniverse(bad, T).filter((e) => /^lines\./.test(e)).length === 2, "bad time and unknown source refused");
    const loc = JSON.parse(JSON.stringify(u)); loc.sources["nflverse-games"].scope = "local";
    assert.ok(C.validatePublicSnapshot(loc, T).some((e) => /^lines\..*non-public/.test(e)), "a local source's lines never reach a public snapshot");
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
test("the daily snapshot merges yesterday's line history with today's", async () => {
  const os = require("os"), fs = require("fs");
  const { writeSnapshot } = require(path.join(root, "scripts/fabric-snapshot.js"));
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nflu-snaplines-")), quiet = () => {};
  try {
    let csv = GAMES_CSV;
    const f = (url) => (String(url).includes("/nfldata/") ? Promise.resolve({ ok: true, status: 200, json: async () => ({}), text: async () => csv }) : fakeFetch()(url));
    const t0 = Date.parse("2026-11-21T09:37:00Z"), t1 = t0 + 86400e3 / 4;
    await writeSnapshot({ fabric: createFabric({ scopes: ["public"], cacheDir: null, season: 2026, now: () => t0, fetchImpl: f }), dir, now: () => t0, log: quiet, warn: quiet });
    csv = GAMES_CSV.replace("Home,900000002,600,-850,14.5,", "Home,900000002,700,-1000,16.5,");
    await writeSnapshot({ fabric: createFabric({ scopes: ["public"], cacheDir: null, season: 2026, now: () => t1, fetchImpl: f }), dir, now: () => t1, log: quiet, warn: quiet });
    const snap = JSON.parse(fs.readFileSync(path.join(dir, "latest.json"), "utf8")), g = snap.games.find((x) => x.away === "MIA" && x.home === "BUF");
    assert.deepStrictEqual(snap.lines[g.id].map((o) => o.spread), [-14.5, -16.5], "a fresh runner still publishes the line's history");
    assert.deepStrictEqual(C.validatePublicSnapshot(snap, T), []);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
test("NWS alerts: relevant warnings only, times in UTC, matched to the game's window (F29)", () => {
  const nws = require(path.join(root, "lib/fabric/adapters/nws.js"));
  const al = nws.normalizeAlerts(NWS_FC);
  assert.deepStrictEqual(al.map((x) => x.event), ["Wind Advisory"], "flood advisories, test messages and duplicates dropped");
  assert.ok(al[0].onset === "2026-11-22T15:00:00.000Z" && al[0].ends === "2026-11-23T00:00:00.000Z" && al[0].severity === "Moderate", "local offsets converted to UTC");
  assert.throws(() => nws.normalizeAlerts({ type: "x" }), /not a feature collection/);
  assert.ok(nws.overlapsGame(al[0], "2026-11-22T18:00:00Z") && !nws.overlapsGame(al[0], "2026-11-23T18:00:00Z") && nws.overlapsGame(al[0], "2026-11-23T02:00:00Z"), "in force from 3 h before to 4 h after kickoff");
  assert.ok(/^https:\/\/forecast\.weather\.gov\/MapClick\.php\?lat=42\.7738&lon=-78\.7870$/.test(nws.pageFor(42.7738, -78.787)), "a page a person can read");
});
test("NWS alerts reach the games and the feed, credited; a point abroad is skipped", async () => {
  const u = await createFabric({ scopes: ["public"], cacheDir: null, season: 2026, now: NOW, fetchImpl: fakeFetch() }).universe();
  const buf = u.games.find((g) => g.away === "MIA" && g.home === "BUF");
  assert.ok(buf.alerts && buf.alerts.length === 1 && buf.alerts[0].source === "nws-alerts" && /^https:\/\/forecast\.weather\.gov\//.test(buf.alerts[0].url), "the Bills' game has the wind advisory, with a page to read");
  const ev = u.events.find((e) => e.subtype === "nws-alert" && e.gameId === buf.id);
  assert.ok(ev && ev.type === "weather" && ev.publisher === "National Weather Service" && ev.importance === 50 && ev.ts === "2026-11-21T14:10:00.000Z" && !ev.data.beforeWatch, "a feed item with NWS's own issue time");
  assert.ok(u.sources["nws-alerts"].status === "ok", "a point outside NWS coverage is not a failure");
  assert.deepStrictEqual(C.validateUniverse(u, T), []);
  assert.deepStrictEqual(C.validatePublicSnapshot(u, T), [], "public-domain alerts may be published");
  const bad = JSON.parse(JSON.stringify(u)), bg = bad.games.find((g) => g.alerts);
  bg.alerts[0].severity = "Catastrophic"; bg.alerts[0].url = "http://x";
  assert.ok(C.validateUniverse(bad, T).filter((e) => /alerts\[0\]/.test(e)).length === 2, "bad severity and a non-https link refused");
});
// The Odds API (v4 shape, invented prices): three books on MIA at BUF, a game already under way, an unknown team
const ODDS_BOOK = (key, title, hML, aML, hSp, tot) => ({ key, title, last_update: "2026-11-21T15:40:00Z", markets: [
  { key: "h2h", last_update: "2026-11-21T15:40:00Z", outcomes: [{ name: "Buffalo Bills", price: hML }, { name: "Miami Dolphins", price: aML }] },
  { key: "spreads", last_update: "2026-11-21T15:41:00Z", outcomes: [{ name: "Buffalo Bills", price: -110, point: hSp }, { name: "Miami Dolphins", price: -110, point: -hSp }] },
  { key: "totals", last_update: "2026-11-21T15:42:00Z", outcomes: [{ name: "Over", price: -110, point: tot }, { name: "Under", price: -110, point: tot }] }] });
const ODDS_FC = [
  { id: "e1", sport_key: "americanfootball_nfl", commence_time: "2026-11-22T18:00:00Z", home_team: "Buffalo Bills", away_team: "Miami Dolphins",
    bookmakers: [ODDS_BOOK("draftkings", "DraftKings", -800, 550, -14.5, 44.5), ODDS_BOOK("fanduel", "FanDuel", -900, 600, -14, 45), ODDS_BOOK("betmgm", "BetMGM", -750, 525, -14.5, 44.5)] },
  { id: "e2", sport_key: "americanfootball_nfl", commence_time: "2026-11-21T15:00:00Z", home_team: "Houston Texans", away_team: "Indianapolis Colts", bookmakers: [ODDS_BOOK("draftkings", "DraftKings", -300, 250, -7, 40)] },
  { id: "e3", sport_key: "americanfootball_nfl", commence_time: "2026-11-23T18:00:00Z", home_team: "Springfield Atoms", away_team: "Miami Dolphins", bookmakers: [ODDS_BOOK("draftkings", "DraftKings", -110, -110, 0, 40)] },
];
const ODDS_KEY = "fixture-key-0123456789";
// fakeFetch plus The Odds API: records each call's URL and key header; answers with `status` and `remaining` credits
function oddsFetch(calls, { status = 200, remaining = 497, throwWith = null } = {}) {
  const base = fakeFetch();
  return async (url, o) => {
    if (!String(url).includes("api.the-odds-api.com")) return base(url, o);
    calls.push({ url: String(url), key: o && o.headers ? o.headers["x-api-key"] : null });
    if (throwWith) throw new Error(throwWith);
    const headers = new Map([["x-requests-remaining", String(remaining)], ["x-requests-used", String(500 - remaining)], ["x-requests-last", "3"]]);
    return { ok: status === 200, status, headers, json: async () => ODDS_FC, text: async () => JSON.stringify(ODDS_FC) };
  };
}
test("The Odds API: consensus is the median across books, margin removed; games under way and unknown teams left out", () => {
  const oa = require(path.join(root, "lib/fabric/adapters/oddsapi.js"));
  assert.ok(Math.abs(oa.implied(-800) - 800 / 900) < 1e-9 && Math.abs(oa.implied(550) - 100 / 650) < 1e-9 && oa.implied(50) === null && oa.implied("x") === null, "American prices to chances");
  const r = oa.normalizeOdds(ODDS_FC, NOW());
  assert.strictEqual(r.games.length, 1, "the game under way is not taken (live odds are a different thing)");
  assert.strictEqual(r.unmatched, 1, "an unknown team is counted, not guessed");
  const g = r.games[0];
  assert.ok(g.home === "BUF" && g.away === "MIA" && g.books.length === 3);
  assert.deepStrictEqual(g.books.map((b) => b.homeProb), [0.852, 0.863, 0.847], "each book's no-vig home chance");
  assert.deepStrictEqual([g.consensus.books, g.consensus.spread, g.consensus.total, g.consensus.homeProb], [3, -14.5, 44.5, 0.852], "medians");
  assert.strictEqual(g.consensus.lastUpdate, "2026-11-21T15:42:00.000Z");
  assert.ok(!/apiKey|key=/i.test(oa.oddsUrl(NOW())) && /markets=h2h,spreads,totals/.test(oa.oddsUrl(NOW())) && /commenceTimeFrom=2026-11-21T16:00:00Z/.test(oa.oddsUrl(NOW())), "no key in the URL; three markets; from now on");
  assert.strictEqual(oa.CREDITS_PER_CALL, 3);
  assert.ok(oa.budgetAllows(null, NOW()) && oa.budgetAllows({ remaining: 15, month: "2026-11" }, NOW()) && !oa.budgetAllows({ remaining: 14, month: "2026-11" }, NOW()) && oa.budgetAllows({ remaining: 0, month: "2026-10" }, NOW()), "the floor holds for the rest of the month only");
  assert.deepStrictEqual(oa.normalizeOdds({ message: "x" }, NOW()), { games: [], unmatched: 0 }, "an error object is no games");
});
test("The Odds API reaches the games and the line history; each book only on the local server", async () => {
  const calls = [];
  const u = await createFabric({ scopes: ["public"], cacheDir: null, season: 2026, now: NOW, fetchImpl: oddsFetch(calls), oddsApiKey: ODDS_KEY }).universe();
  assert.strictEqual(calls.length, 1);
  assert.ok(calls[0].key === ODDS_KEY && !calls[0].url.includes(ODDS_KEY), "the key goes in a header, never in the URL");
  const buf = u.games.find((g) => g.away === "MIA" && g.home === "BUF");
  assert.ok(buf.market && buf.market.source === "odds-api" && buf.market.books === 3 && buf.market.spread === -14.5 && buf.market.homeProb === 0.852 && buf.market.at === "2026-11-21T16:00:00.000Z");
  assert.ok(!buf.books, "no book's own prices in a public payload");
  assert.ok((u.lines[buf.id] || []).some((o) => o.source === "odds-api" && o.spread === -14.5 && o.at === "2026-11-21T16:00:00.000Z"), "the consensus enters the line history");
  assert.ok(u.sources["odds-api"].status === "ok" && u.sources["odds-api"].scope === "public" && /^497 credits left this month \(3 a look\); 1 games with team names not recognised$/.test(u.sources["odds-api"].note));
  assert.ok(!JSON.stringify(u).includes(ODDS_KEY), "the key is nowhere in the payload");
  assert.deepStrictEqual(C.validateUniverse(u, T), []);
  assert.deepStrictEqual(C.validatePublicSnapshot(u, T), [], "the consensus may be published");
  const lu = await createFabric({ scopes: ["public", "local"], cacheDir: null, season: 2026, now: NOW, fetchImpl: oddsFetch([]), oddsApiKey: ODDS_KEY }).universe();
  const lb = lu.games.find((g) => g.away === "MIA" && g.home === "BUF");
  assert.ok(lb.books && lb.books.length === 3 && lb.books[1].title === "FanDuel" && lb.books[1].homePrice === -900 && lb.books[1].spread === -14, "each book on the local server");
  assert.deepStrictEqual(C.validateUniverse(lu, T), []);
  const pubCopy = JSON.parse(JSON.stringify(u)); pubCopy.games.find((g) => g.home === "BUF").books = lb.books;
  assert.ok(C.validatePublicSnapshot(pubCopy, T).some((e) => /books: each sportsbook's prices stay on the local server/.test(e)), "a public snapshot with any book's prices is refused");
  const bad = JSON.parse(JSON.stringify(lu)), bg = bad.games.find((g) => g.market);
  bg.market.books = 0; bg.market.homeProb = 2; bg.books[0].spread = "x";
  assert.strictEqual(C.validateUniverse(bad, T).filter((e) => /market|books/.test(e)).length, 3, "bad count, chance and spread refused");
});
test("The Odds API: off without a key, never called; a refusal and a thrown error never carry the key", async () => {
  const calls = [];
  const u = await createFabric({ scopes: ["public"], cacheDir: null, season: 2026, now: NOW, fetchImpl: oddsFetch(calls), oddsApiKey: "" }).universe();
  assert.strictEqual(calls.length, 0, "no key, no call");
  assert.ok(u.sources["odds-api"].status === "disabled" && /off/.test(u.sources["odds-api"].label) && /ODDS_API_KEY/.test(u.sources["odds-api"].note));
  assert.ok(!u.games.some((g) => g.market), "no consensus without the source");
  const u401 = await createFabric({ scopes: ["public"], cacheDir: null, season: 2026, now: NOW, fetchImpl: oddsFetch([], { status: 401 }), oddsApiKey: ODDS_KEY }).universe();
  assert.ok(u401.sources["odds-api"].status === "down" && /key refused or credits used up \(401\)/.test(u401.sources["odds-api"].lastError));
  const uThrow = await createFabric({ scopes: ["public"], cacheDir: null, season: 2026, now: NOW, fetchImpl: oddsFetch([], { throwWith: "fetch failed for " + ODDS_KEY }), oddsApiKey: ODDS_KEY }).universe();
  assert.ok(uThrow.sources["odds-api"].lastError === "fetch failed for [key]", "the key is scrubbed from error text");
  assert.ok(!JSON.stringify(u401).includes(ODDS_KEY) && !JSON.stringify(uThrow).includes(ODDS_KEY));
});
test("The Odds API keeps a credit floor until the next month", async () => {
  const os = require("os"), fs = require("fs");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nflu-odds-"));
  try {
    let t = NOW(); const calls = [];
    const fab = () => createFabric({ scopes: ["public"], cacheDir: dir, season: 2026, now: () => t, fetchImpl: oddsFetch(calls, { remaining: 12 }), oddsApiKey: ODDS_KEY });
    await fab().universe({ fresh: true });
    assert.strictEqual(calls.length, 1);
    assert.ok(!fs.readdirSync(path.join(dir, "public")).some((f) => fs.readFileSync(path.join(dir, "public", f), "utf8").includes(ODDS_KEY)), "the key is in no cache file");
    t += 12 * 3600000;   // past the 11-hour minimum interval
    const u = await fab().universe({ fresh: true });
    assert.strictEqual(calls.length, 1, "below the floor: no call this month");
    assert.ok(u.sources["odds-api"].status === "stale" && /credit floor reached: 12 left/.test(u.sources["odds-api"].lastError) && u.games.some((g) => g.market), "the last consensus is kept, shown stale");
    t = Date.parse("2026-12-01T12:00:00Z");
    await fab().universe({ fresh: true });
    assert.strictEqual(calls.length, 2, "a new month: one call to find out");
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
test("a source's minimum interval holds even when fresh data is asked for", async () => {
  let calls = 0, t = 1e12;
  const src = createSource({ id: "paid", label: "x", ttlMs: 60000, minIntervalMs: 11 * 3600000, load: async () => { calls++; return { games: [calls] }; } });
  await src.get({ now: t, force: true }); t += 3 * 3600000;
  const second = await src.get({ now: t, force: true });
  assert.ok(calls === 1 && second.mode === "cached" && second.data.games[0] === 1, "three hours later, asked for fresh data: the last look is served");
  t += 9 * 3600000; await src.get({ now: t, force: true });
  assert.strictEqual(calls, 2, "after the interval it looks again");
  let n2 = 0; const p2 = createSource({ id: "free2", label: "x", ttlMs: 60000, load: async () => { n2++; return { games: [] }; } });
  await p2.get({ now: t, force: true }); await p2.get({ now: t + 1000, force: true });
  assert.strictEqual(n2, 2, "without one, fresh means fresh");
});
test("The Odds API on GitHub: one look per 11 hours across runs, and no book's prices in a public run's cache", async () => {
  const os = require("os"), fs = require("fs");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nflu-oddscache-"));
  try {
    let t = NOW(); const calls = [];
    const run = () => createFabric({ scopes: ["public"], cacheDir: dir, season: 2026, now: () => t, fetchImpl: oddsFetch(calls), oddsApiKey: ODDS_KEY }).universe({ fresh: true });
    const u1 = await run();
    const cached = JSON.parse(fs.readFileSync(path.join(dir, "public", "odds-api.json"), "utf8"));
    assert.ok(cached.data.games.length === 1 && cached.data.games.every((g) => Array.isArray(g.books) && g.books.length === 0) && cached.data.games[0].consensus.books === 3,
      "the public cache keeps the consensus only");
    assert.ok(!fs.readFileSync(path.join(dir, "public", "odds-api.json"), "utf8").includes("-900") && !JSON.stringify(u1).includes("FanDuel"), "no book's price or name anywhere public");
    t += 3 * 3600000;
    const u2 = await run();
    assert.strictEqual(calls.length, 1, "a run three hours later (a new process, the cache restored) does not call again");
    assert.ok(u2.sources["odds-api"].status === "ok" && u2.games.find((g) => g.home === "BUF").market.at === u1.games.find((g) => g.home === "BUF").market.at, "and still carries the last look, with its own time");
    t += 9 * 3600000; await run();
    assert.strictEqual(calls.length, 2, "after 11 hours it looks again");
    const lu = await createFabric({ scopes: ["public", "local"], cacheDir: dir, season: 2026, now: () => t, fetchImpl: oddsFetch([]), oddsApiKey: ODDS_KEY }).universe();
    assert.ok(lu.games.find((g) => g.home === "BUF").books.length === 3, "the local server still lists each book");
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
test("the snapshot carries a failed Odds API's consensus for games not yet started, never a book's prices", () => {
  const { carryForward } = require(path.join(root, "lib/fabric/carry.js"));
  const src = (status, lastOk) => ({ id: "odds-api", label: "x", tier: 2, scope: "public", status, breaker: "closed", lastOk, lastError: null, ageSec: 0, latencyMs: 1, fails: status === "down" ? 2 : 0, records: 1, maxStaleSec: 1 });
  const mk = { source: "odds-api", provider: "The Odds API", at: "2026-11-21T16:00:00.000Z", books: 3, spread: -14.5, total: 44.5, homeProb: 0.852, lastUpdate: null };
  const prev = { generatedAt: "2026-11-21T16:00:00Z", sources: { "odds-api": src("ok", "2026-11-21T16:00:00.000Z") }, games: [{ id: "a", market: mk }, { id: "b", market: mk }], events: [] };
  const next = { sources: { "odds-api": src("down", null) }, games: [{ id: "a", state: "pre" }, { id: "b", state: "in" }], events: [] };
  const { u, carried } = carryForward(prev, next, Date.parse("2026-11-22T16:00:00Z"));
  assert.deepStrictEqual(carried, ["odds-api"]);
  assert.ok(u.games[0].market && u.games[0].market.spread === -14.5 && !u.games[1].market, "a game under way does not get an old pregame line");
  assert.ok(u.sources["odds-api"].status === "stale" && u.sources["odds-api"].carriedFrom === "2026-11-21T16:00:00Z");
});
test("NFL TV: team press sessions, then the league's newest videos, that may be embedded; kept in the snapshot; refusals left out (DEC-022)", async () => {
  const calls = [], base = fakeFetch();
  const u = await createFabric({ scopes: ["public"], cacheDir: null, season: 2026, now: NOW, fetchImpl: async (url, o) => { if (String(url).includes("/oembed")) calls.push(String(url)); return base(url, o); } }).universe();
  assert.deepStrictEqual(u.media.reel, ["bbbbbbbbbb1", "aaaaaaaaaa1"], "the Bills' press conference first, then the league's highlight; the preview with embedding off is left out");
  assert.ok(calls.length === 3 && calls.every((c) => c.startsWith("https://www.youtube.com/oembed?format=json&url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3D")), "the press conference and the league channel's two valid videos were checked, by oEmbed; the team's Short was not");
  assert.ok(u.sources["youtube-reel"].status === "ok" && u.sources["youtube-reel"].records === 2 && /^1 of the 3 videos picked do not allow embedding$/.test(u.sources["youtube-reel"].note));
  assert.deepStrictEqual(C.validatePublicSnapshot(u, T), []);
  const media = require(path.join(root, "lib/fabric/adapters/media.js"));
  const many = Array.from({ length: 12 }, (_, k) => ({ videoId: "cccccccccc" + String.fromCharCode(97 + k), channelId: "UCDVYQ4Zhbm3S2dlz7P1GBDg", kind: k === 11 ? "short" : "video", published: new Date(Date.UTC(2026, 10, 1 + k)).toISOString() }))
    .concat([{ videoId: "dddddddddd1", channelId: "UCother0000000000000000", kind: "video", published: "2026-11-30T00:00:00Z" }]);
  const LG = "UCDVYQ4Zhbm3S2dlz7P1GBDg", ids = (list) => list.map((v) => v.videoId);
  const P = (id, team, day, kind = "press") => ({ videoId: id, channelId: "UC" + team.padEnd(22, "0"), team, kind, published: new Date(Date.UTC(2026, 10, day, 12)).toISOString() });
  const mix = many.concat([P("ddddddddd01", "BUF", 20), P("ddddddddd02", "BUF", 21), P("ddddddddd03", "BUF", 22), P("ddddddddd04", "MIA", 19),
    P("ddddddddd05", "MIA", 23, "highlights"), P("ddddddddd06", "MIA", 24, "short"), Object.assign(P("ddddddddd07", "NYJ", 25), { team: null })]);
  assert.deepStrictEqual(ids(media.reelCandidates(mix, LG)), ["ddddddddd03", "ddddddddd02", "ddddddddd04", "cccccccccck", "ccccccccccj"],
    "press sessions newest first, at most two a team, no highlights, Shorts or teamless videos; then the league's two newest videos (its newest, a Short, left out)");
  const crowd = ["BUF", "MIA", "NYJ", "NE", "KC", "DEN", "LV"].flatMap((tm, k) => [P("e" + tm.padEnd(9, "x") + "1", tm, 10 + k), P("e" + tm.padEnd(9, "x") + "2", tm, 10 + k)]);
  const full = media.reelCandidates(many.concat(crowd), LG);
  assert.ok(full.length === 12 && full.slice(0, 10).every((v) => v.kind === "press") && ids(full.slice(10)).join() === "cccccccccck,ccccccccccj", "twelve at most: ten press sessions, then two league videos");
  const soon = Object.assign(P("dddddddddup", "KC", 26), { upcoming: true });
  assert.deepStrictEqual(ids(media.reelCandidates(mix.concat([soon]), LG)), ["ddddddddd03", "ddddddddd02", "ddddddddd04", "cccccccccck", "ccccccccccj", "dddddddddup"],
    "a press session with no views yet (a live stream not begun) goes last, even though it is the newest");
  assert.ok(!ids(media.reelCandidates(many.concat(crowd, [soon]), LG)).includes("dddddddddup") && media.reelCandidates(many.concat(crowd, [soon]), LG).length === 12,
    "with a full reel, a press session not begun gives way to one that has");
  const buried = Array.from({ length: 8 }, (_, k) => P("f" + String(k).padStart(10, "0"), "KC", 20 + k, "video")).concat([P("fpressold01", "KC", 5)]);
  assert.deepStrictEqual(media.reelCandidates(buried, LG), [], "a press session older than its channel's newest eight is not in the media block, so it is not a candidate");
  assert.deepStrictEqual(ids(media.reelCandidates([P("gdupdupdup1", "KC", 9), P("gdupdupdup1", "KC", 9)], LG)), ["gdupdupdup1"], "a video found twice is a candidate once");
  const snap = media.snapshotMedia({ channels: [], podcasts: [], reel: ["ccccccccccb"], videos: many.slice(0, 12).map((v) => Object.assign({}, v, { title: "t" })) });
  assert.ok(snap.videos.some((v) => v.videoId === "ccccccccccb") && snap.videos.length === 5, "the snapshot keeps 3 videos and 1 Short per channel, plus any reel video");
  const bad = JSON.parse(JSON.stringify(u)); bad.media.reel = ["aaaaaaaaaa1", "aaaaaaaaaa1", "zzzzzzzzzzz"];
  assert.strictEqual(C.validateUniverse(bad, T).filter((e) => /^media\.reel/.test(e)).length, 2, "a repeated id and an id not among the videos are refused");
  assert.deepStrictEqual(C.cleanMedia(bad.media).reel, ["aaaaaaaaaa1"], "and cleaned away at the boundary");
  const { carryForward } = require(path.join(root, "lib/fabric/carry.js"));
  const down = JSON.parse(JSON.stringify(u)); down.sources["youtube-reel"] = Object.assign({}, down.sources["youtube-reel"], { status: "down", lastOk: null }); down.media.reel = [];
  const kept = carryForward(u, down, NOW() + 3600000);
  assert.ok(kept.carried.includes("youtube-reel") && kept.u.media.reel.join() === "bbbbbbbbbb1,aaaaaaaaaa1" && kept.u.sources["youtube-reel"].status === "stale", "a failed check keeps the last reel, shown stale");
});
test("NFL TV: each video is checked once, and the reel follows the current feed", async () => {
  const os = require("os"), fs = require("fs");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nflu-reel-"));
  try {
    let t = NOW(), feed = YT_NFL; const calls = [], base = fakeFetch();
    const fetchImpl = async (url, o) => {
      if (String(url).includes("/oembed")) calls.push(new URL(new URL(String(url)).searchParams.get("url")).searchParams.get("v"));
      if (String(url).includes("UCDVYQ4Zhbm3S2dlz7P1GBDg")) return { ok: true, status: 200, json: async () => null, text: async () => feed };
      return base(url, o);
    };
    const run = () => createFabric({ scopes: ["public"], cacheDir: dir, season: 2026, now: () => t, fetchImpl }).universe({ fresh: true });
    const u1 = await run();
    assert.deepStrictEqual([u1.media.reel, calls.slice().sort()], [["bbbbbbbbbb1", "aaaaaaaaaa1"], ["aaaaaaaaaa1", "aaaaaaaaaa2", "bbbbbbbbbb1"]]);
    // an hour later a new league video is out: only it is checked, and the reel is built from the feed as it is now
    feed = YT_ATOM("NFL", [["aaaaaaaaaa3", "Bengals vs. Commanders Highlights | Week 11", "2026-11-21T17:00:00+00:00"], ["aaaaaaaaaa1", "Dolphins vs. Bills Highlights | Week 11", "2026-11-21T15:00:00+00:00"]]);
    t += 3600000; calls.length = 0;
    const u2 = await run();
    assert.deepStrictEqual(calls, ["aaaaaaaaaa3"], "the video already answered for is not checked again");
    assert.deepStrictEqual(u2.media.reel, ["bbbbbbbbbb1", "aaaaaaaaaa3", "aaaaaaaaaa1"], "the press session, then the league's newest first; the video gone from the feed is gone from the reel");
    assert.deepStrictEqual(C.validatePublicSnapshot(u2, T), []);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
test("the contract checks the fantasy block", () => {
  const ok = { v: 1, generatedAt: "2026-11-22T00:00:00Z", season: 2026, week: 11, seasonType: "regular", sources: { "sleeper-trending": { id: "sleeper-trending", label: "x", tier: 2, scope: "public", status: "ok", breaker: "closed", lastOk: null, lastError: null, ageSec: 0, latencyMs: 1, fails: 0, records: 1, maxStaleSec: 1 } },
    games: [], events: [], injuries: {}, transactions: [], fantasy: { source: "sleeper-trending", lookbackHours: 24, week: 11, adds: [{ name: "A", team: "NYG", pos: "QB", count: 5, sleeperId: "1" }], drops: [], unmatched: { adds: 0, drops: 0 } } };
  const errsFor = (patch) => C.validateUniverse(Object.assign({}, ok, { fantasy: Object.assign({}, ok.fantasy, patch) }), T).filter((e) => /fantasy/.test(e));
  assert.deepStrictEqual(errsFor({}), []);
  assert.ok(errsFor({ adds: [{ name: "A", team: "XXX", count: 5, sleeperId: "1" }] }).length, "unknown team");
  assert.ok(errsFor({ adds: [{ name: "", team: "NYG", count: -1, sleeperId: "" }] }).length >= 3, "empty name, negative count, no id");
  assert.ok(errsFor({ source: "nowhere" }).length && errsFor({ unmatched: null }).length && errsFor({ lookbackHours: 0 }).length && errsFor({ drops: "x" }).length);
  const loc = JSON.parse(JSON.stringify(ok)); loc.sources["sleeper-trending"].scope = "local";
  assert.ok(C.validatePublicSnapshot(loc, T).some((e) => /^fantasy: from non-public/.test(e)), "a local fantasy source never reaches a public snapshot");
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
test("items with no time of their own that were there at a fresh start are marked, not shown as new", async () => {
  const os = require("os"), fs = require("fs");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nflu-watch-"));
  try {
    const t0 = Date.parse("2026-11-22T17:00:00Z"), start = new Date(t0).toISOString();
    let t = t0, extra = "";
    const f = (url) => (new URL(url).host.includes("yahoo") ? Promise.resolve({ ok: true, status: 200, json: async () => ({}), text: async () => RSS.replace("</channel>", extra + "</channel>") }) : fakeFetch()(url));
    const fab = createFabric({ scopes: ["public", "local"], cacheDir: dir, season: 2026, now: () => t, fetchImpl: f });
    let u = await fab.universe({ fresh: true });
    assert.deepStrictEqual(C.validateUniverse(u, T), []);
    const marked = u.events.filter((e) => e.data.beforeWatch);
    assert.ok(marked.some((e) => e.url === "https://example.com/b"), "a headline with no time, first seen at the start, is marked");
    assert.ok(marked.some((e) => e.type === "injury"), "an injury status with no time, there at the start, is marked");
    assert.ok(marked.every((e) => e.data.beforeWatch === start && e.type !== "game"), "marked with the start of watching; game events never");
    assert.ok(u.events.some((e) => e.type === "news" && !e.data.beforeWatch), "headlines with a publication time are not marked");
    const k = u.events.findIndex((e) => e.data.beforeWatch);
    assert.ok(k > 0 && u.events.slice(k).every((e) => e.data.beforeWatch), "every marked item comes after every item with a real time");
    // two hours later a new headline with no time appears: it is new, not part of the backlog
    t += 2 * 3600000; extra = "<item><title>Fixture club signs a kicker</title><link>https://example.com/late</link></item>";
    u = await fab.universe({ fresh: true });
    const late = u.events.find((e) => e.url === "https://example.com/late");
    assert.ok(late && !late.data.beforeWatch && Date.parse(late.ts) === t, "an item first seen later keeps its first-seen time and no mark");
    // the marks survive a restart
    const again = createFabric({ scopes: ["public", "local"], cacheDir: dir, season: 2026, now: () => t + 60000, fetchImpl: f });
    u = await again.universe({ fresh: true });
    assert.strictEqual(u.events.find((e) => e.url === "https://example.com/b").data.beforeWatch, start);
    assert.ok(!u.events.find((e) => e.url === "https://example.com/late").data.beforeWatch);
    // a folder saved before the marks existed: its earliest first-seen time is taken as the start
    const sf = path.join(again.cacheDir, "state.json"), s = JSON.parse(fs.readFileSync(sf, "utf8"));
    delete s.firstData; fs.writeFileSync(sf, JSON.stringify(s));
    const old = createFabric({ scopes: ["public", "local"], cacheDir: dir, season: 2026, now: () => t + 120000, fetchImpl: f });
    u = await old.universe({ fresh: true });
    assert.strictEqual(u.events.find((e) => e.url === "https://example.com/b").data.beforeWatch, start);
    assert.ok(!u.events.find((e) => e.url === "https://example.com/late").data.beforeWatch);
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
  assert.strictEqual(u.sources["odds-api"].status, "disabled", "no key: off, not down");
  const net = Object.values(u.sources).filter((s) => !["curated-news", "open-meteo", "nws-alerts", "odds-api", "youtube-reel"].includes(s.id));   // weather and NFL TV depend on other sources
  assert.ok(/unavailable/i.test(u.sources["youtube-reel"].note || "") && u.media && (u.media.reel || []).length === 0, "NFL TV says why it has nothing");
  assert.ok(net.length >= 8 && net.every((s) => s.status === "down"), "every network source reports down");
  assert.strictEqual(u.sources["open-meteo"].records, 0); assert.ok(/unavailable/i.test(u.sources["open-meteo"].note || ""), "weather says why it has nothing");
  assert.ok(/unavailable/i.test(u.sources["nws-alerts"].note || "") && !u.games.some((g) => g.alerts), "NWS alerts say why they have nothing");
  assert.strictEqual(u.sources["curated-news"].status, "ok", "the local file still reads"); assert.strictEqual(u.games.length, 0);
});
test("server routes answer, validate ids and refuse path tricks", async () => {
  const srv = require(path.join(root, "server.js"));
  srv.setFabric(createFabric({ scopes: ["public", "local"], cacheDir: null, season: 2026, now: NOW, fetchImpl: fakeFetch() }));
  await new Promise((ok) => srv.server.listen(0, "127.0.0.1", ok));
  const base = "http://127.0.0.1:" + srv.server.address().port;
  const http = require("http");
  const get = (p) => new Promise((ok, bad) => http.get(base + p, (res) => { let b = ""; res.on("data", (c) => (b += c)); res.on("end", () => ok({ status: res.statusCode, body: b, type: res.headers["content-type"], csp: res.headers["content-security-policy"] })); }).on("error", bad));
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
    // the page's Content-Security-Policy allows exactly its own inline scripts, by hash
    const crypto = require("crypto"), inline = [...r.body.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => "'sha256-" + crypto.createHash("sha256").update(m[1], "utf8").digest("base64") + "'");
    assert.ok(inline.length === 3 && inline.every((h) => r.csp.includes(h)), "every inline script of the page is allowed by its hash");
    assert.ok(!/unsafe-inline[^;]*;/.test(r.csp.split("script-src")[1].split(";")[0] + ";") && !/unsafe-eval/.test(r.csp), "no unsafe-inline or unsafe-eval for scripts");
    assert.ok(/object-src 'none'/.test(r.csp) && /worker-src 'self' blob:/.test(r.csp) && /frame-src https:\/\/www\.youtube-nocookie\.com/.test(r.csp), "plugins off; the simulation worker and YouTube's player allowed");
    assert.ok(!(await get("/api/health")).csp, "JSON answers carry no page policy");
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
test("static files: only inside public/, never a sibling folder", () => {
  const srv = require(path.join(root, "server.js")), pub = path.join(root, "public");
  assert.strictEqual(srv.publicFile("/"), path.join(pub, "index.html"));
  assert.strictEqual(srv.publicFile("/index.html"), path.join(pub, "index.html"));
  assert.strictEqual(srv.publicFile("/x/../../public-old/secret.txt"), null, "a sibling whose name starts with public/ is outside");
  assert.strictEqual(srv.publicFile("/../server.js"), null);
});
test("the daily refresh starts the data fetch itself and waits for it (DEC-023)", async () => {
  const R = require(path.join(root, "scripts/request-fetch.js")), os = require("os"), fs = require("fs"), { execFileSync } = require("child_process");
  const at = Date.parse("2026-11-26T09:35:00Z"), snap = (iso) => JSON.stringify({ generatedAt: iso });
  assert.deepStrictEqual([R.madeAfter(snap("2026-11-26T09:37:00Z"), at), R.madeAfter(snap("2026-11-26T09:34:30Z"), at), R.madeAfter(snap("2026-11-26T09:30:00Z"), at), R.madeAfter("not json", at), R.madeAfter(snap("x"), at)],
    [true, true, false, false, false], "a snapshot made after the request (a minute's clock skew allowed); anything unclear is not fresh");
  for (const f of ["data-fetch", "fantasypros"]) {
    const wf = fs.readFileSync(path.join(root, ".github/workflows/" + f + ".yml"), "utf8");
    assert.ok(/on:\n  push:\n    branches: \[main\]\n    paths: \[data\/fabric\/fetch-request\.json\]/.test(wf) && /github\.ref == 'refs\/heads\/main'/.test(wf), f + ": started by a pushed request on main, and runs only from main");
  }
  assert.ok(/for attempt in 1 2 3; do/.test(fs.readFileSync(path.join(root, ".github/workflows/fantasypros.yml"), "utf8")), "FantasyPros retries a push that races the data fetch");
  // end to end against a local stand-in for GitHub: a bare repository, the refresh's clone, and a clone playing the data fetch
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nflu-req-"));
  const g = (cwd, ...a) => execFileSync("git", a, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  const ident = (cwd) => { g(cwd, "config", "user.name", "t"); g(cwd, "config", "user.email", "t@example.com"); g(cwd, "config", "commit.gpgsign", "false"); };
  try {
    const bare = path.join(dir, "origin.git"), work = path.join(dir, "work"), hub = path.join(dir, "hub");
    g(dir, "init", "--quiet", "--bare", "-b", "main", bare);
    g(dir, "clone", "--quiet", bare, work); ident(work);
    fs.mkdirSync(path.join(work, "data/fabric"), { recursive: true });
    fs.writeFileSync(path.join(work, "data/fabric/latest.json"), snap("2026-11-25T17:20:00Z"));
    fs.writeFileSync(path.join(work, "news.json"), "{}\n");
    g(work, "add", "-A"); g(work, "commit", "--quiet", "-m", "start"); g(work, "push", "--quiet", "origin", "HEAD:main");
    g(dir, "clone", "--quiet", bare, hub); ident(hub);
    fs.writeFileSync(path.join(work, "news.json"), "{\"items\": [1]}\n");   // the refresh's news edit, not yet committed
    let now = at, fetchedAfterRequest = false;
    const github = (async () => {   // the data fetch: starts once the request is on main, commits a new snapshot
      for (let k = 0; k < 200; k++) {
        await new Promise((ok) => setTimeout(ok, 25));
        g(hub, "fetch", "--quiet", "origin", "main");
        if (g(hub, "log", "-1", "--format=%s", "origin/main") !== "Request a data fetch") continue;
        g(hub, "reset", "--quiet", "--hard", "origin/main");
        fs.writeFileSync(path.join(hub, "data/fabric/latest.json"), snap("2026-11-26T09:36:10Z"));
        g(hub, "commit", "--quiet", "-am", "Data fetch (GitHub Actions)"); g(hub, "push", "--quiet", "origin", "HEAD:main");
        fetchedAfterRequest = true; return;
      }
    })();
    const opts = { cwd: work, now: () => (now += 50), log: () => {}, env: {} };
    const out = await R.main(["--timeout-sec", "30", "--every-sec", "0.05"], opts);
    await github;
    assert.deepStrictEqual(out, { requested: true, fresh: true }, "requested, and the fresh snapshot arrived");
    assert.ok(fetchedAfterRequest && JSON.parse(fs.readFileSync(path.join(work, "data/fabric/latest.json"), "utf8")).generatedAt === "2026-11-26T09:36:10Z", "the clone now has GitHub's new snapshot");
    assert.strictEqual(fs.readFileSync(path.join(work, "news.json"), "utf8"), "{\"items\": [1]}\n", "the refresh's own edit is untouched");
    assert.deepStrictEqual(g(bare, "show", "--name-only", "--format=%s", "main~1").split("\n"), ["Request a data fetch", "", "data/fabric/fetch-request.json"], "the request commit holds the request file only");
    // an hour later nothing arrives: it gives up after the timeout, without failing
    now += 3600e3;
    const late = await R.main(["--timeout-sec", "0.2", "--every-sec", "0.05"], opts);
    assert.deepStrictEqual(late, { requested: true, fresh: false }, "no snapshot in time: the refresh goes on");
    const commits = () => g(bare, "rev-list", "--count", "main");
    // the guards used by npm run refresh
    let n0;
    g(hub, "fetch", "--quiet", "origin", "main"); g(hub, "reset", "--quiet", "--hard", "origin/main");
    fs.writeFileSync(path.join(hub, "data/fabric/latest.json"), snap(new Date(now).toISOString()));   // GitHub has just fetched
    g(hub, "commit", "--quiet", "-am", "Data fetch (GitHub Actions)"); g(hub, "push", "--quiet", "origin", "HEAD:main");
    n0 = commits();
    const fresh = await R.main(["--if-stale", "8", "--timeout-sec", "0.2", "--every-sec", "0.05"], opts);
    assert.deepStrictEqual([fresh.requested, fresh.fresh, fresh.skipped, commits()], [false, true, "fresh", n0], "main already has a recent snapshot: no request");
    assert.strictEqual(JSON.parse(fs.readFileSync(path.join(work, "data/fabric/latest.json"), "utf8")).generatedAt, new Date(Date.parse(JSON.parse(g(bare, "show", "main:data/fabric/latest.json")).generatedAt)).toISOString(),
      "and the checkout is brought up to it, so the refresh keeps it");
    now += 9 * 3600e3;   // nine hours on, the snapshot is stale again
    const onGitHub = await R.main(["--if-stale", "8", "--timeout-sec", "0.2", "--every-sec", "0.05"], Object.assign({}, opts, { env: { GITHUB_ACTIONS: "true" } }));
    const off = await R.main(["--if-stale", "8"], Object.assign({}, opts, { env: { NFLU_FETCH_REQUEST: "0" } }));
    assert.deepStrictEqual([onGitHub.skipped, off.skipped, commits()], ["github", "off", n0], "never on GitHub Actions (the backup refresh fetches itself), nor when turned off");
    fs.writeFileSync(path.join(work, "local.txt"), "x"); g(work, "add", "local.txt"); g(work, "commit", "--quiet", "-m", "local work");
    const ahead = await R.main(["--if-stale", "8", "--timeout-sec", "0.2", "--every-sec", "0.05"], opts);
    assert.deepStrictEqual([ahead.skipped, commits(), g(work, "log", "-1", "--format=%s")], ["local-commits", n0, "local work"], "a checkout with commits not on GitHub pushes nothing and is left as it is");
    g(work, "reset", "--quiet", "--hard", "HEAD~1");
    const stale = await R.main(["--if-stale", "8", "--timeout-sec", "0.2", "--every-sec", "0.05"], opts);
    assert.deepStrictEqual([stale.requested, Number(commits()), g(bare, "log", "-1", "--format=%s", "main")], [true, Number(n0) + 1, "Request a data fetch"], "stale: the request is made");
    // GitHub cannot be reached: no request, no failure
    g(work, "remote", "set-url", "origin", path.join(dir, "missing.git"));
    const down = await R.main(["--timeout-sec", "0.2", "--every-sec", "0.05"], opts);
    assert.deepStrictEqual(down, { requested: false, fresh: false, skipped: "error" }, "GitHub cannot be reached: said so, and the refresh goes on");
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
test("ESPN's feed: an empty 202 is named, and a source switched off where it cannot work stays off (DEC-024)", async () => {
  const os = require("os"), fs = require("fs");
  const r202 = (body) => async () => ({ ok: true, status: 202, json: async () => JSON.parse(body), text: async () => body });
  await assert.rejects(fetchWithRetry("https://example.com/rss", { as: "text", retries: 0, fetchImpl: r202("") }), /answered 202 with no content \(the provider's network held the request back\)/, "an empty 202 says what happened");
  assert.strictEqual(await fetchWithRetry("https://example.com/rss", { as: "text", retries: 0, fetchImpl: r202("<rss></rss>") }), "<rss></rss>", "a 202 with content is read as usual");
  assert.deepStrictEqual(await fetchWithRetry("https://example.com/x", { retries: 0, fetchImpl: r202("{\"a\":1}") }), { a: 1 }, "and as JSON");
  for (const f of ["data-fetch", "refresh-backup", "source-check"])
    assert.ok(/\nenv:\n  FABRIC_OFF: rss-espn\n/.test(fs.readFileSync(path.join(root, ".github/workflows/" + f + ".yml"), "utf8")), f + ": ESPN's feed is off on GitHub's servers");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nflu-off-"));
  try {
    const calls = [], base = fakeFetch(), fetchImpl = async (url, o) => { calls.push(String(url)); return base(url, o); };
    const make = (off, t = NOW()) => createFabric({ scopes: ["public"], cacheDir: dir, season: 2026, now: () => t, fetchImpl, off });
    // a headline from ESPN's feed (a curated item may cite an ESPN article: that is not the feed)
    const fromEspn = (e) => e.source !== "curated-news" && (e.source === "rss-espn" || (e.sources || []).some((x) => x.publisher === "ESPN"));
    const on = await make([]).universe({ fresh: true });   // ESPN read once: its cache file now exists
    assert.ok(on.sources["rss-espn"].status === "ok" && on.events.some(fromEspn), "fixture: ESPN headlines when it is on");
    calls.length = 0;
    const u = await make(["rss-espn"], NOW() + 3600000).universe({ fresh: true });
    const st = u.sources["rss-espn"];
    assert.ok(st.status === "disabled" && /GitHub's servers/.test(st.note) && !calls.some((c) => c.includes("espn.com/espn/rss")), "off: reported disabled with the reason, and never asked");
    assert.ok(!u.events.some(fromEspn) && u.events.some((e) => e.source === "rss-yahoo"), "and its cached headlines are not shown; Yahoo's still are");
    assert.ok(u.sources["rss-yahoo"].status === "ok", "the other feeds are unaffected");
    const { carryForward } = require(path.join(root, "lib/fabric/carry.js"));
    const kept = carryForward(on, u, NOW() + 3600000);
    assert.ok(!kept.carried.includes("rss-espn") && kept.u.sources["rss-espn"].status === "disabled" && !kept.u.events.some(fromEspn), "not carried forward from the last snapshot either");
    assert.deepStrictEqual(C.validatePublicSnapshot(kept.u, T), []);
    process.env.FABRIC_OFF = " rss-espn , nothing-such ";
    try { assert.strictEqual((await createFabric({ scopes: ["public"], cacheDir: null, season: 2026, now: NOW, fetchImpl }).universe()).sources["rss-espn"].status, "disabled", "FABRIC_OFF in the environment does the same"); }
    finally { delete process.env.FABRIC_OFF; }
    const both = await createFabric({ scopes: ["public"], cacheDir: null, season: 2026, now: NOW, fetchImpl, off: ["odds-api"] }).universe();
    assert.ok(both.sources["odds-api"].status === "disabled" && both.sources["odds-api"].note === "Off here (FABRIC_OFF)", "a source with a note of its own still says why it is switched off");
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
test("the page policy hashes scripts the way the browser does", () => {
  const { cspFor } = require(path.join(root, "server.js"));
  const lf = "<html><script>var a = 1;\nvar b = 2;</script><script src=\"x.js\"></script></html>";
  const h = (csp) => csp.split("script-src")[1].split(";")[0];
  assert.strictEqual(h(cspFor(lf.replace(/\n/g, "\r\n"))), h(cspFor(lf)), "Windows line breaks hash like the browser's normalised ones");
  assert.strictEqual((h(cspFor(lf)).match(/'sha256-/g) || []).length, 1, "external scripts are not hashed");
  assert.deepStrictEqual(h(cspFor(lf)).trim().split(/\s+/).filter((x) => !/^'sha256-/.test(x)), ["'self'", "https://www.youtube.com"], "the only outside script source: YouTube's player API, for NFL TV (DEC-022)");
});
test("/api/live: a fetch that throws at once does not leave a stuck request", async () => {
  const srv = require(path.join(root, "server.js")), errLog = console.error; console.error = () => {};
  process.env.LIVE_RETRY_MS = "0"; process.env.CACHE_MS = "0";
  try {
    srv.resetLive();
    srv.setLiveFetch(() => { throw new Error("no network"); });
    const r1 = await srv.liveGames();
    let calls = 0; srv.setLiveFetch(async () => { calls++; return { ok: true, status: 200, json: async () => ({ events: [] }) }; });
    const r2 = await srv.liveGames();
    assert.ok(r1.stale === true && calls === 1 && r2.stale === false, "the next call makes a new request instead of returning the finished one");
  } finally { console.error = errLog; delete process.env.LIVE_RETRY_MS; delete process.env.CACHE_MS; srv.resetLive(); srv.setLiveFetch((...x) => fetch(...x)); }
});
test("/api/live: a timeout, no retry storm after a failure, one request at a time", async () => {
  const srv = require(path.join(root, "server.js")), sb = JSON.parse(require("fs").readFileSync(path.join(__dirname, "sample-scoreboard.json"), "utf8"));
  const errLog = console.error; console.error = () => {};
  process.env.LIVE_TIMEOUT_MS = "50"; process.env.LIVE_RETRY_MS = "200"; process.env.CACHE_MS = "0";
  try {
    let calls = 0;
    srv.resetLive();
    srv.setLiveFetch((url, o) => { calls++; return new Promise((_, bad) => o.signal.addEventListener("abort", () => { const e = new Error("aborted"); e.name = "AbortError"; bad(e); })); });
    const t0 = Date.now(), r1 = await srv.liveGames();
    assert.ok(r1.stale === true && Date.now() - t0 < 2000 && calls === 1, "a feed that never answers is given up after the timeout");
    const r2 = await srv.liveGames();
    assert.ok(r2.stale === true && calls === 1, "right after a failure the feed is not asked again");
    await new Promise((ok) => setTimeout(ok, 250));
    srv.setLiveFetch(async () => { calls++; await new Promise((ok) => setTimeout(ok, 20)); return { ok: true, status: 200, json: async () => sb }; });
    const [a, b] = await Promise.all([srv.liveGames(), srv.liveGames()]);
    assert.ok(calls === 2 && a.stale === false && b.stale === false && a.games.length === b.games.length && a.games.length > 0, "after the wait it asks again, once for two callers");
    srv.setLiveFetch(async () => { calls++; return { ok: false, status: 503, json: async () => ({}) }; });
    await new Promise((ok) => setTimeout(ok, 5));
    const r3 = await srv.liveGames();
    assert.ok(r3.stale === true && r3.games.length === a.games.length, "a failed answer keeps the last good games, marked stale");
  } finally {
    console.error = errLog; delete process.env.LIVE_TIMEOUT_MS; delete process.env.LIVE_RETRY_MS; delete process.env.CACHE_MS;
    srv.resetLive(); srv.setLiveFetch((...x) => fetch(...x));
  }
});
test("YouTube feeds: video ids checked, Shorts and press conferences recognised, teams matched", () => {
  const c = { team: "BUF", name: "Buffalo Bills", channelId: "UCcEvCxUe2Sm5W6MliEUv0vg" };
  const v = media.normalizeYoutubeFeed(YT_TEAM, c);
  assert.strictEqual(v.length, 3);
  assert.strictEqual(v[0].kind, "press"); assert.deepStrictEqual(v[0].teams.sort(), ["BUF", "MIA"]);
  assert.strictEqual(v[1].kind, "short"); assert.strictEqual(v[1].title, "Practice sights & sounds");
  assert.strictEqual(v[0].embedUrl, "https://www.youtube-nocookie.com/embed/bbbbbbbbbb1");
  assert.strictEqual(media.normalizeYoutubeFeed(YT_NFL, { team: null, name: "NFL", channelId: "UCDVYQ4Zhbm3S2dlz7P1GBDg" }).length, 2, "malformed video id dropped");
  const stat = (views) => YT_TEAM.replace("</published></entry>", '</published><media:group><media:community><media:starRating count="0"/><media:statistics views="' + views + '"/></media:community></media:group></entry>');
  assert.ok(media.normalizeYoutubeFeed(stat("0"), c)[0].upcoming === true && ["3", "1520"].every((n) => !("upcoming" in media.normalizeYoutubeFeed(stat(n), c)[0])) && !("upcoming" in v[0]),
    "no views in the feed: marked upcoming (a scheduled live stream); any views at all, or no figure, not marked");
  const soonV = media.normalizeYoutubeFeed(stat("0"), c)[0];
  assert.deepStrictEqual(C.cleanMedia({ channels: media.channelList(), videos: [soonV, Object.assign({}, v[2], { upcoming: "yes" })], podcasts: [] }).videos.map((x) => x.videoId), [soonV.videoId],
    "upcoming is true or absent; a video that passes otherwise is refused for anything else");
  assert.throws(() => media.normalizeYoutubeFeed("<html></html>", c), /not a YouTube feed/);
  assert.strictEqual(media.videoKind("Head coach meets the media", false), "press");
  assert.ok(["LIVE: The Houston Texans address the media", "Aaron Jones Sr. Addressed the Media Following Vikings vs. 49ers"].every((t) => media.videoKind(t, false) === "press"), "addresses the media: a media session");
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

// A test whose promise never settles must fail, not end the run quietly: the exit code is a failure until the last
// test has finished, and each test gets 60 seconds.
process.exitCode = 1;
const TEST_TIMEOUT_MS = 60000;
(async () => {
  let failed = 0;
  for (const [name, fn] of tests) {
    let timer;
    const limit = new Promise((_, bad) => { timer = setTimeout(() => bad(new Error("did not finish within " + TEST_TIMEOUT_MS / 1000 + " s")), TEST_TIMEOUT_MS); });
    try { await Promise.race([fn(), limit]); } catch (err) { failed++; console.error("FAIL " + name + "\n  " + (err && err.stack || err).split("\n").slice(0, 4).join("\n  ")); }
    finally { clearTimeout(timer); }
  }
  if (failed) { console.error(failed + " of " + tests.length + " fabric tests failed"); process.exit(1); }
  process.exitCode = 0;
  console.log("ok: " + tests.length + " fabric tests pass");
})();
