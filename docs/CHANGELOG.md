# Changelog

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
