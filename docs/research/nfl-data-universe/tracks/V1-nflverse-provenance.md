# V1 — nflverse provenance verification (Nov. 25, 2026)

Verifier: adversarial red-team agent. Evidence = primary repo code/workflows/READMEs/licences/release metadata via gh CLI and curl.

## Claim 1 — depth charts from ESPN since ~2025-08-03, twice-daily snapshots (`dt`)
**Verdict: CONFIRMED (source and date); PARTLY (cadence: twice daily only since ~2026-09-17, schedule says daily).**

Evidence:
- Builder: `nflverse/nflverse-rosters` `exec/update-depth-charts.R` (`gh api repos/nflverse/nflverse-rosters/contents/exec/update-depth-charts.R`). Calls `nflverse.espn::espn_depth_charts(season = szn)`, joins gsis_id from the nflverse-players espn_id map, prepends to the previous file, saves to release tag `depth_charts`.
- Switch date: commit `c1390bb` 2025-08-03T10:17:00Z "use nflverse.espn for depth charts" (`gh api 'repos/nflverse/nflverse-rosters/commits?path=exec/update-depth-charts.R'`).
- Prior source (commit f36b8cb version): NFL Data Exchange, `https://www.nfl.info/nfldataexchange/dataexchange.asmx/getGameDepthChart`, HTTP basic auth with `NFLDX_USERNAME/NFLDX_PASSWORD` secrets.
- nflreadr NEWS.md line 32: "the data source had to be changed from NFL Data Exchange to ESPN".
- The `nflverse.espn` package: DESCRIPTION Remotes `nflverse.espn=nflverse/nflverse-espn`; `gh api repos/nflverse/nflverse-espn` -> 404 for an authenticated outside account, so its code is not public (private or absent). The exact ESPN endpoint therefore cannot be verified from public code.
- Cadence: workflow `update_depth_charts.yaml` cron `'7 7 * * *'` (daily). Actual runs: scheduled run (GitHub-delayed to ~15:00–19:00 UTC) plus a `workflow_dispatch` at ~07:00 UTC every day (`gh api repos/nflverse/nflverse-rosters/actions/workflows/update_depth_charts.yaml/runs`); 70 dispatch runs total, earliest 2026-03-21.
- `dt` column measured in `depth_charts_2026.csv.gz` (16.2 MB, updated 2026-11-25T17:56:48Z): 319 distinct `dt` values; 180 days with 1 snapshot, 68 days with 2, 1 with 3. Two-per-day starts 2026-09-17 (gaps since, e.g. 2026-10-21, 2026-11-11 single).
- Release assets: `depth_charts_2026.csv` 80.2 MB uncompressed; `.qs` asset stale since 2026-03-22 (do not use qs).

Implication: the depth-chart starter labels the project commits into `data/fabric/latest.json` are ESPN-derived facts re-published by nflverse under CC-BY-4.0 labelling, but nflverse does not own them; ESPN terms govern the underlying data. Label upstream as "ESPN via nflverse", keep only derived starter labels (not the chart), and treat as "Conditions". Freshness: up to ~12 h stale, not real time; 2025-and-earlier seasons have different schema/source (NFL Data Exchange pre-2025).

## Claim 2 — injuries and weekly rosters come from the NFL's own API via a private wrapper (`nflapi`)
**Verdict: CONFIRMED for injuries; PARTLY for weekly rosters (2016+ weekly rows come from NGS via a second non-public wrapper `ngsscrapR`, with NFL-API "Shield" data and DynastyProcess ids joined in).**

Evidence:
- Injuries: `nflverse/nflverse-rosters` workflow `update_injuries.yaml` (cron `'7 7 * 1,2,9,10,11,12 *'`, daily Sep–Feb only) installs `nflverse/nflapi` with `GITHUB_PAT: secrets.NFLVERSE_GH_TOKEN`; `exec/update-injuries.R` calls `nflapi::nflapi_injuries(season = season)` and saves to tag `injuries`. Release `injuries_2026.csv` 410 KB, updated 2026-11-25T17:59:53Z.
- Rosters: `exec/update_roster.R` -> `R/rosters.R::build_rosters()`. For season >= 2016 the code logs "try to use NGS for weekly rosters" -> `R/rosters_ngs.R` uses `ngsscrapR::scrape_roster()` / `scrape_current_roster()`; season-level fields joined from `build_rosters_shieldapi()` = `nflapi::nflapi_roster(season)` (`R/rosters_shield.R` line 6). 2002–2015: NFL Data Exchange; before 2002: Shield only.
- Wrapper visibility: `gh api repos/nflverse/nflapi` -> 404, `gh api repos/nflverse/ngsscrapR` -> 404, `gh api repos/nflverse/nflverse-espn` -> 404 from an authenticated non-member account, while the DESCRIPTION files list them as Remotes and workflows install them with the org PAT. Conclusion: not publicly accessible; "private" is the strong inference (strictly, private vs deleted is unverifiable from outside). Their endpoints and auth cannot be audited.
- Cadence: rosters daily (`'7 7 * * *'`); `roster_weekly_2026.csv` updated 2026-11-25T17:59:02Z.

