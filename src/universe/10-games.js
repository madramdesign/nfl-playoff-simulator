// This week's games: a strip under the map on wide screens, a list in the Games tab on narrow ones.
var gamesPanel = null;
function gameStateLabel(x) {
  if (x.state === "in") { var sn = staleNote(x); return (x.period >= 5 ? "OT" : "Q" + (x.period || "?")) + (x.clock ? " " + x.clock : "") + (sn ? " · " + sn : ""); }
  if (x.state === "post") return "Final" + (x.period >= 5 ? "/OT" : "");
  return x.kickoff ? fmtKick(x.kickoff) : x.dateLabel || "Scheduled";
}
// A game still listed as not started more than 15 minutes after kickoff: the data is behind, and the card says so.
function kickoffPassed(x) { var t = Date.parse(x.kickoff || ""); return x.state === "pre" && isFinite(t) && Date.now() - t > 15 * 60e3; }
function buildGamesPanel(host) {
  var gids = ["espn-scoreboard", "nflverse-games", "open-meteo"];
  gamesPanel = Panel({ id: "games", title: "This week", sources: gids, badge: buildOrFeedBadge(gids), cls: "u-gamespanel" });
  gamesPanel.loading("Loading games…");
  host.appendChild(gamesPanel.root);
  gamesPanel.body.addEventListener("click", function (e) { var t = e.target.closest ? e.target.closest("[data-game]") : null; if (t) openGame(t.getAttribute("data-game")); });
}
function renderGames() {
  if (!gamesPanel) return;
  var st = store.get(), M = st.model, q = (st.search || "").trim().toLowerCase(), tm = q ? searchTeams(q) : null;
  if (!M) return;
  gamesPanel.setTitle("This week" + (M.week != null ? " · Week " + M.week : ""));
  var games = M.games.filter(function (x) { return !tm || tm[x.away] || tm[x.home]; });
  if (!games.length) { gamesPanel.empty(q ? "No games this week match “" + q + "”." : "No games found for this week."); return; }
  gamesPanel.render(function (body) {
    var list = el("div", { class: "u-strip", role: "list" }), anyWx = null;
    games.forEach(function (x) {
      var hp = gameHomeProb(x), lt = lineText(x), w = x.weather;
      if (w && w.flags && w.flags.length && !anyWx) anyWx = w.source;
      var row = function (t, score, win) { /* scores of an in-progress game that is not live are still shown, with the age in the state line */ return el("div", { class: "u-gteam" + (win ? " is-win" : "") }, [el("b", { text: teamAbbr(t) }), el("span", { class: "u-gnick", text: TEAMS[t].nick }), score != null && x.state !== "pre" ? el("span", { class: "u-gscore", text: String(score) }) : null]); };
      var awayWin = x.state === "post" && x.awayScore > x.homeScore, homeWin = x.state === "post" && x.homeScore > x.awayScore;
      var live = x.state === "in" && isLiveGame(x);
      list.appendChild(el("button", { type: "button", role: "listitem", class: "u-gcard is-" + (x.state === "in" && !live ? "stalein" : x.state) + (st.game === x.key ? " is-sel" : ""), "data-game": x.key, "aria-label": teamName(x.away) + " at " + teamName(x.home) + ", " + gameStateLabel(x) }, [
        el("div", { class: "u-gstate" }, [live ? el("span", { class: "u-livedot", "aria-hidden": "true" }) : null, gameStateLabel(x), x.neutral ? el("span", { class: "u-gtag", text: "neutral" }) : null,
          kickoffPassed(x) ? el("span", { class: "u-gtag u-gwx", title: "Kickoff time has passed but this data still lists the game as not started: it is out of date.", text: "not updated" }) : null,
          w && w.flags && w.flags.length ? el("span", { class: "u-gtag u-gwx", title: weatherText(w) + ". Weather: " + sourceLabel(w.source) + ". Not part of the forecast.", text: w.flags.join(" ") }) : null]),
        row(x.away, x.awayScore, awayWin), row(x.home, x.homeScore, homeWin),
        el("div", { class: "u-gline", title: lt.src, text: lt.text }),
        lt.short ? el("div", { class: "u-gsrc", title: lt.src, text: lt.short }) : null,
        hp != null ? el("div", { class: "u-gprob", title: "Home win chance: " + gameProbSource(x) }, [el("span", { text: teamAbbr(x.home) + " " + fmtPct(hp) }), el("i", { style: { width: (hp * 100).toFixed(0) + "%" } })]) : null
      ]));
    });
    body.appendChild(list);
    var foot = el("p", { class: "u-gfoot" }, ["Win chance: " + ["Sportsbooks", "Results", "Blend"][MODE] + " mode, or the feed's live chance in play. " + (st.payload ? "" : "No live scores: schedule and lines as built " + (D.built || "") + ". ")]);
    if (anyWx) foot.appendChild(weatherCredit(anyWx));
    if (M.fixture) foot.appendChild(el("span", { class: "u-warnline", text: " Fixture data (synthetic)." }));
    body.appendChild(foot);
  });
}
