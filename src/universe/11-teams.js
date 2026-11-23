// Teams panel (all 32, sortable by playoff chance) and the Team Intelligence Center drawer (?team=NYG).
var teamsPanel = null, TODAY_SEEDS = null;
function seedToday(i) {
  if (!TODAY_SEEDS) { try { TODAY_SEEDS = seedsToday(); } catch (e) { TODAY_SEEDS = [[], []]; } }
  var k = TODAY_SEEDS[TM[i].c] ? TODAY_SEEDS[TM[i].c].indexOf(i) : -1;
  return k >= 0 ? k + 1 : null;
}
function simPo(r, i) { return r ? r.po[i] / r.n : null; }
function buildTeamsPanel(host) {
  teamsPanel = Panel({ id: "teams", title: "Teams", sources: [] });
  teamsPanel.loading("Simulating…");
  host.appendChild(teamsPanel.root);
  teamsPanel.body.addEventListener("click", function (e) { var t = e.target.closest ? e.target.closest("[data-team]") : null; if (t) openTeam(+t.getAttribute("data-team")); });
}
function renderTeamsPanel() {
  if (!teamsPanel) return;
  var st = store.get(), r = st.sim && st.sim.r, q = (st.search || "").trim().toLowerCase(), tm = q ? searchTeams(q) : null;
  var fi = focusInfo(st.focus), ids = focusTeamList(st.focus).filter(function (i) { return !tm || tm[i]; });
  teamsPanel.setTitle("Teams" + (fi.level === "league" ? "" : " · " + (fi.level === "team" ? FOCUS.byId[fi.div].label : fi.label)));
  if (!ids.length) { teamsPanel.empty("No team matches “" + q + "”" + focusPhrase(st.focus) + "."); return; }
  ids.sort(function (a, b) { return r ? r.po[b] - r.po[a] || teamPower(b) - teamPower(a) : teamPower(b) - teamPower(a); });
  teamsPanel.render(function (body) {
    var tb = el("tbody");
    ids.forEach(function (i) {
      var t = TEAMS[i], qb = qbStatusOf(i, st.model);
      tb.appendChild(el("tr", { class: (st.team === t.a ? "is-sel" : "") + (fi.team === i ? " is-focus" : "") }, [
        el("td", {}, [el("button", { type: "button", class: "u-tlink", "data-team": i, text: t.a }), el("span", { class: "u-tname", text: " " + t.nick }), qb && qb.level >= 3 ? el("span", { class: "u-qbflag", title: qb.reasons[0].text, text: "QB" }) : null]),
        el("td", { text: recStr(recordOf(i, st.model)) }),
        el("td", { text: fmtSigned(teamPower(i)) }),
        el("td", { class: "u-num", text: r ? fmtPct(simPo(r, i)) : "…" }),
        el("td", { class: "u-num", text: r ? fmtPct(r.wSB[i] / r.n) : "…" })]));
    });
    body.appendChild(el("table", { class: "u-table" }, [el("thead", {}, el("tr", {}, [el("th", { text: "Team" }), el("th", { text: "Record", title: "Finished games, including this week's finals from the feed" }), el("th", { text: "Power", title: "Points per game vs an average team: blend of the spread-based and results ratings" }), el("th", { text: "Playoffs" }), el("th", { text: "Win SB" })])), tb]));
    body.appendChild(el("p", { class: "u-note", text: r ? "Playoff and Super Bowl chances from " + r.n.toLocaleString() + " simulated seasons (" + MODE_NAMES[st.sim.mode] + ")" + (st.sim.finals ? ", with " + st.sim.finals + " final" + (st.sim.finals > 1 ? "s" : "") + " from the feed counted" : "") + (st.sim.ties ? "; tied finals are simulated" : "") + "." : "Simulating…" }));
  });
}

