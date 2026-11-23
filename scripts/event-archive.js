// Builds the compact event archive that scripts/build.py embeds in the page as D.eventArchive: the point-in-time
// record (data/fabric/events/YYYY-MM-DD.json, written by scripts/fabric-snapshot.js) for the last few days, so the
// static page can replay the feed as it stood at an earlier moment (src/universe/18-history.js).
// Rules: public-scope sources only (DEC-006); every event is checked and a bad one is left out and counted, never
// repaired; the output is bounded in days and in bytes (the oldest first-seen events go first when it does not fit).
// Run: node scripts/event-archive.js   (prints the archive as JSON; the report goes to stderr)
"use strict";
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const { EVENT_TYPES } = require(path.join(root, "lib", "contract.js"));

const ARCHIVE_DAYS = 7;          // calendar days of event files, counting back from the build day
const ARCHIVE_MAX_BYTES = 200000; // hard cap on the embedded JSON text
const DAY_RE = /^(\d{4}-\d{2}-\d{2})\.json$/;
const isIso = (x) => typeof x === "string" && !Number.isNaN(Date.parse(x));
const isNum = (x) => typeof x === "number" && Number.isFinite(x);
const bytes = (o) => Buffer.byteLength(JSON.stringify(o), "utf8");

// Why an event cannot go in the archive, or null. publicSources: Set of source ids; abbrs: team abbreviations.
function eventProblem(e, publicSources, abbrs) {
  if (!e || typeof e !== "object" || Array.isArray(e)) return "not an object";
  if (typeof e.id !== "string" || !e.id || e.id.length > 80) return "id";
  if (!EVENT_TYPES.includes(e.type)) return "type";
  if (!isIso(e.ts)) return "ts";
  if (!isIso(e.seenAt)) return "seenAt";
  if (typeof e.title !== "string" || !e.title) return "title";
  if (e.url != null && !(typeof e.url === "string" && /^https:\/\//.test(e.url))) return "url";
  if (typeof e.source !== "string") return "source";
  if (!publicSources.has(e.source)) return "non-public source";
  if (e.data && e.data.other && !publicSources.has(e.data.other.source)) return "non-public source";
  if (!Array.isArray(e.teams) || e.teams.some((a) => !abbrs.includes(a))) return "teams";
  if (e.importance != null && !(isNum(e.importance) && e.importance >= 0 && e.importance <= 100)) return "importance";
  if (e.confidence != null && !(isNum(e.confidence) && e.confidence >= 0 && e.confidence <= 1)) return "confidence";
  if (e.sources != null && !Array.isArray(e.sources)) return "sources";
  return null;
}

// The same event with empty fields left out (the page's reader fills the same defaults back in).
function compact(e) {
  const o = { id: e.id, type: e.type, ts: e.ts, seenAt: e.seenAt, teams: e.teams, title: e.title, source: e.source };
  if (e.subtype) o.subtype = e.subtype;
  if (e.url) o.url = e.url;
  if (e.publisher) o.publisher = e.publisher;
  if (e.importance != null) o.importance = e.importance;
  if (e.confidence != null) o.confidence = e.confidence;
  if (isNum(e.sourceCount) && e.sourceCount > 1) { o.sourceCount = e.sourceCount; if (Array.isArray(e.sources)) o.sources = e.sources.map((s) => ({ publisher: s && s.publisher, url: s && s.url })); }
  if (Array.isArray(e.players) && e.players.length) o.players = e.players.map((p) => ({ name: p && p.name, pos: p && p.pos }));
  if (typeof e.gameId === "string") o.gameId = e.gameId;
  if (e.data && typeof e.data === "object" && Object.keys(e.data).length) o.data = e.data;
  return o;
}
const sameBody = (a, b) => { const x = compact(a), y = compact(b); delete x.seenAt; delete y.seenAt; return JSON.stringify(x) === JSON.stringify(y); };
const dayOf = (iso) => new Date(Date.parse(iso)).toISOString().slice(0, 10);

// files: [{name: "YYYY-MM-DD.json", text}]; latestEvents: the events of the snapshot embedded beside the archive
// (D.fabric): an archived event identical to one of those is stored as {id, seenAt} only and read back from there.
// today: "YYYY-MM-DD". Returns {archive, report}. Pure: no file or network access.
function buildEventArchive(files, opts) {
  opts = opts || {};
  const days = opts.days || ARCHIVE_DAYS, maxBytes = opts.maxBytes || ARCHIVE_MAX_BYTES, today = opts.today;
  const pub = opts.publicSources instanceof Set ? opts.publicSources : new Set(opts.publicSources || []), abbrs = opts.abbrs || [];
  const report = { files: [], skippedFiles: [], read: 0, invalid: 0, nonPublic: 0, duplicates: 0, trimmed: 0, refs: 0, problems: [] };
  const first = new Date(Date.parse(today + "T00:00:00Z") - (days - 1) * 86400e3).toISOString().slice(0, 10);
  const by = new Map();
  (files || []).filter((f) => f && DAY_RE.test(f.name)).sort((a, b) => (a.name < b.name ? -1 : 1)).forEach((f) => {
    const day = f.name.match(DAY_RE)[1];
    if (!isIso(day + "T00:00:00Z") || day < first || day > today) return;
    let d;
    try { d = JSON.parse(f.text); } catch (_) { d = null; }
    if (!d || typeof d !== "object" || !Array.isArray(d.events)) { report.skippedFiles.push(day); return; }
    report.files.push(day);
    d.events.forEach((e) => {
      report.read++;
      const why = eventProblem(e, pub, abbrs);
      if (why) { if (why === "non-public source") report.nonPublic++; else report.invalid++; if (report.problems.length < 10) report.problems.push(day + ": " + why); return; }
      const cur = by.get(e.id);
      if (cur) { report.duplicates++; if (Date.parse(e.seenAt) >= Date.parse(cur.seenAt)) return; }
      by.set(e.id, e);
    });
  });
  const latest = new Map();
  (opts.latestEvents || []).forEach((e) => { if (e && typeof e.id === "string") latest.set(e.id, e); });
  let events = Array.from(by.values()).sort((a, b) => Date.parse(a.seenAt) - Date.parse(b.seenAt) || (a.id < b.id ? -1 : 1))
    .map((e) => (latest.has(e.id) && sameBody(e, latest.get(e.id)) ? { id: e.id, seenAt: e.seenAt } : compact(e)));
  const make = () => ({ v: 1, days, maxBytes, files: report.files.slice(), from: events.length ? events[0].seenAt : null, to: events.length ? events[events.length - 1].seenAt : null, events });
  // Over the cap: the oldest first-seen day goes, whole, until it fits; a single day that is still too big loses its
  // oldest events. Either way `from` moves forward, so the page states honestly where the archive now begins.
  while (events.length && bytes(make()) > maxBytes) {
    const d0 = dayOf(events[0].seenAt), rest = events.filter((e) => dayOf(e.seenAt) !== d0);
    const next = rest.length ? rest : events.slice(Math.max(1, Math.ceil(events.length / 10)));
    report.trimmed += events.length - next.length; events = next;
  }
  const archive = make();
  report.refs = events.filter((e) => e.title === undefined).length;
  report.events = events.length; report.bytes = bytes(archive);
  return { archive, report };
}

// Problems with a finished archive (the build refuses to embed one that has any).
function validateEventArchive(a, publicSources, abbrs, maxBytes) {
  const errs = [], pub = publicSources instanceof Set ? publicSources : new Set(publicSources || []);
  if (!a || typeof a !== "object" || a.v !== 1 || !Array.isArray(a.events)) return ["not an event archive"];
  if (bytes(a) > (maxBytes || ARCHIVE_MAX_BYTES)) errs.push("larger than " + (maxBytes || ARCHIVE_MAX_BYTES) + " bytes");
  const seen = new Set();
  a.events.forEach((e, k) => {
    const p = "events[" + k + "]";
    if (!e || typeof e.id !== "string" || !isIso(e.seenAt)) { errs.push(p + ": id or seenAt"); return; }
    if (seen.has(e.id)) errs.push(p + ": duplicate " + e.id); seen.add(e.id);
    if (e.title === undefined) { if (Object.keys(e).length !== 2) errs.push(p + ": a reference carries only id and seenAt"); return; }
    const why = eventProblem(e, pub, abbrs || []); if (why) errs.push(p + ": " + why);
  });
  if (a.events.length && (a.from !== a.events[0].seenAt || a.events.some((e) => Date.parse(e.seenAt) < Date.parse(a.from)))) errs.push("from is not the earliest first-seen time");
  return errs;
}

function main() {
  const evDir = path.join(root, "data", "fabric", "events");
  // the public source ids come from the fabric's own registry, so the archive and the snapshot share one definition
  const fabric = require(path.join(root, "lib", "fabric")).createFabric({ scopes: ["public"], cacheDir: null });
  const publicSources = new Set(Array.isArray(fabric.sources) ? fabric.sources.map((s) => s.id) : Object.keys(fabric.sources));
  const { ABBRS } = require(path.join(root, "lib", "fabric", "entities.js"));
  let names = []; try { names = fs.readdirSync(evDir).filter((f) => DAY_RE.test(f)); } catch (_) { /* no record yet */ }
  const files = names.map((name) => { try { return { name, text: fs.readFileSync(path.join(evDir, name), "utf8") }; } catch (_) { return null; } }).filter(Boolean);
  let latestEvents = []; try { latestEvents = JSON.parse(fs.readFileSync(path.join(root, "data", "fabric", "latest.json"), "utf8")).events || []; } catch (_) { /* no snapshot */ }
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });   // the snapshot script's day
  const { archive, report } = buildEventArchive(files, { today, publicSources, abbrs: ABBRS, latestEvents });
  const errs = validateEventArchive(archive, publicSources, ABBRS);
  if (errs.length) { console.error("event archive NOT embedded; problems:\n  " + errs.slice(0, 10).join("\n  ")); process.exit(1); }
  console.error("event archive: " + report.events + " events (" + report.refs + " by reference to the snapshot) from " + (report.files.join(", ") || "no files") + ", " + report.bytes + " bytes" +
    (report.invalid || report.nonPublic || report.trimmed || report.skippedFiles.length ? "; left out: " + report.invalid + " invalid, " + report.nonPublic + " non-public, " + report.trimmed + " trimmed to fit, " + report.skippedFiles.length + " unreadable files" : ""));
  process.stdout.write(JSON.stringify(archive));
}

if (require.main === module) main();
module.exports = { buildEventArchive, validateEventArchive, eventProblem, ARCHIVE_DAYS, ARCHIVE_MAX_BYTES };
