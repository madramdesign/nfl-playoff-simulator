# Plan: player contracts and player availability ("health") data

> Status: **Plan, not started.** Drafted on Nov. 25, 2026. Backlog entries: F55 (contracts) and F56 (availability).
>
> Two gates come before any code:
> - **Gate A (owner):** OverTheCap's terms.
> - **Gate B (owner):** the health-data rules in §2.1, recorded as a decision.
>
> Implementation follows `CLAUDE.md`: integration branch, its own worktree, review, `npm test`, then the owner's approval before `main`.

## Why
The Nov. 25 "where could Rodgers go" analysis showed two gaps:
- the project knows nothing about contracts (cost, years, guarantees);
- it knows nothing about availability beyond this week's injury report.

Both are core to "team needs" questions (backlog F02, F34) and to any later injury factor in the model (M4), which would still need a backtest first.

## What exists today (checked Nov. 25, 2026)
| Piece | Where | Notes |
|---|---|---|
| Weekly injury report, current season | fabric source `nflverse-injuries` (`injuries_<season>.csv`, public, CC-BY-4.0) | Status, body part, practice status, `gsis_id` |
| Injury report, local and faster | `espn-injuries` (local only, DEC-006) | Return dates; compared with nflverse per player |
| Depth charts | `nflverse-depth` (wired Nov. 23) | Starter flags; 142 of 143 injured players matched by id |
| Player crosswalk | `nflverse-rosters` (weekly rosters: gsis, espn, sleeper and other ids) | |
| Scheduled fetching | `.github/workflows/data-fetch.yml`, every 3 hours (DEC-021, DEC-023) | The only place a non-stdlib tool can run without breaking DEC-001 |
| Contracts | nothing | |
| Injury history before this season | nothing (nflverse has 2009 on) | |

## 1. Contracts (F55)

### 1.1 Source
- **nflverse `contracts` release.**
  - Contents: OverTheCap contract data (`nflreadr::load_contracts()`). The release says "OverTheCap contract data".
  - Assets:
    - `historical_contracts.parquet`, updated Nov. 25, 2026;
    - `historical_contracts.rds`;
    - `otc_player_details.rds`;
    - `historical_contracts.csv.gz`, **last updated May 29, 2022, so stale: do not use**.
