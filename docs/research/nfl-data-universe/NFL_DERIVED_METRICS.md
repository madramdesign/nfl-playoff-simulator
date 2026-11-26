# NFL Derived Metrics: what to calculate ourselves

Part of the NFL data and API universe research (NU-018, Nov. 25, 2026). Start at [NFL_API_UNIVERSE.md](NFL_API_UNIVERSE.md).

Many numbers that providers sell, or that free sites show but forbid reusing, can be computed from raw data we may lawfully use. Computing them ourselves removes a licence problem (the inputs are open; the output is our own work), removes a dependency (one fewer source to fail), and lets every number carry its inputs, model version and as-of time. This file collects the recipes the ten research tracks wrote, in the form **RAW DATA REQUIRED → CALCULATION → RESULT**, grouped by domain, after a short guide.

## Rules for every derived metric

1. **As-of time.** Each value is computed from inputs seen before a stated UTC time (`seen_at <= as_of`; [NFL_DATA_ARCHITECTURE.md](NFL_DATA_ARCHITECTURE.md) §4.1). A backtest that uses a value must use the value as it would have been computed then, never a later recalculation. This matters now: nflverse recalculated every season's EPA and win probability on Nov. 25, 2026 with a new nflfastR model (R3), so stored EPA from before that day and after it are different quantities.
2. **Version.** Store `metric_version` and the versions of upstream models (nflfastR version, the nflverse release timestamp) with each value. Never mix versions in one chart or one backtest.
3. **Label.** Derived values are estimates or descriptions, never facts and never model inputs until a backtest shows an out-of-sample gain (house rule; DEC-007). The page says "calculated by NFL Universe from …" with the input sources credited.
4. **Sample size and shrinkage.** Show the denominator. Below a stated sample (R3 suggests about 100 plays for tendencies) show a shrunk estimate, not a raw rate.
5. **Licence of the inputs carries through.** A metric computed from CC-BY-SA data (FTN charting, ffopportunity) is an adaptation under share-alike; one computed from data whose upstream owner restricts reuse (see the corrections in [NFL_API_CATALOG.md](NFL_API_CATALOG.md)) inherits that restriction for a commercial product even when the arithmetic is ours.

## The recipes the brief asked about, and where they are

