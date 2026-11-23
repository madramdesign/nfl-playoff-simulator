# Current State

> Update this file at the beginning and end of every substantial work session. Do not invent progress.

## Last updated
- Date: 2026-11-23
- Branches:
  - `main`: milestone 1 (`8bd0cff`) and the M8 media center (`0523d28`), each merged on Nov. 21, 2026 as one squash commit; pull requests #1 to #3 from `claude/kind-bohr-75erpe` (Nov. 23: fixture pinning, public hosting, focus bar); then, on Nov. 23, one squash commit of the integration branch with the Nov. 22 work below (feed fix, panel layout, live check notes); a second on Nov. 23 (live-data heartbeat, honest game-event times, logo research, map helmets); plus the daily data refresh. Commit hashes quoted elsewhere in these docs belong to the branch histories they came from.
  - `worktree-nfl-universe` (worktree `.claude/worktrees/nfl-universe`): integration branch for the next milestones; kept in step with `main`.
- Commit: see `git log -1` on each branch.

## Nov. 23, 2026: daily refresh unblocked (branch `claude/kind-bohr-75erpe`, on `main` via pull request #1)
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

## Repository reality
- Stack: plain JavaScript page built into one HTML file, dependency-free Node server, standard-library Python build, numpy only for offline evaluation.
- What runs: `npm start` serves the page and the APIs on http://localhost:3000 (this machine only). The page opens on the command center; `?view=sim` is the original simulator.
- No Sleeper code. The FantasyPros fetch has never run.
- Tests: `npm test` runs four suites: engine and feed parser, 38 data-fabric tests, 4 MCP tests, 202 command-center checks. All pass on the integration branch, and the fabric and interface suites were each checked to fail against deliberately broken code.

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

