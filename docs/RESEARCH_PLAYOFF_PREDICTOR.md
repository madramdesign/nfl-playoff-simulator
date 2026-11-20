# Research notes

Research date: Nov. 20, 2026. Two research passes (data sources; methods and public systems) plus direct download tests of nflverse files from the build sandbox. "Could not verify" means exactly that. Several hosts (ESPN, Open-Meteo, NWS, Kalshi, Polymarket) were blocked from the sandbox, so those entries rest on documentation.

## What the evidence says

1. **Nothing public reliably beats the closing line.** Credible published models pick 64-68% of winners with Brier scores of 0.21-0.23. Claims far above that usually mean leakage.
2. **Blending a model with the market beats either alone.** nfelo's own analysis found about 65% market weight optimal for its model. Our backtest landed near 50% for games without a line.
3. **Quarterback adjustment is the one factor every serious system models** (FiveThirtyEight's later Elo, nfelo, ESPN FPI, Silver Bulletin's ELWAY, FTN). It is our largest known gap.
4. **Most narrative factors are near zero.** Momentum, close-game record and bye weeks show little or nothing once the line is known. Home-field advantage has shrunk to roughly 1.5 to 2 points. Wind does lower scoring. Our own tests agree on each.

## Data sources

### In use or ready to use (all free, all nflverse; base `https://github.com/nflverse/nflverse-data/releases/download/{tag}/{file}`)

| Tag | Provides | Freshness | Status here |
|---|---|---|---|
| `nfldata` `games.csv` (separate repo) | Schedule, scores, closing lines, rest, roof, wind, starting QB | Nightly | In use |
| `stats_team` | Weekly team stats with EPA and fumbles | Nightly | In use |
| `injuries` | Report and practice status, 2009 on | Current through week 11 | In use for quarterback flags. Schema changed in 2025 (no `date_modified`) |
| `pbp` | Play-by-play with EPA and win probability | Daily | Downloads work; not used yet |
| `depth_charts` | Depth charts, ESPN-sourced since 2025 | Daily | Downloads work (78 MB); structure differs before 2025 |
| `snap_counts`, `weekly_rosters`, `pfr_advstats`, `ftn_charting`, `nextgen_stats` | Player-level detail | Daily to weekly | Download tested; later. FTN data is CC-BY-SA 4.0 |

nflverse states no data licence for the repository apart from the FTN files.

### Candidates

| Source | Provides | Cost | Risk | Recommendation |
|---|---|---|---|---|
| nfelo output CSVs | External ratings, QB values, opening and closing spreads | Free | Licence lets you read and republish outputs with credit, not run the code; model source went private Nov. 11, 2026 | Use next: benchmark and opening lines |
| The Odds API | Multi-book moneyline, spread, total, outrights | Free 500 credits a month; paid from $30 | Low | Use next, on the free tier, for a weekly snapshot and futures |
| The Odds API historical | Snapshots since June 2020 | Paid plans only | Low | Later |
| Open-Meteo | Forecast and historical hourly weather | Free for non-commercial use, 10,000 calls a day | CC BY 4.0, attribution | Use for playoff-game weather |
| Kalshi, Polymarket | Prediction-market prices and history | Free market data | NFL tickers not verified | Later |
| ESPN scoreboard and injuries endpoints | Live scores, intra-week injuries | Free | Undocumented, no terms, fields change | Live scores only, with a fallback |
| NWS API | 7-day forecast | Free | No archive | Later |
| ESPN FPI | Team ratings | Free to view | No sanctioned API | Compare by hand |
| SportsDataIO, Sportradar | Full commercial feeds | Sales contract | Commercial | Skip |
| FTN DVOA, PFF grades | Proprietary metrics | Paid, reuse restricted | High | Skip |

## Methods

| Method | Evidence | Our position |
|---|---|---|
| Closing line | Favorites win about two games in three; spread error about 13.6 points | Used directly when posted |
| Elo, FiveThirtyEight classic | K 20, 65 home, one-third reversion; about 51% against the spread | Implemented as a second opinion; did not improve the blend |
| Market regression | nfelo: regressing a model toward the market beats both | Adopted (the blend) |
| Bayesian state-space ratings | Standard for estimating effects such as home field and rest; no shown edge over the market | Not built; our ridge fit is the simple cousin |
| Gradient boosting and neural nets | Credible studies reach 64-68%; higher claims are suspect | Not built. Five seasons of team-level data cannot support them without overfitting |
| Ensembles | Help in other sports; no NFL-specific evidence found | Ours is a two-part blend chosen by backtest |

