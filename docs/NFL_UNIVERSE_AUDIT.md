# NFL Universe — Existing Project Audit

> Completed from repository evidence on Nov. 21, 2026. Where something could not be checked, it says so.

## Repository overview
- Root: `nfl-playoff-simulator` (GitHub `madramdesign/nfl-playoff-simulator`).
- Branch / commit at audit: `main` at `9874545` ("Daily data refresh"), clean, level with `origin/main`. NFL Universe work: branch `worktree-nfl-universe`.
- Languages/frameworks: plain JavaScript (browser, and Node 18+ with no npm packages), Python 3 standard library for the data build, numpy for the offline evaluation scripts only. No framework, no bundler, no TypeScript.
- Apps/packages: one page (`src/template.html` built to `public/index.html`, about 80 KB of code plus data) and one small server (`server.js`).
- Database/storage: none. Flat JSON in `data/`: dated forecast snapshots, curated news, pick owners, model report, FantasyPros output folder (empty).
- External services: nflverse release files and `nfldata` games file, nfelo quarterback values (GitHub raw), ESPN scoreboard (live, through `server.js`), FantasyPros API (GitHub Actions only), Google Fonts.
- Deployment: the built page is published as a static page; `.github/workflows/fantasypros.yml` runs daily on GitHub. `CLAUDE.md` says a scheduled task runs `npm run refresh` daily and commits; no such task is registered in this desktop app's scheduler (checked Nov. 21), so it runs somewhere else. Where it runs is an open question for the owner.

## Subsystem status

| Subsystem | Status | Evidence |
|---|---|---|
| Season Monte Carlo, bracket, draft order | EXISTS | `simulate()` in the engine; invariants in `test/run.js` |
| NFL tiebreakers | PARTIALLY EXISTS | Three rare steps skipped (documented) |
| Team ratings (spread, results, EPA, Elo, quarterback adjustment) | EXISTS | `scripts/build.py`; backtested in `scripts/backtest*.py`, `docs/MODELS.md` |
| Backtesting and calibration | EXISTS (offline) | `scripts/evaluate.py` writes `data/model_report.json`; needs numpy and several seasons of files |
| Reasoning, sensitivity, what-if, narrative tests | EXISTS | `whyPanel`, strength slider, "Popular claims, tested" |
| Odds | PARTIALLY EXISTS | One closing line per game from nflverse, no timestamps, no line movement |
| Live scores | PARTIALLY EXISTS | `server.js` `/api/live`; parser checked against the real ESPN scoreboard on Nov. 21 (pre and post games parse correctly); in-progress games not yet observed |
| News | PARTIALLY EXISTS | Four hand-curated items in `data/news.json`, ticker, news-effect estimate |
| Injuries | PARTIALLY EXISTS | Quarterback injury-report flags only (nflverse injuries) |
| Rosters, depth charts, transactions | MISSING | |
| Weather | MISSING | Wind and cold only as tested narratives in the backtest |
| Command center, map, layers, panels, URL state | MISSING | In progress (WS2) |
| Source registry, freshness, health | MISSING | One build date on the page |
| Circuit breakers and caching | PARTIALLY EXISTS | `server.js`: 15-second cache, "stale" flag on failure |
| Event store, point-in-time record | PARTIALLY EXISTS | Daily forecast snapshots in `data/snapshots/`; no event log |
| Prediction history | PARTIALLY EXISTS | Snapshots keep playoff, division and Super Bowl odds plus lines per day; no model version field |
| AI / language model | MISSING | `docs/AGENT_SYSTEM.md`: nothing in the product uses a model |
| Agents in the product, MCP | MISSING | |
| Sleeper | MISSING | No code, data or docs mention it |
| FantasyPros | PARTIALLY EXISTS | Fetch script and workflow written; never ran against the real API (`data/fantasypros/` holds only `.gitkeep`) |
| Authentication | Not needed today | No user accounts or stored personal data |
| Tests | PARTIALLY EXISTS | Engine invariants and feed parser; no interface, source or failure-mode tests |
| Documentation | EXISTS, partly OUTDATED | Extensive; `ARCHITECTURE.md` predates NFL Universe |
| Duplicated logic | DUPLICATED | Rating fits implemented in both `build.py` and `evaluate.py` (known debt) |

