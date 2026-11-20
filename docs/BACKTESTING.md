# Backtesting and calibration

Run: `python3 scripts/evaluate.py <games.csv> <folder with team_week_YYYY.csv>` (needs numpy). It writes `data/model_report.json`, which the build embeds in the page.

## Design

- Seasons 2021 to 2025. After each week W from 5 on, ratings are rebuilt from scratch and every later game is forecast.
- **Point-in-time rule:** results through week W, betting lines through week W+1, nothing later.
- Two horizons are scored separately: next week (where a real line exists to compare with) and two or more weeks ahead (the games the ratings are actually used for).
- Scores: log loss, Brier, share of winners picked. Tie games are dropped.

## Results

| Method | Log loss | Brier | Winners |
|---|---|---|---|
| Blend | 0.6391 | 0.2241 | 63.9% |
| Results rating | 0.6427 | 0.2257 | 63.2% |
| Scoring margin | 0.6428 | 0.2259 | 62.5% |
| Sportsbook-spread rating | 0.6449 | 0.2269 | 62.6% |
| Elo | 0.6490 | 0.2285 | 63.0% |
| EPA margin | 0.6551 | 0.2296 | 62.9% |

Next-week games (963): closing moneyline 0.5974 and 68.4%; spread rating 0.6135; blend 0.6183.

By season the blend's log loss ran from 0.601 (2024) to 0.675 (2025). The spread between seasons is larger than the gap between methods, so small differences in the table are not reliable.

## Calibration of the blend

| Favorite rated | Won | Games |
|---|---|---|
| 50-55% | 53% | 1,422 |
| 55-60% | 60% | 1,237 |
| 60-65% | 65% | 1,052 |
| 65-70% | 69% | 907 |
| 70-75% | 74% | 648 |
| 75-80% | 72% | 444 |
| 80-90% | 88% | 211 |

Slightly underconfident below 75%, overconfident at 75-80%. The model almost never says 90%.

## Does disagreement between models mean lower accuracy?

Only weakly. Where the four independent ratings were within 5 points of each other the Brier score was 0.214; where they were 15 or more apart it was 0.227. The page shows disagreement as a caution, not as a confidence score.

## Hold-out check

`scripts/backtest_qb.py` retunes the constants using only seasons before the one being scored.

| Scored season | Tuned on earlier seasons | Page's constants | Spread rating alone |
|---|---|---|---|
| 2023 | 0.6647 | 0.6548 | 0.6690 |
| 2024 | 0.6048 | 0.6008 | 0.6151 |
| 2025 | 0.6810 | 0.6753 | 0.6818 |
| Average | 0.6503 | 0.6437 | 0.6554 |

The in-sample figures flatter the model by about 0.007. The honest version still beat the spread rating alone in all three seasons, but the gap in 2025 was tiny. The constants chosen varied a lot from year to year, which says the surface is flat and the exact weights are not well determined.

## Outside benchmarks on next-week games (845 games)

Closing line 0.6022, nfelo at close 0.6064, nfelo at open 0.6104, opening line 0.6130, our spread rating 0.6167, our blend 0.6198. The closing line beats everything, and the opening line gives up about 0.011 to it.

## Quarterback adjustment

Shifting the results rating by the current starter's nfelo value against the season average: 0.6383 against 0.6391 overall, 0.6335 against 0.6345 in the 3,059 forecasts involving a team that had changed quarterback. Applying it to the spread rating too gave nothing. Quarterback data covered 1,191 of 1,359 games. The table above this section was produced before the adjustment; with it the blend scores 0.6383.

## Known leakage and optimism

1. **Constants tuned in-sample.** Ridge strength, the 0.8/0.2 and 0.5/0.5 weights and the 0.8 shrink were chosen on these same five seasons. There are few of them and the surface is flat, but reported scores are optimistic. The fix is walk-forward tuning or holding out 2025.
2. **Closing lines.** The next week's lines are closing numbers. A forecast made on Tuesday would see earlier, softer lines.
3. **Revised data.** nflverse stats can be corrected after the fact; the backtest uses today's version of past weeks.
4. **Overlapping forecasts.** A late-season game is forecast many times from different weeks, so the 5,922 forecasts are not independent and the effective sample is smaller.
5. **No hindsight quarterback data is used**, which avoids the most common leak in public NFL backtests.

Benchmarks from outside: published models land at 64-68% of winners and Brier scores of 0.21-0.23; none reliably beats the closing line. Our numbers sit in that range, which is what an honest backtest should show.
