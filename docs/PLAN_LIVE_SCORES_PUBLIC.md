# Plan: licensed live scores on the hosted site (F57)

> Status: **Built; on `main` since Nov. 26 (owner: "Merge and push"); off until the key is set on Render.** Drafted on Nov. 26, 2026, after the owner's "Yes, plan it"; built the same day after "Yes, build it", on branch `f57-live-scores` (see "As built" at the end). Decision: DEC-027. Backlog: F57.
>
> The code can be built and tested before either gate. It stays switched off until both are passed:
> - **Gate A (owner):** buy The Odds API's 20K plan ($30 a month).
> - **Gate B (owner):** put the key and the switch on Render (§3.7).
>
> Implementation follows `CLAUDE.md`: integration branch in its own worktree, review, `npm test`, then the owner's approval before `main`.

## Why
- **What the owner saw.** During GB at LAR on Nov. 25 (ET), the hosted site showed the game as not started at 0–0 with its "not updated" tag. The owner's local server updated every 20 seconds over the same minutes:
  - clock 7:15 → 7:06;
  - ESPN win probability 69% → 76%.
- **Why.** This is by design today:
  - Render serves public sources only (DEC-018).
  - ESPN's scoreboard is for local use only (DEC-006).
  - The hosted site learns a score only when nflverse records the final, hours later.
- **What NU-018 found.** The cheapest licensed live scores come from The Odds API's `/scores` endpoint. The project already holds a key for it.

## What exists today (checked Nov. 26, 2026)
| Piece | Where | Notes |
|---|---|---|
| The Odds API odds | source `odds-api` (`lib/fabric/adapters/oddsapi.js`) | <ul><li>Key in the `x-api-key` header; first real call Nov. 23.</li><li>Reads `x-requests-remaining`; stops below 15 credits.</li><li>Not set on Render, so off there.</li></ul> |
| Live scores, local | source `espn-scoreboard`, scope local, 15-second TTL | <ul><li>Period, clock, situation, win probability.</li><li>Never on Render.</li></ul> |
| Schedule and finals | source `nflverse-games` (30-minute TTL) | Finals arrive hours after the game |
| Honest stale state | `src/universe/10-games.js` `kickoffPassed()` | "not updated" tag 15 minutes after kickoff |
| Game contract | `lib/contract.js` | `period` must be a number |
| Simulator tab live feed | `/api/live` | Answers 404 without the local scope, so the page stops asking |
| Command center in-game chance | `src/universe/03-sim.js` `pageLiveProb()` | Treats a missing clock as the start of the first quarter (`period \|\| 1`, 15 minutes) |
| Server polling | `server.js` | <ul><li>No timer: sources fetch only when a page asks for `/api/universe`.</li><li>The command center asks every 20 s while a game is live (`02-poll.js`).</li></ul> |

## 1. The source (verified Nov. 26, 2026 on the-odds-api.com)
- **Endpoint:** `GET /v4/sports/americanfootball_nfl/scores/`.
  - Returns upcoming, live and recently completed games.
  - "Live scores update approximately every 30 seconds."
- **Cost:**
  - 1 credit a call;
  - 2 with `daysFrom` (1 to 3 days back).
- **Completed games drop out.** Without `daysFrom`, "only live and upcoming games are returned", and only live games carry scores. A game that just ended is not in the answer, so the final needs one `daysFrom=1` call (§3.2).
- **Fields:**
  - `id`, `commence_time`, `completed`;
  - `home_team`, `away_team`;
  - `scores` (a list of `{name, score}`, with the score as a string);
  - `last_update`.
- **Not provided:** quarter, game clock, possession, down and distance, win probability.
- **Options and free calls:**
  - `eventIds` filters by game, but does not change the cost.
  - `/events` lists in-play and upcoming games and costs nothing. It is not needed: the schedule comes from nflverse.
- **Key:** sent in the `x-api-key` header, as the odds adapter already does (worked on Nov. 23). It never goes in a URL, log, cache file or payload.
- **Plans** (home page, Nov. 26):

  | Plan | Price |
  |---|---|
  | Free | 500 credits a month |
  | 20K | $30 a month |
  | 100K | $59 |
  | 5M | $119 |
  | 15M | $249 |

  Credits reset per billing cycle. Each answer reports `x-requests-remaining`, and every use of the key shares those credits.
