# The NFL Data and API Universe: a data blueprint for NFL Universe

Research task NU-018, Nov. 25, 2026. Ten research tracks, two verification passes, one merge. This file is the entry point: what exists, what it costs, what we may lawfully use, how it fits together, what to build on, and what is still missing.

## The package

| File | What it holds |
|---|---|
| **NFL_API_UNIVERSE.md** (this file) | The blueprint, the headline findings, the self-critique pass and the answers to the final questions |
| [NFL_API_CATALOG.md](NFL_API_CATALOG.md) | 369 source records (links, class, data, history, latency, technical, cost, licensing, quality, twelve scores, recommendation, what was verified), verified corrections first |
| [NFL_DATA_SOURCE_MATRIX.md](NFL_DATA_SOURCE_MATRIX.md) | 334 comparison rows in the fourteen requested columns |
| [NFL_DATA_ARCHITECTURE.md](NFL_DATA_ARCHITECTURE.md) | Pipeline, dependency graph, canonical database (tables, keys, relationships), refresh intervals, security, licence-aware data flow |
| [NFL_API_RECOMMENDATIONS.md](NFL_API_RECOMMENDATIONS.md) | Minimum-cost, production, premium and hybrid stacks; cost model from $0 to $1,000+ a month; implementation tasks |
| [NFL_DATA_BACKUP_STRATEGY.md](NFL_DATA_BACKUP_STRATEGY.md) | Primary, secondary and fallback for 45 data categories; single points of failure; categories with no backup |
| [NFL_DERIVED_METRICS.md](NFL_DERIVED_METRICS.md) | RAW → CALCULATION → RESULT recipes to compute ourselves, with rules against future-data leakage |
| [NFL_DATA_GAPS.md](NFL_DATA_GAPS.md) | What is locked, unlicensed, expensive, thin or to be avoided; the "what are we missing?" pass |
| [NFL_API_RESEARCH_LOG.md](NFL_API_RESEARCH_LOG.md) | Method and every search and page read, by track |
| [tracks/](tracks/) | The ten track reports (R1–R10) and two verification reports (V1, V2): the evidence behind everything above |

The project's operating records stay where they were: [`docs/NFL_DATA_SOURCE_REGISTRY.md`](../../NFL_DATA_SOURCE_REGISTRY.md) lists the sources in use and their verdicts (updated in this pass), and decisions live in [`docs/DECISIONS.md`](../../DECISIONS.md).

## The answer in one page

