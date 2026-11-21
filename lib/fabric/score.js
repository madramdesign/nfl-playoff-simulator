// Rules that turn raw items into ranked intelligence: importance, confidence, corroboration.
// These are transparent rules of thumb for sorting a feed. None of them feeds the win-probability model
// (docs/DECISIONS.md D7). Formulas are documented in docs/NEWS_ARCHITECTURE.md and docs/INJURY_ENGINE.md.
"use strict";
const crypto = require("crypto");

const hash = (...parts) => crypto.createHash("sha1").update(parts.map(String).join("|")).digest("hex").slice(0, 14);

// Source tiers: 1 official (league, team), 2 major outlet, 3 specialist or regional, 4 aggregator or unverified.
const TIER_SCORE = { 1: 100, 2: 75, 3: 50, 4: 25 };
const TIER_CONF = { 1: 0.95, 2: 0.85, 3: 0.7, 4: 0.5 };

// Keyword severity for headlines. First matching band wins. Words are matched case-insensitively on word edges.
const SEVERITY = [
  [100, /\b(season[- ]ending|out for (the )?season|torn (acl|achilles)|achilles|acl|traded|trade(s|d)? for|fired(?! up)|suspended|retires|retiring|arrested)\b/i],
  [75, /\b(ruled out|injured reserve|placed on ir|place[sd]? .{0,40} on (ir|injured reserve)|\bir\b|fractur\w*|surgery|benched|bench(es|ing)|waive[sd]?|release[sd]?|cut|sign(s|ed|ing)|concussion|(is|will be|remains?|listed|declared) out|out (vs\.?|against|for|with|indefinitely)|will start|to start|starting|named starter|trade)\b/i],
  [45, /\b(questionable|doubtful|limited|practice|did not practice|dnp|return(s|ing)?|activated|designated to return|injury|injured|hurt|status)\b/i],
];
const NOISE = /\b(fantasy|rankings?|ppr|superflex|dfs|start[- ]sit|sleepers?|waiver wire|picks against the spread|best bets?|prop bets?|podcast|mock draft|power rankings|quiz|movie|jersey retirement|retire (his|the) (jersey|number)|fired up|predictions?)\b/i;
const QB = /\b(qb|quarterback)\b/i;

function headlineSeverity(title) {
  if (!title) return 20;
  if (NOISE.test(title)) return 5;
  let s = 20;
  for (const [v, rx] of SEVERITY) if (rx.test(title)) { s = v; break; }
  if (QB.test(title) && s >= 45) s = Math.min(100, Math.round(s * 1.2));
  return s;
}

// importance = 0.55 severity + 0.20 tier + 0.15 corroboration + 0.10 recency (recency decays linearly over 24 hours).
// Team-less items are capped at 40: the feed is about teams.
function newsImportance({ title, tier, sourceCount = 1, ts, teams = [], now = Date.now() }) {
  const sev = headlineSeverity(title);
  const age = Math.max(0, now - Date.parse(ts));            // a future date counts as now, never as extra-recent
  const rec = Number.isFinite(age) ? Math.max(0, 1 - age / 86400000) * 100 : 0;
  let v = 0.55 * sev + 0.2 * (TIER_SCORE[tier] || 25) + 0.15 * Math.min(sourceCount, 5) * 20 + 0.1 * rec;
  if (!teams.length) v = Math.min(v, 40);
  if (sev <= 5) v = Math.min(v, 15);
  return Math.round(Math.max(0, Math.min(100, v)));
}

// Confidence that an item is accurate: the best source's tier, plus 0.04 for each further independent publisher.
function confidence(tier, publishers = 1) { return Math.round(Math.min(0.98, (TIER_CONF[tier] || 0.5) + 0.04 * Math.max(0, publishers - 1)) * 100) / 100; }

// Injury weights. Status: how likely the player misses the game. Position: rough share of team strength,
// ordered after public positional-value research (quarterback far above all others). Starter flag from depth charts.
const STATUS_W = { "Out": 1, "Injured Reserve": 1, "Physically Unable to Perform": 1, "Suspended": 1, "Doubtful": 0.75, "Questionable": 0.35, "Day-To-Day": 0.2, "Other": 0.2 };
const POS_W = { QB: 1, T: 0.45, OT: 0.45, LT: 0.45, RT: 0.45, DE: 0.42, EDGE: 0.42, OLB: 0.35, CB: 0.4, WR: 0.4, S: 0.3, FS: 0.3, SS: 0.3, LB: 0.3, ILB: 0.3, MLB: 0.3,
  DT: 0.3, NT: 0.3, DL: 0.3, TE: 0.3, RB: 0.3, C: 0.3, G: 0.28, OG: 0.28, OL: 0.3, K: 0.25, PK: 0.25, P: 0.1, LS: 0.05, FB: 0.1 };
