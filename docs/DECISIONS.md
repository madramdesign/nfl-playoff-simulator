# Architecture and Product Decisions

Record significant decisions with date, status, context, options, decision, rationale, and consequences. Newest last.

## Decision template

### DEC-XXX — Short title
- Date:
- Status: Proposed / Accepted / Superseded
- Context:
- Options considered:
- Decision:
- Rationale:
- Consequences / follow-up:
- Sources:

## Decisions

### DEC-001 — Build on the existing simulator; keep its stack
- Date: 2026-11-21. Status: Accepted.
- Context: the brief asks for a World Monitor-style command center; the repository is a working, tested, dependency-free simulator published as one static page.
- Options considered: TypeScript and Vite; forking World Monitor's stack (Vite, deck.gl, MapLibre, Redis, protobuf); keep plain JavaScript, Node built-ins and standard-library Python.
- Decision: keep the existing stack.
- Rationale: the page works, is tested and ships as one static file; with no package installs, a cold machine and the daily refresh have nothing to break. World Monitor's heavy pieces solve problems of 1,000+ feeds and global map data, not 32 teams and about 16 games a week.
- Consequences / follow-up: contracts are runtime validators (`lib/contract.js`), not types. Revisit if the interface outgrows hand-written modules.

### DEC-002 — Clean-room implementation of World Monitor's ideas
- Date: 2026-11-21. Status: Accepted.
- Decision: no World Monitor code or assets are copied. Details: [OPEN_SOURCE_LICENSE_DECISION.md](OPEN_SOURCE_LICENSE_DECISION.md).

### DEC-003 — One page, two views
- Date: 2026-11-21. Status: Accepted.
- Options considered: a separate `universe.html`; a new default view in the same page.
- Decision: the command center is the default view; the simulator stays whole as the `sim` view (`?view=sim`).
- Rationale: the brief forbids disconnected mini-apps, and the simulator's engine, data and picks produce the command center's playoff numbers.

### DEC-004 — Interface code in modules, inlined at build
- Date: 2026-11-21. Status: Accepted.
- Decision: `src/universe/*.js` and `*.css` are concatenated into the template by `scripts/build.py` in file-name order inside one closure; `--reuse` re-renders without downloading data.
- Rationale: several agents can work on separate files; the output stays one self-contained file.

### DEC-005 — Server aggregates; the page never calls third parties
- Date: 2026-11-21. Status: Accepted.
- Decision: every external call goes through a source adapter in `lib/fabric/` with a timeout, retries, a circuit breaker and a last-good cache. The page reads only `/api/universe` or the snapshot embedded at build.
- Rationale: one failing feed must not blank the page; browsers would hit cross-origin limits; per-source health becomes visible in one place.

