# NFL Universe — Project Constitution

## Mission
Build NFL Universe as an intelligence command center by extending this repository's working NFL playoff simulator rather than replacing it. The product combines reliable NFL data, live game intelligence, news, rosters, injuries, analytics, forecasting, simulations, media analysis, and an AI assistant in a World Monitor-inspired interface.

This repository has no Sleeper integration today (only a FantasyPros fetch; see `docs/NFL_UNIVERSE_AUDIT.md`). Sleeper work starts from the source registry, not from existing code.

## Mandatory startup procedure
At the start of every substantial task:
1. Read this file, including the repository specifics at the end.
2. Read `docs/CURRENT_STATE.md`, `docs/MASTER_PLAN.md`, `docs/AGENT_COORDINATION.md`, `docs/WORKSTREAMS.md`, `docs/INTEGRATION_QUEUE.md`, and relevant decision/source documents.
3. Inspect the actual repository, current branch, git status, existing architecture, tests, and available scripts. Never assume documentation is current.
4. Identify existing functionality to preserve. Do not rewrite or replace working systems without evidence and an approved migration plan.
5. Update the coordination documents before dispatching parallel work.

## Non-negotiable rules
- Preserve the existing project and its working features. Prefer incremental, reversible changes.
- Research before choosing APIs, libraries, data providers, or architecture. Verify current availability, terms, cost, rate limits, and licensing.
- Never treat technical accessibility as permission to use data or media. Use lawful public/authorized sources and comply with terms, copyright, privacy, and attribution requirements.
- Never bypass DRM, paywalls, authentication, access controls, or rebroadcast restrictions. Media features must use authorized embeds, official streams, public press conferences, permitted transcripts/captions, or licensed feeds.
- Every ingested fact must retain provenance: source, retrieval time, event/effective time when known, and confidence/quality metadata.
- Distinguish confirmed facts, reported claims, model estimates, projections, and speculation in both data and UI.
- Never fabricate live scores, odds, injuries, roster status, timestamps, citations, or source coverage. Display stale/unknown states explicitly.
- Prevent future-data leakage in historical analysis and backtests.
- Use validated contracts at system boundaries (`lib/contract.js`; the project is plain JavaScript, so contracts are runtime validators rather than TypeScript types), deterministic tests, and documented migrations.
- Keep secrets in environment variables or secret stores. Never commit credentials or private tokens.
- Do not make real Sleeper league transactions or other external side-effecting actions without explicit user authorization and appropriate confirmation.
- Do not claim a forecast or betting edge is guaranteed. Show uncertainty, assumptions, and model-vs-market differences.
- Avoid collecting or storing unnecessary personal data.

## Multi-agent operating model
- The orchestrator owns planning, task decomposition, dependency management, integration, and final acceptance.
- Use specialized subagents (`.claude/agents/`) for bounded research or implementation tasks. Implementation agents must use isolated Git worktrees/branches when concurrent edits are needed.
- Never have two agents edit the same worktree or shared file concurrently.
- Define task scope, files allowed to change, dependencies, expected outputs, and test commands before dispatch.
- Agents must inspect existing code and local instructions before editing.
- Agents must report changed files, decisions, tests run, failures, risks, and remaining work (`docs/AGENT_HANDOFF_TEMPLATE.md`).
- Integrate through a reviewed merge queue. Do not blindly merge agent branches.
- If worktree isolation is unavailable, serialize conflicting work rather than simulate parallel editing.

## Engineering workflow
For each change: inspect → plan → implement → test → self-review → independent review for material changes → integrate → regression test → update docs/state.
Run the narrowest relevant tests first, then build and broader tests as appropriate. Never report a check as passing unless it was actually run.
Prefer small, coherent commits. Do not discard user changes. Check `git status` before and after work.

## Data and intelligence standards
- Maintain a source registry in `docs/NFL_DATA_SOURCE_REGISTRY.md`.
- Normalize external data into canonical entities and events; retain raw source payloads when lawful and useful.
- Resolve identity carefully across teams, players, games, coaches, venues, and seasons. Track aliases and unresolved matches.
- Model source disagreement rather than silently choosing a value. Prioritize authoritative sources and expose confidence.
- Store timestamps in UTC and render in the user's chosen/local timezone.
- Make data freshness visible. Use caching, retries, rate limits, circuit breakers, and stale-cache fallbacks where appropriate.
- Separate ingestion, normalization, storage, analytics, AI reasoning, and presentation.

## Required living documents
Keep these current as work progresses:
- `docs/CURRENT_STATE.md` — truthful snapshot and next actions.
- `docs/MASTER_PLAN.md` — product scope, requirements, phases, acceptance criteria.
- `docs/AGENT_COORDINATION.md` — agents, worktrees, tasks, dependencies, blockers.
- `docs/WORKSTREAMS.md` — ownership boundaries and interfaces.
- `docs/INTEGRATION_QUEUE.md` — review/merge status.
- `docs/DECISIONS.md` — significant technical/product decisions and rationale.
- `docs/NFL_DATA_SOURCE_REGISTRY.md` — verified data and media sources.
- `docs/BOOTSTRAP_CHECKLIST.md` — setup and validation status.

