// Checks the simulation engine in the built page and the live-feed parser. Run: npm test
const fs = require("fs"), path = require("path"), assert = require("assert");
const html = fs.readFileSync(path.join(__dirname, "..", "public", "index.html"), "utf8");
const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
scripts.forEach((s) => new Function(s)); // every script parses
// embedded data never contains a raw "<": feed text such as "<!--<script" must not be able to break the page
const dataLine = html.split("\n").find((l) => l.startsWith("var D="));
assert.ok(dataLine && !dataLine.includes("<"), "embedded data escapes <");
assert.strictEqual((html.match(/<script\b/g) || []).length, scripts.length, "every script element is closed where it should be");
const E = new Function(scripts[0] + ";return {simulate,GAMES,TM,baseProb,liveProbFor,cleanLiveGame,safeHttpsUrl}")();
// /api/live games are checked before the simulator uses them
const lg = { away: "JAX", home: "NYG", awayScore: 10, homeScore: 14, state: "in", period: 3, clock: "8:03", minutes: 8.05 };
assert.deepStrictEqual(E.cleanLiveGame(lg), lg, "a good live game passes unchanged");
assert.deepStrictEqual(E.cleanLiveGame(Object.assign({}, lg, { period: 9, minutes: 99, clock: "<b>" })), Object.assign({}, lg, { period: 6, minutes: 15, clock: "" }), "period and minutes clamped, a bad clock blanked");
[{ away: "XXX" }, { awayScore: -1 }, { homeScore: 3.5 }, { awayScore: "7" }, { state: "halftime" }, { home: null }].forEach((bad, k) =>
  assert.strictEqual(E.cleanLiveGame(Object.assign({}, lg, bad)), null, "bad live game " + k + " is ignored"));
assert.strictEqual(E.cleanLiveGame(null), null);
// links the simulator opens: https only, no credentials, no markup
assert.strictEqual(E.safeHttpsUrl("https://www.espn.com/nfl/story/_/id/1"), "https://www.espn.com/nfl/story/_/id/1");
assert.strictEqual(E.safeHttpsUrl("https://medium.com/@writer/post"), "https://medium.com/@writer/post", "an @ in the path is fine");
assert.strictEqual(E.safeHttpsUrl("https://example.com/what's-next"), "https://example.com/what's-next", "an apostrophe in the path is fine");
["javascript:alert(1)", "http://example.com/x", "https://user:pw@example.com/", "https://example.com/a b", 'https://example.com/"onclick', "", null, 42, "https://"].forEach((u) =>
  assert.strictEqual(E.safeHttpsUrl(u), null, "refused: " + u));
