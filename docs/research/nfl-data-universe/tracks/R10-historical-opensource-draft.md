# R10 — Historical data, open-source ecosystem, academic/ML datasets, public model forecasts, college/draft/combine

Research track R10, NFL Universe. Researcher: subagent, read-only on the repository. All dates 2026-11-25 unless stated. "Read" means the page or API answer was actually fetched that day; "search snippet" means only a search engine summary was seen.

## 1. Summary

nflverse remains the only practical free historical backbone (25 release tags; rosters from 1920, play-by-play from 1999), but its CC-BY-4.0 label hides mixed provenance. Snap counts, PFR advanced stats, draft picks, combine and trades are scraped from Pro Football Reference. Sports Reference requires permission to build tools from its data or use it in AI prompting or training. Contracts are scraped from OverTheCap, whose terms bar compiling a database. Participation from 2023 and FTN charting are CC-BY-SA. Effective coverage also differs from the claims: snap counts start in 2013 (the 2012 file is empty), 2026 officials stop at week 1, both open trades files end on 2026-04-17, and participation arrives only after the Super Bowl.

FiveThirtyEight's Elo URLs now redirect to ABC News. nfelo made its model code private on 2026-11-11 under a new licence that lets its outputs be republished. nfeloqb, which the build uses, has no licence. Neil Paine's MIT-licensed Elo covers 1920–2024 and makes a clean historical seed. Massey, Sagarin and The Prediction Tracker publish no licence.

For college data, CFBD allows commercial use (free 1,000 calls a month; paid tiers $1–$30 a month) but bars redistributing its raw data. NCAA.com, NFL.com, PFR, RAS and Mockdraftable cannot be used automatically.

Recommendation, with medium-high confidence: keep nflverse as primary, but mark the PFR, OTC and ESPN tags as owner decisions. Compute Elo, SRS, opponent-adjusted EPA and RAS-like percentiles ourselves. Use Neil Paine's Elo and the nfelo outputs as benchmarks. Resolve nfeloqb's licence.

## 2. Catalog

### Part A — nflverse release data (validated asset by asset)

Method: `gh api repos/nflverse/nflverse-data/releases --paginate` listed **25 release tags and 4,367 assets** (saved locally to the scratchpad, not the repository). First season = earliest per-season asset name; "newest asset" = max `updated_at` per tag; small files (combine, draft_picks, officials, ESPN QBR, schedules, trades, snap_counts_2012) were downloaded and parsed to confirm season ranges and columns. Loader docs from `nflverse/nflreadr` `R/load_*.R` (read via `gh api`). Schedule from https://nflreadr.nflverse.com/articles/nflverse_data_schedule.html (read).

#### nflverse-data release tags (all 25)

| Tag | Assets | Newest asset `updated_at` | Seasons in asset names / parsed | Upstream (per nflreadr) | Licence of the data | Status note |
|---|---|---|---|---|---|---|
| pbp | 164 | 2026-11-25 19:12 | 1999–2026 (`.zip` only to 2021) | NFL game feed via nflfastR (`nflverse-pbp`) | CC-BY-4.0 | Nightly; pbp of 2023–2025 rewritten today too (stat-correction / model re-runs) |
| player_stats | 1,822 | **2025-05-07** | 1999–2024 | computed from pbp | CC-BY-4.0 | **Frozen/legacy**: superseded by `stats_player` (no 2025/2026 files) |
| stats_player | 554 | 2026-11-25 19:13 | 1999–2026 (week, reg, post, regpost) | computed from pbp | CC-BY-4.0 | Current player stats |
| stats_team | 554 | 2026-11-25 19:13 | 1999–2026 | computed from pbp | CC-BY-4.0 | Current team stats |
| schedules | 6 | 2026-11-25 22:36 | 1999–2026 (7,548 games) | Lee Sharpe `nfldata` games | CC-BY-4.0 tag; nfldata repo has no licence | Every 5 min in season; content identical to `nfldata/data/games.csv` except 5 `spread_line` cells (2013–2017) |
| rosters | 434 | 2026-11-25 17:59 | **1920–2026** | nflverse-rosters (old years presumably PFR — inference; `misc/pfr_rosters` exists) | CC-BY-4.0 | Daily 07:00 UTC |
| weekly_rosters | 104 | 2026-11-25 17:59 | **2002–2026** | nflverse-rosters | CC-BY-4.0 | Daily |
| players | 7 | 2026-11-25 18:30 | all-time player table | nflverse-players (NFL basis, PFR, ESPN, OTC, PFF ids) | CC-BY-4.0 | Nightly |
| players_components | 12 | 2026-11-25 17:50 | – | ditto (OTC/PFF id components) | CC-BY-4.0 | Internal building blocks |
| depth_charts | 109 | 2026-11-25 17:56 | 2001–2026 | nflverse-rosters; **source changed after 2024** | CC-BY-4.0 | 2025+ files are timestamped snapshots, ~15–25× larger (2025: 52.9 MB, 2026: 80.2 MB vs ~3.4 MB/yr before) |
| injuries | 77 | 2026-11-25 17:59 | 2009–2026 | NFL injury reports via nflverse-rosters | CC-BY-4.0 | Daily in season |
| snap_counts | 77 | 2026-11-24 12:01 | asset 2012–2026, **but `snap_counts_2012.csv` is 154 bytes = header only → real data 2013+** | **scraped from PFR** (`nflverse-pfr`, GPL-3.0 code) | CC-BY-4.0 label; PFR ToU applies upstream | 4×/day in season |
| pfr_advstats | 209 | 2026-11-25 21:11 | 2018–2026 (weekly + season pass/rush/rec/def) | **scraped from PFR** | as above | 4×/day; per-year `advstats_season_pass_2026` absent (combined file present) |
| nextgen_stats | 95 | 2026-11-25 17:44 | 2016–2024 per-year files + combined `ngs_passing/receiving/rushing` (all years incl. 2026) | NFL Next Gen Stats site (`ngs-data`) | CC-BY-4.0 label; NFL owns NGS | Nightly in season |
| ftn_charting | 21 | 2026-11-25 12:01 | 2022–2026 | FTN Data (manual charting) | **CC-BY-SA 4.0**, "FTN Data via nflverse" | 4×/day in season |
| pbp_participation | 46 | **2026-02-10** | 2016–2025 (+ `old_2023`) | NGS to 2022; **FTN from 2023** | **NGS years: credit "NFL NextGenStats via nflverse"; 2023+: CC-BY-SA 4.0 "FTN Data via nflverse"** | Not updated in season; released after the Super Bowl, so no 2026 file until ~Feb 2027 |
| espn_data (QBR) | 12 | 2026-11-25 18:55 | 2006–2026 (season and week level) | ESPN QBR | CC-BY-4.0 label; ESPN owns QBR; Disney ToU | Updated today |
| officials | 7 | 2026-09-02 | 2015–2026, **but 2026 has week 1 only (112 rows)** | NFL game data | CC-BY-4.0 | **Stale since Sept 2**: weeks 2–12 of 2026 missing. `nfldata/data/officials.csv` has 1999–2026 week 5 (last commit 2026-10-09) |
| trades | 7 | 2026-05-19 | 2002-03-04 → **2026-04-17** (4,975 rows) | "via PFR / Lee Sharpe" | CC-BY-4.0 label; PFR upstream | **Stale**: no in-season 2026 trades (deadline trades absent) |
| draft_picks | 7 | 2026-11-25 15:09 | 1980–2026 (12,927 picks) | PFR | CC-BY-4.0 label; PFR upstream | Fields include `hof`, `allpro`, `probowls`, `w_av`, `car_av`, `dr_av`, `seasons_started` |
| combine | 7 | 2026-03-12 | 2000–2026 (8,968 rows; 319 in 2026) | PFR | CC-BY-4.0 label; PFR upstream | Yearly after the combine; fields: ht, wt, forty, bench, vertical, broad_jump, cone, shuttle, draft round/pick, `pfr_id`, `cfb_id` |
| contracts | 7 | 2026-11-25 18:00 | historical, all active and past contracts | **scraped from OverTheCap pages** (`nflverse/rotc`, `httr2` request to `overthecap.com/contract-history/`) | CC-BY-4.0 label; **OTC terms bar systematic retrieval to compile a database without written consent** | Daily |
| teams | 7 | 2026-03-27 | 32 teams + historic | nflverse | CC-BY-4.0 (logo URLs point to ESPN/Wikipedia images — trademarks, see registry) | Rarely changes |
| misc | 17 | 2026-09-16 | `pfr_rosters` (2022), pbp patch ids 2022/2023, `espn_draft_player_probs` (2023), multiple-lateral yards, `data_releases` | mixed | mixed | Housekeeping |
| test | 5 | 2024-08-23 | – | – | – | Ignore |

Not in nflverse-data releases but loaded by nflreadr: `load_ff_playerids()` and `load_ff_rankings()` read **dynastyprocess/data (GPL-3.0; rankings are FantasyPros ECR)**; `load_ff_opportunity()` reads **ffverse/ffopportunity releases (repo GPL-3.0), 2006+** (read in `R/load_ffverse.R`).

### nflverse — nflverse-data (release files, overall)
- Links: https://github.com/nflverse/nflverse-data/releases · https://nflreadr.nflverse.com/reference/ · https://github.com/nflverse/nflverse-data/blob/master/LICENSE.md · https://github.com/nflverse/nflverse-data
- Category · Class: historical + current-season stats/rosters/pbp · 🔵 Public/open data (with 🔴-scraped upstream components, see per-tag table)
- Provides: play-by-play with EPA/WP/CPOE, player/team stats, rosters 1920+, weekly rosters, depth charts, injuries, snap counts, NGS, PFR advanced, FTN charting, participation, officials, trades, draft, combine, contracts, ESPN QBR, players crosswalk, schedules with lines/weather/QBs/coaches/referee
- History · Live · Latency: 1920 (rosters) / 1999 (pbp) – 2026 · no (not live) · pbp "nightly after each game day, plus some game-day updates; raw pbp usually within 15 min of a game ending" (schedule page); schedules every 5 min in season; rosters/injuries/depth daily 07:00 UTC; PFR/FTN 4×/day
- Coverage: all 32 teams, regular season and playoffs; no preseason pbp in standard files
- Technical: GitHub release assets (download URLs `github.com/nflverse/nflverse-data/releases/download/<tag>/<file>`) · CSV, CSV.GZ, Parquet, RDS (`.qs` assets stopped updating Feb–Mar 2026 — inference: format being dropped) · SDK: nflreadr (R, MIT), nflreadpy (Python, MIT, Polars) · Auth: none · Rate limits: GitHub release CDN, none published for downloads (UNVERIFIED for heavy use)
- Cost: free: all · paid: none
- Licensing: commercial: CC-BY-4.0 allows it for nflverse's own contribution, but nflreadr's README says the NFL data "belong to their respective owners, and are governed by their terms of use" · redistribution: CC-BY (FTN/participation 2023+ CC-BY-SA: share-alike on derived datasets) · caching/storage: allowed by CC licences · attribution: "nflverse" (+ "FTN Data via nflverse", "NFL NextGenStats via nflverse") · other restrictions: upstream ToU of NFL, PFR, OTC, ESPN, FTN
- Quality: high (community-audited; play-level stat corrections re-pulled Wed–Thu) · complete for 1999+ · reliability: GitHub Actions, several workflows stale (officials, trades) · notes: per-tag gaps above
- Scores: Q 9 / Cov 9 / Rel ~8 / Lat 6 / Hist 9 / Doc 9 / DX 9 / Cost 10 / Lic ~7 / Com ~5 / RL ~8 / NFL 10 = **8.2**
- Recommendation: PRIMARY — historical backbone; treat PFR-, OTC- and ESPN-derived tags as "owner decision" for anything redistributed beyond a fan page
- Verified: 2026-11-25 — every tag listed, newest asset dates, 7 files parsed, licence file read, loader docs read

### nflverse — play-by-play (`pbp`) and nflfastR models
- Links: https://github.com/nflverse/nflverse-data/releases/tag/pbp · https://nflreadr.nflverse.com/articles/dictionary_pbp.html · CC-BY-4.0 (data), nflfastR code MIT · https://github.com/nflverse/nflfastR (558★, pushed 2026-11-25, not archived)
- Category · Class: play-by-play · 🔵 Public/open data
- Provides: every play with down, distance, yard line, clock, players, EPA, WP, vegas-adjusted WP, CPOE, xYAC, success
- History · Live · Latency: 1999–2026 · no · nightly; 2026 parquet updated 2026-11-25 19:09
- Coverage: regular season + postseason; 2026 CSV 57 MB so far (~100 MB a full season)
- Technical: files · CSV/Parquet/RDS (+ ZIP ≤2021) · SDK nflreadr/nflreadpy · Auth none · RL none published
- Cost: free · paid: none
- Licensing: commercial: CC-BY-4.0 on nflverse's work; NFL owns the underlying feed · redistribution: CC-BY · caching: yes · attribution: nflverse/nflfastR · other: nflfastR code MIT
- Quality: high; known patching (`misc/pbp_patch_ids_2022/2023`)
- Scores: Q 9 / Cov 9 / Rel 8 / Lat 6 / Hist 8 / Doc 9 / DX 8 / Cost 10 / Lic ~7 / Com ~5 / RL ~8 / NFL 10 = **8.1**
- Recommendation: PRIMARY for backtests, team efficiency, EP/WP refits. **Leakage warning:** `wp`, `vegas_wp`, `ep` columns were fitted on data that includes later seasons; for an honest backtest refit by season, or use only raw play fields
- Verified: 2026-11-25 — asset list (1999–2026), sizes, loader minimum season 1999 in `R/load_pbp.R`