## Existing NFL functionality

| Feature | Location | Current behavior | Tests | Preserve/migrate/retire |
|---|---|---|---|---|
| Pick-the-games simulator | `src/template.html` interface script | Picks per game, standings rebuild, playoff odds | Engine only | Preserve as the `sim` view |
| Three odds modes | `setMode` | Sportsbooks, results, blend | Blend uses posted line | Preserve |
| Playoff picture, seed grid, bracket odds, draft order | Interface script | From `simulate` | Engine totals | Preserve; reuse in team panels |
| What changed | Interface script | News, line moves, movers since last snapshot | Snapshot shape | Preserve; feed the command center's "what changed" |
| Live scores | `server.js` and page poll | In-game chance from margin, time, pregame line | Parser fixture | Preserve; the fabric adds a second consumer |
| Model report and claims | `data/model_report.json` | Backtest tables on the page | Consistency checks | Preserve |
| Daily refresh and snapshots | `npm run refresh` | Rebuild, test, snapshot | Runs tests | Preserve; add the fabric snapshot as a non-fatal step |

## Architecture
- Frontend: one HTML page; engine script (pure functions over the `D` blob) plus an interface closure. Static-first: works from `file://`.
- Backend/API: `server.js`, a static file server plus `/api/live`.
- Data ingestion: `scripts/build.py` at build time; `server.js` at run time for scores.
- Database/schema: none; the `D` blob is the contract (`docs/DATA_SOURCES.md`).
- AI/LLM: none.
- Authentication/authorization: none.
- Background jobs: daily refresh (location unknown), FantasyPros workflow (GitHub Actions).
- Observability: console logs only.

## Commands and baseline

| Command | Purpose | Result (Nov. 21, 2026) |
|---|---|---|
| `npm test` | Engine invariants and feed parser | Pass ("Giants playoff odds 68%") |
| `python3 scripts/build.py --reuse` | Re-render without downloads (added this session) | Pass |
| `node -e` with `normalize()` on the real ESPN scoreboard | Live parser check | 13 games parsed, all teams resolved |
| `npm run build` | Full rebuild with downloads | Not run this session (the daily refresh already ran on `main`) |
| `scripts/evaluate.py` | Backtest report | Not run (needs numpy and season files) |

## Risks and gaps
- Single-file interface code: adding a command center to one closure would be unmaintainable. Mitigated by `src/universe/` modules inlined at build.
- Unofficial ESPN endpoints carry the live layer. They can change without notice, and ESPN's terms do not grant automated use. Mitigated by circuit breakers, last-good caches, slow polling and a per-source health view, not eliminated.
- Model constants were tuned in-sample (`docs/BACKTESTING.md`); the hold-out score is worse. New descriptive indexes must not be presented as validated predictors.
- The prompt's assumption of an existing Sleeper integration is wrong for this repository. If a Sleeper or fantasy project exists elsewhere, it is not in this repository.
- The daily refresh commits to `main`; NFL Universe must not collide with it (hence the separate branch).

## Recommended incremental path
1. Contracts first: team entities, the `/api/universe` payload validator, a fixture (done).
2. Data fabric behind circuit breakers, serving `/api/universe` and a daily snapshot embedded in the static page.
3. Command center as a new default view; the simulator kept whole as a second view.
4. MCP server over the same fabric and engine.
5. Then, in order: point-in-time event history, injury and weather models only with backtests, multi-book odds (needs the owner's call on a key), a language-model brief (needs the owner's call on a provider and cost), media center.
