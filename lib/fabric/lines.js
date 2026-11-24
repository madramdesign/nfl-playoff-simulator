// Line history (backlog F23): every betting line the fabric sees for a game, kept as a short series so a move has a
// before and an after. Only real observations are stored: the line, where it came from, and when that source's data
// was fetched. An opening line whose time the source does not give is stored once with `at: null` and `open: true`.
// Pure: no files, no clock. The fabric keeps the history in its state file; the daily snapshot carries it forward.
"use strict";

const MAX_PER_GAME = 60;       // observations kept per game (oldest dropped first)
const KEEP_DAYS = 10;          // a game's history is dropped this long after kickoff
const BIG_SPREAD = 1.5, BIG_TOTAL = 2;   // a move this large between two observations is flagged (points)

const n = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const same = (a, b) => a && b && a.source === b.source && a.spread === b.spread && a.total === b.total && a.homeProb === b.homeProb;

// One observation from a game's odds block, or null when it has no line.
function obsOf(odds, at) {
  if (!odds || typeof odds !== "object") return null;
  const spread = n(odds.spread && odds.spread.current), total = n(odds.total && odds.total.current);
  const hp = n(odds.homeProb && odds.homeProb.current), homeProb = hp == null ? null : Math.round(hp * 1000) / 1000;
  if (spread == null && total == null && homeProb == null) return null;
  return { at, source: String(odds.source || ""), provider: odds.provider || null, spread, total, homeProb };
}
function openOf(odds) {
  const spread = n(odds && odds.spread && odds.spread.open), total = n(odds && odds.total && odds.total.open);
  const hp = n(odds && odds.homeProb && odds.homeProb.open), homeProb = hp == null ? null : Math.round(hp * 1000) / 1000;
  if (spread == null && total == null && homeProb == null) return null;
  return { at: null, open: true, source: String(odds.source || ""), provider: odds.provider || null, spread, total, homeProb };
}

// history: {gameId: [obs]} (or null); games: this payload's games; atOf(sourceId) -> ISO fetch time of that source;
// now: ms. Returns a new history: a new observation is added only when the line differs from that source's last one.
// A game's market block (a consensus across books: flat numbers, no opening line) in the odds block's shape.
const asOdds = (m) => ({ source: m.source, provider: m.provider, spread: { current: m.spread }, total: { current: m.total }, homeProb: { current: m.homeProb } });
function observeLines(history, games, atOf, now) {
  const out = {};
  for (const [id, list] of Object.entries(history || {})) if (Array.isArray(list)) out[id] = list.slice();
  for (const g of games || []) {
    if (!g || typeof g.id !== "string") continue;
    for (const od of [g.odds, g.market ? asOdds(g.market) : null]) {
      if (!od) continue;
      const at = atOf(od.source), o = obsOf(od, at); if (!o) continue;
      const list = out[g.id] || (out[g.id] = []);
      if (!list.some((x) => x.open && x.source === o.source)) { const op = openOf(od); if (op && !same(op, o)) list.unshift(op); }
      const last = [...list].reverse().find((x) => !x.open && x.source === o.source);
      if (!same(last, o)) list.push(o);
      if (list.length > MAX_PER_GAME) list.splice(list.some((x) => x.open) ? 1 : 0, list.length - MAX_PER_GAME);
    }
  }
  return prune(out, games, now);
}
// Drops games that kicked off more than KEEP_DAYS ago (a game no longer in `games` keeps its history until then only
// if its kickoff is known from `games`; otherwise it is kept, the caller's merge decides).
function prune(history, games, now) {
  const kick = new Map((games || []).map((g) => [g.id, Date.parse(g.kickoff)]));
  for (const id of Object.keys(history)) { const k = kick.get(id); if (Number.isFinite(k) && now - k > KEEP_DAYS * 86400000) delete history[id]; }
  return history;
}
// Two histories combined (yesterday's published one and today's run): every distinct observation once, in time order
// with opening lines first, capped per game. Used by the daily snapshot, which runs with no state of its own.
function mergeLines(a, b) {
  const out = {};
  for (const src of [a, b]) for (const [id, list] of Object.entries(src || {})) {
    if (!Array.isArray(list)) continue;
    const cur = out[id] || (out[id] = []);
    for (const o of list) if (o && !cur.some((x) => x.at === o.at && x.open === o.open && same(x, o))) cur.push(o);
  }
  for (const id of Object.keys(out)) {
    out[id].sort((x, y) => (x.open ? 0 : 1) - (y.open ? 0 : 1) || String(x.at).localeCompare(String(y.at)));
    if (out[id].length > MAX_PER_GAME) out[id] = out[id].slice(out[id].length - MAX_PER_GAME);
  }
  return out;
}
// Pure: the moves in one game's history for one source, newest last: {from, to, dSpread, dTotal, big}.
function movesOf(list, source) {
  const xs = (list || []).filter((x) => !source || x.source === source), out = [];
  for (let i = 1; i < xs.length; i++) {
    const a = xs[i - 1], b = xs[i], dS = a.spread != null && b.spread != null ? b.spread - a.spread : null, dT = a.total != null && b.total != null ? b.total - a.total : null;
    out.push({ from: a, to: b, dSpread: dS, dTotal: dT, big: (dS != null && Math.abs(dS) >= BIG_SPREAD) || (dT != null && Math.abs(dT) >= BIG_TOTAL) });
  }
  return out;
}

module.exports = { observeLines, mergeLines, movesOf, prune, MAX_PER_GAME, KEEP_DAYS, BIG_SPREAD, BIG_TOTAL };
