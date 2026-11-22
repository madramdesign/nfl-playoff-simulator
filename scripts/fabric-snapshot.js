// Writes the public data-fabric snapshot that the build embeds in the page (D.fabric), and the day's point-in-time
// event record. Public sources only (DEC-006); a file that fails validatePublicSnapshot is not written.
// Never fails the daily refresh: problems are reported and the script exits 0. Run: node scripts/fabric-snapshot.js
"use strict";
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const { createFabric } = require(path.join(root, "lib", "fabric"));
const { validatePublicSnapshot } = require(path.join(root, "lib", "contract.js"));
const { ABBRS } = require(path.join(root, "lib", "fabric", "entities.js"));

async function main() {
  const fabric = createFabric({ scopes: ["public"] });
  const u = await fabric.universe({ fresh: true });   // fetch every source now; never publish yesterday's cache as today's
  // keep the page small: 3 videos and 1 Short per channel (the live server serves more)
  if (u.media) u.media = require(path.join(root, "lib", "fabric", "adapters", "media.js")).snapshotMedia(u.media);
  const errs = validatePublicSnapshot(u, ABBRS);
  if (errs.length) { console.warn("fabric snapshot NOT written; contract problems:\n  " + errs.slice(0, 10).join("\n  ")); return; }
  const dir = path.join(root, "data", "fabric"), evDir = path.join(dir, "events");
  fs.mkdirSync(evDir, { recursive: true });
  fs.writeFileSync(path.join(dir, "latest.json"), JSON.stringify(u));

  // Point-in-time record: events not recorded on any of the previous 45 days go into today's file, stamped now.
  const day = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  const files = fs.readdirSync(evDir).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort().slice(-45);
  const known = new Set();
  let today = { date: day, recordedAt: null, events: [] };
  for (const f of files) {
    try { const d = JSON.parse(fs.readFileSync(path.join(evDir, f), "utf8")); for (const e of d.events) known.add(e.id); if (f === day + ".json") today = d; } catch (_) {}
  }
  const stamp = new Date().toISOString();
  const fresh = u.events.filter((e) => !known.has(e.id)).map((e) => Object.assign({}, e, { seenAt: stamp }));
  today.events = today.events.concat(fresh); today.recordedAt = stamp;
  fs.writeFileSync(path.join(evDir, day + ".json"), JSON.stringify(today));
  const down = Object.values(u.sources).filter((s) => s.status === "down" || s.status === "stale").map((s) => s.id + " " + s.status);
  console.log("fabric snapshot saved: week " + u.week + ", " + u.games.length + " games, " + u.events.length + " events (" + fresh.length + " new today)" + (down.length ? "; degraded: " + down.join(", ") : ""));
}

main().catch((err) => console.warn("fabric snapshot skipped:", err && err.message));
