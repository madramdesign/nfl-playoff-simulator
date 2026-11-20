# Playoff predictor audit

Audit date: Nov. 20, 2026. Scope: the whole repository, measured against the "adversarial playoff prediction engine" brief.

## Bottom line

The project is a working, tested, single-page season simulator with a small backtesting toolkit. It already covers the brief's simulation core (sections 5, 17, 18, 36) and, after this pass, the first layer of adversarial features (sections 3, 14, 15, 16, 24, 25, 38). It has no database, no player-level data, no multi-book odds, no line history and no agents. Most of those gaps are data-access problems, not engineering ones.

## Existing architecture

| Layer | Where | What it does |
|---|---|---|
| Data build | `scripts/build.py` (standard-library Python) | Downloads nflverse files, fits ratings, writes one JSON blob into the page |
| History | `scripts/history.js` (Node) | Reruns the page's engine on past weeks for the odds-by-week chart |
| Engine | `<script id="engine">` in `src/template.html` | Monte Carlo season, tiebreakers, bracket, draft order. No DOM access |
| Interface | second script in `src/template.html` | Picks, standings, charts, reasoning panels |
| Evaluation | `scripts/evaluate.py`, `backtest.py`, `backtest_adjustments.py` (numpy) | Point-in-time backtest, calibration, analogs, narrative tests |
| Live scores | `server.js` | Static server plus `/api/live`, a trimmed copy of ESPN's scoreboard feed |
| Tests | `test/run.js` | Engine invariants and feed parser |

Everything ships as one static HTML file (about 80 KB). There is no backend state.

## Existing data sources

| Source | Used for | Notes |
|---|---|---|
| nflverse `games.csv` | Schedule, scores, closing spread, moneyline, total, rest, roof, wind, temperature, starting QB | One book's line per game, no timestamps |
| nflverse weekly team stats | EPA, fumbles | Updated nightly |
| nflverse injuries | Quarterback flags only | Practice and game status |
| `data/pick_owners.json` | Traded first-round picks | Hand-maintained |
| ESPN scoreboard (unofficial) | Live scores in `server.js` | Never verified against the real feed from the build sandbox |

## Existing prediction capabilities

- Three views of team strength: sportsbook-spread ratings, results ratings (opponent-adjusted scoring margin with fumble luck removed, plus EPA), and an even blend. A posted moneyline overrides ratings for that game.
- 8,000 simulated seasons per run; picks and what-if strength changes feed straight in.
- NFL tiebreakers through strength of schedule, then simulated scores for the points steps.
- Playoff bracket to the Super Bowl, seed odds, draft order with traded picks, schedule strength, clinch and elimination flags.
- Elo as a displayed second opinion.

## Existing odds capabilities

Vig removal from two-way moneylines, market-implied ratings fitted to spreads, model-against-line comparison per game. No futures, props, alternate lines, multiple books or line movement.

## Existing tests

Fourteen playoff teams and eight division winners per season, bracket round counts, draft picks 1 to 32 used once, kickoff live probability equals the pregame line, feed parsing. No UI tests in the repository (the page was checked with jsdom and headless Chrome during development, but those scripts are not committed).

## Gap analysis against the brief

| Brief section | Status | Comment |
|---|---|---|
| 1 Audit | Done | This file |
| 2 Research | Done | `RESEARCH_PLAYOFF_PREDICTOR.md` |
| 3 Bull/bear case, assumptions | Partial | Per-game "what could make this wrong", generated from model inputs |
| 4 Ensemble A (Elo), B (efficiency), F (opponent-adjusted), H (simulation), I (market), J (weights from validation) | Done | Weights and what was rejected are in `MODELS.md` |
| 4 Ensemble C (situational), E (recent form) | Tested, rejected | Rest and recency weighting did not improve out-of-sample prediction |
| 4 Ensemble D (injuries), G (matchups) | Not built | Needs player-value data; see roadmap |
| 4 H at 100,000+ simulations | Not done | 8,000 per interactive run in a phone browser; the sampling error is about half a point. A batch job could run more |
| 5 Bracket with path dependency | Done | Seeds and bracket are simulated together |
| 6 Factor framework | Partial | Every adopted or rejected factor has a measured effect and sample size |
| 7 Weather | Partial | Wind and cold tested as narratives; no forecast feed |
| 8 Coaching, 9 matchup matrix | Not built | No defensible free data; high overfitting risk |
| 10 Odds engine | Partial | One line per game; edge shown as disagreement, never as a bet |
| 11 Market disagreement | Partial | Conflict flag and reasons from data on hand; cannot see news |
| 12 Line movement | Not built | No timestamped odds source in use |
| 13 Historical analogs | Partial | By spread size and home/road favorite since 2010 |
| 14 Counterfactuals | Partial | Team-strength slider and game picks. No per-player or weather what-ifs |
| 15 Sensitivity | Done (basic) | Strength, model choice, biggest game |
| 16 Model disagreement | Done | Per game, with a caveat: disagreement only weakly predicted error in the backtest |
| 17 Calibration, 18 backtesting | Done | Point-in-time, 2021-2025; leakage notes in `BACKTESTING.md` |
| 19-20 Data quality and confidence scores | Minimal | Build date shown; no per-datum freshness or numeric confidence |
| 21 AI red team, 28-29 agents | Not built | Rule-based challenges only; see `AGENT_SYSTEM.md` |
| 22 Team reports, 23 bracket UI, 33 multi-page dashboard | Partial | One page with a team selector; no bracket diagram |
| 24 Why, 25 Prove it wrong | Done | Same panel, from real inputs |
| 26 What changed | Partial | Odds-by-week chart; no factor-by-factor attribution |
| 27 Automation | Not built | Blocked: scheduled runs need the code in a repository |
| 30 Traceability | Partial | Per-game build-up of the number; no link back to raw rows |
| 31 Versioning, 32 database | Not built | Git history is the only versioning |
| 34 Risk labels | Partial | Agreement, conflict and no-line chips |
| 35 Probability language | Done | |
| 36 Ablation, 37 feature importance | Done for what exists | `evaluate.py` |
| 38 Narrative tests | Done | Eight claims |
| 40 Responsible betting framing | Done | No bet recommendations anywhere |

## Technical debt

1. One 80 KB template holds engine, interface and styles. It works, but the interface script has outgrown a single closure.
2. Model constants were tuned on the same seasons used to score them (see `BACKTESTING.md`).
3. `evaluate.py` and `build.py` each implement the rating fits. They agree today; nothing enforces it.
4. UI checks are not in the repository.
5. Live feed and scheduled refresh are unverified or blocked outside this sandbox.
6. Clinch flags are conservative sufficient conditions. nflseedR validates its clinching against official flags for 2006-2025 and would make a good oracle.

## Recommended architecture

Keep the static page and the pure engine. Add, in this order:

1. A repository and a daily scheduled rebuild. Everything else depends on data arriving without a person.
2. Snapshots: write each build's inputs and outputs to dated JSON files. That gives versioning, "what changed" and honest out-of-sample tracking of this season's forecasts for free.
3. A quarterback adjustment, the one factor every serious public system models. It needs a starter-value source.
4. A timestamped odds source with several books, for consensus lines, futures and line movement.
5. Only then a database, and only if the snapshots outgrow flat files.

## Migration strategy

No migration is needed for steps 1 to 3: they add files and build steps without changing the page contract (`D` blob in, static HTML out). A database or an API server would be a new deployment target and should wait until there is a reason.