Implication: injury designations and roster status are NFL-owned facts obtained through code no outsider can audit; nflverse's CC-BY-4.0 label cannot license NFL data. For a non-commercial static page, short derived facts (status, designation) with "NFL via nflverse" attribution are defensible ("Conditions"); do not mirror the raw files.

## Claim 13 — weekly-roster third-party ids joined from DynastyProcess `db_playerids` (GPL-3.0) via `load_ff_playerids()`; does `players.csv` carry a Sleeper id?
**Verdict: CONFIRMED, and broader than claimed: `espn_id`, `pff_id`, `pfr_id` in weekly rosters also come from DynastyProcess. `players.csv` has NO `sleeper_id`.**

Evidence:
- `nflverse/nflverse-rosters` `R/utils_roster_ids.R::fill_ids()`: `ids <- nflreadr::load_ff_playerids() |> dplyr::select(gsis_id, espn_id, yahoo_id, rotowire_id, pff_id, pfr_id, fantasy_data_id, sleeper_id, sportradar_id)` then `left_join(ids, by = "gsis_id")`. `fill_ids()` is applied to weekly and season rosters in `R/rosters.R`.
- `nflverse/nflreadr` `R/load_ffverse.R`: `load_ff_playerids()` reads `https://github.com/dynastyprocess/data/raw/master/files/db_playerids.rds`.
- `gh api repos/dynastyprocess/data` -> `license: GPL-3.0` (LICENSE = GNU GPL v3). Whether GPL meaningfully attaches to a factual ID crosswalk is a legal question; the declared licence is GPL-3.0 regardless.
- `roster_weekly_2026.csv` header includes `espn_id,sportradar_id,yahoo_id,rotowire_id,pff_id,pfr_id,fantasy_data_id,sleeper_id`.
- `players.csv` (release `players`, 7.3 MB, updated 2026-11-25T18:30:04Z) header: `gsis_id ... esb_id,nfl_id,pfr_id,pff_id,otc_id,espn_id,smart_id ...` — no `sleeper_id`, no yahoo/rotowire/sportradar/fantasy_data ids. Its ids come from the NFL API (`nflapi`), the PFF API (`https://www.pff.com/api/`), PFR via `undercover`, ESPN (`nflverse.espn::espn_athletes()`), OTC (API key) per `R/players_*.R`. DynastyProcess appears only in `data-raw/initial_manual_overwrite.R` (one-off reconciliation seed).
- Project usage (read-only check): `lib/fabric/adapters/public.js:127` builds `bySleeper` from weekly-roster `sleeper_id`; `lib/fabric/index.js:34-35` uses it to attach `name/team/pos/gsisId` to Sleeper trending adds/drops; committed `data/fabric/latest.json` carries 50 `sleeperId` entries whose names/gsisIds were resolved through that crosswalk.

Implication: the project's Sleeper->player crosswalk depends on GPL-3.0 DynastyProcess data even though it never downloads db_playerids directly. Switching to `players.csv` removes the GPL dependency for ESPN<->GSIS (depth charts already carry native `espn_id` + nflverse-mapped `gsis_id`) but loses Sleeper ids. To drop the GPL source entirely, resolve Sleeper trending ids from Sleeper's own public player map (verify its terms and whether it carries gsis/espn ids) or by name+team+position. Owner decision.

## Claim 3 — `contracts` scraped from OverTheCap HTML
**Verdict: CONFIRMED (contract tables are HTML scrapes), with a nuance: the OTC player-id crosswalk comes from an authenticated OTC endpoint (bearer API key), which suggests some arrangement with OTC — not documented publicly.**

Evidence:
- `nflverse/rotc` workflow `update_otc.yaml` (cron `'0 7 * * *'`) runs `data-raw/release_otc_contract_data.R`; `update_otc_player_details.yaml` weekly (`'0 4 * * SUN'`).
- `R/otc_historical_contracts.R` line 22: `httr2::request("https://overthecap.com/contract-history/")` ... `resp_body_html()` ... `rvest::html_table(...)`.
- `R/otc_player_details.R` line 25: `httr2::request(player_url)` with `player_url` like `https://overthecap.com/player/aaron-rodgers/1085/` (HTML).
- `R/otc_player_ids.R`: `req_auth_bearer_token(api_key)` with `OTC_PLAYERID_ENDPOINT` / `OTC_API_KEY` env vars.
- nflreadr `R/load_contracts.R`: "Loads player contracts from OverTheCap.com". Release body: "OverTheCap contract data".
- Release `contracts` assets: `historical_contracts.parquet` 11.4 MB and `.rds` 15.0 MB updated 2026-11-25T18:00:29Z, but **`historical_contracts.csv.gz` is stale since 2022-05-29** and `.qs` since 2026-03-19. A JS/Python reader without parquet support would silently read 2022 data.
- No `rotc` README (404); no public statement of OTC permission found.

