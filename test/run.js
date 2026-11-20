// Checks the simulation engine in the built page and the live-feed parser. Run: npm test
const fs = require("fs"), path = require("path"), assert = require("assert");
const html = fs.readFileSync(path.join(__dirname, "..", "public", "index.html"), "utf8");
const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
scripts.forEach((s) => new Function(s)); // every script parses
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
const { normalize } = require("../server.js");
const feed = normalize(JSON.parse(fs.readFileSync(path.join(__dirname, "sample-scoreboard.json"), "utf8")));
assert.deepStrictEqual(feed[0], { away: "JAX", home: "NYG", awayScore: 10, homeScore: 14, state: "in", period: 3, clock: "8:03", minutes: 8.05 });
assert.strictEqual(feed[1].home, "WAS"); assert.strictEqual(feed[1].state, "post");
console.log("ok: engine and feed parser pass; Giants playoff odds", Math.round((r.po[nyg] / r.n) * 100) + "%");
