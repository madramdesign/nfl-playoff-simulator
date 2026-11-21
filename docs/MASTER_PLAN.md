# NFL Universe — Master Plan

## Product vision
An NFL intelligence command center inspired by the information architecture and situational-awareness experience of World Monitor. It should extend the existing NFL playoff simulator in this repository (which has no Sleeper integration yet; see `NFL_UNIVERSE_AUDIT.md`) and combine trusted data, live game context, news, rosters, injuries, analytics, forecasting, simulations, media analysis, and an AI research assistant.

## Product principles
1. Accuracy and provenance before breadth.
2. Extend existing working code; avoid unnecessary rewrites.
3. Clearly distinguish confirmed facts, reported claims, calculations, and forecasts.
4. Show freshness, uncertainty, and source disagreement.
5. Use lawful, authorized data and media.
6. Make the system useful even when some providers are unavailable.

## Command-center experience
Explore a map-centric or equivalent spatial command center with:
- NFL teams, stadiums, divisions, and conferences;
- live/upcoming/final games;
- news, injuries, transactions, weather, and roster movement;
- team power, momentum, volatility, playoff odds, and model disagreement;
- a live intelligence feed, alerts, timeline, and game ticker;
- filters/layers and time-range controls.

The UI must be adapted to the current stack and user workflows. A map is a product concept, not a mandate to introduce an unsuitable mapping dependency.

## Core domains
- Data platform: providers, adapters, canonical entities, event store, entity resolution, provenance, caching, freshness, quality.
- Team/player universe: teams, players, coaches, stadiums, rosters, depth charts, injuries, transactions, contracts/cap where legally and reliably sourced.
- News intelligence: national/local/beat/official reporting, claim extraction, source reliability, entity linking, corroboration, event timelines.
- Live game center: score, clock, possession, down/distance, field position, drives, play-by-play, key events, weather, and verified derived metrics.
- Analytics: team/player efficiency, opponent adjustments, matchup analysis, team power, momentum, volatility.
- Forecasting: game predictions, team trajectories, division/seed/playoff/Super Bowl probabilities, calibration, historical backtesting.
- Simulation: Monte Carlo season/playoff scenarios, counterfactuals, sensitivity analysis, chaos/what-if exploration.
- Market context: odds and line movement only from verified permitted sources; no-guarantee language; compare market-implied probabilities with model outputs.
- Media: authorized streams/embeds, press conferences, podcasts, permitted transcripts/captions, claim tracking.
- AI assistant: grounded NFL Q&A, “What is happening?”, “What changed?”, “What matters?”, “What am I missing?”, and “Prove this wrong.”
- Integrations: Sleeper and other providers only within documented permissions; consequential actions require user confirmation.

## Intelligence workflows
- Correlate news → player/team → injury/roster → game → analytics/forecast → playoff implications.
- Explain what changed over selectable time windows.
- Show bull case, bear case, weakest assumption, contradictory evidence, and what would change the assessment.
- Track forecasts over time and evaluate calibration.
- Make uncertainty and missing coverage visible.

## Data source research
Create and maintain `docs/NFL_DATA_SOURCE_REGISTRY.md`. Verify official docs, terms, pricing, rate limits, coverage, historical depth, update cadence, attribution, and redistribution rights for each source. Research official NFL sources, ESPN, nflverse, Sleeper, reputable sports data providers, weather providers, odds providers, RSS/news sources, team sites, and official media channels. Do not assume all are usable or free.

## World Monitor reference
Study `https://github.com/koala73/worldmonitor` as a reference use case for architecture and interaction patterns. Inspect its current license and all relevant components before any reuse. It is AGPL-3.0 according to the initial project research; re-verify the current repository license and obligations. Do not copy code or assets unless the project explicitly chooses a compliant reuse strategy. A clean-room implementation inspired by high-level patterns may be preferable.

## Suggested delivery phases
0. Repository audit and preservation plan.
1. World Monitor architecture and licensing analysis.
2. Data-source and legal/terms research.
3. Canonical data model, contracts, and architecture decisions.
4. Reliable ingestion, normalization, entity resolution, provenance, and quality.
5. Core NFL team/player/roster/injury/transaction universe.
6. News intelligence and event correlation.
7. Live game center and verified game-state pipeline.
8. Analytics and team/player metrics.
9. Forecasting, backtesting, and model disagreement.
10. Playoff/season simulations and counterfactuals.
11. Command-center UI, timelines, filters, alerts, and search.
12. AI assistant, retrieval, claim verification, and red-team workflows.
13. Authorized media center.
14. Performance, security, observability, deployment, and operational readiness.

Phases may overlap only when dependencies and interfaces are documented.

## Acceptance criteria
- Existing project functionality is preserved or migrated with explicit tests.
- Data sources have documented terms and provenance.
- Canonical entities and events have validation and identity-resolution tests.
- UI shows loading, empty, error, stale, and partial-data states.
- Forecasts are reproducible, backtested, and uncertainty-aware.
- Media usage is authorized and compliant.
- AI outputs are grounded, cite sources, and distinguish fact from inference.
- Automated checks and critical end-to-end flows pass.
- Current state and decisions are documented.


## Phase status (Nov. 21, 2026)