Implication: OTC's own content (contract figures are compiled by OTC); no licence to republish beyond nflverse's label. Use for internal analytics only; do not commit contract figures into the public snapshot without OTC permission. Verdict: Owner decision / No for publication.

## Claim 4 — `nextgen_stats` scraped from nextgenstats.nfl.com
**Verdict: CONFIRMED.**

Evidence:
- `nflverse/ngs-data` README: "Next Gen Stats scraped from <https://nextgenstats.nfl.com>".
- `R/ngs_functions.R` lines 19–23: `https://nextgenstats.nfl.com/api/statboard/{type}?season={season}&seasonType=REG[&week=]`; line 29–30 sets a page `referer` and a spoofed browser `user_agent("Mozilla/5.0 (Macintosh; ... Chrome/50...")`.
- Workflow `update_ngs.yaml` cron `'0 7 * 1,2,9-12 *'` (daily Jan–Feb, Sep–Dec) plus daily ~07:00 UTC `workflow_dispatch` runs; types passing/rushing/receiving only.
- Release `nextgen_stats`: combined `ngs_passing|rushing|receiving` (.csv.gz/.parquet/.rds) updated 2026-11-25T17:43–17:44Z; per-season files exist only through 2024; `.qs` stale since 2026-02-28.

Implication: NFL-owned stats taken from an undocumented API with a spoofed browser user agent — the least defensible of the nflverse feeds to republish. Use for internal analysis only; do not commit NGS values into the public snapshot. Verdict: No (for publication) / Owner decision for internal use.

## Claim 5 — `snap_counts`, `pfr_advstats`, `draft_picks`, `combine`, `trades` from Pro Football Reference (via ScrapeOps proxy); 2012 snap counts header-only?
**Verdict: CONFIRMED for snap_counts, pfr_advstats, draft_picks, combine (PFR HTML, ScrapeOps proxy for snaps/draft/combine). PARTLY for trades: credited to PFR in docs, but the collection code is not public. CONFIRMED: 2012 snap-count file is header-only.**

Evidence:
- `nflverse/nflverse-pfr` (repo licence GPL-3.0) workflow `update_snap_counts.yaml`: cron `'0 */6 * 9-12,1 *'` and `'0 */6 1-15 2 *'` (every 6 h in season), env `SCRAPEOPS_API_KEY: secrets.NFLVERSE_SCRAPEOPS_API_KEY`, installs `nflverse/undercover`.
- `R/game_snaps.R` line 9: `https://www.pro-football-reference.com/boxscores/{game_id}.htm` fetched with `undercover::scrapeops_request(...)` (line 13).
- `R/pfr_advanced_stats.R` line 22: `https://www.pro-football-reference.com/years/{s}/{type}_advanced.htm`.
- `R/combine.R` line 6: `https://www.pro-football-reference.com/draft/{year}-combine.htm` via `scrapeops_request`.
- `auto/update_draft_picks.R` line 9: `https://www.pro-football-reference.com/years/{year}/draft.htm` via `scrapeops_request`.
- `nflverse/undercover` DESCRIPTION: "Title: Proxy Scraping", MIT; `R/scrapeops.R` calls `https://proxy.scrapeops.io/v1/` and `http://headers.scrapeops.io/v1/user-agents` (rotating fake browser headers).
- Trades: built from `nflverse/nfldata` `data/trades.csv` (workflow `release_trades.yml`, on push to that file). Commits are "Automated data update" by leesharpe; generating code is not in the repo. `DATASETS.md` line 263: "Credit to Pro Football Reference ... for this information" (the same paragraph says data begins 2010-05-01, but the file starts 2002-03-04, so that doc is stale). `pfr_id`/`pfr_name` columns corroborate PFR.
- Snap counts 2012: `snap_counts_2012.csv` = 154 bytes (updated 2025-10-06T06:50:40Z); fetched content is the header row only. 2013 = 2.15 MB. 2026 = 1.37 MB, updated 2026-11-24T12:01:52Z.

Implication: Sports Reference's terms restrict automated scraping and bulk redistribution; nflverse uses a commercial proxy with rotating user agents to fetch it. Do not republish PFR-derived tables in the public snapshot; any use should be internal and attributed. Snap counts start 2013 in practice.

## Claim 7 — nflverse `trades` ends 2026-04-17
**Verdict: CONFIRMED.**