- **Terms** (Aug. 31, 2026, read in NU-018; registry):
  - Allowed: displaying the data in a website or app, including commercially; storing it.
  - Attribution is not required.
  - Not allowed: redistributing it as a standalone data product (an own API, a feed or downloadable files). See §6 for how the plan stays on the right side of that.
- **UNVERIFIED (check in the first live window):**
  - how soon after kickoff a game gets scores, and whether they start at "0";
  - whether `last_update` moves without a score change;
  - how overtime and ties appear;
  - how far the scores lag ESPN.

## 2. Credit budget
**Method.** Taken from the 2026 schedule (nflverse `games.csv`, fetched Nov. 26):
- each game's window runs from 2 minutes before kickoff to 4 hours after;
- overlapping windows are merged;
- one call every 30 seconds inside a window.

| Month | Game-window hours | Calls at 30 s | Calls at 60 s |
|---|---|---|---|
| Sep. 2026 | 62 | 7,480 | 3,740 |
| Oct. | 96 | 11,490 | 5,750 |
| Nov. | 116 | 13,860 | 6,930 |
| Dec. | 100 | 12,050 | 6,030 |
| Jan. 2027 (estimate) | about 65 | about 7,800 | about 3,900 |

**January is an estimate.** The file lists Week 18 at one time slot for now (4 hours), where about 16 is realistic. Its postseason games are not in the file yet: about 50 hours are allowed for Wild Card, Divisional and Conference weekends.

**Additions:**
- one `daysFrom=1` call per finished game (+1 credit each, about 16 a week);
- the existing odds looks: about 13 credits a day on the owner's Mac and GitHub, so about 400 a month. The odds source stays off on Render (§3.7).

**Worst month:** about 14,500 of 20,000 credits (72%). That leaves room for pacing (§3.2) and an occasional extra odds look.

**The free 500 credits are not enough at any useful cadence.** They give about 4 hours of 30-second polling a month. Even one call every 5 minutes needs about 1,400 in November.

**Real use is lower than this worst case:**
- The server calls only while someone has the page open.
- It makes one call per 30 seconds however many people are watching.
- Render's free instance sleeps after 15 minutes without visitors.

**Cost for the rest of this season:**
- December, January and the Super Bowl month: about $30 × 3.
- Can the plan be cancelled month to month? UNVERIFIED: check before buying.

## 3. Design

### 3.1 Adapter `lib/fabric/adapters/oddsscores.js`
- **`scoresUrl({ daysFrom })`:** builds the request URL; no key in it.
- **`fetchScores(key, opts)`:** reuses the odds adapter's request code (header key, the credits headers, the key scrubbed from error text).
- **`normalizeScores(json, nowMs)`:** returns `{games: [{home, away, kickoff, state, awayScore, homeScore, scoreAt, completed}], unmatched}`.
  - Teams are matched through the canonical list (the `BY_NAME` map the odds adapter uses). An unknown name is counted, never guessed.
  - `state` is set as follows:

    | `state` | When |
    |---|---|
    | `post` | `completed` is true |
    | `in` | the game has started and has scores |
    | `pre` | otherwise |

  - A score is accepted only as a string of 1–3 digits; anything else gives `null` and the game keeps its last good value.

