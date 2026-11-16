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
- If the feed does not answer, the page keeps the last scores and you can still enter scores by hand.

The ESPN feed is unofficial and undocumented. It can change or stop without notice. To use another source, set `LIVE_URL` to a feed with the same shape, or rewrite `normalize()` in `server.js`.

## Refresh schedule, results and betting lines

```
npm run build
```

This downloads the nflverse games file (schedule, final scores, spreads and moneylines), refits the team ratings and rewrites `public/index.html`. Run it at least once a week, after lines for the next week are posted. It uses only the Python standard library.

## How the odds work

- **Games with a posted moneyline:** the line with the bookmaker's margin removed.
- **Games without a line yet:** team ratings fitted to this season's point spreads, weighted toward recent weeks, plus home-field advantage.
- **Tiebreakers:** head-to-head, division record, common games, conference record, then a coin flip. Deeper official steps such as strength of victory are not implemented.
- Injuries are only reflected as far as the betting lines reflect them. Picks cannot be ties.

## Layout

| Path | What it is |
|---|---|
| `src/template.html` | The page: styles, simulation engine and interface. Edit this. |
| `scripts/build.py` | Pulls data, fits ratings, writes `public/index.html`. |
| `public/index.html` | Built page. Do not edit by hand. |
| `server.js` | Static server plus the `/api/live` score endpoint. |
| `test/run.js` | Checks for the engine and the feed parser (`npm test`). |

An independent fan project. Not affiliated with the NFL, any team, ESPN or any publisher. The odds are estimates, not betting advice.
