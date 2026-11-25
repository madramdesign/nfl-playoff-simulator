// Pure logic of the command center (src/universe/*), loaded from the built page with no DOM. Run: node test/universe.test.js
const fs = require("fs"), path = require("path"), assert = require("assert");
const html = fs.readFileSync(path.join(__dirname, "..", "public", "index.html"), "utf8");
const builtEngine = html.match(/<script id="engine">([\s\S]*?)<\/script>/)[1];
// The fixtures' matchups are checked against the engine's remaining games, so the season data is pinned to the build
// they were written against (test/fixtures/README.md). The code under test is still the current build's.
assert.ok(/^var D=.*$/m.test(builtEngine), "the engine script carries its data on one `var D=` line");
new Function(builtEngine + ";return simulate")();   // the current build's own data still loads
const pinnedData = fs.readFileSync(path.join(__dirname, "fixtures", "engine-data.js"), "utf8").trim();
const engine = builtEngine.replace(/^var D=.*$/m, () => pinnedData);
const universe = html.match(/<script id="universe">([\s\S]*?)<\/script>/)[1];
assert.ok(html.indexOf('<script id="engine">') < html.indexOf('<script id="universe">'), "the engine stays the first script");
assert.ok(!/document|window/.test(engine.replace(/^var D=.*$/m, "")), "the engine script does not touch the DOM");
const E = new Function(engine + "\n" + universe + "\n;return {GAMES, TM, simulate, setTweak, BW, BL, BT, RATE, RATE2, SHRINK, HFA, NFLU: globalThis.NFLU, D}")();
const U = E.NFLU;
assert.ok(U && !U.booted, "NFLU is exposed and does not boot without a DOM");
const sample = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures", "universe.sample.json"), "utf8"));
const pub = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures", "universe.public.json"), "utf8"));
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepStrictEqual(a, b, m); n++; };

// ---- URL state ----
const allow = { teams: E.TM.map((t) => t.a), layers: U.LAYER_IDS };
const full = { view: "sim", mode: "intel", layers: ["teams", "news"], timeRange: "48h", team: "NYG", game: "2026_12_NYG_IND" };
eq(U.parseUrlState(U.serializeUrlState(full, {}), allow), full, "URL state round-trips");
const defaults = { view: "universe", mode: "geo", layers: U.DEFAULT_LAYERS, timeRange: U.DEFAULT_RANGE };
eq(U.serializeUrlState(Object.assign({}, defaults), defaults), "", "defaults leave the URL clean");
eq(U.parseUrlState(U.serializeUrlState({ layers: [] }, defaults), allow), { layers: [] }, "no layers round-trips as layers=none");
eq(U.parseUrlState("?view=evil&mode=3d&timeRange=2y&team=XXX&game=%3Cscript%3E&layers=bogus,%22x", allow), {}, "every bad value is dropped");
eq(U.parseUrlState("?layers=teams,bogus,teams&team=nyg", allow), { layers: ["teams"], team: "NYG" }, "valid parts kept, duplicates and unknown ids dropped, team upper-cased");
eq(U.parseUrlState("?layers=none", allow), { layers: [] }, "layers=none means none");
ok(U.serializeUrlState({ view: "sim" }, defaults, [["utm", "x"], ["view", "old"]]) === "?utm=x&view=sim", "foreign parameters are kept, ours replaced");
const st = U.initialState("?mode=div&timeRange=6h", { mode: "intel", timeRange: "30d", layers: ["teams", "bogus"] });
ok(st.mode === "div" && st.timeRange === "6h", "the URL wins over saved preferences");
eq(st.layers, ["teams"], "saved layers are allowlisted too");

// ---- focus: league, conference, division, team ----
eq(U.FOCUS.confs.map((c) => c.id), ["AFC", "NFC"], "two conferences, AFC first");
ok(U.FOCUS.confs.every((c) => c.teams.length === 16 && c.divs.length === 4 && c.divs.every((d) => d.teams.length === 4)), "each conference has four divisions of four teams");
eq(U.FOCUS.confs[0].divs.map((d) => d.short), ["East", "North", "South", "West"], "divisions are listed East, North, South, West");
ok(U.FOCUS.ids.length === 2 + 8 + 32 && new Set(U.FOCUS.ids).size === 42, "42 distinct focus ids: conferences, divisions, teams");
ok(E.TM.every((t, i) => { const f = U.focusInfo(t.a); return f.level === "team" && f.team === i && f.conf === (t.c ? "NFC" : "AFC") && U.FOCUS.byId[f.div].label === t.dn && U.FOCUS.byId[f.div].teams.includes(i); }), "every team sits in the engine's own conference and division");
eq(U.focusInfo("NOPE").level, "league", "an unknown focus is the whole league");
eq(U.focusInfo("constructor").level, "league", "built-in property names are not scopes");
ok(U.focusSet(null) === null && Object.keys(U.focusSet("NFC")).length === 16 && Object.keys(U.focusSet("AFC-EAST")).length === 4 && Object.keys(U.focusSet("NYG")).length === 1, "the team set for each level");
const fNYG = E.TM.findIndex((t) => t.a === "NYG"), fBUF = E.TM.findIndex((t) => t.a === "BUF");
const fItems = [{ teams: [fNYG] }, { teams: [fBUF, fNYG] }, { teams: [fBUF] }, { teams: [] }, { team: fNYG, teams: [] }];
eq(U.focusEvents(fItems, U.focusSet("NYG")).length, 3, "items tagged with a team in focus are kept; untagged ones are left out");
eq(U.focusEvents(fItems, null).length, 5, "no focus keeps everything, untagged items included");
eq(U.focusGames([{ away: fBUF, home: fNYG }, { away: fBUF, home: fBUF }], U.focusSet("NFC-EAST")).length, 1, "a game is in focus when either side is");
eq(U.focusTeamList("NYG").slice().sort(), U.FOCUS.byId["NFC-EAST"].teams.slice().sort(), "one team in focus lists its whole division");
ok(U.focusTeamList(null).length === 32 && U.focusTeamList("AFC").length === 16, "the league and a conference list their own teams");
ok(U.focusPhrase(null) === "" && U.focusPhrase("AFC-EAST") === " for the AFC East" && U.focusPhrase("NYG") === " for the Giants", "empty-state wording names the focus");
const fAllow = { teams: E.TM.map((t) => t.a), layers: U.LAYER_IDS, focus: U.FOCUS.ids };
eq(U.parseUrlState("?focus=afc-east", fAllow), { focus: "AFC-EAST" }, "focus is read from the URL in any letter case");
eq(U.parseUrlState("?focus=AFC-CENTRAL", fAllow), {}, "a division that does not exist is dropped");
eq(U.parseUrlState("?focus=%3Cscript%3E", {}), {}, "a malformed focus is dropped even without a list");
eq(U.parseUrlState(U.serializeUrlState({ focus: "NFC", team: "NYG" }, {}), fAllow), { focus: "NFC", team: "NYG" }, "focus round-trips next to an open team");
eq(U.initialState("?focus=nyg", {}).focus, "NYG", "the page starts in the URL's focus");
eq(U.initialState("", {}).focus, null, "no focus by default");

// ---- time ranges ----
const now = Date.parse("2026-11-22T19:30:00Z"), H = 3600e3;
const at = (ms) => ({ ts: new Date(now - ms).toISOString() });
ok(U.filterByTime([at(6 * H)], "6h", now).length === 1, "an item exactly at the range edge is included");
ok(U.filterByTime([at(6 * H + 1)], "6h", now).length === 0, "one millisecond past the edge is excluded");
ok(U.filterByTime([at(-4 * 60e3)], "1h", now).length === 1 && U.filterByTime([at(-6 * 60e3)], "1h", now).length === 0, "up to five minutes of clock skew allowed, not more");
ok(U.filterByTime([at(31 * 60e3), { state: "in", ts: new Date(now - 3 * H).toISOString() }], "live", now).length === 1, "live keeps in-progress games and drops items older than 30 minutes");
ok(U.filterByTime([at(400 * 24 * H), { ts: "not a date" }], "season", now).length === 2, "season keeps everything");
ok(U.filterByTime([at(23 * H)], "bogus", now).length === 1, "an unknown range falls back to the default (7 days)");
ok(U.filterByTime([{ tsMs: now - H }], "1h", now).length === 1, "numeric times work");
eq(U.TIME_RANGES, ["live", "1h", "6h", "12h", "24h", "48h", "7d", "30d", "season"], "the shared range list");

// ---- layer registry ----
eq(U.validateLayerRegistry(U.LAYERS, U.DEFAULT_LAYERS), [], "layer registry is sound");
ok(new Set(U.LAYER_IDS).size === U.LAYER_IDS.length, "layer ids are unique");
ok(["teams", "divisions", "live", "upcoming", "final", "injuries", "transactions", "news", "breaking", "weather", "odds", "playoff", "superbowl", "momentum", "qb", "rivalries", "disagree"].every((id) => U.LAYER_IDS.includes(id)), "every required layer exists");
ok(U.validateLayerRegistry(U.LAYERS.concat([U.LAYERS[0]]), ["nope"]).length >= 2, "duplicates and missing defaults are caught");

