# NFL Data Source Matrix

Part of the NFL data and API universe research (NU-018, Nov. 25, 2026). Start at [NFL_API_UNIVERSE.md](NFL_API_UNIVERSE.md).

One row per source and product: **334 rows** in ten domains, taken from the research tracks' matrices (each track filled the same fourteen columns). Role counts across all rows: avoid 123, optional 74, primary 54, secondary 44, other 28, reference 5, backup 3, fallback 3. "Primary/Backup" is the role each track recommends for this project (free, non-commercial, public page); the stacks for other budgets are in [NFL_API_RECOMMENDATIONS.md](NFL_API_RECOMMENDATIONS.md), and the chosen primary, secondary and fallback per data category are in [NFL_DATA_BACKUP_STRATEGY.md](NFL_DATA_BACKUP_STRATEGY.md).

How to read the columns:
- **Live**: whether the source serves data during games, and how fast. **Historical**: how far back it goes.
- **Free / Paid / Cost**: as published on the provider's own pages on Nov. 25, 2026, or "quote" when only sales can say. Free tiers often forbid public or commercial display: check **License** and **Commercial** before treating "free" as usable.
- **Quality** and **Score**: the track's judgment (overall score is the mean of twelve 1–10 criteria; see [NFL_API_CATALOG.md](NFL_API_CATALOG.md#how-to-read-a-record)). Scores compare sources within one domain; do not compare a weather API's score with an odds API's.
- Where the verified corrections in the catalog disagree with a row here, the corrections win.

## R1. Official NFL sources and league structure

Rows: 23. Full records: [NFL_API_CATALOG.md](NFL_API_CATALOG.md); evidence: [tracks/R1-official-nfl.md](tracks/R1-official-nfl.md).

| Category | Provider | Data | Live | Historical | Free | Paid | Cost | License | Quality | Latency | Commercial | Primary/Backup | Score |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| League structure | nflverse `nfldata` | schedule, weekday/time, neutral, venue, roof/surface, coaches per game, referee, standings, officials | no | 1999– (standings 2002–) | yes | – | $0 | none stated (facts, credit) | high; officials lag | daily; officials weeks | unclear, ask | PRIMARY | 7.9 |
| Official data (live) | Genius Sports | official PBP, NGS, betting feed, live video (intl books) | yes | since 2021 deal | no | contract | contact sales | contract | official | real-time | yes (contract) | Future commercial only | 7.3 |
| Commercial data | Sportradar NFL v7 | schedule, PBP, rosters, injuries, depth | yes | multi-season | trial (UNVERIFIED) | yes | see commercial track | contract | high, non-official | seconds–minutes | yes | Alternative | 7.2 |
| Identity / staff | Wikidata | team QIDs, HC/GM/owner (stale), venues | no | deep but patchy | yes | – | $0 | CC0 | low currency (HC 18/32) | volunteer lag | yes | Ids only | 7.1 |
| Rules | NFL.com tie-break page; operations.nfl.com; rulebook PDF | tie-break order, flex windows, schedule formula, intl slate | no | current year | yes | – | $0 | NFL copyright; facts encodable | authoritative | yearly | facts only | PRIMARY (manual config) | 6.3 |
| Reference | NFL Record & Fact Book 2026 | history, records, directories (UNVERIFIED) | no | decades | yes | – | $0 | NFL copyright | authoritative | annual | facts only | SECONDARY (manual) | 6.1 |
| Official pages | NFL.com | schedule, standings + clinch codes, injury report, transactions | site only | some | view | – | $0 | ToS §1.3 no systematic retrieval; §8 home-page links | authoritative | minutes–daily | no | Manual check only | 5.8 |
| Unofficial client | sportsdataverse-js `nfl_api` | api.nfl.com via minted tokens | yes | – | – | – | $0 | code MIT; data unlicensed | unknown | – | no | AVOID | 5.7 |
| Game records | NFL Game Books (PDF) | officials, weather, attendance, inactives, PBP, snap counts | no | UNVERIFIED depth | view | – | $0 | media-coverage use only | official | next morning | no | Manual reference | 5.6 |
| Tracking samples | Big Data Bowl (Kaggle) | sample NGS tracking | no | per competition | yes | – | $0 | UNVERIFIED | official | – | UNVERIFIED | Research only | 5.4 |
| Tracking stats | NGS site | leaderboards, charts | site only | NGS era | view | – | $0 | NFL ToS; JSON 401 | official | weekly/live on site | no | Link only | 5.3 |
| League releases | media.nfl.com (NFL Communications) | playoff scenarios, milestones, capsules, awards; gated wire | no | 2024– filters | public part | – | $0 | NFL ToS; gated = media only | official | weekly | no | SECONDARY (manual) | 5.2 |
| Official stats system | GSIS | official stats | yes | – | no | not offered | – | closed | official | real-time | no | Not available | 5.2 |
| Private API | NFL Shield API / developer.nfl.com | app data | yes | – | no | not offered | – | closed | – | – | no | AVOID | 5.2 |
| Hall of Fame | PFHOF | enshrinees, finalists | no | 1963– | view | – | $0 | ToS bars scraping/commercial | official | annual | no | Link only | 5.2 |
| Colours | teamcolorcodes.com | club colour codes | no | – | view | – | $0 | UNVERIFIED | unverified | – | UNVERIFIED | Cross-check | 5.2 |
| Club sites | 32 clubs | staff, guides, game notes, schedules | no | some | view | – | $0 | club terms (restrictive) | authoritative per club | same day | no | Manual evidence | 5.0 |
| Officials | Football Zebras | crews, weekly assignments | no | 2025– | view | – | $0 | UNVERIFIED | reported | weekly | UNVERIFIED | Link only | 5.0 |
| Brand | NFL Design Playbook | league palette only | no | – | view | – | $0 | trademark | official | – | no | AVOID for clubs | 5.0 |
| Subscriptions | NFL Pro / NFL+ Premium | All-22, NGS analytics | yes | some | no | $14.99/mo (UNVERIFIED) | $15/mo | personal only; no scraping | high | – | no | AVOID as data | 4.7 |
| Calendars | Stanza / ECAL widgets | personal schedule sync | – | – | yes | – | $0 | personal | good | – | no | AVOID (make own .ics) | 4.7 |
| Union | NFLPA | cap report (JS) | no | – | view | – | $0 | ToS personal use | official | – | no | Link only | 4.3 |
| Legacy feed | NFL GameCenter JSON / score strip | – | – | – | – | – | – | – | dead (301) | – | – | AVOID | 1.8 |

