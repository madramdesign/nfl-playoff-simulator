# GitHub and open-source research

Research stream WS3, Nov. 21, 2026. Stars and last-push dates from read-only GitHub queries that day. The nflverse and ffverse R packages show "Other" on GitHub; their `DESCRIPTION` files say `MIT + file LICENSE`. Terms-of-use findings are in [NFL_DATA_SOURCE_REGISTRY.md](NFL_DATA_SOURCE_REGISTRY.md); this page covers projects and odds sources.

Reuse key: **Data** = use as a data source. **Ref** = read for design or endpoint details. **Code** = copy code with its license notice. **Avoid**.

License rule for this project: MIT, Apache and CC-BY material is usable with its notice. GPL and AGPL code is not copied: the page is published as a static file, which distributes its JavaScript. Repositories with no license are reference only.

## Projects

| Project | License | Stars / last push | Useful to NFL Universe | Risks | Reuse |
|---|---|---|---|---|---|
| [nflverse/nflverse-data](https://github.com/nflverse/nflverse-data) | CC-BY-4.0 | 448 / 2026-11-01 | Release files already used by the build | Underlying NFL data owners keep their rights | Data |
| [nflverse/nfldata](https://github.com/nflverse/nfldata) | none | 381 / 2026-11-21 | The games file the build reads, including lines | No license; the lines' source and timing (open or close) are not documented | Data, with credit |
| [nflverse/nflreadpy](https://github.com/nflverse/nflreadpy) | MIT | 252 / 2026-10-30 | Release URLs, dataset list, caching approach | Needs polars and pydantic, so not usable directly in the stdlib build | Ref; small code with notice |
| [nflverse/nflreadr](https://github.com/nflverse/nflreadr) | MIT | 117 / 2026-09-17 | Field dictionaries for every dataset (`data-raw/dictionary_*.csv`) | R | Ref |
| [nflverse/nfl_data_py](https://github.com/nflverse/nfl_data_py) | MIT | 442 / archived 2025-09-25 | Superseded by nflreadpy | Archived | Avoid |
| [nflverse/nflfastR](https://github.com/nflverse/nflfastR) | MIT | 558 / 2026-11-20 | Expected-points and win-probability models; the win-probability model uses timeouts, down, distance, second-half kickoff and the spread ([write-up](https://www.opensourcefootball.com/posts/2020-09-28-nflfastr-ep-wp-and-cp-models/)). Addresses the simulator's known gap: the in-game model ignores possession and timeouts | R and xgboost; would need refitting here and a backtest | Ref |
| [nflverse/nflseedR](https://github.com/nflverse/nflseedR) | MIT | 35 / 2026-11-16 | Season simulator whose [tiebreaker reference](https://nflseedr.com/articles/tiebreaker.html) documents the three steps this engine skips (net points in common games, conference games, net touchdowns); clinching validated against official flags | Code not compared with its docs yet | Ref; port with attribution |
| [ffverse/ffscrapr](https://github.com/ffverse/ffscrapr) | MIT | 97 / 2024-11-01 | Clients for Sleeper, ESPN, MFL, Fleaflicker | Quiet since 2024 | Ref |
| [dynastyprocess/data](https://github.com/dynastyprocess/data) | GPL-3.0 | 115 / 2026-11-21 | Player-id crosswalk (ESPN, Sleeper, GSIS and more): the missing piece for canonical players | GPL applied to data is unclear; some fields derive from FantasyPros | Data with caution, kept as a separate file; owner decision before use |
| [sportsdataverse/sportsdataverse-js](https://github.com/sportsdataverse/sportsdataverse-js) | MIT | 89 / 2026-11-21 | JavaScript wrapper over ESPN endpoints | npm dependencies; ESPN terms still apply | Ref |
| [aaronweldy/espn-openapi](https://github.com/aaronweldy/espn-openapi) | none | 18 / 2026-09-07 | OpenAPI specs and sample responses for ESPN endpoints | No license | Ref |
| [akeaswaran ESPN gist](https://gist.github.com/akeaswaran/b48b02f1c94f873c6655e7129910fc3b), [nntrn NFL gist](https://gist.github.com/nntrn/ee26cb2a0716de0947a0a4e9a157bc1c) | none | gists, updated Nov. 2026 | Community catalogues of ESPN endpoints, including an odds-movement path | Unofficial | Ref |
| [dtsong/sleeper-api-wrapper](https://github.com/dtsong/sleeper-api-wrapper) | MIT | 102 / 2026-11-21 | Every Sleeper endpoint | | Ref |
| [gtonic/nfl_mcp](https://github.com/gtonic/nfl_mcp) | MIT | 28 / 2026-11-21 | NFL MCP server over ESPN, Sleeper, nflverse, Open-Meteo; scheduled CI check that alerts when a source changes shape | Fantasy-focused; Python and Docker | Ref for MCP tool design and source-drift checks |
| [cyanheads/sports-mcp-server](https://github.com/cyanheads/sports-mcp-server) | Apache-2.0 | 2 / 2026-11-20 | Reports failed sources inside answers (`unavailableSources`) and pages results | Young | Ref for MCP answer shapes |
| [greerreNFL/nfelo](https://github.com/greerreNFL/nfelo) | custom | 66 / 2026-11-21 | Ratings and quarterback values; outputs may be republished with credit | License forbids running, importing or modifying the code | Data (already used); Avoid code |
| [LordOfTheSnow/nfl-playoff-rankings-mc-sim](https://github.com/LordOfTheSnow/nfl-playoff-rankings-mc-sim) | GPL-3.0 | 2 / 2026-11-17 | Browser playoff Monte Carlo with tiebreakers: the closest project to ours | GPL | Ref only; compare outputs |
| [vasqued2/ha-teamtracker](https://github.com/vasqued2/ha-teamtracker) | GPL-3.0 | 396 / 2026-10-14 | Mature live-game state handling on ESPN data | GPL | Ref only |
| [jclarke0000/MMM-MyScoreboard](https://github.com/jclarke0000/MMM-MyScoreboard) | MIT | 76 / 2024-07-18 | Plain-JavaScript scoreboard | Inactive | Ref |
| [nflverse/nflverse-injurybot](https://github.com/nflverse/nflverse-injurybot) | MIT-style | 1 / 2025-02-10 | Injury-report posting bot | Minimal | Ref |
| [AndrewRook/NFLWin](https://github.com/AndrewRook/NFLWin) | MIT | 24 / 2023-07-06 | Early open win-probability model | Stale | Ref |
| [JacobiusMakes/odds-api-benchmarks](https://github.com/JacobiusMakes/odds-api-benchmarks) | MIT | 1 / 2026-11-16 | Stdlib probes and a free-tier comparison of six odds APIs | Maintained by a competing vendor's founder (disclosed) | Ref |
| [BurntSushi/nflgame](https://github.com/BurntSushi/nflgame) | Unlicense | 1,313 / 2019-10-23 | Old NFL GameCenter client | Inactive; feed's existence not verified | Avoid |

Gaps: no maintained open-source NFL news aggregator or injury tracker was found. `pseudo-r/Public-ESPN-API`, often cited, no longer resolves; its owner now keeps per-league repositories without a license.

## Odds sources

| Source | Auth | Free limits | Line history | Terms for this project |
|---|---|---|---|---|
| [The Odds API](https://the-odds-api.com/) | key | 500 credits a month; one NFL call for moneyline, spread and total in one region costs 3, so about 166 pulls a month | Historical snapshots from June 2020 on paid plans only | [Terms](https://the-odds-api.com/terms-and-conditions.html) allow showing and storing the data in an app; re-serving it as a raw feed or API is not allowed |
| [TheRundown](https://therundown.io/pricing/api) | key | 20,000 data points a day, 3 books, 5-minute delay | Paid plans | Free tier is for internal or personal display; a public page needs a paid plan |
| [SportsGameOdds](https://sportsgameodds.com/pricing) | key | 2,500 objects a month, 9 books | Per-book open and close on some plans | Terms not verified |
| [OddsPapi](https://oddspapi.io/blog/free-odds-api-350-bookmakers/) | key | 250 requests a month | Historical endpoint on free tier, 3 books per call | NFL coverage and terms not verified |
| [SharpAPI](https://sharpapi.io/pricing) | key | 2 books, 60-second delay | Enterprise only | Not verified |
| ESPN (scoreboard and core API) | none | none stated | One book, open and current on the scoreboard; a community-documented movement endpoint returned 403 to the researcher | Disney Terms of Use bar automated access (see the registry) |
| nflverse games file | none | | One line per game, timing and source undocumented | Already used, with credit |
| Kalshi, Polymarket | none for market data | | Price-history endpoints | Prediction markets, not sportsbooks; NFL coverage and data terms not verified |
| Pinnacle | | Public API closed July 23, 2025 | | Not an option |

Conclusion: no free source gives multi-book line history for a public page. The cheapest workable route is The Odds API's free tier with our own snapshots (open, close and movement come from recording them). That needs a key, so it is the owner's decision.

## What this changes in the plan
- **Tiebreakers:** port the three skipped steps from nflseedR's documented procedure (MIT), with attribution and tests.
- **Live win probability:** refit a model in the nflfastR style (possession, timeouts, down, distance) only with a backtest, per the house rule.
- **Players:** a canonical player table needs an id crosswalk; the best candidate is GPL-licensed data, so it waits for an owner decision.
- **MCP:** follow gtonic/nfl_mcp's idea of a scheduled check that alerts when a source's shape changes, and cyanheads' habit of listing unavailable sources inside each answer.
