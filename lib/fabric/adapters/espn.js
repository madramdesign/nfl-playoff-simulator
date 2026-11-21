// Local-scope adapters for ESPN's public JSON (DEC-006: personal use on the owner's machine only; nothing from here is
// committed or published). Endpoints are unofficial and undocumented; every field read here is optional.
"use strict";
const { num } = require("../util");
const { teamAbbr, teamByEspnId, teamsInText, espnAthleteId } = require("../entities");

const BASE = "https://site.api.espn.com/apis/site/v2/sports/football/nfl";
const URLS = { scoreboard: BASE + "/scoreboard", news: BASE + "/news?limit=50", injuries: BASE + "/injuries", transactions: BASE + "/transactions", summary: (id) => BASE + "/summary?event=" + encodeURIComponent(id) };

const iso = (s) => { const t = Date.parse(s); return Number.isFinite(t) ? new Date(t).toISOString() : null; };
const odd = (s) => { if (s == null) return null; if (/^even$/i.test(String(s))) return 100; return num(String(s).replace(/^[ou+]/i, "")); };
const implied = (ml) => (ml < 0 ? -ml / (-ml + 100) : 100 / (ml + 100));
const noVig = (h, a) => (h != null && a != null ? Math.round((implied(h) / (implied(h) + implied(a))) * 1e4) / 1e4 : null);

function scoreboardOdds(o) {
  if (!o || !o.moneyline) return null;
  const g = (side, when, key) => { const x = side && side[when]; return x ? odd(x[key]) : null; };
  const ml = o.moneyline || {}, sp = o.pointSpread || {}, tot = o.total || {};
  const hm = { open: g(ml.home, "open", "odds"), current: g(ml.home, "close", "odds") }, am = { open: g(ml.away, "open", "odds"), current: g(ml.away, "close", "odds") };
  // provider is the sportsbook; that it arrived through ESPN is said by `source`
  return { source: "espn-scoreboard", provider: (o.provider && o.provider.name) || "Sportsbook",
    spread: { open: g(sp.home, "open", "line"), current: g(sp.home, "close", "line") }, total: { open: g(tot.over, "open", "line"), current: g(tot.over, "close", "line") },
    homeML: hm, awayML: am, homeProb: { open: noVig(hm.open, am.open), current: noVig(hm.current, am.current) } };
}

// Week's games keyed by ESPN event id, with live state. Teams resolve through shared/teams.json.
function normalizeScoreboard(json) {
  const games = [];
  for (const ev of json.events || []) {
    const c = (ev.competitions || [])[0]; if (!c) continue;
    const side = {}; for (const t of c.competitors || []) side[t.homeAway] = t;
    if (!side.home || !side.away) continue;
    const away = teamAbbr(side.away.team && side.away.team.abbreviation), home = teamAbbr(side.home.team && side.home.team.abbreviation);
    if (!away || !home) continue;
    const st = c.status || ev.status || {}, type = (st.type && st.type.state) || "pre", s = c.situation;
    let situation = null, winProb = null;
    if (type === "in" && s) {
      situation = { possession: s.possession ? teamByEspnId(s.possession) : null, down: num(s.down), distance: num(s.distance), yardLine: num(s.yardLine),
        text: s.downDistanceText || s.shortDownDistanceText || null, redZone: !!s.isRedZone, awayTimeouts: num(s.awayTimeouts), homeTimeouts: num(s.homeTimeouts) };
      const p = s.lastPlay && s.lastPlay.probability && num(s.lastPlay.probability.homeWinPercentage);
      if (p != null && p >= 0 && p <= 1) winProb = { home: p, source: "espn-scoreboard" };
    }
    const w = c.weather || ev.weather;
    games.push({ id: String(ev.id), kickoff: iso(ev.date), away, home, state: ["pre", "in", "post"].includes(type) ? type : "pre", period: num(st.period) || 0,
      clock: st.displayClock || "0:00", awayScore: num(side.away.score) || 0, homeScore: num(side.home.score) || 0, situation, winProb,
      venue: c.venue ? { name: c.venue.fullName || null, city: (c.venue.address && c.venue.address.city) || null, indoor: !!c.venue.indoor, neutral: !!c.neutralSite } : null,
      broadcast: (c.broadcasts || []).flatMap((b) => b.names || []).join(", ") || null, odds: scoreboardOdds((c.odds || [])[0]),
      espnWeather: w ? { summary: w.displayValue || null, tempF: num(w.temperature) } : null, source: "espn-scoreboard" });
  }
  return { week: json.week && num(json.week.number), games };
}

