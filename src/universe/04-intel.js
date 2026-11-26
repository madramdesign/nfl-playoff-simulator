// Computed intelligence: ratings, model-versus-market gaps, quarterback status, "what could prove this wrong" and the
// rule-based brief. Every function takes its inputs explicitly or reads the engine's data (D, GAMES, RATE...); none
// writes to the page. Nothing here is written by a language model (DEC-009); the interface labels it that way.
var DISAGREE_MIN = 0.08;   // ratings blend vs posted line, in win probability, matching the simulator's "Model and market conflict" chip

function logistic(gd) { return 1 / (1 + Math.pow(10, -gd / 400)); }
// Home win chance for engine game gi under a win-chance mode (0 sportsbooks, 1 results, 2 blend), without any what-if.
function modeProb(gi, m) {
  if (m == null) m = MODE;
  var gd = m === 0 ? GDM[gi] : m === 1 ? GDR[gi] : LINE[gi] != null ? LINE[gi] : (GDM[gi] + GDR[gi]) / 2;
  return logistic(gd);
}
// The two ratings averaged, ignoring any posted line: what the simulator's reasoning panel compares with the market.
function ratingsBlendProb(gi) {
  var g = GAMES[gi], R = function (t) { return (RATE[t] + RATE2[t]) / 2; };
  return logistic(SHRINK * (R(g[3]) - R(g[2])) + (g[4] ? 0 : HFA));
}
function teamPower(i) { return (RATE[i] + RATE2[i]) / 2 / 25; }
function teamRatings(i) {
  var rows = [["Spread-based", RATE[i] / 25], ["Results", RATE2[i] / 25]];
  if (RATEL) rows.push(["Elo", RATEL[i] / 25]);
  if (RATEE) rows.push(["Efficiency (EPA)", RATEE[i] / 25]);
  return rows;
}
function ratingRank(arr, i) { var r = 1; for (var t = 0; t < NT; t++) if (arr[t] > arr[i]) r++; return r; }
function ratingSpread(i) {
  var v = teamRatings(i).map(function (r) { return r[1]; });
  var lo = Math.min.apply(null, v), hi = Math.max.apply(null, v);
  return { lo: lo, hi: hi, range: hi - lo };
}
function momentumOf(i, H) {
  H = H === undefined ? D.history : H;
  if (!H || !H.po || H.po.length < 2) return null;
  var n = H.po.length;
  return H.po[n - 1][i] - H.po[n - 2][i];
}
// Record from finished games in the build plus this week's finals in the feed that the build did not have yet (games still
// in GAMES), so it matches what the simulation counts. feed: how many of those finals were added.
function recordOf(i, M) {
  var r = { w: BW[i], l: BL[i], t: BT[i], feed: 0 };
  resultGames(M).forEach(function (g) {
    if (g.gi < 0 || g.state !== "post" || (g.away !== i && g.home !== i) || num(g.awayScore) == null || num(g.homeScore) == null) return;
    var mine = g.home === i ? g.homeScore : g.awayScore, theirs = g.home === i ? g.awayScore : g.homeScore;
    if (mine > theirs) r.w++; else if (mine < theirs) r.l++; else r.t++;
    r.feed++;
  });
  return r;
}
function feedFinalsCount(M) { return resultGames(M).filter(function (g) { return g.gi >= 0 && g.state === "post"; }).length; }
function recStr(r) { return r.w + "-" + r.l + (r.t ? "-" + r.t : ""); }
var CLOSE = (function () {
  var o = TM.map(function () { return [0, 0, 0]; });
  (D.played || []).forEach(function (g) { var m = g[3] - g[2]; if (Math.abs(m) > 8) return; if (m === 0) { o[g[0]][2]++; o[g[1]][2]++; } else { o[m > 0 ? g[1] : g[0]][0]++; o[m > 0 ? g[0] : g[1]][1]++; } });
  return o;
})();
var GAMES_PLAYED = BW[0] + BL[0] + BT[0];