Evidence: `https://raw.githubusercontent.com/nflverse/nfldata/master/data/trades.csv` (downloaded Nov. 25, 2026): max `trade_date` = 2026-04-17, min = 2002-03-04. Last commit to `data/trades.csv`: 4b74280, 2026-04-19T20:55:16Z (`gh api 'repos/nflverse/nfldata/commits?path=data/trades.csv'`). Release `trades` assets updated 2026-05-19T15:28:23Z; `.qs` stale since 2025-10-01.

Implication: no 2026 in-season trades (including the deadline). Show "trades data ends 2026-04-17" explicitly or do not use for 2026 transactions.

## Claim 6 — `officials` 2026 coverage: week 5 vs week 1 with scraper disabled Sept. 15 after NGS rejected it
**Verdict: "week 1 + disabled Sept. 15 + NGS rejection" CONFIRMED; "week 5" REFUTED.**

Evidence:
- Release `officials` (`gh api repos/nflverse/nflverse-data/releases/tags/officials`): `officials.csv` 1,293,787 B, `updated_at` 2026-09-02T11:48:29Z (all formats same; `.qs` stale since 2026-02-05).
- Downloaded `officials.csv`: 22,012 rows; 2026 rows = 112, all `REG` week 1 (16 games x 7 officials). Note the file was last written 2026-09-02, i.e. before 2026 week 1 was played, so these are pre-game crew assignments from the NGS schedule, not post-game confirmations.
- Builder: `nflverse/nflverse-rosters` `exec/update_officials.R` uses `ngsscrapR::scrape_schedule` and `ngsscrapR::scrape_officials(gameKey = x)` (NGS, non-public wrapper).
- Workflow runs (`gh api repos/nflverse/nflverse-rosters/actions/workflows/update_officials.yaml/runs`): success 2026-09-01 and 2026-09-02; failure every day 2026-09-03 through 2026-09-14 (13 failures incl. one manual dispatch). Job logs (run 34851991065, 2026-09-14; run 33751391633, 2026-09-03): "Request failed [403]. Retrying in 1 seconds..." then `object 'official_id' not found` inside `ngsscrapR::scrape_officials`.
- Commit ecc6ef1, 2026-09-15T07:31:42Z, "Disable schedule because the workflow keeps failing": comments out the cron in `update_officials.yaml`. No runs since.

Implication: nflverse officials are dead for 2026 after week 1. Any referee/crew feature must show "unavailable after 2026 week 1" or use another source (see claim 10: nfldata `referee` column).

## Claim 8 — participation: NGS 2016–2022, FTN 2023 on, released only after the postseason; no 2026 file
**Verdict: CONFIRMED.**

Evidence:
- Release `pbp_participation` (`gh api repos/nflverse/nflverse-data/releases/tags/pbp_participation`), body "Participation data for plays from NGS" (stale wording). CSV assets: 2016–2022 (~21–22.5 MB each) all updated 2023-12-19; 2023 and 2024 (~50 MB) updated 2025-09-04; 2025 (49.1 MB) updated 2026-02-10T18:54:08Z (after the Feb. 2026 Super Bowl); `pbp_participation_old_2023.csv` (old NGS-based 2023, 19.7 MB). No 2026 asset.
- `nflverse/nflverse-ftn` workflow `update_participation.yaml`: `workflow_dispatch` only (no schedule); `exec/update_ftn_participation.R` calls `nflverseftn::ftn_participation(season)` and labels it "Participation Data provided by FTNData.com".
- nflreadr NEWS.md line 33: "FTNData.com has graciously offered to provide participation data after each season has ended ... licensed under CC-BY-SA 4.0 ... credited (for 2023 onwards) to **FTN Data via nflverse**."

Implication: no in-season participation for 2026; anything needing personnel/snap participation in-season must say "not available until after the 2026 postseason". 2023+ participation is CC-BY-SA (share-alike: derived tables would have to be CC-BY-SA too).

## Claim 10 — nfldata `data/games.csv`
**Verdict: mostly CONFIRMED, with corrections: (a) commits are ~every 10–20 min (only when changed); (b) `referee`/`temp`/`wind` empty for every 2026 game after week 4 except one week-5 game; `surface` is empty for played weeks 5–11 but FILLED for unplayed weeks 12–18; (c) moneylines start 2006 but are incomplete (2006: 220/267, 2008: 194/267); spreads/totals complete from 1999; (d) 272 games, 2 Wednesday, 4 Friday, 9 neutral-site — all 9 international.**

