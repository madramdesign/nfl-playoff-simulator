// The Odds API (the-odds-api.com, v4): moneyline, spread and total from each US sportsbook it covers, for NFL games
// that have not started. Needs the owner's key in the ODDS_API_KEY environment variable; without it the source is off.
// Terms allow showing and storing the data in an app but not re-serving it as a raw feed (docs/NFL_DATA_SOURCE_REGISTRY.md),
// so each book's prices stay on the local server and only derived values (the consensus) may be published.
// The key travels in the x-api-key header, never in a URL, so it cannot reach a log, an error message or a cache file.
// Written from the v4 guide; not yet run against the real API (no key on this machine yet).
"use strict";
const { TEAMS } = require("../entities");
const { UA } = require("../source");

const BASE = "https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds/";
const MARKETS = ["h2h", "spreads", "totals"];
const REGIONS = ["us"];
const CREDITS_PER_CALL = MARKETS.length * REGIONS.length;   // the guide: markets x regions
const CREDIT_FLOOR = 15;          // stop calling for the rest of the month below this many credits left
const DAYS_AHEAD = 8;             // this week's games only
const BY_NAME = new Map(TEAMS.map((t) => [t.name.toLowerCase(), t.a]));

const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const iso = (v) => (typeof v === "string" && Number.isFinite(Date.parse(v)) ? new Date(Date.parse(v)).toISOString() : null);
const noMs = (ms) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, "Z");

function oddsUrl(nowMs) {
  return BASE + "?regions=" + REGIONS.join(",") + "&markets=" + MARKETS.join(",") + "&oddsFormat=american&dateFormat=iso" +
    "&commenceTimeFrom=" + noMs(nowMs) + "&commenceTimeTo=" + noMs(nowMs + DAYS_AHEAD * 86400000);
}
// American price -> implied chance (with the book's margin still in it)
function implied(p) { p = num(p); if (p == null || (p > -100 && p < 100)) return null; return p > 0 ? 100 / (p + 100) : -p / (-p + 100); }
function median(xs) {
  const v = xs.filter((x) => x != null).sort((a, b) => a - b); if (!v.length) return null;
  const m = v.length >> 1; return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}
const half = (x) => (x == null ? null : Math.round(x * 2) / 2);

// One bookmaker's lines for one game, home-team view: spread is the home team's points (negative when favored).
function bookLines(b, homeName, awayName) {
  const mk = (k) => (Array.isArray(b.markets) ? b.markets.find((m) => m && m.key === k) : null);
  const out = (m, name) => (m && Array.isArray(m.outcomes) ? m.outcomes.find((o) => o && typeof o.name === "string" && o.name.toLowerCase() === name.toLowerCase()) : null);
  const h2h = mk("h2h"), sp = mk("spreads"), tot = mk("totals");
  const homePrice = num((out(h2h, homeName) || {}).price), awayPrice = num((out(h2h, awayName) || {}).price);
  const ih = implied(homePrice), ia = implied(awayPrice);
  const spread = num((out(sp, homeName) || {}).point), total = num((out(tot, "Over") || {}).point);
  const stamps = [b.last_update].concat([h2h, sp, tot].map((m) => m && m.last_update)).map(iso).filter(Boolean).sort();
  return { key: String(b.key || "").slice(0, 40), title: String(b.title || b.key || "").slice(0, 60), spread, total, homePrice, awayPrice,
    homeProb: ih != null && ia != null ? Math.round((ih / (ih + ia)) * 1000) / 1000 : null, lastUpdate: stamps.length ? stamps[stamps.length - 1] : null };
}

// The /odds answer -> {games: [{home, away, kickoff, books, consensus}], unmatched}. Games already under way are left
// out (the request asks for none; an in-play answer would be live odds, a different thing). Teams the canonical list
// does not know are counted, never guessed.
function normalizeOdds(json, nowMs) {
  const games = []; let unmatched = 0;
  for (const e of Array.isArray(json) ? json : []) {
    if (!e || typeof e !== "object") continue;
    const home = BY_NAME.get(String(e.home_team || "").toLowerCase()), away = BY_NAME.get(String(e.away_team || "").toLowerCase()), kickoff = iso(e.commence_time);
    if (!home || !away || !kickoff) { unmatched++; continue; }
    if (Number.isFinite(nowMs) && Date.parse(kickoff) <= nowMs) continue;
    const books = (Array.isArray(e.bookmakers) ? e.bookmakers : []).filter((b) => b && typeof b === "object").map((b) => bookLines(b, e.home_team, e.away_team))
      .filter((b) => b.spread != null || b.total != null || b.homeProb != null);
    if (!books.length) continue;
    const hp = median(books.map((b) => b.homeProb));
    games.push({ home, away, kickoff, books, consensus: { books: books.length, spread: half(median(books.map((b) => b.spread))), total: half(median(books.map((b) => b.total))),
      homeProb: hp == null ? null : Math.round(hp * 1000) / 1000, lastUpdate: books.map((b) => b.lastUpdate).filter(Boolean).sort().pop() || null } });
  }
  return { games, unmatched };
}

// Credits from the answer's headers: {remaining, used, last, month}; nulls when absent.
function creditsOf(headers, nowMs) {
  const h = (k) => { const v = headers && typeof headers.get === "function" ? headers.get(k) : null; const n = v == null ? NaN : Number(v); return Number.isFinite(n) ? n : null; };
  return { remaining: h("x-requests-remaining"), used: h("x-requests-used"), last: h("x-requests-last"), month: new Date(nowMs).toISOString().slice(0, 7) };
}
// Whether a call is allowed now, given the last known credits: below the floor, wait for the next calendar month
// (UTC; the provider's reset day is not stated, so the first call of a month finds out).
function budgetAllows(credits, nowMs) {
  if (!credits || credits.remaining == null) return true;
  if (credits.month !== new Date(nowMs).toISOString().slice(0, 7)) return true;
  return credits.remaining >= CREDIT_FLOOR;
}

// One call. Never puts the key in the URL; error messages carry the status only.
async function fetchOdds(key, nowMs, { fetchImpl = fetch, timeoutMs = 12000 } = {}) {
  const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetchImpl(oddsUrl(nowMs), { headers: { "user-agent": UA, accept: "application/json", "x-api-key": key }, signal: ctl.signal });
    const credits = creditsOf(res.headers, nowMs);
    if (res.status === 401) throw new Error("key refused or credits used up (401)");
    if (res.status === 429) throw new Error("too many requests (429)");
    if (!res.ok) throw new Error("answered " + res.status);
    return { json: await res.json(), credits };
  } catch (err) {
    if (err && err.name === "AbortError") throw new Error("timeout after " + timeoutMs + " ms");
    const msg = String((err && err.message) || err);
    throw new Error((key ? msg.split(key).join("[key]") : msg).slice(0, 200));
  } finally { clearTimeout(timer); }
}

module.exports = { oddsUrl, implied, median, bookLines, normalizeOdds, creditsOf, budgetAllows, fetchOdds, CREDITS_PER_CALL, CREDIT_FLOOR, BASE };
