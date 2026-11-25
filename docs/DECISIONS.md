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
- Consequences: commit hashes quoted in the docs refer to the integration branch, which stays local. The M8 media center was merged the same way (`0523d28`). The early fixture remains in that local branch's history; do not push that branch as it is.

### DEC-017 — Media: official channels only; live is a link, not an embed
- Date: 2026-11-21. Status: Accepted.
- Context: M8 adds video and podcasts. Channel names are not unique on YouTube; YouTube's live-stream embed form showed "This video is unavailable" in testing even for a channel streaming all day.
- Decision: channel ids come only from configuration (`shared/teams.json`), each with its evidence level; single videos play click-to-load in the privacy-enhanced player; a channel's live stream is a link to its live page on YouTube; podcasts play the feed's own audio file; nothing is downloaded or re-hosted; no game broadcasts.
- Consequences: knowing whether a channel is live before opening it needs a YouTube Data API key (owner decision). Ten team channel ids rest on directory listings plus feed content and are worth a manual check from each team's website.

### DEC-018 — Public hosting of the server on Render, public sources only
- Date: 2026-11-23. Status: Accepted by the owner ("host it where you can do it for me"); the deploy itself needs the owner's Render sign-in.
- Context: the published page is a static file rebuilt once a day. The owner asked for a dynamic site. `server.js` has no dependencies and is configured by environment variables. DEC-006 limits ESPN's JSON endpoints to personal, local use.
- Options considered: (1) public host with public sources only; (2) private host with ESPN on; (3) a licensed live feed.
- Decision: option 1, on Render's free web service plan through `render.yaml`. `FABRIC_SCOPES=public`; `/api/live` answers 404 without the local scope; API requests are capped per client (`RATE_LIMIT`, default 240 a minute); the service's own hostname is allowed automatically (`RENDER_EXTERNAL_HOSTNAME`).
- Checked on Nov. 23, 2026 (render.com docs): free web services have 512 MB of memory, no persistent disk, 750 instance hours a month per workspace, and spin down after 15 minutes without traffic (about a minute to wake).
- Consequences: no live scores, same-day injuries or transactions on the hosted site. The fabric's cache and first-seen event times are lost at each spin-down or redeploy, so `seenAt` on the hosted site restarts then; the committed daily event record is unaffected. Each push to `main` (including the daily refresh) redeploys. Revisit option 3 if live scores are wanted publicly.

