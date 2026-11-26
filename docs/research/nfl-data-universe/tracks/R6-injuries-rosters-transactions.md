# R6 — Injuries, rosters, depth charts, transactions, contracts and salary cap

Research track R6, NFL Universe. Researched and written 2026-11-25. Every "read" or "probed" item below was opened on 2026-11-25 unless another date is given. Probes used a generic User-Agent (`nfl-universe-research/1.0`), no keys, cookies or sign-ins. Raw probe files are in the session scratch folder (`scratchpad/r6dl/`), not in the repository.

## 1. Summary

The project's public injury, roster and depth-chart layer rests on nflverse. Today's checks largely support that choice but correct three assumptions in the project docs.

1. **nflverse is a republisher, not an owner.** Injuries and rosters come from the NFL's own API through a private nflverse wrapper (`nflapi`). Depth charts have come from **ESPN** since 2025-08-03 (`nflverse.espn`). Contracts are scraped from **OverTheCap** HTML. nflreadr's README says the NFL data "belong to their respective owners, and are governed by their terms of use". The CC-BY-4.0 licence covers nflverse's own work, not those rights.
2. **The player-id crosswalk still depends on GPL data.** The `sleeper_id`, `rotowire_id`, `sportradar_id`, `yahoo_id` and `fantasy_data_id` columns in nflverse rosters come from `load_ff_playerids()`, which reads dynastyprocess `db_playerids` (GPL-3.0). `players.csv` has no Sleeper id.
3. **Sleeper's General Terms changed on 2026-11-17.** §11.1 and §11.3 bar automated access without a separate written agreement "or other approval" from Sleeper, while docs.sleeper.com still invites free non-commercial use. The owner has to decide whether to rely on the docs.

There is no free, licensed, near-real-time transactions feed for a public page. ESPN is local-only. NFL.com §1.3 bars systematic retrieval. nflverse trades stopped at 2026-04-17. Sportradar's Daily Transactions (paid) is the clean commercial route. Contracts and cap data are blocked by OverTheCap's and Spotrac's terms, and the NFLPA's terms allow personal use only. Ourlads and RotoWire's own site terms explicitly forbid automated depth-chart or news monitoring.

Commercial route: Sportradar (injuries, depth charts, transactions) or SportsDataIO, plus RotoWire for news; all quote-only.

## 2. Catalog

