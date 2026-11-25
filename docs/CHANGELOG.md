# Changelog

## 2026-11-25 (the refresh asks for its data)
- GitHub's scheduler skipped the data fetch for almost a day, which the morning refresh depends on. The refresh can now ask for a fetch itself: it pushes a small request file to `main`, which starts the data fetch and the FantasyPros job at once, and it waits up to 10 minutes for the new snapshot. If nothing arrives, it carries on as before. The FantasyPros job also gained the data fetch's safeguards: it runs only from `main` and retries a push that races another commit (DEC-023).

## 2026-11-25 (NFL TV on the hosted site)
- Checked on Render: five of the twelve videos played, the same four were refused as on the owner's computer and skipped, and three were press conferences posted as live streams starting hours later, where NFL TV stood still on "Live in 4 hours". Such streams now go to the end of the reel, behind press sessions that have happened, and one still not started after 12 seconds on screen is skipped for the visit.

## 2026-11-25 (NFL TV)
- A new panel at the top of the right column, NFL TV, plays the teams' newest press conferences and media sessions, then the league's newest videos, one after another. On a wide screen it starts by itself, muted, while it is on screen; on a phone a tap starts it with sound; "Turn off NFL TV" is remembered. The NFL blocks its own videos and its game footage on sites it has not approved, so the page uses YouTube's official player script to skip any video it is refused and remembers those in the browser; when none can play, the panel lists them as links. The NFL Channel on NFL.com and the NFL's YouTube live page are links, since neither can be embedded. Saved panel layouts gain the panel at the top of their right column. YouTube's Terms of Service and Google's Privacy Policy are linked beside YouTube's players (DEC-022).
- "Addresses the media" titles now count as press sessions in the media panel's filter.

## 2026-11-25 (FantasyPros and The Odds API, first runs on GitHub)
- Both keys are set as GitHub secrets and both jobs ran. The Odds API: all 16 of this week's games carry the median line across 8 US sportsbooks in the published data, 485 credits left. FantasyPros: the answer had the expected fields; all 32 teams mapped. Its first run showed that names carry suffixes ("Patrick Mahomes II"), which would have flagged the Chiefs as a possible quarterback change; names are now compared without Jr., Sr., II, III, IV or V, and free agents (`FA`) are dropped. On real data three teams are flagged: Arizona, Indianapolis and New England.

## 2026-11-25 (FantasyPros: only what the page uses)
- With the FantasyPros key now set, the daily job would have committed FantasyPros's raw answers (every quarterback projection, injury news, the player list) to this public repository. It now makes one call instead of three and commits only `data/fantasypros/qb_top.json`, each team's top-projected quarterback with his projected points, credited; the build reads that file. Raw files are ignored by git, and the script refuses to keep the raw answer inside the repository.

## 2026-11-25 (data fetch timing)
- GitHub started the daily data fetch almost 12 hours late on Nov. 24, so the morning refresh missed it. The fetch now runs every 3 hours and the refresh keeps a snapshot up to 8 hours old. The Odds API is looked at no more than once every 11 hours per place (about 13 credits a day at most), and GitHub's cache of this public repository never holds a sportsbook's own prices.
- The FantasyPros job no longer fails every day without its key: it notes that the key is missing and stops.

