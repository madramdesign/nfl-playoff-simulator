# R7 — Betting odds, line history, splits, prediction markets

Research track R7, NFL Universe. Researched 2026-11-25 (all "read" dates below are 2026-11-25 unless stated). Read-only with respect to the repository. Probes: at most one or two key-free requests per host, User-Agent `nfl-universe-research/1.0`, no keys, no cookies, no sign-ins.

## 1. Summary

The Odds API should stay the primary source. Its terms (Aug. 31, 2026) allow display, including commercial display, and indefinite storage. They forbid redistributing the data as a standalone product.
- **Free tier:** 500 credits a month; documented polling of 60 s before games and 40 s in play.
- **Paid plans:** NFL props, period and alternate lines, exchange and prediction-market rows, and history from 2020-06-06.

No free source can lawfully supply splits, per-game handle, true closing lines or prediction-market prices to a public page:
- **Splits.** Action Network, VSiN and Covers bar reuse. Covers' "consensus" is contest picks, not bets.
- **Kalshi.** API use is limited to the member's own trading.
- **Polymarket.** The international terms bar redistribution. Polymarket US's terms could not be read.
- **Sportsbook JSON.** Blocked (403 or 400); terms bar automated access.
- **Pinnacle.** Closed since 2025-07-23, except to applicants such as academic projects.
- **Licensed splits.** Sportradar and SportsDataIO only, under contract.

**History:** nflverse has one undocumented line per game (spreads from 1999, moneylines from 2006).

**Market size:** Indiana publishes monthly football handle; Nevada publishes football win and win %.

**Recommendations:** keep the consensus-only display, record our own snapshots, use Shin or power devig for futures, and label model-vs-market gaps as disagreement. Commercial shortlist: SportsDataIO, Sportradar, OpticOdds, TheRundown Pro.

**Confidence:** high where pages were read, medium on prices, low where marked UNVERIFIED.

## 2. Catalog

