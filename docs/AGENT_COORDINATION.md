# Agent Coordination

## Operating protocol
The orchestrator is the single owner of task assignment, dependency tracking, review, and integration. Implementation agents use separate worktrees when working concurrently. Never assign overlapping file ownership. Agent definitions live in `.claude/agents/`, standing rules in `.claude/rules/`, the report format in [AGENT_HANDOFF_TEMPLATE.md](AGENT_HANDOFF_TEMPLATE.md), file ownership in [WORKSTREAMS.md](WORKSTREAMS.md), merges in [INTEGRATION_QUEUE.md](INTEGRATION_QUEUE.md).

Claude Code creates subagent worktrees from `main`. Every implementation agent first runs `git merge worktree-nfl-universe` in its own worktree (DEC-011).

## Active agents and worktrees
| Agent | Task | Branch | Worktree path | Owned paths | Dependencies | Status |
|---|---|---|---|---|---|---|
| Orchestrator (also data-platform) | NU-001 to NU-006 | `worktree-nfl-universe` | `.claude/worktrees/nfl-universe` | `docs/`, `CLAUDE.md`, `.claude/`, `lib/`, `shared/`, `server.js`, `scripts/build.py`, `scripts/fabric-snapshot.js`, `data/fabric/`, `test/` except files listed for others | None | Active |
| Researcher (World Monitor) | NU-002 | none (read-only) | none | none | NU-001 | Done; findings in `WORLDMONITOR_ARCHITECTURE_ANALYSIS.md` |
| Researcher (open source, terms, media) | NU-003b | none (read-only) | none | none; orchestrator filed `GITHUB_RESEARCH.md` and the registry | NU-001 | Done |
| Frontend | NU-007 | `worktree-agent-adaeb813e8038ab4d` | `.claude/worktrees/agent-adaeb813e8038ab4d` | `src/universe/**`, shell markup and simulator deferral in `src/template.html`, `scripts/gen_geo.py`, `test/universe.test.js`, `package.json` test script, `docs/AGENT_STATUS/WS2-frontend.md` | NU-004, plan approval (given) | Done, merged with review fixes |
| MCP | NU-008 | `worktree-agent-ad1ce008d0e55eb4f` | `.claude/worktrees/agent-ad1ce008d0e55eb4f` | `mcp/**`, `test/mcp.test.js`, `docs/MCP_ARCHITECTURE.md`, `docs/AGENT_STATUS/WS4-mcp.md` | NU-006 (done) | Done, merged |
| QA / red team | NU-009 | none (read-only) | none | none | NU-006 to NU-008 merged | Done |

## Task queue
| ID | Task | Priority | Owner | Dependencies | Acceptance criteria | Status |
|---|---|---|---|---|---|---|
| NU-001 | Audit existing repository | P0 | Orchestrator | None | Audit doc reflects actual repo | Done |
| NU-002 | Analyze World Monitor architecture/license | P0 | Researcher | NU-001 | Architecture and license decision documented | Done |
| NU-003 | Research NFL data sources | P0 | Orchestrator | NU-001 | Source registry has verified candidates and constraints | Done |
| NU-003b | Open-source projects, terms of use, odds and media sources | P1 | Researcher | NU-001 | `GITHUB_RESEARCH.md` with cited sources; registry terms filled | Done; raised DEC-006 for the owner |
| NU-004 | Define canonical contracts and dependency graph | P0 | Orchestrator | NU-001–003 | `shared/teams.json`, `lib/contract.js`, fixture, `DATA_MODEL.md`, `WORKSTREAMS.md` | Done |
| NU-005 | Merge the owner's bootstrap files | P0 | Orchestrator | None | Constitution, agents, rules and templates in the repository, filled with real content | Done |
| NU-006 | Data fabric: adapters, breakers, cache, events, `/api/universe`, snapshot | P0 | Orchestrator | NU-004, plan approval | Real output passes `validateUniverse`; failure-mode tests pass | Done (`de5c239`): real output from both scopes passes the contract; 21 tests |
| NU-007 | Command-center interface | P0 | Frontend | NU-004, plan approval | `npm test` passes; renders from fixture, live API and no server; phone width | Done, merged; interface review running |
| NU-008 | MCP server | P1 | MCP | NU-006 | Protocol round-trip tests; read-only tools with source and age | Done, merged |
| NU-010 | M8 media: contract, channel and podcast adapters | P1 | Orchestrator (data) | M1 | Real feeds pass the contract; failures named; tests fail on broken code | Done (`6ca8cb1`, `3cfc3b5`) |
| NU-011 | M8 media: remaining 15 team channel ids | P1 | Researcher | none | Each id verified against the channel's own feed | Done; rechecked by the orchestrator |
| NU-012 | M8 media: Media panel, click-to-load player, team and game video | P1 | Frontend | NU-010 contract | `npm test`; headless render; allowlisted embeds only | Done, merged; review fixes by the orchestrator |
| NU-013 | M8 review and browser check of real playback | P1 | QA, orchestrator | NU-010 to NU-012 | Blocking findings fixed | Done |
| NU-009 | Independent review of merged work | P1 | QA / red team | NU-006–008 | Blocking issues listed separately | Done: fabric and interface reviewed; all findings fixed |
| NU-014 | Feature research and roadmap (five read-only research streams, Nov. 23) | P1 | Orchestrator + researchers | none | `FEATURE_RESEARCH.md`, `FEATURE_BACKLOG.md`, `FEATURE_ROADMAP.md` | Done (docs only); implementation follows `FEATURE_ROADMAP.md` Phase 1 |