## 2026-11-24 (the week moves on as soon as it is over)
- On the local server, the moment the live feed shows every game of the week final (or ESPN's scoreboard has already moved to the next week), the command center shows the next week's games, with their lines, weather and odds, instead of waiting hours for the schedule file to record the last score. The finished week's results still count: the payload carries the last week's finals (`recentFinals`), and the page uses any the simulation's data does not have yet in records and the simulation, never twice. ESPN's leftover games from last week no longer slip into the new week. The published page is unchanged: it is rebuilt once a day, and live scores stay on the owner's computer (DEC-006).

## 2026-11-24 (who is favored, on every game card)
- Each game card in "This week" shows both teams' chances to win at the end of their rows, the favorite in bold, with a two-sided bar and a label ("CIN favored, 54%", or "Even" at 50%). The game panel names both teams, favorite first. Same numbers as before (the page's model before kickoff, the feed's live chance in play); finals show none.

## 2026-11-24 (the daily data fetch moves to GitHub Actions)
- The published page's data (weather, alerts, headlines, videos, podcasts, fantasy trends and, once the `ODDS_API_KEY` secret is set, the sportsbook consensus) is now fetched by a GitHub Actions job at about 2 AM Eastern, where every source is reachable. The claude.ai daily refresh keeps that snapshot instead of fetching again from its workspace, which reaches only GitHub (DEC-021). It explains why weather, headlines and videos were missing from the published page.

## 2026-11-23 (panel layout: second review's fixes)
- Dragging a panel, resizing one or dragging the map divider no longer gets stuck when the mouse button is released outside the window; Escape cancels a resize or a divider drag and puts the saved layout back.
- Panels without a width of their own now share out every column (three panels in four columns span 2, 1 and 1), so no column is left empty.
- The map may take up to 90% of the width, and the divider's reported value stays within its range. The grip shows the grab cursor.
- From the panel session's second independent review (`a6cd2b7` on `worktree-panel-layout`); its top-bar and menu-focus fixes were already in from the first review and were not taken twice. 13 more layout checks (141).

## 2026-11-23 (model events in the feed, F22)
- The feed's Model filter now has items: each team whose playoff chance moved 3 points or more since the last saved forecast (beyond simulation noise; with the split once forecasts carry it), and each game where the ratings and the posted line disagree by 8 points or more. Labelled "model estimate", dated by the build, never shown as breaking news; clicking one opens the team or the game. On Nov. 23's data: 11 playoff moves since the Nov. 22 forecast and 3 disagreements.

## 2026-11-23 (what moved the odds, F04 first part)
- Each team panel gets "Why it moved": the change in playoff chance since the last saved forecast, split into own results, other teams' results, betting lines posted or moved, team ratings and what is left (effects between games and simulation noise), with the results and games named. A model estimate, labelled as one (DEC-020). The assistant's `get_what_changed` gives the same split.
- Saved daily forecasts (version 2) now keep each remaining game's chance and what the next two weeks' games are worth to every team; the first split appears once a build compares with one (from Nov. 25).
- The game panel lists what the feed had about either team between the two looks of each big line move: context, not cause.

## 2026-11-23 (The Odds API, off until a key is set)
- New source `odds-api`: moneyline, spread and total from each US sportsbook The Odds API covers, for this week's games not yet started. The game panel shows the median across books (spread, total, home win chance with the books' margin removed) with its age; the local server also lists each book. Only the median is ever published (DEC-019). The median enters the line history. Off until the owner sets `ODDS_API_KEY`; written from the provider's guide and tested on fixtures, not yet run against the real API.

## 2026-11-23 (weather alerts at stadiums)
- New public source `nws-alerts`: the National Weather Service's active alerts (wind, winter, cold, heat, storms, fog) at each outdoor stadium with a game in the next two days, every 30 minutes. Only alerts in force from 3 hours before to 4 hours after kickoff are kept. They show first in the game panel's Weather section in the Weather Service's own words, linked to its forecast page, and as weather events in the feed. Descriptive only, not a model input. Checked against the real service on Nov. 23 (6 stadiums, no alerts in force).