- **Fields** (from the 2022 CSV header; the current parquet's columns are still to be checked in step 1):
  - `player, position, team, is_active, year_signed, years`;
  - `value, apy, guaranteed, apy_cap_pct`;
  - `inflated_value, inflated_apy, inflated_guaranteed`;
  - `player_page, otc_id`;
  - `date_of_birth, height, weight, college`;
  - `draft_year, draft_round, draft_overall, draft_team`;
  - `season_history` (nested).
- **Crosswalk:** nflverse `players.csv` carries `otc_id` next to `gsis_id`, so contracts join to our players without name matching.
- **Not in it, as far as known:** cap hit per year, dead money, void years, release and trade cap consequences. Contracts are not cap mechanics. The page must say "contract value and guarantees", never "cap savings if released", unless a lawful source for those is found.

### 1.2 Terms: Gate A
- nflverse's data licence is CC-BY-4.0. But nflreadr's README says the data "belong to their respective owners, and are governed by their terms of use".
- OverTheCap's own terms could not be found by search on Nov. 25, 2026. They must be read on overthecap.com directly.
- **Until Gate A is passed:** no contract data is published or committed. Treat it as local-only like ESPN (DEC-006), or skip it.
- **Gate A outcomes:**
  - terms allow non-commercial display with credit: publish with "Contracts: OverTheCap via nflverse" beside every figure;
  - terms are silent or restrictive: the owner asks OverTheCap for permission, or the feature stays local-only;
  - terms forbid it: drop it.
- Spotrac and similar sites: not considered (terms bar scraping; no feed).

### 1.3 Format problem and the fix
The current file is parquet or R-only. The build is stdlib Python and the server is dependency-free Node (DEC-001), so neither can read it.

**Fix:** a step in the GitHub data fetch (`data-fetch.yml`, or a daily `contracts.yml`) installs `pyarrow` **on GitHub's runner only**, then runs `scripts/fetch_contracts.py`. That script:
1. downloads the parquet;
2. keeps active players' current deals;
3. joins `otc_id` to `gsis_id` through `players.csv`;
4. writes a small derived file, `data/contracts/active.json`.

It follows the FantasyPros pattern: only the derived summary is committed, never the raw file. The local repository stays dependency-free, and the page and fabric read the JSON.

**Fallback:** if the job fails, the last committed file stays, labelled with its age.

### 1.4 Contract and provenance
`lib/contract.js` gains `validateContracts`:

```
{ v: 1, source: "nflverse-contracts", origin: "OverTheCap via nflverse", fetchedAt: ISO, releaseUpdatedAt: ISO,
  players: { <gsis_id>: { name, team, pos, yearSigned, years, value, apy, guaranteed, apyCapPct, otcId } },
  unresolved: [ { otcId, name, team } ] }
```

- Every figure keeps the release's update time.
- Unmatched players are listed in `unresolved`, never guessed (constitution: identity).

### 1.5 Uses
1. **Team drawer:** the quarterback room and top contracts (APY, years left, guaranteed). This is the "can they afford a veteran" context, labelled descriptive.
2. **MCP:** a `get_contracts(team?)` tool (read-only).
3. **Analyses like the Rodgers one** gain "current contract" and "years left".

No model use. Contracts say nothing about win probability without a backtest.

### 1.6 Tests
- validator negative cases;
- join coverage (fails below 95% of active players matched);
- no raw parquet columns leaking into the committed file;
- the page and fabric still work when the file is missing.

## 2. Availability, the lawful form of "health data" (F56)

### 2.1 Rules: Gate B (proposed as a DEC entry)
Health information about named people is sensitive. NFL Universe uses **only the league's public, mandated designations**:
- game status (Out, Doubtful, Questionable, IR, PUP, NFI, Suspended);
- practice participation (DNP, Limited, Full);
- the body part as listed on the official report;
- roster designations (reserve lists, designated to return).

What it does not do:
1. **No diagnoses, speculation or inference of medical conditions** beyond the listed body part. No severity guesses. No social-media or rumour health claims. Reported claims from news stay headlines with links, as now.
2. **No person-level labels like "injury-prone"** and no health "risk score" shown for a named player. Factual counts are allowed: "games missed while listed Out or on IR, 2023–2026, per official reports".
3. **Team-level aggregates are fine:** games lost to injury, starters out, snaps missed.
4. **Retention:** keep only the derived history the features use. No raw copies beyond the public nflverse files.
5. **Descriptive only** (DEC-007): nothing enters the win-probability model without a point-in-time backtest showing an out-of-sample gain (M4).

### 2.2 Sources (all public, CC-BY-4.0, already used or listed)
| Data | nflverse release | Use |
|---|---|---|
| Official injury reports, 2009–2026 | `injuries_<season>` | History of designations and practice status |
| Weekly rosters with status | `weekly_rosters` | Reserve lists (IR, PUP) week by week |
| Snap counts | `snap_counts` | Whether a listed player actually played, and how much after returning |
| Depth charts | `depth_charts` (wired) | Who starts; who replaces the injured player |

Game-day inactives remain unknown: there is no lawful free source (`FEATURE_RESEARCH.md` §17), and the page must keep saying so.

### 2.3 What gets built
1. **`scripts/build_availability.py`** (stdlib, CSV only). For each active player (by `gsis_id`) it computes:
   - weeks listed by status;
   - games missed while Out or on reserve;
   - the current status streak;
   - snap share in the 3 games after each return.

   It is computed point-in-time by week, so later backtests cannot leak. Output: `data/availability/<season>.json` (derived only).
2. **Team drawer:** "Availability" per starter: a current status chip with source and report date; a "missed N of the last M games (official reports)" line; a practice trend for this week.
3. **Team level:** starter-games lost this season, compared with the league median. Descriptive, with the method stated.
4. **MCP:** `get_availability(team | player)`.
5. **Model backtest (M4, separate):** test a starter-out adjustment by position value, point-in-time, 2021–2025 against the closing line. Adopt it only with an out-of-sample gain; otherwise record it in `scripts/evaluate.py`'s `rejected` list.

### 2.4 Tests
- point-in-time: no week uses a report dated after it;
- every count reconciles with the source rows;
- a player with no reports shows "no listings", not "healthy";
- name changes and duplicate ids are handled through the crosswalk;
- negative tests for missing and late files.

## 3. Order of work
| Step | What | Who (agent) | Depends on | Output |
|---|---|---|---|---|
| 0a | Read OverTheCap's terms; record them in the source registry; owner decision (Gate A) | researcher, then owner | none | Registry row; DEC entry |
| 0b | Owner approves the §2.1 rules (Gate B) | owner | none | DEC entry |
| 1 | Inspect the current parquet's columns in a scratch run (pyarrow in a throwaway venv or CI); confirm `otc_id` coverage in `players.csv` | data-engineer | none | Field list in this plan |
| 2 | Availability history builder + tests (no gate on contracts) | data-engineer | 0b | `data/availability/` + validator |
| 3 | Availability UI + MCP tool | frontend, ai-engineer | 2 | Team drawer section |
| 4 | Contracts fetch step in GitHub Actions + validator + crosswalk | data-engineer | 0a, 1 | `data/contracts/active.json` |
| 5 | Contracts UI + MCP tool | frontend | 4 | Team drawer section |
| 6 | Injury factor backtest (M4) | analytics | 2 | Report; adopt or reject |

Steps 2–3 can start once Gate B is decided; the contracts work waits on Gate A. Steps 2 and 4 touch different files and can run in separate worktrees.

## 4. Risks
| Risk | Mitigation |
|---|---|
| OverTheCap's terms forbid reuse | Gate A before anything is committed; drop or keep local |
| nflverse changes the contracts format again (the CSV already stopped in 2022) | Validator in the source check (`source-check.yml`); last-good file kept with its age |
| A dependency creeps into the local stack | pyarrow only on GitHub's runner; nothing local imports it |
| Identity errors (common names) | Join by id only; unresolved list; no name-only matches |
| Health data misread as medical judgment | §2.1 rules, wording reviewed, the source and report date on every status |
| Leakage in the injury backtest | Point-in-time by report date; tests |

## 5. Open questions for the owner
1. Gate A: should we read OverTheCap's terms and, if they are unclear, ask OverTheCap directly?
2. Gate B: approve the §2.1 rules as a decision?
3. Contracts on the public page, or local only until permission is clear?