function injuryWeight(status, pos, starter) {
  const s = STATUS_W[status] != null ? STATUS_W[status] : 0.2;
  const p = POS_W[pos] != null ? POS_W[pos] : 0.25;
  const st = starter === true ? 1 : starter === false ? 0.35 : 0.7;   // unknown when no depth chart was available
  return s * p * st;
}

// Group headlines that report the same story: shared team (or both team-less), within 36 hours, title-word overlap
// (Jaccard) of at least 0.34 against the cluster's first headline, and no sign of two different stories: opposite
// actions (signs / releases) or different named people. The representative is the best tier, then the earliest.
const STOP = new Set("a an the and or of to in on at for with from by as is are was were be after before over into his her their its vs vs. says say report reports per sources source nfl week".split(" "));
function tokens(t) { return new Set(String(t).toLowerCase().replace(/[^a-z0-9' ]+/g, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w))); }
function jaccard(a, b) { let i = 0; for (const x of a) if (b.has(x)) i++; const u = a.size + b.size - i; return u ? i / u : 0; }
const ACTIONS = { sign: /\b(sign|signs|signed|signing|re-signs?)\b/i, release: /\b(release[sd]?|waive[sd]?|cuts?)\b/i, trade: /\btrade[sd]?\b/i,
  out: /\b(out|ir|injured reserve|ruled out|surgery|torn)\b/i, back: /\b(activated?|returns?|cleared|back)\b/i, start: /\b(starts?|starting|starter)\b/i };
function actions(t) { return new Set(Object.keys(ACTIONS).filter((k) => ACTIONS[k].test(t))); }
let TEAM_WORDS = null;
const COMMON = new Set("NFL QB WR RB TE OL DL LB CB DE DT OT EDGE Week Sunday Monday Thursday Saturday Friday Tuesday Wednesday The A An In On At Sources Report Reports Source After Before How Why What Who When Will Can Should Is Are Coach Coaches Rookie Star Pro Bowl Super Bowl AFC NFC January February March April May June July August September October November December".split(" "));
function names(t) {
  if (!TEAM_WORDS) { TEAM_WORDS = new Set(); for (const tm of require("./entities").TEAMS) for (const al of tm.aliases) for (const w of al.split(/\s+/)) TEAM_WORDS.add(w); }
  const out = new Set();
  String(t).split(/[\s,:;!?()"“”]+/).forEach((raw, k) => {
    const w = raw.replace(/['’]s$/, "").replace(/[.]$/, "");
    if (k > 0 && /^[A-Z][a-z'’.-]{2,}$/.test(w) && !TEAM_WORDS.has(w) && !COMMON.has(w)) out.add(w.toLowerCase());
  });
  return out;
}
function differentStories(a, b) {
  const xa = actions(a), xb = actions(b);
  const clash = (p, q) => (xa.has(p) && xb.has(q) && !xa.has(q) && !xb.has(p));
  if (clash("sign", "release") || clash("release", "sign") || clash("out", "back") || clash("back", "out")) return true;
  const na = names(a), nb = names(b);
  if (na.size && nb.size && ![...na].some((w) => nb.has(w))) return true;
  return false;
}
function clusterNews(items) {
  const clusters = [];
  const sorted = items.slice().sort((x, y) => x.tier - y.tier || Date.parse(x.ts) - Date.parse(y.ts));
  for (const it of sorted) {
    const tk = tokens(it.title);
    let home = null;
    for (const c of clusters) {
      const sameTeams = (c.teams.length === 0 && it.teams.length === 0) || it.teams.some((a) => c.teams.includes(a));
      if (!sameTeams || Math.abs(Date.parse(c.ts) - Date.parse(it.ts)) > 36 * 3600000) continue;
      if (jaccard(c.tk, tk) >= 0.34 && !differentStories(c.title, it.title)) { home = c; break; }
    }
    if (home) { home.members.push(it); for (const a of it.teams) if (!home.teams.includes(a)) home.teams.push(a); }
    else clusters.push({ ...it, tk, teams: it.teams.slice(), members: [it] });
  }
  return clusters.map(({ tk, ...c }) => c);
}

module.exports = { hash, headlineSeverity, newsImportance, confidence, injuryWeight, clusterNews, differentStories, STATUS_W, POS_W, TIER_SCORE };
