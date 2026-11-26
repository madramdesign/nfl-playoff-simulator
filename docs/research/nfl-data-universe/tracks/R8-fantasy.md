# R8 — Fantasy football data sources (NFL Universe)

Research track R8, 2026-11-25. All "Verified" dates are 2026-11-25 unless stated. Probes used the User-Agent `nfl-universe-research/1.0`, one or two requests per host, no keys, no cookies, no sign-ins.

## 1. Summary

Of 35 sources, few are lawful and usable on a public page:

- **nflverse** (CC-BY-4.0): compute fantasy points for every scoring system, plus usage, red-zone share and replacement value, ourselves.
- **ffopportunity** expected points (CC BY-SA 4.0).
- **FantasyPros API v2** on the owner's paid personal key, publishing derived values only, with "Data obtained from FantasyPros".
- **Fantasy Football Calculator ADP**: free, commercial use allowed, link credit.
- **Sleeper trending**.

Optional extras:
- MyFantasyLeague ADP/AAV.
- Dynasty values from Dynasty Dealer or Roster Audit, with link credit.

New findings:
- FantasyPros' free key is "Non-production use"; production needs Premium/HOF at $8.99 a month.
- The FantasyPros projections endpoint has no `scoring` parameter in the published spec.
- Sleeper's undocumented projections are RotoWire's and its stats Sportradar's.
- Yahoo's Fantasy API became approval-gated in 2026.
- NFL Fantasy closed for 2026; ESPN now runs the NFL's official game.
- DynastyProcess ECR (and nflverse `load_ff_rankings`) is scraped from FantasyPros.
- KeepTradeCut explicitly bans scraping.

No free, lawful source exists for these:
- DFS salaries and ownership
- pick'em lines
- best-ball ADP from Underdog
- route participation in season

Avoid ESPN, CBS, Fantrax, Underdog, PrizePicks, DraftKings, FanDuel, KTC, FantasyCalc, ffpros, ffanalytics.

Commercial use changes the stack:
- FantasyPros needs a sales contract, or a replacement: Fantasy Nerds ($499 or $2,999 a year), SportsDataIO (quote; covers DFS salaries and ownership) or RotoWire (quote).
- Sleeper needs a licence.
- nflverse and FFC stay usable; ffopportunity stays usable with share-alike.

## 2. Catalog