Evidence (downloaded `https://raw.githubusercontent.com/nflverse/nfldata/master/data/games.csv`, 2,192,485 B, Nov. 25, 2026 ~20:39 local):
- Commits: `gh api 'repos/nflverse/nfldata/commits?path=data/games.csv&since=...'` -> 100 commits between 2026-11-24T22:35Z and 2026-11-26T01:35Z (timestamps :05/:15/:35/:45 pattern, author leesharpe, "Automated data update"); 85 commits on 2026-11-20, 57 on 2026-11-17. The generating code is not in the repo.
- 2026: 272 rows, all `REG`. Weekday: Sunday 228, Thursday 19, Monday 17, Friday 4, Wednesday 2 (2026-09-09 NE@SEA; 2026-11-25 GB@LA), Saturday 2. Location: Home 263, Neutral 9 = Melbourne (wk1 SF@LA), Rio (wk3 BAL@DAL), London Tottenham (wk4 IND@WAS; wk5 PHI@JAX), London Wembley (wk6 HOU@JAX), Paris (wk7 PIT@NO), Madrid (wk9 CIN@ATL), Munich (wk10 NE@DET), Mexico City (wk11 MIN@SF).
- Fill counts by week (non-empty of n): weeks 1–4 referee 16/16, surface 16/16, temp/wind 10–13/16 (domes are NA by design); week 5 referee 1/15, surface 1/15, temp 0; weeks 6–11 referee/temp/wind/surface 0; weeks 12–18 referee/temp/wind 0 but surface 13–16/16 (pre-filled for future games).
- Odds: `spread_line`, `total_line` first season 1999 (complete every season); `away_moneyline`, `away_spread_odds`, `over_odds` first season 2006.
- Data-quality flags: wk5 PHI@JAX at Tottenham carries `stadium_id` `JAX00` (should be `LON02`); `HOU00` still named "Reliant Stadium". `DATASETS.md` documents columns but not where odds, referee or weather come from. **The nfldata repository has no licence** (`gh api repos/nflverse/nfldata` -> `license: null`). nflreadr `load_schedules()` reads `https://github.com/nflverse/nfldata/raw/master/data/games.rds`.

Implication: games.csv is the freshest schedule/score/line source but unlicensed with undocumented odds/weather provenance. The project already uses schedules; mark odds as "source undocumented", keep referee/weather features off for 2026 after week 4, and flag the stadium-id mismatch for international games (venue/timezone logic).

## Claim 16 — FTN charting: CC-BY-SA 4.0, attribution "FTN Data via nflverse", weekly batches 1.5–3 days after games
**Verdict: licence and attribution CONFIRMED; cadence PARTLY — one batch per week about 2–3 days after Monday night (so 2–7 days after the earliest game of that week), not 1.5–3 days after each game.**

Evidence:
- nflreadr `R/load_ftn_charting.R`: "released under the [CC-BY-SA 4.0] ... attribution must be made to **FTN Data via nflverse**"; also "charted within 48 hours following each game"; data from 2022.
- nflverse-ftn `R/api.R`: base `https://data.ftndata.com`, `Authorization` header from `FTN_API_KEY` (an authorized API feed, not a scrape). Repo code is MIT; release body "Charting data provided by https://FTNFantasy.com/data".
- Workflow `update_ftn.yaml`: cron `'0 */6 * 9-12,1-2 *'` (every 6 h in season); updates only games whose FTN `updated` stamp changed.
- `ftn_charting_2026.csv` (4.7 MB, updated 2026-11-26T00:02:05Z): exactly one `date_pulled` per week for weeks 6–11: wk6 2026-10-22T03:12Z, wk7 10-29T12:15Z, wk8 11-04T23:10Z, wk9 11-12T00:01Z, wk10 11-18T18:01Z, wk11 11-26T00:01Z. Joined to games.csv gamedays: lag 2–3 days from the week's last game, 6–7 days from Thursday games. Weeks 1–5 show later `date_pulled` (Oct 5–Nov 1) because FTN revised them and the rows were re-pulled — `date_pulled` is last pull, not first publication. Week 11 has 13 games charted.

Implication: CC-BY-SA share-alike means any derived table the project publishes from FTN charting must itself be offered under CC-BY-SA 4.0 with "FTN Data via nflverse" credit; keep it out of the CC-BY/no-licence snapshot or label that section separately. Freshness: weekly, Wednesday/Thursday after MNF.

## Claim 9 — nflfastR replaced EP/WP/xpass models in dev build 6.0.0.9001; pbp rebuilt for every season on 2026-11-25; seasons covered; UTC wall-clock per play
**Verdict: model replacement and dev version CONFIRMED. "Every season rebuilt" REFUTED in part: 2001–2026 rebuilt on 2026-11-25; 1999 and 2000 were not (unmaintained since nflfastR 6.0.0). UTC wall-clock per play: CONFIRMED, but it is not new (`time_of_day`, 2011 on).**

