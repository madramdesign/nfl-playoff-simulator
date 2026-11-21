// Pure logic of the command center (src/universe/*), loaded from the built page with no DOM. Run: node test/universe.test.js
const fs = require("fs"), path = require("path"), assert = require("assert");
const html = fs.readFileSync(path.join(__dirname, "..", "public", "index.html"), "utf8");
const engine = html.match(/<script id="engine">([\s\S]*?)<\/script>/)[1];
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


console.log("ok: command center logic passes (" + n + " checks)");
