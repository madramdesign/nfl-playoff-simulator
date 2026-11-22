# Agent Handoff

- Agent: Frontend (WS2)
- Task ID: NU-007, command-center interface
- Branch/worktree: `worktree-agent-adaeb813e8038ab4d` (`.claude/worktrees/agent-adaeb813e8038ab4d`); `worktree-nfl-universe` merged in at 73afac3
- Date: 2026-11-21

## Scope and acceptance criteria
- `npm test` passes, and the page renders from the fixture API, from a public snapshot with no server, and with nothing at all.
- It works at phone width.
- The simulator is kept as `?view=sim`.

## Files changed
- **New in `src/universe/`:**
  - `00-core` (DOM helpers, store, time ranges, URL state)
  - `01-data` (model and freshness)
  - `02-poll` (polling with backoff and a breaker)
  - `03-sim` (worker, fallback, deep run)
  - `04-intel` (ratings, disagreement, quarterback status, "prove this wrong", brief ranking)
  - `06-panel`, `07-layers` (17 layers), `08-map`
  - `09-feed` (also the ticker)
  - `10-games`, `11-teams` (also the team center), `12-game`, `13-brief`, `14-health`, `15-shell`, `99-boot`
  - `00-universe.css`
  - `05-geo.js` and `scripts/gen_geo.py` are from before the pause.
- **`src/template.html`:**
  - Title changed and shell markup added.
  - `<main id="simView" hidden>`.
  - The simulator closure is wrapped in `nflSimStart` (it runs once, on demand) and falls back to the old behaviour if the command center fails to start.
  - The engine script is unchanged.
- **`test/universe.test.js`:** new, 68 checks.
- **`package.json`:** the `test` script only.
- **`public/index.html`:** rebuilt.

## Decisions made
- Feed games are matched to `GAMES` by `gid` first, then by the away/home pair, which is unique within a season. The fixture's week-12 `gid` values otherwise match nothing.
- Time filters use the later of the browser clock and the payload's `generatedAt`, so a server clock running ahead doesn't hide items.
- The base simulation counts feed finals as picks. It uses the engine's in-game chance only when the data is live, never from a snapshot.
- The deep run is 10 batches of 10,000 in the worker with seeds 1 to 10, summed (DEC-015). On the main-thread fallback it is disabled.
- Panels that show data from the build when there is no feed say `BUILD · date`, not `UNAVAILABLE`. A game still listed as "pre" 15 minutes after kickoff is tagged "not updated".
- The command center defaults to the dark theme. The simulator still follows the system setting until the viewer picks a theme.

## Tests/checks run
| Command | Result |
|---|---|
| `python3 scripts/build.py --reuse` | ok; `D.fabric` is null, no fixture data shipped |
| `npm test` | ok (engine and feed parser; 68 command-center checks) |
| Headless Chrome through a small DevTools driver (in scratch space, not committed) | No console errors other than the dev server's missing favicon. Checked: worker 20,000 seasons in about 0.5 s; deep run 100,000 in 2.8 s; main-thread fallback 4,000 with workers removed; workers also work on `file:`. |
| The same driver, by clicking through | URL and saved state round-trip; "Open in simulator" follows the team; no horizontal scroll at 390 px |

Screenshots, taken at 1440x900 and 390x844 and not committed, covered:
- each map mode, and the zoomed-in map;
- the team center and game detail (with the `/api/game` chart), the brief, search, light theme;
- the simulator view;
- `file:` with no feed and with the public snapshot embedded.

## Risks / known limitations
- **Not checked against real data.** WS1 isn't merged, so nothing has run against a real fabric payload or a real `/api/game`; only fixtures.
- **Stub views.** The Network and Schedule map modes are disabled "soon" buttons. The History time range is disabled, with a tooltip.
- **Page size.** The page went from 108 KB to 304 KB, because the modules are not minified.
- **Crowded labels.** Labels collide in the Northeast at low zoom (team labels appear only when zoomed in) and in the scatter plot. Game links in the divisions view are busy.
- **Desktop Teams panel.** It sits below the rail; you scroll the left column to reach it.
- **Shared win-chance mode.** The command center uses the simulator's current mode (Blend, Sportsbooks or Results) and labels it, but ignores the simulator's what-if setting.
- **Page-side validation.** The page checks the payload shape loosely; full validation is `lib/contract.js` on the server.

## Follow-up tasks
- **Inline the contract validator.** Have `build.py` inline a browser copy of `lib/contract.js` so the page can run `validateUniverse` (an orchestrator change).
- **Feed match ids.** The fabric should send `gid` for each game so the page can match by id.
- **Minify.** Consider minifying the modules at build time.
- **Network and schedule modes.** Build them, plus history replay from `data/fabric/events/` using `seenAt`.

## Self-check
- **What I changed, and why:** the files above, to deliver the brief's first slice.
- **What I assumed:** fixture field names follow `lib/contract.js`.
- **What I tested:** listed above.
- **What could still be wrong:** behaviour with real payloads, and a real live game.
- **Duplication:** none; it reuses the engine's `simulate`, `modelView`, `liveProbFor` and `seedsToday`.
- **Use of information from later than the moment it describes:** none. The momentum shown comes from `D.history`, which the build rebuilt from what was known each week.
- **External sources:** Natural Earth only, verified earlier.
- **Docs I own:** this file is updated.

## Review follow-up (Nov. 21, 2026)

Fixes for the independent review of the merged command center, after merging `worktree-nfl-universe`. The orchestrator's `setAttrs` hardening is kept.

