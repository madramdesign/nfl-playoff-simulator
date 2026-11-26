# R3 — Play-by-play, advanced analytics, coaching, officiating, special teams

Research track R3 for NFL Universe. All checks were made on 2026-11-25 (UTC) from the owner's machine unless stated. "Verified" means a file, API answer or page was actually read that day. Quotes are kept under 15 words. Scores follow the brief (1–10; "~" = judgment without direct evidence).

## 1. Summary

- **nflverse PBP is the only free, current play-by-play.** It covers 2001–2026 (1999–2000 kept but no longer maintained); 2026 runs through week 11. It now has UTC wall-clock times for every play. It is not live: updates land hours after games.
- **All 2001–2026 EPA, WP and xpass values were rebuilt today.** nflfastR dev 6.0.0.9001 replaced those models. Store the model version with every number; never mix versions in a backtest.
- **FTN charting** (CC-BY-SA, 2022+) arrives in weekly batches 1.5–3 days after games. It is the only lawful free source of play action, RPO, motion, blitzers and drops. Participation (personnel, coverage, pressure) comes only after the season: there is no 2026 file, and the 2023 switch from NGS to FTN broke the formation and route codes.
- **Several nflverse datasets are scraped upstream:** NGS, PFR snaps and advanced stats (through a proxy service), ESPN QBR, officials. Fine for a credited non-commercial site, not commercially safe.
- **Stale data:** nflverse officials stop at 2026 week 1, and nfldata's referee and weather fields at week 4. Coordinators and play-callers have no structured source.
- **Commercial route:** Sportradar or SportsDataIO for live play-by-play; the FTN API for charting (about $3k–5k a year, UNVERIFIED). PFF's terms bar public use, and its enterprise arm moved to Teamworks in March 2026.

## 2. Catalog