## Questions from the paused frontend work (answered Nov. 21 when NU-007 restarted)
| From | Question | Proposed answer |
|---|---|---|
| Frontend | Independent 100,000-season runs need different seeds, but `simulate` seeds its generator with a constant | Add an optional `seed` argument to `simulate` (default unchanged), with a test that the default output is identical; cleaner than rebinding `rng` inside the worker |
| Frontend | `main{display:flex}` overrides the `hidden` attribute | Add `[hidden]{display:none!important}` with the view switch |
| Frontend | A main-thread fallback simulation would include the simulator's what-if setting (`TWEAK`) | Save, clear and restore `TWEAK` around command-center runs |
| Frontend | `/api/game/<id>` has no field list | Define it in `DATA_MODEL.md` and `lib/contract.js` as the first step of NU-006 |
| Frontend | `D.news` items have a date and no time | Treat as start of day UTC; show the date only |
| Frontend | Default time range | 7 days (games are weekly) |
| Frontend | No fabric snapshot exists yet, so the static path is untestable | NU-006 writes `data/fabric/latest.json`; until then test with the fixture embedded in a scratch build |

## How a stream is dispatched and integrated
1. Orchestrator records the task, owned paths, dependencies and tests here and in `WORKSTREAMS.md`.
2. Agent is launched from `.claude/agents/<name>.md` (or with an explicit brief) with worktree isolation. Its first step: `git merge worktree-nfl-universe` (worktrees start from `main`, DEC-011). Read-only reviewers with `isolation: worktree` (qa, red-team) must do the same, or they review `main` instead of the work.
3. Agent commits on its own branch and hands back using `AGENT_HANDOFF_TEMPLATE.md`, with a copy in `docs/AGENT_STATUS/`.
4. Orchestrator reads the diff, merges into the integration branch, runs `npm test` and `python3 scripts/build.py --reuse` on the merged result, and records the outcome in `INTEGRATION_QUEUE.md`.
5. Nothing reaches `main` without the owner's approval, except the project's instruction and documentation files, which the owner asked to keep on `main` (Nov. 21, 2026).

Tested on Nov. 21, 2026: the frontend agent got its own locked worktree and branch, merged the integration branch first, committed only inside its owned paths, and paused and handed back cleanly when asked.

## Coordination rules
- Record assignments before starting work.
- State exact file/path ownership for each agent.
- Do not dispatch dependent work prematurely.
- Agents report changed files, tests, risks, and follow-up tasks.
- Orchestrator reviews diffs and resolves conflicts before merge.
- Update this file whenever ownership, status, or blockers change.
- Project rules in `CLAUDE.md` bind every agent: never edit `public/index.html` by hand, keep the engine free of DOM access, keep the page working with no server, never invent a news item, no model factor without a backtest, no API keys in the repository.

## Self-check every agent answers before handing back
What did I change, and why? What did I assume? What did I test, and how? What could still be wrong? Did I duplicate anything that already existed? Could anything I added use information from after the moment it describes? Did I verify every external source I relied on? Did I update the docs I own?

## Shared memory
Findings that outlive one agent's context are written down, not kept in conversation:

| Kind of finding | Where |
|---|---|
| Source tested, with date and result | `docs/NFL_DATA_SOURCE_REGISTRY.md` |
| Design decision and why | `docs/DECISIONS.md` |
| Research about other projects | `docs/GITHUB_RESEARCH.md`, `docs/WORLDMONITOR_ARCHITECTURE_ANALYSIS.md` |
| Something seen in the data, with source and time | an event in `data/fabric/events/` |
| What a stream did and left open | `docs/AGENT_STATUS/<stream>.md` |
