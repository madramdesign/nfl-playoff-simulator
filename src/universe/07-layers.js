// Declarative map layers. Each: {id, label, group, defaultOn, modes, sourceIds, legend, render(ctx, g)}.
// Registry order is drawing order (first is lowest). Groups only affect the toggle list. sourceIds drive the freshness
// note shown beside a layer; an empty list means the layer is computed from the model data built into the page.
var LAYER_GROUPS = ["Teams", "Games", "Intelligence", "Model"];
var LINK_MODES = ["geo", "div"], ALL_MODES = ["geo", "div", "intel"];
var LAYERS = [
  { id: "divisions", label: "Divisions", group: "Teams", defaultOn: true, modes: LINK_MODES, sourceIds: [], render: renderDivisions },
  { id: "rivalries", label: "Rivalries and division games left", group: "Games", defaultOn: false, modes: LINK_MODES, sourceIds: [], render: renderRivalries },
  { id: "final", label: "Final games", group: "Games", defaultOn: true, modes: LINK_MODES, sourceIds: ["espn-scoreboard", "nflverse-games"], render: function (c, g) { renderGameLinks(c, g, "post"); } },
  { id: "upcoming", label: "Upcoming games", group: "Games", defaultOn: true, modes: LINK_MODES, sourceIds: ["espn-scoreboard", "nflverse-games"], render: function (c, g) { renderGameLinks(c, g, "pre"); } },
  { id: "live", label: "Live games", group: "Games", defaultOn: true, modes: LINK_MODES, sourceIds: ["espn-scoreboard"], render: function (c, g) { renderGameLinks(c, g, "in"); } },
  { id: "odds", label: "Line movement", group: "Games", defaultOn: false, modes: LINK_MODES, sourceIds: ["espn-scoreboard", "nflverse-games"], render: renderOdds },
  { id: "disagree", label: "Model disagreement", group: "Model", defaultOn: false, modes: LINK_MODES, sourceIds: [], render: renderDisagree },
  { id: "weather", label: "Weather flags", group: "Games", defaultOn: true, modes: LINK_MODES, sourceIds: ["open-meteo", "nws"], render: renderWeather },
  { id: "playoff", label: "Playoff odds (ring)", group: "Model", defaultOn: true, modes: ["geo", "div"], sourceIds: [], render: renderPlayoffRing },
  { id: "teams", label: "Teams (colored by power)", group: "Teams", defaultOn: true, modes: ALL_MODES, sourceIds: [], render: renderTeams },
  { id: "superbowl", label: "Super Bowl odds", group: "Model", defaultOn: false, modes: ALL_MODES, sourceIds: [], render: renderSuperBowl },
  { id: "momentum", label: "Momentum (week over week)", group: "Model", defaultOn: false, modes: ALL_MODES, sourceIds: [], render: renderMomentum },
  { id: "injuries", label: "Injuries (burden)", group: "Intelligence", defaultOn: true, modes: ALL_MODES, sourceIds: ["espn-injuries", "nflverse-injuries"], render: renderInjuries },
  { id: "transactions", label: "Transactions", group: "Intelligence", defaultOn: false, modes: ALL_MODES, sourceIds: ["espn-transactions"], render: function (c, g) { renderCounts(c, g, ["transaction"], "tx", 3); } },
  { id: "news", label: "News", group: "Intelligence", defaultOn: true, modes: ALL_MODES, sourceIds: ["rss-*", "espn-news", "curated-news"], render: function (c, g) { renderCounts(c, g, ["news", "qb_change"], "news", 1); } },
  { id: "qb", label: "Quarterback status", group: "Intelligence", defaultOn: true, modes: ALL_MODES, sourceIds: [], render: renderQB },
  { id: "video", label: "Video", group: "Intelligence", defaultOn: false, modes: ALL_MODES, sourceIds: ["youtube-official"], render: renderVideoCounts },
  { id: "breaking", label: "Breaking (pulse)", group: "Intelligence", defaultOn: true, modes: ALL_MODES, sourceIds: ["rss-*", "espn-*", "curated-news", "nflverse-*"], render: renderBreaking }
];
var LAYER_IDS = LAYERS.map(function (l) { return l.id; });
var DEFAULT_LAYERS = LAYERS.filter(function (l) { return l.defaultOn; }).map(function (l) { return l.id; });
function layerById(id) { for (var i = 0; i < LAYERS.length; i++) if (LAYERS[i].id === id) return LAYERS[i]; return null; }
// Pure: problems with the registry (empty when it is sound). Checked by test/universe.test.js.
function validateLayerRegistry(layers, defaults) {
  var errs = [], seen = {};
  layers.forEach(function (l, k) {
    if (!l.id || !LAYER_ID_RE.test(l.id)) errs.push("layer " + k + ": bad id " + l.id);
    if (seen[l.id]) errs.push("duplicate layer id " + l.id); seen[l.id] = 1;
    if (LAYER_GROUPS.indexOf(l.group) < 0) errs.push(l.id + ": unknown group " + l.group);
    if (!Array.isArray(l.modes) || !l.modes.length || l.modes.some(function (m) { return MAP_MODES.indexOf(m) < 0; })) errs.push(l.id + ": bad modes");
    if (!Array.isArray(l.sourceIds)) errs.push(l.id + ": sourceIds must be a list");
    if (typeof l.render !== "function") errs.push(l.id + ": no render function");
    if (typeof l.label !== "string" || !l.label) errs.push(l.id + ": no label");
  });
  (defaults || []).forEach(function (id) { if (!seen[id]) errs.push("default layer " + id + " does not exist"); });
  return errs;
}