1. **Status pill and live games now follow source health.**
   - The pill uses the same rule as the panel badges (`pillState`). A payload marked `_fixture` reads `FIXTURE`, never `LIVE`.
   - A game counts as in progress only when all of these hold: the data is live, the last poll succeeded, and the game's source is `ok` and at most 3 minutes old.
   - An in-progress game that fails that test loses its live dot and shows "last update N ago". The simulation gets it as an ordinary unplayed game.
2. **Numbers carry the mode they were computed in.**
   - The command center starts in the simulator's saved mode.
   - Coming back from the simulator reruns the simulation if the mode changed.
   - Results are labelled with `sim.mode`.
3. **Outside keys can't reach built-in properties.**
   - Lookups keyed by outside data are prototype-free.
   - Events are cleaned field by field.
   - Each feed row is drawn on its own, so one bad item can't blank the list.
4. **Live chances.**
   - The simulation uses the feed's in-game chance where the feed gives one. Otherwise it uses the page's own in-game model, never with the simulator's what-if setting.
   - The game detail shows both numbers.
5. **Keyboard focus survives re-renders.**
6. **The ticker rebuilds only when its set of events changes.**
7. **A deep run is discarded if its inputs changed while it ran.** An older base run can't overwrite a newer result.
8. **One basis for records and lines.**
   - Records include this week's feed finals.
   - "Seed if the season ended today" says it counts only games through the build.
   - Tied finals are described as simulated.
   - The build's line is "at the build", not "now".
9. **Accessibility.**
   - The brief dialog traps focus.
   - Map game links, neutral-site markers and disagreement arcs can be reached and opened with the keyboard.
   - Light-theme quadrant text no longer uses reduced opacity.
   - Kickoff times show the time zone.

**Tests.** `test/universe.test.js` now has 104 checks. Expected counts are computed from the fixtures, not from the code under test. To check the tests, I broke the built page 16 ways, one at a time; every break made the suite fail. The breaks:
- `filterFeed` returns nothing;
- `safeUrl` or `setAttrs` accept any address or a string handler;
- spread signs flipped in two places;
- feed finals credited to the losing team;
- the pill ignores failed polls;
- a fixture reads as live;
- the what-if leaks into live chances;
- rail labels use the page's mode instead of the simulation's;
- lookups have built-in keys;
- records credit the losing team;
- a stale source counts as a live game;
- tied finals get picked.

**Still open.**
- A fixture payload's in-progress game is still shown as in progress. The pill says FIXTURE, and the dev fixture needs that path.
- The game detail's win-probability series and scoring plays still come only from the local `/api/game` endpoint.

## M8 media center (Nov. 21, 2026)

Built on the media contract (6ca8cb1); the new code is in `src/universe/16-media.js`.

- **Media panel.**
  - On desktop it sits in the right column, between the feed and health. On phones it is a "Media" tab.
  - It has three parts:
    - **Latest videos**: chips for All, Press conferences, Highlights and Previews, plus an "Include Shorts" chip (Shorts are hidden otherwise). Follows the time range and search. Each item shows the thumbnail, the exact title, the channel, the time and team chips.
    - **Watch live**: the NFL first, then teams; a selected team's channel goes to the top. The text says YouTube's player shows whether a channel is streaming, and the page never claims one is.
    - **Podcasts**: each episode has an `audio` element with `preload="none"` and an "Episode page" link when the feed gives one.
  - Its badge follows the `youtube-official` and `podcasts-nfl` sources.
  - The credit line reads "Video: YouTube · official channels".
  - A payload with no `media` section gets a plain notice that the data is missing, which is not the same as no videos.
- **Player.**
  - Nothing loads until a click.
  - It is a dialog that keeps keyboard focus inside and closes on Esc.
  - It holds an `iframe` with the item's embed address, `referrerpolicy="strict-origin-when-cross-origin"`, the `allow` list, `allowfullscreen`, a title and no autoplay.
  - A "Watch on YouTube" link always sits below it.
  - Closing it removes the iframe, which stops playback.
- **Connections.**
  - The team drawer gets a Video section: the team's newest 6 videos plus its "Watch live" button.
  - The game drawer shows videos from the last 7 days: those naming both teams first, then either team, newest 4.
- **Map.** A "Video" layer (Intelligence group, off by default) shows a badge with each team's video count in the time range.
- **Health panel.** On wide screens it now starts folded, to make room for Media. Its badge and the status pill still show the state, and clicking the pill opens it.
- **Address allowlists.** These apply on top of `setAttrs`:
  - Players only load `https://www.youtube(-nocookie).com/embed/<11-character id>` or `…/embed/live_stream?channel=UC…`. Anything else is refused, including query strings.
  - Images only load from `https://i.ytimg.com/…`.
  - Audio only plays from `https:` addresses with no user name or password in them.
  - Links only go to YouTube watch or channel pages.
  - An address that fails is not rendered; the YouTube link is shown instead. No address is ever built from a title.
- **Tests.** `test/universe.test.js` now has 162 checks. The new ones cover:
  - the type chips and Shorts filter;
  - team and game matching;
  - the time range for videos and podcasts;
  - each allowlist, including other hosts, `javascript:`, `http:`, query strings and credentials;
  - normalising a bad payload;
  - a payload with no media.

  I broke the built page 17 ways, one at a time. 16 of the breaks made the suite fail. The 17th only loosened the audio https pattern, which the URL protocol check behind it still enforces; loosening both checks together does make the suite fail.
- **Headless checks.** Desktop, 375 px, the player open (YouTube shows "unavailable" for the fixture's fake ids, as expected), the team and game drawers, Esc removing the iframe, and `file:` with the embedded snapshot, which has no media yet.
- **Expected console messages.** Thumbnails for the fake ids return 404, and Chrome warns that `allow` takes precedence over `allowfullscreen`.

## Ready for review?
- Yes