Evidence:
- `nflverse/nflfastR` DESCRIPTION `Version: 6.0.0.9001`; commit 6003d63, 2026-11-25T08:00:59Z, "bump dev version to make clear what's included in rebuild" (6.0.0.9000 -> 6.0.0.9001).
- NEWS.md "# nflfastR (development version)": "Rebuilt the EP model", "Rebuilt the regulation win probability model with the Vegas line", "Completely rebuilt the overtime win probability model", "Rebuilt the expected dropback model (`xpass` and `pass_oe`)", "Replaced `fastrmodels::fg_model` with a new field goal model". Stated effect sizes on "312 random games from 2001 to 2026": play `epa` moves 0.08–0.13 on average; `vegas_wp` 1.7 pp; OT `wp` 9 pp. `xpass`/`pass_oe` now also 2001–2005. This is a development version, not a CRAN release.
- Release `pbp` csv.gz `updated_at` (`gh api repos/nflverse/nflverse-data/releases/tags/pbp`): 2006–2023 2026-11-25T08:09–08:25Z; 2001–2005 2026-11-25T16:20–16:24Z; 2024–2025 18:43–18:44Z; 2026 19:09:19Z. **1999: 2025-04-30T06:32:43Z; 2000: 2025-07-16T14:29:04Z (not rebuilt).**
- NEWS.md under "# nflfastR 6.0.0" (line 47): "nflfastR stopped supporting the 1999 and 2000 seasons because of inconsistent data sources. Data is still available through `load_pbp()` but we will not fix any issues". So the tag covers 1999 on, with 1999–2000 frozen on old models/EP definitions — mixing them with 2001+ creates a model discontinuity.
- `time_of_day`: nflreadr `data-raw/dictionary_pbp.csv` line 295: "Time of day of play in UTC "HH:MM:SS" format. Available 2011 and beyond". Verified in `play_by_play_2026.csv.gz` (11.4 MB): 27,637 of 28,467 plays non-empty, ISO UTC with milliseconds, e.g. `2026_01_SF_LA` `start_time` "9/10/26, 20:37:25" (ET) vs `time_of_day` "2026-09-11T00:37:25.343Z". Added years ago (NEWS line 461, old nflfastR 3.x/4.x era, then documented as "Local time"; the current dictionary says UTC and the data agree). 2026 pbp covers weeks 1–11 (28,467 plays).

Implication: any backtest or cached EPA/WP numbers computed before 2026-11-25 are not comparable with today's files (model change, not new information); record the pbp `updated_at`/nflfastR version with every derived value. Exclude 1999–2000 from model work or treat them as a separate regime. `time_of_day` supports leakage-safe "as of" joins from 2011.

## Claim 11 — nfelo / nfeloqb licensing
**Verdict: nfeloqb has NO licence — CONFIRMED. nfelo "made its code private" — CONFIRMED in substance (repo stays public, model source removed and moved private on 2026-11-11). LICENSE: it was ADDED (not changed) on 2026-11-11 and permits republishing original nfelo outputs — CONFIRMED; it does not cover nfeloqb.**

Evidence:
- `gh api repos/greerreNFL/nfeloqb` -> `license: null`, public, pushed 2026-11-25; no LICENSE file in the root listing; `commits?path=LICENSE` -> 0. README: qb_elos.csv "updated every Tuesday and Thursday morning during the NFL season"; "the accompanying CSV uses 538's original model for all seasons up until 2023. From 2023 onward, it uses the improved nfeloqb model". Last data commit 88d7857, 2026-11-25T04:57:19Z.
- `gh api repos/greerreNFL/nfelo` -> public, licence "Other" (NOASSERTION). `commits?path=LICENSE` -> only d939be1, 2026-11-11T21:09:32Z "license", file status `added` (38 lines). Next commit e6cb0f0, 2026-11-11T23:35:41Z "deprecating public repo": 76 files removed, 7 modified, 1 added. README now: "As of November 11th, 2026, this repository no longer contains the nfelo model source" and outputs continue in `output_data/`.
- Current LICENSE (nfelo): covers "the original software ... and ... the original nfelo numbers in files in output_data/"; excludes "third-party software, datasets, columns". Grants: "you may read, quote, reference, analyze, and republish"; "If you republish original nfelo outputs ... you may do so without including this license." Denies running/importing the software or making derivative works of the software. "All rights not expressly granted are reserved."

Implication: the project's `scripts/build.py` reads `https://raw.githubusercontent.com/greerreNFL/nfeloqb/main/qb_elos.csv` — an unlicensed file (default all rights reserved) whose pre-2023 rows are FiveThirtyEight's numbers (CC-BY-4.0) and 2023+ rows are nfeloqb model output. The nfelo LICENSE's output permission is specific to the nfelo repo's `output_data/`; it is suggestive of the author's intent but does not legally cover nfeloqb. Verdict: Owner decision (ask the author, or switch to nfelo `output_data/` files which now have explicit republish permission; keep the existing "credit nfeloapp.com").

## Claim 12 — Neil Paine MIT Elo 1920–2024; FiveThirtyEight nfl-elo status and redirect
**Verdict: CONFIRMED on all points.**