| Phase | Status | Where |
|---|---|---|
| 0. Repository audit and preservation plan | Done | `NFL_UNIVERSE_AUDIT.md` |
| 1. World Monitor architecture and licensing | Done | `WORLDMONITOR_ARCHITECTURE_ANALYSIS.md`, `OPEN_SOURCE_LICENSE_DECISION.md` |
| 2. Data-source and terms research | Done: endpoints verified, terms read, open-source projects, odds and official media surveyed. ESPN's JSON is not licensed for automated use (DEC-006, owner decision) | `NFL_DATA_SOURCE_REGISTRY.md`, `GITHUB_RESEARCH.md` |
| 3. Canonical data model, contracts, architecture decisions | Done for teams, games, events, injuries, transactions; players not yet canonical | `DATA_MODEL.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `lib/contract.js`, `shared/teams.json` |
| 4-14 | Not started as features. Two pieces were begun before the owner asked to finish planning first and are parked: fabric scaffolding (uncommitted in the integration worktree) and the command-center interface (frontend agent's branch, unmerged) | `CURRENT_STATE.md` |

## Dependency plan

Milestones are ordered by dependency. Inside a milestone, items marked "parallel" can run in separate worktrees at the same time because they touch different files and meet only at a contract that already exists. Agent names refer to `.claude/agents/`.

```
M0 Foundations (done except terms research)
 └─► M1 Data fabric ──────────────┬─► M3 Command center ──┬─► M5 Intelligence depth ──► M7 AI assistant
      (contracts exist)           │    (parallel with M1   │    (injuries, depth charts,       (owner picks
                                  │     against fixture)    │     corroboration, alerts)        provider)
                                  └─► M2 MCP server         └─► M6 Live game center
                                       (needs M1 exports)        (needs M1 game feed)
 M4 Model validation for new factors ── runs beside everything; gates any factor entering the forecast
 M8 Media center ── needs M0 media research only; independent of M1-M7
```

| Milestone | Work items | Owner (agent) | Depends on | Parallel with | Acceptance criteria |
|---|---|---|---|---|---|
| M0 Foundations | Audit, World Monitor study, license decision, source verification, contracts, operating system | orchestrator, researcher | none | | Docs complete; terms research filed; owner approves the plan |
| M1 Data fabric | Adapters for permitted sources (nflverse daily files, Open-Meteo, ESPN and Yahoo RSS under DEC-012, Sleeper state and trends, curated news); ESPN JSON adapters only if the owner picks DEC-006 option 1, and then local-only; breakers and last-good cache; event assembly with `ts`/`seenAt`; `/api/universe`, `/api/health`, `/api/game`, `/api/team`; daily snapshot embedded in the page; failure-mode tests | data-engineer (+ intelligence for news rules) | M0 | M3 | Real payload passes `validateUniverse`; each source can fail alone in tests; static page shows snapshot age |
| M2 MCP server | stdio JSON-RPC server, read-only tools (games, injuries, news, odds, weather, standings, playoff odds, run simulation, what changed, health), each answer with source and age | ai-engineer | M1 exports | M3 | Protocol round-trip tests; no tool can write or fetch an arbitrary URL |
| M3 Command center | Views (universe, simulator); layer registry; URL state; time range; map modes; feed; team and game panels; health panel; rule-based brief; simulation in a worker | frontend | contracts (M0) | M1, M2 | `npm test`; renders from fixture, live API and no server; phone width; simulator unchanged |
| M4 Model validation | Backtests for any proposed factor (injury burden, weather, rest, travel); calibration tracking of this season's snapshots against results | analytics, simulation | historical data (exists) | all | Factor enters the forecast only with an out-of-sample gain, recorded in `scripts/evaluate.py` |
| M5 Intelligence depth | Starter-aware injury weights from depth charts; status-change events; source disagreement display; watchlist and in-page alerts; what-changed across time windows | intelligence, frontend | M1, M3 | M6 | Conflicting reports shown side by side; alert dedupe and cooldown tested |
| M6 Live game center | Live situation, win-probability series, scoring timeline, in-game model check against ESPN's | live-game | M1 | M5 | Verified during a real game window; outage and clock edge cases tested |
| M7 AI assistant | Grounded answers over the fabric with citations; "What am I missing?", "Prove this wrong" | ai-engineer, red-team | M1-M5 and an owner decision on provider and cost | | Evaluations for unsupported claims, stale context, conflicting sources, prompt injection in retrieved text |
| M8 Media center | Official YouTube embeds and links, official podcasts; claim tracking later | media | M0 media research, owner review of embed terms | M1-M7 | Only authorized embeds or links; nothing proxied or downloaded |
| M9 Hardening | Performance budget, security review, time machine replay from `seenAt`, deployment of the server (where it runs is an owner decision) | qa, red-team, orchestrator | M1-M6 | | Review findings closed or accepted by the owner |

### Owner decisions that gate later milestones
1. Approve this plan and the clean-room license decision (gates M1-M3 restarting).
2. ESPN's JSON endpoints (DEC-006): personal local use with nothing published, permitted sources only, or a licensed feed. Decides how live M1, M5 and M6 can be.
3. Language-model provider and monthly cost ceiling, or none (gates M7).
4. A keyed odds source for multi-book lines and futures (free tier or paid), or none (affects M5 market panels).
5. Where the server runs, if anywhere beyond your machine (gates live data for anyone but you).
6. Whether the integration branch may merge into `main` once milestone 1 passes review.

## Milestone 1 acceptance (M1 + M3)
- The command center opens by default, shows all 32 teams, this week's games with lines and weather flags, a unified feed of injuries, transactions, headlines and line moves, and per-source freshness. How current the injuries, transactions and line moves can be depends on DEC-006 (with permitted sources only they come from nflverse's daily files).
- It still works with no server (static snapshot, labelled with its age) and with any one source down.
- Every simulator feature is still reachable and `npm test` passes.
- The `/api/universe` payload from real sources passes `validateUniverse`.
