# Notes for Claude

- Edit `src/template.html`, never `public/index.html`. Rebuild with `npm run build` (downloads data) or `python3 scripts/build.py --csv <file>`.
- The engine lives in `<script id="engine">` and must stay free of DOM access so `test/run.js` can load it. Run `npm test` after any engine or server change.
- Game rows in the data are `[id, week, awayIdx, homeIdx, neutral, dateLabel, homeWinProbOrNull, totalLineOrNull]`. Picks are 0 simulate, 1 away, 2 home.
- The page must keep working with no `/api/live` (it is also published as a static page), so live-feed code fails silently.
- The live feed has not been verified against the real ESPN endpoint from the sandbox this was built in. First thing to check on a machine with open internet: `npm start`, then open `/api/live` during a game window.
- Known gaps: tiebreakers stop at strength of schedule (points-based steps need simulated scores); ties cannot be picked; in-game model ignores possession and timeouts.
- Win chances have three modes (`setMode`): 0 sportsbooks, 1 results-based ratings, 2 an even blend (default). `GD` is rebuilt from `GDM` and `GDR` when the mode changes.
- Ratings are built in `scripts/build.py` (`rate` market, `rate2` results). Change weights only after rerunning `scripts/backtest.py`; rest-day effects were tested there and were too noisy to add.
- Clinched/eliminated flags (`status()` in the page script) are deliberately conservative sufficient conditions, not a full clinching solver; there are no 'needs X to clinch' scenarios.
- Sportsbook futures are not used: no dependable current source for all eight divisions was found.
- Read `docs/PLAYOFF_PREDICTOR_AUDIT.md` and `docs/ROADMAP.md` before adding features. House rule from the brief: no factor goes into the model without a backtest showing an out-of-sample gain; record rejections in `scripts/evaluate.py`'s `rejected` list.
- The reasoning panel (`whyPanel`) must only state things computed from `D` or a `simulate` result.
