# NFL Data Gaps: what cannot easily be obtained

Part of the NFL data and API universe research (NU-018, Nov. 25, 2026). Start at [NFL_API_UNIVERSE.md](NFL_API_UNIVERSE.md). Evidence for each line is in the named track file (`tracks/R*.md`, sections 6 and 7) and in the verification files (`tracks/V*.md`).

Three kinds of gap: data that **does not exist** outside the league and its partners; data that exists but is **not lawfully usable for free** on a public page; and data that is usable but **expensive** or **thin**. A fourth list covers data this project should **avoid** even where it is reachable.

## 1. Locked inside the league and its partners

| Data | Who has it | Why we cannot get it | Track |
|---|---|---|---|
| Official real-time play-by-play and stats (GSIS) | NFL; distributed by Genius Sports | Genius is the NFL's exclusive distributor of official data through the 2029 season; contract only, no published price; GSIS and the NFL's API need league credentials | R1, R2 |
| Raw player and ball tracking (Next Gen Stats) | NFL, clubs, broadcasters; Genius for media and betting | Same contract; the NGS site's JSON answers 401; only weekly aggregates are public, and nflverse's copy is scraped from that site | R4 |
| NFL Communications' wire: transactions, injury reports, game-day rosters, game notes | NFL Communications (media portal) | Login for accredited media only (401 to everyone else) | R1, R6 |
| Game books for reuse | NFL | Published as PDFs for media coverage; NFL.com's terms bar systematic retrieval (§1.3) | R1 |
| All-22 video for analysis | NFL+ Premium | Personal viewing only; terms bar downloading and data harvesting | R4 |
| Practice tracking, wearables, health data | Clubs (Zebra, Catapult) | Never distributed | R4 |

## 2. Exists, but no free source may lawfully show it on a public page

| Data | Best lawful route | Free reality | Track |
|---|---|---|---|
| Live play-by-play | Sportradar push, SportsDataIO (quote) | ESPN's JSON is local-only (DEC-006); cheap resellers appear to repackage ESPN data | R2, R3 |
| Live scores | The Odds API `/scores` ($30 plan for game-day polling) | Free tier's 500 credits cannot poll a whole Sunday | R2, V2 |
| In-season personnel, formation, coverage, man/zone | FTN API (price unverified) | nflverse participation arrives only after the Super Bowl | R3, R4 |
| Transactions in near real time | Sportradar Daily Transactions | NFL.com may not be collected systematically; ESPN is local; nflverse trades stopped on 2026-04-17; roster diffs lag up to a week | R6 |
| Game-day inactives | Licensed feed | ESPN (local) only | R6 |
| Injury return estimates | Sportradar (paid) | ESPN (local) only | R6 |
| Contracts, extensions, cap space | Licence from OverTheCap, Spotrac or a vendor | OverTheCap and Spotrac terms bar automated collection; nflverse's contracts file is scraped from OverTheCap; NFLPA allows personal use only | R6, R10 |
| Betting splits (bets %, handle %) | Sportradar or SportsDataIO (contract) | Action Network, VSiN and Covers bar reuse; Covers' "consensus" is contest picks, not bets | R7 |
| Per-game handle | none | States publish monthly aggregates only (Indiana football handle; Nevada football win and win %) | R7 |
| Prediction-market prices | A licensed data partner | Kalshi's developer agreement limits the API to members' own trading; Polymarket's international terms bar redistribution; Polymarket US terms unread | R7 |
| DFS salaries and ownership, pick'em lines, Underdog best-ball ADP | SportsDataIO (quote); Fantasy Nerds (salaries) | Sportsbook and DFS sites bar automated access | R8 |
| Dynasty trade values with a commercial licence | none found | KeepTradeCut bans scraping; FantasyCalc states no grant | R8 |
| Insider news on X | X API pay-per-use (about $110 a month for 50 accounts) | Several leading insiders post only on X | R9 |
| Club news text | Permission from each club | All 32 club feeds exist; every club's terms block this use (F14) | R9 |
| Press-conference transcripts | none | YouTube captions need the channel owner's authorisation; the official NFL podcast feeds' notice forbids text and data mining | R9 |
| Player photos | Imagn, Getty, AP (paid) | Wikimedia Commons is patchy | R9 |
| Club logos | Permission from the NFL and clubs | Trademarks; no licence offered (registry) | R1 |
| PFF grades and charting | PFF (personal use only) / Teamworks (enterprise) | Terms bar public, derived and AI use | R3, R4 |

## 3. Usable, but expensive or thin

