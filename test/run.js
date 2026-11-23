// Checks the simulation engine in the built page and the live-feed parser. Run: npm test
const fs = require("fs"), path = require("path"), assert = require("assert");
const html = fs.readFileSync(path.join(__dirname, "..", "public", "index.html"), "utf8");
const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
scripts.forEach((s) => new Function(s)); // every script parses
// embedded data never contains a raw "<": feed text such as "<!--<script" must not be able to break the page
const dataLine = html.split("\n").find((l) => l.startsWith("var D="));
assert.ok(dataLine && !dataLine.includes("<"), "embedded data escapes <");
assert.strictEqual((html.match(/<script\b/g) || []).length, scripts.length, "every script element is closed where it should be");
const E = new Function(scripts[0] + ";return {simulate,GAMES,TM,baseProb,liveProbFor}")();
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
// Late tiebreaker steps: net points in common games (division ties) and in conference games (wild-card ties) sit between
// the league-wide points ranking and net points in all games. Each case below is a small hand-made season with every
// game already played, so nothing is drawn at random except a coin toss, and 200 identical seasons rule a coin toss out.
{
  const engineWith = (src, data) => new Function("__D", src.replace(dataLine, "var D=__D;") + ";return {simulate,TM}")(data);
  assert.ok(scripts[0].includes(dataLine), "the engine's data line can be swapped for a hand-made season");
  const DIV = []; E.TM.forEach((t, i) => (DIV[t.d] = DIV[t.d] || []).push(i));
  const season = (played) => ({ teams: E.TM, games: [], hfa: 0, played, rate: new Array(32).fill(0) });
  const A = DIV[0][0], B = DIV[0][1], X = DIV[1][0], Y = DIV[4][0], Z = DIV[4][1];
  // Division tie: A and B split, both beat X (the only common opponent) and both lose once outside the conference, so
  // records, strength of victory and schedule, and both points rankings are level. A is +10 in the common game and B
  // +4; over all games A is -10 and B -6, so the step order decides it. Rows are [away, home, away points, home points].
  const divGames = [[A, B, 20, 10], [B, A, 20, 10], [X, A, 20, 30], [X, B, 20, 24], [A, Y, 10, 30], [B, Z, 10, 20]];
  let t = engineWith(scripts[0], season(divGames)).simulate([], A);
  assert.strictEqual(t.n, 200);
  assert.deepStrictEqual([t.dv[A], t.dv[B]], [t.n, 0], "net points in common games decides a division tie before net points in all games");
  assert.strictEqual(engineWith(scripts[0], season(divGames)).simulate([], A, 1, null, true).first[0][0], A, "the same step applies to standings as of today");
  // Same tie with the common-game margins level (+10 each): net points in all games (A -10, B -7) is still the next step.
  t = engineWith(scripts[0], season([[A, B, 20, 10], [B, A, 20, 10], [X, A, 20, 30], [X, B, 20, 30], [A, Y, 10, 30], [B, Z, 3, 20]])).simulate([], A);
  assert.deepStrictEqual([t.dv[A], t.dv[B]], [0, t.n], "level net points in common games falls through to net points in all games");
  // Wild-card procedure (here seeding two division winners from different divisions): no head-to-head game and no common
  // opponents; A is +10 in conference games and C +4, while over all games A is -10 and C -6.
  const C = DIV[1][0], P = DIV[2][0], Q = DIV[2][1];
  const wildGames = [[P, A, 20, 30], [Q, C, 20, 24], [A, Y, 10, 30], [C, Z, 10, 20]];
  t = engineWith(scripts[0], season(wildGames)).simulate([], A);
  assert.deepStrictEqual([t.seedC[A][0], t.seedC[C][1], t.first[0][0]], [t.n, t.n, A], "net points in conference games decides a wild-card tie before net points in all games");
  t = engineWith(scripts[0], season([[P, A, 20, 30], [Q, C, 20, 30], [A, Y, 10, 30], [C, Z, 3, 20]])).simulate([], A);
  assert.deepStrictEqual([t.seedC[C][0], t.seedC[A][1]], [t.n, t.n], "level net points in conference games falls through to net points in all games");
  // With the two new steps switched off the engine is the previous one (same draws, same order of steps). On the real
  // season the steps are reached so rarely that playoff shares for a fixed seed should not move.
  const oldSrc = scripts[0].replace("function netIn(t,os){", "function netIn(t,os){return 0;");
  assert.notStrictEqual(oldSrc, scripts[0], "the new steps can be switched off for comparison");
  t = engineWith(oldSrc, season(divGames)).simulate([], A);
  assert.deepStrictEqual([t.dv[A], t.dv[B]], [0, t.n], "without the new step the same division tie went the other way");
  t = engineWith(oldSrc, season(wildGames)).simulate([], A);
  assert.strictEqual(t.seedC[C][0], t.n, "without the new step the same wild-card tie went the other way");
  const realD = new Function(scripts[0] + ";return D")(), n0 = 5000;
  const now1 = E.simulate(none, nyg, n0), was1 = engineWith(oldSrc, realD).simulate(none, nyg, n0);
  let moved = 0; for (let i = 0; i < 32; i++) moved = Math.max(moved, Math.abs(now1.po[i] - was1.po[i]) / n0);
  assert.ok(moved < 0.005, "the new steps move no team's playoff share by half a point over " + n0 + " seasons (largest move " + (moved * 100).toFixed(2) + ")");
  console.log("ok: late tiebreaker steps; largest playoff-share move from the new steps over " + n0 + " seasons: " + (moved * 100).toFixed(2) + " points");
}
const { normalize } = require("../server.js");
const feed = normalize(JSON.parse(fs.readFileSync(path.join(__dirname, "sample-scoreboard.json"), "utf8")));
assert.deepStrictEqual(feed[0], { away: "JAX", home: "NYG", awayScore: 10, homeScore: 14, state: "in", period: 3, clock: "8:03", minutes: 8.05 });
assert.strictEqual(feed[1].home, "WAS"); assert.strictEqual(feed[1].state, "post");
console.log("ok: engine and feed parser pass; Giants playoff odds", Math.round((r.po[nyg] / r.n) * 100) + "%");
require("./fabric.test.js");   // data fabric, contracts and server routes (async; exits non-zero on failure)
require("./mcp.test.js");      // MCP server over stdio (async; exits non-zero on failure)
