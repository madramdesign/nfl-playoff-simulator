# NFL Universe (and the NFL Playoff Simulator)

The page opens on the NFL Universe command center: a map of all 32 teams with switchable layers (games, lines, weather, injuries, news, playoff odds, momentum, model disagreement), a unified intelligence feed, this week's games, team and game panels, a source-health panel, and a "What is happening in the NFL?" brief computed from the data (no AI model writes it). Its state is in the URL (`?team=NYG&layers=teams,injuries&timeRange=48h`), so views can be shared. The original simulator is the second view (`?view=sim`) and works as before.

## The simulator

Pick the winner of any remaining NFL game and see every team's record, the standings and the playoff seeds rebuild. Games you leave alone are simulated thousands of times, using win chances taken from sportsbook odds. While games are on, live scores move the odds.

## Run it

Needs Node 18 or newer. No packages to install.

```
npm start
```

Then open http://localhost:3000. The server listens on this machine only. To open it to your network, set `HOST=0.0.0.0` and list the names you will use in `ALLOWED_HOSTS` (for example `ALLOWED_HOSTS=192.168.1.20`); the API refuses other host names.

## Host it (Render)

`render.yaml` deploys `server.js` as a free Render web service with public sources only (`FABRIC_SCOPES=public`), so the hosted site has no ESPN data and no live scores. Open https://render.com/deploy?repo=https://github.com/madramdesign/nfl-playoff-simulator, sign in with GitHub and apply. Free services sleep after 15 minutes without traffic and take about a minute to wake. See `docs/DECISIONS.md` DEC-018.

## Focus

The bar under the top of the command center narrows everything to one scope: the league, a conference, a division or a team. The choice is kept in the link (`?focus=NFC`, `?focus=NFC-EAST`, `?focus=NYG`), so a focused view can be bookmarked or shared.

## NFL Universe data fabric

`server.js` also serves the NFL Universe data layer (`lib/fabric/`), which gathers schedule and lines (nflverse), the weekly injury report (nflverse), game-day weather (Open-Meteo, with the National Weather Service as backup), headlines (ESPN and Yahoo RSS), the curated items in `data/news.json`, and, on your own machine only, ESPN's live scoreboard, news, injuries and transactions.

| Endpoint | What it returns |
|---|---|
| `/api/universe` | Games, a unified event feed, injuries, transactions and the health of every source (`?since=<ISO time>` for new events only) |
| `/api/health` | Status, age and circuit-breaker state of each source |
| `/api/game/<ESPN id>` | One game: win-probability series, scoring plays, recent plays |
| `/api/team/<abbreviation>` | One team's slice of the above |

Every source runs behind a timeout, a retry, a circuit breaker and a last-good cache, so one failing feed never blanks the rest. ESPN's JSON is not licensed for automated use, so it is used locally only and nothing derived from it is committed or published (`docs/DECISIONS.md`, DEC-006). `FABRIC_SCOPES=public npm start` serves public sources only.

## MCP server for AI agents

`mcp/server.js` is a read-only MCP server over stdio with 14 tools (games, live games, injuries, news, events, odds, weather, team, standings, playoff odds, run a simulation, what changed, source health, search). Register it with Claude Code:

```
claude mcp add nfl-universe -- node /full/path/to/mcp/server.js
```

Every answer names its sources, their status and scope, and any that are unavailable. It writes no files and takes no outside action. Details: `docs/MCP_ARCHITECTURE.md`.

`npm run fabric-snapshot` saves the public sources to `data/fabric/latest.json` (embedded in the page by the build, so the static page has them) and records newly seen events in `data/fabric/events/<date>.json`. `npm run refresh` runs it first. Field-by-field contract: `docs/DATA_MODEL.md`.

## Live scores

`server.js` reads ESPN's public scoreboard feed, keeps each answer for 15 seconds and serves a trimmed copy at `/api/live`. The page checks that every 20 seconds.

- A game in progress gets an in-game win chance from the margin, the time left and the pregame line.
- A finished game is locked into the standings.
- If the feed does not answer, the page keeps the last scores it received. There is no manual score entry.

The ESPN feed is unofficial and undocumented. It can change or stop without notice. To use another source, set `LIVE_URL` to a feed with the same shape, or rewrite `normalize()` in `server.js`.

## Refresh schedule, results and betting lines

```
npm run build
```

