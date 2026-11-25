#!/usr/bin/env node
// Ask GitHub for a fresh data fetch and wait for it (DEC-023). The daily refresh on claude.ai runs where only GitHub can
// be reached, so it relies on the snapshot the GitHub data fetch commits; GitHub starts scheduled jobs hours late or
// skips them. A push starts a workflow at once, so this script commits `data/fabric/fetch-request.json` to main and
// pushes it, which starts "Daily data fetch" and "Fetch FantasyPros data" (their `push` trigger on that file). It then
// waits until main carries a snapshot made after the request and brings the clone up to date.
//
// It never fails the refresh: on any problem, or when nothing arrives in time, it says so and exits 0, and the
// refresh's own `--keep-if-fresh` rule decides as before (keep a recent snapshot, or fetch what it can).
//
// Usage: node scripts/request-fetch.js [--timeout-sec 600] [--every-sec 20] [--remote origin] [--branch main]
"use strict";
const fs = require("fs"), path = require("path"), { execFileSync } = require("child_process");

const REQUEST = "data/fabric/fetch-request.json", SNAPSHOT = "data/fabric/latest.json";
const SKEW_MS = 60e3;   // clocks on the two machines may differ a little

// Pure: whether a snapshot (its JSON text) was made after the request, allowing for clock skew.
function madeAfter(snapshotText, requestedAtMs) {
  try {
    const t = Date.parse(JSON.parse(snapshotText).generatedAt);
    return Number.isFinite(t) && Number.isFinite(requestedAtMs) && t >= requestedAtMs - SKEW_MS;
  } catch (e) { return false; }
}
function args(argv) {
  const o = { timeoutSec: 600, everySec: 20, remote: "origin", branch: "main" };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i], v = argv[i + 1];
    if (k === "--timeout-sec") { o.timeoutSec = Number(v); i++; }
    else if (k === "--every-sec") { o.everySec = Number(v); i++; }
    else if (k === "--remote") { o.remote = v; i++; }
    else if (k === "--branch") { o.branch = v; i++; }
  }
  return o;
}
const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));

async function main(argv = process.argv.slice(2), { cwd = process.cwd(), now = Date.now, log = console.log } = {}) {
  const o = args(argv), git = (...a) => execFileSync("git", a, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  const remoteRef = o.remote + "/" + o.branch, at = now();
  try {
    fs.mkdirSync(path.join(cwd, path.dirname(REQUEST)), { recursive: true });
    fs.writeFileSync(path.join(cwd, REQUEST), JSON.stringify({ requestedAt: new Date(at).toISOString(), by: "daily refresh", why: "DEC-023: start the data fetch without GitHub's scheduler" }, null, 2) + "\n");
    git("add", REQUEST);
    git("commit", "-m", "Request a data fetch", "--only", "--", REQUEST);   // only this file, whatever else is being edited
    let pushed = false;
    for (let attempt = 1; attempt <= 2 && !pushed; attempt++) {
      try { git("push", o.remote, "HEAD:" + o.branch); pushed = true; }
      catch (e) { git("fetch", o.remote, o.branch); git("-c", "rebase.autoStash=true", "rebase", remoteRef); }
    }
    if (!pushed) throw new Error("the request could not be pushed");
    log("Requested a data fetch at " + new Date(at).toISOString() + "; waiting up to " + o.timeoutSec + " s for the snapshot.");
  } catch (e) {
    log("Could not request a data fetch (" + String(e.message || e).split("\n")[0] + "); the refresh goes on as before.");
    return { requested: false, fresh: false };
  }
  const until = at + o.timeoutSec * 1000;
  while (now() < until) {
    await sleep(o.everySec * 1000);
    try {
      git("fetch", "--quiet", o.remote, o.branch);
      if (madeAfter(git("show", remoteRef + ":" + SNAPSHOT), at)) {
        git("-c", "rebase.autoStash=true", "rebase", remoteRef);   // the clone now has the new snapshot (and FantasyPros, if done)
        log("Fresh snapshot from GitHub after " + Math.round((now() - at) / 1000) + " s; the clone is up to date.");
        return { requested: true, fresh: true };
      }
    } catch (e) { log("Still waiting (" + String(e.message || e).split("\n")[0] + ")."); }
  }
  log("No new snapshot within " + o.timeoutSec + " s; the refresh goes on with what it has.");
  return { requested: true, fresh: false };
}

if (require.main === module) main().then(() => process.exit(0), (e) => { console.log("request-fetch: " + (e && e.message || e)); process.exit(0); });
module.exports = { main, madeAfter, args, REQUEST };