| Raw data | Calculation | Result | Recipe |
|---|---|---|---|
| Play-by-play (down, distance, yard line, score, clock) | expected points before and after each play; difference | EPA, success rate, EPA per play | R3 table; nflfastR models (MIT) or our own refit with a backtest |
| Weather (wind speed, direction) + stadium field azimuth | wind components along and across the field axis | head/tailwind and crosswind at kickoff | R5 item 8 |
| Schedule + venue coordinates | great-circle distance per trip, season totals | travel distance | R5 item 1, R1 |
| Schedule + IANA time zones + kickoff time | offset change with daylight saving; local time in the team's home zone | time-zone change, body-clock kickoff time | R5 items 2–3 |
| Schedule (previous game dates) | days between games; categories | rest, rest differential, short week, bye | R5 items 4–5 (literature: the bye effect shrank to about +0.3 points after 2011, Lopez & Bliss 2024, consistent with the project's rejection of a rest factor) |
| Roster + injury report + depth chart | missing starters weighted by position and depth rank | expected lineup strength (descriptive injury burden exists today) | R6, R10 |
| Odds (American prices from several books) | implied probability; remove the margin (multiplicative, power, Shin); median across books | no-vig probability, consensus, hold | R7 |
| Team stats + opponent strength | iterative adjustment for opponents faced | opponent-adjusted EPA, SRS | R10, R1 |
| Our own odds snapshots over time | first and last capture, gaps | opening and closing line (with "close within X h") | R7 |
| Stats by scoring system | fantasy points, usage shares, replacement level | fantasy points, target and air-yards share, VORP | R8 |

## Build first (recommended order for this project)

Ranked by value to the existing command center and by how little new data each needs. Each is computed from sources already wired or from open data.

1. **Correct the snowfall unit.** Not a metric but a bug in an existing one: Open-Meteo already returns inches when `precipitation_unit=inch`, and the adapter divides by 2.54 again, so snowfall is shown about 2.5 times too small (R5, probed). Code change, outside this research task.
2. **No-vig consensus with Shin or power devig for futures** (R7): the current multiplicative method is fine for two-way game lines but overstates long shots in 32-team futures.
3. **Opening/closing capture from our own snapshots**, with the gap to kickoff shown (R7): free, honest about the free tier's cadence.
4. **Travel, time-zone, body-clock and rest descriptors** (R5): pure computation from the schedule and stored coordinates; descriptive only.
5. **Wind along and across the field, glare flag** (R5): needs field azimuths from OpenStreetMap (ODbL, attribution and share-alike on the derived azimuth table).
6. **Team EPA per play, success rate, PROE, pace, no-huddle and shotgun rates, explosive-play rate** (R3): from nflverse play-by-play; pin the nflfastR version.
7. **Fantasy points under every scoring system, usage shares, replacement level** (R8): replaces any need for a paid fantasy-points feed.
8. **Our own Elo and SRS, opponent-adjusted EPA** (R10): benchmarks we can publish without licence questions; Neil Paine's MIT Elo (1920–2024) as the historical seed.
9. **Depth-chart history and injury state per player-week from our own snapshots** (R6): the only way to get day-by-day practice participation and depth changes, since no source keeps them.
10. **Forecast accuracy: Brier, log loss, skill against the market, reliability tables** (R7, R10; existing CALIBRATION plan).

## Do not derive (or do not publish)

- **Steam moves and reverse line movement**: need five-minute multi-book snapshots and licensed betting splits; not computable at the free cadence (R7).
- **Tracking-based metrics** (separation, pressure from trajectories, expected YAC from positions): need raw tracking, which only exists under non-commercial Big Data Bowl rules or Genius Sports contracts (R4). Use nflverse's play-by-play-only completion probability and expected YAC instead, labelled as such.
- **Sentiment from YouTube comments**: YouTube's API policies bar it (R9).
- **Anything computed from scraped PFF, Sports Reference or Next Gen Stats site data for a commercial product**: the arithmetic is ours, the data rights are not (see rule 5).

---

## R1. Official NFL sources and league structure

Recipes from [tracks/R1-official-nfl.md](tracks/R1-official-nfl.md).

| RAW DATA REQUIRED | CALCULATION | RESULT |
|---|---|---|
| Game results + division/conference membership (config) | Win % with ties = ½ W + ½ L, per scope (all, division, conference, common opponents with minimum four for wild card) | Tie-break inputs; standings tables |
| Results + opponents' records | SOV = combined win % of beaten opponents; SOS = combined win % of all opponents | Tie-break steps 5–6 (division) / 4–5 (wild card) |
| Points for/against per team | Rank within conference and league for points scored and allowed; sum ranks; lowest wins; ties share rank | Tie-break steps 7–8 |
| Points by game | Net points in common games, conference games, all games | Tie-break steps the engine skips today (CLAUDE.md known gap) |
| Touchdowns by game (nflverse PBP or team stats) | Net touchdowns (TDs scored − allowed) in all games | Last step before coin toss |
| Standings + remaining schedule | Clinch/elimination solver; compare weekly with NFL.com `x/y/z/*` and media.nfl.com scenarios | Validated clinch flags |
| `gameday`, `gametime`, `weekday` | Days since each team's previous game; flag Wednesday/Friday/Saturday/Tuesday games; bye week = week with no game | Rest days, short weeks, bye map (descriptive, not model input without backtest) |
| Stadium coordinates (Wikidata CC0 or config) + schedule | Great-circle travel per game; time zones crossed; international trips and the following week | Travel burden (descriptive) |
| Our dated daily schedule snapshots | Diff of `gametime`/`gameday`/network per game_id | Flex-move log (no official log exists) |
| `home_coach`/`away_coach` by game | Coach change between consecutive games of a club; tenure in games | Coaching-change events with exact effective game |
| `officials.csv` / game book crew + nflverse PBP penalties | Penalties and flags per game by referee crew, normalised by plays | Crew tendencies (descriptive only) |
| Schedule + standings | Remaining strength of schedule (opponents' current win %) | SOS-remaining panel |

## R2. Commercial and freemium multi-domain providers

Recipes from [tracks/R2-commercial-providers.md](tracks/R2-commercial-providers.md).

| RAW DATA REQUIRED | CALCULATION | RESULT |
|---|---|---|
| Two providers' scores for the same game with retrieval timestamps (e.g. Odds API scores + nflverse final) | Compare scores/status per game; flag mismatch > 0 points after final; log time-to-final per source | Source-agreement flag and per-provider "time to final" (measured latency) |
| Provider score change timestamps vs a reference clock (each poll's `last_update`/retrieval time) | For each scoring change, record first-seen time per source; median and P95 lag across a game day | Measured live latency per provider (fills the "measure over a full game day" registry checkbox) |
| nflverse rosters ids (gsis_id, espn_id, sportradar_id, fantasy_data_id, …) | Join any vendor's player id to `gsis_id`; count unmatched; keep an override file for manual fixes | Canonical player id + match-rate metric per vendor (2026 active roster coverage measured: espn 80%, sportradar 75%, fantasy_data 75%, yahoo 48%) |
| PBP rows (down, distance, yard line, clock, score, timeouts) from nflverse | Expected points / win probability via a refit nflfastR-style model (already in plan; backtest first) | Our own WP and EPA, so no vendor WP (Stats Perform MA21, BALLDONTLIE `home_win_probability`, ESPN) is needed |
| Box score/team stats per game | Success rate, yards/play, pace, red-zone and third-down rates | Team efficiency metrics (no vendor "advanced metrics" needed) |
| Odds snapshots (Odds API) | Already computed: median consensus, no-vig probabilities | Market consensus (odds track) |
| Per-source freshness (`retrieved_at`, provider `updated`) | now − last update vs expected cadence | Stale flag per source (e.g. SportsBlaze's 45-hour-stale "Scheduled" game) |

## R3. Play-by-play, advanced analytics, coaching, officiating, special teams

Recipes from [tracks/R3-pbp-analytics.md](tracks/R3-pbp-analytics.md).

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

## R4. Player tracking, Next Gen Stats and computer vision

Recipes from [tracks/R4-tracking-cv.md](tracks/R4-tracking-cv.md).

#### 5a. What we can compute from lawful free inputs

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

#### 5b. What needs raw tracking (only BDB, offline and non-commercial, or a commercial licence)

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

#### 5c. Key literature (what it implies we cannot do without tracking)

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

## R5. Weather, stadiums, geospatial and travel

Recipes from [tracks/R5-weather-stadium-geo.md](tracks/R5-weather-stadium-geo.md).

Notation: φ latitude, λ longitude (radians), R = 6,371.0088 km (mean Earth radius; 3,958.76 mi). All times UTC internally; kickoff `k` from nfldata `gameday`+`gametime` interpreted in America/New_York, then converted.

1. **Travel distance (great circle)** — RAW: origin and destination coordinates (team home airport or stadium; game venue) → CALC: `a = sin²(Δφ/2) + cos φ1 · cos φ2 · sin²(Δλ/2)`, `d = 2R·asin(√a)` → RESULT: km/mi per trip. Season travel = Σ over road and neutral games of (home→venue), plus venue→home if the next game is at home; a road trip of consecutive away games chains venue→venue only if the team is known not to return home (UNKNOWN; default assume return home, and label the assumption).
2. **Time-zone change** — RAW: IANA zone of home and venue, kickoff instant → CALC: `Δtz = offset(venue, k) − offset(home, k)` in hours using `Intl.DateTimeFormat(..., {timeZone, timeZoneName:'shortOffset'})` (handles DST and Arizona) → RESULT: signed hours (+ = travelled east). Do not use nfldata `airports.csv` fixed offsets.
3. **Body-clock kickoff time** — RAW: kickoff instant, team home zone → CALC: `bodyClock = local time of k in the team's home zone` (assume no acclimatisation; optionally `homeZone + min(daysOnSite, |Δtz|)·sign(Δtz)·1 h/day` if arrival day is known — usually UNKNOWN) → RESULT: e.g. a Pacific team at an 8:20 pm ET game plays at 5:20 pm body time; an Eastern team in a 4:25 pm PT game plays at 7:25 pm body time. Flag "late body-clock" when ≥ 20:00.
4. **Rest days and differential** — RAW: previous game date per team (nfldata; or `away_rest`/`home_rest` columns) → CALC: `rest = date(k) − date(previous game)` in days; `restDiff = rest_home − rest_away`; first game of season = NA (or 7 by convention, labelled) → RESULT: integer days; categories: short week (`rest ≤ 5`), normal (6–8), mini-bye (9–12), bye (≥ 13).
5. **Short week** — `rest ≤ 5` (Thursday after Sunday = 4; Saturday after Thursday etc.). Report both teams; "rest edge" only when one team is short and the other is not.
6. **Consecutive road games / road-trip length** — RAW: ordered schedule per team with `location` (Home/Neutral) → CALC: run length of consecutive games with venue ≠ team's home stadium (count neutral international as road unless designated home team is the team itself AND the venue is its own stadium) → RESULT: `roadStreak` at each game; and `daysAway` if travel days are known (UNKNOWN; do not infer).
7. **Altitude delta** — RAW: venue elevation, team home-venue elevation → CALC: `Δh = h_venue − h_home` (m) → RESULT: flag `|h_venue| ≥ 1,200 m` (Denver 1,588 m per Open-Meteo/USGS ~1,583 m; Mexico City 2,245 m). Kicking literature uses ≥ 4,000 ft (1,219 m).
8. **Wind components along the field** — RAW: wind speed `V`, direction `θ_w` (meteorological: direction the wind comes FROM, degrees true), field long-axis azimuth `α` (0–180, OSM) → CALC: `along = V·cos(θ_w − α)` (+ = wind blowing from the α end toward the α+180 end, i.e. a tailwind for the team attacking toward α+180), `cross = V·sin(θ_w − α)`, `|cross|` is the crosswind magnitude. Example (new Highmark, α = 348°): wind from 270° at 15 mph → along 3.1 mph, cross 14.7 mph (almost pure crosswind). Use gusts separately. Stadium bowls shelter the field: model values are free-stream at 10 m, so label "open-air wind at 10 m, not field-level".
9. **Sun glare risk** — RAW: venue φ, λ, kickoff and expected game window (k to k+3.25 h), field azimuth α, roof → CALC: NOAA/Meeus solar position: Julian day `JD`, `T = (JD − 2451545)/36525`; mean longitude `L0`, anomaly `M`, equation of centre `C`, apparent longitude `λ☉`, obliquity `ε`, declination `δ = asin(sin ε · sin λ☉)`, equation of time `EoT`; true solar time `TST = minutesUTC + EoT + 4·λ°`; hour angle `H = TST/4 − 180`; `cos Z = sin φ sin δ + cos φ cos δ cos H`; elevation `e = 90° − Z`; azimuth `A = atan2(sin H, cos H sin φ − tan δ cos φ) + 180°`. Glare flag when the roof is open, `0° < e ≤ 15°` and `|((A − α + 90) mod 180) − 90| ≤ 20°` (sun nearly in line with the field axis, so players facing one end look into it). Thresholds are judgment (no published evidence found). Example: new Highmark 2026-12-27 13:00 EST → e 23.2°, A 190.9°, 22.9° off-axis (no flag); 16:25 EST → e 2.7°, A 234.4°, 66° off-axis (low sun, mostly across the field).
10. **Roof/surface flags** — RAW: nfldata `roof`, `surface` per game; venue `roof` → CALC: `indoor = roof ∈ {dome, closed} or venue roof = fixed`; `retractableUnknown = venue roof = retractable and roof blank`; `turf = surface ∉ {grass, grass }` after trimming (nfldata has "grass " with a trailing space, 93 rows since 2020); `surfaceChange = surface differs from the venue's previous season` → RESULT: booleans; weather features apply only when `indoor = false`.
11. **Game-time weather summary** — RAW: hourly series → CALC: value at the hour nearest kickoff (the fabric already requires ≤ 2 h gap) plus the mean/max over k..k+3 h → RESULT: `tempF`, `windMph`, `gustMph`, `precipIn`, `snowIn` (Open-Meteo returns inches when `precipitation_unit=inch` — do not divide again), with `kind` and `issuedAt`.

## R6. Injuries, rosters, depth charts, transactions, contracts

Recipes from [tracks/R6-injuries-rosters-transactions.md](tracks/R6-injuries-rosters-transactions.md).

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

#### Depth Chart History (design)

Goal: a per-player timeline (starter → backup → inactive → injured → starter) with provenance.

1. **Snapshots (raw, append-only).** `depth_snapshot {source, team, sourceAsOf (nflverse dt), fetchedAt, contentHash}` and `depth_slot {snapshotId, group, slot (pos_abb+pos_slot), rank, playerKey (gsis, else espn), rawName}`. Only store a snapshot when `contentHash` changes (most afternoon snapshots are unchanged). History before 2025 comes from the weekly 2001–2024 files (different format: `depth_team`, `formation`, `depth_position`); keep `format: "nfl-dx-weekly"|"espn-snapshot"` and never compare ranks across formats without a mapping table.
2. **Events (derived).** Diff consecutive snapshots per source and team: `depth_change {subtype: added|removed|promoted|demoted|starter_changed|position_changed, team, player, group, slot, fromRank, toRank, ts: estimated, data.between: [prev.sourceAsOf, this.sourceAsOf], seenAt, source}`. Fits the existing Event shape (`data.tsEstimated`, `data.between`).
3. **Player state per game week (fused).** One state per player-week built from independent signals, each kept with its source: roster status (nflverse rosters: ACT/DEV/RES/PUP/SUS/EXE/CUT), injury designation (nflverse injuries), depth rank (nflverse depth; Sleeper as second opinion), game-day activity (inactive or active; source to be confirmed), actual participation (snap counts; out of scope here). Derived state order: `released` > `reserve(IR/PUP/NFI/SUS/EXE)` > `out` > `inactive` > `starter` (rank 1 and active) > `backup` (rank ≥ 2) > `practice squad`.
4. **Conflict handling.** Never overwrite: store per-source values and a `conflict` object when sources disagree (e.g. depth chart rank 1 but roster RES). Precedence for display: official roster status and official designation over depth chart; depth chart over Sleeper. A depth change that reverts in the next snapshot is marked `flap: true` and hidden from feeds; changes persisting for two snapshots are "confirmed". Players unmatched by id stay in an unresolved list.
5. **Point-in-time replay.** Backtests read states as of `seenAt` (not `sourceAsOf`), consistent with DATA_MODEL.md. nflverse `dt` is a load time, not the club's effective time.
6. **Cost.** At about 2,350 rows a snapshot and two snapshots a day, raw storage is about 1.7 million slot rows a season before de-duplication; storing only changed snapshots (hash) cuts this sharply. The fabric already scans the 80 MB CSV for each team's newest `dt`; for history, download only when `timestamp.json` changes.

#### Speed and reliability comparison (measurement design)

No published, primary evidence comparing the speed of the NFL, ESPN, Sleeper, RotoWire, news sites and social media was found: **UNVERIFIED**. Proposed measurement with the existing fabric:

- **Facts to track.** Injury designation `(gsis, season, week, status)`, practice entry `(gsis, date, practice_status)`, reserve move `(gsis, RES|PUP|…)`, transaction `(gsis or name+team, type, date)`.
- **Per source, record `firstSeenAt`** (the fabric's `seenAt`) in an `observations` log: `{factKey, source, value, firstSeenAt, pollIntervalSec}`. Sources the project may poll: nflverse (public; every 30 min reading `timestamp.json`, cheap), Sleeper (at most once a day per docs, so it cannot win a speed race unless the owner obtains approval for more), ESPN (local server only, 15 min), curated news (manual timestamps). NFL.com, RotoWire, Rotoworld and X are **not** polled; a person may note their times by hand during a sample window.
- **Reference time.** Official deadline from the policy (e.g. 21:00 UTC for a 4 p.m. ET report; UNVERIFIED) or the earliest manual official sighting.
- **Metrics.** Median and 90th-percentile lag to the reference; coverage within 24 h; disagreement rate (source value never matching the official final); flip rate.
- **Window.** Four consecutive weeks including Thursday, Saturday (late season), Sunday and Monday games; extra polling Wed–Fri 18:00–23:00 UTC and Sundays from 15:00 UTC for inactives.
- **Resolution.** Lag cannot be measured more finely than the poll interval; report it as `≤ interval`.
- **Expected outcome (inference, to be tested):** ESPN local fastest among usable sources; nflverse about 10 hours behind a 4 p.m. ET report; Sleeper limited by once-a-day polling.

## R7. Betting odds, line history, splits, prediction markets

Recipes from [tracks/R7-odds-markets.md](tracks/R7-odds-markets.md).

All computed in the engine from stored raw rows (each with source, book, `captured_at` UTC, event time). Formulas are standard; none is a new model input without a backtest (house rule).

| RAW DATA REQUIRED | CALCULATION | RESULT |
|---|---|---|
| American price A | p = 100/(A+100) if A > 0; p = −A/(−A+100) if A < 0; decimal d: p = 1/d | Implied probability (with vig) |
| Implied p_i for all n outcomes of one market, one book | Overround O = Σp_i − 1; theoretical hold h = 1 − 1/Σp_i | Book margin; flag books with h above the median |
| Same | Multiplicative: q_i = p_i / Σp_j (current `ODDS_ENGINE.md` method) | No-vig probability (fine for two-way game lines) |
| Same | Additive: q_i = p_i − (Σp_j − 1)/n (can go negative on long shots) | Alternative no-vig |
| Same | Power: find k with Σ p_i^k = 1 (bisection), q_i = p_i^k | Corrects favourite–longshot bias; better for futures fields of 32 teams |
| Same | Shin: z solved so Σq_i = 1, q_i = [√(z² + 4(1−z)·p_i²/Σp) − z] / (2(1−z)); z ≈ insider share | Preferred for futures; report z as a market-quality indicator |
| No-vig q per book, book list | Consensus = median of q across books (and median spread/total); dispersion = IQR or max−min; n_books | Consensus probability, line and disagreement band (already partly built, DEC-019) |
| Consensus spread S (home margin) and total T | Home implied points = (T + S)/2; away = (T − S)/2 | Team implied totals (descriptive) |
| Spread S, fitted σ from nflverse results 1999+ | P(home win) ≈ Φ(S/σ) with an empirical key-number correction (3, 7) from the same history | Spread-implied win chance to compare with ML no-vig (cross-check) |
| Our snapshots with `captured_at`, kickoff `commence_time` | Open = first snapshot after the market appears; close = last snapshot before kickoff; store gap = kickoff − last capture and label "close within X h" | Opening/closing capture with explicit uncertainty (with 11-hour cadence, "close" can be many hours stale — must be shown) |
| Model probability p_m frozen at time t (UTC), consensus q_t, q_close | Model CLV (probability) = (q_close − q_t)·sign(p_m − q_t); in points: (line_close − line_t) sign-adjusted; report mean ± 95% CI and share > 0 over a season | Whether the market moved toward the model after publication (descriptive; not an edge claim) |
| ≥ 5-minute snapshots from ≥ k books | Steam = move ≥ 0.5 pt (or ≥ 2 pp no-vig) at ≥ k of n books within w ≤ 10 min, same direction | Steam flags — **not computable** at the free cadence; needs paid historical or polling |
| Line series + licensed splits (tickets %) | RLM = majority of tickets (e.g., ≥ 60%) on side A while consensus line moves toward B | Reverse line movement — **not computable** without a lawful splits source |
| p_m and consensus q | Gap Δp = p_m − q; in points Δ = σ·(Φ⁻¹(p_m) − Φ⁻¹(q)); show with simulation SE and market IQR; conflict chip at existing 8-point rule | Model-vs-market disagreement, labelled as disagreement |
| Prop O/U line L with prices; alt-line ladder L_j | No-vig P(X > L); ladder → CDF points F(L_j) = 1 − q_over(L_j); fit normal/log-normal for yards; anytime TD: λ = −ln(1 − q_anytime) (Poisson); check team sums (receiving ≈ passing) | Prop-implied player distributions (descriptive) |
| Futures prices for all 32 teams | Shin or power devig → compare with simulator's Super Bowl, division and playoff probabilities; Brier vs final outcomes | Model-vs-futures comparison |
| NV football win W and win % w | Handle ≈ W / w; hold = w | Monthly Nevada football handle estimate |
| Indiana football handle H by month | Seasonal index, year-on-year change | Market-size context |
| Model and market probabilities, outcomes | Brier, log loss, Brier skill vs market, reliability bins (existing CALIBRATION plan) | Accuracy tracking |

## R8. Fantasy football

Recipes from [tracks/R8-fantasy.md](tracks/R8-fantasy.md).

| RAW DATA REQUIRED | CALCULATION | RESULT |
|---|---|---|
| nflverse `stats_player` weekly: passing/rushing/receiving yards and TDs, interceptions, receptions, 2-pt conversions, `sack_fumbles_lost` + `rushing_fumbles_lost` + `receiving_fumbles_lost`, `special_teams_tds`, kicking splits | Points = Σ stat × weight per scoring profile (standard; half PPR 0.5/rec; PPR 1/rec; TE premium +0.5/rec for TE; 6-pt passing TD; −1 or −2 per INT); validate the standard/PPR profiles against nflverse's own `fantasy_points` / `fantasy_points_ppr` columns in a test | Fantasy points for every scoring system, including formats FantasyPros does not serve (TE premium, 6-pt pass TD) |
| `targets`, `receiving_air_yards` per player and team-week (nflverse) | target share = player targets / team targets; air-yards share likewise; WOPR = 1.5 × target share + 0.7 × air-yards share (nflverse already ships all three; recompute only to verify) | Opportunity shares |
| nflverse play-by-play `yardline_100`, rusher/receiver ids | Count carries and targets with `yardline_100` ≤ 20 (and ≤ 10, ≤ 5) per player-week; divide by team totals | Red-zone and goal-line touch share |
| `snap_counts` `offense_pct` (PFR via nflverse) | Rolling 3-week mean and week-over-week change | Snap share and role change flags |
| `pbp_participation` `offense_players` on dropbacks (post-season only) | Player on field on dropbacks / team dropbacks | Route-participation **proxy** (includes pass blockers; not true routes; unavailable in season) |
| ffopportunity `ep_weekly_<season>` (or our own model on nflverse pbp trained on prior seasons only) | FPOE = actual − expected fantasy points; rolling sums | Expected points and efficiency over expectation |
| Permitted projections (FantasyPros now; Fantasy Nerds / SportsDataIO if licensed) + historical outcomes | Weighted mean or median of sources, weights from out-of-sample error by position (house rule: backtest before use); publish only our aggregate | Our consensus projection (with spread = disagreement) |
| Consensus projection + nflverse injuries (`report_status`, practice status) + historical snaps of players with each status | P(active) per status estimated from past seasons; projection × P(active); redistribute vacated targets/carries by teammates' shares | Injury-adjusted projection (model estimate, labelled as such) |
| League settings (teams, starters per position, flex) + projections for all players | Replacement rank = teams × starters (flex allocated to the best leftover); baseline = projection at replacement rank; VORP = projection − baseline | Replacement level and value over replacement for any league format |
| ADP (FFC, MFL) + our VORP rank | ADP rank − our rank, with ADP stdev and sample size shown | Draft value vs market |
| nflverse stats by `opponent_team` and position | Fantasy points allowed per game, opponent-adjusted (subtract each player's own average) | Positional strength of schedule |
| Weekly fantasy points history | Percentiles (10th/50th/90th) and share of weeks above position thresholds | Floor/ceiling (boom/bust) descriptions |

## R9. News, press conferences, social, media

Recipes from [tracks/R9-news-social-media.md](tracks/R9-news-social-media.md).

| RAW DATA REQUIRED | CALCULATION | RESULT |
|---|---|---|
| Headlines (title, link, publisher, time) from all allowed feeds + Bluesky posts | Normalise titles (lowercase, strip punctuation and publisher suffix), word 3-shingles, Jaccard ≥ 0.5 **or** same matched team+player entities and claim verb within 6 h | Story clusters with first-seen time, source list, source count |
| Story clusters + source tier table (below) + parent-company map (e.g. ESPN/ESPN podcasts; NBC/PFT/Rotoworld; FOX) | Count independent tier-2/3 sources (distinct parent companies); aggregators (tier 4) and reposts never count; official tier-1 item upgrades at once | Verification label per claim: confirmed / reported / rumor / speculation, with the reason shown |
| Cluster first-seen times per source, later official confirmation (nflverse transactions/injuries, club YouTube, curated) | For each source: share of its "reported" claims later confirmed within 14 days; median lead time vs official | Our own insider accuracy and speed ledger (no published study was found to seed it) |
| GDELT DOC `timelinevol` or counts of our own headlines per team per day | Robust z-score vs trailing 28 days (median/MAD, |z| > 3.5) | "Media attention spike" flag per team (descriptive, DEC-007) |
| Bluesky posts (curated list or keyword sample) with times | Transparent lexicon or locally trained classifier; mean polarity with n and a bootstrap interval; minimum n before showing | Team fan-sentiment index (descriptive only; must pass the backtest rule before any model use) |
| Club YouTube feed items with `kind=press` | Count per team per 7 days; newest time | "Last press conference" and cadence indicator |
| Podcast episode titles (not transcripts) | Team-name matches per week across the six league shows | Podcast attention by team (low risk, but see §7 note on iHeart's notice) |
| Existing `newsEffect` inputs (line move around a news item) | Unchanged (CLAUDE.md) | News effect on playoff chances |

**Verification and confidence framework (proposal).**
- Labels (CLAUDE.md requires them in data and UI): `confirmed` (tier-1 official statement, official transaction wire or injury report, or the club's own video of the announcement); `reported` (a named tier-2/3 journalist or wire stating it as fact, usually "sources say"); `rumor` (unnamed or aggregator-only, hedged words: "could", "expected to", "per reports", "linked to"); `speculation` (opinion, analysis, podcast talk, mock drafts); `estimate` (our models).
- Source tiers: 1 official club/league (club sites, NFL Communications, official YouTube/podcasts); 2 national insiders and wires (e.g. Rapoport, Pelissero, Schefter, AP, Reuters/FLM); 3 established beat reporters and national outlets (FOX, Yahoo, ESPN, The Athletic, PFT); 4 aggregators and rumor sites (PFN, NFL Trade Rumors, Yardbarker, Google News); 5 fans and unverified accounts.
- Confidence: start from the best tier present; +1 step for each additional independent tier-2/3 source within 24 h (cap at "reported, high"); only a tier-1 item makes `confirmed`; a deleted post or retraction drops the claim and records why; unconfirmed rumors decay after 72 h to "stale rumor".
- Evidence on insider accuracy: **UNVERIFIED** — no published study was found (this session's search budget ran out before a dedicated search); the ledger above builds the evidence from our own data.

**Published research on sentiment vs outcomes (verified items only).**
- Sinha, Dyer, Gimpel, Smith (2013), "Predicting the NFL using Twitter", ECML/PKDD workshop, arXiv:1310.6998: "simple features using large volumes of tweets can match or exceed" game-statistic features for predicting NFL winners, spreads and totals (abstract read; betting-line comparison not checked in the full text).
- Brown, Rambaccussing, Reade, Rossi (2017/2018), "Forecasting with social media: evidence from tweets on soccer matches", *Economic Inquiry* (DOI 10.1111/ecin.12506; Crossref abstract read): 13.8 million tweets with Betfair prices; tweet tone "contains significant information not in betting prices", mainly right after goals and red cards (in-play soccer, not NFL).
- Hong and Skiena (2010), "The Wisdom of Bookies? Sentiment Analysis versus the NFL Point Spread", ICWSM — recalled, **UNVERIFIED** (not read).
- Implication: any sentiment factor is a candidate for the backtest rule, not a model input; collect timestamped Bluesky samples first so a backtest has history.

## R10. Historical data, open source, academic, college, draft

Recipes from [tracks/R10-historical-opensource-draft.md](tracks/R10-historical-opensource-draft.md).

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
