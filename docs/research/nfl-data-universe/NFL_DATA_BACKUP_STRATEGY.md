# NFL Data Backup Strategy: primary, secondary, fallback

Part of the NFL data and API universe research (NU-018, Nov. 25, 2026). Start at [NFL_API_UNIVERSE.md](NFL_API_UNIVERSE.md). The mechanics (how the fabric chooses a source, keeps the others as observations and records disagreement) are in [NFL_DATA_ARCHITECTURE.md](NFL_DATA_ARCHITECTURE.md) §2.2 and §5.

## How to read this

- **Primary** is used when it is fresh and valid. **Secondary** takes over when the primary is down or older than the field's freshness budget. **Fallback** is the last resort, often our own last-good copy marked stale, a computed substitute, or an honest "unavailable".
- Each chain is written for **this project as it is**: a free, non-commercial public page built on GitHub Actions and Render, plus the owner's local server where ESPN's JSON is allowed (DEC-006). Where a commercial product would choose differently, the last column says so.
- "Local" means the owner's machine only. "Owner decision" means the source's terms do not clearly allow the use and the owner must accept the risk or drop it (see the open decisions in [NFL_API_UNIVERSE.md](NFL_API_UNIVERSE.md)).
- A backup is only real if it is **independent**: two nflverse files built from the same upstream are one source, and nflverse's depth charts are ESPN's data, so ESPN is not an independent backup for them.

## Master table

