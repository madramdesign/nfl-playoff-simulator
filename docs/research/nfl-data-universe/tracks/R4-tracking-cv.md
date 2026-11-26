# R4 — Player tracking (Next Gen Stats), tracking-derived and video/computer-vision data

Research track R4 of NU-018 (researcher agent), 2026-11-25. Read-only with respect to the repository; no accounts created, no competition rules accepted, no sign-ins, no tokens obtained. All dates below are 2026-11-25 unless stated. "Read" means the page text was actually retrieved and read; "UNVERIFIED" means it was not.

Baseline from project docs (read 2026-11-25): `docs/NFL_DATA_SOURCE_REGISTRY.md` lists "nflverse releases … Next Gen" as **Yes: CC-BY-4.0, credit nflverse**; `docs/GITHUB_RESEARCH.md` and `docs/FEATURE_RESEARCH.md` §5–6 contain no tracking, Big Data Bowl or computer-vision sources. This track is new ground for the project and contradicts the registry on one point (see §7, C1).

Note on search budget: the shared WebSearch budget for this turn ran out part-way (log row 93). Remaining checks were done by reading known primary URLs directly, `gh`, Crossref/arXiv ID look-ups (no keyword search) and the built-in browser. Items that would have needed further searching are marked UNVERIFIED.

## 1. Summary

Raw NFL player tracking (Next Gen Stats, NGS) is not available to a free or mid-budget project. It is captured by Zebra RFID/UWB tags in shoulder pads and the ball, processed on AWS, and distributed outside the league only through Genius Sports, the NFL's **exclusive** distributor of NGS data to media and betting companies, now through the end of the 2029 season. No price is published; access is by contract ("Let's talk").

What a free project can lawfully get is narrow:
1. **Aggregated NGS** (weekly player passing/rushing/receiving: time to throw, separation, cushion, CPOE, xYAC, RYOE) via the nflverse `nextgen_stats` release. It is current through week 11 of 2026 as of today. Caveat: nflverse **scrapes** it from nextgenstats.nfl.com, whose terms bar systematic retrieval. The project's "Yes: CC-BY-4.0" for this file is too generous.
2. **Play-level labels** from nflverse participation: NGS for 2016–2022 and FTN (CC-BY-SA) from 2023. They cover coverage type, pressure, route and time to throw.
3. **Raw 10 Hz tracking samples** from the Big Data Bowl on Kaggle. They are licensed CC BY-NC 4.0 or competition-use only, with **no redistribution**, they need a Kaggle account and acceptance of the rules, and none cover the current season.

There is no lawful free video source for computer vision. NFL+ and YouTube terms bar downloading and harvesting data.

Mid-budget options are video-derived tracking vendors: SkillCorner and Teamworks, which now owns Telemetry Sports, Zelus, Sportlogiq and PFF's enterprise business. Both are "contact sales". Real-time raw NGS stays with clubs, broadcasters and sportsbooks.

## 2. Catalog

### NFL — Next Gen Stats raw player tracking (league system)
- Links: https://operations.nfl.com/gameday/technology/nfl-next-gen-stats/ · glossary https://nextgenstats.nfl.com/glossary · terms https://www.nfl.com/help/terms · GitHub: none
- Category · Class: raw player and ball tracking · 🟢 Official (not accessible to us)
- Provides:
  - Per player and ball: x/y location, speed, acceleration, distance and orientation.
  - Models built on it: formation, coverage and route classification, completion probability, expected rushing yards, win probability (NFL ops page, read).
  - The page claims "More than 200 new data points" per play.
- History · Live · Latency:
  - Zebra pilots ran in 2014 and reached all clubs in 2015 (RFID Journal, 2023-02-27, read). Public NGS stats start in 2016 (nflverse; ESPN 2018 explainer: "complete data starting with the 2016 season").
  - Live: yes, real time inside the league.
  - Sampling rate: NFL ops says "10 times per second"; RFID Journal says 12 Hz for players and 25 Hz for balls (contradiction C2). Big Data Bowl files are 10 Hz.
- Coverage: every game in every venue. 20–30 UWB receivers per venue; 2–3 RFID tags per player in the shoulder pads; tags also on officials, pylons, sticks, chains and inside the ball; about 250 devices per game; 3 operators per game (NFL ops).
- Technical: proprietary RTLS → AWS → NGS models. No public API.
- Cost: free: no · free tier: no · paid: not for sale directly; distributed only via Genius Sports (see that record) · est. monthly for a small app: not obtainable.
- Licensing:
  - Recipients named by NFL ops: clubs (game planning), Football Operations, Player Health & Safety, "NFL media and broadcast partners", and fans through broadcasts and apps.
  - The data is also used in EA's Madden (RFID Journal).
  - No public licence exists. The NFL.com ToU (updated May 16, 2024) §1.1 claims "data, analytics, algorithms".
- Quality: the most accurate source available; occasional tag dropouts ("certain plays may feature insufficient or imperfect data", BDB 2019 FAQ, read).
- Scores: Q 10 / Cov 10 / Rel ~9 / Lat 10 / Hist 9 / Doc 5 / DX 1 / Cost 1 / Lic 1 / Com 1 / RL ~1 / NFL 10 = **5.7**
- Recommendation: AVOID (not obtainable). Treat it as the premium reference source behind everything else in this track.
- Verified: 2026-11-25 — NFL ops page read; RFID Journal read; Zebra Aug 19, 2025 release read ("Now in its 12th year"). Whether Zebra is still the provider in 2026 is UNVERIFIED: the last contract evidence is the 2023 three-season deal.

### NFL — nextgenstats.nfl.com (public leaderboards, charts, highlights, glossary)
- Links: https://nextgenstats.nfl.com/ · glossary https://nextgenstats.nfl.com/glossary · terms https://www.nfl.com/help/terms · robots https://nextgenstats.nfl.com/robots.txt
- Category · Class: aggregated tracking-derived stats (web) · 🟢 Official to read in a browser; 🔴 Scraping if fetched by a program
- Provides:
  - Weekly and season passing, rushing and receiving leaderboards (TT, CAY, IAY, AYD, AGG%, LCAD, AYTS, xCOMP, +/-, CUSH, SEP, TAY%, xYAC, EFF, 8+D%, TLOS, RYOE).
  - Top plays (fastest ball carriers, fastest sacks, longest tackles), pass/route/carry charts, highlight play animations, a game center.
- History · Live · Latency:
  - Season selector covers 2016 onwards. The page text says "In 2016 we began exposing data points".
  - The JavaScript bundle lists `/api/live/*` endpoints (drives, win probability, completion probability). Live behaviour was not observed.
- Coverage: only players above minimum attempt thresholds (nflreadr docs).
- Technical:
  - Vue single-page app. Its JSON API (`/api/statboard/{passing|rushing|receiving}`, `/api/leaders/*`, `/api/highlights/tracking/game/play/withBall/min`, `/api/participation/team/game`) needs an `Authorization` token that the front end gets from a sign-in/refresh-token flow.
  - One probe without a token returned **HTTP 401**. In the built-in browser the same call returned 200 inside the site's own session.
  - robots.txt has an empty `Disallow:`.
- Cost: free to view.
- Licensing:
  - NFL.com ToU (May 16, 2024) §1.3 limits use to "individual non-commercial and informational purposes".
  - §1.3 also bars "Systematic retrieval of data" and building databases without written consent.
  - §11(f) bars robots and spiders for commercial collection.
  - An open robots.txt does not grant permission.
- Quality: authoritative values, but only aggregated; the documentation is glossary-level.
- Scores: Q 9 / Cov 7 / Rel 7 / Lat ~7 / Hist 8 / Doc 5 / DX 2 / Cost 10 / Lic 2 / Com 1 / RL ~3 / NFL 9 = **5.8**
- Recommendation: OPTIONAL as a **link-out only** (for example "see NGS" next to a player). AVOID any automated access from our code, which would also mean handling a token flow the site uses for access control.
- Verified: 2026-11-25 — homepage, robots.txt and sitemap fetched; bundle read for endpoint names; one 401 probe; glossary and passing pages read in the built-in browser.

### nflverse — `nextgen_stats` release (weekly NGS aggregates)
- Links: https://github.com/nflverse/nflverse-data/releases/tag/nextgen_stats · dictionary https://nflreadr.nflverse.com/articles/dictionary_nextgen_stats.html · builder https://github.com/nflverse/ngs-data (MIT, 25 stars, pushed 2026-11-01) · licence https://github.com/nflverse/nflverse-data/blob/master/LICENSE.md (CC-BY-4.0)
- Category · Class: aggregated tracking-derived player stats · 🟠 Unofficial but commonly used. Upstream it is scraped (the ngs-data README says "Next Gen Stats scraped from https://nextgenstats.nfl.com").
- Provides (fields from `dictionary_nextgenstats.csv`, read):
  - Passing: `avg_time_to_throw`, `avg_completed_air_yards`, `avg_intended_air_yards`, `avg_air_yards_differential`, `aggressiveness`, `max_completed_air_distance`, `avg_air_yards_to_sticks`, `expected_completion_percentage`, `completion_percentage_above_expectation`, `avg_air_distance`, `max_air_distance`, plus box-score stats.
  - Receiving: `avg_cushion`, `avg_separation`, `avg_intended_air_yards`, `percent_share_of_intended_air_yards`, `avg_yac`, `avg_expected_yac`, `avg_yac_above_expectation`.
  - Rushing: `efficiency`, `percent_attempts_gte_eight_defenders`, `avg_time_to_los`, `expected_rush_yards`, `rush_yards_over_expected`, `rush_yards_over_expected_per_att`, `rush_pct_over_expected`.
  - Ids: `player_gsis_id`, `team_abbr`, season, week; `week == 0` is the season to date.
- History · Live · Latency: 2016 onwards. Not live. Updated daily in season: the workflow cron runs `0 7 * 1,2,9-12 *` (07:00 UTC). Today's file is stamped "2026-11-25 12:44:02 EST" and contains 2026 weeks 0–11, so it is complete through last Monday's games (lag about 1–2 days).
- Coverage: about 600 passer-weeks a season (`ngs_passing.csv.gz`: 6,299 rows across 2016–2026). Only qualifying players; no defensive players; no team-level file.
- Technical: static files on GitHub Releases · CSV.gz, Parquet, RDS · SDK: nflreadr/nflreadpy · Auth: none · Rate limits: GitHub release CDN (none published) · combined files about 0.3–1.2 MB each.
- Cost: free.
- Licensing:
  - The nflverse compilation is CC-BY-4.0.
  - nflreadr's README says "NFL data accessed by this package belong to their respective owners, and are governed by their terms of use".
  - The NFL's terms bar systematic retrieval, and the values are NFL data.
  - Safest reading: show aggregates with credit ("NFL Next Gen Stats via nflverse"), link to nextgenstats.nfl.com, and do not resell or re-serve the files as a feed. This is the owner's decision, not a licence.