Evidence:
- Repo `Neil-Paine-1/NFL-elo-ratings` (`gh search repos 'nfl elo' --owner Neil-Paine-1`): licence MIT (`LICENSE.txt` "MIT License / Copyright (c) 2024 Neil Paine"); single file `NFL-elo-ratings.csv` 4.1 MB; seasons 1920–2024, last date 2025-02-09 (Super Bowl LIX); 570 rows for 2024 (one row per team per game); last commit 2025-02-10T21:06:45Z — no 2025 or 2026 season. README is two lines; no methodology doc in repo.
- `fivethirtyeight/data` (licence CC-BY-4.0; README: "Unless otherwise noted, our data sets are available under the [CC BY 4.0]"); folder `nfl-elo/` contains only `README.md` (2,647 B) that links to `https://projects.fivethirtyeight.com/nfl-api/nfl_elo.csv` and `nfl_elo_latest.csv` — the CSVs themselves are NOT in the repo. Last nfl-elo commit 2021-10-14.
- `curl -I https://projects.fivethirtyeight.com/nfl-api/nfl_elo.csv` -> `302` to `https://abcnews.go.com/politics` (same for `nfl_elo_latest.csv`); following redirects ends at `https://abcnews.com/politics` (200). The 538 data are gone from their original URL.

Implication: for historical Elo back-tests use Paine's MIT file (credit Neil Paine; frozen at 2024) or archived copies of 538's CSV (CC-BY-4.0, credit FiveThirtyEight) — the original 538 URL is dead.

## Claim 14 — nflreadr: NFL data "belong to their respective owners, and are governed by their terms of use"
**Verdict: CONFIRMED (exact wording and location).**

Evidence: `nflverse/nflreadr` README.md (`gh api repos/nflverse/nflreadr/readme`), section "## Terms of Use", lines 167–172: "The R code for this package is released as open source under the MIT License. NFL data accessed by this package belong to their respective owners, and are governed by their terms of use." The same sentence appears in `nflverse/nflverse` README.md (lines 86–89) and in nflplotR / NFLData.jl READMEs (`gh search code 'respective owners' --owner nflverse`).

Implication: nflverse itself disclaims ownership of the underlying data; the project must look through nflverse to each upstream owner (NFL, ESPN, Sports Reference, OTC, FTN) rather than rely on nflverse's licence label.

## Claim 15 — nflverse-data LICENSE: CC-BY-4.0? carve-out for third-party data?
**Verdict: CONFIRMED CC-BY-4.0; NO carve-out in the licence file itself — the only third-party disclaimer is the nflreadr/nflverse README sentence (claim 14), plus FTN's CC-BY-SA notice in nflreadr docs.**

Evidence: `gh api repos/nflverse/nflverse-data/license` -> `spdx_id CC-BY-4.0`, `LICENSE.md` 18,651 B = verbatim CC BY 4.0 legal code ("Attribution 4.0 International"); grep finds no nflverse-, NFL-, ESPN-, FTN- or third-party-specific text. DESCRIPTION `License: CC BY 4.0`. README describes the repo as "all of the data powered/scraped via GitHub Actions" and says nothing about licensing. The CC BY 4.0 text itself (Section 2) can only license rights the licensor holds — so it does not license ESPN/NFL/PFR/OTC content; it does not say so explicitly.

Implication: the CC-BY-4.0 label is internally inconsistent with FTN's CC-BY-SA 4.0 data published in the same releases (ftn_charting, 2023+ participation) and with the README disclaimer. Treat CC-BY-4.0 as covering only nflverse's own contributions (cleaning, joins, derived model outputs such as EPA/WP from nflfastR), and credit "nflverse" in addition to each upstream owner.

## Cross-cutting findings the research agents did not raise

1. **Four non-public wrappers do the fetching.** `nflapi` (NFL API: injuries, rosters, players, raw pbp — also `nflverse/nflverse-pbp-internal` workflow `refresh_raw_pbp.yaml` installs `nflverse/nflapi`), `ngsscrapR` (NGS: weekly rosters 2016+, officials), `nflverse-espn` (ESPN: depth charts, player ids) all return 404 to outside accounts. The exact endpoints and auth of the most important feeds cannot be audited.
2. **Stale format traps.** `historical_contracts.csv.gz` last updated 2022-05-29 while parquet/rds are current; `.qs` files are stale across tags (depth_charts 2026-03-22, players 2026-03-19, nextgen 2026-02-28, officials 2026-02-05, trades 2025-10-01). The project's adapters read `.csv` — fine for depth charts/rosters/injuries, wrong for contracts.
3. **nfldata has no licence**, yet its schedules are re-released under nflverse-data's CC-BY-4.0 label (`schedules` tag via `release_games.yml`).
4. **Weekly-roster `espn_id` is DynastyProcess-derived too** (not only sleeper/yahoo/rotowire/sportradar/fantasy_data). The project reads `espn_id` from weekly rosters (`lib/fabric/adapters/public.js:127`); depth charts carry ESPN's own `espn_id`, and `players.csv` carries an nflverse-maintained `espn_id`.
5. **Data-quality flags in games.csv**: international week-5 game has `stadium_id` `JAX00` with stadium "Tottenham Hotspur Stadium"; Houston still "Reliant Stadium".
6. **pbp model regime change on 2026-11-25**: any stored EPA/WP-derived numbers predating today are on the old models; 1999–2000 never get the new models.

