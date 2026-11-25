# Current State

> Update this file at the beginning and end of every substantial work session. Do not invent progress.

## Last updated
- Date: 2026-11-23 (cloud session: refresh fix, hosting prep, focus, weather backup, tiebreakers, calibration, time machine, intelligence depth; newest entries first below)
- Branches:
  - `main`: milestone 1 (`8bd0cff`) and the M8 media center (`0523d28`), each merged on Nov. 21, 2026 as one squash commit, plus the daily data refresh. Commit hashes quoted elsewhere in these docs belong to the integration branch's history.
  - `worktree-nfl-universe` (worktree `.claude/worktrees/nfl-universe`): integration branch for the next milestones; kept in step with `main`.
- Commit: see `git log -1` on each branch.

## Nov. 23, 2026: daily refresh unblocked (branch `claude/kind-bohr-75erpe`, not yet on `main`)
- The Nov. 23 refresh did not commit. Running `npm run refresh` by hand showed why: the MCP and command-center suites checked the synthetic fixtures' matchups against the live build, and Sunday's results turned those matchups into played games.
- Fix: both suites now pin the engine's season data to `test/fixtures/engine-data.js` (the Nov. 22 build; `NFLU_ENGINE_DATA` for the MCP server). See `test/fixtures/README.md`. `test/run.js` still runs on the current data.
- Checked: `npm test` passes on the committed Nov. 22 data and on a fresh Nov. 23 build. The fresh build was not committed (five sources were unreachable from the cloud container), so the data on `main` is still Nov. 22 until the scheduled refresh runs with this fix merged.

## Nov. 23, 2026: public hosting prepared (branch `claude/kind-bohr-75erpe`)
- `render.yaml` plus server guards for public hosting (DEC-018): `/api/live` is off without the local scope, per-client API request cap, Render hostname allowed automatically. Tests added in `test/fabric.test.js`.
- Checked: `npm test` passes; the server was started with the hosted settings in the cloud container and served the page, `/api/universe` (public sources only), 404 on `/api/live` and 403 for a foreign Host.
- Not done: the deploy itself. It needs the owner's Render sign-in. Not verified on Render.

## Nov. 23, 2026: focus bar (branch `claude/kind-bohr-75erpe`)
- New `src/universe/05-focus.js` and a focus bar under the top bar: NFL, then conference, division and team. The choice is in the URL (`?focus=AFC`, `AFC-EAST`, `NYG`) and narrows the map (teams outside are dimmed; the geographic map frames a division or team), the feed, the ticker, this week's games, the teams panel and media. Items with no team tag are left out while a focus is on. The team center has a "Focus on this team" button.
- Not narrowed by focus: the "What is happening in the NFL?" brief, system health and the simulator view.
- Checked: `npm test` (217 command-center checks, 20 of them new) and a browser run at desktop and phone widths against the local server.

## Nov. 23, 2026: weather and the cloud refresh fixed (branch `claude/kind-bohr-75erpe`)
- Cause and fix in DEC-019: hosts allowed on the cloud environment, the refresh now goes through the proxy, and `nws` (National Weather Service) backs up Open-Meteo.
- Checked: `npm test` (39 fabric tests, 3 new); `npm run refresh` in the cloud container: nflverse, both RSS feeds, curated news, YouTube (127 videos), podcasts (18) and `nws` all ok; Open-Meteo down with "answered 429"; the one unfinished outdoor game carries a National Weather Service forecast.
- Not checked: the backup with several games at once (only one outdoor game was left this week), an international game, and the scheduled task's own next run.
- Where the daily refresh runs is now known: the cloud scheduled task "NFL simulator daily refresh", 4:35 a.m. Eastern, in the Default cloud environment.

## Nov. 23, 2026: focus follow-ups (branch `claude/kind-bohr-75erpe`)
- The brief ("What is happening...") now answers for the focus: every ranked line is looked for inside it, and the button and title name the scope.
- Map labels no longer sit on each other or on count badges (`placeLabels` in `07-layers.js`); a focused division is always zoomed far enough to be labelled.
- Checked: `npm test` (227 command-center checks) and a browser look at the NFC East.
- Four streams dispatched to agents in worktrees: see `docs/AGENT_COORDINATION.md`.

## Nov. 23, 2026: tiebreakers and calibration merged (branch `claude/kind-bohr-75erpe`)
- S-A: net points in common games (division ties) and in conference games (wild-card ties) are now applied in their official positions. Net touchdowns stays skipped. Same-seed results on the real season were identical before and after over 600,000 seasons; not checked against nflseedR.
- S-B: `scripts/calibration.py` (`npm run calibration`, test in `npm test`) scores saved forecasts against results with a date-level leakage rule. Real run: 11 games, too few to read anything from.
- Follow-up done by the orchestrator: `scripts/snapshot.js` now saves every remaining game's home-win chance in each mode (`probs`), and the calibration script scores those as `model: <mode>` series. Before this, snapshots held only the sportsbook probability.
- `npm test` now has six `ok` lines (late tiebreakers and calibration added).