## R2. Commercial and freemium multi-domain providers

Rows: 20. Full records: [NFL_API_CATALOG.md](NFL_API_CATALOG.md); evidence: [tracks/R2-commercial-providers.md](tracks/R2-commercial-providers.md).

| Category | Provider | Data | Live | Historical | Free | Paid | Cost | License | Quality | Latency | Commercial | Primary/Backup | Score |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Multi-domain live | Sportradar NFL v7 | Scores, PBP, box, stats, rosters, injuries, depth, transactions, draft, push | Yes (REST + push) | REG/PST 2000→, PRE 2015→ | 30-day trial, no display | Quote only | UNVERIFIED (high) | Contract; "powered by Sportradar" logo; destroy data after termination | High | TTL 3 s in progress; push ahead of TV | Yes (paid) | Primary candidate (funded phase) | 7.3 |
| Multi-domain live | SportsDataIO Leagues API | Scores, PBP, stats, injuries, depth, news, odds, projections, DFS | Yes (commercial) | "Decades"; Vault 10+ yrs | Scrambled trial; last season free | Discovery Lab $99–149/mo (next-day, personal); commercial quote | Quote | Commercial licence; attribution per contract; display OK in licensed product | High | 20–30 s behind cable/OTA; sync 3–5 s | Yes (paid) | Primary candidate (funded phase) | 7.3 |
| Official distributor | Genius Sports | Official PBP, NGS, betting feed | Yes | UNVERIFIED | No | Contact sales | UNVERIFIED | Contract | Official | UNVERIFIED | B2B only | Avoid (inaccessible) | 6.2 |
| Multi-domain live | BALLDONTLIE NFL | Games, stats, PBP, injuries, odds, props, DFS | Yes (GOAT) | 2002→ | 5 req/min, teams/players/games | $9.99 / $39.99 / $299.99 per mo | $39.99 | Very permissive, no attribution; upstream undisclosed (PBP looks ESPN-derived) | UNVERIFIED | "Real-time" (no figure) | On paper yes | Optional (provenance risk) | 6.8 |
| Live scores only | The Odds API scores | Score + status | Yes | 3 days | 500 credits/mo | $30 (20K credits) → $249 | ~$30 | Show/store in app; no re-serving | Good | ~30 s | Yes | Secondary (licensed live scores) | 6.8 |
| Multi-domain | MySportsFeeds | Scores, box, PBP, lineups, DFS, odds, projections | Optional | 2 seasons + paid back-seasons | Personal trial on request | C$39/mo commercial non-live; C$5 personal; live UNVERIFIED | UNVERIFIED for live | Site terms only; API licence UNVERIFIED | Crowd + staff | UNVERIFIED | Yes (paid) | Optional | 6.3 |
| Multi-domain live | Rolling Insights DataFeeds | Schedules, stats, depth, injuries, box, PBP | Yes (Live) | 2018→ on request | 30-day trial | $99 / $349 / $599 per mo | $599 | Commercial use of outputs; display clause ambiguous | UNVERIFIED | "Within minutes" post-game | Yes | Optional | 6.3 |
| Scores/highlights | Highlightly | Matches, box, lineups, standings, odds, highlights | Yes | UNVERIFIED | 100/day | $7.99–44.99/mo | $7.99–18.99 | Display OK; no re-serving; no attribution | UNVERIFIED | "Near real time" | Yes | Avoid (provenance) | 6.1 |
| Multi-domain | API-Sports American Football | Games, stats, injuries, odds | Claimed | UNVERIFIED | 100/day (snippet) | 15–35 (snippet) | UNVERIFIED | UNVERIFIED (site blocked) | UNVERIFIED | UNVERIFIED | UNVERIFIED | Avoid until verified | 5.9 |
| Metadata | TheSportsDB | Teams, events, results, artwork | Paid only (2 min) | Varies | 30 req/min | $9 / $20 per mo | $9 | Free: no app-store publishing; paid: credit as source; artwork rights vary | Medium | 2 min livescore | Paid | Avoid for stats | 5.8 |
| Fantasy-oriented reseller | Tank01 (RapidAPI) | Box, PBP, rosters, injuries, odds, news, projections | Yes | Current season | 1,000/month | $10 / $25 / $100 per mo | $10–25 | None found; ESPN ids and ESPN-hosted images | UNVERIFIED | No figure | No (risk) | Avoid | 5.4 |
| Multi-domain | Goalserve | Scores, box, stats, rosters, injuries, odds | Yes | UNVERIFIED | Trial on request | $300/mo (third-party) | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | Yes | Avoid until verified | 5.1 |
| Multi-domain B2B | Data Sports Group | Scores, PBP, box, depth, odds | Yes | UNVERIFIED | Trial via sales | Quote | UNVERIFIED | Not public | UNVERIFIED | No figure | Yes | Avoid (B2B) | 5.1 |
| Models | Stats Perform (Opta) | Win prob, 4th down, sims | Yes | UNVERIFIED | No | Quote | UNVERIFIED | Contract | High (brand) | UNVERIFIED | Yes | Avoid / later benchmark | 5.1 |
| Odds + scores (books) | LSports | Odds, props, scores, incidents | Yes | UNVERIFIED | Trial via sales | Quote | UNVERIFIED | Operator contract | UNVERIFIED | "~0" (marketing) | Yes | Avoid | 4.6 |
| Unofficial | ESPN hidden JSON | Everything | Yes | Limited | Free | n/a | 0 | Disney ToU bars automated access | High | Seconds | No | Local only (DEC-006) | 6.3 |
| Unofficial | Yahoo editorial API | Scoreboard | Was | n/a | Free | n/a | 0 | ToS bars commercial reuse | n/a | n/a | No | Avoid (EOL scream test) | – |
| Unofficial | FOX bifrost | Scores, stats | Yes | n/a | n/a | n/a | 0 | ToU bars scraping; robots Disallow: / | n/a | n/a | No | Avoid | – |
| Scraping | Creativesdev "NFL API Data" | Scores, PBP, injuries, images | Claimed | n/a | UNVERIFIED | UNVERIFIED | n/a | Resells ESPN-type data | Low | n/a | No | Avoid | 4.2 |
| Experimental | SportsBlaze | Box scores, schedule | Claimed | n/a | n/a | n/a | n/a | No terms found | Stale cache seen | n/a | No | Avoid | 3.7 |

## R3. Play-by-play, advanced analytics, coaching, officiating, special teams