// Quarterback status from four places: the page's QB adjustment (D.qbShift), curated qb_change news (D.news), the
// injury report flag (D.qb) and the feed's injury table (qbOut). Highest level wins; all reasons are kept.
function qbStatusOf(i, M) {
  var out = [], qs = D.qbShift && D.qbShift[i], q = D.qb && D.qb[i], inj = M && M.injuries[i];
  if (qs && qs.shift == null) out.push({ level: 3, kind: "change", text: qs.qb + " replaces " + qs.was + " at quarterback; no rating for him this season, so the results rating still reflects " + qs.was + "." });
  (D.news || []).forEach(function (n) { if (n.team === i && n.kind === "qb_change" && !(qs && qs.shift == null)) out.push({ level: 3, kind: "change", text: (n.to || "A new quarterback") + " replaces " + (n.from || "the starter") + " (" + (n.source || "news") + ", " + n.date + ")." }); });
  if (inj && inj.qbOut) {
    var who = (inj.players || []).filter(function (p) { return p.pos === "QB" && (p.status === "Out" || p.status === "Injured Reserve"); }).map(function (p) { return p.name + " (" + p.status + ")"; });
    out.push({ level: 3, kind: "out", text: "Quarterback listed out on the injury report" + (who.length ? ": " + who.join(", ") : "") + "." });
  }
  if (q && D.qbWeek != null) out.push({ level: 2, kind: "report", text: q.name + " is on the week " + D.qbWeek + " injury report (" + (q.status || q.practice) + ")." });
  if (qs && qs.shift != null && Math.abs(qs.shift) >= 1) out.push({ level: 1, kind: "adjusted", text: "Results rating moved " + fmtSigned(qs.shift) + " points for " + qs.qb + " (" + qs.starts + " of " + qs.games + " starts)." });
  if (!out.length) return null;
  out.sort(function (a, b) { return b.level - a.level; });
  return { level: out[0].level, kind: out[0].kind, reasons: out };
}

// Every remaining game with a posted line where the two ratings and the line differ by DISAGREE_MIN or more.
function disagreementGames() {
  var out = [];
  GAMES.forEach(function (g, gi) {
    if (g[6] == null) return;
    var rb = ratingsBlendProb(gi), d = rb - g[6];
    if (Math.abs(d) >= DISAGREE_MIN) out.push({ gi: gi, market: g[6], ratings: rb, diff: d });
  });
  return out.sort(function (a, b) { return Math.abs(b.diff) - Math.abs(a.diff); });
}
function nextGameOf(i, M) {
  var done = {};
  (M ? M.games : []).forEach(function (g) { if (g.gi >= 0 && g.state === "post") done[g.gi] = 1; });
  var best = -1;
  GAMES.forEach(function (g, gi) { if ((g[2] === i || g[3] === i) && !done[gi] && (best < 0 || g[1] < GAMES[best][1])) best = gi; });
  return best;
}
function divisionGamesLeft(i) {
  var n = 0; GAMES.forEach(function (g) { if ((g[2] === i || g[3] === i) && TM[g[2]].d === TM[g[3]].d) n++; }); return n;
}