This downloads the nflverse games file (schedule, final scores, spreads and moneylines), refits the team ratings and rewrites `public/index.html`. Run it at least once a week, after lines for the next week are posted. It uses only the Python standard library.

## How the odds work

- **Games with a posted moneyline:** the line with the bookmaker's margin removed.
- **Games without a line yet:** an even blend of two ratings, plus home-field advantage. The market rating is fitted to this season's point spreads, weighted toward recent weeks. The results rating is opponent-adjusted scoring margin (80%) and opponent-adjusted EPA margin (20%), from the nflverse weekly team stats.
- **Backtest:** `python3 scripts/backtest.py <games.csv> <folder of team_week_YYYY.csv>` (needs numpy) replays 2021-2025 and reports how well each rating predicted games two or more weeks ahead. The blend weights and the 0.8 shrink on rating gaps come from it.
- **Tiebreakers:** the NFL procedure through strength of schedule, then simulated scores for the points steps (combined points rankings and net points). Net points in common or conference games and net touchdowns are skipped before the coin flip.
- **Also simulated:** the playoff bracket through the Super Bowl, and the full first-round draft order. Traded first-round picks are listed in `data/pick_owners.json`; edit that file by hand when a pick changes hands.
- **Odds by week:** `npm run build` replays each completed week through the page's own engine (needs Node) to chart how every team's playoff chance has moved.
- **Luck:** fumbles lost above the league-average share are taken out of scoring margin before rating teams. A quarterback-change discount and a return-touchdown discount were tested in `scripts/backtest_adjustments.py` and left out because they did not improve predictions.
- Injuries are only reflected as far as the betting lines reflect them. Picks cannot be ties.

## News and what changed

`data/news.json` lists recent news that can change team strength, each with a source. The page's "What changed" section shows those items beside the betting lines and playoff chances that have moved since the previous saved forecast. Quarterback values come from nfelo's published files (credit nfeloapp.com).

## Challenging the forecast

- Every game has a "Why? What could be wrong?" panel: each method's number side by side, how the page's number is built, and the strongest evidence against it, all computed from the model's inputs.
- A strength slider and sensitivity check show how much a team's forecast depends on its rating, on the choice of method and on single games.
- "How good is this model?" shows the backtest and calibration; "Popular claims, tested" shows narratives checked against the closing spread.
- `python3 scripts/evaluate.py <games.csv> <folder of team_week_YYYY.csv>` regenerates `data/model_report.json` (needs numpy).

Start with `docs/PLAYOFF_PREDICTOR_AUDIT.md` and `docs/ROADMAP.md` for what exists and what is next.

## Layout

| Path | What it is |
|---|---|
| `src/template.html` | The page: styles, simulation engine and interface. Edit this. |
| `scripts/build.py` | Pulls data, fits ratings, writes `public/index.html`. |
| `public/index.html` | Built page. Do not edit by hand. |
| `server.js` | Static server plus the `/api/live` score endpoint. |
| `scripts/history.js` | Runs the engine on past weeks for the odds-by-week chart. |
| `scripts/backtest.py`, `scripts/backtest_adjustments.py` | Replays 2021-2025 to choose rating weights (need numpy). |
| `scripts/evaluate.py` | Backtest, calibration, analogs and narrative tests; writes `data/model_report.json`. |
| `docs/` | Audit, research, models, backtesting, red team, roadmap, changelog. |
| `test/run.js` | Checks for the engine and the feed parser (`npm test`); also runs `test/fabric.test.js`. |
| `lib/contract.js`, `lib/fabric/` | NFL Universe data contract and data fabric. |
| `shared/teams.json` | Canonical teams: provider ids, stadiums, aliases. |
| `src/universe/` | NFL Universe command-center modules, inlined into the page by the build. |
| `scripts/fabric-snapshot.js` | Public fabric snapshot and daily event record. |
| `CLAUDE.md`, `.claude/`, `docs/CURRENT_STATE.md` | Project instructions for AI agents, and the living plan. |

An independent fan project. Not affiliated with the NFL, any team, ESPN or any publisher. The odds are estimates, not betting advice. The NFL Universe layout borrows ideas from World Monitor (github.com/koala73/worldmonitor) but contains none of its code. Weather data by Open-Meteo.com (CC BY 4.0); schedule, lines and injury reports from nflverse (CC-BY 4.0).