Rows: 29. Full records: [NFL_API_CATALOG.md](NFL_API_CATALOG.md); evidence: [tracks/R3-pbp-analytics.md](tracks/R3-pbp-analytics.md).

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

## R4. Player tracking, Next Gen Stats and computer vision

Rows: 26. Full records: [NFL_API_CATALOG.md](NFL_API_CATALOG.md); evidence: [tracks/R4-tracking-cv.md](tracks/R4-tracking-cv.md).

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

## R5. Weather, stadiums, geospatial and travel

Rows: 68. Full records: [NFL_API_CATALOG.md](NFL_API_CATALOG.md); evidence: [tracks/R5-weather-stadium-geo.md](tracks/R5-weather-stadium-geo.md).

| Category | Provider | Data | Live | Historical | Free | Paid | Cost | License | Quality | Latency | Commercial | Primary/Backup | Score |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Weather forecast | Open-Meteo Forecast | hourly T, wind, gust, precip, snow | yes | 92 d past | yes (non-comm.) | Std ~$29/mo (2023 post) | low | CC BY 4.0 | good | hourly | paid plan | PRIMARY | 8.0 |
| Weather archive (stitched) | Open-Meteo Historical Forecast | 0–6 h model output | no | 2017 IFS/2018 HRRR/2021 GFS | yes (non-comm.) | Pro ~$99/mo | low | CC BY 4.0 | good | daily | paid plan | SECONDARY | 7.6 |
| Archived forecasts | Open-Meteo Previous Runs | day1–7 lead forecasts | yes | 2024 (GFS T 2021) | yes (non-comm.) | Pro ~$99/mo | low | CC BY 4.0 | good | per run | paid plan | PRIMARY (backtests) | 7.4 |
| Archived forecasts | Open-Meteo Single Runs | full runs | no | 2024-03 IFS / 2026-04 others | yes (non-comm.) | not listed | low | CC BY 4.0 | good | 4–6 h | paid plan | OPTIONAL | 6.8 |
| Reanalysis | Open-Meteo Historical Weather | ERA5/ERA5-Land/IFS | no | 1940 | yes (non-comm.) | Pro ~$99/mo | low | CC BY 4.0 + Copernicus | consistent, coarse | 5 d delay | paid plan | SECONDARY | 7.8 |
| Elevation | Open-Meteo Elevation | DEM 90 m | – | – | yes | Std | low | CC BY 4.0 | approx. | – | paid plan | SECONDARY | 7.7 |
| Weather forecast (US) | NWS api.weather.gov | hourly forecast | yes | none | yes | – | free | public | good | hourly | yes | SECONDARY | 7.2 |
| Observations (US) | NWS api.weather.gov | station obs | yes | 7 days | yes | – | free | public | good | ≤20 min | yes | SECONDARY | 7.2 |
| Alerts (US) | NWS api.weather.gov | CAP alerts | yes | 7 days | yes | – | free | public | authoritative | minutes | yes | PRIMARY | 7.4 |
| Observations | NCEI ADS global-hourly | ISD hourly | no | 1901 | yes | – | free | US gov | good, coded | daily | yes | SECONDARY | 7.6 |
| Observations | NCEI GHCNh | hourly + QC | no | per station | yes | – | free | US gov | good | n/s | yes | OPTIONAL | 7.8 |
| Climate | NCEI CDO v2 | daily/monthly | no | long | yes (token) | – | free | US gov | good | – | yes | AVOID | 6.9 |
| Observations | IEM ASOS archive | METAR hourly | near-live | decades | yes | – | free | public domain | good | minutes | yes | PRIMARY | 8.5 |
| Observations | Meteostat | hourly stations | no | decades | yes (bulk) | $9.99–99.99 API | low | CC BY 4.0 | model-filled gaps | daily | yes | SECONDARY | 7.7 |
| Weather API | Visual Crossing | forecast + 50 y history | yes | 50+ y | 1,000 rec/day | $35/$150 | low | proprietary, storage OK | good | – | yes | SECONDARY (commercial) | 7.7 |
| Weather API | Tomorrow.io | forecast | yes | 24 h (free) | yes | contact | high | no storage | good | – | enterprise only | AVOID | 5.9 |
| Weather API | OpenWeather | One Call 3.0, history | yes | 1979 | 1,000 calls/day | $0.0015/call; $40+ | low | CC BY-SA / ODbL | fair | – | yes | OPTIONAL | 7.4 |
| Weather API | Weatherbit | forecast/history | yes | 5–30 y paid | 50/day | $49–995 | high | NC free; paid storage | fair | – | paid | AVOID | 6.1 |
| Weather API | WeatherAPI.com | forecast/history | yes | 2010 (Business) | 100k/mo | $7–65 | low | proprietary | fair | – | yes | OPTIONAL | 7.1 |
| Weather API | Pirate Weather | forecast, ERA5 | yes | 1940 | 10k/mo | donation | low | UNVERIFIED | fair | – | UNVERIFIED | AVOID | 6.3 |
| Weather API | Apple WeatherKit | forecast | yes | 2021 | 500k/mo w/ $99/yr | $49.99+ | medium | no storage | good | – | yes (no archive) | AVOID | 6.7 |
| Weather API | Google Weather | forecast | yes | 24 h | 10k/mo | $0.15/1k | low | delete after 1–240 h | good | – | yes (no archive) | AVOID | 6.4 |
| Weather API | AccuWeather | forecast | yes | 24 h | trial | $2+ | medium | no archive/commingling | good | – | restricted | AVOID | 5.4 |
| Weather API | Meteomatics | forecast/history | yes | 1940 | UNVERIFIED | contact | high | UNVERIFIED | very good | – | yes | OPTIONAL | 6.8 |
| Weather + lightning | Vaisala Xweather | conditions, lightning | yes | 2004 | 15k accesses/mo | $0.0006/access | low | UNVERIFIED storage | good | – | yes | OPTIONAL | 7.1 |
| Weather (UK) | Met Office DataHub | spot forecasts | yes | 48 h obs | 360/day | £9–437 | low | commercial yes | good | – | yes | OPTIONAL | 6.7 |
| Weather (DE) | Bright Sky / DWD | obs + MOSMIX | yes | 2010 | yes | – | free | CC BY 4.0 | good (DE) | – | yes | OPTIONAL | 7.2 |
| Lightning | NOAA GOES GLM | flashes | yes | archive | yes | – | free | NODD open | fair (8 km) | ~20 s files | yes | OPTIONAL | 7.4 |
| Lightning | Blitzortung | strikes | yes | – | participants | – | – | NC, participants | fair | seconds | no | AVOID | 4.3 |
| Lightning | Earth Networks | strikes | yes | UNVERIFIED | no | contact | high | UNVERIFIED | good | seconds | yes | OPTIONAL | 5.3 |
| Radar | RainViewer | radar tiles | yes | 2 h | yes | none | free | personal/educational | fair | 5 min | case by case | OPTIONAL | 5.8 |
| Radar (US) | IEM NEXRAD tiles | composite | yes | archive | yes | – | free | public domain | good | ~5 min | yes | PRIMARY | 7.3 |
| Radar (US) | NCEP opengeo WMS | MRMS reflectivity | yes | none | yes | – | free | none (US gov) | good | minutes | yes | SECONDARY | 6.8 |
| Game weather | nfldata games.csv | roof, surface, temp, wind | daily | 1999 | yes | – | free | no licence (credit) | gaps/errors | daily | likely (facts) | PRIMARY | 7.9 |
| Travel | nfldata airports.csv | team airport, ET offset | – | – | yes | – | free | no licence | DST error | – | likely | SECONDARY | 6.5 |
| Game weather | TJB WeatherData | game weather 2000–20, azimuth | no | 2000–2020 | yes | – | free | none (WU data) | mixed | frozen | no | AVOID | 5.4 |
| Game weather | NFLWeather.com | forecasts | yes | 2009 | site only | – | – | no derivatives | fair | – | no | AVOID | 5.3 |
| Stadiums | Wikidata | coords, capacity | – | – | yes | – | free | CC0 | coords ok, surface poor | edits | yes | SECONDARY | 7.5 |
| Stadiums | OSM Overpass | pitch polygons → azimuth | – | – | yes | – | free | ODbL | good | minutes | yes (share-alike) | PRIMARY (azimuth) | 6.8 |
| Geocoding | Nominatim | geocode | – | – | 1 req/s | – | free | ODbL | good | – | limited | SECONDARY | 6.2 |
| Stadiums | Wikipedia | facts, history | – | – | yes | – | free | CC BY-SA 4.0 | fair | – | yes (SA) | SECONDARY | 6.4 |
| Stadiums | Pro-Football-Reference | venue/game facts | – | 1920 | site only | $5k custom | – | no bots, no AI | very good | – | no | AVOID | 6.1 |
| Geocoding | Photon | geocode | – | – | throttled | – | free | OSM | fair | – | no | OPTIONAL | 5.8 |
| Geo APIs | Google Maps Platform | geocode, routes, TZ, tiles | – | – | 10k/SKU/mo | $5/1k | medium | 30-day cache | very good | – | yes | AVOID | 6.8 |
| Geo APIs | Mapbox | geocode, GL JS | – | – | 100k temp | $0.75–5/1k | medium | no caching (temp) | very good | – | yes | AVOID | 6.9 |
| Geocoding | HERE | geocode | – | – | 30k/mo | $0.88/1k | low | permanent excluded | good | – | yes | OPTIONAL | 6.6 |
| Geo APIs | TomTom | geocode, routing | – | – | 20k/mo | UNVERIFIED | low | UNVERIFIED | good | – | UNVERIFIED | OPTIONAL | 6.7 |
| Geocoding | Geoapify | geocode, routing | – | – | 3k credits/day | $59–609 | low | OSM + attribution | good | – | yes | OPTIONAL | 6.8 |
| Geocoding | LocationIQ | geocode | – | – | 5k/day | $45–950 | low | 48 h cache | good | – | limited | AVOID | 6.5 |
| Routing | OSRM demo | car routes | – | – | 1 req/s | – | free | non-comm. | good | – | no | AVOID | 5.7 |
| Routing | FOSSGIS/Valhalla | routes | – | – | 1 req/s | – | free | ODbL data | good | – | no | AVOID | 5.7 |
| Routing | openrouteservice | routes, matrix | – | – | 2,000/day | – | free | CC BY-SA 4.0 | good | – | yes | OPTIONAL | 6.7 |
| Elevation (US) | USGS EPQS | point elevation | – | – | yes | – | free | public domain | very good | – | yes | PRIMARY | 7.5 |
| Elevation | Open-Elevation | SRTM | – | – | 500 pts/mo | €5.99+ | low | GPL code | fair | – | yes | AVOID | 5.7 |
| Time zones | timezone-boundary-builder | zone polygons | – | releases | yes | – | free | ODbL | very good | monthly | yes (SA) | OPTIONAL | 7.8 |
| Time zones | TimeZoneDB | zone lookup | – | – | 1 req/s | $5/mo | low | NC free | good | – | paid | AVOID | 6.2 |
| Time zones | IANA tz + Intl | DST rules | – | 1970+ | yes | – | free | public domain | authoritative | – | yes | PRIMARY | 9.7 |
| Airports | OurAirports | airports, ICAO | – | – | yes | – | free | public domain | good | daily | yes | PRIMARY | 8.2 |
| Map tiles | OSM tile server | raster tiles | – | – | yes | – | free | ODbL, no heavy use | good | – | no | AVOID | 6.5 |
| Map tiles | Protomaps PMTiles | vector basemap | – | – | self-host | – | free | ODbL produced work | good | – | yes | SECONDARY | 7.8 |
| Map SDK | MapLibre GL JS | renderer | – | – | yes | – | free | BSD-3 | very good | – | yes | OPTIONAL | 8.5 |
| Map tiles | Stadia Maps | tiles | – | – | 200k credits NC | $20–250 | low | NC free | good | – | paid | OPTIONAL | 6.8 |
| Map tiles | MapTiler | tiles | – | – | 100k req NC | $30+ | low | NC free | good | – | paid | OPTIONAL | 6.7 |
| Boundaries | Natural Earth | vectors | – | – | yes | – | free | public domain | good | – | yes | PRIMARY | 8.2 |
| Boundaries | US Census CB | US boundaries | – | vintages | yes | – | free | US gov | very good | yearly | yes | SECONDARY | 7.8 |
| Flights | OpenSky | ADS-B | yes | yes | 400–4,000 credits/day | contact | – | research, NC | good | seconds | no | AVOID | 5.2 |
| Flights | ADS-B Exchange | ADS-B | yes | yes | – | $10/mo NC; enterprise | medium | NC | good | seconds | enterprise | AVOID | 5.2 |
| Algorithm | NOAA solar (Meeus) | sun position | – | 1901–2099 | yes | – | free | US gov | ±1 min | – | yes | PRIMARY | 8.9 |

