# Workstreams and Ownership

Integration branch: `worktree-nfl-universe` (worktree `.claude/worktrees/nfl-universe`). `main` is left alone: a daily data refresh commits there, and nothing merges into it without the owner's approval.

## Planned workstreams

| Workstream | Primary owner (`.claude/agents/`) | Typical scope | Depends on |
|---|---|---|---|
| Orchestration / architecture | orchestrator | Planning, contracts, decisions, integration | Repository audit |
| Data platform | data-engineer | Adapters, schemas, entities, provenance, storage | Source research |
| NFL intelligence | intelligence | News, injuries, rosters, transactions, coaching | Canonical entities |
| Live game | live-game | Game state, play-by-play, live metrics | Data platform |
| Analytics | analytics | Efficiency, power ratings, matchup analysis | Historical/normalized data |
| Simulation | simulation | Forecasts, playoffs, counterfactuals, red team | Analytics + data quality |
| Frontend | frontend | Command center, map, panels, timelines, alerts | API contracts |
| AI | ai-engineer | Retrieval, assistant, tools, claim verification | Data/intelligence APIs |
| Media | media | Authorized media discovery, embeds, transcripts | Legal/source research |
| QA / security | qa + red-team | Regression, data quality, adversarial review | All workstreams |

## Current streams (milestone 1: foundations and first command center)

Each write-capable stream has its own git worktree and branch, owns a fixed set of files, and is merged by the orchestrator only after its tests pass on the merged result. Read-only streams write nothing; the orchestrator files their findings.

| ID | Stream | Agent | Worktree / branch | Owns (writes) | Interface it builds on | Tests it must pass | Status |
|---|---|---|---|---|---|---|---|
| WS0 | Contracts and build | orchestrator | integration branch | `lib/contract.js`, `shared/teams.json`, `docs/DATA_MODEL.md`, `scripts/build.py` (assembly), template markers | Audit, source probes | `npm test`; fixture validates | Done |
| WS1 | Data fabric | orchestrator (as data-engineer) | integration branch | `lib/fabric/**`, `server.js`, `scripts/fabric-snapshot.js`, `test/fabric.test.js`, `test/fixtures/espn/`, `data/fabric/` | `lib/contract.js` | contract validation of real and fixture output; breaker and failure tests | In progress |
| WS2 | Command-center interface | frontend | own worktree and branch | `src/universe/**`, shell markup and simulator deferral in `src/template.html`, `scripts/gen_geo.py`, `test/universe.test.js` | `lib/contract.js`, `test/fixtures/universe.sample.json`, engine globals | `npm test`; page parses; headless render at desktop and phone width | Running |
| WS3 | Open-source, terms and media research | researcher (read-only) | none | nothing | none | sources cited | Done |
| WS4 | MCP server | data-engineer or ai-engineer | own worktree and branch | `mcp/**`, `test/mcp.test.js`, `docs/MCP_ARCHITECTURE.md` | `lib/fabric` exports, engine | protocol round-trip tests | Waiting on WS1 |
| WS5 | Review | qa + red-team (read-only) | none | nothing | merged branch | | Waiting |

## Ordering

```
WS0 contracts ──┬── WS1 fabric ───────────┬── WS4 MCP ──┐
                ├── WS2 interface ────────┤             ├── integrate ── WS5 review ── fixes ── docs
                └── WS3 research (read) ──┘             │
```

WS1 and WS2 run at the same time because both build against `lib/contract.js` and `test/fixtures/universe.sample.json`, not against each other.

## Interface rule
Before parallel implementation, the orchestrator documents the API/schema/interface contract and names the workstream that owns each shared file. For milestone 1 the contracts are `lib/contract.js` (the `/api/universe` payload), `shared/teams.json` (entities) and the engine's globals (`simulate`, `GAMES`, `TM`, `RATE`, `RATE2`, `RATEL`, `RATEE`, `modelView`, `baseProb`, `D`).