### nflverse — participation (`pbp_participation`)
- Links: https://github.com/nflverse/nflverse-data/releases/tag/pbp_participation · loader `R/load_participation.R` · licence: NGS-years credit / FTN-years CC-BY-SA 4.0
- Category · Class: on-field personnel per play · 🔵 Public/open data
- Provides: offense/defense players on field, formation, personnel, defenders in box, coverage (fields per dictionary)
- History · Live · Latency: 2016–2025 · no · **once a year, after the postseason** (loader doc: "provided after all post-season games are completed")
- Coverage: NGS source "died during the 2023 season" (schedule page); 2023+ from FTN (files ~2.3× larger)
- Technical: files · CSV/Parquet/RDS · Auth none
- Cost: free
- Licensing: 2016–2022 credit "NFL NextGenStats via nflverse"; 2023+ CC-BY-SA 4.0 "FTN Data via nflverse" (share-alike applies to derived data we publish)
- Quality: good; source discontinuity at 2023 (different charting provider: do not pool naively)
- Scores: Q 8 / Cov 7 / Rel 7 / Lat 2 / Hist 6 / Doc 8 / DX 8 / Cost 10 / Lic 7 / Com ~5 / RL ~8 / NFL 8 = **7.0**
- Recommendation: OPTIONAL — historical personnel analysis only; never a current-season input
- Verified: 2026-11-25 — assets 2016–2025, newest 2026-02-10; licence text in loader