const none = E.GAMES.map(() => 0), nyg = E.TM.findIndex((t) => t.a === "NYG");
const r = E.simulate(none, nyg);
let po = 0, dv = 0; for (let i = 0; i < 32; i++) { po += r.po[i]; dv += r.dv[i]; }
assert.strictEqual(Math.round(po / r.n), 14, "14 playoff teams per season");
assert.strictEqual(Math.round(dv / r.n), 8, "8 division winners per season");
const all = E.simulate(E.GAMES.map((g, i) => (E.baseProb(i) >= 0.5 ? 2 : 1)), nyg);
assert.strictEqual(all.open, 0);
assert.strictEqual(new Set(all.first[0].concat(all.first[1])).size, 14, "seeds are 14 different teams");
const g = E.GAMES.findIndex((x) => E.TM[x[3]].a === "NYG");
if (g >= 0) {
  const pre = E.baseProb(g);
  assert.ok(Math.abs(E.liveProbFor(g, { a: 0, h: 0, q: 1, m: 15 }) - pre) < 1e-9, "kickoff equals pregame line");
  assert.ok(E.liveProbFor(g, { a: 0, h: 21, q: 4, m: 2 }) > 0.99, "big late lead is near certain");
}
const tot = (arr) => Math.round(Array.from(arr).reduce((x, y) => x + y, 0) / r.n);
assert.deepStrictEqual([tot(r.rDiv), tot(r.rConf), tot(r.rSB), tot(r.wSB)], [8, 4, 2, 1], "bracket sends 8, 4, 2 and 1 teams through each round");
assert.deepStrictEqual([tot(r.draftN), tot(r.pick1), tot(r.top5)], [32, 1, 5], "draft order covers all 32 picks");
assert.strictEqual(tot(r.draftSum), 528, "picks 1 to 32 are each used once");
for (let i = 0; i < 32; i++) assert.ok(r.rDiv[i] <= r.po[i] && r.rConf[i] <= r.rDiv[i] && r.rSB[i] <= r.rConf[i] && r.wSB[i] <= r.rSB[i], "rounds nest");
// odds maths and the what-if hook
const E2 = new Function(scripts[0] + ";return {setTweak,setMode,baseProb,modelView,GAMES,D}")();
const lined = E2.GAMES.findIndex((x) => x[6] != null);
if (lined >= 0) {
  E2.setMode(2); assert.ok(Math.abs(E2.baseProb(lined) - E2.GAMES[lined][6]) < 1e-6, "blend uses a posted line as it stands");
  const before = E2.baseProb(lined), t = []; t[E2.GAMES[lined][3]] = 3; E2.setTweak(t);
  assert.ok(E2.baseProb(lined) > before, "making the home team stronger raises its chance"); E2.setTweak([]);
  assert.ok(Math.abs(E2.baseProb(lined) - before) < 1e-9, "clearing the what-if restores the forecast");
  assert.ok(E2.modelView(lined).every((m) => m[1] > 0 && m[1] < 1), "every method gives a probability");
}
if (E2.D.report) {
  for (const c of E2.D.report.calibration) assert.ok(c.act >= 0 && c.act <= 1 && c.pred >= c.lo - 1e-9 && c.pred <= c.hi + 1e-9, "calibration rows are consistent");
  assert.ok(E2.D.report.models[0].logloss < 0.6931, "the blend beats a coin flip in the backtest");
}
if (E2.D.news) for (const n of E2.D.news) assert.ok(n.summary && n.date && /^https:\/\//.test(n.url || "") && n.team >= 0 && n.team < 32, "every news item has a summary, a date, a team and a source link");
if (E2.D.prev) assert.strictEqual(E2.D.prev.playoffs.length, 32, "previous snapshot covers all teams");
const wg = E.GAMES.findIndex((x) => x[6] != null), rw = E.simulate(none, nyg, 2000, null, false, [wg]);
assert.strictEqual(rw.watch[wg].nH + rw.watch[wg].nA, rw.n, "a watched game is counted in every simulated season");
assert.ok(Math.abs(Array.from(rw.watch[wg].H).reduce((x, y) => x + y, 0) + Array.from(rw.watch[wg].A).reduce((x, y) => x + y, 0) - 14 * rw.n) < 1e-6, "watched counts add up to the playoff field");
// optional seed: leaving it out keeps the page's fixed seed; a different seed gives different, still valid, draws
const s0 = E.simulate(none, nyg, 3000), s1 = E.simulate(none, nyg, 3000, null, false, null, 20261116), s2 = E.simulate(none, nyg, 3000, null, false, null, 7);
assert.deepStrictEqual(Array.from(s0.po), Array.from(s1.po), "default seed is unchanged");
assert.notDeepStrictEqual(Array.from(s0.po), Array.from(s2.po), "another seed draws different seasons");
assert.strictEqual(Math.round(Array.from(s2.po).reduce((x, y) => x + y, 0) / s2.n), 14, "any seed still fills 14 playoff spots");
// ---- why the playoff chances moved (F04): a saved forecast, then the same data with one result added or one line moved ----
{
  const { makeSnapshot } = require("../scripts/snapshot.js");
  const engineOf = (data) => new Function(scripts[0].replace(/^var D=.*$/m, () => "var D=" + JSON.stringify(data) + ";") + ";return {simulate,GAMES,TM,D,blendProb,changeWatch,explainChange}")();
  const D0 = JSON.parse(dataLine.slice(6).replace(/;\s*$/, ""));
  const E0 = engineOf(D0), P = JSON.parse(JSON.stringify(makeSnapshot(E0, 20000, "2026-11-20")));
  assert.ok(P.v === 2 && Object.keys(P.gaps).length >= 10 && Object.keys(P.probs).length === E0.GAMES.length && P.gaps[Object.keys(P.gaps)[0]].length === 32, "a version-2 forecast carries chances and figures");
  const same = E0.explainChange(P, E0.simulate(E0.GAMES.map(() => 0), 0, 20000, null, false, E0.changeWatch(P)));
  assert.strictEqual(E0.changeWatch(P).length, 0, "nothing moved: nothing to watch");
  assert.ok(same.teams.every((x) => Math.abs(x.total) <= 0.0006 && x.own === 0 && x.lines === 0 && Math.abs(x.rest) <= 0.0006), "same data: no change to explain");
  assert.strictEqual(E0.explainChange({ teams: P.teams, playoffs: P.playoffs }, { watch: {} }), null, "an older forecast is not explained");
  const sum = (x) => x.own + x.others + x.lines + x.ratings + x.rest;
  // one result added: the game with figures that matters most to one of its own teams, won by the forecast's underdog
  const stake = (id) => { const tm = P.games[id].map((a) => P.teams.indexOf(a)); return Math.max(...tm.map((t) => Math.abs(P.gaps[id][t]))); };
  const gid = Object.keys(P.gaps).sort((x, y) => stake(y) - stake(x))[0], k = D0.games.findIndex((g) => g[0] === gid), g = D0.games[k], homeWins = P.probs[gid] < 0.5;
  const D1 = JSON.parse(JSON.stringify(D0)); D1.games.splice(k, 1); D1.played.push([g[2], g[3], homeWins ? 10 : 30, homeWins ? 30 : 10]);
  const E1 = engineOf(D1), w1 = E1.explainChange(P, E1.simulate(E1.GAMES.map(() => 0), 0, 20000, null, false, E1.changeWatch(P)));
  assert.ok(w1.results === 1 && w1.resultsSince === 1, "the new result is found");
  for (const t of [g[2], g[3]]) {
    const x = w1.teams[t];
    assert.ok(Math.abs(sum(x) - x.total) < 1e-9, "the parts add up to the change");
    assert.ok(Math.abs(x.own - x.total) < 0.03 && x.results.length === 1, "an upset explains its teams' moves: " + E1.TM[t].a + " total " + x.total.toFixed(3) + " own " + x.own.toFixed(3));
  }
  assert.ok(Math.max(Math.abs(w1.teams[g[2]].total), Math.abs(w1.teams[g[3]].total)) >= 0.05, "the chosen game moves one of its teams by 5 points or more");
  assert.ok(w1.teams.filter((x, t) => t !== g[2] && t !== g[3]).every((x) => x.own === 0 && Math.abs(x.others - x.total) < 0.03), "other teams' moves come from other results");
  // one line moved by 10 points of win chance in a game still to play
  const kl = D0.games.findIndex((x, j) => j !== k && x[6] != null && x[6] > 0.2 && x[6] < 0.7);
  const D2 = JSON.parse(JSON.stringify(D0)); D2.games[kl][6] = Math.round((D0.games[kl][6] + 0.1) * 1e4) / 1e4;
  const E2 = engineOf(D2), cw = E2.changeWatch(P), w2 = E2.explainChange(P, E2.simulate(E2.GAMES.map(() => 0), 0, 20000, null, false, cw));
  assert.deepStrictEqual(cw, [kl], "only the moved game is watched");
  const hm = w2.teams[D0.games[kl][3]];
  assert.ok(hm.lines > 0.01 && Math.abs(hm.lines - hm.total) < 0.02 && hm.ratings === 0 && hm.moves[0].gi === kl, "a line move explains the home team's rise");
}
const { normalize } = require("../server.js");
const feed = normalize(JSON.parse(fs.readFileSync(path.join(__dirname, "sample-scoreboard.json"), "utf8")));
assert.deepStrictEqual(feed[0], { away: "JAX", home: "NYG", awayScore: 10, homeScore: 14, state: "in", period: 3, clock: "8:03", minutes: 8.05 });
assert.strictEqual(feed[1].home, "WAS"); assert.strictEqual(feed[1].state, "post");
console.log("ok: engine and feed parser pass; Giants playoff odds", Math.round((r.po[nyg] / r.n) * 100) + "%");
require("./fabric.test.js");   // data fabric, contracts and server routes (async; exits non-zero on failure)
require("./mcp.test.js");      // MCP server over stdio (async; exits non-zero on failure)