- Quality: values match the NGS site, since they come from its API. Thresholds create survivorship bias. Week 0 is a season aggregate, and `expected_rush_yards` follows the "Nextgenstats' Big Data Bowl model".
- Scores: Q 8 / Cov 6 / Rel 8 / Lat 6 / Hist 8 / Doc 8 / DX 9 / Cost 10 / Lic 4 / Com 3 / RL 9 / NFL 9 = **7.3**
- Recommendation: **PRIMARY** for tracking-derived player context in the free product, as a descriptive display only (house rule: not a model input until a backtest). It needs an owner decision recorded next to DEC-006.
- Verified: 2026-11-25 — release assets listed; 618 KB file downloaded and parsed; dictionary, loader and ngs-data code read.

### nflverse — `pbp_participation` (play-level NGS 2016–2022, FTN 2023 on)
- Links: https://github.com/nflverse/nflverse-data/releases/tag/pbp_participation · dictionary `nflverse/nflreadr/data-raw/dictionary_participation.csv` · loader `R/load_participation.R`
- Category · Class: play-level tracking-derived labels · 🟠 Unofficial for 2016–2022 (NGS-sourced); 🔵 Public/open data for 2023 on (FTN, CC-BY-SA 4.0)
- Provides:
  - Formation, personnel, `defenders_in_box`, `number_of_pass_rushers`, players on the field (gsis ids), `time_to_throw`, `was_pressure`, `route` (primary receiver), `defense_man_zone_type`, `defense_coverage_type`.
  - `ngs_air_yards`, which is NA from 2024 on.
- History · Live · Latency: 2016–2025 files exist; 2025 was updated 2026-02-10. FTN data is "provided after all post-season games are completed", so there is **no in-season 2026 file**.
- Coverage: every play.
- Technical: CSV per season (about 21 MB a year for 2016–2022, about 50 MB a year from 2023) · no auth.
- Cost: free.
- Licensing: the loader says to credit "NFL NextGenStats via nflverse" for 2022 and earlier and "FTN Data via nflverse" for 2023 on (CC-BY-SA 4.0). The NGS part carries the same caveat as the record above.
- Quality: good for backtests. The source changes in 2023, so labels may not be consistent across the switch (UNVERIFIED).
- Scores: Q 8 / Cov 8 / Rel 8 / Lat 3 / Hist 8 / Doc 8 / DX 8 / Cost 10 / Lic 5 / Com 4 / RL 9 / NFL 9 = **7.3**
- Recommendation: SECONDARY. Use it for historical analytics and backtests (pressure rate, coverage mix, route mix); in-season use is not possible.
- Verified: 2026-11-25 — dictionary, loader docs and release assets read via `gh`.

### NFL / Kaggle — Big Data Bowl datasets (2020–2027 on Kaggle; 2019 on GitHub)
- Links:
  - Kaggle: https://www.kaggle.com/competitions/nfl-big-data-bowl-2027 · -2026-analytics · -2026-prediction · -2025 · -2024 · -2023 · -2022 · -2021 · -2020
  - Rules: `/rules` on each · NFL page: https://operations.nfl.com/gameday/analytics/big-data-bowl
- Category · Class: raw tracking samples (10 Hz) plus PFF scouting labels · 🟢 Official (NFL-provided) under a restrictive licence
- Provides (by year, from the pages read):

  | Edition | Data |
  |---|---|
  | 2020 (code competition) | Handoff plays; scored live on 2019 games |
  | 2021 | "all drop-back pass plays from the 2018 regular season" |
  | 2022 | "all 2018-2020 special teams plays" |
  | 2023 | "2021 passing plays (Weeks 1-8)" plus PFF scouting |
  | 2024 | "Weeks 1-9 of the 2022 NFL season", tackles, `pff_missedTackle` |
  | 2025 | Pre-snap theme; `tracking_week_[week].csv`, `player_play.csv` with NGS-derived fields (pressure probability ≥ 0.75, get-off, motion, routes, blocking matchups) and `pff_*` coverage and run concepts; season/weeks UNVERIFIED on Kaggle (secondary sources say 2022 weeks 1–9) |
  | 2026 analytics | 2023 weeks 1–18; input before the throw, output after it |
  | 2026 prediction | Scored on live Dec 2025 – Jan 2026 games |
  | 2027 (open, closes Jan 6, 2027) | 510 rookie prospects; `combine_tracking.csv` with "10 Hz high-frequency optical sensor tracking" of 6,310 Combine drill attempts; NGS athleticism and production scores; 316,338 player-play rows 2023–2025; about 2.2 GiB |

  Tracking fields: `gameId`, `playId`, `nflId` (NA = ball), `frameId`, `frameType`, `time`, `club`, `playDirection`, `x` (0–120), `y` (0–53.3), `s`, `a`, `dis`, `o`, `dir`, `event`.
- History · Live · Latency: 2017–2023 game samples and 2023–2025 Combine data. Not live; the data is one to three years old at release.
- Coverage: partial seasons or play subsets only; no current season.
- Technical: CSV downloads (2024 limits frames per play type) · Kaggle account plus **accepting the competition rules** is required to download · SDK: none needed; UnravelSports has a `BigDataBowlDataset` loader (MPL-2.0).
- Cost: free.
- Licensing:
  - 2024–2027: "DATA ACCESS AND USE: CC BY-NC 4.0". 2020–2023 and the Player Contact Detection competition: "Competition Use, Non-Commercial and Academic".
  - Every edition read (2020–2027) contains §7.A/§4.a: "non-commercial purposes only, including … academic research and education".
  - It also contains §7.B/§4.b: "not to transmit, duplicate, publish, redistribute" the data to non-participants. That conflicts with the CC BY-NC label (C4); treat the stricter rule as binding.
  - Findings may be published (BDB 2019 FAQ: "participants are invited to share ideas and findings"). Code shared publicly is deemed OSI-licensed.
  - Still downloadable after the competition for anyone who accepts the rules ("Late Submission" state) — observed on the 2020–2025 pages; download itself not tested.
- Quality: the gold standard for method work; NGS- and PFF-labelled.
- Scores: Q 10 / Cov 4 / Rel 7 / Lat 1 / Hist 5 / Doc 9 / DX 6 / Cost 10 / Lic 2 / Com 1 / RL ~7 / NFL 10 = **6.0**
- Recommendation: OPTIONAL — the owner's own offline, non-commercial research only (prototype separation, pressure or field-view models). Never commit, serve or embed raw or row-level derived data in the public page. Accepting the rules and creating a Kaggle account are owner actions.
- Verified: 2026-11-25 — rules, overview and data pages read in the built-in browser without sign-in for 2020–2027. Downloads not attempted (sign-in plus rule acceptance needed).

### NFL Football Operations — Big Data Bowl 2019 GitHub sample
- Links: https://github.com/nfl-football-ops/Big-Data-Bowl (no licence, 155 stars, pushed 2019-04-29)
- Category · Class: raw tracking sample · 🟢 Official, no licence
- Provides: one 2017 game of tracking (`tracking_gameId_2017090700.csv`, 31.7 MB), plus `games.csv`, `plays.csv` and `players.csv` for 2017 weeks 1–6. The schema and FAQ are in the repository.
- History · Live · Latency: 2017 only · no · static.
- Coverage: one game.
- Technical: raw CSV on GitHub · no auth.
- Cost: free.
- Licensing: no licence file. The 2019 rules page (ops.nfl.com/big-data-bowl) is UNVERIFIED. Treat as non-commercial research.
- Quality: good as a format sample.
- Scores: Q 9 / Cov 1 / Rel 6 / Lat 1 / Hist 2 / Doc 8 / DX 9 / Cost 10 / Lic 2 / Com 1 / RL 9 / NFL 7 = **5.4**
- Recommendation: OPTIONAL — local prototyping of a play-animation component with no account needed; do not ship the data.
- Verified: 2026-11-25 — repository contents, README, schema and FAQ read via `gh`.

### NFL / Kaggle — Health & Safety ("1st and Future") video plus tracking competitions
- Links: https://www.kaggle.com/competitions/nfl-impact-detection · nfl-health-and-safety-helmet-assignment · nfl-player-contact-detection
- Category · Class: game video (sideline, end zone, All29) plus 10 Hz tracking, helmet boxes · 🟢 Official, restrictive licence
- Provides: MP4 play videos aligned to tracking, helmet labels, contact labels.
- History · Live · Latency: samples only · no.
- Coverage: a few hundred plays (test set of "61 unseen plays" for contact detection).
- Technical: large video downloads · Kaggle account plus rule acceptance.
- Cost: free.
- Licensing: Impact Detection and Helmet Assignment are "Competition-Use Only"; Player Contact Detection is "Competition Use, Non-Commercial and Academic". All have no-redistribution clauses.
- Quality: high-quality labelled data for CV research.
- Scores: Q 9 / Cov 1 / Rel 6 / Lat 1 / Hist 2 / Doc 8 / DX 4 / Cost 10 / Lic 1 / Com 1 / RL 7 / NFL 5 = **4.6**
- Recommendation: AVOID for the product (competition-use only). Reference for CV methods: winning solutions and code are public on Kaggle.
- Verified: 2026-11-25 — rules pages (3) and data pages (2) read in the built-in browser.

### Genius Sports — official NFL data and NGS distribution (Statistics API; official betting feed)
- Links:
  - Releases: https://www.nfl.com/news/nfl-extends-strategic-partnership-with-genius-sports (2023) · SEC 6-K exhibit with the June 11, 2025 release: https://www.sec.gov/Archives/edgar/data/1834489/000119312525138766/d48490dex991.htm
  - Docs: https://statistics.api.geniussports.com/docs/changelog
- Category · Class: official real-time play-by-play, NGS and betting feed · 🟡 Licensed/commercial
- Provides:
  - "exclusive distributor of real-time, official play-by-play statistics, proprietary Next Gen Stats ('NGS') data and the League's official sports betting data feed".
  - Distributed to "media companies and sports betting operators globally" (2025 release).
  - Statistics API v2.672 (2024-07-11): "new NextGenStats (NGS) endpoint" with live player stats per fixture; updates over an Ably message feed.
  - Also Watch & Bet video for sportsbooks; BetVision; NFL+ "Vision Stream" overlays built on NGS (Oct 19, 2023 release).
- History · Live · Latency: live, real-time push. Historical depth UNVERIFIED.
- Coverage: every NFL game.
- Technical: REST plus push (Ably) · JSON · Auth: credentials by contract (the docs home page is title-only to the public) · Rate limits: UNVERIFIED.
- Cost: free: no · paid: not published ("Let's talk" / contact) · est. monthly: UNVERIFIED (enterprise).
- Licensing: the deal runs through the end of the 2029 NFL season (2025 release; the 2023 release said 2027-28). Sub-licence terms are not public. SumerSports says its live model is "trained on licensed Genius Sports tracking data" and that its tracking licence covers consumer products, so licences for consumer media exist.
- Quality: the official feed; highest reliability.
- Scores: Q 10 / Cov 10 / Rel 9 / Lat 10 / Hist ~7 / Doc 6 / DX ~6 / Cost 1 / Lic 3 / Com 9 / RL ~6 / NFL 10 = **7.3**
- Recommendation: PRIMARY **for a future commercial product only**; AVOID for the free project. It is the only official route to NGS beyond aggregates.
- Verified: 2026-11-25 — NFL.com 2023 release, SEC exhibit (2025) and changelog read. Pricing and terms UNVERIFIED (not published).

