# Roadmap and running checklist

Order is by dependency, not by size.

## Needs you
- [ ] Create a GitHub repository for the project. Scheduled refresh, snapshots and every later item depend on it.
- [ ] Decide whether a free The Odds API key (500 credits a month) is acceptable. It unlocks consensus lines and futures.

## Next, once the repository exists
- [ ] Daily scheduled rebuild and republish.
- [ ] Dated snapshots of inputs and forecasts; "what changed since yesterday" with attribution to results, lines and model.
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
