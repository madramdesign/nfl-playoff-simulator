// Saves today's forecast to data/snapshots/YYYY-MM-DD.json so later builds can show what changed and
// this season's forecasts can be scored against results. Run after `npm run build`: `npm run snapshot`.
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "public", "index.html"), "utf8");
const engine = html.match(/<script id="engine">([\s\S]*?)<\/script>/)[1];
const E = new Function(engine + ";return {simulate,GAMES,TM,D}")();
const r = E.simulate(E.GAMES.map(() => 0), 0, 20000);
const share = (a) => Array.from(a, (v) => Math.round((v / r.n) * 1000) / 1000);
const date = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
const snap = {
  date, built: E.D.built, sims: r.n, mode: "blend",
  teams: E.TM.map((t) => t.a), playoffs: share(r.po), division: share(r.dv), superBowl: share(r.wSB),
  rate: E.D.rate, rate2: E.D.rate2, played: E.D.played.length,
  lines: Object.fromEntries(E.GAMES.filter((g) => g[6] != null).map((g) => [g[0], g[6]])),
};
const dir = path.join(root, "data", "snapshots");
fs.mkdirSync(dir, { recursive: true });
const file = path.join(dir, date + ".json");
if (fs.existsSync(file) && !process.argv.includes("--force")) { console.log("snapshot for", date, "already exists; kept the first one of the day"); process.exit(0); }
fs.writeFileSync(file, JSON.stringify(snap));
console.log("snapshot saved:", date, "games played", snap.played, "lines", Object.keys(snap.lines).length);