### Genius Sports — Second Spectrum (now "Performance Studio") broadcast augmentation and club tools
- Links: https://www.secondspectrum.com/ → 302 to https://performancestudio.geniussports.com/ → 302 to an Auth0 sign-in (not followed)
- Category · Class: optical/augmentation technology on top of NGS · 🟡 Licensed/commercial (enterprise)
- Provides: NGS-driven broadcast augmentation (the NFL 2023 release cites Second Spectrum's "real-time augmentation engine") and club analysis tools. No public data product.
- History · Live · Latency: live · enterprise.
- Coverage, Technical, Cost: UNVERIFIED (login wall).
- Licensing: contract only.
- Quality: n/a for us.
- Scores: Q ~9 / Cov ~8 / Rel ~8 / Lat 10 / Hist ~5 / Doc 1 / DX 1 / Cost 1 / Lic 1 / Com ~5 / RL ~1 / NFL 8 = **4.8**
- Recommendation: AVOID (no access; enterprise only).
- Verified: 2026-11-25 — redirect chain observed; stopped at the sign-in.

### Sportradar — NFL API (no tracking)
- Links: https://developer.sportradar.com/football/reference/nfl-overview
- Category · Class: event and statistics feed (not tracking) · 🟡 Licensed/commercial
- Provides: about 50 feeds (schedules, boxscore, play-by-play, depth charts, injuries, push events and statistics). **No player tracking, coordinates or NGS**. Data is compiled by "expert Sportradar in-house operators".
- History · Live · Latency: live push feeds; preseason latency varies.
- Coverage: all NFL games.
- Technical: REST plus push · auth required.
- Cost: contact (trial terms UNVERIFIED here; see track R2).
- Licensing: contract.
- Quality: good, but not official NFL data since Genius took over in 2021.
- Scores: Q 8 / Cov 2 / Rel 9 / Lat 9 / Hist 7 / Doc 9 / DX 8 / Cost 2 / Lic 3 / Com 8 / RL ~5 / NFL 3 = **6.1** (scored for tracking usefulness)
- Recommendation: AVOID as a tracking source. A RapidAPI directory lists an old "Sportradar NFL Next Generation Stats" API as not available (snippet only; UNVERIFIED).
- Verified: 2026-11-25 — overview page read.

### Sony Hawk-Eye — virtual line-to-gain measurement (optical ball tracking)
- Links: club copy of the NFL release (Apr 1, 2025): https://www.patriots.com/news/sony-s-hawk-eye-innovations-selected-by-the-nfl-to-revolutionize-line-to-gain-measurements
- Category · Class: optical ball-position measurement for officiating · 🟢 Official league operations
- Provides: "six 8K cameras for optical tracking of the position of the ball"; measures the spotted ball against the line to gain in about 30 s; virtual recreations for the stadium and broadcast; run from Art McNally GameDay Central.
- History · Live · Latency: tested in 2024; primary method from the 2025 season · live.
- Coverage: all 30 stadiums and international venues.
- Technical: none public.
- Cost: n/a.
- Licensing: no data access stated.
- Quality: Sony claims "less than half an inch" (secondary; UNVERIFIED). The officials' spot still governs.
- Scores: Q 9 / Cov 6 / Rel 8 / Lat 9 / Hist 2 / Doc 3 / DX 1 / Cost 1 / Lic 1 / Com 1 / RL 1 / NFL 5 = **3.9**
- Recommendation: AVOID as data; useful context in rule explainers.
- Verified: 2026-11-25 — club-hosted release read. The NFL.com AMP copy returned HTTP 500.

### Zebra Technologies — MotionWorks Sport (NFL RTLS provider; club practice tracking)
- Links: https://www.zebra.com/us/en/about-zebra/newsroom/press-releases/2025/indianapolis-colts-team-up-with-zebra-technologies-for-real-time-player-performance-insights.html · https://www.rfidjournal.com/news/nfl-extends-uwb-commitment-with-zebra/198078/
- Category · Class: tracking hardware and RTLS · 🟡 Licensed/commercial (sold to the league and clubs)
- Provides: in-game NGS capture and practice tracking for clubs (speed, acceleration/deceleration, distance, ball orientation, proximity, formations). "More than a third" of teams used it in practice in 2023.
- History · Live · Latency: since 2014–2015 · live.
- Coverage: league games and practices of client clubs.
- Technical: UWB tags and receivers.
- Cost: contact sales.
- Licensing: data owned and controlled by the league and clubs.
- Quality: the reference hardware.
- Scores: Q 10 / Cov 10 / Rel 9 / Lat 10 / Hist 9 / Doc 4 / DX 1 / Cost 1 / Lic 1 / Com 2 / RL 1 / NFL 9 = **5.6**
- Recommendation: AVOID (hardware, not a data source).
- Verified: 2026-11-25 — Zebra Aug 19, 2025 release and the RFID Journal article read; Business Wire 2023 release returned 403.

### KINEXON — SafeZone proximity wearables (2020 contact tracing)
- Links: https://www.nfl.com/playerhealthandsafety/health-and-wellness/covid-19/nfl-is-using-technology-to-modernize-contact-tracing-prevent-spread-of-covid-19 (search snippet only) · CDC MMWR https://www.cdc.gov/mmwr/volumes/70/wr/mm7004e2.htm (snippet only)
- Category · Class: proximity wearables · 🟡 Licensed/commercial
- Provides: proximity and duration logs in club facilities (2020). It operated at 6.5 GHz, the same band as the in-stadium tracking (snippet).
- History · Live · Latency: 2020–21 only.
- Coverage: club facilities, not games.
- Technical: n/a.
- Cost: n/a.
- Licensing: private health data.
- Quality: n/a.
- Scores: Q ~7 / Cov 2 / Rel ~7 / Lat 9 / Hist 1 / Doc 3 / DX 1 / Cost 1 / Lic 1 / Com 2 / RL 1 / NFL 2 = **3.1**
- Recommendation: AVOID (irrelevant; personal health data).
- Verified: UNVERIFIED (search snippets only; pages not read).

### Catapult — American football wearables and video
- Links: https://www.catapult.com/sports/american-football
- Category · Class: team wearables (inertial) and video · 🟡 Licensed/commercial
- Provides: "football athlete monitoring devices" using "advanced inertial sensors"; position metrics (throw count, contact load); video analysis.
- History · Live · Latency: team-internal.
- Coverage: client teams (NFL and college logos shown).
- Technical: no public API mentioned.
- Cost: "Get in Touch" / pricing page (not read).
- Licensing: team-owned athlete data.
- Quality: n/a for us.
- Scores: Q ~8 / Cov 3 / Rel ~8 / Lat 8 / Hist ~4 / Doc 3 / DX 1 / Cost 1 / Lic 1 / Com 2 / RL 1 / NFL 4 = **3.7**
- Recommendation: AVOID (private team and athlete data).
- Verified: 2026-11-25 — product page read.

### Teamworks — Telemetry Sports, Zelus Analytics, Sportlogiq and PFF enterprise (video-CV tracking and analytics)
- Links: https://www.prnewswire.com/news-releases/teamworks-acquires-pffs-enterprise-business-cementing-position-as-the-leading-ai-platform-in-american-football-302728898.html (Mar 30, 2026) · https://www.prnewswire.com/news-releases/teamworks-partners-with-espn-for-college-football-302536685.html (Aug 22, 2025)
- Category · Class: video-derived tracking and analytics for teams · 🟡 Licensed/commercial (enterprise)
- Provides:
  - Coaching/Scouting platform (formerly Telemetry Sports): "computer vision, player tracking analytics, and machine learning".
  - "Real-time and historical performance metrics", given to ESPN's research team for college football.
  - PFF enterprise game-event data, "trusted by every NFL team and 240+ Division I collegiate programs".
  - The 2026 release lists Zelus Analytics, Telemetry Sports, Sportlogiq and PFF enterprise as Teamworks acquisitions.
- History · Live · Latency: UNVERIFIED.
- Coverage: NFL and NCAA.
- Technical: platform; no public API.
- Cost: contact; not published.
- Licensing: enterprise. The ESPN deal shows media licensing is possible.
- Quality: UNVERIFIED.
- Scores: Q ~8 / Cov 8 / Rel ~7 / Lat ~6 / Hist ~6 / Doc 2 / DX 1 / Cost 1 / Lic 1 / Com ~5 / RL 1 / NFL 9 = **4.6**
- Recommendation: OPTIONAL for a future funded product (ask about media/consumer licensing); AVOID now.
- Verified: 2026-11-25 — both releases read. Telemetry acquisition date (June 2025) from secondary sources only.

### SkillCorner — American football XY tracking from All-22 video
- Links: https://skillcorner.com/american-football · open data (soccer only) https://github.com/SkillCorner/opendata
- Category · Class: video-derived tracking · 🟡 Licensed/commercial
- Provides: "Automated XY tracking from All-22 video" covering offense, defense and special teams; contextual metrics (max speed, distance, separation, get-off), prediction data (expected completions, YAC), matchups.
- History · Live · Latency: "10+ Seasons". Live and latency not stated.
- Coverage: "NFL, UFL, FBS and FCS"; "350+ Teams".
- Technical: "delivered through API or via a front-end integration partnership with TruMedia".
- Cost: "Get a Demo"; no prices.
- Licensing: not on the page; Terms of Service not read (UNVERIFIED).
- Quality: vendor claims only.
- Scores: Q ~7 / Cov 9 / Rel ~7 / Lat ~6 / Hist 8 / Doc 4 / DX ~5 / Cost 1 / Lic ~3 / Com ~6 / RL ~5 / NFL 8 = **5.8**
- Recommendation: OPTIONAL — the most plausible mid-budget licence for NFL plus college tracking-derived metrics. Ask whether a media or consumer display licence exists.
- Verified: 2026-11-25 — product page read.

### Sportlogiq — football CV tracking (All-22/broadcast)
- Links: https://www.sportlogiq.com/football/ · https://www.pff.com/news/pff-and-sportlogiq-enter-partnership-to-bring-player-tracking-data-to-football-teams (Apr 19, 2023)
- Category · Class: video-derived tracking · 🟡 Licensed/commercial
- Provides: physical metrics (speed, separation, acceleration) and contextual metrics (formations, routes, coverage) from "All-22 video feeds"; tracking in PFF IQ for NCAA clients (2023).
- History · Live · Latency: "within 18 hours" and "96% accuracy" are secondary claims (UNVERIFIED).
- Coverage: NCAA (via PFF); NFL "soon" (2023).
- Technical: no public API.
- Cost: contact form or phone.
- Licensing: enterprise. Now listed among Teamworks acquisitions (date UNVERIFIED).
- Quality: UNVERIFIED.
- Scores: Q ~7 / Cov 7 / Rel ~7 / Lat ~6 / Hist ~5 / Doc 3 / DX 2 / Cost 1 / Lic 2 / Com 4 / RL 2 / NFL 8 = **4.5**
- Recommendation: OPTIONAL (through Teamworks).
- Verified: 2026-11-25 — product page and the PFF release read.

### PFF — consumer PFF+/API (grades, charting); enterprise sold to Teamworks
- Links: https://pff.com/terms (Last Updated Oct 12, 2026) · https://www.pff.com/premium
- Category · Class: charting/grades (human) with tracking for team clients · 🟡 Licensed/commercial
- Provides: grades, charting stats, a consumer API on top tiers. Tracking via Sportlogiq went to team (IQ) clients.
- History · Live · Latency: next day (~). Depth UNVERIFIED.
- Coverage: NFL and NCAA.
- Technical: consumer API on paid tiers. The $199.99 "Pro" tier with API access is from a secondary snippet (UNVERIFIED).
- Cost: consumer subscriptions; enterprise by contact.
- Licensing:
  - §1.2 "solely for your own personal, non-commercial use".
  - §1.5(h) no scraping, screen recording or transcription.
  - §14.3 API: "Nothing … grants you any right to use API Data for Commercial Use".
  - §14.4(8) no republishing grades or stats.
- Quality: widely used; subjective grades.
- Scores: Q 8 / Cov 9 / Rel 8 / Lat 7 / Hist ~7 / Doc 6 / DX 6 / Cost 5 / Lic 1 / Com 2 / RL ~5 / NFL 9 = **6.1**
- Recommendation: AVOID for display or redistribution (the terms forbid it). Enterprise licence via Teamworks/PFF for a commercial product.
- Verified: 2026-11-25 — terms read; Teamworks release read.

### SumerSports — SūmerLive / SūmerBrain (consumer analytics on licensed Genius tracking)
- Links: https://sumersports.com/the-zone/how-sumerlive-tracks-the-game (Jan 24, 2026)
- Category · Class: tracking-derived charting (formations, coverages, pressure, routes) · 🟡 Licensed/commercial (consumer site)
- Provides: live charting "trained on licensed Genius Sports tracking data", about 20 data points per snap, "available for public usage" once validated; team tables for 2024–2026, with a subscription mentioned.
- History · Live · Latency: 2024 on · live.
- Coverage: NFL.
- Technical: no API found.
- Cost: subscription price UNVERIFIED.
- Licensing: terms not read (UNVERIFIED).
- Quality: expert-validated (vendor claim).
- Scores: Q ~7 / Cov ~7 / Rel ~6 / Lat 9 / Hist 4 / Doc 6 / DX 2 / Cost ~6 / Lic ~2 / Com ~2 / RL ~2 / NFL 8 = **5.1**
- Recommendation: OPTIONAL as a link-out. Mainly useful as **evidence that Genius licenses tracking for consumer products**.
- Verified: 2026-11-25 — methodology post read.

### ESPN Analytics — pass rush / run stop win rates (NGS-powered)
- Links: https://www.espn.co.uk/nfl/story/_/id/24892208/creating-better-nfl-pass-blocking-pass-rushing-stats-analytics-explainer-faq-how-work (Oct 5, 2018) · yearly leaderboards (2020–2025 articles, snippets)
- Category · Class: tracking-derived player and team metrics · 🟡 Licensed (ESPN) / 🔴 Scraping if automated
- Provides: PRWR/PBWR (beating a block within 2.5 s), RSWR/RBWR, from "player tracking data from NFL Next Gen Stats".
- History · Live · Latency: 2016 on (computed); weekly leaderboard articles in season.
- Coverage: players and teams.
- Technical: articles only.
- Cost: free to read; some Insider pages are paywalled.
- Licensing: Disney ToU bars automated access (registry).
- Quality: established, rule-based (not ML).
- Scores: Q 8 / Cov 7 / Rel 7 / Lat 6 / Hist 7 / Doc 7 / DX 2 / Cost 10 / Lic 1 / Com 1 / RL 1 / NFL 8 = **5.4**
- Recommendation: OPTIONAL — cite and link only; never ingest.
- Verified: 2026-11-25 — 2018 explainer read.

### NFL — NFL Pro (in NFL+ Premium): NGS stats linked to All-22 film
- Links: https://pro.nfl.com/nflpro · terms https://www.nfl.com/legal/subscriptions_terms/ (Updated Sep 4, 2026) · https://www.nfl.com/plus/
- Category · Class: consumer NGS stats and All-22 video · 🟢 Official (consumer subscription)
- Provides: "over 95 unique player and team performance stats" plus All-22 film; custom cut-ups from NGS metadata. The film archive goes back to 2022 (secondary).
- History · Live · Latency: 2022 on (secondary) · not live · update timing UNVERIFIED.
- Coverage: regular season and postseason (no preseason in NFL Pro, secondary).
- Technical: web and mobile web only; no API; no export mentioned.
- Cost: requires NFL+ Premium. The nfl.com/plus page read showed no prices; $14.99 a month or $99.99 a year is from secondary 2026 guides (UNVERIFIED).
- Licensing:
  - §1(d) "personal, non-commercial use only".
  - §12(e) no archiving, republishing, reproducing or downloading NFL+ content.
  - §14(d) no scraping and no attempt to "harvest or manipulate data on or from the Products".
- Quality: authoritative.
- Scores: Q 9 / Cov 9 / Rel 8 / Lat ~7 / Hist 5 / Doc 5 / DX 1 / Cost 6 / Lic 1 / Com 1 / RL 1 / NFL 9 = **5.2**
- Recommendation: AVOID as a data or CV source. Running computer vision on All-22 from NFL+ would mean downloading or capturing it and harvesting data, which the terms bar. Owner's personal viewing only.
- Verified: 2026-11-25 — subscription terms and the NFL Pro and NFL+ pages read; NFL Pro FAQ returned HTTP 403.

### asonty/ngs_highlights — NGS highlight tracking copies (2017–2019)
- Links: https://github.com/asonty/ngs_highlights (no licence, 64 stars, pushed 2022-01-04)
- Category · Class: raw tracking for highlight plays · 🔴 Scraping (copied from the NGS site's highlight endpoint)
- Provides: per-play tracking of NGS highlight plays from 2017–2019, plus R helpers.
- History · Live · Latency: 2017–2019 · no · static (abandoned).
- Coverage: highlight plays only.
- Technical: files in the repository.
- Cost: free.
- Licensing: none. NFL ToU applies to the underlying data.
- Quality: real NGS data, biased to highlights.
- Scores: Q 8 / Cov 2 / Rel 4 / Lat 1 / Hist 3 / Doc 6 / DX 8 / Cost 10 / Lic 1 / Com 1 / RL 9 / NFL 6 = **4.9**
- Recommendation: AVOID. Do not use or redistribute; publicly reachable is not permission.
- Verified: 2026-11-25 — repository metadata and README read.

### next-gen-scraPy (CMU) and next-gen-scrapy-2.0 — CV extraction from NGS chart images
- Links: https://github.com/sarahmallepalle/next-gen-scrapy (no licence, 30 stars, 2019-06-26) · https://github.com/ArrowheadAnalytics/next-gen-scrapy-2.0 (no licence, 73 stars, 2021-01-14) · paper arXiv:1906.03339 / JQAS doi 10.1515/jqas-2019-0052
- Category · Class: computer vision on official chart images · 🔴 Scraping
- Provides: pass locations for 2017–2018 (x relative to the field centre, y relative to the line of scrimmage); the 2.0 fork adds route and carry charts.
- History · Live · Latency: 2017–2020 · no.
- Coverage: players with NGS charts.
- Technical: Python plus R pipeline.
- Cost: free.
- Licensing: no licence; scrapes nextgenstats.nfl.com.
- Quality: academic method (peer-reviewed).
- Scores: Q 6 / Cov 3 / Rel 3 / Lat 1 / Hist 3 / Doc 7 / DX 5 / Cost 10 / Lic 1 / Com 1 / RL 8 / NFL 6 = **4.5**
- Recommendation: AVOID (method reference only).
- Verified: 2026-11-25 — READMEs and metadata via `gh`; paper metadata via arXiv and Crossref ID look-ups.

### Open-source CV and tracking tooling (roboflow/supervision, roboflow/sports, Ultralytics, UnravelSports, ngscleanR)
- Links: https://github.com/roboflow/supervision (MIT, 51,723 stars, pushed 2026-11-25) · https://github.com/roboflow/sports (MIT, 5,516, 2026-11-25; soccer-focused) · https://github.com/ultralytics/ultralytics (**AGPL-3.0**, 63,749, 2026-11-25) · https://github.com/UnravelSports/unravelsports (MPL-2.0, 250, 2026-01-16; `unravel.american_football.BigDataBowlDataset`) · https://github.com/guga31bb/ngscleanR (NOASSERTION, 23, 2021-10-04)
- Category · Class: tooling · ⚫ Experimental/unstable for American football (no maintained American-football detector, formation or line-of-scrimmage model was found; small repositories such as `Krishna-Panicker12/all-22-film-analyzer` have no licence and no stars)
- Provides: detection, tracking, homography and annotation (supervision); a soccer pipeline example (sports); YOLO detection and pose (Ultralytics); graph and tracking feature pipelines including a BDB loader (UnravelSports); NGS tracking cleaning in R (ngscleanR).
- History · Live · Latency: n/a.
- Coverage: no American-football training data bundled.
- Technical: Python (and R) · pip packages.
- Cost: free. Ultralytics commercial licence price not checked (UNVERIFIED).
- Licensing: MIT is usable with notice. **AGPL-3.0 (Ultralytics) must not be bundled into a distributed or served product without a licence decision.** MPL-2.0 has file-level copyleft. NOASSERTION means reference only.
- Quality: mature for soccer and general CV; unproven on All-22.
- Scores (supervision/sports): Q 7 / Cov 2 / Rel 7 / Lat ~5 / Hist 1 / Doc 8 / DX 8 / Cost 10 / Lic 9 / Com 9 / RL 10 / NFL 2 = **6.5** · Ultralytics: Lic 3 / Com 3 → **5.5** · UnravelSports: Q 7 / Cov 3 / Rel 6 / Lat 1 / Hist 1 / Doc 7 / DX 6 / Cost 10 / Lic 7 / Com 7 / RL 10 / NFL 6 = **5.9**
- Recommendation: OPTIONAL — only meaningful once a lawful video source exists (none today). UnravelSports is OPTIONAL for the owner's offline BDB research (Python; outside the project's no-dependency runtime).
- Verified: 2026-11-25 — `gh api` metadata and the UnravelSports README read.

## 3. Matrix rows

| Category | Provider | Data | Live | Historical | Free | Paid | Cost | License | Quality | Latency | Commercial | Primary/Backup | Score |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Raw tracking | NFL Next Gen Stats (league) | 10 Hz x/y/s/a/o of all players and ball | Yes (internal) | 2016 on (2014–15 pilots) | No | Not sold directly | n/a | None public | Highest | Real time | Only via Genius | Reference only | 5.7 |
| Aggregated tracking (web) | nextgenstats.nfl.com | Weekly leaderboards, charts, highlights | Partly (live game center) | 2016 on | View only | — | 0 | NFL ToU: personal, no systematic retrieval | High | Daily | No | Link-out | 5.8 |
| Aggregated tracking (files) | nflverse `nextgen_stats` | Weekly passing/rushing/receiving NGS | No | 2016 on | Yes | — | 0 | CC-BY compilation; NFL data owner's rights; scraped upstream | High | ~1–2 days | Risky | PRIMARY (free) | 7.3 |
| Play labels | nflverse `pbp_participation` | Coverage, pressure, route, TTT, players on field | No | 2016–2025 | Yes | — | 0 | NGS part as above; FTN CC-BY-SA | High | After the season | FTN part yes (share-alike) | SECONDARY | 7.3 |
| Raw tracking samples | Big Data Bowl (Kaggle) | 10 Hz tracking + PFF labels; 2027 Combine | No | 2017–2023 samples; Combine 2023–25 | Yes (account + rules) | — | 0 | CC BY-NC 4.0 / competition use; no redistribution | Highest | Years | No | OPTIONAL (offline research) | 6.0 |
| Raw tracking sample | BDB 2019 GitHub | One 2017 game | No | 2017 | Yes | — | 0 | No licence | High | n/a | No | OPTIONAL (prototype) | 5.4 |
| Video + tracking | NFL H&S Kaggle | Videos, helmet boxes, 10 Hz | No | Samples | Yes (account + rules) | — | 0 | Competition use only | High | n/a | No | AVOID | 4.6 |
| Official NGS feed | Genius Sports | Real-time pbp, NGS, betting feed | Yes | UNVERIFIED | No | Contract | Contact sales | Exclusive to 2029 | Highest | Real time | Yes | PRIMARY (commercial) | 7.3 |
| Augmentation | Second Spectrum / Genius | Broadcast/club tools | Yes | — | No | Enterprise | Contact | Contract | High | Real time | Enterprise | AVOID | 4.8 |
| Event data (no tracking) | Sportradar NFL | pbp, stats, push | Yes | Yes | Trial (R2) | Contract | Contact | Contract | Good | Seconds | Yes | AVOID for tracking | 6.1 |
| Ball measurement | Sony Hawk-Eye | Line-to-gain | Yes (ops) | 2025 on | No | — | n/a | None | High | ~30 s | No | AVOID | 3.9 |
| Hardware | Zebra MotionWorks | RTLS capture; practice tracking | Yes | 2014 on | No | Clubs | Contact | Club/league owned | Highest | Real time | Clubs only | AVOID | 5.6 |
| Wearables | KINEXON | Proximity (2020) | — | 2020 | No | — | — | Health data | — | — | No | AVOID | 3.1 |
| Wearables | Catapult | Inertial load, video | Team | Team | No | Teams | Contact | Team-owned | — | — | Teams | AVOID | 3.7 |
| Video-CV tracking | Teamworks (Telemetry, Zelus, Sportlogiq, PFF ent.) | Tracking metrics, event data | Some | UNVERIFIED | No | Enterprise | Contact | Contract | ~High | Post-game | Enterprise | OPTIONAL (future) | 4.6 |
| Video-CV tracking | SkillCorner AF | All-22 XY, metrics, predictions | UNVERIFIED | "10+ seasons" | No | Yes | Demo/contact | UNVERIFIED | ~Good | UNVERIFIED | Likely | OPTIONAL (mid-budget) | 5.8 |
| Video-CV tracking | Sportlogiq | All-22 CV metrics | No | UNVERIFIED | No | Yes | Contact | Contract | ~Good | ~18 h (UNVERIFIED) | Enterprise | OPTIONAL | 4.5 |
| Charting/grades | PFF consumer/API | Grades, charting | No | Yes | Partial | Subscription | ~$ (UNVERIFIED) | Personal only; no republishing | Good | Next day | Enterprise only | AVOID | 6.1 |
| Derived consumer | SumerSports | Live charting on Genius tracking | Yes | 2024 on | Partial | Subscription | UNVERIFIED | UNVERIFIED | ~Good | Live | No | OPTIONAL (link) | 5.1 |
| Derived metrics | ESPN win rates | PRWR/RSWR | No | 2016 on | Read | Insider | 0 | Disney ToU | Good | Weekly | No | OPTIONAL (link) | 5.4 |
| Consumer NGS + film | NFL Pro (NFL+ Premium) | 95+ NGS stats, All-22 | No | 2022 on | No | Subscription | ~$99.99/yr (UNVERIFIED) | Personal; no download or harvest | High | UNVERIFIED | No | AVOID | 5.2 |
| Scraped tracking | asonty/ngs_highlights | Highlight tracking 2017–19 | No | 2017–19 | Yes | — | 0 | None; NFL ToU | Biased | n/a | No | AVOID | 4.9 |
| Scraped CV | next-gen-scraPy | Pass/route locations from charts | No | 2017–20 | Yes | — | 0 | None | Medium | n/a | No | AVOID | 4.5 |
| CV tooling | supervision/sports (MIT) | Detection/tracking toolkit | n/a | n/a | Yes | — | 0 | MIT | Mature (soccer) | n/a | Yes | OPTIONAL | 6.5 |
| CV tooling | Ultralytics | YOLO detection/pose | n/a | n/a | Yes | Licence | UNVERIFIED | AGPL-3.0 | Mature | n/a | Licence needed | AVOID (distributed) | 5.5 |
| Tracking tooling | UnravelSports | BDB loader, graph features | n/a | n/a | Yes | — | 0 | MPL-2.0 | Good | n/a | Yes | OPTIONAL (offline) | 5.9 |

## 4. Redundancy

| Data category | PRIMARY → SECONDARY → FALLBACK | Real backup? |
|---|---|---|
| Weekly player tracking aggregates (TTT, separation, cushion, CPOE, xYAC, RYOE) | nflverse `nextgen_stats` → nextgenstats.nfl.com (manual view / link-out only) → our own play-by-play proxies from nflverse pbp (nflfastR `cp`/`cpoe`, `xyac_*`) | **No.** Both NGS paths lead back to the same NFL site. The fallback is a different, play-by-play-only model, not NGS. |
| Play-level coverage / pressure / route / time-to-throw labels | nflverse participation (FTN 2023 on; NGS 2016–2022) → FTN charting release (track R3) → none | **Partly.** FTN 2023+ is a second, independent (human-charted) source to NGS's tracking labels, but neither is in-season for 2026. PFF terms forbid reuse. |
| Raw tracking, historical research | Big Data Bowl (Kaggle) → BDB 2019 GitHub sample → none | **No.** Every lawful copy is NFL-provided under non-commercial or competition-use rules. Re-uploads of BDB files elsewhere breach §7.B and must not be used. |
| Real-time tracking or NGS | Genius Sports (contract) → none | **No free source exists.** Sportradar offers no tracking. |
| Video-derived tracking (NFL + college) | SkillCorner → Teamworks (Telemetry / Sportlogiq) → none | No free source. Both need contracts. |
| Pass-rush / run-stop win rates | ESPN Analytics (link only) → pressure rate from participation `was_pressure` (historical) → none | No ingestible source. |
| Combine movement tracking | BDB 2027 (non-commercial) → none | No. |
| Video for computer vision | none lawful (NFL+ and YouTube terms bar downloading and harvesting) → Kaggle H&S videos (competition use only) | **No.** |

## 5. Derived metrics

### 5a. What we can compute from lawful free inputs

| RAW DATA REQUIRED | CALCULATION | RESULT |
|---|---|---|
| `ngs_passing` (week rows: `attempts`, `completion_percentage_above_expectation`) | Attempt-weighted mean of CPOE across a team's passers, by week and season; exclude `week == 0` to avoid double counting | Team NGS CPOE (descriptive; label "NFL Next Gen Stats via nflverse") |
| `ngs_passing.avg_time_to_throw`, `aggressiveness`, `avg_intended_air_yards` | Attempt-weighted team means; rolling 4-week window | QB style profile (quick game vs deep, tight-window rate) |
| `ngs_receiving.avg_separation`, `avg_cushion`, `targets` | Target-weighted mean per team and opponent-allowed (join the defense through the schedule) | Receiver separation created / allowed (proxy for coverage quality) |
| `ngs_receiving.avg_yac_above_expectation`, `receptions` | Reception-weighted sum per team | Team YAC over expected |
| `ngs_rushing.rush_yards_over_expected`, `rush_attempts`, `percent_attempts_gte_eight_defenders` | Sum RYOE / sum attempts; share of 8+ box | Team RYOE per carry; box-loading context |
| Participation `was_pressure`, pass plays (2016–2025) | Pressures / dropbacks, by offense and defense, per season | Historical pressure rate allowed / generated (backtest feature candidate) |
| Participation `defense_man_zone_type`, `defense_coverage_type` | Share of snaps by type per defense and season | Coverage mix (descriptive; 2023+ from FTN) |
| Participation `time_to_throw` + `was_pressure` | Pressure rate within 2.5 s of the snap (an approximation of ESPN's threshold, not their metric) | Quick-pressure rate (approximate; label it as ours) |
| nflverse pbp (`cp`, `cpoe`, `xyac_mean_yardage`) | Already computed by nflfastR from play-by-play only | Play-level CPOE and xYAC **without tracking** (weaker; no separation input) |

All of these are descriptive. Per the house rule and `docs/DECISIONS.md`, none goes into the forecast model without an out-of-sample backtest. Season-to-date NGS rows (`week == 0`) must not be joined to games played before that date, to avoid future-data leakage.

### 5b. What needs raw tracking (only BDB, offline and non-commercial, or a commercial licence)

| RAW DATA REQUIRED | CALCULATION | RESULT |
|---|---|---|
| 10 Hz x, y, s, dir for all 22 players and the ball, plus `event` frames | Distance from the target to the nearest defender at `pass_arrived`; closing speed | Play-level separation; tight-window flag |
| Tracking + pass outcome (BDB 2021/2026) | Logistic or GBM model on separation, air distance, pressure distance (Deshpande & Evans 2020) | Completion probability (expected hypothetical completion) |
| Tracking at catch + outcome | Model of yards after catch on defender geometry and speed | Expected YAC per play |
| Tracking at handoff + outcome (BDB 2020) | Distribution model (e.g. the 2020 winning CNN; NGS adopted ERY) | Expected rushing yards / RYOE per carry |
| Rusher and blocker trajectories (BDB 2023) | STRAIN = closing rate / distance (Nguyen, Yurko & Matthews 2023); time to pressure | Pass-rush effectiveness per rusher |
| Defender trajectories relative to receivers (BDB 2021) | Clustering / mixture models (Dutta et al. 2020) | Man/zone and coverage identification |
| Receiver trajectories | Curve clustering (Chu et al. 2020) | Route identification |
| Ball-carrier tracking within play | Continuous-time EP/WP (Yurko et al. 2020, "Going Deep") | Within-play value of yards and positioning |
| Snapshot of receiver and defender positions | Deep network for target choice (Burke, DeepQB) | QB decision quality |

### 5c. Key literature (what it implies we cannot do without tracking)

| # | Paper | Link | Needs tracking for |
|---|---|---|---|
| 1 | Yurko, Matano, Richardson, Granered, Pospisil, Pelechrinis, Ventura — "Going Deep: … within-play valuation … with tracking data" (2019 preprint; JQAS 2020) | https://arxiv.org/abs/1906.01760 | Within-play expected yards and EP |
| 2 | Deshpande & Evans — "Expected hypothetical completion probability" (JQAS 2020) | https://arxiv.org/abs/1910.12337 · doi 10.1515/jqas-2019-0050 | Counterfactual completion for every eligible receiver |
| 3 | Dutta, Yurko, Ventura — "Unsupervised methods for identifying pass coverage among defensive backs with NFL player tracking data" (JQAS 2020) | https://arxiv.org/abs/1906.11373 · doi 10.1515/jqas-2020-0017 | Coverage identification |
| 4 | Chu, Reyers, Thomson, Wu — "Route identification in the National Football League" (JQAS 2020) | doi 10.1515/jqas-2019-0047 | Route classification |
| 5 | Mallepalle, Yurko, Pelechrinis, Ventura — "next-gen-scraPy: Extracting NFL tracking data from images …" (JQAS 2020) | https://arxiv.org/abs/1906.03339 · doi 10.1515/jqas-2019-0052 | Shows the gap: pass locations had to be recovered from chart images |
| 6 | Lopez — "Bigger data, better questions, and a return to fourth down behavior: an introduction to a special issue on tracking data" (JQAS 2020) | doi 10.1515/jqas-2020-0057 | Overview of the BDB 2019 research wave |
| 7 | Nguyen, Yurko, Matthews — "Here Comes the STRAIN: Analyzing Defensive Pass Rush in American Football with Player Tracking Data" (2023) | https://arxiv.org/abs/2305.10262 | Continuous pass-rush metric |
| 8 | Burke — "DeepQB: Deep Learning with Player Tracking to Quantify Quarterback Decision-Making & Performance" (MIT Sloan; year not shown on the page read, UNVERIFIED) | https://www.sloansportsconference.com/research-papers/deepqb-deep-learning-with-player-tracking-to-quantify-quarterback-decision-making-performance | Target prediction; 60% cross-validated accuracy (page) |
| 9 | Burke / ESPN Analytics — pass-rush and pass-block win rate explainer (Oct 5, 2018) | https://www.espn.co.uk/nfl/story/_/id/24892208/ | Block win/loss within 2.5 s |
| 10 | NFL NGS glossary — completion probability, xYAC; NFL ops: BDB concepts adopted as ERY, route recognition, coverage classification | https://nextgenstats.nfl.com/glossary · https://operations.nfl.com/gameday/analytics/big-data-bowl | The production versions of 2, 3, 4 and ERY |

Implication: without tracking, the project can display NGS aggregates (weekly, qualifying players) and play-by-play-only proxies. It cannot produce per-play separation, completion probability with defender geometry, xYAC/ERY per play, pass-rush win/strain, automatic coverage or route detection, or within-play valuation for current games.

## 6. Gaps

**Not obtainable easily or legally for free:**
- Any raw tracking for the current season or recent seasons.
- Real-time tracking or real-time NGS.
- Per-play NGS model outputs (CP, xYAC, ERY) for all plays.
- Defensive NGS aggregates (no nflverse file).
- In-season play-level coverage and pressure labels (FTN arrives after the postseason).
- College tracking.
- Any lawful video for computer vision: NFL+ terms §12(e) and §14(d), and YouTube terms ("access, reproduce, download …" and "automated means") bar it.

**Expensive / contact-sales only:**
- Genius Sports (official NGS and real-time feed).
- SkillCorner, Teamworks (Telemetry / Sportlogiq / PFF enterprise), Second Spectrum.

No prices were published by any of them.

**Avoid, and why:**
- Programmatic calls to the nextgenstats.nfl.com API. It sits behind a token and the NFL ToU bar systematic retrieval.
- asonty/ngs_highlights and next-gen-scraPy outputs (scraped NFL data, no licence).
- BDB or Health & Safety data re-uploaded anywhere other than the official Kaggle page (breaches no-redistribution clauses).
- PFF data or grades on a public page (terms §14.4(8)).
- ESPN win-rate scraping (Disney ToU).
- Ultralytics in any distributed or served build without a licence decision (AGPL-3.0).
- CV on NFL+ All-22 recordings.

**Tiering:**
1. **Free project (today):**
   - NGS weekly aggregates via nflverse, with credit and an owner decision on the scraped-upstream question.
   - Participation labels for backtests (FTN CC-BY-SA, NGS part with credit).
   - nflfastR play-by-play-only CP/xYAC.
   - Link-outs to NGS, ESPN win rates and NFL Pro.
   - The owner's offline, non-commercial BDB research, publishing findings only.
2. **Mid-budget product:**
   - A video-derived tracking licence (SkillCorner API, or Teamworks for NFL + college), if a media/consumer display licence is offered.
   - A consumer-display sub-licence of Genius tracking-derived data. SumerSports shows such licences exist; price unknown.
   - An FTN commercial agreement for in-season charting (track R3).
3. **Only teams, broadcasters and sportsbooks:**
   - Raw real-time NGS (clubs; media partners via Genius and Second Spectrum; sportsbooks via the Genius official feed).
   - Zebra practice tracking, Catapult wearables, Hawk-Eye measurement data, health-and-safety video, full All-22 libraries for analysis.

## 7. Contradictions & UNVERIFIED

**Contradictions:**
- **C1 (contradicts project docs).** `NFL_DATA_SOURCE_REGISTRY.md` marks nflverse releases including "Next Gen" as **Yes: CC-BY-4.0**. Evidence against an unconditional Yes:
  - The NGS file is built by `nflverse/ngs-data`, whose README says "Next Gen Stats scraped from https://nextgenstats.nfl.com". Its code drives a browser-like session with a desktop-Chrome user agent against a token-protected API.
  - NFL.com ToU §1.3 bars "Systematic retrieval of data" without written consent.
  - nflreadr itself says NFL data "belong to their respective owners".
  - The same applies to participation data for 2016–2022 (credit "NFL NextGenStats via nflverse").

  Recommendation: reclassify NGS-derived nflverse files as **Owner decision / Conditions** (credit, link to NGS, no raw re-serving, no commercial use), separate from the rest of nflverse.
- **C2.** Sampling rate: NFL ops says "10 times per second"; RFID Journal (2023, on Zebra) says 12 Hz for players and 25 Hz for the ball. Published BDB data is 10 Hz. Inference (not verified): published data is resampled.
- **C3.** BDB 2026 seasons: the NFL ops page says data came from the "2023 and 2024 seasons"; the Kaggle analytics data page lists only `input_2023_w[01-18]`. The prediction track may hold 2024 data (UNVERIFIED).
- **C4.** BDB 2024–2027 show "CC BY-NC 4.0", which would allow non-commercial redistribution with credit. The same rules (§7.B / §4.b) forbid redistributing to non-participants. Treat the stricter clause as binding.
- **C5.** The NFL ops BDB page says Kaggle hosted 2019–2025. The 2019 contest's data was on GitHub (`nfl-football-ops/Big-Data-Bowl`, "inaugural contest … closed … January 25, 2019"). This is a naming/numbering mismatch.
- **C6.** NFL Pro stat count: "over 95" (pro.nfl.com, read) vs "nearly 100" (secondary).
- **C7.** Genius NFL term: the NFL.com release (2023) says through 2027-28; the SEC-filed release (June 11, 2025) says through the 2029 season. The later document governs.

**UNVERIFIED:**
- Zebra as the tracking provider in the 2026 season. The 2023 contract was three seasons; Zebra said "12th year" in Aug 2025.
- When ball tracking started (claims of 2017 not verified; the search budget ran out).
- BDB 2025 season and weeks.
- All vendor prices: Genius, SkillCorner, Teamworks, Sportlogiq, PFF enterprise, Catapult and SumerSports publish none.
- PFF Pro tier price and API inclusion.
- NFL+ Premium price.
- Genius Statistics API historical depth and rate limits.
- Sportlogiq acquisition date.
- KINEXON details (snippets only).
- SkillCorner and SumerSports terms (not read).
- Hawk-Eye accuracy claim.
- DeepQB year.
- Whether any permissively licensed American-football video dataset exists (not found with the searches run; further search was blocked by the budget).

## 8. Research log

All on 2026-11-25. curl probes used User-Agent "nfl-universe-research/1.0"; no keys, cookies or sign-ins. Built-in-browser reads were of public pages without signing in; cookie notices and "Accept Rules"/"Join" buttons were not clicked.

| # | Query / URL / endpoint | Date | Outcome |
|---|---|---|---|
| 1 | search: "NFL Next Gen Stats technology RFID chips shoulder pads Zebra sample rate times per second AWS" | 11-25 | Found NFL ops page, Zebra blog, older press; no sample rate in snippets |
| 2 | search (extended): "Genius Sports NFL Next Gen Stats distribution rights tracking data agreement" | 11-25 | 2021 deal, 2023 and 2025 extensions |
| 3 | search: "NFL Big Data Bowl 2026 Kaggle competition data tracking" | 11-25 | 2026 done; 2027 (combine) open |
| 4 | https://operations.nfl.com/gameday/technology/nfl-next-gen-stats/ | 11-25 | Read: 20–30 UWB receivers per venue, 2–3 RFID tags in pads, tags in ball/officials/pylons/chains, "10 times per second", Zebra+Wilson+AWS, recipients (clubs, ops, health & safety, media partners); no licence terms |
| 5 | https://www.nfl.com/news/nfl-extends-strategic-partnership-with-genius-sports | 11-25 | Read: 2023 extension (through 2027-28); Genius exclusive distributor of play-by-play, NGS data, official betting feed; Second Spectrum NGS broadcast augmentation |
| 6 | https://www.sec.gov/Archives/edgar/data/1834489/000119312525138766/d48490dex991.htm | 11-25 | Read: Genius press release 11 June 2025: extended through end of 2029 season; exclusive NGS distribution to media and betting operators globally |
| 7 | search: Genius Sports NFL extension 2029 "Next Gen Stats" June 2025 | 11-25 | Business Wire 20250611456305 confirms |
| 8 | search: Genius Sports NFL official data feed media NGS API developer | 11-25 | Found statistics.api.geniussports.com docs |
| 9 | https://statistics.api.geniussports.com/docs/changelog | 11-25 | Read: v2.672 (2024-07-11) "new NextGenStats (NGS) endpoint" live player stats per fixture; Ably message feed; no pricing or access terms |
| 10 | https://statistics.api.geniussports.com/docs/statistics-descriptions/american-football/nfl/advanced-statistics | 11-25 | HTTP 404 |
| 11 | https://nextgenstats.nfl.com/ (curl) | 11-25 | 200 text/html, Vue SPA; robots.txt "Disallow:" (empty) with sitemap |
| 12 | https://nextgenstats.nfl.com/public/sitemap.xml | 11-25 | 200; pages: news, glossary, charts, fastest-ball-carriers, stats/passing, rushing, receiving |
| 13 | https://nextgenstats.nfl.com/dist/app.738fbeb581d2c85cb721.js (curl, read for endpoints only) | 11-25 | Bundle lists /api/statboard/*, /api/leaders/*, /api/live/*, /api/highlights/tracking/game/play/withBall/min, /api/participation/*; hosts api.ngs.nfl.com, api.nfl.com; requests carry an Authorization token from an NFL sign-in/refresh flow |
| 14 | https://nextgenstats.nfl.com/api/statboard/passing?season=2025&seasonType=REG (one probe, no token) | 11-25 | HTTP 401, empty body. Token flow not attempted (would bypass an access control) |
| 15 | https://appapi.ngs.nfl.com/statboard/passing?season=2025&seasonType=REG | 11-25 | No connection (curl 000) |
| 16 | https://www.nfl.com/help/terms | 11-25 | Read: "Updated: May 16, 2024"; §1.3 individual non-commercial use; systematic retrieval/database compilation barred without written consent; §11(f) robots/spiders for commercial collection barred |
| 17 | gh: nflverse/nflreadr data-raw/dictionary_nextgenstats.csv | 11-25 | Read full field list (below) |
| 18 | gh: nflverse/nflverse-data release `nextgen_stats` | 11-25 | ngs_passing/receiving/rushing (csv.gz, parquet, rds) updated 2026-11-25 17:43 UTC; per-season files 2016–2024 (2024 per-season files are stubs, 2024-09-06) |
| 19 | GET github.com/nflverse/nflverse-data/releases/download/nextgen_stats/ngs_passing.csv.gz (618 KB) + timestamp.txt | 11-25 | 6,299 rows, seasons 2016–2026; 2026 weeks 0–11 (week 0 = season to date); timestamp "2026-11-25 12:44:02 EST" |
| 20 | gh: nflverse/ngs-data (MIT, 25 stars, pushed 2026-11-01) README, R/ngs_functions.R, workflow update_ngs.yaml | 11-25 | README: "Next Gen Stats scraped from https://nextgenstats.nfl.com"; code opens an rvest session on the NGS site, sends its cookies/referer with a desktop-Chrome user agent to /api/statboard/{type}; cron daily 07:00 UTC in Jan, Feb, Sep–Dec |
| 21 | gh: nflverse/nflreadr README "Terms of Use" + R/load_nextgen_stats.R | 11-25 | "NFL data accessed by this package belong to their respective owners, and are governed by their terms of use"; NGS from 2016; nightly in season; minimum-attempt thresholds |
| 22 | search (extended): Zebra NFL contract 2025 2026 provider change | 11-25 | No provider change found; 2023 renewal; 2025 Zebra release says 12th year |
| 23 | search: Sony Hawk-Eye NFL virtual first down 2025 | 11-25 | 2025 season, six 8K cameras, chain crew secondary |
| 24 | https://www.businesswire.com/news/home/20230206005270/en/ | 11-25 | HTTP 403 |
| 25 | https://www.nfl.com/_amp/sony-s-hawk-eye-innovations-selected-by-nfl-to-revolutionize-line-to-gain-measurements | 11-25 | HTTP 500 |
| 26 | https://www.patriots.com/news/sony-s-hawk-eye-innovations-selected-by-the-nfl-to-revolutionize-line-to-gain-measurements | 11-25 | Read (club copy of NFL release, Apr 1 2025): "six 8K cameras for optical tracking of the position of the ball"; all 30 stadiums; run from Art McNally GameDay Central; no data-access statement |
| 27 | https://www.rfidjournal.com/news/nfl-extends-uwb-commitment-with-zebra/198078/ | 11-25 | Read (Feb 27 2023): three-season contract; one UWB tag per shoulder pad (+ back tag for D-linemen); ball tag in bladder; 22–24 receivers; "12 times per second" players, 25 for balls; pilots 2014, all clubs 2015; >1/3 of teams use Zebra in practice; EA Madden uses NGS data |
| 28 | gh: nfl-football-ops/Big-Data-Bowl (no licence, 155 stars, pushed 2019-04-29) README, schema.md, faqs.md, Data/ | 11-25 | BDB 2019: 2017 weeks 1–6; repo still hosts one game of tracking (31.7 MB) + games/plays/players; FAQ allows publishing findings |
| 29 | Built-in browser: https://www.kaggle.com/competitions/nfl-big-data-bowl-2025/rules | 11-25 | Read (no sign-in): "DATA ACCESS AND USE: CC BY-NC-4.0"; §7.A non-commercial only incl. academic research and education; §7.B no redistribution to non-participants; winner licence Open Source |
| 30 | Built-in browser: https://www.kaggle.com/competitions/nfl-big-data-bowl-2025/data | 11-25 | Read description; download needs sign-in and acceptance of rules (not done). Tracking fields gameId, playId, nflId (NA = ball), frameType, frameId, time, jerseyNumber, club, playDirection, x, y, s, a, dis, o, dir, event; PFF columns `pff_*` (coverage, man/zone, run concept, coverage assignment); NGS-derived player_play fields (pressure probability ≥0.75, getOff, motion, routes, blocking matchups); licence "Subject to Competition Rules" |
| 31 | Built-in browser: kaggle.com/competitions/nfl-big-data-bowl-2027/rules | 11-25 | Read: "Featured Hackathon · a month to go"; "7. DATA ACCESS AND USE: CC BY-NC 4.0"; §4.a non-commercial only; §4.b no redistribution to non-participants; winner licence Open Source; prizes $100,000. "Join Hackathon" not clicked |
| 32 | Built-in browser: kaggle.com/competitions/nfl-big-data-bowl-2027/data | 11-25 | Read: 510 rookie prospects (2023–2025 drafts); 9 CSVs ~2.2 GiB; `combine_tracking.csv` "10 Hz high-frequency optical sensor tracking" across 6,310 Combine drill attempts (x, y, s, a, dis, dir; PLAYER/BALL); NGS athleticism/production/final scores; `player_play.csv` 316,338 player-play rows 2023–2025 with NGS/play-by-play metrics |
| 33 | Built-in browser: kaggle.com/competitions/nfl-big-data-bowl-2027/overview | 11-25 | Timeline: start Oct 6 2026, final deadline Jan 6 2027, results ~Jan 26 2027; judges = club analytics staff or tracking vendors |
| 34 | Built-in browser: kaggle.com/competitions/nfl-big-data-bowl-2026-analytics/rules + /data | 11-25 | Rules: CC BY-NC 4.0; same non-commercial and no-redistribution clauses; "Accept Rules" button present (not clicked). Data: 2023 season weeks 1–18, `input_2023_w[01-18].csv` (pre-throw tracking: x, y, s, a, o, dir, ball_land_x/y, player_role) and `output_…` (post-throw x, y); licence shown "Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)"; download needs sign-in |
| 35 | Built-in browser: kaggle.com/competitions/nfl-big-data-bowl-2026-prediction/overview | 11-25 | Code competition Sep 25 2025 – Jan 6 2026; models scored on live Dec 2025 – Jan 2026 NFL games |
| 36 | Built-in browser: kaggle.com/competitions/nfl-big-data-bowl-2024/rules, /data, /overview | 11-25 | "DATA ACCESS AND USE: CC BY-NC-4.0"; "Weeks 1-9 of the 2022 NFL season"; tackling theme; frames subset per play type; `pff_missedTackle` from PFF; licence CC BY-NC 4.0 |
| 37 | Built-in browser: kaggle.com/competitions/nfl-big-data-bowl-2023/rules, /data, /overview | 11-25 | "Competition Use, Non-Commercial and Aca[demic]"; PFF scouting data for "2021 passing plays (Weeks 1-8)"; licence "Subject to Competition Rules" |
| 38 | Built-in browser: kaggle.com/competitions/nfl-big-data-bowl-2022/rules, /overview | 11-25 | "Competition Use, Non-Commercial and Aca[demic]"; NGS tracking "from all 2018-2020 special teams plays"; notes the 2020 winning algorithm was adopted by NFL/NFL Network on air |
| 39 | Built-in browser: kaggle.com/competitions/nfl-big-data-bowl-2021/rules, /overview | 11-25 | "Competition Use, Non-Commercial and Academic"; "all drop-back pass plays from the 2018 regular season" |
| 40 | Built-in browser: kaggle.com/competitions/nfl-big-data-bowl-2020/rules, /overview | 11-25 | "Competition Use, Non-Commercial, and Academic Use Only"; code competition (yards after handoff) Oct 9 2019 – Jan 6 2020, scored on live 2019 games |
| 41 | Built-in browser: kaggle.com/competitions/nfl-big-data-bowl-2025/overview | 11-25 | Theme pre-snap to post-snap; season/weeks not stated in the text read (2022 weeks 1–9 per secondary sources: UNVERIFIED on Kaggle) |
| 42 | Built-in browser: kaggle.com/competitions/nfl-player-contact-detection/rules + /data | 11-25 | "Competition Use, Non-Commercial and Academic"; sideline + endzone + All29 video per play, 10 Hz tracking, helmet boxes; licence "Subject to Competition Rules" |
| 43 | Built-in browser: kaggle.com/competitions/nfl-health-and-safety-helmet-assignment/rules + /data | 11-25 | "DATA ACCESS AND USE: Competition-Use Only"; sideline + endzone video, helmet images with boxes, 10 Hz tracking |
| 44 | Built-in browser: kaggle.com/competitions/nfl-impact-detection/rules | 11-25 | "DATA ACCESS AND USE: Competition-Use Only"; winner licence non-exclusive |
| 45 | search: Sportradar NFL API tracking "Next Gen Stats" OR "player tracking" developer 2025 | 11-25 | No current Sportradar NFL tracking; RapidAPI directory lists an old "Sportradar NFL Next Generation Stats" API as unavailable |
| 46 | https://developer.sportradar.com/football/reference/nfl-overview | 11-25 | Read: ~50 feeds (schedule, boxscore, play-by-play, depth charts, injuries, push feeds); compiled by "expert Sportradar in-house operators"; no tracking, coordinates or NGS; auth required; no prices |
| 47 | search (extended): Telemetry Sports … acquired | 11-25 | Teamworks acquired Telemetry Sports (June 2025) |
| 48 | https://www.prnewswire.com/news-releases/teamworks-partners-with-espn-for-college-football-302536685.html | 11-25 | Read: Aug 22 2025; ESPN research gets Teamworks Coaching/Scouting platform (formerly Telemetry): "computer vision, player tracking analytics, and machine learning"; no prices |
| 49 | https://geniussports.com/genius-marketing-suite/genius-data-content/ | 11-25 | Read: "Sports Data API" listed, no NFL/NGS detail; "Let's talk" contact only |
| 50 | search: Second Spectrum NFL optical tracking GeniusIQ NGS broadcast augmentation | 11-25 | Second Spectrum ingests NGS for CBS/NFL broadcast augmentation; no public product |
| 51 | https://www.fastcompany.com/91487984/how-aws-powered-next-gen-stats-changed-the-nfl-forever | 11-25 | HTTP 403 |
| 52 | https://geniussports.com/newsroom/nfl-viewing-experience-transformed-through-genius-sports-ai-powered-data-driven-technology/ | 11-25 | Read: Oct 19 2023; NFL+ "Stats Stream"/"Vision Stream" overlays use "Next Gen Stats player-tracking data" |
| 53 | search: "NFL Pro" pro.nfl.com NGS All-22 NFL+ Premium | 11-25 | NFL Pro launched Aug 2024 in NFL+ Premium; ~95–100 NGS stats linked to All-22 film back to 2022 |
| 54 | search (extended): NFL+ Premium terms personal non-commercial All-22 price 2026 | 11-25 | Price $14.99/mo or $99.99/yr per secondary 2026 guides (not read on plus.nfl.com) |
| 55 | https://support.nfl.com/hc/en-us/articles/35869706651156-NFL-Pro-FAQ-s-and-Answers | 11-25 | HTTP 403 |
| 56 | search: NFL+ subscription terms personal non-commercial | 11-25 | Found nfl.com/legal/subscriptions_terms |
| 57 | https://www.nfl.com/legal/subscriptions_terms/ | 11-25 | Read: "Updated September 4, 2026"; covers NFL+ and NFL+ Premium (NFL Pro is a Premium feature, §12(c)); §1(d) "personal, non-commercial use only"; §12(e) no archiving, republishing, reproducing or downloading NFL+ content; §14(d) no scraping/spidering, no attempt to "harvest or manipulate data on or from the Products" |
| 58 | search: ESPN pass rush win rate run stop win rate methodology NGS | 11-25 | ESPN win rates built on NGS tracking; yearly leaderboards 2018–2025 |
| 59 | search: SkillCorner American football | 11-25 | SkillCorner sells All-22-video XY tracking for NFL, UFL, FBS, FCS |
| 60 | search: Sportlogiq American football tracking | 11-25 | Sportlogiq CV tracking from All-22/broadcast; PFF partnership 2023 |
| 61 | https://skillcorner.com/american-football | 11-25 | Read: "Automated XY tracking from All-22 video"; NFL, UFL, FBS, FCS; "10+ Seasons"; API or TruMedia front end; "Get a Demo", no prices |
| 62 | https://www.sportlogiq.com/football/ | 11-25 | Read: CV on All-22 feeds; physical + contextual metrics; contact form/phone; no prices |
| 63 | https://www.pff.com/news/pff-and-sportlogiq-enter-partnership-to-bring-player-tracking-data-to-football-teams | 11-25 | Read: Apr 19 2023; Sportlogiq tracking in PFF IQ for NCAA clients, NFL "soon"; sales@pff.com |
| 64 | search: PFF data licensing API media pricing | 11-25 | No public enterprise pricing; PFF consumer tiers include API access on top tier |
| 65 | search: SumerSports tracking data public metrics | 11-25 | SumerSports pages; SūmerLive trained on licensed Genius tracking |
| 66 | search: KINEXON NFL SafeZone 2020 | 11-25 | KINEXON proximity wearables for COVID contact tracing 2020; 6.5 GHz clash with NGS UWB; CDC MMWR 70(4) |
| 67 | https://sumersports.com/the-zone/how-sumerlive-tracks-the-game | 11-25 | Read: Jan 24 2026; "trained on licensed Genius Sports tracking data"; live charting of formations, coverages, pressure, routes |
| 68 | search (extended): Teamworks acquires PFF enterprise 2026 | 11-25 | Mar 30 2026 deal |
| 69 | https://www.prnewswire.com/news-releases/teamworks-acquires-pffs-enterprise-business-cementing-position-as-the-leading-ai-platform-in-american-football-302728898.html | 11-25 | Read: Mar 30 2026; Teamworks acquired PFF's enterprise (B2B) business; lists Zelus, Telemetry Sports, Sportlogiq and PFF enterprise as Teamworks acquisitions; PFF.com consumer business stays independent |
| 70 | https://pff.com/terms | 11-25 | Read: "Last Updated: October 12, 2026"; §1.2 personal non-commercial; §1.5(h) no scraping/screen recording/transcription; §14.3 API personal, no Commercial Use; §14.4(8) no republishing API grades/stats |
| 71 | gh search repos: ngs_highlights; nfl tracking data; football formation detection; nfl big data bowl; football player detection yolo; topic:american-football; topic:nfl-big-data-bowl; topic:player-tracking; roboflow sports; ngscleanR; football all-22 | 11-25 | Few American-football CV repos; most are soccer; listed in catalog |
| 72 | gh: asonty/ngs_highlights (no licence, 64 stars, pushed 2022-01-04) README | 11-25 | "tracking data from the NFL's Next Gen Stats (NGS) Highlights from the 2017-2019 seasons" (copied from the NGS site's highlight endpoint) |
| 73 | gh api metadata: roboflow/sports (MIT, 5,516, 2026-11-25), roboflow/supervision (MIT, 51,723), ultralytics/ultralytics (AGPL-3.0, 63,749), UnravelSports/unravelsports (MPL-2.0, 250, 2026-01-16; `unravel.american_football.BigDataBowlDataset`), guga31bb/ngscleanR (NOASSERTION, 23, 2021-10-04), dhingratul/Player-Tracking (MIT, 3, 2017), Krishna-Panicker12/all-22-film-analyzer (no licence, 0, 2026-10-14) | 11-25 | See catalog |
| 74 | gh: nflreadr data-raw/dictionary_participation.csv, R/load_participation.R; release `pbp_participation` | 11-25 | Participation 2016–2022 "from NFL NGS" (credit "NFL NextGenStats via nflverse"); 2023 on from FTN (CC-BY-SA 4.0, released after the postseason); fields incl. time_to_throw, was_pressure, route, defense_man_zone_type, defense_coverage_type, ngs_air_yards (NA from 2024); files 2016–2025 (2025 updated 2026-02-10) |
| 75 | https://www.espn.co.uk/nfl/story/_/id/24892208/... | 11-25 | Read: Oct 5 2018 (Brian Burke): ESPN Analytics PRWR/PBWR from "player tracking data from NFL Next Gen Stats"; 2.5-second rule; complete coverage from 2016; leaderboards only |
| 76 | https://www.nfl.com/_amp/next-gen-stats-new-advanced-metrics-you-need-to-know-for-the-2025-nfl-season | 11-25 | HTTP 500 |
| 77 | export.arxiv.org/api/query?id_list=1906.01760,1910.12337,1908.03790,1906.11373,2305.10262,2001.06598 (ID look-up, not keyword search) | 11-25 | Confirmed 1906.01760 (Going Deep), 1910.12337 (EHCP), 1906.11373 (Dutta coverage), 2305.10262 (STRAIN); 1908.03790 and 2001.06598 were unrelated papers (wrong guesses, discarded) |
| 78 | api.crossref.org/works/{doi} for 10.1515/jqas-2019-0047, -2020-0057, -2019-0052, -2019-0057, -2019-0050, -2019-0074, -2020-0017 | 11-25 | Confirmed Chu et al. route identification; Lopez special-issue intro; Mallepalle et al.; Deshpande & Evans; Dutta et al.; two DOIs not found (discarded) |
| 79 | gh: sarahmallepalle/next-gen-scrapy, ArrowheadAnalytics/next-gen-scrapy-2.0 (README), larsjaakko/nextgenstats-spider (listing) | 11-25 | No licences; pass/route/carry chart scraping from nextgenstats.nfl.com |
| 80 | https://www.sloansportsconference.com/research-papers/deepqb-deep-learning-with-player-tracking-to-quantify-quarterback-decision-making-performance | 11-25 | Read: Burke, DeepQB; two seasons of tracking; target identified in 60% of cross-validated cases; year not shown |
| 81 | export.arxiv.org/api/query?id_list=1906.03339,2008.07193,2201.04180,2312.06019,2409.09004 | 11-25 | Confirmed 1906.03339 (next-gen-scraPy); others unrelated (discarded) |
| 82 | Built-in browser: https://nextgenstats.nfl.com/glossary | 11-25 | Read: definitions of TT, CAY/IAY, AYD, LCAD, AGG, AYTS, completion probability, xCOMP, EFF, 8+D%, TLOS, CUSH, SEP, TAY%, xYAC, top plays |
| 83 | Built-in browser: https://nextgenstats.nfl.com/stats/passing + network log | 11-25 | 2026 leaderboard visible; page text "In 2016 we began exposing data points"; in-session `/api/statboard/passing?season=2026&seasonType=REG` → 200 (site's own session token) |
| 84 | https://operations.nfl.com/gameday/analytics/big-data-bowl | 11-25 | Read: 2026 data "2023 and 2024 seasons", scored on 2025 weeks 14–18; 2027 Combine 2023–2025; >75 participants hired by clubs; BDB concepts influenced ERY, route recognition, coverage classification |
| 85 | https://www.zebra.com/us/en/about-zebra/newsroom/press-releases/2025/indianapolis-colts-team-up-with-zebra-technologies-for-real-time-player-performance-insights.html | 11-25 | Read: Aug 19 2025; "Official Real-Time Location Solutions Provider", "Now in its 12th year"; MotionWorks practice tracking for Colts; no contract term |
| 86 | https://www.secondspectrum.com/ → https://performancestudio.geniussports.com/ → secondspectrum.auth0.com/authorize | 11-25 | 302 redirects to a sign-in; not followed |
| 87 | https://www.catapult.com/sports/american-football | 11-25 | Read: inertial wearables, video; contact sales; no API |
| 88 | https://statistics.api.geniussports.com/docs | 11-25 | Title only ("Statistics API"); no access/pricing info public |
| 89 | https://www.sportsinfosolutions.com/ | 11-25 | Read: NFL/FBS coverage, DataHub Free/Pro, custom feeds; no tracking mentioned; contact for pricing |
| 90 | https://www.youtube.com/static?template=terms | 11-25 | Read: effective Dec 15 2023; no "access, reproduce, download …" without authorization; no access by "automated means (such as robots, botnets or scrapers)" |
| 91 | https://www.nfl.com/plus/ | 11-25 | Read: All-22 and NFL Pro in NFL+ Premium; no prices in retrieved text |
| 92 | https://pro.nfl.com/nflpro | 11-25 | Read: "over 95 unique player and team performance stats"; NFL+ Premium required; web and mobile web |
| 93 | search: "NFL Next Gen Stats ball tracking chip footballs since 2017 regular season tracking history 2016 public data" | 11-25 | NOT PERFORMED: shared WebSearch budget exhausted. All later checks used direct URLs, gh and ID look-ups only |
| 94 | gh: nflverse/nflreadr data-raw/dictionary_pbp.csv | 11-25 | Confirmed pbp fields `cp`, `cpoe`, `xyac_epa`, `xyac_mean_yardage` (play-by-play-based models, no tracking) |