## R6. Injuries, rosters, depth charts, transactions, contracts

Rows: 26. Full records: [NFL_API_CATALOG.md](NFL_API_CATALOG.md); evidence: [tracks/R6-injuries-rosters-transactions.md](tracks/R6-injuries-rosters-transactions.md).

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

## R7. Betting odds, line history, splits, prediction markets

Rows: 31. Full records: [NFL_API_CATALOG.md](NFL_API_CATALOG.md); evidence: [tracks/R7-odds-markets.md](tracks/R7-odds-markets.md).

| Category | Provider | Data | Live | Historical | Free | Paid | Cost | License | Quality | Latency | Commercial | Primary/Backup | Score |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Odds (multi-book) | The Odds API | ML/spread/total, periods, alt lines, NFL props, futures, exchanges incl. Kalshi/Polymarket | Yes | 2020-06-06+ (props 2023-05-03+), paid | 500 credits/mo | $30–$249/mo listed | Low | Display + store OK; no standalone redistribution | High | 60 s pre / 40 s live (polling) | Yes, if odds not the product | PRIMARY | 7.8 |
| Odds (multi-book) | TheRundown | Lines, props, open/close (Pro+) | Yes | 7 d–unlimited by tier | 20K pts/day, 3 books, 5-min delay, personal only | $69–$3,499/mo | Mid–high | Public display from Pro ($249); delete on cancel | Good (untested) | 5 min free → real-time | Yes (Pro+, attribution) | SECONDARY (commercial) | 6.8 |
| Odds (multi-book) | SportsGameOdds | Lines, props, alts, consensus | Yes | Pro+ | 2,500 objects/mo | $99 / $299 / custom | Mid | No redistribution; delete within 30 d of termination | Untested | 10 min free | Unclear | OPTIONAL backup | 6.3 |
| Odds (multi-book) | SharpAPI | Lines, props, +EV, splits (unsourced) | Yes | Enterprise | 2 books, 60 s delay | $79–$399 + add-ons | Mid | Display OK; credit "Data provided by SharpAPI" from 2026-12-01 | Untested | 60 s free | Yes | OPTIONAL | 6.1 |
| Odds (multi-book) | OddsPapi | Global books; props/live paid | Paid | "Historical data" (depth ?) | 250 req/mo | Custom / B2B | ? | Terms unread | ? | ? | ? | OPTIONAL | 5.3 |
| Odds (multi-book) | Odds-API.io | Global books, WS | Yes | Some | New free keys paused | £49–£229/mo | Mid | Terms unread | ? | WS push | ? | AVOID | 5.6 |
| Odds (multi-book) | OddsBlaze | US books, SGP | ? | ? | ? | UNVERIFIED | ? | ? | ? | ? | ? | AVOID | 4.8 |
| Odds (enterprise) | OpticOdds | 200+ books, props, history | Yes (SSE, RabbitMQ) | Yes (depth ?) | Trial (unspecified) | Contact sales | High | Unpublished | Very high | Sub-second (claim) | Yes (contract) | SECONDARY (commercial) | 7.0 |
| Odds + sharp consensus | Unabated | Books, PMs, Unabated Line | Yes (SSE) | ? | Free only with deeplink traffic | $799 / $2,999 / enterprise | High | Free tier = affiliate-style | Very high | 15 s free | Enterprise only | AVOID | 6.1 |
| Odds + splits | SportsDataIO | Lines, props, futures, movement, splits | Yes | Vault | Trial = UCL scrambled; Discovery Lab next-day personal | Contact sales | High | Commercial licence; no redistribution | High | 5 s live; 15 min movement/splits | Yes (contract) | SECONDARY (commercial) | 7.1 |
| Odds + splits | Sportradar OC + Betting Splits | Prematch/live/props; ticket % & stake % | Yes | Splits 200 days | Trial (eval only) | Contact sales | Very high | Contract; raw counts not shown | Very high | Splits hourly → per minute | Yes (contract) | SECONDARY (commercial) | 6.8 |
| Official betting data | Genius Sports | Official NFL data/odds for operators | Yes | ? | No | Contract | Very high | Operators only | Official | Lowest | Operators | AVOID | 6.3 |
| Odds (operator feeds) | LSports / Goalserve / BetsAPI / Don Best | Operator or scraped feeds | Yes | Varies | Trials | Sales / $10–$800 | Mid–high | Unclear or scraped | Varies | Varies | Varies | AVOID | 4.3–5.7 |
| Single-book line | ESPN scoreboard (in use) | DraftKings open/current | Yes | No | Yes | — | Free | Disney ToU bars automation | Good | Seconds | No | FALLBACK | 5.6 |
| Betting splits | Action Network | Bets %/money % | Yes | Since 2017 (community claim) | Web only | PRO | — | Terms bar scraping and reuse | Opaque | ? | No | AVOID | 4.3 |
| Betting splits | VSiN (DK + Circa) | Handle %/bets % | 5 min | No | No (Pro) | Subscription | — | Terms not found; page bot-blocked | Two named books | 5 min | No | AVOID | 3.8 |
| "Consensus" | Covers | Contest picks, virtual money | Yes | Some | Web only | — | — | Terms bar reproduction | Not betting data | — | No | AVOID | 3.9 |
| Book endpoints | DraftKings, FanDuel, BetMGM, Caesars, Circa | Full markets | Yes | No | Unofficial | — | — | Terms bar automation; geo/bot-blocked | High | Seconds | No | AVOID | 4.3 |
| Sharp book | Pinnacle | Sharp lines | Yes | ? | Closed 2025-07-23; academic/pregame by application | Bespoke | ? | By agreement | Highest | Seconds | By agreement | OPTIONAL | 6.1 |
| Prediction market | Kalshi | Game, spread, total, 1H, props, futures (406 NFL series) | Yes (WS) | Candlesticks, trades | API free | — | Free | Own-trading only; no storing/sharing | High | Real time | No | AVOID (link out) | 7.0 |
| Prediction market | Polymarket (intl) | Futures, divisions, playoffs, awards | Yes (WS) | prices-history | Public reads | — | Free | No redistribution; no US trading | Good | Real time | No | AVOID (link out) | 6.8 |
| Prediction market | Polymarket US (QCX, CFTC DCM) | NFL games, public data API | Yes (WS) | Price history | Public reads | — | Free | Terms UNVERIFIED | Good | Real time | ? | OPTIONAL (after terms) | 6.5 |
| Exchanges | Novig / ProphetX / Sporttrade / Robinhood / Crypto.com | Exchange prices | Yes | ? | No public API | — | — | No data API | ? | — | No | AVOID (via aggregator only) | 3.8 |
| Exchanges (non-US) | Betfair / Smarkets | Exchange prices | Yes | ? | Betfair delayed key; Smarkets public events | Betfair £499 live key | — | Unread | High (thin NFL) | Real time | ? | AVOID | 5.2–5.9 |
| Historical lines | nflverse nfldata games.csv | One spread/total per game 1999+; ML 2006+ | Current week only | 1999+ | Yes | — | Free | No licence file; facts with credit | Good, timing undocumented | Daily | Yes with credit (facts) | PRIMARY (history) | 7.4 |
| Historical lines | SBR archive | Open/close spreads, totals, ML 2007–2022 | No | 2007–2022 (frozen) | Yes | — | Free | No reuse without consent | Fair | — | No | OPTIONAL (local) | 4.8 |
| Historical lines | Kaggle spreadspoke | Spread/total 1979+ | No | 1966/1979+ | Yes | — | Free | CC BY-NC-SA 4.0 (chain unclear) | Fair | — | No (NC) | OPTIONAL (local) | 6.3 |
| Historical lines | AusSportsBetting / PFR / Killersports | Lines | No | Long | Web | — | — | Unread / restrictive | Fair | — | No | AVOID/OPTIONAL | 4.6 |
| Market size | NV GCB | Football win and win % monthly | No | 2004+ | Yes | — | Free | Public record | High | Monthly | Yes | OPTIONAL | 6.9 |
| Market size | Indiana IGC | Football handle monthly (unaudited) | No | Years | Yes | — | Free | Public record | High | Monthly | Yes | OPTIONAL | 7.1 |
| Market size | PA PGCB / NY NYSGC / IL IGB / NJ DGE | Total handle/GGR (no sport split in PA/NY; IL/NJ unverified) | No | Years | Yes | — | Free | Public record | High | Weekly/monthly | Yes | OPTIONAL | — |