### NFL.com — Official injury report pages
- Links: https://www.nfl.com/injuries/ · docs: none · terms: https://www.nfl.com/legal/terms/ (updated May 16, 2024) · GitHub: none
- Category · Class: injuries (practice and game status) · 🟢 Official
- Provides: per game, per team: player, position, injury (body part), practice status (Full / Limited / Did Not Participate), game status (Questionable / Doubtful / Out, blank if none); "No Injuries Reported" per team
- History · Live · Latency: season navigation back to 1965 shown on the page (depth of real data not checked) · near-live during report days · no timestamps on the page; publication time per report UNVERIFIED (secondary sources say 4 p.m. ET)
- Coverage: all 32 teams, every game of the week (week 12 page, read 2026-11-25, lists games from Wed Nov 25 to Mon Nov 30)
- Technical: HTML (server-rendered) · URL patterns seen in search results: `/injuries/league/<season>/<REGn>` · SDK: none · Auth: none · Rate limits: none published · Pagination/Webhooks: none
- Cost: free: yes · free tier: n/a · paid: n/a · est. monthly for a small app: $0, but not licensed (see below)
- Licensing: commercial: needs "express prior written consent" · redistribution: §1.3 "Systematic retrieval of data ... to create ... a collection ... is prohibited" without written consent · caching/storage: same clause · attribution: n/a · other restrictions: §(f) bars robots harvesting "for any commercial purpose". Linking: only the home page may be linked without permission ("For any other type of link ... you must obtain our express written permission")
- Quality: accuracy authoritative (league publishes the clubs' filings) · completeness high · reliability high · notes: robots.txt does not disallow `/injuries` or `/transactions`, but robots.txt is not a licence
- Scores: Q 9 / Cov 9 / Rel ~8 / Lat ~8 / Hist ~6 / Doc 3 / DX 3 / Cost 10 / Lic 2 / Com 1 / RL ~5 / NFL 10 = **6.2**
- Recommendation: AVOID for automated ingest (terms) — use as the human reference truth and as the "official" column in a manual latency audit; the owner could ask the NFL (Legal Department, 345 Park Ave) for permission
- Verified: 2026-11-25 — page structure read (WebFetch); terms read in full (curl); robots.txt read

### NFL.com — League transactions pages
- Links: https://www.nfl.com/transactions/ · categories `/transactions/league/{trades|signings|reserve-list|waivers|terminations|other}/<year>/<month>` · terms as above
- Category · Class: transactions · 🟢 Official
- Provides: From team, To team, Date (MM/DD only, no time), Name, Position (blank in every row seen), Transaction type. Types seen 2026-11-25 (Nov, Sep and Mar 2026 first pages): Traded; Free Agent Signing; Unrestricted Free Agent Signing; Exclusive Rights Signing; Practice Squad; Practice Squad Veteran; Reserve/Injured; Reserve/Suspended By Commissioner-Less than One Year; Terminated Via Waivers, all contracts; Waived, No Recall; Assigned via Waivers (claims); Terminated, Vested Veteran (incl. Post-June 1 Designation); Exempt/Commissioner Permission; Suspension Lifted by Commissioner
- History · Live · Latency: year selector back to 1965 · same-day entries present (ten 11/25 signings and two 11/25 reserve moves at 22:50 UTC) · date granularity only
- Coverage: league-wide. Not seen in sampled pages: practice-squad elevations, extensions, restructures, franchise tags, retirements (UNVERIFIED whether listed at all)
- Technical: HTML table · SDK: none · Auth: none · Rate limits: none published · Pagination: 25 rows a page with an opaque `?after=` cursor
- Cost: free · est. monthly: $0 (not licensed)
- Licensing: same NFL.com terms (§1.3 systematic retrieval prohibited; deep links need permission)
- Quality: authoritative; position column empty; no player ids (names only), so identity must be resolved
- Scores: Q 8 / Cov 8 / Rel ~8 / Lat ~7 / Hist 9 / Doc 2 / DX 4 / Cost 10 / Lic 2 / Com 1 / RL ~5 / NFL 9 = **6.1**
- Recommendation: AVOID for automated ingest; manual verification reference only
- Verified: 2026-11-25 — fetched 1 landing page + 11 category pages (curl, 1 s apart); parsed columns and types

### NFL — Injury-report policy and roster rules (operations.nfl.com, NFL.com rules articles)
- Links: https://www.nfl.com/news/competition-committee-approves-revisions-to-injury-report-0ap3000000688693 · https://www.nfl.com/news/nfl-training-camp-roster-faqs-defining-injured-reserve-pup-list-nfi-and-more · https://www.nfl.com/news/approved-2024-nfl-season-playing-rules-bylaws-and-resolutions · https://operations.nfl.com/ (rulebook; the 2016 injury-policy page now returns 404)
- Category · Class: rules reference · 🟢 Official
- Provides (what the pages say):
  - Game-status designations: Questionable ("participation in the game is uncertain"), Doubtful (unlikely), Out (will not play). Probable eliminated (2016 revision; the league said about 95% of Probable players played). A player certain to play is left off the game-status report; deactivating an unlisted injured player requires an explanation to the league.
  - Practice report: Did Not Participate; Limited (less than 100% of normal reps); Full (100%). "Out" removed from the practice report.
  - Days and deadlines: **not stated on any primary page read**. Secondary sources (WFAA, Splash Sports, Pro Football Network) say: Sunday game: practice reports Wed–Fri, game status Friday by 4 p.m. ET; Thursday game: Mon–Wed reports, status Wednesday; Saturday game: status Thursday; Monday game: status Saturday. UNVERIFIED against a primary text.
  - Reserve/Injured, designated to return: 8 designations per club per regular season; at least 4 games on the list (NFL.com FAQ, 2022 rules). 2024 bylaw (NFL.com): up to two players placed on a reserve list on final-cutdown day may be designated, counting against the total. 21-day practice window and 2 extra postseason designations: Pro Football Rumors 2024-06-20 citing Tom Pelissero (secondary). Conflict: the NFL.com "approved 2024" list also shows a Detroit amendment for "unlimited" postseason designations.
  - PUP: Active/PUP (camp) vs Reserve/PUP (must miss at least the first 4 games). NFI: similar 4-game rule; pay negotiable. Commissioner Exempt list: only the Commissioner places players; exempt from roster limits. Reserve/Suspended: not counted, no base salary (2022 FAQ).
  - Practice squad 16 (+1 international exemption); standard elevations up to 2 per game (2022 FAQ); 2024 bylaw allows unlimited elevations of a bona fide QB as Emergency Third Quarterback.
  - Game-day inactives about 90 minutes before kickoff: UNVERIFIED (no primary text found; search budget exhausted).
- History · Live · Latency: rule texts by season · n/a · n/a
- Coverage: league rules; 2025–2026 changes UNVERIFIED (no NFL.com article for 2025/2026 IR or injury-report changes found)
- Technical: HTML articles · Auth: none
- Cost: free
- Licensing: facts may be restated in our own words; NFL.com terms apply to the pages
- Quality: authoritative but scattered; article dates are blank on several NFL.com pages
- Scores: Q 7 / Cov 5 / Rel 8 / Lat ~5 / Hist 5 / Doc 6 / DX 3 / Cost 10 / Lic 5 / Com 5 / RL 8 / NFL 8 = **6.2**
- Recommendation: SECONDARY (reference) — encode rules as versioned constants with source links; re-verify each preseason
- Verified: 2026-11-25 — three NFL.com articles read; operations.nfl.com home and rulebook links listed; 2016 policy URL 404

### NFL Communications — media portal (injury reports, transactions, game-day rosters)
- Links: https://media.nfl.com/football-information · `/news-and-releases/media/injury-reports`, `/transactions`, `/game-day-rosters`
- Category · Class: official media distribution · 🟢 Official (accredited media only)
- Provides: per the navigation, injury reports, transactions and game-day rosters (the actual documents could not be seen)
- History · Live · Latency: UNVERIFIED (login-gated)
- Coverage: league
- Technical: all three pages return **HTTP 401**; sign-in via NFL SSO (`login.nfl.net`); registration form for media
- Cost: n/a (accreditation)
- Licensing: not reviewed (gated); do not create an account
- Quality: likely the most authoritative and earliest official distribution (inference)
- Scores: Q 10 / Cov 10 / Rel ~9 / Lat ~9 / Hist ~5 / Doc 2 / DX 1 / Cost ~8 / Lic 1 / Com 1 / RL ~3 / NFL 10 = **5.8**
- Recommendation: AVOID — not available to this project
- Verified: 2026-11-25 — portal page links listed; three section URLs returned 401

### NFL — Shield API (upstream of nflverse injuries and rosters)
- Links: no public documentation. Evidence: `nflverse/nflverse-rosters` `exec/update-injuries.R` calls `nflapi::nflapi_injuries()`; `R/rosters_shield.R` calls `nflapi::nflapi_roster()`; `nflverse/nflapi` is not public (GitHub 404). Older weekly rosters used the NFL Data Exchange (`https://www.nfl.info/nfldataexchange/...`, HTTP basic auth, defaults user "media").
- Category · Class: official raw feed · 🟢 Official / ⚫ undocumented for third parties
- Provides: injuries and practice reports (2009 on), rosters with status codes, GSIS ids
- Technical: UNVERIFIED (not probed; credentials or tokens would be needed)
- Licensing: no developer programme found; NFL.com terms would apply
- Scores: Q 9 / Cov 9 / Rel ~7 / Lat ~8 / Hist 8 / Doc 1 / DX 2 / Cost ~5 / Lic 1 / Com 1 / RL ~3 / NFL 10 = **5.3**
- Recommendation: AVOID direct use; consume it only through nflverse's published files, with the provenance chain recorded
- Verified: 2026-11-25 — nflverse scripts read via `gh api`; endpoint itself not probed

### NFL clubs — team websites (injury reports, transaction releases, game-notes PDFs with depth charts)
- Links: `https://www.<club domain>/` (e.g. https://www.raiders.com/news/...); game-notes PDFs on `static.clubs.nfl.com`
- Category · Class: injuries, transactions, depth charts · 🟢 Official (club)
- Provides: club press releases for signings, releases, IR moves, elevations; weekly injury-report articles; weekly game-release PDFs that usually include the club's own depth chart (format and timing vary by club; UNVERIFIED per club)
- History · Live · Latency: varies; press releases same day (inference) · yes · minutes to hours (UNVERIFIED)
- Coverage: one club each; formats differ
- Technical: HTML, RSS (`/rss/news`, verified Nov 23–24 by the project), PDF
- Cost: free
- Licensing: per-club terms; the project's registry (checked Nov. 23–24, 2026) found none clearly allowing a site to show headlines with deep links; several bar automated access entirely (BUF, NE, CIN, CLE, TEN, JAX; SF, LAC, LAR)
- Quality: authoritative for that club; the only official depth chart (in PDFs) but unstructured
- Scores: Q 8 / Cov ~7 / Rel ~6 / Lat ~8 / Hist ~4 / Doc 1 / DX 2 / Cost 10 / Lic 2 / Com 1 / RL ~4 / NFL 8 = **5.1**
- Recommendation: AVOID automated; OPTIONAL manual source for curated items (`data/news.json` pattern: own-words summary + link where allowed)
- Verified: 2026-11-25 — relied on the project's Nov. 23–24 terms survey; no club page probed today

### nflverse — injuries (`injuries_<season>.csv`)
- Links: https://github.com/nflverse/nflverse-data/releases/tag/injuries · dictionary https://github.com/nflverse/nflreadr/blob/main/data-raw/dictionary_injuries.csv · licence https://github.com/nflverse/nflverse-data/blob/master/LICENSE.md · builder https://github.com/nflverse/nflverse-rosters (`exec/update-injuries.R`, `.github/workflows/update_injuries.yaml`)
- Category · Class: injuries (weekly report) · 🔵 Public/open data (republished official data)
- Provides: one row per player-week: `season, season_type, game_type, team, week, gsis_id, position, full_name, first_name, last_name, report_primary_injury, report_secondary_injury, report_status, practice_primary_injury, practice_secondary_injury, practice_status` (2026 header). `report_status` ∈ {Out, Doubtful, Questionable, blank}; `practice_status` ∈ {Full / Limited / Did Not Participate In Practice}
- History · Live · Latency: 2009–2026 · no · runs twice a day: a `workflow_dispatch` at about 07:00 UTC plus the `7 7 * 1,2,9-12 *` cron, which GitHub has been starting 7–12 h late (14:03–19:09 UTC, Nov 11–25). So a 4 p.m. ET (21:00 UTC) report appears around 07:00 UTC next morning (about 10 h later; inference from run times). Last release 2026-11-25 17:59 UTC
- Coverage: 2026 file has 3,585 rows, weeks 1–12, 0 duplicate player-weeks, all with `gsis_id`. Week 12 on Wed Nov 25: 104 rows from 10 teams (Thanksgiving-week early reports). Only the **latest** practice status per player-week is kept: the Wed→Thu→Fri sequence is lost unless snapshots are kept. No IR/PUP lists, no inactives, no return dates
- Technical: files (csv, csv.gz, parquet, rds) · SDK: nflreadr (R), nflreadpy (Python) · Auth: none · Rate limits: GitHub release CDN, none published · `timestamp.json` gives `last_updated`
- Cost: free
- Licensing: commercial: CC-BY-4.0 on nflverse's compilation; nflreadr README: NFL data "belong to their respective owners" · redistribution: CC-BY for nflverse's part; underlying NFL rights not granted · attribution: credit nflverse · other: upstream is the NFL API, whose terms bar systematic retrieval (§1.3) — a risk carried by nflverse and by anyone republishing
- Quality: accurate (official upstream); **`date_modified` is documented in the dictionary but missing from the 2026 file** (present in 2024); blank `report_status` rows are practice-only entries
- Scores: Q 8 / Cov 8 / Rel 8 / Lat 5 / Hist 8 / Doc 7 / DX 9 / Cost 10 / Lic ~6 / Com ~4 / RL 9 / NFL 9 = **7.6**
- Recommendation: PRIMARY (public) for official designations and practice status; poll every 6–12 h and keep every version to rebuild daily practice sequences
- Verified: 2026-11-25 — downloaded the 2026 CSV (410 KB) and parsed it; release assets, timestamps, workflow file, script and 30 recent runs read via `gh api`

### nflverse — rosters and weekly rosters (`roster_<season>.csv`, `roster_weekly_<season>.csv`)
- Links: https://github.com/nflverse/nflverse-data/releases/tag/weekly_rosters · .../tag/rosters · dictionaries `dictionary_rosters.csv`, `dictionary_roster_status.csv` (nflreadr data-raw)
- Category · Class: rosters, roster status, id crosswalk · 🔵 Public/open data (republished official data + third-party id map)
- Provides: per player-week: team, position, depth_chart_position, jersey, `status`, `status_description_abbr`, names, bio, ids (`gsis_id, espn_id, sportradar_id, yahoo_id, rotowire_id, pff_id, pfr_id, fantasy_data_id, sleeper_id, esb_id, gsis_it_id, smart_id`), `week`, `game_type`, entry/rookie year, draft club and number
- History · Live · Latency: weekly rosters 2002–2026, season rosters 1920–2026 · no · same twice-daily schedule as injuries (runs at ~07:00 UTC and 14:00–19:00 UTC)
- Coverage: week 12 (2026-11-25): 2,592 rows. `status`: ACT 1,683; DEV (practice squad) 538; RES 319; CUT 26; RET 22; TRT, RLS, TRD, EXE 1 each. Observed status × code pairs: ACT/A01 1,525; ACT/I01 146; ACT/I02 12; DEV/P01 309, P07 123, P06 66, P03 28, P02 12; RES/R01 264, R48 34, R04 14, R05 5, R40 1, R49 1; RET/R02 22; CUT/W03 14; EXE/E02 1. **The meaning of the `status_description_abbr` codes is not documented** (UNVERIFIED; e.g. R48 co-occurs with Sleeper "IR" 22 of 25 times and R04 with Sleeper "PUP" 10 of 10 — consistent with IR-designated-to-return and Reserve/PUP, but that is inference)
- Status dictionary (nflreadr `dictionary_roster_status.csv`): ACT active; EXE Commissioner exempt; DEV practice squad; CUT cut; E14 international exempt; INA inactive (under contract, not active); NWT rarely used, waived; PUP physically unable to perform; RES reserve list; RET retired; RFA cut RFA; RSN non-football injury reserve; RSR released from IR; SUS suspended; TRC/TRD/TRT released from practice squad; TRL unknown 1960s; UFA released UFA
- Technical: files (csv ~10 MB, parquet, rds) · SDK: nflreadr/nflreadpy · Auth: none
- Cost: free
- Licensing: as nflverse injuries. **Extra caveat:** `sleeper_id, rotowire_id, sportradar_id, yahoo_id, fantasy_data_id` are joined from `nflreadr::load_ff_playerids()` (`nflverse-rosters/R/utils_roster_ids.R`), i.e. dynastyprocess `db_playerids` (GPL-3.0)
- Quality: id coverage in week 12: gsis 2,591; esb 2,588; espn 1,964; rotowire 1,964; pfr 1,956; pff 1,911; sleeper 1,835; sportradar 1,835; fantasy_data 1,834; yahoo 1,135. Missing `sleeper_id` by status: ACT 416, DEV 242, RES 83
- Scores: Q 8 / Cov 9 / Rel 8 / Lat 5 / Hist 9 / Doc 6 / DX 9 / Cost 10 / Lic ~6 / Com ~4 / RL 9 / NFL 9 = **7.7**
- Recommendation: PRIMARY (public) for roster status and reserve lists; derive "roster move" events from week-to-week diffs (team or status change) as a delayed transactions proxy
- Verified: 2026-11-25 — downloaded `roster_weekly_2026.csv` (9.6 MB) and parsed; dictionaries and builder code read via `gh api`

### nflverse — depth charts (`depth_charts_<season>.csv`)
- Links: https://github.com/nflverse/nflverse-data/releases/tag/depth_charts · dictionary `dictionary_depth_charts.csv` · builder `nflverse-rosters/exec/update-depth-charts.R` · nflreadr NEWS 1.5.0
- Category · Class: depth charts · 🔵 Public/open data, **derived from ESPN (2025 on)**
- Provides: 2025+ format: `dt` (load time, ISO 8601 UTC), `team, player_name, espn_id, gsis_id, pos_grp_id, pos_grp` (e.g. "3WR 1TE", "Base 4-3 D", "Base 3-4 D", "Special Teams"), `pos_id, pos_name, pos_abb, pos_slot, pos_rank`. 2001–2024 format (NFL Data Exchange, weekly): `season, club_code, week, game_type, depth_team, last_name, first_name, football_name, formation, gsis_id, jersey_number, position, elias_id, depth_position, full_name`
- History · Live · Latency: 2001–2024 weekly; 2025–2026 dated snapshots · no · **twice a day**: in the 2026 file's newest 125,675 rows there are 54 distinct `dt` values over 27 days (about 07:01 UTC and 14:00–19:11 UTC), each covering all 32 teams with about 2,340–2,400 rows
- Coverage: 288 of 2,007 players in the newest snapshot appear in more than one slot; 7 of 2,358 rows lack `gsis_id` (ids mapped from ESPN ids via nflverse-players)
- Measured churn (2026-11-16 → 11-25, consecutive snapshots): median 23 rows added, median 7 teams changed and median 4.5 rank-1 (starter) changes per snapshot; peaks of 105–124 rows on Monday/Tuesday mornings after games; several afternoon snapshots had zero changes
- Technical: CSV about 80 MB for 2026 (rows prepended newest-first, `arrange(desc(dt), team, pos_grp_id, pos_rank)`), csv.gz 16 MB, parquet 3.7 MB · Auth: none
- Cost: free
- Licensing: CC-BY-4.0 on nflverse's work; the content is ESPN's depth chart, collected by `nflverse.espn::espn_depth_charts()` (switch committed 2025-08-03 "use nflverse.espn for depth charts"; nflreadr NEWS: source "had to be changed from NFL Data Exchange to ESPN"). ESPN content falls under the Disney Terms of Use (project registry, DEC-006)
- Quality: ESPN depth charts are editorial, not club-official; slot model differs from the 2001–2024 format, so histories across 2024/2025 are not directly comparable
- Scores: Q ~6 / Cov 9 / Rel 8 / Lat 6 / Hist 9 / Doc 7 / DX 7 / Cost 10 / Lic ~4 / Com ~2 / RL 9 / NFL 9 = **7.2**
- Recommendation: PRIMARY (public) for depth charts today, with an explicit owner decision recorded that it is ESPN-derived; keep every snapshot to build the Depth Chart History (section 5)
- Verified: 2026-11-25 — first 12 MB of the 2026 CSV read and analysed; 2024 and 2025 headers read; builder script and its commit history read via `gh api`

### nflverse — players master (`players.csv`)
- Links: https://github.com/nflverse/nflverse-data/releases/tag/players · dictionary `dictionary_players.csv` · builder https://github.com/nflverse/nflverse-players (internal package)
- Category · Class: player identity · 🔵 Public/open data
- Provides: `gsis_id` (primary key), names, `esb_id, nfl_id, pfr_id, pff_id, otc_id, espn_id, smart_id`, positions (NFL, NGS, PFF), status (NFL, NGS, PFF), latest team, draft, bio. **No `sleeper_id`**
- History · Live · Latency: all eras (24,872 players) · no · nightly (last release 2026-11-25 18:30 UTC)
- Coverage: among 21,131 current-ish rows: espn 13,603; pfr 19,587; otc 8,169; pff 9,564; nfl_id 9,813. For week-12 rostered players: otc_id 2,477 of 2,592; it supplies an ESPN id for 608 of the 628 roster rows without one
- Technical: CSV 7.3 MB, parquet, rds · Auth: none
- Licensing: CC-BY-4.0 (nflverse); `otc_id`/`pff_id` are fetched from OverTheCap (README: `players_otc_release()`), ESPN ids from ESPN; ids are facts, low risk (judgment)
- Quality: duplicate-id validator and manual overrides in nflverse-players
- Scores: Q 8 / Cov 9 / Rel 8 / Lat 6 / Hist 9 / Doc 8 / DX 8 / Cost 10 / Lic ~6 / Com ~4 / RL 9 / NFL 9 = **7.8**
- Recommendation: PRIMARY identity backbone (gsis_id as canonical key)
- Verified: 2026-11-25 — downloaded and parsed; README of nflverse-players read

### nflverse — trades (`trades.csv`, from nflverse/nfldata)
- Links: https://github.com/nflverse/nflverse-data/releases/tag/trades · upstream https://github.com/nflverse/nfldata/blob/master/data/trades.csv (no licence file)
- Category · Class: transactions (trades only) · 🔵 Public/open data (hand-maintained by Lee Sharpe)
- Provides: `trade_id, season, trade_date, gave, received, pick_season, pick_round, pick_number, conditional, pfr_id, pfr_name`
- History · Live · Latency: 2002–2026 (4,975 rows) · no · **stale**: release last updated 2026-05-19; newest `trade_date` 2026-04-17; last upstream commit 2026-04-19. The Nov 10, 2026 deadline trades listed on NFL.com are absent
- Technical: CSV · players keyed by PFR id
- Licensing: release under CC-BY-4.0 (nflverse-data); upstream repository has no licence
- Scores: Q 7 / Cov ~5 / Rel 5 / Lat 2 / Hist 9 / Doc 7 / DX 9 / Cost 10 / Lic ~5 / Com ~4 / RL 9 / NFL 7 = **6.6**
- Recommendation: OPTIONAL — historical trade analysis only; not a current fallback
- Verified: 2026-11-25 — downloaded and parsed; commit history read

### nflverse — contracts (`historical_contracts.*`, from OverTheCap)
- Links: https://github.com/nflverse/nflverse-data/releases/tag/contracts · dictionary `dictionary_contracts.csv` · builder https://github.com/nflverse/rotc (MIT code; `otc_historical_contracts()` scrapes `https://overthecap.com/contract-history/<position>` with httr2/rvest)
- Category · Class: contracts, cap figures · 🔴 Scraping (by nflverse) republished as 🔵
- Provides: player, position, team, is_active, year_signed, years, value, apy, guaranteed, apy_cap_pct, inflated values, OTC player page and `otc_id`, `gsis_id`, bio, draft; nested `season_history` (base salary, prorated/option/roster bonuses, guaranteed salary, cap number, cap percent, cash paid, workout and per-game bonuses) and `contract_history` (contract type incl. Franchise/Transition/UDFA/Practice; status incl. Extended/Terminated/Traded/Renegotiated/June 1 Terminated)
- History · Live · Latency: OTC's contract history (deep) · no · daily cron `0 7 * * *` (release 2026-11-25 18:00 UTC)
- Technical: **only parquet, rds and qs are current; `historical_contracts.csv.gz` was last updated 2022-05-29**. The project's stdlib Python / dependency-free Node stack cannot read parquet or rds, so there is no usable current file without a new dependency
- Licensing: OverTheCap terms (read 2026-11-25): personal informational use only; "Any systematic retrieval ... is prohibited without our express written consent"; no data "provided to any websites ... unless contracted by OTC". No permission statement from OTC to nflverse was found in rotc, nflreadr or nflverse-data
- Scores: Q 8 / Cov 8 / Rel 7 / Lat 6 / Hist 9 / Doc 8 / DX 3 / Cost 10 / Lic 2 / Com 1 / RL 9 / NFL 8 = **6.6**
- Recommendation: AVOID for the public page (owner decision; ask OTC at support@overthecap.com, the licensing contact its terms give); acceptable only for private, local analysis if the owner accepts the risk
- Verified: 2026-11-25 — assets and timestamps listed; rotc DESCRIPTION, workflow and scraper read; OTC terms read in full

### DynastyProcess — `db_playerids.csv` (source of nflverse `load_ff_playerids()`)
- Links: https://github.com/dynastyprocess/data (GPL-3.0) · `files/db_playerids.csv`
- Category · Class: player-id crosswalk (fantasy ids) · 🔵 Public/open data (GPL-3.0)
- Provides: ids across MFL, Sleeper, ESPN, Yahoo, RotoWire, Sportradar, FantasyData, PFR, GSIS and more (archived `database.csv` header shows `gsis_id, pfr_id, mfl_id, sleeper_id, fantasy_data_id, rotowire_id, sportradar_id, rotoworld_id, yahoo_id, ...`)
- History · Live · Latency: current · no · weekly (`cron: 23 0 * * 5`, Fridays 00:23 UTC); built mainly from MyFantasyLeague (`R/player_ids/update_mfl.R`) plus a manual `missing_ids.json`
- Licensing: GPL-3.0 applied to data (copyleft effect on a data file is legally unclear); project rule (GITHUB_RESEARCH.md) is owner decision before use
- Scores: Q 7 / Cov 8 / Rel 7 / Lat 4 / Hist 6 / Doc 5 / DX 8 / Cost 10 / Lic 3 / Com ~3 / RL 9 / NFL 7 = **6.4**
- Recommendation: SECONDARY — already used indirectly through nflverse rosters; record the dependency and the owner's decision
- Verified: 2026-11-25 — repo licence, README, workflow and code search via `gh`

### Sleeper — players database (`/v1/players/nfl`)
- Links: https://docs.sleeper.com/ · endpoint `https://api.sleeper.app/v1/players/nfl` · General Terms https://support.sleeper.com/en/articles/5486620-general-terms-of-use (last updated November 17, 2026)
- Category · Class: rosters, injury status, depth order, ids · 🟠 Unofficial but commonly used (vendor API with conflicting terms)
- Provides: per player (12,229 records; 2,778 with a team): `injury_status, injury_body_part, injury_notes, injury_start_date, practice_participation, practice_description, depth_chart_position, depth_chart_order, status, news_updated` (ms epoch), `team, team_abbr, team_changed_at, active`, ids (`gsis_id, espn_id, sportradar_id, rotowire_id, rotoworld_id, yahoo_id, fantasy_data_id, stats_id, swish_id, oddsjam_id, kalshi_id, opta_id, pandascore_id`), `metadata` (incl. `injury_override_*` keys)
- Population among the 2,778 players with a team (2026-11-25 22:48 UTC): `injury_status` 483 (IR 286, Questionable 139, Out 30, PUP 20, Doubtful 3, COV 2, NA 2, Sus 1); `injury_body_part` 477; `injury_notes` 127 (short, e.g. "Sprain", "Surgery"); **`injury_start_date` 0; `practice_participation` 1; `practice_description` 1; `team_changed_at` 0**; `depth_chart_position` 1,988; `depth_chart_order` 1,514; `status` Active 2,414 / Inactive 331 / Practice Squad 1 (practice-squad players are mostly labelled "Active"); `news_updated` 2,568 (174 within 24 h, newest 13 min before the download)
- History · Live · Latency: current state only · near-live · CDN headers: `cache-control: public, s-maxage=600, stale-while-revalidate=300` (so up to about 10–15 min stale at the edge); `etag` present
- Coverage: whole league plus free agents; not an official designation. On Wed Nov 25 Sleeper shows "Out" for 8 players whose official week-12 report had only "Did Not Participate" and no game status yet; for week 11 official "Out" players it shows Questionable (23), IR (11), Out (5) — i.e. it tracks the player's **current** fantasy-relevant status, mixing official, reported and editorial states
- Technical: REST JSON, about 14.7 MB uncompressed (docs: "average size ... 5MB", probably compressed) · SDK: community wrappers · Auth: none · Rate limits: docs: stay under 1,000 calls a minute; call this endpoint at most once a day · Webhooks: none
- Cost: free (docs: "free to use for non-commercial purposes"; commercial: contact Sleeper)
- Licensing: **conflict**. docs.sleeper.com: read-only, no token, non-commercial use free, credit trending data. General Terms (2026-11-17) §11.1 bars "Access, query, extract, or receive any data ... through any automated means" without consent and any commercial use; §11.3: no third party is authorized to retrieve data "except pursuant to a separate written agreement ... or other approval given by Sleeper". Whether the public developer docs count as that approval is unresolved
- Quality: ids: Sleeper's own `gsis_id` is filled for only 568 of 2,778 team players; where both exist, it agrees with nflverse's Sleeper↔GSIS map 401 of 402 times. RotoWire lists Sleeper among companies using its data (https://www.rotowire.com/partner/), so some injury text may originate there (inference)
- Scores: Q ~6 / Cov 8 / Rel 8 / Lat 8 / Hist 1 / Doc 5 / DX 9 / Cost 10 / Lic 3 / Com 1 / RL 8 / NFL 8 = **6.2**
- Recommendation: SECONDARY (fallback and "reported status" signal) pending the owner's terms decision; label its statuses "Sleeper status", never "official"; do not rely on practice fields (empty)
- Verified: 2026-11-25 — one download (HTTP 200, 14,663,309 bytes, 0.52 s); fields counted; cross-checked against nflverse injuries and weekly rosters; docs and General Terms read

### ESPN — injuries, transactions, depth charts, rosters (JSON; owner's machine only)
- Links: `site.api.espn.com/apis/site/v2/sports/football/nfl/injuries`, `/transactions`; `sports.core.api.espn.com/.../teams/<id>/depthcharts`, `/roster` · terms https://disneytermsofuse.com/english/
- Category · Class: injuries, transactions, depth charts · 🟠 Unofficial / 🔴 when automated (Disney ToU §2.B(x))
- Provides (from the project registry, verified Nov. 21, 2026): injury status, type, return date for all 32 teams; 25 transactions a page; depth charts and rosters with ESPN ids
- History · Live · Latency: current · yes · hours (registry); not re-probed today by design
- Licensing: Disney ToU bars robots, data mining and dataset building; local-only use is an owner decision (DEC-006)
- Quality: the only free source with return dates and a full transaction stream; nflverse depth charts are this same ESPN data
- Scores: Q 8 / Cov 9 / Rel 8 / Lat 8 / Hist 3 / Doc 2 / DX 8 / Cost 10 / Lic 1 / Com 1 / RL ~6 / NFL 9 = **6.1**
- Recommendation: SECONDARY, local server only (as today); AVOID for public or commercial use
- Verified: not re-probed 2026-11-25 (project rule); relies on registry entries of Nov. 21, 2026

### RotoWire — news, injuries, depth charts data feeds
- Links: https://www.rotowire.com/partner/ · terms https://www.rotowire.com/termsandconditions.php (effective September 19, 2026) · llms.txt https://www.rotowire.com/llms.txt
- Category · Class: news, injuries, depth charts, lineups · 🟡 Licensed/commercial
- Provides (partner page): player news on "injuries, transactions, lineup changes", injury data with context, expected/confirmed lineups, depth charts "refreshed ... immediately after every trade", custom player-id mapping
- History · Live · Latency: UNVERIFIED (sales material says "around the clock") · yes · UNVERIFIED
- Coverage: NFL and other leagues; partner list names ESPN, Yahoo Sports, DraftKings, FanDuel, Fox Sports, Underdog, Sleeper, NBA.com, NFL.com, CBS Sports
- Technical: API key required (third-party SDK pages); format UNVERIFIED
- Cost: commercial feeds: contact sales (demo form); no price published. Consumer subscriptions are separate and do not license data
- Licensing: site terms: personal, non-commercial use only; Article VI bars automated access, scraping and unauthorized APIs; Article VII bars AI use. Copyright footer: Grandstand Limited, sub-licensed to Roto Sports Inc. (Nasdaq GRSD)
- Scores: Q ~9 / Cov 9 / Rel ~9 / Lat ~9 / Hist ~6 / Doc ~4 / DX ~6 / Cost 3 / Lic 6 / Com 8 / RL ~7 / NFL 9 = **7.1**
- Recommendation: OPTIONAL now; PRIMARY candidate for news and injury context in a commercial product (licence required). AVOID scraping rotowire.com
- Verified: 2026-11-25 — partner page, terms, llms.txt, robots.txt read via curl; pricing UNVERIFIED (not published)

### NBC Sports — Rotoworld player news
- Links: https://www.nbcsports.com/fantasy/football/player-news (rotoworld.com redirects to https://www.nbcsports.com/fantasy) · terms https://www.nbcsports.com/terms-use
- Category · Class: player news, injury notes · 🟠 Unofficial (editorial)
- Provides: per item: player, team, position, headline (e.g. practice participation), fantasy analysis, writer credit and often a "Source:" link to a reporter's post; filters All / Headline / Injury Recap / Transaction
- History · Live · Latency: recent items · yes · no explicit timestamps in the visible page
- Technical: HTML; no RSS link seen
- Licensing: NBC Sports general terms (project registry): personal, non-commercial use; scrapers that aggregate content and redistribution barred without written permission
- Scores: Q 8 / Cov 8 / Rel 8 / Lat 8 / Hist 4 / Doc 1 / DX 2 / Cost 10 / Lic 1 / Com 1 / RL ~4 / NFL 8 = **5.2**
- Recommendation: AVOID automated; humans may read it to find the reporter's original post
- Verified: 2026-11-25 — redirect checked (curl); page read (WebFetch)

### FantasyPros — API v2 (news, injuries, players)
- Links: https://www.fantasypros.com/api-data/ · base `https://api.fantasypros.com/public/v2/json` · API terms (Oct 27, 2020; read by the project Nov. 25)
- Category · Class: news, injuries, players, projections · 🟡 Licensed (personal key)
- Provides (product page): `GET /{sport}/news` (filter by category, player, recency); `GET /{sport}/injuries` ("injury statuses by season/week, with optional practice-report probabilities"); `GET /{sport}/players` (FantasyPros ids, external-id cross-references). No depth-chart endpoint listed
- History · Live · Latency: UNVERIFIED
- Technical: REST JSON · Auth: `x-api-key` header · Rate limits: project registry: 1 call a second, 100 a day default, 500 on the owner's plan; product page gives no numbers. Docs page `api.fantasypros.com/v2/docs` answered 403 to WebFetch
- Cost: Free "$0 / mo" (non-production); Premium "$8.99 / mo" (personal, non-commercial; bundled with HOF); Commercial "Custom" with redistribution rights
- Licensing: personal, non-commercial; attribution "Data obtained from FantasyPros" (project registry); no third-party access to API materials
- Scores: Q ~7 / Cov ~7 / Rel ~7 / Lat ~6 / Hist ~4 / Doc 5 / DX 7 / Cost 8 / Lic 4 / Com ~5 / RL 4 / NFL 8 = **6.0**
- Recommendation: OPTIONAL — the owner already has a key; test `/nfl/injuries` and `/nfl/news` within the 500-call budget for a second, non-ESPN injury opinion (fields UNVERIFIED)
- Verified: 2026-11-25 — product page read; endpoint fields not tested (no key used by this research)

### SportsDataIO — NFL API (commercial) and Discovery Lab (personal)
- Links: https://sportsdata.io/nfl-api · https://discoverylab.sportsdata.io/personal-use-apis/nfl · terms https://discoverylab.sportsdata.io/terms-of-service · help https://sportsdata.io/help/data-rights-and-licensing-questions
- Category · Class: injuries, rosters, depth charts, news · 🟡 Licensed/commercial
- Provides: commercial NFL API lists Injuries, Rosters & Depth Charts, Player News & Notes, Player Profiles, DFS salaries; transactions and contracts not mentioned on the product page
- Discovery Lab plans (embedded plan JSON on the NFL page, read 2026-11-25): Fantasy $99/month or $599/year (100 API calls a day); Odds $99/month or $599/year (100 a day); Fantasy + Odds $149/month or $899/year (1,000 a day). All include Teams/Stadiums, Rosters, Standings and **Injuries**; "Includes Current Season + Last 3 Years"; player stats "Delivered 6am ET next day". Depth charts not listed. Free tier: last season's rosters, schedules and results
- Commercial prices: not published ("Get In Touch"); free trial data is scrambled per third-party summaries (UNVERIFIED)
- Technical: REST JSON/XML · Auth: key
- Licensing: commercial licence by agreement; Discovery Lab terms page does not state personal-only (marketing says "personal use")
- Scores: Q ~8 / Cov 9 / Rel ~8 / Lat ~8 / Hist 7 / Doc 8 / DX 8 / Cost 4 / Lic 5 / Com 8 / RL 5 / NFL 9 = **7.2**
- Recommendation: OPTIONAL now; SECONDARY commercial candidate (cheaper entry than Sportradar)
- Verified: 2026-11-25 — product page (WebFetch), Discovery Lab HTML and its embedded plan JSON (curl), terms page (curl)

### Sportradar — NFL API v7 (Weekly Injuries, Weekly Depth Charts, Daily Transactions, rosters)
- Links: https://developer.sportradar.com/football/docs/nfl-ig-api-basics · https://developer.sportradar.com/football/docs/nfl-ig-update-frequencies · changelog https://developer.sportradar.com/sportradar-updates/changelog/nfl-api-estimated-injury-return-date
- Category · Class: injuries, depth charts, transactions, rosters · 🟡 Licensed/commercial
- Provides: Weekly Injuries (now with optional `injury.estimated_return_date`, alongside `status`, `status_date`); Weekly Depth Charts; Daily Transactions ("all transfers created during the league-defined day"); Team and Game Rosters; Player Profile; Free Agents; Push feeds
- History · Live · Latency: multi-season · yes · update-frequency page: injuries TTL 4 h, "Pull every hour or less during the current week"; depth charts "update shortly before each game"; transactions "Updates in realtime as transactions are entered"
- Technical: `GET https://api.sportradar.com/nfl/official/{trial|production}/v7/{lang}/{feed}.{format}` · Auth: `x-api-key` header · rate-limited answers 429 · trial (general docs): 1,000 requests per rolling 30 days, 1 QPS, 30-day trial
- Cost: trial free; production: contact sales (not published)
- Licensing: B2B licence; data "collected by Sportradar's in-house operators" (docs). Whether Sportradar's NFL data is league-official today is UNVERIFIED: reporting says Genius Sports replaced Sportradar as the NFL's exclusive official data distributor in 2021
- Scores: Q ~9 / Cov 10 / Rel 9 / Lat 8 / Hist 8 / Doc 9 / DX 8 / Cost 2 / Lic 6 / Com 9 / RL 3 / NFL 10 = **7.6**
- Recommendation: PRIMARY candidate for a commercial product (the only provider found with documented transactions, depth charts and injury return dates in one licence); a free trial is not a production licence
- Verified: 2026-11-25 — three developer pages read (WebFetch); no trial key created

### Genius Sports — NFL official data distribution
- Links: https://www.nfl.com/news/nfl-extends-strategic-partnership-with-genius-sports (search result) · https://www.sportsvideo.org/2025/06/12/the-nfl-expands-and-extends-strategic-partnership-with-genius-sports/ (search result)
- Category · Class: official league data (live stats, Next Gen Stats, betting feed) · 🟡 Licensed/commercial
- Provides: per search summaries, exclusive distribution of real-time official play-by-play, Next Gen Stats and the official betting data feed (2021 deal, extended 2023 and June 2025). Injury, roster or transaction feeds: UNVERIFIED
- Cost: contact sales (no public price)
- Scores: Q ~9 / Cov ~8 / Rel ~9 / Lat ~9 / Hist ~6 / Doc ~2 / DX ~4 / Cost 1 / Lic ~5 / Com ~8 / RL ~5 / NFL 9 = **6.2**
- Recommendation: OPTIONAL — ask in a commercial phase whether official injury/roster feeds are included
- Verified: UNVERIFIED (search snippets only; pages not opened; search budget exhausted)

### Ourlads — NFL depth charts
- Links: https://www.ourlads.com/nfldepthcharts/ · terms https://www.ourlads.com/tc/ · robots https://www.ourlads.com/robots.txt
- Category · Class: depth charts · 🟠 Unofficial (editorial) / 🔴 if automated
- Provides: depth charts and rosters for all 32 teams, colour legend for 2026 FA/trade acquisitions, rookies, UDFAs
- History · Live · Latency: current · near-live · page header "Last updated on Wednesday, November 25 2026, 1:46 PM ET"
- Technical: HTML · Auth: none
- Licensing: terms forbid any robot, scraper, AI system or "other automated means" to access or copy Ourlads content, and specifically forbid systematically monitoring depth-chart "additions, deletions, substitutions ... ordering changes" to build or validate another product; public accessibility "does not constitute permission"
- Scores: Q ~8 / Cov 9 / Rel ~7 / Lat ~7 / Hist ~3 / Doc 1 / DX 2 / Cost 10 / Lic 1 / Com 1 / RL 2 / NFL 8 = **4.9**
- Recommendation: AVOID (explicitly prohibited); a licence could be requested in writing
- Verified: 2026-11-25 — page header, robots.txt and terms read (curl)

### OverTheCap — contracts and salary cap
- Links: https://overthecap.com/ · terms https://overthecap.com/terms-and-conditions · robots https://overthecap.com/robots.txt (updated 2026-06-14)
- Category · Class: contracts, cap space, transactions table, release tracker · 🟠 Unofficial (analyst-compiled; "in some cases, estimated")
- Provides: contracts, cash flows, cap space, transactions table, restructure potential, tag projections, contract history
- History · Live · Latency: deep contract history · near-live (UNVERIFIED) · UNVERIFIED
- Technical: HTML; `/api` answers HTTP 401 (an authenticated API exists; purpose UNVERIFIED); "embed" for single instances
- Cost: free site; OTC Premium subscription (price not checked); data licence via support@overthecap.com
- Licensing: "solely for your own individual use"; no derivative works; systematic retrieval prohibited without written consent; no data to websites "for the purpose of providing comprehensive information on professional football contracts, rosters, or player valuations unless contracted by OTC". robots.txt disallows `Anthropic-AI`, GPTBot, CCBot and other training crawlers
- Scores: Q 9 / Cov 9 / Rel 8 / Lat 7 / Hist 9 / Doc 3 / DX 3 / Cost 9 / Lic 1 / Com ~3 / RL 2 / NFL 9 = **6.0**
- Recommendation: AVOID without a licence; best candidate to license for contracts in a serious product
- Verified: 2026-11-25 — terms and robots.txt read in full (curl)

### Spotrac — contracts, cap, transactions
- Links: https://www.spotrac.com/ · terms https://www.spotrac.com/service (and /terms)
- Category · Class: contracts, cap, transactions · 🟠 Unofficial
- Provides: UNVERIFIED (site not readable by automated clients)
- Technical: curl with a generic UA → HTTP 403 (CloudFront "Request blocked") for `/terms`, `/robots.txt`, `/api`; WebFetch → HTTP 402. Not worked around
- Licensing: search snippet only: licence to review content "for personal and educational purposes". Sports-Reference's data-use page names Spotrac as its paid source for contract data
- Scores: Q ~8 / Cov 9 / Rel ~7 / Lat ~7 / Hist 8 / Doc 1 / DX 1 / Cost ~6 / Lic 1 / Com ~2 / RL 1 / NFL 8 = **4.9**
- Recommendation: AVOID (blocks automation; no public data programme found)
- Verified: 2026-11-25 — blocked (403/402); terms UNVERIFIED

### NFLPA — Public Salary Cap Report
- Links: https://nflpa.com/reports/public-salary-cap-report · terms https://nflpa.com/tos
- Category · Class: team cap figures · 🟢 Official (players' union)
- Provides: team-level cap report (rendered client-side from an Azure API `api.azure-api.net/papi/v2/reports`; content not read)
- Licensing: content for "information and personal use only"; no commercial use without authorization; automated systems may not exceed human request rates
- Scores: Q 10 / Cov ~6 / Rel ~7 / Lat ~5 / Hist ~4 / Doc 1 / DX 2 / Cost 10 / Lic 2 / Com 1 / RL ~4 / NFL 7 = **4.9**
- Recommendation: AVOID automated; cite single facts manually with a link
- Verified: 2026-11-25 — page shell and terms read (curl); report data not loaded

### NFL.com — official salary cap figure (fact)
- 2026 salary cap $301.2 million per club, up $22 million from $279.2 million in 2025 (NFL.com headline "NFL announces 2026 salary cap set at $301.2 million per team"; corroborated by ESPN and NBC). Seen in search results only; article not opened. Usable as a single fact with a link; no feed needed. Score not given (single fact).

### Sports Reference — Pro-Football-Reference (injuries page, transactions on player pages)
- Links: https://www.pro-football-reference.com/players/injuries.htm · data use https://www.sports-reference.com/data_use.html
- Category · Class: injuries, transactions history, ids (PFR ids) · 🟠 Unofficial
- Licensing: "Please do not attempt to aggressively spider data"; no building sites or tools from scraped data; no competing database; no AI training; custom data from "a minimum of $5,000"; facts are not copyrightable. Some licensed sources (e.g. Spotrac contracts) forbid redistribution
- Scores: Q 8 / Cov 7 / Rel 8 / Lat 5 / Hist 10 / Doc 5 / DX 3 / Cost 9 / Lic 2 / Com 2 / RL 2 / NFL 8 = **5.8**
- Recommendation: AVOID automated; PFR ids still useful as join keys (via nflverse)
- Verified: 2026-11-25 — data-use page read (WebFetch)

### Pro Sports Transactions — prosportstransactions.com
- Links: https://www.prosportstransactions.com/
- Category · Class: transactions history (all moves) · 🟠 Unofficial (volunteer-compiled)
- Technical: HTTP 403 to the generic research UA for both `/` and `/robots.txt`; not worked around
- Licensing: UNVERIFIED (terms unreadable; search budget exhausted)
- Scores: Q ~6 / Cov ~7 / Rel ~5 / Lat ~5 / Hist ~9 / Doc 1 / DX 1 / Cost 10 / Lic ~1 / Com 1 / RL 1 / NFL 6 = **4.4**
- Recommendation: AVOID
- Verified: 2026-11-25 — blocked (403)

### CBS Sports / Yahoo Sports — injury pages
- Links: https://www.cbssports.com/nfl/injuries/ (HTTP 200 to curl) · CBSi terms https://legal.paramount.com/us/en/cbsi/terms-of-use · Yahoo terms https://legal.yahoo.com/us/en/yahoo/terms/otos/index.html
- Category · Class: injuries · 🟠 Unofficial
- Licensing (project registry, Nov. 21): personal, non-commercial; scraping and redistribution barred (CBSi); Yahoo §2(e) bars commercial reuse
- Scores: Q 7 / Cov 8 / Rel 7 / Lat 7 / Hist 2 / Doc 1 / DX 2 / Cost 10 / Lic 1 / Com 1 / RL ~4 / NFL 7 = **4.8**
- Recommendation: AVOID
- Verified: 2026-11-25 — CBS page status only; terms from the registry

### Social media — team accounts, beat reporters, nflverse injury bot
- Links: https://github.com/nflverse/nflverse-injurybot (posts NFL injury reports to Bluesky; repo pushed 2025-02-10)
- Category · Class: earliest reports, rumours · ⚫ Experimental/unstable (and 🟡 for the X API)
- Provides: first word of inactives, IR moves, signings; mix of confirmed and reported claims
- Licensing/cost: X API pricing and terms UNVERIFIED (search budget exhausted); Bluesky public API terms not reviewed
- Scores: Q ~5 / Cov ~7 / Rel ~5 / Lat 10 / Hist ~5 / Doc ~5 / DX ~4 / Cost ~3 / Lic ~2 / Com ~2 / RL ~3 / NFL 7 = **4.8**
- Recommendation: AVOID ingest; use only as the human-checked "reported" tier with the reporter's link, and as the fastest reference in the latency study if terms allow
- Verified: UNVERIFIED (no API probed)

## 3. Matrix rows

| Category | Provider | Data | Live | Historical | Free | Paid | Cost | License | Quality | Latency | Commercial | Primary/Backup | Score |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Injuries | nflverse injuries | Weekly report: game status, practice status, injuries | No | 2009– | Yes | – | $0 | CC-BY-4.0 (NFL upstream rights retained) | High | ~10 h after a 4 p.m. ET report (2 runs/day) | Risky (upstream) | PRIMARY (public) | 7.6 |
| Injuries | ESPN JSON (local) | Status, type, return date | Yes | Current | Yes | – | $0 | Disney ToU bars automation | High | Hours | No | SECONDARY (local) | 6.1 |
| Injuries | Sleeper players | Fantasy status, body part, note | Near | None | Yes | Contact | $0 | Docs: non-commercial; ToU §11.3 conflict | Medium | ≤10–15 min CDN | No | FALLBACK (owner decision) | 6.2 |
| Injuries | NFL.com injuries | Official report | Yes | Season pages | Yes | – | $0 | §1.3 no systematic retrieval | Authoritative | Minutes | No | Manual reference | 6.2 |
| Injuries | Sportradar v7 | Injuries + estimated return date | Yes | Multi-season | Trial | Contact sales | Quote | B2B licence | High | ≤1 h poll, TTL 4 h | Yes | Commercial PRIMARY | 7.6 |
| Injuries | SportsDataIO | Injuries (Discovery Lab and commercial) | Yes | Current + 3 yrs (DL) | Scrambled trial | $49.92–$149/mo DL; commercial quote | $99/mo | Licence | High | UNVERIFIED | Commercial tier only | Commercial SECONDARY | 7.2 |
| Injuries/news | RotoWire feeds | News, injuries, lineups, depth | Yes | UNVERIFIED | No | Contact sales | Quote | Licence | High | UNVERIFIED | Yes | Commercial news PRIMARY | 7.1 |
| Injuries/news | FantasyPros API v2 | News, injuries (+ practice probabilities) | UNVERIFIED | UNVERIFIED | Non-prod | $8.99/mo personal; custom commercial | $8.99 | Personal non-commercial | UNVERIFIED | UNVERIFIED | Custom tier | OPTIONAL | 6.0 |
| Rosters/status | nflverse weekly rosters | Status codes, ids | No | 2002– | Yes | – | $0 | CC-BY-4.0 (+GPL-derived ids) | High | 2 runs/day | Risky | PRIMARY (public) | 7.7 |
| Identity | nflverse players | gsis↔espn/pfr/otc/pff/esb | No | All eras | Yes | – | $0 | CC-BY-4.0 | High | Nightly | Moderate | PRIMARY | 7.8 |
| Identity | DynastyProcess ids | Sleeper/RotoWire/Sportradar/Yahoo ids | No | Current | Yes | – | $0 | GPL-3.0 | Medium | Weekly | Unclear | SECONDARY | 6.4 |
| Depth charts | nflverse depth charts | ESPN depth chart snapshots | No | 2001– (format change 2025) | Yes | – | $0 | CC-BY-4.0 over ESPN content | Medium | 2 snapshots/day | Risky | PRIMARY (public, owner decision) | 7.2 |
| Depth charts | Sleeper depth order | Position + order (1,514 players) | Near | None | Yes | – | $0 | As Sleeper | Medium | Near | No | SECONDARY | 6.2 |
| Depth charts | Ourlads | Editorial depth charts | Yes | None | Site only | Licence on request | – | Explicitly forbids automation | High | Same day | No | AVOID | 4.9 |
| Depth charts | Club game-notes PDFs | Official club depth chart | Weekly | Varies | Yes | – | $0 | Club terms | Official | Weekly | No | Manual only | 5.1 |
| Transactions | ESPN JSON (local) | All move types | Yes | 25/page | Yes | – | $0 | Disney ToU | High | Daily | No | PRIMARY (local only) | 6.1 |
| Transactions | NFL.com transactions | Official categories, date only | Yes | 1965– | Yes | – | $0 | §1.3 | Authoritative | Same day | No | Manual reference | 6.1 |
| Transactions | Sportradar Daily Transactions | All transfers per league day | Yes | Multi-season | Trial | Contact sales | Quote | B2B | High | Real time | Yes | Commercial PRIMARY | 7.6 |
| Transactions | nflverse trades | Trades only | No | 2002–2026-04 | Yes | – | $0 | CC-BY release, no upstream licence | Good but stale | Months | Unclear | Historical only | 6.6 |
| Transactions | nflverse roster diffs (derived) | Team/status changes week to week | No | 2002– | Yes | – | $0 | As rosters | Medium | Up to a week | Risky | FALLBACK (public) | – |
| Contracts | nflverse contracts (OTC) | Contracts, cap by year | No | Deep | Yes | – | $0 | OTC terms prohibit | High | Daily | No | AVOID public | 6.6 |
| Contracts | OverTheCap | Contracts, cap, transactions | Yes | Deep | Site only | Licence via support@ | Quote | Terms prohibit | High | UNVERIFIED | Licence | Commercial candidate | 6.0 |
| Contracts | Spotrac | Contracts, transactions | UNVERIFIED | Deep | Site only | UNVERIFIED | – | Blocks automation | UNVERIFIED | UNVERIFIED | No | AVOID | 4.9 |
| Cap | NFLPA report | Team cap | – | – | Site only | – | $0 | Personal use only | Official | – | No | Manual | 4.9 |
| Official feeds | NFL media portal | Injury reports, transactions, game-day rosters | Yes | – | Accredited only | – | – | Gated (401) | Official | Fastest (inferred) | No | AVOID | 5.8 |
| News | Rotoworld (NBC) | Player news | Yes | Recent | Site | – | $0 | NBC terms | High | Minutes | No | AVOID automated | 5.2 |

## 4. Redundancy

| Data category | PRIMARY → SECONDARY → FALLBACK | Real backup? |
|---|---|---|
| Official game status and practice participation | nflverse injuries (public) → ESPN injuries (local server only) → Sleeper `injury_status`, shown as "Sleeper status", never as official | **Partial.** The public site has only nflverse; Sleeper is not the same quantity and its terms are disputed |
| Practice participation by day (Wed/Thu/Fri) | Our own snapshots of nflverse injuries (two a day) → ESPN (local) → none | **No.** nflverse keeps one value per player-week; Sleeper's practice fields are empty (1 of 2,778) |
| Injury return dates | ESPN (local) → Sportradar `estimated_return_date` (paid) → rule-based IR eligibility (placement date + 4 games) | **No free public source** |
| IR / PUP / NFI / suspended / exempt lists | nflverse weekly rosters `status` (RES, PUP, SUS, EXE, RSN) → nflverse `players.csv` status → Sleeper `injury_status` IR/PUP/Sus | Yes (two nflverse files share one upstream, so not independent); Sleeper is the independent check |
| Game-day inactives | ESPN game summary (local) → nflverse weekly rosters `ACT`+`I01` (meaning UNVERIFIED) → none | **No confirmed source** |
| Active rosters and practice squads | nflverse weekly rosters → Sleeper `team` (labels practice squad as "Active") → ESPN rosters (local) | Yes |
| Depth charts | nflverse depth charts (ESPN-derived) → Sleeper `depth_chart_order` → last game's starters (snap counts or play-by-play participation; not researched here) | **Weak.** Both free sources are editorial; nflverse is ESPN's data, so ESPN-local is not an independent backup |
| Transactions (signings, waivers, IR, releases, elevations) | ESPN transactions (local only) → week-to-week diffs of nflverse weekly rosters (delayed up to a week, no move type beyond status) → curated news (`data/news.json`) | **No public near-real-time source.** Commercial: Sportradar Daily Transactions |
| Trades | ESPN (local) → nflverse trades (historical; stale since 2026-04-17) → curated news | No current backup |
| Contracts, extensions, restructures, tags | None usable for public display. nflverse contracts (OTC) only for private analysis if the owner accepts the risk | **No** (licence needed: OTC, Spotrac or a commercial vendor) |
| League salary cap | NFL.com announcement (manual fact) → NFLPA report (manual) | Yes (manual) |
| Player identity | nflverse `players.csv` (gsis key) → nflverse weekly rosters ids (Sleeper etc., GPL-derived) → Sleeper's own `gsis_id`/`espn_id`/`sportradar_id` → name+team+position match, flagged unresolved | Yes |

### Player identity across sources

| Id | Example form | Where the crosswalk comes from | Coverage measured 2026-11-25 |
|---|---|---|---|
| GSIS (`gsis_id`) | `00-0034381` | NFL; canonical key in every nflverse file (injuries, rosters, depth charts, contracts) | 100% of nflverse injuries 2026; 2,591/2,592 week-12 roster rows |
| ESPN (`espn_id`) | `3693166` | nflverse `players.csv` (nflverse-players `players_espn_release`), rosters, depth charts | Rosters 1,964/2,592; `players.csv` fills 608 of the 628 gaps |
| Sleeper (`sleeper_id`) | numeric string | nflverse weekly rosters ← `load_ff_playerids()` ← DynastyProcess (GPL-3.0); Sleeper's own record carries `gsis_id` only for 568 of 2,778 team players | 1,835/2,592; of the 757 gaps only 121 are recoverable through Sleeper's own gsis/espn ids, leaving 636 (mostly practice-squad and reserve, but 416 active) |
| PFR (`pfr_id`) | `MahoPa00` form | `players.csv`, rosters; key of nflverse trades | 1,956/2,592 |
| OverTheCap (`otc_id`) | integer | `players.csv` (fetched from OTC), contracts | 2,477/2,592 via `players.csv` |
| Spotrac | integer in URL | No crosswalk found in nflverse or Sleeper | 0 |
| Sportradar | UUID | rosters (DynastyProcess-derived), Sleeper `sportradar_id` (2,709/2,778 team players) | 1,835/2,592 |
| RotoWire | integer | rosters, Sleeper `rotowire_id` (2,587/2,778) | 1,964/2,592 |

Rules (proposed): canonical key = `gsis_id`; every alias row keeps `{source, sourceId, method: "id"|"name-team-pos", seenAt}`; name matches strip suffixes (as already done for FantasyPros) and never merge silently — they go to an unresolved list until two independent ids agree. nflverse-players' manual-override file is the model for our overrides.

## 5. Derived metrics

| RAW DATA REQUIRED | CALCULATION | RESULT |
|---|---|---|
| nflverse injuries snapshots (every run) | For each player-week, order the observed `practice_status` values by `seenAt`; map DNP=0, LP=1, FP=2 | Practice trajectory (e.g. DNP→LP→FP) — only possible if we keep snapshots, since nflverse keeps the last value |
| nflverse injuries 2009–2025 + whether the player played (snap counts or weekly roster `I01`, to be verified) | Empirical P(played \| final game status, final practice status, position group), with season-level cross-validation | Calibrated "chance to play" per designation; a model input only after a backtest (house rule) |
| Injury rows + depth chart rank-1 + position weights | Existing `burden` index (DATA_MODEL.md) | Team injury burden (descriptive) |
| Depth chart snapshots | Count changed (team, group, slot, rank, player) tuples between consecutive snapshots | Depth-chart volatility per team-week (measured median 7 teams and 4.5 starter changes per 12-h snapshot, Nov 16–25) |
| Reserve/Injured placement date (ESPN local, or first `seenAt` of RES in rosters) + schedule | Placement week + 4 games played by the team; eligibility if a designation remains (8 per season) | IR return-eligible week (rule-based, labelled "rule estimate") |
| Weekly rosters week w and w−1 | Per gsis_id: team change, status change (ACT→RES, DEV→ACT, ACT→CUT …) | Roster-move events (delayed transactions proxy) and team churn counts |
| Sleeper `news_updated` vs nflverse injuries | Flag players whose Sleeper status changed after the latest official report | "Reported since the official report" marker (reported claim, not fact) |
| Contracts `season_history.cap_number` + $301.2M cap | cap_number / cap | Cap share — blocked for public use by OTC terms |

### Depth Chart History (design)

Goal: a per-player timeline (starter → backup → inactive → injured → starter) with provenance.

1. **Snapshots (raw, append-only).** `depth_snapshot {source, team, sourceAsOf (nflverse dt), fetchedAt, contentHash}` and `depth_slot {snapshotId, group, slot (pos_abb+pos_slot), rank, playerKey (gsis, else espn), rawName}`. Only store a snapshot when `contentHash` changes (most afternoon snapshots are unchanged). History before 2025 comes from the weekly 2001–2024 files (different format: `depth_team`, `formation`, `depth_position`); keep `format: "nfl-dx-weekly"|"espn-snapshot"` and never compare ranks across formats without a mapping table.
2. **Events (derived).** Diff consecutive snapshots per source and team: `depth_change {subtype: added|removed|promoted|demoted|starter_changed|position_changed, team, player, group, slot, fromRank, toRank, ts: estimated, data.between: [prev.sourceAsOf, this.sourceAsOf], seenAt, source}`. Fits the existing Event shape (`data.tsEstimated`, `data.between`).
3. **Player state per game week (fused).** One state per player-week built from independent signals, each kept with its source: roster status (nflverse rosters: ACT/DEV/RES/PUP/SUS/EXE/CUT), injury designation (nflverse injuries), depth rank (nflverse depth; Sleeper as second opinion), game-day activity (inactive or active; source to be confirmed), actual participation (snap counts; out of scope here). Derived state order: `released` > `reserve(IR/PUP/NFI/SUS/EXE)` > `out` > `inactive` > `starter` (rank 1 and active) > `backup` (rank ≥ 2) > `practice squad`.
4. **Conflict handling.** Never overwrite: store per-source values and a `conflict` object when sources disagree (e.g. depth chart rank 1 but roster RES). Precedence for display: official roster status and official designation over depth chart; depth chart over Sleeper. A depth change that reverts in the next snapshot is marked `flap: true` and hidden from feeds; changes persisting for two snapshots are "confirmed". Players unmatched by id stay in an unresolved list.
5. **Point-in-time replay.** Backtests read states as of `seenAt` (not `sourceAsOf`), consistent with DATA_MODEL.md. nflverse `dt` is a load time, not the club's effective time.
6. **Cost.** At about 2,350 rows a snapshot and two snapshots a day, raw storage is about 1.7 million slot rows a season before de-duplication; storing only changed snapshots (hash) cuts this sharply. The fabric already scans the 80 MB CSV for each team's newest `dt`; for history, download only when `timestamp.json` changes.

### Speed and reliability comparison (measurement design)

No published, primary evidence comparing the speed of the NFL, ESPN, Sleeper, RotoWire, news sites and social media was found: **UNVERIFIED**. Proposed measurement with the existing fabric:

- **Facts to track.** Injury designation `(gsis, season, week, status)`, practice entry `(gsis, date, practice_status)`, reserve move `(gsis, RES|PUP|…)`, transaction `(gsis or name+team, type, date)`.
- **Per source, record `firstSeenAt`** (the fabric's `seenAt`) in an `observations` log: `{factKey, source, value, firstSeenAt, pollIntervalSec}`. Sources the project may poll: nflverse (public; every 30 min reading `timestamp.json`, cheap), Sleeper (at most once a day per docs, so it cannot win a speed race unless the owner obtains approval for more), ESPN (local server only, 15 min), curated news (manual timestamps). NFL.com, RotoWire, Rotoworld and X are **not** polled; a person may note their times by hand during a sample window.
- **Reference time.** Official deadline from the policy (e.g. 21:00 UTC for a 4 p.m. ET report; UNVERIFIED) or the earliest manual official sighting.
- **Metrics.** Median and 90th-percentile lag to the reference; coverage within 24 h; disagreement rate (source value never matching the official final); flip rate.
- **Window.** Four consecutive weeks including Thursday, Saturday (late season), Sunday and Monday games; extra polling Wed–Fri 18:00–23:00 UTC and Sundays from 15:00 UTC for inactives.
- **Resolution.** Lag cannot be measured more finely than the poll interval; report it as `≤ interval`.
- **Expected outcome (inference, to be tested):** ESPN local fastest among usable sources; nflverse about 10 hours behind a 4 p.m. ET report; Sleeper limited by once-a-day polling.

## 6. Gaps

- **Near-real-time transactions for a public page:** none free and licensed. NFL.com bars systematic retrieval; ESPN is local-only; NFL Communications' portal is login-only (401); nflverse trades are stale; roster diffs lag up to a week. Paid: Sportradar Daily Transactions.
- **Contracts, extensions, restructures, franchise tags, cap space:** no free source permits republication. OTC and Spotrac terms prohibit it; NFLPA allows personal use only; nflverse contracts inherit OTC's restriction and have no current CSV (parquet/rds only). License OTC (or a vendor) for a serious product.
- **Game-day inactives:** no confirmed free public source; the NFL media portal has game-day rosters behind a login. The meaning of nflverse status code `I01` needs confirmation before use.
- **Day-by-day practice participation:** not kept by nflverse; must be captured by our own snapshots from now on (past days are lost).
- **Injury return timelines:** ESPN (local) or Sportradar (paid) only.
- **Independent depth charts:** every free machine-readable depth chart is ESPN's (via nflverse) or Sleeper's; Ourlads and RotoWire forbid automated monitoring; club PDFs are manual.
- **Expensive:** Sportradar, Genius Sports, RotoWire, SportsDataIO commercial (all quote-only); Sports-Reference custom data from $5,000.
- **Avoid:** Ourlads (explicit anti-monitoring terms), Spotrac and prosportstransactions (block automation; terms unreadable), RotoWire site scraping (Article VI/VII), CBS/Yahoo/Rotoworld scraping, the NFL Shield API directly, any login-gated NFL portal.

## 7. Contradictions & UNVERIFIED

**Contradictions with the project's documents**
1. Registry row `nflverse-depth`: "Usable? Yes: CC-BY-4.0". Since 2025-08-03 the data is ESPN's depth chart collected by `nflverse.espn` (builder commit; nflreadr NEWS 1.5.0), and nflreadr says NFL data stay governed by their owners' terms. The public page therefore shows ESPN-derived depth charts, which DEC-006 otherwise keeps local-only. Needs an owner decision and a registry note.
2. Registry: nflverse depth charts "a snapshot per team per day". In-season there are **two** snapshots a day (54 `dt` values in 27 days, every team in each).
3. FEATURE_RESEARCH.md §5: "nflverse `players.csv` + `roster_2026.csv`: a permissive player-id crosswalk ... Removes the need for the GPL dynastyprocess file". `players.csv` has no `sleeper_id`, and the roster file's `sleeper_id`, `rotowire_id`, `sportradar_id`, `yahoo_id`, `fantasy_data_id` come from DynastyProcess (GPL-3.0) through `load_ff_playerids()`. The GPL dependency is indirect, not removed.
4. Registry row `sleeper-trending`: "Conditions: non-commercial, credit Sleeper". Sleeper's General Terms, last updated 2026-11-17, §11.1 and §11.3 bar automated retrieval without a written agreement "or other approval". Whether docs.sleeper.com is that approval is an open owner question.
5. Registry: ESPN transactions fallback "None found (nflverse has trades only)". Even trades are not current: newest nflverse trade 2026-04-17, release updated 2026-05-19, while NFL.com lists trades dated 2026-11-10.
6. nflreadr `dictionary_injuries.csv` lists `date_modified`; `injuries_2026.csv` does not contain it (2024 file does). Its header also gains `season_type` alongside `game_type`.
7. Registry: Sleeper `/players/nfl` "about 5 MB". Measured 14,663,309 bytes uncompressed (Sleeper's docs say "average size ... 5MB").
8. Registry: nflverse injuries/rosters "daily". They run twice a day (≈07:00 UTC dispatch and a scheduled run that GitHub starts 7–12 h late).
9. DATA_MODEL.md line 12 says Sleeper and nflverse player ids are "not mapped yet", while the registry and the `fantasy` block say the weekly-roster crosswalk is wired (internal inconsistency).

**UNVERIFIED (and why)**
- Primary text of the current NFL injury-report policy (report days, 4 p.m. ET deadline, Thursday/Saturday/Monday schedules): the 2016 operations page is 404; only secondary sources found.
- Inactives about 90 minutes before kickoff: no primary source read (search budget exhausted).
- 2025–2026 changes to IR, PUP, practice-squad size and elevation limits; the postseason designation rule (NFL.com 2024 list shows a Detroit "unlimited" amendment; Pro Football Rumors reports two extra).
- Meaning of nflverse `status_description_abbr` codes (A01, I01, I02, P01–P07, R01, R04, R05, R40, R48, R49, W03, E02).
- Whether NFL.com transactions list practice-squad elevations, extensions, restructures, franchise tags and retirements (not seen on first pages sampled).
- Sportradar's status as an "official" NFL source today (its URL path says `official`; reporting says Genius Sports holds exclusive official distribution since 2021); Genius's injury/roster products.
- All commercial prices except Discovery Lab and FantasyPros (RotoWire, Sportradar, SportsDataIO commercial, Genius, OTC licence, Spotrac): not published.
- FantasyPros `/nfl/injuries` and `/nfl/news` field lists and latency (docs answered 403; no key used).
- Spotrac and prosportstransactions terms (sites block automated readers).
- X/Bluesky API costs and terms.
- Any latency ranking among sources (see the measurement design).

**Claim most at risk of being wrong:** the inferred "~10 h" lag of nflverse injuries behind the official report. It rests on run times and on an unverified 4 p.m. ET publication time; nflverse could add runs at any time.

## 8. Research log

All on 2026-11-25. "gh" = `gh api` (read-only); "curl" = generic UA, no cookies.

**Repository files read (read-only):** CLAUDE.md; docs/NFL_DATA_SOURCE_REGISTRY.md; docs/GITHUB_RESEARCH.md; docs/DATA_MODEL.md (lines 1–98); docs/FEATURE_RESEARCH.md lines 160–244; lib/fabric/adapters/public.js (grep); docs/DECISIONS.md (grep).

**GitHub (gh):**
- `repos/nflverse/nflverse-data/releases` (25 tags) and tags injuries, depth_charts, weekly_rosters, rosters, contracts, trades, players (bodies, assets, sizes, update times) — OK
- `repos/nflverse/nflreadr/contents/data-raw` + dictionaries injuries, depth_charts, rosters, roster_status, contracts, trades, players — OK
- `repos/nflverse/nflreadr` NEWS.md (depth-chart source change), README (terms of use), R/load_contracts.R, vignettes/articles/nflverse_data_schedule.Rmd — OK
- `repos/nflverse/nflverse-data/contents/.github/workflows` (no update workflows there), LICENSE.md, README — OK
- `orgs/nflverse/repos` — OK
- `repos/nflverse/nflverse-rosters` workflows update_injuries.yaml, update_depth_charts.yaml, update_rosters.yaml; exec/update-injuries.R, exec/update-depth-charts.R (+ commit history), R/rosters_shield.R, R/rosters_dataexchange.R, R/utils_roster_ids.R; Actions runs for the three workflows (30 each) — OK
- `repos/nflverse/nflapi`, `repos/nflverse/nflverse.espn` — 404 (private/not found)
- `repos/nflverse/rotc` DESCRIPTION, LICENSE.md, R/otc_historical_contracts.R, R/otc_player_details.R, workflows/update_otc.yaml — OK
- `repos/nflverse/nflverse-players` README — OK
- `repos/nflverse/nfldata` commits for data/trades.csv — OK
- `repos/dynastyprocess/data` (licence, README, weekly-playerids.yml, files list), code search "mfl" — OK
- `gh search code "R48" / "status_description_abbr" --owner nflverse` — no useful result

**Files downloaded to scratch (curl):** nflverse `injuries_2026.csv` (410 KB), `roster_weekly_2026.csv` (9.6 MB), `players.csv` (7.3 MB), `trades.csv` (287 KB), first 12 MB of `depth_charts_2026.csv`, first lines of `depth_charts_2024.csv`, `depth_charts_2025.csv`, `injuries_2024.csv`; `timestamp.json` for six releases; Sleeper `https://api.sleeper.app/v1/players/nfl` (once; 200; 14,663,309 bytes; headers kept).

**Pages probed or read (curl unless noted):**
- https://www.nfl.com/injuries/ (WebFetch) — week 12 structure; https://www.nfl.com/robots.txt — read; https://www.nfl.com/legal/terms/ — read in full
- https://www.nfl.com/transactions/ and `/transactions/league/{reserve-list,signings,waivers,terminations,other}/2026/11`, `other/2026/9`, `other/2026/3`, `reserve-list/2026/9`, `signings/2026/9`, `signings/2026/3`, `terminations/2026/3` — parsed
- https://www.nfl.com/news/competition-committee-approves-revisions-to-injury-report-0ap3000000688693 (WebFetch) — read
- https://www.nfl.com/news/nfl-training-camp-roster-faqs-defining-injured-reserve-pup-list-nfi-and-more (WebFetch) — read
- https://www.nfl.com/news/approved-2024-nfl-season-playing-rules-bylaws-and-resolutions (WebFetch) — read
- https://operations.nfl.com/updates/football-ops/2016-nfl-injury-report-policy (WebFetch) — 404; https://operations.nfl.com/ — links listed; /the-rules/ 404; robots.txt 404; /rules-officiating/enforcement/compliance and /nfl-football-basics/football-terms — no injury-report policy
- https://media.nfl.com/football-information — links; `/news-and-releases/media/{injury-reports,transactions,game-day-rosters}` — 401; nflcommunications.com → media.nfl.com
- https://www.profootballrumors.com/2024/06/nfl-issues-new-rules-for-ir-activations (WebFetch) — read
- https://www.nationalfootballpost.com/2026/10/23/nfl-injured-reserve-rules (WebFetch) — 403
- https://docs.sleeper.com/ (WebFetch) — read; https://support.sleeper.com/en/articles/5486620-general-terms-of-use (WebFetch ×2, curl) — read
- https://sportsdata.io/nfl-api (WebFetch) — read; https://discoverylab.sportsdata.io/personal-use-apis/nfl (WebFetch, curl; embedded plan JSON parsed); https://discoverylab.sportsdata.io/terms-of-service (curl) — read
- https://developer.sportradar.com/football/docs/nfl-ig-api-basics, .../nfl-ig-update-frequencies, https://developer.sportradar.com/sportradar-updates/changelog/nfl-api-estimated-injury-return-date (WebFetch) — read
- https://www.fantasypros.com/api-data/ (WebFetch) — read; https://api.fantasypros.com/v2/docs (WebFetch) — 403
- https://www.rotowire.com/robots.txt, /llms.txt, /termsandconditions.php, /partner/, /football/injury-report.php (200); /terms.php, /legal/terms.php, /partners/, /data/, /content-partners.php, /football/nfl-depth-charts.php (404)
- https://www.rotoworld.com/ redirects to https://www.nbcsports.com/fantasy; https://www.nbcsports.com/fantasy/football/player-news (WebFetch) — read
- https://www.ourlads.com/nfldepthcharts/, /robots.txt, /tc/ — read; /terms/, /terms.cfm — 404
- https://overthecap.com/terms → /terms-and-conditions — read; /robots.txt — read; /api — 401; /terms-of-use — 404
- https://www.spotrac.com/terms, /robots.txt, /api — 403 (curl); /terms and /service (WebFetch) — 402
- https://nflpa.com/public-salary-cap-report → /reports/public-salary-cap-report (shell only); https://nflpa.com/tos — read; /salary-cap, /active-players/salary-cap — 404
- https://www.sports-reference.com/data_use.html (WebFetch) — read
- https://www.prosportstransactions.com/ and /robots.txt — 403
- https://www.cbssports.com/nfl/injuries/ — 200 (status only)

**Web searches (WebSearch):**
1. "NFL injury report policy 2026 practice participation Wednesday Thursday Friday game status designations" (standard) — NFL.com weekly pages only
2. "NFL operations "injury report" policy questionable doubtful out "probable" eliminated 2016" (standard) — 2016 change coverage, NFL.com article
3. "NFL injured reserve designated to return 2026 rules number of players return 8 games" (standard) — secondary explainers
4. "operations.nfl.com injury report policy practice report "4 p.m." game status report Friday Thursday games" (extended) — secondary sources on deadlines
5. "site:operations.nfl.com injury report" (standard) — nothing on that host
6. "NFL injury report rules "Game Status Report" "Practice Report" clubs must Wednesday "Tuesday" Thursday night game estimated practice report" (extended) — secondary only
7. ""injury report policy" NFL 2025 OR 2026 change league memo clubs fined inaccurate injury report" (extended) — no 2025/26 policy change found
8. "NFL.com terms and conditions automated means scraping "data mining" robots nfl.com/legal/terms" (standard) — pointed to terms page
9. "NFL owners approve injured reserve designated for return eight players 2025 OR 2026 rule change nfl.com" (extended) — 2022 rules; no 2025/26 NFL.com article
10. "nfl.com 2024 owners approve injured reserve two players designated return roster cutdown postseason additional designations" (standard) — 2024 bylaws
11. "OverTheCap nflverse load_contracts permission Jason Fitzgerald data partnership" (standard) — no permission found
12. "Over The Cap data license API "overthecap" licensing contracts data feed" (standard) — nothing official
13. "Sleeper API terms of service commercial use "api.sleeper.app" developers" (standard) — led to General Terms
14. "SportsDataIO NFL API injuries depth charts pricing free trial 2026" (extended)
15. "Sportradar NFL API v7 injuries depth charts transactions endpoint documentation trial" (standard)
16. "RotoWire data feeds API NFL injuries news pricing license" (extended) — no official price
17. "SportsDataIO "Discovery Lab" NFL personal use price per month injuries depth charts" (extended) — third-party prices (then verified on the vendor page)
18. "Sportradar NFL exclusive official data distribution partnership extension 2025 2026 Genius Sports" (standard)
19. "Sportradar developer portal trial key 30 days 1,000 requests NFL "trial" QPS limit" (standard)
20. "FantasyPros API v2 documentation news endpoint injuries "api.fantasypros.com" public/v2" (extended)
21. "Rotoworld player news moved NBC Sports 2026 "player news" fantasy football rotoworld.com redirect" (standard)
22. "NFL 2026 salary cap set official figure per club nfl.com announced" (standard)
23. "NFLPA public salary cap report team cap space "NFLPA" salary cap report page" (standard)
24. "Spotrac API data licensing contracts transactions feed "Spotrac" terms of use scraping" (extended)
25. "prosportstransactions.com football NFL transactions database terms of use copyright reproduction" — **not run**: session web-search budget exhausted
26. "NFL transaction wire daily personnel notice clubs "transaction wire" practice squad elevations standard elevation reverted" — **not run**: budget exhausted

Searches stopped producing new primary sources for injury-report policy text after query 7; the remaining open items need either a follow-up session with search budget or the owner contacting the providers.
