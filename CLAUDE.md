# Notes for Claude

- Edit `src/template.html`, never `public/index.html`. Rebuild with `npm run build` (downloads data) or `python3 scripts/build.py --csv <file>`.
- The engine lives in `<script id="engine">` and must stay free of DOM access so `test/run.js` can load it. Run `npm test` after any engine or server change.
- Game rows in the data are `[id, week, awayIdx, homeIdx, neutral, dateLabel, homeWinProbOrNull]`. Picks are 0 simulate, 1 away, 2 home.
- The page must keep working with no `/api/live` (it is also published as a static page), so live-feed code fails silently.
- The live feed has not been verified against the real ESPN endpoint from the sandbox this was built in. First thing to check on a machine with open internet: `npm start`, then open `/api/live` during a game window.
- Known gaps: tiebreakers stop at conference record; ties cannot be picked; in-game model ignores possession and timeouts.
