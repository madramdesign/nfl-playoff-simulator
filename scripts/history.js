// Runs the page's simulation engine on a list of past-week data blobs. Used by scripts/build.py.
// Usage: node scripts/history.js src/template.html blobs.json   -> prints {"po":[[...32]],"dv":[[...32]]}
const fs = require("fs");
const engine = fs.readFileSync(process.argv[2], "utf8").match(/<script id="engine">([\s\S]*?)<\/script>/)[1];
const blobs = JSON.parse(fs.readFileSync(process.argv[3], "utf8"));
const out = { po: [], dv: [] };
for (const blob of blobs) {
  const r = new Function(engine.replace("/*DATA*/", blob) + ";return simulate(GAMES.map(function(){return 0}),0,4000)")();
  out.po.push(Array.from(r.po, (v) => Math.round((v / r.n) * 1000) / 1000));
  out.dv.push(Array.from(r.dv, (v) => Math.round((v / r.n) * 1000) / 1000));
}
process.stdout.write(JSON.stringify(out));