// ---- render functions (ctx from drawMap in 08-map.js) ----
function renderDivisions(c, g) {
  if (c.mode === "div") {
    // the blocks themselves are the layout (drawn in the base); this layer adds each block's conference edge
    for (var d = 0; d < 8; d++) { var b = DIV_BLOCKS[d]; g.appendChild(svgEl("rect", { x: b.x, y: b.y + 8, width: 3, height: b.h - 16, rx: 1.5, class: "u-divedge u-conf" + (d < 4 ? 0 : 1) })); }
    return;
  }
  for (var dv = 0; dv < 8; dv++) {
    var ts = DIVT[dv], pts = ts.map(function (t) { return c.pos[t]; }), cx = 0, cy = 0;
    pts.forEach(function (p) { cx += p[0]; cy += p[1]; }); cx /= pts.length; cy /= pts.length;
    var ord = pts.slice().sort(function (a, b) { return Math.atan2(a[1] - cy, a[0] - cx) - Math.atan2(b[1] - cy, b[0] - cx); });
    g.appendChild(svgEl("polygon", { points: ord.map(function (p) { return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" "), class: "u-divpoly u-conf" + TM[ts[0]].c }));
    if (!c.detail) g.appendChild(svgEl("text", { x: cx.toFixed(1), y: (cy + 4).toFixed(1), class: "u-divname u-conf" + TM[ts[0]].c, "text-anchor": "middle", text: TM[ts[0]].dn.toUpperCase() }));
  }
}
function renderRivalries(c, g) {
  var pairs = {};
  GAMES.forEach(function (x) { if (TM[x[2]].d !== TM[x[3]].d) return; var k = Math.min(x[2], x[3]) + "-" + Math.max(x[2], x[3]); pairs[k] = (pairs[k] || 0) + 1; });
  Object.keys(pairs).forEach(function (k) {
    var ab = k.split("-").map(Number), p = c.pos[ab[0]], q = c.pos[ab[1]];
    var ln = svgEl("line", { x1: p[0], y1: p[1], x2: q[0], y2: q[1], class: "u-divgame", "data-tip": TEAMS[ab[0]].nick + " and " + TEAMS[ab[1]].nick + ": " + pairs[k] + " division game" + (pairs[k] > 1 ? "s" : "") + " left" });
    g.appendChild(ln);
  });
  ((UT && UT.rivalries) || []).forEach(function (rv) {
    var a = TIDX[rv.a], b = TIDX[rv.b]; if (a == null || b == null) return;
    var p = c.pos[a], q = c.pos[b];
    g.appendChild(svgEl("path", { d: arcPath(p, q, 0.22), class: "u-rival", "data-tip": rv.a + "–" + rv.b + ": " + rv.why }));
  });
}
function gameVisible(c, x) {
  if (x.state === "post") return filterByTime([{ ts: x.kickoff ? Date.parse(x.kickoff) : NaN }], c.range, c.now).length > 0 || (!x.kickoff && c.range === "season");
  return true;
}
function renderGameLinks(c, g, state) {
  (c.M ? c.M.games : []).forEach(function (x) {
    if (x.state !== state || x.away == null || x.home == null || !gameVisible(c, x)) return;
    var live = state === "in" && isLiveGame(x);
    var cls = "u-link u-link-" + state + (state === "in" && !live ? " u-link-stale" : "") + (c.sel.game && c.sel.game === x.key ? " is-sel" : "") + (c.dim(x.away) && c.dim(x.home) ? " is-dim" : "");
    var mid = drawGameLink(c, g, x, cls);
    if (!mid) return;
    var lab = null, hp;
    if (state === "in" && x.awayScore != null) lab = teamAbbr(x.away) + " " + x.awayScore + "–" + x.homeScore + " " + teamAbbr(x.home) + (live ? "" : " (" + staleNote(x) + ")");
    else if (state === "post" && c.mode === "geo" && c.detail && x.awayScore != null) lab = x.awayScore + "–" + x.homeScore;
    else if (state === "pre" && c.mode === "geo" && c.detail && (hp = gameHomeProb(x)) != null) lab = teamAbbr(x.home) + " " + fmtPct(hp);
    if (lab) g.appendChild(svgEl("text", { x: mid[0], y: mid[1] - 5, class: "u-linklabel u-ll-" + state + (state === "in" && !live ? " u-ll-stale" : ""), "text-anchor": "middle", text: lab }));
  });
}
function renderOdds(c, g) {
  (c.M ? c.M.games : []).forEach(function (x) {
    var mv = gameLineMove(x);
    if (!mv || Math.abs(mv.size) < 0.005) return;
    var mid = linkMid(c, x); if (!mid) return;
    g.appendChild(svgEl("text", { x: mid[0], y: mid[1] + 12, class: "u-oddsmove", "text-anchor": "middle",
      "data-tip": teamAbbr(x.away) + " at " + teamAbbr(x.home) + ": " + mv.text, text: mv.label }));
  });
}
function renderDisagree(c, g) {
  disagreementGames().forEach(function (d) {
    var G = GAMES[d.gi], p = c.pos[G[2]], q = c.pos[G[3]];
    var tip = TEAMS[G[2]].a + " at " + TEAMS[G[3]].a + ", week " + G[1] + ": ratings " + fmtPct(d.ratings) + " for the home team, market " + fmtPct(d.market);
    g.appendChild(svgEl("path", { d: arcPath(p, q, -0.12), class: "u-disagree", "data-tip": tip + ". Enter opens the game.", "data-gi": d.gi, tabindex: "0", role: "button", "aria-label": tip }));
    var m = arcMid(p, q, -0.12);
    if (c.detail || c.mode === "div") g.appendChild(svgEl("text", { x: m[0], y: m[1] - 4, class: "u-disagree-lab", "text-anchor": "middle", text: "≠" + Math.round(Math.abs(d.diff) * 100) }));
  });
}
function renderWeather(c, g) {
  (c.M ? c.M.games : []).forEach(function (x) {
    var w = x.weather; if (!w || !w.flags || !w.flags.length || x.state === "post") return;
    var p = gameSitePos(c, x); if (!p) return;
    var tip = teamAbbr(x.away) + " at " + teamAbbr(x.home) + ": " + weatherText(w) + ". Weather: " + sourceLabel(w.source) + ". A description, not part of the forecast.";
    var gx = svgEl("g", { class: "u-wx", transform: "translate(" + (p[0] - 16).toFixed(1) + "," + (p[1] + 10).toFixed(1) + ")", "data-tip": tip });
    if (c.detail || c.mode === "div") { var t = w.flags.join(" ").toUpperCase(); gx.appendChild(svgEl("rect", { x: -2, y: -9, width: t.length * 5.6 + 6, height: 12, rx: 3, class: "u-wxbox" })); gx.appendChild(svgEl("text", { x: 1, y: 0, class: "u-wxtext", text: t })); }
    else gx.appendChild(svgEl("path", { d: "M0 -5 L5 0 L0 5 L-5 0 Z", class: "u-wxdot" }));
    g.appendChild(gx);
  });
}
function renderPlayoffRing(c, g) {
  if (!c.po) return;
  TEAMS.forEach(function (t, i) {
    var p = c.pos[i], r = c.r + 3.5, C = 2 * Math.PI * r, v = c.po[i];
    g.appendChild(svgEl("circle", { cx: p[0], cy: p[1], r: r, class: "u-ringtrack" + (c.dim(i) ? " is-dim" : "") }));
    if (v > 0.004) g.appendChild(svgEl("circle", { cx: p[0], cy: p[1], r: r, class: "u-ring" + (c.dim(i) ? " is-dim" : ""), "stroke-dasharray": (C * v).toFixed(2) + " " + C.toFixed(2), transform: "rotate(-90 " + p[0].toFixed(1) + " " + p[1].toFixed(1) + ")" }));
  });
}
// Pure: where each team's label goes so that labels do not sit on each other or on a neighbor's dot (the Northeast is
// crowded). pts: [x, y] per team; r: dot radius; names: label text per team; skip(i): teams with no label; pad: room
// kept around every dot for its count badges, which sit in a ring just outside it.
// Each label tries eight spots around its dot, right first, and takes the one that overlaps the least.
function placeLabels(pts, r, names, skip, pad) {
  r += pad || 0;
  var H = 10, placed = [], out = [];
  var dots = pts.map(function (p, i) { return p && !(skip && skip(i)) ? [p[0] - r, p[1] - r, p[0] + r, p[1] + r] : null; });
  var hit = function (a, b) { return Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1])); };
  pts.forEach(function (p, i) {
    if (!p || (skip && skip(i))) { out[i] = null; return; }
    var w = 6.4 * String(names[i]).length, g = r + 3, d = r * 0.75 + 2;
    // [text x, baseline y, anchor, box left]
    var cands = [[p[0] + g, p[1] + 4, "start", p[0] + g], [p[0] - g, p[1] + 4, "end", p[0] - g - w], [p[0], p[1] - g - 1, "middle", p[0] - w / 2], [p[0], p[1] + g + H - 1, "middle", p[0] - w / 2],
      [p[0] + d, p[1] - d, "start", p[0] + d], [p[0] + d, p[1] + d + H - 2, "start", p[0] + d], [p[0] - d, p[1] - d, "end", p[0] - d - w], [p[0] - d, p[1] + d + H - 2, "end", p[0] - d - w]];
    var best = null, bestCost = Infinity, bestBox = null;
    for (var k = 0; k < cands.length && bestCost > 0; k++) {
      var c = cands[k], box = [c[3], c[1] - H + 1, c[3] + w, c[1] + 2], cost = 0;
      placed.forEach(function (b) { cost += hit(box, b); });
      dots.forEach(function (b, j) { if (b && j !== i) cost += hit(box, b); });
      if (cost < bestCost) { best = c; bestCost = cost; bestBox = box; }
    }
    placed.push(bestBox);
    out[i] = { x: best[0], y: best[1], anchor: best[2], box: bestBox, overlap: bestCost };
  });
  return out;
}
NFLU.placeLabels = placeLabels;
var LABEL_PAD = 10;   // the badge ring: 5 out from the dot plus a badge radius
function renderTeams(c, g) {
  var showLabs = (c.mode !== "geo" || c.detail) && c.mode !== "div";
  var labs = showLabs ? placeLabels(c.pos, c.r, TEAMS.map(function (t) { return t.a; }), null, LABEL_PAD) : [];
  TEAMS.forEach(function (t, i) {
    var p = c.pos[i], pw = teamPower(i), fill = c.mode === "intel" ? momentumColor(momentumOf(i)) : powerColor(pw);
    var po = c.po ? fmtPct(c.po[i]) : "simulating";
    var label = t.name + ": power " + fmtSigned(pw) + " points, playoff chance " + po + (c.mode === "intel" ? ", momentum " + (momentumOf(i) == null ? "n/a" : fmtSigned(momentumOf(i) * 100, 0) + " points") : "");
    var node = svgEl("g", { class: "u-node" + (c.sel.team === i ? " is-sel" : "") + (c.dim(i) ? " is-dim" : ""), tabindex: "0", role: "button", "aria-label": label, "data-team": i, "data-tip": label });
    node.appendChild(svgEl("circle", { cx: p[0], cy: p[1], r: c.r, class: "u-dot", style: "fill:" + fill }));
    if (labs[i]) node.appendChild(svgEl("text", { x: labs[i].x, y: labs[i].y, "text-anchor": labs[i].anchor, class: "u-nodelab", text: t.a }));
    g.appendChild(node);
  });
}
function renderSuperBowl(c, g) {
  if (!c.r0) return;
  TEAMS.forEach(function (t, i) {
    var v = c.r0.wSB[i] / c.r0.n; if (v < 0.005) return;
    var p = c.pos[i], s = 2.5 + Math.sqrt(v) * 14;
    g.appendChild(svgEl("path", { d: "M" + p[0] + " " + (p[1] - c.r - 6 - s) + "l" + s * 0.6 + " " + s + "l" + -s * 1.2 + " 0z", class: "u-sb" + (c.dim(i) ? " is-dim" : ""), "data-tip": t.name + ": wins the Super Bowl in " + fmtPct(v) + " of simulated seasons" }));
    if (c.detail || c.mode !== "geo") g.appendChild(svgEl("text", { x: p[0] + s * 0.7 + 2, y: p[1] - c.r - 7, class: "u-sblab", text: fmtPct(v) }));
  });
}
function renderMomentum(c, g) {
  TEAMS.forEach(function (t, i) {
    var m = momentumOf(i); if (m == null || Math.abs(m) < 0.02) return;
    var p = c.pos[i], s = 3 + Math.min(6, Math.abs(m) * 30), x = p[0] - c.r - 7, y = p[1];
    var d = m > 0 ? "M" + x + " " + (y - s) + "l" + s * 0.8 + " " + s * 1.4 + "l" + -s * 1.6 + " 0z" : "M" + x + " " + (y + s) + "l" + s * 0.8 + " " + -s * 1.4 + "l" + -s * 1.6 + " 0z";
    g.appendChild(svgEl("path", { d: d, class: "u-mom " + (m > 0 ? "is-up" : "is-dn"), "data-tip": t.name + ": playoff chance " + fmtSigned(m * 100, 0) + " points in week " + D.history.weeks[D.history.weeks.length - 1] }));
  });
}
function renderInjuries(c, g) {
  var inj = c.M ? c.M.injuries : {};
  for (var k in inj) {
    var t = inj[k], i = +k; if (!t || typeof t.burden !== "number" || t.burden <= 0) continue;
    var rad = Math.min(9, 3 + Math.sqrt(t.burden) * 2.6);
    badgeAt(c, g, i, "ne", "u-b-inj", c.detail || c.mode !== "geo" ? String(t.out + (t.ir || 0)) : null, TEAMS[i].name + ": injury burden " + t.burden.toFixed(2) + " (" + (t.out || 0) + " out, " + (t.doubtful || 0) + " doubtful, " + (t.questionable || 0) + " questionable, " + (t.ir || 0) + " IR). Descriptive index, not part of the forecast.", rad);
  }
}
function renderCounts(c, g, types, cls, slot) {
  var n = {};
  c.events.forEach(function (e) { if (types.indexOf(e.type) < 0) return; e.teams.forEach(function (t) { n[t] = (n[t] || 0) + 1; }); });
  for (var k in n) badgeAt(c, g, +k, ["e", "se", "sw"][slot - 1] || "e", "u-b-" + cls, c.detail || c.mode !== "geo" ? String(n[k]) : null, TEAMS[+k].name + ": " + n[k] + " " + (cls === "tx" ? "transaction" : "news item") + (n[k] > 1 ? "s" : "") + " " + (c.phrase || RANGE_PHRASE[c.range]));   // c.phrase: [S-C time machine]
}
function renderQB(c, g) {
  TEAMS.forEach(function (t, i) {
    var q = qbStatusOf(i, c.M); if (!q || q.level < 2) return;
    badgeAt(c, g, i, "nw", "u-b-qb u-qb" + q.level, c.detail || c.mode !== "geo" ? "QB" : null, t.name + " quarterback: " + q.reasons.map(function (r) { return r.text; }).join(" "));
  });
}
function renderBreaking(c, g) {
  var hit = {};
  c.events.forEach(function (e) { if (e.importance != null && e.importance >= BREAKING_MIN) e.teams.forEach(function (t) { if (!hit[t] || e.importance > hit[t].importance) hit[t] = e; }); });
  for (var k in hit) { var p = c.pos[+k]; g.appendChild(svgEl("circle", { cx: p[0], cy: p[1], r: c.r + 8, class: "u-pulse", "data-tip": "Breaking: " + hit[k].title + " (" + hit[k].publisher + ")" })); }
}
Object.assign(NFLU, { LAYERS: LAYERS, LAYER_IDS: LAYER_IDS, DEFAULT_LAYERS: DEFAULT_LAYERS, validateLayerRegistry: validateLayerRegistry, LAYER_GROUPS: LAYER_GROUPS });
