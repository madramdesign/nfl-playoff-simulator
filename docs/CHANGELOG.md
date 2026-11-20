# Changelog

## 2026-11-20 (news ticker)
- Scrolling news ticker under the page header; each item links to the What changed section.
- Effect of a news item on every team's playoff chance: the line move for the team's next game times what that game is worth to each team (`simulate`'s new `watch` argument). Shown only when a line from before the news exists.
- News items gain `headline` and optional `lineBefore`; the build attaches pre-news lines from earlier snapshots.

## 2026-11-20 (quarterbacks, news, what changed)
- Quarterback adjustment on the results rating from nfelo's published quarterback values (backtest 0.6383 against 0.6391; 0.6335 against 0.6345 in games after a change). A newly named starter with no value this season gets no adjustment.
- `data/news.json` and a "What changed" section: news items with sources, line moves and playoff-chance movers since the previous snapshot.
- Hold-out check (`scripts/backtest_qb.py`): constants tuned on earlier seasons only scored 0.6503 on the next season, against 0.6437 with the page's in-sample constants and 0.6554 for the spread rating alone.
- Tested and not adopted: nfelo's team rating in the blend, the quarterback adjustment on the spread rating.
- Snapshots keep the first forecast of each day.

## 2026-11-20 (repository and automation)
- Project pushed to GitHub; daily scheduled refresh; dated forecast snapshots.
- FantasyPros fetch script and GitHub Actions workflow; possible quarterback changes flagged in the reasoning panel. Written against the documented response format and tested with a mock file only.

## 2026-11-20 (adversarial pass)
- Audit, research notes and this docs set.
- `scripts/evaluate.py`: point-in-time backtest of six methods, calibration, analogs by spread, eight narrative tests; writes `data/model_report.json`.
- Elo added as a displayed second opinion (tested in the blend, not adopted).
- Per-game reasoning panel: methods side by side, how the number is built, what could make it wrong.
- What-if strength slider and sensitivity check.
- "How good is this model?" and "Popular claims, tested" sections.
- Quarterback injury-report flags and fumble-luck figures in the data build.

## 2026-11-20 (earlier)
- Draft order for all 32 picks with traded first-round picks.
- Playoff bracket, seed grid, odds by week, schedule strength, clinch flags, simulated scores for tiebreakers.
- Results rating from opponent-adjusted margin and EPA; fumble-luck adjustment; first backtest.
- Blend of sportsbook and results ratings; odds-source switch.
- NFL tiebreakers through strength of schedule; wild-card odds; playoff picture.

## 2026-11-17
- Help/hurt colors on every pick; data refresh.

## 2026-11-16
- First version: NFC East simulation, then full-league picks, sportsbook win percentages, live-score server.
