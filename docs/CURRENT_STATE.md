# Current State

> Update this file at the beginning and end of every substantial work session. Do not invent progress.

## Last updated
- Date: 2026-11-21 (end of the first NFL Universe session)
- Branches:
  - `main`: milestone 1 merged on Nov. 21, 2026 as one squash commit (`8bd0cff`), plus the daily data refresh. Commit hashes quoted elsewhere in these docs belong to the integration branch's history.
  - `worktree-nfl-universe` (worktree `.claude/worktrees/nfl-universe`): integration branch for the next milestones; kept in step with `main`.
- Commit: see `git log -1` on each branch.

## Repository reality
- Stack: plain JavaScript page built into one HTML file, dependency-free Node server, standard-library Python build, numpy only for offline evaluation.
- What runs: `npm start` serves the page and the APIs on http://localhost:3000 (this machine only). The page opens on the command center; `?view=sim` is the original simulator.
- No Sleeper code. The FantasyPros fetch has never run.
- Tests: `npm test` runs four suites: engine and feed parser, 37 data-fabric tests, 4 MCP tests, 174 command-center checks. All pass on the integration branch, and the fabric and interface suites were each checked to fail against deliberately broken code.

## Built this session (integration branch)
- **Project operating system:** constitution in `CLAUDE.md`, `.claude/agents/` (12), `.claude/rules/` (6), and the living docs, all filled from evidence.
- **Contracts:** `shared/teams.json`, `lib/contract.js` (universe payload, public snapshot, game detail), synthetic fixtures.
- **Data fabric (`lib/fabric/`):**
  - Public sources: nflverse schedule, lines and injury report; Open-Meteo; ESPN and Yahoo RSS; curated news.
  - Local-only sources: ESPN JSON (DEC-006).
  - Breakers, last-good caches (separate per scope), events with first-seen times, injury-report comparison, headline clustering.
  - API: `/api/universe`, `/api/health`, `/api/game/<id>`, `/api/team/<abbr>`.
  - Public daily snapshot and event record in `data/fabric/`.
- **Command center (`src/universe/`):** map (geographic, divisions, intelligence), 17 layers, URL state, time ranges, intelligence feed, games strip, ticker, team and game panels, system health, rule-based brief, simulation in a Web Worker (20,000 seasons, 100,000 on request).
- **MCP server (`mcp/`):** 14 read-only tools over stdio.
- **Server hardening:** localhost binding, Host check on the API, malformed-request handling, `<` escaped in embedded data.

## Media center (M8), on the integration branch, not yet on `main`
- Official YouTube channels of the NFL and all 32 teams (evidence level recorded per team in `shared/teams.json`), six official NFL podcasts.
- Media panel with latest videos, live-page links and podcast players; videos in team and game panels; Video map layer.
- Checked in the browser: an official press conference played in the page; a podcast kept playing through panel redraws; YouTube's live-stream embed does not work, so live is a link (DEC-017).
- Independent review: all findings fixed.
- Ten team channel ids rest on directory listings plus feed content (ATL, CAR, CIN, CLE, GB, IND, MIN, NYJ, PHI, TB); a quick manual check from each team's website is worthwhile.

## Reviews
- **Data fabric:** independent review found 3 blocking and 9 non-blocking issues. All fixed; the tests now include negative cases checked against deliberately broken code.
- **Command center:** independent review found 3 blocking and 8 non-blocking issues, plus tests that passed broken code. All fixed and merged:
  - by the orchestrator: build escaping (`d7cfad3`), final-game times, the sportsbook label;
  - by the frontend agent (`c5e93fd`): honest live status, mode labels, robustness, focus, ticker, deep-run race, labels, accessibility, and 104 checks.
  - One accepted leftover: a synthetic fixture payload can still show a live dot (development only; fixtures never reach the real page).

## Checked in the browser (Nov. 21, real data through the local server)
- **Desktop 1440 px:** the full layout; brief with 10 findings; Giants deep link (69% playoffs from 20,000 seasons); game detail with the win-probability chart; simulator view intact with its live feed.
- **Phone 375 px:** no horizontal scroll. Snapshot-then-live status works.
- **Not yet seen:** an in-progress game, because none was being played during the session.

## Open items
- Team labels collide in the Northeast; Network and Schedule map modes and History are placeholders.
- The page is 400 KB (no minification; the snapshot is embedded).
- Not built yet: depth charts in injury weights beyond the quarterback; player canonical ids (candidate crosswalk is GPL data, owner decision); tiebreaker steps from nflseedR; time-machine replay from `seenAt`.
- Not verified:
  - live loading of the new agents and rules (needs a signed-in session: run `/context` and `/agents`);
  - behavior during a live game;
  - where the daily refresh runs.

## Decisions waiting on the owner
1. Language-model provider and cost ceiling, or none (DEC-009).
2. A keyed odds source (The Odds API free tier is the cheapest workable), or none.
3. Where the server should run beyond this machine, if anywhere.

## Effects of the merge to watch
- The next daily refresh runs `scripts/fabric-snapshot.js` (needs network; never fails the refresh) and all four test suites, and the page it publishes opens on the command center. The published copy is static, so it shows the public snapshot with its age, never ESPN data.

## Next actions
1. Watch one live game window with `npm start` open and confirm scores, the live dot, and kickoff and score events.
2. Then M5 (intelligence depth) and M6 (live game center) from `MASTER_PLAN.md`.

## Commands actually run (this session)
| Command | Result |
|---|---|
| `npm test` | Pass, 4 suites |
| `python3 scripts/build.py --reuse` | Pass |
| `node scripts/fabric-snapshot.js` | Public snapshot written, public sources only |
| Every API route against real sources (spare port) | 200s; bad ids 404; foreign Host 403 |
| MCP live stdio session | `initialize`, `get_source_health`, `get_injuries` answered from real sources |
| Browser pane: desktop and phone checks | As above |
| Deliberately broken validator, clustering, page escaping | Each caught by a test or a check |
