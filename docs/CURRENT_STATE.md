# Current State

> Update this file at the beginning and end of every substantial work session. Do not invent progress.

## Last updated
- Date: 2026-11-21
- Branch: `worktree-nfl-universe` (worktree `.claude/worktrees/nfl-universe`). `main` carries the daily refresh plus, from this session, the project's instruction and documentation files only.
- Commit: see `git log -1` on each branch.

## Repository reality
- Current stack: plain JavaScript page (built into one HTML file), dependency-free Node server, standard-library Python build, numpy for offline evaluation.
- Apps/packages: `public/index.html` (built from `src/template.html`), `server.js`.
- Existing NFL/Sleeper features: playoff simulator with picks, three odds modes, tiebreakers, bracket, draft order, what-changed view, reasoning panels, backtest report, live scores through `/api/live`. No Sleeper code. The FantasyPros fetch has never run.
- Working commands: `npm test` (pass), `npm start`, `npm run build` (not run this session), `python3 scripts/build.py --reuse` (integration branch only; pass).
- Test/build status: green on the integration branch at its last commit.

## Completed
- [x] Repository audit (`NFL_UNIVERSE_AUDIT.md`)
- [x] World Monitor architecture analysis (`WORLDMONITOR_ARCHITECTURE_ANALYSIS.md`)
- [x] Open-source license decision (`OPEN_SOURCE_LICENSE_DECISION.md`): clean room
- [x] NFL data-source registry: 21 endpoints tested and every provider's terms read on Nov. 21
- [x] Open-source, odds and official-media research (`GITHUB_RESEARCH.md`, registry)
- [x] Canonical data model and contracts (`DATA_MODEL.md`, `lib/contract.js`, `shared/teams.json`, fixture)
- [x] Target architecture (`ARCHITECTURE.md`) and dependency plan (`MASTER_PLAN.md`)
- [x] Project operating system merged: constitution in `CLAUDE.md`, 12 agents in `.claude/agents/`, 6 rules in `.claude/rules/`, living documents
- [x] Agent and rule files checked against documented Claude Code syntax (no problems found)
- [x] Worktree workflow exercised with one implementation agent (own worktree and branch, merge-first, clean pause and hand-back)

## In progress
- None. Foundations (audit, research, architecture, dependency plan) are complete and waiting for the owner's decisions below.

## Paused (waiting for plan approval)
- NU-006 data fabric: `lib/fabric/source.js` (breaker and last-good cache), `entities.js` (provider ids and headline matching), `score.js` (importance, confidence, clustering, injury weights). Uncommitted in the integration worktree; no tests yet.
- NU-007 command center: branch `worktree-agent-adaeb813e8038ab4d` at `cf03470`, parked; holds only the map-outline generator and its output.

## Already changed before the owner asked to finish planning first
These are on the integration branch and tested, not on `main`: `scripts/build.py` gained module assembly and `--reuse`; `src/template.html` gained two inert markers (a style marker and an empty universe script); `lib/contract.js`, `shared/teams.json`, `test/fixtures/universe.sample.json` were added. The rebuilt page behaves exactly as before (`npm test` passes).

## Blockers / risks
- ESPN's JSON endpoints are not licensed for automated use (Disney Terms of Use §2.B(x)). This affects the existing `/api/live` feed and two committed test fixtures built from ESPN responses (`test/sample-scoreboard.json` on `main`, `test/fixtures/universe.sample.json` on the integration branch). DEC-006 is open for the owner.
- The paused fabric scaffolding was written for ESPN adapters; only `source.js`, `entities.js` and `score.js` are source-independent.
- Where the daily refresh runs is unknown (no task in this app's scheduler). It commits to `main`.
- Live confirmation that Claude Code loads the new instructions needs a signed-in session: the Homebrew CLI here (2.1.197) is not logged in. Open a session in the project and run `/context` and `/agents`.
- The installed CLI (2.1.197) may be older than the docs consulted; if `/agents` does not list the project agents, update Claude Code.

## Decisions waiting on the owner
1. Approve the plan (`MASTER_PLAN.md` dependency plan) so M1 and M3 can restart.
2. ESPN JSON endpoints (DEC-006): personal local use with nothing published (recommended), permitted sources only, or a licensed feed.
3. Language-model provider and cost ceiling, or none (DEC-009).
4. A keyed odds source for multi-book lines (The Odds API free tier is the cheapest workable option), or none.
5. Where the server should run beyond this machine, if anywhere.
6. Whether the integration branch may merge into `main` after milestone 1 review.

## Next actions
1. On approval: define the `/api/game` contract, finish and test the fabric for the sources DEC-006 allows (NU-006), restart the frontend agent (NU-007) with the answers in `AGENT_COORDINATION.md`.
2. MCP server (NU-008), then independent review (NU-009).
3. Port the three skipped tiebreaker steps from nflseedR's documented procedure (MIT), with tests.

## Commands actually run
| Command | Result | Date |
|---|---|---|
| `npm test` | Pass (main and integration branch) | 2026-11-21 |
| `python3 scripts/build.py --reuse` | Pass | 2026-11-21 |
| `normalize()` from `server.js` on the real ESPN scoreboard | 13 games, all teams resolved | 2026-11-21 |
| `curl` probes of 21 candidate endpoints | 20 returned data; NFL.com RSS returned an HTML page | 2026-11-21 |
| Frontmatter check of `.claude/agents` and `.claude/rules` | 0 problems | 2026-11-21 |
| `claude -p` headless check | Not possible: CLI not logged in | 2026-11-21 |
| `git worktree list` | Integration and frontend worktrees present, each on its own branch | 2026-11-21 |
| Read-only `gh` queries and web reads (research agent) | 25 projects, 9 odds sources, 12 providers' terms, official media checked | 2026-11-21 |
