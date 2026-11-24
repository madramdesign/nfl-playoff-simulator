// Game detail drawer (?game=<id>): teams, kickoff, live state, line with its source, weather with credit, every model's
// number and, when a server answers /api/game/<id>, the win-probability series and scoring plays.
var gameDetailCache = Object.create(null);
function findGame(key) {
  var M = store.get("model");
  if (M && M.gameByKey[key]) return M.gameByKey[key];
  for (var gi = 0; gi < GAMES.length; gi++) if (GAMES[gi][0] === key) return mergeGame(gi, null);
  return null;
}
function wpChart(series, homeA) {
  var W = 320, H = 120, ml = 30, mr = 8, mt = 8, mb = 18, n = series.length;
  var svg = svgEl("svg", { viewBox: "0 0 " + W + " " + H, class: "u-spark", role: "img", "aria-label": homeA + " win chance after each play" });
  var X = function (k) { return ml + (W - ml - mr) * (n > 1 ? k / (n - 1) : 1); }, Y = function (v) { return mt + (H - mt - mb) * (1 - v); };
  [0, 0.5, 1].forEach(function (v) { svg.appendChild(svgEl("line", { x1: ml, x2: W - mr, y1: Y(v), y2: Y(v), class: v === 0.5 ? "u-axis0" : "u-grid" })); svg.appendChild(svgEl("text", { x: ml - 4, y: Y(v) + 4, "text-anchor": "end", class: "u-tick", text: Math.round(v * 100) + "%" })); });
  svg.appendChild(svgEl("polyline", { points: series.map(function (p, k) { return X(k).toFixed(1) + "," + Y(p.home).toFixed(1); }).join(" "), class: "u-sparkline" }));
  var lastP = series[n - 1];
  svg.appendChild(svgEl("circle", { cx: X(n - 1), cy: Y(lastP.home), r: 4, class: "u-sparknow" }, [svgEl("title", { text: "Play " + (lastP.play != null ? lastP.play : n) + ": " + homeA + " " + fmtPct(lastP.home) })]));
  svg.appendChild(svgEl("text", { x: W - mr, y: H - 4, "text-anchor": "end", class: "u-tick", text: n + " plays" }));
  return svg;
}
function renderGameDetail(key, body) {
  var x = findGame(key);
  if (!x) { body.appendChild(el("p", { class: "u-state u-empty", text: "That game is not in the current data." })); return; }
  var A = TEAMS[x.away], Hh = TEAMS[x.home], hp = gameHomeProb(x);
  body.appendChild(el("div", { class: "u-dhead" }, [el("div", {}, [
    el("h2", { id: "u-drawer-title", text: A.name + " at " + Hh.name }),
    el("p", { class: "u-sub", text: [x.week != null ? "Week " + x.week : null, x.kickoff ? fmtKick(x.kickoff) : x.dateLabel, x.venue && x.venue.name ? x.venue.name + (x.venue.city ? ", " + x.venue.city : "") : null, x.neutral ? "neutral site" : null, x.broadcast].filter(Boolean).join(" · ") })])]));
  var live = x.state === "in" && isLiveGame(x);
  var tb = el("div", { class: "u-score is-" + (x.state === "in" && !live ? "stalein" : x.state) }, [
    el("div", {}, [el("b", { text: A.a }), x.state !== "pre" && x.awayScore != null ? el("span", { text: String(x.awayScore) }) : null]),
    el("div", { class: "u-scorestate" }, [live ? el("span", { class: "u-livedot", "aria-hidden": "true" }) : null, gameStateLabel(x)]),
    el("div", {}, [el("b", { text: Hh.a }), x.state !== "pre" && x.homeScore != null ? el("span", { text: String(x.homeScore) }) : null])]);
  body.appendChild(tb);
  if (x.situation && x.situation.text) body.appendChild(el("p", { class: "u-note", text: "Situation: " + x.situation.text + (x.situation.possession ? " · " + x.situation.possession + " ball" : "") + (x.situation.redZone ? " · red zone" : "") }));
  // both teams' chances, the favorite first
  if (hp != null) {
    var first = hp >= 0.5 ? [Hh, hp, A, 1 - hp] : [A, 1 - hp, Hh, hp];
    body.appendChild(el("p", {}, [el("b", { text: first[0].nick + " " + fmtPct(first[1]) }), " to win, " + first[2].nick + " " + fmtPct(first[3]) + " (" + gameProbSource(x, live) + ")"]));
  }
  // both in-game numbers side by side when the feed gives its own, so the gap between them is visible
  if (live && x.gi >= 0 && x.winProb && num(x.winProb.home) != null) body.appendChild(el("p", { class: "u-note", text: "This page's own in-game model (score, time left, pregame line) gives the " + Hh.nick + " " + fmtPct(pageLiveProb(x)) + "; the feed's chance is the one used in the simulation." }));
  var lt = lineText(x), kids = [el("p", { text: lt.text }), lt.src ? el("p", { class: "u-note", text: "Source: " + lt.src }) : null];
  var o = x.odds;
  if (o && o.homeProb && (o.homeProb.current != null)) kids.push(el("p", { class: "u-note", text: "Home win chance from the moneyline: " + (o.homeProb.open != null ? fmtPct(o.homeProb.open) + " at open → " : "") + fmtPct(o.homeProb.current) + (o.homeProb.open != null ? " now" : "") + "." }));
  var mv = gameLineMove(x); if (mv && !o) kids.push(el("p", { class: "u-note", text: "Movement: " + mv.text + "." }));
  // the consensus across books (The Odds API) and, on the local server only, each book's own line
  var mk = marketText(x.market, teamAbbr(x.home));
  if (mk) kids.push(el("p", { class: "u-market" }, [mk + " ", el("span", { class: "u-note", text: "The Odds API, " + fmtAge(Math.max(0, (Date.now() - x.market.at) / 1000)) + " old." })]));
  if (x.books && x.books.length) {
    var ml = function (v) { return v == null ? "–" : (v > 0 ? "+" : "") + v; }, bt = el("tbody");
    x.books.forEach(function (b) { bt.appendChild(el("tr", {}, [el("td", { text: b.title }), el("td", { class: "u-num", text: b.spread == null ? "–" : fmtSigned(b.spread) }),
      el("td", { class: "u-num", text: b.total == null ? "–" : String(b.total) }), el("td", { class: "u-num", text: ml(b.awayPrice) + " / " + ml(b.homePrice) })])); });
    kids.push(el("details", { class: "u-books" }, [el("summary", { text: "Each sportsbook (" + x.books.length + ", this computer only)" }),
      el("table", { class: "u-table" }, [el("thead", {}, el("tr", {}, [el("th", { text: "Book" }), el("th", { class: "u-num", text: teamAbbr(x.home) + " spread" }), el("th", { class: "u-num", text: "Total" }),
        el("th", { class: "u-num", text: "Moneyline " + teamAbbr(x.away) + " / " + teamAbbr(x.home) })])), bt])]));
  }
  var LM = store.get("model"), hist = lineHistoryText(LM && LM.lines ? LM.lines[x.id] : null, teamAbbr(x.home));
  if (hist) kids.push(el("p", { class: "u-note u-linehist", text: hist }));
  // what the feed had about either team between the two looks of each big move: context, not cause
  var bl = betweenLooks(LM && LM.lines ? LM.lines[x.id] : null, LM ? LM.events : [], [x.away, x.home]);
  if (bl.length) {
    var when = function (t) { return new Date(t).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); };
    var hm = teamAbbr(x.home), sg = function (v) { return (v > 0 ? "+" : v < 0 ? "\u2212" : "") + Math.abs(v); };
    kids.push(el("div", { class: "u-between" }, [el("p", { class: "u-note", text: "Seen in the feed between two looks at the line. These happened around the move; the feed does not say what caused it." })].concat(bl.map(function (m) {
      var head = [m.dSpread != null && m.dSpread !== 0 ? hm + " " + sg(m.from.spread) + " \u2192 " + sg(m.to.spread) : null, m.dTotal != null && m.dTotal !== 0 ? "total " + m.from.total + " \u2192 " + m.to.total : null].filter(Boolean).join(", ") +
        " by " + when(m.to.at) + (m.openWindow ? " (since the opening line, whose time is not given: the 7 days before)" : " (since " + when(m.from.at) + ")");
      return el("div", {}, [el("p", { text: head }), m.events.length ? el("ul", { class: "u-list" }, m.events.map(function (e) {
        return el("li", {}, [e.title + " ", e.url ? el("a", { href: e.url, target: "_blank", rel: "noopener", text: (e.publisher || "source") + " \u2197" }) : el("span", { class: "u-note", text: e.publisher || "" })]);
      })) : el("p", { class: "u-note", text: "Nothing about either team in the feed between these two looks." })]);
    }))));
  }
  body.appendChild(section("Line", kids));
  // official warnings first: the National Weather Service's own words, linked to its forecast page
  var alerts = (x.alerts || []).map(function (a) {
    var until = a.ends != null ? " until " + new Date(a.ends).toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" }) : "";
    return el("p", { class: "u-alert u-sev-" + a.severity.toLowerCase() }, [el("b", { text: "\u26A0 " + a.event }), " (" + a.severity.toLowerCase() + ")" + until + (a.headline ? ". " + a.headline : "") + ". ",
      a.url ? el("a", { href: a.url, target: "_blank", rel: "noopener", text: "National Weather Service \u2197" }) : "National Weather Service"]);
  });
  if (x.weather) body.appendChild(section("Weather", alerts.concat([el("p", { text: weatherText(x.weather) }), el("p", { class: "u-note" }, ["Descriptive, not part of the forecast. ", weatherCredit(x.weather.source)])])));
  else if (alerts.length) body.appendChild(section("Weather", alerts.concat([el("p", { class: "u-note", text: "Descriptive, not part of the forecast." })])));
  else if (x.venue && x.venue.indoor) body.appendChild(section("Weather", el("p", { class: "u-note", text: "Indoor stadium." })));
  if (x.gi >= 0) {
    var mvw = modelView(x.gi), rb = ratingsBlendProb(x.gi), mine = modeProb(x.gi), tbody = el("tbody");
    mvw.concat([["Ratings blend (no line)", rb], ["This page" + (x.state === "pre" ? "" : ", before kickoff") + " (" + ["Sportsbooks", "Results", "Blend"][MODE] + ")", mine]]).forEach(function (m, k, arr) {
      tbody.appendChild(el("tr", { class: k === arr.length - 1 ? "is-sel" : "" }, [el("td", { text: m[0] }), el("td", { class: "u-num", text: fmtPct(m[1]) })]));
    });
    var ps = mvw.map(function (m) { return m[1]; }), range = Math.max.apply(null, ps) - Math.min.apply(null, ps);
    var chips = [el("span", { class: "u-chip " + (range < 0.07 ? "is-ok" : range < 0.15 ? "" : "is-warn"), text: range < 0.07 ? "Models agree" : range < 0.15 ? "Some disagreement" : "Models disagree" })];
    if (GAMES[x.gi][6] != null && Math.abs(rb - GAMES[x.gi][6]) >= DISAGREE_MIN) chips.push(el("span", { class: "u-chip is-warn", text: "Model and market conflict (" + Math.round(Math.abs(rb - GAMES[x.gi][6]) * 100) + " points)" }));
    if (GAMES[x.gi][6] == null) chips.push(el("span", { class: "u-chip", text: "No betting line yet" }));
    body.appendChild(section("Chance the " + Hh.nick + " win, by method", [el("div", { class: "u-chiprow" }, chips), el("table", { class: "u-table" }, tbody)]));
    var r = store.get("sim") && store.get("sim").r, w = r && r.watch && r.watch[x.gi];
    if (w && w.nH && w.nA) {
      var eff = []; for (var t = 0; t < NT; t++) { var d = w.H[t] / w.nH - w.A[t] / w.nA; if (Math.abs(d) >= 0.01) eff.push([t, d]); }
      eff.sort(function (a, b) { return Math.abs(b[1]) - Math.abs(a[1]); });
      if (eff.length) body.appendChild(section("What this game is worth", [el("p", { class: "u-note", text: "Playoff chance if the " + Hh.nick + " win minus if the " + A.nick + " win, from the simulation (points):" }),
        el("ul", { class: "u-list u-cols" }, eff.slice(0, 10).map(function (e) { return el("li", {}, [el("button", { type: "button", class: "u-tlink", "data-team": e[0], text: TEAMS[e[0]].a, onclick: function () { openTeam(e[0]); } }), " " + fmtSigned(e[1] * 100, 0)]); }))]));
    }
  }
  var gm = gameMediaSection(x); if (gm) body.appendChild(gm);
  var live = el("div", { class: "u-gdetail" });
  body.appendChild(live);
  loadGameDetail(x, live);
}
// /api/game/<id> is local-only (DEC-006): fetched only when a server is present, silently skipped otherwise.
function loadGameDetail(x, host) {
  if (!x.id || !canPoll() || !GAME_ID_RE.test(x.id)) return;
  var cached = gameDetailCache[x.id];
  var draw = function (d) {
    clearNode(host);
    if (!d || d.v !== 1 || !d.header) return;
    var kids = [];
    if (Array.isArray(d.winProb) && d.winProb.length > 1 && d.winProb.every(function (p) { return typeof p.home === "number" && p.home >= 0 && p.home <= 1; })) kids.push(wpChart(d.winProb, teamAbbr(x.home)));
    if (Array.isArray(d.scoring) && d.scoring.length) kids.push(el("ul", { class: "u-list" }, d.scoring.slice(-8).reverse().map(function (s) {
      return el("li", {}, [el("b", { text: (s.team || "") + " " }), "Q" + s.period + (s.clock ? " " + s.clock : "") + ": " + s.text + (s.awayScore != null ? " (" + s.awayScore + "–" + s.homeScore + ")" : "")]);
    })));
    if (!kids.length) return;
    var lab = sourceLabel(d.source);
    kids.push(el("p", { class: "u-note", text: "From " + lab + (d.scope === "local" && !/local/i.test(lab) ? " (local only)" : "") + ", " + fmtAge(Math.max(0, (Date.now() - Date.parse(d.generatedAt)) / 1000)) + " old." }));
    host.appendChild(section("In-game", kids));
  };
  if (cached && Date.now() - cached.at < 20e3) { draw(cached.d); return; }
  fetch("api/game/" + encodeURIComponent(x.id), { cache: "no-store" }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (d) { gameDetailCache[x.id] = { at: Date.now(), d: d }; if (host.isConnected) draw(d); }).catch(function () { /* absent or failed: nothing shown */ });
}