### nflverse — FTN charting (`ftn_charting`)
- Links: https://github.com/nflverse/nflverse-data/releases/tag/ftn_charting · https://ftnfantasy.com/stats/sports-data · CC-BY-SA 4.0
- Category · Class: manual play charting · 🔵 Public/open data (licensed by FTN to nflverse)
- Provides: play-action, RPO, screen, motion, blitz, catchable/contested/drops, QB location etc. (subset of FTN's paid charting)
- History · Live · Latency: 2022–2026 · no · 4×/day in season; 2026 file updated 2026-11-25 12:01
- Coverage: all games; 2026 so far 4.7 MB
- Technical: files · CSV/Parquet/RDS · Auth none
- Cost: free subset; full FTN data paid (contact FTN; pricing not checked — UNVERIFIED)
- Licensing: commercial allowed by CC-BY-SA but derived datasets must be CC-BY-SA; attribution "FTN Data via nflverse"
- Quality: manual charting; high but subjective fields
- Scores: Q 8 / Cov 7 / Rel 8 / Lat 6 / Hist 3 / Doc 8 / DX 8 / Cost 10 / Lic 7 / Com 6 / RL ~8 / NFL 8 = **7.2**
- Recommendation: SECONDARY — descriptive panels; share-alike makes it awkward to mix into a proprietary dataset
- Verified: 2026-11-25 — assets 2022–2026, loader licence text

### nflverse — injuries, depth charts, rosters, weekly rosters, players
- Links: release tags `injuries`, `depth_charts`, `rosters`, `weekly_rosters`, `players` · CC-BY-4.0 · https://github.com/nflverse/nflverse-players (5★, licence NOASSERTION; README: "INTERNAL NFLVERSE PACKAGE")
- Category · Class: rosters/injuries/identity · 🔵 Public/open data
- Provides: weekly injury report status and practice participation (2009+); depth charts (2001+, timestamped from 2025); season rosters (1920+); weekly rosters (2002+); `players.csv` ids gsis, esb, nfl, pfr, pff, otc, espn, smart (header read); season/weekly rosters add sportradar, yahoo, rotowire, fantasy_data and sleeper ids (header read)
- History · Live · Latency: injuries 2009–2026; depth 2001–2026; rosters 1920–2026; weekly rosters 2002–2026 · no · daily 07:00 UTC (schedule page); assets updated 2026-11-25 ~18:00 UTC
- Coverage: all teams; pre-1999 rosters thinner (CSV ~60–300 KB/yr in 1920s–80s vs ~1 MB now)
- Technical: files · CSV/Parquet/RDS · Auth none
- Cost: free
- Licensing: CC-BY-4.0; players table includes OTC and PFF ids (ids are facts; low risk). `headshot`/`headshot_url` columns point to NFL/ESPN images — copyrighted, do not hotlink or copy
- Quality: good; nflverse-players keeps a manual overwrite file for mismatched ids
- Scores: Q 8 / Cov 9 / Rel 8 / Lat 6 / Hist 9 / Doc 8 / DX 8 / Cost 10 / Lic 8 / Com ~6 / RL ~8 / NFL 10 = **8.2**
- Recommendation: PRIMARY (already wired for depth charts and weekly rosters)
- Verified: 2026-11-25 — assets/years, README of nflverse-players

### nflverse — snap counts and PFR advanced stats (`snap_counts`, `pfr_advstats`)
- Links: release tags · code https://github.com/nflverse/nflverse-pfr (**GPL-3.0**, 10★, pushed 2026-11-01) · underlying https://www.pro-football-reference.com
- Category · Class: player usage / advanced stats · 🔵 file, but 🔴 **scraped from PFR upstream**
- Provides: offense/defense/ST snaps and %; PFR advanced passing (pressures, bad throws, drops), rushing (YBC/YAC), receiving, defense (missed tackles, pressures)
- History · Live · Latency: snaps **2013**–2026 (2012 file header-only); advstats 2018–2026 · no · 4×/day in season, depends on PFR's own update
- Coverage: all games
- Technical: files · CSV/Parquet/RDS · Auth none
- Cost: free
- Licensing: nflverse CC-BY-4.0 label, but SR's Data Use page says building sites/tools from SR data needs permission and AI use needs permission (read 2026-11-25). **Owner decision**; for commercial use, avoid or license
- Quality: good; dependent on PFR schedule
- Scores: Q 8 / Cov 8 / Rel 7 / Lat 5 / Hist 6 / Doc 8 / DX 8 / Cost 10 / Lic ~4 / Com ~2 / RL ~8 / NFL 8 = **6.8**
- Recommendation: SECONDARY (fan page, with credit to PFR and nflverse); AVOID for a commercial product without SR permission
- Verified: 2026-11-25 — assets, 2012 file content, loader docs naming PFR

### nflverse — Next Gen Stats (`nextgen_stats`)
- Links: release tag · https://nextgenstats.nfl.com · code https://github.com/nflverse/ngs-data (MIT, 25★)
- Category · Class: tracking-derived aggregates · 🔵 file of 🟠 NFL site data
- Provides: weekly/season passing (time to throw, aggressiveness, CPOE), rushing (RYOE, efficiency), receiving (separation, cushion)
- History · Live · Latency: 2016–2026 · no · nightly 3–5 am ET in season
- Coverage: qualifying players only (thresholds)
- Technical: files · CSV/Parquet/RDS · Auth none
- Cost: free
- Licensing: NFL owns NGS; NFL.com terms apply upstream (not re-read in this track; see R-track on NFL official sources) · attribution nflverse + NGS
- Quality: high (official tracking) but thresholded
- Scores: Q 9 / Cov 6 / Rel 8 / Lat 6 / Hist 6 / Doc 8 / DX 8 / Cost 10 / Lic ~5 / Com ~3 / RL ~8 / NFL 8 = **7.1**
- Recommendation: SECONDARY — descriptive; owner decision for redistribution
- Verified: 2026-11-25 — assets

### nflverse — officials, trades, ESPN QBR, contracts, teams
- Links: release tags `officials`, `trades`, `espn_data`, `contracts`, `teams`; code https://github.com/nflverse/rotc (MIT, 0★) · OTC terms https://overthecap.com/terms-and-conditions
- Category · Class: reference / context · 🔵 files with 🔴 scraped upstream (trades from PFR, contracts from OTC pages, QBR from ESPN)
- Provides: officials per game (2015+); trades (2002+); QBR season/week (2006+); contracts (historical); team colours
- History · Live · Latency: officials 2015–2026 **week 1 only**; trades to 2026-04-17; QBR 2006–2026 (updated today); contracts updated today
- Technical: files · CSV/Parquet/RDS · Auth none
- Cost: free
- Licensing: **OTC terms (read 2026-11-25): content "solely for your own individual use"; "systematic retrieval … to create or compile any database" prohibited without written consent; licences via support@overthecap.com.** QBR is ESPN's proprietary metric (Disney ToU). Trades credit PFR
- Quality: officials/trades stale this season; QBR and contracts current
- Scores: Q 7 / Cov 6 / Rel 5 / Lat 4 / Hist 7 / Doc 7 / DX 8 / Cost 10 / Lic ~3 / Com ~2 / RL ~8 / NFL 7 = **6.2**
- Recommendation: OPTIONAL; contracts and QBR AVOID for redistribution without the owner accepting the risk; officials: use `nfldata/data/officials.csv` (fresher) or ESPN game summary
- Verified: 2026-11-25 — parsed officials, trades and QBR files; read rotc source and OTC terms

### nflverse — schedules (`schedules` tag) and `nflverse/nfldata` data files
- Links: https://github.com/nflverse/nfldata (381★, **no licence**, pushed 2026-11-25) · https://github.com/nflverse/nfldata/blob/master/DATASETS.md
- Category · Class: schedules, results, lines, standings · 🔵 Public/open data (unlicensed repo)
- Provides (files in `data/`, checked one by one): `games.csv` (1999–2026, lines, moneylines, roof, surface, temp, wind, rest, QBs, coaches, referee, stadium); `standings.csv` and `weekly_standings.csv` (2002–2026, updated 2026-11-24/25, include SOV and SOS); `officials.csv` (1999–2026 wk 5, last commit 2026-10-09); `draft_picks.csv`; `draft_values.csv` (Stuart/Johnson/Hill/OTC/PFF charts, 2021); `trades.csv`; `rosters.csv`; `teams.csv`; `predictions.csv` (a community pick'em contest, 31,207 rows, updated 2026-11-24); **frozen**: `closing_lines.csv` (2006–2018, last commit 2019-11-15), `initial_lines.csv` (2021 only), `sc_lines.csv` (2013–2020), `win_totals.csv` (2003–2020)
- History · Live · Latency: 1999–2026 · no · games/standings daily (commits today); schedules release every 5 min in season
- Coverage: all games; spread/total one line per game, source and timing undocumented (DATASETS.md still says games "begins with the 2006 NFL season" — outdated, file starts 1999)
- Technical: raw GitHub CSV/RDS · Auth none
- Cost: free
- Licensing: **no licence file** (facts; credit Lee Sharpe/nflverse); `nflverse-data` `schedules` tag republishes the same data under the CC-BY-4.0 repo licence — inference: prefer the release URL for a cleaner licence trail
- Quality: high, community-standard; frozen line files must not be mistaken for current
- Scores: Q 8 / Cov 8 / Rel 8 / Lat 7 / Hist 8 / Doc 7 / DX 9 / Cost 10 / Lic ~6 / Com ~5 / RL ~8 / NFL 10 = **7.8**
- Recommendation: PRIMARY (already used); switch to `releases/download/schedules/games.csv` as the canonical URL with nfldata raw as fallback (identical content today)
- Verified: 2026-11-25 — compared both files cell by cell (7,548 rows each; 5 cells differ, all `spread_line` 2013–2017); per-file last-commit dates via `gh api .../commits?path=`

### nflverse — nflreadpy / nflreadr (clients)
- Links: https://github.com/nflverse/nflreadpy (MIT, 253★, v0.1.5 2025-11-19, pushed 2026-10-30) · https://github.com/nflverse/nflreadr (MIT + file, 117★, v1.5.1.9002)
- Category · Class: client libraries · 🔵
- Provides: loaders for every dataset above, caching (env `NFLREADPY_CACHE`, `…_DURATION`), dictionaries
- Technical: Python (Polars) / R · not usable inside the stdlib build, but URLs and dictionaries are the reference
- Licensing: MIT (code may be adapted with notice)
- Scores: Q 9 / Cov 9 / Rel 8 / Lat – (n/a, use 6) / Hist 9 / Doc 9 / DX 8 / Cost 10 / Lic 10 / Com 9 / RL 8 / NFL 10 = **8.8**
- Recommendation: SECONDARY (reference; Python analysis outside the build). `nfl_data_py` archived 2025-09-25 — AVOID
- Verified: 2026-11-25 — `gh api` metadata, README

### Part B — Reference sites, historical datasets and public model forecasts

### Sports Reference — Pro Football Reference (PFR) website
- Links: https://www.pro-football-reference.com · terms: https://www.sports-reference.com/data_use.html (read), https://www.sports-reference.com/bot-traffic.html (read); Site Terms of Use clause 5 (not fetched: 2-request cap on SR sites)
- Category · Class: historical reference (all eras) · 🟠 Unofficial but commonly used as a website; 🔴 Scraping if automated
- Provides: season/team/player stats, box scores with game info, per-team "Vegas Lines" pages (search results show pages back to 1968; totals shown as 0.0 in 1968–69), Approximate Value (AV, "since 1960" per PFR's AV page — search snippet), unofficial snap counts from 2012 (PFR FAQ — search snippet), starting lineups/participation back to 1920 (PFR FAQ — search snippet), play-by-play back to 1978 (PFR blog, Aug 2025 — search snippet), officials, draft (all years), combine, awards, Hall of Fame, SRS
- History · Live · Latency: 1920–2026 · no · same-day after games (UNVERIFIED cadence)
- Coverage: every NFL season since 1920 (plus AFL/AAFC); best single historical reference
- Technical: HTML pages only; **no API** ("not our business model", bot-traffic page) · Auth none · **Rate limit: more than 20 requests a minute on PFR (10 on FBref/Stathead) puts a session "in jail" for up to a day** (bot-traffic page, published 2022-10-26, updated 2024-05-29)
- Cost: free website · paid: Stathead Football $9/month or $80/year per sport (SR FAQ, search snippet only, not fetched); custom data only with a **$5,000 minimum** commitment (data_use page, read)
- Licensing: commercial: no licence offered; data_use page says much of the data comes from third parties whose licences "prevent offering it as a download"; building websites/tools from scraped data needs permission; a database that competes with or substitutes for SR is prohibited; **using SR material to train, fine-tune, prompt or instruct AI models needs permission** · redistribution: barred en masse · caching/storage: not granted · attribution: n/a · other: facts themselves "cannot be copyrighted" (data_use page), so citing individual facts with a link is fine
- Quality: excellent, curated; the reference other datasets reconcile to
- Scores: Q 9 / Cov 10 / Rel 8 / Lat 6 / Hist 10 / Doc 7 / DX 2 / Cost 7 / Lic 2 / Com 1 / RL 2 / NFL 10 = **6.2**
- Recommendation: OPTIONAL as a human-checked reference and outbound link; **AVOID automated collection and AVOID feeding PFR material into the AI assistant without written permission** (the AI clause covers "prompting")
- Verified: 2026-11-25 — bot-traffic and data_use pages read (2 requests, the cap); price and coverage years from search snippets only

### Sports Reference — Stathead Football
- Links: https://www.sports-reference.com/stathead/ (search snippet) · terms as PFR
- Category · Class: query tool over PFR database · 🟡 Licensed/commercial (consumer subscription)
- Provides: player/team game and season finders, splits, streaks, play finder
- History · Live · Latency: as PFR · no · –
- Technical: web UI, no API; 10 requests/minute limit (bot-traffic page)
- Cost: paid: $9/month or $80/year single sport; one-month free trial (search snippet of SR FAQ/Stathead page; not fetched)
- Licensing: personal research use; no data export licence for products (inference from data_use page)
- Scores: Q 9 / Cov 10 / Rel 8 / Lat 6 / Hist 10 / Doc 7 / DX 3 / Cost 5 / Lic 2 / Com 1 / RL 2 / NFL 9 = **6.0**
- Recommendation: OPTIONAL — owner's personal research tool only; never a pipeline input
- Verified: UNVERIFIED (pricing from search snippet; not fetched due to the SR request cap)

### spreadspoke (Toby Crabtree) — "NFL scores and betting data" (Kaggle)
- Links: https://www.kaggle.com/datasets/tobycrabtree/nfl-scores-and-betting-data · metadata API `kaggle.com/api/v1/datasets/view/tobycrabtree/nfl-scores-and-betting-data` (read, no auth) · licence CC BY-NC-SA 4.0
- Category · Class: historical scores + closing lines + weather · 🔵 Public/open data (non-commercial)
- Provides: game results since 1966, favourite and spread/total since 1979, stadium, weather (NOAA), per the dataset description
- History · Live · Latency: 1966–2025 · no · yearly; version 82 "NFL 2025 Season Final Update", lastUpdated 2026-02-11
- Coverage: regular season + playoffs; betting data 1978–2013 from repole.com sun4cast, 2014–2024 from sportsline.com and aussportsbetting.com (description) — mixed books, single line, timing not stated
- Technical: Kaggle download (account needed for the official download route; not created) · CSV (1.6 MB) · Auth: Kaggle account · RL n/a
- Cost: free
- Licensing: **commercial: NO (NC)** · redistribution: share-alike, non-commercial · attribution required · other: upstream PFR/ESPN content
- Quality: widely used, decent; mixed-source lines, team-name normalisation needed
- Scores: Q 6 / Cov 7 / Rel 6 / Lat 2 / Hist 9 / Doc 6 / DX 6 / Cost 10 / Lic 4 / Com 1 / RL ~7 / NFL 8 = **6.0**
- Recommendation: OPTIONAL — longest free line history for a non-commercial backtest (1979+); cross-check against nflverse lines (1999+); AVOID for a commercial product
- Verified: 2026-11-25 — Kaggle metadata JSON (licence, lastUpdated, version notes, description)

### Max Horowitz — "Detailed NFL Play-by-Play Data 2009–2018" (Kaggle)
- Links: https://www.kaggle.com/datasets/maxhorowitz/nflplaybyplay2009to2016 · licence "Unknown" (Kaggle metadata)
- Category · Class: historical pbp (nflscrapR) · 🔵 (unlicensed)
- Provides: regular-season plays 2009–2018 with nflscrapR EP/WP
- History · Live · Latency: 2009–2018 · no · frozen (lastUpdated 2018-12-22)
- Technical: Kaggle · CSV, 1.22 GB · Auth Kaggle account
- Cost: free · Licensing: unknown → reference only
- Quality: superseded by nflverse pbp (1999+, same lineage, maintained)
- Scores: Q 6 / Cov 5 / Rel 5 / Lat 1 / Hist 5 / Doc 6 / DX 4 / Cost 10 / Lic 2 / Com 1 / RL ~7 / NFL 6 = **4.8**
- Recommendation: AVOID — use nflverse pbp
- Verified: 2026-11-25 — Kaggle metadata JSON

### NFL Football Operations — Big Data Bowl data
- Links: https://operations.nfl.com/gameday/analytics/big-data-bowl (search) · https://github.com/nfl-football-ops/Big-Data-Bowl (155★, no licence, last push 2019-04-29) · 2027 edition: https://www.sportsvideo.org/2026/10/08/nfl-announces-ninth-annual-big-data-bowl-powered-by-aws/ (read)
- Category · Class: player tracking samples · 🟢 Official (competition-licensed)
- Provides: NGS tracking for sampled weeks/plays (each year different), plus PFF scouting fields in some years; 2027 edition: combine player-tracking 2023–2025 plus in-game data for the same players, five position groups (sportsvideo.org, 2026-10-08)
- History · Live · Latency: samples only, 2017– · no · yearly competition
- Technical: Kaggle competition download (account and rules acceptance required; not done) · CSV
- Cost: free to entrants
- Licensing: governed by Kaggle competition rules — **UNVERIFIED** (Kaggle competitions API answered 401 without login; operations.nfl.com terms URL 404). Treat as competition-use only
- Scores: Q 10 / Cov 2 / Rel 6 / Lat 1 / Hist 3 / Doc 8 / DX 5 / Cost 9 / Lic ~2 / Com ~1 / RL ~6 / NFL 7 = **5.0**
- Recommendation: AVOID as a product source; reference for research only
- Verified: 2026-11-25 — GitHub repos inspected; 2027 announcement read; rules UNVERIFIED

### FiveThirtyEight — NFL Elo (`nfl_elo.csv`) — DISCONTINUED
- Links: https://github.com/fivethirtyeight/data/tree/master/nfl-elo (CC-BY-4.0, repo last push 2025-02-25) · https://github.com/fivethirtyeight/nfl-elo-game (MIT, 355★, last push 2023-05-02) · mirror https://datahub.io/fivethirtyeight/nfl-elo
- Category · Class: public model ratings and forecasts · ⚫ Experimental/unstable (dead upstream)
- Provides: game-by-game Elo and QB-adjusted Elo, win probabilities, 1920–(last 538 season)
- History · Live · Latency: 1920–2022/23 in the original; **original URLs `projects.fivethirtyeight.com/nfl-api/nfl_elo.csv` and `_latest.csv` now 302 → abcnews.go.com/politics (probed 2026-11-25)**; GitHub `nfl-elo-game/data/nfl_games.csv` ends 2021-02-07; datahub mirror ends at the 2017 season (Super Bowl LII), Elo columns only, `Last-Modified 2026-03-12`
- Coverage: complete history but frozen
- Technical: CSV · Auth none
- Cost: free
- Licensing: fivethirtyeight/data is CC-BY-4.0; nfl-elo-game MIT; datahub copy lists no licence
- Quality: good historical baseline; shutdown March 5, 2025 (Wikipedia via search); archive access removed ~May 2026 (search snippet, lawyersgunsmoneyblog.com)
- Scores: Q 7 / Cov 6 / Rel 1 / Lat 1 / Hist 9 / Doc 7 / DX 6 / Cost 10 / Lic 9 / Com 8 / RL 8 / NFL 7 = **6.6**
- Recommendation: AVOID for current use; OPTIONAL as a historical benchmark (MIT file to 2020 season)
- Verified: 2026-11-25 — `gh api` (repos, README, commits), curl of the dead URLs, datahub headers and last rows

### nfelo (Robby Greer) — model outputs (`greerreNFL/nfelo/output_data`)
- Links: https://www.nfeloapp.com · https://github.com/greerreNFL/nfelo (66★, pushed 2026-11-25) · https://github.com/greerreNFL/nfelo/blob/main/LICENSE (custom, added 2026-11-11)
- Category · Class: public model ratings/forecasts · 🟠 Unofficial but commonly used
- Provides: `nfelo_games.csv` (4,809 games 2009 → 2026 wk 12: nfelo ratings, open/close model lines, cover probabilities, EV, **plus market open/close lines and prices**); `historic_projected_spreads.csv` (**append-only ledger of weekly pre-game projections, 2021 →, with model version** — usable for leak-free model-vs-model comparison); `elo_snapshot.csv`; `prediction_tracker.csv` (current week)
- History · Live · Latency: 2009–2026 · no · weekly in season (commit today)
- Technical: raw GitHub CSV · Auth none
- Cost: free
- Licensing: **licence (read 2026-11-25): you may "read, quote, reference, analyze, and republish" the original nfelo outputs; no right to run, import or modify the code; third-party columns (e.g. market lines) "remain under their own licenses"**. Credit is not formally required for outputs, but is good practice. **Changed 2026-11-11: model source moved private; repository is now a fetch client plus outputs (README, CHANGELOG)**
- Quality: well-calibrated public model; transparent versioning
- Scores: Q 8 / Cov 7 / Rel 7 / Lat 6 / Hist 6 / Doc 7 / DX 8 / Cost 10 / Lic 6 / Com ~5 / RL 8 / NFL 9 = **7.2**
- Recommendation: SECONDARY — model-vs-model comparison panel and benchmark; do not reuse its market columns as our own line history
- Verified: 2026-11-25 — LICENSE, README, CHANGELOG, two output files parsed

### nfeloqb — QB Elo values (`greerreNFL/nfeloqb/qb_elos.csv`)
- Links: https://github.com/greerreNFL/nfeloqb (17★, **no licence file**, pushed 2026-11-25)
- Category · Class: QB value model output · 🟠
- Provides: weekly QB values in 538's QB-Elo format; 538's original model up to 2023, nfeloqb model from 2023 (README)
- History · Live · Latency: 538-era history → 2026 · no · "updated every Tuesday and Thursday morning" in season (README)
- Technical: raw CSV (6.6 MB) · Auth none
- Licensing: **no licence**; nfelo's LICENSE covers only "files in output_data/ published here" (i.e. the nfelo repo), not nfeloqb → default all rights reserved
- Scores: Q 7 / Cov 7 / Rel 7 / Lat 6 / Hist 7 / Doc 6 / DX 8 / Cost 10 / Lic 2 / Com 1 / RL 8 / NFL 8 = **6.4**
- Recommendation: SECONDARY (already used by the build) — **owner decision: ask the author for permission or rely on nfelo's licensed outputs**; contradiction with the registry noted in §7
- Verified: 2026-11-25 — repo contents, README, licence absence

### Neil Paine — NFL Elo ratings (GitHub CSV)
- Links: https://github.com/Neil-Paine-1/NFL-elo-ratings · licence MIT (`LICENSE.txt`)
- Category · Class: historical model ratings (538 method continued) · 🔵 Public/open data
- Provides: every game from 1920-09-26 to Super Bowl LIX (2025-02-09), one row per team per game: score, `elo1_pre/post`, `elo_prob1`, playoff round, neutral flag, game number
- History · Live · Latency: 1920–2024 · no · **not updated since 2025-02-10** (no 2025 or 2026 rows)
- Technical: raw CSV (4.1 MB) · Auth none
- Cost: free · Licensing: MIT — commercial use, redistribution and storage allowed with the notice
- Quality: consistent with 538's Elo (same 1920 opening rows as the datahub mirror); stale
- Scores: Q 7 / Cov 6 / Rel 4 / Lat 1 / Hist 10 / Doc 3 / DX 8 / Cost 10 / Lic 10 / Com 9 / RL 8 / NFL 7 = **6.9**
- Recommendation: OPTIONAL — best licensed long-history Elo seed and benchmark; extend forward with our own Elo (§5)
- Verified: 2026-11-25 — repo contents, commits, first and last rows

### Todd Beck — The Prediction Tracker
- Links: https://www.thepredictiontracker.com · NFL results https://www.thepredictiontracker.com/nflresults.php · CSV https://www.thepredictiontracker.com/nflpredictions.csv · robots https://www.thepredictiontracker.com/robots.txt
- Category · Class: aggregated computer-model predictions and accuracy · 🟠 Unofficial
- Provides: current-week predicted margins from 50+ systems (CSV columns include `lineopen`, `line`, `linesag`, `linemass`, `lineelo`, `linenfelo`, `lineespn`, `linemidweek`, `lineavg`, `linemedian`, `linestd`…); season accuracy tables (pct correct, ATS, absolute error, bias, MSE) for 2000–2026
- History · Live · Latency: results pages 2000–2026 · no · CSV `Last-Modified 2026-11-25 20:06 GMT`; results "through 2026-11-24"
- Technical: HTML + one CSV (7 KB) · Auth none
- Cost: free (ad-supported)
- Licensing: no terms page found; footer "Copyright © 2007-2024 Todd Beck"; robots.txt `Content-Signal: search=yes,ai-train=no,use=reference` and blocks ClaudeBot/anthropic-ai and other AI crawlers. **Not licensed for republication** → owner decision / ask the author
- Quality: unique consensus-of-models view; individual systems opaque
- Scores: Q 6 / Cov 6 / Rel 6 / Lat 6 / Hist 7 / Doc 3 / DX 6 / Cost 10 / Lic 2 / Com 1 / RL ~6 / NFL 7 = **5.5**
- Recommendation: OPTIONAL — link out, or ask permission to show the consensus spread; useful to benchmark our model's MSE against the published table
- Verified: 2026-11-25 — home, results page, CSV header, robots.txt

### Jeff Sagarin — NFL ratings
- Links: http://sagarin.com/sports/nflsend.htm (https fails; http answered 200)
- Category · Class: computer ratings · 🟠
- Provides: team rating, predictor, golden mean, recent, schedule strength; division averages
- History · Live · Latency: current season page ("NFL 2026 Ratings through results of 2026 NOVEMBER 23"); `Last-Modified 2026-11-24` · weekly
- Licensing: "All Contents Copyright © 2026 Jeff Sagarin. All Rights Reserved."; page says ratings "are no longer updated on the USA Today website" (usatoday.com Sagarin URL answered 402)
- Scores: Q 7 / Cov 5 / Rel 6 / Lat 6 / Hist 2 / Doc 3 / DX 3 / Cost 10 / Lic 1 / Com 1 / RL ~5 / NFL 6 = **4.6**
- Recommendation: AVOID republication; link only. Sagarin's line also appears in The Prediction Tracker CSV
- Verified: 2026-11-25 — page fetched, header date

### Kenneth Massey — Massey Ratings
- Links: https://masseyratings.com (403 to a plain curl — Cloudflare-style block; not bypassed) · https://masseyratings.com/scorehelp.htm (search snippet)
- Category · Class: computer ratings, composite, score files · 🟠
- Provides: NFL ratings, composite of many systems, historical score files "intended for use with computer databases" (scorehelp, snippet)
- Licensing: informal: users asked to "reference MasseyRatings.com" (snippet); no formal licence found
- Scores: Q 7 / Cov 6 / Rel 5 / Lat 6 / Hist 7 / Doc 4 / DX 3 / Cost 10 / Lic ~3 / Com ~1 / RL 2 / NFL 6 = **5.0**
- Recommendation: AVOID automated use (blocks bots); link only
- Verified: UNVERIFIED — 403 on probe; terms from search snippet only

### FTN — DVOA (ex-Football Outsiders)
- Links: https://ftnfantasy.com/nfl/tools/team-total-dvoa (search result) · Football Outsiders closed 2023-09-01, DVOA moved to FTN (Wikipedia via search)
- Category · Class: proprietary efficiency ratings · 🟡 Licensed/commercial
- Provides: team/player DVOA, DAVE; historical archive extended back to 1979–1981 per FTN articles (search snippets)
- Cost: FTN Stats+ subscription — price UNVERIFIED
- Licensing: proprietary; no redistribution
- Scores: Q 8 / Cov 7 / Rel 7 / Lat 6 / Hist 8 / Doc 6 / DX 3 / Cost 4 / Lic 1 / Com 1 / RL ~4 / NFL 8 = **5.2**
- Recommendation: AVOID as data; compute our own EPA-based opponent-adjusted efficiency from nflverse pbp instead
- Verified: UNVERIFIED (search snippets only)

### ESPN — FPI and QBR
- Links: espn.com/nfl/fpi (not fetched) · QBR via nflverse `espn_data` (2006–2026) · Disney ToU (see registry)
- Category · Class: proprietary model outputs · 🔴 when scraped / local-only class
- Provides: FPI team ratings and season projections; QBR
- Licensing: Disney ToU bar automated access and dataset building (registry, Nov. 21)
- Scores: Q 8 / Cov 8 / Rel 7 / Lat 7 / Hist 6 / Doc 3 / DX 5 / Cost 10 / Lic 1 / Com 1 / RL ~5 / NFL 8 = **5.8**
- Recommendation: AVOID republication (local-only comparison at most, owner decision as for other ESPN endpoints)
- Verified: QBR file parsed 2026-11-25; FPI UNVERIFIED (not probed)

### PFR SRS (Simple Rating System) — compute, don't copy
- Links: PFR team pages (not fetched)
- Recommendation: OPTIONAL — SRS = margin of victory adjusted for schedule; reproducible exactly from nflverse scores (see §5), so no need to take PFR's numbers
- Verified: method well known; PFR values not fetched

### Part C — GitHub sweep (repos not already in docs/GITHUB_RESEARCH.md or FEATURE_RESEARCH.md §5)

Method: 21 queries × 2 sorts via `gh search repos` (888 rows, 754 unique repos; plus topic searches `topic:nfl`, `topic:nflverse`, `topic:american-football`, `topic:fantasy-football`, `topic:college-football`, "nfl draft", "nfl combine", "college football data", "nfl elo", "nfl win probability"). Repos already in the project's docs were excluded. Each repo below was opened with `gh api repos/OWNER/REPO` (licence, stars, push date, archived) and its README read on 2026-11-25. Most hits were soccer, student projects or abandoned scrapers; only the useful or warning-worthy ones are listed. Reuse key as in the project docs: **Data / Ref / Code / Avoid**. Class emoji is for what the repo *touches upstream*.

| Repo | Licence | ★ / last push / archived | What it is · upstream source | Class | Reuse |
|---|---|---|---|---|---|
| [Neil-Paine-1/NFL-elo-ratings](https://github.com/Neil-Paine-1/NFL-elo-ratings) | MIT | 8 / 2025-02-10 / no | 538-style Elo by a former 538 writer: one CSV, every game 1920-09-26 → Super Bowl LIX (2025-02-09), both team perspectives, pre/post Elo and win prob. Not updated for 2025 or 2026 | 🔵 | **Data** (historical Elo benchmark, MIT) |
| [fivethirtyeight/nfl-elo-game](https://github.com/fivethirtyeight/nfl-elo-game) | MIT | 355 / 2023-05-02 / no | 538's Elo game data 1920 → 2021-02-07 + Python Elo code | 🔵 | Data (frozen) / Code |
| [sportsdataverse/sportsdataverse-py](https://github.com/sportsdataverse/sportsdataverse-py) | MIT | 132 / 2026-11-25 / no | Polars-first loaders for 100+ leagues, mostly ESPN and NGS JSON | 🔴 (ESPN upstream) | Ref |
| [sportsdataverse/sportsdataverse-data](https://github.com/sportsdataverse/sportsdataverse-data) | MIT | 15 / 2026-11-21 (assets updated 2026-11-25) / no | **388 release tags**: `espn_nfl_*` (pbp, drives, injuries, depth charts, player box, 30+ "adv" tables), `nfl_ngs_*` (incl. `nfl_ngs_highlight_tracking`), `cfbfastR_cfb_pbp`, `espn_cfb_*`, `cfb_*` | 🔴 ESPN / NFL upstream under an MIT repo | Avoid for redistribution; Ref for schemas |
| [sportsdataverse/cfbfastR](https://github.com/sportsdataverse/cfbfastR) | MIT + file (DESCRIPTION v3.1.0) | 114 / 2026-11-25 / no | College pbp with EPA/WPA: CFBD-sourced 2014+, ESPN-derived 2004+, stats.ncaa.org 2013+ (loader docs) | 🟠/🔴 | Ref; data via CFBD key preferred |
| [sportsdataverse/recruitR](https://github.com/sportsdataverse/recruitR) | NOASSERTION | 21 / 2026-11-25 / no | CFBD recruiting/roster wrapper | 🟠 | Ref |
| [CFBD/cfbd-python](https://github.com/CFBD/cfbd-python) | none in repo | 222 / 2026-11-14 / no | Official CFBD OpenAPI client (API 5.33.3) | 🟢 for CFBD | Ref |
| [henrygd/ncaa-api](https://github.com/henrygd/ncaa-api) | MIT | 275 / 2026-10-06 / no | Unofficial JSON proxy of ncaa.com pages (scores, stats, pbp); public demo limited to 3 req/s/IP | 🔴 (NCAA.com ToS: no commercial use, no redistribution) | Avoid |
| [roclark/sportsipy](https://github.com/roclark/sportsipy) | MIT | 580 / 2025-01-31 / no | Sports Reference scraper; README: "no longer undergoing active development" | 🔴 | Avoid |
| [blnkpagelabs/nflscraPy](https://github.com/blnkpagelabs/nflscraPy) | MIT | 41 / 2023-10-31 / no | PFR scraper (sleeps 3.5–5.5 s; warns PFR/Cloudflare will suspend access) | 🔴 | Avoid |
| [thadhutch/sports-quant](https://github.com/thadhutch/sports-quant) | MIT | 26 / 2026-03-19 / no | Scrapes PFF grades and PFR game data | 🔴 (PFF paid content) | Avoid |
| [BurntSushi/nfldb](https://github.com/BurntSushi/nfldb) | Unlicense | 1,078 / 2021-01-26 / no | "THIS PROJECT IS UNMAINTAINED"; NFL.com GameCenter JSON feed | ⚫ | Avoid |
| [maksimhorowitz/nflscrapR](https://github.com/maksimhorowitz/nflscrapR) | none | 558 / 2020-04-03 / no | Original NFL API pbp scraper (2009+) | ⚫ | Avoid (superseded by nflfastR) |
| [ryurko/nflscrapR-models](https://github.com/ryurko/nflscrapR-models) | none | 40 / 2018-09-18 / no | EP, FG and WP model code incl. **leave-one-season-out calibration** | 🔵 | Ref (method) |
| [ryurko/nflWAR](https://github.com/ryurko/nflWAR) | none | 37 / 2018-09-18 / no | WAR for offensive players (arXiv 1802.00998) | 🔵 | Ref |
| [FantasyFootballAnalytics/ffanalytics](https://github.com/FantasyFootballAnalytics/ffanalytics) | none | 192 / 2026-09-09 / no | Scrapes projections from CBS, ESPN, NFL, FantasyPros etc. with 2-s waits | 🔴 | Avoid (method Ref for averaging projections) |
| [FantasyFootballAnalytics/FantasyFootballAnalyticsR](https://github.com/FantasyFootballAnalytics/FantasyFootballAnalyticsR) | none | 511 / 2026-05-15 / no | Projection/optimisation scripts | 🟠 | Ref |
| [mkreiser/ESPN-Fantasy-Football-API](https://github.com/mkreiser/ESPN-Fantasy-Football-API) | LGPL-3.0 | 356 / 2025-01-04 / no | JS client for ESPN fantasy v3 (league data; notes ESPN deleted pre-2017 league data) | 🔴 | Avoid (league access out of scope) |
| [uberfastman/yfpy](https://github.com/uberfastman/yfpy) | GPL-3.0 | 271 / 2026-04-21 / no | Wrapper for Yahoo Fantasy Sports API (OAuth) | 🟢 Yahoo API | Ref only (GPL) |
| [derekrbreese/fantasy-football-mcp-public](https://github.com/derekrbreese/fantasy-football-mcp-public) | MIT | 94 / 2026-11-25 / no | Yahoo fantasy MCP server; README: Yahoo API access "now requires manual approval" and is read-only | 🟢 | Ref (MCP design) |
| [hvpkod/NFL-Data](https://github.com/hvpkod/NFL-Data) | MIT (code) | 108 / 2026-01-13 / no | Weekly stats/projections extracted from Fantasy.NFL.com, 2015+ | 🔴 (NFL ToU §1.3) | Avoid |
| [jthomasmock/espnscrapeR](https://github.com/jthomasmock/espnscrapeR) | NOASSERTION | 51 / 2024-02-05 / no | ESPN QBR/standings scraper | 🔴 | Avoid |
| [mrcaseb/nfl-data](https://github.com/mrcaseb/nfl-data) | none | 47 / 2026-09-08 / no | Old NGS host; moved to nflverse/ngs-data | ⚫ | Avoid |
| [rmcurtis43/combineR](https://github.com/rmcurtis43/combineR) | NOASSERTION | 13 / 2022-04-26 / no | Combine 2000+ from PFR; draft 1936+ from drafthistory.com | 🔴 | Avoid (use nflverse combine/draft) |
| [tanho63/nfl_combine](https://github.com/tanho63/nfl_combine) | none | 5 / 2026-03-02 / no | NFL.com draft profiles and grades 2008–2025 (mostly Lance Zierlein) + NGS grades | 🔴 copyrighted scouting text | **Avoid** |
| [bcongelio/nfl-analytics-with-r-book](https://github.com/bcongelio/nfl-analytics-with-r-book) | CC0-1.0 | 80 / 2025-02-12 / no | Book source (CRC Press) on nflverse analytics | 🔵 | Ref / Code (CC0) |
| [isaactpetersen/Fantasy-Football-Analytics-Textbook](https://github.com/isaactpetersen/Fantasy-Football-Analytics-Textbook) | CC-BY-4.0 | 20 / 2026-11-18 / no | Open textbook (projection, aggregation, evaluation) | 🔵 | Ref (cite) |
| [JovaniPink/awesome-nfl-data](https://github.com/JovaniPink/awesome-nfl-data) | NOASSERTION | 4 / 2026-11-25 / no | Curated source list with a machine-readable index (`catalog/resources.v1.json`), "Last reviewed: August 2026" | – | Ref (cross-check our registry) |
| [pseudo-r/Public-NFL-API](https://github.com/pseudo-r/Public-NFL-API) | none | 4 / 2026-09-30 / no | Endpoint docs for NFL.com and ESPN; Sept 2026 audit; says "Public" means reachable, not permitted | 🔴 | Ref only |
| [stylo-stack/ESPN-API-Documentation](https://github.com/stylo-stack/ESPN-API-Documentation) | none | 27 / 2025-09-06 / no | ESPN NFL endpoint list | 🔴 | Ref only |
| [UnravelSports/unravelsports](https://github.com/UnravelSports/unravelsports) | MPL-2.0 | 250 / 2026-01-16 / no | Tracking data → Polars; graph-neural-network pipeline that supports American football (BDB format) | 🔵 | Ref |
| [nflverse/NFLData.jl](https://github.com/nflverse/NFLData.jl) | MIT | 6 / 2026-08-31 / no | Julia nflreadr port | 🔵 | Ref |
| [clausherther/nfl-dbt](https://github.com/clausherther/nfl-dbt) | Apache-2.0 | 24 / 2023-12-26 / no | dbt models over nflverse pbp; removes duplicate plays | 🔵 | Code (with notice) |
| [dgrifka/nfl_simulator](https://github.com/dgrifka/nfl_simulator) | MIT | 6 / 2026-11-24 / no | "Deserve-to-win" from success rate and yards/play, weights fit 2016–2023, 40,000 draws | 🔵 | Ref / Code |
| [jackc625/nfl-predict](https://github.com/jackc625/nfl-predict) | MIT | 2 / 2026-11-24 / no | Walk-forward pre-game models with a **fixed information lock (6 PM ET day before)** and pre-registered evaluation | 🔵 | Ref (leakage design) |
| [roni-altshuler/nfl_predictor](https://github.com/roni-altshuler/nfl_predictor) | none | 1 / 2026-11-24 / no | Calibrated forecasts scored against the closing line; key-number lattice, 6,499 games 2002–2025 | 🔵 | Ref only (no licence) |
| [MaddocksJ27/NFL-Market-Efficiency](https://github.com/MaddocksJ27/NFL-Market-Efficiency) | none | 2 / 2026-09-08 / no | Out-of-sample study: 3-day line drift not forecastable (R²≈0, 804 games); props priced at the median | 🔵 | Ref (findings) |
| [cbratkovics/fantasy-football-ai](https://github.com/cbratkovics/fantasy-football-ai) | MIT | 17 / 2026-11-24 / no | As-of feature engineering, rolling-origin folds, causal baseline | 🔵 | Ref |
| [allenwalker3/playcall](https://github.com/allenwalker3/playcall) | MIT | 2 / 2026-06-09 / no | LLM → DuckDB SQL over nflverse parquet | 🔵 | Ref (assistant tool design) |
| [greerreNFL/nfelotranslation](https://github.com/greerreNFL/nfelotranslation) | none | 2 / 2026-08-01 / no | Win prob ↔ spread ↔ discrete margin PMF (−75..+75), cover/push probs | 🔵 | Ref only (no licence) |
| [HuddleScope/huddlescope.github.io](https://github.com/HuddleScope/huddlescope.github.io) | MIT | 1 / 2026-11-25 / no | Non-commercial NFL RSS news aggregator in Go (ingest, store, Hugo export, heartbeat) | 🟠 (feed terms) | Ref — see §7 |
| [howardchung/opencfb](https://github.com/howardchung/opencfb) | none | 4 / 2026-11-25 / no | College data site serving a static SQLite DB through `sql.js-httpvfs` (HTTP range requests), rebuilt daily | 🔵 | Ref (architecture idea for a static page) |
| [andrewneuwirth/football-cv](https://github.com/andrewneuwirth/football-cv) | MIT | 1 / 2026-11-15 / no | Computer vision from game film to 22 position labels (~70% accuracy on 21 plays) | 🔴 if run on broadcast film | Ref only |
| [jgamblin/SeaHawksML](https://github.com/jgamblin/SeaHawksML) | Apache-2.0 | 1 / 2026-11-25 / no | nflverse + Open-Meteo historical weather, holdout scored once | 🔵 | Ref / Code |
| [ThompsonJamesBliss/WeatherData](https://github.com/ThompsonJamesBliss/WeatherData) | none | 30 / 2021-10-06 / no | Hourly game weather 2000–2020 (Meteostat, Weather Underground) + stadium azimuths | 🟠 | Ref (no licence) |
| [veltman/nflplays](https://github.com/veltman/nflplays) | none | 44 / 2020-09-30 / no | Brian Burke's 2002–2012 pbp, cleaned | ⚫ | Avoid |
| [nfl-football-ops/Big-Data-Bowl](https://github.com/nfl-football-ops/Big-Data-Bowl) | none | 155 / 2019-04-29 / no | One 2017 game of tracking + schema/FAQ | 🟢 | Ref |
| [ffverse/ffopportunity](https://github.com/ffverse/ffopportunity) | GPL-3.0 | 26 / 2025-12-11 / no | Expected fantasy points models; releases loaded by `nflreadr::load_ff_opportunity()` 2006+ | 🔵 | Data with caution (GPL code; data licence not stated) |
| [marcusdarmstrong/mockdraftable-web](https://github.com/marcusdarmstrong/mockdraftable-web) | MIT | 36 / 2019-03-01 / no | Mockdraftable website code (data not in repo) | 🔵 code | Ref |

Ecosystem status changes since the project's docs: (1) **nfelo moved its model code private on 2026-11-11** and added a new licence (outputs still public); (2) `pseudo-r` now keeps `Public-NFL-API` (Sept 2026 audit) — the project doc says the old Public-ESPN-API no longer resolves, still true; (3) a maintained MIT NFL RSS aggregator exists (HuddleScope, 1★) — small but contradicts the "none found" line; (4) nflverse `player_stats` tag is legacy since May 2025 (replaced by `stats_player`/`stats_team`).

### Part D — Academic and ML resources (dataset/code availability and leakage pitfalls)

All DOIs below resolved via `api.crossref.org/works/<DOI>` on 2026-11-25 unless marked; arXiv titles read from `export.arxiv.org/abs/<id>`.

| # | Resource | Topic | Data / code | Leakage pitfalls |
|---|---|---|---|---|
| 1 | Yurko, Ventura, Horowitz (2019) "nflWAR: a reproducible method for offensive player evaluation in football", JQAS — DOI 10.1515/jqas-2018-0010; arXiv 1802.00998 | EP/WP models (nflscrapR) + WAR | nflscrapR data; code `ryurko/nflscrapR-models`, `ryurko/nflWAR` (no licences) | They validate EP/WP with **leave-one-season-out CV** — the right template; pbp `ep`/`wp` columns are in-sample for older seasons |
| 2 | Baldwin, "nflfastR EP, WP and CP models" (Open Source Football, 2020-09-28) https://www.opensourcefootball.com/posts/2020-09-28-nflfastr-ep-wp-and-cp-models/ (301 redirect observed; content cited by the project docs) | EP/WP/CP with xgboost | nflfastR (MIT), fastrmodels weights | Same: models fit on all seasons; refit by season for backtests. Spread-adjusted WP uses closing line → uses market info available pre-kickoff only if you take the line at that time |
| 3 | Lock & Nettleton (2014) "Using random forests to estimate win probability before each play of an NFL game", JQAS — DOI 10.1515/jqas-2013-0100 | In-game WP | 2001–2011 pbp (Burke) | Train/test by season; uses pre-game spread |
| 4 | Pelechrinis (2017) "iWinRNFL: A Simple, Interpretable & Well-Calibrated In-Game Win Probability Model for NFL", arXiv 1704.00197 | Interpretable WP | nflscrapR data | Calibration on held-out seasons |
| 5 | Glickman & Stern (1998) "A State-Space Model for National Football League Scores", JASA — DOI 10.1080/01621459.1998.10474084 | Dynamic team strength (Kalman/MCMC) | scores (public) | Ratings must be filtered forward only (no smoothing with future games) |
| 6 | Stern (1991) "On the Probability of Winning a Football Game", The American Statistician — DOI 10.1080/00031305.1991.10475798 | Spread → win probability (normal, σ≈13–14) | lines and scores | Use the line known before kickoff; closing vs opening matters |
| 7 | Levitt (2004) "Why are Gambling Markets Organised so Differently from Financial Markets?", Economic Journal — DOI 10.1111/j.1468-0297.2004.00207.x | Bookmaker pricing / market efficiency | wagering contest data | Market biases are small; beware multiple testing |
| 8 | Moskowitz (2021) "Asset Pricing and Sports Betting", Journal of Finance — DOI 10.1111/jofi.13082 | Momentum/value in betting markets | proprietary odds | Close-to-open movement is not predictive out-of-sample at tradable size |
| 9 | Gray & Gray (1997) "Testing market efficiency: evidence from the NFL sports betting market", Journal of Finance | ATS anomalies | lines | **DOI UNVERIFIED** (two candidate DOIs resolved to other papers); classic finding that anomalies faded — a cautionary tale on data snooping |
| 10 | Yurko et al. (2020) "Going deep: models for continuous-time within-play valuation of game outcomes in American football with tracking data", JQAS — DOI 10.1515/jqas-2019-0056 | Within-play EP from tracking | Big Data Bowl tracking (competition-licensed) | Tracking samples are tiny and non-random weeks |
| 11 | NFL Big Data Bowl (2019 →; 2026 winner Lucca Ferraz, Rice; 2027 uses combine tracking 2023–2025) — https://operations.nfl.com/gameday/analytics/big-data-bowl/ (read) | Tracking analytics, movement prediction | Kaggle (rules UNVERIFIED) | 2026 leaderboard track scored on **future games** (weeks 14–18 2025) — a good anti-leakage design |
| 12 | Mack et al. (2018/2019) "Higher Rates of Lower Extremity Injury on Synthetic Turf Compared With Natural Turf Among NFL Athletes", AJSM — DOI 10.1177/0363546518808499 | Injury risk by surface | NFL Injury Surveillance (not public) | Data not public; cannot be reproduced from nflverse injuries (which are practice-report statuses, not injury incidence) |
| 13 | Kaggle "NFL 1st and Future – Playing Surface Analytics" https://www.kaggle.com/c/nfl-playing-surface-analytics (HTTP 200) | Injury vs surface, player movement | Competition data (rules not read) | Competition-only licence (UNVERIFIED) |
| 14 | "Sports injuries and game stakes: Concussions in the National Football League", Economic Inquiry replication package — https://doi.org/10.3886/E191501V4 (Harvard Dataverse/openICPSR listing) | Concussions vs game stakes | Replication package (openICPSR terms) | Observational; reporting changes over time |
| 15 | "Bye-bye, bye advantage: estimating the competitive impact of rest differential in the NFL" (Frontiers, data sheet on Figshare 2024-10-17) https://frontiersin.figshare.com/articles/dataset/Data_Sheet_1_Bye-bye_bye_advantage_estimating_the_competitive_impact_of_rest_differential_in_the_National_Football_League_pdf/27248217 | Rest differential | data sheet | Directly relevant to the project's rejected rest-day factor — a published counterpoint to compare with `scripts/backtest.py` |
| 16 | Petersen, *Fantasy Football Analytics* textbook (CC-BY-4.0) https://isaactpetersen.github.io/Fantasy-Football-Analytics-Textbook/ | Fantasy projection, wisdom of crowds, evaluation | nflverse-based | Projections must be scored on weeks after they were made |
| 17 | MaddocksJ27 "NFL Betting Market Efficiency" (GitHub, 2026) | Line drift, props | nflverse + The Odds API snapshots | Documents underpowered tests (n=734) — honest-uncertainty example |

Not found / not verified: a public injury-prediction model with an open NFL injury-incidence dataset (none found; nflverse injuries are report statuses), a maintained drive-outcome model package beyond nflfastR's EP/WP, and a public prop-pricing dataset (props need a paid odds feed — see R-track on odds).

**Generic leakage rules distilled for this project:** (a) every model input carries the timestamp at which it was known; (b) use nflverse `games` lines only as "closing-ish, undocumented timing" — never as an opening line; (c) never use nflfastR `wp`/`vegas_wp`/`ep` as features for seasons they were trained on; (d) season-level aggregates (PFR AV, season QBR, end-of-season depth charts, final rosters) are look-ahead features when joined to weekly games; (e) the depth-chart and injury files are dated snapshots — join on the snapshot time ≤ prediction time; (f) participation data arrives after the Super Bowl, so it can never be a weekly input.

### Part E — College, draft and combine

### CollegeFootballData.com (CFBD) — API
- Links: https://collegefootballdata.com · terms https://collegefootballdata.com/terms (read; effective 2026-08-12) · tiers https://collegefootballdata.com/api-tiers (read) · key https://collegefootballdata.com/key (read) · client https://github.com/CFBD/cfbd-python
- Category · Class: college football stats, pbp, recruiting, lines, draft · 🟡 Licensed (free tier available)
- Provides: games, box scores, pbp, drives, advanced metrics (PPA, success rate, WP), recruiting, ratings, betting lines, NFL draft picks, rosters; live scoreboard (Tier 1+), live pbp (Tier 2+), GraphQL (Tier 3+)
- History · Live · Latency: deep history (exact first seasons per endpoint not stated on pages read — UNVERIFIED; cfbfastR's CFBD pbp loader starts 2014) · live from Tier 1 · minutes
- Coverage: FBS fully; FCS partial (inference from cfbfastR notes)
- Technical: REST (+GraphQL) · JSON · SDK: official Python/JS/C# generated clients; cfbfastR (R) · Auth: free API key by email ("No credit card") · **Rate limits: monthly quota by tier — Free 1,000 calls; Academic (.edu/.ac.uk) 3,000; Tier 1 $1 → 5,000; Tier 2 $5 → 30,000; Tier 3 $10 → 75,000; Tier 4 $15 → 125,000; Tier 5 $20 → 200,000; Tier 6 $30 → 500,000** (api-tiers page; no date shown)
- Cost: free: 1,000 calls/month · paid: $1–$30/month via Patreon tiers
- Licensing: **commercial: "Commercial use is permitted"; tier sets quota, not rights** · redistribution: **no** standalone dataset, bulk download, raw feed, mirror or substitute API · caching/storage: private caching and retention allowed, even after subscription ends · attribution: optional, suggested "Data provided by CollegeFootballData.com." · other: model training and commercialising derived outputs allowed; keys server-side only; no multiple accounts; don't present as official NCAA data
- Quality: community standard; upstream sources not stated on pages read (UNVERIFIED)
- Scores: Q 8 / Cov 8 / Rel 7 / Lat 7 / Hist 8 / Doc 8 / DX 8 / Cost 9 / Lic 7 / Com 8 / RL 5 / NFL 6 = **7.4**
- Recommendation: PRIMARY for college context (prospects' college production) if the product adds a draft module; key in a server secret like FantasyPros
- Verified: 2026-11-25 — terms, tiers and key pages read

### SportsDataverse — cfbfastR / sportsdataverse-data (college)
- Links: https://github.com/sportsdataverse/cfbfastR (MIT) · https://github.com/sportsdataverse/sportsdataverse-data/releases
- Category · Class: college pbp with EPA/WPA · 🟠 (CFBD/ESPN/NCAA upstream)
- Provides: CFBD-sourced pbp 2014+, ESPN-derived pbp 2004+, stats.ncaa.org pbp 2013+ (loader docs), recruiting, team talent, portal
- Technical: release assets (parquet/rds/csv) · R/Python
- Licensing: repo MIT; upstream terms apply (ESPN: Disney ToU; NCAA: ToS; CFBD: no redistribution of raw API data — **the release files are effectively a redistribution of upstream data**)
- Scores: Q 7 / Cov 8 / Rel 7 / Lat 6 / Hist 7 / Doc 7 / DX 7 / Cost 10 / Lic 4 / Com 3 / RL 8 / NFL 5 = **6.6**
- Recommendation: OPTIONAL — research/backtests only; production via the CFBD API under its own terms
- Verified: 2026-11-25 — repo metadata, loader source, release tags

### NCAA — stats.ncaa.org / ncaa.com and henrygd/ncaa-api
- Links: https://www.ncaa.com/tos (read; "last updated on: February 21, 2023") · https://stats.ncaa.org (robots.txt answered 403 "Access Denied") · https://github.com/henrygd/ncaa-api (MIT, 275★)
- Category · Class: official college stats · 🟢 Official site / 🔴 when scraped
- Provides: official NCAA statistics, scores, pbp (FCS and lower divisions too)
- Licensing: NCAA.com is operated by Turner Sports Interactive for the NCAA; terms bar using NCAA Content "for commercial purposes" and any copying/redistribution except as provided; ncaa.com robots.txt disallows ClaudeBot, GPTBot and other AI agents
- Scores: Q 8 / Cov 9 / Rel 5 / Lat 7 / Hist 6 / Doc 2 / DX 3 / Cost 10 / Lic 1 / Com 1 / RL 2 / NFL 4 = **4.8**
- Recommendation: AVOID automated use; link only
- Verified: 2026-11-25 — ToS fetched and parsed; stats.ncaa.org 403

### Sports Reference — College Football (sports-reference.com/cfb)
- Same terms and bot limits as PFR (data_use and bot-traffic pages cover all SR sites). Coverage not fetched (2-request cap) — UNVERIFIED.
- Recommendation: AVOID automated use. Score as PFR minus NFL relevance: **≈ 5.5**

### NFL — official Combine results (nfl.com combine tracker) and NFL.com draft profiles
- Links: https://www.nfl.com/combine/tracker/live-results/ (fetched: page shell titled "2026 NFL Combine Results", results rendered by script) · terms https://www.nfl.com/legal/terms/ (read; "Updated: May 16, 2024")
- Category · Class: official combine results / scouting text · 🟢 Official, but site content
- Licensing: **NFL ToU §1.3: use limited to "your own individual non-commercial and informational purposes"; "systematic retrieval of data … to create or compile … a database" needs written consent; §11(f) bars robots for commercial purposes; §8 allows links to the home page only without permission.** Draft profiles (e.g. Lance Zierlein's) are copyrighted editorial text
- Scores: Q 10 / Cov 7 / Rel 7 / Lat 8 / Hist 5 / Doc 2 / DX 2 / Cost 10 / Lic 1 / Com 1 / RL 3 / NFL 8 = **5.3**
- Recommendation: AVOID automated collection; use nflverse `combine` (PFR-derived) for history and link to NFL.com for official results
- Verified: 2026-11-25 — terms read; tracker page shell fetched

### nflverse — combine and draft_picks (validated)
- Links: release tags `combine`, `draft_picks`
- Provides: combine 2000–2026 (8,968 rows; ht, wt, forty, bench, vertical, broad_jump, cone, shuttle, `pfr_id`, `cfb_id`, draft team/round/overall); draft picks 1980–2026 (12,927 picks; `gsis_id`, `pfr_player_id`, `cfb_player_id`, `hof`, `allpro`, `probowls`, `seasons_started`, `w_av`, `car_av`, `dr_av`, career stat totals)
- History · Live · Latency: combine yearly (updated 2026-03-12); draft picks daily (career columns change)
- Licensing: CC-BY-4.0 label; data "courtesy of PFR" (loader docs) — PFR ToU upstream
- **Leakage warning:** `w_av`, `car_av`, `allpro`, `probowls`, `hof`, `seasons_started` and stat totals are *current career* values, not values as of the draft — never use them as features for a draft-time model
- Scores: Q 8 / Cov 7 / Rel 8 / Lat 5 / Hist 8 / Doc 8 / DX 9 / Cost 10 / Lic 5 / Com ~3 / RL 8 / NFL 8 = **7.2**
- Recommendation: PRIMARY for a fan draft/combine panel; owner decision for commercial
- Verified: 2026-11-25 — both files downloaded and parsed

### Mockdraftable
- Links: https://www.mockdraftable.com (read) · code https://github.com/marcusdarmstrong/mockdraftable-web (MIT, 36★, last push 2019-03-01)
- Category · Class: combine measurables database and percentile visualisation · 🟠
- Provides: height, weight, wingspan, arm, hand, 10/20/40-yard, bench, vertical, broad, 3-cone, 20/60-yard shuttle (measurable list embedded in the page), position percentiles; "© MockDraftable, 2011-2026"
- Technical: website (React; internal JSON); no documented public API; no terms page found
- Licensing: no data licence; code MIT only
- Scores: Q 7 / Cov 6 / Rel 5 / Lat 4 / Hist 7 / Doc 2 / DX 3 / Cost 10 / Lic 2 / Com 1 / RL ~4 / NFL 6 = **4.8**
- Recommendation: AVOID data reuse; link to player pages
- Verified: 2026-11-25 — about page fetched; robots.txt returned the HTML shell (no robots file)

### Kent Lee Platte — Relative Athletic Score (RAS)
- Links: https://ras.football (HTTP 429 to curl and to WebFetch, 2026-11-25)
- Category · Class: composite athletic score from combine/pro-day results · 🟠
- Licensing / terms: **UNVERIFIED** (site refused automated requests with 429 — not retried)
- Recommendation: AVOID automated use; RAS-like percentiles can be computed from nflverse combine data (§5)
- Verified: UNVERIFIED

### NFL Mock Draft Database
- Links: https://www.nflmockdraftdatabase.com (403 to curl) · robots https://www.nflmockdraftdatabase.com/robots.txt (read)
- Category · Class: aggregated mock drafts and consensus big board · 🟡 (has a paid API)
- Evidence: robots.txt disallows `/api/v1/` and `/api-checkout`, blocks AI crawlers (incl. ClaudeBot, Claude-User, GPTBot) and comments that bulk access "competes directly with the paid API"; allows search engines to index consensus big-board pages
- Cost/terms: **UNVERIFIED** (site answered 403; pricing not seen)
- Recommendation: OPTIONAL via the paid API if the owner wants a consensus board (pricing and terms to be read by the owner); never scrape
- Verified: robots only

### Grinding the Mocks; Arif Hasan consensus board
- grindingthemocks.com: **DNS/connection failure (curl 000) on 2026-11-25** — status UNVERIFIED (possibly offline)
- Arif Hasan's consensus board: no URL verified this session (web search budget exhausted) — UNVERIFIED
- Recommendation: AVOID until terms are seen; prospect rankings are editorial compilations

### DraftHistory.com (Chris Malumphy)
- Links: https://www.drafthistory.com (read) — "Copyright 2000 - 2026"; draft results by year/position/college/team; RSS feed link present; combineR scrapes its draft data 1936+
- Licensing: no licence offered → AVOID data reuse; nflverse `draft_picks` (1980+) covers the modern era
- Scores: Q 7 / Cov 7 / Rel 6 / Lat 4 / Hist 9 / Doc 2 / DX 2 / Cost 10 / Lic 1 / Com 1 / RL ~4 / NFL 6 = **4.9**

### Draft order (computed) and other draft items
- Draft order is computable from standings plus the NFL's draft-order rules (non-playoff teams by record, ties by strength of schedule, playoff teams by round of exit). nflseedR's simulator outputs draft order (MIT; already a project reference). Inputs: nflverse `games` (results) → standings → SOS
- Pro-day results: no open, licensed source found (published piecemeal by teams, NFL.com and media) — gap
- PFF college grades: paid PFF product — pricing UNVERIFIED; do not scrape (see thadhutch/sports-quant warning)
- Scouting reports (NFL.com, The Athletic, PFF, The Beast): copyrighted text — **never copy**; link out or summarise one or two facts in own words with a link

### Part F — Awards and honours

| Source | What | History | Licence | Verdict |
|---|---|---|---|---|
| PFR awards pages | AP MVP/OPOY/DPOY/ROY, All-Pro, Pro Bowl, HOF | all years | SR terms (no automated use) | Link/manual reference only |
| nflverse `draft_picks` | per drafted player: `hof` flag, `allpro` and `probowls` **counts**, from PFR | drafts 1980–2026 (102 HOF flags) | CC-BY-4.0 label, PFR upstream | OK for counts on drafted players; no award years, no undrafted players |
| Wikidata (`P166` award received) | award statements with point-in-time qualifiers | **patchy**: SPARQL on 2026-11-25 found 315 "Pro Football Hall of Fame" statements dated 1963–2020, only 11 for "AP NFL Defensive Player of the Year Award" (1972–2015), and 0 under the label "AP NFL Most Valuable Player Award" | **CC0** | Usable licence, incomplete data: good as an id hub, needs curation before display |
| Pro Football Hall of Fame (profootballhof.com) | official enshrinee list | 1963– | site terms not read | Link; curate the list by hand (facts) |
| AP (awards announcer) | official award results | – | AP content licence | Facts with link only |

Recommendation: a small hand-curated `awards.json` (facts + source URL per item, like `data/news.json`), seeded from Wikidata (CC0) and checked against PFR/HOF pages by a human. Score for Wikidata as an awards source: Q 6 / Cov 4 / Rel 7 / Lat 4 / Hist 7 / Doc 7 / DX 7 / Cost 10 / Lic 10 / Com 10 / RL 7 / NFL 5 = **7.0**.

### Wikidata — awards and honours (`P166` award received)
- Links: https://query.wikidata.org/sparql · licence CC0 (Wikidata structured data)
- Category · Class: awards, honours, identity hub · 🔵 Public/open data
- Provides: award statements with point-in-time qualifiers; external ids (PFR, ESPN, NFL ids exist as properties — not checked this session)
- History · Live · Latency: patchy (HOF statements dated 1963–2020: 315; AP DPOY: 11; "AP NFL Most Valuable Player Award" label: 0) · no · community edits
- Technical: SPARQL endpoint · JSON · Auth none (User-Agent requested by Wikimedia policy) · Rate limits: query-time limits (not re-read this session)
- Cost: free · Licensing: CC0 — no attribution required (credit anyway)
- Quality: accurate where present; incomplete — needs curation
- Scores: Q 6 / Cov 4 / Rel 7 / Lat 4 / Hist 7 / Doc 7 / DX 7 / Cost 10 / Lic 10 / Com 10 / RL 7 / NFL 5 = **7.0**
- Recommendation: PRIMARY seed for a curated `awards.json`, checked by hand against PFR/HOF pages
- Verified: 2026-11-25 — one SPARQL query (counts above)

### Historical depth (dedicated table)

Bands: **All history** = from 1920; **30+** = starts 1996 or earlier; **20+** = 2006 or earlier; **10+** = 2016 or earlier; **5+** = 2021 or earlier; **<5** = later. "Verified" = asset names or parsed file this session.

| Source / dataset | First – last season | Seasons | Band | Still updating? | Verified how |
|---|---|---|---|---|---|
| nflverse `rosters` | 1920 – 2026 | 107 | All history | yes (daily) | asset names |
| Pro Football Reference (site) | 1920 – 2026 | 107 | All history | yes | search snippets only |
| Neil Paine NFL Elo (MIT) | 1920 – 2024 (SB LIX) | 105 | All history | **no** (last commit 2025-02-10) | file head/tail |
| 538 `nfl-elo-game` (MIT) | 1920 – 2020 | 101 | All history | **no** | file parsed |
| 538 `nfl_elo.csv` (datahub mirror) | 1920 – 2017 | 98 | All history | **no**; original URL dead | headers + tail |
| DraftHistory.com | 1936 – 2026 (per combineR README) | 90 | 30+ | yes | home page; years from combineR README |
| spreadspoke (Kaggle) | scores 1966 – 2025; lines 1979 – 2025 | 60 / 47 | 30+ | yearly (v82, 2026-02-11) | Kaggle metadata |
| nflverse `draft_picks` | 1980 – 2026 | 47 | 30+ | yes | parsed |
| FTN DVOA archive | ~1979/1981 – 2026 | ~46 | 30+ | yes (paid) | search snippets only |
| PFR play-by-play | 1978 – 2026 | 49 | 30+ | yes | PFR blog via search snippet |
| nflverse `pbp`, `stats_player`, `stats_team`, `schedules` | 1999 – 2026 | 28 | 20+ | yes (nightly / 5 min) | asset names + parsed games |
| nfldata `officials.csv` | 1999 – 2026 wk 5 | 28 | 20+ | stale since 2026-10-09 | parsed |
| nflverse `combine` | 2000 – 2026 | 27 | 20+ | yearly | parsed |
| The Prediction Tracker results | 2000 – 2026 | 27 | 20+ | yes | page read |
| ThompsonJamesBliss WeatherData | 2000 – 2020 | 21 | 20+ | **no** | README |
| nflverse `depth_charts` | 2001 – 2026 | 26 | 20+ | yes (format change 2025) | asset names |
| nflverse `weekly_rosters` | 2002 – 2026 | 25 | 20+ | yes | asset names |
| nfldata `standings`, `weekly_standings` | 2002 – 2026 | 25 | 20+ | yes | parsed |
| nflverse `trades` / nfldata `trades.csv` | 2002-03-04 – 2026-04-17 | 25 | 20+ | **stale since April 2026** | parsed both |
| ESPN QBR (nflverse `espn_data`) | 2006 – 2026 | 21 | 20+ | yes | parsed |
| ffopportunity expected fantasy points | 2006 – | 21 | 20+ | yes (nflreadr loader) | loader source |
| nfldata `closing_lines.csv` | 2006 – 2018 | 13 | 10+ | **frozen 2019** | parsed |
| nfldata `win_totals.csv` | 2003 – 2020 | 18 | 20+ | **frozen 2021** | parsed |
| CFB pbp, ESPN-derived (cfbfastR) | 2004 – 2026 | 23 | 20+ | yes | loader docs |
| nflverse `injuries` | 2009 – 2026 | 18 | 10+ | yes | asset names |
| nfelo `nfelo_games.csv` | 2009 – 2026 wk 12 | 18 | 10+ | yes | parsed |
| Kaggle Horowitz pbp | 2009 – 2018 | 10 | 10+ | **frozen 2018** | Kaggle metadata |
| nflverse `snap_counts` | **2013** – 2026 (2012 file empty) | 14 | 10+ | yes | 2012 file read |
| stats.ncaa.org pbp (cfbfastR) | 2013 – 2026 | 14 | 10+ | yes | loader docs |
| CFBD pbp (cfbfastR) | 2014 – 2026 | 13 | 10+ | yes | loader docs |
| nflverse `officials` | 2015 – 2026 wk 1 | 12 | 10+ | **stale since 2026-09-02** | parsed |
| nflverse `nextgen_stats` | 2016 – 2026 | 11 | 10+ | yes | asset names |
| nflverse `pbp_participation` | 2016 – 2025 | 10 | 10+ (5+ per source: NGS 2016–22, FTN 2023–25) | yearly, post-season | asset names |
| nflverse `pfr_advstats` | 2018 – 2026 | 9 | 5+ | yes | asset names |
| nfelo projection ledger | 2021 – 2026 | 6 | 5+ | yes | parsed |
| nflverse `ftn_charting` | 2022 – 2026 | 5 | <5 complete seasons (4 + current) | yes | asset names |
| Big Data Bowl tracking | samples 2017 – 2025 | sampled weeks only | n/a | yearly | GitHub + 2027 article |
| Wikidata HOF statements | 1963 – 2020 (point-in-time) | – | patchy | community | SPARQL |

## 3. Matrix rows

| Category | Provider | Data | Live | Historical | Free | Paid | Cost | License | Quality | Latency | Commercial | Primary/Backup | Score |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Historical pbp | nflverse | pbp + EPA/WP | no | 1999– | yes | – | $0 | CC-BY-4.0 (NFL owns feed) | high | nightly | owner decision | Primary | 8.1 |
| Historical bundle | nflverse-data | 25 tags | no | 1920– | yes | – | $0 | CC-BY-4.0; FTN CC-BY-SA; PFR/OTC upstream | high | daily–nightly | partial | Primary | 8.2 |
| Schedules/results/lines | nflverse schedules / nfldata | games, one line, weather, QBs | no | 1999– | yes | – | $0 | CC-BY tag / unlicensed repo | high | 5 min in season | owner decision | Primary | 7.8 |
| Rosters/players/depth/injuries | nflverse | rosters, ids, depth, injuries | no | 1920/2001/2009– | yes | – | $0 | CC-BY-4.0 | good | daily | owner decision | Primary | 8.2 |
| Snaps/PFR advanced | nflverse (PFR) | snaps, pressures | no | 2013/2018– | yes | – | $0 | CC-BY label, SR ToU | good | 4×/day | no without SR | Secondary | 6.8 |
| NGS aggregates | nflverse (NGS) | separation, CPOE | no | 2016– | yes | – | $0 | NFL owns | high | nightly | no | Secondary | 7.1 |
| Charting | nflverse (FTN) | play charting | no | 2022– | yes | FTN full | $0 | CC-BY-SA 4.0 | good | 4×/day | yes (share-alike) | Secondary | 7.2 |
| Participation | nflverse (NGS/FTN) | personnel | no | 2016–2025 | yes | – | $0 | credit / CC-BY-SA | good | yearly | limited | Optional | 7.0 |
| Contracts/QBR/officials/trades | nflverse | misc | no | 2002–/2006–/2015– | yes | OTC licence | $0 | OTC/ESPN/PFR upstream | stale parts | daily–stale | no | Optional | 6.2 |
| Reference site | PFR | everything | no | 1920– | site only | Stathead $9/mo; data ≥$5,000 | – | SR ToU, no AI use | excellent | same day | no | Link only | 6.2 |
| Query tool | Stathead | finders | no | 1920– | no | $9/mo, $80/yr | $ | personal | excellent | same day | no | Optional | 6.0 |
| Historical lines | spreadspoke (Kaggle) | scores, lines, weather | no | 1966/1979– | yes | – | $0 | CC BY-NC-SA 4.0 | medium | yearly | **no** | Optional (non-commercial backtests) | 6.0 |
| Historical pbp (old) | Kaggle Horowitz | pbp 2009–18 | no | 2009–2018 | yes | – | $0 | unknown | superseded | frozen | no | Avoid | 4.8 |
| Tracking samples | Big Data Bowl | tracking | no | samples | entrants | – | $0 | competition rules | very high | yearly | no | Avoid | 5.0 |
| Model benchmark | 538 Elo | Elo, WP | no | 1920–2020/22 | yes | – | $0 | CC-BY / MIT | good | dead | yes | Avoid (current) | 6.6 |
| Model benchmark | Neil Paine Elo | Elo, WP | no | 1920–2024 | yes | – | $0 | MIT | good | stale | yes | Optional (history) | 6.9 |
| Model benchmark | nfelo outputs | ratings, lines, ledger | no | 2009– | yes | – | $0 | custom: republish OK, no code use | good | weekly | likely (outputs) | Secondary | 7.2 |
| QB values | nfeloqb | QB Elo values | no | 538-era – 2026 | yes | – | $0 | **none** | good | 2×/week | no | Secondary → owner decision | 6.4 |
| Model consensus | Prediction Tracker | 50+ systems | no | 2000– | yes | – | $0 | © Todd Beck; ai-train=no | medium | daily | no | Optional (link) | 5.5 |
| Ratings | Sagarin | ratings | no | current | yes | – | $0 | all rights reserved | medium | weekly | no | Avoid | 4.6 |
| Ratings | Massey | ratings | no | long | yes | – | $0 | informal credit | medium | weekly | no | Avoid (blocks bots) | 5.0 |
| Ratings | FTN DVOA | DVOA | no | ~1979– | partial | FTN Stats+ | UNVERIFIED | proprietary | high | weekly | no | Avoid | 5.2 |
| Ratings | ESPN FPI/QBR | FPI, QBR | no | 2006– (QBR) | yes | – | $0 | Disney ToU | high | daily | no | Avoid | 5.8 |
| College | CFBD API | CFB everything | Tier 1+ | deep | 1,000 calls/mo | $1–$30/mo | low | commercial OK, no redistribution | good | minutes | **yes** | Primary (college) | 7.4 |
| College | cfbfastR / sdv-data | CFB pbp | no | 2004/2013/2014– | yes | – | $0 | MIT repo, upstream terms | good | daily | no | Optional | 6.6 |
| College | NCAA.com / stats.ncaa.org | official stats | yes | long | site | – | – | ToS: no commercial, no redistribution | high | minutes | no | Avoid | 4.8 |
| Combine | NFL.com tracker | official results | event | 2026 page | site | – | – | NFL ToU | official | live | no | Link only | 5.3 |
| Combine/draft | nflverse combine/draft_picks | measurables, picks, AV | no | 2000/1980– | yes | – | $0 | CC-BY label, PFR upstream | good | yearly/daily | owner decision | Primary (fan) | 7.2 |
| Combine | Mockdraftable | measurables, percentiles | no | long | site | – | – | no licence | good | yearly | no | Link only | 4.8 |
| Consensus boards | NFL Mock Draft Database | mocks, big boards | no | multi-year | site | paid API (price UNVERIFIED) | UNVERIFIED | UNVERIFIED | – | daily | UNVERIFIED | Optional (paid) | – |
| Draft history | DraftHistory.com | picks 1936– | no | 1936– | site | – | – | © no licence | good | yearly | no | Link only | 4.9 |
| Awards | Wikidata | award statements | no | patchy | yes | – | $0 | CC0 | patchy | community | yes | Primary (seed, curated) | 7.0 |

## 4. Redundancy

| Data category | PRIMARY → SECONDARY → FALLBACK | Real backup? |
|---|---|---|
| Historical play-by-play (1999+) | nflverse `pbp` → nflverse `stats_*` aggregates → Kaggle Horowitz 2009–2018 (frozen, unlicensed) | **No real backup.** PFR pbp (1978+) exists but is not usable automatically |
| Schedules, results | nflverse `schedules` release → `nfldata/data/games.csv` (identical today) → Neil Paine Elo CSV for 1920–2024 results (MIT) / spreadspoke 1966–2025 (NC) | Yes (same upstream maintainer for the first two — **single point of failure: Lee Sharpe/nflverse**) |
| Historical closing lines | nflverse games (1999+, one line, timing undocumented) → spreadspoke (1979+, NC, mixed books) → nfelo `nfelo_games` market open/close 2009+ (third-party columns, not licensed by nfelo) → nfldata `closing_lines.csv` 2006–2018 (frozen) | Weak: no licensed multi-book open/close history for free |
| Rosters / player ids | nflverse `players` + `weekly_rosters` → nflverse `rosters` → Sleeper players (current, non-commercial) | Yes for current; history only nflverse |
| Injury history | nflverse `injuries` 2009+ → (ESPN current only) | **No backup for history** |
| Depth chart history | nflverse `depth_charts` 2001+ → (ESPN current only) | **No backup for history**; source discontinuity at 2025 |
| Snap counts | nflverse `snap_counts` (PFR) 2013+ → FTN participation (post-season, 2023+) | Partial |
| Charting / advanced | FTN via nflverse → PFR advstats via nflverse → NGS via nflverse | Yes (three different upstreams) |
| Model benchmarks / ratings | our own Elo/SRS from nflverse results → nfelo outputs (licensed to republish) → Neil Paine Elo (history) → 538 MIT file (to 2020) | Yes |
| QB value | own QB metric from pbp (EPA/CPOE) → nfelo `home_538_qb_adj` in `nfelo_games` (licensed output) → nfeloqb `qb_elos.csv` (unlicensed) | Yes once our own metric exists |
| Draft picks | nflverse `draft_picks` 1980+ → CFBD draft endpoint (key) → DraftHistory (link) | Yes |
| Combine | nflverse `combine` 2000+ → NFL.com (link) → Mockdraftable (link) | Data: **no automated backup** |
| College stats | CFBD API → cfbfastR/sdv releases (research) → SR CFB (link) | Yes |
| Officials | `nfldata/officials.csv` (to 2026 wk 5) → nflverse `officials` (to wk 1) → ESPN game summary (owner decision) | Both open files stale this season |
| Trades | nflverse `trades` / nfldata (both stop 2026-04-17) → ESPN transactions (owner decision) | **No current free licensed source** |
| Awards | Wikidata (CC0) curated → nflverse draft_picks counts → PFR/HOF pages (manual check) | Yes with manual curation |

## 5. Derived metrics (compute ourselves instead of copying restricted numbers)

| RAW DATA REQUIRED | CALCULATION | RESULT |
|---|---|---|
| nflverse game results (1999+) or Neil Paine/538 results (1920+) | Elo: K≈20, home-field term, margin-of-victory multiplier, season regression to mean (538 published method); filter forward only | Team Elo and win probability (replaces dead 538 feed); benchmark vs nfelo |
| Game results + schedule | SRS: solve MOV_i = rating_i − mean(opp ratings) iteratively (least squares), optional HFA | Simple Rating System (replaces PFR SRS) and SOS |
| Points for/against | Pythagorean expectation W% = PF^2.37 / (PF^2.37 + PA^2.37) (exponent to be fitted on our data) | Luck / regression indicator (descriptive until backtested) |
| nflverse pbp `epa`, `success`, `posteam`, `defteam`, `week` | Rolling EPA/play and success rate by unit; opponent adjustment by ridge regression on offense/defense effects using only games before week w | Opponent-adjusted efficiency (DVOA-like, our own) — no FTN data needed |
| pbp per QB dropbacks | Per-game QB value à la 538 (published linear combination of pass/rush EPA-like components) or EPA+CPOE composite | QB value to replace unlicensed nfeloqb (needs backtest per house rule) |
| Spread (pre-kickoff) | P(home win) = Φ(spread / σ), σ ≈ 13.5 (Stern 1991) or empirical margin PMF with key numbers (nfelotranslation idea, re-implemented) | Market-implied win probability for model-vs-market display |
| Moneylines | Remove vig: p_i = (1/odds_i) / Σ(1/odds_j) | No-vig probability (already in the fabric for The Odds API) |
| Our forecasts frozen with UTC time + results | Brier, log loss, Brier skill vs market, reliability bins; compare with nfelo ledger (`historic_projected_spreads.csv`) and Prediction Tracker's published MSE | Public "how good are we" page (F05) |
| Opening line snapshot (our own Odds API record) + closing | CLV = close implied − open implied | Line-movement panel; only from our own snapshots (no free history) |
| nflverse `combine` by position | Percentile of each drill within position (2000–present), averaged with size adjustment | RAS-like athletic score (our own method, not RAS) |
| nfldata `draft_values.csv` (Stuart/Johnson/Hill/OTC/PFF) or AV by pick from `draft_picks` | Value curve by pick; trade value = Σ values | Draft-trade calculator (cite chart authors) |
| Standings (games) + SOS | NFL draft-order rules (record, then SOS, then tiebreakers; playoff teams by exit round) | Projected draft order per simulation |
| nflverse `games` `away_rest`, `home_rest` | Rest differential | Descriptive only — the project already rejected rest days in backtest; Frontiers 2024 rest paper is a published comparison |
| nflverse `injuries` + `depth_charts` + snap shares | Snap-weighted share of starters out (as of report time) | Injury burden index (descriptive; DEC rule: not a model input until backtested) |
| `games` roof/surface/temp/wind + Open-Meteo history | Flag thresholds (wind ≥ 15 mph etc.) | Weather flags for history (Open-Meteo historical API terms per registry) |

## 6. Gaps

- **Not obtainable easily or legally for free:** multi-book opening/closing line history (only one undocumented line per game in nflverse; spreadspoke is non-commercial); in-season 2026 trades (both open trade files stop at 2026-04-17); current-season officials (open files stale since Sept/Oct); player tracking beyond Big Data Bowl samples; injury *incidence* data (only report statuses); pro-day results; official combine data in machine-readable licensed form; consensus big boards (paid API, terms unseen); awards with years in a clean licensed table (Wikidata patchy).
- **Expensive or gated:** SR custom data (minimum $5,000); FTN full charting and DVOA (price UNVERIFIED); PFF grades (paid, UNVERIFIED); NFL Mock Draft Database API (price UNVERIFIED); NFL NGS raw tracking (league-licensed only).
- **Avoid and why:** automated PFR/Stathead/SR CFB access (20 req/min jail, no database building, **no AI prompting/training without permission**); NCAA.com/stats.ncaa.org scraping (ToS, robots block AI agents, 403); NFL.com combine/draft profiles scraping (ToU §1.3, copyrighted scouting text); OTC contracts beyond personal use (terms bar systematic retrieval); ESPN FPI/QBR republication (Disney ToU); Sagarin/Massey/Prediction Tracker republication (no licence; Prediction Tracker says ai-train=no); repos that redistribute scraped upstream data under an MIT label (sportsdataverse-data `espn_*`, hvpkod/NFL-Data, tanho63/nfl_combine); unlicensed code repos (reference only).

## 7. Contradictions & UNVERIFIED

**Contradictions with the project's documents**
1. **Registry says nfelo quarterback values are "Yes for outputs with credit".** The build reads `greerreNFL/nfeloqb/qb_elos.csv`, and **nfeloqb has no licence file**; nfelo's LICENSE (added 2026-11-11) covers only "files in output_data/ published here" in the nfelo repo. So the QB file is all-rights-reserved by default. Options: ask the author, or switch to nfelo-repo outputs (`nfelo_games.csv` has `home_538_qb_adj`/`away_538_qb_adj`), or compute our own QB value.
2. Registry/GITHUB_RESEARCH describe nfelo's licence as "the code may not be run, imported or modified" — still true, but **the code is no longer public at all since 2026-11-11** (README, CHANGELOG), and credit is good practice rather than a stated condition for outputs.
3. Registry: "nflverse releases … **Yes**: CC-BY-4.0". Partly: the CC-BY label cannot grant rights nflverse does not hold. Several tags are scraped from third parties whose terms restrict reuse — **PFR** (snap_counts, pfr_advstats, draft_picks, combine, trades; SR data_use page: building tools from SR data and any AI prompting need permission), **OverTheCap** (contracts; terms bar systematic retrieval), **ESPN** (QBR). nflreadr itself says the data "belong to their respective owners". Recommend the registry mark these tags "owner decision" and keep pbp/rosters/injuries/depth/FTN as "Yes".
4. FEATURE_RESEARCH/registry imply participation is just part of nflverse CC-BY: **participation 2023+ is FTN data under CC-BY-SA 4.0** (credit "FTN Data via nflverse"), 2016–2022 credit "NFL NextGenStats via nflverse"; and it is released only after the Super Bowl.
5. Project prompt/registry style claims "snap counts 2012+": the nflverse `snap_counts_2012.csv` is header-only (154 bytes) — **effective coverage is 2013+** (PFR's own FAQ says 2012; nflverse lacks it).
6. Project claim "officials" (implied current): nflverse `officials` has **2026 week 1 only** (asset 2026-09-02); nfldata `officials.csv` reaches week 5 (2026-10-09).
7. Registry: "nflverse has trades only" as the transactions fallback — the trades files **end 2026-04-17** (both copies), so there is no current fallback at all.
8. GITHUB_RESEARCH "Gaps: no maintained open-source NFL news aggregator": HuddleScope (MIT, Go, pushed 2026-11-25) is one, though tiny (1★). The point stands that none is mature.
9. nfldata `DATASETS.md` says games data "begins with the 2006 NFL season"; the file actually starts 1999 (documentation drift in the source, not the project).
10. GITHUB_RESEARCH lists nflfastR/nflreadr licences as MIT via DESCRIPTION — consistent; but **nflverse-pfr (the PFR scraper) is GPL-3.0** and **ffopportunity is GPL-3.0** (code; reference only under the project's rule).

**UNVERIFIED (and why)**
- Stathead price ($9/month, $80/year) and PFR coverage years (AV since 1960, pbp since 1978, lineups since 1920, snaps since 2012): search snippets only; SR fetches capped at 2.
- SR Site Terms of Use clause 5 exact wording: not fetched (cap); AI clause known from data_use page and a search snippet.
- Kaggle competition rules (Big Data Bowl, 1st and Future): Kaggle API 401 without login; no account created.
- CFBD exact first seasons per endpoint and upstream sources: not stated on pages read.
- RAS terms (HTTP 429), NFL Mock Draft Database pricing/terms (HTTP 403), Massey (HTTP 403), Grinding the Mocks (connection failure), Arif Hasan consensus board (no URL; web search budget exhausted mid-track).
- FTN DVOA/Stats+ and PFF pricing: not seen.
- Gray & Gray (1997) DOI: two guesses resolved to other papers; citation kept without DOI.
- data.world NFL datasets: API needs a token; not checked.
- Whether OTC has given nflverse written consent for the contracts scrape: not stated anywhere read.

## 8. Research log (2026-11-25)

Repository files read (read-only): `CLAUDE.md` (in context), `docs/NFL_DATA_SOURCE_REGISTRY.md`, `docs/GITHUB_RESEARCH.md`, `docs/FEATURE_RESEARCH.md` lines 160–244.

GitHub API (`gh`):
- `gh api repos/nflverse/nflverse-data/releases --paginate` (tags, assets, `updated_at`) → 25 tags, 4,367 assets
- `gh api repos/nflverse/nflverse-data`, `/readme`, `/contents/LICENSE.md` → CC-BY-4.0, 449★
- `gh api repos/nflverse/nflreadr`, `/contents/R`, `/contents/R/load_*.R` (pbp, participation, officials, trades, espn_qbr, contracts, draft_picks, combine, nextgen_stats, depth_charts, injuries, snap_counts, pfr_advstats, ftn_charting, rosters, ffverse), `/contents/DESCRIPTION`, `/contents/LICENSE`, `/readme`
- `gh api repos/nflverse/nflfastR` + readme; `nflverse/nflverse-pbp`, `nflverse-players`, `nflreadpy` (+ releases), `nflverse-rosters`, `nflverse-pfr` (+readme), `rotc` (+ `R/otc_historical_contracts.R`, DESCRIPTION), `ngs-data`, `nfl_data_py`, `nflseedR`, `nflplotR`, `nfl4th`, `nflverse-ftn`; 404s: `nflverse/espnscrapeR`, `nflverse/ffopportunity`, `nflverse/nflverse-participation`
- `gh api repos/nflverse/nfldata` + `/contents/data`, `/readme`, `/contents/DATASETS.md`, `/commits?path=data/<file>` for 10 files
- `gh api repos/fivethirtyeight/{data,nfl-elo-game,checking-our-work-data}`, `/contents/nfl-elo`, README, commits
- `gh api repos/greerreNFL/{nfelo,nfeloqb}`, contents, LICENSE, README, CHANGELOG; `greerreNFL/nfelo-power-rankings` → 404
- `gh api repos/nfl-football-ops/Big-Data-Bowl` (+readme, contents), `ThompsonJamesBliss/nfl-big-data-bowl-regional-event-data`
- `gh api repos/sportsdataverse/sportsdataverse-data/releases --paginate` → 388 tags; `sportsdataverse/cfbfastR` R sources (`load_cfb_pbp.R`, `load_ncaa_mfb.R`, `cfbd_*.R`, `data-raw/min_year_map_df.R`), DESCRIPTION; `gh api search/code?q=min_year_map_df+repo:sportsdataverse/cfbfastR`
- `gh api repos/Neil-Paine-1/NFL-elo-ratings` (+contents, commits); `marcusdarmstrong/mockdraftable-web`
- Metadata + README for 50 repos (list in Part C, plus `CFBD/cfbd-api-docs` → 404)
- `gh search repos` (each with `--sort stars` and `--sort updated`, `--limit 25`): "nfl api", "nfl data", "nfl scraper", "nfl play by play", "nfl tracking", "nfl fantasy", "fantasy football api", "nfl odds", "nfl injuries", "nfl news", "nfl schedule", "nfl roster", "nfl depth chart", "nfl weather", "nfl stadium", "nfl prediction", "nfl machine learning", "american football computer vision", "football analytics" (one call hit the 30/min search limit and was retried); plus `--sort stars --limit 30`: "topic:nfl" (also updated), "topic:nfl-data", "topic:nflverse", "topic:american-football", "topic:fantasy-football", "topic:college-football", "nfl draft", "nfl combine", "college football data", "nfl elo", "nfl win probability", "football analytics nfl"; `gh search repos "big data bowl" --sort stars`
- `gh api rate_limit`

Files downloaded to the scratchpad (small) and parsed: nflverse `snap_counts_2012.csv` (154 B), `trades.csv`, `combine.csv`, `draft_picks.csv.gz`, `officials.csv.gz`, `qbr_season_level.csv.gz`, `qbr_week_level.csv.gz`, `schedules/games.csv.gz`; `nfldata/data/games.csv`, `trades.csv`, and the heads of 9 other nfldata files; `fivethirtyeight/nfl-elo-game/data/nfl_games.csv`; nfelo `nfelo_games.csv`, `historic_projected_spreads.csv`, `prediction_tracker.csv`; datahub 538 Elo (headers + byte ranges); Neil Paine Elo (byte ranges); Prediction Tracker `nflpredictions.csv` (first 700 bytes + headers). Byte-range header reads (first 1.5 KB) of nflverse `players.csv`, `roster_2026.csv`, `roster_weekly_2026.csv`.

Web pages read (WebFetch or curl):
- https://nflreadr.nflverse.com/articles/nflverse_data_schedule.html — schedule, participation/depth source changes
- https://nflreadr.nflverse.com/reference/index.html — loader list, nflreadr 1.5.1.9002
- https://www.sports-reference.com/bot-traffic.html — 20/10 requests per minute, jail up to a day (SR request 1 of 2)
- https://www.sports-reference.com/data_use.html — permissions, AI clause, $5,000 minimum (SR request 2 of 2)
- https://overthecap.com/terms → https://overthecap.com/terms-and-conditions (parsed), https://overthecap.com/robots.txt; `/terms-of-use` 404
- Kaggle `api/v1/datasets/view/tobycrabtree/nfl-scores-and-betting-data` and `/maxhorowitz/nflplaybyplay2009to2016` — licences, dates; `api/v1/competitions/list` → 401
- https://operations.nfl.com/the-game/big-data-bowl/terms-and-conditions → 404
- https://www.sportsvideo.org/2026/10/08/nfl-announces-ninth-annual-big-data-bowl-powered-by-aws/ — 2027 edition
- https://operations.nfl.com/gameday/analytics/big-data-bowl/ — 2026 winner, 2027 theme
- https://projects.fivethirtyeight.com/nfl-api/nfl_elo.csv, `/nfl_elo_latest.csv`, `/2023-nfl-predictions/` → 302 to abcnews.go.com/politics
- https://datahub.io/fivethirtyeight/nfl-elo (+ file headers)
- https://www.thepredictiontracker.com/ , `/nflresults.php`, `/prednfl.php`, `/nflpredictions.csv`, `/robots.txt`; `/nflpredictions.html`, `/ptnfl.html`, `/nfl_games.csv` → 404
- http://sagarin.com/sports/nflsend.htm (https failed); https://www.usatoday.com/sports/nfl/sagarin/ → 402
- https://masseyratings.com/ and `/nfl/ratings` → 403 (not bypassed)
- https://collegefootballdata.com/terms, `/key`, `/api-tiers`, `/` (home)
- https://www.ncaa.com/tos (parsed via curl; WebFetch returned empty), https://www.ncaa.com/robots.txt; https://stats.ncaa.org/robots.txt → 403; ncaa.org ToS URL → redirect to home
- https://www.nfl.com/legal/terms/ ; https://www.nfl.com/combine/tracker/live-results/ (shell only)
- https://www.mockdraftable.com/about , `/robots.txt` (HTML shell)
- https://ras.football/ (+ robots, ToS paths) → 429 (curl and WebFetch)
- https://www.nflmockdraftdatabase.com/ → 403; `/robots.txt` read
- https://grindingthemocks.com/ , https://www.grindingthemocks.com/ → connection failure
- https://www.drafthistory.com/ (read); https://www.prosportstransactions.com/ → 403
- https://opensourcefootball.com/posts/2020-09-28-nflfastr-ep-wp-and-cp-models/ (200 after 301)
- https://www.kaggle.com/c/nfl-playing-surface-analytics (200), https://isaactpetersen.github.io/Fantasy-Football-Analytics-Textbook/ (200)
- Crossref DOI lookups `api.crossref.org/works/<DOI>`: 10.1515/jqas-2018-0010, 10.1515/jqas-2013-0100, 10.1080/01621459.1998.10474084, 10.1111/j.1468-0297.2004.00207.x, 10.1080/00031305.1991.10475798, 10.1515/jqas-2019-0056, 10.1177/0363546518808499, 10.1111/jofi.13082 (all matched); 10.1111/j.1540-6261.1997.tb01122.x, …tb01127.x, …tb01128.x, 10.1080/01621459.1980.10477469 (did not match the intended papers)
- arXiv: `export.arxiv.org/abs/1802.00998`, `/abs/1704.00197`
- Wikidata SPARQL (`query.wikidata.org/sparql`): award statements for HOF, AP DPOY, AP MVP labels
- Repository catalogue APIs: `zenodo.org/api/records?q="National Football League"` (27 hits), `dataverse.harvard.edu/api/search?q="National Football League"&type=dataset` (40 hits), `api.figshare.com/v2/articles/search` (datasets) — mostly paper supplements; no maintained NFL dataset

Web searches (WebSearch tool; the shared session budget ran out after these):
1. "sports-reference.com bot traffic rate limit 20 requests per minute data use policy" (standard) — bot-traffic and data_use URLs
2. "overthecap.com terms of use data scraping redistribution" (standard) — no OTC page; found it by URL probing
3. "Stathead Football subscription price per month 2026" (extended) — $9/$80 from SR FAQ snippet
4. "Pro Football Reference box scores "Vegas Line" "Over/Under" weather game info how far back" (standard) — team Vegas-lines pages back to 1968
5. "pro-football-reference boxscore "Game Info" Roof Surface Weather "Vegas Line" "Over/Under" Officials" (standard) — no box-score pages
6. "Pro Football Reference Approximate Value AV snap counts since 2012 data coverage "play index" 1920 NFL season" (standard) — AV since 1960, snaps 2012, pbp 1978, lineups 1920 (snippets)
7. "sports-reference.com "terms of use" "artificial intelligence" OR "machine learning" data …" (standard) — AI clause snippet
8. "kaggle tobycrabtree nfl-scores-and-betting-data spreadspoke license updated" (standard) — HF mirror only; Kaggle API used instead
9. "NFL Big Data Bowl 2026 Kaggle competition data rules "non-commercial" tracking data winners" (standard) — winner, 2027 edition
10. "FiveThirtyEight shut down March 2025 ABC News data GitHub nfl_elo.csv archive mirror" (standard) — shutdown date, datahub mirror
11. "masseyratings.com NFL ratings composite terms of use data export 2026" (standard) — scorehelp snippet
12. "FTN DVOA database history subscription price ftnfantasy.com NFL team DVOA 1978" (standard) — irrelevant results
13. ""DVOA" FTN Fantasy historical team DVOA ratings database premium Football Outsiders acquired" (standard) — FO closure, archive years
14. "CollegeFootballData.com data coverage years games since 1869 …" — **not performed: session web-search budget exhausted**; later items were verified by direct URL fetches only