## Definition of done
A task is done only when its acceptance criteria are met, relevant checks are run, errors/limitations are disclosed, documentation is updated, and the resulting work is integrated or clearly handed off. Update `docs/CURRENT_STATE.md` before ending a substantial session.

## Scope discipline
Do not start a large feature before completing the project audit, architecture/source research, dependency map, and phased plan. Do not introduce a new framework or replace the current stack merely because it is fashionable. Explain tradeoffs and prefer the smallest reliable solution.

---

# Repository specifics (notes for Claude)

These predate NFL Universe and remain binding.

- Edit `src/template.html`, never `public/index.html`. Rebuild with `npm run build` (downloads data) or `python3 scripts/build.py --csv <file>`.
- The engine lives in `<script id="engine">` and must stay free of DOM access so `test/run.js` can load it. Run `npm test` after any engine or server change.
- Game rows in the data are `[id, week, awayIdx, homeIdx, neutral, dateLabel, homeWinProbOrNull, totalLineOrNull]`. Picks are 0 simulate, 1 away, 2 home.
- The page must keep working with no `/api/live` (it is also published as a static page), so live-feed code fails silently.
- The live feed has not been verified against the real ESPN endpoint from the sandbox this was built in. First thing to check on a machine with open internet: `npm start`, then open `/api/live` during a game window. (Nov. 21, 2026: the scoreboard endpoint answered from this machine with the expected shape; still unverified during a live game window.)
- Known gaps: three rarely reached tiebreaker steps are skipped (net points in common or conference games, net touchdowns); ties cannot be picked; in-game model ignores possession and timeouts.
- Win chances have three modes (`setMode`): 0 sportsbooks, 1 results-based ratings, 2 an even blend (default). `GD` is rebuilt from `GDM` and `GDR` when the mode changes.
- Ratings are built in `scripts/build.py` (`rate` market, `rate2` results). Change weights only after rerunning `scripts/backtest.py`; rest-day effects were tested there and were too noisy to add.
- Clinched/eliminated flags (`status()` in the page script) are deliberately conservative sufficient conditions, not a full clinching solver; there are no 'needs X to clinch' scenarios.
- Sportsbook futures are not used: no dependable current source for all eight divisions was found.
- Read `docs/PLAYOFF_PREDICTOR_AUDIT.md` and `docs/ROADMAP.md` before adding features. House rule from the brief: no factor goes into the model without a backtest showing an out-of-sample gain; record rejections in `scripts/evaluate.py`'s `rejected` list.
- The reasoning panel (`whyPanel`) must only state things computed from `D` or a `simulate` result.
- `npm run refresh` rebuilds from fresh data, runs the tests and saves a dated snapshot in `data/snapshots/`. A scheduled task runs it daily, republishes the page and commits the result; do not hand-edit snapshots.
- API keys never go in the repository. FantasyPros data is fetched by `.github/workflows/fantasypros.yml` using the secret `FANTASYPROS_API_KEY` (limits: 1 call a second, 100 a day, non-commercial, attribution required). The fetch script was written from the docs and has not yet run against the real API: check the first run's saved files before relying on field names.
- `data/news.json` holds league news (own-words summary, source link, team). A `qb_change` item makes `to` the team's current starter in `qb_shift`. Never invent an item: each needs a real source URL.
- Build inputs can be passed as files (`--csv --team-stats --injuries --qb`) or left to download.
- News effects are computed, never typed in: `newsEffect` multiplies the line move since before the news by each team's conditional playoff gap for that game (`simulate(..., watch)`). No pre-news line means no estimate is shown.

## NFL Universe specifics
Milestone 1 was merged into `main` on Nov. 21, 2026 (squash commit `8bd0cff`), so everything below exists on `main`.
- Command-center code lives in `src/universe/*.js` and `*.css`; `scripts/build.py` inlines them into the page in file-name order inside one closure. `python3 scripts/build.py --reuse` re-renders the page without downloading data.
- Canonical team entities and provider ids: `shared/teams.json` (index order matches `D.teams`). The `/api/universe` payload contract: `lib/contract.js`, described in `docs/DATA_MODEL.md`. Change either only through the orchestrator.
- The data fabric (`lib/fabric/`) is the only code that calls external sources; the page reads `/api/universe` or the snapshot embedded at build (`D.fabric`).
- Descriptive indexes (injury burden, weather flags, news importance) are not model inputs until a backtest says otherwise (`docs/DECISIONS.md`).
- New NFL Universe work happens on an integration branch (currently `worktree-nfl-universe`) with agents in their own worktrees; it reaches `main` only after review, passing tests and the owner's approval. The daily refresh commits to `main` and now also runs `scripts/fabric-snapshot.js` and the full test suite.
