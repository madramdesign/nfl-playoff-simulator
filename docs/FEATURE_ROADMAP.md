# Feature roadmap

> **Living document.** It sets the order of work for the features in `FEATURE_BACKLOG.md`; the evidence and scores are in `FEATURE_RESEARCH.md`.
>
> **Where it sits.** It complements the milestone plan in `MASTER_PLAN.md`; the M-numbers below show where each item belongs.
>
> **How work lands.** It follows `CLAUDE.md`: the integration branch and agent worktrees, review, `npm test`, and the owner's approval before `main`.
>
> **Revisions.** Re-rank when circumstances change, and record the change in the history at the bottom.

## Status on Nov. 25, 2026
- **Done:** F01, F22, F30, F31 (items 1–7), F24 (consensus), F53 NFL TV.
- **Partly done:** F04 (team split; division and Super Bowl split open), F23 (history; sparkline and anomaly flags open), F29 (NWS alerts; weather-on-totals backtest open), F15 and F16 (crosswalk and starter labels only).
- **Blocked or on hold:** F14 (club permission), F02 (owner: "Not now"), F11–F13 (DEC-009), F18 (owner decision).
- **Next, in order:** F35, F17, F40 then F09, F20 after a real game check, then Phase 2 (F05, F07, F08, F06, F34). New since the first version: F54 live news on the front page (Research).

## Priority tiers

### P0: do next (highest value, data already in hand)
| ID | Feature | Size | Depends on | Milestone |
|---|---|---|---|---|
| F01 | Snapshot carry-forward and refresh health | S | none | M9 hardening |
| F02 | "What does my team need?" path and rooting guide | M | F07 recommended, F35 | M4/M3 |
| F04 | Why the odds moved (attribution) | M | snapshot v2 | M4 |
| F05 | Forecast ledger and live accuracy tracker | M | F01, snapshot v2 | M4 |
| F08 | Watchlist and in-page alerts with thresholds | M | F22, F35 | M5 |

### P1
| ID | Feature | Size | Depends on | Milestone |
|---|---|---|---|---|
| F31 | Security and robustness fixes from review | S | none | M9 |
| F30 | Scheduled source-drift check | S | none | M9 |
| F17 | Injury claims with competing sources | S | none | M5 |
| F35 | Honest uncertainty display | S | none | M3 |
| F22 | Model and playoff-move events | S | none | M5 |
| F14 | Official club RSS headlines | S | per-club terms check | M5 |
| F40 | Persisted daily digest (rules) | S | none (F22 helps) | M5 |
| F09 | Per-team Atom feed and .ics schedule | S | F40 helps | M5 |
| F20 | Live playoff odds during games (local) | S | heartbeat (done), verified game window | M6 |
| F23 | Line history and anomaly flags | S | none | M5 |
| F06 | Shareable scenarios and share cards | S | F07 helps | M3 |
| F07 | One simulation state across both views | M | none | M3 |
| F34 | Team dossier | M | F02, F07 | M3 |
| F10 | Opt-in push alerts (ntfy, then Web Push) | M | F08; owner choice on subscriptions | M5 |
| F11 | Grounded AI brief | M | F40, F22, **owner DEC-009** | M7 |
| F03 | Proven clinch and elimination with scenarios | L | F28 | M4 |
| F16 | Depth-chart-aware injury impact | M | F15 | M5 |

### P2
| ID | Feature | Size | Depends on |
|---|---|---|---|
| F15 | Canonical players (nflverse crosswalk) | M | none |
| F28 | Complete tiebreakers | M | none |
| F32 | Shared rating module, walk-forward constants | M | none |
| F33 | Browser-level regression tests | M | none |
| F41 | News-item proposer | M | F15 helps |
| F38 | Search upgrade and command palette | S | none |
| F26 | Schedule map mode | S | none |
| F29 | NWS venue alerts, weather-on-totals backtest | S | none |
| F12 | Grounded Q&A (owner-local) | L | F11 |
| F18 | Sleeper "my league" (local) | L | F15, **owner decision** |
| F24 | Multi-book odds | M | **owner key**, F23 |
| F21 | Time machine | L | F01, archive of games and injuries |
| F19 | Live win-probability refit, 4th-down advice | L | M6, backtest |
| F39 | Installable app and offline (hosted only) | S | hosted origin |

### Experimental
F13 (AI "Prove this wrong"), F27 (Network map mode), F37 (claims from official podcasts). Each needs a prototype or a legal or terms check before it is promoted.

