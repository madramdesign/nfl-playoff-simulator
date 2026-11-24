// Has today's data refresh run, and was it degraded? Read by the backup workflow (.github/workflows/refresh-backup.yml,
// backlog F01 parts 3 and 4): it refreshes only when the scheduled refresh has not, and opens or updates an issue when
// the day's snapshot run lost or carried two or more sources. Reads data/snapshots/ and data/fabric/runs.json only.
// Run: node scripts/refresh-status.js   (prints JSON; writes GitHub Actions outputs when GITHUB_OUTPUT is set)
"use strict";
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");

const DEGRADED_MIN = 2;   // sources down or carried from the previous snapshot before the owner is told
// Today's date in Eastern time (the refresh's own calendar), YYYY-MM-DD.
const easternDay = (ms) => new Date(ms).toLocaleDateString("en-CA", { timeZone: "America/New_York" });

// Pure. snapshotDays: the dates of data/snapshots/*.json; runs: data/fabric/runs.json (oldest first); latest: the
// published data/fabric/latest.json (or null); now: ms. Today's run report is used when there is one; otherwise the
// published snapshot itself is read (a carried source has `carriedFrom`), so this works even when the run report was
// not committed. A refresh that ran today without writing a fresh fabric snapshot is degraded too.
function refreshStatus({ snapshotDays, runs, latest, now }) {
  const today = easternDay(now), refreshedToday = (snapshotDays || []).includes(today);
  const todays = (Array.isArray(runs) ? runs : []).filter((r) => r && typeof r.at === "string" && easternDay(Date.parse(r.at)) === today);
  const last = todays.length ? todays[todays.length - 1] : null;
  const latestAt = latest && typeof latest.generatedAt === "string" && Number.isFinite(Date.parse(latest.generatedAt)) ? latest.generatedAt : null;
  const latestToday = !!latestAt && easternDay(Date.parse(latestAt)) === today;
  if (last) {
    const lost = [...new Set([].concat(last.down || [], last.carried || []))];
    return { today, refreshedToday, degraded: lost.length >= DEGRADED_MIN, lost,
      summary: "Snapshot run at " + last.at + ": " + (last.ok || []).length + " sources ok, " + (last.stale || []).length + " stale, " + (last.down || []).length + " down" +
        ((last.carried || []).length ? "; carried from the previous snapshot: " + last.carried.join(", ") : "") + ((last.down || []).length ? "; down: " + last.down.join(", ") : "") + "." };
  }
  if (latestToday) {
    const src = latest.sources && typeof latest.sources === "object" ? Object.values(latest.sources) : [];
    const down = src.filter((s) => s && s.status === "down").map((s) => s.id), carried = src.filter((s) => s && s.carriedFrom).map((s) => s.id);
    const lost = [...new Set(down.concat(carried))];
    return { today, refreshedToday, degraded: lost.length >= DEGRADED_MIN, lost,
      summary: "Published snapshot of " + latestAt + " (no run report for today): " + (down.length ? "down: " + down.join(", ") : "nothing down") +
        (carried.length ? "; carried from the previous snapshot: " + carried.join(", ") : "") + "." };
  }
  if (refreshedToday) return { today, refreshedToday, degraded: true, lost: [],
    summary: "Today's refresh ran, but no data-fabric snapshot was written today (the published one is from " + (latestAt || "an unknown time") + "), so the page shows older feeds." };
  return { today, refreshedToday, degraded: false, lost: [], summary: "No refresh yet today." };
}

function main() {
  const snapshotDays = (() => { try { return fs.readdirSync(path.join(root, "data", "snapshots")).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).map((f) => f.slice(0, 10)); } catch (_) { return []; } })();
  const runs = (() => { try { const r = JSON.parse(fs.readFileSync(path.join(root, "data", "fabric", "runs.json"), "utf8")); return Array.isArray(r) ? r : []; } catch (_) { return []; } })();
  const latest = (() => { try { return JSON.parse(fs.readFileSync(path.join(root, "data", "fabric", "latest.json"), "utf8")); } catch (_) { return null; } })();
  const s = refreshStatus({ snapshotDays, runs, latest, now: Date.now() });
  console.log(JSON.stringify(s));
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, "refreshed_today=" + s.refreshedToday + "\ndegraded=" + s.degraded + "\nsummary=" + s.summary.replace(/[\r\n]+/g, " ") + "\n");
  }
}

module.exports = { refreshStatus, DEGRADED_MIN };
if (require.main === module) main();
