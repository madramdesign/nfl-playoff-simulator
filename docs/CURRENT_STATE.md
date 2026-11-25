# Current State

> Update this file at the beginning and end of every substantial work session. Do not invent progress.

## Last updated
- Date: 2026-11-25
- Branches:
  - `main`: milestone 1 (`8bd0cff`) and the M8 media center (`0523d28`), each merged on Nov. 21, 2026 as one squash commit; pull requests #1 to #3 from `claude/kind-bohr-75erpe` (Nov. 23: fixture pinning, public hosting, focus bar); then, on Nov. 23, one squash commit of the integration branch with the Nov. 22 work below (feed fix, panel layout, live check notes); a second on Nov. 23 (live-data heartbeat, honest game-event times, logo research, map helmets); a third on Nov. 23 (depth charts, player crosswalk, Sleeper trends); the feature-research docs (`a85f25c`, from the research session); a fourth squash on Nov. 23 (snapshot carry-forward, F01); a fifth on Nov. 23 (reliability batch: F31, F01 parts 3–4, F30); a sixth on Nov. 23 (more odds sources: line history, NWS stadium alerts, The Odds API adapter switched off until a key is set, what moved the odds); a seventh on Nov. 23 (model events in the feed, F22); an eighth on Nov. 23 (the panel layout's second review fixes); a ninth on Nov. 23 (the preview reads the owner's environment; The Odds API's first real call recorded); a tenth on Nov. 24 (the daily data fetch on GitHub Actions, DEC-021); an eleventh on Nov. 24 (both teams' win chances on the game cards); a twelfth on Nov. 25 (week rollover with recent finals; data fetch every 3 hours); a thirteenth on Nov. 25 (FantasyPros keeps only each team's top-projected quarterback); a fourteenth on Nov. 25 (quarterback names compared without suffixes); a fifteenth on Nov. 25 (NFL TV, DEC-022); a sixteenth on Nov. 25 (NFL TV skips live streams not yet started); a seventeenth on Nov. 25 (docs brought up to date; the refresh starts the data fetch itself, DEC-023); an eighteenth on Nov. 25 (`npm run refresh` asks for the fetch when the snapshot is stale); plus the daily data refresh, the data fetch and the FantasyPros job. Commit hashes quoted elsewhere in these docs belong to the branch histories they came from.
  - `worktree-nfl-universe` (worktree `.claude/worktrees/nfl-universe`): integration branch for the next milestones; kept in step with `main`.
- Commit: see `git log -1` on each branch.

## What is left (Nov. 25, 2026)
Checked against the repository, GitHub's run history and the live sources on Nov. 25, 2026, 16:45 UTC.

**Reliability (do first)**
1. **GitHub is skipping the scheduled data fetch.** No scheduled run from Nov. 24, 18:48 UTC to Nov. 25, 17:20 UTC (seven 3-hour slots). Today's source check (due 11:41 UTC) and FantasyPros run (due 08:10 UTC) had not started by 16:43 UTC either. This morning's refresh kept the 05:23 UTC snapshot from a run started by hand. **Fixed (DEC-023, on `main`):** `npm run refresh` first pushes a fetch request to `main` when the snapshot there is over 8 hours old, which starts the data fetch and FantasyPros at once, and waits for the snapshot. Tested live on Nov. 25 (snapshot on `main` 17 seconds after the request). First use by the 4:35 AM refresh: Nov. 26; check its report.
2. **ESPN's headline feed fails from GitHub's servers** since Nov. 24 evening ("not an RSS document"). From the owner's Mac it answers normally (30 items on Nov. 25). The published snapshot carries the Nov. 24, 18:48 UTC headlines, for 7 days at most. The source check opened issue #5 for it.
3. ~~FantasyPros file on `main` still lists free agents~~: rewritten by the live test's run on Nov. 25 (32 teams).
4. **Old worktrees on disk**: `agent-ad1ce008d0e55eb4f`, `agent-adaeb813e8038ab4d` (both merged Nov. 21) and `panel-layout` (taken by hand Nov. 23). Remove them with the owner's OK.