## R8. Fantasy football

Rows: 33. Full records: [NFL_API_CATALOG.md](NFL_API_CATALOG.md); evidence: [tracks/R8-fantasy.md](tracks/R8-fantasy.md).

| Category | Provider | Data | Live | Historical | Free | Paid | Cost | License | Quality | Latency | Commercial | Primary/Backup | Score |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Rankings/projections/ADP | FantasyPros API v2 | ECR (redraft, weekly, ROS, dynasty, rookie, best ball, superflex via OP), projections (weekly/ROS/R2P), ADP types, news, injuries | No | Current season (more on Commercial) | Free key = non-production, sample data | Premium $8.99/mo (HOF); Commercial: sales | $8.99/mo | Personal non-commercial; attribution; non-compete | High | Daily/expert-timestamped | Sales contract | PRIMARY (non-commercial) | 6.6 |
| AI tool | FantasyPros MCP | Rankings, ADP, projections, league tools | No | n/a | Free account (some tools) | Premium for advice tools | n/a | Not stated | High | n/a | No | AVOID (pipeline) | 5.4 |
| League platform/trends | Sleeper API v1 | Leagues, drafts, players, trending | Near-live | League seasons | Yes | Commercial licence (contact) | $0 | Non-commercial; credit trending | High | Real time | Contact Sleeper | PRIMARY (trending, opt-in leagues) | 7.3 |
| Projections/stats | Sleeper undocumented | RotoWire projections, Sportradar stats, ADP field | Yes | Current season | Callable | — | $0 | None (third-party licensed) | High | Same day | No | AVOID | 5.6 |
| League platform | Yahoo Fantasy API | Leagues, % owned, draft analysis | Near-live | Many seasons | Approval required | — | $0 | Signed agreement; attribution + logo | High | Minutes | Per agreement (UNVERIFIED) | OPTIONAL (opt-in, after approval) | 5.8 |
| League platform | ESPN lm-api | Leagues, projections, ownership | Yes | Several seasons | Callable | — | $0 | Disney ToU bars automation | High | Seconds | No | AVOID | 5.6 |
| League platform | NFL Fantasy | — (discontinued 2026) | — | — | — | — | — | — | — | — | — | AVOID | 1.8 |
| League platform | CBS Fantasy API v3 | Player list, league data (token) | ? | ? | Callable | — | $0 | No developer terms | Unknown | ? | No | AVOID | 4.2 |
| ADP/AAV/league | MyFantasyLeague API | ADP, AAV, players, leagues; FantasySharks ranks/projections | Near-live | Per-year paths | Yes | — | $0 | "Almost any way" minus forbidden uses | Medium (small samples) | Daily | Not barred | SECONDARY (ADP/AAV) | 6.6 |
| League platform | Fleaflicker API | Leagues, rosters, transactions | Yes | ? | Yes | — | $0 | Terms not found | Medium | ? | ? | OPTIONAL | 5.5 |
| League platform | Fantrax | — (no public API) | — | — | — | — | — | — | — | — | No | AVOID | 3.8 |
| Best-ball ADP/pick'em | Underdog | ADP (in app), lines (internal API) | Yes | No | In app only | — | — | ToS bar scraping | High | Live | No | AVOID | 3.9 |
| Pick'em | PrizePicks | Lines | Yes | No | Bot-protected | — | — | ToS bar robots | High | Live | No | AVOID | 3.5 |
| DFS salaries | DraftKings | Lobby, draftables, salary CSV | Yes | No | Lobby callable | — | — | ToS bar automated means | High | Live | No | AVOID | 4.1 |
| DFS salaries | FanDuel | Salaries | Yes | No | — | — | — | Written permission required | High | Live | No | AVOID | 4.1 |
| DFS | Yahoo DFS | — | — | — | — | — | — | — | — | — | No | AVOID | 2.8 |
| ADP | Fantasy Football Calculator | Mock-draft ADP with stdev, sample size | No | `year` param | Yes | — | $0 | Free personal + commercial; link requested | Medium | Daily (frozen after draft season) | Yes | PRIMARY (ADP) | 7.0 |
| Trade values | FantasyCalc | Redraft/dynasty values from trades | No | No | Callable | — | $0 | No terms found | Medium-high | Daily? | No | AVOID (until permission) | 5.0 |
| Trade values | Dynasty Dealer | Dynasty/redraft values (Sleeper trades) | No | No | Yes | — | $0 | "Free for any use" + visible link | Medium | Daily | Claimed yes (upstream caveat) | OPTIONAL | 5.8 |
| Trade values | Roster Audit | Dynasty values, picks, trade calc | No | No | Yes (+ free key) | — | $0 | Attribution link; commercial silent | Medium | Daily? | Unclear | OPTIONAL | 5.8 |
| Trade values | KeepTradeCut | Dynasty values | No | — | — | — | — | T&C bar scraping and reuse | High | Daily | No | AVOID | 4.0 |
| Ids/ECR archive | DynastyProcess data | Ids, scraped FP ECR, values | No | Multi-season | Yes | — | $0 | GPL-3.0 repo; ECR scraped | High | Weekly | No (ECR) | AVOID (ECR/values) | 6.4 |
| Expected points | ffopportunity | Expected fantasy points weekly + per play | No | 2006+ | Yes | — | $0 | Data CC BY-SA 4.0; code GPL-3 | Good | Weekly | Yes (share-alike) | PRIMARY (xFP) | 7.6 |
| Scraper | ffpros | FantasyPros page scrapes | — | — | — | — | — | Conflicts with FP site terms | — | — | No | AVOID | 5.5 |
| Scraper | ffanalytics | Multi-site projection scrapes | — | — | — | — | — | Source terms bar | — | — | No | AVOID (REF method) | 5.2 |
| Rankings/projections/ADP/DFS | Fantasy Nerds API | ADP (std/ppr/half/superflex), rankings, projections, ROS, dynasty, best ball, DFS, injuries, depth | No | ? | Test data only | $499/yr Standard; $2,999/yr Extended | ~$42/mo | Commercial by tier | Medium | ? | Yes | SECONDARY (PRIMARY for small commercial) | 6.3 |
| Projections/DFS/ownership | SportsDataIO | Projections, DFS salaries/slates, ownership projections, ADP, stats | Yes (commercial) | Current + 3 yrs (Discovery Lab) | Last season free | Discovery Lab $99/mo or $599/yr (Fantasy); commercial quote | $50–99/mo personal | Personal (DL) / contract | High | 72 h (DL) / minutes | Contract | SECONDARY (PRIMARY commercial) | 7.1 |
| Consumer site | FantasyData | Projections, DFS tools | — | — | — | Subscription | — | Consumer terms | — | — | No | AVOID (use SportsDataIO) | 4.3 |
| Projections/news/injuries | RotoWire | Licensed content feeds | Yes | ? | No | Sales | Quote | B2B licence | High | Minutes | Yes (contract) | OPTIONAL (commercial) | 6.0 |
| Projections | numberFire | — (now FanDuel Research) | — | — | — | — | — | FanDuel ToS | — | — | No | AVOID | 2.8 |
| Expert content | Footballguys / 4for4 / ETR | Premium ranks/projections | — | — | No | Subscriptions | — | Terms bar scraping | High | Daily | Negotiate | AVOID | 3.8 |
| DFS ownership | FantasyLabs / RotoGrinders | Ownership, contest tools | Yes | ? | No | Subscriptions | — | Not read | High | Live | No | AVOID | 3.5 |
| Stats/usage inputs | nflverse stats/snaps/participation | Fantasy points (std, PPR), target/air-yards share, WOPR, snaps, on-field players | No | 1999+ | Yes | — | $0 | CC-BY-4.0 | High | Daily/weekly; participation post-season | Yes (credit; NFL rights caveat) | PRIMARY (compute) | 8.4 |