// "What could prove this wrong?" for team i: computed facts only, strongest first. w is a rough ordering weight.
function proveWrong(i, M) {
  var out = [], T = TEAMS[i], sp = ratingSpread(i), rows = teamRatings(i);
  if (sp.range >= 2) out.push({ w: sp.range, kind: "methods", text: "The rating methods disagree by " + sp.range.toFixed(1) + " points per game (" + rows.map(function (r) { return r[0] + " " + fmtSigned(r[1]); }).join(", ") + "). The forecast leans on the blend of the first two." });
  var qb = qbStatusOf(i, M);
  if (qb && qb.level >= 2) qb.reasons.filter(function (r) { return r.level >= 2; }).forEach(function (r) { out.push({ w: r.level === 3 ? 6 : 3, kind: "qb", text: r.text + (r.kind === "out" ? " Injury burden is descriptive and not a model input; only a moved betting line carries it into the forecast." : "") }); });
  if (D.luck && Math.abs(D.luck[i]) >= 5) out.push({ w: Math.abs(D.luck[i]) / 3, kind: "luck", text: "The " + T.nick + " have " + (D.luck[i] > 0 ? "gained" : "lost") + " about " + Math.abs(Math.round(D.luck[i])) + " points from fumble bounces this season, which tends not to last. The results rating removes this; the record does not." });
  var o = CLOSE[i], nc = o[0] + o[1] + o[2];
  if (nc >= 4 && (o[0] / nc >= 0.75 || o[1] / nc >= 0.75)) out.push({ w: 3.5, kind: "close", text: "They are " + o[0] + "-" + o[1] + (o[2] ? "-" + o[2] : "") + " in games decided by 8 points or fewer. Records that lopsided in close games usually drift back toward even." });
  var ng = nextGameOf(i, M);
  if (ng >= 0) {
    var g = GAMES[ng], opp = g[2] === i ? g[3] : g[2], home = g[3] === i;
    if (g[6] == null) out.push({ w: 2, kind: "noline", text: "No betting line is posted yet for the next game (week " + g[1] + " vs " + TEAMS[opp].nick + "), so injuries and other news are not in that number at all." });
    else {
      var rb = ratingsBlendProb(ng), mk = g[6], d = rb - mk;
      if (Math.abs(d) >= DISAGREE_MIN) out.push({ w: Math.abs(d) * 40, kind: "market", text: "Next game (week " + g[1] + " vs " + TEAMS[opp].nick + "): the ratings give the " + T.nick + " " + fmtPct(home ? rb : 1 - rb) + ", the market " + fmtPct(home ? mk : 1 - mk) + ". The page uses the market's number." });
    }
  }
  out.push({ w: 1, kind: "sample", text: "Ratings rest on about " + GAMES_PLAYED + " games per team. Samples that small are noisy, and the model cannot see lineup changes." });
  return out.sort(function (a, b) { return b.w - a.w; });
}