1. **The NFL sells its data through one door.** It has no public API (`api.nfl.com` answers 401; the old GameCenter feeds redirect home; the Next Gen Stats site's JSON answers 401). Official real-time play-by-play, GSIS stats and Next Gen Stats tracking go out exclusively through **Genius Sports**, by contract, through the 2029 season. No price is published. Everything else is either the league's pages and PDFs (for reading, not collecting: NFL.com terms §1.3), a company that collects its own data (Sportradar, SportsDataIO), or someone republishing.
2. **nflverse is the free backbone, but it is a republisher.** Play-by-play (2001–2026 maintained), schedules, rosters, injuries, charting and history are free, current within hours, and well documented. But its CC-BY-4.0 label covers nflverse's own work, not the underlying rights: injuries come from the NFL's API and weekly rosters from Next Gen Stats, both through non-public nflverse packages; depth charts from ESPN since Aug. 3, 2025; Next Gen Stats are scraped from the NFL's site; snap counts, advanced stats, draft and combine from Pro Football Reference; contracts from OverTheCap; the Sleeper, ESPN, Sportradar and other third-party ids in its weekly rosters from GPL-licensed DynastyProcess data. nflreadr itself says the data "belong to their respective owners". Fine for a credited non-commercial project at the owner's risk; not a licence for a commercial one. Verified in V1.
3. **Live data is the expensive line.** No free source may lawfully put live play-by-play on a public page. ESPN's JSON stays on the owner's machine (DEC-006). The cheapest licensed live **scores** come from a key the project already holds: The Odds API's `/scores` endpoint (about 30-second updates, 1 credit a call), which needs the $30-a-month plan for game-day polling. Licensed live **play-by-play** is quote-only (Sportradar, SportsDataIO), with $599 a month the lowest published figure found.
4. **Odds are well served; splits, handle and prediction markets are not.** The Odds API's terms (Aug. 31, 2026) allow display, including commercial display, indefinite storage and model training, but not re-serving the raw data. No free source may lawfully supply betting splits, per-game handle or prediction-market prices; line movement must come from our own snapshots.
5. **Weather, venues and travel are almost entirely free and open** (Open-Meteo non-commercial, NWS, NOAA and Iowa Mesonet observations, Wikidata, OpenStreetMap), and leakage-free weather backtests are possible from 2024 on (Open-Meteo Previous Runs). Field orientation, wind components, sun angle, travel, time zones and rest are computed, not bought.
6. **Injuries, depth charts and transactions are the weakest public layer.** Daily official statuses arrive through nflverse; day-by-day practice participation, inactives, return estimates and transactions have no free public source; contracts have no usable source at all without a licence.
7. **Fantasy can be built mostly from our own computation** (points for any scoring system, usage, expected points from ffopportunity), plus FantasyPros on the owner's personal key and Fantasy Football Calculator ADP. DFS salaries, ownership and pick'em lines have no lawful free source.
8. **News for the public page:** Yahoo RSS plus FOX Sports' NFL RSS (its RSS page grants non-commercial use with attribution; headlines and links only, because the feed carries full articles) plus curated Bluesky insiders and GDELT for discovery. X is pay-per-use; Reddit is approval-gated; club feeds and podcast transcripts are barred by their owners' terms.
9. **Tracking and computer vision are out of reach** except weekly aggregates and the Big Data Bowl's non-commercial samples. No lawful video source exists for computer vision.
10. **Several things the project's own documents assert are wrong or out of date** (next section). None requires an emergency, but four need the owner's decision.

## Corrections to the project's own documents

Verified in V1 and V2 unless marked. The registry was updated in this pass; `CURRENT_STATE.md` lists the owner decisions.

| # | The docs said | What is true (Nov. 25, 2026) | Consequence |
|---|---|---|---|
| 1 | nflverse releases: "Yes: CC-BY-4.0, credit nflverse" for all | Per dataset: injuries from the NFL's API and weekly rosters from Next Gen Stats, through non-public wrappers; depth charts from ESPN since 2025-08-03; NGS scraped from nextgenstats.nfl.com with a browser user agent; contracts scraped from OverTheCap; PFR-sourced snap counts, advanced stats, draft, combine, trades; ids from DynastyProcess (GPL-3.0) | Registry now classifies each dataset; owner decision on what the public snapshot keeps |
| 2 | nflverse depth charts are open data (registry); ESPN data never reaches the public snapshot (DEC-006) | The depth charts **are** ESPN's data, republished; the committed snapshot carries starter labels derived from them | Owner decision (keep derived labels with attribution, or drop) |
| 3 | `players.csv` "removes the need for the GPL dynastyprocess file" (FEATURE_RESEARCH §5) | `players.csv` has no Sleeper id; the Sleeper ids the fabric uses come from weekly rosters, which join them from DynastyProcess | The fantasy block's names depend on GPL data; owner decision |
| 4 | Sleeper: "free non-commercial" (registry) | Sleeper's General Terms of Nov. 17, 2026 (§11.1, §11.3) require express written consent for automated access, alongside an API page that still says "free to use for non-commercial purposes"; which governs is ambiguous | Current light use is defensible but not certain; ask Sleeper or drop |
| 5 | nfelo quarterback values: "Yes for outputs with credit" | The build reads `nfeloqb/qb_elos.csv`; that repository has no licence (the `nfelo` repository's licence covers its outputs, not `nfeloqb`) | Ask nfelo, or switch to licensed outputs or our own metric |
| 6 | FantasyPros: "free non-commercial" | The free key is "non-production use" with sample data; production keys come with the HOF subscription (from $8.99 a month billed annually, personal use); redistribution rights only in the Commercial tier; 100 calls a day is in the 2020 API terms; the projections endpoint has no `scoring` parameter | The owner's paid key is the right licence; check what the stored points mean |
| 7 | Official NFL podcasts: display terms "not stated"; transcribing them "lower risk" (FEATURE_RESEARCH §6) | Every feed names iHeartMedia and forbids "text and data mining or computational analysis" and AI training without consent; the feeds do publish transcripts | No transcript or claim-extraction feature on these shows without iHeartMedia's written consent |
| 8 | ESPN RSS is the second national feed (DEC-012) | FOX Sports' RSS page grants feeds to individuals and non-profits for non-commercial use with attribution | A lawful replacement for ESPN RSS on GitHub, headlines and links only |
| 9 | Pinnacle "not an option" (GITHUB_RESEARCH) | Public API closed July 23, 2025, but academic and pregame-handicapping projects may apply (R7) | Low priority |
| 10 | Snowfall shown in inches | Open-Meteo already returns inches with `precipitation_unit=inch`; the adapter divides by 2.54 again (R5, probed) | Code fix (not made here) |
| 11 | `shared/teams.json` venues | Buffalo's coordinates are the old stadium's; none of the five new 2026 international venues are in `neutralSites` (R5) | Contract-file update through the orchestrator |
| 12 | The Odds API polls every 8 h (DEC-019's text) | The code, the registry and DEC-021's amendment say 11 h; the `/scores` live-scores endpoint was not recorded anywhere | Registry row now mentions `/scores`; DEC-019's figure is superseded by DEC-021 |

## How the universe connects

The dependency graph, relationship keys and canonical tables are in [NFL_DATA_ARCHITECTURE.md](NFL_DATA_ARCHITECTURE.md) §3–4. In short: **league → teams → venues → coordinates → weather and travel**; **players → roster status, injuries, depth, contracts, transactions**; **games → officials, odds, play-by-play → advanced metrics → stats → fantasy**; **news and social → claims about injuries, transactions and depth**; and all of it feeds the **prediction engine** only through the backtest gate (DEC-007). Every fact carries its source, retrieval time, effective time and confidence, and every change keeps two clocks (when it was true, when we learned it) so backtests never see the future.

## Self-critique: the second pass

The brief asked for a deliberate review before calling the research complete.

**APIs or providers we may have overlooked.** Thin or absent coverage: Canadian and international data providers (CFL-style vendors, Opta's remaining US work); regional sports networks' data; state DMV-style government data (none relevant found); ticketing and secondary-market prices (StubHub, SeatGeek, Ticketmaster; a proxy for attendance and demand, not researched); TV ratings (Nielsen; paid); Google Trends for attention (not researched); stadium attendance (in game books and Pro Football Reference, neither usable automatically; not researched further); referee assignment sources beyond Football Zebras; NFL Films archive licensing; Spanish-language NFL media. Each is a candidate for a short follow-up, not a known gap in a core category.

**Data categories we under-covered.** Attendance and crowd; player health beyond injury reports (surgery types, recovery timelines: medical, sensitive, and mostly news-only); in-game injuries (only through live feeds and news); kickoff-rule eras as a data dimension (noted in R3); salary-cap mechanics beyond figures (dead money, cash vs cap); front-office decisions (draft trades, compensatory picks); referee-crew rotation; international game logistics (hotels, travel days: no source).

**Claims still unverified.** FTN's API price; Polymarket US's terms; GitHub runners' access to FOX, Bluesky and GDELT; NOAA model archives before 2024; responsible-gambling messaging rules by state; the meaning of nflverse roster status `I01`; whether nflverse holds unpublished permissions from its upstreams; the API-Sports and Goalserve prices (their pages refused us); latency figures that come only from vendors' own documentation (none measured live). Each is marked UNVERIFIED in its record.

**Outdated or gone.** Bing News Search (retired Aug. 11, 2025); NFL GameCenter JSON (retired); FiveThirtyEight's Elo pages (redirect to ABC News); NFL Fantasy (closed for 2026); numberFire (folded into FanDuel Research); Pinnacle's public API (closed July 23, 2025); nfldata trades and nflverse officials (stopped updating in 2026); Yahoo's editorial JSON (end-of-life notice); nfl_data_py (archived, replaced by nflreadpy).

**Unofficial sources.** ESPN JSON (all endpoints), Yahoo/FOX/CBS hidden JSON, Sleeper's undocumented projections and stats (they are RotoWire's and Sportradar's), the NFL app's API, sportsbook JSON, RapidAPI resellers, community scrapers. None may be primary for anything published.

**Licensing problems.** Covered in the corrections table and [NFL_DATA_GAPS.md](NFL_DATA_GAPS.md) §5. The most consequential for this project is that nflverse's scraped datasets inherit their owners' restrictions.

**Redundant sources.** Two nflverse files from one upstream are one source (schedules tag and `nfldata/games.csv`; rosters and players for status); ESPN-local is not a backup for nflverse depth charts; most cheap "live" APIs are ESPN underneath.

**Critical data without a backup.** Listed in [NFL_DATA_BACKUP_STRATEGY.md](NFL_DATA_BACKUP_STRATEGY.md): live play-by-play, in-season personnel and coverage, tracking aggregates, current officials, coordinators, practice participation, inactives, transactions, contracts, props, splits, prediction markets, non-US weather alerts, pre-game roof status, archived forecasts before 2024, a second projection source, press-conference transcripts.

**What to calculate ourselves.** [NFL_DERIVED_METRICS.md](NFL_DERIVED_METRICS.md), "Build first".

**What could most improve accuracy.**
- *Predictions:* timely quarterback and offensive-line availability (inactives, practice participation captured by our own snapshots), closing lines captured near kickoff, archived forecasts for weather backtests (2024 on). Published effects for travel, rest and byes are small and mostly priced (R5 literature), which supports the project's rejection of a rest factor.
- *Fantasy:* route participation and in-season snap data (no free in-season source), a second licensed projection source, usage shares computed from play-by-play.
- *Betting analysis:* multi-book line history at five-minute cadence (paid), Shin devig for futures, closing-line value of our own forecasts.
- *Live game analysis:* licensed live play-by-play with possession and timeouts (the in-game model ignores both today); a refit of the nflfastR-style win-probability model only with a backtest.

## The final question

> If we wanted to build the most comprehensive NFL intelligence platform possible, what data would we need that we currently cannot easily obtain?

**Official real-time data and tracking** (GSIS play-by-play, Next Gen Stats raw tracking), **in-season scheme data** (personnel, formations, coverage, routes), **intra-day roster truth** (inactives, practice participation by day, transactions as they happen, return timelines), **contracts and cap detail**, **market microstructure** (multi-book line history, splits, handle, prediction-market prices), **rights to text and video** (news bodies, transcripts, highlights, photos), and **a clean identity layer** that does not depend on GPL or scraped crosswalks. All of these exist; each sits behind a contract, a terms barrier or a league-only system.

1. **What data exists?** Nearly all of it: schedules and results back to 1920, play-by-play from 1999, charting from 2022, tracking aggregates from 2016, injuries from 2009, depth charts from 2001, odds history from 2020 (paid), weather everywhere, venue geometry, news and social streams, fantasy projections and ADP, college stats and draft history. See [NFL_DATA_SOURCE_MATRIX.md](NFL_DATA_SOURCE_MATRIX.md).
2. **What is difficult to obtain?** Anything live for a public page; in-season scheme data; inactives, practice participation, transactions and return estimates; current officials; coordinators and play-callers; splits, handle and prediction markets; transcripts; per-game roof status; non-US weather alerts.
3. **What is expensive?** Licensed live play-by-play, injuries and transactions (Sportradar, SportsDataIO: quote); official data and tracking (Genius: quote); news wires and photos (AP, Reuters, Getty: quote); tracking-derived video data (SkillCorner, Teamworks: quote); charting (FTN, about $3,000–5,000 a year, unverified); public-display multi-book odds with history ($229–299 a month and up); commercial licences for weather and fantasy.
4. **What should we derive ourselves?** EPA and success rates with a pinned model; tendencies (pass rate over expected, fourth-down aggressiveness, pace); fantasy points and usage; consensus and no-vig probabilities (Shin for futures); opening and closing lines from our snapshots; travel, time zones, rest and body-clock descriptors; wind along the field and sun glare; Elo and SRS; depth-chart and injury histories from our own snapshots; forecast accuracy.
5. **What should we avoid?** Anything that needs authentication meant for someone else (NFL Shield, ESPN cookies), scraping of sites whose terms forbid it (Pro Football Reference, OverTheCap, Spotrac, Ourlads, RotoWire, sportsbooks, DFS sites, KeepTradeCut), resold ESPN data, transcripts of the official podcasts, YouTube comment mining, team flight tracking, and weather APIs that forbid storage. Full list: [NFL_DATA_GAPS.md](NFL_DATA_GAPS.md) §5.
6. **Which APIs should become core dependencies?** nflverse (with per-dataset verdicts), The Odds API, Open-Meteo, the National Weather Service, and the project's own fabric and snapshots. GitHub Actions is core infrastructure.
7. **Which should be optional?** FantasyPros, Fantasy Football Calculator, Sleeper trending, FOX RSS, Bluesky, GDELT, CollegeFootballData.com, Neil Paine's Elo, nfelo outputs, Iowa Mesonet, Wikidata and OpenStreetMap (as config sources), official YouTube and podcasts.
8. **Which should be backups?** ESPN JSON (local only), NWS hourly behind Open-Meteo, Iowa Mesonet and NCEI behind nfldata weather, Neil Paine's Elo behind nflverse results, MyFantasyLeague behind FFC ADP, curated news behind every feed, and our own last-good snapshots behind everything.
9. **Which should never be trusted as primary?** Wikidata for current staff; Sleeper for official injury designations; RapidAPI resellers; scraped sites; Covers "consensus"; prediction-market prices; social posts for facts before confirmation; ESPN for anything published; Big Data Bowl samples for current-season claims; vendor latency claims until measured.
10. **What major data categories are still missing?** Attendance and crowd; in-game injuries; player health detail; front-office and cap mechanics; ticket-market demand; TV audience; referee-crew rotation; international logistics; and, for this project specifically, a measured comparison of how fast each injury and transaction source really is (a measurement design is in `tracks/R6`).