### FantasyPros — Public API v2 (ECR, projections, ADP, news, injuries, player points)
- Links: https://www.fantasypros.com/api-data/ · docs https://api.fantasypros.com/public/v2/docs (spec https://api.fantasypros.com/public/v2/docs/fantasypros_v2_public.yml) · terms https://api.fantasypros.com/public/v2/terms-of-use (PDF) · GitHub: none official
- Category · Class: rankings / projections / ADP / news / injuries · 🟢 Official (personal key) / 🟡 Licensed (commercial plan)
- Provides: consensus rankings (`/{sport}/{season}/consensus-rankings`), raw expert rankings (`/{sport}/{season}/rankings`, `range`, `rankstats`, `type=DRAFTERS`), expert list and accuracy (`/rankings/experts`), projections (`/nfl/{season}/projections`, `week` (0 = preseason), `ros=true`, `r2p=true` rankings-to-projections, `experts=show`, `players`, `positions`), NFL fantasy points (`/nfl/{season}/player-points`, `start`/`end` weeks, `scoring`), news (`/{sport}/news`, `category` injury/recap/transaction), injuries (`/{sport}/injuries`, `week`, `include_probabilities`), players (`/{sport}/players`, external-id filter), compare-players. Ranking `type` enum (NFL): WW, WAIVER, ROS, DRAFT, PRESEASON, SLEEPERS, ADP, BEST, PROSPECT, PRO, DEVY, ROOKIES, DYNADP, RKADP, BESTADP, DYNASTY, PRE, DRAFTERS, MOCK — i.e. redraft, weekly, ROS, dynasty, rookie, devy, best ball and ADP flavours. Scoring enum (NFL): STD, PPR, HALF only. Positions include OP (offensive player; its use for superflex is our inference — the spec does not define it), FLX, IDP sets. No TE-premium scoring value in the spec.
- History · Live · Latency: public plan: current season (spec examples use 2024 and 2025 seasons; how far back `season` goes on a personal key is UNVERIFIED) · no · expert updates timestamped per expert (`expert_pub`); the project's first real call returned `last_updated` (registry, Nov. 25). "Historical data & bulk access" is listed only under Commercial (api-data page).
- Coverage: QB/RB/WR/TE/K/DST/IDP and team positions; 130+ ranked experts per the api-data page; projection records carry `fpid` and `mflid` (MyFantasyLeague id) — a free id bridge.
- Technical: REST · JSON · SDK: none (OpenAPI 3.1.1 spec published; code samples cURL/JS/Python) · Auth: `x-api-key` header · Rate limits: terms §2 "one API call per second and up to 100 API calls per day" by default (project's plan: 500/day per CLAUDE.md, not re-verified here); api-data page says Free "Generous daily call limit", Premium "higher rate limits" (no numbers) · Pagination/Webhooks: none / none
- Cost: free: Free key, "Non-production use", "sample data" (api-data page) · free tier: same · paid: Premium $8.99/mo, "Bundled with FantasyPros HOF (from $8.99/mo annual)", "Production keys for personal apps"; Commercial: "Custom", "Talk to sales", includes "Commercial license & redistribution rights", "Historical data & bulk access" · est. monthly for a small app: $8.99 (personal); commercial = contact sales
- Licensing: commercial: no (terms §2 "personal, non-commercial purposes only"; Commercial plan needed) · redistribution: no third-party access to API materials (§2(c)); redistribution only on Commercial · caching/storage: terms tell you to cache ("take steps to cache data on your end"); historical player statistics and player image URLs are not licensed and must be deleted (§2) · attribution: §3 "conspicuously state that your work contains or is based on" Data obtained from FantasyPros · other restrictions: §4 non-compete (no product competing with FantasyPros); no reverse engineering or derivative works of the API materials; termination at any time; JAMS arbitration; Nevada law. Terms are still "Last Updated: October 27, 2020" (unchanged since the registry entry).
- Quality: accuracy: ECR is the industry reference for consensus; FantasyPros publishes expert accuracy (`include_overall`) · completeness: very broad · reliability: commercial vendor, versioned spec · notes: the `projections` path in the spec has NO `scoring` query parameter (the response echoes `scoring`, example "STD"); the project's workflow sends `scoring=STD`; whether other scoring values are honoured on projections is UNVERIFIED. `player-points` returns historical fantasy points that §2 excludes from the licence — do not use it on the public page.
- Scores: Q 9 / Cov 9 / Rel 8 / Lat ~7 / Hist ~4 / Doc 9 / DX 8 / Cost 7 / Lic 3 / Com 3 / RL 3 / NFL 9 = **6.6**
- Recommendation: PRIMARY (non-commercial, rankings/projections, aggregated outputs only) — best documented consensus source; keep publishing only derived values with the attribution; commercial use needs the sales contract.
- Verified: 2026-11-25 — downloaded the OpenAPI spec (HTTP 200, 155 KB; 11 paths), read the terms PDF (6 pages, last updated Oct. 27, 2020), read the api-data pricing text (curl, HTTP 200), read the MCP page. No keyed call made by this track.

### FantasyPros — MCP Server
- Links: https://www.fantasypros.com/mcp/ · docs via api-data page · terms not stated on page · GitHub: none
- Category · Class: AI-assistant tool access to rankings/projections/league sync · 🟢 Official (consumer product)
- Provides: "25+ tools" for NFL and MLB: ECR, ADP, projections, keeper values, injury news, depth charts, synced-league analysis; premium advice tools (start/sit, trade, waiver) need a paid plan.
- History · Live · Latency: UNVERIFIED · no · UNVERIFIED
- Coverage: NFL, MLB
- Technical: MCP · JSON · SDK: MCP clients · Auth: FantasyPros account · Rate limits: not stated · Pagination/Webhooks: n/a
- Cost: free: "Many of the MCP tools are free" with a free account · paid: premium for advice tools (price on the plans page, not read)
- Licensing: commercial: not stated · redistribution: not stated (consumer tool; treat as personal) · caching/storage: not stated · attribution: not stated · other restrictions: league tools require syncing your leagues (personal data)
- Quality: n/a for pipelines — a consumer assistant integration, not a data feed
- Scores: Q ~8 / Cov ~7 / Rel ~6 / Lat ~6 / Hist ~3 / Doc ~5 / DX ~6 / Cost ~8 / Lic ~2 / Com ~1 / RL ~5 / NFL 8 = **5.4**
- Recommendation: AVOID for the product pipeline (no data licence, personal-account tool); OPTIONAL as the owner's personal research aid.
- Verified: 2026-11-25 — read the MCP page; terms and limits not stated there.

### Sleeper — documented public API (v1)
- Links: https://sleeper.com · docs https://docs.sleeper.com/ · terms: the docs page (no separate API ToS found) · GitHub: community wrappers (e.g. dtsong/sleeper-api-wrapper, MIT)
- Category · Class: league platform + trending + player database · 🟢 Official (documented, no auth)
- Provides: users, leagues, rosters, users-in-league, matchups, playoff brackets, transactions, traded picks, drafts and picks, NFL state, full player map (`/players/nfl`, ~5 MB), trending adds/drops (`lookback_hours`, `limit`). No projections, stats or ADP are documented.
- History · Live · Latency: league history back to whatever seasons the league exists (league ids chain via `previous_league_id`; not re-probed here) · near-live (matchups/transactions update during games; cadence undocumented) · trending is real-time per registry
- Coverage: any public Sleeper league by id (no privacy gate: leagues are readable by id); all NFL players with injury fields and cross-ids (`espn_id`, `yahoo_id`, `rotowire_id`, `sportradar_id`, etc. per community docs — not re-verified this track)
- Technical: REST · JSON · SDK: none official · Auth: none ("no authentication", read-only) · Rate limits: "stay under 1000 API calls per minute" or risk IP block; `/players/nfl` "once per day at most" · Pagination/Webhooks: none / none
- Cost: free: yes · free tier: n/a · paid: commercial licence by contacting Sleeper (price not published) · est. monthly for a small app: $0
- Licensing: commercial: no — "free to use for non-commercial purposes"; commercial requires contacting Sleeper · redistribution: not addressed beyond non-commercial · caching/storage: docs ask you to store the player map on your own servers · attribution: required for trending data · other restrictions: read-only; reading other people's leagues by id is technically open but is personal data — only with that user's consent (project rule)
- Quality: accuracy good; completeness good for its own platform; reliability good (registry: wired Nov. 23, working); notes: league endpoints contain usernames/avatars (personal data).
- Scores: Q 8 / Cov 7 / Rel 8 / Lat 8 / Hist ~6 / Doc 7 / DX 9 / Cost 10 / Lic 5 / Com 3 / RL 9 / NFL 8 = **7.3**
- Recommendation: PRIMARY for trending (already used) and for any future opt-in "connect your Sleeper league" read-only feature; commercial use needs a Sleeper licence.
- Verified: 2026-11-25 — read docs.sleeper.com (endpoint list, 1,000/min, non-commercial, attribution for trending, no projections/stats/ADP documented). Trending endpoint already verified by the project on Nov. 23.

### Sleeper — undocumented projections and stats endpoints
- Links: none official; endpoints `https://api.sleeper.app/projections/nfl/<season>/<week>?season_type=regular&position[]=QB` and `https://api.sleeper.com/stats/nfl/<season>/<week>?season_type=regular&position[]=QB` (community-known)
- Category · Class: weekly projections, weekly stats, an ADP field · ⚫ Experimental/unstable (undocumented) — and the payload names third-party licensors
- Provides: per-player projected stat lines with `pts_std`, `pts_half_ppr`, `pts_ppr`, plus `adp_dd_ppr` and `pos_adp_dd_ppr` on projection rows; stats rows add `pts_idp`, positional ranks per scoring, quarter/half splits, red-zone attempts, air yards.
- History · Live · Latency: stats by week of the current season (older seasons UNVERIFIED) · stats updated after games (`last_modified`) · projections re-stamped the same day (`date` 2026-11-25)
- Coverage: probe returned 355 QB projection rows for week 12 and 75 QB stat rows for week 11 of 2026
- Technical: REST · JSON · SDK: none · Auth: none · Rate limits: presumably the same 1,000/min (UNVERIFIED) · Pagination/Webhooks: none
- Cost: free to call
- Licensing: commercial: no · redistribution: **no** — every projection row carries `"company":"rotowire"` and every stats row `"company":"sportradar"`, i.e. Sleeper's licensed suppliers; the documented API does not cover these paths, and the docs grant use only of the documented, non-commercial API · caching/storage: n/a · attribution: n/a · other restrictions: could break or be blocked without notice
- Quality: accuracy: RotoWire projections and Sportradar stats are professional sources · completeness good · reliability unknown (undocumented) · notes: useful only as a cross-check by the owner, never published.
- Scores: Q 8 / Cov 8 / Rel ~4 / Lat 8 / Hist ~4 / Doc 1 / DX 7 / Cost 10 / Lic 1 / Com 1 / RL ~7 / NFL 8 = **5.6**
- Recommendation: AVOID in production — undocumented and re-serves RotoWire/Sportradar data that Sleeper licenses; not permitted by public reachability.
- Verified: 2026-11-25 — one GET each: projections HTTP 200 (220 KB JSON, 355 rows, all `company: rotowire`); stats HTTP 200 (77 KB, 75 rows, all `company: sportradar`).

### Yahoo — Fantasy Sports API (v2)
- Links: https://sports.yahoo.com/developer (old developer.yahoo.com/fantasysports/guide/ now 308-redirects here) · docs https://sports.yahoo.com/developer/docs/ · terms: "API Access and Use Agreement" (signed via DocuSign after approval; text not public — UNVERIFIED) · GitHub: community clients (uberfastman/yfpy, whatadewitt/yahoo-fantasy-sports-api)
- Category · Class: league platform + player ownership/ADP · 🟢 Official (approval-gated)
- Provides: games, leagues, teams, rosters, matchups (with `team_projected_points`, `win_probability`), players with `percent_owned` and `draft_analysis` ("Average pick, Average round and Percent Drafted"), transactions; roster PUT exists in the docs; write scope for new apps was removed (community report Oct. 2025, yfpy #79).
- History · Live · Latency: past seasons via game keys (docs samples from 2019–2020) · near-live league scoring · not stated
- Coverage: Yahoo leagues the authorising user belongs to; Yahoo-wide ownership % and draft analysis per player
- Technical: REST · XML (JSON via `format=json`) · SDK: none official · Auth: OAuth 2.0 (user consent; scope `fspt-r` per community) · Rate limits: no numbers published; Yahoo "may temporarily throttle or limit access" on excessive use · Pagination/Webhooks: collection `start`/`count` (per docs, not re-verified) / none
- Cost: free: no fee stated · paid: none listed · est. monthly: $0, but approval required
- Licensing: commercial: governed by the signed agreement (text UNVERIFIED) · redistribution: docs bar developers to "separate its underlying data" from the API · caching/storage: UNVERIFIED · attribution: must show "Fantasy data provided by Yahoo Fantasy", link back, official logo rules · other restrictions: one developer account; no reverse engineering. **2026 change:** the portal became an apply-for-approval program (~May 2026 per a community Wayback reading); from July 22, 2026 unapproved and some approved apps got HTTP 403 "This application is not authorized" on every endpoint; reported approval path: application → DocuSign "API Access and Use Agreement" → enablement, 3–11 weeks (yfpy issue #84, 21 comments through Oct. 1, 2026). These are developer reports, not a Yahoo announcement.
- Quality: accurate platform data; reliability now depends on approval; Yahoo-wide ownership % is a useful public-interest signal but sits behind user OAuth
- Scores: Q 8 / Cov 6 / Rel 4 / Lat 7 / Hist 7 / Doc 6 / DX 3 / Cost 10 / Lic 3 / Com 3 / RL ~5 / NFL 7 = **5.8**
- Recommendation: OPTIONAL (future opt-in "connect your Yahoo league") — needs Yahoo approval and a signed agreement; not suitable for the static public page.
- Verified: 2026-11-25 — read sports.yahoo.com/developer, /developer/access/ and /developer/docs/ (HTTP 200); old legal page legal.yahoo.com/.../fantasysportsapi/ returns 404; read yfpy issues #84 and #79 via `gh api`. No OAuth attempted.

### ESPN — Fantasy "lm-api" (lm-api-reads.fantasy.espn.com)
- Links: https://fantasy.espn.com · docs: none official · terms https://disneytermsofuse.com/english/ · GitHub: community clients (cwendt94/espn-api, ffscrapr ESPN functions)
- Category · Class: league platform, player projections/ownership (kona views) · 🟠 Unofficial but commonly used (private leagues: cookie-based = AVOID)
- Provides: game/season metadata, league views (`mTeam`, `mRoster`, `mMatchup`, `kona_player_info` with ESPN projections and ownership) — paths from community docs, not re-probed beyond one call
- History · Live · Latency: multiple seasons (community) · live league scoring · seconds–minutes
- Coverage: ESPN leagues; since 2026 also the NFL's official fantasy game (see NFL Fantasy entry)
- Technical: REST · JSON · SDK: none · Auth: none for public leagues; private leagues need the user's `espn_s2`/`SWID` cookies — never use · Rate limits: none published · Pagination/Webhooks: `x-fantasy-filter` header (community) / none
- Cost: free to call
- Licensing: commercial: no · redistribution: no · caching/storage: no · attribution: n/a · other restrictions: Disney ToU bars automated access and dataset building (registry, Nov. 21); no API keys issued since 2014
- Quality: good data, undocumented, changes without notice (host moved from fantasy.espn.com to lm-api-reads in 2024 per community)
- Scores: Q 8 / Cov 8 / Rel ~5 / Lat 8 / Hist ~6 / Doc 2 / DX 5 / Cost 10 / Lic 1 / Com 1 / RL ~5 / NFL 8 = **5.6**
- Recommendation: AVOID — no licence; cookie use would mean handling user credentials.
- Verified: 2026-11-25 — one GET `.../apis/v3/games/ffl/seasons/2026` → HTTP 200, 202 B JSON (`"name":"Fantasy Football 2026","currentScoringPeriod":{"id":12}`).

### NFL — NFL Fantasy (fantasy.nfl.com) and api.fantasy.nfl.com
- Links: https://espnpressroom.com/feature/nfl-fantasy-is-moving-to-espn-fantasy-your-questions-answered/ (July 16, 2026) · API: none
- Category · Class: league platform · ⚫ Discontinued
- Provides: nothing now. ESPN press room (July 16, 2026): starting the 2026 season the NFL no longer runs a season-long game; ESPN Fantasy is "the official fantasy game of the NFL"; leagues import via espn.com/importnfl. Part of ESPN's acquisition of NFL media assets (closed early 2026 per AP/Fox Sports reports in search results; not read in full).
- History · Live · Latency: n/a · n/a · n/a
- Coverage: none
- Technical: `https://api.fantasy.nfl.com/v1/players/stats?...` now 301-redirects to `https://www.nfl.com/news/series/fantasy` (HTML)
- Cost: n/a · Licensing: n/a
- Quality: n/a
- Scores: Q 1 / Cov 1 / Rel 1 / Lat 1 / Hist 1 / Doc 1 / DX 1 / Cost 10 / Lic 1 / Com 1 / RL 1 / NFL 1 = **1.8**
- Recommendation: AVOID — the API and platform are gone; remove from any plans.
- Verified: 2026-11-25 — one GET to api.fantasy.nfl.com → HTTP 301 to nfl.com fantasy news; read the ESPN press-room Q&A.

### CBS Sports — Fantasy API v3 (api.cbssports.com/fantasy)
- Links: https://www.cbssports.com/fantasy/ · docs: none current found (community gem calls the API "deprecated, but still available") · terms https://legal.paramount.com/us/en/cbsi/terms-of-use (registry: bars unauthorised scraping and redistribution) · GitHub: geoffharcourt/cbs_fantasy_sports_api_token_fetcher (MIT, last push 2017)
- Category · Class: league platform + player list · 🟠 Unofficial/deprecated
- Provides: `/players/list` returned the full player list incl. team "TQB"-type entries, headlines, CBS/Elias ids; league resources need a league token
- History · Live · Latency: UNVERIFIED
- Coverage: CBS leagues; all NFL players
- Technical: REST · JSON · SDK: none · Auth: league `access_token` for league data; player list answered without one · Rate limits: none published
- Cost: free to call
- Licensing: commercial: no · redistribution: no (CBSi terms) · attribution: n/a · other restrictions: no developer terms found
- Quality: unknown upkeep
- Scores: Q ~6 / Cov 6 / Rel ~3 / Lat ~6 / Hist ~3 / Doc 1 / DX 3 / Cost 10 / Lic 1 / Com 1 / RL ~4 / NFL 6 = **4.2**
- Recommendation: AVOID — deprecated, undocumented, no grant of use.
- Verified: 2026-11-25 — one GET `/fantasy/players/list?version=3.0&SPORT=football&response_format=JSON` → HTTP 200, 1.7 MB JSON.

### MyFantasyLeague (MFL) — Developers API (export)
- Links: https://api.myfantasyleague.com/2026/api_info · reference https://api.myfantasyleague.com/2026/api_info?STATE=details · terms: same page ("General Rules and Terms of Service") · GitHub: ffscrapr (MIT) has MFL functions
- Category · Class: league platform + public ADP/AAV + expert ranks · 🟢 Official
- Provides: `players`, `playerProfile` (incl. ADP rank), `adp` (average/min/max pick, drafts selected; filters `PERIOD` ALL/RECENT/DRAFT/JUNE/JULY/AUG1/AUG15/START/MID/PLAYOFF, plus PPR/keeper/mock/franchise-count filters), `aav` (average auction value per $1000), `playerRanks` (FantasySharks expert ranks), `projectedScores` (league-scored FantasySharks projections), injuries, NFL schedule, league exports; imports with auth
- History · Live · Latency: per-year paths back many seasons (URL is per year; depth UNVERIFIED) · league live scoring · ADP `timestamp` per call; player database "only changed once a day"
- Coverage: MFL user drafts only (probe: 27 drafts, 244 players in the default period on Nov. 25 — off-season-sized sample); MFL is strongest in dynasty/salary-cap leagues
- Technical: REST · XML/JSON (`JSON=1`) · SDK: none · Auth: none for public exports; cookie or user API key for private leagues · Rate limits: per-IP throttling, registered clients "about 2.5X" more; "Wait one second between making requests"; 429 on throttle; register a client and send its User-Agent · Pagination/Webhooks: none
- Cost: free: yes · paid: none for API (MFL league fees are separate)
- Licensing: commercial: "free to anyone to use in almost any way" except forbidden uses (harvesting league/user data, overloading, browser JS from other domains) — no explicit commercial bar found · redistribution: not addressed; MFL says it "can not and will not" provide raw NFL stats or third-party content (news) · caching/storage: caching recommended · attribution: not required by the page (credit anyway) · other restrictions: terms "may be changed at any time"
- Quality: accurate for its drafts; small, platform-specific sample; FantasySharks ranks/projections are third-party content whose redistribution MFL does not license
- Scores: Q 6 / Cov 5 / Rel 7 / Lat 6 / Hist 6 / Doc 7 / DX 6 / Cost 10 / Lic 7 / Com 6 / RL 6 / NFL 7 = **6.6**
- Recommendation: SECONDARY for ADP/AAV (the most permissively licensed platform ADP found); register a client User-Agent first; do not republish `playerRanks`/`projectedScores` (FantasySharks content).
- Verified: 2026-11-25 — read api_info and the request reference (HTTP 200); one GET `2026/export?TYPE=adp&JSON=1` → HTTP 200, 30 KB, 244 players, `totalDrafts` 27.

### Fleaflicker — API
- Links: https://www.fleaflicker.com/api-docs/index.html · terms: none found on the docs page (`/help/terms` → 404) · GitHub: ffscrapr (MIT) has Fleaflicker functions
- Category · Class: league platform · 🟢 Official (documented) — terms UNVERIFIED
- Provides: FetchLeagueActivity, Boxscore, DraftBoard, Rosters, Rules, Scoreboard, Standings, Transactions, PlayerListing, Roster, TeamPicks, Trades, UserLeagues; schemas include injuries, news items, `ExternalIdMapping`
- History · Live · Latency: UNVERIFIED · live league data · UNVERIFIED
- Coverage: Fleaflicker leagues (small platform)
- Technical: REST · JSON · SDK: none · Auth: none for public reads (per ffscrapr; UNVERIFIED here) · Rate limits: none published
- Cost: free
- Licensing: commercial/redistribution/attribution: UNVERIFIED (no terms found)
- Quality: niche platform
- Scores: Q 6 / Cov 3 / Rel ~6 / Lat 7 / Hist ~5 / Doc 6 / DX 6 / Cost 10 / Lic ~4 / Com ~3 / RL ~5 / NFL 5 = **5.5**
- Recommendation: OPTIONAL (only for an opt-in league connector, after the owner reads the site terms).
- Verified: 2026-11-25 — fetched the API docs (HTTP 200, path list read); no data call.

### Fantrax — no public API
- Links: https://www.fantrax.com · docs: none official · GitHub: meisnate12/FantraxAPI ("unofficial Python bindings", docs at fantraxapi.kometa.wiki)
- Category · Class: league platform · 🔴 Scraping/unofficial (logged-in session for private leagues)
- Provides: league data via the web app's internal calls (community)
- Scores: Q ~6 / Cov 3 / Rel ~3 / Lat ~6 / Hist ~3 / Doc 2 / DX 3 / Cost 10 / Lic 1 / Com 1 / RL ~3 / NFL 4 = **3.8**
- Recommendation: AVOID — no documented API or grant.
- Verified: 2026-11-25 — web search only (no official developer page found); not probed. Terms UNVERIFIED.

### Underdog Fantasy — pick'em lines, best-ball ADP
- Links: https://underdogfantasy.com · terms https://legal.underdogsports.com/?g=42203 (Version 8.1, "Effective November 23rd 2026"; intro says updated Nov. 12, 2026) · API: none public
- Category · Class: best-ball ADP, pick'em lines · 🔴 Scraping (internal app API)
- Provides: best-ball ADP visible in the app and as a rankings CSV upload/download on the Rankings tab (community/ETR instructions; needs an account); pick'em lines via the app's internal `api.underdogfantasy.com/beta/v5/over_under_lines`
- History · Live · Latency: none official · live lines · n/a
- Technical: internal REST/JSON; probe answered HTTP 426 "A new version is required to continue" (app-version gate — not bypassed)
- Cost: free in app
- Licensing: terms §6(ix) bar automated scraping ("using any robot, spider, scraper, web crawler"), §6(x) bar circumventing access limits; §11 IP reserved
- Quality: Underdog ADP is the market reference for best ball
- Scores: Q 8 / Cov 6 / Rel 2 / Lat 8 / Hist 2 / Doc 1 / DX 2 / Cost 8 / Lic 1 / Com 1 / RL 1 / NFL 7 = **3.9**
- Recommendation: AVOID for automation. Best-ball ADP can be cited from licensed aggregators (FantasyPros `BESTADP` ranking type) instead.
- Verified: 2026-11-25 — read the terms (WebFetch, first 100K chars); one GET to the lines endpoint → 426.

### PrizePicks — projections (pick'em lines)
- Links: https://www.prizepicks.com · terms https://www.prizepicks.com/help-center/terms-of-service (last updated Oct. 19, 2026; effective Aug. 3, 2026) · API: none public (community uses api.prizepicks.com / partner-api.prizepicks.com `/projections`)
- Category · Class: pick'em lines · 🔴 Scraping
- Provides: player-prop "projections" (lines) by league
- Technical: probe `api.prizepicks.com/projections?league_id=9` → HTTP 403 with a JavaScript bot-check page ("Please enable JS and disable any ad blocker") — not bypassed
- Licensing: terms bar "any robot, spider, or other automatic device" to access the site, "including monitoring or copying any of the material"; real-money product, state-restricted (18/19/21+)
- Scores: Q 7 / Cov 6 / Rel 1 / Lat 8 / Hist 1 / Doc 1 / DX 1 / Cost 8 / Lic 1 / Com 1 / RL 1 / NFL 6 = **3.5**
- Recommendation: AVOID — bot-protected and prohibited; also gambling-adjacent content the project does not need.
- Verified: 2026-11-25 — read terms (curl, HTTP 200); one GET → 403 bot check.

### DraftKings — DFS lobby, draftables, salary CSV
- Links: https://www.draftkings.com · terms https://myaccount.draftkings.com/documents/us-terms-of-use ("Last Updated 06/30/2026") · API: none public
- Category · Class: DFS salaries/contests · 🔴 Scraping (internal endpoints)
- Provides: lobby JSON (`www.draftkings.com/lobby/getcontests?sport=NFL`: Contests, DraftGroups, GameTypes …), draftables (`api.draftkings.com/draftgroups/v1/draftgroups/<id>/draftables`: salaries), and a per-slate salary CSV download in the lobby
- History · Live · Latency: current slates only · live · n/a
- Technical: probe lobby → HTTP 200, 10.7 MB JSON, 58 NFL draft groups and 14,001 contests; draftables → HTTP 403 "Access Denied" (Akamai) — not bypassed
- Licensing: terms bar "automated means" (bots, parsers, spiders, screen scrapers) "to obtain, collect or access any information"
- Scores: Q 9 / Cov 7 / Rel 2 / Lat 9 / Hist 1 / Doc 1 / DX 2 / Cost 8 / Lic 1 / Com 1 / RL 1 / NFL 7 = **4.1**
- Recommendation: AVOID automated use. Licensed DFS salaries come from SportsDataIO (DFS slates) or similar.
- Verified: 2026-11-25 — read terms (curl); one GET each to lobby (200) and draftables (403).

### FanDuel — DFS
- Links: https://www.fanduel.com · terms https://www.fanduel.com/terms · API: none public
- Category · Class: DFS salaries · 🔴 Scraping
- Licensing: terms bar "any robot, spider, scraper, sniping software or other automated means" without FanDuel's express written permission (RSS feeds excepted)
- Scores: Q 9 / Cov 7 / Rel 2 / Lat 9 / Hist 1 / Doc 1 / DX 2 / Cost 8 / Lic 1 / Com 1 / RL 1 / NFL 7 = **4.1**
- Recommendation: AVOID (written permission required).
- Verified: 2026-11-25 — read terms (curl, HTTP 200); no endpoint probed.

### Yahoo — Daily Fantasy (DFS)
- Links: https://ca.help.yahoo.com/kb/daily-fantasy (help pages still live) · API: none found; the Fantasy Sports API does not document DFS resources
- Category · Class: DFS · ⚫ / 🔴 (no API)
- Notes: no report of a full US shutdown found (searches returned 2016 state exits and a UK exit); status as of Nov. 2026 UNVERIFIED.
- Scores: Q ~6 / Cov 3 / Rel 1 / Lat ~5 / Hist 1 / Doc 1 / DX 1 / Cost 8 / Lic 1 / Com 1 / RL 1 / NFL 4 = **2.8**
- Recommendation: AVOID — no data access route.
- Verified: UNVERIFIED (search only; product status not confirmed).

### Fantasy Football Calculator — ADP REST API
- Links: https://fantasyfootballcalculator.com · docs https://help.fantasyfootballcalculator.com/article/42-adp-rest-api (old URL /resources/average-draft-position-api/ 301-redirects there) · terms: the docs page itself · GitHub: none
- Category · Class: ADP (mock-draft based) · 🟢 Official (documented, keyless)
- Provides: `/api/v1/adp/<format>?teams=<n>&year=<yyyy>` (+ position filter per the page); format values seen in community use and confirmed here for `ppr` (docs example: `standard`); half-PPR, 2QB, dynasty, rookie formats exist on the site but were not probed (UNVERIFIED as API values). Fields: `player_id, name, position, team, adp, adp_formatted, times_drafted, high, low, stdev, bye`; `meta` gives `type, teams, rounds, total_drafts, start_date, end_date`.
- History · Live · Latency: `year` parameter (past seasons; depth UNVERIFIED) · no · "The data only updates once per day"; the 2026 PPR 12-team window ended 2026-09-15 (733 drafts), i.e. ADP freezes after draft season
- Coverage: mock drafts on FFC (sample size reported per call)
- Technical: REST · JSON (served as `text/html` content type) · SDK: none · Auth: none · Rate limits: none numeric, "Please do not call this API too frequently" · Pagination/Webhooks: none
- Cost: free: yes, "free for personal and commercial use" · paid: none
- Licensing: commercial: yes (page) · redistribution: not addressed beyond the free-use statement · caching/storage: not addressed (daily data → cache daily) · attribution: "requests" a link or mention · other restrictions: page "Last updated on July 17, 2018" — terms could change without notice
- Quality: mock drafts (not real-money or real-league) — lower signal than Underdog/Sleeper real drafts; sample size and stdev reported
- Scores: Q 6 / Cov 6 / Rel 7 / Lat 5 / Hist 6 / Doc 5 / DX 8 / Cost 10 / Lic 9 / Com 8 / RL 7 / NFL 7 = **7.0**
- Recommendation: PRIMARY for ADP on the public page (only ADP source found with an explicit commercial grant and no key); show sample size and window dates; credit with a link.
- Verified: 2026-11-25 — read the docs page; one GET `/api/v1/adp/ppr?teams=12&year=2026` → HTTP 200, 193 players, 733 drafts, window 2026-09-08..09-15.

### FantasyCalc — trade values (api.fantasycalc.com)
- Links: https://fantasycalc.com · docs: none · terms: none found (site is a single-page app; /terms returns the same shell) · GitHub: none official
- Category · Class: redraft/dynasty trade values (from real trades) · 🟠 Unofficial but commonly used (undocumented endpoint)
- Provides: `/values/current?isDynasty=&numQbs=&numTeams=&ppr=` → per player `value`, `redraftValue`, `combinedValue`, `overallRank`, `positionRank`, `trend30Day`, `maybeTier`, `maybeAdp`, `maybeTradeFrequency`, `maybeRosterPercent`, plus ids (`sleeperId`, `espnId`, `mflId`, `fleaflickerId`, `ffpcId`)
- History · Live · Latency: current only · no · daily-ish (UNVERIFIED)
- Coverage: 423 players in the dynasty superflex 12-team PPR probe
- Technical: REST · JSON · Auth: none · Rate limits: none published
- Cost: free to call
- Licensing: no grant found → not permitted to republish by default; values are derived from users' trades on Sleeper and others (whose API terms are non-commercial)
- Quality: market-based, widely cited in dynasty; methodology not documented in an API
- Scores: Q 7 / Cov 6 / Rel ~5 / Lat 7 / Hist 2 / Doc 1 / DX 7 / Cost 10 / Lic 2 / Com 2 / RL ~5 / NFL 6 = **5.0**
- Recommendation: AVOID for publishing until FantasyCalc grants permission in writing; acceptable as the owner's private cross-check.
- Verified: 2026-11-25 — one GET → HTTP 200, 331 KB JSON, 423 rows; site terms not found.

### Dynasty Dealer — player values API
- Links: https://www.dynastydealer.com · docs: author's post https://dev.to/elliotpollaro/a-free-keyless-api-for-dynasty-fantasy-football-values-built-from-672k-real-trades-26mg (June 12, 2026 per page metadata) · terms: the post (site terms not readable: SPA)
- Category · Class: dynasty/redraft trade values · 🟠 Unofficial (small independent provider)
- Provides: `/api/player-values` (`position`, `perSlot`, `format` incl. `redraft`, `scoring`, `sf`) → `sleeper_id, name, position, team, base_value, current_value, votes, updated_at, age`
- History · Live · Latency: current · no · "recalculates from new trades daily"; probe rows stamped 2026-11-25T22:06Z
- Coverage: values computed from 672k+ Sleeper trades (per post)
- Technical: REST · JSON · Auth: none, CORS enabled · Rate limits: none numeric; 60 s edge cache; cache daily
- Cost: free
- Licensing: post says "Free for any use — personal, commercial, or content" with a visible link to dynastydealer.com · caveat (inference): the underlying data are Sleeper trades read through Sleeper's non-commercial API, so the commercial grant may not be Dynasty Dealer's to give
- Quality: young single-developer service; vote adjustments in `current_value`
- Scores: Q 6 / Cov 6 / Rel ~4 / Lat 7 / Hist 1 / Doc 4 / DX 8 / Cost 10 / Lic 7 / Com 5 / RL ~6 / NFL 6 = **5.8**
- Recommendation: OPTIONAL (non-commercial page, with link credit); not for commercial use without clarifying the Sleeper chain.
- Verified: 2026-11-25 — read the post; one GET `?position=QB` → HTTP 200, 110 KB JSON.

### Roster Audit — dynasty values / trade API
- Links: https://rosteraudit.com/developers/ · terms: same page ("No contracts, no fine print")
- Category · Class: dynasty values, pick values, trade calculator, projections · 🟠 Unofficial (small independent provider, documented)
- Provides: `wp-json/ra/v1` `/rankings`, `/rankings/values`, `/picks`, `/players/{sleeper_id}`, `/projections/...`, `POST /trade/calculate` (key), league history for synced leagues
- Technical: REST · JSON · Auth: none for most; free key (`X-RA-Key`) for some · Rate limits: 200/min on most URLs; 100/h trade calc; 5,000/day per key; descriptive User-Agent required
- Cost: free
- Licensing: attribution requested ("link back to rosteraudit.com"); keys that strip attribution may be revoked; commercial use not addressed; values from "real trades across thousands of Sleeper leagues"; stats "sourced from NFLverse"
- Scores: Q 6 / Cov 6 / Rel ~4 / Lat 7 / Hist 2 / Doc 6 / DX 7 / Cost 10 / Lic 5 / Com 4 / RL 7 / NFL 6 = **5.8**
- Recommendation: OPTIONAL (second dynasty-value opinion for a non-commercial page).
- Verified: 2026-11-25 — read the developers page only; not probed.

### KeepTradeCut — dynasty values
- Links: https://keeptradecut.com · terms https://keeptradecut.com/terms-and-conditions · API: none
- Category · Class: crowdsourced + trade-sourced dynasty/redraft values · 🔴 Scraping only
- Licensing: T&C §2.1 prohibit "Any form of automated data collection" incl. web scraping and data mining; §2.2 "You may not use our data, content, or materials on any other website"; §5 licence is personal use only. robots.txt disallows ranking `histories` and `player-pool` paths.
- Scores: Q 8 / Cov 7 / Rel 2 / Lat 6 / Hist 2 / Doc 1 / DX 2 / Cost 10 / Lic 1 / Com 1 / RL 1 / NFL 7 = **4.0**
- Recommendation: AVOID — explicitly prohibited.
- Verified: 2026-11-25 — read T&C and robots.txt (curl, HTTP 200).

### DynastyProcess — open data repo (db_playerids, db_fpecr, values)
- Links: https://github.com/dynastyprocess/data · licence GPL-3.0 (repo)
- Category · Class: player-id crosswalk, FantasyPros ECR archive, dynasty values · 🔵 Public/open (ids) / 🔴 Scraping-derived (ECR, values)
- Provides: `db_playerids.csv` (cross-platform ids), `db_fpecr*.{csv.gz,parquet,rds}` (FantasyPros ECR archive), `fp_latest_weekly`, `values*.csv`
- History · Live · Latency: ECR archive multi-season · no · weekly Actions (`weekly-fantasypros`, `weekly-playerids`, `weekly-playervalues`) and a daily weekly-ECR job; last push 2026-11-25
- Technical: files on GitHub · CSV/parquet/RDS · Auth: none
- Licensing: repo GPL-3.0 (applying GPL to data is unclear, as the project's GITHUB_RESEARCH already notes). **New finding:** the `weekly-fantasypros` workflow runs a step named "Scrape FantasyPros" (`R/fantasypros/ecr-scraper.R`, private repo) with a `SCRAPEOPS_API_KEY` secret — the ECR files are scraped from FantasyPros, whose site terms (§6) bar republishing without written permission and whose API terms (§2(c)) bar giving third parties access. `values.csv` is built on that ECR.
- Scores: Q 8 / Cov 8 / Rel 7 / Lat 4 / Hist 8 / Doc 5 / DX 7 / Cost 10 / Lic 2 / Com 1 / RL 9 / NFL 8 = **6.4**
- Recommendation: AVOID the ECR/values files (scraped FantasyPros content); ids not needed because nflverse `players.csv` (CC-BY-4.0) already covers the crosswalk (FEATURE_RESEARCH §5).
- Verified: 2026-11-25 — `gh api` repo metadata, README, file list and the weekly-fantasypros workflow.

### nflverse/nflreadr — `load_ff_playerids`, `load_ff_rankings`, `load_ff_opportunity`
- Links: https://github.com/nflverse/nflreadr/blob/main/R/load_ffverse.R (MIT code)
- Category · Class: R loaders (not data owners) · 🔵 Public/open wrappers
- Upstreams (from the source file): `load_ff_playerids()` → `dynastyprocess/data/files/db_playerids.rds` (GPL-3.0 repo); `load_ff_rankings(type = draft|week|all)` → `db_fpecr_latest.rds`, `fp_latest_weekly.rds`, `db_fpecr.rds` from DynastyProcess, with "@seealso fantasypros.com for the source of data" (scraped FantasyPros ECR — see above); `load_ff_opportunity()` → `ffverse/ffopportunity` release `{model_version}-data/ep_{weekly|pbp_pass|pbp_rush}_{season}.rds`.
- Licensing: the loader code is MIT, but the data keep their upstream terms: ids GPL-3.0 (DynastyProcess), rankings = FantasyPros content (not licensed for republication), opportunity = CC-BY-SA-4.0 (ffopportunity).
- Scores: n/a (scored per upstream)
- Recommendation: use only `load_ff_opportunity`'s upstream (ffopportunity) on a public page; AVOID republishing `load_ff_rankings` output.
- Verified: 2026-11-25 — read `R/load_ffverse.R` via `gh api`.

### ffverse — ffopportunity (expected fantasy points)
- Links: https://github.com/ffverse/ffopportunity · https://ffopportunity.ffverse.com · releases `latest-data`, `v1.0.0-data`
- Category · Class: usage/opportunity model output (expected fantasy points) · 🔵 Public/open data
- Provides: `ep_weekly_<season>`, `ep_pbp_pass_<season>`, `ep_pbp_rush_<season>` in CSV/parquet/RDS — expected vs actual fantasy points per player-week and per play (xgboost models trained on nflverse play-by-play 2006–2020, per README)
- History · Live · Latency: seasons back to 2006 (191 assets per release) · no · 2026 files updated 2026-11-24T16:25Z (weekly cadence in season)
- Coverage: all offensive skill players in nflverse pbp
- Technical: GitHub release files · CSV/parquet/RDS · Auth: none · Rate limits: GitHub's
- Cost: free
- Licensing: code GPL-3; "models and expected points data … licensed under" CC BY-SA 4.0 (README "Terms of Use") — commercial use allowed with attribution; derived datasets that adapt it must be shared alike
- Quality: established community model (Tan Ho / ffverse); model version v1.0.0 since 2022 — not retrained on recent seasons (inference from release tags)
- Scores: Q 7 / Cov 8 / Rel 7 / Lat 4 / Hist 9 / Doc 7 / DX 7 / Cost 10 / Lic 7 / Com 7 / RL 9 / NFL 9 = **7.6**
- Recommendation: PRIMARY for expected fantasy points (display with "ffopportunity via nflverse, CC BY-SA 4.0"); keep it a separate file so share-alike does not reach our other data. Do not copy the GPL R code; recompute in JS only from the published method if needed.
- Verified: 2026-11-25 — `gh api` repo, releases (asset names, sizes, update times), README licence section, DESCRIPTION (`GPL (>= 3)`).

### ffverse — ffpros (R package)
- Links: https://github.com/ffverse/ffpros (DESCRIPTION: `MIT + file LICENSE`; GitHub shows NOASSERTION; last push 2025-10-26)
- Category · Class: scraper of FantasyPros.com pages · 🔴 Scraping
- Licensing: code MIT, but its purpose ("Retrieves Data from FantasyPros") conflicts with FantasyPros site terms §6 (no republishing without written permission) and §19 (no commercial use)
- Scores: Q 8 / Cov 8 / Rel 4 / Lat 6 / Hist 5 / Doc 6 / DX 6 / Cost 10 / Lic 1 / Com 1 / RL 3 / NFL 8 = **5.5**
- Recommendation: AVOID — the project already holds a FantasyPros API key, the lawful route.
- Verified: 2026-11-25 — `gh api` repo + DESCRIPTION; FantasyPros legal page read via WebFetch.

### FantasyFootballAnalytics — ffanalytics (R package)
- Links: https://github.com/FantasyFootballAnalytics/ffanalytics (DESCRIPTION `License: GPL`; GitHub no SPDX; 192 stars; pushed 2026-09-09)
- Category · Class: projection aggregator by scraping · 🔴 Scraping
- Provides: seasonal scrapes from CBS, ESPN, FantasyPros, FantasySharks, FFToday, NumberFire, FantasyFootballNerd, NFL, RTSports, Walterfootball; weekly also FleaFlicker; ADP/AAV add-ons; 2-second waits between pages
- Licensing: each source's terms apply; several (ESPN/Disney, CBS/Paramount, FantasyPros site) bar scraping or republication; GPL code cannot be copied into the static page
- Scores: Q 7 / Cov 9 / Rel 3 / Lat 5 / Hist 4 / Doc 6 / DX 5 / Cost 10 / Lic 1 / Com 1 / RL 3 / NFL 8 = **5.2**
- Recommendation: AVOID as a data source; REF for the aggregation method (weighted average, robust average, floors/ceilings), reimplemented ourselves on permitted inputs.
- Verified: 2026-11-25 — `gh api` README + DESCRIPTION.

### ffverse — ffscrapr (R package)
- Links: https://github.com/ffverse/ffscrapr (DESCRIPTION `MIT + file LICENSE`; last push 2024-11-01)
- Category · Class: league-platform API client (MFL, Sleeper, Fleaflicker, ESPN) · 🔵 open code (data terms per platform)
- Scores: n/a (code library; data terms per platform)
- Recommendation: REF only (endpoint shapes); our Node code calls documented endpoints directly.
- Verified: 2026-11-25 — `gh api` repo + DESCRIPTION.

### Fantasy Nerds — Fantasy Sports API
- Links: https://api.fantasynerds.com · docs https://api.fantasynerds.com/docs/nfl · pricing https://api.fantasynerds.com/getting-started/pricing · terms https://www.fantasynerds.com/terms · FAQ https://api.fantasynerds.com/getting-started/faq
- Category · Class: rankings, projections, ADP, DFS, injuries, depth charts, news · 🟡 Licensed/commercial
- Provides (NFL v1 paths): `adp` (formats std, ppr, half, superflex; teams 8–16), `auction`, `bestball`, `draft-rankings`, `draft-projections`, `dynasty`, `weekly-rankings`, `weekly-projections`, `ros`, `tiers`, `idp-draft`, `idp-weekly`, `dfs-slates`, `dfs` (FanDuel, DraftKings, Yahoo salaries + FN projected points), `injuries`, `depth`, `news`, `add-drops`, `defense-rankings`, `leaders`, `weather`, `playoffs`, `nfl-picks`, `players`, `schedule`, `standings`, `teams`, `byes`
- History · Live · Latency: current season (history UNVERIFIED) · no · UNVERIFIED
- Coverage: NFL (+MLB, NBA)
- Technical: REST · JSON · Auth: `apikey` query parameter (no CORS; FAQ warns not to expose the key on a public site) · Rate limits: "default limits are usually more than enough"; rate-limited responses may still be HTTP 200 with an Error node · test key `TEST` returns sample data
- Cost: free: test data only · paid: Standard $499/year (personal, hobby, or commercial use by businesses under 1,000 paying customers or under $500K annual revenue, per the pricing page); Extended Commercial $2,999/year (above both thresholds) · est. monthly: ~$42 (Standard, annual)
- Licensing: commercial: yes (by tier) · redistribution: UNVERIFIED beyond display in your product (API-specific terms not found; website terms allow personal, noncommercial copying unless FN grants commercial permission) · attribution: UNVERIFIED · other: auto-renewing, no refunds
- Quality: single vendor; how its rankings are built (consensus vs own) not verified this track
- Scores: Q 6 / Cov 8 / Rel 6 / Lat ~6 / Hist ~3 / Doc 7 / DX 7 / Cost 5 / Lic 6 / Com 7 / RL ~6 / NFL 8 = **6.3**
- Recommendation: SECONDARY (cheapest explicit commercial licence for rankings/projections/ADP/DFS found); PRIMARY candidate for a small commercial product.
- Verified: 2026-11-25 — curl of docs, pricing, FAQ and site terms (HTTP 200); no keyed call.

### SportsDataIO — Fantasy feeds (projections, DFS salaries/slates, ownership projections, ADP) and Discovery Lab
- Links: https://sportsdata.io/developers/api-documentation/nfl · coverage https://sportsdata.io/developers/coverages/nfl · pricing https://sportsdata.io/pricing · personal https://discoverylab.sportsdata.io/personal-use-apis/nfl · terms https://discoverylab.sportsdata.io/terms-of-service
- Category · Class: projections, DFS salaries/slates, ownership projections, season projections with ADP, injuries, stats · 🟡 Licensed/commercial
- Provides: "proprietary projections, including DFS salary information and injuries" by week/team (5-min call interval), season projections with ADP, IDP projections, fantasy defense projections, DFS slates, "DFS Slate Ownership Projections - by Slate" (GPP ownership, initial ~48 h before Sunday games, updated hourly), injuries (5 min), box-score deltas (3 s)
- History · Live · Latency: Discovery Lab: "Current Season + Last 3 Years"; projections delivered 72 h before game, stats "6am ET next day" · commercial: live (call intervals seconds–minutes)
- Coverage: full NFL; DFS operators (DraftKings, FanDuel, Yahoo per third-party summary — UNVERIFIED on the official page)
- Technical: REST · JSON/XML/CSV · Auth: key (`key` param / header) · Rate limits: Discovery Lab Fantasy 100 calls/day (Fantasy + Odds 1,000/day); commercial per contract · free trial: only UEFA Champions League per the docs
- Cost: Discovery Lab NFL (personal use): Fantasy $99/month or $599/year; Fantasy + Odds $149/month or $899/year; last season free; commercial: "Our licenses are for commercial use" — quote via sales (no list price)
- Licensing: Discovery Lab is for "a personal, non-commercial project"; whether a public non-commercial page may display it is not stated in its ToS (UNVERIFIED — ask sales); commercial licence via contract
- Quality: professional vendor with SLA on commercial plans; projections are proprietary (one model, not a consensus)
- Scores: Q 8 / Cov 9 / Rel 8 / Lat 8 / Hist 7 / Doc 8 / DX 7 / Cost 3 / Lic 5 / Com 8 / RL 5 / NFL 9 = **7.1**
- Recommendation: SECONDARY now (only if the owner wants DFS salaries/ownership and confirms public display); PRIMARY for a commercial product needing projections + DFS + ownership under one contract.
- Verified: 2026-11-25 — curl of the coverage page (endpoint list and ownership text), pricing page (commercial-only, Discovery Lab for personal), Discovery Lab NFL page (prices parsed from the embedded `PersonalUseApisModel` JSON), Discovery Lab ToS.

### FantasyData (fantasydata.com)
- Links: https://fantasydata.com · terms linked from the site footer (not read)
- Category · Class: consumer fantasy site (projections, DFS tools, news) · 🟡 Licensed (consumer subscription)
- Notes: footer "Copyright © 2025 FantasyData LLC"; SportsDataIO's Discovery Lab page runs an Angular module named `fantasydata`, consistent with FantasyData being SportsDataIO's former name/consumer brand (inference; corporate relationship not verified this track). `fantasydata.com/api` → 404. The data API is SportsDataIO (above).
- Scores: Q ~7 / Cov 7 / Rel ~6 / Lat ~6 / Hist ~5 / Doc 2 / DX 2 / Cost ~5 / Lic 2 / Com 2 / RL 1 / NFL 7 = **4.3**
- Recommendation: AVOID as a separate source — use SportsDataIO's API if this data is wanted.
- Verified: 2026-11-25 — curl of homepage (HTTP 200) and /api (404).

### RotoWire — data partnerships (projections, news, injuries, lineups)
- Links: https://www.rotowire.com/partner/ ("API" in the site footer points here)
- Category · Class: licensed projections/news/injuries · 🟡 Licensed/commercial
- Provides: player news, injuries "with context and fantasy impact analysis", lineups, projections; lists partners incl. ESPN, Yahoo Sports, DraftKings, FanDuel, Underdog, Sleeper, NFL.com, CBS Sports ("Trusted by 100+ companies")
- Cost: contact form / "Schedule a Call" — no list price
- Licensing: B2B licence; site footer: content "sub-licensed to Roto Sports Inc."; portions copyright STATS LLC with commercial use barred without STATS consent
- Notes: corroborates that Sleeper's undocumented projections (`company: rotowire`) are RotoWire-licensed content.
- Scores: Q 8 / Cov 8 / Rel 8 / Lat 8 / Hist ~5 / Doc ~3 / DX ~4 / Cost 2 / Lic 4 / Com 7 / RL ~6 / NFL 9 = **6.0**
- Recommendation: OPTIONAL (commercial phase: candidate for projections + news + injuries under one licence; quote needed).
- Verified: 2026-11-25 — curl of the partner page (HTTP 200); pricing UNVERIFIED (sales only).

### numberFire → FanDuel Research
- Links: https://www.numberfire.com/nfl/fantasy/fantasy-football-projections → redirects to https://www.fanduel.com/research
- Category · Class: projections (former) · ⚫ Discontinued as a standalone source
- Notes: the numberFire projections URL now lands on FanDuel Research; the shutdown date was not confirmed (search budget exhausted — UNVERIFIED). FanDuel terms bar automated access without written permission. ffanalytics still lists "NumberFire" as a scrape source — likely broken (inference).
- Scores: Q ~5 / Cov ~4 / Rel 1 / Lat ~5 / Hist 1 / Doc 1 / DX 1 / Cost ~8 / Lic 1 / Com 1 / RL 1 / NFL 4 = **2.8**
- Recommendation: AVOID.
- Verified: 2026-11-25 — one curl showing the redirect.

### Footballguys / 4for4 / Establish The Run — premium projections and rankings
- Links: https://www.footballguys.com/terms · https://www.4for4.com/api · https://establishtherun.com
- Category · Class: subscription expert content · 🟡 Licensed (consumer subscriptions); no public data API found
- Notes: Footballguys terms bar using the service to "spider, crawl, or scrape" and bar reproduction "for any purpose that is not" permitted; `footballguys.com/api` → 404. 4for4's `/api` is a Drupal REST discovery listing only a cookie-authenticated `users` export (no fantasy data API). ETR's terms page answered HTTP 403 to our client (bot protection) — terms UNVERIFIED. All three publish rankings CSV exports to paying subscribers for personal use (community knowledge; not verified here).
- Scores: Q 9 / Cov 7 / Rel ~3 / Lat ~6 / Hist ~3 / Doc 1 / DX 1 / Cost ~4 / Lic 1 / Com 1 / RL 1 / NFL 8 = **3.8**
- Recommendation: AVOID for ingestion; a commercial product could negotiate content licences individually.
- Verified: 2026-11-25 — curl of Footballguys terms (200), /api (404); 4for4 /api (200, JSON discovery); ETR terms (403).

### FantasyLabs / RotoGrinders — DFS ownership (actual and projected)
- Links: https://www.fantasylabs.com · https://rotogrinders.com
- Category · Class: DFS ownership, contest results tools · 🟡 Licensed (paid subscriptions)
- Notes: FantasyLabs answered HTTP 403 to our client (bot protection); RotoGrinders `/terms` → 404 (terms URL not found). No public API found for either. Actual (post-lock) ownership derives from operators' contest standings, which DraftKings/FanDuel terms do not license for redistribution; entrants can export standings of contests they entered for personal use (not verified this track).
- Scores: Q 8 / Cov 6 / Rel ~3 / Lat 7 / Hist ~4 / Doc 1 / DX 1 / Cost 3 / Lic 1 / Com 1 / RL 1 / NFL 6 = **3.5**
- Recommendation: AVOID; licensed ownership projections exist at SportsDataIO (commercial).
- Verified: UNVERIFIED (403/404 on the pages tried; pricing and terms not read).

### nflverse — player stats, snap counts, participation (inputs for our own fantasy metrics)
- Links: https://github.com/nflverse/nflverse-data/releases (tags `stats_player`, `snap_counts`, `pbp_participation`, `pbp`) · dictionaries in nflverse/nflreadr `data-raw/` · licence CC-BY-4.0 (FTN charting CC-BY-SA 4.0), per the registry
- Category · Class: raw stats and usage inputs · 🔵 Public/open data
- Provides: `stats_player_*` with 114 fields incl. `fantasy_points`, `fantasy_points_ppr`, `targets`, `receiving_air_yards`, `target_share`, `air_yards_share`, `wopr`, `racr`, `pacr`, kicking splits, IDP fields; `snap_counts_<season>` (offense/defense/ST snaps and pct, PFR-sourced); `pbp_participation_<season>` (`offense_players` by gsis id per play, `route` of the primary receiver only, `was_pressure`, coverage type)
- History · Live · Latency: 1999+ (pbp) · no · `stats_player_*_2026` updated 2026-11-25T19:12Z; `snap_counts_2026` 2026-11-24T12:01Z; **`pbp_participation` has no 2026 file** (2025 published 2026-02-10) — in-season on-field data are not available
- Technical: files · CSV/parquet/RDS · Auth: none
- Cost: free
- Licensing: CC-BY-4.0 with credit "nflverse"; underlying NFL data rights remain with their owners (registry)
- Scores: Q 9 / Cov 9 / Rel 8 / Lat 5 / Hist 10 / Doc 8 / DX 8 / Cost 10 / Lic 8 / Com 7 / RL 9 / NFL 10 = **8.4**
- Recommendation: PRIMARY input for computed fantasy points (any scoring), usage/opportunity shares and replacement levels.
- Verified: 2026-11-25 — `gh api` release asset listings (names, sizes, update times) and nflreadr dictionaries (`dictionary_player_stats.json`, `dictionary_participation.csv`, `dictionary_snap_counts.csv`).

## 3. Matrix rows

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

## 4. Redundancy (PRIMARY → SECONDARY → FALLBACK)

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

## 5. Derived metrics

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

## 6. Gaps

- **Not obtainable free and legally**: DFS salaries, DFS ownership (projected or actual), pick'em lines, best-ball ADP from Underdog, KTC/FantasyCalc values, in-season route participation, ESPN/CBS league data, historical ECR (only scraped archives exist), historical FantasyPros player statistics (excluded from the licence).
- **Expensive / quote-only**: FantasyPros Commercial (sales), SportsDataIO commercial (quote; Discovery Lab $99–149/mo is personal only), RotoWire feeds (sales), Fantasy Nerds Extended ($2,999/yr).
- **Approval-gated**: Yahoo Fantasy API (application → signed agreement → enablement; weeks).
- **Avoid and why**: ESPN lm-api (Disney ToU; cookies for private leagues), CBS API (deprecated, no terms), Fantrax (no API), Underdog / PrizePicks / DraftKings / FanDuel (terms bar automated access; bot protection — never bypass), KeepTradeCut (explicit ban), FantasyCalc (no grant), Sleeper undocumented projections/stats (RotoWire/Sportradar content), DynastyProcess ECR, nflverse `load_ff_rankings`, ffpros and ffanalytics (scraped content), numberFire and NFL Fantasy (gone), FantasyLabs/RotoGrinders (no API, terms unread).

**Legal low-cost stack for the public non-commercial page (≈ $0–9/month):**
1. nflverse player stats, snap counts and play-by-play (CC-BY-4.0) → our own fantasy points for every scoring system, usage shares, red-zone shares, replacement levels and VORP.
2. ffopportunity expected points (CC BY-SA 4.0) in its own file, credited.
3. FantasyPros API with the owner's Premium/HOF key (≈ $8.99/month annual; "Production keys for personal apps"): ECR, projections, ADP; publish only derived values with "Data obtained from FantasyPros"; never `player-points`; keep raw answers private (already the project's practice).
4. Fantasy Football Calculator ADP (free, commercial allowed, link credit) as the ADP shown; MFL ADP/AAV as a cross-check.
5. Sleeper trending (credit), already wired. Optional opt-in read-only connectors: Sleeper, MFL.
6. Optional dynasty values: Dynasty Dealer (link credit), Roster Audit second opinion.

**What changes for commercial use:** FantasyPros needs the Commercial plan (sales) or must be replaced — cheapest explicit commercial licence found is Fantasy Nerds Standard $499/yr (small businesses), then SportsDataIO or RotoWire by quote (SportsDataIO also covers DFS salaries and ownership projections). Sleeper trending needs a licence from Sleeper. Dynasty Dealer/Roster Audit need written confirmation (upstream is Sleeper's non-commercial API). nflverse stays usable with credit (NFL data rights caveat unchanged); ffopportunity stays usable but share-alike applies to adapted data. FFC ADP is already commercial-OK. Yahoo connectors need the signed agreement. MFL permits "almost any way" use but bars harvesting league/user data.

## 7. Contradictions & UNVERIFIED

Contradictions with or extensions of the project's documents:
1. **FantasyPros cost** — registry row says "Free non-commercial (owner's plan: premium)". The api-data page (read Nov. 25) says the **Free** key is "Non-production use" with "sample data"; production personal keys are **Premium $8.99/mo, bundled with HOF**. The project is compliant only because the owner is on a paid plan; the registry should record the cost as ≈ $8.99/month, not "free".
2. **FantasyPros projections `scoring`** — the spec's `/nfl/{season}/projections` has no `scoring` query parameter (response echoes `scoring`, example STD); the project sends `scoring=STD`. Harmless for quarterbacks but do not assume PPR/HALF variants exist on that endpoint.
3. **FantasyPros historical data** — terms §2 exclude "historical player statistics" from the licence while the API exposes `player-points`; not used by the project, keep it that way.
4. **FantasyPros daily limit** — CLAUDE.md says 500/day on the owner's plan; terms say 100/day by default; the api-data page says only "higher rate limits". 500 is not publicly verifiable (UNVERIFIED).
5. **DynastyProcess** — GITHUB_RESEARCH says "some fields derive from FantasyPros". Stronger finding: the ECR files are produced by a workflow step "Scrape FantasyPros" using a scraping-proxy key, and nflverse `load_ff_rankings` simply downloads them. Not covered by nflverse's CC-BY-4.0 and in conflict with FantasyPros' terms.
6. **Sleeper** — registry covers only documented endpoints. New: the undocumented projections are RotoWire's (`company: rotowire`) and stats Sportradar's (`company: sportradar`) — do not use.
7. **Yahoo** — project docs know Yahoo only as an RSS source. The Yahoo Fantasy API moved to an approval program in 2026; community reports say unapproved apps were cut off from July 22, 2026.
8. **NFL Fantasy** — discontinued for 2026; ESPN is the NFL's official fantasy game (ESPN press room, July 16, 2026). api.fantasy.nfl.com redirects to nfl.com.

UNVERIFIED (and why): Yahoo agreement text (DocuSign only); Yahoo timeline (developer reports, no Yahoo announcement); FantasyPros season depth on a personal key; Discovery Lab permission for a public page (ToS silent); Fantasy Nerds API attribution/redistribution clauses (no API-specific terms found); Fleaflicker, Fantrax, ETR, FantasyLabs, RotoGrinders terms (not found or 403); numberFire shutdown date and Yahoo DFS status (web-search budget exhausted); FFC format values other than `ppr`; MFL and Sleeper history depth; Dynasty Dealer terms on its own site (SPA, only the author's post read).

## 8. Research log

All 2026-11-25. "curl" = one request with UA `nfl-universe-research/1.0`.

Web searches (WebSearch tool; budget ran out before the RotoWire/numberFire searches):
1. "FantasyPros API v2 documentation endpoints consensus rankings projections" → found api-data page, public docs, terms, support article.
2. "Yahoo Fantasy Sports API terms of use rate limit OAuth 2.0 2025" → legal pages, developer pages.
3. "\"Yahoo Fantasy Sports API\" \"Access and Use Agreement\" application 2026" (extended) → yfpy issue #84, developer portal.
4. "NFL Fantasy Football ESPN deal fantasy.nfl.com shut down migrate ESPN Fantasy 2026" → ESPN press room Q&A.
5. "CBS Sports fantasy football API developer documentation access token league data" → token-fetcher gem only.
6. "Fantrax API documentation fxea getLeagueInfo public API terms" → only unofficial wrappers.
7. "PrizePicks API projections endpoint api.prizepicks.com terms of use scraping" → scraper listings only.
8. "Underdog Fantasy best ball ADP export CSV download rankings 2026" → no official export doc.
9. "Yahoo Daily Fantasy shutting down DFS closed" → 2016 state exits.
10. "\"Yahoo Daily Fantasy\" discontinued 2024 OR 2025 OR 2026 contests ending" (extended) → no shutdown found.
11. "FantasyCalc API terms of use trade values api.fantasycalc.com permission" → no terms; found Dynasty Dealer post.
12. "KeepTradeCut terms of use scraping dynasty values API" → KTC pages, Roster Audit developers page.
13. "Fantasy Nerds API NFL pricing ADP projections endpoint documentation" → api.fantasynerds.com FAQ.
14. "SportsDataIO NFL fantasy projections DFS salaries pricing per month 2026" (extended) → no official price list.
15. "SportsDataIO \"Discovery Lab\" personal non-commercial price month NFL" (extended) → Discovery Lab pages.
16. "RotoWire data feeds API licensing …" and "numberFire fantasy projections shut down …" → not run (budget exhausted).

Pages read / endpoints probed:
- api.fantasypros.com/v2/docs → 403 (WebFetch); /public/v2/docs → 200 (Redoc shell); /public/v2/docs/fantasypros_v2_public.yml → 200, 155 KB OpenAPI 3.1.1; /public/v2/terms-of-use → PDF, 6 pages read; support.fantasypros.com article → 403; www.fantasypros.com/api-data/ → 200 (plans text); /mcp/ → 200; /about/legal/ → read (site terms, effective July 1, 2010).
- docs.sleeper.com → read; api.sleeper.app/projections/nfl/2026/12?season_type=regular&position[]=QB → 200, 355 rows, `company: rotowire`; api.sleeper.com/stats/nfl/2026/11?... → 200, 75 rows, `company: sportradar`.
- developer.yahoo.com/fantasysports/guide/ → 308 to sports.yahoo.com/developer; sports.yahoo.com/developer, /developer/access/, /developer/docs/ → 200; legal.yahoo.com/.../fantasysportsapi/index.html → 404; GitHub uberfastman/yfpy issues #84 (+21 comments) and #79 via `gh api`.
- lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/2026 → 200 (202 B).
- api.fantasy.nfl.com/v1/players/stats?... → 301 to nfl.com; espnpressroom.com NFL-to-ESPN Q&A → read (July 16, 2026).
- api.cbssports.com/fantasy/players/list?version=3.0&SPORT=football&response_format=JSON → 200 (1.7 MB); gh repo geoffharcourt/cbs_fantasy_sports_api_token_fetcher.
- api.myfantasyleague.com/2026/api_info and ?STATE=details → 200; /2026/export?TYPE=adp&JSON=1 → 200 (244 players, 27 drafts).
- www.fleaflicker.com/api-docs/index.html → 200; /help/terms → 404.
- prizepicks.com/terms → help-center/terms-of-service (200); api.prizepicks.com/projections?league_id=9&per_page=5 → 403 bot check.
- underdogfantasy.com/terms → legal.underdogsports.com/?g=42203 (read first 100K chars); api.underdogfantasy.com/beta/v5/over_under_lines → 426.
- www.draftkings.com/lobby/getcontests?sport=NFL → 200 (10.7 MB); api.draftkings.com/draftgroups/v1/draftgroups/157063/draftables → 403; myaccount.draftkings.com/documents/us-terms-of-use → read.
- www.fanduel.com/terms → read.
- fantasyfootballcalculator.com/resources/average-draft-position-api/ → 301 → help.fantasyfootballcalculator.com/article/42-adp-rest-api (read); /api/v1/adp/ppr?teams=12&year=2026 → 200.
- api.fantasycalc.com/values/current?isDynasty=true&numQbs=2&numTeams=12&ppr=1 → 200; fantasycalc.com /terms etc. → SPA shell.
- dev.to Dynasty Dealer post → read; www.dynastydealer.com/api/player-values?position=QB → 200; site pages → SPA shell.
- rosteraudit.com/developers/ → read.
- keeptradecut.com/terms-and-conditions → read; /robots.txt → read; /terms-of-use, /terms → 404.
- gh api: dynastyprocess/data (repo, README, files, `.github/workflows/weekly-fantasypros.yml`); nflverse/nflreadr `R/load_ffverse.R`, `data-raw/dictionary_player_stats.json`, `dictionary_participation.csv`, `dictionary_snap_counts.csv`; ffverse/ffopportunity (repo, releases, README, DESCRIPTION); ffverse/ffpros, ffverse/ffscrapr, FantasyFootballAnalytics/ffanalytics (repo, DESCRIPTION, README); nflverse/nflverse-data releases `pbp_participation`, `stats_player`, `snap_counts`.
- api.fantasynerds.com /, /docs/nfl, /getting-started/faq, /getting-started/pricing → 200; /pricing, /terms → 404; www.fantasynerds.com/terms → read.
- sportsdata.io/developers/api-documentation/nfl → read (WebFetch, two parts); /developers/coverages/nfl, /pricing, /nfl-api → 200; /fantasy-sports-data-api → 404; discoverylab.sportsdata.io/personal-use-apis/nfl → 200 (prices from embedded JSON); /pricing → 404; /terms-of-service → read.
- www.rotowire.com/partner/ → 200; /partners/, /data/ → 404.
- www.numberfire.com/nfl/fantasy/fantasy-football-projections → redirect to www.fanduel.com/research.
- www.4for4.com/api → 200 (Drupal discovery: cookie-auth users only); www.footballguys.com/api → 404; /terms → read; establishtherun.com/terms-of-service/ → 403; www.fantasylabs.com/api/ → 403; rotogrinders.com/terms → 404; fantasydata.com → 200; /api → 404.
- Project files read (read-only): CLAUDE.md, docs/NFL_DATA_SOURCE_REGISTRY.md, docs/GITHUB_RESEARCH.md, docs/FEATURE_RESEARCH.md lines 160–244, grep of docs for fantasy sources, scripts/fetch_fantasypros.py (base URL and header only).