### DEC-006 — Whether to use ESPN's JSON endpoints
- Date: 2026-11-21. Status: **Accepted: option 1, personal local use** (owner's choice, Nov. 21, 2026). First drafted as "Accepted" before the terms research, reopened the same day, then decided by the owner.
- Context: ESPN's scoreboard, news, injuries, transactions and depth-chart JSON all answered on Nov. 21 and would cover most of the live layer. WS3 found they fall under the Disney Terms of Use, whose section 2.B(x) bars automated access, data mining and building datasets, and ESPN has licensed no public API since 2014. The existing simulator already reads the scoreboard through `/api/live`. Under this project's constitution, technical access is not permission.
- Options considered:
  1. **Personal, local use only.** Keep ESPN behind the local server at low volume, never commit or publish ESPN-derived data (no ESPN content in the embedded snapshot or in committed fixtures), and drop it on request. The owner accepts the terms risk.
  2. **Permitted sources only.** Use nflverse (daily, not live), Yahoo and ESPN RSS headlines under their RSS terms, Open-Meteo, api.weather.gov, Sleeper and curated news. Live scores, injuries within the day, transactions and odds movement are then missing or a day late.
  3. **Licensed feed.** A commercial provider (for example SportsDataIO or Sportradar) under contract. Paid.
- Recommendation: option 1 for the owner's own machine, combined with option 2 for anything published or committed; revisit option 3 if the project is ever shared publicly or used commercially.
- Consequences of option 1:
  - Every source has a `scope` (`public` or `local`) in `lib/contract.js`. ESPN JSON sources are `local`: they run only behind the local server.
  - Anything committed or published (the snapshot embedded in the page, `data/fabric/` files, fixtures) is built from public sources only and must pass `validatePublicSnapshot`.
  - The ESPN-derived fixture from earlier that day was replaced by synthetic fixtures (`test/fixtures/make-fixtures.js`). Its first version remains in the integration branch's local history (commit `8363f78`); squash-merge or rewrite before that branch is ever pushed. `test/sample-scoreboard.json` on `main` is hand-made, not ESPN data.
  - `/api/live` keeps working as before; it was always local.
  - The MCP server, being a local tool for the owner's own agents, may expose local sources; each answer names its source and scope.
- Sources: [Disney ToU](https://disneytermsofuse.com/english/), `NFL_DATA_SOURCE_REGISTRY.md`.

### DEC-007 — Descriptive indexes are not model inputs
- Date: 2026-11-21. Status: Accepted.
- Decision: injury burden, weather flags, news importance and any composite team index are shown as descriptions and do not change a win probability until a backtest shows an out-of-sample gain (house rule in `CLAUDE.md`). The interface says so where they appear.

### DEC-008 — Headlines and links only
- Date: 2026-11-21. Status: Accepted.
- Decision: news adapters keep headline, link, publisher, time and matched teams and players. No article bodies, RSS descriptions or injury-report commentary.
- Rationale: copyright; link to the original.

### DEC-009 — No language model until the owner chooses one
- Date: 2026-11-21. Status: Accepted (open question for the owner).
- Decision: "What is happening in the NFL?", "What am I missing?" and "Prove this wrong" are computed by rules from the data and labelled that way.
- Rationale: a model-written brief needs a paid API key and a choice of provider and cost.

### DEC-010 — Adopt the project operating system from the owner's bootstrap files
- Date: 2026-11-21. Status: Accepted.
- Context: the owner supplied a project constitution (`CLAUDE.md`), agent definitions (`.claude/agents/`), rules (`.claude/rules/`) and living-document templates.
- Decision: merged them. The constitution heads `CLAUDE.md`; the repository's earlier notes are kept intact below it. Templates were filled with the audit and research results instead of being left blank. Earlier versions of `AGENT_COORDINATION.md`, `WORKSTREAMS.md`, `INTEGRATION_QUEUE.md` and this file were folded into the templates' structure.
- Corrections made while merging: the templates assume an existing Sleeper integration; this repository has none, and `CLAUDE.md` now says so. "Typed contracts" reads as runtime validators for this plain-JavaScript project.
- Sources: Claude Code docs confirm `.claude/rules/*.md` load every session and `isolation: worktree` is a supported subagent field (code.claude.com/docs/en/memory, /sub-agents).

### DEC-011 — Agent worktrees start from `main`; agents merge the integration branch first
- Date: 2026-11-21. Status: Accepted.
- Context: Claude Code creates subagent worktrees from the default branch, not from the orchestrator's branch.
- Decision: every implementation agent's first step is `git merge worktree-nfl-universe` in its own worktree; the orchestrator merges the agent's branch back after review.

### DEC-012 — News feeds only where their terms allow display
- Date: 2026-11-21. Status: Accepted.
- Context: WS3 found explicit display terms for ESPN RSS and Yahoo RSS (unmodified, credited, linked, no ads, non-commercial). NBC Sports (ProFootballTalk) and CBS Sports publish only general terms that bar aggregation and redistribution.
- Decision: wire ESPN RSS and Yahoo RSS when news ingestion starts; leave ProFootballTalk and CBS out unless the owner obtains permission. Headlines are shown exactly as published, with publisher and link.

### DEC-013 — Attribution shown beside the data
- Date: 2026-11-21. Status: Accepted.
- Decision: the page credits each source where its data appears: Open-Meteo (link required next to weather), Sleeper (trending data), nflverse (and "FTN Data via nflverse" if FTN charting is used), nfeloapp.com (already shown), each RSS publisher on every headline.

### DEC-014 — Plan approved; remaining owner choices defaulted
- Date: 2026-11-21. Status: Accepted.
- Context: the owner chose ESPN option 1 when asked which option building should restart with, which restarts M1 (data fabric) and M3 (command center) under `MASTER_PLAN.md`.
- Defaults until the owner says otherwise: no language model (rule-based brief, DEC-009); no keyed odds source (nflverse lines publicly, ESPN's single book locally); the server runs only on the owner's machine; the integration branch is not merged into `main`.

### DEC-015 — Optional seed for the simulation engine
- Date: 2026-11-21. Status: Accepted.
- Decision: `simulate(picks, focus, n, liveProbs, now, watch, seed)`; leaving `seed` out keeps the fixed seed, so every existing caller gets identical results (tested). Independent batches for 100,000-season runs pass different seeds.

### DEC-016 — Milestone 1 merged into `main` as one squash commit
- Date: 2026-11-21. Status: Accepted (owner approved the merge).
- Context: the integration branch's history includes, in one early commit, a test fixture built from ESPN responses; DEC-006 forbids committing ESPN-derived data where it may be published, and `main` is the branch that gets pushed.
- Decision: squash-merge (`8bd0cff`) so `main` carries the final tree only; then merge `main` back into the integration branch so later merges have a common base.
- Consequences: commit hashes quoted in the docs refer to the integration branch, which stays local. The early fixture remains in that local branch's history; do not push that branch as it is.
