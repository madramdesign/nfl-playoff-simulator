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

## Known leakage and optimism

1. **Constants tuned in-sample.** Ridge strength, the 0.8/0.2 and 0.5/0.5 weights and the 0.8 shrink were chosen on these same five seasons. There are few of them and the surface is flat, but reported scores are optimistic. The fix is walk-forward tuning or holding out 2025.
2. **Closing lines.** The next week's lines are closing numbers. A forecast made on Tuesday would see earlier, softer lines.
3. **Revised data.** nflverse stats can be corrected after the fact; the backtest uses today's version of past weeks.
4. **Overlapping forecasts.** A late-season game is forecast many times from different weeks, so the 5,922 forecasts are not independent and the effective sample is smaller.
5. **No hindsight quarterback data is used**, which avoids the most common leak in public NFL backtests.

Benchmarks from outside: published models land at 64-68% of winners and Brier scores of 0.21-0.23; none reliably beats the closing line. Our numbers sit in that range, which is what an honest backtest should show.
