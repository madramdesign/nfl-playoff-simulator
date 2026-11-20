# Data sources and the page's data contract

Sources, costs and licence notes are in [RESEARCH_PLAYOFF_PREDICTOR.md](RESEARCH_PLAYOFF_PREDICTOR.md#data-sources).

## Files the build reads

| Input | Flag | Default |
|---|---|---|
| Games, scores, lines | `--csv` | nflverse `games.csv` |
| Weekly team stats | `--team-stats` | nflverse `stats_team_week_{season}.csv` |
| Injury report | `--injuries` | nflverse `injuries_{season}.csv` |
| FantasyPros quarterback projections | none | `data/fantasypros/qb_projections.json`, written by `scripts/fetch_fantasypros.py` (needs `FANTASYPROS_API_KEY`; run by the GitHub Actions workflow) |
| Traded first-round picks | none | `data/pick_owners.json` (hand-edited) |
| Backtest report | none | `data/model_report.json` (from `scripts/evaluate.py`) |

If team stats or injuries cannot be downloaded the build still succeeds and says what it skipped.

## The `D` blob

| Field | Meaning |
|---|---|
| `teams` | 32 teams: abbreviation, name, conference, division |
| `played` | Finished games: away, home, away score, home score |
| `games` | Remaining games: id, week, away, home, neutral, date label, home win probability from the moneyline or null, total or null |
| `rate`, `rate2`, `rateP`, `rateE`, `rateL` | Spread-based, results, scoring-margin, EPA and Elo ratings (points times 25) |
| `hfa`, `shrink` | Home edge (points times 25) and the rating-gap multiplier |
| `luck` | Points gained or lost from fumble bounces, per team |
| `history` | Playoff and division odds for every team after each completed week |
| `owners`, `ownersAsOf` | Holder of each first-round pick |
| `fp` | Teams whose FantasyPros-projected top quarterback differs from their last starter (a flag, not a model input) |
| `qb`, `qbWeek` | Starting quarterbacks on this week's injury report |
| `report` | Backtest report |
| `built` | Build date |

## Freshness and quality

The page shows one date, the build date. There is no per-field freshness, no cross-source checking and no stale-data alarm. Lines are whatever nflverse held at build time, from a single book, without a timestamp.
