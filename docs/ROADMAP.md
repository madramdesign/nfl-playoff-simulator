# Roadmap and running checklist

Order is by dependency, not by size.

## Needs you
- [ ] Add the FantasyPros key as the repository secret `FANTASYPROS_API_KEY`, then run the "Fetch FantasyPros data" workflow once and check its output.
- [x] Create a GitHub repository for the project (done Nov. 20: `madramdesign/nfl-playoff-simulator`).
- [ ] Decide whether a free The Odds API key (500 credits a month) is acceptable. It unlocks consensus lines and futures.

## Next
- [x] Daily scheduled rebuild and republish (`npm run refresh`).
- [x] Dated snapshots of forecasts in `data/snapshots/`.
- [ ] "What changed since yesterday" on the page, with attribution to results, lines and model, built from the snapshots.
- [ ] Track this season's forecasts against results as they come in (true out-of-sample calibration).
- [ ] Verify the live-score feed against a real game.

## Model
- [ ] Quarterback adjustment from a starter-value source (nfelo's published QB values or our own from play-by-play), validated in the backtest before adoption.
- [ ] Walk-forward tuning of the constants, or hold out a season.
- [ ] Share one rating module between `build.py` and `evaluate.py`.
- [ ] Clinching checked against nflseedR.
- [ ] A batch run at 100,000 or more simulations for published figures.

## Markets
- [ ] Multi-book consensus, opening lines, line movement.
- [ ] Division, conference and Super Bowl futures beside the model's figures.

## Considered and parked
- Weather engine: only matters for totals and a handful of playoff games; revisit in January with Open-Meteo.
- Coaching and matchup matrices: no free data that survives an honest backtest.
- Machine-learning models: not enough independent data at team level.
- Database: flat snapshot files first.
- Agents: after there is somewhere to run them.

## Done
See [CHANGELOG.md](CHANGELOG.md).