**Checks that need a real game**
5. Follow a game from kickoff to final with the heartbeat: kickoff and score events without the "~" estimate mark, the helmets' live pulse and score, and a full slate on the map. Next chance: the Thanksgiving games, Nov. 26.
6. NFL TV during a live press conference was seen once on Render (Jaguars, Nov. 25); the claude.ai copy has not been opened inside the real viewer.

**Features (order in `FEATURE_ROADMAP.md`)**
7. Phase 1 left: F35 honest uncertainty, F17 injury claims, F40 daily digest then F09 feeds and calendars, F20 live playoff odds (after the game check), F23's sparkline and anomaly flags.
8. Phase 2: F05 forecast ledger, F07 one simulation state, F08 alerts, F06 and F34; F04's split of division and Super Bowl chances. F02 ("What does my team need?") is on hold: the owner said "Not now" on Nov. 25.
9. Live news on the front page (owner asked on Nov. 25, World Monitor style): NFL TV covers video; a fuller live news panel with more sources was proposed and not yet chosen (backlog F54).

**Owner decisions**: see "Decisions waiting on the owner" below.

## Nov. 25, 2026: NFL TV (on `main`)
- Panel `tv` (`src/universe/16-tv.js`), fabric source `youtube-reel`, payload `media.reel`, the page policy's `script-src` gains `https://www.youtube.com` (DEC-022). Tests: fabric 73, page 320 checks, layout 147, all passing; eleven deliberate breakages of the new code all caught.
- Checked in the browser on localhost: muted autoplay, skipping and remembering refused videos, links when none can play, tap to play on a phone-width screen, pause when scrolled out of view.
- Owner decisions (YouTube API Services policies, DEC-022): a privacy-policy agreement that says the page uses YouTube API Services (III.A.2), and Made for Kids checks for embedded videos (III.E.4.j, needs a YouTube Data API key). Both apply to the media panel's player since M8 as well.
- Render (checked after the merge): five of twelve played, the same four refused and skipped, three were live streams scheduled for later that left the panel waiting. Fixed and on `main`: scheduled streams go last in the reel, and the page skips one that has not started after 12 seconds on screen.

## Nov. 23, 2026: daily refresh unblocked (branch `claude/kind-bohr-75erpe`, on `main` via pull request #1)
- The Nov. 23 refresh did not commit. Running `npm run refresh` by hand showed why: the MCP and command-center suites checked the synthetic fixtures' matchups against the live build, and Sunday's results turned those matchups into played games.
- Fix: both suites now pin the engine's season data to `test/fixtures/engine-data.js` (the Nov. 22 build; `NFLU_ENGINE_DATA` for the MCP server). See `test/fixtures/README.md`. `test/run.js` still runs on the current data.
- Checked: `npm test` passes on the committed Nov. 22 data and on a fresh Nov. 23 build. The fresh build was not committed (five sources were unreachable from the cloud container), so the data on `main` is still Nov. 22 until the scheduled refresh runs with this fix merged.

## Nov. 23, 2026: public hosting prepared (branch `claude/kind-bohr-75erpe`)
- `render.yaml` plus server guards for public hosting (DEC-018): `/api/live` is off without the local scope, per-client API request cap, Render hostname allowed automatically. Tests added in `test/fabric.test.js`.
- Checked: `npm test` passes; the server was started with the hosted settings in the cloud container and served the page, `/api/universe` (public sources only), 404 on `/api/live` and 403 for a foreign Host.
- Not done: the deploy itself. It needs the owner's Render sign-in. Not verified on Render. (Since done: https://nfl-universe.onrender.com, redeployed on every push to `main`; checked Nov. 25.)

## Nov. 23, 2026: focus bar (branch `claude/kind-bohr-75erpe`)
- New `src/universe/05-focus.js` and a focus bar under the top bar: NFL, then conference, division and team. The choice is in the URL (`?focus=AFC`, `AFC-EAST`, `NYG`) and narrows the map (teams outside are dimmed; the geographic map frames a division or team), the feed, the ticker, this week's games, the teams panel and media. Items with no team tag are left out while a focus is on. The team center has a "Focus on this team" button.
- Not narrowed by focus: the "What is happening in the NFL?" brief, system health and the simulator view.
- Checked: `npm test` (217 command-center checks, 20 of them new) and a browser run at desktop and phone widths against the local server.