### 3.2 Source `odds-scores`
- **Opt-in.** Public scope. On only when both `ODDS_API_KEY` and `LIVE_SCORES=odds-api` are set. Neither the owner's Mac (ESPN stays primary there) nor the GitHub workflows set the switch, so the daily snapshot never holds these scores.
- **Game windows only.** It calls only while the nflverse schedule has a game between 2 minutes before kickoff and 4.5 hours after that is not yet final. Outside windows it returns the data it holds with a note, as the weather source does. With no schedule it makes no call and says why (fails closed).
- **Pacing.** Read from `x-requests-remaining`, so all uses of the key are counted:

  | Credits left | One call every |
  |---|---|
  | 5,000 or more | 30 s |
  | 1,000–4,999 | 60 s |
  | 500–999 | 90 s (120 s in the draft; lowered after review so a game does not flicker against the page's 3-minute live limit) |
  | under 500 | paused ("monthly credit budget reached") |

  - The 500-credit reserve keeps the odds source working.
  - Pacing resets when a new cycle's header shows more credits.
- **Finals.** When a game that was live drops out of the answer, the next call adds `daysFrom=1` (2 credits) to collect the final. `completed: true` makes it `post`.
- **Failures:**
  - `createSource` handles retries, the circuit breaker and the last-good cache.
  - A 401 counts as a failure: after three, the source waits 10 minutes before trying again (a refused call costs no credits).
  - A 429 backs off.
  - The status bar shows each state.

### 3.3 Merge into games (`lib/fabric/index.js`)
- **Order.** After the ESPN overlay, `odds-scores` fills only the games ESPN did not cover (on Render: every game). ESPN wins wherever both exist.
- **Fields set:**
  - `state`, `awayScore`, `homeScore`;
  - `source: "odds-scores"`;
  - `period: null`, `clock: null`;
  - `clockKnown: false`;
  - `scoreAt` (the provider's `last_update`).
- **Game events.** Kickoff and score events name their publisher from the source; today it is hard-coded "ESPN". The rule that dates a change inside the gap between two looks (`gameTime`) is unchanged. A 30-second look gives a narrower gap than the nflverse finals do today.

### 3.4 Contract (orchestrator-owned; `lib/contract.js`, `docs/DATA_MODEL.md`)
- `period` may be a number or `null` (null only with `clockKnown: false`).
- New optional fields:
  - `clockKnown` (boolean);
  - `scoreAt` (ISO time).
- `validatePublicSnapshot` refuses games whose source is `odds-scores`. `data/fabric/latest.json` never carries them; finals there keep coming from nflverse.

### 3.5 Command center: honest display (`src/universe/`)
- **Game card:**
  - "Live 14–10";
  - "no game clock from this source";
  - "score as of 8:41:20 PM";
  - "Scores: The Odds API".
  - A "score may be behind" tag when `scoreAt` is over 3 minutes old during a live game.
- **Helmets and map:** no "Q" text when `period` is null.
- **In-game chance:**
  - The problem: `pageLiveProb` would treat a 4th-quarter 24–3 game as one just started.
  - The fix: with `clockKnown: false` there is no in-game chance. The game keeps its pregame chance in the simulation, and a note says how many live games are counted that way.
  - Finals count as soon as they arrive (`feedInputs` already does this).
- **Later, only with a backtest (house rule):** estimate the game clock from the time since kickoff. nflfastR play-by-play has the wall-clock time of each play (`time_of_day`). This would be a separate backlog entry, recorded in `scripts/evaluate.py` if rejected.

### 3.6 Simulator tab (`/api/live`, `src/template.html`)
- **Server:** on the public scope, `/api/live` answers from `odds-scores` with `clockKnown: false` instead of 404.
- **Page:**
  - `cleanLiveGame` keeps the flag.
  - `applyFeed` takes finals at once and skips live games without a clock. Today a missing period and minutes would become "Q1, 0:00 left".
- **Tests:** an engine-adjacent change, so `npm test`.

### 3.7 Render and status
- **`render.yaml`:**
  - `ODDS_API_KEY` with `sync: false`. The owner types it into Render's dashboard; it is never in the repository.
  - `LIVE_SCORES: odds-api`.
  - `FABRIC_OFF: odds-api` (the switch from DEC-024). Without it, the key would also start the pre-game odds source on Render.
- **Why the odds source stays off on Render.** Render's free plan has no disk, so the odds source's 11-hour spacing is forgotten at every spin-down. A public server also starts reading every source as soon as it wakes (DEC-025). So each wake after 15 idle minutes could spend another 3-credit odds look. The hosted site's live answer has no consensus line today, and that does not change; the static page still gets one from the daily snapshot. Turning it on there later needs that spacing kept across restarts, for example by reading the time of the last look from the committed snapshot.
- **The scores source is safe across wakes.** Its pacing comes from each answer's credit header, and it calls only inside game windows.
- **Status bar:** "Live scores: The Odds API, every 30 s during games; N credits left".

## 4. Tests (deterministic, no network)
- **Normalizing the answer:**
  - live, completed and upcoming games;
  - scores missing, `"0"`, non-numeric or negative;
  - unknown team;
  - duplicate game id;
  - the answer is not a list.
- **Windows:**
  - no call before kickoff−2 min or after the window;
  - no call without a schedule;
  - the call resumes for a game moved to a later time.
- **Pacing:** each band of the table in §3.2; the pause; the reset at a new cycle.
- **Finals:** a live game drops out → the next call has `daysFrom=1` → `post` with the final; a game that drops out and never returns stays live with a stale tag.
- **Merge:**
  - ESPN beats `odds-scores` when both are present;
  - `odds-scores` fills a game ESPN lacks;
  - kickoff and score events carry the right publisher and time window.
- **Contract:**
  - `period: null` passes only with `clockKnown: false`;
  - the public snapshot refuses `odds-scores` games.
- **Page:**
  - no in-game chance without a clock;
  - a final becomes a pick;
  - the card text;
  - `applyFeed` skips a live game without a clock.
- **Key safety:** the key never appears in a URL, error, cache file or payload (the odds adapter's existing test, extended).
- **Browser:** the hosted build served locally with a fixture scores feed: card, helmets, map, status bar, simulator tab.

## 5. Steps and order
1. **Adapter, source and tests** (no gate). Off by default.
2. **Merge, contract, events and the snapshot guard, with tests** (no gate).
3. **Page work, with tests and a browser check against a fixture feed** (no gate): the card and helmets, the in-game handling and the simulator tab.
4. **Review and approval.** Independent review (`qa` agent), then the owner's approval to merge to `main`.
5. **Gates A and B** (owner):
   - buy the 20K plan;
   - set `ODDS_API_KEY` and `LIVE_SCORES` on Render.
6. **First live window.** Compare the hosted site with the local ESPN feed side by side. Record:
   - lag against ESPN;
   - delay in seeing kickoff;
   - delay in seeing the final;
   - credits per hour;
   - the UNVERIFIED items in §1.

   Record the results in the registry and close DEC-027. Next windows: Sunday Nov. 29 (1:00 PM ET), Monday Nov. 30, Thursday Dec. 3.

Size: M. About a day of work, plus review.

## 6. Risks and how they are handled
- **Reading of the terms.**
  - Display in a website is allowed; "an own API or feed" is not.
  - `/api/universe` is the page's own data channel, rate-limited per visitor (DEC-018). It is not documented or offered as an API, and the scores never go into the downloadable snapshot.
  - If the owner wants certainty, one email to The Odds API settles it before Gate A.
- **Lag.** The provider updates about every 30 s, the server looks every 30 s and the page asks every 20 s, so the card can be up to about 80 s behind television. The card always says "score as of".
- **Outage or missing game.** The last score stays with its time. The "not updated" or "score may be behind" tag shows, and finals still come from nflverse later.
- **Shared credits.** Every use of the key draws on the same credits. Pacing reads the account-wide remainder, and the reserve protects the odds source.
- **No clock.** No in-game chances for these games on the hosted site (§3.5). The owner's local copy keeps ESPN's full detail.
- **Render's cold start.** About a minute for the first visitor after 15 idle minutes (DEC-018). No credits are spent while it sleeps.

## 7. Alternatives considered
| Option | Cost | Why not chosen |
|---|---|---|
| Label only: "live scores on the owner's copy only" | $0 | Nothing live on the hosted site; still a fallback if Gate A is declined |
| ESPN's scoreboard on Render | $0 | DEC-006: personal, local use only |
| Feeds with a game clock: Sportradar, SportsDataIO | Quote only; lowest published live price found is $599 a month (Rolling Insights) | Cost |
| BALLDONTLIE GOAT | $39.99 a month | Upstream undisclosed; NU-018 found its play-by-play looks ESPN-derived |
| API-Sports American Football | Claimed 100 calls a day free | Pricing, terms and coverage UNVERIFIED (site blocked automated reads in NU-018) |
| Polling `/scores` faster than every 30 s | More credits | The provider itself updates only about every 30 s |

## As built (Nov. 26, 2026, branch `f57-live-scores`)

**Built as planned:** §3.1–§3.4, §3.6, §3.7 and the tests in §4.

**Changed or added while building:**

- **Card wording.**
  - A clockless live game reads "Live" with a "no clock" tag.
  - The tag's tooltip names The Odds API and gives the time it last checked and the provider's own update time.
  - The win chance reads "Pregame: …".
  - The footer credits "Live scores: The Odds API, without a game clock".
  - There is no separate "score as of" line: the tag carries the times.
- **Freshness is per game.**
  - The page counts a game's age from `checkedAt`, the last answer that listed it, as well as from its source's age.
  - A game the feed stopped listing therefore goes out of date on its own after 3 minutes, even while the source keeps answering.
- **Finals the provider never returns.** A live game that is missing again after its `daysFrom` call is marked lost. It keeps its last score and age, and is not asked for again, so it cannot keep calls going.
- **The schedule's final wins.** A final already in the nflverse schedule is never replaced. When both sources have a final, the schedule's stands.
- **The hosted answer waits for it.** `/api/universe` always waits for `odds-scores` on its quick answer, like ESPN's scoreboard locally (DEC-025's `MUST_WAIT`).
- **Answers are one look behind.** Like ESPN's scoreboard, the source answers with its last data while it refreshes, so a page sees a new score on its next request, about 20 s later.
- **Note counts without a rerun.** The command center's simulation note now updates its counts of clockless and out-of-date live games without a rerun. Before, the counts kept whatever the first simulation saw; this already affected out-of-date games.
- **Off by construction outside Render.**
  - The snapshot and source-check scripts create the fabric with `liveScores: ""`, whatever the environment says.
  - A switched-off source reads no cached copy.
- **The Render key.** Render ignores `sync: false` on an existing Blueprint (render.com/docs/blueprint-spec, checked Nov. 26). So `ODDS_API_KEY` must be added by hand in the service's Environment settings; `render.yaml` lists it without a value.

**Checked:**

- **Tests:** `npm test`, with 94 fabric tests (12 new for live scores), 343 command-center checks (12 new) and the engine's feed parser (3 new). After the review fixes, each new test for the blocking bug and the reversed matchup was seen to fail with its fix removed.
- **Browser:** the worktree's server ran in the public scope against a stand-in `/scores` feed (no key, no credits), with the fabric's clock set to Thursday 19:10 UTC so CHI at DET was in its window. Seen:
  - the card, its tag and the footer;
  - the map label `CHI 10–20 DET`;
  - a score event credited to The Odds API with an exact time;
  - the simulation note;
  - the simulator tab's feed line;
  - no console errors;
  - at most one stand-in call every 30 s.

**Independent review (qa agent, Nov. 26) and the fixes made:**

- **Blocking: saved events replayed into a snapshot.** Kickoff and score events saved while live scores were on (for example by a public-scope server on the owner's Mac, which shares the public cache folder) came back in a later snapshot run with them off. The contract then refused the snapshot. Fixed: saved game events come back only from sources switched on.
- **Home and away listed the other way round** (possible at neutral sites). Before the fix such a game never matched, and calls went on after its final. Fixed: the two teams match in either order and the scores are swapped.
- **No credits header.** Before the fix, calls ran every 30 s and the reserve could not hold. Fixed: such an answer gets the 60-second band.
- **"Live" on a stale game.** A game the feed stopped listing still read "Live · last update…". Fixed: it now reads "In progress · …".
- **The score's time on touch screens.** It was only in a tooltip. Fixed: it is now in the card's accessible label and in the game panel.
- **`/api/live` lost finals** once the schedule recorded them or the week rolled over, and sent stale live games. Fixed: it now sends every final this server knows (this week's and `recentFinals`) and leaves out live games last listed over 3 minutes ago.
- **A final listed as unfinished.** A finished game that the plain answer drops but the `daysFrom` answer still lists as unfinished made calls alternate. Fixed: it is marked lost after three `daysFrom` asks.
- **Idle freshness.** Between windows the source re-saved its data every 30 s without fetching, so the Games badge read "LIVE · 10s". Fixed: when idle it reports the age of its last real call.
- **Smaller fixes:**
  - the 90-second band;
  - the `odds-api` off note no longer assumes it is on Render;
  - the MCP live-games tool knows this source and passes `clockKnown` and `checkedAt`.
- **Not changed:**
  - **Terms.** `/api/live` and `/api/universe` are readable by any client that sends the right Host header, as before. They send no CORS headers, so other websites' pages cannot read them, and they are not documented or offered as an API. A same-origin header check would only be cosmetic, since anything outside a browser can send any header.
  - **The simulator tab's `applyFeed`** is still tested only through `cleanLiveGame`: it lives in the page script, not the engine.

**Not checked yet:**

- the real endpoint (needs Gates A and B);
- the §1 UNVERIFIED items;
- Render itself.
