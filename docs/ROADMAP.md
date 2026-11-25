# Roadmap and running checklist

Order is by dependency, not by size.

## Needs you
- [x] Add the FantasyPros key as the repository secret `FANTASYPROS_API_KEY`, then run the "Fetch FantasyPros data" workflow once and check its output (done Nov. 25).
- [x] Create a GitHub repository for the project (done Nov. 20: `madramdesign/nfl-playoff-simulator`).
- [x] Decide whether a free The Odds API key (500 credits a month) is acceptable. It unlocks consensus lines and futures (key set Nov. 25; the consensus is on, futures are not built).

## Next
- [x] Daily scheduled rebuild and republish (`npm run refresh`).
- [x] Dated snapshots of forecasts in `data/snapshots/`.
- [x] "What changed" on the page: news, line moves and movers since the previous snapshot. Still open: splitting a change into results, lines and model.
- [ ] Track this season's forecasts against results as they come in (true out-of-sample calibration).
- [ ] Verify the live-score feed against a real game (first quarter checked Nov. 22; a full game still to follow).

## Model
- [x] Quarterback adjustment from nfelo's published values, validated in the backtest.
- [ ] A value for a newly named starter who has not played this season.
- [x] Hold-out check of the constants (see `BACKTESTING.md`). Still open: adopt walk-forward constants in the build.
- [ ] Share one rating module between `build.py` and `evaluate.py`.
- [ ] Clinching checked against nflseedR.
- [ ] A batch run at 100,000 or more simulations for published figures.

## Markets
- [x] Multi-book consensus and line movement (The Odds API and the fabric's line history, Nov. 23–25). Opening lines still open.
- [ ] Division, conference and Super Bowl futures beside the model's figures.

## Not started (no key needed)
- [ ] Playoff bracket diagram.
- [x] Weather flags from Open-Meteo through a GitHub workflow (the data fetch, DEC-021).
- [ ] nfelo opening lines for line-movement history.

## Considered and parked
- Weather engine: only matters for totals and a handful of playoff games; revisit in January with Open-Meteo.
- Coaching and matchup matrices: no free data that survives an honest backtest.
- Machine-learning models: not enough independent data at team level.
- Database: flat snapshot files first.
- Agents: after there is somewhere to run them.

## Done
See [CHANGELOG.md](CHANGELOG.md).
