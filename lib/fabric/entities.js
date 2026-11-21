// Entity resolution: maps every provider's team identifiers onto the page's abbreviation, and finds team
// mentions in headlines. Source of truth: shared/teams.json.
"use strict";
const path = require("path");
const ENT = require(path.join(__dirname, "..", "..", "shared", "teams.json"));

const TEAMS = ENT.teams;
const ABBRS = TEAMS.map((t) => t.a);
const byKey = new Map();
for (const t of TEAMS) {
  for (const k of [t.a, t.nv, t.espnAbbr, t.fp, t.sleeper, "espn:" + t.espnId]) byKey.set(String(k).toUpperCase(), t);
}
for (const [k, v] of Object.entries({ JAC: "JAX", WSH: "WAS", LA: "LAR", OAK: "LV", SD: "LAC", STL: "LAR" })) byKey.set(k, byKey.get(v));

// Any provider abbreviation (or "espn:<id>") -> page abbreviation, or null.
function teamAbbr(key) { if (key == null) return null; const t = byKey.get(String(key).toUpperCase()); return t ? t.a : null; }
function teamByEspnId(id) { return teamAbbr("espn:" + id); }
function team(a) { return byKey.get(String(a).toUpperCase()) || null; }

// Headline matching: whole-word, case-sensitive on the alias's capitals, longest alias first so "New York Giants"
// wins over "Giants". Shared city names (New York, Los Angeles) are not aliases, by design.
const ALIASES = [];
for (const t of TEAMS) for (const al of t.aliases) ALIASES.push([al, t.a]);
ALIASES.sort((x, y) => y[0].length - x[0].length);
const RX = ALIASES.map(([al, a]) => [new RegExp("(^|[^A-Za-z0-9])" + al.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?=$|[^A-Za-z0-9])"), a]);
function teamsInText(text) {
  const found = [];
  if (!text) return found;
  for (const [rx, a] of RX) if (rx.test(text) && !found.includes(a)) found.push(a);
  return found;
}

// ESPN athlete id from an athlete object (links carry /id/<n>/) or a $ref URL.
function espnAthleteId(x) {
  if (!x) return null;
  if (typeof x === "string") { const m = x.match(/athletes\/(\d+)/) || x.match(/\/id\/(\d+)/); return m ? m[1] : null; }
  if (x.id && /^\d+$/.test(String(x.id)) && !x.links) return String(x.id);
  for (const l of x.links || []) { const m = (l.href || "").match(/\/id\/(\d+)/); if (m) return m[1]; }
  if (x.$ref) return espnAthleteId(x.$ref);
  return null;
}

module.exports = { TEAMS, ABBRS, ENT, teamAbbr, teamByEspnId, team, teamsInText, espnAthleteId };