### The Odds API — v4 odds, events, scores, historical
- Links: https://the-odds-api.com/ · https://the-odds-api.com/liveapi/guides/v4/ · https://the-odds-api.com/terms-and-conditions.html · markets https://the-odds-api.com/sports-odds-data/betting-markets.html · intervals https://the-odds-api.com/sports-odds-data/update-intervals.html · books https://the-odds-api.com/sports-odds-data/bookmaker-apis.html
- Category · Class: odds aggregator (multi-book) · 🟡 Licensed/commercial (self-serve key; free tier)
- Provides: ML (`h2h`), spread, total, outrights/futures, `h2h_lay` for exchanges; per-event "additional markets": `alternate_spreads`, `alternate_totals`, `team_totals`, `alternate_team_totals`; period markets `h2h_/spreads_/totals_/team_totals_` × `q1–q4`, `h1`, `h2` (and alternates); NFL player props: passing (`player_pass_yds`, `_tds`, `_attempts`, `_completions`, `_interceptions`, `_longest_completion`, `player_pass_yds_q1`), rushing (`player_rush_yds`, `_attempts`, `_tds`, `_longest`), receiving (`player_receptions`, `player_reception_yds`, `_tds`, `_longest`), combos (`player_pass_rush_yds`, `player_rush_reception_yds`, `player_pass_rush_reception_tds/yds`, `player_rush_reception_tds`), defense (`player_sacks`, `player_solo_tackles`, `player_tackles_assists`, `player_defensive_interceptions`), kicking (`player_field_goals`, `player_kicking_points`, `player_pats`), TD scorers (`player_anytime_td`, `player_1st_td`, `player_last_td`, `player_tds_over`), plus `_alternate` milestone variants. Additional markets and props only via `/v4/sports/{sport}/events/{eventId}/odds`, one event at a time (markets page). Books (bookmaker page): `us` DraftKings, FanDuel, BetMGM, BetRivers, BetUS, Bovada, BetOnline.ag, LowVig.ag, MyBookie.ag, Caesars (`williamhill_us`, paid only), Fanatics (paid only); `us2` Bally Bet, BetAnything, betPARX, Betwhale, Courtside (paid only), theScore Bet (`espnbet`), Fliff, Hard Rock Bet (+AZ/FL/OH variants), ReBet (paid only); `us_dfs` Dabble, ParlayPlay, DK Pick6, PrizePicks, Underdog ("indicative only"); `us_ex` BetOpenly, **Kalshi, Polymarket, Polymarket (US), Novig, ProphetX**, Limitless; `eu` includes Pinnacle with the note "Odds are from public website which may incur a delay".
- History · Live · Latency: historical snapshots from 2020-06-06 at 10-minute intervals, 5-minute from Sept 2022; additional markets (props, alternates, periods) from 2023-05-03T05:30Z (guide) · yes (in-play odds and scores; scores "update approximately every 30 seconds") · documented update intervals: featured markets 60 s pre-match / 40 s in-play; additional markets incl. props 60 s / 60 s; outrights 5 min / 60 s; exchanges 20 s / 10 s; interval shrinks from 6 h before kickoff (update-intervals page). These are the provider's polling intervals, not end-to-end latency (inference).
- Coverage: "over 100 bookmakers" across us/us2/us_dfs/us_ex/uk/eu/au/ca; NFL key `americanfootball_nfl`; futures key `americanfootball_nfl_super_bowl_winner` (guide example; no division/conference futures key seen in the guide).
- Technical: REST only (no WebSocket/SSE documented) · JSON · SDK: none official (code samples; Excel/Google Sheets add-ons) · Auth: key as `apiKey` query parameter or `x-api-key` header ("for extra privacy"; the project's header use is documented); `bookmakers=` up to 10 books counts as 1 region; gzip supported · Rate limits: credit quota; bursts get HTTP 429 "try spacing out requests over several seconds"; headers `x-requests-remaining`, `x-requests-used`, `x-requests-last` · Pagination/Webhooks: none / none. Options `includeLinks` (bet-slip links), `includeSids`, `includeBetLimits` (exchanges), `includeRotationNumbers`.
- Cost: free: Starter 500 credits/month ("Most bookmakers", no Caesars/Fanatics/Courtside/ReBet) · credit costs: `/odds` = markets × regions; `/events/{id}/odds` = unique markets returned × regions; `/scores` 1 (2 with `daysFrom`); `/events`, `/sports` free; `/events/{id}/markets` 1; `/participants` 1; `/historical/odds` = 10 × markets × regions; `/historical/events` 1; `/historical/events/{id}/odds` = 10 × markets returned × regions; empty responses free (guide) · paid (home page, read today): 20K credits $30/mo, 100K $59, 5M $119, 15M $249; larger plans after sign-up · est. monthly for a small app: $0 (current 3-market, 2-looks-a-day pattern); $30 for one-region featured markets every 15 min on game days; props for all 16 games × ~10 prop markets ≈ 160 credits a look, so hourly props on Sundays needs the 100K plan ($59).
- Licensing (terms "Last updated 31 August 2026"): commercial: allowed — "Displaying our data in a UI, website, or mobile app, including for commercial use", provided the data "is not the primary product being sold" · redistribution: "Do not resell, repackage, or redistribute our data as a standalone data product" (also via your own API, feed or downloadable files) · caching/storage: "Storing our data and retaining it indefinitely" allowed · attribution: not required ("always appreciated") · other: no warranty, not betting advice, key revocable for abuse.
- Quality: accuracy good for regulated books (project's own first call Nov. 23 matched all teams); Pinnacle and offshore books come from public websites (delay); prediction-market rows are mid/ask-style prices from exchanges — check their units before mixing with sportsbook odds (UNVERIFIED shape). Completeness: no betting splits, no bet counts/handle.
- Scores: Q 8 / Cov 8 / Rel 8 / Lat ~7 / Hist 8 / Doc 9 / DX 9 / Cost 8 / Lic 7 / Com 7 / RL 5 / NFL 9 = **7.8**
- Recommendation: PRIMARY — already integrated (DEC-019); cheapest documented route to multi-book prices, props and (paid) 5-minute history since 2020 with display and storage rights; consensus-only public display remains the right reading of the "standalone data product" clause.
- Verified: 2026-11-25 — read the v4 guide, markets, update-intervals, bookmaker and terms pages and the pricing on the home page; no API call made (no key used).

### TheRundown — Sports Odds & Data API
- Links: https://therundown.io/ · pricing/licensing https://therundown.io/pricing/api · docs https://docs.therundown.io/ (not read today)
- Category · Class: odds aggregator · 🟡 Licensed/commercial (free tier)
- Provides: ML/spread/total, player props (Starter+ per FAQ), live in-play (row did not render; FAQ says Starter), opening and closing lines (Pro+), "+EV" (Pro+); books: free 3 (DraftKings, FanDuel, BetMGM), paid "All" incl. Pinnacle, Kalshi, Polymarket; "25+ data sources", "600+ market types".
- History · Live · Latency: odds history 7 days (Starter) / 30 d (Pro) / 90 d (Ultra) / 6 mo (Super) / 1 yr (Mega) / unlimited (Max) · yes · data delay: free 5 min, Starter 60 s, Pro 30 s, Ultra+ "real-time".
- Coverage: US-focused; NFL included (not itemised on the pricing page).
- Technical: REST; WebSocket from Ultra (1 connection × 3 subscriptions) up to Max (10 × 25) · JSON · SDK: an MCP server is advertised · Auth: key · Rate limits: data points — free 20,000/day and 200,000/month; Starter 25M/mo; Pro 125M; Ultra 500M; Super 1.25B; Mega 2.5B; Max 12.5B · Webhooks: not seen.
- Cost: free $0 · paid (pricing page): Starter $69, Pro $249, Ultra $599, Super $999, Mega $1,499, Max $3,499 per month; Enterprise custom; annual −20% · est. monthly for a small public app: $249 (Pro is the first tier licensed for public display).
- Licensing: free and Starter "internal business or personal use"; Pro+: commercial display in your app allowed with attribution "Data provided by TheRundown"; storing data to show history: Ultra+, only while subscribed; "Display rights end when your plan ends. If you cancel, delete the data you've stored"; redistribution/resale/white-label need a Supplemental Agreement; paid data may be used for backtesting and own models, not to train a general-purpose AI model.
- Quality: not tested. Opening/closing lines and long history are attractive, but deletion-on-cancel means our own archive would have to be deleted.
- Scores: Q ~8 / Cov 8 / Rel ~7 / Lat 8 / Hist 6 / Doc ~7 / DX ~7 / Cost 5 / Lic 4 / Com 6 / RL 8 / NFL 8 = **6.8**
- Recommendation: SECONDARY (commercial future) / AVOID for the current public page — free tier is personal/internal only; public display starts at $249/mo.
- Verified: 2026-11-25 — pricing/licensing page read; no API call.

### SportsGameOdds — Odds API
- Links: https://sportsgameodds.com/ · pricing https://sportsgameodds.com/pricing · terms https://sportsgameodds.com/terms
- Category · Class: odds aggregator · 🟡 Licensed/commercial (free tier)
- Provides: ML/spread/total, player and team props, alt lines, "fair odds", book consensus, pregame + live + "partials" (periods) on all plans; books: Amateur 9 (FanDuel, DraftKings, BetMGM, Caesars, ESPN BET, Bovada, Unibet, PointsBet, William Hill); Rookie 77; Pro 82 (adds bet365, Circa, Fanatics, Pinnacle, PrizePicks).
- History · Live · Latency: historical data Pro+ ("expanded" on All-Star); open/close not stated on pricing page (the project's earlier note "per-book open and close on some plans" not re-confirmed) · yes · update frequency: Amateur 10 min, Rookie 3 min, Pro "sub-minute".
- Coverage: free 8 leagues; NFL included.
- Technical: REST; WebSocket only on All-Star · JSON · Auth: key · Rate limits: Amateur 10 req/min and 2,500 objects/month (rolling 30 days); Rookie 50/min, 100K objects; Pro 300/min unlimited objects; shared caps 50,000 req and 250,000 objects/hour, 500,000 req and 3,000,000 objects/day.
- Cost: free Amateur · Rookie $99/mo · Pro $299/mo · All-Star custom; annual "save up to 40%".
- Licensing (Terms v3, "Last Updated: June 23, 2026"): limited, revocable licence; data may reach third parties only inside end-user applications "that have independent value"; resale, republishing, bulk exports and "Redistribute, republish, or provide access to Data" restricted; must delete all data within 30 days of termination (transformed/aggregated outputs that cannot reconstruct the data excepted); attribution such as "Powered by SportsGameOdds" allowed, provider notices must stay intact; no explicit commercial grant (paid plans, user responsible for legality).
- Quality: not tested; free tier too small (2,500 objects) for a weekly NFL slate with props.
- Scores: Q ~7 / Cov 8 / Rel ~7 / Lat 6 / Hist 5 / Doc ~7 / DX ~7 / Cost 6 / Lic 5 / Com 6 / RL 4 / NFL 8 = **6.3**
- Recommendation: OPTIONAL — a possible backup key; deletion-on-termination clause conflicts with keeping our own line archive unless only aggregated derivatives are kept.
- Verified: 2026-11-25 — pricing and terms read; no API call.

### OddsPapi — odds API
- Links: https://oddspapi.io/ · pricing https://oddspapi.io/en/pricing · blog (vendor marketing) https://oddspapi.io/blog/
- Category · Class: odds aggregator (global, many offshore/Asian books) · 🟡 Licensed/commercial (free tier)
- Provides: pre-game REST on free; live odds, player props, deeplinks on "Custom" plan; WebSocket on B2B plan.
- History · Live · Latency: "historical data" listed on free tier, depth not stated · paid only · not stated.
- Coverage: vendor claims 350+ bookmakers (blog title); NFL coverage not confirmed on the pricing page.
- Technical: REST, WebSocket (B2B) · JSON · Auth: key · Rate limits: free 250 requests/month.
- Cost: free 250 req/mo · Custom: price calculator did not render ("Loading...") · B2B: contact sales.
- Licensing: no licensing statement on the pricing page; terms not read (UNVERIFIED). Coverage disclaimer only.
- Quality: unknown; many books are offshore/Asian; US props coverage UNVERIFIED.
- Scores: Q ~6 / Cov ~7 / Rel ~6 / Lat ~5 / Hist ~6 / Doc ~6 / DX ~6 / Cost 7 / Lic ~4 / Com ~4 / RL 2 / NFL ~5 = **5.3**
- Recommendation: OPTIONAL — research curiosity (sharp/Asian books); not for production until terms are read.
- Verified: 2026-11-25 — pricing page read; terms UNVERIFIED.

### SharpAPI — odds, +EV, splits
- Links: https://sharpapi.io/ · pricing https://sharpapi.io/pricing · terms https://sharpapi.io/terms
- Category · Class: odds aggregator with derived analytics · 🟡 Licensed/commercial (free tier)
- Provides: ML/spread/total/props on "major US sportsbooks"; Pro adds "+EV & Middles", "Low Hold", "Betting Splits" (source of splits not stated); Sharp tier adds "sharp sportsbooks".
- History · Live · Latency: historical endpoints Enterprise only · yes · free 60 s delay; paid "real-time".
- Coverage: free 2 books (DraftKings, FanDuel); Hobby 5, Pro 15, Sharp 25; NFL listed.
- Technical: REST; streaming add-on (page says both "WebSocket Streaming" and "SSE push" — inconsistent) $99/mo (Hobby/Pro), $149 (Sharp); "Live Game State" add-on $79 · Auth: key · Rate limits: free 12 req/min; Hobby 120; Pro 300; Sharp 1,000 (60-second sliding window, HTTP 429).
- Cost: free · Hobby $79 · Pro $229 · Sharp $399 · Enterprise custom; 3-day trial with card.
- Licensing (terms "last updated October 25, 2026"): §5.1 display in your own app to your users while subscribed; §5.2 no resale/sublicence/redistribution of raw data, no standalone multi-book comparison product without agreement; §5.3 data stored during subscription may be kept and used internally indefinitely; §5.4 from Dec. 1, 2026 credit "Data provided by SharpAPI" wherever odds or derived figures are shown.
- Quality: young vendor (also maintains competitor-comparison pages); splits provenance unknown.
- Scores: Q ~6 / Cov 6 / Rel ~6 / Lat 7 / Hist 3 / Doc ~7 / DX ~7 / Cost 6 / Lic 6 / Com 6 / RL 6 / NFL 7 = **6.1**
- Recommendation: OPTIONAL — free tier (2 books) is a weak backup; clearest published terms among small vendors; splits not usable until their origin is disclosed.
- Verified: 2026-11-25 — pricing and terms read.

### Odds-API.io — odds API v3
- Links: https://odds-api.io/ · pricing https://odds-api.io/pricing · docs https://docs.odds-api.io/
- Category · Class: odds aggregator (global) · 🟡 Licensed/commercial
- Provides: "every sport and market", pre-match and live, 34 sports; "sharp books, exchanges and prediction markets" on paid plans; player props not stated.
- History · Live · Latency: "past odds and results" mentioned, depth not stated · yes · WebSocket push "in milliseconds" (vendor claim).
- Coverage: "500+" bookmakers claimed; US books not named on pages read.
- Technical: REST `https://api.odds-api.io/v3`, WebSocket `wss://api.odds-api.io/v3/ws` (2× plan price) · JSON · SDKs and an MCP server advertised · Auth: `apiKey` query parameter · Rate limits: 5,000 req/hour on every paid plan; legacy free keys 100/hour (500/day).
- Cost: **new free keys paused** (docs); Solo £49 (2 books), Starter £99 (5), Growth £179 (10), Pro £229 (15), Enterprise contact sales; partner programme 30% commission.
- Licensing: no terms statement on the pages read (UNVERIFIED).
- Quality: unknown.
- Scores: Q ~6 / Cov ~7 / Rel ~6 / Lat ~7 / Hist ~4 / Doc ~7 / DX ~7 / Cost 4 / Lic ~3 / Com ~4 / RL 7 / NFL ~5 = **5.6**
- Recommendation: AVOID for now — no free tier for new users, terms unread, US coverage unclear.
- Verified: 2026-11-25 — pricing page and docs index read.

### OddsBlaze — odds API
- Links: https://oddsblaze.com/ (pricing page is client-rendered; returned only a title to a plain fetch)
- Category · Class: odds aggregator (US, SGP pricing) · 🟡 Licensed/commercial
- Provides / History / Latency / Cost / Licensing: **UNVERIFIED** — official pricing and docs could not be read (JavaScript-only page). Third-party (competitor) pages claim $299/mo entry, 20+ books, SGP endpoint, push feed on Enterprise; not relied on.
- Scores: Q ~6 / Cov ~6 / Rel ~6 / Lat ~7 / Hist ~4 / Doc ~3 / DX ~4 / Cost 3 / Lic ~3 / Com ~4 / RL ~5 / NFL ~6 = **4.8**
- Recommendation: AVOID until its own terms and prices can be read.
- Verified: 2026-11-25 — HTTP 200 on /pricing but no content without JavaScript.

### OpticOdds (Grandstand; commonly reported as the OddsJam API successor — UNVERIFIED) — odds API and streams
- Links: https://opticodds.com/ · docs https://developer.opticodds.com/ · pricing https://opticodds.com/pricing
- Category · Class: odds aggregator (B2B) · 🟡 Licensed/commercial
- Provides: "200+ sportsbooks", main lines, alternates, props, outrights; prediction-market streams; settlement/results; "Price and bet point history", "Opening and closing line comparison".
- History · Live · Latency: historical endpoints `/fixtures/odds/historical` (depth not stated) · yes · "sub-second latency" (vendor claim).
- Technical: REST + SSE streaming (`/stream/...` for odds, results, futures, live stats, prediction markets) + RabbitMQ queues · JSON · Auth: key in header or query parameter · Rate limits: not stated in index.
- Cost: no published prices ("Book a Demo"); docs FAQ mentions a free trial (no details).
- Licensing: not published on pages read (UNVERIFIED).
- Relationship to OddsJam: the OddsJam API page (https://oddsjam.com/odds-api) returned HTTP 403 to both a fetch tool and curl; the OpticOdds home page does not mention OddsJam (only Grandstand in the footer). That OpticOdds is the OddsJam API's successor is commonly reported but **UNVERIFIED** from a primary source today.
- Scores: Q ~9 / Cov 9 / Rel ~8 / Lat 9 / Hist ~7 / Doc 7 / DX 7 / Cost 2 / Lic ~3 / Com 7 / RL ~7 / NFL 9 = **7.0**
- Recommendation: SECONDARY for a future commercial product (enterprise-grade streams); not for the fan project.
- Verified: 2026-11-25 — home, pricing and docs index read.

### Unabated — Odds API (Free / Concierge / Advantage / Enterprise)
- Links: https://unabated.com/odds-api · free https://unabated.com/odds-api/free · enterprise https://unabated.com/odds-api/enterprise · docs https://docs.unabated.com/ · GitHub https://github.com/UnabatedOrg/unabated-api-docs
- Category · Class: odds aggregator + sharp consensus ("Unabated Line") · 🟡 Licensed/commercial
- Provides: ML/spread/total, player props, futures, alt lines, SGPs, deeplinks; sources incl. DraftKings, FanDuel, BetMGM, Caesars, Hard Rock, theScore, Fanatics, bet365, BetRivers, Fliff, South Point, ProphetX, Novig, Kalshi, Polymarket, Polymarket U.S., SX Bet, STX, PrizePicks, Underdog (+ Circa, Bookmaker, "Sharp Book Price" on Concierge).
- History · Live · Latency: history not mentioned · yes · free 15-second delay; paid real time with SSE.
- Technical: REST (`data.unabated.com` per docs search result, not opened) + SSE (paid); WebSocket examples in the official GitHub repo (search result; not opened) · Auth: key · Rate limits: free 1 request per 5 s.
- Cost: Free "$0 while required monthly deeplink traffic targets are maintained"; Concierge $799/mo (NFL, NBA, MLB, NHL, WNBA; "No commercial use"); Advantage $2,999/mo all sports personal use; Enterprise contact sales (commercial use).
- Licensing: free tier = "qualifying content use" tied to sending bettors to sportsbooks via deeplinks (an affiliate-style obligation); Concierge non-commercial; Enterprise commercial per agreement; full terms not read.
- Quality: the Unabated Line is a respected vig-free consensus (industry reputation; not verified by us).
- Scores: Q ~9 / Cov 8 / Rel ~8 / Lat 8 / Hist ~3 / Doc 7 / DX 7 / Cost 2 / Lic 3 / Com 6 / RL 3 / NFL 9 = **6.1**
- Recommendation: AVOID for this project — the free tier requires deeplink traffic to sportsbooks, which conflicts with the project's rejection of affiliate links (FEATURE_RESEARCH §17); paid tiers are expensive.
- Verified: 2026-11-25 — free and overview pages read; docs/GitHub only via search results.

### SportsDataIO — Odds API (aggregated odds, props, futures, line movement, betting splits)
- Links: https://sportsdata.io/betting-data · NFL docs https://sportsdata.io/developers/api-documentation/nfl · coverage deck https://sportsdata.io/files/SDio_AggOddsCoverage.pdf · licensing FAQ https://sportsdata.io/help/data-rights-and-licensing-questions · developers https://sportsdata.io/developers · pricing https://sportsdata.io/pricing
- Category · Class: odds aggregator + splits + trends · 🟡 Licensed/commercial
- Provides: pre-game, in-play and alternate-market game odds with full line movement (`PreGameOddsLineMovement/{scoreid}/{sportsbookgroup}`, `LiveGameOddsLineMovement`, `InGameLineMovement`, `AlternateMarketGameOddsLineMovement`, "WithResulting" variants), player and team props (`BettingPlayerPropsByScoreID`), futures (`BettingFuturesBySeason`), "ConsensusOutcome" on every market, **betting splits** (`/v3/nfl/odds/json/BettingSplitsByScoreId/{scoreId}` and `BettingSplitsByMarketId/{marketId}`: "Money and Bet Percentage splits" per outcome with movement), trends/matchups. Coverage deck (© 2025): halves, quarters; books incl. Circa, FanDuel, BetMGM, Caesars, BetRivers, betPARX, ProphetX, Bovada, Fanatics, Underdog, an "io Consensus", PointsBet and another book "Historical Only".
- **Where the splits come from: not disclosed** in the NFL docs or the deck (deck lists "% of money" and "% of total tickets" as a supplemental product). Treat as an unnamed-sportsbook sample, not market-wide.
- History · Live · Latency: "Opening Lines + Real-Time Line Movement + Final Closing Lines"; historical odds via the Vault product (depth UNVERIFIED) · yes · documented call intervals: in-play odds 5 s; line movement 15 min; splits 15 min.
- Technical: REST (JSON/XML) · Auth: subscription key · free trial "only provides access to the UEFA Champions League" (stated on every NFL endpoint) and trial data is scrambled.
- Cost: no price list ("contact sales"; "no usage fees for unlimited API calls"). Discovery Lab (personal projects): real data, **next-day delayed**, 100–1,000 calls/day by tier, "Not licensed for commercial redistribution"; last season free; current prices not shown on the pages read (a search summary claimed $99/mo Odds tier — UNVERIFIED).
- Licensing: commercial licence for "public-facing, revenue-generating, or business-operated products"; attribution standard in commercial licences; no standalone redistribution; retention after termination negotiated.
- Quality: established B2B vendor; manual QA of markets (deck); splits provenance opaque.
- Scores: Q 8 / Cov 9 / Rel 8 / Lat 7 / Hist 8 / Doc 8 / DX 6 / Cost 2 / Lic 4 / Com 8 / RL 8 / NFL 9 = **7.1**
- Recommendation: SECONDARY for a future commercial product (one contract for odds + splits + props + history); AVOID for the fan page (Discovery Lab is next-day and personal-only).
- Verified: 2026-11-25 — NFL API docs downloaded and searched for endpoints and intervals; deck pages 1–4 read; licensing FAQ and developers page read.

### Sportradar — Odds Comparison (Prematch, Live, Player Props, Futures) and Insights Betting Splits
- Links: https://developer.sportradar.com/odds/reference/oc-prematch-overview · https://developer.sportradar.com/odds/reference/oc-player-props-overview · splits FAQ https://developer.sportradar.com/insights/reference/betting-splits-faq · trial rules https://developer.sportradar.com/getting-started/docs/your-account · terms https://developer.sportradar.com/terms-and-conditions
- Category · Class: odds comparison + betting splits (B2B) · 🟡 Licensed/commercial
- Provides: US prematch markets (≈58 market ids across sports) from a US book list of nine entries including "Consensus" (id 25080), DraftKings, FanDuel, ESPNbet; player props for NFL, NBA, MLB, NHL, NCAAF; change-log endpoints (prematch: odds changed in the last 5 minutes). **Betting splits**: ticket % and stake % for NFL moneyline, spread, total; source = "an aggregation of books" whose tickets Sportradar's integrity business ingests (books not named); raw bet counts may not be shown to end users; markets omitted when volume is low.
- History · Live · Latency: splits history "previous 200 days"; splits update hourly from 30 days out, minute-by-minute in the last hour · live odds product exists (trial via sales rep) · REST polling.
- Technical: REST, OpenAPI/XSD, Postman; an MCP server advertised · Auth: key; separate key for splits · Rate limits: trial keys (general rule) 1,000 calls per rolling 30 days and 1 QPS, 30-day trials (search summary of Sportradar's getting-started/football docs; a tennis page says 90 days).
- Cost: contact sales. Trial = "non-commercial ... internal testing and evaluation purposes only" (master terms via search summary).
- Licensing: commercial contract only; trial cannot back a public page.
- Quality: top-tier B2B; splits are one of the few with a stated (if unnamed) multi-book origin.
- Scores: Q 9 / Cov 9 / Rel 9 / Lat 8 / Hist 6 / Doc 8 / DX 6 / Cost 1 / Lic 3 / Com 9 / RL 4 / NFL 9 = **6.8**
- Recommendation: SECONDARY (commercial future: splits with documented aggregation); AVOID for the fan project.
- Verified: 2026-11-25 — prematch, player-props and splits FAQ pages read; trial limits from search summaries (UNVERIFIED in full).

### Genius Sports — official NFL betting data (operators only)
- Links: https://www.geniussports.com/content-hub/odds-api-explained/ · NFL extension press release https://www.businesswire.com/news/home/20250611456305/en (search result; not opened)
- Category · Class: official league data and odds for sportsbooks · 🟢 Official (licensed to operators) / 🟡 commercial
- Provides: official real-time NFL data, Next Gen Stats distribution, odds feeds and trading for operators, "watch and bet" low-latency video.
- Facts: the Genius page says the NFL partnership includes "the exclusive right to distribute official sports betting content to sports betting operators"; search results (BusinessWire, Covers, SBC News, June 11–12, 2025) report a multi-year extension through the end of the 2029 season (not opened; treat as reported).
- Access: sales only; no developer or public access found.
- Scores: Q 10 / Cov 9 / Rel 9 / Lat 10 / Hist ~6 / Doc ~3 / DX ~3 / Cost 1 / Lic 2 / Com 7 / RL ~5 / NFL 10 = **6.3**
- Recommendation: AVOID (not available to non-operators); note only as the origin of "official data".
- Verified: 2026-11-25 — Genius page read; 2025 extension from search results.

### LSports — Odds feed / TRADE360
- Links: https://lsports.eu/odds-feed · docs https://docs.lsports.eu/lsports/trade (search result)
- Category · Class: B2B odds feed for operators · 🟡 Licensed/commercial
- Provides: raw bookmaker lines and averaged odds, 100+ sports incl. American football; free trial via form; no prices ("customized packages").
- Scores: Q ~8 / Cov ~8 / Rel ~8 / Lat ~8 / Hist ~5 / Doc ~5 / DX ~4 / Cost 1 / Lic ~2 / Com 7 / RL ~6 / NFL ~6 = **5.7**
- Recommendation: AVOID (operator product, sales-gated).
- Verified: 2026-11-25 — odds-feed page read; pricing absent.

### Goalserve — Odds API / US sports feed
- Links: https://www.goalserve.com/sport-data-feeds/odds-api/prices (connection refused to the fetch tool today) · llms.txt https://www.goalserve.com/llms.txt (search result)
- Category · Class: odds + data feeds · 🟡 Licensed/commercial
- Provides (per search results, UNVERIFIED): 30+ bookmakers pregame and in-play; US sports feed with NFL ML/spread/total from FanDuel, DraftKings, ESPN Bet, BetCris, Pinnacle, Caesars; prices reported as All Sports Pregame odds $500/mo, Live odds $500/mo, NFL data $300/mo (another page $125/mo); 30-day free trial.
- Scores: Q ~6 / Cov ~6 / Rel ~6 / Lat ~6 / Hist ~5 / Doc ~4 / DX ~4 / Cost 3 / Lic ~3 / Com ~5 / RL ~5 / NFL ~5 = **4.8**
- Recommendation: AVOID — page unreachable today, conflicting prices, terms unread.
- Verified: UNVERIFIED (HTTPS connection refused from the fetch tool, 2026-11-25).

### BetsAPI — bookmaker odds APIs
- Links: https://betsapi.com/mm/pricing_table
- Category · Class: per-bookmaker odds (bet365, Betfair, 1xBet, Sbobet, BWin) · 🔴 Scraping (inference: bet365 and others offer no public API, so a third-party "Bet365 API" is collected from their sites)
- Provides: per-book packages $100–150/mo (3,600 req/h); "Everything API" $300/mo; American football "Events API" $10/mo; in-play "updates every 3-5 seconds"; one-day trials $1–2 ("price will be doubled up after each buy").
- Licensing: terms not read; redistribution rights from the underlying books are doubtful.
- Scores: Q ~5 / Cov ~5 / Rel ~5 / Lat 7 / Hist ~4 / Doc ~4 / DX ~4 / Cost 6 / Lic 1 / Com 1 / RL 6 / NFL 3 = **4.3**
- Recommendation: AVOID — likely scraped bookmaker data; must not be used in production.
- Verified: 2026-11-25 — pricing table read.

### Don Best Sports — odds screens (DBS4)
- Links: https://www.donbest.com/
- Category · Class: subscriber odds screens · 🟡 Licensed/commercial
- Facts: "www.DonBest.com is owned by Don Best Sports Corporation" (© 1995–2026); offers Odds, Scores, Screens, member software (DBS4); no API or data feed documented on the home page; "for news and entertainment purposes only".
- Scores: Q ~7 / Cov ~6 / Rel ~7 / Lat ~7 / Hist ~4 / Doc 2 / DX 2 / Cost 3 / Lic 2 / Com 3 / RL ~5 / NFL 7 = **4.6**
- Recommendation: AVOID — no developer access; screens are for human subscribers.
- Verified: 2026-11-25 — home page read; ownership by Sportradar/Genius not found (no acquisition evidence).

### ESPN scoreboard / game summary — embedded DraftKings line (already in use)
- Links: registry entry `espn-scoreboard` (docs/NFL_DATA_SOURCE_REGISTRY.md) · Disney ToU https://disneytermsofuse.com/english/
- Category · Class: single-book line inside a scoreboard feed · 🟠 Unofficial but commonly used (no licence; Disney ToU bars automated access)
- Provides: DraftKings spread, total, moneyline with open and current (registry, verified Nov. 21); per-game summary odds.
- Scores: Q 7 / Cov 4 / Rel 7 / Lat 8 / Hist 2 / Doc 3 / DX 8 / Cost 10 / Lic 2 / Com 1 / RL ~7 / NFL 8 = **5.6**
- Recommendation: FALLBACK only (existing owner decision DEC-006) — one book, no history, terms do not grant use.
- Verified: not re-probed today (registry Nov. 21).

### Action Network — public betting %, odds, PRO
- Links: https://www.actionnetwork.com/nfl/public-betting · terms https://www.actionnetwork.com/terms · robots https://www.actionnetwork.com/robots.txt · community scraper https://github.com/john-b-edwards/anscrapR
- Category · Class: betting splits (bets % / money %), multi-book odds, line history · 🔴 Scraping if automated (no public API; community packages hit an undocumented `api.actionnetwork.com/web/v1/...` path)
- Provides: NFL "% of bets" and "% of money" by side; odds from several books; PRO adds more splits/line-move tools (subscription). The page says splits are "usually tracked across major sportsbooks" — **the contributing books are not named**. The same page now pushes Polymarket/Kalshi/Novig promo codes (affiliate).
- History · Live · Latency: anscrapR README says odds data via the API date "back to 2017" (unverified by us) · live on site · unknown.
- Licensing: Terms "last updated on February 8th, 2018": claim ownership of "lines, odds, betting percentages"; use only for "personal, non-commercial home use"; no "deep-link", "page-scrape", "robot", "spider" access. robots.txt disallows query-string URLs (`/*?*`).
- Quality: methodology opaque; sample of partner books, not the market.
- Scores: Q ~5 / Cov 6 / Rel ~6 / Lat ~6 / Hist ~5 / Doc 1 / DX 3 / Cost 7 / Lic 1 / Com 1 / RL ~3 / NFL 8 = **4.3**
- Recommendation: AVOID — terms explicitly bar automated access and reuse of betting percentages; link out only.
- Verified: 2026-11-25 — terms page and robots.txt read with curl (WebFetch got 403); NFL public-betting page read; GitHub repo inspected (no licence asserted, last push 2024-05-19).

### VSiN — DraftKings and Circa betting splits
- Links: https://vsin.com/nfl/how-to-win-using-vsin-nfl-betting-splits/ (Aug. 9, 2025) · splits pages `https://data.vsin.com/nfl/betting-splits/`, `https://data.vsin.com/draftkings/betting-splits/`
- Category · Class: betting splits (handle % and bets %) from two named books · 🔴 Scraping if automated (no API)
- Provides: splits "from two different sportsbooks, DraftKings and Circa Sports"; updated "every five minutes"; article says provided for Pro members (subscription).
- Licensing: VSiN terms page not found (vsin.com/terms-of-use/ 404; no terms link in home-page HTML) — UNVERIFIED. The splits page answered HTTP 403 to a plain request (bot protection; not bypassed).
- Quality: best-documented provenance of any public splits (two named books), but two books are not the market; Circa is a sharp-leaning Nevada book, DraftKings a retail book — the difference is itself informative.
- Scores: Q ~6 / Cov 4 / Rel ~6 / Lat 7 / Hist 2 / Doc 3 / DX 1 / Cost 6 / Lic 1 / Com 1 / RL 1 / NFL 8 = **3.8**
- Recommendation: AVOID for ingestion; link-out at most. A licensed splits feed (Sportradar, SportsDataIO) is the lawful route.
- Verified: 2026-11-25 — article read; splits page 403; terms UNVERIFIED.

### Covers — consensus picks and "public money"
- Links: https://contests.covers.com/consensus/topconsensus/nfl/overall · FAQ https://contests.covers.com/consensus/faq · terms https://www.covers.com/terms
- Category · Class: contest-pick consensus (not real-money bets) · 🔴 Scraping if automated
- Provides: "The consensus shows the number of picks in the King of Covers contests made by all players"; "Public Money" = contest players' virtual money. Not sportsbook splits.
- Licensing: Terms "Last updated: 5 August 2026": content for "non-commercial entertainment and enjoyment"; may not be reproduced without written consent; no access "by any means other than through the interface".
- Note: `https://www.oddsshark.com/nfl/database` now redirects to `https://www.covers.com/sport/football/nfl/statistics#oddsshark` (observed 2026-11-25), so the OddsShark NFL database appears to live on Covers now (ownership not verified).
- Scores: Q 3 / Cov 5 / Rel 6 / Lat 6 / Hist 4 / Doc 4 / DX 2 / Cost 7 / Lic 1 / Com 1 / RL ~3 / NFL 5 = **3.9**
- Recommendation: AVOID — not betting data; terms bar reuse. Mislabelled as "public betting" by many sites.
- Verified: 2026-11-25 — FAQ and terms read; consensus page HTTP 200.

### Sportsbook public web endpoints — DraftKings, FanDuel, BetMGM, Caesars, Circa
- Links: DraftKings terms https://www.draftkings.com/help/terms · FanDuel terms https://www.fanduel.com/terms
- Category · Class: undocumented JSON used by sportsbook web apps · 🔴 Scraping — **must not be used in production without written permission**
- Probes (one each, no key, generic UA, 2026-11-25): DraftKings `sportsbook-nash.draftkings.com/api/sportscontent/dkusnj/v1/leagues/88808` → HTTP 403 Akamai "Access Denied"; FanDuel `sbapi.nj.sportsbook.fanduel.com/api/content-managed-page?page=CUSTOM&customPageId=nfl` → HTTP 400 `{"error":true}` (the web app adds an `_ak` app key we did not use); Caesars `api.americanwagering.com/.../nj/brands/czr/sb/v3/sports/americanfootball/events/schedule` → HTTP 403 CloudFront; BetMGM `sports.nj.betmgm.com/cds-api/bettingoffer/fixtures` → HTTP 403 HTML (`noindex,nofollow`); Circa: home page 200, no public odds endpoint found (Circa's odds are app-based; not probed further). Endpoints exist and are geo/bot-gated.
- Terms: FanDuel (updated July 16, 2026): no "robot, spider, scraper ... or other automated means" without written permission (RSS excepted). DraftKings terms (Last Updated 06/30/2026): bars "Using automated means (including ... bots, robots, parser, spiders or screen scrapers)". BetMGM, Caesars, Circa terms not read (UNVERIFIED).
- Scores: Q 9 / Cov 7 / Rel 3 / Lat 9 / Hist 1 / Doc 1 / DX 2 / Cost 10 / Lic 0 / Com 0 / RL 1 / NFL 9 = **4.3**
- Recommendation: AVOID — prohibited by terms, geo-fenced, bot-protected; use a licensed aggregator instead.
- Verified: 2026-11-25 — probes and terms as listed.

### Pinnacle — API (closed to the public)
- Links: https://github.com/pinnacleapi/pinnacleapi-documentation (README; last push 2026-09-11)
- Category · Class: sharp sportsbook API · 🟡 Licensed (by application only)
- Facts: README: "Access to Pinnacle API suite has been closed for the general public since July 23rd, 2025"; Pinnacle offers "bespoke data services for select high value bettors & commercial partnerships" and "also support[s] academics and pregame handicapping projects" — apply by describing the use case to api@pinnacle.com. Requires a funded account (Basic auth). Pinnacle is not licensed in US states (inference; Pinnacle does not accept US customers — UNVERIFIED today).
- Indirect: The Odds API's `eu` region lists Pinnacle "from public website which may incur a delay" — i.e., a scraped chain; treat those rows as lower-provenance.
- Scores: Q 10 / Cov 6 / Rel 8 / Lat 9 / Hist ~3 / Doc 7 / DX 6 / Cost ~5 / Lic 3 / Com 3 / RL ~5 / NFL 8 = **6.1**
- Recommendation: OPTIONAL — the owner could email an academic/pregame-handicapping application for closing-line benchmarks; do not rely on it.
- Verified: 2026-11-25 — README read via `gh api`. Project doc's date (July 23, 2025) confirmed; the "academic/pregame" route is new information.

### Kalshi — Trade API v2 (public market data) — CFTC-regulated exchange
- Links: https://docs.kalshi.com/ · historical data https://docs.kalshi.com/getting_started/historical_data · rate limits https://docs.kalshi.com/getting_started/rate_limits · Developer Agreement v1.1 https://kalshi-public-docs.s3.amazonaws.com/Kalshi-Developer-Agreement.pdf
- Category · Class: prediction market / event-contract exchange · 🟢 Official (exchange's own API; terms restrictive)
- Provides (probe of `GET https://api.elections.kalshi.com/trade-api/v2/series?category=Sports`, no auth, HTTP 200, 4,331 series, 406 with NFL/Pro Football in ticker or title): game winner `KXNFLGAME`, spread `KXNFLSPREAD`, total `KXNFLTOTAL`, 1st-half winner `KXNFL1HWINNER`, quarter markets (`KXNFL2QTOTAL`, `KXNFL4QSPREAD`), player props (`KXNFLANYTD`, `KXNFLFIRSTTD`, `KXNFLPASSYDS`, `KXNFLRSHYDS`, `KXNFLRECYDS`), futures (`KXSB` Super Bowl, `KXNFLAFCCHAMP`, division winners e.g. `KXNFLAFCEAST`, `KXNFLPLAYOFF` playoff qualifiers, `KXNFLWINS-<team>` win totals, `KXNFLMVP`), novelty. Series records carry `settlement_sources`, `contract_terms_url`, `fee_type`.
- History · Live · Latency: historical candlesticks `GET /historical/markets/{ticker}/candlesticks`, trades `GET /historical/trades`, cutoffs `GET /historical/cutoff` · live order book and trades (WebSocket, auth) · exchange-native, real time.
- Technical: REST + WebSocket · JSON · SDKs official · Auth: none needed for the public series probe; API keys for trading · Rate limits: token budgets per tier (Basic 200 read tokens/s; most requests cost 10 tokens; unauthenticated public requests have "separate limits").
- Cost: free.
- Licensing: Developer Agreement v1.1 §3: "Use of Kalshi APIs is expressly limited to facilitating a members own trading"; §3.1 prohibits "Collecting, caching, aggregating, or storing data" except for own trading, and "You may not share such data ... with third parties ... without prior written authorization"; §4.1.1 must be a Kalshi member; §6.4 public statements about Kalshi need approval. **Confirms the project's existing reading (FEATURE_RESEARCH §17).**
- Legal status (Covers, Nov. 25, 2026): New York AG seeks to bar Kalshi sports contracts; on Nov. 23, 2026 Justice Melissa Crane declined a TRO; Third Circuit sided with Kalshi (NJ), three other circuits against; NJ has petitioned the Supreme Court; Kalshi "forced out of" NV, MI, WA, LA, UT (as reported by Covers).
- Scores: Q 8 / Cov 8 / Rel 8 / Lat 9 / Hist 8 / Doc 8 / DX 8 / Cost 10 / Lic 1 / Com 1 / RL 7 / NFL 8 = **7.0**
- Recommendation: AVOID direct ingestion (terms) — keep link-out; possible lawful path = a licensed aggregator that lists Kalshi (The Odds API `us_ex`, TheRundown paid, Unabated) **if** that aggregator's own rights are confirmed in writing (UNVERIFIED).
- Verified: 2026-11-25 — public series endpoint probed; Developer Agreement PDF read in full (6 pages); rate-limit and historical pages read.

### Polymarket (international) — Gamma, CLOB, Data API
- Links: docs https://docs.polymarket.com/ · API overview https://docs.polymarket.com/getting-started/api.md · rate limits https://docs.polymarket.com/api-reference/rate-limits.md · prices history https://docs.polymarket.com/api-reference/markets/get-prices-history.md · terms https://polymarket.com/tos
- Category · Class: crypto-settled prediction market · 🟠 Unofficial for US use (US persons barred from trading on this platform)
- Provides (probe `GET https://gamma-api.polymarket.com/events?tag_slug=nfl&closed=false&limit=50`, HTTP 200, 4.6 MB): Super Bowl ("Pro Football: 2027 Champion", 33 markets, volume ≈ $75.2M), AFC/NFC champions, all eight division winners, "Team to Make Postseason" (32 markets), MVP, stat leaders, draft, coaching novelties. Market fields include `outcomePrices`, `bestAsk`, `lastTradePrice`, `spread`, `volume`, `clobTokenIds`, `resolutionSource`.
- History · Live · Latency: `GET https://clob.polymarket.com/prices-history?market=<asset id>&startTs&endTs...` and Data API v2 `/v2/prices-history` · public market WebSocket `wss://ws-subscriptions-clob.polymarket.com/ws/market`; Sports WebSocket `wss://sports-api.polymarket.com/ws` · real time.
- Technical: REST + WebSocket · JSON · public reads need no credentials · Rate limits (Cloudflare, IP-based, throttled not rejected): Gamma 4,000 req/10 s general, `/events` 500/10 s; Data API v2 800/10 s; CLOB 9,000/10 s.
- Licensing: ToS "Effective as of August 11, 2026": no "data mining tools, robots, crawlers"; data distributors may not "Sell, resell, sublicense, redistribute, or otherwise commercially exploit the Data" without written agreement; trading "IS NOT PERMITTED" for US persons. API spec file carries an MIT licence — that covers the spec, not the market data.
- Scores: Q 7 / Cov 7 / Rel 7 / Lat 9 / Hist 7 / Doc 8 / DX 8 / Cost 10 / Lic 2 / Com 1 / RL 9 / NFL 7 = **6.8**
- Recommendation: AVOID ingestion (terms; US-person restriction) — link-out only, as the project already decided.
- Verified: 2026-11-25 — Gamma probe; docs index, API overview, rate limits, prices-history spec and ToS read.

### Polymarket US (QCX LLC) — regulated US exchange API
- Links: https://polymarket.us/ · API https://docs.polymarket.us/api-reference · terms https://polymarket.us/tos (client-rendered; text not retrievable)
- Category · Class: CFTC-regulated DCM ("operated by QCX LLC d/b/a Polymarket US, a CFTC-regulated Designated Contract Market" — site footer/JSON-LD) · 🟢 Official (exchange API)
- Provides: NFL game markets listed on the home page (e.g., "GB Packers vs LA Rams"); public data API `https://gateway.polymarket.us` (markets, order books, BBO, settlement prices, price history, events, series, sports schedules) without API key; trading API `https://api.polymarket.us` with key; WebSockets `wss://api.polymarket.us/v1/ws/markets` and `/ws/private`.
- Licensing: **UNVERIFIED** — US terms text not retrievable (JavaScript-only); API reference has no data-use statement (support@polymarket.us).
- Scores: Q 7 / Cov ~6 / Rel ~7 / Lat 9 / Hist ~6 / Doc 7 / DX 7 / Cost 10 / Lic ~3 / Com ~3 / RL ~6 / NFL 7 = **6.5**
- Recommendation: OPTIONAL — the most promising prediction-market candidate **if** its US terms permit display; owner must read terms or ask in writing before any use.
- Verified: 2026-11-25 — home page HTML and API reference read; terms UNVERIFIED.

### Novig, ProphetX, Sporttrade — US exchanges / prediction markets
- Links: https://www.prophetx.co/ · https://novig.com/ (fetch answered 405) · https://getsporttrade.com/
- Category · Class: peer-to-peer sports exchanges / prediction markets · ⚫ Experimental/unstable (regulatory status shifting; no public data API found)
- Facts: ProphetX calls itself "America's #1 Sports Prediction Market", lists NFL (16), NFL Futures (5), NFL Win Totals (29) etc.; no public API mentioned. Sporttrade's site says "CFTC-REGULATED — RELAUNCHING SOON" with an API-for-trading waitlist checkbox. Novig page not readable (HTTP 405). Novig and ProphetX prices are available through The Odds API `us_ex` and Unabated.
- Scores: Q ~6 / Cov ~5 / Rel ~4 / Lat ~8 / Hist ~2 / Doc 1 / DX 1 / Cost ~5 / Lic ~2 / Com ~2 / RL ~3 / NFL 6 = **3.8**
- Recommendation: AVOID directly; reachable via aggregators if ever needed.
- Verified: 2026-11-25 — home pages as noted.

### Robinhood and Crypto.com event contracts
- Links: https://robinhood.com/us/en/prediction-markets/ · https://crypto.com/us/prediction
- Category · Class: broker/exchange event contracts · 🟢 Official (regulated) / no data API for third parties
- Facts: Robinhood lists 16 NFL markets; "Event contracts are offered by Robinhood Derivatives, LLC" (the page does not name the clearing exchange). Crypto.com: predictions offered by "Crypto.com | Derivatives North America (CDNA), a CFTC-regulated exchange"; Sports category; NFL not named on the page; no public market-data API described.
- Recommendation: AVOID (no data API; consumer apps).
- Verified: 2026-11-25 — pages read.

### Betfair Exchange API
- Links: https://support.developer.betfair.com/hc/en-us/articles/115003864651-How-do-I-get-started · restricted regions https://support.developer.betfair.com/hc/en-us/articles/28271961503516-Which-IP-regions-are-restricted-from-accessing-the-Betfair-API
- Category · Class: betting exchange · 🟡 Licensed (account + app key)
- Facts: each account gets a Delayed App Key (development, delayed data) and a Live App Key (inactive until approved); live key needs KYC-verified, funded account and "A one-off activation fee of £499"; IP-region restrictions exist (the US list could not be extracted — UNVERIFIED). Betfair lists NFL markets (common knowledge; not probed). Display/redistribution licence not read.
- Scores: Q 9 / Cov 6 / Rel 9 / Lat 9 / Hist ~5 / Doc 8 / DX 6 / Cost 3 / Lic ~2 / Com ~3 / RL ~6 / NFL 5 = **5.9**
- Recommendation: AVOID — requires a Betfair account the owner likely cannot open from the US; NFL liquidity is secondary to US books.
- Verified: 2026-11-25 — getting-started article read.

### Smarkets — public events API
- Links: https://docs.smarkets.com/ (title only) · probe `https://api.smarkets.com/v3/events/?type=american_football_match&state=upcoming&limit=5`
- Category · Class: UK betting exchange · ⚫ Experimental for this project (terms unread)
- Facts: key-free probe HTTP 200 JSON with NFL events (e.g., "Philadelphia Eagles at Dallas Cowboys", start 2026-11-26T21:30:00Z, `inplay_enabled: true`). Prices need further endpoints (not probed). Terms and data licence UNVERIFIED.
- Scores: Q ~7 / Cov 4 / Rel ~7 / Lat 8 / Hist ~3 / Doc 4 / DX 6 / Cost 10 / Lic ~2 / Com ~2 / RL ~5 / NFL 4 = **5.2**
- Recommendation: AVOID until terms are read; thin NFL liquidity likely (inference).
- Verified: 2026-11-25 — one events probe.

### nflverse `nfldata` — games.csv lines (already in use) and legacy line files
- Links: https://github.com/nflverse/nfldata · fields https://github.com/nflverse/nfldata/blob/master/DATASETS.md
- Category · Class: open historical lines · 🔵 Public/open data (no licence file; facts with credit)
- Provides: `games.csv` `spread_line`, `total_line`, `away/home_moneyline`, `away/home_spread_odds`, `under/over_odds`. DATASETS.md defines `spread_line` only as "The spread line for the game" (positive = home favoured) — **no source, no open/close timing** (confirms the project's note). Measured today: spreads/totals for every game 1999–2025; moneylines from 2006 (220 of 267 games) and complete from 2010; 2026: 193 of 272 games, including 30 not yet played (lines for upcoming games are filled in and presumably overwritten until kickoff — so the value is "latest seen", likely near-close after the game; inference). DATASETS.md still says "Data begins with the 2006 NFL season" — stale vs. the 1999 rows.
- Legacy files in `data/` (stale, last commits 2019–2021): `closing_lines.csv` (20,490 rows, 2006–2018, type/side/line/odds/outcome; last commit 2019-11-15 "Removing wrong odds info"), `initial_lines.csv` (2021 look-ahead lines from sportsbook code "WSGT" — Westgate, inference), `sc_lines.csv` (2013–2020), `win_totals.csv` (2003–2020 preseason win totals with odds).
- Scores: Q 7 / Cov 5 / Rel 8 / Lat 4 / Hist 9 / Doc 4 / DX 9 / Cost 10 / Lic 7 / Com 6 / RL 10 / NFL 10 = **7.4**
- Recommendation: PRIMARY for historical backtests (one line per game, 1999+); never treat as "closing" without a disclaimer. `win_totals.csv` is a useful free preseason-market prior for 2003–2020 backtests.
- Verified: 2026-11-25 — files downloaded and counted; DATASETS.md read; commit dates via `gh api`.

### Sportsbook Reviews Online (SBR) — NFL scores and odds archive
- Links: https://www.sportsbookreviewsonline.com/scoresoddsarchives/nfl/nfloddsarchives.htm · terms https://www.sportsbookreviewsonline.com/terms/
- Category · Class: historical spreadsheets (open/close spreads and totals, moneylines, 2nd-half lines) · 🟠 Unofficial but commonly used
- Facts: seasons 2007-08 to 2021-22 (and preseason); page says "NFL scores and odds archive will not be updated". Terms: "You may not use or reproduce any content ... without our express written consent." Book source of the lines not stated.
- Scores: Q 6 / Cov 5 / Rel 5 / Lat 1 / Hist 7 / Doc 3 / DX 5 / Cost 10 / Lic 2 / Com 1 / RL ~5 / NFL 8 = **4.8**
- Recommendation: OPTIONAL — owner-local research only (open-vs-close studies 2007–2021); do not republish.
- Verified: 2026-11-25 — archive index and terms read.

### AusSportsBetting — historical NFL results and odds
- Links: https://www.aussportsbetting.com/data/historical-nfl-results-and-odds-data/
- Category · Class: historical spreadsheet · 🟠 Unofficial but commonly used
- Facts: page answered HTTP 403 to both fetch tool and curl (bot protection; not bypassed). Years, fields, source and terms **UNVERIFIED** today. Kaggle's spreadspoke description names aussportsbetting.com as a betting-line source for 2014–2024.
- Recommendation: OPTIONAL (owner-local) pending a manual read of its terms.
- Verified: UNVERIFIED (403).

### Kaggle "NFL scores and betting data" (spreadspoke)
- Links: https://www.kaggle.com/datasets/tobycrabtree/nfl-scores-and-betting-data (metadata via `https://www.kaggle.com/api/v1/datasets/view/tobycrabtree/nfl-scores-and-betting-data`)
- Category · Class: historical dataset · 🔵 Public/open data (licence restrictive)
- Facts (metadata, read today): licence **CC BY-NC-SA 4.0**; version 82, last updated 2026-02-11; 1.6 MB; results since 1966, betting odds since 1979; lines from repole.com (1978–2013), cross-referenced with Pro-Football-Reference, and "From 2014-2024 betting data reflects lines available at sportsline.com and aussportsbetting.com". Single favourite spread and over/under per game; timing (open/close) not stated.
- Licence chain risk: the CC licence is the uploader's; underlying lines come from sites whose terms (e.g., Sports Reference) restrict redistribution — inference.
- Scores: Q 6 / Cov 5 / Rel 6 / Lat 2 / Hist 10 / Doc 5 / DX 8 / Cost 10 / Lic 4 / Com 1 / RL 10 / NFL 9 = **6.3**
- Recommendation: OPTIONAL — long-history research (pre-1999) owner-local, non-commercial, share-alike; not for the public page.
- Verified: 2026-11-25 — Kaggle metadata JSON read.

### Pro-Football-Reference — Vegas lines on game pages
- Links: data-use policy https://www.sports-reference.com/data_use.html
- Category · Class: reference site · 🔴 Scraping if automated
- Facts: policy asks users not to "aggressively spider data", declines bulk requests below "$5,000", says some datasets' licences "completely preclude any redistribution", bars building competing databases/tools from scraped data and AI training.
- Scores: Q 7 / Cov 5 / Rel 8 / Lat 2 / Hist 9 / Doc 4 / DX 2 / Cost ~6 / Lic 1 / Com 1 / RL 2 / NFL 8 = **4.6**
- Recommendation: AVOID for ingestion; use nflverse lines instead.
- Verified: 2026-11-25 — data-use page read.

### Killersports / SDQL
- Links: https://killersports.com/ · https://sdql.com/
- Category · Class: query database of historical lines and trends · 🟠 Unofficial
- Facts: killersports.com returns only a title to a plain fetch ("Sports Betting Database, Trends & ATS Records"); sdql.com hosts SDQL 2 language docs, "eyeball communications llc", "©2017, JoeMeyer". Coverage, history depth, pricing, terms UNVERIFIED.
- Recommendation: AVOID (no API, terms unknown); its trend-mining style also invites data-snooping.
- Verified: partial — home pages only.

### The Odds API historical (paid) — see main record
- 2020-06-06 onward (10-min snapshots; 5-min from Sept 2022), props/alternates from 2023-05-03; 10× credit cost. A full NFL season of featured-market closing snapshots (≈285 games, one snapshot per game, one region, 3 markets) ≈ 285 × 30 = 8,550 credits — inside the $30/20K plan for one month (calculation, not a quote).

### Nevada Gaming Control Board — Monthly Revenue Report
- Links: index https://www.gaming.nv.gov/about-us/gaming-revenue-information-gri/ · example https://www.gaming.nv.gov/siteassets/content/about/gaming-revenue/monthly-revenue-report----september-2026.pdf
- Category · Class: government market statistics (win by sport) · 🟢 Official (public record)
- Provides: monthly PDF (48 pages for Sept. 2026) with "Sports - Football" locations, win amount (thousands of dollars), % change and **win percent** for one-, three- and twelve-month periods, statewide and by area (e.g., statewide Sept. 2026 football win $35,384K at 8.65%). Footnote: "Mobile Sports data is being displayed in total for all sports" (so the football row may exclude mobile — interpretation UNVERIFIED). Handle can be derived as win ÷ win %. Archive PDFs back to 2004 on the index page.
- Scores: Q 9 / Cov 3 / Rel 9 / Lat 1 / Hist 9 / Doc 6 / DX 3 / Cost 10 / Lic 9 / Com 9 / RL 10 / NFL 5 = **6.9**
- Recommendation: OPTIONAL — context panel ("how much Nevada books won on football this month"), never a model input.
- Verified: 2026-11-25 — September 2026 PDF downloaded and parsed with `pdftotext`.

### Indiana Gaming Commission — Monthly revenue (sports wagering handle by sport)
- Links: https://www.in.gov/igc/publications/monthly-revenue · example https://www.in.gov/dA/a80728b375/2026-08-Revenue.xlsx?language_id=1
- Category · Class: government statistics · 🟢 Official (public record)
- Provides: Excel/PDF monthly; sheet "8 SW Details" includes "Monthly Sports Wagering Handle by Sport": Football, Basketball, Baseball, Parlay, Other ("unaudited amounts used for informational purposes"). Latest seen: August 2026 (2026-08-Revenue.xlsx).
- Scores: Q 8 / Cov 3 / Rel 9 / Lat 2 / Hist 7 / Doc 6 / DX 7 / Cost 10 / Lic 9 / Com 9 / RL 10 / NFL 5 = **7.1**
- Recommendation: OPTIONAL — the cleanest machine-readable football handle series found.
- Verified: 2026-11-25 — workbook downloaded, sheet names and labels read.

### Illinois Gaming Board — Monthly sports wagering reports
- Links: https://igb.illinois.gov/sports-wagering/sports-reports.html
- Facts: page says monthly sports wagering reports and "the corresponding Comma Separated Values (CSV) File" exist; file links are loaded dynamically and were not retrieved; **sport breakdown UNVERIFIED**.
- Class: 🟢 Official. Recommendation: OPTIONAL (check CSV columns manually).
- Verified: page text only.

### Pennsylvania Gaming Control Board / New York State Gaming Commission
- Links: PA https://gamingcontrolboard.pa.gov/news-and-transparency/revenue (FY26-27 Monthly Sports Wagering Report Summary .xlsx) · NY https://gaming.ny.gov/revenue-reports (statewide weekly and monthly .xlsx, per-operator files)
- Facts: PA workbook = handle, revenue, promotional credits, taxable revenue by casino, retail vs online — **no sport breakdown**; footnote warns win % cannot be computed as revenue ÷ handle for the same month. NY = mobile handle and GGR, weekly and monthly, by operator (DraftKings, Caesars, ...) since FY 2021-22 — **no sport breakdown**.
- Class: 🟢 Official. Recommendation: OPTIONAL — weekly NY handle is a season-rhythm indicator (football Sundays), not NFL-specific.
- Verified: 2026-11-25 — both workbooks downloaded and strings inspected.

### New Jersey Division of Gaming Enforcement
- Links: https://www.njoag.gov/about/divisions-and-offices/division-of-gaming-enforcement-home/financial-and-statistical-information/ → HTTP 403 to curl (not bypassed)
- Facts: UNVERIFIED today whether NJ's monthly reports split sports-wagering revenue by sport (from memory: NJ press releases have shown revenue by sport category — not confirmed).
- Recommendation: OPTIONAL pending manual check.

## 3. Matrix rows

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

## 4. Redundancy

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

## 5. Derived metrics

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

## 6. Gaps

**Not obtainable easily/legally for free**
- Betting splits (bets % / handle %) from any lawful free source — every public splits page (Action Network, VSiN, Covers) bars automated reuse; Covers' "consensus" is contest picks, not bets. Lawful = Sportradar Betting Splits or SportsDataIO (contracts; SportsDataIO does not name its books).
- Per-game handle: no public source; states publish only monthly aggregates (Indiana football handle; Nevada football win/win %).
- Closing lines at kickoff on the free tier: 500 credits/month cannot poll near kickoff for 16 games; our "close" is the last of ≤2 daily looks. True closes need paid historical (≈8,550 credits/season for featured markets, one snapshot per game) or a paid plan.
- Prediction-market prices for publication: Kalshi (own-trading only), Polymarket international (no redistribution; no US trading). Polymarket US terms unread.
- Official NFL betting data: Genius Sports, operators only.
- Pinnacle closing lines: public API closed July 23, 2025; academic/pregame application possible.

**Expensive**
- Public-display-licensed multi-book feeds: TheRundown Pro $249/mo (history kept only while subscribed), SportsGameOdds Pro $299, SharpAPI Pro $229 (+$99 streaming), Unabated Concierge $799 (non-commercial) / Advantage $2,999; enterprise (OpticOdds, Sportradar, SportsDataIO, Genius, LSports): contact sales.

**Avoid, and why**
- Scraping sportsbooks (DraftKings, FanDuel terms bar automation; endpoints geo/bot-blocked), Action Network (terms bar robots and reuse of betting percentages), VSiN (bot-blocked, terms unknown), Covers (reproduction barred), PFR (data-use policy), BetsAPI (scraped bookmaker data), Kalshi direct (Developer Agreement), Polymarket international (ToS), Unabated free tier (requires deeplink traffic to sportsbooks: affiliate-style, conflicts with the project's no-affiliate rule).

**Legal and ethical display constraints (project rules plus observed norms)**
- Never claim a guaranteed edge; label model-vs-market gaps as disagreement with uncertainty; the market usually wins (ODDS_ENGINE.md backtest note).
- No affiliate links, promo codes, bet-slip deeplinks (keep The Odds API `includeLinks` off), "best bet"/"lock" language — consistent with FEATURE_RESEARCH §17. Many odds sites now carry prediction-market promo codes (seen on Action Network's NFL public-betting page); do not copy that pattern.
- Show odds as information with source, book and capture time; show staleness ("as of …").
- Responsible-gambling messaging: the AGA Responsible Marketing Code page answered 403 and state rules were not read this session — **UNVERIFIED**. Recommendation (not a verified legal requirement): a short 21+ note and a link to a national problem-gambling helpline beside any odds panel; avoid targeting minors; never imply betting is a way to make money. Affiliate/marketing licensing rules in states apply to paid promotion; the project takes no compensation, which keeps it outside them (inference; owner to confirm if monetization is ever considered).
- Do not mix prediction-market prices and sportsbook odds without labelling units, fees and venue legality (prediction-market sports contracts are under active litigation as of Nov. 2026).

## 7. Contradictions & UNVERIFIED

**Where this research changes or sharpens the project's documents**
1. `GITHUB_RESEARCH.md` (Odds sources): "Pinnacle … Public API closed July 23, 2025 … Not an option." Date confirmed, but the official README adds that Pinnacle "also support[s] academics and pregame handicapping projects" by application (api@pinnacle.com). Not a free public source, but not strictly "not an option".
2. `GITHUB_RESEARCH.md`: "Kalshi, Polymarket … NFL coverage and data terms not verified." Now verified: Kalshi has 406 NFL-related series incl. game, spread, total, first-half, player props and futures; Polymarket lists Super Bowl, conference, all eight divisions, playoff qualifiers, awards. Terms confirmed restrictive (Kalshi Developer Agreement v1.1 §3/§3.1; Polymarket ToS effective Aug. 11, 2026). Agrees with `FEATURE_RESEARCH.md` §17. **New:** Polymarket US (QCX LLC, CFTC DCM) has a separate key-free public data API whose terms were not readable — the one prediction-market path not yet ruled out.
3. `GITHUB_RESEARCH.md`: OddsPapi "Historical endpoint on free tier, 3 books per call." Pricing page lists "historical data" on the free tier with 250 requests/month; "3 books per call" not confirmed.
4. `GITHUB_RESEARCH.md`: SportsGameOdds "Per-book open and close on some plans; Terms not verified." Open/close not mentioned on the pricing page; terms now read: no redistribution and deletion of data within 30 days of termination.
5. `NFL_DATA_SOURCE_REGISTRY.md` (The Odds API terms): accurate for this project, but incomplete for a commercial future — terms dated Aug. 31, 2026 expressly allow display "including for commercial use" provided the data "is not the primary product being sold", and allow storing "indefinitely". The re-serving ban is phrased as "standalone data product" (raw feed, own API, downloadable files). DEC-019's choice (consensus public, per-book local) is a defensible conservative reading because the public snapshot JSON is a downloadable file; per-book prices rendered only inside the page UI would arguably be allowed — owner decision, not a terms violation either way.
6. Registry "Update cadence: Minutes" for The Odds API → documented polling 60 s pre-match / 40 s in-play for featured markets, 60 s for props, 5 min / 60 s for outrights.
7. Registry lists "Historical depth: Paid plans only" — add start dates (2020-06-06; props/alternates 2023-05-03; 5-minute snapshots since Sept. 2022) and cost (10× credits).
8. Registry "nfldata games … 1999 on": confirmed for spreads/totals, but moneylines exist only from 2006 (partial) and are complete from 2010; nfldata's own DATASETS.md still says "Data begins with the 2006 NFL season" (stale). Lines for upcoming 2026 games are present (30 unplayed games), so the stored value changes during the week; after kickoff it is the last value nflverse saw (likely near-close; inference).
9. Internal doc inconsistency (not a source finding): DEC-019 says the Odds API runs "Every 8 hours on the server"; DEC-021 amendment and the registry say an 11-hour minimum interval. The registry/DEC-021 wording is newer.
10. `ODDS_ENGINE.md` uses multiplicative vig removal only. Adequate for two-way game lines; for 32-team futures it overstates long shots — power or Shin devig recommended before any futures comparison.
11. `GITHUB_RESEARCH.md` TheRundown row ("a public page needs a paid plan") — confirmed and made specific: Pro ($249/mo) is the first tier licensed for public display, with "Data provided by TheRundown" attribution; history storage only on Ultra+ and must be deleted on cancellation.

**UNVERIFIED (and why)**
- OpticOdds being the OddsJam API's successor (oddsjam.com/odds-api returned 403; OpticOdds page does not say).
- Unabated WebSocket availability (only search summaries of the GitHub repo; repo not opened).
- OddsBlaze plans/prices (JavaScript-only page); Goalserve (HTTPS connection refused); LSports prices (none published).
- SportsDataIO Discovery Lab prices ($99/mo odds tier came from a search summary, not a page read) and the source of SportsDataIO betting splits (not disclosed).
- Sportradar trial limits (1,000 calls/30 days, 1 QPS) and trial "non-commercial … evaluation" wording — from search summaries of Sportradar docs, not read in full.
- Genius Sports' 2025 NFL extension "through the end of the 2029 season" — from search results (BusinessWire/Covers/SBC News), not opened.
- Action Network's contributing books; VSiN terms; NJ DGE sport breakdown (403); Illinois CSV columns; AusSportsBetting page (403); Betfair's US IP restriction list; Smarkets terms; BetMGM, Caesars, Circa terms; Polymarket US terms (JavaScript-only); Novig site (405).
- Whether The Odds API (and TheRundown, Unabated) hold redistribution rights for Kalshi, Polymarket and Pinnacle rows they serve. The Odds API itself says Pinnacle odds "are from public website" — a scraped chain. Using those rows publicly is an owner decision until confirmed in writing.
- Responsible-gambling display norms (AGA code page 403; no state rules read).
- Research limit: the shared web-search budget for this run (200 searches across all agents) was exhausted partway through; later items (Kalshi data-licensing partnerships, NJ DGE, AGA code, Novig, Betfair US restrictions) were checked only by direct page fetches. A follow-up run can resume these searches.

**Claim most at risk of being wrong:** that no lawful free path exists to prediction-market prices. Polymarket US's terms were unreadable and aggregators (The Odds API `us_ex`) already resell Kalshi/Polymarket prices; either may turn out to permit display.

## 8. Research log

All accessed 2026-11-25. "WS" = WebSearch, "WF" = WebFetch, "curl" = direct request (generic UA, no key), "gh" = GitHub CLI.

Repository (read-only): `CLAUDE.md`; `docs/NFL_DATA_SOURCE_REGISTRY.md`; `docs/GITHUB_RESEARCH.md`; `docs/DECISIONS.md` DEC-019/DEC-021; `docs/FEATURE_RESEARCH.md` lines 160–244 and §17; `docs/ODDS_ENGINE.md`.

Web searches (WS):
1. "OddsJam API pricing odds API sportsbooks historical player props 2026" — only vendor/competitor blogs; no primary pricing.
2. "Unabated API odds data sportsbooks pricing developers" — third-party listings.
3. "site:unabated.com API "Unabated API" data feed" — no Unabated pages.
4. "Unabated API documentation … websocket partner-api" (extended) — found unabated.com/odds-api, docs.unabated.com, GitHub UnabatedOrg/unabated-api-docs.
5. "OddsBlaze API pricing plans sportsbooks NFL player props docs" — competitor pages only.
6. "SportsDataIO betting splits "BettingSplits" NFL endpoint …" — found Sportradar splits docs.
7. "sportsdata.io "betting splits" NFL API …" (extended) — endpoint names (then verified in docs).
8. "SportsDataIO betting splits data partnership sportsbook source announcement" — no source named.
9. "SportsDataIO "Discovery Lab" pricing personal NFL odds month to month" — prices only in summary (UNVERIFIED).
10. "Sportradar Odds Comparison API v2 player props NFL bookmakers trial developer portal".
11. "Sportradar developer portal trial key limits "1,000" requests "QPS" 30 days terms".
12. "Genius Sports NFL partnership extension exclusive official data betting operators announcement".
13. "Don Best odds feed 2026 Sportradar owned acquisition still available" — nothing.
14. ""Don Best" acquired by Genius Sports" — nothing.
15. "LSports odds feed NFL pricing TRADE 360 developer free trial American football".
16. "Goalserve odds feed American football NFL pricing per month bookmakers".
17. "Action Network public betting percentages where does the data come from …".
18. "VSiN terms of use …" — not found.
19. "FanDuel Sportsbook terms of use "automated" OR "scrape" …" — led to fanduel.com/terms.
20. "Kalshi market data licensing partners display odds media 2026 data feed agreement" (extended) — **not run: search budget exhausted**.

Pages read (WF or curl):
- The Odds API: https://the-odds-api.com/liveapi/guides/v4/ (WF + curl grep: costs, historical dates, 429, `x-api-key`, includeLinks/Sids/BetLimits/RotationNumbers) · https://the-odds-api.com/ (pricing) · https://the-odds-api.com/sports-odds-data/betting-markets.html · https://the-odds-api.com/sports-odds-data/update-intervals.html · https://the-odds-api.com/terms-and-conditions.html · https://the-odds-api.com/sports-odds-data/bookmaker-apis.html
- https://sportsgameodds.com/pricing · https://sportsgameodds.com/terms
- https://therundown.io/pricing/api
- https://opticodds.com/pricing · https://opticodds.com/ · https://developer.opticodds.com/
- https://oddsjam.com/odds-api — 403 (WF and curl)
- https://unabated.com/api, https://www.unabated.com/api — 404 · https://unabated.com/odds-api/free · https://unabated.com/odds-api
- https://oddspapi.io/en/pricing
- https://sharpapi.io/pricing · https://sharpapi.io/terms
- https://odds-api.io/pricing · https://docs.odds-api.io/
- https://oddsblaze.com/pricing — 200, title only (JS)
- https://betsapi.com/mm/pricing_table
- https://sportsdata.io/developers/aggregated-odds-guide (WF partial; curl 301) · https://sportsdata.io/betting-data · https://sportsdata.io/developers/api-documentation/nfl (curl, 1.85 MB, grepped) · https://sportsdata.io/pricing · https://sportsdata.io/files/SDio_AggOddsCoverage.pdf (pp. 1–4) · https://sportsdata.io/help/data-rights-and-licensing-questions · https://discoverylab.sportsdata.io/ · https://sportsdata.io/developers and /developers/getting-started (curl)
- https://developer.sportradar.com/odds/reference/oc-overview — 404 · https://developer.sportradar.com/odds/reference/oc-player-props-overview · https://developer.sportradar.com/odds/reference/oc-prematch-overview · https://developer.sportradar.com/insights/reference/betting-splits-faq
- https://www.geniussports.com/content-hub/odds-api-explained/
- https://www.donbest.com/ (curl 200; WF)
- https://www.goalserve.com/en/sport-data-feeds/odds/prices — connection refused
- https://lsports.eu/odds-feed
- https://www.actionnetwork.com/terms (WF 403; curl 200, grepped) · https://www.actionnetwork.com/robots.txt · https://www.actionnetwork.com/nfl/public-betting (WF 403; curl 200, grepped)
- https://vsin.com/nfl/how-to-win-using-vsin-nfl-betting-splits/ · https://vsin.com/terms-of-use/ — 404 · https://vsin.com/ (links) · https://data.vsin.com/nfl/betting-splits/ — 403
- https://contests.covers.com/consensus/topconsensus/nfl/overall — 200 · https://contests.covers.com/consensus/faq · https://www.covers.com/terms-and-conditions — 404 · https://www.covers.com/terms · https://www.covers.com/ (links) · https://www.covers.com/industry/new-york-legal-case-ban-kalshi-sport-event-contracts-nationwide-november-25-2026
- Sportsbook probes (one each): DraftKings `sportsbook-nash.draftkings.com/api/sportscontent/dkusnj/v1/leagues/88808` 403 · FanDuel `sbapi.nj.sportsbook.fanduel.com/api/content-managed-page?page=CUSTOM&customPageId=nfl` 400 · Caesars `api.americanwagering.com/regions/us/locations/nj/brands/czr/sb/v3/sports/americanfootball/events/schedule` 403 · BetMGM `sports.nj.betmgm.com/cds-api/bettingoffer/fixtures?sportIds=11` 403 · https://www.circasports.com/ 200
- Terms: https://sportsbook.draftkings.com/legal/terms-of-use (WF 403; curl 404) · https://www.draftkings.com/help/terms (curl 200, grepped) · https://www.fanduel.com/terms (curl 200, grepped)
- Kalshi: https://docs.kalshi.com/getting_started/historical_data · https://docs.kalshi.com/getting_started/rate_limits · probe `https://api.elections.kalshi.com/trade-api/v2/series?category=Sports` 200 (6.8 MB, 4,331 series) · https://kalshi-public-docs.s3.amazonaws.com/Kalshi-Developer-Agreement.pdf (all 6 pages)
- Polymarket: probe `https://gamma-api.polymarket.com/events?tag_slug=nfl&closed=false&limit=50` 200 · https://polymarket.com/tos · https://docs.polymarket.com/market-data/overview.md · https://docs.polymarket.com/llms.txt · https://docs.polymarket.com/getting-started/api.md · https://docs.polymarket.com/_llms/en/api-reference/predictions.txt · https://docs.polymarket.com/api-reference/rate-limits.md · https://docs.polymarket.com/api-reference/markets/get-prices-history.md
- Polymarket US: https://polymarket.us/ (WF + curl HTML) · https://docs.polymarket.us/api-reference · https://polymarket.us/tos (JS-only)
- https://www.prophetx.co/ · https://www.novig.us/ → https://novig.com/landing (405) · https://www.sporttrade.com/ → https://getsporttrade.com/ · https://robinhood.com/us/en/prediction-markets/ · https://crypto.com/us/prediction
- Betfair: https://developer.betfair.com/get-started/ (403) · https://support.developer.betfair.com/hc/en-us/articles/115003864651-How-do-I-get-started (curl) · https://support.developer.betfair.com/hc/en-us/articles/28271961503516-Which-IP-regions-are-restricted-from-accessing-the-Betfair-API (curl; list not extracted)
- Smarkets: https://docs.smarkets.com/ (title only) · probe `https://api.smarkets.com/v3/events/?type=american_football_match&state=upcoming&limit=5` 200
- Pinnacle: `gh api repos/pinnacleapi/pinnacleapi-documentation` and `/readme`
- nflverse: `gh api repos/nflverse/nfldata/contents/data`, `/readme`, `/contents/DATASETS.md`, commits for `closing_lines.csv`, `initial_lines.csv`, `sc_lines.csv`; raw downloads of `games.csv`, `closing_lines.csv`, `initial_lines.csv`, `sc_lines.csv`, `win_totals.csv`
- SBR: https://www.sportsbookreviewsonline.com/scoresoddsarchives/nfl/nfloddsarchives.htm · https://www.sportsbookreviewsonline.com/terms/ (WF 404; curl 200)
- https://www.aussportsbetting.com/data/historical-nfl-results-and-odds-data/ — 403 (WF and curl)
- Kaggle metadata: https://www.kaggle.com/api/v1/datasets/view/tobycrabtree/nfl-scores-and-betting-data — 200
- https://www.sports-reference.com/data_use.html
- https://killersports.com/ · https://sdql.com/ · https://www.oddsshark.com/nfl/database → covers.com redirect · https://www.covers.com/sport/football/nfl/odds 200
- Regulators: https://www.gaming.nv.gov/about-us/gaming-revenue-information-gri/ + September 2026 PDF · https://www.nj.gov/oag/ge/financialandstatisticalinfo.html 404 · https://www.njoag.gov/…/financial-and-statistical-information/ 403 · https://gamingcontrolboard.pa.gov/news-and-transparency/revenue + FY26-27 sports wagering .xlsx · https://igb.illinois.gov/sports-wagering/sports-reports.html · https://gaming.ny.gov/revenue-reports + statewide monthly .xlsx · https://www.in.gov/igc/publications/ → /monthly-revenue + 2026-08-Revenue.xlsx
- https://www.americangaming.org/resources/responsible-marketing-code-for-sports-wagering/ — 403
- GitHub searches (gh): `gh search repos "action network" betting splits` (none); `gh search code "api.actionnetwork.com/web/v1"` (several repos incl. john-b-edwards/anscrapR, inspected); `gh search repos "nfl odds history"` (none); `gh search repos "betting splits"` (small personal bots; nothing reusable); `gh search repos "kalshi polymarket sports odds"` (none).