| # | Data category | Primary | Secondary | Fallback | Real backup? | Commercial product instead |
|---|---|---|---|---|---|---|
| 1 | Schedule, kickoffs, networks, venues | nflverse `games.csv` | ESPN scoreboard (local) | Our dated daily snapshot; NFL.com checked by hand | Public: only our own snapshot | Sportradar or SportsDataIO schedule |
| 2 | Flex and time changes | Daily diff of nflverse snapshots | ESPN (local) | Curated news item with an NFL.com or club source | Partial | Licensed feed with change events |
| 3 | Results and standings | Our engine on nflverse results | nflverse `standings.csv` | NFL.com standings read by hand | Yes (computed twice) | Same, plus licensed standings |
| 4 | Clinching and elimination | Our conservative `status()` | A solver ported from nflseedR's documented method (MIT, F03) | NFL.com clinch codes read by hand | Partial | Same |
| 5 | Live scores and game state, public page | The Odds API `/scores` (about 30 s; 1 credit a call; needs the $30 plan for game-day polling) | nflverse final scores (post-game) | "Live scores unavailable" with the last known state | Thin | Sportradar or SportsDataIO push/poll |
| 6 | Live scores, owner's machine | ESPN scoreboard (local, 15–20 s) | The Odds API `/scores` | nflverse | Yes | — |
| 7 | Live play-by-play | ESPN game summary (local only) | none lawful at fan cost | "Play-by-play after the game" (nflverse) | **No (public)** | Sportradar push → SportsDataIO |
| 8 | Historical play-by-play | nflverse `pbp` (2001–2026 maintained) | none free and lawful | Our last-good cached season files | **No free backup** | Sportradar historical |
| 9 | EPA, win probability, completion probability | nflverse values with the nflfastR version pinned | Our own computation with the same MIT models | ESPN win probability (local) | Yes | Same |
| 10 | Charting: play action, RPO, motion, blitzers | FTN charting via nflverse (CC-BY-SA, 1.5–3 days after games) | FTN API (paid, in season) | PFR advanced stats via nflverse (blitz and pressure only; owner decision) | Partial | FTN API |
| 11 | Personnel, formation, coverage | nflverse participation (after the season only) | FTN API (paid) | Play-by-play `shotgun` and `no_huddle` flags | **No in-season free source** | FTN API; Sportradar |
| 12 | Tracking aggregates (separation, time to throw, RYOE) | nflverse `nextgen_stats` (owner decision: scraped from the NFL's site) | Link to nextgenstats.nfl.com | Play-by-play-only completion probability and expected YAC, labelled | **No** | Genius Sports contract |
| 13 | Officiating crews | nflverse `officials` / nfldata `referee` (both stale in 2026) | Football Zebras, linked by hand | Game book read by hand | **Weak** | Licensed feed with officials |
| 14 | Head coaches | nfldata coach per game | Curated config with club source URL | Club websites by hand | Yes | Same |
| 15 | Coordinators, play-callers, GMs, owners | Curated config with source URL and date | Record & Fact Book (season start) | Wikidata (stale, history only) | **No machine source** | Same |
| 16 | Injury report: official status | nflverse `injuries` | ESPN injuries (local) | Sleeper `injury_status`, shown as "Sleeper status" (owner decision on Sleeper's terms) | Partial (public: nflverse only) | Sportradar or SportsDataIO (5-minute sync) |
| 17 | Practice participation by day | Our own snapshots of nflverse injuries, from now on | ESPN (local) | none | **No** (past days are lost) | Licensed feed |
| 18 | Game-day inactives | ESPN game summary (local) | none confirmed | none | **No (public)** | Licensed feed |
| 19 | Roster status (IR, PUP, NFI, suspended, practice squad) | nflverse weekly rosters | nflverse `players` (same upstream) | Sleeper status | Partial | Licensed feed |
| 20 | Depth charts | nflverse depth charts (ESPN's data; see corrections) | Sleeper `depth_chart_order` (owner decision) | Last game's starters computed from play-by-play and snap counts | Weak; the computed starters are the only independent check | Sportradar or SportsDataIO depth charts |
| 21 | Transactions | ESPN transactions (local) | Week-to-week diffs of nflverse rosters | Curated news | **No public near-real-time source** | Sportradar Daily Transactions |
| 22 | Contracts and salary cap | none usable publicly | — | League cap figure from NFL.com, entered by hand | **No** | Licence from OverTheCap, Spotrac or a data vendor |
| 23 | Player identity | nflverse `players` (GSIS id) | nflverse weekly-roster ids (Sleeper, RotoWire, Sportradar ids come from GPL DynastyProcess data) | Sleeper's own ids; name + team + position flagged unresolved | Yes | Vendor id maps (Sportradar Mapping API) |
| 24 | Game lines, several books | The Odds API (consensus published) | A second free key (SportsGameOdds or SharpAPI), local only | ESPN's single DraftKings line (local); nflverse one line | Partial | OpticOdds or Sportradar Odds |
| 25 | Line history, opening and closing | Our own timestamped snapshots | The Odds API historical (paid, 5-minute) | ESPN open/current (local) | Weak on the free tier | The Odds API paid plan or OpticOdds |
| 26 | Player props | The Odds API event odds (credits) | none free | none | **No** | The Odds API paid; OpticOdds |
| 27 | Futures | The Odds API outrights | Our simulator (a model, labelled as such) | Link out | Partial | Same |
| 28 | Betting splits, handle | none lawful and free | — | State monthly handle reports (aggregate) | **No** | Sportradar or SportsDataIO splits |
| 29 | Prediction-market prices | none confirmed lawful for display | — | — | **No** | Licensed through a data partner |
| 30 | Weather forecast at venues | Open-Meteo | NWS hourly (US); Met Office DataHub (UK) | Last-good forecast marked stale | Yes in the US | Open-Meteo paid + NWS → Visual Crossing |
| 31 | Weather alerts | NWS (US) | none abroad | "No alert feed for this country" | **No outside the US** | Paid global alerts provider |
| 32 | Observed game-time weather (history) | nfldata temp/wind | Iowa Mesonet ASOS (nearest station) | NOAA NCEI; Meteostat | Yes | Same |
| 33 | Forecasts as they stood before kickoff (backtests) | Open-Meteo Previous Runs (2024 on) | Our own frozen forecasts (from Nov. 2026) | Betting total as a proxy | **No before 2024** | Same |
| 34 | Venue facts: coordinates, elevation, field azimuth, roof, surface | Config built from Wikidata (CC0) and OpenStreetMap (ODbL) | USGS / Open-Meteo elevation; nfldata surface | Official stadium sites, by hand | Yes | Same |
| 35 | Retractable roof open or closed, per game | nfldata `roof` (after the game) | none | Unknown, shown as unknown | **No pre-game source** | Licensed feed (unverified) |
| 36 | Maps | Natural Earth (in use) | US Census cartographic boundaries | Protomaps extract | Yes | Same |
| 37 | Headlines, public page (fetched on GitHub) | Yahoo RSS | FOX Sports NFL RSS (headline and link only; GitHub reach to verify) | Curated news and official video titles; GDELT for discovery | Yes once FOX is verified | AP or Reuters/Field Level Media |
| 38 | Breaking insider news | Bluesky, curated verified accounts | X API pay-per-use (owner key) | Official confirmation (club video, curated) | Partial | X API; SportsDataIO player news |
| 39 | Press conferences | Official club YouTube (embed or link) | Club website links | none | Video only; **no lawful transcripts** | NFL licence |
| 40 | Fantasy projections and rankings | FantasyPros API (owner's paid personal key; derived values only) | Fantasy Nerds or SportsDataIO (paid) | Our own projection, only after a backtest | **No free second source** | FantasyPros commercial, SportsDataIO, RotoWire |
| 41 | ADP | Fantasy Football Calculator | MyFantasyLeague | FantasyPros ADP | Yes | Same |
| 42 | Fantasy points and usage | Computed from nflverse | SportsDataIO (paid) | none | Computable | Same |
| 43 | Historical results 1920 on | nflverse | Neil Paine Elo CSV (MIT, to 2024) | spreadspoke (non-commercial, local only) | Yes | Same |
| 44 | Model benchmarks | Our own Elo and SRS | nfelo outputs (licence allows republishing) | Neil Paine Elo (history) | Yes | Same |
| 45 | Draft, combine, college | nflverse `draft_picks` and `combine` (owner decision: PFR upstream) | CollegeFootballData.com (key; no raw redistribution) | Links to official pages | Partial | CFBD paid tiers; licensed provider |

## Single points of failure

1. **nflverse** is the primary for rows 1, 3, 8–12, 13, 16, 19–20, 23, 32, 42–45. It is maintained by a small volunteer group and served from GitHub releases. Mitigations: the fabric already keeps last-good copies and carries a failed public source forward for up to 7 days (`carry.js`); keep a local mirror of the release files the build reads; a paid provider (Sportradar or SportsDataIO) is the only full replacement.
2. **The Odds API** is the only lawful multi-book odds source in use. A second key from another provider (local only) is a cheap partial hedge.
3. **GitHub Actions** fetches everything published. Its scheduler can be late or skip runs (DEC-021, DEC-023), and some providers refuse its servers (ESPN, DEC-024). The push-started fetch (DEC-023) and the Render server are the existing hedges; any new public source should be tested from a GitHub runner before it is relied on.
4. **ESPN (local)** is the only live source for scores, play-by-play, inactives and transactions on the owner's machine. Its terms do not grant automated use (DEC-006); it can disappear or block at any time.

## Categories with no real backup (for a free public page)

Live play-by-play; in-season personnel and coverage; tracking aggregates; officials in the current season; coordinators and play-callers; day-by-day practice participation; game-day inactives; transactions; contracts and cap; player props; betting splits and handle; prediction-market prices; weather alerts outside the US; pre-kickoff roof status; archived forecasts before 2024; fantasy projections beyond one provider; press-conference transcripts.

---

# Detail by domain

Each track's own redundancy table follows, unchanged. Where a row there disagrees with the master table above or with the verified corrections in [NFL_API_CATALOG.md](NFL_API_CATALOG.md), the master table and the corrections win.

## R1. Official NFL sources and league structure

Redundancy table from [tracks/R1-official-nfl.md](tracks/R1-official-nfl.md).

| Category | PRIMARY → SECONDARY → FALLBACK | Notes |
|---|---|---|
| Schedule (date, time, weekday, venue, neutral, network) | nflverse `games.csv` (daily, already used) → ESPN scoreboard (owner's machine only, DEC-006) → config snapshot of the official schedule release + manual NFL.com check | Real backup for public deploys: none besides our own dated snapshot. Keep a copy of each day's schedule to detect flex moves |
| Flex / time changes | nflverse daily diff vs our previous snapshot → ESPN (local) → curated news item with nfl.com/club source URL | No official machine log of flex changes |
| Results and standings | our engine from nflverse results → nflverse `standings.csv` (updated 2026-11-24) → NFL.com standings, read by hand | Cross-check two computed sources; NFL.com only by eye |
| Official clinch codes | our `status()` (conservative) → nflseedR-style solver (port, F03) → NFL.com `x/y/z/*` read by hand and media.nfl.com Playoff Scenarios | No lawful automated feed of official flags |
| Tie-break procedure | NFL.com tie-break page → Record & Fact Book → nflseedR's documentation | Config; re-check each March |
| Official injury report | nflverse `injuries` (daily) → ESPN injuries (local) → NFL.com/injuries read by hand | No lawful automated official feed |
| Transactions | ESPN transactions (local only) → curated news → NFL.com transactions read by hand | **No real backup for the public page** (nflverse has trades only) |
| Officials (crew per game) | nflverse `officials.csv` (lags; 2026 only through Week 5) → game book, read by hand → Football Zebras (reported) | **Weak**: show "as of" and gaps |
| Head coach | nflverse `games.csv` coach per game (current every week) → club website (manual) → Wikidata (stale) | Mid-season firings show as a coach-name change between games |
| Coordinators (OC/DC/ST), GM, owner, president | hand-kept config with club URL + date → Record & Fact Book (season start) → Wikidata (GM 4/32) | **No machine source**; config only |
| Club colours, names, abbreviations | `shared/teams.json` (config) → nflverse `teamcolors.csv` (2020) → teamcolorcodes.com | No official machine source |
| Venues, roof, surface | nflverse `games.csv` stadium fields → Wikidata (coordinates, CC0) → club sites | |
| International / neutral games | nflverse `location=Neutral` → operations.nfl.com international page → config | |
| Super Bowl sites | config with source URL → Record & Fact Book → Wikidata | Future sites taken from secondary press (see §7) |
| Official live play-by-play | Genius Sports (paid; future) → ESPN summary (local) → nflverse PBP (post-game, nightly) | **No free, lawful official live feed** |
| Weekly league releases / scenarios | media.nfl.com (link) → our simulator → none | |
| Hall of Fame / awards | PFHOF (link) → Wikidata → hand config | |

**League-structure data that needs no external API (keep in config, cite the source and the date checked):** conferences and divisions (stable since the 2002 realignment; nflverse `standings.csv` confirms 8 × 4 for 2002–2026); team ids, names, abbreviations, colours (`shared/teams.json`); tie-break procedure steps; schedule formula (6 + 4 + 4 + 2 + 1, 17 games, 18 weeks); playoff format (7 per conference, No. 1 seed bye — general knowledge, not re-checked here); flex windows per season; Week 18 slot pattern; Super Bowl sites; international venues of the year; stadium roof and surface (change rarely); Hall of Fame classes (annual). The schedule, results, coaches per game and officials need a data source (nflverse); everything live needs ESPN (local) or a paid feed.

**Official source per category:** schedule — NFL.com schedule and the annual schedule release; standings/clinch — NFL.com standings codes and media.nfl.com Playoff Scenarios; rules/tie-breakers — NFL.com tie-break page and the Official Playing Rules PDF; injuries — NFL.com official injury report (media.nfl.com version is gated); transactions — NFL Communications transaction wire (gated) and NFL.com transactions; officials — game books; stats and play-by-play — GSIS via Genius Sports (game books post-game); tracking — Next Gen Stats via Genius (site shows leaderboards); history — Record & Fact Book; staff — club websites; Hall of Fame — PFHOF.

**Official data simply not available to a small app:** the real-time official play-by-play and NGS feeds (Genius contract), GSIS, the NFL Shield API, NFL Communications' gated wire (transactions, injury reports, game-day rosters, guides), game books for anything but media coverage, NFL Pro/All-22 exports, and any automated retrieval of NFL.com (Terms §1.3).

## R2. Commercial and freemium multi-domain providers

Redundancy table from [tracks/R2-commercial-providers.md](tracks/R2-commercial-providers.md).

| Data category | PRIMARY → SECONDARY → FALLBACK | Reasons |
|---|---|---|
| Live scores and game state (public page) | The Odds API scores ($30/mo plan) → BALLDONTLIE GOAT (after written provenance check) → nflverse games file (daily, post-game) | Odds API: licensed, key and terms already in place, ~30 s. BALLDONTLIE: only cheap licence that names PBP and display, but upstream doubtful. nflverse: free, CC-BY-compatible, not live. |
| Live scores (owner's machine only) | ESPN scoreboard (DEC-006, local) → The Odds API scores → nflverse | Unchanged from DEC-006; ESPN stays local-only. |
| Live play-by-play (public page) | None licensed at fan-project cost → (funded) SportsDataIO or Sportradar → nflverse play-by-play (nightly, post-game) | **No real free or cheap clean backup.** Every sub-$100 PBP feed found has undisclosed or ESPN-like provenance. |
| Post-game PBP, box scores, team/player stats | nflverse (CC-BY) → SportsDataIO Discovery Lab (next day; personal use only, not for display) → none | nflverse already in use; commercial feeds only with a contract. |
| Injuries (intra-day) | ESPN injuries (local) → (funded) SportsDataIO (sync every 5 min) / Sportradar weekly → nflverse injuries (daily) | Public intra-day injuries have no licensed free source. |
| Depth charts | nflverse depth charts (daily) → ESPN (local) → (funded) SportsDataIO / Sportradar | nflverse adequate for a daily page. |
| Player/team ids crosswalk | nflverse rosters (gsis, espn, sportradar, fantasy_data, yahoo, sleeper, pff, pfr) → SportsDataIO Player object (Sportradar, Yahoo, RotoWire, STATS ids; no GSIS/ESPN) → Tank01 (ESPN/CBS/Yahoo/Sleeper ids; avoid) | nflverse is CC-BY and covers GSIS for 100% of active players. |
| Transactions | ESPN (local) → (funded) Sportradar Daily Transactions (back to 2002) / SportsDataIO | No free licensed public source (registry agrees). |
| Official/tracking (NGS) | Genius Sports (contract) → nflverse `nextgen_stats` (weekly aggregates, CC-BY) → none | NGS raw tracking is not obtainable outside Genius/NFL. |

Categories with no real backup for a public, free page: live play-by-play, intra-day injuries, transactions, live NGS.

## R3. Play-by-play, advanced analytics, coaching, officiating, special teams

Redundancy table from [tracks/R3-pbp-analytics.md](tracks/R3-pbp-analytics.md).

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

## R4. Player tracking, Next Gen Stats and computer vision

Redundancy table from [tracks/R4-tracking-cv.md](tracks/R4-tracking-cv.md).

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

## R5. Weather, stadiums, geospatial and travel

Redundancy table from [tracks/R5-weather-stadium-geo.md](tracks/R5-weather-stadium-geo.md).

| Data category | PRIMARY → SECONDARY → FALLBACK | Real backup? |
|---|---|---|
| Pre-game forecast at venue | Open-Meteo Forecast → NWS hourly (US) / Met Office DataHub (UK, key) → last-good cached forecast marked stale | Yes in the US; abroad only Open-Meteo without a key |
| Pre-game forecast, commercial product | NWS (US, public) + Open-Meteo paid → Visual Crossing → WeatherAPI.com | Yes (paid) |
| Weather alerts | NWS alerts → (none abroad) → show "no alert feed for this country" | **No backup**; no free alert feed for UK/EU/MX venues was verified |
| Observed game conditions (history) | nfldata temp/wind → IEM ASOS (nearest station) → NCEI ADS/GHCNh → Meteostat (model fill off) | Yes |
| Long-history weather where no obs | ERA5 via Open-Meteo → Meteostat → OpenWeather history (1979) | Yes |
| Leakage-free archived forecasts | Open-Meteo Previous Runs (2024+) → Single Runs (IFS 2024+) → own frozen snapshots (Nov 2026+) → betting total as proxy | **No backup before 2024** for free (NOAA model archives on cloud may exist — UNVERIFIED) |
| Per-game retractable roof status | nfldata `roof` (post-game) → ESPN venue `indoor` flag (venue-level, not per game) → unknown | **No real backup**, and nothing pre-game |
| Live lightning near stadium | GOES GLM (open, HDF5) → Xweather / Earth Networks (paid) → NWS severe-thunderstorm alerts (proxy) | Only paid or hard-to-parse |
| Radar overlay | IEM NEXRAD tiles (US) → NCEP opengeo WMS (US) → RainViewer (world, non-commercial) | US yes; world only RainViewer |
| Venue coordinates | Wikidata (CC0) → OSM (ODbL) → Nominatim lookup → manual from official site | Yes |
| Field azimuth | OSM pitch polygon → manual from aerial imagery → TJB WeatherData (reference only, no licence) | Weak (OSM only) |
| Roof type / surface by season | nfldata (per game) → Wikipedia (manual, cited) → official stadium site | Partly; nfldata has errors |
| Elevation | USGS EPQS (US) → Open-Meteo Elevation → Wikidata (empty today) | Yes |
| Time zone | stored IANA zone + Intl → Open-Meteo `timezone=auto` → NWS `/points` timeZone (US) | Yes |
| Travel distance | haversine on stored coordinates (no API) → OurAirports airports | n/a (computed) |
| Maps | Natural Earth (in use) → US Census CB → Protomaps PMTiles extract | Yes |

## R6. Injuries, rosters, depth charts, transactions, contracts

Redundancy table from [tracks/R6-injuries-rosters-transactions.md](tracks/R6-injuries-rosters-transactions.md).

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

#### Player identity across sources

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

## R7. Betting odds, line history, splits, prediction markets

Redundancy table from [tracks/R7-odds-markets.md](tracks/R7-odds-markets.md).

| Data category | PRIMARY → SECONDARY → FALLBACK | Real backup? |
|---|---|---|
| Current game lines (ML/spread/total), multi-book | The Odds API (free key, consensus published) → SportsGameOdds or SharpAPI free key (owner-local only; small quotas) → ESPN scoreboard DraftKings line (one book; owner decision) → nflverse games.csv (daily, one line) | Partial: every free backup is one-to-few books or delayed; a second paid key is the only true backup |
| Consensus / no-vig probability | Computed by us from The Odds API books (median no-vig) → computed from the backup key's books → ESPN single-book no-vig | Yes (derived), quality degrades with fewer books |
| Opening/closing lines, movement | Our own timestamped snapshots of The Odds API → The Odds API historical (paid, 5-min) → ESPN open/current (DraftKings only) → nflverse games.csv (one undocumented line) | Weak: free cadence (≤2 looks/day) cannot catch the close; paid historical is the real backup |
| Player props | The Odds API per-event (credits) → SportsGameOdds/SharpAPI free (tiny) → none | **No real free backup** |
| Futures (Super Bowl, division, playoffs) | The Odds API `americanfootball_nfl_super_bowl_winner` (outrights) → our simulator (model, not market) → link-out to Kalshi/Polymarket | No lawful free market backup for division/playoff futures (prediction markets blocked by terms) |
| Live / in-play odds | The Odds API (credits; 40 s) → ESPN scoreboard (seconds, one book) | Thin |
| Betting splits (bets %/handle %) | None free and lawful → Sportradar or SportsDataIO (contract) | **No real backup; no lawful free source at all** |
| Prediction-market prices | None (Kalshi and Polymarket terms) → Polymarket US (terms unverified) → aggregator rows (The Odds API `us_ex`; rights unverified) | **No lawful source confirmed** |
| Historical lines for backtests | nflverse games.csv (1999+) → Kaggle spreadspoke (1979+, NC-SA, local) → SBR archive (2007–2022, local) → The Odds API historical (2020+, paid) | Yes for research; only nflverse is clean for publication |
| Market size (handle/hold) | Indiana IGC football handle → Nevada GCB football win/win % → NY weekly total handle (no sport split) | Yes (aggregate only; no per-game handle anywhere public) |

## R8. Fantasy football

Redundancy table from [tracks/R8-fantasy.md](tracks/R8-fantasy.md).

- **Actual fantasy points, any scoring system**: nflverse `stats_player` (compute) → SportsDataIO (paid) → none free. FantasyPros `player-points` and Sleeper stats are not licensed for this. Effectively single-sourced but fully computable.
- **Weekly/ROS projections**: FantasyPros API (personal key) → Fantasy Nerds ($499/yr) or SportsDataIO Discovery Lab ($99/mo, personal) → our own usage × efficiency model from nflverse (only after a backtest). **No free second source.**
- **Consensus rankings (ECR) incl. superflex, dynasty, best ball**: FantasyPros → Fantasy Nerds rankings → none. **No free backup.**
- **Redraft ADP**: Fantasy Football Calculator → MFL `adp` → FantasyPros `ADP` ranking type (non-commercial). Three sources, all thin in-season (ADP freezes after drafts).
- **Best-ball ADP**: FantasyPros `BESTADP` → Fantasy Nerds `bestball` (rankings; ADP field UNVERIFIED) → none. Underdog itself is not usable. **No real backup.**
- **Dynasty / trade values**: Dynasty Dealer → Roster Audit → FantasyPros `DYNASTY` ECR (a ranking, not a trade value). KTC and FantasyCalc are not usable. **No backup with a clear commercial licence.**
- **Expected fantasy points / opportunity**: ffopportunity → our own computation from nflverse play-by-play → none.
- **Usage (target share, air-yards share, WOPR, snaps, red-zone touches)**: nflverse (compute) → SportsDataIO (paid) → none. **Route participation: no source at all in season** (nflverse participation has no 2026 file; `route` covers only the targeted receiver).
- **Ownership / trends**: Sleeper trending → Yahoo `percent_owned` (approval-gated) → none.
- **DFS salaries and ownership**: SportsDataIO (paid) → Fantasy Nerds `dfs` (salaries + FN projections; ownership not listed) → none. **No free or legal-to-scrape source.**
- **Pick'em lines**: none permitted. **No source.**
- **Opt-in league connections**: Sleeper → MyFantasyLeague → Fleaflicker (terms unread) → Yahoo (after approval). ESPN is excluded.
- **Player id crosswalk**: nflverse `players.csv` (CC-BY) → FantasyPros `mflid` in projections, FantasyCalc/Dynasty Dealer `sleeper_id` fields → DynastyProcess `db_playerids` (GPL).

## R9. News, press conferences, social, media

Redundancy table from [tracks/R9-news-social-media.md](tracks/R9-news-social-media.md).

| Data category | PRIMARY → SECONDARY → FALLBACK | Real backup? |
|---|---|---|
| National NFL headlines (public page, fetched on GitHub) | Yahoo RSS (in use) → **FOX Sports NFL RSS** (explicit non-commercial grant; GitHub reachability to verify) → curated news (`data/news.json`) and official YouTube titles | Yes once FOX is verified from GitHub; today only Yahoo + curated |
| National NFL headlines (Render / owner's Mac) | ESPN RSS + Yahoo RSS → FOX RSS → curated | Yes |
| Headline discovery / coverage volume | GDELT DOC API (throttled) → GDELT 15-minute raw files (heavy) → our own feed counts | Partial (GDELT is one provider; DOC throttling seen) |
| Breaking insider news | Bluesky curated insiders (Rapoport, PFT, AP; free) → X API pay-per-use (paid, owner key) → official club/league confirmation via YouTube/curated | **No free backup for X-only insiders** (Schefter, Pelissero, Garafolo are effectively X-only today) |
| Official club news | — (club RSS blocked by terms, F14) → club YouTube channels (titles) → links to club home pages | No text source |
| Press conferences | Club YouTube (embed/link, in use) → club website links → none | **No lawful free transcripts** |
| Podcasts | Six official NFL feeds (in use; titles/audio only) → Podcast Index discovery for other shows (key) → iTunes lookup | Yes for listing; **no** for transcripts |
| Player news / injury notes (commercial) | SportsDataIO (Rotoworld + RotoBaller + own) → RotoWire API → nflverse injuries (data, not news) | Yes (paid) |
| Wire text (commercial) | AP Media API → Reuters Connect (+FLM) → Field Level Media direct | Yes (paid) |
| Social display | Official embeds (X, Bluesky) → plain link with handle and time | Yes; on claude.ai only links work |
| Fan sentiment | Bluesky keyword sample (own classifier) → Reddit (after approval) → none | Weak; YouTube comments barred by policy |
| Player photos | Wikimedia Commons (per-file licence) → licensed agency (Imagn/Getty/AP, paid) → none (initials avatar) | Paid only |
| Highlights video | Official YouTube embeds (in use) → NFL licence / WSC (commercial) → links | No free alternative beyond YouTube |

#### Recommended news stacks (answer to the track question)

**Public, non-commercial page, fetched on GitHub Actions (replacing ESPN RSS there, F54):**
1. Yahoo Sports NFL RSS — keep (works from GitHub today; DEC-012 conditions).
2. **FOX Sports NFL RSS** — add as the ESPN replacement: FOX's RSS page grants feeds "for individuals and non-profit organizations for non-commercial use" with attribution. Keep title, link, time, publisher only; drop `description` and `content:encoded` (DEC-008); credit "FOX Sports"; never feed FOX text to an LLM (ToU §4 AI clause). First run a one-off read-only GitHub workflow to confirm FOX's Fastly edge answers Azure runners (as done for ESPN in DEC-024).
3. **Bluesky, curated verified accounts** (start: `rapsheet.bsky.social`, `profootballtalk.bsky.social`, `apnews.com`, plus active beat reporters after a manual check) via `app.bsky.feed.getAuthorFeed` on `public.api.bsky.app`, every 10–15 minutes, no key; show handle, time and link (official embed on Render/local); drop items whose post disappears on the next read (developer guideline 3). Owner decision: whether to show the post text itself (authors' copyright) or only "@handle posted about <team>" with a link.
4. **Official league/club video titles** (already wired) as tier-1 items in the same news panel.
5. **GDELT DOC API** as a discovery/backstop and attention-volume layer (licence allows commercial use and redistribution with a GDELT citation), at most one request every 5 seconds with backoff; show only publishers whose own terms allow headline display, or count without displaying.
6. Curated news (`data/news.json`) — unchanged.
Not included: Google News RSS (personal reader only), The Athletic, Sporting News, NBC/Rotoworld, RotoWire, club feeds (F14).

**Commercial product — license instead:** AP Media API or Reuters Connect (+ Field Level Media) for publishable text and photos; SportsDataIO for player news (Rotoworld exclusive distribution, RotoBaller, own notes) with storage and display rights; X API (commercial designation; pay-per-use up to 3 million post reads a month, Enterprise above) with official embeds; a paid discovery API with a stated commercial grant (Perigon Launch/Growth or NewsAPI.ai; GNews paid) — these still give no rights in publishers' articles, so links only; editorial photos from Imagn/Getty/AP; highlights only through an NFL licence. Ask every vendor explicitly about AI-assistant use, since FOX, Sporting News, RotoWire, NYT, Reddit, X and Spotify all restrict AI training or prompting.

## R10. Historical data, open source, academic, college, draft

Redundancy table from [tracks/R10-historical-opensource-draft.md](tracks/R10-historical-opensource-draft.md).

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