## Repository reality (Nov. 25, 2026)
- Stack: plain JavaScript page built into one HTML file (about 710 KB with the embedded data), dependency-free Node server, standard-library Python build, numpy only for offline evaluation.
- What runs: `npm start` serves the page and the APIs on http://localhost:3000 (this machine only; the preview pane uses 3001 when 3000 is taken). The page opens on the command center; `?view=sim` is the original simulator. Public copies: the hosted server on Render (https://nfl-universe.onrender.com, public sources only, DEC-018) and the static page on claude.ai, rebuilt by the daily refresh.
- Sleeper: read-only trending adds and drops (`sleeper-trending`); no league access. FantasyPros: one call a day on GitHub Actions, only each team's top-projected quarterback committed. The Odds API: on, from the owner's Mac and the GitHub secret (DEC-019).
- Tests: `npm test` runs five suites: engine and feed parser, 5 MCP tests, 73 data-fabric tests, 322 command-center checks, 147 layout checks. All pass on `main` (Nov. 25).
- Scheduled jobs: the claude.ai daily refresh (4:35 AM Eastern); on GitHub, the data fetch (every 3 hours), FantasyPros (3:10 AM Eastern), the source check (6:41 AM Eastern) and the backup refresh (1:23 PM Eastern). GitHub starts them hours late or skips them (see "What is left").

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

## Nov. 23 (on `main`): depth charts, player crosswalk, Sleeper trends
- New public sources `nflverse-depth`, `nflverse-rosters`, `sleeper-trending` (registry rows with terms and Nov. 23 checks). Injured players get starter or backup from the current depth chart; each team panel shows its players among Sleeper's 25 most added and dropped (24 hours), credited to Sleeper.
- Checked: real sources in a fresh run (4.3 s; contract and public-snapshot checks clean; 142 of 143 injured players matched by id; all 50 trending players named); the Raiders panel in the browser.
- Not done: an MCP tool for the trends; the depth charts shown as charts (only used for starter labels so far); the 80 MB depth file has not been tried from the cloud refresh, which already could not reach some sources.

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
- The page is about 710 KB (no minification; the snapshot is embedded).
- Not built yet: depth charts in injury weights beyond the quarterback; player canonical ids (candidate crosswalk is GPL data, owner decision); tiebreaker steps from nflseedR; time-machine replay from `seenAt`; sportsbook futures.
- Not verified: a full game from kickoff to final (only the first quarter, Nov. 22); touch dragging of panels on a real tablet; the claude.ai copy inside the real viewer.
- Verified since: the project's agents and rules load in a session opened in this worktree (Nov. 25: the 12 agents are offered and the rules are read); the daily refresh runs as a claude.ai routine and the data fetch on GitHub Actions (DEC-021).