// ---- model from the fixtures ----
// `live` is the sample as a real server would send it (no _fixture marker); `sample` itself is labelled fixture.
const live = JSON.parse(JSON.stringify(sample)); delete live._fixture;
const pubLive = JSON.parse(JSON.stringify(pub)); delete pubLive._fixture;
const M = U.buildModel(live), MF = U.buildModel(sample), P = U.buildModel(pub), M0 = U.buildModel(null);
const idx = (a) => E.TM.findIndex((t) => t.a === a);
ok(MF.fixture === true && M.fixture === false, "the fixture marker is carried into the model");
const bufGame = M.games.find((g) => g.key === "fx-1");
ok(bufGame && bufGame.gi >= 0 && E.GAMES[bufGame.gi][2] === idx("MIA") && E.GAMES[bufGame.gi][3] === idx("BUF"), "a feed game is matched to the engine's row by its matchup");
const wk = E.GAMES[bufGame.gi][1];
eq(M.games.length, E.GAMES.filter((g) => g[1] === wk).length, "the feed's games plus the rest of that week's engine games, each once");
eq(M.games.filter((g) => g.fromFeed).map((g) => g.key).sort(), sample.games.map((g) => g.id).sort(), "every feed game is present");
ok(M.games[0].key === "fx-1" && M.games[M.games.length - 1].key === "fx-2", "in-progress games sort first, finals last");
ok(M0.games.length === E.GAMES.filter((g) => g[1] === Math.min(...E.GAMES.map((x) => x[1]))).length && M0.games.every((g) => g.state === "pre" && !g.fromFeed), "with no feed, the engine's current week is shown");
const pageNews = (E.D.news || []).filter((n) => /^https:\/\//.test(n.url || "") && /^\d{4}-\d{2}-\d{2}$/.test(n.date || "") && !sample.events.some((e) => e.url === n.url));
eq(M.events.length, sample.events.length + pageNews.length, "feed events plus the curated page news, nothing dropped or invented");
ok(M.events.every((e, k, a) => k === 0 || a[k - 1].ts >= e.ts), "events are newest first");
eq(M.events.filter((e) => e.origin === "page").length, pageNews.length, "page news is marked as such");
ok(P.events.length > 0 && P.events.every((e) => !/^espn-(news|injuries|transactions|scoreboard)$/.test(e.source)), "the public fixture carries no local events");

// ---- data from outside cannot reach built-in properties or blank the model ----
const evil = JSON.parse(JSON.stringify(live));
evil.events.push({ id: "constructor", type: "news", ts: sample.generatedAt, seenAt: sample.generatedAt, teams: ["constructor", "NYG", "__proto__"], players: [null, { name: "A" }],
  title: "x", source: "rss-yahoo", publisher: "P", importance: 10, confidence: 0.5, sourceCount: 1, sources: [null, { publisher: "P", url: "javascript:alert(1)" }, 7] });
evil.injuries.constructor = { burden: 9, players: [] };
evil.games.push(Object.assign({}, sample.games[0], { id: "toString", away: "constructor", home: "BUF" }));
const ME = U.buildModel(evil), bad = ME.events.find((e) => e.id === "constructor");
ok(bad && bad.teams.length === 1 && bad.teams[0] === idx("NYG"), "unknown team keys like 'constructor' are dropped, real ones kept");
ok(bad.sources.length === 1 && bad.sources[0].url === null && bad.players.length === 1, "non-object sources and players are dropped; a javascript: link is not kept");
ok(U.TIDX.constructor === undefined && ME.gameByKey.constructor === undefined && ME.gameByKey.toString === undefined, "lookups have no built-in keys");
eq(Object.keys(ME.injuries).map(Number).sort((a, b) => a - b), Object.keys(sample.injuries).map(idx).sort((a, b) => a - b), "only real teams' injuries are kept");
eq(ME.games.length, M.games.length, "a game with an unknown team is ignored");

// ---- the page refuses non-web links and string handlers ----
const fake = () => ({ attrs: {}, setAttribute(k, v) { this.attrs[k] = v; }, addEventListener(k) { this.attrs["listener:" + k] = true; }, style: { setProperty() {} } });
const f1 = fake(); U.setAttrs(f1, { href: "javascript:alert(1)", src: "data:text/html,x", onclick: "alert(1)", onmouseover: "x", formaction: undefined });
eq(Object.keys(f1.attrs), [], "javascript: and data: addresses and string event handlers are refused");
const f2 = fake(); U.setAttrs(f2, { href: "https://example.com/a", "aria-label": "x", onclick: function () {} });
ok(f2.attrs.href === "https://example.com/a" && f2.attrs["aria-label"] === "x" && f2.attrs["listener:click"], "web links, plain attributes and real handlers are kept");

// ---- freshness and the status pill ----
const meta = (o) => Object.assign({ payload: live, origin: "live", fetchedAt: now, fails: 0 }, o);
ok(U.freshness(["open-meteo"], meta(), now).label === "LIVE · 25m", "a healthy live source reads LIVE with its age");
eq(U.freshness(["rss-espn"], meta(), now).state, "stale", "a stale source reads STALE");
eq(U.freshness(["espn-transactions"], meta(), now).label, "UNAVAILABLE", "a down source reads UNAVAILABLE");
eq(U.freshness(["open-meteo"], meta({ fails: 2 }), now).state, "stale", "after a failed poll, live data is marked stale");
eq(U.freshness(["open-meteo"], meta({ payload: pubLive, origin: "snapshot" }), now + 9 * H).label, "SNAPSHOT · 9h old", "a snapshot shows its age");
eq(U.freshness(["open-meteo"], { payload: null, origin: "none" }, now).label, "UNAVAILABLE", "no payload at all reads UNAVAILABLE");
eq(U.freshness([], meta(), now).state, "model", "model-only panels say so");
eq(U.freshness(["espn-scoreboard"], meta({ payload: pubLive, origin: "snapshot" }), now).label, "UNAVAILABLE", "local sources are absent from a public snapshot");
const pill = (o) => U.pillState(meta(o), now);
eq(pill().state, "live", "pill: healthy live payload reads LIVE");
ok(pill().label === "LIVE · 15s · 2 degraded", "pill: age of the freshest source and the count of unhealthy ones");
const allStale = JSON.parse(JSON.stringify(live));
Object.values(allStale.sources).forEach((s) => { s.status = "stale"; s.ageSec = 3 * 3600; });
Object.assign(allStale.sources["espn-scoreboard"], { status: "down", breaker: "open" });
eq(pill({ payload: allStale }).state, "stale", "pill: every source stale or down reads STALE, never LIVE");
const allDown = JSON.parse(JSON.stringify(live)); Object.values(allDown.sources).forEach((s) => { s.status = "down"; s.ageSec = null; });
eq(pill({ payload: allDown }).state, "unavailable", "pill: every source down reads UNAVAILABLE");
eq(pill({ fails: 1 }).state, "stale", "pill: a failed poll reads STALE");
ok(pill({ payload: sample }).state === "fixture" && !/LIVE/.test(pill({ payload: sample }).label), "pill: a fixture payload reads FIXTURE, never LIVE");
eq(pill({ payload: pubLive, origin: "snapshot" }).state, "snapshot", "pill: an embedded snapshot reads SNAPSHOT");
eq(U.pillState({ payload: null, origin: "none" }, now).state, "unavailable", "pill: nothing loaded reads UNAVAILABLE");
ok(U.statusSentence(meta(), now).startsWith("live feed connected; 2 sources"), "status sentence: connected, with the degraded count");
ok(U.statusSentence(meta({ payload: allStale }), now).startsWith("server answering, but every source is stale"), "status sentence agrees with a stale pill");
ok(U.statusSentence(meta({ fails: 2, fetchedAt: now - 5 * 60e3 }), now).startsWith("live feed not answering; last data received 5m ago"), "status sentence after failed polls");
ok(/^fixture data/.test(U.statusSentence(meta({ payload: sample }), now)), "status sentence names fixture data");

// ---- what the simulation is told ----
const liveMeta = { origin: "live", fetchedAt: now, fails: 0 };
const fin = U.feedInputs(M, liveMeta, now), chiGame = M.games.find((g) => g.key === "fx-2");
ok(chiGame.gi >= 0 && fin.picks[chiGame.gi] === 2, "a final the home team won (CHI 27, NO 13) becomes a home pick");
eq(fin.picks.filter((p) => p).length, 1, "only the one decisive final is picked");
const flip = JSON.parse(JSON.stringify(live)), fg = flip.games.find((g) => g.id === "fx-2");
fg.awayScore = 30; fg.homeScore = 10;
eq(U.feedInputs(U.buildModel(flip), liveMeta, now).picks[chiGame.gi], 1, "a final the away team won becomes an away pick");
fg.awayScore = fg.homeScore = 20;
const tie = U.feedInputs(U.buildModel(flip), liveMeta, now);
ok(tie.picks[chiGame.gi] === 0 && tie.ties === 1 && tie.finals === 0, "a tied final is left to the simulation and counted as a tie");
ok(fin.lives === 1 && fin.feedLive === 1 && fin.liveP[bufGame.gi] === 0.78, "a live game with an ok, recent source uses the feed's in-game chance");
ok(U.feedInputs(M, { origin: "snapshot", fetchedAt: null, fails: 0 }, now).liveP === null, "a snapshot's in-progress game is not fed to the simulation as live");
ok(U.feedInputs(M, Object.assign({}, liveMeta, { fails: 1 }), now).liveP === null, "nor after a failed poll");
ok(U.feedInputs(M, liveMeta, now + 10 * 60e3).liveP === null, "nor when the scoreboard data is more than three minutes old");
const sbStale = JSON.parse(JSON.stringify(live)); sbStale.sources["espn-scoreboard"].status = "stale";
const fst = U.feedInputs(U.buildModel(sbStale), liveMeta, now);
ok(fst.liveP === null && fst.staleLive === 1, "nor when the game's source is not ok; it is counted as out of date instead");
ok(U.gameIsLive(bufGame, M, liveMeta, now) && !U.gameIsLive(bufGame, U.buildModel(sbStale), liveMeta, now) && !U.gameIsLive(bufGame, M, { origin: "snapshot" }, now), "the interface's live test follows the same rule");
const noWp = JSON.parse(JSON.stringify(live)); noWp.games.find((g) => g.id === "fx-1").winProb = null;
const Mn = U.buildModel(noWp), p0 = U.feedInputs(Mn, liveMeta, now).liveP[bufGame.gi];
const tw = []; tw[idx("BUF")] = 7; E.setTweak(tw);
const p1 = U.feedInputs(Mn, liveMeta, now).liveP[bufGame.gi]; E.setTweak([]);
ok(p0 > 0.5 && p0 < 1 && Math.abs(p0 - p1) < 1e-12, "with no feed chance, this page's in-game model is used, never with the simulator's what-if");
eq(U.recordOf(idx("CHI"), M), { w: E.BW[idx("CHI")] + 1, l: E.BL[idx("CHI")], t: E.BT[idx("CHI")], feed: 1 }, "records count this week's feed finals for the winner");
eq(U.recordOf(idx("NO"), M), { w: E.BW[idx("NO")], l: E.BL[idx("NO")] + 1, t: E.BT[idx("NO")], feed: 1 }, "and for the loser");

// ---- lines: sign and source ----
const lt = U.lineText(bufGame);
ok(lt.text.startsWith("BUF −16.5 (open −14.5), total 44.5 (open 45.5)") && / open → now$/.test(lt.short), "a home-side spread is shown as given (−16.5: BUF favored), with its opening line");
const mv = U.gameLineMove(bufGame);
ok(mv.size > 0 && mv.label === "BUF ▲3", "home win chance 86% to 89% moves toward the home team");
const spOnly = JSON.parse(JSON.stringify(bufGame)); spOnly.odds.homeProb = null;
const mv2 = U.gameLineMove(spOnly);
ok(mv2.size > 0 && mv2.label === "BUF 2.0 pts", "a home spread from −14.5 to −16.5 moves toward the home team");
spOnly.odds.spread = { open: -3, current: 1 };
const mv3 = U.gameLineMove(spOnly);
ok(mv3.size < 0 && mv3.label === "MIA 4.0 pts", "a home spread from −3 to +1 moves toward the away team");
const nygLine = U.lineText(M.games.find((g) => g.key === "fx-4"));
ok(nygLine.text === "NYG +6.0, total 46.5" && nygLine.short === "nflverse, one book, current", "nflverse: one current line, no opening line shown");

// ---- simulation labels ----
ok(U.simSummary({ mode: 2 }, 0).startsWith("Win chances: Blend (rerunning in Sportsbooks"), "numbers are labelled with the mode they were computed in, not the page's current one");
ok(U.simSummary({ mode: 0 }, 0) === "Win chances: Sportsbooks.", "same mode: no rerun note");
ok(/1 tied final simulated instead/.test(U.simSummary({ mode: 2, ties: 1 }, 2)) && /1 live game at the feed's in-game chance/.test(U.simSummary({ mode: 2, lives: 1, feedLive: 1 }, 2)), "ties and live games are described");
ok(U.savedSimMode('{"m":0}') === 0 && U.savedSimMode('{"m":2,"f":3}') === 2 && U.savedSimMode('{"m":5}') === null && U.savedSimMode("nope") === null && U.savedSimMode(null) === null, "the simulator's saved mode is read safely");

// ---- the brief's ranking functions ----
const te = U.topEvent(M.events);
ok(te && te.id === sample.events.slice().sort((a, b) => b.importance - a.importance)[0].id, "the top development is the highest-importance event");
const bi = U.biggestInjury(M.injuries);
ok(bi && bi.team === idx("NYG") && bi.burden === 1.42 && bi.qbOut.length === 1, "biggest injury burden: the fixture's NYG, with a quarterback out");
const mm = U.biggestMarketMove(M.games, null);
ok(mm && mm.game.key === "fx-1" && mm.kind === "prob" && Math.abs(mm.size - 0.03) < 1e-9, "biggest market move: open to current on the one game with an opening line");
ok(U.biggestMarketMove(P.games, null) === null, "nflverse lines (current only) give no movement");
ok(U.topEvent([]) === null && U.biggestInjury({}) === null, "empty inputs give no answer rather than a made-up one");
if (E.D.history) {
  const hm = U.biggestHistoryMove(E.D.history), po = E.D.history.po, L = po.length;
  ok(hm && Math.abs(hm.delta) === Math.max(...po[L - 1].map((v, i) => Math.abs(v - po[L - 2][i]))), "biggest weekly move is the largest absolute change");
}
const r = E.simulate(E.GAMES.map(() => 0), 0, 2000, null, false, M.games.filter((g) => g.gi >= 0).map((g) => g.gi));
const ig = U.mostImportantGame(r.watch);
ok(ig && ig.swing > 0 && M.games.some((g) => g.gi === ig.gi), "most important game is one of this week's watched games");
let maxSwing = 0;
for (const k in r.watch) { const w = r.watch[k]; let s = 0; for (let t = 0; t < 32; t++) s += Math.abs(w.H[t] / w.nH - w.A[t] / w.nA); maxSwing = Math.max(maxSwing, s); }
ok(Math.abs(maxSwing - ig.swing) < 1e-12, "no watched game swings more than the chosen one");
// model disagreement, recomputed independently from the ratings and the posted lines
const rb = (g) => 1 / (1 + Math.pow(10, -(E.SHRINK * ((E.RATE[g[3]] + E.RATE2[g[3]]) / 2 - (E.RATE[g[2]] + E.RATE2[g[2]]) / 2) + (g[4] ? 0 : E.HFA)) / 400));
const expDis = E.GAMES.map((g, i) => [i, g]).filter(([, g]) => g[6] != null && Math.abs(rb(g) - g[6]) >= 0.08).map(([i]) => i).sort((a, b) => a - b);
eq(U.disagreementGames().map((d) => d.gi).sort((a, b) => a - b), expDis, "model disagreement lists exactly the games 8+ points apart");
const brief = U.buildBrief({ M, payload: live, sim: r, events: M.events });
eq(brief.map((l) => l.id), ["development", "injury", "team", "playoff", "market", "disagree", "game", "uncertain", "overlooked", "redteam"].filter((id) => id !== "team" || E.D.history).filter((id) => id !== "playoff" || E.D.prev).filter((id) => id !== "overlooked" || U.overlookedFactor()), "the brief has its lines in order");
ok(/Intelligence gaps: .*transactions \(down\)/.test(brief.find((l) => l.id === "redteam").text), "the red-team line names the down transactions feed");
// the brief narrowed to a focus: every ranked answer stays inside it
const fAFC = U.focusSet("AFC"), briefAFC = U.buildBrief({ M, payload: live, sim: r, focus: fAFC, scope: "the AFC", events: U.focusEvents(M.events, fAFC) });
ok(briefAFC.filter((l) => l.team != null).every((l) => fAFC[l.team]), "a focused brief names only teams in focus");
ok(briefAFC.filter((l) => l.gi != null).every((l) => fAFC[E.GAMES[l.gi][2]] || fAFC[E.GAMES[l.gi][3]]), "and only games involving them");
ok(U.biggestInjury(M.injuries, U.focusSet("AFC")) === null || U.biggestInjury(M.injuries, U.focusSet("AFC")).team !== idx("NYG"), "the biggest injury burden is looked for inside the focus");
eq(U.biggestInjury(M.injuries, U.focusSet("NFC-EAST")).team, idx("NYG"), "and found when the team is in it");
const bu1 = U.biggestUncertainty(U.focusSet("KC")); ok(bu1 && bu1.team === idx("KC"), "one team in focus answers about that team");
const igF = U.mostImportantGame(r.watch, U.focusSet("NYG"));
ok(igF === null || [E.GAMES[igF.gi][2], E.GAMES[igF.gi][3]].includes(idx("NYG")), "the most important game is one the focused team plays in");
// map labels: a crowded cluster gets labels that do not sit on each other
const tight = [[100, 100], [108, 100], [104, 108], [100, 116], [300, 300]], names5 = ["NYG", "NYJ", "PHI", "BAL", "KC"];
const labs = U.placeLabels(tight, 6.5, names5, null);
const overlapArea = (a, b) => Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
let labHits = 0; labs.forEach((a, i) => labs.forEach((b, j) => { if (i < j) labHits += overlapArea(a.box, b.box); }));
ok(labHits === 0, "labels in a tight cluster do not overlap each other");
ok(labs[4].anchor === "start" && labs[4].x === 300 + 6.5 + 3, "an uncrowded team keeps its label on the right");
ok(U.placeLabels(tight, 6.5, names5, null, 10)[4].x === 300 + 16.5 + 3, "room is left for the count badges around a dot");
eq(U.placeLabels(tight, 6.5, names5, (i) => i === 1)[1], null, "a skipped team gets no label");
eq(U.intelligenceGaps(null).length, 5, "with no payload every kind of source is a gap");
const pw = U.proveWrong(idx("NYG"), M);
ok(pw.length >= 2 && pw.every((x, k, a) => k === 0 || a[k - 1].w >= x.w) && pw[pw.length - 1].kind === "sample", "prove-this-wrong is sorted, ends with the sample-size caveat");
ok(pw.some((x) => x.kind === "qb"), "the fixture's quarterback-out flag shows up as counter-evidence");

// ---- deep run sums ----
const a = E.simulate(E.GAMES.map(() => 0), 0, 500, null, false, [0], 1), b = E.simulate(E.GAMES.map(() => 0), 0, 500, null, false, [0], 2);
const sum = U.addSimCounts(U.addSimCounts(null, a), b);
ok(sum.n === 1000 && Math.abs(Array.from(sum.po).reduce((x, y) => x + y, 0) - 14 * 1000) < 1e-6, "summed batches keep 14 playoff teams per season");
ok(sum.po.every((v, i) => v === a.po[i] + b.po[i]) && sum.watch[0].nH === a.watch[0].nH + b.watch[0].nH, "counts add batch by batch");
ok(U.nextPollDelay(false, 0, "closed") === 120e3 && U.nextPollDelay(true, 0, "closed") === 20e3 && U.nextPollDelay(true, 5, "closed") === 80e3 && U.nextPollDelay(false, 1, "open") === 300e3, "poll timing: 20 s live, 2 min idle, backoff capped at 4x, breaker cool-down");

// ---- feed filter and ticker (expected counts computed from the fixture, not from the code under test) ----
const inRange = (e, span) => Date.parse(e.ts) >= now - span && Date.parse(e.ts) <= now + 5 * 60e3;
const expInj = sample.events.filter((e) => e.type === "injury").length + pageNews.filter((n) => n.kind === "injury").length;
const injList = U.filterFeed(M.events, ["injury"], "season", now, "");
ok(expInj >= 2 && injList.length === expInj && injList.every((e) => e.type === "injury"), "type chips filter to exactly the matching events");
const expBreak = sample.events.filter((e) => e.importance >= U.BREAKING_MIN).length;
ok(expBreak > 0 && U.filterFeed(M.events, ["breaking"], "season", now, "").length === expBreak, "breaking narrows to the high-importance events");
ok(U.filterFeed(M.events, ["news"], "season", now, "").some((e) => e.type === "qb_change"), "the News chip includes quarterback changes");
const exp1h = sample.events.filter((e) => inRange(e, H)).length;
ok(exp1h > 0 && U.filterFeed(M.events, [], "1h", now, "").length === exp1h, "the time range filters the feed");
const expGiants = sample.events.filter((e) => e.teams.includes("NYG") || /giants/i.test(e.title)).length + pageNews.filter((n) => n.team === idx("NYG") || /giants/i.test(n.headline || n.summary || "")).length;
ok(expGiants >= 2 && U.filterFeed(M.events, [], "season", now, "giants").length === expGiants, "search matches team or title");
eq(U.feedEmptyText(["injury"], "6h", ""), "No injuries in the last 6 hours.", "empty-state wording");
const tk = U.tickerEvents(M.events, "7d", now);
ok(tk.length > 0 && tk.length <= 12 && tk[0].id === te.id && tk.every((e, k, x) => k === 0 || x[k - 1].importance >= e.importance), "the ticker shows the top events by importance");


// ---- media center (M8): expected lists come from the fixture's own fields ----
const MD = M.media, SV = sample.media.videos;
ok(MD.present && MD.channels.length === sample.media.channels.length && MD.videos.length === SV.length && MD.podcasts.length === sample.media.podcasts.length, "the media block is read in full");
const byNewest = (list) => list.slice().sort((x, y) => Date.parse(y.published) - Date.parse(x.published)).map((v) => v.videoId);
const vids = (kind, shorts, range, q) => U.filterVideos(MD.videos, kind, shorts, range, now, q || "").map((v) => v.videoId);
eq(vids("all", false, "season"), byNewest(SV.filter((v) => v.kind !== "short")), "All: newest first, Shorts hidden");
eq(vids("all", true, "season"), byNewest(SV), "Shorts appear only when chosen");
ok(SV.some((v) => v.kind === "short") && vids("all", false, "season").length === SV.length - SV.filter((v) => v.kind === "short").length, "the fixture's Short is the one left out");
["press", "highlights", "preview"].forEach((k) => eq(vids(k, true, "season"), byNewest(SV.filter((v) => v.kind === k)), "kind chip: " + k));
ok(vids("press", false, "season").length === 1, "the press chip finds the fixture's press conference");
eq(vids("all", false, "1h"), byNewest(SV.filter((v) => v.kind !== "short" && inRange({ ts: v.published }, H))), "videos respect the time range (1 hour)");
eq(vids("all", true, "6h"), byNewest(SV.filter((v) => inRange({ ts: v.published }, 6 * H))), "videos respect the time range (6 hours)");
ok(vids("all", false, "1h").length === 1, "exactly one non-Short video in the last hour");
eq(vids("all", true, "season", "chiefs"), byNewest(SV.filter((v) => (v.teams || []).includes("KC") || /chiefs/i.test(v.title + v.channel))), "search matches team, title or channel");
const tv = (a) => U.teamVideos(MD.videos, idx(a)).map((v) => v.videoId);
eq(tv("BUF"), byNewest(SV.filter((v) => v.team === "BUF" || (v.teams || []).includes("BUF"))), "team videos: own channel or named in the title, newest first");
ok(tv("BUF").length === 2 && tv("KC").length === 2 && tv("NYG").length === 0, "team matching on the fixture");
eq(U.gameVideos(MD.videos, idx("MIA"), idx("BUF"), now).map((v) => v.videoId), byNewest(SV.filter((v) => (v.teams || []).includes("MIA") && (v.teams || []).includes("BUF"))), "game videos: both teams named");
const syn = [{ videoId: "either-new", teams: [idx("DAL")], ts: now - H, tsMs: now - H }, { videoId: "both-old", teams: [idx("DAL"), idx("TEN")], ts: now - 5 * H, tsMs: now - 5 * H },
  { videoId: "other", teams: [idx("SEA")], ts: now - H, tsMs: now - H }, { videoId: "too-old", teams: [idx("DAL"), idx("TEN")], ts: now - 8 * 24 * H, tsMs: now - 8 * 24 * H }];
eq(U.gameVideos(syn, idx("TEN"), idx("DAL"), now).map((v) => v.videoId), ["both-old", "either-new"], "both teams first, then either; other teams and anything older than 7 days left out");
eq(U.gameVideos(MD.videos, idx("MIA"), idx("BUF"), now + 8 * 24 * H), [], "nothing older than 7 days");
eq(U.channelOrder(MD.channels, null).map((c) => c.team), [null, idx("BUF"), idx("KC")], "channels: NFL first, then teams");
eq(U.channelOrder(MD.channels, idx("KC")).map((c) => c.team), [idx("KC"), null, idx("BUF")], "a selected team's channel goes first");
const vc = U.videoCounts(U.filterVideos(MD.videos, "all", true, "season", now, ""));
ok(vc[idx("BUF")] === 2 && vc[idx("MIA")] === 2 && vc[idx("KC")] === 2 && vc[idx("NYG")] === undefined, "map layer counts each team's videos");
eq(U.filterPodcasts(MD.podcasts, "6h", now, "").map((p) => p.id), sample.media.podcasts.filter((p) => inRange({ ts: p.published }, 6 * H)).map((p) => p.id), "podcasts respect the time range");
eq(U.filterPodcasts(MD.podcasts, "season", now, "giants").map((p) => p.id), ["pod-2"], "podcast search matches the team named");
ok(U.LAYERS.some((l) => l.id === "video" && l.group === "Intelligence" && !l.defaultOn && l.sourceIds.includes("youtube-official")), "the Video map layer is registered, off by default");

// ---- media allowlists: anything else is not rendered ----
ok(U.safeEmbedSrc("https://www.youtube-nocookie.com/embed/fxVideo0001") && U.safeEmbedSrc("https://www.youtube.com/embed/fxVideo0001"), "YouTube video embeds (privacy-enhanced, standard) are accepted");
ok(U.safeEmbedSrc("https://www.youtube.com/embed/live_stream?channel=UCDVYQ4Zhbm3S2dlz7P1GBDg") === null, "the live_stream embed is not used (it showed 'unavailable' in testing); live is a link");
["javascript:alert(1)", "http://www.youtube.com/embed/fxVideo0001", "https://evil.example/embed/fxVideo0001", "https://www.youtube.com.evil.example/embed/fxVideo0001",
  "https://www.youtube.com/embed/fxVideo0001?autoplay=1", "https://www.youtube.com/watch?v=fxVideo0001", "//www.youtube.com/embed/fxVideo0001", " https://www.youtube.com/embed/fxVideo0001",
  "https://www.youtube.com/embed/live_stream?channel=x", "data:text/html,<script>", null, 42].forEach((u) => ok(U.safeEmbedSrc(u) === null, "player refuses " + String(u)));
ok(U.safeThumbSrc("https://i.ytimg.com/vi/fxVideo0001/mqdefault.jpg") === "https://i.ytimg.com/vi/fxVideo0001/mqdefault.jpg", "YouTube thumbnails are accepted");
["http://i.ytimg.com/vi/x/mq.jpg", "https://i.ytimg.com.evil.example/x.jpg", "https://img.youtube.com/vi/x/0.jpg", "javascript:alert(1)", "https://i.ytimg.com/vi/../../x.jpg", "https://i.ytimg.com/vi/x.jpg?y=1"].forEach((u) => ok(U.safeThumbSrc(u) === null, "image refuses " + u));
const OMNY = "https://podtrac.com/pts/redirect.mp3/traffic.omny.fm/d/clips/e73c998e-6e60-432f-8610-ae210140c5b1/00000000-0000-4000-8000-000000000001/00000000-0000-4000-8000-0000000000a1/audio.mp3?utm_source=Podcast";
ok(U.safeAudioSrc(OMNY) === OMNY, "a clip of the NFL's Omny account is accepted");
ok(U.PODCAST_AUDIO_RE.source === require(path.join(__dirname, "..", "lib", "contract.js")).PODCAST_AUDIO.source, "the page's audio rule is identical to the contract's");
["https://example.com/fixture/pod1.mp3", "https://127.0.0.1:1/x.mp3", OMNY.replace("e73c998e-6e60-432f-8610-ae210140c5b1", "00000000-0000-0000-0000-000000000000"), OMNY + '"', OMNY.replace("https://", "https://evil.example/")].forEach((u) => ok(U.safeAudioSrc(u) === null, "audio refuses " + u.slice(0, 60)));
ok(U.safeHttpsLink("https://omny.fm/shows/fixture/ep-1") && !U.safeHttpsLink("https://evil.example/ep") && !U.safeHttpsLink("https://omny.fm/shows/x?\"onclick"), "episode links: omny.fm show pages only");
const FA = U.playerFrameAttrs("https://www.youtube-nocookie.com/embed/fxVideo0001", "T");
ok(FA.referrerpolicy === "strict-origin-when-cross-origin" && !/autoplay/.test(FA.allow + FA.src) && FA.allowfullscreen === true && /YouTube player/.test(FA.title), "the video player sends a referrer and never autoplays");
const AA = U.audioAttrs(OMNY, "Show: title");
ok(AA.preload === "none" && AA.controls === true && !("autoplay" in AA) && AA.referrerpolicy === "no-referrer" && AA["data-label"] === "Show: title", "podcast audio: no preloading, no autoplay, no referrer");
["http://example.com/a.mp3", "javascript:alert(1)", "data:audio/mp3;base64,AAAA", "https://user:pw@example.com/a.mp3", "https://example.com/a b.mp3", "ftp://example.com/a.mp3"].forEach((u) => ok(U.safeAudioSrc(u) === null, "audio refuses " + u));
ok(U.safeYouTubeLink("https://www.youtube.com/watch?v=fxVideo0001") && U.safeYouTubeLink("https://www.youtube.com/channel/UCDVYQ4Zhbm3S2dlz7P1GBDg") && U.safeYouTubeLink("https://www.youtube.com/channel/UCDVYQ4Zhbm3S2dlz7P1GBDg/live") && !U.safeYouTubeLink("https://evil.example/watch?v=fxVideo0001") && !U.safeYouTubeLink("javascript:alert(1)") && !U.safeYouTubeLink("https://www.youtube.com/channel/UCDVYQ4Zhbm3S2dlz7P1GBDg/videos"), "YouTube links: watch, channel and channel live pages only");
const MDc = U.buildModel(live).media.channels;
ok(MDc.length >= 3 && MDc.every((c) => c.live === "https://www.youtube.com/channel/" + c.channelId + "/live"), "every channel links to its own live page");
const swapM = JSON.parse(JSON.stringify(live)); swapM.media.channels[0].liveUrl = "https://www.youtube.com/channel/" + swapM.media.channels[1].channelId + "/live";
ok(U.buildModel(swapM).media.channels.find((c) => c.channelId === swapM.media.channels[0].channelId).live === null, "a live link to another channel is dropped");
const evilM = JSON.parse(JSON.stringify(live));
Object.assign(evilM.media.videos[0], { embedUrl: "https://evil.example/embed/fxVideo0001", thumb: "http://i.ytimg.com/vi/x/mq.jpg" });
evilM.media.podcasts[0].audioUrl = "javascript:alert(1)"; evilM.media.podcasts[0].url = "http://example.com/x";
evilM.media.channels[0].liveUrl = "https://evil.example/live";
evilM.media.videos.push(Object.assign({}, evilM.media.videos[1]), null, { title: "no date", videoId: "abcdefghijk" });
const EM = U.buildModel(evilM).media, ev0 = EM.videos.find((v) => v.videoId === "fxVideo0001");
ok(ev0.embed === null && ev0.thumb === null && ev0.url === "https://www.youtube.com/watch?v=fxVideo0001", "a bad embed or image address is dropped; the YouTube link stays");
ok(EM.podcasts.find((p) => p.id === "pod-1").audio === null && EM.podcasts.find((p) => p.id === "pod-1").url === null, "a bad audio or episode address is dropped");
ok(EM.channels.find((c) => c.team === null).live === null && EM.videos.length === SV.length, "bad live links dropped; duplicates and malformed videos skipped");
const noMedia = JSON.parse(JSON.stringify(live)); delete noMedia.media; delete noMedia.sources["youtube-official"]; delete noMedia.sources["podcasts-nfl"];
const NM = U.buildModel(noMedia).media;
ok(NM.present === false && NM.channels.length === 0 && NM.videos.length === 0 && NM.podcasts.length === 0 && U.buildModel(null).media.present === false, "a payload without media gives an empty, marked media block");
eq(U.filterVideos(NM.videos, "all", true, "season", now, ""), [], "and no videos");
eq(U.freshness(["youtube-official", "podcasts-nfl"], meta({ payload: noMedia }), now).label, "UNAVAILABLE", "the Media badge reads UNAVAILABLE without its sources");
ok(U.freshness(["youtube-official", "podcasts-nfl"], meta(), now).label.startsWith("LIVE · 15m"), "and reflects them when present");

// ---- hosts that refuse outside media (claude.ai's artifact viewer): refusals switch videos and episodes to links ----
const cspv = (d, uri) => ({ effectiveDirective: d, blockedURI: uri });
[cspv("img-src", "https://i.ytimg.com/vi/fxVideo0001/mqdefault.jpg"), cspv("img-src", "https://i.ytimg.com"), cspv("frame-src", "https://www.youtube-nocookie.com/embed/fxVideo0001"),
  cspv("child-src", "https://www.youtube.com"), cspv("media-src", OMNY), cspv("media-src", "https://pdrl.fm/abcd/traffic.omny.fm/x"), cspv("media-src", "https://www.podtrac.com/pts/redirect.mp3/x"),
  cspv("media-src", "https://claritaspod.com/measure/x"), { violatedDirective: "default-src 'self'", blockedURI: "https://i.ytimg.com/vi/x/mq.jpg" }, { effectiveDirective: "img-src", blockedURL: "https://i.ytimg.com/x" }]
  .forEach((e) => ok(U.isMediaBlock(e) === true, "a refusal of " + (e.effectiveDirective || e.violatedDirective) + " for " + (e.blockedURI || e.blockedURL) + " switches media to links"));
[cspv("img-src", "https://evil.example/x.png"), cspv("img-src", "https://ytimg.com.evil.example/x"), cspv("img-src", "https://notyoutube.com/x"), cspv("script-src", "https://www.youtube.com/iframe_api"),
  cspv("connect-src", "https://i.ytimg.com/x"), cspv("img-src", "inline"), cspv("img-src", ""), {}, null, "img-src", cspv("style-src", "https://omny.fm/x")]
  .forEach((e, k) => ok(U.isMediaBlock(e) === false, "refusal " + k + " (another host, another kind of resource, or malformed) changes nothing"));
const vPlay = { embed: "https://www.youtube-nocookie.com/embed/fxVideo0001", url: "https://www.youtube.com/watch?v=fxVideo0001" };
eq([U.videoAction(vPlay, false), U.videoAction(vPlay, true), U.videoAction({ embed: null, url: vPlay.url }, false), U.videoAction({ embed: vPlay.embed, url: null }, true), U.videoAction({}, false)],
  ["play", "link", "link", "text", "text"], "videos play in the page unless the host blocks players; then they link to YouTube, or show as text with no link");
const pPlay = { audio: OMNY, url: "https://omny.fm/shows/fixture/ep-1" };
eq([U.podcastAction(pPlay, false), U.podcastAction(pPlay, true), U.podcastAction({ audio: OMNY, url: null }, true), U.podcastAction({ audio: null, url: pPlay.url }, false), U.podcastAction({}, true)],
  ["play", "page", "file", "page", "none"], "episodes play in the page unless the host blocks audio; then the episode page, else the feed's own audio file");

// ---- [S-C time machine] replaying the feed as of an earlier moment (src/universe/18-history.js); synthetic events only ----
{
  const T0 = Date.parse("2025-11-22T18:00:00Z"), HR = 3600e3, isoAt = (h) => new Date(T0 + h * HR).toISOString();
  // tsH: when it happened, seenH: when this system first saw it (hours from T0; null = no first-seen time recorded)
  const rawEv = (id, tsH, seenH, teams, extra) => Object.assign({ id, type: "news", ts: isoAt(tsH), teams, title: "Synthetic " + id, url: "https://example.test/" + id,
    source: "rss-fixture", publisher: "Fixture", importance: 50, confidence: 0.7, sourceCount: 1, sources: [] }, seenH == null ? {} : { seenAt: isoAt(seenH) }, extra || {});
  const rawList = [rawEv("seen-before", -3, -2, ["NYG"]), rawEv("happened-before-seen-after", -5, 1, ["DAL"]), rawEv("old", -30, -29, ["BUF"]), rawEv("later", 2, 2, ["NYG"]),
    rawEv("no-seen", -4, null, ["NYG"]), rawEv("seen-at-T", -1, 0, ["PHI"]), rawEv("afc", -3, -2, ["BUF"], { importance: 90 })];
  const evs = U.historyEvents(null, [], rawList, []), ids = (l) => l.map((e) => e.id).sort();

  // asOf in the URL: strict form, canonical minute, nothing malformed, nothing in the future
  const nowT = T0 + 10 * HR;
  eq(U.parseAsOf("2025-11-22T18:00Z", nowT), "2025-11-22T18:00Z", "a UTC minute is a valid replay time");
  eq([U.parseAsOf("2025-11-22T18:00:59Z", nowT), U.parseAsOf("2025-11-22T18:00:59.999Z", nowT)], ["2025-11-22T18:00Z", "2025-11-22T18:00Z"], "seconds are dropped, never rounded up");
  ok(U.asOfMs("2025-11-22T18:00Z") === T0 && U.toAsOf(T0 + 59999) === "2025-11-22T18:00Z", "the canonical form converts to and from milliseconds");
  ["2025-11-22", "2025-11-22T18:00", "2025-11-22T18:00+01:00", "2025-11-22 18:00Z", "2025-02-31T10:00Z", "2025-11-22T25:00Z", "2025-13-01T00:00Z", "1999-12-31T23:59Z", "yesterday", "", " 2025-11-22T18:00Z",
    "2025-11-22T18:00Z<script>", "2025-11-22T18:00Z\n", "1763834400000", 1763834400000, null, undefined, {}, ["2025-11-22T18:00Z"]]
    .forEach((v) => ok(U.parseAsOf(v, nowT) === null, "malformed replay time dropped: " + JSON.stringify(v)));
  ok(U.parseAsOf(U.toAsOf(nowT + 60e3), nowT) === null && U.parseAsOf("2999-01-01T00:00Z") === null, "a replay time in the future is dropped");
  ok(U.parseAsOf(U.toAsOf(nowT), nowT) === U.toAsOf(nowT), "the present minute is allowed");
  const allowT = Object.assign({ now: nowT }, allow);
  eq(U.parseUrlState("?asOf=2025-11-22T18:00Z&timeRange=24h", allowT), { timeRange: "24h", asOf: "2025-11-22T18:00Z" }, "?asOf= is read from the URL");
  eq(U.parseUrlState(U.serializeUrlState({ asOf: "2025-11-22T18:00Z", focus: "NYG" }, defaults), allowT), { focus: "NYG", asOf: "2025-11-22T18:00Z" }, "asOf round-trips through the URL beside the focus");
  eq(U.serializeUrlState(Object.assign({ asOf: null }, defaults), defaults), "", "no replay leaves the URL clean");
  eq([U.parseUrlState("?asOf=2025-11-22T18%3A00Z", allowT).asOf, U.parseUrlState("?asOf=2025-11-23T09:00Z", allowT).asOf, U.parseUrlState("?asOf=now", allowT).asOf, U.parseUrlState("?asOf=", allowT).asOf],
    ["2025-11-22T18:00Z", undefined, undefined, undefined], "an encoded colon is fine; a future or malformed asOf is dropped");
  eq([U.initialState("?asOf=2025-11-22T18:00Z", {}).asOf, U.initialState("?asOf=2999-01-01T00:00Z", {}).asOf, U.initialState("?asOf=%3Cscript%3E", {}).asOf, U.initialState("", {}).asOf],
    ["2025-11-22T18:00Z", null, null, null], "the page starts in a replay only for a valid past asOf; otherwise now");
  ok(U.initialState("?asOf=2025-11-22T18:00Z&focus=NFC-EAST&timeRange=24h", {}).focus === "NFC-EAST", "asOf sits beside focus and time range in the initial state");

  // the leakage rule: shown only if first seen at or before T; the event time alone never qualifies
  const at = U.replayFilter(evs, T0);
  eq(ids(at.events), ["afc", "old", "seen-at-T", "seen-before"], "shown at T: exactly the items first seen at or before T");
  ok(evs.some((e) => e.id === "happened-before-seen-after" && e.ts < T0 && e.seen > T0) && !at.events.some((e) => e.id === "happened-before-seen-after"), "an item that happened before T but was first seen after T is hidden");
  eq([at.later, at.unknown], [2, 1], "two items first seen later are hidden; one with no first-seen time is left out and counted");
  ok(at.events.every((e) => e.seen <= T0), "nothing shown was seen after T");
  eq(ids(U.replayFilter(evs, T0 + 1 * HR).events).length, 5, "an hour later, the late-arriving item has arrived");
  eq([U.replayFilter(evs, T0 - 100 * HR).events.length, U.replayFilter(evs, NaN).events.length, U.replayFilter(null, T0).events.length, U.replayFilter([null, {}, { seen: "x" }], T0).unknown], [0, 0, 0, 3], "before the record, a bad time, no list and malformed items all show nothing");

  // ranges count back from T, not from the real now
  eq(ids(U.replayWindow(evs, T0, "24h")), ["afc", "seen-at-T", "seen-before"], "24 hours means the 24 hours before T: the 30-hour-old item is out");
  eq(ids(U.replayWindow(evs, T0, "48h")), ["afc", "old", "seen-at-T", "seen-before"], "48 hours before T reaches it");
  eq(ids(U.replayWindow(evs, T0, "1h")), ["seen-at-T"], "the last hour before T");
  eq(U.filterByTime(U.replayFilter(evs, T0).events, "24h", T0 + 400 * HR), [], "the same items fall outside 24 hours counted from a later now, which is why T is the reference");
  ok(U.replayWindow(evs, T0, "season").length === 4 && U.replayWindow(evs, T0, "bogus").length === 4, "season keeps everything seen by T; an unknown range falls back to the default");

  // composition with focus, type chips and search
  eq(ids(U.focusEvents(U.replayWindow(evs, T0, "24h"), U.focusSet("NFC-EAST"))), ["seen-at-T", "seen-before"], "focus narrows the replay; the NFC East item seen later stays hidden");
  eq(ids(U.focusEvents(U.replayWindow(evs, T0, "48h"), U.focusSet("AFC"))), ["afc", "old"], "another focus, same replay");
  eq(ids(U.focusEvents(U.filterFeed(U.replayFilter(evs, T0).events, ["breaking"], "24h", T0, ""), U.focusSet("BUF"))), ["afc"], "feed chips, range from T and focus compose");
  eq(ids(U.filterFeed(U.replayFilter(evs, T0).events, [], "7d", T0, "giants")), ["seen-before"], "search composes with the replay");
  eq(U.tickerEvents(U.focusEvents(U.replayFilter(evs, T0).events, U.focusSet("NYG")), "24h", T0).map((e) => e.id), ["seen-before"], "the ticker reads the same replayed list");

  // the archive merge: one record per id, the earliest first-seen record wins whole
  const first = rawEv("dup", -6, -5, ["NYG"], { title: "As first recorded", sourceCount: 1 }), revised = rawEv("dup", -6, 3, ["NYG"], { title: "Revised later", sourceCount: 4 });
  const merged = U.mergeSeen([[revised, rawEv("solo", -1, -1, [])], [first, first], [null, "x", { title: "no id" }], "not a list"]);
  eq(merged.map((e) => e.id), ["dup", "solo"], "duplicates by id collapse; malformed entries are ignored");
  ok(merged[0].seenAt === isoAt(-5) && merged[0].title === "As first recorded" && merged[0].sourceCount === 1, "the earliest seenAt wins, with the record as it stood then");
  eq(U.mergeSeen([[first], [revised]])[0].title, "As first recorded", "whatever the order of the lists");
  eq(U.mergeSeen([[rawEv("t", 0, 1, [], { title: "first list" })], [rawEv("t", 0, 1, [], { title: "second list" })]])[0].title, "first list", "on a tie the earlier list is kept");
  eq(U.mergeSeen([[rawEv("m", 0, null, [])], [rawEv("m", 0, 2, [], { title: "has a seen time" })]])[0].title, "has a seen time", "a record with a first-seen time beats one without");
  eq([U.mergeSeen(null), U.mergeSeen([])], [[], []], "nothing in, nothing out");
  // the embedded archive: full records, and {id, seenAt} references into the snapshot beside it
  const snap = [rawEv("in-snap", -2, 4, ["DAL"], { title: "Body from the snapshot" })];
  const arc = { v: 1, events: [rawEv("arch-only", -8, -7, ["BUF"]), { id: "in-snap", seenAt: isoAt(-1) }, { id: "gone", seenAt: isoAt(-1) }, null, { seenAt: isoAt(-1) }] };
  eq(U.expandArchive(arc, snap).map((e) => [e.id, e.seenAt, e.title]), [["arch-only", isoAt(-7), "Synthetic arch-only"], ["in-snap", isoAt(-1), "Body from the snapshot"]], "a reference takes its body from the snapshot and its first-seen time from the archive; a dangling one is dropped, not invented");
  eq([U.expandArchive(null, snap), U.expandArchive({ v: 2, events: [] }, snap), U.expandArchive({ v: 1 }, snap)], [[], [], []], "a missing or unknown archive yields nothing");
  const all = U.historyEvents(arc, snap, [rawEv("in-snap", -2, 5, ["DAL"]), rawEv("live-only", -1, -0.5, ["NYG"]), { id: "bad", seenAt: isoAt(0) }], []);
  eq(ids(all), ["arch-only", "in-snap", "live-only"], "archive, snapshot and current payload merge into one list; a record with no title is skipped");
  ok(all.find((e) => e.id === "in-snap").seen === T0 - HR, "and the archive's earlier first-seen time is the one used");
  eq(ids(U.replayFilter(all, T0).events), ["arch-only", "in-snap", "live-only"], "so the item counts as seen at T although the live payload saw it later");
  const span = U.historySpan(all);
  ok(span.from === T0 - 7 * HR && span.to === T0 - 0.5 * HR && span.n === 3 && U.historySpan([]) === null && U.historySpan([{ seen: NaN }]) === null, "the record's span is its first and last first-seen times; an empty record has none");
  // the page's own curated news has a date but no first-seen time: left out of a replay and counted, unless the record has the same link
  const pageA = { id: "page-news-0", type: "news", ts: T0 - 40 * HR, tsMs: T0 - 40 * HR, seen: T0 - 40 * HR, teams: [], players: [], title: "Curated", url: "https://example.test/curated", origin: "page", dateOnly: true, importance: null };
  const pageB = Object.assign({}, pageA, { id: "page-news-1", url: "https://example.test/arch-only" });
  const withPage = U.historyEvents(arc, snap, [], [pageA, pageB]), rp = U.replayFilter(withPage, T0);
  ok(withPage.length === 3 && rp.unknown === 1 && !rp.events.some((e) => e.origin === "page"), "a dated-only curated item is never placed in the replay by its date; a duplicate link is dropped");
  ok(pageA.seen === T0 - 40 * HR, "and the model's own item is not altered");

  // wording: the banner says what is and is not replayed, where the record begins and what was left out
  eq(U.replayRangePhrase("7d", null), "in the last 7 days", "the usual range wording when not replaying");
  eq([U.replayRangePhrase("7d", "Nov 22, 1:00 PM"), U.replayRangePhrase("season", "Nov 22, 1:00 PM")], ["in the 7 days before Nov 22, 1:00 PM", "this season up to Nov 22, 1:00 PM"], "ranges are worded from the replay time");
  const bt = U.replayBannerText({ when: "Sat, Nov 22, 1:00 PM EST", from: "Fri, Nov 21, 11:06 AM EST", shown: 4, unknown: 2, before: false });
  eq(bt.main, "Replaying the feed as of Sat, Nov 22, 1:00 PM EST", "the banner names the replay time");
  ok(/the intelligence feed, the ticker and the map's news, transaction and breaking badges/.test(bt.info) && /Not replayed, still current, because no dated copies of them exist: scores, lines, injuries, the simulation and playoff chances/.test(bt.info), "it lists what is replayed and what stays current");
  ok(/record begins Fri, Nov 21, 11:06 AM EST/.test(bt.info) && /4 items had been seen by then\./.test(bt.info) && /2 items with no recorded first-seen time are left out\./.test(bt.info), "it gives the record's start, the count seen and the count left out");
  const bt1 = U.replayBannerText({ when: "x", from: "y", shown: 0, unknown: 1, before: true });
  ok(/before the record begins, so nothing is shown/.test(bt1.info) && /1 item with no recorded first-seen time is left out/.test(bt1.info) && !/had been seen/.test(bt1.info), "a time before the record says so");
  ok(/No dated event record is available/.test(U.replayBannerText({ when: "x", from: null, shown: 0, unknown: 0 }).info), "and so does a page with no record");
  eq(U.feedEmptyText([], "24h", "", U.replayRangePhrase("24h", "Nov 22, 1:00 PM")), "No events in the 24 hours before Nov 22, 1:00 PM.", "the feed's empty message is worded from the replay time");
  eq(U.feedEmptyText([], "24h", ""), "No events in the last 24 hours.", "and unchanged otherwise");
}
// ==== S-D intelligence depth (src/universe/17-watch.js): watchlist alerts, what changed, conflicting reports. Self-contained block. ====
{
  const W = U.WATCH, T0 = Date.parse("2026-11-23T12:00:00Z"), MIN = 60e3, DAY = 24 * H, iBUF = idx("BUF"), iNYG = idx("NYG"), iKC = idx("KC");
  let seq = 0;
  const mk = (o) => Object.assign({ id: "t-" + (++seq), type: "news", ts: T0, seen: T0 + MIN, teams: [iBUF], title: "Item " + seq, url: null, publisher: "Pub", importance: 80, dateOnly: false, origin: "feed" }, o);
  const watching = (...abbrs) => U.sanitizeWatch({ since: T0, teams: abbrs.map((a) => ({ a, at: T0 })) });
  const base = watching("BUF");

  // -- first visit: the baseline is "now" and nothing alerts, then or later, for what was already there --
  const fresh = U.toggleWatch(U.emptyWatch(), "BUF", T0 - 10 * MIN), firstEvs = [mk({ seen: T0 - MIN }), mk({ seen: T0 + MIN })];
  const first = U.planAlerts(firstEvs, fresh, T0, {});
  eq([first.fired.length, first.merged.length, first.state.alerts.length, first.state.since], [0, 0, 0, T0], "first visit: the baseline becomes now and nothing alerts");
  eq(U.planAlerts(firstEvs, first.state, T0 + 5 * MIN, {}).fired.length, 0, "and what was on the page at the first visit never alerts afterwards");
  eq(U.planAlerts([mk({ seen: T0 - MIN })], base, T0 + MIN, {}).state, base, "an item first seen before the baseline is ignored and leaves the state untouched");

  // -- dedupe: once per event id, also after a reload --
  const e1 = mk({ title: "Bills place tackle on injured reserve", type: "transaction", importance: null });
  const r1 = U.planAlerts([e1], base, T0 + 2 * MIN, {});
  eq([r1.fired.length, r1.fired[0].team, r1.fired[0].count, r1.fired[0].title, r1.fired[0].read], [1, "BUF", 1, e1.title, false], "a new item for a watched team raises one alert carrying the source's own headline");
  const r2 = U.planAlerts([e1], r1.state, T0 + 30 * MIN, {});
  ok(r2.fired.length === 0 && r2.merged.length === 0 && r2.state === r1.state, "the same event id never alerts twice");
  const reloaded = U.sanitizeWatch(JSON.parse(JSON.stringify(r1.state)));
  eq(reloaded, r1.state, "the stored state survives a save and reload unchanged");
  eq(U.planAlerts([e1], reloaded, T0 + DAY, {}).fired.length, 0, "and the event stays silent after a reload");
  eq([U.unreadCount(r1.state), U.unreadCount(U.markRead(r1.state, r1.fired[0].id)), U.unreadCount(U.markRead(r1.state, "nope")), U.clearAlerts(r1.state).alerts.length], [1, 0, 1, 0], "unread count, mark read and clear");
  eq(U.alertText(r1.fired[0]).head, "New for the Bills: transaction", "a single alert names the team and the kind");

  // -- cooldown: a burst for one team is one alert that says how many --
  const burst = [mk({ importance: 72 }), mk({ type: "injury", importance: 30, title: "Lead by type alone" }), mk({ type: "qb_change", importance: 91, title: "Most important item" })];
  const b1 = U.planAlerts(burst, base, T0 + 2 * MIN, {});
  eq([b1.fired.length, b1.fired[0].count, b1.fired[0].title, b1.state.alerts.length], [1, 3, "Most important item", 1], "three items for one team in one pass collapse into one alert led by the most important");
  eq(U.alertText(b1.fired[0]).head, "3 new items for the Bills", "and the alert says how many");
  const b2 = U.planAlerts(burst.concat([mk({ type: "injury", importance: 20 })]), U.markRead(b1.state, null), T0 + 7 * MIN, {});
  eq([b2.fired.length, b2.merged.length, b2.state.alerts.length, b2.state.alerts[0].count, b2.state.alerts[0].read, b2.state.alerts[0].title], [0, 1, 1, 4, false, "Most important item"], "inside the cooldown a later item joins the same alert (count 4, unread again) without a new toast");
  const b3 = U.planAlerts([mk({ type: "injury" })], b2.state, T0 + 2 * MIN + W.COOLDOWN_MS, {});
  eq([b3.fired.length, b3.state.alerts.length, b3.state.alerts[0].count], [1, 2, 1], "after the cooldown the next item raises a new alert");
  const two = U.planAlerts([mk({ teams: [iBUF, iKC] }), mk({ teams: [iKC] }), mk({ teams: [iNYG] })], watching("BUF", "KC"), T0 + 2 * MIN, {});
  eq(two.fired.map((a) => [a.team, a.count]), [["BUF", 1], ["KC", 1]], "the cooldown is per team; an item tagged with two watched teams fires once; an unwatched team stays silent");

  // -- importance and type rules --
  eq([mk({ importance: W.MIN_IMPORTANCE - 1 }), mk({ importance: W.MIN_IMPORTANCE }), mk({ importance: null }), mk({ type: "game", importance: 45 }), mk({ type: "injury", importance: 5 }),
    mk({ type: "transaction", importance: null }), mk({ type: "qb_change", importance: null }), mk({ type: "weather", importance: 99 })].map(U.alertWorthy),
  [false, true, false, false, true, true, true, true], "injuries, quarterback changes and transactions always count; anything else needs the breaking score");
  ok(W.MIN_IMPORTANCE === U.BREAKING_MIN && W.TYPES.join() === "injury,qb_change,transaction", "the threshold is the feed's own breaking score");
  const quiet = U.planAlerts([mk({ importance: 40 }), mk({ type: "game", importance: 45 })], base, T0 + 2 * MIN, {});
  eq([quiet.fired.length, quiet.state.seen.length], [0, 2], "low-importance news raises nothing but is remembered as seen");

  // -- watching starts when the star is set; stale items stay silent --
  const eKC = mk({ teams: [iKC], type: "injury" }), unw = U.planAlerts([eKC], base, T0 + 2 * MIN, {});
  const starred = U.toggleWatch(unw.state, "KC", T0 + 3 * MIN);
  eq([unw.fired.length, U.planAlerts([eKC], starred, T0 + 4 * MIN, {}).fired.length], [0, 0], "an item seen before its team was starred does not alert once it is");
  eq(U.planAlerts([mk({ teams: [iKC], type: "injury", seen: T0 + 2 * MIN })], U.toggleWatch(base, "KC", T0 + 3 * MIN), T0 + 4 * MIN, {}).fired.length, 0, "nor does an unseen item first seen before the star");
  eq(U.planAlerts([mk({ teams: [iKC], type: "injury", seen: T0 + 5 * MIN })], starred, T0 + 6 * MIN, {}).fired.map((a) => a.team), ["KC"], "one first seen after the star does");
  ok(U.isWatched(starred, "KC") && !U.isWatched(U.toggleWatch(starred, "KC", T0), "KC") && U.toggleWatch(base, "XXX", T0) === base, "toggling stars and unstars; an unknown team is ignored");
  eq(U.planAlerts([mk({ type: "injury", ts: T0 - W.MAX_AGE_MS - H })], base, T0 + 2 * MIN, {}).fired.length, 0, "an item that happened more than a week ago is stale and does not alert, even when newly seen");

  // -- fixture data never alerts (and the same data without the fixture mark would) --
  const old = U.sanitizeWatch({ since: Date.parse("2026-11-20T00:00:00Z"), teams: [{ a: "NYG", at: Date.parse("2026-11-20T00:00:00Z") }] });
  const fx = U.planAlerts(MF.events, old, now, { fixture: MF.fixture });
  ok(MF.fixture === true && fx.fired.length === 0 && fx.state === old, "fixture data raises no alert and is not remembered");
  const nfx = U.planAlerts(M.events, old, now, { fixture: M.fixture });
  ok(M.fixture === false && nfx.fired.length === 1 && nfx.fired[0].team === "NYG" && nfx.fired[0].title === "Fixture QB One (QB) listed Out", "the same items without the fixture mark alert, led by the most important");

  // -- the seen set is bounded, and what leaves it cannot alert again --
  const many = []; for (let k = 0; k < W.SEEN_CAP + 100; k++) many.push(mk({ id: "bulk-" + k, type: "injury", seen: T0 + (k + 1) * 1000, ts: T0 }));
  const big = U.planAlerts(many, base, T0 + H, {});
  eq([big.state.seen.length, big.state.since, big.fired.length, big.fired[0].count], [W.SEEN_CAP, T0 + 100 * 1000, 1, W.SEEN_CAP + 100], "the seen set is capped; the baseline moves up to the newest id dropped");
  const again = U.planAlerts(many, big.state, T0 + 2 * H, {});
  ok(again.fired.length === 0 && again.merged.length === 0 && again.state === big.state, "ids dropped from the bounded set never alert again");
  let cap = base; for (let k = 0; k < W.ALERT_CAP + 5; k++) cap = U.planAlerts([mk({ type: "injury", seen: T0 + H + k })], cap, T0 + H + k * (W.COOLDOWN_MS + 1), {}).state;
  eq(cap.alerts.length, W.ALERT_CAP, "the alert list is bounded too");

  // -- the page's own dated news: keyed by link (its ids are list positions), counted through the end of its day --
  const pg = (id) => mk({ id, origin: "page", url: "https://example.com/story", type: "qb_change", importance: null, dateOnly: true, ts: Date.parse("2026-11-23T00:00:00Z"), seen: Date.parse("2026-11-23T00:00:00Z") });
  const pg1 = U.planAlerts([pg("page-news-0")], base, T0 + MIN, {});
  eq([pg1.fired.length, U.planAlerts([pg("page-news-1")], pg1.state, T0 + H, {}).fired.length], [1, 0], "a curated item dated today alerts once, and not again when its list position changes");

  // -- stored state is untrusted --
  eq(U.sanitizeWatch("x"), U.emptyWatch(), "garbage becomes an empty watchlist");
  const dirty = U.sanitizeWatch({ since: "soon", teams: [{ a: "BUF", at: 1 }, { a: "BUF", at: 2 }, { a: "constructor" }, { a: "XXX" }, null], seen: [["a", 1], ["a", 2], ["b", "x"], "c", ["d".repeat(999), 3]], cool: { BUF: 5, KC: 6, __proto__: 7 },
    alerts: [{ team: "BUF", at: 9, title: "t", url: "javascript:alert(1)", type: "bogus", count: -3 }, { team: "XXX", at: 9, title: "t" }, { team: "BUF", at: 9 }, null] });
  eq(dirty, { teams: [{ a: "BUF", at: 1 }], since: null, seen: [["a", 1]], cool: { BUF: 5 }, alerts: [{ id: "a9-BUF", team: "BUF", at: 9, count: 1, type: "news", title: "t", url: null, publisher: "", imp: null, ts: null, dateOnly: false, read: false }] },
    "unknown teams, duplicates, bad shapes and unsafe links are dropped from stored state");

  // -- visits --
  const poRec = { at: now - 3 * H, mode: 2, n: 10000, v: E.TM.map(() => 0.5) };
  eq(U.rollVisit(undefined, now), { last: now, prev: null, po: null, prevPo: null }, "a first visit has no earlier visit");
  eq(U.rollVisit({ last: now - 3 * H, po: poRec }, now), { last: now, prev: now - 3 * H, po: null, prevPo: poRec }, "coming back later makes the previous visit the baseline and keeps its simulation");
  eq(U.rollVisit({ last: now - 5 * MIN, prev: 123, po: poRec, prevPo: null }, now), { last: now, prev: 123, po: poRec, prevPo: null }, "a reload within the same visit keeps the earlier baseline");
  eq(U.rollVisit({ last: now + DAY, po: { at: 1, mode: 7, v: [] } }, now).prev, null, "a time from the future or a malformed record is not trusted");

  // -- what changed: grouping by type, in the window and the focus --
  const liveMetaWC = { has: true, origin: "live", generatedAt: now, fetchedAt: now, fails: 0, fixture: false };
  const wc = (o) => U.whatChanged(Object.assign({ win: "24h", now, visit: { prev: null }, events: M.events, focus: null, meta: liveMetaWC, sim: null, prev: E.D.prev, history: E.D.history }, o));
  const in24 = M.events.filter((e) => e.ts >= now - DAY && e.ts <= now + 5 * MIN), c24 = wc({});
  const countBy = (list) => { const o = {}; list.forEach((e) => { o[e.type] = (o[e.type] || 0) + 1; }); return o; };
  ok(in24.length > 3 && c24.events.state === "ok" && c24.events.total === in24.length, "24 hours: every event in the window is counted (" + in24.length + ")");
  eq(Object.fromEntries(c24.events.groups.map((g) => [g.type, g.count])), countBy(in24), "and grouped by type with the right counts");
  const order = ["qb_change", "injury", "transaction", "news", "odds_move", "game", "weather", "playoff_move", "model"];
  ok(c24.events.groups.every((g, k, a) => k === 0 || order.indexOf(a[k - 1].type) < order.indexOf(g.type)) && c24.events.groups.every((g) => g.top.length === Math.min(3, g.count) && g.top.every((e, k) => k === 0 || (g.top[k - 1].importance || -1) >= (e.importance || -1))),
    "groups come in a fixed order, each with its three most important items");
  eq([c24.scope.label, c24.scope.level, c24.since], ["NFL", "league", now - DAY], "no focus is labelled NFL");
  const cNYG = wc({ focus: "NYG" }), expNYG = in24.filter((e) => e.teams.includes(iNYG));
  eq([cNYG.scope.label, cNYG.scope.level, cNYG.events.total], ["New York Giants", "team", expNYG.length], "a focus narrows the events and is labelled");
  eq(Object.fromEntries(cNYG.events.groups.map((g) => [g.type, g.count])), countBy(U.focusEvents(in24, U.focusSet("NYG"))), "by the same rule as the rest of the page (focusEvents)");
  const cAFC = wc({ focus: "AFC", win: "7d" });
  ok(cAFC.scope.label === "AFC" && cAFC.events.total === U.focusEvents(M.events.filter((e) => e.ts >= now - 7 * DAY && e.ts <= now + 5 * MIN), U.focusSet("AFC")).length && cAFC.events.total < wc({ win: "7d" }).events.total, "a conference focus with the 7-day window composes the same way");

  // -- what changed: no dated data is said, not shown as zero --
  const cFirst = wc({ win: "visit", sim: { po: E.D.prev.playoffs, mode: 2, n: 1 } });
  eq([cFirst.since, cFirst.events.state, cFirst.events.total, cFirst.forecast.state, cFirst.forecast.why], [null, "no-baseline", 0, "no-baseline", "first-visit"], "since my last visit with no earlier visit: nothing to compare with, for events and forecast alike");
  const vPrev = now - 2 * H, cVisit = wc({ win: "visit", visit: { prev: vPrev } });
  eq(cVisit.events.total, M.events.filter((e) => (e.dateOnly ? e.seen + DAY - 1 : e.seen) > vPrev).length, "since my last visit counts what was first seen after it");
  ok(cVisit.events.total > 0 && cVisit.events.total < M.events.length, "which is some of the events, not all");
  const snapMeta = (age) => ({ has: true, origin: "snapshot", generatedAt: now - age, fetchedAt: null, fails: 0, fixture: false });
  eq([wc({ events: [], meta: snapMeta(3 * DAY) }).events.state, wc({ events: [], meta: snapMeta(2 * H) }).events.state, wc({ events: [], meta: snapMeta(2 * H) }).events.partial, wc({ events: [] }).events.state, wc({ events: [], meta: { has: false } }).events.state],
    ["not-covered", "none", true, "none", "no-feed"], "an empty window reads: snapshot older than the window, covered up to the snapshot, nothing new (live), or no feed at all");
  ok(wc({ meta: snapMeta(2 * H) }).events.state === "ok" && wc({ meta: snapMeta(2 * H) }).events.partial === true && c24.events.partial === false, "a snapshot inside the window is marked as covering only part of it");
  eq(wc({ meta: Object.assign({}, liveMetaWC, { fixture: true }) }).fixture, true, "fixture data is carried through for the label");

  // -- what changed: playoff movement against a dated forecast --
  ok(E.D.prev && E.D.prev.date === "2026-11-21" && E.D.history && E.D.history.po.length >= 2, "the pinned data carries a saved forecast dated Nov. 21 and a weekly history");
  const poNow = E.D.prev.playoffs.slice(); poNow[iNYG] = Math.max(0, poNow[iNYG] - 0.1); poNow[iKC] += poNow[iKC] > 0.5 ? -0.01 : 0.01;
  const simNow = { po: poNow, mode: 2, n: 10000 }, f24 = wc({ sim: simNow }).forecast;
  eq([f24.state, f24.baseline.kind, f24.baseline.rel, f24.moved, f24.movers.map((m) => m.team), f24.noise, f24.modeDiffers], ["ok", "saved", "start", 2, [iNYG, iKC], false, false], "24 hours: compared with the forecast saved the day the window starts; the movers are exactly the teams that moved");
  ok(Math.abs(f24.movers[0].delta + 0.1) < 1e-9 && f24.movers[0].from === E.D.prev.playoffs[iNYG], "with the saved and current values");
  const fKC = wc({ sim: simNow, focus: "KC" }).forecast;
  eq([fKC.movers.map((m) => m.team), fKC.noise], [[iKC], true], "the focus narrows the movers; a one-point move is flagged as simulation noise");
  eq(wc({ sim: simNow, focus: "BUF" }).forecast.movers, [], "a team that did not move is not listed");
  const f7 = wc({ sim: simNow, win: "7d" });
  eq([f7.forecast.state, f7.forecast.baseline.rel], ["ok", "inside"], "7 days: the saved forecast is from inside the window, and says so");
  const Hh = E.D.history, hk = Hh.po.length; let hBest = -1, hMax = 0;
  for (let t = 0; t < E.TM.length; t++) { const d = Math.abs(Hh.po[hk - 1][t] - Hh.po[hk - 2][t]); if (d > hMax) { hMax = d; hBest = t; } }
  eq([f7.weekly.week, f7.weekly.prevWeek, f7.weekly.movers[0].team], [Hh.weeks[hk - 1], Hh.weeks[hk - 2], hBest], "7 days also lists the last weekly step, recomputed here from the history");
  ok(wc({ sim: simNow }).weekly === null && wc({ sim: simNow, win: "7d", history: null }).weekly === null, "the weekly step is not offered for other windows or without a history");
  const fV = wc({ sim: simNow, win: "visit", visit: { prev: now - H } }).forecast;
  eq([fV.state, fV.why, fV.baseline.kind], ["no-baseline", "too-far", "saved"], "a visit an hour ago: the day-old saved forecast is too far from the window, so no movement is claimed");
  const vPo = { at: now - H - 5 * MIN, mode: 2, n: 10000, v: E.D.prev.playoffs.slice() };
  const fV2 = wc({ sim: simNow, win: "visit", visit: { prev: now - H, prevPo: vPo } }).forecast;
  eq([fV2.state, fV2.baseline.kind, fV2.baseline.rel, fV2.movers[0].team], ["ok", "visit", "start", iNYG], "with the simulation kept from that visit, the comparison is against it");
  eq(wc({ sim: simNow, win: "visit", visit: { prev: now - H, prevPo: Object.assign({}, vPo, { mode: 1 }) } }).forecast.state, "no-baseline", "a kept simulation in another win-chance mode is not compared");
  eq([wc({ sim: simNow, prev: null }).forecast, wc({}).forecast, wc({ sim: simNow, prev: { date: "bad", playoffs: [] } }).forecast], [{ state: "no-baseline", why: "none" }, { state: "waiting" }, { state: "no-baseline", why: "none" }],
    "no dated forecast on the page, or no simulation yet, is stated rather than shown as no movement");
  const older = U.pickBaseline([{ kind: "saved", lo: now - 3 * DAY, hi: now - 2 * DAY, dateOnly: true, po: [], mode: 2 }], now - DAY, now);
  eq([older.rel, older.tooFar, U.pickBaseline([], now - DAY, now), U.pickBaseline([older], null, now)], ["older", false, null, null], "a forecast from before the window is used and marked older; none, or no window start, gives nothing");

  // -- conflicting injury reports: both kept, neither chosen --
  const two2 = JSON.parse(JSON.stringify(live)), corner = two2.injuries.NYG.players.find((p) => p.name === "Fixture Corner");
  corner.also = { source: "nflverse-injuries", status: "Questionable", practice: "Limited Participation in Practice", week: 12 }; corner.disagree = true;   // exactly what lib/fabric/index.js writes
  const v2 = U.injuryReports(corner, two2.sources);
  eq(v2, { name: "Fixture Corner", pos: "CB", agree: false, reports: [{ source: "espn-injuries", publisher: "ESPN", status: "Out", detail: "Hamstring" },
    { source: "nflverse-injuries", publisher: "nflverse", status: "Questionable", detail: "week 12 report · practice: Limited Participation in Practice" }] }, "a disagreeing injury keeps both reports, each with its publisher and status");
  ok(Object.keys(v2).sort().join() === "agree,name,pos,reports" && v2.reports.length === 2 && v2.reports[0].status !== v2.reports[1].status, "and no field picks a winner or merges the two statuses");
  const same = Object.assign({}, corner, { disagree: undefined, also: Object.assign({}, corner.also, { status: "Out" }) });
  ok(U.injuryReports(same, two2.sources).agree === true && U.injuryReports(two2.injuries.NYG.players[0], two2.sources) === null && U.injuryReports({ name: "x", also: "nflverse" }, {}) === null && U.injuryReports(null) === null,
    "matching reports are marked as agreeing; one report alone, or a malformed second one, gives no comparison");
  eq(U.injuryReports({ name: "x", source: "mystery-src", status: "Out", also: {} }, {}).reports.map((r) => [r.publisher, r.status]), [["mystery-src", "Out"], ["unnamed source", "status not given"]], "a missing publisher or status is said, not guessed");
  eq(U.injuryCompareSummary(two2.injuries.NYG, two2.sources), { sources: ["nflverse", "ESPN"], comparable: true, both: 1, differ: 1 }, "team summary: two sources, one player in both, one differing");
  const pubTeam = Object.keys(pubLive.injuries)[0];
  eq(U.injuryCompareSummary(pubLive.injuries[pubTeam], pubLive.sources), { sources: ["nflverse"], comparable: false, both: 0, differ: 0 }, "public data has one injury source: nothing to compare, and it says so");
  eq(U.injuryCompareSummary({ players: [{ name: "x" }, null] }, null), { sources: [], comparable: false, both: 0, differ: 0 }, "no named source at all is handled");
  two2.events.push({ id: "inj-conflict", type: "injury", subtype: "Out", ts: new Date(now - H).toISOString(), seenAt: new Date(now - H).toISOString(), teams: ["NYG"], players: [{ name: "Fixture Corner", pos: "CB" }],
    title: "Fixture Corner (CB) listed Out (nflverse's week 12 report: Questionable)", url: null, source: "espn-injuries", publisher: "ESPN", importance: 40, confidence: 0.6, sourceCount: 2,
    sources: [{ publisher: "ESPN", url: null }, { publisher: "nflverse", url: null }], gameId: null, data: { status: "Out", starter: true, disagree: true, other: corner.also } });
  const M2 = U.buildModel(two2), ce = U.eventReports(M2.events.find((e) => e.id === "inj-conflict"), two2.sources);
  eq([ce.agree, ce.reports.map((r) => [r.publisher, r.status]), ce.name], [false, [["ESPN", "Out"], ["nflverse", "Questionable"]], "Fixture Corner"], "the feed's injury event carries the same two reports side by side");
  ok(U.eventReports(M.events.find((e) => e.id === "fx-ev-1"), live.sources) === null && U.eventReports(M.events.find((e) => e.type === "news"), live.sources) === null, "an event with one report has no comparison");
}
// ==== end S-D ====

console.log("ok: command center logic passes (" + n + " checks)");