// ---- the brief's ranking functions (pure: inputs in, one ranked answer out) ----
function topEvent(events) {
  var best = null;
  (events || []).forEach(function (e) { if (e.importance == null || e.before != null || e.origin === "model") return; if (!best || e.importance > best.importance || (e.importance === best.importance && e.ts > best.ts)) best = e; });
  return best;
}
function biggestInjury(injuries) {
  var best = null, qbOut = [];
  for (var k in (injuries || {})) {
    var t = injuries[k], i = +k;
    if (!t || typeof t.burden !== "number") continue;
    if (t.qbOut) qbOut.push(i);
    if (!best || t.burden > best.burden) best = { team: i, burden: t.burden, rec: t };
  }
  if (best) best.qbOut = qbOut;
  return best;
}
function biggestHistoryMove(H) {
  if (!H || !H.po || H.po.length < 2) return null;
  var n = H.po.length, best = null;
  for (var i = 0; i < NT; i++) { var d = H.po[n - 1][i] - H.po[n - 2][i]; if (!best || Math.abs(d) > Math.abs(best.delta)) best = { team: i, from: H.po[n - 2][i], to: H.po[n - 1][i], delta: d, week: H.weeks[n - 1], prevWeek: H.weeks[n - 2] }; }
  return best;
}
// po: playoff probability per team now (a simulation); prev: D.prev (a saved forecast).
function biggestPrevMove(prev, po) {
  if (!prev || !prev.playoffs || !po) return null;
  var best = null;
  for (var i = 0; i < NT; i++) { var d = po[i] - prev.playoffs[i]; if (!best || Math.abs(d) > Math.abs(best.delta)) best = { team: i, from: prev.playoffs[i], to: po[i], delta: d, date: prev.date }; }
  return best;
}
// Largest market move: the feed's open -> current home win chance (or spread), else the line now vs the saved forecast.
function biggestMarketMove(games, prev) {
  var best = null;
  (games || []).forEach(function (g) {
    var o = g.odds;
    if (!o) return;
    var hp = o.homeProb, sp = o.spread;
    if (hp && hp.open != null && hp.current != null) { var d = hp.current - hp.open; if (!best || Math.abs(d) > Math.abs(best.size)) best = { game: g, kind: "prob", from: hp.open, to: hp.current, size: d, src: o.source, provider: o.provider }; }
    else if (sp && sp.open != null && sp.current != null) { var ds = sp.current - sp.open, sz = ds / 25; if (!best || Math.abs(sz) > Math.abs(best.size)) best = { game: g, kind: "spread", from: sp.open, to: sp.current, size: sz, src: o.source, provider: o.provider }; }
  });
  if (best) return best;
  if (prev && prev.lines) GAMES.forEach(function (g, gi) {
    var was = prev.lines[g[0]];
    if (was == null || g[6] == null) return;
    var d = g[6] - was;
    if (!best || Math.abs(d) > Math.abs(best.size)) best = { gi: gi, kind: "saved", from: was, to: g[6], size: d, date: prev.date };
  });
  return best && Math.abs(best.size) > 0 ? best : null;
}
// The watched game whose result moves the most playoff probability, summed over all 32 teams.
function mostImportantGame(watch) {
  var best = null;
  for (var k in (watch || {})) {
    var w = watch[k];
    if (!w || !w.nH || !w.nA) continue;
    var sum = 0, per = [];
    for (var t = 0; t < NT; t++) { var d = w.H[t] / w.nH - w.A[t] / w.nA; sum += Math.abs(d); per.push([t, d]); }
    per.sort(function (a, b) { return Math.abs(b[1]) - Math.abs(a[1]); });
    if (!best || sum > best.swing) best = { gi: +k, swing: sum, top: per.slice(0, 3) };
  }
  return best;
}
function biggestUncertainty() {
  var best = null;
  for (var i = 0; i < NT; i++) { var s = ratingSpread(i); if (!best || s.range > best.range) best = { team: i, range: s.range, lo: s.lo, hi: s.hi }; }
  return best;
}
function overlookedFactor() {
  var best = null;
  if (D.luck) for (var i = 0; i < NT; i++) if (Math.abs(D.luck[i]) >= 8 && (!best || Math.abs(D.luck[i]) > Math.abs(best.luck))) best = { team: i, kind: "luck", luck: D.luck[i] };
  if (best) return best;
  if (D.qbShift) for (var k in D.qbShift) if (D.qbShift[k] && D.qbShift[k].shift == null) return { team: +k, kind: "qb", qb: D.qbShift[k] };
  for (var t = 0; t < NT; t++) { var o = CLOSE[t], n = o[0] + o[1] + o[2]; if (n >= 4 && (o[0] / n >= 0.75 || o[1] / n >= 0.75)) return { team: t, kind: "close", rec: o }; }
  return null;
}
var KEY_SOURCE_KINDS = [["scores", ["espn-scoreboard", "odds-scores", "nflverse-games"]], ["injuries", ["espn-injuries", "nflverse-injuries"]], ["news", ["rss-*", "espn-news", "curated-news"]], ["weather", ["open-meteo"]], ["transactions", ["espn-transactions"]]];
// Which kinds of information are missing right now. A kind with no source in the payload counts as a gap too.
function intelligenceGaps(payload) {
  var gaps = [];
  KEY_SOURCE_KINDS.forEach(function (k) {
    var ss = matchSources(payload && payload.sources, k[1]);
    if (!ss.length) gaps.push({ kind: k[0], why: "no source" });
    else if (!ss.some(function (s) { return s.status === "ok"; })) gaps.push({ kind: k[0], why: ss.some(function (s) { return s.status === "stale"; }) ? "stale" : "down" });
  });
  return gaps;
}

