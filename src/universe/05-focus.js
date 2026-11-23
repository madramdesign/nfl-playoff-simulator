// Focus: narrow the whole command center to one scope, the way a world dashboard narrows to a country. The scopes are
// the league (no focus), a conference, a division or one team; the choice lives in the URL (?focus=AFC, AFC-EAST, BUF).
// Everything here is pure and built from the engine's own team rows, so conferences and divisions cannot drift from them.
var DIV_ORDER = ["East", "North", "South", "West"];
var FOCUS = (function () {
  var confs = [], byId = dict();
  TEAMS.forEach(function (t, i) {
    var conf = byId[t.conf];
    if (!conf) { conf = byId[t.conf] = { id: t.conf, level: "conf", label: t.conf, conf: t.conf, div: null, team: null, teams: [], divs: [] }; confs.push(conf); }
    conf.teams.push(i);
    var did = String(t.div).toUpperCase().replace(/[^A-Z]+/g, "-"), dv = byId[did];
    if (!dv) {
      var short = String(t.div).replace(new RegExp("^" + t.conf + "\\s+"), "");
      dv = byId[did] = { id: did, level: "div", label: t.div, short: short, conf: t.conf, div: did, team: null, teams: [] };
      conf.divs.push(dv);
    }
    dv.teams.push(i);
    if (!byId[t.a]) byId[t.a] = { id: t.a, level: "team", label: t.name, short: t.a, conf: t.conf, div: did, team: i, teams: [i] };
  });
  var rank = function (d) { var k = DIV_ORDER.indexOf(d.short); return k < 0 ? 9 : k; };
  confs.sort(function (a, b) { return a.id < b.id ? -1 : 1; });
  confs.forEach(function (c) { c.divs.sort(function (a, b) { return rank(a) - rank(b); }); });
  return { confs: confs, byId: byId, ids: Object.keys(byId) };
})();
var LEAGUE_FOCUS = { id: null, level: "league", label: "NFL", conf: null, div: null, team: null, teams: null };
// The scope for a focus id; anything unknown (or empty) is the whole league.
function focusInfo(id) { return typeof id === "string" && FOCUS.byId[id] ? FOCUS.byId[id] : LEAGUE_FOCUS; }
// Team indexes in focus as a lookup, or null for the whole league.
function focusSet(id) {
  var f = focusInfo(id); if (!f.teams) return null;
  var m = dict(); f.teams.forEach(function (i) { m[i] = 1; }); return m;
}
// Items tagged with at least one team in focus. Items with no team (league-wide news) are left out while a focus is on.
function focusEvents(list, set) { return set ? (list || []).filter(function (e) { return (e.teams || []).some(function (t) { return set[t]; }) || (e.team != null && set[e.team]); }) : list || []; }
function focusGames(games, set) { return set ? (games || []).filter(function (g) { return set[g.away] || set[g.home]; }) : games || []; }
// The teams listed beside the map: the scope's own teams, or for one team its whole division so there is something to compare with.
function focusTeamList(id) {
  var f = focusInfo(id);
  if (f.level === "league") return TEAMS.map(function (t, i) { return i; });
  return (f.level === "team" ? FOCUS.byId[f.div] : f).teams.slice();
}
function focusPhrase(id) { var f = focusInfo(id); return f.level === "league" ? "" : " for " + (f.level === "team" ? "the " + TEAMS[f.team].nick : "the " + f.label); }
Object.assign(NFLU, { FOCUS: FOCUS, focusInfo: focusInfo, focusSet: focusSet, focusEvents: focusEvents, focusGames: focusGames, focusTeamList: focusTeamList, focusPhrase: focusPhrase });
