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
// a character reference outside Unicode becomes U+FFFD instead of throwing (one bad entity must not drop a whole feed)
const cp = (n) => (Number.isFinite(n) && n >= 0 && n <= 0x10ffff && !(n >= 0xd800 && n <= 0xdfff) ? String.fromCodePoint(n) : "�");
function decode(s) {
  return String(s || "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#(\d{1,8});/g, (_, d) => cp(+d)).replace(/&#x([0-9a-f]{1,8});/gi, (_, h) => cp(parseInt(h, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => (ENT[n.toLowerCase()] != null ? ENT[n.toLowerCase()] : m)).trim();
}
// Elements named `name`, found with indexOf in one pass (linear time even when closing tags are missing, unlike a lazy
// regex over the whole document). Stops at the first element without a closing tag, or after `limit` elements.
function blocks(xml, name, limit = Infinity) {
  const out = [], open = "<" + name, close = "</" + name + ">";
  let i = 0;
  while (out.length < limit) {
    const s = xml.indexOf(open, i); if (s < 0) break;
    const c = xml.charAt(s + open.length);
    if (c !== ">" && c !== " " && c !== "\n" && c !== "\r" && c !== "\t") { i = s + open.length; continue; }
    const e = xml.indexOf(close, s + open.length); if (e < 0) break;
    out.push(xml.slice(s, e + close.length)); i = e + close.length;
  }
  return out;
}
function tag(block, name) { const m = block.match(new RegExp("<" + name + "(?:\\s[^>]*)?>([\\s\\S]*?)</" + name + ">", "i")); return m ? decode(m[1]) : null; }
function parseRss(xml) {
  if (!/<rss[\s>]|<channel[\s>]/i.test(xml)) throw new Error("not an RSS document");
  const items = [];
  for (const b of blocks(xml, "item")) {
    const title = tag(b, "title"), link = tag(b, "link"), pub = tag(b, "pubDate");
    if (!title || !link || !/^https:\/\//.test(link)) continue;
    const t = pub ? Date.parse(pub) : NaN;
    items.push({ title, link, ts: Number.isFinite(t) ? new Date(t).toISOString() : null, guid: tag(b, "guid") || link });
  }
  return items;
}

module.exports = { parseCsv, num, easternToIso, parseRss, decode, blocks };