## Nov. 23 (on `main`): helmets on the map
- New default layer on the geographic map: on a game day both teams' helmets at the stadium, facing each other; live games pulse and show the score; teams not playing are at home. Our own helmet drawing in team colours (club logos are not openly licensed: `NFL_DATA_SOURCE_REGISTRY.md`). Code: `src/universe/07-helmets.js`; the page's team entries now carry the second colour (`alt`).
- Checked in the browser on Nov. 23 with the Monday night game (CIN at WAS, before kickoff): the pair stands in Landover, MD, in the right colours on dark and light backgrounds, at least 16 px wide on a 375 px phone, with no horizontal scroll. Not yet seen: a live game's pulse and score, and a full Sunday slate (crowding in the Northeast).
- Tests: 13 new page checks (today's games, colours, sizes, saved layers).

## Nov. 23 (on `main`): the two live weaknesses
- **Heartbeat:** the server now checks on its own (`startWatch` in `lib/fabric/index.js`, started by `server.js` where the live scoreboard is read; `FABRIC_WATCH=0` turns it off): every 20 seconds during a game window (a game in progress, or one due within 15 minutes and not over), every 5 minutes otherwise. Scores and game events stay current with no page open.
- **Honest game-event times:** a kickoff or score is known only to have happened between the last data that did not show it and the first that did. Kickoffs are dated by the scheduled kickoff when it falls in that gap. A gap over two minutes marks the time as an estimate (`data.tsEstimated`, `data.between`), shown with a "~" and the gap on hover.
- **Merged scores:** when the change between two looks could be more than one score, the event reads "Score update: …" instead of naming one scorer.
- Tests: 2 new fabric tests and 1 extended, 4 new page checks; each new rule was shown to fail against deliberately broken code.

## Nov. 22 (integration branch; on `main` since Nov. 23)
- **Feed after a fresh start:** items with no time of their own that were already there when a server started (injury statuses, line moves, weather flags) used to show as brand new and bury real headlines. They are now marked `data.beforeWatch`, listed last as "before <time>", and left out of the ticker and the brief.
- **Panels that move, hide and resize:** merged here from `worktree-panel-layout` (see "Panel layout" below), reviewed and fixed.
- **Live game window, first check (Nov. 22, 1:12 pm ET, seven games in the first quarter):** the server's payload, the page and `/api/live` all showed every game in progress with score, clock, down and distance and ESPN's win probability. The page showed LIVE, live scores on the map and the games strip, and kickoff and score events in the feed. The game panel showed the live chance used by the simulation next to the page's own in-game model (KC 93% from ESPN, 96% from ours). Two weaknesses: (1) the server refreshes only when asked, so after a quiet spell its first answer is the old data, labelled stale, and kickoff and score events take the time the server noticed them, not when they happened; (2) several scores between two checks become one score event. ESPN and nflverse disagree on two kickoff times (PIT at PHI, JAX at NYG); ESPN's were right.

## Media center (M8), on `main` since Nov. 21 (`0523d28`)
- Official YouTube channels of the NFL and all 32 teams (evidence level recorded per team in `shared/teams.json`), six official NFL podcasts.
- Media panel with latest videos, live-page links and podcast players; videos in team and game panels; Video map layer.
- Checked in the browser: an official press conference played in the page; a podcast kept playing through panel redraws; YouTube's live-stream embed does not work, so live is a link (DEC-017).
- Independent review: all findings fixed.
- Published copy (claude.ai artifact): the viewer blocks outside images, players and audio, so the page now detects the refusal and shows videos and episodes as links that open on YouTube or the episode page. Merged into `main` on Nov. 21, 2026, so the daily republish keeps it; also published by hand as version 20. Not yet seen inside the real viewer (the browser pane was not signed in to claude.ai); checked in a local copy under the same kind of policy.
- Ten team channel ids rest on directory listings plus feed content (ATL, CAR, CIN, CLE, GB, IND, MIN, NYJ, PHI, TB); a quick manual check from each team's website is worthwhile.

## Panel layout (Nov. 22; reviewed; on `main` since Nov. 23)
- Checked with the focus bar after merging it in (Nov. 23): focus and panels work together at 1440 px and 375 px wide, no horizontal scroll; all five test suites pass (222 command-center and 128 layout checks).
- Independent review: nothing blocking; four non-blocking findings, all fixed and checked in the browser. The top bar covered the drawer's close button when it wrapped; it now rises above the drawer only while the Panels menu is open. Resize handles made the columns scroll; they now sit inside their panel. A drop could land in the scrolled-away part of the left column; drops now use the zone's visible part. The menu stayed open behind a player or drawer; focus leaving it now closes it. Four source checks guard these (128 layout checks).
- Left open from the review: no DOM-level tests of the page side (hiding, held renders, tabs, drag and resize handlers); a second touch on a resize handle adds a second set of listeners; divider arrow keys still change the saved share at the column's limits.
- Re-checked by the orchestrator in the browser at 1440 px and 375 px wide: hide and show, menu and header-drag reordering, keyboard and mouse resizing, the divider, reload persistence, phone tabs without horizontal scroll, Reset layout, and `?view=sim`.
- What the viewer can do:
  - move panels by dragging a header, or with the grip and arrow keys;
  - hide and show panels, and reorder them, from the Panels menu in the top bar;
  - resize panels from the bottom and right edges (arrow keys too; double-click resets);
  - drag the divider between the map and the panel column (wide screens);
  - reset everything with Reset layout.
- How it works:
  - Wide screens have three zones: left column, panel column, bottom row. A zone wide enough for two or more 300 px columns becomes a grid, where panels can span columns.
  - Phones keep the tab layout; the tab order is kept separately and hiding applies to both.
  - Hidden panels are not drawn until shown again. One panel always stays shown.
  - Saved per browser as `layout` in `nflu-v1`, sanitised against the known panel ids. Blocked or broken storage gives the defaults.
- Code: `src/universe/17-layout.js` (pure logic plus the page side), with small changes to `06-panel.js`, `15-shell.js`, `99-boot.js` (one line), the CSS and the shell markup.
- Tests: `test/layout.test.js`, 124 checks at hand-back (128 after the review fixes), now part of `npm test`. Eight deliberately broken copies of the logic were each caught.
- Checked in the browser pane, against the local server with real data:
  - at 1440 px: drag reorder across zones, hide and show, height and width resize, divider, keyboard moves, reset, survival across reloads;
  - at 1100 px: the divider stops at its limits;
  - at 375 px: tabs follow the order and the hidden panels, no horizontal scroll;
  - `?view=sim` is unchanged.
- Not checked: touch dragging on a real tablet; the published claude.ai copy.

## Reviews
- **Data fabric:** independent review found 3 blocking and 9 non-blocking issues. All fixed; the tests now include negative cases checked against deliberately broken code.
- **Command center:** independent review found 3 blocking and 8 non-blocking issues, plus tests that passed broken code. All fixed and merged:
  - by the orchestrator: build escaping (`d7cfad3`), final-game times, the sportsbook label;
  - by the frontend agent (`c5e93fd`): honest live status, mode labels, robustness, focus, ticker, deep-run race, labels, accessibility, and 104 checks.
  - One accepted leftover: a synthetic fixture payload can still show a live dot (development only; fixtures never reach the real page).

## Checked in the browser (Nov. 21, real data through the local server)
- **Desktop 1440 px:** the full layout; brief with 10 findings; Giants deep link (69% playoffs from 20,000 seasons); game detail with the win-probability chart; simulator view intact with its live feed.
- **Phone 375 px:** no horizontal scroll. Snapshot-then-live status works.
- **In-progress games:** first seen on Nov. 22 (see above).

## Open items
- Team labels collide in the Northeast; Network and Schedule map modes and History are placeholders.
- The page is 400 KB (no minification; the snapshot is embedded).
- Not built yet: depth charts in injury weights beyond the quarterback; player canonical ids (candidate crosswalk is GPL data, owner decision); tiebreaker steps from nflseedR; time-machine replay from `seenAt`.
- Not verified:
  - live loading of the new agents and rules (needs a signed-in session: run `/context` and `/agents`);
  - a full game from kickoff to final (only the first quarter was checked so far);
  - where the daily refresh runs.

## Decisions waiting on the owner
1. Language-model provider and cost ceiling, or none (DEC-009).
2. A keyed odds source (The Odds API free tier is the cheapest workable), or none.
3. Where the server should run beyond this machine, if anywhere.

## Effects of the merge to watch
- The next daily refresh runs `scripts/fabric-snapshot.js` (needs network; never fails the refresh) and all four test suites, and the page it publishes opens on the command center. The published copy is static, so it shows the public snapshot with its age, never ESPN data.

## Nov. 23, 2026: feature research (docs only, no code changed)
- New living documents: `FEATURE_RESEARCH.md` (baseline, competitors, open-source, technology and data research, scoring of 39 candidates, top 20, top 5, rejected ideas), `FEATURE_BACKLOG.md` (one entry per candidate), `FEATURE_ROADMAP.md` (P0–P2 and order).
- Found while researching:
  - The Nov. 23 refresh published a degraded public snapshot. Open-Meteo, both RSS feeds, YouTube and podcasts all failed with `fetch failed`, and the run overwrote the previous good data. There is no event file for Nov. 22. Backlog F01.
  - Small robustness and security fixes, listed in backlog F31.
  - The "Model" feed filter can never show anything: nothing emits `model` or `playoff_move` events (F22).

## Next actions
1. Confirm the heartbeat during a real game (kickoff and score events without the "~" estimate mark) and follow a game through to its final.
2. Then Phase 1 of `FEATURE_ROADMAP.md`, starting with F01 (snapshot carry-forward) and F31. Then P0 differentiators F02, F04, F05 and F08 within M4 and M5 of `MASTER_PLAN.md`.

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
