#!/usr/bin/env node
// Ask GitHub for a fresh data fetch and wait for it (DEC-023). The daily refresh on claude.ai runs where only GitHub can
// be reached, so it relies on the snapshot the GitHub data fetch commits; GitHub starts scheduled jobs hours late or
// skips them. A push starts a workflow at once, so this script commits `data/fabric/fetch-request.json` to main and
// pushes it, which starts "Daily data fetch" and "Fetch FantasyPros data" (their `push` trigger on that file). It then
// waits until main carries a snapshot made after the request and brings the checkout up to date.
//
// `npm run refresh` runs it first, with `--if-stale 8`. It asks only when it should:
// - never on GitHub Actions (the backup refresh fetches the sources itself there), nor with NFLU_FETCH_REQUEST=0;
// - never from a checkout with commits that are not on GitHub's main (another branch, or local work): nothing but the
//   request file is ever pushed;
// - not when main already has a snapshot under 8 hours old (the checkout is brought up to it instead).
// It never fails the refresh: on any problem, or when nothing arrives in time, it says so and exits 0, and the
// refresh's own `--keep-if-fresh` rule decides as before (keep a recent snapshot, or fetch what it can).
//
// Usage: node scripts/request-fetch.js [--if-stale HOURS] [--timeout-sec 600] [--every-sec 20] [--remote origin] [--branch main]
"use strict";
const fs = require("fs"), path = require("path"), { execFileSync } = require("child_process");
const { isFresh } = require("./fabric-snapshot.js");

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
  const o = { timeoutSec: 600, everySec: 20, remote: "origin", branch: "main", ifStale: null };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i], v = argv[i + 1];
    if (k === "--timeout-sec") { o.timeoutSec = Number(v); i++; }
    else if (k === "--every-sec") { o.everySec = Number(v); i++; }
    else if (k === "--remote") { o.remote = v; i++; }
    else if (k === "--branch") { o.branch = v; i++; }
    else if (k === "--if-stale") { const h = Number(v); o.ifStale = Number.isFinite(h) && h > 0 ? h : null; i++; }
  }
  return o;
}
const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
const firstLine = (e) => String((e && e.message) || e).split("\n")[0];

async function main(argv = process.argv.slice(2), { cwd = process.cwd(), now = Date.now, log = console.log, env = process.env } = {}) {
  const o = args(argv), git = (...a) => execFileSync("git", a, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  const remoteRef = o.remote + "/" + o.branch, skip = (why, msg, fresh = false) => { log("Fetch request: " + msg); return { requested: false, fresh, skipped: why }; };
  if (env.GITHUB_ACTIONS === "true") return skip("github", "not on GitHub Actions, where the refresh fetches the sources itself.");
  if (env.NFLU_FETCH_REQUEST === "0") return skip("off", "turned off (NFLU_FETCH_REQUEST=0).");
  let at;
  try {
    git("fetch", "--quiet", o.remote, o.branch);
    if (Number(git("rev-list", "--count", remoteRef + "..HEAD")) > 0) return skip("local-commits", "this checkout has commits that are not on " + remoteRef + "; nothing is pushed from it.");
    git("-c", "rebase.autoStash=true", "rebase", "--quiet", remoteRef);   // up to date with main, keeping any uncommitted edit
    if (o.ifStale != null) {
      let snap = null;
      try { snap = JSON.parse(fs.readFileSync(path.join(cwd, SNAPSHOT), "utf8")); } catch (e) { /* none yet */ }
      if (isFresh(snap, o.ifStale, now())) return skip("fresh", "main has a snapshot under " + o.ifStale + " hours old (" + snap.generatedAt + "); no request.", true);
    }
    at = now();
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
    log("Fetch request: pushed at " + new Date(at).toISOString() + "; waiting up to " + o.timeoutSec + " s for the snapshot.");
  } catch (e) {
    return skip("error", "could not be made (" + firstLine(e) + "); the refresh goes on as before.");
  }
  const until = at + o.timeoutSec * 1000;
  while (now() < until) {
    await sleep(o.everySec * 1000);
    try {
      git("fetch", "--quiet", o.remote, o.branch);
      if (madeAfter(git("show", remoteRef + ":" + SNAPSHOT), at)) {
        git("-c", "rebase.autoStash=true", "rebase", "--quiet", remoteRef);   // the checkout now has the new snapshot (and FantasyPros, if done)
        log("Fetch request: fresh snapshot from GitHub after " + Math.round((now() - at) / 1000) + " s; the checkout is up to date.");
        return { requested: true, fresh: true };
      }
    } catch (e) { log("Fetch request: still waiting (" + firstLine(e) + ")."); }
  }
  log("Fetch request: no new snapshot within " + o.timeoutSec + " s; the refresh goes on with what it has.");
  return { requested: true, fresh: false };
}

if (require.main === module) main().then(() => process.exit(0), (e) => { console.log("Fetch request: " + firstLine(e)); process.exit(0); });
module.exports = { main, madeAfter, args, REQUEST };