// The brief. ctx: {M, payload, sim (result or null), events (already time-filtered)}. Each line: {id, label, text, team, gi, gameKey, url}.
function buildBrief(ctx) {
  var M = ctx.M, r = ctx.sim, lines = [], po = r ? Array.prototype.map.call(r.po, function (v) { return v / r.n; }) : null;
  var add = function (id, label, x) { lines.push(Object.assign({ id: id, label: label }, x)); };
  var te = topEvent(ctx.events);
  if (te) add("development", "Biggest development", { text: te.title + " (" + te.publisher + ", importance " + Math.round(te.importance) + " of 100)", team: te.teams[0], url: te.url, eventId: te.id });
  else {
    var qbn = (ctx.events || []).filter(function (e) { return e.type === "qb_change"; })[0];
    add("development", "Biggest development", qbn ? { text: qbn.title + " (" + qbn.publisher + ", " + fmtDateUTC(qbn.ts) + "; no importance score)", team: qbn.teams[0], url: qbn.url } : { text: "No scored events in this time range." });
  }
  var bi = biggestInjury(M && M.injuries);
  if (bi) add("injury", "Biggest injury burden", { text: "The " + TEAMS[bi.team].nick + " carry the heaviest injury burden (index " + bi.burden.toFixed(2) + ": " + (bi.rec.out || 0) + " out, " + (bi.rec.ir || 0) + " on injured reserve)" + (bi.qbOut.length ? ". Quarterback listed out: " + bi.qbOut.map(function (t) { return TEAMS[t].nick; }).join(", ") : "") + ". Descriptive, not part of the forecast.", team: bi.team });
  else add("injury", "Biggest injury burden", { text: "No injury report in the current data, which does not mean there are no injuries." });
  var hm = biggestHistoryMove(D.history);
  if (hm) add("team", "Biggest team movement", { text: "The " + TEAMS[hm.team].nick + " moved " + fmtSigned(hm.delta * 100, 0) + " points in playoff chance in week " + hm.week + " (" + fmtPct(hm.from) + " to " + fmtPct(hm.to) + ").", team: hm.team });
  var pm = biggestPrevMove(D.prev, po);
  if (pm) add("playoff", "Biggest playoff movement", { text: "The " + TEAMS[pm.team].nick + " are " + fmtPct(pm.to) + " to make the playoffs, from " + fmtPct(pm.from) + " in the forecast saved " + pm.date + " (" + fmtSigned(pm.delta * 100, 0) + " points)." + (Math.abs(pm.delta) < 0.03 ? " That is within simulation noise." : ""), team: pm.team });
  else if (!r) add("playoff", "Biggest playoff movement", { text: "Waiting for the simulation." });
  var mm = biggestMarketMove(M && M.games, D.prev);
  if (mm && mm.game) {
    var g = mm.game, src = M.sources[mm.src];
    add("market", "Biggest market movement", { text: teamAbbr(g.away) + " at " + teamAbbr(g.home) + ": " + (mm.kind === "prob" ? "home win chance " + fmtPct(mm.from) + " to " + fmtPct(mm.to) : "home spread " + fmtSigned(mm.from) + " to " + fmtSigned(mm.to)) + " (" + (mm.provider || "") + (src ? ", " + src.label : "") + ", open to current).", gameKey: g.key });
  } else if (mm) add("market", "Biggest market movement", { text: TEAMS[GAMES[mm.gi][2]].a + " at " + TEAMS[GAMES[mm.gi][3]].a + ": home win chance " + fmtPct(mm.from) + " in the forecast saved " + mm.date + ", " + fmtPct(mm.to) + " at the build (nflverse line, " + (D.built || "") + ").", gi: mm.gi });
  else add("market", "Biggest market movement", { text: "No line movement in the current data (nflverse gives one current line and no opening line)." });
  var dg = disagreementGames()[0];
  if (dg) { var G = GAMES[dg.gi]; add("disagree", "Biggest model disagreement", { text: TEAMS[G[2]].a + " at " + TEAMS[G[3]].a + " (week " + G[1] + "): ratings give the home team " + fmtPct(dg.ratings) + ", the market " + fmtPct(dg.market) + ".", gi: dg.gi }); }
  else add("disagree", "Biggest model disagreement", { text: "No game with a posted line differs from the ratings by " + Math.round(DISAGREE_MIN * 100) + " points or more." });
  var ig = r && mostImportantGame(r.watch);
  if (ig) { var G2 = GAMES[ig.gi]; add("game", "Most important game left this week", { text: TEAMS[G2[2]].a + " at " + TEAMS[G2[3]].a + ": the result moves " + Math.round(ig.swing * 100) + " points of playoff chance summed over all teams. A " + TEAMS[G2[3]].nick + " win rather than a " + TEAMS[G2[2]].nick + " win changes " + ig.top.map(function (x) { return TEAMS[x[0]].a + " " + fmtSigned(x[1] * 100, 0); }).join(", ") + " points.", gi: ig.gi }); }
  else add("game", "Most important game left this week", { text: r ? "No unfinished game this week to measure." : "Waiting for the simulation." });
  var bu = biggestUncertainty();
  if (bu) add("uncertain", "Biggest uncertainty", { text: "The rating methods disagree most about the " + TEAMS[bu.team].nick + ": from " + fmtSigned(bu.lo) + " to " + fmtSigned(bu.hi) + " points per game.", team: bu.team });
  var of = overlookedFactor();
  if (of) add("overlooked", "Overlooked factor", { text: of.kind === "luck" ? "The " + TEAMS[of.team].nick + " have " + (of.luck > 0 ? "gained" : "lost") + " about " + Math.abs(Math.round(of.luck)) + " points from fumble bounces; their record " + (of.luck > 0 ? "flatters" : "undersells") + " them." : of.kind === "qb" ? "The " + TEAMS[of.team].nick + " start " + of.qb.qb + " in place of " + of.qb.was + " and there is no rating for him; their results rating still describes the old lineup." : "The " + TEAMS[of.team].nick + " are " + of.rec[0] + "-" + of.rec[1] + " in one-score games, which usually drifts back toward even.", team: of.team });
  var gaps = intelligenceGaps(ctx.payload);
  var fav = -1; if (r) for (var t = 0; t < NT; t++) if (fav < 0 || r.wSB[t] > r.wSB[fav]) fav = t;
  var pw = fav >= 0 ? proveWrong(fav, M)[0] : null;
  if (gaps.length) add("redteam", "Red-team warning", { text: "Intelligence gaps: " + gaps.map(function (x) { return x.kind + " (" + x.why + ")"; }).join(", ") + ". Silence in those areas is not an all-clear." + (pw ? " Also, on the favorite (" + TEAMS[fav].nick + "): " + pw.text : ""), team: fav >= 0 ? fav : undefined });
  else if (pw) add("redteam", "Red-team warning", { text: "Against the Super Bowl favorite (" + TEAMS[fav].nick + ", " + fmtPct(r.wSB[fav] / r.n) + "): " + pw.text, team: fav });
  return lines;
}

Object.assign(NFLU, { modeProb: modeProb, ratingsBlendProb: ratingsBlendProb, teamPower: teamPower, disagreementGames: disagreementGames, qbStatusOf: qbStatusOf,
  proveWrong: proveWrong, recordOf: recordOf, topEvent: topEvent, biggestInjury: biggestInjury, biggestHistoryMove: biggestHistoryMove, biggestPrevMove: biggestPrevMove,
  biggestMarketMove: biggestMarketMove, mostImportantGame: mostImportantGame, biggestUncertainty: biggestUncertainty, overlookedFactor: overlookedFactor,
  intelligenceGaps: intelligenceGaps, buildBrief: buildBrief, momentumOf: momentumOf, DISAGREE_MIN: DISAGREE_MIN });