### DEC-019 — The Odds API: consensus published, each book's prices local only
- Date: 2026-11-23. Status: Accepted (owner asked for more betting-odds sources; the key is the owner's to add).
- Context: The Odds API's terms allow showing and storing its data in an app but not re-serving it as a raw feed or API. The free tier gives 500 credits a month; a look at moneyline, spread and total for US books costs 3. The published page and `data/fabric/latest.json` are public files.
- Options considered: (1) local only, so nothing reaches the published page; (2) public with every book's prices, a re-served feed in effect; (3) one look feeds both: each book's prices on the local server, a derived consensus (median spread and total, median no-vig home chance, number of books) in public payloads.
- Decision: option 3. Source `odds-api`, public scope, off unless `ODDS_API_KEY` is set. The key travels in the `x-api-key` header and is scrubbed from error text, so it reaches no URL, log, cache file or payload. Each book's prices are attached only when the local scope is on, and `validatePublicSnapshot` refuses any `games[].books`. Every 8 hours on the server, once in the daily snapshot; calls stop below 15 credits until the next calendar month. The consensus is descriptive: it does not feed the simulation until a backtest says otherwise (house rule).
- Consequences: the published page shows a consensus line once the owner's key is set where the daily refresh runs (and, optionally, as the GitHub secret `ODDS_API_KEY` for the backup refresh). Not yet run against the real API; field names come from the v4 guide.

### DEC-020 — Explaining playoff-chance changes to first order (F04)
- Date: 2026-11-23. Status: Accepted (the owner chose "show what moved the odds").
- Context: F04 proposed re-running the engine with one input swapped at a time. That needs the full state of each saved forecast (results, ratings, lines, quarterback shifts) and an engine that can be rebuilt from it, and the order of swaps changes the answer.
- Decision: a first-order split. A team's playoff chance is exactly linear in any one game's home chance, so each finished game contributes its surprise (result minus the chance it had in the saved forecast) times what it was worth to the team then (saved per game for the next two weeks), and each remaining game contributes its change in chance times what it is worth now (measured in one extra simulation that watches only the moved games). Remaining games are labelled "lines" when a line is posted now, else "ratings" (which include quarterback changes). Whatever is left (effects between games, results without saved figures, the two simulations' noise) is shown as its own row and never hidden.
- Consequences: saved forecasts grow by about 8 KB a day; older ones are read as before and explained as "predates the figures". In tests, one upset in a copy of the data is explained to within 1 point for both its teams, and a moved line to within 2. Injuries and weather appear only through the lines they move; the game panel lists what the feed had between two looks at a moving line, labelled as timing, not cause.

### DEC-021 — The daily data fetch runs on GitHub Actions; the claude.ai refresh keeps it
- Date: 2026-11-24. Status: Accepted (owner: "Yes, move it").
- Context: the daily refresh is a claude.ai Cowork scheduled task ("NFL simulator daily refresh", 4:35 AM Eastern). Its workspace reaches only GitHub and package registries, so in its snapshot run every public source not hosted on GitHub failed with "fetch failed" (Open-Meteo, the ESPN and Yahoo feeds, YouTube, podcasts on Nov. 23), and The Odds API would fail the same way. Cowork tasks do not offer the cloud-environment settings (network access, environment variables) that Claude Code cloud tasks have.
- Decision: `.github/workflows/data-fetch.yml` runs `node scripts/fabric-snapshot.js` on GitHub's servers at 07:05 UTC (about 2:05 AM Eastern, 3:05 AM in summer) with the optional `ODDS_API_KEY` secret, and commits `data/fabric/` (snapshot, event record, run report). `npm run refresh` now runs the script with `--keep-if-fresh 4`: a published snapshot that passes the contract and is under 4 hours old is kept, so the claude.ai task builds the page from GitHub's complete data without changing its own instructions. The workflow shares the backup refresh's queue (`data-refresh`) and runs only from `main`.
- Consequences: if the GitHub job is late or fails, the refresh fetches on its own as before (degraded, with carry-forward). The backup refresh at 1:23 PM Eastern fetches again, since the morning snapshot is then older than 4 hours. The run report `data/fabric/runs.json` is now committed every day by the workflow.
- Amended 2026-11-25: GitHub started the scheduled jobs hours late on Nov. 24 (the data fetch 11 h 43 min after 07:05 UTC, the backup refresh 8 h, the source check 10 h), so the 4:35 AM refresh found no fresh snapshot, fetched from its own workspace and carried five sources from the earlier one. The data fetch now runs every 3 hours (`17 */3 * * *`) and the refresh keeps a snapshot under 8 hours old. To keep The Odds API's credits, the job restores the fabric's public cache between runs (`actions/cache`) and the source has an 11-hour minimum interval that holds even for fresh runs (`minIntervalMs`); a public run drops each book's prices as they arrive, so the cache of this public repository never holds them. About 13 credits a day at most (GitHub and the local server). Each run commits the snapshot, so `main` gets up to eight data commits a day.

### DEC-022 — NFL TV: team press sessions that play by themselves, muted; YouTube's player API skips the blocked ones
- Date: 2026-11-25. Status: Accepted (owner: "i want something playing at page load", then "Yes, switch it"). Amends DEC-017's "no autoplay" for this one panel.
- Context: the owner asked for something playing when the page opens, pointing at the NFL Channel on NFL.com. NFL.com offers no embed for it, and the NFL turns embedding off for its YouTube game streams. A first version played the league channel's newest videos: YouTube's oEmbed check said each could be embedded, but the player showed "the video contains content from NFL, who has blocked it from display on this website" on this site, in both YouTube's standard and privacy-enhanced players. That block depends on the site showing the video, so only the player finds out, at playback; team videos with NFL game footage are blocked the same way, while team press sessions mostly play.
- Decision: a panel, NFL TV, at the top of the right column. The `youtube-reel` source picks the teams' newest press conferences and media sessions (at most two a team, ten in all, newest first) and then the league channel's two newest videos, each checked once with oEmbed (no key; a 401, 403 or 404 leaves it out). The page plays them one after another with YouTube's official IFrame Player API (`https://www.youtube.com/iframe_api`, privacy-enhanced host), loaded only when the panel plays. When the player reports a video it cannot play here, the page moves to the next one; error codes 100, 101 and 150 are remembered in this browser (at most 60 ids, so they are not tried again), other errors only for the visit. With nothing left, the panel lists the videos as links to YouTube. The NFL Channel and the NFL's YouTube live page are always links.
- When it starts by itself, muted: a wide screen, no request for reduced motion or reduced data, not turned off by the viewer (a "Turn off NFL TV" button, remembered), the panel open, a host that allows outside players. Elsewhere, a tap starts it with sound; no YouTube script loads before that tap.
- YouTube's rules for its player, checked on Nov. 25, 2026 (API Services Developer Policies; Required Minimum Functionality): automatic playback starts only while more than half of the player is on screen (an IntersectionObserver, which also sees the columns' own scrolling) and the page is showing; a muted video that leaves the screen pauses and resumes when it is back, and the next video is only made ready while off screen; the player is never under 200 by 200 pixels; it is the only player on the page that starts by itself; nothing covers it; it sends the page's origin as the referrer. YouTube is named as the source, with links to YouTube's Terms of Service and Google's Privacy Policy beside this player and the media panel's (III.A.1, III.F.2.a).
- Options considered: (1) links only, which plays nothing; (2) the plain embedded player with a playlist, which stops at the first blocked video and cannot tell the page; (3) YouTube's undocumented messages between page and player, which avoid loading a script but may change without notice; (4) the official API. Option 4.
- Costs: the page's policy now allows scripts from `https://www.youtube.com` (only that address; nothing else outside), and that script runs with the page's own access. The page holds no keys, sign-ins or personal data; it shows the owner's local ESPN data on the owner's computer (DEC-006). Loading it contacts YouTube (with YouTube's cookies, where the browser sends them), only when NFL TV plays. The published page on claude.ai refuses outside scripts and players, so it shows links there.
- Checked in the browser on Nov. 25, 2026 (localhost): of the 12 videos picked, two Steelers press conferences and both league videos were refused by the player and skipped; the Browns, Lions, Bears and others played, muted, by themselves; a reload did not try the refused four again; with every video refused the panel showed links and loaded no YouTube script; on a phone-width screen it waited for a tap and then played with sound; scrolled out of its column it paused and resumed when back. A Browns press conference that the plain player had shown as blocked played through the API's player.
- Render, checked on Nov. 25, 2026 after the merge: the same four videos were refused as on localhost and skipped; five played (Browns, Lions, Bears twice, Dolphins); three were team press conferences posted as live streams scheduled for later that day (Falcons twice, Jaguars). The player shows those as "Live in 4 hours" with no error, so NFL TV stood still on the first one. Two fixes: the feed reader marks a video `upcoming` when YouTube's feed shows it with no views (every scheduled stream had 0; every other video thousands), and the reel puts those last, behind every press session that has happened; and the page skips, for that visit only, a live stream that is still not started after 12 seconds on screen.
- Open: the policies also ask an API client to have users agree to a privacy policy that says it uses YouTube API Services (III.A.2) and to check each embedded video's Made for Kids status (III.E.4.j, which needs the YouTube Data API and a key). Both already applied to the media panel's player since M8; they are the owner's decisions, recorded in `CURRENT_STATE.md`.

### DEC-023 — The daily refresh starts the data fetch itself, with a push
- Date: 2026-11-25. Status: Accepted in the repository (owner: "Yes, find one"); in force once merged and once the refresh task's instructions call the script (owner approval).
- Context: the daily refresh on claude.ai (4:35 AM Eastern) reaches only GitHub, so it relies on the snapshot GitHub's data fetch commits (DEC-021). GitHub's scheduler started that job hours late on Nov. 24 and then not at all from Nov. 24, 18:48 to Nov. 25, 17:20 UTC (seven 3-hour slots); the source check and FantasyPros were late or missing the same day. GitHub's documentation says scheduled runs "can be delayed" under load and queued jobs "may be dropped". GitHub's status page showed no incident that explains it.
- Options considered: (1) an outside cron service calling GitHub's "run workflow" API with a personal access token (cron-job.org is free, but its terms put secrets in headers at the user's risk and it promises no punctuality; a Cloudflare Worker keeps the token encrypted, but needs a new account, a deploy tool and a token); (2) a second scheduled task, in Claude Code's cloud, that starts the workflow or fetches itself (needs a new task, its runs use the owner's plan, and whether `gh workflow run` passes its GitHub proxy is not documented); (3) a scheduler on the owner's Mac (only while it is awake); (4) a push from the refresh itself.
- Decision: option 4. A push starts a workflow at once, with no scheduler involved. `scripts/request-fetch.js` commits `data/fabric/fetch-request.json` (only that file) to `main` and pushes it with the refresh's own GitHub access; "Daily data fetch" and "Fetch FantasyPros data" run on a push to `main` that touches that file. The script then checks `main` every 20 seconds, for up to 10 minutes, for a snapshot made after the request (a minute's clock skew allowed), and brings the clone up to date, keeping the refresh's uncommitted news edit. It never fails: when the request cannot be pushed or nothing arrives in time it says so, and `npm run refresh` decides as before. The 3-hour schedule stays as a backup.
- Also: the FantasyPros job now runs only from `main` (a manual run on another branch could have pushed that branch to `main`), never runs twice at once, and retries a push that races the data fetch.
- Costs: one small "Request a data fetch" commit on `main` a day (Render redeploys on it, as on every push); the data fetch's own commits are made with GitHub's job token, which starts no further workflow, so there is no loop.
- Checked: a test runs the script against a local stand-in for GitHub (a bare repository, the refresh's clone with an uncommitted edit, a clone playing the data fetch): the request commit holds only its file, the clone gets the new snapshot, the edit survives; it gives up quietly after the timeout and when the remote cannot be reached. Eight deliberately broken versions of the script and workflows were each caught. Not yet run against GitHub itself.