### nflverse — play-by-play (`load_pbp`, built by nflfastR)
- Links: https://github.com/nflverse/nflverse-data/releases/tag/pbp · dictionary https://github.com/nflverse/nflreadr/blob/main/data-raw/dictionary_pbp.csv · build https://github.com/nflverse/nflverse-pbp · models https://github.com/nflverse/nflfastR (NEWS.md) · license https://github.com/nflverse/nflverse-data/blob/master/LICENSE.md
- Category · Class: play-by-play + EP/WP/CPOE/xYAC/xpass · 🔵 Public/open data (upstream raw is the NFL's own game feed, pulled by nflverse's internal scraper; not an official licence)
- Provides: 372 columns per play. They include ids (`game_id` like `2026_01_ATL_PIT`, `old_game_id` like 2026091306, `nfl_api_id` UUID, `play_id`, `drive`, `fixed_drive`, `series`, `order_sequence`) and GSIS player ids for every role (passer, rusher, receiver, tacklers, pass defenders, sacks, QB hits, kicker, punter, returners, penalty player). Also down/distance/field position/clock, `desc`, play_type and play_type_nfl, shotgun, no_huddle, qb_dropback, qb_scramble, air_yards, yards_after_catch, pass_length, pass_location, run_location, run_gap; penalties (`penalty`, `penalty_type`, `penalty_team`, `penalty_player_id`, `penalty_yards`); `replay_or_challenge` and its result; timeouts and timeout_team; all special-teams flags (touchback, punt and kickoff inside 20, in end zone, out of bounds, downed, fair catch, blocked, `kick_distance`, `return_yards`, FG and XP results); drive summaries (start and end transition, plays, time of possession, yards penalized); game context from the schedule (`spread_line`, `total_line`, `roof`, `surface`, `temp`, `wind`, `home_coach`, `away_coach`, `stadium_id`). Model outputs: `ep`, `epa`, `wp`, `vegas_wp`, `wpa`, `cp`, `cpoe`, `xyac_*`, `xpass`, `pass_oe`, `success`, `qb_epa`.
- History · Live · Latency: 1999–2026. nflfastR 6.0.0 (Sept. 18, 2026) stopped supporting 1999–2000, and those files were not rebuilt today. Not live. The update workflow (`.github/workflows/update_data.yaml`) is scheduled at 09:03 UTC daily, after Thursday night games (Fri 05:33 UTC), at 22:03 UTC Sunday and 00:07 UTC Monday, and after SNF and MNF (Mon and Tue 05:33 UTC), September–February only. Observed runs on Nov. 24–25 at varied times. `timestamp.json` read "2026-11-25 14:12:56 EST". Typical latency: hours after a game.
- Coverage: all regular-season and postseason games. 2026 file: weeks 1–11, 163 games, 28,467 rows (checked).
- Technical: files on GitHub releases · CSV, CSV.gz, Parquet, RDS (and QS for older seasons) · SDK: nflreadr (R), nflreadpy (Python, MIT), NFLData.jl · Auth: none · Rate limits: GitHub release downloads (none published for anonymous asset downloads; ~11–13 MB per season compressed) · Webhooks: none. Poll `timestamp.json`.
- Cost: free · free tier: everything · paid: none · est. monthly for a small app: $0
- Licensing: commercial: the CC-BY-4.0 grant covers nflverse's own rights only. nflreadr notes the NFL data still belongs to its owners (registry). Raw JSON comes from the `nflverse-pbp-internal` scraper ("internal package for scraping raw pbp"), not a licence from the NFL · redistribution: allowed under CC-BY-4.0 for nflverse's part · caching/storage: allowed · attribution: "nflverse" with link and licence · other: the models are MIT (nflfastR, fastrmodels).
- Quality: high and actively maintained. The 2026-11-25 build added a raw-data patch mechanism (#646) and fixed duplicated and invented plays in old games. Known quirks checked in 2026 data: declined penalties are **not** in the structured fields: on the 240 plays whose only flags were declined, `penalty` is 0 (234) or empty (6) and `penalty_type`/`penalty_yards` are empty; only `desc` says "declined". When one flag is enforced and another declined, only the enforced one is coded (42 such plays); offsetting penalties likewise; `play_clock` is "0" on every row; `st_play_type` is empty on every row; `temp`/`wind` are blank on 20,651 of 28,467 rows (the schedule's weather fields stopped after week 4; see nfldata); 2026 had 217 replay rows (143 reversed, 74 upheld), 95 of them coach challenges.
- Scores: Q 8 / Cov 9 / Rel 8 / Lat 6 / Hist 9 / Doc 9 / DX 9 / Cost 10 / Lic 6 / Com ~3 / RL 10 / NFL 10 = **8.1**
- Recommendation: PRIMARY for all historical and after-game play-level analytics (EPA, success, tendencies, special teams, penalties, coaching behaviour). Record `nflverse_timestamp` and the nflfastR version with every derived number. Get commercial clearance (or a licensed feed) before a paid product.
- Verified: 2026-11-25. Release asset list and update times; downloaded `play_by_play_2026.csv.gz` (11.4 MB) and analysed it; read the dictionary, NEWS.md, the README, the update workflow and the raw-pbp script.

### nflverse — participation (`load_participation`)
- Links: https://github.com/nflverse/nflverse-data/releases/tag/pbp_participation · dictionary https://github.com/nflverse/nflreadr/blob/main/data-raw/dictionary_participation.csv · build https://github.com/nflverse/nflverse-ftn (R/participation.R)
- Category · Class: personnel, formation, coverage, pressure · 🔵 open data. 2016–2022 originate from NFL Next Gen Stats (🔴 at origin); 2023+ come from FTN Data via its API key
- Provides: `offense_formation`, `offense_personnel`, `defense_personnel`, `defenders_in_box`, `number_of_pass_rushers`, GSIS id lists of all 22 players (`players_on_play`, `offense_players`, `defense_players`), `time_to_throw`, `was_pressure`, `route` (primary receiver only), `defense_man_zone_type`, `defense_coverage_type` (COVER_0/1/2/2_MAN/3/4/6/9/COMBO/BLOWN), plus names, positions and numbers (2023+). No per-player route trees.
- History · Live · Latency: 2016–2025. **No 2026 file.** nflreadr says 2023+ data is "provided after all post-season games are completed"; the 2025 file is dated 2026-02-10. `pbp_participation_old_2023` keeps the earlier NGS-based 2023 file.
- Coverage: all games; per-season fill differs. In 2016, coverage fields are empty on all 48,434 rows, while `time_to_throw` is filled on 19,111. In 2022, coverage is filled on 18,975 of 50,150 rows. In 2025, coverage is filled on 22,055 of 45,184 and `ngs_air_yards` is empty (by design from 2024). The first season with coverage fields lies between 2017 and 2022 (UNVERIFIED which).
- Technical: release files · CSV, Parquet, RDS · SDK: nflreadr, nflreadpy · Auth: none · Rate limits: GitHub · Webhooks: none
- Cost: free · est. monthly: $0
- Licensing: nflreadr says CC-BY-SA 4.0, credited "FTN Data via nflverse" (2023+) or "NFL NextGenStats via nflverse" (2022 and earlier). Share-alike means derived datasets we publish must carry the same licence. The NGS part inherits NFL rights (see NGS).
- Quality: **taxonomy break in 2023.** NGS formations (SHOTGUN, SINGLEBACK, EMPTY, I_FORM, PISTOL, JUMBO, WILDCAT) become FTN's three (SHOTGUN, UNDER CENTER, PISTOL). Route names change too (HITCH, FLAT, OUT, CROSS become QUICK OUT, HITCH/CURL, IN/DIG, SHALLOW CROSS/DRAG). `was_pressure` is filled on all plays in 2025 but only on dropbacks in 2022. Trends across 2022/2023 need a mapping table.
- Scores: Q 6 / Cov 7 / Rel 6 / Lat 2 / Hist 7 / Doc 7 / DX 8 / Cost 10 / Lic 6 / Com ~3 / RL 10 / NFL 9 = **6.8**
- Recommendation: SECONDARY. Use for season-level scheme profiles (personnel, coverage shells, man/zone, box counts) of completed seasons; never as a current-season feed.
- Verified: 2026-11-25. Release asset list; downloaded the 2016, 2022 and 2025 CSVs (21, 22 and 49 MB), counted values, then deleted them. Read `participation.R`, `update_ftn_participation.R` and the nflreadr `load_participation` docs.

### nflverse — FTN charting (`load_ftn_charting`)
- Links: https://github.com/nflverse/nflverse-data/releases/tag/ftn_charting · dictionary https://github.com/nflverse/nflreadr/blob/main/data-raw/dictionary_ftn_charting.csv · ingest https://github.com/nflverse/nflverse-ftn · docs https://nflreadr.nflverse.com/reference/load_ftn_charting.html
- Category · Class: manual play charting · 🔵 open data licensed by FTN (CC-BY-SA 4.0)
- Provides: per play: `starting_hash`, `qb_location` (U/S/P), `n_offense_backfield`, `n_defense_box`, `is_no_huddle`, `is_motion`, `is_play_action`, `is_screen_pass`, `is_rpo`, `is_trick_play`, `is_qb_out_of_pocket`, `is_interception_worthy`, `is_throw_away`, `read_thrown` (0/1/2/CHK/DES/SD), `is_catchable_ball`, `is_contested_ball`, `is_created_reception`, `is_drop`, `is_qb_sneak`, `n_blitzers`, `n_pass_rushers`, `is_qb_fault_sack`, `date_pulled`; joined by `nflverse_game_id` and `nflverse_play_id` (= GSIS play id).
- History · Live · Latency: 2022–2026 (2022 lacks the "0" primary-read code). The job polls FTN every 6 hours (`update_ftn.yaml`, cron `0 */6 * 9-12,1-2 *`). Weeks land as batches: week 9 pulled 2026-11-12 00:01Z, week 10 on 11-18 18:01Z, week 11 on 11-25 12:01Z, i.e. about 36–72 h after the week's Monday game. nflreadr says "charted within 48 hours following each game".
- Coverage: all games; 2026 weeks 1–11, 27,636 rows, 163 games.
- Technical: release files · CSV/Parquet/RDS · Auth: none
- Cost: free · est. monthly $0
- Licensing: commercial: CC-BY-SA allows it with share-alike · redistribution: yes, same licence · attribution: nflreadr asks for "FTN Data via nflverse" (the loader message says "ftndata.com via nflverse") · other: only "a subset" of FTN's charting.
- Quality: good, with some code noise. `n_blitzers` has one value of 52; `qb_location` and `starting_hash` use "0" on about 6,770 rows (non-dropback or special-teams plays); `read_thrown` "0" means both "first read" and many non-passes, so filter to pass plays first.
- Scores: Q 7 / Cov 8 / Rel 8 / Lat 5 / Hist 5 / Doc 8 / DX 9 / Cost 10 / Lic 7 / Com ~5 / RL 10 / NFL 9 = **7.6**
- Recommendation: PRIMARY for play-action, RPO, motion, screen, no-huddle, blitz, drop, catchable-ball and QB-out-of-pocket rates. Show "FTN Data via nflverse" and the CC-BY-SA notice on every view that uses it.
- Verified: 2026-11-25. Downloaded `ftn_charting_2026.csv` (4.7 MB), counted weeks and `date_pulled`; read the dictionary, the loader docs and the workflow crons.

### FTN Data — Charting API (commercial)
- Links: https://ftnfantasy.com/stats/sports-data (refused, 403) · https://ftndata.com/pricing (302 to the former) · API spec https://charting.ftntools.com/api/openapi.json · terms: not reachable
- Category · Class: charting, participation, analytics (NFL and NBA) · 🟡 licensed/commercial
- Provides (from the public OpenAPI spec, 146 paths): `/api/nfl/charting/event/{event_id}` (also `/participation`, `/participation/matchups`, `/participation/advanced_stats`); `/api/nfl/pbp/event/{event_id}`; season stats; `/api/nfl/analytics/{passing|receiving|rushing|coverage|pass_rush|pass_protection|rush_defense|team_offense|team_defense}/stats/season/{season}`; `/api/play_matching/`; `/api/events/by_charting_status` (`is_charted`, `is_running`); participant lookups by `sr_participant_id` (a Sportradar id crosswalk).
- History · Live · Latency: search snippets of FTN's pricing page say charting goes back to 2019 (UNVERIFIED). Latency is not published. The `is_running` filter suggests in-game status (inference).
- Coverage: NFL, plus NBA endpoints.
- Technical: REST/JSON · Auth: API key as query parameter `key` (`UserAuthQuery`) · Rate limits: not published · Pagination: `limit`/`offset`
- Cost: search-engine snippets of FTN's FAQ say from "$5,000 annually for commercial" and "$3,000 annually for private" use. The pricing page snippet lists a $5,000 API tier, a $599 CSV tier and enterprise. **UNVERIFIED first-hand** (403).
- Licensing: a snippet of FTN's FAQ says partners may display the charting metrics and derivatives (UNVERIFIED). The terms were not read.
- Quality: same charting team as the nflverse subset (inference); not tested.
- Scores: Q ~8 / Cov ~8 / Rel ~7 / Lat ~6 / Hist ~6 / Doc 7 / DX 7 / Cost 3 / Lic ~6 / Com ~7 / RL ~5 / NFL 9 = **6.6**
- Recommendation: OPTIONAL now; PRIMARY candidate for charting in a commercial product. Get the written terms and price by email first.
- Verified: 2026-11-25. OpenAPI spec read (200). Pricing and terms pages refused automated access (403); prices only via search snippets.

### NFL Next Gen Stats — statboard aggregates (via nflverse `load_nextgen_stats`)
- Links: https://nextgenstats.nfl.com · mirror https://github.com/nflverse/nflverse-data/releases/tag/nextgen_stats · scraper https://github.com/nflverse/ngs-data (MIT code) · NFL terms https://www.nfl.com/legal/terms/
- Category · Class: tracking-derived player aggregates · 🟢 official numbers, but collected by 🔴 scraping (`nextgenstats.nfl.com/api/statboard/{type}?season=..&week=..` in `ngs-data/R/ngs_functions.R`)
- Provides: passing (avg_time_to_throw, intended and completed air yards, aggressiveness, air yards to sticks, expected completion %, CPOE); receiving (avg_cushion, avg_separation, share of intended air yards, YAC above expectation); rushing (efficiency, % of attempts against 8+ box, time to LOS, expected rush yards, RYOE). Week 0 = season totals.
- History · Live · Latency: 2016–2026; 2026 weeks 0–11. nflreadr: "the current season's data updates every night".
- Coverage: only players above NGS minimums (the passing file has about 600 player-weeks a season).
- Technical: release files (CSV.gz, Parquet, RDS) · no auth
- Cost: free
- Licensing: nflverse's CC-BY-4.0 cannot license NFL data. NFL Terms (updated May 16, 2024) §1.3 bars "Systematic retrieval of data or other content" without written consent, and bar commercial use. nextgenstats.nfl.com robots.txt allows all paths, but robots is not permission. Whether the NFL terms page covers the NGS site is not stated (UNVERIFIED).
- Quality: official tracking-based numbers; aggregates only, no per-play tracking.
- Scores: Q 8 / Cov 5 / Rel 7 / Lat 6 / Hist 7 / Doc 7 / DX 9 / Cost 10 / Lic 3 / Com 1 / RL 10 / NFL 8 = **6.8**
- Recommendation: SECONDARY (non-commercial only, credited "NFL Next Gen Stats via nflverse"). Not for a commercial product without an NFL or Genius licence.
- Verified: 2026-11-25. Downloaded `ngs_passing.csv.gz`; seasons 2016–2026 and 2026 weeks confirmed; scraper URL found by `gh search code`; NFL terms read; NGS robots.txt read.

### Pro Football Reference via nflverse — advanced stats and snap counts (`load_pfr_advstats`, `load_snap_counts`)
- Links: https://github.com/nflverse/nflverse-data/releases/tag/pfr_advstats · .../snap_counts · scraper https://github.com/nflverse/nflverse-pfr (GPL-3.0 code) · SR data policy https://www.sports-reference.com/data_use.html
- Category · Class: charted player stats, snaps · 🔴 scraping (nflverse-pfr calls `undercover::scrapeops_request`, a proxy-scraping service, against pro-football-reference.com)
- Provides: weekly pass (drops, bad throws, times blitzed, hurried, hit, pressured, pressure %), rush and rec (YBC, YAC, broken tackles; full columns not listed here), def (targets, completions allowed, passer rating allowed, aDOT, YAC allowed, blitzes, hurries, QB hits, pressures, missed tackles, missed tackle %). Season-level pass adds pocket time, RPO and play-action splits. Snap counts: offense, defense and special-teams snaps and % per player per game.
- History · Live · Latency: advanced stats 2018–2026 (weekly files 2018+; nflreadr's pass loader says 2019); snaps 2012–2026, but the 2012 file is only 4.5 KB (near empty, UNVERIFIED content). Both cover 2026 weeks 1–11. Per a search snippet of PFR's about page, PFR's charting is "updated by 6pm on the Tuesday" after games (UNVERIFIED first-hand; page 403).
- Coverage: players with charted events.
- Technical: release files · no auth
- Cost: free
- Licensing: PFR's advanced stats are Sportradar charting (SR blog, Sept. 2019: stats "provided by Sportradar"). The SR data-use page bars scraping without "express written permission", competing databases, redistribution and AI use. The direct site sits behind a Cloudflare managed challenge (403 to curl, not bypassed).
- Quality: useful, but two hops from the source (Sportradar → PFR → proxy scrape) and fragile.
- Scores: Q 7 / Cov 7 / Rel 6 / Lat 5 / Hist 6 / Doc 7 / DX 9 / Cost 10 / Lic 2 / Com 1 / RL 10 / NFL 8 = **6.5**
- Recommendation: OPTIONAL (owner decision; non-commercial only). Prefer FTN charting for pressures and blitzes and our own snap shares from participation where possible. AVOID for commercial use.
- Verified: 2026-11-25. Downloaded the 2026 weekly pass and def files and the 2026 snap file; read the code-search hits for `scrapeops_request`; read the SR data-use and bot-traffic pages; PFR pages returned 403.

### ESPN QBR via nflverse (`load_espn_qbr`)
- Links: https://github.com/nflverse/nflverse-data/releases/tag/espn_data · scraper https://github.com/nflverse/espnscrapeR-data (no licence)
- Category · Class: QB rating model · 🔴 scraping of ESPN
- Provides: `qbr_total`, `pts_added`, `epa_total`, pass, run, sack, penalty components, `qb_plays`, per week and season.
- History · Live · Latency: 2006–2026 (2026 weeks 1–11); files updated 2026-11-25 18:55Z.
- Coverage: qualifying QBs.
- Technical: release files · no auth · Cost: free
- Licensing: Disney Terms of Use bar automated access (registry, DEC-006).
- Quality: ESPN's proprietary model; useful as a second opinion against our own QB EPA.
- Scores: Q 7 / Cov 6 / Rel 7 / Lat 6 / Hist 8 / Doc 6 / DX 9 / Cost 10 / Lic 2 / Com 1 / RL 10 / NFL 6 = **6.5**
- Recommendation: OPTIONAL (owner decision, same status as other ESPN data). Never in a commercial product.
- Verified: 2026-11-25. Downloaded `qbr_week_level.csv.gz`; columns and seasons listed.

### nflverse — officials (`load_officials`)
- Links: https://github.com/nflverse/nflverse-data/releases/tag/officials · builder https://github.com/nflverse/nflverse-rosters/blob/main/exec/update_officials.R
- Category · Class: game officiating crews · 🔴 scraping (`ngsscrapR::scrape_officials` against NGS)
- Provides: `game_id`, `game_key`, `official_name`, `position` (Referee, Umpire, Down Judge/Head Linesman, Line Judge, Field Judge, Side Judge, Back Judge, Replay Official, alternates), `jersey_number`, `official_id`, season, week.
- History · Live · Latency: 2015–2026, **but 2026 = week 1 only** (112 rows). The workflow failed daily from Sept. 7 to 14, 2026. Commit `ecc6ef1` (Sept. 15) disabled the schedule because "the endpoint keeps rejecting the requests".
- Coverage: 230 distinct officials since 2015; complete crews for 2015–2025.
- Technical: one file (CSV 1.3 MB) · no auth · Cost: free
- Licensing: CC-BY label; the upstream is NGS (NFL terms).
- Quality: good history, dead for the current season.
- Scores: Q 7 / Cov 6 / Rel 2 / Lat 1 / Hist 7 / Doc 6 / DX 9 / Cost 10 / Lic 3 / Com 1 / RL 10 / NFL 7 = **5.8**
- Recommendation: SECONDARY for history (2015–2025 crews). Not usable for 2026 until nflverse revives it.
- Verified: 2026-11-25. Downloaded `officials.csv` and counted by season and week; read the builder script, workflow run list and commit history.

### nflverse — schedules / nfldata `games.csv` (coaches, referee, venue)
- Links: https://github.com/nflverse/nfldata/blob/master/data/games.csv · dictionary https://github.com/nflverse/nflreadr/blob/main/data-raw/dictionary_schedules.csv
- Category · Class: game metadata, head coaches, referee · 🔵 open data (no licence file; facts). Coach, referee, weather and surface fields come from PFR per the dictionary
- Provides: `home_coach`, `away_coach`, `referee` (head official only), `roof`, `surface`, `temp`, `wind`, `stadium_id`, provider game ids (`gsis`, `nfl_detail_id`, `pfr`, `pff`, `espn`, `ftn`), lines, rest days, starting QBs.
- History · Live · Latency: 1999–2026. The file is committed about every 10 minutes ("Automated data update", 22:45Z on Nov. 25). Coaches are pre-filled for future games (all 32 for 2026). **The 2026 `referee` and `surface` fields are filled only through week 4 (one game in week 5), and `temp` only through week 4.**
- Coverage: all games. 2026 `ftn` ids on all 272 games; `pff` ids on 120.
- Technical: one CSV over raw.githubusercontent.com · no auth · Cost: free
- Licensing: no licence file (registry: use with credit). The PFR-derived columns carry SR's restrictions on scraped data (inference).
- Quality: coach names reliable for the season start. Mid-season interim changes need checking (not tested). Referee and weather fields stale.
- Scores: Q 7 / Cov 8 / Rel 6 / Lat 7 / Hist 9 / Doc 8 / DX 10 / Cost 10 / Lic 6 / Com ~5 / RL 10 / NFL 9 = **7.9**
- Recommendation: PRIMARY for head coach per game (Coach → Team → Game link) and the provider-id crosswalk. SECONDARY for referee (stale in 2026).
- Verified: 2026-11-25. Downloaded `games.csv` (2.2 MB); field fill counted by season and week; latest commits read.

### nflverse models — nflfastR (EP, WP, CP, xYAC, xpass), fastrmodels, nfl4th
- Links: https://github.com/nflverse/nflfastR · https://github.com/nflverse/fastrmodels · https://github.com/nflverse/nfl4th · write-up https://www.opensourcefootball.com/posts/2020-09-28-nflfastr-ep-wp-and-cp-models/ (pre-rebuild)
- Category · Class: open models (code) · 🔵 open source, MIT
- Provides: EP and next-score probabilities; WP with and without the line, plus a new overtime WP model; CP and CPOE; xYAC (mean, median, success, first-down probability); xpass and pass_oe (now game situation only); a field-goal model (replaced in dev "built like nfl4th's"); nfl4th go, punt and FG decision values (go model "fit on 3rd and 4th downs since 2001").
- History · Live · Latency: models apply to any play, so they can be computed live by us. nflfastR 6.0.0 released Sept. 18, 2026; dev 6.0.0.9001 (Nov. 25) rebuilt EP (#644, #618/#625), regulation vegas_wp (#561/#625), overtime WP (#617) and xpass (#636). NEWS quantifies the change: a play's EPA moves 0.08 on average, `success` changes on 3% of plays, and `vegas_wp` moves 1.7 points on average.
- Coverage: NFL 2001+ (1999–2000 unsupported since 6.0.0).
- Technical: R packages; models stored as data; a JS port exists (ZachRit/nfl4th-js, MIT, single commit; FEATURE_RESEARCH) · Auth: none
- Cost: free
- Licensing: MIT + file LICENSE (DESCRIPTION files of nflfastR 6.0.0.9001, fastrmodels 2.1.0, nfl4th 1.0.7.9002). Copying model weights needs the MIT notice.
- Quality: well documented and actively validated. Numbers change between versions, so pin a version.
- Scores: Q 8 / Cov 8 / Rel 7 / Lat ~7 / Hist 9 / Doc 8 / DX 4 / Cost 10 / Lic 9 / Com 9 / RL 10 / NFL 10 = **8.3**
- Recommendation: PRIMARY reference for EP, WP and 4th-down logic (port or refit with a backtest, per the house rule). Do not mix EPA from different versions.
- Verified: 2026-11-25. Read NEWS.md, README, DESCRIPTION, commits and releases; read the nfl4th README and DESCRIPTION.

### PFF — PFF+ / PFF Pro and the PFF Developer API (consumer)
- Links: https://www.pff.com/subscribe · https://developer.pff.com/ · spec https://developer.pff.com/openapi.json · terms https://www.pff.com/terms
- Category · Class: grades, charted advanced stats · 🟡 licensed (consumer subscription)
- Provides: player grades; "Premium Stats Pro" reports by player and league. They include passing by concept, depth and pressure; time in pocket; pass-blocking efficiency; pressure allowed; pass rush; run defense; coverage, coverage scheme and coverage matchup; slot coverage; receiving versus coverage and scheme; rushing by direction; snaps by position; field goals, kickoffs, punting, returns. Spec v2.1.0: 59 `/v1` operations mirroring the Premium Stats API, plus `/v2` team pages.
- History · Live · Latency: seasons per `/v1/leagues` (not read; UNVERIFIED). Latency not stated.
- Coverage: NFL and college.
- Technical: REST/JSON and CSV export at `https://api.pff.com` · Auth: OAuth through the PFF account, or a bearer API key (`ak_…`) from pff.com/account/api-keys · Rate limits: per-account read and export budgets per minute (numbers not published; `x-ratelimit-*` headers, 429 `rate_limited`) · every response `cache-control: no-store`
- Cost: PFF+ $9.99/month (no Premium Stats, no API); $99.99/year (Premium Stats, no API); **PFF Pro $199.99/year (Premium Stats Pro and API access)**.
- Licensing: Terms (last updated Oct. 12, 2026). §1.2: "solely for your own personal, non-commercial use". §14.4(8) bars republishing API data "(including grades, rankings, or statistics)". §14.4(2)–(3) bar public distribution and resale. §14.4(5) allows caching only during an active subscription, and §14.11 requires deletion after it. §1.6 bars giving PFF data to AI models. §14.2(3) covers derived data even when the source is unrecognisable.
- Quality: PFF-only data: grades, PFF-charted pressures (per rusher and per blocker), pass-blocking efficiency, coverage grades and targeted-in-coverage stats, run-stop, and hang time for special teams (PFF and NGS only).
- Scores: Q 9 / Cov 9 / Rel ~7 / Lat ~5 / Hist ~7 / Doc 8 / DX 7 / Cost 6 / Lic 1 / Com 1 / RL ~6 / NFL 10 = **6.3**
- Recommendation: AVOID for NFL Universe: no public display, no derived metrics, no AI use. The owner could read it privately; nothing may reach the page or the assistant.
- Verified: 2026-11-25. Subscribe page (prices), developer page, OpenAPI spec (servers, security, paths) and terms all read.

### PFF enterprise data — now Teamworks
- Links: https://teamworks.com/blog/teamworks-acquires-pff-enterprise/ · https://b2b.pff.com (301 to teamworks.com)
- Category · Class: B2B event data and grades · 🟡 licensed/commercial
- Provides: "proprietary game event data and analytics platform" (Teamworks, Mar. 30, 2026); details not public.
- History · Live · Latency: UNVERIFIED.
- Coverage: NFL and college (clients: NFL teams, college programs).
- Technical: not public.
- Cost: contact sales (no prices published).
- Licensing: negotiated. The consumer PFF business stayed independent.
- Quality: industry standard (judgment).
- Scores: Q 9 / Cov 9 / Rel ~8 / Lat ~7 / Hist ~8 / Doc 3 / DX ~4 / Cost 1 / Lic ~5 / Com ~7 / RL ~7 / NFL 10 = **6.5**
- Recommendation: OPTIONAL, only for a funded commercial phase. Note the March 2026 change of hands.
- Verified: 2026-11-25. Teamworks release read; b2b.pff.com redirect observed.

### Sports Info Solutions (SIS) — DataHub / API
- Links: https://www.sportsinfosolutions.com/ · https://pro.sisdatahub.com/Home/FAQ · sales: sales@sportsinfosolutions.com (per FAQ)
- Category · Class: charting (pressures, coverage, broken tackles, Total Points, SIS-WAR) · 🟡 licensed
- Provides: charted NFL and FBS data; leaderboards with CSV download in Pro.
- History · Live · Latency: not stated on the pages read (UNVERIFIED).
- Coverage: NFL and FBS.
- Technical: web app with CSV downloads; API "similar to the one that powers DataHub" via sales.
- Cost: DataHub Pro NFL $99.99/month or $749.99/year (FAQ). Trial returns top-20 leaderboards. API price via sales.
- Licensing: SIS's own terms were not found (UNVERIFIED). A third-party licensee's terms require crediting "Statistical Data provided by Sports Info Solutions" (search snippet only).
- Quality: professional charting used by NFL teams (judgment).
- Scores: Q 8 / Cov 8 / Rel ~7 / Lat ~5 / Hist ~6 / Doc 5 / DX 4 / Cost 5 / Lic ~2 / Com ~3 / RL ~5 / NFL 9 = **5.6**
- Recommendation: OPTIONAL (commercial phase; ask for terms). Not usable now.
- Verified: 2026-11-25. Home page and FAQ read; terms not found.

### Pro Football Reference / Stathead (direct)
- Links: https://www.pro-football-reference.com · https://www.sports-reference.com/data_use.html · https://www.sports-reference.com/bot-traffic.html
- Category · Class: historical stats, coaches and coordinators per team-season, referee per game, penalties, advanced stats (Sportradar) · 🔴 for any automated use
- Provides: the deepest public history (pre-1999 box scores), coach pages, team staff.
- History · Live · Latency: decades. Advanced stats from 2018.
- Coverage: complete.
- Technical: HTML only · Auth: Stathead subscription for queries · Rate limits: bot page, "more often than twenty requests in a minute" leads to "jail for up to a day" (10 a minute for Stathead and FBref). Curl from this machine got a Cloudflare managed challenge (403).
- Cost: Stathead pricing not read (UNVERIFIED). Custom data requests have "a minimum of $5,000".
- Licensing: facts reusable. Automated access barred without "express written permission". No competing databases, no tools based on scraped data, no AI use. Some licensed datasets "completely preclude any redistribution".
- Quality: excellent reference.
- Scores: Q 8 / Cov 9 / Rel 7 / Lat 5 / Hist 10 / Doc 7 / DX 2 / Cost ~6 / Lic 2 / Com 1 / RL 2 / NFL 9 = **5.7**
- Recommendation: AVOID automated access. Link out for coaching staffs and historical context; a person may look up facts by hand and restate them with a link.
- Verified: 2026-11-25. Data-use and bot-traffic pages read; PFR pages 403 (Cloudflare challenge, not bypassed).

### Sportradar — NFL API v7 (REST + push)
- Links: https://developer.sportradar.com/football/reference/nfl-overview · FAQ https://developer.sportradar.com/football/reference/nfl-faq · push https://developer.sportradar.com/football/docs/nfl-ig-push · account https://developer.sportradar.com/getting-started/docs/your-account · terms https://developer.sportradar.com/terms-and-conditions (not read)
- Category · Class: official live PBP and stats · 🟡 licensed (official NFL data provider)
- Provides: game play-by-play with drive `id` and `sequence`, play `id`, `wall_clock` (UTC). Sample play fields include `men_in_box`, `players_rushed`, `blitz`, `qb_at_snap`, `huddle` and tight-end counts. Subjective stats (QB hurry, defender blitz) arrive "the following Tuesday by 6:00 PM ET". Also game statistics, boxscore, seasons, transactions (from 2002), push feeds.
- History · Live · Latency: historical regular season and postseason from 2000, preseason from 2015 (doc page per search result; 2000–2020 partly sourced from the NFL, all data collected by Sportradar operators from 2021). Live: push "as it is entered", ahead of the TV picture (no number published). Push is a long-lived HTTP stream of one JSON object per line, heartbeat every 5,000 ms, resume within 10 minutes with up to 5,000 messages or 30 s replayed. Status `complete` then `closed` (stats validated).
- Coverage: all NFL games, including preseason.
- Technical: REST/JSON (and XML historically) `https://api.sportradar.com/nfl/official/{access_level}/v7/{lang}/...` · push streams · Auth: API key · Trial: "1,000 requests (quota) per rolling 30 days", 1 QPS, 30 days. "Production access is reserved for Sportradar customers".
- Cost: not published; contact sales@sportradar.com.
- Licensing: per contract (terms page not read; UNVERIFIED).
- Quality: official-grade and very complete (it is also PFR's advanced-stat source).
- Scores: Q 9 / Cov 10 / Rel 9 / Lat 9 / Hist 8 / Doc 9 / DX 8 / Cost 2 / Lic ~6 / Com 9 / RL ~5 / NFL 10 = **7.8**
- Recommendation: PRIMARY candidate for a commercial live game center (play ids, drive ids, GSIS-mappable player ids, wall clock). The trial is for evaluation; don't build the free site on it.
- Verified: 2026-11-25. Overview, FAQ (first 100k characters), push guide and account page read. Historical-coverage figures came via a search result about the historical-data page (not opened; partly UNVERIFIED).

### SportsDataIO — NFL API
- Links: https://sportsdata.io/nfl-api · https://sportsdata.io/free-trial · https://sportsdata.io/help/data-rights-and-licensing-questions
- Category · Class: live scores, PBP, stats, odds · 🟡 licensed
- Provides: schedules, game state, box scores, play-by-play, player and team stats (endpoint field list not read).
- History · Live · Latency: live; latency not published (UNVERIFIED).
- Coverage: NFL and others.
- Technical: REST/JSON · key · the free trial is "scrambled" data · Replay product with recorded feeds.
- Cost: production "only available as part of a commercial licensing discussion". Discovery Lab: free last-season data plus paid personal packages, "licensed for personal, non-commercial use only".
- Licensing: commercial licences allow storage and display. Reselling "the feed itself as a standalone data product is not permitted". Attribution required. Personal plans cannot power public-facing products.
- Quality: widely used (judgment). Announced an exclusive stats and odds relationship with PFF's site (search title only, UNVERIFIED).
- Scores: Q ~8 / Cov 9 / Rel ~8 / Lat ~7 / Hist ~7 / Doc 8 / DX 8 / Cost 3 / Lic 6 / Com 8 / RL ~6 / NFL 9 = **7.3**
- Recommendation: SECONDARY (commercial alternative to Sportradar). Discovery Lab is personal-only, so not for the public page.
- Verified: 2026-11-25. Free-trial and data-rights pages read.

### Genius Sports — NFL official data distributor
- Links: https://www.nfl.com/news/nfl-extends-strategic-partnership-with-genius-sports
- Category · Class: official real-time PBP, NGS data, official betting feed · 🟡 licensed (exclusive)
- Provides: per NFL.com, Genius is the "exclusive distributor of real-time, official play-by-play statistics", NGS data and the betting feed to media and sportsbooks.
- History · Live · Latency: real time (no figures).
- Coverage: NFL.
- Technical: not public.
- Cost: enterprise only.
- Licensing: enterprise. The NFL article says the deal runs "through the end of the 2027-28 season" (publication date not shown on the page; later 2025–2026 expansions reported by press, UNVERIFIED).
- Quality: the official source.
- Scores: Q ~10 / Cov 10 / Rel ~9 / Lat ~10 / Hist ~7 / Doc 2 / DX ~3 / Cost 1 / Lic ~5 / Com 9 / RL ~7 / NFL 10 = **6.9**
- Recommendation: OPTIONAL. Relevant only for a funded media or betting product; it also explains why no official free NGS or PBP API exists.
- Verified: 2026-11-25. NFL.com article read; the BusinessWire 2025 release returned 403.

### ESPN — game summary and core play-by-play (local only)
- Links: `site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=<id>` · terms: Disney ToU (registry)
- Category · Class: near-live PBP and WP · 🟠 unofficial (Disney ToU bars automated access; DEC-006 keeps it on the owner's machine)
- Provides: drives (`id`, start, end, result, plays), plays (`id`, `sequenceNumber`, `wallclock` UTC, `modified`, `type`, `text`, `clock`, `period`, `start` and `end` down/distance/yardline, `isPenalty`, `scoringPlay`, `statYardage`, `teamParticipants`), win probability by `playId`. Player participants are in the core API (not checked today).
- History · Live · Latency: live (seconds; the registry polls the scoreboard every 15 s). Event 401873078 (CIN at WAS, Nov. 23): 20 drives, 182 WP points.
- Coverage: all games.
- Technical: REST/JSON, no auth, no published limits.
- Cost: free.
- Licensing: Disney ToU §2.B(x) bars robots and scripts (registry).
- Quality: good and fast; schema unofficial and can change.
- Scores: Q 8 / Cov 9 / Rel 7 / Lat 9 / Hist ~6 / Doc 3 / DX 7 / Cost 10 / Lic 1 / Com 1 / RL ~6 / NFL 9 = **6.3**
- Recommendation: SECONDARY, local-only live PBP (as today). Never published raw and never in a commercial build. ESPN FPI and the pass-rush and run-stop win rates have no lawful API.
- Verified: 2026-11-25. One scoreboard and one summary request (existence and shape check).

### NFL GameCenter legacy JSON feed (nflgame era)
- Links: `www.nfl.com/liveupdate/game-center/<id>/<id>_gtd.json`, `www.nfl.com/liveupdate/scores/scores.json`, `feeds.nfl.com/feeds-rs/scores.json`
- Category · Class: legacy live PBP · ⚫ retired
- Provides: nothing now. Both liveupdate URLs answer 301 to the nfl.com home page; feeds.nfl.com answers 403.
- History · Live · Latency: n/a
- Coverage: n/a
- Technical: n/a · Cost: n/a
- Licensing: NFL Terms §1.3 (systematic retrieval barred).
- Quality: dead.
- Scores: Q ~3 / Cov 1 / Rel 1 / Lat 1 / Hist 1 / Doc 2 / DX 1 / Cost 10 / Lic 1 / Com 1 / RL 1 / NFL 1 = **2.0**
- Recommendation: AVOID (confirms GITHUB_RESEARCH's "Avoid" for nflgame).
- Verified: 2026-11-25. Three curl probes.

### NFL Big Data Bowl tracking data (Kaggle)
- Links: https://operations.nfl.com/the-game/big-data-bowl (search result) · terms page https://operations.nfl.com/the-game/big-data-bowl/terms-and-conditions (404 today)
- Category · Class: player tracking samples (NGS) · 🟢 official, competition-licensed
- Provides: per-frame player tracking for a subset of games, used for separation, coverage, tackling and route studies.
- History · Live · Latency: one partial season per competition; no live data.
- Coverage: subset.
- Technical: CSV on Kaggle (not opened).
- Cost: free with a Kaggle account (account creation not done).
- Licensing: **UNVERIFIED**: the terms page was 404 and Kaggle rules were not read.
- Quality: the only public tracking data.
- Scores: Q 10 / Cov 3 / Rel 8 / Lat 1 / Hist 4 / Doc 7 / DX 6 / Cost 10 / Lic ~2 / Com ~1 / RL 10 / NFL 9 = **5.9**
- Recommendation: OPTIONAL, research only, after reading the competition rules. Not a product data source.
- Verified: UNVERIFIED (terms page 404; Kaggle not accessed).

### TruMedia Networks — football platform
- Links: https://trumedianetworks.com/football (search result)
- Category · Class: analytics platform and API merging PBP, charting and tracking · 🟡 licensed
- Provides: per search result, an enterprise query and visualisation tool and an API that merges datasets including tracking.
- History · Live · Latency: UNVERIFIED.
- Coverage: NFL.
- Technical: API (details not public).
- Cost: contact info@trumedianetworks.com (search snippet).
- Licensing: UNVERIFIED.
- Quality: enterprise (judgment).
- Scores: Q ~8 / Cov ~8 / Rel ~8 / Lat ~7 / Hist ~7 / Doc 2 / DX ~4 / Cost 1 / Lic ~5 / Com ~7 / RL ~6 / NFL 9 = **6.0**
- Recommendation: OPTIONAL (enterprise only).
- Verified: UNVERIFIED (search snippets only; the site was not opened because of the search budget).

### SumerSports — free stats site
- Links: https://sumersports.com/features/stats/ · terms https://sumersports.com/terms-of-service/
- Category · Class: free advanced stats (play-level filters) · 🟠 public website (no data access offered)
- Provides: player and team advanced metrics on the web (source not stated in the terms).
- History · Live · Latency: UNVERIFIED.
- Coverage: NFL.
- Technical: website only; no API or export found.
- Cost: free to view.
- Licensing: terms effective May 19, 2025. §7 item 9 bars using any means "to access, retrieve, copy, scrape, or index" the platform. §3(c) bars copying, publishing, distributing or making derivative works of Sumer content. §7 item 4 bars commercial purposes.
- Quality: reputable analysts (judgment).
- Scores: Q ~8 / Cov 7 / Rel ~7 / Lat ~5 / Hist ~5 / Doc 2 / DX 1 / Cost 10 / Lic 1 / Com 1 / RL 1 / NFL 8 = **4.7**
- Recommendation: AVOID as a data source; link out only.
- Verified: 2026-11-25. Terms read.

### Sharp Football Analysis — stats and subscriptions
- Links: https://www.sharpfootballanalysis.com/terms-of-service/
- Category · Class: betting-oriented analytics and tendencies · 🟠 public/paid website
- Provides: team tendency and situational stats (not inspected).
- History · Live · Latency: UNVERIFIED.
- Coverage: NFL.
- Technical: website only.
- Cost: season "All-Access" subscriptions (price not read).
- Licensing: terms bar "any automatic device, process, or means to access" and creating derivative works or distributing content; personal, non-commercial use. The data source is not disclosed.
- Quality: UNVERIFIED.
- Scores: Q ~7 / Cov 6 / Rel ~6 / Lat ~5 / Hist ~5 / Doc 2 / DX 1 / Cost 5 / Lic 1 / Com 1 / RL 1 / NFL 7 = **3.9**
- Recommendation: AVOID as a data source. Compute the same tendencies from nflverse PBP and FTN.
- Verified: 2026-11-25. Terms read.

### rbsdm.com (Ben Baldwin) — EPA/CPOE leaderboards and 4th-down calculator
- Links: https://rbsdm.com · https://rbsdm.com/stats/fourth_calculator/ (linked from the nfl4th README)
- Category · Class: derived analytics site built on nflfastR · 🟠 public website
- Provides: EPA, CPOE and success leaderboards and team tiers; the 4th-down calculator (nfl4th).
- History · Live · Latency: UNVERIFIED (JavaScript app; nothing readable without running it).
- Coverage: NFL.
- Technical: single-page JavaScript app; no documented API.
- Cost: free.
- Licensing: no terms found (UNVERIFIED). The underlying code (nfl4th, nflfastR) is MIT.
- Quality: the reference implementation of public EPA metrics (judgment).
- Scores: Q 8 / Cov 7 / Rel ~6 / Lat 6 / Hist 8 / Doc 3 / DX 2 / Cost 10 / Lic ~3 / Com 2 / RL ~3 / NFL 8 = **5.5**
- Recommendation: OPTIONAL as a validation target. Compare our EPA/play and CPOE leaderboards against it by hand, and compute everything ourselves from nflverse.
- Verified: 2026-11-25. Home page fetched (SPA shell only).

### nfelo / nfeloapp
- Links: https://www.nfeloapp.com/ · https://github.com/greerreNFL/nfelo (licence)
- Category · Class: Elo ratings, QB values, EPA tiers, team tendencies, head-coach ATS · 🔵 open outputs
- Provides: per the site, ratings, QB Elo and EPA, team tendencies, HFA tracker, a model backtest "back to 2009"; "powered by the nflfastR dataset".
- History · Live · Latency: 2009+ backtests; weekly (registry).
- Coverage: NFL.
- Technical: CSVs on GitHub (already used: `qb_elos.csv`).
- Cost: free.
- Licensing: outputs may be republished; no right to run, import or modify the code.
- Quality: well regarded (judgment).
- Scores: Q 7 / Cov 7 / Rel 7 / Lat 6 / Hist 8 / Doc 6 / DX 7 / Cost 10 / Lic 6 / Com ~5 / RL 10 / NFL 9 = **7.3**
- Recommendation: SECONDARY (already in use for QB values). Its "team tendencies" is a useful cross-check for ours.
- Verified: 2026-11-25. Site page and LICENSE read.

### nflpenalties.com
- Links: https://www.nflpenalties.com (robots: `Allow: /`)
- Category · Class: penalty and referee-crew stats · 🟠 unofficial website, source undisclosed
- Provides: penalties by team, player, referee crew, type and down; "Data From 2009-2026" (home page title).
- History · Live · Latency: 2009–2026; update timing UNVERIFIED.
- Coverage: NFL.
- Technical: HTML only.
- Cost: free.
- Licensing: no terms or data-source statement found on the home page (UNVERIFIED). Robots allows crawling, which is not permission to reuse.
- Quality: commonly cited (a Harvard Sports Analysis article scraped it, per search result).
- Scores: Q ~6 / Cov 7 / Rel ~5 / Lat ~5 / Hist 7 / Doc 2 / DX 2 / Cost 10 / Lic 1 / Com 1 / RL ~5 / NFL 7 = **4.8**
- Recommendation: AVOID as a source. Compute penalties per crew from nflverse PBP plus a crew table, parsing `desc` for declined and offsetting flags.
- Verified: 2026-11-25. Home page and robots.txt fetched.

### Football Zebras — crews and weekly referee assignments
- Links: https://www.footballzebras.com/2026/08/officiating-crews-for-the-2026-season/ (weekly posts such as /2025/11/week-12-referee-assignments-2025)
- Category · Class: officiating news and crew rosters · 🟠 independent publication
- Provides: 2026 crews ("121 officials are assigned to 17 crews with 2 swing officials", published Aug. 1, 2026); per crew: position, number, name, years, previous crew, college, occupation. Weekly referee-to-game assignments.
- History · Live · Latency: crew posts every season; weekly assignment posts (2026 weekly posts not confirmed in search; 2025 seen). Timing UNVERIFIED.
- Coverage: all 17 crews.
- Technical: HTML articles.
- Cost: free.
- Licensing: "Copyright © 2025 Equity Creative Group, LLC"; no reuse terms. Names and assignments are facts, but the tables are their compilation.
- Quality: the de facto public reference for crews (judgment).
- Scores: Q 8 / Cov 8 / Rel 7 / Lat ~7 / Hist ~7 / Doc 3 / DX 2 / Cost 10 / Lic 2 / Com 1 / RL ~5 / NFL 8 = **5.7**
- Recommendation: SECONDARY as a manual, linked reference. A curator types the weekly referee per game (one name per game) into a small curated file with a source link, as `data/news.json` does. No scraping.
- Verified: 2026-11-25. The 2026 crews page read (structure only; table not copied).

### NFL Football Operations — officials announcements
- Links: https://operations.nfl.com (2016 and 2019 roster posts surfaced in search; the 2026 roster was not found)
- Category · Class: official officiating information · 🟢 official
- Provides: roster-of-officials announcements; rule explainers.
- History · Live · Latency: irregular.
- Coverage: league-wide.
- Technical: HTML.
- Cost: free.
- Licensing: NFL Terms (systematic retrieval and compilations barred).
- Quality: authoritative but sparse.
- Scores: Q 9 / Cov 5 / Rel 8 / Lat 4 / Hist 6 / Doc 4 / DX 2 / Cost 10 / Lic 2 / Com 1 / RL ~5 / NFL 8 = **5.3**
- Recommendation: OPTIONAL. Cite and link for confirmed facts, such as the official crew count.
- Verified: UNVERIFIED for 2026 (only search results; the kickoff-rule explainer URL returned 404).

### Wikidata — head coaches (P286)
- Links: https://query.wikidata.org/sparql
- Category · Class: structured coaching history · 🔵 open data (CC0)
- Provides: team → head coach statements with start and end qualifiers. No reliable coordinator or play-caller data found.
- History · Live · Latency: community-edited; lags.
- Coverage: 30 of 32 teams returned a current head coach. **Many are stale for 2026** (e.g. Raiders "Antonio Pierce", Jets "Jeff Ulbrich", Bears "Thomas Brown", Ravens "John Harbaugh"), while nfldata lists Klint Kubiak, Aaron Glenn, Ben Johnson and Jesse Minter.
- Technical: SPARQL/JSON · no key; User-Agent expected.
- Cost: free.
- Licensing: CC0.
- Quality: poor for current staff, useful for history and aliases.
- Scores: Q 3 / Cov 6 / Rel 6 / Lat 2 / Hist 7 / Doc 8 / DX 7 / Cost 10 / Lic 10 / Com 10 / RL ~7 / NFL 4 = **6.7** (the score overstates usefulness because licence and cost dominate)
- Recommendation: OPTIONAL. Use for coach identity (QIDs, aliases, birth data), never as the current-staff source.
- Verified: 2026-11-25. One SPARQL query; compared with nfldata 2026 coaches.

## 3. Matrix rows

| Category | Provider | Data | Live | Historical | Free | Paid | Cost | License | Quality | Latency | Commercial | Primary/Backup | Score |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| PBP (historical) | nflverse `load_pbp` | 372-col PBP, EPA/WP/CPOE, wall clock | No | 1999 (2001 supported)–2026 | Yes | – | $0 | CC-BY-4.0 (NFL rights upstream) | High | Hours after games | Risky | Primary | 8.1 |
| PBP models | nflfastR / fastrmodels / nfl4th | EP, WP, CP, xYAC, xpass, 4th-down | Computable live | 2001+ | Yes | – | $0 | MIT | High (version-sensitive) | n/a | Yes with notice | Primary | 8.3 |
| Charting | nflverse FTN charting | PA, RPO, motion, blitz, drops, etc. | No | 2022–2026 | Yes | – | $0 | CC-BY-SA 4.0 | Good | 36–72 h, weekly batch | Yes (share-alike) | Primary | 7.6 |
| Charting | FTN Data API | charting, participation, analytics | Maybe (`is_running`) | 2019+ (snippet) | No | Yes | ~$3k–5k/yr (UNVERIFIED) | Contract | ~High | UNVERIFIED | Yes | Commercial primary | 6.6 |
| Participation | nflverse participation | personnel, coverage, box, pressure, route | No | 2016–2025 | Yes | – | $0 | CC-BY-SA (FTN) / NGS | Medium (taxonomy break) | After season | Risky (NGS part) | Secondary | 6.8 |
| Tracking aggregates | NGS via nflverse | separation, cushion, TTT, CPOE, RYOE | No | 2016–2026 | Yes | – | $0 | NFL ToU (scraped) | High | Nightly | No | Secondary | 6.8 |
| Charted stats, snaps | PFR via nflverse | pressures, blitzes, drops, missed tackles, snaps | No | 2018+/2012+ | Yes | – | $0 | SR ToU (proxy-scraped) | Medium | Tue after week | No | Optional | 6.5 |
| QB model | ESPN QBR via nflverse | QBR, EPA components | No | 2006–2026 | Yes | – | $0 | Disney ToU | Medium | Daily | No | Optional | 6.5 |
| Officials | nflverse officials | crews per game | No | 2015–2026 wk 1 | Yes | – | $0 | scraped NGS | Good history, dead 2026 | Stopped Sept. 2026 | No | Secondary (history) | 5.8 |
| Schedule / coaches | nfldata games.csv | HC per game, referee, ids | Scores | 1999–2026 | Yes | – | $0 | none (facts) | Good; referee and weather stale | ~10 min commits | Probably | Primary | 7.9 |
| Grades / charting | PFF consumer API | grades, pressures, coverage, hang time | ? | ? | No | Yes | $199.99/yr | Personal only | Very high | ? | No | Avoid | 6.3 |
| Grades / charting | PFF enterprise (Teamworks) | event data | ? | ? | No | Yes | Sales | Contract | Very high | ? | Yes | Commercial option | 6.5 |
| Charting | SIS DataHub/API | charting, Total Points | ? | ? | Trial | Yes | $749.99/yr; API sales | UNVERIFIED | High | ? | ? | Optional | 5.6 |
| Reference stats | PFR / Stathead direct | history, staffs, referees | No | Decades | View | Stathead | ? | Scraping barred | High | Tue (adv) | No | Avoid automation | 5.7 |
| Live PBP | Sportradar NFL v7 | PBP, drives, wall clock, push | Yes | 2000+ | Trial | Yes | Sales | Contract | Official | Seconds (push) | Yes | Commercial primary | 7.8 |
| Live PBP | SportsDataIO | PBP, stats | Yes | ? | Scrambled trial | Yes | Sales | Contract | High | ? | Yes | Commercial backup | 7.3 |
| Official data | Genius Sports | official PBP, NGS, betting feed | Yes | ? | No | Yes | Enterprise | Exclusive | Official | Real time | Yes | Enterprise only | 6.9 |
| Live PBP | ESPN summary/core | plays, drives, wallclock, WP | Yes | Per game | Yes | – | $0 | Disney ToU | High | Seconds | No | Local-only backup | 6.3 |
| Live PBP | NFL GameCenter legacy | – | – | – | – | – | – | – | Dead | – | – | Avoid | 2.0 |
| Tracking | Big Data Bowl | frames | No | Subset | Yes | – | $0 | UNVERIFIED | Very high | – | ? | Research only | 5.9 |
| Platform | TruMedia | merged PBP/charting/tracking | ? | ? | No | Yes | Sales | Contract | ~High | ? | Yes | Optional | 6.0 |
| Analytics site | SumerSports | advanced stats | – | ? | View | – | $0 | Scraping and reuse barred | ~High | ? | No | Avoid | 4.7 |
| Analytics site | Sharp Football | tendencies | – | ? | Partly | Yes | ? | Automation barred | ? | ? | No | Avoid | 3.9 |
| Analytics site | rbsdm.com | EPA/CPOE boards, 4th-down | – | 1999+ | View | – | $0 | none found | High | Daily? | No | Validation only | 5.5 |
| Ratings | nfelo | Elo, QB values, tendencies | No | 2009+ | Yes | – | $0 | Outputs republishable | Good | Weekly | Probably | Secondary | 7.3 |
| Penalties | nflpenalties.com | penalties by crew | No | 2009–2026 | View | – | $0 | none found | ? | ? | No | Avoid | 4.8 |
| Officials | Football Zebras | crews, weekly referees | No | Seasons | View | – | $0 | Copyright, no terms | High | Pre-game | No | Manual reference | 5.7 |
| Officials | NFL Football Ops | official announcements | No | Irregular | View | – | $0 | NFL ToU | Authoritative | Irregular | No | Cite only | 5.3 |
| Coaches | Wikidata | HC history, ids | No | Long | Yes | – | $0 | CC0 | Stale current | Lags | Yes | Identity only | 6.7 |

## 4. Redundancy

| Category | PRIMARY | SECONDARY | FALLBACK | Notes |
|---|---|---|---|---|
| Historical PBP | nflverse pbp (free, complete, wall clock) | Sportradar historical (commercial; 2000+) | ESPN core PBP per game (local only) | Free backup is ToU-restricted; **no lawful free backup** |
| Live PBP | ESPN summary (local only, already used) | Sportradar push / SportsDataIO (paid) | Show "live play-by-play unavailable" | **No lawful free live PBP for the public page** |
| EP/WP/CPOE models | Our port or refit of nflfastR models (MIT) | nflverse pbp precomputed values (after-game) | ESPN WP series (local only) | Pin the model version; refit only with a backtest |
| Charting (PA, RPO, motion, blitz) | FTN via nflverse | FTN API (paid) | PFR advstats via nflverse (blitz and pressure only; scraped) | Season splits of PA and RPO also in PFR season files |
| Pressure | FTN `n_pass_rushers` plus participation `was_pressure` (after season) | PFR `times_pressured` (scraped) | PBP sacks + `qb_hit` as a floor | Different definitions per source; never mix in one chart |
| Personnel, formation, coverage | nflverse participation (completed seasons) | FTN API (paid, in season) | PBP `shotgun`/`no_huddle` + FTN `qb_location` (in season) | **No free in-season source** for personnel and coverage |
| Tracking metrics (separation, RYOE) | NGS via nflverse (non-commercial) | – | – | **No backup**: NFL-only data |
| Snaps | PFR snap counts via nflverse (scraped) | Participation player lists (after season) | – | Weak licence chain |
| Head coach per game | nfldata games.csv | PFR (manual lookup) | Wikidata (history only) | Mid-season firings need a curated override |
| Coordinators, play-callers | Curated file from club announcements (manual, linked) | PFR team pages (manual) | – | **No structured source** |
| Officials crews | Football Zebras (manual, linked) + nflverse 2015–2025 | nfldata `referee` (head referee; stale after week 4 in 2026) | – | **No automated 2026 source** |
| Penalties | nflverse pbp + `desc` parsing | ESPN `isPenalty` (local) | – | Declined and offsetting flags only in text |
| Special teams (FG, punt, kickoff) | nflverse pbp | nflverse team stats (`fg_*`, `pat_*`) | – | Hang time and operation time: PFF and NGS only; **no free backup** |
| QB composite | Our EPA+CPOE | nfelo QB values | ESPN QBR (scraped) | |

## 5. Derived metrics (compute ourselves)

All from nflverse PBP (and FTN where marked) unless stated. Filter `play_deleted != 1` and keep `season_type` explicit. Snapshot the source `timestamp.json` and nflfastR version with each run.

| Metric | RAW DATA REQUIRED | CALCULATION | RESULT |
|---|---|---|---|
| EPA/play | `epa`, `play_type in (pass, run)`, `posteam` | mean of `epa` over offensive plays (optionally exclude `qb_kneel`/`qb_spike`) | team or player efficiency |
| Success rate | `success` (or `epa > 0`) | mean | consistency |
| Dropback EPA, rush EPA | `qb_dropback`, `rush`, `qb_scramble`, `epa` | split means; scrambles go with dropbacks | pass/run efficiency |
| CPOE | `cpoe`, `pass_attempt`, `sack==0` | mean of `cpoe` (NA on spikes and throwaways) | accuracy over expected |
| PROE (pass rate over expected) | `xpass`, `pass_oe` or `qb_dropback` | mean(`qb_dropback` − `xpass`) in neutral situations | aggressiveness / play-calling identity |
| Neutral situation | `wp`, `qtr`, `half_seconds_remaining`, `down` | e.g. 0.20 ≤ `wp` ≤ 0.80, downs 1–3, excluding the last 2 min of each half (convention, document it) | context filter |
| Garbage time | `wp`, `qtr` | e.g. `wp` < 0.10 or > 0.90 in Q4 (convention) | exclusion filter |
| Explosive plays | `yards_gained`, `play_type` | runs ≥ 10 (12) yards, passes ≥ 20 (16); nflfastR's `calculate_stats()` now outputs 10/20/40, 12-yard run and 16-yard pass variants | big-play rate |
| Pace (seconds per play) | `time_of_day` (2026: ISO UTC per play), `game_seconds_remaining`, `drive`, `no_huddle` | game-clock gap between consecutive offensive snaps in the same drive, excluding stoppages (timeouts, penalties, quarter ends); wall-clock version from `time_of_day` | tempo (game clock) and real-time pace |
| No-huddle, shotgun rate | `no_huddle`, `shotgun` (PBP) or FTN `is_no_huddle`, `qb_location` | mean over offensive snaps | style |
| Play-action, RPO, motion, screen rate | FTN `is_play_action`, `is_rpo`, `is_motion`, `is_screen_pass` joined on game and play id | mean over dropbacks or all snaps (state the denominator) | scheme tendencies |
| Blitz rate, pass-rusher count | FTN `n_blitzers`, `n_pass_rushers` | share of dropbacks with `n_blitzers` ≥ 1; mean rushers (drop impossible values, e.g. 52) | defensive aggression |
| Pressure rate | participation `was_pressure` (after season) or PFR `times_pressured` | pressured dropbacks / dropbacks | pass-rush / protection |
| Sack rate | `sack`, `qb_dropback` | sacks / dropbacks | protection + QB |
| Target share, air-yards share, WOPR, RACR | `receiver_player_id`, `air_yards`, `complete_pass`, `receiving_yards` | player targets / team targets; player air yards / team air yards; nflverse `player_stats` already has `target_share`, `air_yards_share`, `wopr`, `racr` | usage |
| Red-zone and goal-line usage | `yardline_100` ≤ 20 / ≤ 5, `goal_to_go`, ids | share of team opportunities | high-leverage usage |
| 3rd/4th-down performance | `down`, `ydstogo`, `third_down_converted`, `fourth_down_converted`, `series_success` | conversion rate by distance bucket | situational |
| 4th-down decisions | `down==4`, nfl4th go/punt/FG values | go rate; go rate when nfl4th recommends go (WP gain > threshold); WP lost to non-optimal decisions | coach aggressiveness |
| Two-minute performance | `half_seconds_remaining` ≤ 120, `score_differential` | EPA/play, points per drive, timeout use | end-of-half management |
| Timeout and challenge use | `timeout`, `timeout_team`, `replay_or_challenge`, `desc` ("challenged") | per team-game counts, wasted timeouts, challenge success | coach game management |
| Penalties per crew | pbp penalties + officials crew per game + `desc` parsing for "declined" and "offsetting" | flags per game by crew and type, home/road split, accepted vs declined | officiating tendencies (descriptive; not a model input without a backtest) |
| FG over expected | `field_goal_attempt`, `kick_distance`, `field_goal_result`, `roof`, `temp`, `wind` | made − P(make) from a distance (+ weather) model | kicker value |
| Punt net and hang | `kick_distance`, `return_yards`, `touchback`, `punt_inside_twenty` | gross/net, inside-20 % (hang time not available free) | punter value |
| Kickoff outcomes | `kickoff_attempt`, `touchback`, `return_yards`, `kickoff_in_endzone`, `penalty_type` (Kickoff Short of Landing Zone / Out of Bounds) | touchback %, return %, starting field position | ST unit value, rule-era aware |

**Design note — Coach → Team → Tendencies → Situation**

- **Coach** (canonical id: Wikidata QID when known, plus name; role: HC/OC/DC/play-caller with `valid_from`/`valid_to` and source link)
- → **Team-season-week** (from nfldata `home_coach`/`away_coach` for head coaches; curated table for play-callers)
- → **Tendencies**: PROE, 4th-down go rate versus nfl4th, pace, no-huddle, shotgun, PA/RPO/motion (FTN), timeout and challenge use, 2-point rate
- → **Situation** buckets: down × distance × field zone × score state × clock × WP band.
- Store each tendency with its sample size and denominator. Show a shrinkage estimate, not raw rates, below about 100 plays. Attribute play-calling to the play-caller only when the curated role table says who called plays; otherwise attribute to the team.

**Metric coverage table**

| Metric | Provided directly by (source, seasons) | Derivable from (raw fields) | Notes |
|---|---|---|---|
| EPA | nflverse pbp `epa` (2001–2026; 1999–2000 legacy); ESPN QBR `epa_total` (QBs, 2006+) | own EP model on `down`, `ydstogo`, `yardline_100`, clock, timeouts | EP model rebuilt 2026-11-25 for all seasons |
| EPA/play | nflverse `stats_team`/`player_stats` `passing_epa`, `rushing_epa`, `receiving_epa` (sums) | mean `epa` per play | define play filter |
| Success rate | pbp `success` | `epa > 0` | changes on 3% of plays with the new EP model |
| CPOE | pbp `cpoe` (2006+ per nflfastR air-yards availability; UNVERIFIED exact start); NGS `completion_percentage_above_expectation` (2016+); nflverse team stats `passing_cpoe` | `complete_pass` − `cp` | NGS and nflfastR CP models differ |
| Completion probability | pbp `cp`; NGS `expected_completion_percentage` | CP model on air yards, location, down, distance | |
| WP | pbp `wp`, `vegas_wp`, `home_wp` (rebuilt OT and regulation models); ESPN summary WP (local) | port fastrmodels / refit | house rule: backtest before use |
| EP | pbp `ep`, `td_prob`, etc. | – | |
| Air yards | pbp `air_yards`; nflverse stats `passing_air_yards` | – | `ngs_air_yards` NA from 2024 |
| Intended air yards | NGS `avg_intended_air_yards` (QB, 2016+) | sum of `air_yards` on all attempts (pbp) | pbp air_yards is to catch point (intended) |
| YAC | pbp `yards_after_catch`; NGS `avg_yac`, `avg_yac_above_expectation`; pbp `xyac_*` | – | |
| Rusher YBC/YAC | PFR advanced rush via nflverse (scraped, 2018+) | not in pbp (no contact point) | tracking or charting only |
| Explosive plays | nflfastR `calculate_stats()` (10/20/40, 12-run, 16-pass) | `yards_gained` thresholds | |
| Pressure rate | participation `was_pressure` (2016–2025); PFR `times_pressured_pct` (2018+, scraped); PFF (personal only) | – | definitions differ |
| Hurry rate | PFR `times_hurried` (scraped); PFF | – | not in FTN subset |
| Sack rate | – | `sack` / `qb_dropback` | |
| Blitz rate | FTN `n_blitzers` (2022+); PFR `times_blitzed` | share with blitzers ≥ 1 | |
| Missed/broken tackles | PFR def `def_missed_tackles` and rush/rec broken tackles (scraped); PFF; SIS | – | **no lawful free source** |
| Coverage metrics (targeted defender) | PFR def `def_targets`, `def_passer_rating_allowed` (scraped); PFF | – | **no lawful free source** |
| Separation | NGS `avg_separation`, `avg_cushion` (receivers, 2016+) | tracking only | NFL data |
| Route participation | – (FTN API participation endpoints, paid) | participation `offense_players` × dropbacks (after season) gives "on field for dropback", not routes run | true routes run needs PFF/FTN paid |
| Target share | nflverse `player_stats.target_share` | targets / team targets | |
| Air-yards share | nflverse `air_yards_share`; NGS `percent_share_of_intended_air_yards` | | |
| Red-zone/goal-line usage | – | `yardline_100`, `goal_to_go` + player ids | |
| 3rd/4th-down performance and decisions | nfl4th outputs (computed) | `down`, conversions, nfl4th model | |
| Two-minute performance | – | `half_seconds_remaining` ≤ 120 | |
| Neutral-situation stats | – | WP, quarter, clock filters | document the convention |
| Garbage time | – | WP/score filters | |
| Pace / seconds per play | – | `game_seconds_remaining` gaps; 2026 `time_of_day` wall clock | `play_clock` column is always 0 |
| No-huddle rate | pbp `no_huddle`; FTN `is_no_huddle` | | compare both |
| Shotgun rate | pbp `shotgun`; FTN `qb_location` | | |
| Play-action rate | FTN `is_play_action` (2022+); PFR season `pa_pass_att` | | |
| RPO rate | FTN `is_rpo` (2022+); PFR season `rpo_plays` | | |
| Motion rate | FTN `is_motion` (2022+) | | "before or at the snap" (no shift/motion split) |
| Personnel groupings | participation `offense_personnel`/`defense_personnel` (2016–2025; after season) | | in season: paid only |
| Formations | participation `offense_formation` (taxonomy change 2023); FTN `qb_location`, `n_offense_backfield` | | |
| Defensive fronts | – | participation `defense_personnel`, `defenders_in_box` (box count only) | true front (odd/even, shade) paid only |
| Coverage shells | participation `defense_coverage_type` (some season ≥ 2017 → 2025) | | after season only |
| Man/zone | participation `defense_man_zone_type` | | after season only |
| Blitz packages | – | FTN `n_blitzers` + participation positions of rushers (not available: rusher identities are not in the files) | paid charting needed |

**Special-teams notes**
- **PBP fields:** `kickoff_attempt`, `punt_attempt`, `field_goal_attempt`, `extra_point_attempt`, `two_point_attempt`; `kick_distance`; FG/XP results; `touchback`; `punt_inside_twenty`, `punt_in_endzone`, `punt_out_of_bounds`, `punt_downed`, `punt_fair_catch`, `kickoff_in_endzone`, `kickoff_out_of_bounds`, `kickoff_fair_catch`; `return_yards`, returner ids; `punt_blocked`, `blocked_player_id`, `field_goal_result=="blocked"`; `own_kickoff_recovery`.
- **Fakes** have no flag: zero "fake" matches in 2026 `desc`. Detect a fake as a `pass`/`run` play by the punter or kicker from a punt or FG formation (heuristic, UNVERIFIED accuracy).
- **Not available for free:** hang time and operation time are PFF (and NGS) only.
- **Dynamic kickoff** (2024; touchback at the 35 from 2025, per the AP/NFL pages in search; 2026: onside kicks allowed in any situation, touchbacks of kicks from the 50 come out to the 20, 5-3-2 receiving alignment, per SI):
  - Kickoff touchback, return, field-position and kickoff-EPA numbers from before 2024 are **not comparable**.
  - nflfastR now values kickoffs "under the kickoff rules of the season".
  - 2026 data (checked): 1,691 kickoffs, 267 touchbacks, about 1,350 with return yards. `penalty_type` includes "Kickoff Short of Landing Zone" (26) and "Kickoff Out of Bounds" (21).
  - Split every special-teams trend at 2024, 2025 and 2026.
- **Kicking weather:** the literature found consistently shows cold, wind and precipitation lower FG success. The altitude effect is inconsistent across studies: a Sloan paper by Clark, Johnson and Stimpson (2000–2011); an MIT study reported by Phys.org (11,896 attempts); an independent 2016–2025 analysis. These are search results only (the papers were not opened; UNVERIFIED details). Any weather term needs our own backtest. Note that pbp and schedule `temp`/`wind` are missing for 2026 games after week 4, so use our Open-Meteo snapshot at kickoff instead.

## 6. Gaps

**Cannot be obtained easily or legally for free:**
- Live play-by-play for a public page. ESPN is local-only; official data flows through Genius, Sportradar and SportsDataIO under contract.
- In-season personnel, formation, coverage shell and man/zone. Participation is released only after the season, and in-season access needs the FTN API (paid).
- Per-player routes run and route participation; true defensive fronts and blitz packages; hurries.
- Missed and broken tackles and targeted-defender coverage stats. The only free copies are PFR data scraped through a proxy.
- Hang time and operation time.
- Player tracking, beyond NGS aggregates and Big Data Bowl samples.
- Coordinators and play-callers as structured, dated data.
- 2026 officiating crews per game. nflverse stopped after week 1 and nfldata's `referee` after week 4.
- DVOA. The FTN pages refused access and search found nothing; access and terms are UNVERIFIED.
- ESPN FPI and the pass-rush and run-stop win rates (ESPN only; Disney ToU).

**Expensive or sales-only:** Sportradar, SportsDataIO, Genius, Teamworks (PFF enterprise), TruMedia and the SIS API. FTN's API is reported at $3k–5k a year (UNVERIFIED). PFF Pro is $199.99 a year but personal use only, so worthless for a public product.

**Sources to avoid, and why:**
- PFF consumer data: the terms bar public, editorial, derived and AI use.
- SumerSports and Sharp Football: scraping and reuse barred.
- PFR and Stathead automation: SR terms, a Cloudflare challenge and a rate-limit "jail".
- nflpenalties.com: no terms and no stated source.
- The NFL GameCenter legacy feed: retired.
- In a **commercial** build, also avoid the nflverse datasets that are scraped upstream: NGS, PFR advanced stats and snaps, ESPN QBR, officials. Their CC-BY label does not cover the NFL's, Sports Reference's, Sportradar's or ESPN's rights.

**Comparability hazards:**
- EP and WP model rebuild (2026-11-25).
- Participation taxonomy change (2023).
- Dynamic kickoff eras (2024, 2025, 2026).
- `ngs_air_yards` NA from 2024.
- 1999–2000 PBP unsupported.
- FTN `read_thrown` "0" code absent in 2022.

## 7. Contradictions & UNVERIFIED

**Contradictions with project docs or with sources:**
1. `docs/NFL_DATA_SOURCE_REGISTRY.md` says nflverse releases are CC-BY-4.0 and "Most nightly". In fact:
   - (a) several nflverse datasets are scraped from parties whose terms bar it: NGS statboard API; PFR through the ScrapeOps proxy (`undercover::scrapeops_request`); ESPN QBR; officials from NGS. So "Yes: CC-BY-4.0" overstates the rights for those datasets.
   - (b) cadence varies: pbp runs several times a day in season; FTN comes in weekly batches; participation once after the season; officials are dead since Sept. 2026.
2. The registry says the nfldata games file is updated "Daily". Its commits run about every 10 minutes (Nov. 25), but its referee, temperature, wind and surface fields stopped after 2026 week 4.
3. `GITHUB_RESEARCH.md` describes the nflfastR WP model per the 2020 Open Source Football write-up. That write-up predates the 2026-11-25 rebuild (new EP, regulation and OT WP, xpass, FG model), so any port must target the new version or pin the old one.
4. The nflverse pbp dictionary disagrees with the 2026 data:
   - `time_of_day` is documented as UTC "HH:MM:SS"; the data holds ISO 8601 UTC with milliseconds (`2026-09-13T20:25:43.600Z`).
   - `end_clock_time` is documented as "Game time at the end of a given play"; the data holds a wall-clock UTC timestamp.
   - `drive_real_start_time` is documented as "mostly 'NA'"; it is filled on 28,168 of 28,467 rows in 2026.
   - `play_clock` is "0" everywhere, and `st_play_type` is empty everywhere.
5. nflreadr's `load_pfr_passing` says PFR data starts in 2019; `load_pfr_advstats` and the release files start in 2018.
6. nflreadr's FTN loader message asks for attribution to "ftndata.com via nflverse", while its documentation says "FTN Data via nflverse". Use the documentation wording plus a link to ftndata.com.
7. PFR's advanced stats come from Sportradar (SR blog, 2019), not SIS.
8. Wikidata head coaches disagree with nfldata for at least 8 teams in 2026 (Wikidata stale).
9. FTN's two pricing pages, as quoted by search snippets, disagree: the FAQ has a $3,000 private tier; the pricing page has none.

**UNVERIFIED:**
- FTN Data pricing, terms, latency and history (site 403).
- DVOA access.
- PFF API season coverage and rate-limit numbers.
- SIS terms and NFL update timing.
- Sportradar terms and production pricing; the 2000+ historical figure came via a search result about the historical-data page, which was not opened.
- SportsDataIO latency.
- Genius term-end after the 2025–2026 changes.
- TruMedia anything beyond search snippets.
- Stathead pricing.
- Which season participation coverage fields start (2017–2022).
- The 2012 snap-count file content (4.5 KB).
- Whether NFL terms formally cover nextgenstats.nfl.com.
- Big Data Bowl data licence (terms page 404).
- PFR's "updated by 6pm on the Tuesday" sentence (snippet; page 403).
- Football Zebras 2026 weekly posts and their timing.
- Kicking-weather study details (search snippets only).
- Whether `cpoe` starts in 2006.
- Fake-punt and fake-FG detection accuracy.
- Unexpected Points (Kevin Cole): not researched; the search budget ran out (the 200-search shared limit was reached late in this track).

## 8. Research log

All on 2026-11-25. gh = GitHub CLI (read-only API calls); curl used a generic User-Agent (nfl-universe-research/1.0), no keys or cookies.

- gh api repos/nflverse/nflverse-data/releases (all tags) — ok (2026-11-25)
- gh api .../releases/tags/{pbp,pbp_participation,ftn_charting,officials,espn_data,nextgen_stats,pfr_advstats,snap_counts} asset lists with updated_at — ok
- gh api repos/nflverse/nflreadr/contents/data-raw/dictionary_{pbp,participation,ftn_charting,nextgenstats,pfr_passing,snap_counts,espn_qbr,schedules}.csv — ok
- gh api repos/nflverse/nflfastR/contents/NEWS.md — ok (dev version notes: EP/WP/xpass rebuilt)
- gh api repos/nflverse/nflfastR/releases — ok (v6.0.0 2026-09-18)
- gh api repos/nflverse/nflverse-pbp (readme, .github/workflows/update_data.yaml, exec/update_data.R, R/raw_pbp.R, releases raw_pbp_2026) — ok
- gh api orgs/nflverse/repos — ok (found nflverse-pbp-internal, undercover "Proxy Scraping", nflverse-ftn, ngs-data, nflverse-pff, nflverse-pfr GPL-3.0)
- gh api repos/nflverse/nflverse-ftn (R/participation.R, exec/update_ftn_participation.R, workflows) — ok
- gh api repos/nflverse/nflverse-data/contents/LICENSE.md — ok (plain CC-BY-4.0 text, no FTN clause)
- gh api repos/nflverse/nflreadr/contents/R/load_{ftn_charting,participation,officials,nextgen_stats,pfr_advstats,snap_counts,espn_qbr,pbp}.R — ok
- curl https://github.com/nflverse/nflverse-data/releases/download/officials/officials.csv — 200, 1.29 MB, 2015–2026 (2026 = week 1 only)
- gh search code "release_tag = \"officials\"" owner nflverse → nflverse-rosters/exec/update_officials.R — ok (scrapes NGS via ngsscrapR)
- gh run list -R nflverse/nflverse-rosters --workflow update_officials.yaml — daily failures 2026-09-07..09-14
- gh api commits?path=.github/workflows/update_officials.yaml — ecc6ef1 2026-09-15 "Disable schedule because the workflow keeps failing"
- curl .../pbp/play_by_play_2026.csv.gz — 200, 11.4 MB; 28,467 rows × 372 cols, weeks 1–11, 163 games, max game_date 2026-11-23
- curl .../ftn_charting/ftn_charting_2026.csv — 200, 4.7 MB; 27,636 rows, weeks 1–11
- curl .../pbp/timestamp.json → {"last_updated":"2026-11-25 14:12:56 EST"}; ftn_charting/timestamp.json → "2026-11-25 07:01:33 EST"
- curl .../pbp_participation/pbp_participation_2025.csv (first 3 KB only) — 200; header matches dictionary
- gh api repos/nflverse/nflfastR/commits (2026-11-25: "bump dev version to make clear what's included in rebuild", EP model PR #644) — ok; DESCRIPTION Version 6.0.0.9001, License MIT + file LICENSE
- gh run list -R nflverse/nflverse-pbp --workflow update_data.yaml — ok (scheduled + manual runs, all success 2026-11-24/25)
- gh api .../releases/tags/pbp parquet update times — 2001–2026 all rebuilt 2026-11-25; 1999 (2025-04-30) and 2000 (2025-07-16) not rebuilt
- python analysis of pbp 2026 (time_of_day, end_clock_time, drive_real_start_time, play_clock, penalties, declined/offsetting, replay, kickoffs, punts, temp/wind/roof) — ok
- python analysis of FTN 2026 (weeks, date_pulled, value distributions) — ok
- curl .../nextgen_stats/ngs_passing.csv.gz, pfr_advstats/advstats_week_{pass,def}_2026.csv, espn_data/qbr_week_level.csv.gz, snap_counts/snap_counts_2026.csv — all 200; column lists and week coverage recorded
- ftndata.com → 302 to ftnfantasy.com/stats/sports-data → 403 (curl and WebFetch); ftnfantasy.com/robots.txt → 403. FTN pricing only via search snippets (UNVERIFIED)
- https://charting.ftntools.com/api/docs — 200 (Swagger UI shell); /api/openapi.json — 200, 146 paths, auth = query param `key`
- WebSearch "FTN Data NFL API pricing charting data license" (extended); "FTN Data charting API "$5,000" ..." (extended); "FTN DVOA data download subscription price 2026" (no relevant results)
- WebSearch "PFF data API for businesses ..." (extended); https://www.pff.com/terms — ok (Last Updated Oct 12, 2026); https://developer.pff.com/ — ok; /reference/ — JS shell; https://developer.pff.com/openapi.json — 200, 1.2 MB, v2.1.0; https://www.pff.com/subscribe — ok (prices)
- WebSearch "PFF enterprise data licensing teams sportsbooks ..."; https://teamworks.com/blog/teamworks-acquires-pff-enterprise/ — ok; https://b2b.pff.com → 301 to teamworks.com
- WebSearch "Sports Info Solutions SIS DataHub NFL data API licensing pricing" (extended); https://www.sportsinfosolutions.com/ — ok; https://pro.sisdatahub.com/Home/FAQ — ok (prices)
- WebSearch "sportsinfosolutions.com terms of service ..." (SIS ToS not found); https://www.sports-reference.com/data_use.html — ok; https://www.sports-reference.com/bot-traffic.html — ok
- curl https://www.pro-football-reference.com/robots.txt and /years/2025/passing_advanced.htm — 403 Cloudflare managed challenge (not bypassed)
- gh search code "undercover" owner nflverse — nflverse-pfr R/game_snaps.R, R/game_advstats.R, R/combine.R, auto/update_draft_picks.R and nflverse-players use undercover::scrapeops_request (proxy scraping)
- WebSearch "Pro Football Reference advanced passing stats "Sports Info Solutions" ..."; https://www.pro-football-reference.com/about/advanced_stats.htm — 403; faq.stathead.com / info.sports-reference.com knowledge pages — 404; https://sports-reference.com/blog/2019/09/adding-advanced-stats-to-pro-football-reference-for-2018-and-2019/ — ok (Sportradar)
- WebSearch "Sportradar NFL API v7 play-by-play push feed ..."; https://developer.sportradar.com/football/reference/nfl-overview — ok; /football/reference/nfl-faq — ok (partial, 100k of 105k chars); WebSearch "... NFL historical coverage ..." ; WebSearch "Sportradar API trial "1,000" ..."; https://developer.sportradar.com/getting-started/docs/your-account — ok; https://developer.sportradar.com/football/docs/nfl-ig-push — ok
- WebSearch "SportsDataIO NFL play-by-play API pricing free trial ..." (extended); https://sportsdata.io/free-trial — ok; https://sportsdata.io/help/data-rights-and-licensing-questions — ok
- WebSearch "NFL Genius Sports official data distribution rights extension ..."; WebSearch "nfl.com liveupdate game-center json feed discontinued ..."
- curl www.nfl.com/liveupdate/game-center/2019090500/2019090500_gtd.json → 301 to nfl.com home; www.nfl.com/liveupdate/scores/scores.json → 301 home; feeds.nfl.com/feeds-rs/scores.json → 403
- curl site.api.espn.com .../scoreboard?dates=20261123 → 200 (1 event, CIN at WAS final); .../summary?event=401873078 → 200, 625 KB, 20 drives, play keys incl. id, sequenceNumber, wallclock, modified, isPenalty; 182 win-probability points (research existence check only; Disney ToU applies)
- WebSearch Sumer, TruMedia, Sharp; https://sumersports.com/terms-of-service/ — ok (effective May 19, 2025); https://www.sharpfootballanalysis.com/terms-of-service/ — ok
- https://rbsdm.com/ — 200, JavaScript SPA shell only (no terms visible); gh search repos rbsdm
- WebSearch "nflpenalties.com penalty data source terms referee stats"; curl https://nflpenalties.com/robots.txt (Allow: /); homepage 200 "Data From 2009-2026", no terms or source statement found
- WebSearch Football Zebras 2026 assignments; WebSearch operations.nfl.com officials roster 2026; https://www.footballzebras.com/2026/08/officiating-crews-for-the-2026-season/ — ok
- curl https://raw.githubusercontent.com/nflverse/nfldata/master/data/games.csv — 200, 2.2 MB; coach/referee/temp/surface coverage by week analysed
- WebSearch coordinators/play-callers datasets; gh search repos "nfl coordinators", "nfl play callers"
- Wikidata SPARQL (query.wikidata.org) current head coaches of NFL teams (P286 without end date) — 200, 30 rows, many stale (e.g. Raiders "Antonio Pierce", Jets "Jeff Ulbrich")
- https://www.nfl.com/legal/terms/ — ok (Updated May 16, 2024)
- WebSearch Big Data Bowl data license; WebSearch nflfastR EP/WP model documentation
- WebSearch "NFL dynamic kickoff rule 2026 changes touchback 35 return rate 2025 season data" — ok (AP/NFL/SI results)
- WebSearch "field goal success temperature wind altitude study NFL kicking weather effect analysis" — ok (Sloan, Phys.org, Covers, Lewin, Ledoux results; papers not opened)
- WebSearch "nfl4th fourth down decision model ..." — refused: shared 200-search budget exhausted; no further WebSearch calls were made
- https://operations.nfl.com/updates/football-ops/new-nfl-kickoff-rule/ — 404
- https://www.si.com/nfl/explaining-five-new-nfl-rules-for-2026-season — ok (2026 kickoff changes)
- gh api repos/nflverse/nfl4th (+ DESCRIPTION, README) — ok (MIT, 1.0.7.9002)
- curl https://nextgenstats.nfl.com/ — 200; robots.txt "Disallow:" (empty); gh search code "nextgenstats.nfl.com/api" → ngs-data/R/ngs_functions.R statboard URLs
- https://operations.nfl.com/the-game/big-data-bowl/terms-and-conditions — 404
- https://www.nfl.com/news/nfl-extends-strategic-partnership-with-genius-sports — ok (no date shown); https://www.businesswire.com/news/home/20250611456305/en — 403
- gh api repos/nflverse/fastrmodels (+ DESCRIPTION 2.1.0, MIT); nflfastR README model section — ok
- https://www.nfeloapp.com/ — ok; gh api repos/greerreNFL/nfelo/contents/LICENSE — ok; gh api repos/nflverse/espnscrapeR-data — ok (no licence)
- curl .../pbp_participation/pbp_participation_{2016,2022,2025}.csv — 200 (21/22/49 MB), analysed, then deleted
- gh api repos/nflverse/nflreadr/contents/data-raw/dictionary_{playerstats.csv,team_stats.json} — ok
- Earlier WebSearch queries (all "standard" unless noted): "FTN Data NFL API pricing charting data license" (extended); "FTN DVOA data download subscription price 2026 "DVOA" ftnfantasy"; "FTN Data charting API "$5,000" OR "per year" commercial private pricing FAQ" (extended); "PFF data API for businesses NFL data feed licensing ..." (extended); "PFF enterprise data licensing teams sportsbooks ..."; "Sports Info Solutions SIS DataHub NFL data API licensing pricing" (extended); "sportsinfosolutions.com terms of service data reuse ..."; "Pro Football Reference advanced passing stats "Sports Info Solutions" ..."; "Sportradar NFL API v7 play-by-play push feed documentation latency trial"; "developer.sportradar.com NFL "historical" coverage ..."; "Sportradar API trial "1,000" requests ..."; "SportsDataIO NFL play-by-play API pricing free trial terms latency" (extended); "NFL Genius Sports official data distribution rights extension ..."; "nfl.com liveupdate game-center json feed discontinued ..."; "Sumer Sports NFL stats site terms of use data download API"; "TruMedia Networks NFL football analytics platform ..."; "Sharp Football Analysis stats subscription data source terms ..."; "nflpenalties.com penalty data source terms referee stats"; "Football Zebras 2026 referee crew assignments week 12 ..."; "operations.nfl.com officials roster 2026 ..."; "NFL offensive defensive coordinators play-callers dataset github csv 2026 ..."; "NFL Big Data Bowl 2026 data license terms Kaggle ..."; "nflfastR expected points win probability model documentation ..."