function normalizeNews(json) {
  return (json.articles || []).map((a) => {
    const url = a.links && a.links.web && a.links.web.href; if (!a.headline || !url || !/^https:\/\//.test(url)) return null;
    const tagged = (a.categories || []).filter((c) => c.type === "team" && c.teamId != null).map((c) => teamByEspnId(c.teamId)).filter(Boolean);
    const teams = [...new Set(tagged.concat(teamsInText(a.headline)))];
    return { title: a.headline, url, ts: iso(a.published), publisher: "ESPN", source: "espn-news", tier: 2, teams };
  }).filter(Boolean);
}

const ESPN_STATUS = { "Out": "Out", "Doubtful": "Doubtful", "Questionable": "Questionable", "Injured Reserve": "Injured Reserve", "Suspension": "Suspended", "Suspended": "Suspended",
  "Physically Unable to Perform": "Physically Unable to Perform", "PUP": "Physically Unable to Perform", "Day-To-Day": "Day-To-Day" };
function normalizeInjuries(json) {
  const teams = {};
  for (const t of json.injuries || []) {
    const a = teamByEspnId(t.id); if (!a) continue;
    for (const x of t.injuries || []) {
      if (!x.status || x.status === "Active") continue;
      const ath = x.athlete || {}, d = x.details || {};
      (teams[a] = teams[a] || []).push({ name: ath.displayName || "Unknown", pos: (ath.position && ath.position.abbreviation) || null, status: ESPN_STATUS[x.status] || "Other",
        type: d.type || null, practice: null, returnDate: d.returnDate || null, date: iso(x.date), espnId: espnAthleteId(ath), starter: null, source: "espn-injuries" });
    }
  }
  return { teams };
}

const KINDS = [["traded", /\btrad(ed|e)\b/i], ["placed_ir", /injured reserve/i], ["activated", /\bactivated\b/i], ["claimed", /\bclaimed\b/i], ["waived", /\bwaived\b/i],
  ["released", /\breleased\b/i], ["promoted", /\bpromoted|elevated\b/i], ["signed", /\bsigned|re-signed\b/i]];
function normalizeTransactions(json) {
  return (json.transactions || []).map((t) => {
    const a = t.team && teamByEspnId(t.team.id); const date = iso(t.date); if (!a || !date || !t.description) return null;
    const k = KINDS.find(([, rx]) => rx.test(t.description));
    return { date, team: a, text: t.description, kind: k ? k[0] : "other", source: "espn-transactions" };
  }).filter(Boolean);
}

// One game's detail for /api/game/<id> (lib/contract.js validateGameDetail).
function normalizeSummary(json, id, now = Date.now()) {
  const comp = json.header && json.header.competitions && json.header.competitions[0];
  if (!comp) throw new Error("summary has no header");
  const side = {}; for (const t of comp.competitors || []) side[t.homeAway] = t;
  const ab = (t) => teamAbbr(t && t.team && t.team.abbreviation);
  const st = comp.status || {};
  const plays = [];
  const drives = (json.drives && json.drives.previous) || [];
  for (const d of drives.concat(json.drives && json.drives.current ? [json.drives.current] : [])) for (const p of d.plays || []) plays.push(p);
  return { v: 1, id: String(id), generatedAt: new Date(now).toISOString(), source: "espn-summary", scope: "local",
    header: { away: ab(side.away), home: ab(side.home), state: (st.type && st.type.state) || "pre", period: num(st.period) || 0, clock: st.displayClock || "0:00",
      awayScore: num(side.away && side.away.score) || 0, homeScore: num(side.home && side.home.score) || 0 },
    winProb: (json.winprobability || []).map((w, k) => ({ play: k + 1, home: num(w.homeWinPercentage) })).filter((w) => w.home != null && w.home >= 0 && w.home <= 1),
    scoring: (json.scoringPlays || []).map((s) => ({ period: num(s.period && s.period.number) || 0, clock: (s.clock && s.clock.displayValue) || "", team: teamAbbr(s.team && s.team.abbreviation),
      text: s.text || "", awayScore: num(s.awayScore), homeScore: num(s.homeScore) })),
    plays: plays.slice(-40).map((p) => ({ period: num(p.period && p.period.number) || 0, clock: (p.clock && p.clock.displayValue) || "", team: null, text: p.text || "", type: (p.type && p.type.text) || null })),
    injuries: (json.injuries || []).flatMap((t) => (t.injuries || []).map((x) => ({ team: teamAbbr(t.team && t.team.abbreviation), name: (x.athlete && x.athlete.displayName) || "", pos: (x.athlete && x.athlete.position && x.athlete.position.abbreviation) || null, status: x.status || null }))) };
}

module.exports = { URLS, normalizeScoreboard, normalizeNews, normalizeInjuries, normalizeTransactions, normalizeSummary };