- **Licensed live play-by-play**: no published price under about $600 a month (Rolling Insights $599 a month per sport, with ambiguous display terms); the clean options are quote-only (R2).
- **Historical odds**: The Odds API's history (from June 6, 2020; props from May 3, 2023) needs a paid plan; a full season of closing lines for the main markets costs on the order of 8,500 credits (R7, V2).
- **Archived pre-kickoff weather forecasts**: Open-Meteo's Previous Runs API starts in January 2024 for most models; before that only observed weather exists for free, which must never be presented as something known before kickoff (R5).
- **Weather for a commercial product**: Open-Meteo's free tier is non-commercial; paid plans and the historical APIs cost money (R5).
- **Charting**: FTN's in-season API is reported at about $3,000–5,000 a year (unverified; R3).
- **Tracking-derived video data**: SkillCorner and Teamworks (Telemetry, Sportlogiq, PFF enterprise) are contact-sales (R4).
- **Fantasy projections with a commercial licence**: Fantasy Nerds $499 or $2,999 a year; FantasyPros, SportsDataIO and RotoWire by quote (R8).
- **Historical news archives with rights**: paid news APIs (R9).
- **Sports Reference custom data**: from $5,000 (R6, R10).

## 4. Thin or stale even though free and lawful

- **Officials**: nflverse's `officials` file has 2026 week 1 only (its scraper got HTTP 403 from Sept. 3 and was switched off on Sept. 15); nfldata's `referee` column is empty after week 4 (R3, R10, V1).
- **Head-coach changes mid-season** appear only as a name change between games; **coordinators and play-callers** have no structured source at all (R1, R3).
- **nfldata weather fields** are missing for many outdoor games (2022: 107 of 198 filled; 2023: 158 of 199; 2026 so far: 44 of 114) and carry some errors (R5).
- **Snap counts** effectively start in 2013 (the 2012 file is empty) (R10).
- **Wikidata** coaches and executives are stale (current head coach right for 18 of 32 clubs) (R1).
- **Sleeper's** practice fields and injury start dates are empty for almost every player (R6).
- **Weather alerts outside the US**: none verified (R5).
- **Retractable roof status before kickoff**: no source (R5).

## 5. Avoid, even where reachable

| Source | Reason | Track |
|---|---|---|
| NFL "Shield" API and any client that mints NFL tokens (sportsdataverse-js `nfl_api` family) | Authentication meant for the NFL's own apps | R1 |
| Automated collection from NFL.com, the NGS site, game books | NFL.com terms §1.3 | R1, R4 |
| ESPN JSON beyond the owner's machine | Disney terms; ESPN's API hosts refuse robots (DEC-006 stands) | R2 |
| RapidAPI resellers of ESPN data (Tank01, "NFL API Data"), scraping intermediaries | Resold scraped data | R2 |
| Pro Football Reference / Stathead automation | Sports Reference requires permission for tools built from its data and for AI prompting or training; aggressive bot limits | R3, R10 |
| Ourlads, RotoWire site, Spotrac, OverTheCap, prosportstransactions scraping | Terms bar automated monitoring or database building | R6 |
| Sportsbook and DFS endpoints (DraftKings, FanDuel, PrizePicks, Underdog) | Terms bar automation; geo and bot blocks | R7, R8 |
| Kalshi and Polymarket (international) data for display | Developer agreement and terms | R7 |
| KeepTradeCut, FantasyCalc, ffpros, ffanalytics, nflverse `load_ff_rankings` | Scraping bans or scraped FantasyPros content | R8 |
| Google News RSS, Sporting News, Yardbarker, NBC/Rotoworld, The Athletic, Mediastack, Bing News (retired Aug. 11, 2025) | Personal-use-only, automation or AI bans, or gone | R9 |
| Transcribing the official NFL podcasts | Feed notice forbids text and data mining and AI training | R9, V2 |
| YouTube comment sentiment | YouTube API policies | R9 |
| Team flight tracking (OpenSky, ADS-B Exchange) | Privacy programs, non-commercial terms, safety | R5 |
| Weather APIs that forbid storing data (WeatherKit, Google Weather, AccuWeather, Tomorrow.io) | Conflict with committed snapshots | R5 |
| Big Data Bowl files re-uploaded anywhere but Kaggle; NGS highlight scrapes | No-redistribution rules; scraped NFL data | R4 |
| Ultralytics YOLO in a served build | AGPL-3.0 | R4 |
| Unabated's free tier | Requires deep links to sportsbooks (affiliate-style) | R7 |

## 6. What else about an NFL game have we not considered?

The brief asked for a deliberate pass over factors beyond ordinary statistics. For each: whether data exists, where, and whether it is worth pursuing. "Evidence" means published research the tracks found; anything not researched is marked.

