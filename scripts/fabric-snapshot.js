// Writes the public data-fabric snapshot that the build embeds in the page (D.fabric), the day's point-in-time event
// record, and a short report of the run. Public sources only (DEC-006); a file that fails validatePublicSnapshot is not
// written. A source that fails in this run keeps its part of the previous snapshot, reported stale with its true age
// (lib/fabric/carry.js, backlog F01). Never fails the daily refresh: problems are reported and the script exits 0.
// Run: node scripts/fabric-snapshot.js
//      node scripts/fabric-snapshot.js --keep-if-fresh 8   (keep a published snapshot under 8 hours old instead of
//      fetching again: the daily refresh runs where most sources are unreachable, and GitHub Actions fetches them
//      every 3 hours; DEC-021)
"use strict";
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const { createFabric } = require(path.join(root, "lib", "fabric"));
const { validatePublicSnapshot } = require(path.join(root, "lib", "contract.js"));
const { ABBRS } = require(path.join(root, "lib", "fabric", "entities.js"));
const { carryForward } = require(path.join(root, "lib", "fabric", "carry.js"));
const { mergeLines } = require(path.join(root, "lib", "fabric", "lines.js"));
const { snapshotMedia } = require(path.join(root, "lib", "fabric", "adapters", "media.js"));

// The previous published snapshot, when it is a valid public one; null otherwise.
function previous(file) {
  try { const p = JSON.parse(fs.readFileSync(file, "utf8")); return validatePublicSnapshot(p, ABBRS).length ? null : p; } catch (_) { return null; }
}

// fabric: a public-scope fabric; dir: where latest.json, events/ and runs.json live; now: () => ms.
// Returns the run report, or null when nothing was written.
async function writeSnapshot({ fabric, dir, now = () => Date.now(), log = console.log, warn = console.warn }) {
  const fresh = await fabric.universe({ fresh: true });   // fetch every source now; never publish yesterday's cache as today's
  if (fresh.media) fresh.media = snapshotMedia(fresh.media);   // keep the page small: 3 videos and 1 Short per channel
  const evDir = path.join(dir, "events"), latest = path.join(dir, "latest.json"), t = now();
  const prev = previous(latest), { u, carried, tooOld } = carryForward(prev, fresh, t);
  // line history (F23): the snapshot runs with no state, so yesterday's published history is merged with today's,
  // kept for this payload's games only
  if (prev && prev.lines) {
    const ids = new Set(u.games.map((g) => g.id)), merged = mergeLines(prev.lines, u.lines);
    u.lines = Object.fromEntries(Object.entries(merged).filter(([id]) => ids.has(id)));
  }
  const errs = validatePublicSnapshot(u, ABBRS);
  if (errs.length) { warn("fabric snapshot NOT written; contract problems:\n  " + errs.slice(0, 10).join("\n  ")); return null; }
  fs.mkdirSync(evDir, { recursive: true });
  fs.writeFileSync(latest, JSON.stringify(u));

  // Point-in-time record: events not recorded on any of the previous 45 days go into today's file, stamped now.
  const day = new Date(t).toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  const files = fs.readdirSync(evDir).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort().slice(-45);
  const known = new Set();
  let today = { date: day, recordedAt: null, events: [] };
  for (const f of files) {
    try { const d = JSON.parse(fs.readFileSync(path.join(evDir, f), "utf8")); for (const e of d.events) known.add(e.id); if (f === day + ".json") today = d; } catch (_) {}
  }
  const stamp = new Date(t).toISOString();
  const added = u.events.filter((e) => !known.has(e.id)).map((e) => Object.assign({}, e, { seenAt: stamp }));
  today.events = today.events.concat(added); today.recordedAt = stamp;
  fs.writeFileSync(path.join(evDir, day + ".json"), JSON.stringify(today));

  // run report: the last 60 runs, so a degraded refresh is visible later instead of silent
  const by = (st) => Object.values(u.sources).filter((s) => s.status === st).map((s) => s.id);
  const run = { at: stamp, week: u.week, games: u.games.length, events: u.events.length, newEvents: added.length, ok: by("ok"), stale: by("stale"), down: by("down"), carried, tooOld };
  const runsFile = path.join(dir, "runs.json");
  let runs = []; try { runs = JSON.parse(fs.readFileSync(runsFile, "utf8")); if (!Array.isArray(runs)) runs = []; } catch (_) {}
  fs.writeFileSync(runsFile, JSON.stringify(runs.concat([run]).slice(-60), null, 1));
  const degraded = run.stale.concat(run.down.map((id) => id + " (down)"));
  log("fabric snapshot saved: week " + u.week + ", " + u.games.length + " games, " + u.events.length + " events (" + added.length + " new today)" +
    (carried.length ? "; carried from the previous snapshot, shown stale: " + carried.join(", ") : "") + (tooOld.length ? "; too old to carry: " + tooOld.join(", ") : "") +
    (degraded.length ? "; degraded: " + degraded.join(", ") : ""));
  return run;
}

// Pure: the hours given with --keep-if-fresh (as "--keep-if-fresh 4" or "--keep-if-fresh=4"), or null.
function keepHours(argv) {
  const k = (argv || []).findIndex((a) => a === "--keep-if-fresh" || String(a).startsWith("--keep-if-fresh="));
  if (k < 0) return null;
  const a = String(argv[k]), v = Number(a.includes("=") ? a.split("=")[1] : argv[k + 1]);
  return Number.isFinite(v) && v > 0 && v <= 48 ? v : null;
}
// Pure: whether a published snapshot (or null) was generated less than `hours` before `now` (and not in the future,
// beyond five minutes of clock difference).
function isFresh(latest, hours, now) {
  const t = latest && typeof latest.generatedAt === "string" ? Date.parse(latest.generatedAt) : NaN;
  return Number.isFinite(t) && t - now <= 5 * 60000 && now - t < hours * 3600000;
}
// The command: keeps a fresh enough snapshot when asked to, else fetches and writes a new one. The fabric is made
// only when it is needed. Returns {kept, at} or writeSnapshot's report (null when nothing was written).
async function main({ argv = process.argv.slice(2), dir = path.join(root, "data", "fabric"), now = () => Date.now(),
  makeFabric = () => createFabric({ scopes: ["public"], liveScores: "" }), log = console.log, warn = console.warn } = {}) {
  const h = keepHours(argv);
  if (h != null) {
    const prev = previous(path.join(dir, "latest.json"));
    if (isFresh(prev, h, now())) {
      const by = (st) => Object.values(prev.sources).filter((s) => s.status === st).map((s) => s.id);
      const down = by("down"), stale = by("stale");
      log("fabric snapshot kept: the published one from " + prev.generatedAt + " is under " + h + " hours old" +
        (down.length ? "; down then: " + down.join(", ") : "; no source was down then") + (stale.length ? "; stale then: " + stale.join(", ") : ""));
      return { kept: true, at: prev.generatedAt, down, stale };
    }
  }
  return writeSnapshot({ fabric: makeFabric(), dir, now, log, warn });
}

module.exports = { writeSnapshot, main, keepHours, isFresh };
if (require.main === module) {
  main().catch((err) => console.warn("fabric snapshot skipped:", err && err.message));
}
