# R2 — Commercial and freemium multi-domain NFL data providers

Research track R2, NFL Universe. Researched 2026-11-25. Read-only; no accounts, keys, trials or sign-ins were used.
Classification key: 🟢 Official | 🟡 Licensed/commercial | 🔵 Public/open data | 🟠 Unofficial but commonly used | 🔴 Scraping | ⚫ Experimental/unstable.
Scores 1–10 (Cost 10 = free; Lic 10 = permissive; RL 10 = generous). "~" = judgment without direct evidence.

## 1. Summary

- **No licensed feed gives a fan-budget public page clean live play-by-play.** Sportradar and SportsDataIO publish no commercial price, and neither self-serve option can be shown publicly. Sportradar's trial bars "publication or display of the Data". SportsDataIO's trial data is scrambled, and Discovery Lab ($99–149/mo) is next-day and personal-use only.
- **Licensed live scores (not PBP) are cheap with the existing key.** The Odds API `/scores` covers the NFL, updates about every 30 seconds and costs 1 credit a call. That fits the $30/mo plan, and the registry's terms already allow in-app display.
- **Cheap "live PBP" APIs have weak provenance.** BALLDONTLIE ($39.99/mo) has the most permissive licence, but its play schema mirrors ESPN's. Tank01 serves ESPN ids and images; "NFL API Data" says it uses ESPN. Treat all three as unsafe until the vendor names its source in writing.
- **Official NFL data** (play-by-play, Next Gen Stats) goes only through Genius Sports, by contract, through 2029. Sportradar collects its own data and is no longer the official distributor.
- **Unofficial JSON:** ESPN's API hosts refuse or disallow robots (DEC-006 stands). Yahoo's editorial API returned an end-of-life "scream test". FOX's API host disallows all robots.
- **Identifiers:** nflverse rosters (CC-BY) map GSIS to ESPN (80% of active players), Sportradar (75%) and SportsDataIO (75%). No crosswalk needs paying for.

### 1a. Direct answers to the track questions

1. **Realistic licensed option for live scores + live PBP for a small public app:** live scores only, The Odds API scores at about $30/mo (licensed, ~30 s). For live play-by-play, there is no clean option under about $600/mo with published pricing. Rolling Insights Live is $599/mo per sport, but its terms are ambiguous on public display. BALLDONTLIE GOAT is $39.99/mo, but its provenance looks ESPN-derived. Clean options (SportsDataIO Leagues API, Sportradar) are quote-only and likely far more (UNVERIFIED). For this non-commercial project, the honest answer is post-game play-by-play from nflverse plus licensed live scores.
2. **Providers that allow public website display, and the attribution they require:**

   | Provider | Public display | Attribution |
   |---|---|---|
   | Sportradar (paid) | Yes, on designated Properties | "powered by Sportradar" logo |
   | SportsDataIO (commercial) | Yes, "inside your licensed product" | Per contract, standard |
   | BALLDONTLIE (any tier) | Yes | None |
   | Highlightly | Yes, to end users of your product | None |
   | The Odds API | Yes, in an app | No raw re-serving |
   | TheSportsDB (paid) | Yes | "mention us as the source of the data" |
   | Rolling Insights | Commercial use allowed, but the terms also bar "display, host" except as permitted | Must be clarified |
   | MySportsFeeds | API licence UNVERIFIED | Site terms: authorship "must always be acknowledged" |
3. **Free tiers and trials that forbid public or commercial display:**
   - Sportradar trial: internal evaluation only.
   - SportsDataIO: scrambled trial ("cannot be used for analysis or display"); Discovery Lab, free or paid (personal, non-commercial, no raw display).
   - TheSportsDB free: no app-store publishing.
   - Highlightly BASIC: "not subject to the same terms as paid plans".
   - The Odds API free tier: allowed, but too few credits to poll live.
   - BALLDONTLIE free: allowed (teams, players and games only).
4. **Documented or measured latency** (none measured live; no keys were used):

   | Provider | Live scores and PBP | Other feeds |
   |---|---|---|
   | Sportradar | Cache TTL 3 s in progress; push "ahead of the television picture" | Standings within 2 min of final; injuries and depth charts 4 h TTL |
   | SportsDataIO | 20–30 s after cable/OTA, 20–30 s ahead of online streams; poll every 3–5 s | Injuries and depth charts sync every 5 min |
   | Discovery Lab | 6 am ET next day | — |
   | The Odds API | ~30 s | — |
   | TheSportsDB (paid) | 2-minute livescore | — |
   | Rolling Insights | "Within minutes" post-game | — |
   | BALLDONTLIE, Highlightly, Tank01, MySportsFeeds, Data Sports Group, LSports, Genius | No figure published | BALLDONTLIE snap counts up to 8 h |
   | ESPN (registry, local) | Seconds | — |
5. **Stable ids and crosswalks:**
   - Sportradar: GUIDs plus `sr_id`, a Mapping API and player `references`. That GSIS appears there is unconfirmed.
   - SportsDataIO: stable `PlayerID` and `GlobalTeamID`/`GlobalGameID`, with crosswalk fields to Sportradar, Yahoo, RotoWire, Rotoworld, STATS, SportsDirect, XMLTeam, USA Today, FantasyAlarm, DraftKings and FanDuel. No GSIS or ESPN field.
   - Tank01: ESPN, CBS, Yahoo, Sleeper, PFR, RotoWire and FantasyPros ids. Avoid for licensing.
   - BALLDONTLIE, Highlightly, Rolling Insights: own ids only.
   - nflverse is the bridge: `sportradar_id` and `fantasy_data_id` (SportsDataIO) map to `gsis_id` and `espn_id`.

## 2. Catalog

### Sportradar — NFL API v7 (REST) + NFL Push feeds
- Links: https://sportradar.com · https://developer.sportradar.com/football/reference/nfl-overview · https://developer.sportradar.com/terms-and-conditions · GitHub: none used (Postman workspace and XSD downloads linked from docs)
- Category · Class: Multi-domain league data (scores, PBP, stats, rosters, injuries, depth charts, transactions, draft) · 🟡 Licensed/commercial
- Provides: 37 feeds per the v7 overview: seasons, hierarchy, teams, schedules (current week/season/weekly), game boxscore, game statistics, game play-by-play, game roster, team profile/roster, player profile, free agents, weekly depth charts, weekly injuries, daily change log, daily transactions, standings, league leaders, seasonal stats, awards, tournaments (playoffs), draft (summary, prospects, trades); Push Events, Push Statistics, Push Pulse, Push Draft Picks/Trades. MCP server advertised.
- History · Live · Latency: Seasons feed: "REG and PST entries reach back to 2000, and PRE entries begin with 2015" (NFL Fundamentals); transactions back to 2002 (NFL FAQ) · Live: yes · Game feeds cache TTL 3 s while `inprogress` ("TTL is an upper bound, not a guarantee"), 60 s scheduled, 600 s closed; standings within 2 min of `complete`; seasonal stats ~5 min after `closed`; injuries/depth charts TTL 4 h and "weekly report feeds, not live feeds" (Update Frequencies, Rosters guides). Push: chunked HTTP stream, heartbeat every 5 s, messages "arrive ahead of the television picture" (no number), replay window 5,000 messages or 30 s.
- Coverage: all NFL games at `full` coverage incl. live PBP; "All NFL data is collected by Sportradar's expert in-house operators" (API basics) — i.e. not the NFL's official feed (that is Genius Sports since 2021). URL still contains `/nfl/official/` (legacy of the 2015–2021 official-data partnership; the docs do not explain it).
- Technical: REST · JSON or XML · SDK: none official for Node (Postman, XSD, MCP server) · Auth: API key (each API version needs its own key) · Rate limits: trial 1,000 requests per rolling 30 days and 1 QPS, 30-day trial (Getting Started); production limits per contract; 429 on excess · Pagination/Webhooks: no webhooks; Push = long-lived HTTP stream (Realtime customers, sales-issued); Daily Change Log for post-game corrections; Mapping API paginates 100 records/page.
- Cost: free: no · free tier: 30-day trial only · paid: not published ("contact sales"); Sportradar's FAQ says tiers are priced on pull frequency and negotiated per customer; competitor marketing claims "$10,000+/month" (sharpapi.io, UNVERIFIED, vendor-biased) · est. monthly for a small app: UNVERIFIED (quote only; very likely four to five figures for live)
- Licensing: commercial: yes, paid customers only, for display on designated "Properties" (§2.2) · redistribution: prohibited outside the Properties; no advertising use without approval (§2.2–2.3); betting use needs written approval (§2.10) · caching/storage: data delivered "for storage on customer servers" (§1.21); must destroy all data within 30 days of termination and certify within 90 days (§7.4) · attribution: paid customers must show a "powered by Sportradar" logo (§2.12) · other restrictions: Free Trial = "internal testing and evaluation purposes only", explicitly no "publication or display of the Data ... in any form" (§1.14, §3.1–3.2); trial revocable at any time (§3.3). Terms last updated Nov. 13, 2026.
- Quality: accuracy high (professional operators, long-time NFL partner until 2021) · completeness very high · reliability high (cache TTLs, change log, push replay) · notes: no GSIS id documented; player `references` array carries other-league ids (example value `00-0034857` has GSIS format but the docs do not label it GSIS — inference only).
- Scores: Q 9 / Cov 9 / Rel 9 / Lat 9 / Hist 8 / Doc 9 / DX 8 / Cost 2 / Lic 3 / Com 8 / RL ~5 / NFL 9 = **7.3**
- Recommendation: OPTIONAL now (trial cannot be displayed; price unpublished) / PRIMARY candidate for a funded commercial product — best documented live REST+push NFL feed sold to media; requires a contract and logo.
- Verified: 2026-11-25 — read NFL v7 overview, API basics, Fundamentals, Update Frequencies, Push, ID handling, Rosters, FAQ (partial), Getting Started (trial limits), Terms and Conditions (Nov. 13, 2026), Official Media Data Addendum (Aug. 25, 2025). Pricing UNVERIFIED (not published).