| Factor | Data available? | Source | Evidence of an effect | Verdict |
|---|---|---|---|---|
| Weather (wind, cold, precipitation) | Yes | Open-Meteo, NWS, nfldata, ASOS | Kicking: wind ≥10 mph −0.14 log-odds, cold −0.34, precipitation −0.28 (Clark et al. 2013); totals: the project's own test found wind ≥15 mph 1.65 ± 0.87 points under, not significant | Descriptive now; backtest wind on totals with archived forecasts (2024 on) |
| Stadium, roof, turf | Yes (with errors) | nfldata, config | Surface injury literature not researched this session | Fix config; descriptive |
| Field orientation and sun | Derivable | OpenStreetMap + solar algorithm | No published NFL evidence found | Descriptive flag only |
| Altitude | Yes | USGS, Open-Meteo | Field goals: ≥4,000 ft about +0.69 log-odds (Clark et al. 2013) | Kicking descriptor |
| Travel, time zones, circadian | Derivable | Schedule + coordinates | West Coast teams at night beat the spread by about 5 points, 1970–2011 (Smith et al. 2013), only a trend in a 2018 replication; travel about 0.4 points per 2,500 miles, not significant with division games (nfelo) | Descriptive; small effects, mostly priced |
| Rest, short weeks, byes | Yes | nfldata `away_rest`/`home_rest` | Bye after 2011: +0.31 points, CI includes zero (Lopez & Bliss 2024); no Thursday injury increase | Keep rejected as a model factor (matches the project's backtest) |
| International games | Yes (schedule) | nfldata | Not researched (search budget) | Descriptive |
| Home-field advantage and crowd | Partly | Results; attendance not checked this session | HFA about 1.7 points in 2023, declining about 0.03 a year (Benz, Bliss & Lopez 2024); empty stadiums in 2020 lowered home win rate | Already in ratings (`hfa`); attendance source not verified |
| Crowd noise | No | — | — | No source; ignore |
| Coaching and play-calling | Partly | PBP-derived tendencies; head coach per game | Fourth-down aggressiveness measurable (nfl4th) | Build tendencies (Derived metrics); coordinators need curation |
| Officiating | Partly, stale | nflverse officials, PBP penalties | Not researched for effect size | Descriptive; fix staleness first |
| Injuries and depth | Yes (daily), not live | nflverse, Sleeper, ESPN local | Quarterback value is large and already modelled (nfelo QB adjustment) | Extend starter-aware burden; backtest before use |
| Offensive and defensive line quality | Partly | PBP sacks, PFR pressures (scraped), FTN rushers | Pass-block and pass-rush win rates are ESPN-only | Compute pressure-adjusted proxies from PBP and FTN |
| Quarterback pressure, coverage | After the season | Participation, FTN | — | Historical analysis only |
| Matchups and personnel | After the season | Participation | — | Historical only in season |
| Pace and game script | Yes | PBP | Standard in totals modelling | Derive |
| Opponent strength, strength of schedule | Yes | Results, ratings | — | Already in the engine |
| Divisional familiarity, rivalries | Yes (schedule) | Config (`rivalries` exists in `shared/teams.json`) | Division games narrow travel effects (nfelo) | Descriptive |
| Primetime | Yes | Schedule | Circadian work above | Descriptive |
| Market movement | Yes, thin cadence | Our odds snapshots | The market usually beats models (project backtest note) | Keep as the main benchmark |
| Fantasy usage and public attention | Yes | Sleeper trends, FantasyPros | Not researched as a predictor | Descriptive |
| News and sentiment | Partly | RSS, Bluesky, GDELT | Not researched as a predictor | Descriptive; never a model input without a backtest |
| Player-level fatigue, snaps in the prior game | Yes | Snap counts (PFR via nflverse; owner decision) | Not researched | Possible future backtest |
| Contract-year and incentive effects | Weak (contracts not usable publicly) | — | Not researched | Skip |
| Suspensions, personal matters | News only | Curated news | — | Curated items only |
| Kickoff-rule eras (2024, 2025, 2026) | Yes | PBP | Breaks comparability of special-teams stats | Segment by rule era |
| Model version changes upstream (nflfastR, Nov. 25, 2026) | Yes | nflverse | Breaks comparability of EPA and WP | Pin versions |

## 7. Data that could most improve accuracy, and what blocks it

| Goal | Data that would help most | Blocker |
|---|---|---|
| Game prediction | Timely quarterback and line availability; archived pre-kickoff forecasts; closing lines | Inactives and intra-day injuries are not public; archives start 2024; closing lines need paid history |
| Fantasy | Route participation, in-season snap and route data, licensed projections | Participation is post-season; projections single-sourced |
| Betting analysis | Multi-book line history at 5-minute cadence; licensed splits | Paid plans and contracts |
| Live game analysis | Licensed live play-by-play with timeouts and possession | Contract feeds only; the in-game model ignores possession and timeouts today |