## R9. News, press conferences, social, media

Rows: 46. Full records: [NFL_API_CATALOG.md](NFL_API_CATALOG.md); evidence: [tracks/R9-news-social-media.md](tracks/R9-news-social-media.md).

| Category | Provider | Data | Live | Historical | Free | Paid | Cost | License | Quality | Latency | Commercial | Primary/Backup | Score |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| News feed | FOX Sports NFL RSS | headlines, links, times (+bodies to drop) | yes | 26 items | yes | – | $0 | explicit RSS grant: individuals/non-profits, non-commercial, attribution | high | minutes | needs permission | PRIMARY (public page) | 6.7 |
| News feed | Yahoo Sports NFL RSS (registry) | headlines | yes | 32 items | yes | – | $0 | unmodified, credited, linked, no ads, non-commercial | high | minutes | no (§2(e)) | PRIMARY (in use; works from GitHub) | – |
| News index | GDELT DOC 2.0 / GKG | URL, title, domain, time, tone, themes | 15-min batches | DOC 3 months; raw files since 2015 | yes | – | $0 | free incl. commercial; redistribute with citation | medium-low | 15 min | yes | SECONDARY (discovery, volume) | 6.7 |
| News feed | The Athletic NFL RSS | headlines | yes | 100 items | yes | – | $0 | NYT personal non-commercial; AI use barred | very high | minutes | no | AVOID (until terms read) | 6.3 |
| News feed | Google News RSS | headlines via Google links | yes | days | yes | – | $0 | personal feed reader only | high | minutes | no | AVOID | 5.7 |
| News feed | NBC Rotoworld player-news RSS | player notes | yes | 10 items | yes | via SportsDataIO | $0 | NBC terms bar automation | high | minutes | via SportsDataIO | AVOID (public) | 5.7 |
| News feed | RotoWire RSS / API | player notes | yes | 5 items | RSS | API by quote | ? | automation and AI barred without consent | high | minutes | API licence | AVOID / OPTIONAL (commercial) | 5.7 |
| News feed | PFN RSS | headlines (long descriptions) | yes | 50 | yes | – | $0 | terms not found | medium | minutes | ? | OPTIONAL after terms | 5.4 |
| News feed | NFL Trade Rumors RSS | rumor aggregation | yes | 10 | yes | – | $0 | not read | low-medium | minutes | ? | AVOID | 5.2 |
| News feed | Sporting News RSS | headlines | yes | 20 | yes | – | $0 | scrapers and AI prompting barred | medium | minutes | no | AVOID | 5.1 |
| News feed | SB Nation Atom | full posts | yes | 10 | yes | – | $0 | unreadable (blocked) | medium | minutes | ? | AVOID | 4.9 |
| News feed | SI site feed | mixed sport | yes | 81 | yes | – | $0 | unknown | medium | minutes | ? | AVOID | 4.5 |
| News feed | Yardbarker | aggregation | yes | 20 | yes | – | $0 | robots barred, personal only | low | minutes | no | AVOID | 3.9 |
| News API | NewsAPI.org | articles metadata | paid only | 5 y | dev only | $449–1,749/mo | $$$ | no publisher rights | medium | real time | paid | AVOID | 5.7 |
| News API | GNews | articles metadata | paid | since 2020 | 100/day, 12 h delay | €49.99–249.99/mo | $ | paid for commercial | medium | 12 h free | paid | OPTIONAL (commercial) | 5.7 |
| News API | NewsData.io | articles | paid | up to 10 y | 200 credits/day, 12 h delay | $199.99–1,299.99/mo | $$ | contradictory | medium | 12 h free | unclear | AVOID | 5.2 |
| News API | Mediastack | articles | paid | yes | 100 calls/mo | $24.99–249.99/mo | $ | no public online display | low | delayed free | paid | AVOID | 4.7 |
| News API | NewsAPI.ai (Event Registry) | articles, events, entities | yes | since 2014 (paid) | 2,000 tokens once | $90–3,000/mo | $$ | terms not read | high | real time | unverified | OPTIONAL (commercial) | 6.2 |
| News API | Perigon | articles, stories, entities | yes | 3 mo–10+ y | trial | $25 personal; $225 limited commercial; $875 commercial | $$ | per plan | high | real time | from $225 | OPTIONAL (commercial) | 6.3 |
| News API | Webz.io | full-text web/news | yes | limited; 10 y by quote | $5 credit/mo | pay-as-you-go | $ | not read | medium | real time | unverified | AVOID / research | 5.8 |
| News API | Bing News Search | – | – | – | – | – | – | retired Aug. 11, 2025 | – | – | – | AVOID | – |
| Archive | Common Crawl CC-NEWS | WARC pages | no | since 2016 | yes | – | $0 | publishers' rights apply | raw | days | risky | AVOID | 5.6 |
| Wire | AP Media API | text, photo, video | yes | deep | no | contract | $$$ | full licence | very high | real time | yes | PRIMARY (commercial text) | 7.3 |
| Wire | Reuters Connect (+FLM, Imagn) | text, photo, video | yes | deep | no | points/contract | $$$ | full licence | high | real time | yes | SECONDARY (commercial) | 6.8 |
| Wire | Field Level Media | recaps, news | yes | ? | no | contract | $$ | licence | good | real time | yes | OPTIONAL (commercial) | 6.2 |
| Player news | SportsDataIO (Rotoworld, RotoBaller, own notes) | player notes, injuries | yes | season+ | trial | contract | $$ | store/display; no resale; attribution | high | real time | yes | PRIMARY (commercial player news) | 7.4 |
| Social | X API v2 | posts, users | yes | full archive | no | $0.005/post read; 3M cap | ~$110/mo for 50 accounts | no AI training; delete on request; display rules | very high | seconds | yes (commercial designation) | OPTIONAL now; PRIMARY commercial | 7.3 |
| Social embed | X oEmbed (publish.x.com) | embed HTML | yes | – | yes | – | $0 | embeds preferred | high | – | yes | SECONDARY (display) | 7.6 |
| Social | Bluesky public AppView | posts of curated accounts | yes | full account history | yes | – | $0 | authors' copyright; honor deletions | high (few accounts) | seconds | yes | PRIMARY (free social) | 7.4 |
| Social | Bluesky Jetstream | firehose JSON | yes | replay window ? | yes | – | $0 | as above | raw | sub-second | yes | OPTIONAL (always-on server) | 6.8 |
| Social embed | Bluesky oEmbed | embed HTML | yes | – | yes | – | $0 | official embed | high | – | yes | SECONDARY (display) | 7.3 |
| Social | Threads keyword search | public posts | yes | since Jul. 2023 | yes (approval) | – | $0 | terms not read | medium | minutes | ? | OPTIONAL | 6.2 |
| Social | Reddit Data API | posts, comments | yes | yes | approval | contract | ? | AI training barred; commercial by agreement | medium | minutes | contract | OPTIONAL (research, approval) | 5.6 |
| Social | Mastodon tag timelines | posts | yes | – | yes | – | $0 | per instance | low (bots) | minutes | ? | AVOID | 5.5 |
| Video meta | YouTube Data API v3 | metadata, live status, comments | yes | yes | 10,000 units/day | – | $0 | no aggregation or derived metrics; 30-day refresh | very high | minutes | with policy limits | SECONDARY (live status, Made for Kids) | 7.7 |
| Captions | YouTube captions.download | captions | – | – | edit-permission only | – | – | owner-only | – | – | – | AVOID | 5.9 |
| Transcripts | NFL/iHeart podcast transcripts | SRT/VTT/text | per episode | feed depth | yes | – | $0 | TDM/AI prohibited | ? | with episode | no | AVOID (link only) | 6.2 |
| Transcripts | ASAP Sports | Q&A transcripts | – | deep | yes | – | $0 | unknown | high | hours | ? | AVOID (no NFL seen) | 4.6 |
| Podcasts | Podcast Index API | feeds, episodes | yes | deep | key | – | $0 | ToS v1.1 | good | hours | yes | SECONDARY (discovery) | 7.1 |
| Podcasts | iTunes Search API | podcast lookup | – | – | yes | – | $0 | promote store content | good | – | limited | OPTIONAL | 6.5 |
| Podcasts | Spotify Web API | catalog | – | – | yes | – | $0 | no ML ingestion; personal use | good | – | no | AVOID | 6.0 |
| Images | Wikimedia Commons | player photos | – | yes | yes | – | $0 | CC BY / BY-SA per file; personality rights | medium | – | yes with care | SECONDARY | 7.0 |
| Images | Imagn / Getty / AP photos | game photos | yes | deep | no | quote | $$ | editorial licence | very high | minutes | yes | OPTIONAL (commercial) | – |
| Embeds | Instagram oEmbed | embed HTML | – | – | token? | – | $0 | embed-only, no analytics | – | – | limited | OPTIONAL | 6.2 |
| Embeds | TikTok oEmbed / Research API | embed / research data | – | – | oEmbed yes | – | $0 | Research API academic only | – | – | no (research) | OPTIONAL / AVOID | 5.7 |
| Listening | Sprout / Brandwatch / Talkwalker | social listening | yes | varies | no | quote ($199–399/seat + add-on for Sprout) | $$$ | vendor licence | high | minutes | yes | AVOID now; OPTIONAL commercial | 5.9 (Sprout) |

## R10. Historical data, open source, academic, college, draft

Rows: 32. Full records: [NFL_API_CATALOG.md](NFL_API_CATALOG.md); evidence: [tracks/R10-historical-opensource-draft.md](tracks/R10-historical-opensource-draft.md).

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