// ---- Team Intelligence Center ----
function sparkline(points, label) {
  var W = 320, H = 110, ml = 34, mr = 12, mt = 10, mb = 22;
  var svg = svgEl("svg", { viewBox: "0 0 " + W + " " + H, class: "u-spark", role: "img", "aria-label": label });
  var X = function (k) { return points.length > 1 ? ml + (W - ml - mr) * k / (points.length - 1) : W - mr; }, Y = function (v) { return mt + (H - mt - mb) * (1 - v); };
  [0, 0.5, 1].forEach(function (v) { svg.appendChild(svgEl("line", { x1: ml, x2: W - mr, y1: Y(v), y2: Y(v), class: "u-grid" })); svg.appendChild(svgEl("text", { x: ml - 5, y: Y(v) + 4, "text-anchor": "end", class: "u-tick", text: Math.round(v * 100) + "%" })); });
  if (points.length > 1) svg.appendChild(svgEl("polyline", { points: points.map(function (p, k) { return X(k).toFixed(1) + "," + Y(p[1]).toFixed(1); }).join(" "), class: "u-sparkline" }));
  points.forEach(function (p, k) {
    var lastP = k === points.length - 1;
    svg.appendChild(svgEl("circle", { cx: X(k), cy: Y(p[1]), r: lastP ? 4.5 : 3, class: lastP ? "u-sparknow" : "u-sparkdot" }, [svgEl("title", { text: p[0] + ": " + fmtPct(p[1]) })]));
    if (k === 0 || lastP || points.length <= 8) svg.appendChild(svgEl("text", { x: X(k), y: H - 6, "text-anchor": lastP ? "end" : k === 0 ? "start" : "middle", class: "u-tick", text: p[0] }));
  });
  return svg;
}
function bars(rows) {
  var mx = 0; rows.forEach(function (r) { mx = Math.max(mx, r[1]); });
  return el("div", { class: "u-bars" }, rows.map(function (r) {
    return el("div", { class: "u-barrow" + (r[2] ? " " + r[2] : "") }, [el("span", { text: r[0] }), el("div", { class: "u-bar" }, [el("i", { style: { width: (mx ? r[1] / mx * 100 : 0).toFixed(1) + "%" } })]), el("span", { class: "u-num", text: fmtPct(r[1]) })]);
  }));
}
function section(title, kids, id) { return el("section", { class: "u-sec", id: id || null }, [el("h3", { text: title }), kids]); }
function renderTeamCenter(i, body) {
  var st = store.get(), T = TEAMS[i], r = st.sim && st.sim.r, M = st.model, rec = recordOf(i, M), seed = seedToday(i), late = feedFinalsCount(M);
  body.appendChild(el("div", { class: "u-dhead" }, [
    el("span", { class: "u-swatch", style: T.color ? { background: T.color } : null }),
    el("div", {}, [el("h2", { id: "u-drawer-title", text: T.name }), el("p", { class: "u-sub", text: T.conf + " · " + T.div + " · " + recStr(rec) + (rec.feed ? " (incl. " + rec.feed + " from the feed)" : "") + " · " + (seed ? "Seed " + seed + " if the season ended today" : "Outside the field if the season ended today") + (late ? ", counting games through the build only (this week's " + late + " feed final" + (late > 1 ? "s" : "") + " not included)" : "") })])]));
  body.appendChild(el("div", { class: "u-actions" }, [
    el("button", { type: "button", class: "u-btn u-primary", "data-fk": "open-sim", text: "Open in simulator", onclick: function () { openSimulator(i); } }),
    el("button", { type: "button", class: "u-btn", "data-fk": "focus-team", "aria-pressed": st.focus === T.a ? "true" : "false", text: st.focus === T.a ? "Focused on this team" : "Focus on this team", title: "Narrow the map, feed, games and media to the " + T.nick, onclick: function () { store.set({ focus: st.focus === T.a ? null : T.a }); } }),
    el("button", { type: "button", class: "u-btn", "data-fk": "prove", text: "Prove this wrong", onclick: function () { var s = byId("u-prove"); if (s) { s.scrollIntoView({ behavior: prefersReduced() ? "auto" : "smooth", block: "start" }); s.classList.add("is-flash"); var f = s.querySelector("li"); if (f) f.classList.add("is-strong"); setTimeout(function () { s.classList.remove("is-flash"); }, 1600); } } })]));
  if (r) {
    var w = r.sw[i] / r.n - 0.5 * BT[i];
    body.appendChild(el("div", { class: "u-tiles" }, [["Playoffs", fmtPct(r.po[i] / r.n)], ["Division", fmtPct(r.dv[i] / r.n)], ["Win Super Bowl", fmtPct(r.wSB[i] / r.n)], ["Projected record", w.toFixed(1) + "-" + (17 - BT[i] - w).toFixed(1) + (BT[i] ? "-" + BT[i] : "")]].map(function (x) {
      return el("div", { class: "u-tile" }, [el("b", { text: x[1] }), el("span", { text: x[0] })]);
    })));
    var rows = []; for (var s = 0; s < 7; s++) rows.push(["No. " + (s + 1), r.seedC[i][s] / r.n]); rows.push(["Miss", 1 - r.po[i] / r.n, "is-miss"]);
    body.appendChild(section("Seed distribution", [bars(rows), el("p", { class: "u-note", text: r.n.toLocaleString() + " simulated seasons" + (st.sim.deep ? " (deep run)" : "") + ", " + MODE_NAMES[st.sim.mode] + " win chances." })]));
  } else body.appendChild(el("p", { class: "u-state u-loading", text: "Simulating the season…" }));
  var rt = el("tbody");
  [["Spread-based", RATE], ["Results", RATE2], ["Elo", RATEL], ["Efficiency (EPA)", RATEE]].forEach(function (x) {
    if (!x[1]) return; rt.appendChild(el("tr", {}, [el("td", { text: x[0] }), el("td", { class: "u-num", text: fmtSigned(x[1][i] / 25) }), el("td", { class: "u-num", text: "#" + ratingRank(x[1], i) })]));
  });
  var qs = D.qbShift && D.qbShift[i];
  body.appendChild(section("Power ratings", [el("table", { class: "u-table" }, [el("thead", {}, el("tr", {}, [el("th", { text: "Method" }), el("th", { text: "Points" }), el("th", { text: "Rank" })])), rt]),
    el("p", { class: "u-note", text: "Points per game better (+) or worse (−) than an average team. The page's win chances blend the first two." + (qs && qs.shift != null ? " The results rating includes a quarterback adjustment of " + fmtSigned(qs.shift) + " for " + qs.qb + "." : "") }),
    qs && D.qbCredit ? el("p", { class: "u-credit", text: "Quarterback values from nfelo (nfeloapp.com)." }) : null]));
  var H = D.history, pts = [];
  if (H) H.weeks.forEach(function (wk, k) { pts.push(["Wk " + wk, H.po[k][i]]); });
  if (r) pts.push(["Now", r.po[i] / r.n]);
  if (pts.length) body.appendChild(section("Playoff chance by week", [sparkline(pts, T.name + " playoff chance by week"), el("p", { class: "u-note", text: "After each completed week, rebuilt from what was known then (Blend). Now: this page's simulation." })]));
  var q = qbStatusOf(i, M);
  if (q) body.appendChild(section("Quarterback", el("ul", { class: "u-list" }, q.reasons.map(function (x) { return el("li", { text: x.text }); }))));
  var inj = M && M.injuries[i];
  var injKids = [];
  if (inj) {
    injKids.push(el("p", { class: "u-note", text: "Burden index " + inj.burden.toFixed(2) + ": " + (inj.out || 0) + " out, " + (inj.doubtful || 0) + " doubtful, " + (inj.questionable || 0) + " questionable, " + (inj.ir || 0) + " on injured reserve. Descriptive only, not part of the forecast." }));
    injKids.push(el("ul", { class: "u-list" }, (inj.players || []).map(function (p) { return el("li", {}, [el("b", { text: p.name }), " " + (p.pos || "") + " · " + p.status + (p.type ? " (" + p.type + ")" : "") + (p.source ? " · " + sourceLabel(p.source) : "")]); })));
  } else injKids.push(el("p", { class: "u-note", text: st.payload ? "No injury report for this team in the current data. That is not the same as no injuries." : "No injury feed: no server and no embedded snapshot." }));
  body.appendChild(section("Injuries", injKids));
  var evs = (M ? M.events : []).filter(function (e) { return e.teams.indexOf(i) >= 0; }).slice(0, 10), now = refNow();
  body.appendChild(section("News and transactions", evs.length ? el("ul", { class: "u-evlist" }, eventRows(evs, now).rows) : el("p", { class: "u-note", text: "No events for this team in the current data." })));
  body.appendChild(teamMediaSection(i));
  var ng = nextGameOf(i, M);
  if (ng >= 0) {
    var G = GAMES[ng], x = (M && M.games.filter(function (g) { return g.gi === ng; })[0]) || mergeGame(ng, null), opp = G[2] === i ? G[3] : G[2], home = G[3] === i;
    var lt = lineText(x), mine = modeProb(ng), rb = ratingsBlendProb(ng);
    var kids = [el("p", {}, [el("b", { text: (home ? "vs " : "at ") + TEAMS[opp].name }), " · week " + G[1] + " · " + (x.kickoff ? fmtKick(x.kickoff) : G[5]) + (G[4] ? " · neutral site" : "")]),
      el("p", { class: "u-note", text: "Line: " + lt.text + (lt.src ? " (" + lt.src + ")" : "") }),
      el("p", { class: "u-note", text: "Win chance: " + fmtPct(home ? mine : 1 - mine) + " on this page; ratings alone " + fmtPct(home ? rb : 1 - rb) + (G[6] != null ? ", market " + fmtPct(home ? G[6] : 1 - G[6]) : ", no market line yet") + "." })];
    if (x.weather) kids.push(el("p", { class: "u-note" }, [weatherText(x.weather) + ". Not part of the forecast. ", weatherCredit(x.weather.source)]));
    kids.push(el("button", { type: "button", class: "u-btn", text: "Game detail", onclick: function () { openGame(x.key); } }));
    body.appendChild(section("Next game", kids));
  }
  body.appendChild(el("p", { class: "u-note", text: divisionGamesLeft(i) + " division games left." }));
  var pw = proveWrong(i, M);
  body.appendChild(section("What could prove this wrong?", [el("ol", { class: "u-list u-prove" }, pw.map(function (x) { return el("li", { text: x.text }); })),
    el("p", { class: "u-note", text: "Computed from the data on this page by fixed rules, strongest first. Not written by an AI model." })], "u-prove"));
}
