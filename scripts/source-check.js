// Source-drift check (backlog F30), run daily by .github/workflows/source-check.yml. Every public source is fetched
// fresh and the result is checked against the public-snapshot contract. A source that fails (down, or its adapter
// refusing a changed format) or a contract problem counts only if it is still there on a second try later, so a short
// outage raises no alarm. Prints a Markdown report; with GITHUB_OUTPUT set, writes `failing` and `report` outputs.
// Run: node scripts/source-check.js [--retry-after=MINUTES]   (default 20; 0 checks once)
"use strict";
const fs = require("fs"), os = require("os"), path = require("path");
const root = path.join(__dirname, "..");
const { createFabric } = require(path.join(root, "lib", "fabric"));
const { validatePublicSnapshot } = require(path.join(root, "lib", "contract.js"));
const { ABBRS } = require(path.join(root, "lib", "fabric", "entities.js"));

// One check: {at, down: {id: error}, contract: [problems]}. fabric: a public-scope fabric with no cache.
async function checkOnce(fabric, now = Date.now()) {
  const u = await fabric.universe({ fresh: true }), down = {};
  for (const [id, s] of Object.entries(u.sources)) if (s.status === "down" || s.status === "pending") down[id] = s.lastError || s.status;
  return { at: new Date(now).toISOString(), down, contract: validatePublicSnapshot(u, ABBRS) };
}
// Pure: what failed in both checks (the second check's wording). Contract messages are compared without their array
// positions ("events[12]"), which shift as new headlines arrive between the checks.
const unindexed = (x) => String(x).replace(/\[\d+\]/g, "[]");
function persistentProblems(a, b) {
  const down = {}, before = new Set(a.contract.map(unindexed));
  for (const id of Object.keys(b.down)) if (id in a.down) down[id] = b.down[id];
  return { down, contract: b.contract.filter((x) => before.has(unindexed(x))) };
}
const hasProblems = (p) => Object.keys(p.down).length > 0 || p.contract.length > 0;
// Pure: the issue text.
function report(p, first, second) {
  const lines = ["Daily source check (backlog F30): these problems were present in two checks, at " + first.at + " and " + (second ? second.at : first.at) + ".", ""];
  if (Object.keys(p.down).length) { lines.push("**Sources failing:**", ""); for (const [id, e] of Object.entries(p.down)) lines.push("- `" + id + "`: " + String(e).slice(0, 200)); lines.push(""); }
  if (p.contract.length) { lines.push("**Public-snapshot contract problems:**", ""); for (const x of p.contract.slice(0, 20)) lines.push("- " + x); lines.push(""); }
  lines.push("A failing source may be an outage or a change in the provider's format; check its row in `docs/NFL_DATA_SOURCE_REGISTRY.md`. The daily snapshot carries a failed source's last good data for up to 7 days (F01).");
  return lines.join("\n");
}

async function main() {
  const arg = process.argv.find((a) => a.startsWith("--retry-after=")), waitMin = arg ? Number(arg.split("=")[1]) : 20;
  const fresh = () => createFabric({ scopes: ["public"], cacheDir: null });
  const first = await checkOnce(fresh());
  let p = { down: first.down, contract: first.contract }, second = null;
  if (hasProblems(p) && waitMin > 0) {
    console.log("first check found problems; checking again in " + waitMin + " min: " + JSON.stringify(p));
    await new Promise((ok) => setTimeout(ok, waitMin * 60000));
    second = await checkOnce(fresh());
    p = persistentProblems(first, second);
  }
  // failing: a problem in both checks (open or add to the issue). allPassed: the last check found nothing (close it).
  // Problems that changed between the two checks are neither: the issue is left as it is.
  const lastCheck = second || first, allPassed = !hasProblems({ down: lastCheck.down, contract: lastCheck.contract });
  const failing = hasProblems(p);
  const text = failing ? report(p, first, second) : allPassed ? "All public sources answered and the snapshot passed the contract (" + lastCheck.at + ")."
    : "Problems changed between the two checks, so none counts yet: first " + JSON.stringify(first.down) + ", then " + JSON.stringify(lastCheck.down) + ".";
  console.log(text);
  if (process.env.GITHUB_OUTPUT) {
    const file = path.join(process.env.RUNNER_TEMP || os.tmpdir(), "source-check-report.md");
    fs.writeFileSync(file, text);
    fs.appendFileSync(process.env.GITHUB_OUTPUT, "failing=" + failing + "\nall_passed=" + allPassed + "\nreport=" + file + "\n");
  }
}

module.exports = { checkOnce, persistentProblems, report, hasProblems };
if (require.main === module) main().catch((e) => { console.error("source check could not run:", e && e.message); process.exit(1); });