## Decisions waiting on the owner
1. Language-model provider and cost ceiling, or none (DEC-009). Gates F11, F12, F13.
2. YouTube API Services policies (DEC-022): a privacy policy that visitors agree to and that says the page uses YouTube API Services (III.A.2), and Made for Kids checks of embedded videos (III.E.4.j, needs a YouTube Data API key). They apply to the media panel's player since M8 and to NFL TV.
3. Official club news feeds (F14): write to the clubs for permission, link to club home pages only, or drop.
4. Sleeper "my league" (F18): whether to connect a league, read-only and local.
5. Storing Web Push subscriptions (F10 stage 2, F39).
6. Removing the three finished worktrees (see "What is left").
- Settled since Nov. 23: The Odds API key (on the owner's Mac in `~/.zshenv` and as the GitHub secret `ODDS_API_KEY`, Nov. 25; DEC-019); where the server runs (Render, public sources only; DEC-018); where the refresh runs (claude.ai routine plus GitHub Actions; DEC-021); the FantasyPros key (GitHub secret, Nov. 25).

## Effects of the Nov. 21 merge (seen since)
- The daily refresh runs `scripts/fabric-snapshot.js` and the test suites, and the page it publishes opens on the command center with the public snapshot and its age, never ESPN data. Its workspace reaches only GitHub, so the snapshot now comes from the GitHub data fetch (DEC-021).

## Nov. 23, 2026: feature research (docs only, no code changed)
- New living documents: `FEATURE_RESEARCH.md` (baseline, competitors, open-source, technology and data research, scoring of 39 candidates, top 20, top 5, rejected ideas), `FEATURE_BACKLOG.md` (one entry per candidate), `FEATURE_ROADMAP.md` (P0–P2 and order).
- Found while researching:
  - The Nov. 23 refresh published a degraded public snapshot. Open-Meteo, both RSS feeds, YouTube and podcasts all failed with `fetch failed`, and the run overwrote the previous good data. There is no event file for Nov. 22. Backlog F01, fixed on Nov. 23 (see below).

## Nov. 23 (on `main`): more odds sources and what moved the odds
- Owner asked for more betting-odds sources, more news that moves odds, and a view of what moved them. Order: research (club news feeds, The Odds API terms, NWS: running), line history (done), NWS stadium alerts, The Odds API adapter (switched on by the owner's key), club news feeds where allowed, then model events (F22) and "what moved the odds" (F04).
- Line history (F23, first part): `lib/fabric/lines.js`; `lines` block in the payload and contract; the game panel lists it. Checked live on CIN at WAS. Tests: 3 new fabric tests, 3 page checks.
- A slip found only in the browser (the game panel referenced a variable outside its scope) was fixed; page-level browser tests remain backlog F33.
- NWS stadium alerts: `lib/fabric/adapters/nws.js`, source `nws-alerts` (public, 30 min, outdoor stadiums with a game within 2 days, 3 at a time; 4xx answers counted as outside coverage). `games[].alerts` in the payload and contract (public snapshot refuses alerts from local sources); the game panel's Weather section shows them first; feed events typed `weather`. Tests: 2 new fabric tests, page checks for `cleanAlerts`. Real call: 6 stadiums, none under an alert.
- Club news feeds (F14): all 32 clubs publish RSS, but every club's terms reserve the content; not wired without permission (registry section "Official club news feeds").
- The Odds API (F24, DEC-019): `lib/fabric/adapters/oddsapi.js`, source `odds-api`, off until `ODDS_API_KEY` is set (status "disabled" with a note saying so). `games[].market` (median across books, published) and `games[].books` (each book, local server only; the public-snapshot check refuses it) in the payload and contract; the consensus enters the line history and is carried by the snapshot for games not yet started. Credit floor 15, every 8 h plus the daily snapshot. The backup refresh passes the optional secret `ODDS_API_KEY`. Tests: 5 new fabric tests (key never in a URL, payload, cache file or error; floor; carry), 6 page checks; the panel checked in the browser with test values put into the page. Not yet run against the real API (no key). (Since: first real call Nov. 23 from the owner's Mac; on GitHub from Nov. 25, see below.)
- What moved the odds (F04 first part, DEC-020): snapshot version 2 (`probs`, `gaps`, `games`; about 8 KB a day); engine `changeWatch` and `explainChange`; "Why it moved" in the team panel (one extra blend simulation per page load, run when a team panel first opens); `why` per mover in MCP `get_what_changed`; the game panel's "Seen in the feed between two looks" for big line moves (checked on real data: CIN at WAS, four items). Tests: engine checks with an upset and a moved line in copies of the data (parts add up; own results within 1 point of both teams' change), 2 page-check groups, 1 MCP test; nine deliberately broken versions each caught. Until a version-2 forecast exists the panel says the saved one predates the figures. Not built: division and Super Bowl splits; the simulator page's card.
- First real runs (Nov. 25, GitHub): The Odds API ok (16 of 16 games with a consensus of 8 books; 485 credits left); FantasyPros ok (77 quarterbacks, 32 teams). Fix (on `main`): name suffixes ignored when comparing quarterbacks (`_plain` in `build.py`; the Chiefs were falsely flagged), `FA` dropped.
- FantasyPros (on `main`): key set as a GitHub secret on Nov. 25. `scripts/fetch_fantasypros.py` makes one call and writes only `data/fantasypros/qb_top.json` (top-projected quarterback per team, nflverse team codes, credited); `build.py` reads it; the workflow commits that file only; `.gitignore` keeps raw files out. 1 new fabric test (runs the Python script on a saved answer and the build function); eight deliberately broken versions, seven caught at first and the eighth after a check was added. The real API was first called on Nov. 25 (see the line above); the field names matched.
- Data fetch timing (on `main`; DEC-021 amended): every 3 hours, keep window 8 hours, `actions/cache` of `.cache/fabric/public`, `minIntervalMs` in `lib/fabric/source.js` (The Odds API 11 h), public runs drop book prices on arrival; FantasyPros workflow skips without its key. Tests: 2 new fabric tests and workflow checks; seven deliberately broken versions, all caught.
- Week rollover and recent finals (on `main`): `normalizeGames` returns `prev` and `next` weeks; the fabric rolls to the next week when every game of the schedule's week is final in the live feed or ESPN is on the next regular-season week; weather and NWS targets include the next week; ESPN games the schedule places in another week are not added; optional `recentFinals` in the payload and contract (public snapshot: public sources only); the page's `recentFinalGames`/`resultGames` count them in records and the simulation (matched by game id, never twice). Tests: 3 new fabric tests, 6 page checks; eleven deliberately broken versions, nine caught at first and two after checks were added; the leftover-games fix's own check was strengthened until it failed against the old code. Checked on real data: week 12 with 16 games, 14 with the sportsbook consensus, Washington's win counted (nflverse had scored it by then, so the live-feed rollover itself was exercised only in tests).
- Game cards show both teams' win chances (on `main`): `winSplit` in `10-games.js`, the game panel's sentence names both teams; 5 page checks; checked live in the browser on CIN at WAS.
- Daily data fetch on GitHub Actions (on `main` from Nov. 24; DEC-021): `.github/workflows/data-fetch.yml` (07:05 UTC, optional `ODDS_API_KEY` secret, commits `data/fabric/`); `npm run refresh` keeps a contract-valid snapshot under 4 hours old (`scripts/fabric-snapshot.js --keep-if-fresh 4`, with `main`, `keepHours`, `isFresh`). Found: the claude.ai refresh (a Cowork task) reaches only GitHub and package registries, which is why its Nov. 23 snapshot lost every non-GitHub source. Tests: 1 new fabric test; eight deliberately broken versions, seven caught at first and the eighth after the test was strengthened. Real run from the owner's Mac into a temporary folder: every public source ok, contract clean, The Odds API on (488 credits left), no book prices and no key in the file. The `ODDS_API_KEY` secret was added on Nov. 25.
- Panel layout, second review (on `main`): from `a6cd2b7` on `worktree-panel-layout`, taken by hand: pointer tracking that ends on a missed release, Escape cancelling a resize or divider drag, default spans with no empty column, map share up to 90% with the divider's value in range, the grab cursor; the top-bar and menu-focus parts were already in (first review, `1d36569`) and were left as they are. Checked in the browser at 1440 px: Escape and a missed release each put the width back and clear the resize cursor; a normal release saves. 141 layout checks.
- F22 model events (on `main`): `playoffMoveEvents`, `marketGapEvents` and `withModelEvents` in `01-data.js`; the comparison run now starts after the first simulation, and with an older forecast still gives each team's chance now. Model events are left out of the brief's top story, the map's breaking rings and the team panel's news list. Checked in the browser on real data: 11 playoff moves since Nov. 22 and 3 disagreements in the Model filter; clicks open the team and the game. Tests: 14 page checks; eight deliberately broken versions: six caught at first, a seventh after a check was strengthened; the eighth changes nothing (it removes a guard the data already makes unreachable).

## Nov. 23 (on `main`): reliability batch (F31, F01 parts 3–4, F30)
- F31 items 1–7: `/api/live` timeout, retry wait and shared request; the `public/` containment check; a Content-Security-Policy on the page (inline scripts by hash, worker from blob:, Google Fonts, YouTube thumbnails and player, podcast audio over https); the simulator checks live games (`cleanLiveGame`) and news links (`safeHttpsUrl`), times out and backs off its poll; dead `openLive` removed; focus-team figures dropped from command-center results. Item 8 (one constants table) left out.
- F01 parts 3–4: `.github/workflows/refresh-backup.yml` (daily 1:23 PM Eastern) runs `npm run refresh` only when today's has not run, commits, and keeps one GitHub issue labelled `data-refresh` when today's snapshot lost or carried two or more sources (`scripts/refresh-status.js`). It does not republish the claude.ai page.
- F30: `.github/workflows/source-check.yml` (daily 6:41 AM Eastern) checks every public source twice when something fails and keeps one issue labelled `source-drift`, closed when all pass (`scripts/source-check.js`).
- Checked: all five suites pass (6 new fabric tests, engine and page checks); nine deliberately broken versions each caught; in the browser with the policy on, the map, helmets, fonts, thumbnails, the simulation worker, the YouTube player and the simulator's live poll all work with no blocked-resource errors; both workflow files parse; both scripts ran against the real sources.
- Independent review: nothing blocking; five findings fixed. A hanging test could end the run as a pass, so the runner now gives each test 60 s and fails until the last one finishes. The status check now also reads the published `latest.json` and flags a refresh that wrote no fabric snapshot, so it works even if `runs.json` is not committed; on Nov. 23's real data it reports the five sources lost that day. The backup steps aside when the scheduled refresh lands meanwhile, never fails on a rebase conflict, and runs only from `main`. The source check compares contract messages without array positions and closes its issue only when the last check passed. Scripts are hashed with line breaks normalised, as the browser does. Two nits also fixed (a fetch that throws at once; apostrophes in links).
- Not yet: either workflow has run on GitHub (both are on `main` from Nov. 23; they can also be started by hand from the Actions tab). (Since: the source check ran on Nov. 24, 21:28 UTC, and opened issue #5 for ESPN's RSS feed; the backup refresh ran on Nov. 25, 02:37 UTC, about 8 hours after its time.)

## Nov. 23 (on `main`): the snapshot keeps a failed source's data (F01, parts 1 and 2)
- `lib/fabric/carry.js`: in the daily snapshot, a public source that fails for the whole run keeps its part of the previous published snapshot (headlines, weather, injuries, games, videos, episodes, fantasy trends), reported `stale` with its original `lastOk`, its true age and `carriedFrom`. Never from a local source, never older than 7 days; sources that only shape other parts (depth charts, the roster crosswalk) are not carried, and their parts fall back to the older rules.
- `scripts/fabric-snapshot.js` keeps a report of its last 60 runs in `data/fabric/runs.json` (ok, stale, down, carried, events added) and logs what it carried. The daily refresh must commit `data/fabric/runs.json` along with `latest.json` and the event file for the report to survive between runs.
- Checked: 2 new fabric tests (the merge, and the script end to end in a temporary folder), five deliberately broken versions each caught; a real run with Yahoo's feed made to fail kept 47 Yahoo headlines, shown stale.
- Parts 3 and 4 followed the same day (see the reliability batch below).
  - Small robustness and security fixes, listed in backlog F31.
  - The "Model" feed filter can never show anything: nothing emits `model` or `playoff_move` events (F22).

## Next actions
See "What is left" at the top of this file.

## Commands actually run (Nov. 21 session)
| Command | Result |
|---|---|
| `npm test` | Pass, 4 suites |
| `python3 scripts/build.py --reuse` | Pass |
| `node scripts/fabric-snapshot.js` | Public snapshot written, public sources only |
| Every API route against real sources (spare port) | 200s; bad ids 404; foreign Host 403 |
| MCP live stdio session | `initialize`, `get_source_health`, `get_injuries` answered from real sources |
| Browser pane: desktop and phone checks | As above |
| Deliberately broken validator, clustering, page escaping | Each caught by a test or a check |