## Nov. 23, 2026: time machine merged (branch `claude/kind-bohr-75erpe`)
- S-C: "Replay the feed as of" control in the left rail and `?asOf=` in the URL (DEC-020). New `src/universe/18-history.js` and `scripts/event-archive.js`; the build embeds `D.eventArchive`.
- Checked after merge: `npm test` (42 fabric tests, 296 command-center checks) and a browser look at a replay combined with a focus. Not tested: Safari and Firefox date inputs.
- The brief and the team drawer still list current events during a replay; the banner says so.

## Nov. 23, 2026: intelligence depth merged; all four streams integrated (branch `claude/kind-bohr-75erpe`)
- S-D: watchlist stars, a bell with in-page alerts, a "What changed" panel and conflicting injury reports side by side (DEC-021). New `src/universe/17-watch.js`.
- Merge conflicts were the two expected appends (CSS and tests); both blocks kept.
- Teams table on wide screens now shows abbreviations only so every column fits.
- Checked after the last merge: `npm test`, six `ok` lines (42 fabric tests, 365 command-center checks, 65 calibration checks); the page at 1440 and 390 px with a focus, a starred team and the simulator view: no page errors, no horizontal overflow.
- Not exercised: an alert raised by a real poll (alerts were driven through the store), a real two-source injury conflict, screen readers, Safari and Firefox.
- Open: add a disagreeing injury to `test/fixtures/make-fixtures.js`; a replay marker in the brief and team drawer; compare tiebreakers with nflseedR; the hosted Render site is unverified.

## Nov. 25, 2026: The Odds API wired; where the keys are (branch `claude/kind-bohr-75erpe`, committed locally)
- The owner's FantasyPros and Odds API keys are GitHub repository secrets only (`FANTASYPROS_API_KEY`, `ODDS_API_KEY`); recorded in `CLAUDE.md`.
- New: `scripts/fetch_odds.py`, `.github/workflows/odds.yml`, `D.odds` in the build, a "Sportsbook consensus" block in the game detail (DEC-022). `npm test` has seven `ok` lines (odds test added).
- Checked: `npm test`; a dry run with synthetic lines through the fetch script (`--from-file`), the build and the browser. The synthetic files were deleted and the page rebuilt without them.
- Not checked: any real response from The Odds API (no key outside GitHub), so field names are unverified. The secret must be named `ODDS_API_KEY`.
- FantasyPros: `data/fantasypros/` was still empty on `main` on Nov. 23, so its action had not delivered data. Its run log could not be read on Nov. 25 (GitHub was answering 503 from the cloud session; nothing could be fetched or pushed). Only a quarterback-change line in the simulator uses it; injury news and players are fetched and unused.
- Unknown on Nov. 25 for the same reason: whether pull request #4 has been merged.

## Repository reality
- Stack: plain JavaScript page built into one HTML file, dependency-free Node server, standard-library Python build, numpy only for offline evaluation.
- What runs: `npm start` serves the page and the APIs on http://localhost:3000 (this machine only). The page opens on the command center; `?view=sim` is the original simulator.
- No Sleeper code. The FantasyPros fetch has never run.
- Tests: `npm test` runs four suites: engine and feed parser, 37 data-fabric tests, 4 MCP tests, 197 command-center checks. All pass on the integration branch, and the fabric and interface suites were each checked to fail against deliberately broken code.

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

## Media center (M8), on `main` since Nov. 21 (`0523d28`)
- Official YouTube channels of the NFL and all 32 teams (evidence level recorded per team in `shared/teams.json`), six official NFL podcasts.
- Media panel with latest videos, live-page links and podcast players; videos in team and game panels; Video map layer.
- Checked in the browser: an official press conference played in the page; a podcast kept playing through panel redraws; YouTube's live-stream embed does not work, so live is a link (DEC-017).
- Independent review: all findings fixed.
- Published copy (claude.ai artifact): the viewer blocks outside images, players and audio, so the page now detects the refusal and shows videos and episodes as links that open on YouTube or the episode page. Merged into `main` on Nov. 21, 2026, so the daily republish keeps it; also published by hand as version 20. Not yet seen inside the real viewer (the browser pane was not signed in to claude.ai); checked in a local copy under the same kind of policy.
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
- Not built yet: depth charts in injury weights beyond the quarterback; player canonical ids (candidate crosswalk is GPL data, owner decision); net touchdowns as a tiebreaker (no touchdown model for unplayed games).
- Not verified:
  - live loading of the new agents and rules (needs a signed-in session: run `/context` and `/agents`);
  - behavior during a live game.

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