## Recommended implementation order

The steps below are grouped into the five phases from the research. A step in a later phase can start early if its dependencies are met and it touches different files. File ownership follows `WORKSTREAMS.md`.

### Phase 1: quick wins and reliability (about 1–2 weeks)

1. **F01 carry-forward + run report + public backup workflow.** It protects everything else.
   - *Accept when:* a fixture with failing sources keeps the last good blocks with their original `lastOk`; the page shows them as stale; local data is never carried; and the workflow runs public-only.
2. **F31 security and robustness fixes.** One test per fix; `npm test` passes.
3. **F30 source-drift check.** It opens an issue only after two consecutive failures.
4. **F35 uncertainty** and **F17 injury claims.** UI only.
   - *Accept when:* the page checks cover margins and conflict chips, and public mode shows a single source.
5. **F22 model and playoff-move events.** The "Model" feed filter shows real items labelled as model estimates.
6. **F23 line history.** The sparkline comes from snapshots; robust-z flags are tested on synthetic moves.
7. **F14 club RSS:** start with the clubs whose terms were read. Registry rows include terms, removal switches and tier-1 confidence.
8. **F40 digest → F09 feeds and calendars.** Feeds validate as Atom and iCalendar, carry public scope only, and the committed copies work with no server.
9. **F20 live playoff odds.** Local only, after the heartbeat is confirmed in a real game window (CURRENT_STATE next action 1).

### Phase 2: core differentiators

10. **Snapshot v2.** Stores the results set, model version, per-game model probabilities and an input hash. The reader stays backward-compatible, the contract lives in `lib/contract.js`, and old snapshots are read as v1.
11. **F04 attribution.** The parts plus the remainder add up to the total; there is a noise band; the MCP `get_what_changed` tool gains the fields.
12. **F05 ledger and scorer.** Forecasts are frozen before kickoff, then scored nightly, with a page section. The weeks 4–11 backfill is labelled "replay".
13. **F07 one simulation state.** The simulator's behaviour is unchanged (existing tests, plus new ones for shared state).
14. **F02 path and rooting guide**, then **F06 share**, then **F34 dossier**.
    - F02: wording is checked against over-claiming, and the ranking and "win out" figures have unit tests.
15. **F08 in-page alerts.** Dedupe, cooldown and noise rules are tested; items marked `beforeWatch` never trigger an alert.

### Phase 3: automation depth

16. **F10 ntfy topics** (then Web Push if the owner agrees to store subscriptions).
17. **F15 players**, then **F16 depth-chart injuries**, then **F41 news-item proposer**.
18. **F28 tiebreakers**, then **F03 proven clinch**, which upgrades F02.
19. **F32, F33, F29**, and **F38, F26** as fillers.

### Phase 4: intelligence (owner decision DEC-009)

20. Build the **F11** eval set and validator first, with no model, then run the daily brief on a small model and keep the rule fallback.
    - *Accept when:* zero unsupported sentences on the eval, cost under the owner's ceiling, and every sentence cites ids and carries a kind.
21. **F13**, then **F12**, owner-local. **F37** stays R&D.

### Phase 5: platform expansion

22. **F18 Sleeper "my league".** Local only, after owner approval.
23. **F21 time machine.**
24. **F24 multi-book odds.** Owner key needed.
25. **F19 live win-probability refit.** Backtest gate.
26. **F39 installable app** on a hosted origin.
27. **F27 network map mode.**

## Owner decisions that gate items
| Decision | Gates |
|---|---|
| DEC-009: language-model provider and monthly ceiling | F11, F12, F13 |
| Storing Web Push subscriptions | F10 stage 2, F39 |
| The Odds API free key (settled Nov. 25: set) | F24 |
| Sleeper league access (ids kept in environment variables) | F18 |
| Render deploy and where the refresh runs (settled: Render, DEC-018; claude.ai routine plus GitHub Actions, DEC-021) | F01 backup workflow, F09 hosted feeds, F10 |
| YouTube API Services: privacy-policy agreement and Made for Kids checks (DEC-022) | F53, the media panel |
| Written permission from Kalshi or Polymarket (or drop) | deferred F25/F50 |

## History
- **2026-11-23:** first version, from the feature research of the same day.
- **2026-11-25:** status section added; F24 done for the consensus; F53 (NFL TV) done and F54 (live news on the front page) added at the owner's request; F02 on hold.