## 2026-11-23 (line history, F23 first part)
- Every betting line the data fabric reads is kept as a per-game history (a new entry only when a source's line changes, opening lines once), in the local server's state and in the published snapshot, which merges yesterday's history with today's. The game panel lists it, with moves of 1.5 points or more marked. Checked on the Monday night game: Washington opened +1.5 and was +6.5 by 7:41 PM.

## 2026-11-23 (reliability batch: F31, F01 parts 3–4, F30)
- Security and robustness (F31): a Content-Security-Policy on the page with its inline scripts allowed by hash; `/api/live` timeout, retry wait and shared request; the `public/` containment check fixed; the simulator checks live games and news links and backs off its poll; focus-team figures dropped from command-center results.
- Backup daily refresh on GitHub Actions, run only when the scheduled refresh has not; one GitHub issue (`data-refresh`) when a day's snapshot lost or carried two or more sources (F01 parts 3–4).
- Daily source check on GitHub Actions; problems present in two checks 20 minutes apart open or update one issue (`source-drift`), closed when all pass (F30).

## 2026-11-23 (daily snapshot keeps a failed source's data: F01)
- A public source that fails for a whole snapshot run keeps its part of the previous published snapshot, reported stale with its original time and true age, instead of vanishing from the published page (as weather, headlines, YouTube and podcasts did on Nov. 23). Never from a local source, never older than 7 days.
- The snapshot script keeps a report of its last 60 runs in `data/fabric/runs.json` and logs what it carried.

## 2026-11-23 (new sources: depth charts, player crosswalk, Sleeper trends)
- Three free, keyless sources wired into the data fabric, all public scope: nflverse depth charts (`nflverse-depth`, the newest snapshot per team from an 80 MB season file, every 12 hours), nflverse weekly rosters (`nflverse-rosters`, the player crosswalk across nflverse, ESPN and Sleeper ids) and Sleeper's trending players (`sleeper-trending`, 24-hour adds and drops, hourly).
- Injured players are now marked starter or backup from their team's current depth chart, matched by player id (142 of 143 on Nov. 23); the descriptive injury burden uses it. The page labels each injured player and says where the label comes from.
- New optional `fantasy` block in `/api/universe` and the public snapshot, checked by the contract; each team panel shows its players among Sleeper's most added and dropped, credited to Sleeper.
- 6 new fabric tests and 6 new page checks; five deliberately broken versions each caught. Checked against the real sources (4.3 s, contract clean) and in the browser.

## 2026-11-23 (map: helmets where teams play today)
- New default map layer "Helmets: where teams play today" (geographic map). On a game day both teams' helmets stand at the game's stadium (the visiting team in the home team's city, or at the neutral site), facing each other; a live game gets a pulse and its score, a finished one its final score. Teams not playing today stay at home. The schedule gives no travel or practice locations, so none are shown.
- The helmet is this project's own drawing in each team's two colours from `shared/teams.json`, not a club logo or helmet design (no club marks are openly licensed; see the source registry).
- Helmets stay at least 18 px wide on phones. A saved layer choice from before this layer existed gains it; a viewer who turns it off keeps it off.

## 2026-11-23 (live data: server heartbeat and honest game-event times)
- The server checks on its own every 20 seconds during game windows and every 5 minutes otherwise, so scores and game events stay current with no page open (`FABRIC_WATCH=0` turns it off; hosted public servers without the live scoreboard don't poll).
- Kickoff and score events are dated inside the gap they were seen in (kickoffs by the scheduled kickoff when it falls there); gaps over two minutes are marked as estimates and shown with "~". A change that may be several scores reads "Score update" instead of naming one scorer.

## 2026-11-22 (panel layout)
- Command-center panels can be moved, hidden, resized and reset:
  - move: drag a panel's header, or focus its grip and use the arrow keys;
  - hide, show and reorder: the Panels menu in the top bar;
  - resize: drag a panel's bottom or right edge (arrow keys too; double-click resets);
  - map width: drag the divider between the map and the panel column;
  - Reset layout restores the defaults.
- The layout is saved per browser and checked against the known panels when read back; without storage the page uses the defaults.
- Phones keep the one-column tabs, which follow the chosen order and hidden panels.
- `src/universe/17-layout.js`; 124 new checks in `test/layout.test.js` (in `npm test`).

## 2026-11-22 (feed: old items no longer look new after a fresh start)
- A server starting with an empty history stamped every item without its own time (injury statuses, line moves, weather flags) with the start time, so they sat at the top of the feed and the ticker as "2m ago" and pushed real headlines down. Such items are now marked `data.beforeWatch`, shown as "before 12:37 PM", listed after everything with a real time, and left out of the ticker and the brief. Folders saved before this change take their earliest first-seen time as the start. One new fabric test and 5 interface checks (202), each shown to fail against broken code; checked once against the real sources (14 of 234 items marked, today's headlines on top).

## 2026-11-21 (media links where players are blocked)
- Where the host refuses outside media (the claude.ai artifact viewer), the Media panel, team and game panels switch to links: videos open on YouTube, episodes on their episode page, each in a new tab. Detected from the browser's own refusal reports; the normal page is unchanged. 23 new interface checks (197), each new rule shown to fail against deliberately broken code.

## 2026-11-21 (NFL Universe, milestone M8: media center)
- Official YouTube channels of the NFL and all 32 teams (ids from Wikidata and research, each checked against the channel's own feed, with its evidence level), and six official NFL podcasts. Fabric sources `youtube-official` and `podcasts-nfl`; podcast feeds (up to 57 MB) are read only until the newest episodes arrive.
- Media panel: latest videos (press conferences, highlights, previews, optional Shorts), "Live on YouTube" links for every official channel, podcast players; videos in team and game panels; a Video map layer. Click-to-load privacy-enhanced player; strict address allowlists on server and page.
- Browser check: an official press conference played in the page. YouTube's live-stream embed did not work, so live is a link to each channel's live page (DEC-017).
- Independent review: 3 blocking and 11 non-blocking findings fixed (podcasts survive refreshes, "Live page" wording, outages reported, official-account-only podcast audio, deduplicated episodes, per-channel quotas, exact address checks, linear-time parsing, accessibility). 37 fabric tests, 174 interface checks.

## 2026-11-21 (NFL Universe, milestone 1)
- Project operating system: constitution in `CLAUDE.md`, agent definitions and rules in `.claude/`, living documents in `docs/` (audit, World Monitor analysis, license decision, source registry with terms, architecture, dependency plan, decisions).
- Contracts: `shared/teams.json` (canonical teams and provider ids), `lib/contract.js` (`/api/universe`, public snapshot, `/api/game`), synthetic fixtures from `test/fixtures/make-fixtures.js`.
- Data fabric (`lib/fabric/`): adapters for nflverse, Open-Meteo, ESPN and Yahoo RSS, curated news, and local-only ESPN JSON; circuit breakers with last-good caches; injury reports compared across sources; headlines clustered across publishers; events with first-seen times; `/api/universe`, `/api/health`, `/api/game/<id>`, `/api/team/<abbr>`.
- `scripts/fabric-snapshot.js`: public snapshot embedded in the page and a dated event record; first step of `npm run refresh`.
- `simulate()` takes an optional seed (default unchanged).
- The server listens on localhost by default (`HOST` to change) and the API refuses foreign Host headers (`ALLOWED_HOSTS` to add names). A malformed request no longer crashes the server (also a bug on `main`).
- Independent review of the data fabric: 3 blocking and 9 non-blocking findings fixed (fresh daily snapshot, separate public and local caches, a complete public-snapshot check, kept kickoff and score events, clustering and scoring corrections, nickname-tolerant injury matching, starter-aware quarterback flag); 25 fabric tests including negative cases.
- MCP server (`mcp/`): 14 read-only tools over stdio; `docs/MCP_ARCHITECTURE.md`.
- Command center (`src/universe/`), now the page's default view: geographic, division and "intelligence" map modes with 17 layers, URL state, time ranges, intelligence feed, games strip, ticker, team and game panels, system health, the computed brief, and simulation in a Web Worker (20,000 seasons by default, 100,000 on request). Paints from the embedded snapshot, then polls `/api/universe` with backoff; labels snapshot and stale data as such. The simulator is unchanged as `?view=sim` and starts only when shown.
- The page refuses non-web link addresses from data.
- Independent review of the command center: 3 blocking and 8 non-blocking findings fixed (honest live status from source health, mode labels, a headline that could break the page, panel robustness, live-chance consistency, focus, ticker, deep-run race, labels, accessibility); 104 interface checks.
- Build: `src/universe/` modules inlined into the page; `python3 scripts/build.py --reuse` re-renders without downloading.

## 2026-11-20 (news ticker)
- Scrolling news ticker under the page header; each item links to the What changed section.
- Effect of a news item on every team's playoff chance: the line move for the team's next game times what that game is worth to each team (`simulate`'s new `watch` argument). Shown only when a line from before the news exists.
- News items gain `headline` and optional `lineBefore`; the build attaches pre-news lines from earlier snapshots.

## 2026-11-20 (quarterbacks, news, what changed)
- Quarterback adjustment on the results rating from nfelo's published quarterback values (backtest 0.6383 against 0.6391; 0.6335 against 0.6345 in games after a change). A newly named starter with no value this season gets no adjustment.
- `data/news.json` and a "What changed" section: news items with sources, line moves and playoff-chance movers since the previous snapshot.
- Hold-out check (`scripts/backtest_qb.py`): constants tuned on earlier seasons only scored 0.6503 on the next season, against 0.6437 with the page's in-sample constants and 0.6554 for the spread rating alone.
- Tested and not adopted: nfelo's team rating in the blend, the quarterback adjustment on the spread rating.
- Snapshots keep the first forecast of each day.

## 2026-11-20 (repository and automation)
- Project pushed to GitHub; daily scheduled refresh; dated forecast snapshots.
- FantasyPros fetch script and GitHub Actions workflow; possible quarterback changes flagged in the reasoning panel. Written against the documented response format and tested with a mock file only.

## 2026-11-20 (adversarial pass)
- Audit, research notes and this docs set.
- `scripts/evaluate.py`: point-in-time backtest of six methods, calibration, analogs by spread, eight narrative tests; writes `data/model_report.json`.
- Elo added as a displayed second opinion (tested in the blend, not adopted).
- Per-game reasoning panel: methods side by side, how the number is built, what could make it wrong.
- What-if strength slider and sensitivity check.
- "How good is this model?" and "Popular claims, tested" sections.
- Quarterback injury-report flags and fumble-luck figures in the data build.

## 2026-11-20 (earlier)
- Draft order for all 32 picks with traded first-round picks.
- Playoff bracket, seed grid, odds by week, schedule strength, clinch flags, simulated scores for tiebreakers.
- Results rating from opponent-adjusted margin and EPA; fumble-luck adjustment; first backtest.
- Blend of sportsbook and results ratings; odds-source switch.
- NFL tiebreakers through strength of schedule; wild-card odds; playoff picture.

## 2026-11-17
- Help/hurt colors on every pick; data refresh.

## 2026-11-16
- First version: NFC East simulation, then full-league picks, sportsbook win percentages, live-score server.