## Registry verdict per nflverse dataset

| dataset | upstream owner | label nflverse applies | recommended verdict | why |
|---|---|---|---|---|
| depth_charts | ESPN (since 2025-08-03; NFL Data Exchange before) via non-public `nflverse.espn` | CC-BY-4.0 (repo) | Conditions | Publish only derived starter labels, credit "ESPN via nflverse", no raw mirror; ~twice-daily snapshots, up to ~12 h stale |
| injuries | NFL (via non-public `nflapi`) | CC-BY-4.0 | Conditions | Short factual designations with "NFL via nflverse" credit; daily Sep–Feb only |
| weekly_rosters / rosters | NFL (NGS + Shield API) + DynastyProcess ids | CC-BY-4.0 | Conditions (names/team/pos/status); Owner decision (id columns) | `sleeper_id`, `espn_id` and other ids are joined from GPL-3.0 db_playerids |
| players | NFL API, ESPN, PFF, PFR, OTC | CC-BY-4.0 | Conditions | Good GSIS<->ESPN crosswalk without GPL; no Sleeper id |
| ff_playerids (DynastyProcess, used inside rosters) | DynastyProcess | GPL-3.0 | Owner decision | Copyleft on a factual crosswalk; project's Sleeper join depends on it |
| pbp (nflfastR) | NFL API raw + nflfastR models | CC-BY-4.0 | Conditions | Derived EPA/WP with nflverse credit; record model version (6.0.0.9001 rebuild 2026-11-25); exclude 1999–2000 |
| schedules (nfldata games.csv) | NFL schedule/results; odds, weather, referee of undocumented origin | none in nfldata; CC-BY-4.0 on `schedules` release | Conditions | Facts OK; label lines "source undocumented"; referee/weather empty after 2026 wk 4 |
| nextgen_stats | NFL Next Gen Stats (undocumented API, spoofed UA) | CC-BY-4.0 | No (publish) | NFL-owned, scraped; internal analysis only if at all |
| snap_counts | Sports Reference (PFR) via ScrapeOps proxy | CC-BY-4.0 (data), GPL-3.0 (scraper) | No (publish) | SR terms bar bulk scraping/redistribution; 2012 file empty |
| pfr_advstats | Sports Reference (PFR) | CC-BY-4.0 | No (publish) | Same as above |
| draft_picks | Sports Reference (PFR) via ScrapeOps | CC-BY-4.0 | No (publish) | Same; NFL draft facts available elsewhere |
| combine | Sports Reference (PFR) via ScrapeOps | CC-BY-4.0 | No (publish) | Same |
| trades | PFR-credited, compiled in nfldata (code not public) | CC-BY-4.0 release; nfldata unlicensed | No | Ends 2026-04-17; provenance and licence unclear |
| contracts | OverTheCap (HTML scrape + OTC id API key) | CC-BY-4.0 | No (publish) / Owner decision (internal) | OTC's compiled work; CSV asset stale since 2022 |
| officials | NFL NGS via `ngsscrapR` | CC-BY-4.0 | No (2026) | Only 2026 week 1 (pre-game); 403 since 2026-09-03, schedule disabled 2026-09-15 |
| pbp_participation | NGS 2016–2022 (NFL); FTN 2023+ | CC-BY-4.0 tag; FTN part CC-BY-SA 4.0 | Conditions | Share-alike for 2023+; released only after each postseason; no 2026 |
| ftn_charting | FTN Data (authorized API) | CC-BY-SA 4.0, "FTN Data via nflverse" | Conditions | Share-alike + exact attribution; weekly batch ~2–3 days after MNF |
| nfeloqb qb_elos.csv (non-nflverse, used by build) | nfelo (Robby Greer); 538 values pre-2023 | no licence | Owner decision | Unlicensed; nfelo LICENSE (2026-11-11) covers only nfelo `output_data/` |
| nfelo output_data (non-nflverse) | nfelo | custom nfelo License | Yes (with credit) | Explicitly allows republishing original outputs; third-party columns excluded |
| Neil Paine NFL Elo (non-nflverse) | Neil Paine | MIT | Yes | Clear licence; frozen at 2024 season |
| FiveThirtyEight nfl_elo (non-nflverse) | FiveThirtyEight / ABC News | CC-BY-4.0 | Yes (archived copy only) | Original URL 302s to abcnews.go.com/politics |
