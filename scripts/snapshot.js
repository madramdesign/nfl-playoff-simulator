// Saves today's forecast to data/snapshots/YYYY-MM-DD.json so later builds can show what changed and
// this season's forecasts can be scored against results. Run after `npm run build`: `npm run snapshot`.
// Version 2 (Nov. 24, 2026) adds what later builds need to explain the change (backlog F04): every remaining game's home
// chance (`probs`) and, for the games due within two weeks, what each one is worth to every team (`gaps`, the playoff
// chance if the home team wins minus if it loses) with their teams (`games`). Older files lack these and are still read.
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");

// E: the engine; n: simulated seasons. Returns the snapshot object (without writing it).
function makeSnapshot(E, n = 20000, date = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" })) {
  const r3 = (v) => Math.round(v * 1000) / 1000;
  const firstWeek = E.GAMES.length ? Math.min(...E.GAMES.map((g) => g[1])) : 0;
  const watch = E.GAMES.map((g, i) => i).filter((i) => E.GAMES[i][1] <= firstWeek + 1);
  const r = E.simulate(E.GAMES.map(() => 0), 0, n, null, false, watch);
  const share = (a) => Array.from(a, (v) => r3(v / r.n));
  const gaps = {}, games = {};
  for (const i of watch) {
    const w = r.watch[i], g = E.GAMES[i];
    if (!w || !w.nH || !w.nA) continue;          // a game one side never wins in the simulation says nothing
    gaps[g[0]] = Array.from(w.H, (h, t) => r3(h / w.nH - w.A[t] / w.nA));
    games[g[0]] = [E.TM[g[2]].a, E.TM[g[3]].a];
  }
  return {
    v: 2, date, built: E.D.built, sims: r.n, mode: "blend", seed: 20261116,
    teams: E.TM.map((t) => t.a), playoffs: share(r.po), division: share(r.dv), superBowl: share(r.wSB),
    rate: E.D.rate, rate2: E.D.rate2, played: E.D.played.length,
    lines: Object.fromEntries(E.GAMES.filter((g) => g[6] != null).map((g) => [g[0], g[6]])),
    probs: Object.fromEntries(E.GAMES.map((g, i) => [g[0], r3(E.blendProb(i))])),
    gaps, games,
  };
}
function loadEngine(html) {
  const engine = html.match(/<script id="engine">([\s\S]*?)<\/script>/)[1];
  return new Function(engine + ";return {simulate,GAMES,TM,D,blendProb}")();
}

if (require.main === module) {
  const E = loadEngine(fs.readFileSync(path.join(root, "public", "index.html"), "utf8"));
  const snap = makeSnapshot(E);
  const dir = path.join(root, "data", "snapshots");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, snap.date + ".json");
  if (fs.existsSync(file) && !process.argv.includes("--force")) { console.log("snapshot for", snap.date, "already exists; kept the first one of the day"); process.exit(0); }
  fs.writeFileSync(file, JSON.stringify(snap));
  console.log("snapshot saved:", snap.date, "games played", snap.played, "lines", Object.keys(snap.lines).length, "games with figures", Object.keys(snap.gaps).length);
}
module.exports = { makeSnapshot, loadEngine };