### SportsDataIO — NFL API (Leagues API), Discovery Lab, Replay, Vault
- Links: https://sportsdata.io/nfl-api · https://sportsdata.io/developers/getting-started · https://sportsdata.io/terms-of-service · https://sportsdata.io/help/data-rights-and-licensing-questions · https://discoverylab.sportsdata.io/personal-use-apis/nfl
- Category · Class: Multi-domain league data + odds + fantasy/DFS + news · 🟡 Licensed/commercial
- Provides: schedules, scores, game state, team/player box stats, play-by-play, standings, rosters, depth charts, injuries, referee crews, weather forecasts, news, headshots, snap counts, advanced metrics, game odds, props, line movement, in-play odds, fantasy projections (incl. IDP/DST), DFS salaries/slates, ADP (nfl-api page).
- History · Live · Latency: "decades" (nfl-api page, no year); Vault product "10+ years" (getting-started); Discovery Lab "Current Season + Last 3 Years" (embedded plan JSON) · Live: commercial only · Help Center: scores and PBP "usually 20-30 seconds ahead of online streams and 20-30 seconds after cable and OTA broadcasts"; API caches ≥3 s, sync every 3–5 s on real-time plans; injuries and depth charts "updated in real time", sync every 5 min; news every 5–10 min; snap counts next morning; advanced metrics the Wednesday after. Discovery Lab: scores, player and team stats "Delivered 6am ET next day"; projections and DFS 72 h before game.
- Coverage: all NFL games; the Help Center does not say whether NFL stats are official or own-collected (UNVERIFIED). DFS slates come from operators; odds from sportsbooks (5 s–5 min).
- Technical: REST · JSON and XML (CSV files on Discovery Lab) · SDK: none official for Node found · Auth: API key · Rate limits: commercial "Unlimited API calls"; Discovery Lab 100 calls/day (Fantasy or Odds) or 1,000/day (Fantasy+Odds); scrambled trial "small daily call limit" · Pagination/Webhooks: none documented (polling).
- Cost: free: Discovery Lab free tier = last season's rosters, schedules, results · free tier: scrambled 30-day trial (fake data, "cannot be used for analysis or display") · paid: Discovery Lab NFL $99/mo Fantasy, $99/mo Odds, $149/mo Fantasy+Odds; annual $599 / $599 / $899 (prices from the plan JSON embedded in the Discovery Lab NFL page); commercial Leagues API: quote only ("every price is tailored"; season-long single-sport licences) · est. monthly for a small app: commercial UNVERIFIED (quote); third-party estimates not trusted.
- Licensing: commercial: commercial licence required for "public-facing, revenue-generating, or business-operated products" · redistribution: displaying data inside a licensed product is standard; reselling the feed "as a standalone data product is not permitted" · caching/storage: commercial licences permit "ingesting, caching, and storing API responses"; retention after expiry set per agreement · attribution: "standard requirement of commercial licenses", wording per agreement · other restrictions: Discovery Lab "licensed for personal, non-commercial use only", raw data may not be shown to users; trial data is scrambled.
- Quality: accuracy high (long-time fantasy/media supplier) · completeness very high (broadest single-vendor NFL bundle incl. news and odds) · reliability SLA on commercial · notes: the Player object carries crosswalk ids `SportRadarPlayerID`, `YahooPlayerID`, `RotoWirePlayerID`, `RotoworldPlayerID`, `StatsPlayerID`, `SportsDirectPlayerID`, `XmlTeamPlayerID`, `UsaTodayPlayerID`, `FantasyAlarmPlayerID`, `DraftKingsPlayerID`, `FanDuelPlayerID` and `GlobalTeamID`/`GlobalGameID`; no GSIS and no ESPN id field found in the NFL data dictionary (grep of the 897 KB page, Nov. 25).
- Scores: Q 8 / Cov 9 / Rel 8 / Lat 8 / Hist 7 / Doc 8 / DX 8 / Cost 3 / Lic 4 / Com 8 / RL 8 / NFL 9 = **7.3**
- Recommendation: SECONDARY now (Discovery Lab is next-day and non-display, so no use for a public page) / PRIMARY candidate for a commercial product that wants scores+PBP+injuries+news+odds+projections from one licence with crosswalk ids.
- Verified: 2026-11-25 — nfl-api page, pricing page, getting-started, free-trial, Discovery Lab NFL page source (prices, call limits, delivery hints extracted from embedded JSON), Help Center refresh rates and data-rights pages, terms of service (no revision date), NFL data dictionary (id fields). Commercial price UNVERIFIED (quote only).

