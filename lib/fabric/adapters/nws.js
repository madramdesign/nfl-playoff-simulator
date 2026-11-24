// National Weather Service active alerts at outdoor stadiums (backlog F29; checked Nov. 24, 2026). Public-domain US
// government data: free for any purpose, provided it is not passed off as our own, not presented as an NWS
// endorsement, and not altered and shown as official. Requests need a User-Agent (a generic one is accepted; no
// contact details are sent). Only the US is covered: a neutral site abroad answers with an error and is skipped.
// Only warnings that can matter to a game are kept (wind, snow and ice, cold, heat, storms, fog).
"use strict";

const BASE = "https://api.weather.gov";
const UA = "nfl-universe-fan-project";
const alertsUrl = (lat, lon) => BASE + "/alerts/active?point=" + lat.toFixed(4) + "," + lon.toFixed(4);
// Event names (NWS's own wording) that can affect a game. Floods, air quality and marine alerts are left out.
const RELEVANT = /\b(Wind|Blizzard|Winter|Ice|Snow|Freez|Frost|Cold|Chill|Heat|Thunderstorm|Tornado|Hurricane|Tropical|Dense Fog|Dust)\b/i;
const SEVERITY = ["Extreme", "Severe", "Moderate", "Minor", "Unknown"];
const iso = (v) => { const t = Date.parse(v); return Number.isFinite(t) ? new Date(t).toISOString() : null; };   // NWS times carry a local offset

// One stadium's active alerts, kept to the relevant ones: [{id, event, severity, certainty, urgency, sent, onset, ends,
// expires, headline, area, sender}], all times in UTC. Throws on a response that is not a feature collection.
function normalizeAlerts(json) {
  if (!json || typeof json !== "object" || !Array.isArray(json.features)) throw new Error("nws: not a feature collection");
  const out = [], seen = new Set();
  for (const f of json.features) {
    const p = f && f.properties; if (!p || typeof p.event !== "string" || !RELEVANT.test(p.event)) continue;
    if (p.status && p.status !== "Actual") continue;   // drop exercises, tests and drafts
    const id = typeof p.id === "string" ? p.id : typeof f.id === "string" ? f.id : null; if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push({ id, event: p.event, severity: SEVERITY.includes(p.severity) ? p.severity : "Unknown", certainty: p.certainty || null, urgency: p.urgency || null,
      sent: iso(p.sent), onset: iso(p.onset || p.effective), ends: iso(p.ends || p.expires), expires: iso(p.expires),
      headline: typeof p.headline === "string" ? p.headline.slice(0, 300) : null, area: typeof p.areaDesc === "string" ? p.areaDesc.slice(0, 200) : null,
      sender: typeof p.senderName === "string" ? p.senderName : "National Weather Service" });
  }
  return out;
}
// Whether an alert overlaps a game: in force at some point from three hours before kickoff to four hours after it.
function overlapsGame(a, kickoffIso) {
  const k = Date.parse(kickoffIso); if (!Number.isFinite(k)) return false;
  const from = Date.parse(a.onset || a.sent), to = Date.parse(a.ends || a.expires);
  return (!Number.isFinite(from) || from <= k + 4 * 3600000) && (!Number.isFinite(to) || to >= k - 3 * 3600000);
}
// A page a person can read about the forecast at that point (NWS's own forecast page; the API links are JSON).
const pageFor = (lat, lon) => "https://forecast.weather.gov/MapClick.php?lat=" + lat.toFixed(4) + "&lon=" + lon.toFixed(4);

module.exports = { BASE, UA, alertsUrl, normalizeAlerts, overlapsGame, pageFor, RELEVANT };
