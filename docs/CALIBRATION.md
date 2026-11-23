# Calibration

There are two separate things under this name.

1. **Backtest calibration (2021-2025).** The table on the page under "How good is this model?", how it is computed and its caveats live in [BACKTESTING.md](BACKTESTING.md#calibration-of-the-blend). Each game's reasoning panel quotes the matching row.
2. **Tracking this season's saved forecasts against results.** `scripts/calibration.py`, described below. It is descriptive: it scores forecasts that were already made and saved. It fits nothing and changes no model.

## Tracking saved forecasts (`scripts/calibration.py`)

### What is measured
`npm run snapshot` saves one file a day in `data/snapshots/YYYY-MM-DD.json`. Its `lines` map holds a home-win probability for each remaining game that had a sportsbook line. The script scores each of those probabilities against the final result from the nflverse games file (the file `scripts/build.py` downloads).

**What that probability is today:** the sportsbook moneyline with the bookmaker margin removed. The sportsbook and blend modes use it unchanged for any game that has a line, so this currently measures the market input the forecast leans on. It does not measure the ratings (`rate`, `rate2`): they only decide games without a line, and a snapshot does not save a game probability for those. Scoring the ratings would need `scripts/snapshot.js` to save per-mode game probabilities; see "Not covered".

For each group of scored forecasts:

| Number | Definition |
|---|---|
| Brier score | Mean of (forecast - outcome)^2, outcome 1 if the home team won, 0 if it lost. Lower is better; always saying 50% scores 0.25. |
| Log loss | Mean of -ln(probability given to what happened). Lower is better; always saying 50% scores 0.6931. Probabilities are clamped to [0.000001, 0.999999] for this score only. |
| +/- on the Brier score | Standard error: sample standard deviation of the per-game scores divided by sqrt(n). Shown only where each game appears once. |
| Reliability table | Ten buckets of forecast probability (0.0-0.1 ... 0.9-1.0, lower edge included, 1.0 in the last). For each: games, mean forecast, share the home team actually won. A calibrated forecast has the last two close in every bucket with enough games. |
| Baseline "always 50%" | The same games scored with 0.5. |
| Baseline "home rate" | The same games scored with the share of home wins among decided regular-season games of the season dated before the snapshot (ties left out). |

Groups: each snapshot date; "one forecast a game" (for each game, the last snapshot dated before the game, so each game counts once: this is the row to read); and "all forecasts pooled" (every snapshot-game pair; the same games repeat, so these are not independent and no error bar is given). Snapshots are grouped by their recorded `mode` (only `blend` so far) and modes are never mixed.

### Leakage rule
- A forecast is scored only if the game's date (`gameday`, US Eastern) is **strictly after** the snapshot's date (US Eastern). Snapshots have no time of day, so a game on the snapshot's own day is left out: it may already have started. The cost is that the morning-of forecast for a Sunday is never scored; the Saturday one is.
- The forecast comes from the snapshot file only. The games file supplies the game date and final score; its betting-line columns are never read (they keep changing until kickoff and would be look-ahead).
- If a file's name and its `date` field disagree, the later date is used and the row is marked.
- The home-rate baseline for a snapshot uses only games dated before that snapshot.

### Missing and odd data
Every recorded forecast is either scored or counted under one reason: `notAfterSnapshot` (the leakage rule), `pending` (no final score yet), `tie` (ties are left out of every score and counted), `unknownGame` (id not in the games file), `ambiguousGame` (id on more than one row), `noGameDate`, `badProbability` (not a number in 0 to 1). A malformed snapshot file is skipped and named. No snapshots, or nothing scoreable, is printed plainly and still exits 0. Each snapshot also carries a cross-check (not a filter): the number of results the snapshot says it had against the number the games file dates before it.

### How to run
```
npm run calibration                                   # real snapshots, downloads the games file
npm run calibration -- --out data/calibration.json    # also write the numbers as JSON
python3 scripts/calibration.py --snapshots DIR --games games.csv --out out.json    # everything from files
npm run test:calibration                              # hand-computed fixtures, no network; also part of npm test
```
Python 3 standard library only. The intended home of the JSON is `data/calibration.json`, written by the daily refresh; it is not wired into `npm run refresh` or the page yet, and the file is not committed by hand. The JSON has `kind: "descriptive"`, the games source and retrieval time (UTC), the rules, one entry per snapshot and the per-mode summaries.

### How to read it
- Read "one forecast a game". Compare its Brier score and log loss with the two baselines on the same line.
- The output states the number of distinct games. Under 100 it says the sample is too few to conclude anything, and that is meant literally: with a dozen games one upset moves the Brier score by several hundredths, and a ten-bucket table has one or two games a bucket. One week of games is not evidence for or against anything.
- Even with a full season (about 270 games) a difference smaller than roughly two error bars is noise, and games in the same week are not fully independent.
- Beating "always 50%" is a low bar. A result here is never grounds to change a weight: that needs `scripts/backtest.py` / `scripts/evaluate.py` (house rule in `CLAUDE.md`).

### Not covered
- Game probabilities from the ratings (games without a line, and the results-only mode) are not saved in snapshots, so they are not scored.
- Playoff, division and Super Bowl chances are saved but not scored: each resolves once a season, 32 outcomes a year.
- Snapshots started on Nov. 20, 2026, so earlier weeks of 2026 have no saved forecast.
- Forecast horizon (days before the game) is not broken out.
