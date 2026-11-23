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
eq(st.layers, ["teams", "helmets"], "saved layers are allowlisted too; a save from before the helmets layer existed gains it (on by default)");
eq(U.initialState("", { layers: ["teams"], layersKnown: U.LAYER_IDS }).layers, ["teams"], "a viewer who saved after the helmets layer existed, without it, keeps it off");
eq(U.initialState("", { layers: [], layersKnown: ["teams"] }).layers.sort(), U.DEFAULT_LAYERS.filter((id) => id !== "teams").sort(), "every default layer unknown at the save is switched on");

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

// ---- items already there when the server started watching (data.beforeWatch): time unknown, so listed last and
// left out of the ticker and the brief, however important ----
const bw = JSON.parse(JSON.stringify(live)), bwStart = new Date(now - 30 * 60e3).toISOString();
bw.events.forEach((e, k) => { if (k % 2 === 0) Object.assign(e, { ts: bwStart, importance: 100, data: Object.assign({}, e.data, { beforeWatch: bwStart }) }); });
bw.events[1].data = Object.assign({}, bw.events[1].data, { beforeWatch: "not a time" });
const MB = U.buildModel(bw), kb = MB.events.findIndex((e) => e.before != null), nb = bw.events.filter((e, k) => k % 2 === 0).length;
ok(nb >= 2 && MB.events.filter((e) => e.before != null).length === nb, "each marked item carries its start-of-watching time; a malformed mark is ignored");
ok(kb > 0 && MB.events.slice(kb).every((e) => e.before === Date.parse(bwStart)), "items with an unknown time are listed after every item with a real time");
const tkB = U.tickerEvents(MB.events, "7d", now);
ok(tkB.length > 0 && tkB.every((e) => e.before == null), "the ticker leaves them out, even at importance 100");
ok(U.topEvent(MB.events) && U.topEvent(MB.events).before == null, "the brief's biggest development is never one of them");
ok(U.filterFeed(MB.events, [], "7d", now, "").some((e) => e.before != null), "the feed still lists them");

// ---- helmets: where teams play today (our own drawing in team colours) ----
const loc = (y, mo, d, h, mi) => new Date(y, mo, d, h, mi).getTime();   // local time, as the viewer sees it
const gm = (key, away, home, state, kick) => ({ key, away: idx(away), home: idx(home), state, kickoff: new Date(kick).toISOString() });
const MON = loc(2026, 10, 23, 18, 0);
const day = [gm("a", "CIN", "WAS", "pre", loc(2026, 10, 23, 20, 15)), gm("b", "MIN", "SF", "post", loc(2026, 10, 22, 20, 20)), gm("c", "NYJ", "LAC", "pre", loc(2026, 10, 24, 0, 30)),
  gm("d", "KC", "DEN", "in", loc(2026, 10, 22, 23, 50)), gm("e", "BUF", "MIA", "pre", loc(2026, 10, 23, 13, 0)), { key: "f", away: null, home: idx("NE"), state: "pre", kickoff: new Date(MON).toISOString() }];
eq(U.todaysGames(day, MON).map((x) => x.key), ["d", "e", "a"], "today: games kicking off on the viewer's calendar day, plus any still in progress, in kickoff order; tomorrow's, yesterday's finals and incomplete rows left out");
eq(U.todaysGames([], MON), [], "no games today");
eq(U.todaysGames(null, MON), [], "no data");
const UTJ = require(path.join(__dirname, "..", "shared", "teams.json")).teams;
eq(U.helmetColors(U.TEAMS[idx("WAS")]), { shell: UTJ[idx("WAS")].color, trim: UTJ[idx("WAS")].alt }, "the page's team entries carry both colours (Washington: maroon with gold trim)");
eq(U.helmetColors(U.TEAMS[idx("CIN")]).trim, UTJ[idx("CIN")].alt, "Cincinnati: orange with black trim");
eq(U.helmetColors({ color: "#101820", alt: "#0b1620" }).trim, "#ffffff", "a trim too close to the shell colour becomes white");
eq(U.helmetColors({ color: "#f5f5f5", alt: "#ffffff" }).trim, "#1b1f27", "and dark on a light shell");
eq(U.helmetColors({ color: "red", alt: "javascript:x" }), { shell: "#8b95a7", trim: "#ffffff" }, "anything but a #rrggbb colour falls back to neutral");
ok(U.helmetScale(false, 1) === 0.95 && U.helmetScale(true, 1) === 1.15, "normal size on a full-size map; a little larger zoomed in");
ok(Math.abs(U.helmetScale(false, 0.37) * 24 * 0.37 - 18) < 1e-9, "on a phone-size map a helmet is still 18 px wide");
ok(U.helmetScale(false, 0.05) === 2.4 && U.helmetScale(false, NaN) === 0.95 && U.helmetScale(false, 0) === 0.95, "capped, and safe with no measurement");
ok(U.LAYERS.some((l) => l.id === "helmets" && l.defaultOn && l.modes.join() === "geo" && l.group === "Teams"), "the Helmets layer is registered, on by default, geographic map only");

// ---- estimated event times (data.tsEstimated): flagged, with the gap when the feed gives one ----
ok(U.estimateNote({ data: {} }) === null && U.estimateNote({}) === null && U.estimateNote(null) === null && U.estimateNote({ data: { tsEstimated: "yes" } }) === null, "only a real estimate flag counts");
ok(U.estimateNote({ data: { tsEstimated: true } }) === "Estimated time.", "an estimate without a gap");
ok(/^Estimated time: this happened between .+ and .+, when the server next checked\.$/.test(U.estimateNote({ data: { tsEstimated: true, between: ["2026-11-22T17:50:00Z", "2026-11-22T18:12:00Z"] } })), "an estimate with the gap it fell in");
ok(U.estimateNote({ data: { tsEstimated: true, between: ["x", "y"] } }) === "Estimated time.", "a malformed gap is ignored");

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

console.log("ok: command center logic passes (" + n + " checks)");