### Genius Sports — NFL official data distribution (play-by-play, Next Gen Stats, betting feed)
- Links: https://www.geniussports.com · https://developer.geniussports.com (generic Warehouse/Statistics docs, nothing NFL-specific) · terms: per contract (none public for NFL data) · GitHub: none
- Category · Class: Official league data distributor · 🟢 Official (as the NFL's exclusive distributor) / 🟡 Licensed
- Provides: per NFL.com and SportsPro: the NFL's real-time official play-by-play statistics, Next Gen Stats tracking data and the official betting data feed, distributed exclusively "to media companies and sports betting operators globally"; also low-latency "watch and bet" video to sportsbooks, BetVision, FanHub, in-game ad inventory.
- History · Live · Latency: UNVERIFIED (no public docs) · Live: yes · Latency: UNVERIFIED (no published figures).
- Coverage: every NFL game (official source).
- Technical: UNVERIFIED for NFL; the public developer centre documents Warehouse REST (500 records/page), streaming/publish sockets and an Ably push channel for its own statistics products, with OAuth client credentials — not the NFL feed. · Auth: contract · Rate limits: UNVERIFIED.
- Cost: free: no · free tier: no · paid: "Contact Sales" only (homepage) · est. monthly for a small app: UNVERIFIED; not realistically available to a small fan site.
- Licensing: per contract; none public.
- Quality: official source, highest accuracy and latency by definition; inaccessible.
- Scores: Q 10 / Cov 9 / Rel ~9 / Lat ~10 / Hist ~6 / Doc 2 / DX ~3 / Cost 1 / Lic ~2 / Com ~7 / RL ~5 / NFL 10 = **6.2**
- Recommendation: AVOID for now (no self-serve, no docs, no prices); note as the upstream of official NFL stats for any enterprise phase. Deal history: NFL–Genius from 2021; extended in 2023 to the end of 2027–28 (NFL.com) and in June 2025 to the end of the 2029 season (SportsPro, June 11, 2025). Genius connected official NFL data to "NFL Gametime on X" in Oct. 2026 (Business Wire via search snippet; not opened).
- Verified: 2026-11-25 — geniussports.com homepage, developer.geniussports.com, NFL.com extension story, SportsPro June 2025 article. Business Wire release refused (HTTP 403).

### Stats Perform (Opta) — American football feeds
- Links: https://www.statsperform.com/opta/ · https://developers.statsperform.com/coverage-and-data-rights · terms: per contract
- Category · Class: Predictive/analytics feeds; not a primary NFL stats distributor · 🟡 Licensed/commercial
- Provides (per search results pointing to its knowledge base; individual feed pages not opened): American Football Fourth Down Predictions (MA5), Go For Two Predictions (MA4), Tournament Simulations (TM11), Live Win Probability (MA21); Dynamic Stats API ("football, basketball and American football", 80+ metrics); an "NFL XInfo" charting product. Opta Analyst publishes NFL pages for fans.
- History · Live · Latency: UNVERIFIED · Live: win probability yes per description · Latency: UNVERIFIED.
- Coverage: the June 2026 coverage-and-data-rights page lists no NFL official rights (official rights named: FIFA, WTA, Concacaf).
- Technical: UNVERIFIED (contract) · Auth: contract.
- Cost: "contact sales" (no public price found) · est. monthly: UNVERIFIED.
- Licensing: per contract; not reviewed.
- Quality: strong modelling brand; NFL raw-stat completeness UNVERIFIED.
- Scores: Q ~7 / Cov ~5 / Rel ~8 / Lat ~7 / Hist ~5 / Doc 4 / DX ~4 / Cost 1 / Lic ~3 / Com ~7 / RL ~5 / NFL ~5 = **5.1**
- Recommendation: AVOID as a scores/PBP source; OPTIONAL later as a licensed model-output benchmark (win probability, fourth-down) for a commercial product.
- Verified: 2026-11-25 — coverage-and-data-rights page (June 2026). Feed catalogue from a search summary only (UNVERIFIED in detail).

### MySportsFeeds — NFL API (v2.x)
- Links: https://www.mysportsfeeds.com · https://www.mysportsfeeds.com/feed-pricing/ · https://www.mysportsfeeds.com/terms-use/ · https://www.mysportsfeeds.com/faq/
- Category · Class: Multi-domain (schedules, scores, box scores, PBP, lineups, DFS, odds, projections) · 🟡 Licensed/commercial (self-collected, "unofficial and independent")
- Provides: CORE (schedules, scores, venues), add-ons STATS (gamelogs, totals), DETAILS (boxscores, lineups, play-by-play), DFS (DraftKings, FanDuel, Yahoo slates), ODDS (Bovada, 888-Sport lines), PROJECTIONS, EXTRAS (drafts, playoff rounds). Injuries not listed on the pricing page.
- History · Live · Latency: two most recent seasons included; older seasons "through the 2000s and even earlier" one-time $19–$69 each · Live: optional ("Non-Live through Near-Realtime access") · Latency: UNVERIFIED (no tier delays published; FAQ (old) says live games change "pretty much every few seconds"; a 5-minute subscription answers 304 until its window passes).
- Coverage: NFL among the "big 4"; FAQ says MySportsFeeds "is its own data source"; the current data-feeds page says it uses "a unique combination of crowd-sourcing, backed by our own in-house staff" (unofficial, not league-sourced).
- Technical: REST · JSON/XML/CSV (UNVERIFIED beyond FAQ) · SDK: official MIT wrappers on GitHub (`MySportsFeeds/mysportsfeeds-node` last push 2023-04-18, python 2022, php 2024; low activity) · Auth: account key · Rate limits: not numeric; frequency-of-access set by plan · Webhooks/push: not available — the data-feeds page says to "stay tuned for our revised PUSH delivery engine".
- Cost: free: "FREE for first year" only if they integrate it for you (developer offer) · free tier: personal-use trial on request · paid: NFL commercial "starting at $39 per month for CORE feeds and Non-Live access"; personal "starting at $5 per month" (if you qualify); prices in Canadian dollars; add-on and live prices not published · est. monthly for a small app: UNVERIFIED for live+PBP (not published).
- Licensing: commercial: commercial plan exists · redistribution/display: site terms only cover the website (no copying/downloading site pages; acknowledge authorship); API licence terms not found publicly — UNVERIFIED · attribution: "must always be acknowledged" (site terms) · other: no data-specific deletion clause found.
- Quality: accuracy UNVERIFIED (own collection); completeness medium; reliability unknown; small vendor (Be A Contender Software Services Inc., © 2012–2026).
- Scores: Q ~6 / Cov 7 / Rel ~6 / Lat ~6 / Hist 7 / Doc 5 / DX 6 / Cost 8 / Lic ~5 / Com 6 / RL ~6 / NFL 7 = **6.3**
- Recommendation: OPTIONAL — cheapest published commercial entry price, but live tier price, latency and API licence terms must be obtained in writing before use.
- Verified: 2026-11-25 — pricing page (raw HTML), FAQ, site terms. API licence and live delays UNVERIFIED.

### BALLDONTLIE — NFL API
- Links: https://www.balldontlie.io · https://nfl.balldontlie.io · https://www.balldontlie.io/terms.html · SDK: npm `@balldontlie/sdk` (not inspected)
- Category · Class: Multi-domain (games, stats, PBP, injuries, odds, props, DFS, fantasy) · 🟡 Licensed/commercial (aggregator; source undisclosed)
- Provides: Free: teams, players, games. ALL-STAR adds injuries, active players, standings, snap counts, game/season/team stats. GOAT adds advanced rushing/passing/receiving, plays (play-by-play), betting odds, player props (BetMGM, BetRivers, Caesars deeplinks), DFS, fantasy, player designations, team roster.
- History · Live · Latency: "data from 2002-current"; snap counts from 2021; team rosters from 2025 · Live: yes ("updated in real-time for games currently in progress") · Latency: no figure published; snap counts up to 8 h after a game.
- Coverage: NFL only in this product (other leagues sold separately); ids are BALLDONTLIE's own integers (e.g. Eagles 18); no ESPN/GSIS id found in docs (grep, Nov. 25).
- Technical: REST · JSON · SDK: official JS/TS SDK, Google Sheets add-on, MCP · Auth: key in `Authorization` header · Rate limits: Free 5 req/min; ALL-STAR 60; GOAT 600 · Pagination: cursor (`per_page` ≤100) · Webhooks: none found.
- Cost: free: 5 req/min, teams/players/games only · paid: ALL-STAR $9.99/mo ($95.90/yr), GOAT $39.99/mo ($383.90/yr) per league; ALL-ACCESS $299.99/mo all leagues; 7-day GOAT trial · est. monthly for a small app: $39.99 (GOAT, for live PBP).
- Licensing: commercial: "any lawful personal or commercial purpose" (§6) · redistribution: display, distribute, sublicense allowed; may not build a substitute sports-data API (§6) · caching/storage: permitted, survives termination (§6, §17) · attribution: not required (§6, §22) · other: data "compiled and aggregated from a variety of third-party sources", "may not match official league statistics" (§1, §8); terms dated Oct. 20, 2026.
- Quality: accuracy UNVERIFIED; the undisclosed upstream is a provenance risk. Evidence: the `NFLPlay` schema in BALLDONTLIE's own OpenAPI file (`www.balldontlie.io/openapi/nfl.yml`, downloaded Nov. 25) has `type_slug`, `type_abbreviation`, `type_text`, `text`, `short_text`, `away_score`, `home_score`, `scoring_play`, `period`, `clock_display`, `start_yard_line/down/distance`, `end_*`, `stat_yardage`, `participants`, `home_win_probability`, `wallclock` — a near one-to-one flattening of ESPN's play object (`type`, `text`, `shortText`, `awayScore`, `homeScore`, `scoringPlay`, `period`, `clock`, `start`, `end`, `statYardage`, `participants`, `probability`, `wallclock`; per the ESPN OpenAPI model in `aaronweldy/espn-openapi` and this project's `lib/fabric/adapters/espn.js`). Inference, not a vendor statement: the NFL play-by-play is very likely ESPN-derived, and BALLDONTLIE's permissive licence cannot grant rights it does not hold · reliability: small company, no SLA found.
- Scores: Q ~6 / Cov 7 / Rel ~6 / Lat ~6 / Hist 8 / Doc 8 / DX 9 / Cost 8 / Lic ~5 / Com ~4 / RL 6 / NFL 8 = **6.8** (Lic/Com lowered from the face of its terms (9/8) because of the upstream-provenance evidence)
- Recommendation: OPTIONAL (provenance risk) — on paper the cheapest licence that allows public and commercial display of live NFL scores and PBP ($39.99/mo, no attribution), but the PBP looks ESPN-derived. Use only after BALLDONTLIE confirms its upstream and licence chain in writing; label "unofficial" and reconcile against nflverse after games.
- Verified: 2026-11-25 — NFL docs page (raw HTML, tiers, endpoints, history), terms.html (Oct. 20, 2026). Upstream source UNVERIFIED.

### The Odds API — scores endpoint (cross-reference; odds belong to the odds track)
- Links: https://the-odds-api.com/liveapi/guides/v4/ · https://the-odds-api.com/sports-odds-data/sports-apis.html · terms: https://the-odds-api.com/terms-and-conditions.html (registry)
- Category · Class: Live and recent game scores (no PBP) · 🟡 Licensed/commercial (project already holds a key)
- Provides: `GET /v4/sports/americanfootball_nfl/scores/` — upcoming, live and completed games (up to 3 days back with `daysFrom`); same game `id` as the odds endpoint.
- History · Live · Latency: 3 days · Live: yes · "Live scores update approximately every 30 seconds" (v4 guide).
- Coverage: NFL marked ✔ in the "Scores & Results" column (sports list, Nov. 25).
- Technical: REST · JSON · Auth: key · Cost per call: 1 credit, 2 with `daysFrom`.
- Cost: free 500 credits/month (not enough to poll live); paid 20K credits $30/mo, 100K $59/mo, 5M $119/mo, 15M $249/mo (homepage, Nov. 25). Polling every 30 s through ~17 NFL game-hours a week ≈ 2,000 calls/week ≈ 9,000/month → fits the $30 plan (our arithmetic).
- Licensing: registry reading: may show and store data in an app; may not re-serve as a raw feed or API.
- Scores: Q 7 / Cov 6 / Rel 8 / Lat 7 / Hist 3 / Doc 8 / DX 9 / Cost 8 / Lic 7 / Com 7 / RL 6 / NFL 6 = **6.8**
- Recommendation: SECONDARY for licensed public live scores (score + status only) at ~$30/mo, using the key and terms the project already has; not a PBP source. Score upstream not stated (UNVERIFIED).
- Verified: 2026-11-25 — v4 guide (scores section), sports list, homepage plan table.

### Rolling Insights — DataFeeds (NFL API)
- Links: https://rolling-insights.com/datafeeds/nfl-api/ · https://docs.datafeeds.rolling-insights.com/ (not opened) · https://rolling-insights.com/datafeeds/price-plans/ · https://rolling-insights.com/terms-of-services/
- Category · Class: Multi-domain (schedules, profiles, season stats, depth charts, injuries, box scores, PBP, live stats) · 🟡 Licensed/commercial
- Provides: Pre Game (schedules, team/player profiles, season stats, depth charts and injuries "varies by sport"); Post Game (+ final scores, box scores, play-by-play, game-by-game history); Live (+ live scores, live box scores, in-play state, live PBP, live player/team stats). Odds/projections only via partners on request.
- History · Live · Latency: "back to 2018 on request"; trial keys limited to the latest two seasons · Live: Live plan · Latency: no figure; Post Game "available within minutes of the final".
- Coverage: NFL plus 8 other sports; data source (own or official) not stated; ids are its own `player id`/`team id`, no crosswalk documented.
- Technical: REST and GraphQL · JSON · Auth: token · Rate limits: "No rate limits" on every plan · Webhooks/push: not documented.
- Cost: free: 30-day trial key, all endpoints, no card · paid (per sport): Pre Game $99/mo ($990/yr), Post Game $349/mo ($3,490/yr), Live $599/mo ($5,990/yr); Big League (all 9 sports, live) $1,499/mo; startup programme "70% off" · est. monthly for a small app: $599 (live PBP), $349 (post-game only).
- Licensing: commercial: licence covers "internal and commercial purposes" for the data outputs · redistribution: may not "distribute, display, host" the Paid Services except as the Terms permit (ambiguous for showing data on a public site — ask in writing) · caching/storage: not addressed · attribution: none required · other: licence "revocable", ends immediately on cancellation; no revision date on terms.
- Quality: UNVERIFIED accuracy; small vendor active in 2026 (blog posts Sept–Nov 2026; Product Hunt launch Oct. 2026).
- Scores: Q ~6 / Cov 7 / Rel ~6 / Lat ~6 / Hist 5 / Doc 6 / DX 7 / Cost 4 / Lic ~5 / Com 7 / RL 9 / NFL 7 = **6.3**
- Recommendation: OPTIONAL — transparent published live price ($599/mo), but display rights are ambiguous in the terms and the upstream source is undisclosed.
- Verified: 2026-11-25 — price-plans page, NFL API page, terms of services. Docs portal not opened.

### API-Sports — API-American-Football (v1)
- Links: https://api-sports.io/sports/nfl · https://api-sports.io/documentation/american-football/v1 · terms: https://api-sports.io (not readable)
- Category · Class: Multi-domain (games, events, team/player statistics, injuries, odds, standings — per vendor listing) · 🟡 Licensed/commercial
- Provides: UNVERIFIED in detail (docs page refused).
- History · Live · Latency: UNVERIFIED · Live: claimed · Latency: UNVERIFIED.
- Coverage: NFL and NCAA (page title "NFL & NCAA API information").
- Technical: REST · JSON · Auth: key in header (keyless call to `v1.american-football.api-sports.io/status` returned HTTP 403 JSON "Missing application key", Nov. 25) · Rate limits: per search snippets of the official NFL page: Free 100 requests/day (resets 00:00 UTC); PRO 7,500/day, ULTRA 75,000/day, MEGA 150,000/day at 15.00 / 25.00 / 35.00 (currency and period not shown in the snippet).
- Cost: free tier 100/day (UNVERIFIED primary) · paid as above (UNVERIFIED primary) · est. monthly: ~$15–35 (UNVERIFIED).
- Licensing: UNVERIFIED (terms not readable).
- Quality: UNVERIFIED; long-running multi-sport vendor (API-Football).
- Scores: Q ~6 / Cov ~6 / Rel ~6 / Lat ~5 / Hist ~5 / Doc ~6 / DX ~7 / Cost 8 / Lic ~4 / Com ~6 / RL 6 / NFL ~6 = **5.9**
- Recommendation: AVOID until terms and NFL latency are read from the primary pages (site sits behind a bot challenge that this research did not bypass).
- Verified: 2026-11-25 — only the API status endpoint (403 JSON). api-sports.io pricing, docs, NFL page and api-football.com terms all returned HTTP 403 (Cloudflare challenge) to WebFetch and curl. Figures are from search-result snippets: UNVERIFIED.

### TheSportsDB — free/Patreon sports API
- Links: https://www.thesportsdb.com · https://www.thesportsdb.com/pricing · https://www.thesportsdb.com/docs_terms_of_use.php · https://www.thesportsdb.com/free_sports_api
- Category · Class: Crowd-sourced metadata, schedules, results, artwork; light livescores · 🔵 Public/open data (crowd-sourced) / 🟡 paid tiers
- Provides: teams, players, events, results, artwork (logos, fanart), YouTube highlight links; livescores on paid plans only.
- History · Live · Latency: varies (crowd-sourced) · Live: paid only · "2 min livescore (Soccer, NFL, NBA, MLB, NHL)" on paid plans.
- Coverage: NFL schedules/results/teams; no PBP, no injuries, no official stats.
- Technical: REST v1 (key in path) and v2 (paid) · JSON · Auth: key (free shared key; private key on paid) · Rate limits: Free 30 req/min; $9/mo 100 req/min; $20/mo 120 req/min.
- Cost: free: yes ("Most queries limited") · paid: Single Developer $9/mo, Small Business $20/mo · est. monthly: $9.
- Licensing: commercial: free users "cannot publish apps to an appstore unless you are a paid subscriber"; paid users may build apps within rate limits · redistribution: no reselling the API without permission · caching: not addressed · attribution: paid tier must "mention us as the source of the data" · images: original TheSportsDB artwork is Creative Commons; third-party logos/photos are not relicensed; unknown-licence artwork "must not be used ... publicly".
- Quality: medium (crowd-edited); good for metadata, not for live stats.
- Scores: Q 5 / Cov 5 / Rel 6 / Lat 4 / Hist 6 / Doc 6 / DX 8 / Cost 9 / Lic 6 / Com 5 / RL 6 / NFL 4 = **5.8**
- Recommendation: AVOID for scores/stats; OPTIONAL for non-logo metadata only. Do not use its NFL logos (club trademarks; registry already says no).
- Verified: 2026-11-25 — pricing page, terms page, free_sports_api page. No endpoint probe (every endpoint needs a key in the path).

### Highlightly — NFL & NCAAF API
- Links: https://highlightly.net/nfl-api/ · https://highlightly.net/nfl-api/documentation/ · https://highlightly.net/terms/
- Category · Class: Scores, box scores, lineups, players, standings, odds, highlight video links · 🟡 Licensed/commercial (aggregator)
- Provides: 19 endpoints (matches, highlights, box score, lineups, players + statistics, teams + statistics, standings, head-to-head, last five games, odds, bookmakers).
- History · Live · Latency: UNVERIFIED · Live: "near real time" (FAQ), no figure; highlights "within 0–48 hours".
- Coverage: NFL preseason, regular season, playoffs; NCAA FBS. Own path ids; no external ids.
- Technical: REST (direct or via RapidAPI) · JSON · Auth: `x-rapidapi-key` header · Rate limits: BASIC 100/day; PRO 7,500/day 12 req/s; ULTRA 25,000/day 20 req/s; MEGA 65,000/day 100 req/s.
- Cost: free 100/day · paid $7.99 / $18.99 / $44.99 per month · est. monthly: $7.99–18.99.
- Licensing: commercial: may build and run own apps/sites and display data to end users (§6.1) · redistribution: no reselling or re-serving via "Your own API, data feed, webhook, file export" (§6.1) · caching: "You may store the data" (§6.1) · attribution: none · other: BASIC "not subject to the same terms as paid plans" (§4.1); data "fed automatically by different feeds" with possible errors (§2.2); no SLA (§2.3); terms dated Nov. 3, 2026; logos/images need your own permissions (§6.4).
- Quality: UNVERIFIED; undisclosed upstream; highlight links come from the YouTube Data API.
- Scores: Q ~5 / Cov 6 / Rel ~5 / Lat ~5 / Hist ~4 / Doc 6 / DX 7 / Cost 9 / Lic 7 / Com 6 / RL 7 / NFL 6 = **6.1**
- Recommendation: AVOID as a primary (provenance undisclosed); at most a cheap secondary for schedules.
- Verified: 2026-11-25 — NFL API page, documentation page, terms (Nov. 3, 2026).

### Goalserve — NFL data feeds
- Links: https://www.goalserve.com/en/sport-data-feeds/nfl-api/prices · /description
- Category · Class: Live scores, box scores, player stats, schedules, rosters, injuries, odds (XML/JSON) · 🟡 Licensed/commercial
- Provides (per search snippets of Goalserve's pages and the Firecrawl blog, Nov. 19, 2026): live NFL/NCAA scores, boxscores, player statistics, fantasy data, schedules, rosters; description page also lists play-by-play and injury reports.
- History · Live · Latency: UNVERIFIED.
- Technical: XML and JSON feeds, flat pricing, no per-request metering (third-party reviews) · Auth: key/IP (UNVERIFIED).
- Cost: $300 for one month, $1,500 six months, $1,200 twelve months ("sale") — third-party reading of Goalserve's page; UNVERIFIED primary · trial on request.
- Licensing: UNVERIFIED.
- Scores: Q ~5 / Cov ~6 / Rel ~5 / Lat ~5 / Hist ~4 / Doc 4 / DX 4 / Cost 5 / Lic ~4 / Com ~6 / RL ~7 / NFL ~6 = **5.1**
- Recommendation: AVOID until primary pages and terms are readable.
- Verified: UNVERIFIED (www.goalserve.com refused connections from this machine on 2026-11-25: ECONNREFUSED / timeout on HTTPS and HTTP, both WebFetch and curl).

### Data Sports Group (DSG) — American Football feed
- Links: https://datasportsgroup.com/coverage/american-football/ · https://dsg-api.com/doc/american_football/get_areas/65/ (not opened)
- Category · Class: B2B multi-sport feed (scores, PBP, box scores, rosters, depth charts, standings, odds) · 🟡 Licensed/commercial
- Provides: NFL, NCAA FBS/FCS, CFL: live scores and status, quarter scores, "Live Play-by-Play & Scoring Plays", box scores, team/player stats, rosters, bios, depth charts, starting lineups, venues, attendance, standings, odds (spread, total, moneyline, props, futures). Injuries not mentioned.
- History · Live · Latency: UNVERIFIED · Live: yes (claimed) · Latency: no figure.
- Technical: REST (dsg-api.com) · format UNVERIFIED · Auth: contract.
- Cost: "CONTACT SALES"; "Get Free API Trial" via contact form.
- Licensing: no terms on the page (privacy policy and imprint only).
- Scores: Q ~6 / Cov 7 / Rel ~6 / Lat ~6 / Hist ~4 / Doc 4 / DX 4 / Cost 2 / Lic ~3 / Com ~7 / RL ~6 / NFL 6 = **5.1**
- Recommendation: AVOID for this project (B2B, quote-only, aimed at betting/media operators); note as a commercial alternative.
- Verified: 2026-11-25 — coverage page.

### LSports — American Football (odds and scores for sportsbooks)
- Links: https://www.lsports.eu/sports/american-football · https://www.lsports.eu/terms-conditions (not opened)
- Category · Class: Betting odds + "real-time scores and incidents" for operators · 🟡 Licensed/commercial
- Provides: "300 unique markets and over 60 props" across NFL, NCAAF, CFL, UFL; pre-match and live odds; scores and incidents. No PBP/stat detail described.
- History · Live · Latency: "Close to zero latency" (marketing, no method) · Live: yes.
- Cost: no price; "Free Trial" call to action.
- Licensing: UNVERIFIED (operator contracts).
- Scores: Q ~6 / Cov 5 / Rel ~7 / Lat ~8 / Hist ~3 / Doc 3 / DX 3 / Cost 2 / Lic ~3 / Com ~6 / RL ~5 / NFL 4 = **4.6**
- Recommendation: AVOID (sportsbook-oriented; odds track).
- Verified: 2026-11-25 — American football page.

### Enetpulse and Sportmonks — no NFL product found
- Enetpulse (https://enetpulse.com, sports-data-api and sports-data-feeds pages): no "NFL" or "American football" text on the homepage or data pages; offers a two-week free test then commercial terms. Treat NFL coverage as UNVERIFIED/absent.
- Sportmonks (https://www.sportmonks.com): products are Football (soccer), Cricket and Motorsport APIs; no NFL or American football on the homepage or pricing page (Nov. 25). Not an NFL source.
- Class: 🟡 · Scores: not scored (no NFL product) · Recommendation: AVOID (not applicable).
- Verified: 2026-11-25 — homepages and data/pricing pages fetched and searched.

### SportsBlaze — sports data feeds
- Links: https://sportsblaze.com (JavaScript app) · https://docs.sportsblaze.com
- Category · Class: Box scores, schedules · ⚫ Experimental/unstable
- Provides: NFL "Daily Boxscores" and schedule (`api.sportsblaze.com/nfl/v1/schedule/season/<year>.json?key=...`). A public trending list (`assets.sportsblaze.com/sportsblaze_feeds.json`) links keyless cached files at `cache.sportsblaze.com/boxscores/nfl/<date>`.
- History · Live · Latency: UNVERIFIED. Measured staleness: `cache.sportsblaze.com/boxscores/nfl/2026-11-23` (HTTP 200, 491 bytes) on Nov. 25 showed CIN at WAS, kickoff 2026-11-24T01:15Z, still `"status":"Scheduled"` with `"updated":"2026-10-04T19:30:21Z"` — about 45 hours after kickoff.
- Technical: REST · JSON · Auth: key as a URL query parameter (`?key=`), which leaks into logs.
- Cost, licensing: not published (no pricing or terms found in the site bundle or docs).
- Scores: Q 3 / Cov 4 / Rel 3 / Lat ~3 / Hist ~3 / Doc 3 / DX 5 / Cost ~6 / Lic 2 / Com ~3 / RL ~5 / NFL 4 = **3.7**
- Recommendation: AVOID (no terms, stale cache observed, key in URL).
- Verified: 2026-11-25 — homepage bundle, docs page, feeds JSON, one cached NFL file.

### Tank01 (RapidAPI) — "Tank01 NFL Live In-Game Real Time Statistics NFL"
- Links: https://rapidapi.com/tank01/api/tank01-nfl-live-in-game-real-time-statistics-nfl · https://www.tank01.com · terms: none found beyond RapidAPI's marketplace terms
- Category · Class: Live box scores, PBP, schedules, rosters, injuries, news, odds, props, projections, ADP · 🟠 Unofficial (reseller; upstream undisclosed)
- Provides (listing text): live box scores "updated immediately", standings after each game, schedules and rosters "multiple times per day", injuries with roster updates, ADP hourly, props (from 2025-26), "Play By Play available for all games", odds "every minute", projections hourly, player and fantasy news.
- History · Live · Latency: current season emphasis · Live: yes · Latency: no figure ("pretty good compared to the rest").
- Coverage: NFL (plus MLB, NBA, NHL, WNBA as separate APIs).
- Technical: REST via RapidAPI · JSON · Auth: RapidAPI key · Rate limits/pricing: Basic free hard cap 1,000/month; Pro $10/mo 1,000/day; Ultra $25/mo 15,000/day; Mega $100/mo 500,000/day; $0.01 per extra request; per league.
- IDs: player objects carry `espnID`, `espnName`, `espnLink`, `espnHeadshot`, `espnIDFull`, `cbsPlayerID`, `yahooPlayerID`, `sleeperBotID`, `fRefID`, `rotoWirePlayerID`, `fantasyProsPlayerID`; team objects carry `espnLogo1` (schema in GitHub `acypert/tank01-nfl-ts-client` src/teams/schemas.ts, no licence, pushed 2025-12-13; also cited by other public repos). Serving ESPN headshot/logo URLs and ESPN/CBS/Yahoo ids strongly suggests ESPN-derived data (inference, not stated by Tank01).
- Licensing: no Tank01 data licence found; RapidAPI terms place licensing on the API provider.
- Quality: popular with hobby fantasy apps; provenance undisclosed.
- Scores: Q ~6 / Cov 7 / Rel ~5 / Lat ~6 / Hist ~3 / Doc 5 / DX 7 / Cost 8 / Lic 2 / Com 2 / RL 7 / NFL 7 = **5.4**
- Recommendation: AVOID in production (red flag: probable resale of ESPN data with ESPN-hosted images); its id crosswalk fields are not needed because nflverse rosters already give ESPN↔GSIS↔Sleeper ids under CC-BY.
- Verified: 2026-11-25 — RapidAPI listing (raw HTML: pricing and description), tank01.com, GitHub schema file.

### Creativesdev (RapidAPI) — "NFL API Data"
- Links: https://rapidapi.com/creativesdev/api/nfl-api-data
- Category · Class: Scores, PBP, stats, injuries, odds, depth charts, images · 🔴 Scraping (red flag)
- Evidence: the listing's own description says its sibling NBA API "is covered by us in real time Espn NBA Api", advertises a "Cricbuzz Cricket API", offers "NFL team images", and pastes Rolling Insights' marketing sentence ("Our DataFeeds by Rolling Insights offer real-time data...") as its own.
- Cost: plan figures not present in the static HTML (UNVERIFIED).
- Licensing: none; probable re-serving of ESPN data and third-party images.
- Scores: Q ~4 / Cov 6 / Rel 3 / Lat ~5 / Hist ~2 / Doc 3 / DX 6 / Cost 8 / Lic 1 / Com 1 / RL ~6 / NFL 5 = **4.2**
- Recommendation: AVOID — must not be used, free or paid.
- Verified: 2026-11-25 — RapidAPI listing raw HTML (meta description).

### Firecrawl "Alexandria" — scraped ESPN/NFL.com responses
- Links: https://www.firecrawl.dev/blog/best-nfl-apis (Nov. 19, 2026)
- Category · Class: Web-scraping service returning ESPN and NFL.com data · 🔴 Scraping
- Evidence: the vendor's own blog lists "5 Firecrawl credits per NFL.com or ESPN call" with measured P95 latency (ESPN 752 ms, NFL.com 4.1 s). Scraping does not change ESPN's or the NFL's terms.
- Scores: not scored · Recommendation: AVOID — scraping intermediaries do not grant data rights.
- Verified: 2026-11-25 — blog post only.

### ESPN — undocumented JSON (site.api, sports.core.api, cdn)
- Links: `site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard` · `sports.core.api.espn.com/v2/sports/football/leagues/nfl` · `cdn.espn.com/core/nfl/...` · terms: https://disneytermsofuse.com/english/ (already in the registry)
- Category · Class: Scores, PBP, win probability, injuries, rosters, depth charts, news, odds (one book) · 🟠 Unofficial but commonly used (🔴 when used as a production feed)
- Probes (Nov. 25, one each): site.api scoreboard HTTP 200, 287 KB, 16 events, week 12, all `STATUS_SCHEDULED`; core league HTTP 200, 12 KB, keys `$ref, id, guid, uid, name, ... seasons, franchises, teams`; robots.txt: site.api.espn.com 403 (Akamai "Access Denied"), sports.core.api.espn.com 403, cdn.espn.com `Disallow: /`.
- History · Live · Latency: seconds (project registry, Nov. 21) · ids: ESPN ids (nflverse maps them to GSIS for ~80% of active players).
- Licensing: Disney Terms of Use bar automated access and dataset building (registry). Unchanged conclusion: owner-decision only, local use only (DEC-006).
- Scores: Q 8 / Cov 9 / Rel 7 / Lat 9 / Hist 6 / Doc 2 / DX 7 / Cost 10 / Lic 1 / Com 1 / RL ~6 / NFL 9 = **6.3**
- Recommendation: AVOID in production/public; keep the existing owner-decision local use only.
- Verified: 2026-11-25 — probes above.

### Yahoo Sports — undocumented editorial API
- Links: `api-secure.sports.yahoo.com/v1/editorial/s/scoreboard?leagues=nfl` · terms: https://legal.yahoo.com/us/en/yahoo/terms/otos/index.html (registry)
- Category · Class: Scoreboard JSON used by community projects · ⚫ Experimental/unstable (🟠)
- Probe (Nov. 25, one request): HTTP 404 JSON whose error description reads "sierra scream test triggered. slack #sports-apis-eol" — i.e. Yahoo is running an end-of-life "scream test" on this API. robots.txt request also answered 404 with the same API error envelope.
- Licensing: Yahoo ToS §2(e) bars commercial reuse (registry).
- Scores: not scored (being retired) · Recommendation: AVOID — the endpoint appears to be in the process of being shut down (Nov. 2026).
- Verified: 2026-11-25 — one probe.

### FOX Sports — "bifrost" API (api.foxsports.com)
- Links: `api.foxsports.com` · terms: https://www.foxsports.com/terms-of-use
- Category · Class: Scoreboards/stats behind FOX's web apps · 🔴 Scraping (key embedded in FOX's web app)
- Evidence: api.foxsports.com/robots.txt is `User-agent: * / Disallow: /` (Nov. 25). Community endpoints need an `apikey` parameter taken from FOX's own web pages; not probed (robots disallow; would require using FOX's key). FOX Terms of Use: "personal, non-commercial use"; may not "copy, download, ... scrape ... display" any Content; automated systems barred from collecting data.
- Recommendation: AVOID — no permission; using FOX's embedded key would also be unauthorised access.
- Verified: 2026-11-25 — robots.txt and Terms of Use read.

### CBS Sports and NBC Sports — no public score JSON identified
- CBS: www.cbssports.com/robots.txt disallows `/data/*`, `/component/*`, `/2/` and all of the site for GPTBot (Nov. 25); no documented public JSON API found; terms (registry) bar unauthorised scraping and redistribution. NBC: no NFL score API found; terms (registry) bar aggregating scrapers.
- Class: 🔴 if scraped · Recommendation: AVOID.
- Verified: 2026-11-25 — CBS robots.txt; no endpoint probes (no known key-free endpoint; not guessed).

### Associated Press — sports content
- Links: https://www.ap.org/content/topics/sports/football/ · https://developer.ap.org/ (lists AP Media API, AP Elections API, AP Metadata Services)
- Category · Class: Licensed news, photos, video; AP All-Pro; interactives · 🟡 Licensed/commercial
- Finding: the AP football page sells coverage ("exclusive photo access to every NFL game") and AP's developer portal lists no sports-data API; AP Interactives offered live scoreboards for the 2026 World Cup, not for the NFL. No AP NFL scores/stats feed found.
- Recommendation: not a data source; possible licensed news/photo source for a commercial phase (contact sales).
- Verified: 2026-11-25 — ap.org football, data and interactive-graphics pages and developer.ap.org via curl (WebFetch refused www.ap.org).


## 3. Matrix rows

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

## 4. Redundancy

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

## 5. Derived metrics

| RAW DATA REQUIRED | CALCULATION | RESULT |
|---|---|---|
| Two providers' scores for the same game with retrieval timestamps (e.g. Odds API scores + nflverse final) | Compare scores/status per game; flag mismatch > 0 points after final; log time-to-final per source | Source-agreement flag and per-provider "time to final" (measured latency) |
| Provider score change timestamps vs a reference clock (each poll's `last_update`/retrieval time) | For each scoring change, record first-seen time per source; median and P95 lag across a game day | Measured live latency per provider (fills the "measure over a full game day" registry checkbox) |
| nflverse rosters ids (gsis_id, espn_id, sportradar_id, fantasy_data_id, …) | Join any vendor's player id to `gsis_id`; count unmatched; keep an override file for manual fixes | Canonical player id + match-rate metric per vendor (2026 active roster coverage measured: espn 80%, sportradar 75%, fantasy_data 75%, yahoo 48%) |
| PBP rows (down, distance, yard line, clock, score, timeouts) from nflverse | Expected points / win probability via a refit nflfastR-style model (already in plan; backtest first) | Our own WP and EPA, so no vendor WP (Stats Perform MA21, BALLDONTLIE `home_win_probability`, ESPN) is needed |
| Box score/team stats per game | Success rate, yards/play, pace, red-zone and third-down rates | Team efficiency metrics (no vendor "advanced metrics" needed) |
| Odds snapshots (Odds API) | Already computed: median consensus, no-vig probabilities | Market consensus (odds track) |
| Per-source freshness (`retrieved_at`, provider `updated`) | now − last update vs expected cadence | Stale flag per source (e.g. SportsBlaze's 45-hour-stale "Scheduled" game) |

## 6. Gaps

- **Cannot be obtained easily or legally for free:** live play-by-play; intra-day injury updates; transactions; live win probability from an official source; raw Next Gen Stats tracking; official NFL stats feed (Genius Sports, contract only).
- **Expensive or quote-only:** Sportradar (no published price; trial explicitly forbids display); SportsDataIO commercial (quote; Discovery Lab is next-day and personal only); Genius Sports; Stats Perform; Data Sports Group; LSports. Published live prices: Rolling Insights $599/mo; Goalserve ~$300/mo (unverified); BALLDONTLIE $39.99/mo (provenance risk); Tank01 $10–100/mo (avoid).
- **Avoid, and why:**
  - Creativesdev "NFL API Data" (RapidAPI): its own listing says its data is "covered by us in real time Espn ... Api" and copies another vendor's marketing text — scraped resale.
  - Tank01 (RapidAPI): no licence found; returns ESPN ids, ESPN links and ESPN-hosted headshot/logo URLs — probable ESPN resale.
  - Firecrawl Alexandria: scraping intermediary for ESPN/NFL.com.
  - FOX bifrost, CBS, NBC, Yahoo editorial JSON: terms bar automated/commercial use; FOX's API host disallows all robots and needs FOX's embedded key; Yahoo's API is in an end-of-life "scream test".
  - SportsBlaze: no terms, key in URL, stale cache observed.
  - Sportradar and SportsDataIO trial/scrambled data must never be shown publicly (terms and "scrambled" data respectively).
  - Any vendor's team logos and player headshots (TheSportsDB third-party artwork, Tank01/ESPN images): trademark/copyright, consistent with the registry.

## 7. Contradictions & UNVERIFIED

**Conflicts with the project's docs**
- `docs/RESEARCH_PLAYOFF_PREDICTOR.md` (table row "ESPN scoreboard and injuries endpoints … Undocumented, no terms") conflicts with the registry and DEC-006 (Disney Terms of Use apply). New evidence on Nov. 25 supports DEC-006: site.api.espn.com and sports.core.api.espn.com refuse `/robots.txt` (403), cdn.espn.com/robots.txt is `Disallow: /`.
- `docs/RESEARCH_PLAYOFF_PREDICTOR.md` and DEC-006 option 3 treat "SportsDataIO, Sportradar" as "Sales contract" only. Partly outdated: SportsDataIO has a self-serve Discovery Lab ($99–149/mo) — but it is next-day and licensed for personal, non-display use, so it does not change the "skip for a public page" conclusion. Sportradar has a self-serve 30-day trial, which its terms forbid displaying.
- DEC-006 option 3 implies a licensed feed means SportsDataIO or Sportradar. Cheaper licensed options exist for live **scores** (The Odds API scores, ~30 s, ~$30/mo, terms already reviewed in the registry). For live **PBP**, no cheap option with a clean licence chain was found.
- The registry's The Odds API row covers odds only; its scores endpoint (NFL ✔, 1 credit/call) is not mentioned anywhere in the docs.
- GITHUB_RESEARCH lists dynastyprocess (GPL) as the crosswalk candidate; FEATURE_RESEARCH already corrected this to nflverse rosters. Measured today: nflverse `roster_2026.csv` (3,081 rows, 1,689 ACT) has gsis_id for all ACT players, espn_id 1,357, sportradar_id 1,272, fantasy_data_id 1,271, yahoo_id 807, sleeper_id 1,272 — confirms the correction.

**Conflicts between sources**
- Sportradar trial: Getting Started says trials last 30 days with 1,000 calls/rolling 30 days and 1 QPS; a search snippet of another product's FAQ says trial keys last 90 days. The NFL-relevant page (Getting Started) is used here.
- Sportradar v7 overview says "four delivery Push Feeds" but lists five.
- Genius Sports term: NFL.com (2023 extension) says through 2027–28; SportsPro (June 11, 2025) says through the end of the 2029 season. Both consistent with a later extension.
- API-Sports: official NFL page snippet gives PRO/ULTRA/MEGA "15.00/25.00/35.00" while its homepage snippet says prices start at "10$ per month".
- SportsDataIO developer comparison table places "Data is not real — cannot be used for analysis or display" in a way that could be read as applying to Discovery Lab; the Help Center says Discovery Lab is real data, next-day delayed. The Help Center reading is used.
- BALLDONTLIE: a third-party directory (jentic/slashdot via search) says no API key and 60 req/min; BALLDONTLIE's own docs (Nov. 25) require a key and give 5 req/min free.

**UNVERIFIED**
- Sportradar, SportsDataIO (commercial), Genius Sports, Stats Perform, Data Sports Group, LSports prices: not published.
- Whether Sportradar's player `references` include GSIS ids (example value has GSIS format; not labelled).
- Whether SportsDataIO's NFL stats are official or self-collected; whether Discovery Lab may be shown on a non-commercial public page (Help Center says raw data may not be displayed to users).
- MySportsFeeds live-tier price, delays and API licence; current NFL data-entry method beyond "crowd-sourcing … in-house staff".
- API-Sports (site behind a bot challenge) and Goalserve (connection refused) — all figures from search snippets or third parties.
- BALLDONTLIE, Highlightly, Rolling Insights, Tank01, The Odds API score upstreams.
- No provider's live latency was measured (no keys used); latencies above are documented figures only.
- AP: no NFL data product found; absence not proven (sales-only catalogue).

## 8. Research log

Web search budget for the session ran out after the queries below (tool message: 200 searches per turn shared by all agents); remaining providers were checked by fetching their own sites directly. No search engine was queried by other means.

| # | Query / URL | Tool | Outcome |
|---|---|---|---|
| 1 | Sportradar NFL API v7 trial QPS 1000 requests | WebSearch | ok |
| 2 | Sportradar NFL v7 references origin gsis player id | WebSearch | ok (no GSIS mention found) |
| 3 | Sportradar NFL partnership official data 2025 2026 Genius Sports exclusive | WebSearch (extended) | ok |
| 4 | Sportradar NFL deal ended 2021 Sportradar NFL data rights status | WebSearch | ok |
| 5 | Sportradar developer portal terms and conditions trial API key commercial use display | WebSearch | ok |
| 6 | Sportradar NFL API price per month small developer cost | WebSearch | ok (no official price) |
| 7 | SportsDataIO Discovery Lab NFL price per month personal use | WebSearch (extended) | ok (third-party figures; superseded by page JSON) |
| 8 | discoverylab.sportsdata.io terms of service personal use non-commercial display | WebSearch | ok |
| 9 | SportsDataIO NFL player GlobalTeamID SportRadarPlayerID YahooPlayerID RotoWirePlayerID fields | WebSearch | ok (superseded by dictionary grep) |
| 10 | Genius Sports NFL official data feed media partners API developer documentation | WebSearch (extended) | ok |
| 11 | "Genius Sports" NFL "official data" media companies fantasy apps license feed product name 2026 | WebSearch | ok |
| 12 | Stats Perform Opta American football NFL data feed 2026 | WebSearch | ok |
| 13 | MySportsFeeds NFL pricing non-commercial personal live | WebSearch | irrelevant results |
| 14 | MySportsFeeds API v2.1 NFL "live" subscription delay minutes near-realtime | WebSearch | no MSF source |
| 15 | balldontlie terms of service API commercial use attribution | WebSearch | no primary result |
| 16 | api-sports american football API NFL free plan 100 requests per day pricing | WebSearch (extended) | ok (snippets) |
| 17 | Goalserve NFL API prices monthly live scores play by play injuries feed | WebSearch (extended) | ok (snippets) |
| 18 | Rolling Insights DataFeeds NFL API pricing live play-by-play | WebSearch | refused (budget exhausted) |
| 19 | SportsBlaze NFL API pricing free tier | WebSearch | refused (budget exhausted) |
| 20 | developer.sportradar.com/football/reference/nfl-overview | WebFetch | ok |
| 21 | developer.sportradar.com/getting-started/docs/your-account | WebFetch | ok |
| 22 | developer.sportradar.com/football/docs/nfl-ig-api-basics | WebFetch | ok |
| 23 | developer.sportradar.com/football/docs/nfl-ig-id-handling | WebFetch | ok |
| 24 | developer.sportradar.com/football/docs/nfl-ig-rosters | WebFetch | ok |
| 25 | developer.sportradar.com/football/reference/nfl-faq | WebFetch | ok (first 100K chars) |
| 26 | developer.sportradar.com/football/docs/nfl-ig-fundamentals | WebFetch | ok |
| 27 | developer.sportradar.com/football/docs/nfl-ig-update-frequencies | WebFetch | ok |
| 28 | developer.sportradar.com/football/docs/nfl-ig-push | WebFetch | ok |
| 29 | developer.sportradar.com/terms-and-conditions | WebFetch | ok (updated Nov. 13, 2026) |
| 30 | developer.sportradar.com/Official_Media_Data_Addendum | WebFetch | ok (Aug. 25, 2025) |
| 31 | frontofficesports.com/article/nfl-could-fetch-250m-for-its-data/ | WebFetch | ok (dated Mar. 24, 2021; old) |
| 32 | sportspro.com … nfl-genius-sports … june-2025 | WebFetch | ok |
| 33 | businesswire.com/news/home/20250611456305/en/… | WebFetch | refused (403) |
| 34 | nfl.com/news/nfl-extends-strategic-partnership-with-genius-sports | WebFetch | ok |
| 35 | geniussports.com · developer.geniussports.com | WebFetch | ok |
| 36 | sportsdata.io/nfl-api · /pricing · /free-trial · /terms-of-service | WebFetch | ok |
| 37 | sportsdata.io/developers/getting-started · /help/data-rights-and-licensing-questions · /help/refresh-rates-feeds-and-timing | WebFetch | ok |
| 38 | discoverylab.sportsdata.io/ and /personal-use-apis/nfl | WebFetch + curl | WebFetch JS-template only; curl 200 (73 KB) with embedded plan JSON (prices, limits, delivery hints) |
| 39 | sportsdata.io/developers/data-dictionary/nfl | WebFetch + curl | WebFetch truncated; curl 200 (897 KB), id fields grepped |
| 40 | developers.statsperform.com/coverage-and-data-rights | WebFetch | ok (June 2026) |
| 41 | mysportsfeeds.com/feed-pricing/ · /faq/ · /terms-use/ · /data-feeds/ · /how-it-works/ · /logos/ | WebFetch + curl | ok; /terms-of-service/ 404 |
| 42 | gh api orgs/MySportsFeeds/repos | gh | ok |
| 43 | nfl.balldontlie.io · balldontlie.io/terms.html · balldontlie.io/openapi/nfl.yml | WebFetch + curl | ok |
| 44 | api-sports.io/documentation/american-football/v1 · /pricing · /sports/nfl · /sports/american-football · api-football.com/terms | WebFetch + curl | refused (403, Cloudflare challenge; not bypassed) |
| 45 | v1.american-football.api-sports.io/status (no key) | curl | 403 JSON "Missing application key" |
| 46 | rapidapi.com/api-sports/api/api-american-football | curl | 200 but generic page, no plan data |
| 47 | firecrawl.dev/blog/best-nfl-apis | WebFetch | ok (Nov. 19, 2026) |
| 48 | highlightly.net/nfl-api/ · /nfl-api/documentation/ · /terms/ | WebFetch + curl | ok; /terms-and-conditions 404 |
| 49 | goalserve.com/sport-data-feeds/nfl-api/prices (https, http, /en/) and goalserve.com root | WebFetch + curl | refused (ECONNREFUSED / timeout) |
| 50 | thesportsdb.com/docs_api_data_types · /pricing · /docs_terms_of_use.php · /free_sports_api | WebFetch | ok |
| 51 | rolling-insights.com/ · /datafeeds/price-plans/ · /datafeeds/nfl-api/ · /terms-of-services/ | WebFetch + curl | ok |
| 52 | datasportsgroup.com/ · /coverage/american-football/ | WebFetch + curl | ok |
| 53 | lsports.eu/ · /sports/american-football | WebFetch + curl | ok |
| 54 | enetpulse.com/ · /sports-data-api/ · /sports-data-feeds/ | curl | ok (no NFL) |
| 55 | sportmonks.com/ · /football-api/plans-pricing/ | curl | ok (no NFL) |
| 56 | sportsblaze.com (bundle) · docs.sportsblaze.com · assets.sportsblaze.com/sportsblaze_feeds.json · cache.sportsblaze.com/boxscores/nfl/2026-11-23 | curl + WebFetch | ok (stale data observed) |
| 57 | rapidapi.com/tank01/api/tank01-nfl-live-in-game-real-time-statistics-nfl · tank01.com | WebFetch + curl | WebFetch title only; curl 200 with description and pricing |
| 58 | gh search code sleeperBotID; gh api repos/acypert/tank01-nfl-ts-client (schemas.ts) | gh | ok |
| 59 | rapidapi.com/creativesdev/api/nfl-api-data | WebFetch + curl | ok (meta description) |
| 60 | robots.txt: site.api.espn.com (403), sports.core.api.espn.com (403), cdn.espn.com (Disallow: /), api-secure.sports.yahoo.com (404 API error), api.foxsports.com (Disallow: /), www.cbssports.com (200), api.sportradar.com (404), api.sportsdata.io (401), www.foxsports.com, www.nbcsports.com, www.ap.org | curl | as stated |
| 61 | site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard | curl (1 request) | 200 JSON, 16 events, week 12 |
| 62 | sports.core.api.espn.com/v2/sports/football/leagues/nfl | curl (1 request) | 200 JSON league object |
| 63 | api-secure.sports.yahoo.com/v1/editorial/s/scoreboard?leagues=nfl | curl (1 request) | 404 JSON "sierra scream test triggered. slack #sports-apis-eol" |
| 64 | api.sportradar.com/nfl/official/trial/v7/en/league/hierarchy.json (no key) | curl | 403 HTML "Authentication Error" |
| 65 | api.sportsdata.io/v3/nfl/scores/json/Teams (no key) | curl | 401 JSON "API key missing in request" |
| 66 | api.balldontlie.io/nfl/v1/teams (no key) | curl | 401 "Unauthorized" |
| 67 | foxsports.com/terms-of-use · fox.com/terms-of-use | curl | ok |
| 68 | ap.org/ · developer.ap.org · ap.org/content/topics/sports/football/ · /content/formats/data/ · /content/topics/sports/interactive-graphics/ | curl (WebFetch refused www.ap.org) | ok |
| 69 | the-odds-api.com/liveapi/guides/v4/ · /sports-odds-data/sports-apis.html · homepage | WebFetch | ok |
| 70 | github.com/nflverse/nflverse-data/releases/download/rosters/roster_2026.csv | curl | 200, 985 KB; id coverage counted |
| 71 | gh api nflverse/nflreadr data-raw/dictionary_rosters.csv, dictionary_ff_playerids.csv | gh | ok |
| 72 | gh api aaronweldy/espn-openapi (play.py model; search by field names) | gh | ok |
| 73 | Project files read: CLAUDE.md, docs/NFL_DATA_SOURCE_REGISTRY.md, docs/GITHUB_RESEARCH.md, docs/FEATURE_RESEARCH.md (160–244), docs/DECISIONS.md (DEC-006), docs/RESEARCH_PLAYOFF_PREDICTOR.md (table), lib/fabric/adapters/espn.js (grep) | Read/grep | ok (read-only) |