## Factors

| Factor | Outside finding | Our test | Decision |
|---|---|---|---|
| Home field | Fell to about 1.5-2 points since 2019 | Home margin 2.51 (2010-18) to 1.51 (2019-25) | Fitted each season from the lines: 1.8 now |
| Bye week | +0.3 points since 2011, not significant | +0.1 against the spread | Out |
| Thursday short week | +0.5, not significant | -0.1 | Out |
| Wind | 16-25 mph cuts scoring about 7% | 42.4 against 46.0 points; 1.6 under the total, not significant | Not modelled; matters for totals, which we do not forecast |
| Turnover luck | Year-to-year correlation under 0.1 | Removing fumble bounces improved the backtest slightly | In |
| Close-game record | Year-to-year correlation 0.04 | +0.9 against the spread, not significant | Shown as a caution only |
| Momentum | No effect found | +0.7, not significant | Out |
| Quarterback change | Modelled by every major system | Crude discount on past results: no gain | Needs a proper starter-value source |
| Dome team in the cold | No source found | 42 games, nothing detectable | Out |
| Playoff experience, "clutch" | No quantitative source found | Untested | Out until there is evidence |

## Public systems

| System | Stated method | Publishes calibration |
|---|---|---|
| ESPN FPI | EPA-based unit ratings, QB availability, rest; 10,000 simulations | One early season |
| nfelo | Elo plus QB, market regression, rest, weather | Performance page, no reliability plot |
| FTN DVOA | 25,000 simulations, manual QB and injury adjustments | No |
| Silver Bulletin ELWAY | Drive-efficiency ratings, QB model | No |
| Pro Football Network | 100,000 simulations; inputs not stated | No |
| PlayoffStatus | "Relative team strength"; details not found | Could not verify |
| The Athletic / NYT | Paywalled; not read | Could not verify |

Publishing a calibration table, as this page now does, is rarer than it should be.

## Open-source projects

| Project | Licence | Idea worth borrowing |
|---|---|---|
| nflverse/nflseedR | MIT | Tiebreaker depth setting, a "tie broken by" audit column, and clinching validated against official NFL flags for 2006-2025: a ready-made test oracle |
| nflverse/nflfastR | MIT | EPA and win-probability models behind the play-by-play we could use |
| nflverse/nflreadpy | MIT | Cached loaders; replaces the deprecated nfl_data_py |
| greerreNFL/nfelo, nfeloqb | Restrictive custom licence | QB prior from draft slot; point-in-time spread ledger as a benchmark |
| fivethirtyeight/nfl-elo-game | MIT-style | Minimal Elo baseline (our Elo follows its formula) |
| dmparker0/nflsim | MIT | Perturbing each team's rating per simulated season, which this engine already does |

## Calibration practice and leakage

Report Brier and log loss beside the closing line on the same games, with a reliability table. Common leaks: full-season stats used for early weeks, closing lines for forecasts made earlier, constants tuned on the test years, quarterback status known only in hindsight, revised data in place of snapshots, random splits. `BACKTESTING.md` lists which of these apply here.

## Key sources

- nflverse data releases: https://github.com/nflverse/nflverse-data/releases
- nflseedR: https://nflseedr.com/articles/nflsim.html
- nfelo market regression: https://www.nfeloapp.com/analysis/using-market-regression-to-improve-prediction-accuracy-in-the-nfl/
- nfelo performance: https://www.nfeloapp.com/games/nfl-model-performance
- FiveThirtyEight Elo code: https://github.com/fivethirtyeight/nfl-elo-game
- Lopez and Bliss on rest: https://www.arxiv.org/pdf/2408.10867
- Glickman and Stern style spread error: https://arxiv.org/pdf/1211.4000
- Review of ML sports prediction: https://arxiv.org/pdf/2410.21484
- Levitt on betting markets: https://www.nber.org/system/files/working_papers/w9422/w9422.pdf
- ESPN FPI guide: https://global.espn.com/blog/statsinfo/post/_/id/123048/a-guide-to-nfl-fpi
- Home field: https://www.covers.com/nfl/home-field-advantage
- Turnover randomness: https://harvardsportsanalysis.org/2014/10/how-random-are-turnovers
- The Odds API: https://the-odds-api.com
- Open-Meteo pricing and licence: https://open-meteo.com/en/pricing
