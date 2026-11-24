# Feature backlog

> Canonical feature backlog. Living document: update an entry's Status when work starts or lands; never delete an entry, mark it Done, Rejected or Superseded with a date. Evidence and scoring: `FEATURE_RESEARCH.md`. Order of work: `FEATURE_ROADMAP.md`.
>
> **Status values:** Research → Ready → In progress → Done / Deferred / Rejected / Superseded.
> **Priority:** P0, P1, P2 or Experimental.
> **Score:** the weighted score out of 100 from `FEATURE_RESEARCH.md` §9.
> **Status tags:** "EXISTING—IMPROVE" means part of it is already in the repository; "NEW" means nothing exists yet.
>
> **Rules that bind every entry** (`CLAUDE.md`):
> - no model factor without a backtest; descriptive indexes stay descriptive (DEC-007);
> - provenance on every fact; never invent news, scores, injuries or times;
> - ESPN JSON stays local (DEC-006);
> - the page must keep working as a static file;
> - edit `src/template.html` and `src/universe/*`, never `public/index.html`;
> - run `npm test`.

---

## FEATURE-F01 — Snapshot carry-forward and refresh health

Status: Done (Nov. 23): parts 1–2 in `lib/fabric/carry.js`, `scripts/fabric-snapshot.js`, `data/fabric/runs.json`; parts 3–4 in `.github/workflows/refresh-backup.yml` and `scripts/refresh-status.js` (the owner is told through one GitHub issue labelled `data-refresh`; a push channel waits for F10). Not yet run on GitHub.
Priority: P0 · Score 79.2 · Size S
Category: Reliability / Automation
Tag: EXISTING—IMPROVE (`scripts/fabric-snapshot.js`)

Problem:
- The Nov. 23 daily refresh ran where five public sources were unreachable. Open-Meteo, both RSS feeds, YouTube and podcasts all returned `fetch failed`.
- It still wrote `data/fabric/latest.json` and replaced the previous good snapshot. The published page lost headlines, weather and media.
- There is no `data/fabric/events/2026-11-22.json`.
- Nobody was told.

Proposed Solution:
1. When a public source fails in the snapshot run, keep that source's block from the previous committed `latest.json`, with its original `lastOk`, so the page shows it as stale with its true age.
2. Write a short run report (sources ok/stale/down, events added) into the commit message and `data/fabric/runs.json`.
3. Add a public-only GitHub Actions backup refresh at an off-hour minute.
4. Optionally notify the owner (F10 channel) when two or more sources fail.

User Value: the published page never silently regresses.
Competitive Advantage: low directly; protects the provenance promise.

Dependencies: none.
Existing Components:
- `createSource` last-good semantics;
- `validatePublicSnapshot`;
- `.github/workflows/fantasypros.yml` (workflow pattern).
New Components: a carry-forward merge in the snapshot script; `snapshot.yml` workflow.

Technical Complexity: low.
Risk:
- The carry-forward must never mark old data as fresh. Test that `ageSec` and `lastOk` keep the original values.
- Never carry forward local-scope data.

Research: `data/fabric/latest.json` (Nov. 23) sources block; GitHub Actions cron limits (`FEATURE_RESEARCH.md` §6).

Implementation Plan:
1. Add a merge step in the snapshot script.
2. Tests: failing-source fixture, then carried block with old `lastOk`, status stale.
3. Add the run report.
4. Add the workflow with `FABRIC_SCOPES=public`.
5. Docs: DATA_MODEL, CURRENT_STATE.

## FEATURE-F02 — "What does my team need?" path and rooting guide

