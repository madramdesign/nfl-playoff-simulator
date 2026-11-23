// Helmets on the geographic map: where each team plays today. On a game day both teams' helmets stand at the game's
// stadium (the visiting team in the home team's city, or at the neutral site), facing each other; a live game gets a
// pulse and its score. Teams not playing today stay at home, shown by their usual node.
// The helmet is this project's own drawing, filled with each team's colours from shared/teams.json. It is not a
// club's logo or helmet design: club marks are not openly licensed (docs/NFL_DATA_SOURCE_REGISTRY.md).

// A side-view helmet facing right, in a 24 x 20 box: shell, centre stripe, face mask, ear hole.
var HELMET = {
  w: 24, h: 20,
  shell: "M2 11C2 4.6 7 1 13 1c5.6 0 9 3.6 9 8v2h-6l-1.6 4v3H6c-2.4 0-4-2.4-4-5z",
  stripe: "M6.2 4.2C9 2.3 13.2 1.6 17.4 2.6",
  mask: "M16 11h7M15 14.2h8M23 8.8V17.4h-7.6",
  ear: [9.2, 12.2, 1.3]
};
// Pure: the two colours of a team's helmet. The stripe and mask use the team's second colour, or white when it has
// none or when it is too close to the shell colour to see.
function helmetColors(t) {
  var hex = /^#[0-9a-f]{6}$/i, shell = t && hex.test(t.color || "") ? t.color : "#8b95a7", trim = t && hex.test(t.alt || "") ? t.alt : "#ffffff";
  var lum = function (h) { return [1, 3, 5].reduce(function (s, k, j) { return s + [0.299, 0.587, 0.114][j] * parseInt(h.slice(k, k + 2), 16); }, 0) / 255; };
  if (Math.abs(lum(shell) - lum(trim)) < 0.12) trim = lum(shell) > 0.6 ? "#1b1f27" : "#ffffff";
  return { shell: shell, trim: trim };
}
// Pure: the games to show today. A game counts when it kicks off on the viewer's local calendar day of `now`, or is
// in progress (a late game running past midnight). Returns them in kickoff order.
function todaysGames(games, now) {
  var d = new Date(now), y = d.getFullYear(), m = d.getMonth(), day = d.getDate();
  return (games || []).filter(function (x) {
    if (!x || x.away == null || x.home == null) return false;
    if (x.state === "in") return true;
    var k = Date.parse(x.kickoff); if (!isFinite(k)) return false;
    var kd = new Date(k);
    return kd.getFullYear() === y && kd.getMonth() === m && kd.getDate() === day;
  }).sort(function (a, b) { return (Date.parse(a.kickoff) || 0) - (Date.parse(b.kickoff) || 0); });
}
// Pure: helmet scale for the map. detail: zoomed in; px: screen pixels per map unit.
var HELMET_MIN_PX = 18;
function helmetScale(detail, px) {
  var base = detail ? 1.15 : 0.95, p = px > 0 && isFinite(px) ? px : 1;
  return Math.min(2.4, Math.max(base, HELMET_MIN_PX / (HELMET.w * p)));
}
NFLU.helmetScale = helmetScale;
// One helmet, its bottom centre at (x, y); faceLeft mirrors it. scale: 1 is 24 x 20 map units.
function drawHelmet(parent, x, y, team, faceLeft, scale) {
  var t = TEAMS[team], col = helmetColors(t), s = scale || 1, sx = faceLeft ? -s : s;
  var g = svgEl("g", { class: "u-helm", transform: "translate(" + x.toFixed(1) + " " + (y - HELMET.h * s).toFixed(1) + ") scale(" + sx + " " + s + ") translate(" + (-HELMET.w / 2) + " 0)" });
  g.appendChild(svgEl("path", { d: HELMET.shell, class: "u-helm-shell", style: "fill:" + col.shell }));
  g.appendChild(svgEl("path", { d: HELMET.stripe, class: "u-helm-stripe", style: "stroke:" + col.trim }));
  g.appendChild(svgEl("path", { d: HELMET.mask, class: "u-helm-mask", style: "stroke:" + col.trim }));
  g.appendChild(svgEl("circle", { cx: HELMET.ear[0], cy: HELMET.ear[1], r: HELMET.ear[2], class: "u-helm-ear" }));
  parent.appendChild(g);
  return g;
}
function renderHelmets(c, g) {
  if (c.mode !== "geo") return;
  // at least 18 screen pixels wide, however small the map is drawn (phones), and never more than 2.4 times normal size
  var list = todaysGames(c.M ? c.M.games : [], c.now), s = helmetScale(c.detail, c.px);
  list.forEach(function (x) {
    var p = gameSitePos(c, x); if (!p) return;
    var live = x.state === "in" && isLiveGame(x), y = p[1] - c.r - 3, gap = 12.5 * s;
    var where = x.neutral ? (neutralSite(x) ? neutralSite(x).city : "a neutral site") : (TEAMS[x.home].stadium ? TEAMS[x.home].stadium.city : TEAMS[x.home].name);
    var state = live ? "live, " + x.awayScore + "–" + x.homeScore + (x.period ? ", Q" + x.period + " " + (x.clock || "") : "")
      : x.state === "in" ? "in progress (" + staleNote(x) + ")" : x.state === "post" ? "final, " + x.awayScore + "–" + x.homeScore
      : "kickoff " + new Date(Date.parse(x.kickoff)).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    var tip = TEAMS[x.away].name + " at " + TEAMS[x.home].name + " today in " + where + ": " + state + ". Click to open the game.";
    // the game's own link is its keyboard stop; the helmets are a picture of it for pointer users
    var gg = svgEl("g", { class: "u-helmets" + (live ? " is-live" : "") + (x.state === "post" ? " is-final" : "") + (c.dim(x.away) && c.dim(x.home) ? " is-dim" : "") + (c.sel.game === x.key ? " is-sel" : ""),
      "data-game": x.key, "data-tip": tip, "aria-hidden": "true" });
    if (live) gg.appendChild(svgEl("ellipse", { cx: p[0].toFixed(1), cy: (y - 9 * s).toFixed(1), rx: (gap + 14 * s).toFixed(1), ry: (13 * s).toFixed(1), class: "u-pulse u-helm-pulse" }));
    drawHelmet(gg, p[0] - gap, y, x.away, false, s);
    drawHelmet(gg, p[0] + gap, y, x.home, true, s);
    var lab = live || x.state === "post" ? teamAbbr(x.away) + " " + x.awayScore + "–" + x.homeScore + " " + teamAbbr(x.home) + (x.state === "post" ? " F" : "")
      : c.detail ? teamAbbr(x.away) + " at " + teamAbbr(x.home) : null;
    if (lab) gg.appendChild(svgEl("text", { x: p[0].toFixed(1), y: (y - 22 * s - 3).toFixed(1), "text-anchor": "middle", class: "u-helm-lab" + (live ? " is-live" : ""), text: lab }));
    g.appendChild(gg);
  });
}
// The helmet in the legend, in neutral colours.
function helmetIcon() {
  var svg = svgEl("svg", { viewBox: "0 0 26 20", width: "26", height: "20", class: "u-lsw-helm", "aria-hidden": "true" });
  drawHelmet(svg, 13, 20, null, false, 0.95);
  return svg;
}
NFLU.helmetColors = helmetColors;
NFLU.todaysGames = todaysGames;
