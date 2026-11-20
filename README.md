# NFL Playoff Simulator

Pick the winner of any remaining NFL game and see every team's record, the standings and the playoff seeds rebuild. Games you leave alone are simulated thousands of times, using win chances taken from sportsbook odds. While games are on, live scores move the odds.

## Run it

Needs Node 18 or newer. No packages to install.

```
npm start
```

Then open http://localhost:3000.

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
| `test/run.js` | Checks for the engine and the feed parser (`npm test`). |

An independent fan project. Not affiliated with the NFL, any team, ESPN or any publisher. The odds are estimates, not betting advice.