Status: Research
Priority: P0 · Score 86.7 · Size M
Category: Analytics / UX
Tag: EXISTING—IMPROVE (engine `watch`, leverage row colouring in the simulator, the brief's "most important game")

Problem: fans want to know what has to happen, not just a percentage. Today the leverage exists only as row colours for the followed team and one "most important game" line.

Proposed Solution: a per-team "Path" panel, in both the simulator and the team drawer, with:
1. "Games to root for this week", ranked by the swing in the team's playoff odds between outcomes, from `simulate(..., watch)` over every game.
2. "If they win out: X%" and "If they go N–M: Y%", from conditioning on the team's own results.
3. "Most likely path": the most common set of results among simulated seasons where the team qualifies.
4. Clinch or elimination proofs once F03 lands.

Sentences are generated only from numbers ("in every one of 20,000 simulated seasons" is never written as "mathematically"). The panel updates live as the user picks games.

User Value: very high. This is the December question.
Competitive Advantage: high; only partly done elsewhere (A to Z, NYT).

Dependencies: F07 recommended (one simulation state); F35 for noise wording; F03 for proofs.
Existing Components: `simulate` with `watch` and `lev`; `status()`; `03-sim.js` worker.
New Components: path module (pure, testable in Node); panel.

Technical Complexity: medium. Cost: watching every remaining game in one run multiplies the counters by about 2 × 32 per game, which is fine in a worker.
Risk:
- Over-claiming certainty.
- Performance on phones: cap the number of watched games, and run deep analysis on request.

Research: competitor §4 unmet need 1.

Implementation Plan:
1. Pure function `pathFor(team, result)` with tests: totals consistent, ranking monotone.
2. Command-center panel and team-drawer section.
3. Simulator section.
4. Copy review against over-claiming.
5. Hook F03 proofs later.

## FEATURE-F03 — Proven clinch and elimination with scenarios

Status: Research
Priority: P1 · Score 68.2 · Size L
Category: Analytics
Tag: EXISTING—IMPROVE (`status()` conservative flags)

Problem: flags are sufficient conditions only, and there are no "needs X to clinch" statements.

Proposed Solution:
- Port the method of nflseedR's `nfl_clinching_status()` (MIT, experimental). It returns clinched, alive or eliminated for division, playoff berth and No. 1 seed, with proof scenarios, and its NEWS says it matches official flags 2006–2025.
- Port with attribution, then validate against its outputs for past seasons.

User Value: high. Competitive Advantage: medium-high.

Dependencies: F28 (tiebreaker parity).
Existing Components: engine standings and tiebreakers.
New Components: clinch module; oracle test data generated once from nflseedR (R run offline, outputs committed with credit).

Technical Complexity: high. Risk: rule subtleties; the upstream function is experimental. Never show a proof that the oracle tests do not cover.

Research: https://github.com/nflverse/nflseedR (`R/clinching_status.R`, NEWS).

Implementation Plan:
1. Line-by-line read and difference list.
2. Port the elimination and clinch search.
3. Oracle tests.
4. UI in F02.

## FEATURE-F04 — Why the odds moved (attribution)

Status: In progress (Nov. 23, 2026). Built: snapshot version 2 (`scripts/snapshot.js`: `probs`, `gaps`, `games`); the engine's `changeWatch` and `explainChange` (a first-order split, DEC-020, instead of re-running with one input swapped at a time); "Why it moved" in the team panel; `why` per mover in MCP `get_what_changed`; the game panel lists feed items dated between the two looks of each big line move. The first real split appears once a build compares with a version-2 forecast (the Nov. 24 refresh saves the first; the Nov. 25 build uses it). Not built: a split of division and Super Bowl chances; the simulator page's what-changed card.
Priority: P0 · Score 83.2 · Size M
Category: Analytics / Explainability
Tag: EXISTING—IMPROVE (what-changed card, `newsEffect`, `get_what_changed`)

Problem: "What changed" lists movers but does not say why. ROADMAP lists "splitting a change into results, lines and model" as open.

Proposed Solution: for each team, split the change in playoff, division and Super Bowl odds between two snapshots into:

| Part | What it covers |
|---|---|
| (a) own results | The team's own games since the last snapshot |
| (b) other results | Every other team's games |
| (c) rating and line changes | Moves in the ratings and posted lines |
| (d) news and quarterback shifts | Curated news items, including QB changes |
| noise | Simulation noise, shown as a band |

The split comes from re-running the engine with one input swapped at a time, with a fixed seed. Report either a fixed, documented order with the remainder shown, or an average over orders. Show it in the team drawer, on the what-changed card and in MCP `get_what_changed`.

User Value: high. Competitive Advantage: high (nobody does it).

Dependencies: snapshot v2 (store the results set, model version, ratings and lines used).
Existing Components: engine, `scripts/snapshot.js`, `scripts/build.py --reuse`, what-changed card, MCP tool.
New Components: snapshot v2 writer; attribution function (Node, usable by the page and MCP).

Technical Complexity: medium.
Risk:
- Interaction effects: label the remainder honestly.
- Leakage: only use inputs known at each snapshot.

Research: competitor §4 unmet need 2.

Implementation Plan:
1. Snapshot v2 (backward-compatible reader).
2. Attribution in Node with tests: the parts sum to the total within noise.
3. UI.
4. MCP field.

## FEATURE-F05 — Forecast ledger and live accuracy tracker

Status: Research
Priority: P0 · Score 81.5 · Size M
Category: Analytics / Trust
Tag: EXISTING—IMPROVE (daily snapshots, backtest, `CALIBRATION.md` "not yet done")

Problem: the season's live forecasts are not scored. Snapshots lack per-game model probabilities and a model version, so they cannot be.

Proposed Solution:
1. Freeze each day's per-game model probability, posted line, model version and a hash of inputs into `data/ledger/<day>.json`.
2. Run a nightly scorer for Brier score, log loss and Brier skill against the line, reliability with 5 bins, and season-level reliability as seasons finish.
3. Add a page section "How have we done this season?".
4. Later, columns for an LLM forecaster on the same footing.

User Value: high (trust). Competitive Advantage: high.

Dependencies: F01; snapshot v2.
Existing Components: `scripts/evaluate.py` scoring code; snapshots; report UI.
New Components: ledger writer; scorer (stdlib Python or Node); UI.

Technical Complexity: medium.
Risk:
- Small samples: show counts and intervals.
- Tamper-evidence: hash plus git history.
- Leakage: freeze before kickoff.

Research: forecast-ledger, WorldCupBench, scoringrules, 538 checking-our-work (`FEATURE_RESEARCH.md` §5).

Implementation Plan:
1. Ledger schema in `lib/contract.js`.
2. Writer in the refresh.
3. Scorer.
4. UI.
5. Backfill weeks 4–11 by point-in-time replay, labelled as a replay, not live.

## FEATURE-F06 — Shareable scenarios and share cards

Status: Research
Priority: P1 · Score 72.3 · Size S
Category: UX / Growth
Tag: NEW

Problem: picks and what-ifs live in one browser. Competitors share links and images.

Proposed Solution:
- Compact URL encoding of picks, mode and what-if (`?view=sim&p=<base64url>`).
- A canvas-drawn PNG card (team odds, path, source line and as-of time, local fonts only).
- The Web Share API, with a copy-link fallback.

User Value: high. Competitive Advantage: parity.

Dependencies: F07 helps (one state).
Existing Components: URL state allowlist in `00-core.js`; picks object.
New Components: codec, card renderer.

Technical Complexity: low.
Risk:
- Malformed URLs: validate strictly, as the current parser does.
- Card text must carry its time and "estimate" label.

Implementation Plan:
1. Codec with tests.
2. Load path.
3. Card.
4. Share button.

## FEATURE-F07 — One simulation state across both views

Status: Research
Priority: P1 · Score 63.0 · Size M
Category: UX / Tech debt
Tag: EXISTING—IMPROVE

Problem:
- The simulator (8,000 seasons, main thread, picks, what-if, live) and the command center (20,000 seasons in a worker, feed finals only) give different numbers for the same moment.
- Neither shares picks.
- Draft order, standings, seed grid, strength of schedule and clinch flags exist only in the simulator.

Proposed Solution:
- One scenario store (picks, mode, what-if) used by both views.
- The simulator also runs in the worker.
- The command center gains standings, draft order and seed-grid panels, reusing the simulator's renderers.

User Value: medium-high. Competitive Advantage: low.

Dependencies: none.
Existing Components: `03-sim.js` worker; simulator renderers.
New Components: shared state module.

Technical Complexity: medium.
Risk: regressions in the simulator view. Its behaviour must be preserved, and tested.

Implementation Plan:
1. State module.
2. Worker for the simulator.
3. Panels.
4. Remove the duplicate formatting helpers.

## FEATURE-F08 — Watchlist and in-page alerts with thresholds

Status: Research
Priority: P0 · Score 78.0 · Size M
Category: Notifications / Personalization
Tag: NEW (planned in M5)

Problem: no way to be told what matters. Competitor alerts are either late or noisy.

Proposed Solution:
- Watched teams, kept in `nflu-v1`.
- Rules, each with a cooldown and dedupe by event id:
  - a starter (QB weighted) moves to Out, Doubtful or IR;
  - playoff odds move ≥ N points, beyond simulation noise (F35);
  - a line moves ≥ N points of win chance;
  - kickoff and final;
  - a tier-1 or corroborated headline with importance ≥ 70.
- An alert tray and an optional browser notification while the page is open.
- Uses `/api/universe?since=` (exists, unused).

User Value: high. Competitive Advantage: high ("impact alerts").

Dependencies: F22 (model events), F35.
Existing Components: event feed, importance scores, `?since=`.
New Components: rules module (pure, tested); tray UI.

Technical Complexity: medium.
Risk: alert fatigue. Defaults stay conservative. Never alert on `beforeWatch` items.

Implementation Plan:
1. Rule schema.
2. Evaluator with tests (dedupe, cooldown, noise).
3. Tray.
4. Settings.

## FEATURE-F09 — Per-team RSS/Atom feed and .ics schedule

Status: Ready
Priority: P1 · Score 73.3 · Size S
Category: Integrations / Notifications
Tag: NEW

Problem: there is no way to follow the project without opening the page.

Proposed Solution:
- `/feed/<team>.xml` and `/feed/all.xml` (Atom) carrying events above an importance threshold, plus the daily digest (F40).
- `/calendar/<team>.ics` with kickoffs and broadcast.
- Static copies are committed by the refresh, so they work without the server.

User Value: medium. Competitive Advantage: medium.

Dependencies: F40 helps.
Existing Components: events, the schedule, server routing.
New Components: Atom and ICS writers (stdlib, escaped).

Technical Complexity: low.
Risk:
- Feeds must carry only public-scope data and link to the original publishers.
- XML escaping must be correct.

Implementation Plan: writers with tests → server routes → snapshot step → README.

## FEATURE-F10 — Opt-in push alerts (ntfy, later Web Push)

Status: Research
Priority: P1 · Score 74.5 · Size M
Category: Notifications
Tag: NEW

Problem: alerts only reach users while the page is open.

Proposed Solution:
- **Stage 1: ntfy topics per team.** The project posts (HTTP POST, no dependency) from the local server or the GitHub Action, on F08-style significant events only. Users subscribe in the ntfy app; no accounts.
- **Stage 2: Web Push** on the hosted origin (VAPID with `node:crypto` or vendored pushforge, MIT), which needs `sw.js` and stored subscriptions.

User Value: high. Competitive Advantage: high when combined with impact thresholds.

Dependencies: F08 rules; an owner decision on storing push subscriptions.
Existing Components: server; workflows.
New Components: ntfy sender; later `sw.js`, manifest and subscription store.

Technical Complexity: medium.
Risk:
- Public ntfy topics are readable by anyone. Publish only public-scope facts.
- Rate limits (about 250 a day per visitor).
- Keep the VAPID private key in secrets.

Implementation Plan: ntfy sender + cap → topic naming → docs → later Web Push.

## FEATURE-F11 — Grounded AI brief with event-id citations

Status: Research (blocked on DEC-009)
Priority: P1 · Score 75.8 · Size M
Category: AI
Tag: NEW (rule brief exists: `04-intel.js`, `13-brief.js`)

Problem: the rule brief cannot weigh, connect or narrate. Competitors' AI is ungrounded and fails publicly.

Proposed Solution:
1. `scripts/brief.js` in a GitHub Action builds a compact digest with event ids.
2. One call with structured output: sentences, each with a `kind` and `event_ids`.
3. A deterministic validator drops unknown ids and numbers or teams not present in the cited events.
4. Fallback to the rule brief.
5. Commit `data/brief.json` with model, prompt hash, input hash and usage.

Start daily on a Haiku-class model (estimated about $0.10 a month); move to hourly on game days only if the eval supports it.

User Value: high. Competitive Advantage: high (grounded, labelled, timestamped).

Dependencies:
- F40 (digest input) and F22 (events);
- owner decision DEC-009 (provider and ceiling);
- the API key in GitHub secrets.

Existing Components: MCP tools; rule brief; contract.
New Components: brief script, validator, eval set (30–50 frozen payloads), `brief.json` contract.

Technical Complexity: medium.
Risk:
- Prompt injection through headlines: data fields marked untrusted, no acting tools, URLs re-attached afterwards.
- Cost: a hard cap.
- Stale context: an `as_of` time on every brief.

Research: `FEATURE_RESEARCH.md` §6, §13.

Implementation Plan: eval set and validator first (no model) → script → Action → UI label "AI-written, checked against N cited items".

## FEATURE-F12 — Grounded Q&A assistant over the MCP tools

Status: Research (blocked on DEC-009)
Priority: P2 · Score 63.1 · Size L
Category: AI
Tag: NEW (MCP server exists)

Problem: questions that panels do not answer.

Proposed Solution:
- An owner-local first version: a tool-calling loop over the 14 read-only MCP tools.
- Answers carry sources, `as_of` and the confirmed/reported/estimate labels.
- Refuses when the sources are down or stale.
- No public chat until there is a cost cap and abuse controls.

User Value: medium-high. Competitive Advantage: medium.

Dependencies: F11 validator and eval.
Existing Components: `mcp/`.
New Components: chat loop and UI (local).

Technical Complexity: high.
Risk: cost, injection, over-trust.

Implementation Plan: after F11 is stable.

## FEATURE-F13 — AI "Prove this wrong" red team

Status: Research
Priority: Experimental · Score 61.8 · Size M
Category: AI / Explainability
Tag: EXISTING—IMPROVE (`whyPanel`, `proveWrong`)

Problem: the rule challenges are fixed lists.

Proposed Solution: the model ranks and explains the counter-evidence for a team or game forecast, citing only event ids and model fields. The rule list stays as the fallback and the floor.

User Value: medium. Competitive Advantage: high.

Dependencies: F11.
Existing Components: `proveWrong`, `whyPanel`.
New Components: prompt; validator reuse.

Technical Complexity: medium. Risk: invented counter-arguments, blocked by the validator.

## FEATURE-F14 — Official club RSS headlines (tier 1)

Status: Blocked on permission (Nov. 24 terms check of all 32 clubs; see the registry's "Official club news feeds"). This corrects the earlier note: the 49ers' terms bar deep links and automated access. Owner decision: write to clubs, link to club home pages only, or drop.
Priority: P1 · Score 76.0 · Size S
Category: Data / News
Tag: NEW

Problem: the feed has no official source. Club sites publish RSS.

Proposed Solution:
- A public adapter for `https://www.<club>.com/rss/news`.
- Tier 1, headlines unmodified, team credit and link, no descriptions (DEC-008).
- Enabled per club after reading that club's terms page; a removal switch per feed.

User Value: medium-high. Competitive Advantage: medium (raises confidence and corroboration).

Dependencies: none.
Existing Components: RSS adapter, clustering, tiers.
New Components: club feed list in `shared/teams.json`; registry rows.

Technical Complexity: low.
Risk:
- Per-club terms. The 49ers' terms allow RSS display unmodified and with removal on request; the other clubs are unverified.
- NFL.com §8 linking note (`FEATURE_RESEARCH.md` §19).
- Feed volume (32 × 20 items): fetch in a pool, as the YouTube adapter does.

Implementation Plan: probe 32 feeds and terms → config → adapter + tests → registry.

## FEATURE-F15 — Canonical players from the nflverse crosswalk

Status: Research
Priority: P2 · Score 65.6 · Size M
Category: Data
Tag: NEW

Problem: players are display names only. Injury matching uses name heuristics.

Proposed Solution:
- A build step joins nflverse `players.csv` (gsis, espn, pfr ids) and `roster_2026.csv` (`sleeper_id`) into a player table.
- An unresolved list and a manual override file (the nflverse-players pattern).
- No GPL dynastyprocess data needed.

User Value: medium (enables player pages, better injuries). Competitive Advantage: low.

Dependencies: none.
Existing Components: entities.js; build download helpers.
New Components: player table artifact; resolver.

Technical Complexity: medium.
Risk: identity errors. Never merge uncertain matches silently.

Implementation Plan: table → resolver with tests → use in injuries.

## FEATURE-F16 — Depth-chart-aware injury impact

Status: Research
Priority: P1 · Score 67.5 · Size M
Category: Intelligence
Tag: EXISTING—IMPROVE (starter flag for QBs only; burden index)

Problem: the burden index assumes starter status except for QBs.

Proposed Solution: nflverse `depth_charts` (daily, public, with `gsis_id`) and `snap_counts` set the starter flags and name the replacement. Descriptive only until a backtest passes (DEC-007).

User Value: medium-high. Competitive Advantage: medium.

Dependencies: F15.
Existing Components: `injuryWeight`, team drawer.
New Components: depth adapter.

Technical Complexity: medium. Risk: the depth-chart schema changed in 2025.

## FEATURE-F17 — Injury claims with competing sources

Status: Ready
Priority: P1 · Score 77.0 · Size S
Category: Intelligence / Provenance
Tag: EXISTING—IMPROVE (`also`, `disagree`, `practice`, `returnDate` computed in `lib/fabric/index.js`, hidden by `11-teams.js`)

Problem: the fabric detects conflicts between nflverse and ESPN reports, but the UI only puts them in some event titles.

Proposed Solution: in the team drawer, show each injury as one claim:
- the status per source with its report week and time;
- a "sources disagree" chip;
- the practice trend;
- the return date;
- whether the player is a starter.

User Value: medium-high. Competitive Advantage: high (nobody shows conflicts).

Dependencies: none. Existing Components: fabric injuries. New Components: UI only.

Technical Complexity: low. Risk: none beyond layout. Public mode shows a single source.

## FEATURE-F18 — Sleeper "my league" view (local)

Status: Research (owner decision)
Priority: P2 · Score 64.1 · Size L
Category: Integrations / Personalization
Tag: NEW (no Sleeper code exists)

Problem: fantasy players want their roster's injuries, news and game status in one place.

Proposed Solution:
- A local-scope adapter reading the owner's league (ids in environment variables): rosters and matchups.
- Players joined through F15.
- A "My league" panel: each rostered player's status, news and game state.
- The live matchup score from Sleeper. Any projection is our own estimate, labelled.

User Value: high for fantasy users. Competitive Advantage: low (many do it).

Dependencies: F15; owner decision.
Existing Components: scopes (DEC-006 pattern).
New Components: Sleeper adapter (read-only), panel.

Technical Complexity: medium-high.
Risk:
- Other managers' names are personal data: local only, never committed.
- No transactions: the API is read-only.

## FEATURE-F19 — Live win-probability refit and 4th-down advice

Status: Research
Priority: P2 · Score 54.8 · Size L
Category: Live game
Tag: EXISTING—IMPROVE (`liveProbFor` ignores possession and timeouts)

Problem: the known gap in the in-game model.

Proposed Solution:
- Evaluate nfl4th-js (MIT, server-only, 88 MB of models) or refit a smaller model from nflverse `pbp`.
- Adopt it only after a backtest at fixed checkpoints beats the current model.

Dependencies: M6. Risk: size and maintenance of a single-commit port.

## FEATURE-F20 — Live playoff odds during games

Status: Ready (local only)
Priority: P1 · Score 74.0 · Size S
Category: Live game / Simulation
Tag: EXISTING—IMPROVE (`simulate` takes `liveP`; the simulator uses it, the command center does not)

Problem: on Sundays the command center's playoff odds ignore games in progress.

Proposed Solution: pass in-game probabilities into the worker run and label the result "as it stands, live". Local scope only (ESPN). The public page keeps the snapshot.

Dependencies: heartbeat (done Nov. 23); a verified game window.
Risk: churn. Recompute at most every 60 s.

## FEATURE-F21 — Time machine (History range)

Status: Deferred
Priority: P2 · Score 59.3 · Size L
Category: Data / UX
Tag: NEW (disabled "History (later phase)" option)

Problem: no way to see what was known at an earlier moment.

Proposed Solution:
- Replay from `data/fabric/events/*` by `seenAt`, plus dated games and injuries archives and dated snapshots.
- A slider picks the moment.
- An optional `node:sqlite` index.

Dependencies: F01 (continuous archive); archiving games and injuries daily.
Risk: gaps in the record must show as gaps.

## FEATURE-F22 — Model and playoff-move events

Status: Done (Nov. 23, 2026), page side. The page adds `playoff_move` events (a team's playoff chance moved 3 points or more since the saved forecast, and by more than the two simulations' 95% noise margin; the split from F04 named when the forecast is version 2) and `model` events (ratings and posted line 8 points or more apart, games not yet started). Dated by the build's day, labelled "model estimate", importance capped at 65 so they are never breaking, the brief's top story or a map ring. Clicking one opens the team or the game. They are worked out in the browser from the build's data, not stored in the fabric's event files.
Priority: P1 · Score 75.8 · Size S
Category: Intelligence
Tag: EXISTING—IMPROVE (contract defines `model` and `playoff_move`; nothing emits them; the "Model" filter is empty)

Proposed Solution:
- The snapshot and the page emit `playoff_move` events (|Δ| ≥ 3 points and beyond noise) and `model` events (model against market crosses 8 points).
- Basis "model estimate"; `ts` is the snapshot time.

Dependencies: none (F04 later adds the "why"). Risk: noise. Use the F35 margin.

## FEATURE-F23 — Line history and anomaly flags from own records

Status: Partly done (Nov. 23): line history from the lines already read (nflverse, ESPN locally) in `lib/fabric/lines.js`, shown in words in the game panel with big moves marked; the sparkline and robust-z flags are still open
Priority: P1 · Score 68.1 · Size S
Category: Markets
Tag: EXISTING—IMPROVE (daily `lines` in snapshots; ESPN open and current locally)

Proposed Solution:
- A per-game sparkline from daily snapshots, plus heartbeat-recorded local lines.
- A robust z-score flag (median and MAD over 3–4 weeks, |z| > 3.5) on unusual moves.
- Clearly labelled: one book (nflverse) publicly.

Risk: thin history before Nov. 20.

## FEATURE-F24 — Multi-book odds (The Odds API free tier)

Status: In progress (Nov. 23, 2026): adapter built and tested on fixtures, off until the owner sets `ODDS_API_KEY` (DEC-019). Every 8 h on the server plus the daily snapshot; the published page carries the median line only; each book's prices only on the local server. Not yet run against the real API. Futures not built.
Priority: P2 · Score 60.1 · Size M
Category: Markets
Tag: NEW

Proposed Solution:
- About 3 credits per weekly h2h + spreads + totals pull, within 500 a month.
- Super Bowl futures only (the API has no division markets).
- Store our own snapshots for movement. Never re-serve as a feed (terms).

Dependencies: owner key; F23.

## FEATURE-F26 — Schedule map mode

Status: Research
Priority: P2 · Score 60.3 · Size S
Category: UX
Tag: EXISTING—IMPROVE (disabled "Schedule · soon")

Proposed Solution: a week × team grid with opponents, rest, home or away, game probability and remaining strength of schedule. All data is in `GAMES` and the schedule; descriptors only.

## FEATURE-F27 — Network map mode (leverage graph)

Status: Experimental
Priority: Experimental · Score 53.1 · Size M
Category: UX
Tag: EXISTING—IMPROVE (disabled "Network · soon")

Proposed Solution: teams as nodes; edges weighted by how much each one's remaining games affect the other's odds (from `watch`).

Risk: pretty but hard to read. Prototype before committing.

## FEATURE-F28 — Complete tiebreakers (nflseedR rule fixes)

Status: Research
Priority: P2 · Score 55.8 · Size M
Category: Simulation
Tag: EXISTING—IMPROVE (three steps skipped)

Proposed Solution:
- Compare the engine with nflseedR's documented rules: one team advances per step in division ties; common games need ≥ 4 opponents; draft ties; net wins; separate tied groups.
- Add the three skipped steps, with tests from known seasons.

Dependencies: none. Unblocks F03.

## FEATURE-F29 — NWS venue alerts and weather-on-totals backtest

Status: Research
Priority: P2 · Score 56.6 · Size S
Category: Data
Tag: NEW

Proposed Solution:
- `api.weather.gov/alerts/active?point=` per outdoor venue (public domain, User-Agent without personal data) as a descriptive flag.
- An Open-Meteo archive backtest of kickoff-hour wind and gusts against totals, for descriptors only.

## FEATURE-F30 — Scheduled source-drift check

Status: Done (Nov. 23): `.github/workflows/source-check.yml`, `scripts/source-check.js`; one issue labelled `source-drift`, closed when every source passes again. Not yet run on GitHub.
Priority: P1 · Score 69.8 · Size S
Category: Reliability / Developer tools
Tag: NEW

Proposed Solution: a GitHub Action (daily, off-hour) runs the public adapters against `validatePublicSnapshot` and per-adapter shape checks. On a failure it opens or updates an issue. The idea is borrowed from gtonic/nfl_mcp; the code is our own.

Risk: false alarms on transient outages. Require two consecutive failures.

## FEATURE-F31 — Security and robustness fixes from review

Status: Items 1–7 done (Nov. 23); item 8 (one constants table for thresholds) left out: a refactor across the page, the simulator and the fabric with no user-facing change. For item 7, the focus-team figures are dropped from command-center results (`leagueOnly`) rather than computed for another team, since nothing there reads them.
Priority: P1 (scheduled in Phase 1 regardless of score) · Score 65.3 · Size S
Category: Security / Reliability
Tag: EXISTING—IMPROVE

Items found in the Nov. 23 read of the code:

| # | Fix | Where |
|---|---|---|
| 1 | Add a timeout and a negative cache to `/api/live` | `server.js` `liveGames` |
| 2 | Add a timeout and backoff to the simulator poll; validate its fields | `src/template.html` |
| 3 | Run the simulator's news link through `safeUrl` | `src/template.html` |
| 4 | Make the `serveStatic` containment check use `path.sep` | `server.js` |
| 5 | Add a Content-Security-Policy with hashes of the inline scripts, computed at build; allow Google Fonts, YouTube embeds and Omny audio | `server.js`, `scripts/build.py` |
| 6 | Remove the dead `openLive` | `src/template.html` |
| 7 | Fix `lev` computed with focus 0 in the command center | `03-sim.js:56` |
| 8 | Unify line-move and fumble-luck thresholds in one constants table | |

Tests: one per fix; `npm test`.

## FEATURE-F32 — Shared rating module and walk-forward constants

Status: Research
Priority: P2 · Score 55.1 · Size M
Category: Tech debt / Modelling
Tag: EXISTING—IMPROVE

Proposed Solution: one Python module imported by `build.py`, `evaluate.py` and the backtests. Adopt walk-forward constants (the hold-out showed in-sample optimism of about 0.007). Re-run `evaluate.py`.

## FEATURE-F33 — Browser-level regression tests

Status: Research
Priority: P2 · Score 56.6 · Size M
Category: Developer tools
Tag: NEW

Proposed Solution: a CI-only headless browser check (Chrome DevTools protocol through a small driver, as used during development, or Playwright in CI only, so the local repository stays dependency-free). It covers the page side the layout review left untested: hiding, tabs, drag and resize handlers, the share codec, alerts.

## FEATURE-F34 — Team dossier (complete team page)

Status: Research
Priority: P1 · Score 70.8 · Size M
Category: UX
Tag: EXISTING—IMPROVE (team drawer)

Proposed Solution: the team drawer adds:
- remaining games with chances (MCP `get_team.remainingGames` already computes them);
- standings and a division table;
- division-odds history (`D.history.dv`, built and unused);
- round odds (`rDiv`, `rConf`, `rSB`);
- draft slot odds;
- the F02 path;
- F17 injury claims;
- a shareable URL (exists: `?team=`).

Dependencies: F02, F07.

## FEATURE-F35 — Honest uncertainty display

Status: Ready
Priority: P1 · Score 77.0 · Size S
Category: UX / Trust
Tag: EXISTING—IMPROVE

Proposed Solution:
- Show the Monte Carlo margin (computed by MCP, never shown).
- Phrase probabilities with frequencies ("about 3 in 10 teams in this spot miss").
- Label moves inside noise.
- Show reliability by disagreement bucket (`report.disagreement`, unused).

## FEATURE-F37 — Claims from official podcasts and pressers

Status: Experimental
Priority: Experimental · Score 49.6 · Size L
Category: AI / Media
Tag: NEW

Proposed Solution:
- Local transcription of official NFL podcast audio (Whisper-class, owner machine).
- Extract short claims in our own words, each with the episode URL, a timestamp and `kind: reported`.
- Delete the transcripts.
- YouTube captions are excluded by YouTube's terms.

Risk: copyright, accuracy, cost. Legal review of feed terms first.

## FEATURE-F38 — Search upgrade and command palette

Status: Research
Priority: P2 · Score 62.8 · Size S
Category: UX
Tag: EXISTING—IMPROVE

Proposed Solution: page search adds injured players and game ids (MCP search already does). A `/` hotkey opens a command palette: jump to a team, game, layer or view.

## FEATURE-F39 — Installable app and offline (hosted only)

Status: Deferred
Priority: P2 · Score 53.9 · Size S
Category: Mobile
Tag: NEW

Proposed Solution: `manifest.webmanifest` and `sw.js` served by `server.js` (they cannot be inlined). Offline last snapshot. Required before Web Push on iPhone. Feature-detect it and fail silently on the artifact host.

## FEATURE-F40 — Persisted daily digest (rules first)

Status: Ready
Priority: P1 · Score 74.3 · Size S
Category: Automation
Tag: NEW (rule brief exists only as a modal)

Proposed Solution:
- The refresh writes `data/digest/<day>.json`: the rule brief's findings, the what-changed movers and the top events, each with ids.
- The page links "Today's digest" with a URL.
- It feeds F09 and F11.

## FEATURE-F41 — News-item proposer for data/news.json

Status: Research
Priority: P2 · Score 65.8 · Size M
Category: Automation
Tag: EXISTING—IMPROVE (hand-curated by the daily run)

Proposed Solution:
- Propose candidate `qb_change` items when a depth-chart QB1 changes, the starting QB is listed Out, or clustered tier-1/2 headlines say "will start".
- Each candidate carries its source URLs.
- Written to `data/news.proposed.json` for review. Never auto-published: the constitution forbids invented items.

---

## Rejected or superseded entries

| ID | Idea | Status | Reason (detail in `FEATURE_RESEARCH.md` §17) |
|---|---|---|---|
| F25 / F50 | Kalshi and Polymarket price comparison | Deferred, 2026-11-23 | Terms bar storing and redistribution without written permission |
| F36 | Draft and tank tracker in the command center | Superseded by F07 and F34 | Draft data exists; surfacing it is part of those |
| F42 | Model-drift CUSUM | Folded into F05 | |
| F45 | User accounts | Rejected, 2026-11-23 | Personal data, no need |
| F46 | Native mobile app | Rejected, 2026-11-23 | Page plus push covers it |
| F47 | Vector database or RAG | Rejected for now, 2026-11-23 | Corpus too small |
| F48 | Game streams or re-hosted video | Rejected, 2026-11-23 | Not authorized |
| F49 | Betting picks or affiliate offers | Rejected, 2026-11-23 | Constitution and terms |
| F51 | Composite team index as a model input | Deferred, 2026-11-23 | DEC-007; needs a backtest |
| F52 | nfl.com injury and inactives scraping | Rejected, 2026-11-23 | NFL.com terms |
