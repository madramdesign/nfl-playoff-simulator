// Small parsing helpers shared by the adapters. No dependencies.
"use strict";

// RFC 4180-style CSV: quoted fields, doubled quotes, commas and newlines inside quotes. Returns objects keyed by header.
function parseCsv(text) {
  const rows = []; let row = [], field = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; }
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = ""; if (row.length > 1 || row[0] !== "") rows.push(row); row = [];
    } else field += c;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  const head = rows.shift() || [];
  return rows.map((r) => Object.fromEntries(head.map((h, k) => [h, r[k] === undefined ? "" : r[k]])));
}

const num = (x) => { if (x === null || x === undefined || x === "" || x === "NA") return null; const v = Number(x); return Number.isFinite(v) ? v : null; };

// "2026-11-22" and "13:00" in US Eastern time -> ISO UTC, with daylight saving handled by Intl.
function easternToIso(date, time) {
  const [y, m, d] = date.split("-").map(Number); const [hh, mm] = (time || "13:00").split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh + 5, mm);
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
    .formatToParts(new Date(guess)).map((p) => [p.type, p.value]));
  const wall = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute);
  return new Date(Date.UTC(y, m - 1, d, hh, mm) - (wall - guess)).toISOString();
}

// Minimal RSS 2.0 reader: title, link, pubDate, guid of each <item>. Text is entity-decoded and otherwise unchanged.
const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
function decode(s) {
  return String(s || "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d)).replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => (ENT[n.toLowerCase()] != null ? ENT[n.toLowerCase()] : m)).trim();
}
function tag(block, name) { const m = block.match(new RegExp("<" + name + "(?:\\s[^>]*)?>([\\s\\S]*?)</" + name + ">", "i")); return m ? decode(m[1]) : null; }
function parseRss(xml) {
  if (!/<rss[\s>]|<channel[\s>]/i.test(xml)) throw new Error("not an RSS document");
  const items = [];
  for (const m of xml.matchAll(/<item[\s>][\s\S]*?<\/item>/gi)) {
    const b = m[0]; const title = tag(b, "title"), link = tag(b, "link"), pub = tag(b, "pubDate");
    if (!title || !link || !/^https:\/\//.test(link)) continue;
    const t = pub ? Date.parse(pub) : NaN;
    items.push({ title, link, ts: Number.isFinite(t) ? new Date(t).toISOString() : null, guid: tag(b, "guid") || link });
  }
  return items;
}

module.exports = { parseCsv, num, easternToIso, parseRss, decode };
