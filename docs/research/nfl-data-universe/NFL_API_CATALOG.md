# NFL API and Data Source Catalog

Part of the NFL data and API universe research (NU-018, Nov. 25, 2026). Start at [NFL_API_UNIVERSE.md](NFL_API_UNIVERSE.md).

This file holds one record per source: **369 records** across ten research domains, written by ten research tracks on Nov. 25, 2026 and assembled here unchanged, except that verified corrections are listed first (below) and take precedence over any record that disagrees with them. Each domain links to its evidence file in `tracks/`, which also holds the matrix rows, the redundancy table, derived metrics, gaps, contradictions and the full research log for that domain.

## How to read a record

- **Class**: 🟢 Official · 🟡 Licensed/commercial · 🔵 Public/open data · 🟠 Unofficial but commonly used · 🔴 Scraping · ⚫ Experimental/unstable. 🟠 and 🔴 sources must not be used in production without the owner's permission; for this project, ESPN's JSON is already restricted to the owner's own machine (DEC-006).
- **Scores** are 1–10 on twelve criteria: Q data quality, Cov coverage, Rel reliability, Lat latency, Hist historical depth, Doc documentation, DX developer experience, Cost (10 = free), Lic licensing (10 = permissive), Com commercial usability, RL rate limits (10 = generous), NFL NFL-specific usefulness. Overall is the plain mean. A "~" marks a component that is a judgment without direct evidence. Scores compare sources within this catalog; they are not measurements.
- **Recommendation** is one of PRIMARY, SECONDARY, OPTIONAL, AVOID, for this project's situation (free, non-commercial, public page) unless the record says otherwise. The recommended stacks for other budgets are in [NFL_API_RECOMMENDATIONS.md](NFL_API_RECOMMENDATIONS.md).
- **Verified** gives the date and what was actually checked (docs read, pricing page read, endpoint probed with its HTTP status, repository inspected). "UNVERIFIED" means the claim could not be checked against the provider's own page; treat it as a lead, not a fact.
- Quotes from terms are at most about 15 words; read the linked terms before relying on any reading here. Nothing in this catalog is legal advice.

## Research limits that apply to every record

- The ten tracks shared one web-search allowance, which ran out partway through the day. Later checks were made by reading pages directly, with `gh` for repositories and single probes of key-free endpoints. Each track lists what it could not search.
- No accounts were created, no trials started, no terms accepted and no keys used. Prices behind sign-up or "contact sales" are recorded as such.
- Two independent verification passes (V1: where nflverse's data comes from; V2: terms and prices) re-checked the claims most likely to be wrong. Their verdicts are in `tracks/V1-*.md` and `tracks/V2-*.md` and summarised below.

## Verified corrections (take precedence over the records)

Verdicts from V1 (nflverse provenance, 16 claims) and V2 (terms and prices, 19 claims). Where a record below says otherwise, these win.

**nflverse and related data (V1)**
- C1. Depth charts: ESPN's data since 2025-08-03 (commit `c1390bb`, "use nflverse.espn for depth charts"; NFL Data Exchange before), fetched by a non-public package. Snapshots once a day, twice a day since about Sept. 17, 2026 (not "twice a day" throughout).
- C2. Injuries come from the NFL's API through the non-public `nflapi`; weekly rosters from 2016 on come from Next Gen Stats through the non-public `ngsscrapR`, with NFL API fields joined. Neither wrapper can be audited.
- C3. Third-party ids in weekly rosters (`sleeper_id`, `espn_id`, `yahoo_id`, `rotowire_id`, `pff_id`, `pfr_id`, `fantasy_data_id`, `sportradar_id`) are joined from DynastyProcess `db_playerids` (GPL-3.0). `players.csv` has no Sleeper id. FEATURE_RESEARCH §5's claim that `players.csv` "removes the need" for the GPL file is wrong for Sleeper ids.
- C4. Contracts: scraped from OverTheCap's HTML; `historical_contracts.csv.gz` stale since 2022-05-29 (use parquet or rds). Next Gen Stats: scraped from the NGS site's API with a browser user agent. Snap counts, advanced stats, draft picks, combine: Pro Football Reference through a proxy service; the 2012 snap-count file is header-only (154 bytes).
- C5. Officials: 2026 has week 1 only (the job got HTTP 403 daily from 2026-09-03 and was switched off on 2026-09-15). R1's "through week 5" is wrong for nflverse `officials` (nfldata's own officials file may differ). Trades: last trade 2026-04-17.
- C6. Play-by-play: models replaced in nflfastR 6.0.0.9001; seasons 2001–2026 rebuilt on Nov. 25, 2026; 1999–2000 not rebuilt. The per-play UTC `time_of_day` exists from 2011 data, not new.
- C7. nfldata `games.csv`: 272 games in 2026, 2 on Wednesday, 4 on Friday, 9 international (confirmed); `surface` is filled for future weeks; moneylines are incomplete in 2006 and 2008; nfldata has no licence, yet its schedules are re-released under nflverse-data's CC-BY-4.0 label.
- C8. `nfeloqb` has no licence; nfelo's new licence (Nov. 11, 2026) covers only `nfelo`'s `output_data/`. Neil Paine's NFL Elo: MIT, 1920–2024. FiveThirtyEight's old Elo URL now redirects (302) to abcnews.go.com/politics.
- C9. FTN charting: CC-BY-SA 4.0, "FTN Data via nflverse"; one batch a week, about 2–3 days after Monday night.
- C10. Stale formats: `.qs` assets are stale across several tags (depth charts, players, Next Gen Stats, officials, trades); read `.csv`, `.parquet` or `.rds`.

**Terms and prices (V2)**
- C11. The Odds API: terms of Aug. 31, 2026 allow display including commercial use, indefinite storage and ML training, with no attribution required; reselling or redistributing as a standalone product (own API, feed, downloads) is barred. Plans: free 500 credits (no history, not every bookmaker), $30 (20K), $59 (100K), $119 (5M), $249 (15M). `/scores` covers the NFL, updates about every 30 s, 1 credit (2 with `daysFrom`, 1–3 days only). Odds intervals (update-intervals page): featured markets 60 s pre-match / 40 s in play; props 60 s / 60 s. History from June 6, 2020 (props from May 3, 2023), 10 credits per region and market. The `us_ex` region also lists BetOpenly, Limitless and Polymarket US besides Kalshi, Polymarket, Novig and ProphetX; those operators' own terms still apply.
- C12. Sleeper: General Terms updated Nov. 17, 2026; §11.1 requires "express written consent" for automated access and commercial use; "or other approval" appears only in §11.3. The API page (last modified Oct. 21, 2026) still grants free non-commercial use. Which governs is ambiguous; ask Sleeper.
- C13. FantasyPros: free key "Non-production use", sample data; production keys come with the HOF subscription (from $8.99 a month billed annually; personal use); redistribution rights only in the Commercial tier. The 100-calls-a-day limit is in the API Terms (Oct. 27, 2020), not on the pricing page. The projections endpoint has no `scoring` parameter.
- C14. FOX Sports RSS: grant confirmed for individuals and non-profits, non-commercial, with attribution; the NFL feed carries full article bodies (271–4,325 words per item); FOX's general terms bar deep-linking, scraping and AI training. Keep title, link and time only.
- C15. All six official NFL podcast feeds carry an iHeartMedia notice forbidding "text and data mining or computational analysis" and AI training without written consent, and all publish transcripts.
- C16. Sportradar: one set of master terms (Nov. 13, 2026); trial use is internal evaluation only and bars any publication or display and any commercial use; trial usage may train Sportradar's AI. Paid display only on the properties in the order form, with a "powered by Sportradar" logo. Sportradar compiles NFL data with its own operators; that this is "because Genius holds the official rights" is an inference, not Sportradar's statement.
- C17. SportsDataIO Discovery Lab: NFL Fantasy $99, Odds $99, both $149 a month; season passes $599 / $599 / $899; scores delivered 6 am ET the next day; personal use only. Its free tier is last season's real data; the scrambled data is the separate commercial free trial.
- C18. Genius Sports: extension announced June 11, 2025, exclusive distribution of official play-by-play, Next Gen Stats and the betting feed to media and betting companies through the end of the 2029 season.
- C19. PFF: only the enterprise business moved to Teamworks (March 30, 2026); PFF.com stays independent. PFF's terms (Oct. 12, 2026) bar public display even for non-commercial use and bar using PFF data as input or prompts to generative AI. Teamworks also owns Zelus (2024), Telemetry Sports (2025) and Sportlogiq (2026).
- C20. Kalshi: the developer agreement binds API users, but its text could not be read (bot check); the "own trading only" claim is unconfirmed. Polymarket (international): bars supplying its data to capital-market clients and data distributors and bars site scraping; no general ban on displaying prices was found. Polymarket US terms unreadable (JavaScript only). Pinnacle: closed to the public since July 23, 2025; academic and pregame-handicapping projects may apply; a funded account is required.
- C21. X API: pay-per-use only (no named tiers): post reads $0.005, user reads $0.010, up to 3 million post reads a month, Enterprise above; any document quoting Basic or Pro tiers is stale. X bars training models on X data (guidelines: any ML model, Grok excepted). Reddit: AI training barred; commercial use needs a separate agreement; the pre-approval rule is in a policy page that refused us (unverified).
- C22. NFL Fantasy: fantasy.nfl.com now redirects to NFL.com's fantasy articles, and the NFL names ESPN Fantasy its official game (with a league import); "closed" is inferred, not announced in anything read. Yahoo Fantasy API access requires an application and approval.
- C23. Sports Reference: the AI clause covers "training, fine-tuning, prompting, or instructing" AI, including generating answers or statistics; no tools built on scraped data; bots blocked above 20 requests a minute on Pro Football Reference (10 on FBref and Stathead).
- C24. OverTheCap: systematic retrieval to compile a database is barred without written consent; personal use only; an embed is offered for single instances; licences through OTC.
- C25. NFL.com terms (May 16, 2024): §1.3 bars systematic retrieval; §8 allows links only to the home page without permission. The project's curated news holds one NFL.com article link and NFL TV links the NFL Channel page: both deep links (flagged for the owner, not urgent).
- C26. CollegeFootballData.com (terms Aug. 12, 2026): free 1,000 calls a month; paid tiers $1–$30 a month through Patreon (live play-by-play from the $5 tier); "Commercial use is permitted"; display and ordinary exports allowed; redistribution as a dataset, feed, mirror or substitute API barred; the key must not be in client-side code. College data only.
- C27. Fantasy Football Calculator: the ADP API is "free for personal and commercial use", with attribution (a link or mention) requested and no more than daily calls; other FFC stats are licensed from FantasyData and not covered. Fantasy Nerds: Standard $499 a year (personal use, or businesses under 1,000 paying customers or $500K revenue), Extended Commercial $2,999 a year; annual, auto-renewing, no refunds, no free tier.
- C28. BALLDONTLIE (terms Oct. 20, 2026): GOAT $39.99 a month per league (ALL-STAR $9.99, ALL-ACCESS $299.99); the terms allow almost any use, but the vendor names no data source, says it is "not the original producer", and states it has not cleared third-party rights. Never primary for anything with an identifiable rights holder (play-by-play, odds).
- C29. GDELT: its datasets are free for any use and may be republished, with a citation to the GDELT Project and a link to gdeltproject.org required. The grant covers GDELT's own records, not the articles they point to: links and counts only.

## Providers catalogued in more than one domain

A provider can have several records when it sells different products to different domains (for example Sportradar's play-by-play, odds and injury feeds). These are not duplicates: each record is about a different product. Read all of a provider's records together before deciding on it.

| Provider | Domains with a record | Note |
|---|---|---|
| nflverse / ffverse | R1, R3, R4, R5, R6, R7, R8, R10 | |
| ESPN | R2, R3, R4, R6, R7, R8, R10 | |
| Genius Sports | R1, R2, R3, R4, R6, R7 | |
| Sportradar | R1, R2, R3, R4, R6, R7 | |
| SportsDataIO / FantasyData | R2, R3, R6, R7, R8, R9 | |
| Sports Reference / Pro Football Reference | R3, R5, R6, R7, R10 | |
| NFL Big Data Bowl (Kaggle) | R1, R3, R4, R10 | |
| Wikidata | R1, R3, R5, R10 | |
| CBS Sports | R2, R6, R8 | |
| RotoWire | R6, R8, R9 | |
| Associated Press | R2, R9 | |
| DynastyProcess | R6, R8 | |
| FOX Sports | R2, R9 | |
| FantasyPros | R6, R8 | |
| Football Zebras | R1, R3 | |
| Goalserve | R2, R7 | |
| Google | R5, R9 | |
| LSports | R2, R7 | |
| NBC Sports / Rotoworld | R6, R9 | |
| NFL Communications | R1, R6 | |
| NFLPA | R1, R6 | |
| PFF | R3, R4 | |
| Sleeper | R6, R8 | |
| SumerSports | R3, R4 | |
| The Odds API | R2, R7 | |
| Yahoo | R2, R8 | |
| nfelo | R3, R10 | |

## Domains

- [R1. Official NFL sources and league structure](#r1-official-nfl-sources-and-league-structure)
- [R2. Commercial and freemium multi-domain providers](#r2-commercial-and-freemium-multi-domain-providers)
- [R3. Play-by-play, advanced analytics, coaching, officiating, special teams](#r3-play-by-play-advanced-analytics-coaching-officiating-special-teams)
- [R4. Player tracking, Next Gen Stats and computer vision](#r4-player-tracking-next-gen-stats-and-computer-vision)
- [R5. Weather, stadiums, geospatial and travel](#r5-weather-stadiums-geospatial-and-travel)
- [R6. Injuries, rosters, depth charts, transactions, contracts](#r6-injuries-rosters-depth-charts-transactions-contracts)
- [R7. Betting odds, line history, splits, prediction markets](#r7-betting-odds-line-history-splits-prediction-markets)
- [R8. Fantasy football](#r8-fantasy-football)
- [R9. News, press conferences, social, media](#r9-news-press-conferences-social-media)
- [R10. Historical data, open source, academic, college, draft](#r10-historical-data-open-source-academic-college-draft)


## R1. Official NFL sources and league structure

Evidence file: [tracks/R1-official-nfl.md](tracks/R1-official-nfl.md) (matrix rows, research log and the track's own notes).

Scores: Q quality / Cov coverage / Rel reliability / Lat latency / Hist history / Doc docs / DX developer experience / Cost (10 = free) / Lic licence (10 = permissive) / Com commercial usability / RL rate limits (10 = generous) / NFL usefulness. "~" = judgment without direct evidence. Overall is the plain mean, a sorting aid only; the Recommendation line decides.

### NFL (NFL Enterprises LLC) — NFL.com public pages (schedules, standings, stats, injuries, transactions, playoff picture, game center)
- Links: https://www.nfl.com · docs: none · terms: https://www.nfl.com/legal/terms/ · robots: https://www.nfl.com/robots.txt
- Category · Class: schedule, standings, injuries, transactions, stats · 🟢 Official (automated collection would be 🔴 Scraping)
- Provides: weekly schedule with day, ET time and network; standings (W-L-T, PF/PA, home/road/div/conf, streak, last 5) with official clinch codes `x` playoff, `y` wild card, `z` division, `*` division and home field; official injury report by game (practice participation, game status); monthly transactions by type (trades, signings, waivers, terminations, reserve list, other: from/to club, date, player, position); game centers with a game-book link.
- History · Live · Latency: schedules/standings for the current and earlier seasons (how far back not checked) · scores yes on the site · injury page labelled "Week 12 of the 2026 Season" (23 team tables on Nov. 25); transactions dated by day.
- Coverage: all 32 clubs, all games.
- Technical: server-rendered HTML (`d3-o-table`) · no JSON offered · SDK none · Auth none · Rate limits none published · robots.txt does not bar /injuries, /transactions, /standings, /schedules (bars /_mobile-app/, /_fantasy-app/, /account/, /search/; Mediapartners-Google barred from /stats/player-stats/*).
- Cost: free to view.
- Licensing: commercial: no. Terms §1.1 say the NFL owns the content, data and analytics; §1.3 bars "systematic retrieval of data or other content" without written consent; §11 bars robots harvesting for commercial purposes; §8 "You may link to the home page"; other links need express written permission. §6 "Modular Content" (RSS-style reuse) applies only on NFL's conditions, removed within 24 h on request. NY law, AAA arbitration, class waiver. Updated May 16, 2024.
- Quality: authoritative for official injury designations and clinch codes; HTML layout can change without notice.
- Scores: Q 9 / Cov 9 / Rel ~7 / Lat ~7 / Hist ~5 / Doc 1 / DX 3 / Cost 10 / Lic 2 / Com 1 / RL ~5 / NFL 10 = **5.8**
- Recommendation: OPTIONAL — for people to read and check, not a feed: the owner checks our clinch flags against the `x/y/z/*` codes and our injury statuses against the official report. Never poll; deep links need permission (project docs already note the home-page clause for club sites).
- Verified: 2026-11-25 — robots.txt; GET /injuries/, /transactions/, /standings/, /schedules/2026/by-week/reg-11, one game page (all 200); terms read via WebFetch.

### NFL — Official Game Books ("National Football League Game Summary" PDFs)
- Links: linked from each nfl.com game page ("Download Game Book (PDF)"), e.g. `https://static.www.nfl.com/image/upload/v<ver>/gamecenter/<game-uuid>.pdf` · terms: notice printed on every page + NFL.com Terms
- Category · Class: officials, weather, attendance, lineups, inactives, play-by-play, participation · 🟢 Official
- Provides (checked on Dolphins at Bills, Nov. 22, 2026, 19 pages): date, start time, stadium, game weather and outdoor forecast (temp, humidity, wind), roof and surface; the full officiating crew with positions and numbers including the replay official; starting lineups, substitutions, did-not-play, inactives; scoring plays; paid attendance; game duration; team and individual stats; full play-by-play by quarter with drive summaries; snap counts per player (offense/defense/special teams, counts and %).
- History · Live · Latency: post-game; the sample PDF's `last-modified` was 2026-11-23 11:48 UTC for a Sunday 1:02 PM EST game (final version the next morning) · no live · how far back the new CDN holds books: UNVERIFIED (old `static.nfl.com` host no longer resolves in DNS).
- Coverage: every regular-season and postseason game (inferred from the per-game link; only one game checked).
- Technical: PDF (ActiveReports-generated, text-extractable) · URL contains a per-game UUID found only on the game page · Auth none · Rate limits none published.
- Cost: free to view.
- Licensing: commercial: no. Header on each page: "for the express purpose of assisting media in their coverage of the game; any other use … is prohibited without the written permission of the NFL." Redistribution: no. Storage: not granted. Attribution: n/a.
- Quality: the official record (probably what community officials and participation datasets are compiled from — inference, not checked). Highest accuracy; parsing cost is high.
- Scores: Q 10 / Cov 8 / Rel ~8 / Lat 6 / Hist ~4 / Doc 2 / DX 2 / Cost 10 / Lic 1 / Com 1 / RL ~5 / NFL 10 = **5.6**
- Recommendation: AVOID as an automated source (media-only notice); OPTIONAL as a manual reference to settle disputes (officials, inactives, attendance). Link to the nfl.com game page, not the PDF.
- Verified: 2026-11-25 — game page link found; `curl -I` 200 application/pdf 335,852 bytes; pages 1–3, 10, 19 read.

### NFL — "Shield" API (`api.nfl.com`) and developer portal (`developer.nfl.com`)
- Links: https://api.nfl.com (no public docs) · https://developer.nfl.com (redirects to `oauth.dm.nfl.com` with `client_id=developer-portal`) · terms: none public
- Category · Class: everything NFL.com and the NFL apps show (games, live scores, stats, rosters, standings) · 🟢 Official but private; use through app or web tokens = ⚫ Experimental/unstable and against the Terms
- Provides: not documented publicly. Endpoints unconfirmed (all requests 401).
- History · Live · Latency: UNVERIFIED (no access).
- Coverage: UNVERIFIED.
- Technical: REST behind Varnish; `api.nfl.com/v1/games` and `/football/v2/games/season/2026/seasonType/REG/week/12` → 401 "Unauthorized, Error 54113". Community code mints anonymous tokens from `https://api.nfl.com/identity/v3/token` (seen in sportsdataverse-js `src/core/auth.ts`, MIT, pushed 2026-11-25; also lightning-dabbler/sportscrape, yt-dlp's NFL extractor). Using those tokens borrows the NFL apps' credentials. **Do not use.**
- Cost: no public offer · Licensing: none granted; Terms §1.3 and §11 apply.
- Quality: presumably the same data NFL.com shows; unknown stability.
- Scores: Q ~10 / Cov ~10 / Rel ~6 / Lat ~9 / Hist ~7 / Doc 1 / DX ~3 / Cost ~1 / Lic 1 / Com 1 / RL ~3 / NFL 10 = **5.2**
- Recommendation: AVOID — no permission; tokens are the NFL apps' credentials. Also avoid sportsdataverse-js's `nfl_api` family even though the project lists that library as an ESPN reference.
- Verified: 2026-11-25 — three probes (401, 401, OAuth redirect); `gh search code` for the token URL; read the matching lines of sportsdataverse-js auth.ts.

### NFL — legacy GameCenter JSON and score strip (`nfl.com/liveupdate/...`)
- Links: `www.nfl.com/liveupdate/scores/scores.json`, `/liveupdate/scorestrip/ss.xml`, `/liveupdate/game-center/<id>/<id>_gtd.json`
- Category · Class: live scores, play-by-play (historical) · ⚫ retired
- Provides: nothing now; all three answer **301 → https://www.nfl.com/** (server `urllo`).
- History · Live · Latency: n/a · Coverage: n/a · Technical: dead · Cost: n/a · Licensing: n/a.
- Quality: gone. Old clients (BurntSushi/nflgame, last push 2019) cannot work.
- Scores: Q 1 / Cov 1 / Rel 1 / Lat 1 / Hist 1 / Doc 1 / DX 1 / Cost 10 / Lic 1 / Com 1 / RL 1 / NFL 1 = **1.8**
- Recommendation: AVOID — retired. This settles GITHUB_RESEARCH's open note ("feed's existence not verified").
- Verified: 2026-11-25 — three probes, all 301 to the home page.

### NFL — Next Gen Stats public site (`nextgenstats.nfl.com`)
- Links: https://nextgenstats.nfl.com · terms: links to https://www.nfl.com/help/terms (NFL.com Terms) · robots: `User-agent: * Disallow:` (empty)
- Category · Class: tracking-derived stats (completion probability, CPOE, xYAC, rushing yards over expected, separation, speed, time to sack, win probability charts) · 🟢 Official site; its JSON is ⚫
- Provides: leaderboards and "statboards" (passing, rushing, receiving), charts, live game pages. The app bundle calls relative `/api/statboard/*`, `/api/leaders/*`, `/api/live/*`, `/api/league/schedule`, plus `api.ngs.nfl.com` and `api.nfl.com`.
- History · Live · Latency: site shows seasons since NGS began (2016, per general knowledge; not re-checked) · live game pages exist · JSON latency UNVERIFIED.
- Coverage: league-wide, but only the published leaderboards and charts, not raw tracking data.
- Technical: Vue SPA; `GET /api/statboard/passing?season=2025&seasonType=REG` → **401**, empty body (CloudFront); legacy `appapi.ngs.nfl.com` → TLS certificate expired. Auth: token. Rate limits unknown.
- Cost: free to view. Licensing: NFL.com Terms (no systematic retrieval). The raw tracking feed is sold only through Genius Sports (see below).
- Quality: official model outputs; the site's own JSON is unstable and closed.
- Scores: Q 9 / Cov 6 / Rel ~7 / Lat ~6 / Hist ~6 / Doc 2 / DX 2 / Cost 10 / Lic 2 / Com 1 / RL ~4 / NFL 9 = **5.3**
- Recommendation: OPTIONAL — link to it and read by hand. For NGS numbers in the app, use nflverse's `nextgen_stats` release (another track judges its licence chain); do not call the site API.
- Verified: 2026-11-25 — home, robots, app bundle (paths only), one statboard probe (401), legacy host (TLS failure).

### NFL — NFL Pro (pro.nfl.com) and NFL+ / NFL+ Premium (All-22)
- Links: https://pro.nfl.com · https://www.nfl.com/plus · terms: https://www.nfl.com/legal/subscriptions_terms
- Category · Class: film (All-22, condensed), NGS-backed analytics, replays · 🟢 Official consumer subscription
- Provides: subscription terms §1 say NFL+ Premium includes NFL Pro "including NextGen Stats"; §12(c) NFL Pro on web and mobile web only. pro.nfl.com is a JS app ("Connecting to Next Gen Stats…"), no public feature text.
- History · Live · Latency: UNVERIFIED (behind subscription).
- Coverage: all games (per product descriptions in secondary sources).
- Technical: SPA, account-bound; no export or API seen · robots.txt 404.
- Cost: NFL+ $6.99/mo or $49.99/yr; Premium $14.99/mo or $99.99/yr — **from search snippets of support.nfl.com only; the page refused WebFetch (403). UNVERIFIED.**
- Licensing: Subscription Terms (updated Sept. 4, 2026): §1(d) "personal, non-commercial use only", household only; §12(e) no "archiving, republishing, retransmitting" or downloading unless authorised; §14(d) no software to "scrape, spider or crawl" or harvest data.
- Quality: high for personal study; not a data source.
- Scores: Q ~9 / Cov ~8 / Rel ~8 / Lat ~6 / Hist ~6 / Doc 2 / DX 1 / Cost ~5 / Lic 1 / Com 1 / RL 1 / NFL 8 = **4.7**
- Recommendation: AVOID as a data source. Fine for the owner's own viewing.
- Verified: 2026-11-25 — subscription terms read; pro.nfl.com fetched (JS-only); price page refused.

### NFL — Rules and procedures texts (NFL.com tie-breaking page; Football Operations site; Official Playing Rules PDF)
- Links: https://www.nfl.com/standings/tie-breaking-procedures · https://operations.nfl.com/rules-officiating/2026-nfl-rulebook · rulebook PDF `https://static.www.nfl.com/image/upload/fl_attachment/league/tqivdkzt9mu6wdgsh1ku.pdf` · https://operations.nfl.com/calendar-events/nfl-schedule/making-the-schedule · https://operations.nfl.com/platforms-initiatives/international-growth/nfl-international-games · https://operations.nfl.com/game-operations-logistics/technology/performance-tracking-data-next-gen-stats · terms: NFL.com Terms
- Category · Class: league rules, tiebreakers, scheduling formula, flex rules, international games, tracking-system description · 🟢 Official
- Provides: (a) tie-breakers: division two clubs, 12 steps (head-to-head; division; common games; conference; strength of victory; strength of schedule; combined conference rank in points scored and allowed; combined league rank; net points in common games; net points in all games; net touchdowns in all games; coin toss); wild card two clubs, 11 steps (head-to-head; conference; common games, minimum four; SOV; SOS; combined conference rank; combined league rank; net points in conference games; net points all games; net TDs; coin toss); three-or-more rules; "only one club advances" per step and revert to step 1; ties count as half a win and half a loss. No season or date on the page. (b) Scheduling formula: 17 games, 18 weeks, 6 division + 4 + 4 + 2 + 1 (17th game against the other conference by prior-year finish); every club plays abroad at least once in eight years. (c) Flex text (written for **2025**): SNF flex up to twice in Weeks 5–10 and as needed in 11–17; MNF Weeks 12–17; TNF Weeks 13–17; Week 18 set after Week 17, with "Three games … on Saturday" (1:00, 4:30, 8 p.m. ET), the rest Sunday 1 p.m., 4:25 p.m. and one at 8:20 p.m. ET. (d) 2026 international slate: nine games, seven countries, eight stadiums; Melbourne, Rio de Janeiro and Paris are new; 62 regular-season games abroad before 2026; opener Thu Sept. 10, 49ers vs Rams at the MCG. (e) Tracking: 20–30 UWB receivers per venue, 2–3 RFID tags per player, 10 samples a second, "more than 200 new data points" per play.
- History · Live · Latency: current year; rulebook PDF last-modified 2026-07-23 (3.8 MB) · no live · changes yearly (March owners' meeting, per general knowledge).
- Coverage: league-wide rules.
- Technical: HTML (operations site is Next.js; the text is in the page's flight data) and PDF. **The old `operations.nfl.com/the-rules/...` URLs now 404**, and `operations.nfl.com/robots.txt` 404s. The operations navigation has no tie-breaking or officials-roster page.
- Cost: free. Licensing: NFL.com Terms; the rule *facts* can be encoded in our config and code, quoting only short excerpts with a link.
- Quality: authoritative; the operations page mixes 2025 and 2026 statements, so check the season named in each paragraph.
- Scores: Q 9 / Cov 6 / Rel 6 / Lat ~5 / Hist 5 / Doc 5 / DX 4 / Cost 10 / Lic 4 / Com 5 / RL ~8 / NFL 9 = **6.3**
- Recommendation: PRIMARY reference for hand-maintained config (tie-break order, flex windows, schedule formula). Re-read each spring; record the URL and date checked in config.
- Verified: 2026-11-25 — WebFetch tie-break page; curl operations pages (4 × 200; 3 old URLs 404); `curl -I` rulebook PDF 200.

### NFL Communications — media.nfl.com (formerly nflcommunications.com)
- Links: https://media.nfl.com (nflcommunications.com 301s here) · terms: footer links to NFL.com Terms and Subscription Terms
- Category · Class: weekly league releases: "What To Look For" (milestones), weekly preview capsules, **Playoff Scenarios**, players of the week/month, awards · 🟢 Official
- Provides: public HTML articles with PDF attachments (e.g. `media.nfl.com/content/dam/communications/football-communications/2026/what-to-look-for/WTLF%20Week%2012.pdf`); filters by season (2024–2026) and week through the Super Bowl. **Gated (401 + Okta SAML login):** `/news-and-releases/media/transactions`, `/injury-reports`, `/game-day-rosters`, `/assets/guides-publications`. The site states registration is "granted solely to members of news organizations who cover the NFL on-site on a regular basis."
- History · Live · Latency: public filters start in 2024 · weekly (WTLF Week 12 posted Nov. 25, 2026) · playoff scenarios appear late in the season (none listed on Nov. 25; timing from general knowledge, UNVERIFIED).
- Coverage: league-wide.
- Technical: Adobe AEM HTML + PDFs · robots.txt redirects to `mediaarchive.nfl.net/robots.txt` (403) and `media.nfl.com/robots.txt` returned 500 → no robots guidance.
- Cost: free (public part). Licensing: NFL.com Terms (no systematic retrieval); the gated material is closed to us.
- Quality: the league's own wording of clinching scenarios: the best check on our simulator in December.
- Scores: Q 9 / Cov 5 / Rel 7 / Lat 7 / Hist 4 / Doc 2 / DX 3 / Cost 10 / Lic 2 / Com 1 / RL ~5 / NFL 8 = **5.2**
- Recommendation: SECONDARY (reading by hand): link to the weekly Playoff Scenarios and compare them with our clinch output; never re-host.
- Verified: 2026-11-25 — home, football-information, one article (200); four gated paths (401).

### NFL — Record & Fact Book (annual PDF)
- Links: 2026 edition `https://static.www.nfl.com/league/apps/league-site/media-guides/2026/2026-Record-and-Fact-Book.pdf` (linked from nfl.com game pages); operations.nfl.com footer still links the **2024** edition
- Category · Class: history, records, club directories (contents UNVERIFIED for 2026) · 🟢 Official
- Provides: UNVERIFIED in detail — the 22.8 MB file exceeded WebFetch's 10 MB limit and was not opened. Past editions are described as including club directories, coaching staffs, records and season history (secondary descriptions only).
- History · Live · Latency: decades of history (expected) · no · annual (2026 file last-modified 2026-07-28).
- Coverage: league and all clubs.
- Technical: PDF 22,832,946 bytes · Auth none.
- Cost: free. Licensing: NFL copyright; facts usable, text not to be republished; no explicit licence.
- Quality: authoritative annual snapshot; stale within weeks for staff.
- Scores: Q ~9 / Cov ~7 / Rel 8 / Lat 2 / Hist ~9 / Doc ~5 / DX 2 / Cost 10 / Lic 3 / Com 2 / RL ~8 / NFL 8 = **6.1**
- Recommendation: SECONDARY — a manual reference for hand-kept config (division history, front office at season start, Super Bowl history).
- Verified: 2026-11-25 — `curl -I` 200 for 2026 and 2024 editions; contents not read.

### NFL — GSIS (Game Statistics & Information System, nflgsis.com)
- Links: https://www.nflgsis.com/GameStatsLive/ · terms: n/a
- Category · Class: the league's official stats system · 🟢 Official, closed
- Provides: login page only: "As of July 7, 2026, our login process has changed"; NFL, club and media.nfl.com users sign in; others may "Register … to request access".
- History · Live · Latency: UNVERIFIED (closed) · Coverage: UNVERIFIED.
- Technical: IIS web app, login · robots.txt 404.
- Cost · Licensing: not offered to the public.
- Scores: Q ~10 / Cov ~10 / Rel ~9 / Lat ~10 / Hist ~8 / Doc 1 / DX 1 / Cost ~1 / Lic 1 / Com 1 / RL ~1 / NFL 10 = **5.2**
- Recommendation: AVOID — not available to a fan project; do not request access under false pretences.
- Verified: 2026-11-25 — root redirect and login page.

### Genius Sports — exclusive distributor of official NFL data (play-by-play, Next Gen Stats, betting feed)
- Links: https://www.geniussports.com/newsroom/the-national-football-league-expands-and-extends-strategic-partnership-with-genius-sports-in-multi-year-deal/ · https://www.nfl.com/news/nfl-extends-strategic-partnership-with-genius-sports (2023) · docs/pricing: none public
- Category · Class: official live data and video for media and betting · 🟡 Licensed/commercial
- Provides: per Genius (June 11, 2025): exclusive distributor of "real-time, official play-by-play statistics", NGS data and the official betting data feed to media companies and betting operators worldwide; sole supplier of low-latency official live game video to sportsbooks outside the US; in-game advertising inventory (FANHub). Oct. 15, 2026 release: official data powers "NFL Gametime on X".
- History · Live · Latency: since April 2021 (deal replaced Sportradar; CNBC/ESPN/Action Network, Apr. 1, 2021) · live · real-time (no figure published).
- Coverage: all NFL games, official.
- Technical: UNVERIFIED (no public docs) · Auth: contract.
- Cost: no public pricing; "contact sales". est. monthly for a small app: UNVERIFIED (no published tier; likely priced for enterprises — inference).
- Licensing: commercial: yes under contract; redistribution, caching and attribution per contract (UNVERIFIED).
- Quality: official source.
- Term: 2023 extension "through the end of the 2027-28 season" (nfl.com); 2025 extension "through the end of the 2029 NFL season" (Genius). The later deal governs.
- Scores: Q ~10 / Cov ~10 / Rel ~9 / Lat ~10 / Hist ~7 / Doc ~3 / DX ~4 / Cost ~1 / Lic ~7 / Com 9 / RL ~8 / NFL 10 = **7.3**
- Recommendation: OPTIONAL (future commercial product only). The only lawful route to official real-time NFL data; ask Genius for media/app terms before planning live official features.
- Verified: 2026-11-25 — Genius newsroom and nfl.com articles read; pricing searched (none).

### Sportradar — NFL API v7 (non-official since 2021)
- Links: https://developer.sportradar.com/football/reference/nfl-overview · FAQ https://developer.sportradar.com/football/reference/nfl-faq
- Category · Class: schedules, live scores, play-by-play, rosters, depth charts, injuries, standings · 🟡 Licensed/commercial (not the NFL's official distributor since the 2021 Genius deal)
- Provides: per portal: v7 current; JSON/XML; key in a header; push feeds as a paid add-on (change log 10/21/2026: push sessions replay the last 10 minutes after a disconnect). FAQ describes in-house data entry ("Our data entry team…"), weekly league stat corrections "late on Wednesday or early on Thursday", schedules "within 2–3 hours" of the NFL's release; it does not call the data official.
- Cost / terms: not researched in this track (commercial-provider track). Trial key exists per general knowledge (UNVERIFIED here).
- Scores: Q ~8 / Cov ~9 / Rel ~8 / Lat ~8 / Hist ~7 / Doc 9 / DX ~8 / Cost ~2 / Lic ~6 / Com ~8 / RL ~5 / NFL 9 = **7.2**
- Recommendation: OPTIONAL — commercial alternative; see the commercial-provider track for price and terms.
- Verified: 2026-11-25 — FAQ read; overview via search result only.

### Wikidata — SPARQL query service (teams, coaches, owners, venues)
- Links: https://query.wikidata.org/sparql · licence https://www.wikidata.org/wiki/Wikidata:Licensing · limits https://www.mediawiki.org/wiki/Wikidata_Query_Service/User_Manual
- Category · Class: team identity, head coaches (P286), general managers (P505), owners (P127), venues, colours · 🔵 Public/open data
- Provides (probe, NFL clubs = P118 Q1215884 + P31 Q17156793): 32 clubs. Head coach statements: 140 (with P580/P582 qualifiers). **The open-ended (current) head coach matches nflverse's 2026 game coach for only 18 of 32 clubs**; 14 are stale (e.g. CHI still interim Thomas Brown from 2024-11-29; NYJ Jeff Ulbrich; LV Antonio Pierce; NYG Brian Daboll; ARI and ATL have no open statement; NO's is an unlabelled item). GM (P505) present for 4 clubs. Owner (P127) present for 24, with errors (BAL lists Eric DeCosta, its GM; SEA lists the late Paul Allen; DEN Pat Bowlen). Official colour (P6364): 0 clubs.
- History · Live · Latency: deep history in principle · no · edits by volunteers, lag of a season or more for this domain.
- Coverage: patchy for front offices and coordinators.
- Technical: SPARQL over HTTP · JSON · Auth none · limits: 60 s query deadline; 60 s processing per 60 s per client (UA + IP); 30 errors a minute; 5 parallel queries per IP; HTTP 429 with Retry-After; a good User-Agent required.
- Cost: free. Licensing: structured data CC0 ("released into the public domain under Creative Commons Zero"); commercial use, redistribution and caching allowed; attribution not required (courtesy credit advisable).
- Quality: poor currency for NFL staff; fine for stable identifiers (QIDs, founding years, venue coordinates — not checked here).
- Scores: Q 4 / Cov 6 / Rel 8 / Lat 3 / Hist 7 / Doc 8 / DX 7 / Cost 10 / Lic 10 / Com 10 / RL 7 / NFL 5 = **7.1**
- Recommendation: OPTIONAL — only for stable identifiers (QIDs as cross-reference ids) and as a last-resort hint; never as the source of current coaches or front office. The high overall score reflects licence and access, not currency.
- Verified: 2026-11-25 — two SPARQL queries (200 JSON, 40 KB and 90 KB); licensing and limits pages read.

### nflverse — `nfldata` league-structure files (games, teams, standings, officials, teamcolors)
- Links: https://github.com/nflverse/nfldata (files under `data/`) · licence: none in repo (project registry already notes this)
- Category · Class: schedule, results, venue, roof/surface, weekday and time, neutral flag, head coaches per game, referee, standings, officials per game, team ids · 🔵 Public/open data (no licence file; facts)
- Provides: `games.csv` (2.2 MB, 1999–2026, 7,548 rows; columns include `weekday`, `gametime`, `location` Home/Neutral, `away_coach`/`home_coach`, `referee`, `stadium_id`, `stadium`, `roof`, `surface`, `gsis`, `nfl_detail_id`, `pfr`, `pff`, `espn`, `ftn` ids). 2026: 272 games; weekdays Sun 228, Thu 19, Mon 17, Fri 4, Wed 2, Sat 2 (Week 18 not yet set); 9 neutral international games (MCG, Maracanã, Tottenham ×2, Wembley, Stade de France, Bernabéu, Munich, Estadio Banorte); 38 distinct stadium ids. History of irregular days: Tue/Wed regular-season games in 2010, 2012, 2020 (×3), 2021 (×2), 2024 (×2, Christmas), 2026 (×2). 2022 has 271 regular-season games (BUF–CIN Week 17 no contest is absent). `standings.csv` 2002–2026 (updated 2026-11-24) with division rank, SOV, SOS, seed. `officials.csv` (game, position, official id, name): 1,994 rows for 2025 but only 65 games of 2026 (through Week 5; last commit 2026-10-09). `games.csv` `referee` filled for 65 of 163 completed 2026 games. `teamcolors.csv` last changed 2020-07-03. `teams.csv` 2002–2026 with ids for NFL, ESPN, PFR, PFF, FO, SBR, DraftKings.
- History · Live · Latency: 1999 on (standings 2002 on) · no · daily commits (games); officials lag weeks.
- Coverage: all games and clubs; officials incomplete for 2026.
- Technical: CSV/RDS over raw.githubusercontent.com · Auth none · Rate limits: GitHub's.
- Cost: free. Licensing: no licence file; facts with credit (project position, DEC-recorded). Commercial: unclear (no licence) — ask nflverse before commercial use.
- Quality: very good for schedule and coaches; officials and referee fields lag.
- Scores: Q 8 / Cov 8 / Rel 8 / Lat 7 / Hist 9 / Doc 6 / DX 9 / Cost 10 / Lic ~6 / Com ~5 / RL 9 / NFL 10 = **7.9**
- Recommendation: PRIMARY for league structure (schedule, weekdays, neutral sites, venues, head coaches by game, standings history). Officials: use only with a visible "as of" and gap count.
- Verified: 2026-11-25 — downloaded games.csv, teams.csv, standings.csv, officials.csv, teamcolors.csv; commit dates via `gh api`.

### NFL clubs — official websites (schedules, coaching staff and front office pages, media guides, game notes, calendar links)
- Links: e.g. https://www.giants.com/schedule/ · club terms: see project registry ("Official club news feeds") · calendar: Giants link to https://stanzacal.com/nfl-giants/; Chiefs and Packers use a JS widget ("Add to Calendar", provider not shown)
- Category · Class: staff (HC, coordinators, GM, owner), media guides, weekly game notes (PDF on `static.clubs.nfl.com`), schedules · 🟢 Official
- Provides: per-club HTML; content and structure vary by club. Staff pages not individually probed (UNVERIFIED which clubs list coordinators).
- History · Live · Latency: current; media guides annual · no · announcements same day.
- Coverage: one club each; 32 different terms pages (registry: most allow links only to the home page, several bar robots).
- Technical: HTML/PDF · Auth none.
- Cost: free. Licensing: club terms (restrictive; see registry). Commercial: no.
- Quality: authoritative for that club's own staff.
- Scores: Q 8 / Cov 6 / Rel ~6 / Lat 7 / Hist ~4 / Doc 1 / DX 2 / Cost 10 / Lic 2 / Com 1 / RL ~5 / NFL 8 = **5.0**
- Recommendation: SECONDARY (manual) — the evidence behind a hand-kept staff table (each row with club URL and date checked); no automated reading.
- Verified: 2026-11-25 — three club schedule pages (200) checked for calendar links; staff pages not checked.

### Football Zebras — officiating crews and weekly referee assignments
- Links: https://www.footballzebras.com/2026/08/officiating-crews-for-the-2026-season/ (from search) · terms: UNVERIFIED
- Category · Class: crew rosters, weekly assignments, rule interpretations · 🟠 Unofficial but commonly used
- Provides (per search snippets): 121 officials in 17 crews plus 2 swing officials for 2026; 7 new officials hired (Apr. 2026); weekly assignments including preseason.
- History · Live · Latency: seasons back to at least 2025 (pages exist) · no · weekly, before games.
- Technical: HTML articles · Auth none.
- Cost: free. Licensing: UNVERIFIED (not read; search budget exhausted).
- Quality: reported, not official; substitutions occur weekly. The NFL itself does not publish assignments in advance (no official page found; NFL Communications' gated area may carry them — UNVERIFIED).
- Scores: Q ~7 / Cov 6 / Rel ~6 / Lat 7 / Hist ~6 / Doc 2 / DX 2 / Cost 10 / Lic ~2 / Com ~1 / RL ~5 / NFL 6 = **5.0**
- Recommendation: OPTIONAL — link only ("reported by Football Zebras"); mark as reported, not confirmed.
- Verified: UNVERIFIED (search results only; page not opened).

### NFL — Design Playbook (designplaybook.nfl.com)
- Links: https://designplaybook.nfl.com/color · robots: `Allow: /`
- Category · Class: league brand colours · 🟢 Official
- Provides: NFL masterbrand palette only (e.g. NFL Shield Blue #003369, NFL Shield Red #D50A0A, Legacy Blue #001D3C) and an extended international palette. **No club colours.**
- Licensing: NFL trademarks; no licence offered.
- Scores: Q 9 / Cov 1 / Rel 7 / Lat ~5 / Hist 1 / Doc 6 / DX 6 / Cost 10 / Lic 3 / Com 2 / RL 8 / NFL 2 = **5.0**
- Recommendation: AVOID for club colours (not covered); avoid copying NFL brand palettes in a way that suggests endorsement.
- Verified: 2026-11-25 — colour page and robots fetched.

### teamcolorcodes.com — club colour hex/RGB/Pantone
- Links: https://teamcolorcodes.com/nfl-team-color-codes/ · terms: UNVERIFIED
- Category · Class: club colours · 🟠 Unofficial
- Provides: per-club colour codes; some entries say "Verified by NFL Uniform Guide" (search snippet, Seahawks #002244, matching the club's media guide per a Wikipedia talk page). Accuracy across all clubs not established.
- Licensing: colours are facts; site terms not read.
- Scores: Q ~6 / Cov 8 / Rel ~6 / Lat ~3 / Hist ~3 / Doc 3 / DX 4 / Cost 10 / Lic ~4 / Com ~4 / RL ~5 / NFL 6 = **5.2**
- Recommendation: OPTIONAL — cross-check only for `shared/teams.json` (already holds colours). No official public machine-readable club colour source exists.
- Verified: UNVERIFIED (search results only).

### NFLPA — nflpa.com (Public Salary Cap Report, active players)
- Links: https://nflpa.com/reports/public-salary-cap-report · terms https://nflpa.com/tos · robots: only `Noindex` lines
- Category · Class: league-wide cap room, team salary reports, player contract summaries · 🟢 Official (players' union)
- Provides: the report page loads by JavaScript ("loading…"); contents not visible to a plain fetch (UNVERIFIED).
- Licensing: ToS §4.1 content "for your information and personal use only"; §3.1 distribution needs prior written authorisation; §3.4 commercial use needs authorisation; §3.5 robots limited to human-like request rates; search-engine indexing only. No updated date shown.
- Scores: Q 8 / Cov 5 / Rel ~6 / Lat ~5 / Hist ~3 / Doc 1 / DX 1 / Cost 10 / Lic 2 / Com 1 / RL ~4 / NFL 6 = **4.3**
- Recommendation: OPTIONAL — link only; cap data comes from the contracts track (nflverse/OverTheCap).
- Verified: 2026-11-25 — home links, report page (JS-only), ToS read.

### Pro Football Hall of Fame — profootballhof.com
- Links: https://www.profootballhof.com/hall-of-famers/years · terms https://www.profootballhof.com/service/terms-of-use · robots: disallows /search/, /media/, store and account paths
- Category · Class: enshrinees by class (Class of 2026), finalists, history · 🟢 Official (the museum)
- Licensing: Terms (effective Feb. 24, 2026): §3 no robot or spider to "retrieve, index, 'scrape,' 'data mine'"; no systematic downloading; no commercial use; §5 no copying or distribution unless permitted.
- Scores: Q 9 / Cov 5 / Rel 7 / Lat 3 / Hist 10 / Doc 2 / DX 3 / Cost 10 / Lic 2 / Com 1 / RL ~5 / NFL 6 = **5.2**
- Recommendation: OPTIONAL — link only; Hall-of-Fame status as hand-entered facts with a link, or from Wikidata (CC0) after a spot check.
- Verified: 2026-11-25 — robots, home links, terms read.

### NFL Football Operations — Big Data Bowl (Kaggle) tracking-data samples
- Links: https://operations.nfl.com/platforms-initiatives/innovation/big-data-bowl · Kaggle competition pages (e.g. nfl-big-data-bowl-2025)
- Category · Class: sample NGS player-tracking data (a few weeks of one season per competition) · 🟢 Official release
- Provides: tracking data for competition use (per search results); 2026 edition deadlines Dec. 2025; a 2027 edition uses Combine sensor data (search result).
- Licensing: **UNVERIFIED** — Kaggle rules page is JavaScript-only.
- Scores: Q 10 / Cov 2 / Rel 8 / Lat 1 / Hist ~3 / Doc ~6 / DX 6 / Cost 10 / Lic ~3 / Com ~1 / RL 8 / NFL 7 = **5.4**
- Recommendation: OPTIONAL — research and model prototyping only, after the owner reads the competition data licence.
- Verified: UNVERIFIED (rules page not readable).

### sportsdataverse-js — `nfl_api` family (community client for api.nfl.com)
- Links: https://github.com/sportsdataverse/sportsdataverse-js (MIT, 89 stars, pushed 2026-11-25, not archived)
- Category · Class: wrapper that mints NFL API tokens (`https://api.nfl.com/identity/v3/token`, `nflTokenGen`) · ⚫ Experimental/unstable; uses NFL credentials without permission
- Licensing: the code is MIT; the NFL data and credentials are not licensed.
- Scores: Q ~8 / Cov ~8 / Rel ~3 / Lat ~8 / Hist ~6 / Doc 5 / DX 6 / Cost 10 / Lic 1 / Com 1 / RL ~3 / NFL 9 = **5.7**
- Recommendation: AVOID the `nfl_api` family (the project already treats the library as reference only for ESPN).
- Verified: 2026-11-25 — `gh search code`; `gh api` repo metadata and auth.ts lines.

### Club calendar sync (Stanza; ECAL-type widgets)
- Links: https://stanzacal.com/nfl-giants/ · ECAL terms: UNVERIFIED
- Category · Class: personal calendar subscriptions to a club's schedule · 🟡 third-party service for clubs
- Provides: ICS-style subscription to a person's own calendar (needs sign-up/email in the ECAL flow per secondary sources).
- Licensing: personal subscription; no redistribution right found.
- Scores: Q 7 / Cov 7 / Rel 7 / Lat 7 / Hist 1 / Doc ~2 / DX 3 / Cost 10 / Lic ~2 / Com ~1 / RL ~5 / NFL 4 = **4.7**
- Recommendation: AVOID as a data source. Instead, generate our own `.ics` from the schedule we already hold (no external dependency), labelled with its data source.
- Verified: 2026-11-25 — three club schedule pages; Stanza page fetched (JS app).

## R2. Commercial and freemium multi-domain providers

Evidence file: [tracks/R2-commercial-providers.md](tracks/R2-commercial-providers.md) (matrix rows, research log and the track's own notes).

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

## R3. Play-by-play, advanced analytics, coaching, officiating, special teams

Evidence file: [tracks/R3-pbp-analytics.md](tracks/R3-pbp-analytics.md) (matrix rows, research log and the track's own notes).

### nflverse — play-by-play (`load_pbp`, built by nflfastR)
- Links: https://github.com/nflverse/nflverse-data/releases/tag/pbp · dictionary https://github.com/nflverse/nflreadr/blob/main/data-raw/dictionary_pbp.csv · build https://github.com/nflverse/nflverse-pbp · models https://github.com/nflverse/nflfastR (NEWS.md) · license https://github.com/nflverse/nflverse-data/blob/master/LICENSE.md
- Category · Class: play-by-play + EP/WP/CPOE/xYAC/xpass · 🔵 Public/open data (upstream raw is the NFL's own game feed, pulled by nflverse's internal scraper; not an official licence)
- Provides: 372 columns per play. They include ids (`game_id` like `2026_01_ATL_PIT`, `old_game_id` like 2026091306, `nfl_api_id` UUID, `play_id`, `drive`, `fixed_drive`, `series`, `order_sequence`) and GSIS player ids for every role (passer, rusher, receiver, tacklers, pass defenders, sacks, QB hits, kicker, punter, returners, penalty player). Also down/distance/field position/clock, `desc`, play_type and play_type_nfl, shotgun, no_huddle, qb_dropback, qb_scramble, air_yards, yards_after_catch, pass_length, pass_location, run_location, run_gap; penalties (`penalty`, `penalty_type`, `penalty_team`, `penalty_player_id`, `penalty_yards`); `replay_or_challenge` and its result; timeouts and timeout_team; all special-teams flags (touchback, punt and kickoff inside 20, in end zone, out of bounds, downed, fair catch, blocked, `kick_distance`, `return_yards`, FG and XP results); drive summaries (start and end transition, plays, time of possession, yards penalized); game context from the schedule (`spread_line`, `total_line`, `roof`, `surface`, `temp`, `wind`, `home_coach`, `away_coach`, `stadium_id`). Model outputs: `ep`, `epa`, `wp`, `vegas_wp`, `wpa`, `cp`, `cpoe`, `xyac_*`, `xpass`, `pass_oe`, `success`, `qb_epa`.
- History · Live · Latency: 1999–2026. nflfastR 6.0.0 (Sept. 18, 2026) stopped supporting 1999–2000, and those files were not rebuilt today. Not live. The update workflow (`.github/workflows/update_data.yaml`) is scheduled at 09:03 UTC daily, after Thursday night games (Fri 05:33 UTC), at 22:03 UTC Sunday and 00:07 UTC Monday, and after SNF and MNF (Mon and Tue 05:33 UTC), September–February only. Observed runs on Nov. 24–25 at varied times. `timestamp.json` read "2026-11-25 14:12:56 EST". Typical latency: hours after a game.
- Coverage: all regular-season and postseason games. 2026 file: weeks 1–11, 163 games, 28,467 rows (checked).
- Technical: files on GitHub releases · CSV, CSV.gz, Parquet, RDS (and QS for older seasons) · SDK: nflreadr (R), nflreadpy (Python, MIT), NFLData.jl · Auth: none · Rate limits: GitHub release downloads (none published for anonymous asset downloads; ~11–13 MB per season compressed) · Webhooks: none. Poll `timestamp.json`.
- Cost: free · free tier: everything · paid: none · est. monthly for a small app: $0
- Licensing: commercial: the CC-BY-4.0 grant covers nflverse's own rights only. nflreadr notes the NFL data still belongs to its owners (registry). Raw JSON comes from the `nflverse-pbp-internal` scraper ("internal package for scraping raw pbp"), not a licence from the NFL · redistribution: allowed under CC-BY-4.0 for nflverse's part · caching/storage: allowed · attribution: "nflverse" with link and licence · other: the models are MIT (nflfastR, fastrmodels).
- Quality: high and actively maintained. The 2026-11-25 build added a raw-data patch mechanism (#646) and fixed duplicated and invented plays in old games. Known quirks checked in 2026 data: declined penalties are **not** in the structured fields: on the 240 plays whose only flags were declined, `penalty` is 0 (234) or empty (6) and `penalty_type`/`penalty_yards` are empty; only `desc` says "declined". When one flag is enforced and another declined, only the enforced one is coded (42 such plays); offsetting penalties likewise; `play_clock` is "0" on every row; `st_play_type` is empty on every row; `temp`/`wind` are blank on 20,651 of 28,467 rows (the schedule's weather fields stopped after week 4; see nfldata); 2026 had 217 replay rows (143 reversed, 74 upheld), 95 of them coach challenges.
- Scores: Q 8 / Cov 9 / Rel 8 / Lat 6 / Hist 9 / Doc 9 / DX 9 / Cost 10 / Lic 6 / Com ~3 / RL 10 / NFL 10 = **8.1**
- Recommendation: PRIMARY for all historical and after-game play-level analytics (EPA, success, tendencies, special teams, penalties, coaching behaviour). Record `nflverse_timestamp` and the nflfastR version with every derived number. Get commercial clearance (or a licensed feed) before a paid product.
- Verified: 2026-11-25. Release asset list and update times; downloaded `play_by_play_2026.csv.gz` (11.4 MB) and analysed it; read the dictionary, NEWS.md, the README, the update workflow and the raw-pbp script.

### nflverse — participation (`load_participation`)
- Links: https://github.com/nflverse/nflverse-data/releases/tag/pbp_participation · dictionary https://github.com/nflverse/nflreadr/blob/main/data-raw/dictionary_participation.csv · build https://github.com/nflverse/nflverse-ftn (R/participation.R)
- Category · Class: personnel, formation, coverage, pressure · 🔵 open data. 2016–2022 originate from NFL Next Gen Stats (🔴 at origin); 2023+ come from FTN Data via its API key
- Provides: `offense_formation`, `offense_personnel`, `defense_personnel`, `defenders_in_box`, `number_of_pass_rushers`, GSIS id lists of all 22 players (`players_on_play`, `offense_players`, `defense_players`), `time_to_throw`, `was_pressure`, `route` (primary receiver only), `defense_man_zone_type`, `defense_coverage_type` (COVER_0/1/2/2_MAN/3/4/6/9/COMBO/BLOWN), plus names, positions and numbers (2023+). No per-player route trees.
- History · Live · Latency: 2016–2025. **No 2026 file.** nflreadr says 2023+ data is "provided after all post-season games are completed"; the 2025 file is dated 2026-02-10. `pbp_participation_old_2023` keeps the earlier NGS-based 2023 file.
- Coverage: all games; per-season fill differs. In 2016, coverage fields are empty on all 48,434 rows, while `time_to_throw` is filled on 19,111. In 2022, coverage is filled on 18,975 of 50,150 rows. In 2025, coverage is filled on 22,055 of 45,184 and `ngs_air_yards` is empty (by design from 2024). The first season with coverage fields lies between 2017 and 2022 (UNVERIFIED which).
- Technical: release files · CSV, Parquet, RDS · SDK: nflreadr, nflreadpy · Auth: none · Rate limits: GitHub · Webhooks: none
- Cost: free · est. monthly: $0
- Licensing: nflreadr says CC-BY-SA 4.0, credited "FTN Data via nflverse" (2023+) or "NFL NextGenStats via nflverse" (2022 and earlier). Share-alike means derived datasets we publish must carry the same licence. The NGS part inherits NFL rights (see NGS).
- Quality: **taxonomy break in 2023.** NGS formations (SHOTGUN, SINGLEBACK, EMPTY, I_FORM, PISTOL, JUMBO, WILDCAT) become FTN's three (SHOTGUN, UNDER CENTER, PISTOL). Route names change too (HITCH, FLAT, OUT, CROSS become QUICK OUT, HITCH/CURL, IN/DIG, SHALLOW CROSS/DRAG). `was_pressure` is filled on all plays in 2025 but only on dropbacks in 2022. Trends across 2022/2023 need a mapping table.
- Scores: Q 6 / Cov 7 / Rel 6 / Lat 2 / Hist 7 / Doc 7 / DX 8 / Cost 10 / Lic 6 / Com ~3 / RL 10 / NFL 9 = **6.8**
- Recommendation: SECONDARY. Use for season-level scheme profiles (personnel, coverage shells, man/zone, box counts) of completed seasons; never as a current-season feed.
- Verified: 2026-11-25. Release asset list; downloaded the 2016, 2022 and 2025 CSVs (21, 22 and 49 MB), counted values, then deleted them. Read `participation.R`, `update_ftn_participation.R` and the nflreadr `load_participation` docs.

### nflverse — FTN charting (`load_ftn_charting`)
- Links: https://github.com/nflverse/nflverse-data/releases/tag/ftn_charting · dictionary https://github.com/nflverse/nflreadr/blob/main/data-raw/dictionary_ftn_charting.csv · ingest https://github.com/nflverse/nflverse-ftn · docs https://nflreadr.nflverse.com/reference/load_ftn_charting.html
- Category · Class: manual play charting · 🔵 open data licensed by FTN (CC-BY-SA 4.0)
- Provides: per play: `starting_hash`, `qb_location` (U/S/P), `n_offense_backfield`, `n_defense_box`, `is_no_huddle`, `is_motion`, `is_play_action`, `is_screen_pass`, `is_rpo`, `is_trick_play`, `is_qb_out_of_pocket`, `is_interception_worthy`, `is_throw_away`, `read_thrown` (0/1/2/CHK/DES/SD), `is_catchable_ball`, `is_contested_ball`, `is_created_reception`, `is_drop`, `is_qb_sneak`, `n_blitzers`, `n_pass_rushers`, `is_qb_fault_sack`, `date_pulled`; joined by `nflverse_game_id` and `nflverse_play_id` (= GSIS play id).
- History · Live · Latency: 2022–2026 (2022 lacks the "0" primary-read code). The job polls FTN every 6 hours (`update_ftn.yaml`, cron `0 */6 * 9-12,1-2 *`). Weeks land as batches: week 9 pulled 2026-11-12 00:01Z, week 10 on 11-18 18:01Z, week 11 on 11-25 12:01Z, i.e. about 36–72 h after the week's Monday game. nflreadr says "charted within 48 hours following each game".
- Coverage: all games; 2026 weeks 1–11, 27,636 rows, 163 games.
- Technical: release files · CSV/Parquet/RDS · Auth: none
- Cost: free · est. monthly $0
- Licensing: commercial: CC-BY-SA allows it with share-alike · redistribution: yes, same licence · attribution: nflreadr asks for "FTN Data via nflverse" (the loader message says "ftndata.com via nflverse") · other: only "a subset" of FTN's charting.
- Quality: good, with some code noise. `n_blitzers` has one value of 52; `qb_location` and `starting_hash` use "0" on about 6,770 rows (non-dropback or special-teams plays); `read_thrown` "0" means both "first read" and many non-passes, so filter to pass plays first.
- Scores: Q 7 / Cov 8 / Rel 8 / Lat 5 / Hist 5 / Doc 8 / DX 9 / Cost 10 / Lic 7 / Com ~5 / RL 10 / NFL 9 = **7.6**
- Recommendation: PRIMARY for play-action, RPO, motion, screen, no-huddle, blitz, drop, catchable-ball and QB-out-of-pocket rates. Show "FTN Data via nflverse" and the CC-BY-SA notice on every view that uses it.
- Verified: 2026-11-25. Downloaded `ftn_charting_2026.csv` (4.7 MB), counted weeks and `date_pulled`; read the dictionary, the loader docs and the workflow crons.

### FTN Data — Charting API (commercial)
- Links: https://ftnfantasy.com/stats/sports-data (refused, 403) · https://ftndata.com/pricing (302 to the former) · API spec https://charting.ftntools.com/api/openapi.json · terms: not reachable
- Category · Class: charting, participation, analytics (NFL and NBA) · 🟡 licensed/commercial
- Provides (from the public OpenAPI spec, 146 paths): `/api/nfl/charting/event/{event_id}` (also `/participation`, `/participation/matchups`, `/participation/advanced_stats`); `/api/nfl/pbp/event/{event_id}`; season stats; `/api/nfl/analytics/{passing|receiving|rushing|coverage|pass_rush|pass_protection|rush_defense|team_offense|team_defense}/stats/season/{season}`; `/api/play_matching/`; `/api/events/by_charting_status` (`is_charted`, `is_running`); participant lookups by `sr_participant_id` (a Sportradar id crosswalk).
- History · Live · Latency: search snippets of FTN's pricing page say charting goes back to 2019 (UNVERIFIED). Latency is not published. The `is_running` filter suggests in-game status (inference).
- Coverage: NFL, plus NBA endpoints.
- Technical: REST/JSON · Auth: API key as query parameter `key` (`UserAuthQuery`) · Rate limits: not published · Pagination: `limit`/`offset`
- Cost: search-engine snippets of FTN's FAQ say from "$5,000 annually for commercial" and "$3,000 annually for private" use. The pricing page snippet lists a $5,000 API tier, a $599 CSV tier and enterprise. **UNVERIFIED first-hand** (403).
- Licensing: a snippet of FTN's FAQ says partners may display the charting metrics and derivatives (UNVERIFIED). The terms were not read.
- Quality: same charting team as the nflverse subset (inference); not tested.
- Scores: Q ~8 / Cov ~8 / Rel ~7 / Lat ~6 / Hist ~6 / Doc 7 / DX 7 / Cost 3 / Lic ~6 / Com ~7 / RL ~5 / NFL 9 = **6.6**
- Recommendation: OPTIONAL now; PRIMARY candidate for charting in a commercial product. Get the written terms and price by email first.
- Verified: 2026-11-25. OpenAPI spec read (200). Pricing and terms pages refused automated access (403); prices only via search snippets.

### NFL Next Gen Stats — statboard aggregates (via nflverse `load_nextgen_stats`)
- Links: https://nextgenstats.nfl.com · mirror https://github.com/nflverse/nflverse-data/releases/tag/nextgen_stats · scraper https://github.com/nflverse/ngs-data (MIT code) · NFL terms https://www.nfl.com/legal/terms/
- Category · Class: tracking-derived player aggregates · 🟢 official numbers, but collected by 🔴 scraping (`nextgenstats.nfl.com/api/statboard/{type}?season=..&week=..` in `ngs-data/R/ngs_functions.R`)
- Provides: passing (avg_time_to_throw, intended and completed air yards, aggressiveness, air yards to sticks, expected completion %, CPOE); receiving (avg_cushion, avg_separation, share of intended air yards, YAC above expectation); rushing (efficiency, % of attempts against 8+ box, time to LOS, expected rush yards, RYOE). Week 0 = season totals.
- History · Live · Latency: 2016–2026; 2026 weeks 0–11. nflreadr: "the current season's data updates every night".
- Coverage: only players above NGS minimums (the passing file has about 600 player-weeks a season).
- Technical: release files (CSV.gz, Parquet, RDS) · no auth
- Cost: free
- Licensing: nflverse's CC-BY-4.0 cannot license NFL data. NFL Terms (updated May 16, 2024) §1.3 bars "Systematic retrieval of data or other content" without written consent, and bar commercial use. nextgenstats.nfl.com robots.txt allows all paths, but robots is not permission. Whether the NFL terms page covers the NGS site is not stated (UNVERIFIED).
- Quality: official tracking-based numbers; aggregates only, no per-play tracking.
- Scores: Q 8 / Cov 5 / Rel 7 / Lat 6 / Hist 7 / Doc 7 / DX 9 / Cost 10 / Lic 3 / Com 1 / RL 10 / NFL 8 = **6.8**
- Recommendation: SECONDARY (non-commercial only, credited "NFL Next Gen Stats via nflverse"). Not for a commercial product without an NFL or Genius licence.
- Verified: 2026-11-25. Downloaded `ngs_passing.csv.gz`; seasons 2016–2026 and 2026 weeks confirmed; scraper URL found by `gh search code`; NFL terms read; NGS robots.txt read.

### Pro Football Reference via nflverse — advanced stats and snap counts (`load_pfr_advstats`, `load_snap_counts`)
- Links: https://github.com/nflverse/nflverse-data/releases/tag/pfr_advstats · .../snap_counts · scraper https://github.com/nflverse/nflverse-pfr (GPL-3.0 code) · SR data policy https://www.sports-reference.com/data_use.html
- Category · Class: charted player stats, snaps · 🔴 scraping (nflverse-pfr calls `undercover::scrapeops_request`, a proxy-scraping service, against pro-football-reference.com)
- Provides: weekly pass (drops, bad throws, times blitzed, hurried, hit, pressured, pressure %), rush and rec (YBC, YAC, broken tackles; full columns not listed here), def (targets, completions allowed, passer rating allowed, aDOT, YAC allowed, blitzes, hurries, QB hits, pressures, missed tackles, missed tackle %). Season-level pass adds pocket time, RPO and play-action splits. Snap counts: offense, defense and special-teams snaps and % per player per game.
- History · Live · Latency: advanced stats 2018–2026 (weekly files 2018+; nflreadr's pass loader says 2019); snaps 2012–2026, but the 2012 file is only 4.5 KB (near empty, UNVERIFIED content). Both cover 2026 weeks 1–11. Per a search snippet of PFR's about page, PFR's charting is "updated by 6pm on the Tuesday" after games (UNVERIFIED first-hand; page 403).
- Coverage: players with charted events.
- Technical: release files · no auth
- Cost: free
- Licensing: PFR's advanced stats are Sportradar charting (SR blog, Sept. 2019: stats "provided by Sportradar"). The SR data-use page bars scraping without "express written permission", competing databases, redistribution and AI use. The direct site sits behind a Cloudflare managed challenge (403 to curl, not bypassed).
- Quality: useful, but two hops from the source (Sportradar → PFR → proxy scrape) and fragile.
- Scores: Q 7 / Cov 7 / Rel 6 / Lat 5 / Hist 6 / Doc 7 / DX 9 / Cost 10 / Lic 2 / Com 1 / RL 10 / NFL 8 = **6.5**
- Recommendation: OPTIONAL (owner decision; non-commercial only). Prefer FTN charting for pressures and blitzes and our own snap shares from participation where possible. AVOID for commercial use.
- Verified: 2026-11-25. Downloaded the 2026 weekly pass and def files and the 2026 snap file; read the code-search hits for `scrapeops_request`; read the SR data-use and bot-traffic pages; PFR pages returned 403.

### ESPN QBR via nflverse (`load_espn_qbr`)
- Links: https://github.com/nflverse/nflverse-data/releases/tag/espn_data · scraper https://github.com/nflverse/espnscrapeR-data (no licence)
- Category · Class: QB rating model · 🔴 scraping of ESPN
- Provides: `qbr_total`, `pts_added`, `epa_total`, pass, run, sack, penalty components, `qb_plays`, per week and season.
- History · Live · Latency: 2006–2026 (2026 weeks 1–11); files updated 2026-11-25 18:55Z.
- Coverage: qualifying QBs.
- Technical: release files · no auth · Cost: free
- Licensing: Disney Terms of Use bar automated access (registry, DEC-006).
- Quality: ESPN's proprietary model; useful as a second opinion against our own QB EPA.
- Scores: Q 7 / Cov 6 / Rel 7 / Lat 6 / Hist 8 / Doc 6 / DX 9 / Cost 10 / Lic 2 / Com 1 / RL 10 / NFL 6 = **6.5**
- Recommendation: OPTIONAL (owner decision, same status as other ESPN data). Never in a commercial product.
- Verified: 2026-11-25. Downloaded `qbr_week_level.csv.gz`; columns and seasons listed.

### nflverse — officials (`load_officials`)
- Links: https://github.com/nflverse/nflverse-data/releases/tag/officials · builder https://github.com/nflverse/nflverse-rosters/blob/main/exec/update_officials.R
- Category · Class: game officiating crews · 🔴 scraping (`ngsscrapR::scrape_officials` against NGS)
- Provides: `game_id`, `game_key`, `official_name`, `position` (Referee, Umpire, Down Judge/Head Linesman, Line Judge, Field Judge, Side Judge, Back Judge, Replay Official, alternates), `jersey_number`, `official_id`, season, week.
- History · Live · Latency: 2015–2026, **but 2026 = week 1 only** (112 rows). The workflow failed daily from Sept. 7 to 14, 2026. Commit `ecc6ef1` (Sept. 15) disabled the schedule because "the endpoint keeps rejecting the requests".
- Coverage: 230 distinct officials since 2015; complete crews for 2015–2025.
- Technical: one file (CSV 1.3 MB) · no auth · Cost: free
- Licensing: CC-BY label; the upstream is NGS (NFL terms).
- Quality: good history, dead for the current season.
- Scores: Q 7 / Cov 6 / Rel 2 / Lat 1 / Hist 7 / Doc 6 / DX 9 / Cost 10 / Lic 3 / Com 1 / RL 10 / NFL 7 = **5.8**
- Recommendation: SECONDARY for history (2015–2025 crews). Not usable for 2026 until nflverse revives it.
- Verified: 2026-11-25. Downloaded `officials.csv` and counted by season and week; read the builder script, workflow run list and commit history.

### nflverse — schedules / nfldata `games.csv` (coaches, referee, venue)
- Links: https://github.com/nflverse/nfldata/blob/master/data/games.csv · dictionary https://github.com/nflverse/nflreadr/blob/main/data-raw/dictionary_schedules.csv
- Category · Class: game metadata, head coaches, referee · 🔵 open data (no licence file; facts). Coach, referee, weather and surface fields come from PFR per the dictionary
- Provides: `home_coach`, `away_coach`, `referee` (head official only), `roof`, `surface`, `temp`, `wind`, `stadium_id`, provider game ids (`gsis`, `nfl_detail_id`, `pfr`, `pff`, `espn`, `ftn`), lines, rest days, starting QBs.
- History · Live · Latency: 1999–2026. The file is committed about every 10 minutes ("Automated data update", 22:45Z on Nov. 25). Coaches are pre-filled for future games (all 32 for 2026). **The 2026 `referee` and `surface` fields are filled only through week 4 (one game in week 5), and `temp` only through week 4.**
- Coverage: all games. 2026 `ftn` ids on all 272 games; `pff` ids on 120.
- Technical: one CSV over raw.githubusercontent.com · no auth · Cost: free
- Licensing: no licence file (registry: use with credit). The PFR-derived columns carry SR's restrictions on scraped data (inference).
- Quality: coach names reliable for the season start. Mid-season interim changes need checking (not tested). Referee and weather fields stale.
- Scores: Q 7 / Cov 8 / Rel 6 / Lat 7 / Hist 9 / Doc 8 / DX 10 / Cost 10 / Lic 6 / Com ~5 / RL 10 / NFL 9 = **7.9**
- Recommendation: PRIMARY for head coach per game (Coach → Team → Game link) and the provider-id crosswalk. SECONDARY for referee (stale in 2026).
- Verified: 2026-11-25. Downloaded `games.csv` (2.2 MB); field fill counted by season and week; latest commits read.

### nflverse models — nflfastR (EP, WP, CP, xYAC, xpass), fastrmodels, nfl4th
- Links: https://github.com/nflverse/nflfastR · https://github.com/nflverse/fastrmodels · https://github.com/nflverse/nfl4th · write-up https://www.opensourcefootball.com/posts/2020-09-28-nflfastr-ep-wp-and-cp-models/ (pre-rebuild)
- Category · Class: open models (code) · 🔵 open source, MIT
- Provides: EP and next-score probabilities; WP with and without the line, plus a new overtime WP model; CP and CPOE; xYAC (mean, median, success, first-down probability); xpass and pass_oe (now game situation only); a field-goal model (replaced in dev "built like nfl4th's"); nfl4th go, punt and FG decision values (go model "fit on 3rd and 4th downs since 2001").
- History · Live · Latency: models apply to any play, so they can be computed live by us. nflfastR 6.0.0 released Sept. 18, 2026; dev 6.0.0.9001 (Nov. 25) rebuilt EP (#644, #618/#625), regulation vegas_wp (#561/#625), overtime WP (#617) and xpass (#636). NEWS quantifies the change: a play's EPA moves 0.08 on average, `success` changes on 3% of plays, and `vegas_wp` moves 1.7 points on average.
- Coverage: NFL 2001+ (1999–2000 unsupported since 6.0.0).
- Technical: R packages; models stored as data; a JS port exists (ZachRit/nfl4th-js, MIT, single commit; FEATURE_RESEARCH) · Auth: none
- Cost: free
- Licensing: MIT + file LICENSE (DESCRIPTION files of nflfastR 6.0.0.9001, fastrmodels 2.1.0, nfl4th 1.0.7.9002). Copying model weights needs the MIT notice.
- Quality: well documented and actively validated. Numbers change between versions, so pin a version.
- Scores: Q 8 / Cov 8 / Rel 7 / Lat ~7 / Hist 9 / Doc 8 / DX 4 / Cost 10 / Lic 9 / Com 9 / RL 10 / NFL 10 = **8.3**
- Recommendation: PRIMARY reference for EP, WP and 4th-down logic (port or refit with a backtest, per the house rule). Do not mix EPA from different versions.
- Verified: 2026-11-25. Read NEWS.md, README, DESCRIPTION, commits and releases; read the nfl4th README and DESCRIPTION.

### PFF — PFF+ / PFF Pro and the PFF Developer API (consumer)
- Links: https://www.pff.com/subscribe · https://developer.pff.com/ · spec https://developer.pff.com/openapi.json · terms https://www.pff.com/terms
- Category · Class: grades, charted advanced stats · 🟡 licensed (consumer subscription)
- Provides: player grades; "Premium Stats Pro" reports by player and league. They include passing by concept, depth and pressure; time in pocket; pass-blocking efficiency; pressure allowed; pass rush; run defense; coverage, coverage scheme and coverage matchup; slot coverage; receiving versus coverage and scheme; rushing by direction; snaps by position; field goals, kickoffs, punting, returns. Spec v2.1.0: 59 `/v1` operations mirroring the Premium Stats API, plus `/v2` team pages.
- History · Live · Latency: seasons per `/v1/leagues` (not read; UNVERIFIED). Latency not stated.
- Coverage: NFL and college.
- Technical: REST/JSON and CSV export at `https://api.pff.com` · Auth: OAuth through the PFF account, or a bearer API key (`ak_…`) from pff.com/account/api-keys · Rate limits: per-account read and export budgets per minute (numbers not published; `x-ratelimit-*` headers, 429 `rate_limited`) · every response `cache-control: no-store`
- Cost: PFF+ $9.99/month (no Premium Stats, no API); $99.99/year (Premium Stats, no API); **PFF Pro $199.99/year (Premium Stats Pro and API access)**.
- Licensing: Terms (last updated Oct. 12, 2026). §1.2: "solely for your own personal, non-commercial use". §14.4(8) bars republishing API data "(including grades, rankings, or statistics)". §14.4(2)–(3) bar public distribution and resale. §14.4(5) allows caching only during an active subscription, and §14.11 requires deletion after it. §1.6 bars giving PFF data to AI models. §14.2(3) covers derived data even when the source is unrecognisable.
- Quality: PFF-only data: grades, PFF-charted pressures (per rusher and per blocker), pass-blocking efficiency, coverage grades and targeted-in-coverage stats, run-stop, and hang time for special teams (PFF and NGS only).
- Scores: Q 9 / Cov 9 / Rel ~7 / Lat ~5 / Hist ~7 / Doc 8 / DX 7 / Cost 6 / Lic 1 / Com 1 / RL ~6 / NFL 10 = **6.3**
- Recommendation: AVOID for NFL Universe: no public display, no derived metrics, no AI use. The owner could read it privately; nothing may reach the page or the assistant.
- Verified: 2026-11-25. Subscribe page (prices), developer page, OpenAPI spec (servers, security, paths) and terms all read.

### PFF enterprise data — now Teamworks
- Links: https://teamworks.com/blog/teamworks-acquires-pff-enterprise/ · https://b2b.pff.com (301 to teamworks.com)
- Category · Class: B2B event data and grades · 🟡 licensed/commercial
- Provides: "proprietary game event data and analytics platform" (Teamworks, Mar. 30, 2026); details not public.
- History · Live · Latency: UNVERIFIED.
- Coverage: NFL and college (clients: NFL teams, college programs).
- Technical: not public.
- Cost: contact sales (no prices published).
- Licensing: negotiated. The consumer PFF business stayed independent.
- Quality: industry standard (judgment).
- Scores: Q 9 / Cov 9 / Rel ~8 / Lat ~7 / Hist ~8 / Doc 3 / DX ~4 / Cost 1 / Lic ~5 / Com ~7 / RL ~7 / NFL 10 = **6.5**
- Recommendation: OPTIONAL, only for a funded commercial phase. Note the March 2026 change of hands.
- Verified: 2026-11-25. Teamworks release read; b2b.pff.com redirect observed.

### Sports Info Solutions (SIS) — DataHub / API
- Links: https://www.sportsinfosolutions.com/ · https://pro.sisdatahub.com/Home/FAQ · sales: sales@sportsinfosolutions.com (per FAQ)
- Category · Class: charting (pressures, coverage, broken tackles, Total Points, SIS-WAR) · 🟡 licensed
- Provides: charted NFL and FBS data; leaderboards with CSV download in Pro.
- History · Live · Latency: not stated on the pages read (UNVERIFIED).
- Coverage: NFL and FBS.
- Technical: web app with CSV downloads; API "similar to the one that powers DataHub" via sales.
- Cost: DataHub Pro NFL $99.99/month or $749.99/year (FAQ). Trial returns top-20 leaderboards. API price via sales.
- Licensing: SIS's own terms were not found (UNVERIFIED). A third-party licensee's terms require crediting "Statistical Data provided by Sports Info Solutions" (search snippet only).
- Quality: professional charting used by NFL teams (judgment).
- Scores: Q 8 / Cov 8 / Rel ~7 / Lat ~5 / Hist ~6 / Doc 5 / DX 4 / Cost 5 / Lic ~2 / Com ~3 / RL ~5 / NFL 9 = **5.6**
- Recommendation: OPTIONAL (commercial phase; ask for terms). Not usable now.
- Verified: 2026-11-25. Home page and FAQ read; terms not found.

### Pro Football Reference / Stathead (direct)
- Links: https://www.pro-football-reference.com · https://www.sports-reference.com/data_use.html · https://www.sports-reference.com/bot-traffic.html
- Category · Class: historical stats, coaches and coordinators per team-season, referee per game, penalties, advanced stats (Sportradar) · 🔴 for any automated use
- Provides: the deepest public history (pre-1999 box scores), coach pages, team staff.
- History · Live · Latency: decades. Advanced stats from 2018.
- Coverage: complete.
- Technical: HTML only · Auth: Stathead subscription for queries · Rate limits: bot page, "more often than twenty requests in a minute" leads to "jail for up to a day" (10 a minute for Stathead and FBref). Curl from this machine got a Cloudflare managed challenge (403).
- Cost: Stathead pricing not read (UNVERIFIED). Custom data requests have "a minimum of $5,000".
- Licensing: facts reusable. Automated access barred without "express written permission". No competing databases, no tools based on scraped data, no AI use. Some licensed datasets "completely preclude any redistribution".
- Quality: excellent reference.
- Scores: Q 8 / Cov 9 / Rel 7 / Lat 5 / Hist 10 / Doc 7 / DX 2 / Cost ~6 / Lic 2 / Com 1 / RL 2 / NFL 9 = **5.7**
- Recommendation: AVOID automated access. Link out for coaching staffs and historical context; a person may look up facts by hand and restate them with a link.
- Verified: 2026-11-25. Data-use and bot-traffic pages read; PFR pages 403 (Cloudflare challenge, not bypassed).

### Sportradar — NFL API v7 (REST + push)
- Links: https://developer.sportradar.com/football/reference/nfl-overview · FAQ https://developer.sportradar.com/football/reference/nfl-faq · push https://developer.sportradar.com/football/docs/nfl-ig-push · account https://developer.sportradar.com/getting-started/docs/your-account · terms https://developer.sportradar.com/terms-and-conditions (not read)
- Category · Class: official live PBP and stats · 🟡 licensed (official NFL data provider)
- Provides: game play-by-play with drive `id` and `sequence`, play `id`, `wall_clock` (UTC). Sample play fields include `men_in_box`, `players_rushed`, `blitz`, `qb_at_snap`, `huddle` and tight-end counts. Subjective stats (QB hurry, defender blitz) arrive "the following Tuesday by 6:00 PM ET". Also game statistics, boxscore, seasons, transactions (from 2002), push feeds.
- History · Live · Latency: historical regular season and postseason from 2000, preseason from 2015 (doc page per search result; 2000–2020 partly sourced from the NFL, all data collected by Sportradar operators from 2021). Live: push "as it is entered", ahead of the TV picture (no number published). Push is a long-lived HTTP stream of one JSON object per line, heartbeat every 5,000 ms, resume within 10 minutes with up to 5,000 messages or 30 s replayed. Status `complete` then `closed` (stats validated).
- Coverage: all NFL games, including preseason.
- Technical: REST/JSON (and XML historically) `https://api.sportradar.com/nfl/official/{access_level}/v7/{lang}/...` · push streams · Auth: API key · Trial: "1,000 requests (quota) per rolling 30 days", 1 QPS, 30 days. "Production access is reserved for Sportradar customers".
- Cost: not published; contact sales@sportradar.com.
- Licensing: per contract (terms page not read; UNVERIFIED).
- Quality: official-grade and very complete (it is also PFR's advanced-stat source).
- Scores: Q 9 / Cov 10 / Rel 9 / Lat 9 / Hist 8 / Doc 9 / DX 8 / Cost 2 / Lic ~6 / Com 9 / RL ~5 / NFL 10 = **7.8**
- Recommendation: PRIMARY candidate for a commercial live game center (play ids, drive ids, GSIS-mappable player ids, wall clock). The trial is for evaluation; don't build the free site on it.
- Verified: 2026-11-25. Overview, FAQ (first 100k characters), push guide and account page read. Historical-coverage figures came via a search result about the historical-data page (not opened; partly UNVERIFIED).

### SportsDataIO — NFL API
- Links: https://sportsdata.io/nfl-api · https://sportsdata.io/free-trial · https://sportsdata.io/help/data-rights-and-licensing-questions
- Category · Class: live scores, PBP, stats, odds · 🟡 licensed
- Provides: schedules, game state, box scores, play-by-play, player and team stats (endpoint field list not read).
- History · Live · Latency: live; latency not published (UNVERIFIED).
- Coverage: NFL and others.
- Technical: REST/JSON · key · the free trial is "scrambled" data · Replay product with recorded feeds.
- Cost: production "only available as part of a commercial licensing discussion". Discovery Lab: free last-season data plus paid personal packages, "licensed for personal, non-commercial use only".
- Licensing: commercial licences allow storage and display. Reselling "the feed itself as a standalone data product is not permitted". Attribution required. Personal plans cannot power public-facing products.
- Quality: widely used (judgment). Announced an exclusive stats and odds relationship with PFF's site (search title only, UNVERIFIED).
- Scores: Q ~8 / Cov 9 / Rel ~8 / Lat ~7 / Hist ~7 / Doc 8 / DX 8 / Cost 3 / Lic 6 / Com 8 / RL ~6 / NFL 9 = **7.3**
- Recommendation: SECONDARY (commercial alternative to Sportradar). Discovery Lab is personal-only, so not for the public page.
- Verified: 2026-11-25. Free-trial and data-rights pages read.

### Genius Sports — NFL official data distributor
- Links: https://www.nfl.com/news/nfl-extends-strategic-partnership-with-genius-sports
- Category · Class: official real-time PBP, NGS data, official betting feed · 🟡 licensed (exclusive)
- Provides: per NFL.com, Genius is the "exclusive distributor of real-time, official play-by-play statistics", NGS data and the betting feed to media and sportsbooks.
- History · Live · Latency: real time (no figures).
- Coverage: NFL.
- Technical: not public.
- Cost: enterprise only.
- Licensing: enterprise. The NFL article says the deal runs "through the end of the 2027-28 season" (publication date not shown on the page; later 2025–2026 expansions reported by press, UNVERIFIED).
- Quality: the official source.
- Scores: Q ~10 / Cov 10 / Rel ~9 / Lat ~10 / Hist ~7 / Doc 2 / DX ~3 / Cost 1 / Lic ~5 / Com 9 / RL ~7 / NFL 10 = **6.9**
- Recommendation: OPTIONAL. Relevant only for a funded media or betting product; it also explains why no official free NGS or PBP API exists.
- Verified: 2026-11-25. NFL.com article read; the BusinessWire 2025 release returned 403.

### ESPN — game summary and core play-by-play (local only)
- Links: `site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=<id>` · terms: Disney ToU (registry)
- Category · Class: near-live PBP and WP · 🟠 unofficial (Disney ToU bars automated access; DEC-006 keeps it on the owner's machine)
- Provides: drives (`id`, start, end, result, plays), plays (`id`, `sequenceNumber`, `wallclock` UTC, `modified`, `type`, `text`, `clock`, `period`, `start` and `end` down/distance/yardline, `isPenalty`, `scoringPlay`, `statYardage`, `teamParticipants`), win probability by `playId`. Player participants are in the core API (not checked today).
- History · Live · Latency: live (seconds; the registry polls the scoreboard every 15 s). Event 401873078 (CIN at WAS, Nov. 23): 20 drives, 182 WP points.
- Coverage: all games.
- Technical: REST/JSON, no auth, no published limits.
- Cost: free.
- Licensing: Disney ToU §2.B(x) bars robots and scripts (registry).
- Quality: good and fast; schema unofficial and can change.
- Scores: Q 8 / Cov 9 / Rel 7 / Lat 9 / Hist ~6 / Doc 3 / DX 7 / Cost 10 / Lic 1 / Com 1 / RL ~6 / NFL 9 = **6.3**
- Recommendation: SECONDARY, local-only live PBP (as today). Never published raw and never in a commercial build. ESPN FPI and the pass-rush and run-stop win rates have no lawful API.
- Verified: 2026-11-25. One scoreboard and one summary request (existence and shape check).

### NFL GameCenter legacy JSON feed (nflgame era)
- Links: `www.nfl.com/liveupdate/game-center/<id>/<id>_gtd.json`, `www.nfl.com/liveupdate/scores/scores.json`, `feeds.nfl.com/feeds-rs/scores.json`
- Category · Class: legacy live PBP · ⚫ retired
- Provides: nothing now. Both liveupdate URLs answer 301 to the nfl.com home page; feeds.nfl.com answers 403.
- History · Live · Latency: n/a
- Coverage: n/a
- Technical: n/a · Cost: n/a
- Licensing: NFL Terms §1.3 (systematic retrieval barred).
- Quality: dead.
- Scores: Q ~3 / Cov 1 / Rel 1 / Lat 1 / Hist 1 / Doc 2 / DX 1 / Cost 10 / Lic 1 / Com 1 / RL 1 / NFL 1 = **2.0**
- Recommendation: AVOID (confirms GITHUB_RESEARCH's "Avoid" for nflgame).
- Verified: 2026-11-25. Three curl probes.

### NFL Big Data Bowl tracking data (Kaggle)
- Links: https://operations.nfl.com/the-game/big-data-bowl (search result) · terms page https://operations.nfl.com/the-game/big-data-bowl/terms-and-conditions (404 today)
- Category · Class: player tracking samples (NGS) · 🟢 official, competition-licensed
- Provides: per-frame player tracking for a subset of games, used for separation, coverage, tackling and route studies.
- History · Live · Latency: one partial season per competition; no live data.
- Coverage: subset.
- Technical: CSV on Kaggle (not opened).
- Cost: free with a Kaggle account (account creation not done).
- Licensing: **UNVERIFIED**: the terms page was 404 and Kaggle rules were not read.
- Quality: the only public tracking data.
- Scores: Q 10 / Cov 3 / Rel 8 / Lat 1 / Hist 4 / Doc 7 / DX 6 / Cost 10 / Lic ~2 / Com ~1 / RL 10 / NFL 9 = **5.9**
- Recommendation: OPTIONAL, research only, after reading the competition rules. Not a product data source.
- Verified: UNVERIFIED (terms page 404; Kaggle not accessed).

### TruMedia Networks — football platform
- Links: https://trumedianetworks.com/football (search result)
- Category · Class: analytics platform and API merging PBP, charting and tracking · 🟡 licensed
- Provides: per search result, an enterprise query and visualisation tool and an API that merges datasets including tracking.
- History · Live · Latency: UNVERIFIED.
- Coverage: NFL.
- Technical: API (details not public).
- Cost: contact info@trumedianetworks.com (search snippet).
- Licensing: UNVERIFIED.
- Quality: enterprise (judgment).
- Scores: Q ~8 / Cov ~8 / Rel ~8 / Lat ~7 / Hist ~7 / Doc 2 / DX ~4 / Cost 1 / Lic ~5 / Com ~7 / RL ~6 / NFL 9 = **6.0**
- Recommendation: OPTIONAL (enterprise only).
- Verified: UNVERIFIED (search snippets only; the site was not opened because of the search budget).

### SumerSports — free stats site
- Links: https://sumersports.com/features/stats/ · terms https://sumersports.com/terms-of-service/
- Category · Class: free advanced stats (play-level filters) · 🟠 public website (no data access offered)
- Provides: player and team advanced metrics on the web (source not stated in the terms).
- History · Live · Latency: UNVERIFIED.
- Coverage: NFL.
- Technical: website only; no API or export found.
- Cost: free to view.
- Licensing: terms effective May 19, 2025. §7 item 9 bars using any means "to access, retrieve, copy, scrape, or index" the platform. §3(c) bars copying, publishing, distributing or making derivative works of Sumer content. §7 item 4 bars commercial purposes.
- Quality: reputable analysts (judgment).
- Scores: Q ~8 / Cov 7 / Rel ~7 / Lat ~5 / Hist ~5 / Doc 2 / DX 1 / Cost 10 / Lic 1 / Com 1 / RL 1 / NFL 8 = **4.7**
- Recommendation: AVOID as a data source; link out only.
- Verified: 2026-11-25. Terms read.

### Sharp Football Analysis — stats and subscriptions
- Links: https://www.sharpfootballanalysis.com/terms-of-service/
- Category · Class: betting-oriented analytics and tendencies · 🟠 public/paid website
- Provides: team tendency and situational stats (not inspected).
- History · Live · Latency: UNVERIFIED.
- Coverage: NFL.
- Technical: website only.
- Cost: season "All-Access" subscriptions (price not read).
- Licensing: terms bar "any automatic device, process, or means to access" and creating derivative works or distributing content; personal, non-commercial use. The data source is not disclosed.
- Quality: UNVERIFIED.
- Scores: Q ~7 / Cov 6 / Rel ~6 / Lat ~5 / Hist ~5 / Doc 2 / DX 1 / Cost 5 / Lic 1 / Com 1 / RL 1 / NFL 7 = **3.9**
- Recommendation: AVOID as a data source. Compute the same tendencies from nflverse PBP and FTN.
- Verified: 2026-11-25. Terms read.

### rbsdm.com (Ben Baldwin) — EPA/CPOE leaderboards and 4th-down calculator
- Links: https://rbsdm.com · https://rbsdm.com/stats/fourth_calculator/ (linked from the nfl4th README)
- Category · Class: derived analytics site built on nflfastR · 🟠 public website
- Provides: EPA, CPOE and success leaderboards and team tiers; the 4th-down calculator (nfl4th).
- History · Live · Latency: UNVERIFIED (JavaScript app; nothing readable without running it).
- Coverage: NFL.
- Technical: single-page JavaScript app; no documented API.
- Cost: free.
- Licensing: no terms found (UNVERIFIED). The underlying code (nfl4th, nflfastR) is MIT.
- Quality: the reference implementation of public EPA metrics (judgment).
- Scores: Q 8 / Cov 7 / Rel ~6 / Lat 6 / Hist 8 / Doc 3 / DX 2 / Cost 10 / Lic ~3 / Com 2 / RL ~3 / NFL 8 = **5.5**
- Recommendation: OPTIONAL as a validation target. Compare our EPA/play and CPOE leaderboards against it by hand, and compute everything ourselves from nflverse.
- Verified: 2026-11-25. Home page fetched (SPA shell only).

### nfelo / nfeloapp
- Links: https://www.nfeloapp.com/ · https://github.com/greerreNFL/nfelo (licence)
- Category · Class: Elo ratings, QB values, EPA tiers, team tendencies, head-coach ATS · 🔵 open outputs
- Provides: per the site, ratings, QB Elo and EPA, team tendencies, HFA tracker, a model backtest "back to 2009"; "powered by the nflfastR dataset".
- History · Live · Latency: 2009+ backtests; weekly (registry).
- Coverage: NFL.
- Technical: CSVs on GitHub (already used: `qb_elos.csv`).
- Cost: free.
- Licensing: outputs may be republished; no right to run, import or modify the code.
- Quality: well regarded (judgment).
- Scores: Q 7 / Cov 7 / Rel 7 / Lat 6 / Hist 8 / Doc 6 / DX 7 / Cost 10 / Lic 6 / Com ~5 / RL 10 / NFL 9 = **7.3**
- Recommendation: SECONDARY (already in use for QB values). Its "team tendencies" is a useful cross-check for ours.
- Verified: 2026-11-25. Site page and LICENSE read.

### nflpenalties.com
- Links: https://www.nflpenalties.com (robots: `Allow: /`)
- Category · Class: penalty and referee-crew stats · 🟠 unofficial website, source undisclosed
- Provides: penalties by team, player, referee crew, type and down; "Data From 2009-2026" (home page title).
- History · Live · Latency: 2009–2026; update timing UNVERIFIED.
- Coverage: NFL.
- Technical: HTML only.
- Cost: free.
- Licensing: no terms or data-source statement found on the home page (UNVERIFIED). Robots allows crawling, which is not permission to reuse.
- Quality: commonly cited (a Harvard Sports Analysis article scraped it, per search result).
- Scores: Q ~6 / Cov 7 / Rel ~5 / Lat ~5 / Hist 7 / Doc 2 / DX 2 / Cost 10 / Lic 1 / Com 1 / RL ~5 / NFL 7 = **4.8**
- Recommendation: AVOID as a source. Compute penalties per crew from nflverse PBP plus a crew table, parsing `desc` for declined and offsetting flags.
- Verified: 2026-11-25. Home page and robots.txt fetched.

### Football Zebras — crews and weekly referee assignments
- Links: https://www.footballzebras.com/2026/08/officiating-crews-for-the-2026-season/ (weekly posts such as /2025/11/week-12-referee-assignments-2025)
- Category · Class: officiating news and crew rosters · 🟠 independent publication
- Provides: 2026 crews ("121 officials are assigned to 17 crews with 2 swing officials", published Aug. 1, 2026); per crew: position, number, name, years, previous crew, college, occupation. Weekly referee-to-game assignments.
- History · Live · Latency: crew posts every season; weekly assignment posts (2026 weekly posts not confirmed in search; 2025 seen). Timing UNVERIFIED.
- Coverage: all 17 crews.
- Technical: HTML articles.
- Cost: free.
- Licensing: "Copyright © 2025 Equity Creative Group, LLC"; no reuse terms. Names and assignments are facts, but the tables are their compilation.
- Quality: the de facto public reference for crews (judgment).
- Scores: Q 8 / Cov 8 / Rel 7 / Lat ~7 / Hist ~7 / Doc 3 / DX 2 / Cost 10 / Lic 2 / Com 1 / RL ~5 / NFL 8 = **5.7**
- Recommendation: SECONDARY as a manual, linked reference. A curator types the weekly referee per game (one name per game) into a small curated file with a source link, as `data/news.json` does. No scraping.
- Verified: 2026-11-25. The 2026 crews page read (structure only; table not copied).

### NFL Football Operations — officials announcements
- Links: https://operations.nfl.com (2016 and 2019 roster posts surfaced in search; the 2026 roster was not found)
- Category · Class: official officiating information · 🟢 official
- Provides: roster-of-officials announcements; rule explainers.
- History · Live · Latency: irregular.
- Coverage: league-wide.
- Technical: HTML.
- Cost: free.
- Licensing: NFL Terms (systematic retrieval and compilations barred).
- Quality: authoritative but sparse.
- Scores: Q 9 / Cov 5 / Rel 8 / Lat 4 / Hist 6 / Doc 4 / DX 2 / Cost 10 / Lic 2 / Com 1 / RL ~5 / NFL 8 = **5.3**
- Recommendation: OPTIONAL. Cite and link for confirmed facts, such as the official crew count.
- Verified: UNVERIFIED for 2026 (only search results; the kickoff-rule explainer URL returned 404).

### Wikidata — head coaches (P286)
- Links: https://query.wikidata.org/sparql
- Category · Class: structured coaching history · 🔵 open data (CC0)
- Provides: team → head coach statements with start and end qualifiers. No reliable coordinator or play-caller data found.
- History · Live · Latency: community-edited; lags.
- Coverage: 30 of 32 teams returned a current head coach. **Many are stale for 2026** (e.g. Raiders "Antonio Pierce", Jets "Jeff Ulbrich", Bears "Thomas Brown", Ravens "John Harbaugh"), while nfldata lists Klint Kubiak, Aaron Glenn, Ben Johnson and Jesse Minter.
- Technical: SPARQL/JSON · no key; User-Agent expected.
- Cost: free.
- Licensing: CC0.
- Quality: poor for current staff, useful for history and aliases.
- Scores: Q 3 / Cov 6 / Rel 6 / Lat 2 / Hist 7 / Doc 8 / DX 7 / Cost 10 / Lic 10 / Com 10 / RL ~7 / NFL 4 = **6.7** (the score overstates usefulness because licence and cost dominate)
- Recommendation: OPTIONAL. Use for coach identity (QIDs, aliases, birth data), never as the current-staff source.
- Verified: 2026-11-25. One SPARQL query; compared with nfldata 2026 coaches.

## R4. Player tracking, Next Gen Stats and computer vision

Evidence file: [tracks/R4-tracking-cv.md](tracks/R4-tracking-cv.md) (matrix rows, research log and the track's own notes).

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

## R5. Weather, stadiums, geospatial and travel

Evidence file: [tracks/R5-weather-stadium-geo.md](tracks/R5-weather-stadium-geo.md) (matrix rows, research log and the track's own notes).

### A. Weather — forecasts, history, archived forecasts

### Open-Meteo — Weather Forecast API (in use: `open-meteo`)
- Links: https://open-meteo.com · https://open-meteo.com/en/docs · https://open-meteo.com/en/terms , https://open-meteo.com/en/licence , https://open-meteo.com/en/pricing · https://github.com/open-meteo/open-meteo (server AGPLv3)
- Category · Class: weather forecast · 🔵 Public/open data (CC BY 4.0 data; free tier non-commercial)
- Provides: hourly/daily temperature, wind speed/direction/gusts, precipitation and probability, snowfall, etc.; `timezone=auto` returns the IANA zone; multi-location in one call (comma-separated coordinates, JSON becomes a list — docs read).
- History · Live · Latency: `past_days` up to 92 · yes · hourly series; model runs update every 1–6 h per model (historical-forecast docs table).
- Coverage: global; neutral sites abroad work (probed London, Mexico City).
- Technical: REST · JSON/CSV/XLSX · SDK: none needed · Auth: none (free) / key on `customer-api.open-meteo.com` (paid) · Rate limits (free): <600/min, 5,000/h, 10,000/day, 300,000/month, per IP and per application; "shared hosting" may hit limits sooner (terms) · Pagination/Webhooks: none.
- Cost: free: non-commercial only · free tier: limits above · paid: Standard 1M calls/month, Professional 5M, Enterprise 50M+ (pricing page; prices rendered by a Stripe widget, not readable); Open-Meteo's own post of 2023-06-12 lists Standard US$29/month and Professional US$99/month · est. monthly for a small app: $0 non-commercial; ~$29 commercial forecast-only. A request over 10 variables or 2 weeks of data counts as more than one call (pricing FAQ). Whether a multi-location request counts as one call per location: UNVERIFIED.
- Licensing: commercial: only with a subscription ("You may only use the free API services for non-commercial purposes", terms) · redistribution: CC BY 4.0 allows sharing and adapting · caching/storage: not restricted by the terms · attribution: a link next to the data, e.g. "Weather data by Open-Meteo.com", and say whether the data was changed (licence page) · other restrictions: the underlying model data carries the providers' own licences (UK Met Office CC BY-SA 4.0; NOAA, Météo-France, ECCC and JMA under their own terms); free-tier IPs can be blocked for misuse without notice.
- Quality: grid model output (no station correction); grid cell can be "a few kilometres away"; probe for Highmark returned a cell at 42.765, -78.800 and 222 m.
- Scores: Q ~8 / Cov ~10 / Rel ~7 / Lat ~9 / Hist ~3 / Doc ~9 / DX ~10 / Cost 9 / Lic ~8 / Com ~6 / RL 9 / NFL ~8 = **8.0**
- Recommendation: PRIMARY (forecast at outdoor venues) — free, global, no key; a paid plan before any commercial launch.
- Verified: 2026-11-25 — forecast probe HTTP 200; `hourly_units.snowfall` = "inch" when `precipitation_unit=inch` (finding: the fabric divides by 2.54 a second time); terms, licence, pricing and docs read; one multi-location call (34 venues, `timezone=auto`) returned 34 results with IANA zones and elevations.

### Open-Meteo — Historical Forecast API
- Links: https://open-meteo.com/en/docs/historical-forecast-api · endpoint `https://historical-forecast-api.open-meteo.com/v1/forecast` · terms as above
- Category · Class: archived model output (stitched) · 🔵 Public/open data
- Provides: the same variables as the Forecast API for past dates. Page: a "continuous hourly timeseries" stitched from "the first few hours" of each run, so each hour is a 0–~6 h-ahead forecast.
- History · Live · Latency: per model: HRRR 2018-01-01; ECMWF IFS HRES 9 km 2017-01-01; GFS 2021-03-23; ICON 2022-11-24; NBM 2024-10-08; JMA 2016-01-01; NAM 2025-09-01 ("no updates since 2026-11-01") · n/a · new runs appended as they arrive.
- Coverage: global (model-dependent); the default `best_match` returned nulls for 2016-01-03 at Buffalo and values for 2021-01-03 (probed), so the depth of the default blend is shorter than the per-model table.
- Technical: REST · JSON/CSV · Auth: none (free) · limits as the Forecast API · Pagination: none.
- Cost: free non-commercial; historical APIs require Professional per the pricing FAQ and the 2023 post (the pricing table also ticks "Free" — inconsistent on the page) · est.: $0 / ~$99 commercial.
- Licensing: as Open-Meteo (CC BY 4.0, link next to data; non-commercial free tier).
- Quality: tracks observed weather closely (each run starts from measurements); the page warns it is "Not suitable for long time series" because models change. Buffalo 2025 kickoffs: within about 1–3 °F of the KBUF report; wind sometimes much lower (e.g. 1.2 mph against 13.8 mph reported, 2025-12-28).
- Scores: Q ~7 / Cov ~10 / Rel ~7 / Lat ~7 / Hist ~5 / Doc ~8 / DX ~10 / Cost 9 / Lic ~8 / Com ~5 / RL 8 / NFL ~7 = **7.6**
- Recommendation: SECONDARY — fills observed-like game conditions for 2017+/2021+ where nfldata is blank; **not** a source of "forecast known before kickoff" beyond a few hours.
- Verified: 2026-11-25 — docs read; probes for 2016, 2021 and a 2025 season range (HTTP 200).

### Open-Meteo — Previous Runs API
- Links: https://open-meteo.com/en/docs/previous-runs-api · endpoint `https://previous-runs-api.open-meteo.com/v1/forecast`
- Category · Class: archived forecasts at fixed lead times · 🔵 Public/open data
- Provides: `<variable>_previous_dayN`, N = 1–7: the value forecast 24·N hours before the valid time (page); `_previous_day0` = current run.
- History · Live · Latency: most models from January 2024; GFS 2 m temperature from March 2021; JMA GSM/MSM from 2018; earlier "may be reconstructed on request" · yes · per model run cadence.
- Coverage: global; regional models only out to their horizon.
- Technical: REST · JSON/CSV/XLSX · Auth: none · limits as above.
- Cost: as the historical APIs (Professional for commercial).
- Licensing: as Open-Meteo.
- Quality: probe for Buffalo 2025-12-14 00 UTC: observed-like run -5.1 °C, day-1 forecast -8.6 °C, day-3 -9.1 °C — the lead-time error is material, which is the point of using it.
- Scores: Q ~8 / Cov ~10 / Rel ~7 / Lat ~7 / Hist ~3 / Doc ~7 / DX ~9 / Cost 9 / Lic ~8 / Com ~5 / RL 8 / NFL ~8 = **7.4**
- Recommendation: PRIMARY for leakage-free weather features in backtests from the 2024 season on (freeze, e.g., the day-1 value for each kickoff).
- Verified: 2026-11-25 — docs read; probe HTTP 200 with `_previous_day1/2/3` columns.

### Open-Meteo — Single Runs API
- Links: https://open-meteo.com/en/docs/single-runs-api · endpoint `https://single-runs-api.open-meteo.com/v1/forecast?...&run=YYYY-MM-DDTHH:MM`
- Category · Class: full archived model runs · 🔵 Public/open data
- Provides: the complete output of one run chosen by its UTC start time.
- History · Live · Latency: ECMWF IFS HRES 9 km from "March 14, 2024"; most other models from "2nd of April 2026"; publication delay 4–6 h global, 1–3 h regional · n/a.
- Coverage: global.
- Technical: REST · JSON · Auth: none (free) · served from archive storage, slower.
- Cost: as historical APIs; page lists Non-Commercial, Commercial and Self-Hosted licences without prices.
- Licensing: as Open-Meteo.
- Quality: exact "what the model said at time t" — the cleanest leakage control (use runs whose publish time precedes the decision time).
- Scores: Q ~8 / Cov ~10 / Rel ~6 / Lat ~6 / Hist ~2 / Doc ~7 / DX ~8 / Cost 8 / Lic ~8 / Com ~5 / RL 8 / NFL ~6 = **6.8**
- Recommendation: OPTIONAL — Previous Runs covers the same need more simply.
- Verified: 2026-11-25 — docs read; not probed.

### Open-Meteo — Historical Weather API (ERA5 / ERA5-Land / IFS)
- Links: https://open-meteo.com/en/docs/historical-weather-api · endpoint `https://archive-api.open-meteo.com/v1/archive`
- Category · Class: reanalysis · 🔵 Public/open data (Copernicus data underneath)
- Provides: hourly reanalysis variables.
- History · Live · Latency: ERA5 0.25° from 1940; ERA5-Land 0.1° from 1950; ECMWF IFS 9 km from 2017; ERA5 "Daily with 5 days delay" · no.
- Coverage: global; ERA5-Land lacks wind in most cases (page).
- Technical: REST · JSON/CSV · Auth: none (free) · limits as above.
- Cost: free non-commercial; Professional for commercial (FAQ/2023 post).
- Licensing: CC BY 4.0 plus the Copernicus licence for reanalysis (licence page).
- Quality: consistent over decades; coarse (25 km) — local wind is smoothed. Buffalo 2025 kickoffs: ERA5 temperature within ~1–3 °F of nfldata; ERA5 wind closer to the airport report than the historical-forecast blend in 2 of 3 windy games.
- Scores: Q ~7 / Cov ~10 / Rel ~8 / Lat ~3 / Hist ~10 / Doc ~9 / DX ~10 / Cost 9 / Lic ~8 / Com ~5 / RL 8 / NFL ~7 = **7.8**
- Recommendation: SECONDARY — fills long-history weather for 1999+ backtests where nfldata is blank (labelled "reanalysis", not observation, not forecast).
- Verified: 2026-11-25 — docs read; probe for 1960-01-03 (HTTP 200, values) and the 2025 Buffalo season.

### Open-Meteo — Elevation API
- Links: https://open-meteo.com/en/docs/elevation-api · endpoint `https://api.open-meteo.com/v1/elevation`
- Category · Class: elevation · 🔵 Public/open data (Copernicus DEM)
- Provides: elevation for up to many points per call.
- History · Live · Latency: static.
- Coverage: global, 90 m grid. It is a surface model: values near rivers/roofs are approximate (EverBank 0 m, Lincoln Financial 0 m, Superdome 23 m returned).
- Technical: REST · JSON · Auth: none.
- Cost: free non-commercial (Elevation is a "core" API, included in Standard).
- Licensing: CC BY 4.0 + Copernicus DEM licence.
- Quality: Empower Field 1,588 m (5,210 ft); a helper's USGS EPQS call gave 5,195 ft — consistent within ~5 m.
- Scores: Q ~6 / Cov ~10 / Rel ~8 / Lat ~8 / Hist ~5 / Doc ~7 / DX ~10 / Cost 10 / Lic ~8 / Com ~6 / RL 9 / NFL ~5 = **7.7**
- Recommendation: SECONDARY (one-time altitude per venue; USGS EPQS for US venues is better).
- Verified: 2026-11-25 — probe HTTP 200 (Denver 1588 m, Buffalo 222 m).

### National Weather Service — api.weather.gov hourly gridpoint forecast
- Links: https://www.weather.gov/documentation/services-web-api · `/points/{lat},{lon}` → `forecastHourly`, `forecastGridData` · terms: same page (open data) · GitHub: https://github.com/weather-gov/api (issues)
- Category · Class: weather forecast (US) · 🟢 Official
- Provides: 156 hourly periods (probed) with temperature, wind speed (text, e.g. "6 mph"), direction (compass), precipitation probability; raw grids via `forecastGridData`; `/points` also returns `timeZone` and nearest radar.
- History · Live · Latency: forecast only · yes · Buffalo forecast `updateTime` 20:57 UTC, generated 22:34 UTC (probed).
- Coverage: US only (points abroad answer 400 — registry).
- Technical: REST · GeoJSON/JSON-LD/DWML · Auth: User-Agent (an API key "will replace this requirement in the future") · Rate limits: not public; retry "typically within 5 seconds" · gridX/gridY can change, recheck `/points`.
- Cost: free · free tier: n/a · paid: none · est.: $0.
- Licensing: open data, any purpose; US government work · attribution: credit NWS (registry practice) · no endorsement implied.
- Quality: human-edited NDFD forecast (better local wind than raw models in many cases — judgment); text-encoded wind needs parsing.
- Scores: Q ~8 / Cov ~4 / Rel ~6 / Lat ~9 / Hist ~1 / Doc ~8 / DX ~7 / Cost 10 / Lic 10 / Com 10 / RL ~7 / NFL ~7 = **7.2**
- Recommendation: SECONDARY (US cross-check of Open-Meteo; commercial-safe primary for US venues in a commercial product).
- Verified: 2026-11-25 — docs read; `/points/42.7738,-78.787` (grid BUF 39,42, zone America/New_York, radar KBUF) and hourly forecast HTTP 200.

### National Weather Service — api.weather.gov station observations
- Links: https://www.weather.gov/documentation/services-web-api · `/stations/{ICAO}/observations[/latest]`, `/gridpoints/{wfo}/{x},{y}/stations`
- Category · Class: observations (US) · 🟢 Official
- Provides: METAR-derived observations in SI units with quality flags (`qualityControl` V/Z).
- History · Live · Latency: **7 days only** (docs: "Only 7 days"; probe: 3 days ago 11 reports, 10 and 15 days ago 0) · yes · MADIS can delay up to 20 min.
- Coverage: US stations; nearest list for the Buffalo grid: KBUF, KIAG, KDKK, KOLE, KJHW.
- Technical: REST · GeoJSON · Auth: User-Agent · limits as above.
- Cost: free.
- Licensing: open data, any purpose.
- Quality: gusts often null (`Z`); airport ≠ stadium.
- Scores: Q ~8 / Cov ~5 / Rel ~6 / Lat ~9 / Hist ~1 / Doc ~8 / DX ~7 / Cost 10 / Lic 10 / Com 10 / RL ~7 / NFL ~6 = **7.2**
- Recommendation: SECONDARY (live "observed now near the stadium"); not an archive.
- Verified: 2026-11-25 — latest KBUF observation and range probes.

### National Weather Service — api.weather.gov active alerts (in use: `nws-alerts`)
- Links: https://www.weather.gov/documentation/services-web-api · `/alerts/active?point=lat,lon`
- Category · Class: weather alerts (US) · 🟢 Official
- Provides: CAP alerts; `/alerts` covers 7 days, full archive at NCEI (docs).
- History · Live · Latency: 7 days · yes · minutes.
- Coverage: US only.
- Technical: REST · GeoJSON · Auth: User-Agent.
- Cost: free. Licensing: open data, any purpose.
- Quality: authoritative.
- Scores: Q ~9 / Cov ~4 / Rel ~7 / Lat ~9 / Hist ~1 / Doc ~8 / DX ~8 / Cost 10 / Lic 10 / Com 10 / RL ~7 / NFL ~6 = **7.4**
- Recommendation: PRIMARY (alerts) — no backup abroad.
- Verified: 2026-11-25 — docs read (registry already verified the endpoint on Nov. 23).

### NOAA NCEI — Access Data Service, `global-hourly` (ISD)
- Links: https://www.ncei.noaa.gov/support/access-data-service-api-user-documentation · https://www.ncei.noaa.gov/products/land-based-station/integrated-surface-database · endpoint `https://www.ncei.noaa.gov/access/services/data/v1?dataset=global-hourly&stations=<USAF+WBAN>&startDate=..&endDate=..&format=csv`
- Category · Class: observed hourly history · 🟢 Official
- Provides: ISD hourly/synoptic reports (wind, gust, temperature, dew point, pressure, present weather, precipitation, snow depth), many coded columns.
- History · Live · Latency: 1901 to present; >35,000 stations (>14,000 active) · no · "updated daily"; NCEI's cloud move may delay updates (page).
- Coverage: global (incl. London, Mexico City, Munich, etc.).
- Technical: REST · CSV/SSV/JSON/NetCDF/PDF · Auth: none (probe worked without a token) · Rate limits: none stated · station id is USAF+WBAN (KBUF = 72528014733).
- Cost: free.
- Licensing: no licence text on the pages read; US government work (inference: public domain under 17 U.S.C. §105 for NOAA-authored data; some foreign-source records may carry WMO Resolution 40 restrictions — UNVERIFIED).
- Quality: raw coded fields need decoding; the ADS docs page does not list `global-hourly`, but it works.
- Scores: Q ~8 / Cov ~9 / Rel ~6 / Lat ~3 / Hist ~10 / Doc ~6 / DX ~6 / Cost 10 / Lic 10 / Com 10 / RL ~6 / NFL ~7 = **7.6**
- Recommendation: SECONDARY (international venues' history; authoritative archive behind IEM).
- Verified: 2026-11-25 — probe HTTP 200, CSV header for KBUF 2026-01-04; docs and product page read.

### NOAA NCEI — GHCNh (Global Historical Climatology Network hourly)
- Links: https://www.ncei.noaa.gov/products/global-historical-climatology-network-hourly · bulk https://www.ncei.noaa.gov/oa/global-historical-climatology-network/index.html#hourly/ · docs PDF `.../hourly/doc/ghcnh_DOCUMENTATION.pdf`
- Category · Class: observed hourly history · 🟢 Official
- Provides: period-of-record station files with QC flags (Dunn et al. 2016 checks).
- History · Live · Latency: period of record per station (not stated) · no · cadence not stated.
- Coverage: global; ISD sources plus 100+ more.
- Technical: files · PSV/Parquet · Auth: none.
- Cost: free. Licensing: not stated on the page (US government work, inference).
- Quality: page calls it the "next generation" dataset replacing ISD (no date given).
- Scores: Q ~8 / Cov ~9 / Rel ~7 / Lat ~3 / Hist ~10 / Doc ~7 / DX ~5 / Cost 10 / Lic 10 / Com 10 / RL 8 / NFL ~6 = **7.8**
- Recommendation: OPTIONAL now (PSV is parseable without dependencies; Parquet is not); plan migration from ISD when ISD stops.
- Verified: 2026-11-25 — product page read; files not downloaded.

### NOAA NCEI — Climate Data Online Web Services v2
- Links: https://www.ncdc.noaa.gov/cdo-web/webservices/v2 · token at `/cdo-web/token`
- Category · Class: climate data API · 🟢 Official
- Provides: GHCND daily, GSOM, GSOY, PRECIP_15 (examples on the page); not hourly game-time weather.
- History · Live · Latency: long · no.
- Technical: REST · JSON · Auth: free token (`token` header) · Rate limits: 5 requests/second, 10,000/day per token.
- Cost: free (needs a token — an account step; not created).
- Licensing: as NOAA.
- Scores: Q ~7 / Cov ~8 / Rel ~6 / Lat ~2 / Hist ~10 / Doc ~7 / DX ~5 / Cost 10 / Lic 10 / Com 10 / RL 5 / NFL ~3 = **6.9**
- Recommendation: AVOID for this use (daily only; ADS/IEM cover hourly without a token).
- Verified: 2026-11-25 — page read.

### Iowa Environmental Mesonet (Iowa State University) — ASOS/AWOS/METAR archive
- Links: https://mesonet.agron.iastate.edu/request/download.phtml · service `https://mesonet.agron.iastate.edu/cgi-bin/request/asos.py` · terms https://mesonet.agron.iastate.edu/disclaimer.php · GitHub https://github.com/akrherz/iem
- Category · Class: observed hourly history (METAR) · 🔵 Public/open data
- Provides: per-report temperature, wind (knots), direction, gust, visibility, weather codes, METAR text; sources Unidata IDD, NCEI ISD, MADIS 1-minute ASOS (page).
- History · Live · Latency: decades (station dependent) · near-live · minutes.
- Coverage: global METAR network (non-US precipitation unavailable — page).
- Technical: REST/CGI · CSV · Auth: none · Rate limits: no per-minute figure; aggregate request limit "1,000 station years" (page).
- Cost: free.
- Licensing: public domain: "may be used freely by anyone for any lawful purpose" · attribution requested to IEM / Iowa State · no warranty.
- Quality: routine METARs at :54; KBUF season 2025 (Sept–Jan) = 3,042 rows, 200 KB in one call. nfldata vs KBUF at kickoff (9 Bills home games, 2025): temperature mean −0.9 °F (mean abs 2.0), wind mean −2.2 mph (mean abs 3.3) — the airport is 19 km away and windier.
- Scores: Q ~8 / Cov ~8 / Rel ~8 / Lat ~8 / Hist ~10 / Doc ~7 / DX ~9 / Cost 10 / Lic 10 / Com ~9 / RL ~7 / NFL ~8 = **8.5**
- Recommendation: PRIMARY (observed game-time conditions near each stadium, all seasons) — label "airport observation N km away".
- Verified: 2026-11-25 — disclaimer and download page read; probe HTTP 200 (KBUF 2025-09-01..2026-01-06).

### Meteostat — bulk data and JSON API
- Links: https://meteostat.net · https://dev.meteostat.net · licence https://dev.meteostat.net/license · terms https://dev.meteostat.net/terms.html · https://github.com/meteostat/meteostat-python (MIT) · API pricing https://rapidapi.com/meteostat/api/meteostat/pricing
- Category · Class: observed history (aggregated) · 🔵 Public/open data
- Provides: hourly station data (temperature, wind, gust, precipitation, pressure, condition), bulk files without a key.
- History · Live · Latency: decades · no · bulk "not versioned"; column removal/rename with 90 days' notice [helper].
- Coverage: global.
- Technical: files (parquet/CSV) and JSON API via RapidAPI · Auth: none (bulk) / `X-RapidAPI-Key` · Rate limits: Basic 500 requests/month hard limit, 3/s [helper].
- Cost: bulk free · RapidAPI Basic $0; Pro $9.99 (10,000/month); Ultra $29.99; Mega $99.99 [helper, from embedded page JSON] · est.: $0.
- Licensing: **CC BY 4.0**, usable "even commercially" (licence page read) · attribution: Meteostat plus the original providers (e.g. "Source: Meteostat, Deutscher Wetterdienst") · indicate changes · data from providers via the Python library may carry the providers' own terms.
- Quality: **leakage risk** — by default fills missing observations with model data that "may include weather forecasts"; an opt-out exists [helper]. Disable model fill for backtests.
- Scores: Q ~7 / Cov ~9 / Rel ~7 / Lat ~4 / Hist ~10 / Doc ~8 / DX ~7 / Cost 9 / Lic 9 / Com 8 / RL ~7 / NFL ~7 = **7.7**
- Recommendation: SECONDARY (history backfill, especially abroad) with model fill off.
- Verified: 2026-11-25 — licence page read directly; other figures from helper (read same day).

### Visual Crossing — Timeline Weather API
- Links: https://www.visualcrossing.com · /weather-data-editions/ · /weather-data-pricing/ · terms /weather-services-terms/
- Category · Class: forecast + history · 🟡 Licensed/commercial
- Provides: 15-day forecast, "50+ Years of History Data", sub-hourly history on some plans [helper].
- History · Live · Latency: 50+ years · yes · not stated.
- Coverage: global.
- Technical: REST · JSON/CSV · Auth: key (not verified) · 1 concurrent request, 1,000 records per query (free) [helper].
- Cost: free: 1,000 records/day (meta) / table says 30,000 records/month — inconsistent on the page · paid (from the page's JS config, re-check in a browser): Professional US$35/month, Metered US$0.0001/record, Corporate US$150/month, Enterprise contact sales [helper] · est.: $0–35.
- Licensing: commercial: yes on all plans (table) · redistribution: raw data "may never be shared or distributed publicly for download" · storage: may be stored in any database · attribution: "Weather Data Provided by Visual Crossing" on Free/Professional/Metered [helper].
- Scores: Q ~7 / Cov ~10 / Rel ~8 / Lat ~8 / Hist ~9 / Doc ~8 / DX ~8 / Cost 7 / Lic ~6 / Com ~8 / RL 6 / NFL ~7 = **7.7**
- Recommendation: SECONDARY for a commercial product (cheap, storage allowed; do not publish raw downloads).
- Verified: 2026-11-25 [helper] — pages read; prices from JS bundle, treat as likely.

### Tomorrow.io — Weather API
- Links: https://www.tomorrow.io/weather-api/ · https://docs.tomorrow.io/reference/rate-limiting · terms https://www.tomorrow.io/legal/terms-of-service/ ("updated: 28 October 2026")
- Category · Class: forecast · 🟡 Licensed/commercial
- Provides: Free: 5-day forecast, 24 h history; historical up to 20 years (plan unclear) [helper].
- Technical: REST · JSON · Auth: `apikey` · Rate limits (free): 500/day, 25/hour, 3/second — from a search snippet only (UNVERIFIED).
- Cost: free tier as above; Enterprise "Contact us" · est.: n/a.
- Licensing: "Commercial use is strictly prohibited" on self-serve accounts; no storing the unaltered datafeed without an Order; "Powered by Tomorrow.io" [helper].
- Scores: Q ~8 / Cov ~10 / Rel ~8 / Lat ~9 / Hist ~4 / Doc ~8 / DX ~8 / Cost 4 / Lic ~2 / Com ~3 / RL 3 / NFL ~4 = **5.9**
- Recommendation: AVOID (storage ban conflicts with committed snapshots).
- Verified: 2026-11-25 [helper] — terms read; limits UNVERIFIED.

### OpenWeather — One Call 3.0 / History
- Links: https://openweathermap.org/api/one-call-3 · /price · /history · /faq · T&C of sale PDF
- Category · Class: forecast + history · 🟡 Licensed/commercial
- Provides: One Call 3.0 hourly 48 h; data "from January 1st, 1979 till 4 days ahead"; History Bulk US$10 per location from 1979 [helper].
- Technical: REST · JSON · Auth: `appid` · One Call: "First 1,000 API calls per day are FREE", then US$0.0015/call; default cap 2,000/day [helper].
- Cost: plans Startup $40, Developer $180, Professional $470, Expert $1,200/month [helper] · est.: $0 at <1,000 calls/day.
- Licensing: data CC BY-SA 4.0, database ODbL (T&C of sale); attribution obligatory on Free–Professional ("Weather data provided by OpenWeather" + link/logo); commercial use allowed (FAQ) [helper]. Share-alike risk if the stored database is republished (inference).
- Quality: One Call 2.5 "deprecated in June 2024" [helper].
- Scores: Q ~7 / Cov ~10 / Rel ~7 / Lat ~8 / Hist ~9 / Doc ~8 / DX ~8 / Cost 7 / Lic ~5 / Com ~7 / RL 7 / NFL ~6 = **7.4**
- Recommendation: OPTIONAL (backup history 1979+, pay-per-call).
- Verified: 2026-11-25 [helper].

### Weatherbit
- Links: https://www.weatherbit.io/pricing · terms https://www.weatherbit.io/terms ("UPDATED: May 1st, 2025")
- Category · Class: forecast + history · 🟡 Licensed/commercial
- Provides: 240 h hourly (paid); history 5–30 years by plan [helper].
- Technical: REST · JSON · quotas reset 00 UTC.
- Cost: free 50 requests/day, no hourly forecast, CC BY-NC 4.0; Standard $49, Plus $209, Business $495, Enterprise from $995/month [helper].
- Licensing: storage "in any cloud based environment" needs payment; do-follow link on free [helper].
- Scores: Q ~7 / Cov ~10 / Rel ~7 / Lat ~8 / Hist ~7 / Doc ~7 / DX ~7 / Cost 4 / Lic ~3 / Com ~6 / RL 3 / NFL ~4 = **6.1**
- Recommendation: AVOID (expensive for this need).
- Verified: 2026-11-25 [helper].

### WeatherAPI.com
- Links: https://www.weatherapi.com/pricing.aspx · terms https://www.weatherapi.com/terms.aspx
- Category · Class: forecast + history · 🟡 Licensed/commercial
- Provides: Free: 3-day forecast, 1 day of history; Business: history "Since 1 Jan 2010" [helper].
- Technical: REST · JSON · monthly quotas.
- Cost: free 100,000 calls/month; Starter $7, Pro+ $25, Business $65/month [helper].
- Licensing: free plan "free for commercial use"; cache current ≤60 min, forecast ≤24 h, history unrestricted; credit WeatherAPI.com; no reselling [helper].
- Scores: Q ~6 / Cov ~10 / Rel ~7 / Lat ~8 / Hist ~6 / Doc ~7 / DX ~8 / Cost 7 / Lic ~6 / Com ~7 / RL 8 / NFL ~5 = **7.1**
- Recommendation: OPTIONAL (commercial history backup at $65/month).
- Verified: 2026-11-25 [helper].

### Pirate Weather
- Links: https://pirateweather.net · https://docs.pirateweather.net/en/latest/ · https://github.com/Pirate-Weather/pirate-weather-code (AGPL-3.0)
- Category · Class: forecast (NOAA models) · ⚫ Experimental/unstable (one-person service, terms not found)
- Provides: Dark Sky-style API; 48 h hourly (168 with `extend=hourly`); ERA5 history "from 1940 onward" [helper].
- Technical: REST · JSON · Auth: key in path.
- Cost: 10,000 calls/month free; $2/month donation → 20,000 [helper]; other tiers UNVERIFIED.
- Licensing: UNVERIFIED (no terms page found).
- Scores: Q ~6 / Cov ~9 / Rel ~5 / Lat ~8 / Hist ~8 / Doc ~7 / DX ~8 / Cost 8 / Lic ~4 / Com ~3 / RL 5 / NFL ~5 = **6.3**
- Recommendation: AVOID until terms are published.
- Verified: 2026-11-25 [helper]; terms UNVERIFIED.

### Apple — WeatherKit REST API
- Links: https://developer.apple.com/weatherkit/get-started/ · /weatherkit/data-source-attribution/ · Apple Developer Program License Agreement (Attachment 8)
- Category · Class: forecast · 🟡 Licensed/commercial
- Provides: forecasts ~10 days; hourly history from "Aug 1, 2021" [helper].
- Technical: REST · JSON · Auth: JWT via Developer account.
- Cost: Developer Program US$99/year includes 500,000 calls/month; 1M $49.99 … 200M $9,999.99/month [helper].
- Licensing: no caching/storage beyond "temporary and limited"; no derived database; Apple Weather mark + legal link required [helper].
- Scores: Q ~8 / Cov ~10 / Rel ~8 / Lat ~9 / Hist ~4 / Doc ~8 / DX ~6 / Cost 6 / Lic ~2 / Com ~6 / RL 9 / NFL ~4 = **6.7**
- Recommendation: AVOID (storage ban; history only from 2021).
- Verified: 2026-11-25 [helper]. Dark Sky→WeatherKit history UNVERIFIED this session.

### Google Maps Platform — Weather API
- Links: https://developers.google.com/maps/documentation/weather/overview · /policies · pricing https://developers.google.com/maps/billing-and-pricing/pricing · Service Terms §22
- Category · Class: forecast · 🟡 Licensed/commercial
- Provides: hourly forecast up to 240 h; history only 24 h [helper].
- Cost: "Weather Usage" 10,000 free events/month, then US$0.15/1,000 (to 100k) … $0.038 (>5M) [helper].
- Licensing: cache current/hourly 1 h, daily 24 h, history 240 h then delete; "Source: Includes weather data from Google"; no weather app "whose primary purpose is… weather" [helper].
- Scores: Q ~8 / Cov ~9 / Rel ~8 / Lat ~9 / Hist ~1 / Doc ~8 / DX ~7 / Cost 7 / Lic ~2 / Com ~6 / RL 8 / NFL ~4 = **6.4**
- Recommendation: AVOID (no archive; deletion rules).
- Verified: 2026-11-25 [helper].

### AccuWeather — Core Weather API
- Links: https://developer.accuweather.com · terms /documentation/terms-of-use ("Last updated: April 28, 2026")
- Category · Class: forecast · 🟡 Licensed/commercial
- Provides: hourly/daily forecasts; history 6–24 h [helper].
- Cost: 14-day trial (500 calls/day); Starter "$2 per month", 15,000 calls, personal non-commercial; other tiers JS-only (UNVERIFIED) [helper].
- Licensing: cache ≤2 weeks; no archive/database; no commingling with other weather data; logo on every screen; no AI/ML training [helper].
- Scores: Q ~8 / Cov ~10 / Rel ~8 / Lat ~9 / Hist ~1 / Doc ~7 / DX ~6 / Cost 4 / Lic ~1 / Com ~4 / RL 4 / NFL ~3 = **5.4**
- Recommendation: AVOID (commingling and archive bans).
- Verified: 2026-11-25 [helper].

### Meteomatics — Weather API
- Links: https://www.meteomatics.com/en/weather-api/ · /en/pricing/ · /en/gtc/
- Category · Class: forecast + history · 🟡 Licensed/commercial
- Provides: history "back to 1940" (ERA5 + observations) [helper].
- Cost: "Talk to our experts" (contact sales); free basic account UNVERIFIED (page 404) [helper].
- Licensing: UNVERIFIED (terms not in HTML).
- Scores: Q ~9 / Cov ~10 / Rel ~8 / Lat ~9 / Hist ~10 / Doc ~8 / DX ~6 / Cost 2 / Lic ~3 / Com ~7 / RL ~5 / NFL ~5 = **6.8**
- Recommendation: OPTIONAL (enterprise option only).
- Verified: 2026-11-25 [helper]; pricing = contact sales.

### Vaisala Xweather — Weather API (incl. lightning)
- Links: https://www.xweather.com/pricing · /pricing/weather-api-pay-as-you-go · /legal · docs
- Category · Class: forecast, observations archive, lightning · 🟡 Licensed/commercial
- Provides: conditions "January 2004 through today", hourly; lightning endpoints [helper].
- Technical: REST · JSON · Auth: `client_id`/`client_secret` (server-side only).
- Cost: "first 15,000 accesses each month are free"; pay-as-you-go US/Canada $0.0006/access, lightning 10× ($0.006) [helper].
- Licensing: attribution "powered by Vaisala Xweather" with link; storage/redistribution UNVERIFIED (General Conditions not readable) [helper].
- Scores: Q ~8 / Cov ~8 / Rel ~8 / Lat ~9 / Hist ~8 / Doc ~8 / DX ~6 / Cost 7 / Lic ~4 / Com ~7 / RL 6 / NFL ~6 = **7.1**
- Recommendation: OPTIONAL (commercial lightning near a stadium; read terms first).
- Verified: 2026-11-25 [helper].

### UK Met Office — Weather DataHub (site-specific)
- Links: https://datahub.metoffice.gov.uk/pricing/site-specific · /support/faqs
- Category · Class: forecast (global spot) · 🟢 Official
- Provides: hourly 48 h, three-hourly 168 h for ~45,000 sites; observations 48 h [helper].
- Cost: free 360 calls/day; £9–£437/month tiers [helper].
- Licensing: commercial "Yes"; "Powered by Met Office data" [helper].
- Scores: Q ~8 / Cov ~8 / Rel ~8 / Lat ~9 / Hist ~1 / Doc ~7 / DX ~6 / Cost 8 / Lic ~8 / Com ~9 / RL 5 / NFL ~3 = **6.7**
- Recommendation: OPTIONAL (London games cross-check).
- Verified: 2026-11-25 [helper]; requires an account key (not created).

### Bright Sky — DWD open data wrapper
- Links: https://brightsky.dev · https://api.brightsky.dev/openapi.json · GitHub jdemaeyer/brightsky (MIT) · DWD legal notice
- Category · Class: forecast + observations (Germany) · 🔵 Public/open data
- Provides: DWD observations (Germany) and MOSMIX forecasts (world, sparse); history from "January 1st, 2010" [helper].
- Technical: REST · JSON · no key.
- Cost: free. Licensing: DWD CC BY 4.0, source must be acknowledged [helper].
- Scores: Q ~7 / Cov ~3 / Rel ~7 / Lat ~8 / Hist ~7 / Doc ~7 / DX ~9 / Cost 10 / Lic 9 / Com 9 / RL 8 / NFL ~2 = **7.2**
- Recommendation: OPTIONAL (Munich/Berlin games only).
- Verified: 2026-11-25 [helper].

### B. Lightning and radar

### NOAA — GOES-R Geostationary Lightning Mapper (GLM L2 LCFA) on NODD/AWS
- Links: https://registry.opendata.aws/noaa-goes/ · bucket `noaa-goes19` (GOES-East since 2025-04-04), `noaa-goes18` (West)
- Category · Class: lightning (satellite) · 🟢 Official
- Provides: lightning events/groups/flashes every 20 s (file names `s…00000_e…00200`).
- History · Live · Latency: archive in bucket (GOES-16 distribution ended after the 2025 switch) · yes · file created ~20 s after its window (probe).
- Coverage: Americas (GOES-East/West).
- Technical: files · NetCDF-4 (HDF5) · Auth: none · S3 listing works anonymously.
- Cost: free. Licensing: NODD open data; attribution requested for unaltered data; no NOAA endorsement implied.
- Quality: satellite total lightning, ~8 km pixels (judgment: enough for "lightning within ~10 mi", not for exact strike points). Parsing HDF5 without dependencies is impractical.
- Scores: Q ~7 / Cov ~7 / Rel ~8 / Lat ~9 / Hist ~7 / Doc ~6 / DX ~2 / Cost 10 / Lic 10 / Com 10 / RL 9 / NFL ~4 = **7.4**
- Recommendation: OPTIONAL (server-side only, later) — the only open, commercial-safe live lightning feed found.
- Verified: 2026-11-25 — registry page read; S3 listing of `GLM-L2-LCFA/2026/329/22/` HTTP 200.

### Blitzortung.org — community lightning network
- Links: https://www.blitzortung.org/en/cover_your_area.php
- Category · Class: lightning (volunteer) · ⚫ Experimental/unstable
- Provides: raw strike data to participating station owners.
- Licensing: raw data for "all non-commercial purposes" for station owners; access tied to transmitting data (page). No public API terms.
- Scores: Q ~6 / Cov ~8 / Rel ~5 / Lat ~9 / Hist ~3 / Doc ~2 / DX ~3 / Cost 8 / Lic ~1 / Com 1 / RL ~3 / NFL ~3 = **4.3**
- Recommendation: AVOID (no licence for third-party apps).
- Verified: 2026-11-25 — page read.

### Earth Networks (AEM) — Total Lightning Network / Sferic API
- Links: https://www.earthnetworks.com · developer.earthnetworks.com · /pricing-guide/
- Category · Class: lightning · 🟡 Licensed/commercial
- Provides: Sferic API, Data Stream, alerting (page). Part of the AEM "family of brands".
- Cost: no public price (pricing guide not read) — contact sales.
- Scores: Q ~8 / Cov ~8 / Rel ~8 / Lat ~9 / Hist ~5 / Doc ~3 / DX ~3 / Cost ~2 / Lic ~3 / Com ~6 / RL ~5 / NFL ~4 = **5.3**
- Recommendation: OPTIONAL (commercial lightning alternative to Xweather).
- Verified: 2026-11-25 — home page read; terms, pricing UNVERIFIED.

### RainViewer — Weather Maps API
- Links: https://www.rainviewer.com/api.html · `https://api.rainviewer.com/public/weather-maps.json`
- Category · Class: radar tiles · ⚫ Experimental/unstable (free, best effort)
- Provides: past radar frames (2 h), colour schemes; nowcast and satellite listed in metadata.
- History · Live · Latency: 2 h · yes · "refreshed every 5 minutes".
- Coverage: "1200+ radars" in "150+ countries" (page).
- Technical: tiles · PNG · no key.
- Cost: free; "There's no fee or paid tier currently".
- Licensing: "available for personal and educational use only"; attribution with link mandatory; commercial/high-volume case by case; no SLA.
- Quality: probe returned 13 past radar frames, **0 nowcast frames and 0 satellite frames**, although the page describes nowcast frames (contradiction; reduction date UNVERIFIED).
- Scores: Q ~6 / Cov ~8 / Rel ~5 / Lat ~9 / Hist ~1 / Doc ~7 / DX ~9 / Cost 10 / Lic ~3 / Com 2 / RL ~6 / NFL ~4 = **5.8**
- Recommendation: OPTIONAL (non-commercial radar overlay only).
- Verified: 2026-11-25 — API page read; metadata probe HTTP 200.

### Iowa Environmental Mesonet — NEXRAD composite tiles
- Links: https://mesonet.agron.iastate.edu/ogc/ · tile `https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png`
- Category · Class: radar tiles (US) · 🔵 Public/open data
- Provides: CONUS base reflectivity composite; archived composites (time-stamped layers).
- History · Live · Latency: archive for years (time-stamped products; depth not re-checked) · yes · ~5 min.
- Technical: XYZ tiles / WMS · PNG · no key.
- Cost: free. Licensing: public domain per IEM disclaimer; credit requested.
- Scores: Q ~7 / Cov ~5 / Rel ~7 / Lat ~8 / Hist ~8 / Doc ~6 / DX ~8 / Cost 10 / Lic 10 / Com ~9 / RL ~6 / NFL ~4 = **7.3**
- Recommendation: PRIMARY (US radar overlay, commercial-safe); RainViewer abroad.
- Verified: 2026-11-25 — one tile probe HTTP 200 image/png.

### NOAA NCEP — opengeo radar WMS (MRMS base reflectivity)
- Links: `https://opengeo.ncep.noaa.gov/geoserver/conus/conus_bref_qcd/ows?service=wms&request=GetCapabilities`
- Category · Class: radar (US) · 🟢 Official
- Provides: layer `conus_bref_qcd`; capabilities say AccessConstraints "none", Fees "none".
- Technical: WMS · PNG · no key.
- Scores: Q ~8 / Cov ~5 / Rel ~7 / Lat ~9 / Hist ~1 / Doc ~5 / DX ~6 / Cost 10 / Lic 10 / Com 10 / RL ~7 / NFL ~4 = **6.8**
- Recommendation: SECONDARY (official backup to IEM tiles).
- Verified: 2026-11-25 — GetCapabilities HTTP 200.

### C. Historical game-time weather datasets

### nflverse — nfldata `games.csv` (roof, surface, temp, wind, stadium)
- Links: https://github.com/nflverse/nfldata · dictionary `DATASETS.md` · `https://raw.githubusercontent.com/nflverse/nfldata/master/data/games.csv`
- Category · Class: schedule/results with game conditions · 🔵 Public/open data (no licence file; facts)
- Provides: `roof` (outdoors/open/closed/dome — per game, so retractable status is recorded), `surface`, `temp` (°F) and `wind` (mph) "for outdoors and open only", `stadium_id`, `stadium`, `away_rest`, `home_rest`, `gametime` (Eastern), `location` (Home/Neutral).
- History · Live · Latency: 1999 on · no · repo pushed 2026-11-25T22:45Z.
- Coverage (outdoor/open played games with temp and wind): 1999–2021 ≈ 95–100%; **2022: 107/198**; **2023: 158/199**; 2024: 182/187; 2025: 189/193; **2026 to date: 44/114**. Surface filled almost always except 2023 (250/285) and 2026 (174/272).
- Technical: file · CSV (2.19 MB) · Auth: none.
- Cost: free.
- Licensing: no licence file (`license: null` via gh); registry practice: credit nflverse; the source of temp/wind is not documented (UNVERIFIED — likely the official gamebook/PFR).
- Quality (findings): (1) **2025 international games carry the designated home team's own stadium** (e.g. Dublin game as "Acrisure Stadium", Berlin as "Lucas Oil Stadium… closed", São Paulo as "SoFi Stadium… dome"); 2026 neutral games are named correctly but **MCG, Stade de France and Allianz Arena are labelled `dome`** (open-air pitches) and the Tottenham game of week 5 has id `JAX00`. (2) **Buffalo 2026 reuses `BUF00`** for the new stadium; surface mixes `grass` (3) and `a_turf` (3). (3) Houston's 2026 stadium name reverted to "Reliant Stadium". (4) Surface values for 2019–2020 look wrong for several teams (NE/CIN "grass", KC "astroturf", HOU "grass") — inference from widely known installations; verify before use. (5) Values agree with the KBUF airport within ~2 °F / ~3 mph (see IEM).
- Scores: Q ~6 / Cov ~9 / Rel ~8 / Lat ~5 / Hist ~9 / Doc ~7 / DX ~10 / Cost 10 / Lic ~6 / Com ~5 / RL 10 / NFL ~10 = **7.9**
- Recommendation: PRIMARY (observed game conditions and per-game roof status) with the corrections above and a fallback for blanks.
- Verified: 2026-11-25 — `gh api` listing and dictionary; one download; coverage computed locally.

### nflverse — nfldata `airports.csv`
- Links: https://github.com/nflverse/nfldata/blob/master/data/airports.csv
- Category · Class: team home airports · 🔵 Public/open data
- Provides: team, IATA code, lat/lon, `time_zone` as hours relative to Eastern (e.g. ARI −2, DEN −2, LAC −3).
- Quality: **fixed offsets ignore DST** — Arizona is −3 from Eastern while the East is on daylight time (the first ~9 weeks of the season) — use IANA zones instead. New England uses PVD; there is one row per team (no neutral sites).
- Scores: Q ~5 / Cov ~7 / Rel ~8 / Lat ~5 / Hist ~2 / Doc ~4 / DX ~10 / Cost 10 / Lic ~6 / Com ~5 / RL 10 / NFL ~6 = **6.5**
- Recommendation: SECONDARY (team travel origin); replace offsets with IANA zones.
- Verified: 2026-11-25 — file read via gh (849 bytes, 32 rows).

### ThompsonJamesBliss — WeatherData (GitHub)
- Links: https://github.com/ThompsonJamesBliss/WeatherData
- Category · Class: game weather 2000–2020 · 🟠 Unofficial
- Provides: `games_weather.csv` (hourly through each game, Meteostat and **Weather Underground**, distance to station), `stadium_coordinates.csv` with `StadiumAzimuthAngle`.
- History · Live · Latency: 2000–2020 · no · last push 2021-10-06.
- Licensing: **no licence**; Weather Underground data is not redistributable (inference: WU terms bar this; not re-read).
- Quality: azimuth 0 for several outdoor stadiums (Lambeau, Empower, Lumen, Raymond James — possibly placeholders); old Buffalo stadium 302.1°, identical to Hard Rock 302.1° (suspicious).
- Scores: Q ~5 / Cov ~7 / Rel ~3 / Lat ~1 / Hist ~7 / Doc ~6 / DX ~8 / Cost 10 / Lic ~1 / Com 1 / RL 10 / NFL ~6 = **5.4**
- Recommendation: AVOID as data (no licence); use as a cross-check of OSM azimuths only.
- Verified: 2026-11-25 — gh metadata, README and stadium file read.

### NFLWeather.com (USA Today Sports Media Group)
- Links: https://www.nflweather.com · terms https://www.nflweather.com/terms_of_use
- Category · Class: game forecasts and archive (website) · 🔴 Scraping (no API)
- Provides: per-game forecast; season selector 2009–2026.
- Licensing: reuse allowed only with a linked "Forecasts provided by NFLWeather.com"; "You may not modify or create derivative works" without permission; no API or data licence.
- Scores: Q ~6 / Cov ~9 / Rel ~6 / Lat ~7 / Hist ~6 / Doc ~2 / DX ~2 / Cost 10 / Lic ~3 / Com ~2 / RL ~3 / NFL ~8 = **5.3**
- Recommendation: AVOID (no API; derivative-work ban; its archived forecasts are not documented as pre-kickoff).
- Verified: 2026-11-25 — home and terms pages read.

### D. Stadiums and venue geometry

### Wikidata — stadium items (SPARQL)
- Links: https://query.wikidata.org/sparql · https://www.wikidata.org/wiki/Wikidata:Licensing (CC0)
- Category · Class: venue attributes · 🔵 Public/open data (CC0)
- Provides: P625 coordinates, P1083 capacity, P2044 elevation, P765 surface, P1619 opening, P115 home venue.
- Coverage (probe: teams with P118 = NFL and P115 home venue): 43 rows over 35 "teams" (includes three Commanders season items); **0 stadiums have P2044 elevation**; surface often wrong (Lambeau, Soldier Field, M&T Bank, Lincoln Financial as "artificial turf"); Bills' P115 still points to Ralph Wilson Stadium; Chiefs list historic venues (Cotton Bowl, Municipal Stadium) without filtering; new Highmark Stadium Q16251517 has coordinates 42.77297, −78.79219, inception 2026, no capacity.
- Technical: SPARQL · JSON · Auth: User-Agent · a label-only search query returned 502 (timeout) — use `wbsearchentities`.
- Cost: free. Licensing: CC0 (no attribution required).
- Scores: Q ~5 / Cov ~8 / Rel ~7 / Lat ~6 / Hist ~6 / Doc ~8 / DX ~8 / Cost 10 / Lic 10 / Com 10 / RL ~7 / NFL ~5 = **7.5**
- Recommendation: SECONDARY (ids and coordinates; never surface or elevation).
- Verified: 2026-11-25 — SPARQL HTTP 200 (45 KB); `wbsearchentities` and EntityData for Q16251517.

### OpenStreetMap — Overpass API (stadium and pitch polygons)
- Links: https://overpass-api.de · https://www.openstreetmap.org/copyright · https://wiki.openstreetmap.org/wiki/Overpass_API
- Category · Class: venue geometry · 🔵 Public/open data (ODbL)
- Provides: `leisure=pitch` + `sport=american_football` polygons → field long axis; `leisure=stadium`, `surface=*` tags.
- Probe (one query, 700 m around new Highmark): 5 pitches; way 1577454592 (`surface=grass`, centroid 42.77287, −78.79216, 36 nodes) → **minimum-area rectangle long axis 167.6°/347.6°** (158 × 100 m outline, includes run-off; PCA 161°). The old stadium's pitch is no longer mapped.
- History · Live · Latency: current only (history via OSM full-history dumps) · minutes (osm_base 2026-11-25T22:51Z).
- Technical: Overpass QL · JSON · Auth: none · fair use (no numeric limit read).
- Cost: free. Licensing: ODbL — "Provide credit to OpenStreetMap by displaying our attribution notice"; a database derived from OSM (e.g. a venue-azimuth table) must be shared under ODbL if distributed (share-alike).
- Quality: depends on mapper; check against aerial imagery or official diagrams (±5° plausible — judgment).
- Scores: Q ~7 / Cov ~8 / Rel ~6 / Lat ~7 / Hist ~5 / Doc ~8 / DX ~7 / Cost 10 / Lic ~6 / Com ~7 / RL ~4 / NFL ~7 = **6.8**
- Recommendation: PRIMARY (field azimuth, once per venue; store with `source: OSM way id`, ODbL notice).
- Verified: 2026-11-25 — copyright page read; one Overpass query HTTP 200; azimuth computed locally.

### OpenStreetMap Foundation — Nominatim (public instance)
- Links: https://nominatim.openstreetmap.org · policy https://operations.osmfoundation.org/policies/nominatim/
- Category · Class: geocoding · 🔵 Public/open data
- Provides: geocoding (probe "Lambeau Field" → 44.50097, −88.06197, leisure/stadium, licence string ODbL).
- Technical: REST · JSON · Auth: identifying User-Agent · "absolute maximum of 1 request per second"; no client-side autocomplete; cache results [helper read policy].
- Cost: free. Licensing: ODbL; commercial users warned access may change [helper].
- Scores: Q ~7 / Cov ~9 / Rel ~7 / Lat ~8 / Hist ~3 / Doc ~8 / DX ~8 / Cost 10 / Lic ~6 / Com ~3 / RL 2 / NFL ~4 = **6.2**
- Recommendation: SECONDARY (one-off venue lookups, stored).
- Verified: 2026-11-25 — one probe HTTP 200; policy [helper].

### Wikipedia — stadium articles
- Links: https://en.wikipedia.org (footer: "Creative Commons Attribution-ShareAlike 4.0 License")
- Category · Class: venue facts (capacity, surface history, renovations) · 🔵 Public/open data (text CC BY-SA 4.0)
- Provides: narrative surface/roof history, renovation dates; facts are not copyrightable but copied text is share-alike.
- Scores: Q ~6 / Cov ~8 / Rel ~6 / Lat ~6 / Hist ~7 / Doc ~6 / DX ~5 / Cost 10 / Lic ~5 / Com ~6 / RL ~6 / NFL ~6 = **6.4**
- Recommendation: SECONDARY (manual curation with citation; no bulk copying of text).
- Verified: 2026-11-25 — licence footer checked on Lambeau Field page; NFL International Series article read.

### Sports Reference — Pro-Football-Reference stadium pages
- Links: https://www.pro-football-reference.com/stadiums/ · terms https://www.sports-reference.com/termsofuse.html · data use https://www.sports-reference.com/data_use.html
- Category · Class: venue and game facts · 🔴 Scraping (no API)
- Licensing: no "automated means" that affect the site without permission; no competing database; **no use to train or prompt AI models**; reuse of individual-page facts welcomed with credit; custom data ≥ US$5,000.
- Scores: Q ~8 / Cov ~9 / Rel ~8 / Lat ~6 / Hist ~10 / Doc ~5 / DX ~3 / Cost 10 / Lic ~2 / Com ~2 / RL ~2 / NFL ~8 = **6.1**
- Recommendation: AVOID automated use (manual fact check only, credited). The AI clause matters for the project's assistant.
- Verified: 2026-11-25 — both policy pages read.

### Official stadium and club websites
- Category · Class: venue facts · 🟢 Official — authoritative for surface, roof, renovations; terms differ by club (not read for all; registry notes the 49ers' terms only). Use for manual verification with a link; not catalogued for automation. UNVERIFIED per club.

### E. Geocoding, routing, elevation, time zones, airports

### Photon (Komoot public instance)
- Links: https://photon.komoot.io · https://github.com/komoot/photon (Apache-2.0, push 2026-11-23)
- Category · Class: geocoding · 🔵 Public/open data (OSM)
- Limits: none numeric; "Extensive usage will be throttled or completely banned" [helper].
- Scores: Q ~6 / Cov ~9 / Rel ~5 / Lat ~8 / Hist ~3 / Doc ~6 / DX ~8 / Cost 10 / Lic ~6 / Com ~3 / RL ~3 / NFL ~3 = **5.8**
- Recommendation: OPTIONAL (self-host if ever needed).
- Verified: 2026-11-25 [helper].

### Google Maps Platform — Geocoding, Routes, Time Zone, Map Tiles
- Links: https://developers.google.com/maps/billing-and-pricing/pricing · /march-2025 · geocoding/timezone policies
- Category · Class: geo APIs · 🟡 Licensed/commercial
- Cost: since 2025-03-01 the US$200 monthly credit is replaced by per-SKU free caps: Geocoding 10,000/month then $5.00/1,000; Compute Routes Essentials 10,000 then $5.00 (Pro 5,000 / $10; Enterprise 1,000 / $15); Time Zone 10,000 then $5.00; Dynamic Maps 10,000 then $7.00; 2D Map Tiles 100,000 then $0.60 [helper].
- Licensing: geocode lat/lng cacheable "up to 30 consecutive calendar days"; place IDs indefinitely; Google attribution; no storage outside Services for Time Zone [helper].
- Scores: Q ~9 / Cov ~10 / Rel ~9 / Lat ~9 / Hist ~3 / Doc ~9 / DX ~7 / Cost 6 / Lic ~2 / Com ~7 / RL 8 / NFL ~3 = **6.8**
- Recommendation: AVOID (30-day cache conflicts with committed snapshots; not needed for ~45 fixed venues).
- Verified: 2026-11-25 [helper].

### Mapbox — Geocoding v6 and GL JS
- Links: https://docs.mapbox.com/api/search/geocoding/ · https://www.mapbox.com/pricing
- Category · Class: geocoding, maps · 🟡 Licensed/commercial
- Cost: temporary geocoding 100,000/month free then $0.75/1,000; permanent (`permanent=true`) no free tier, $5.00/1,000; 50,000 web map loads free then $5.00/1,000 [helper].
- Licensing: temporary results "are not allowed to be cached" and only with a Mapbox map; GL JS v2+ under Mapbox ToS only [helper].
- Scores: Q ~9 / Cov ~10 / Rel ~9 / Lat ~9 / Hist ~3 / Doc ~9 / DX ~7 / Cost 6 / Lic ~3 / Com ~7 / RL 8 / NFL ~3 = **6.9**
- Recommendation: AVOID (MapLibre + open tiles cover the need).
- Verified: 2026-11-25 [helper].

### HERE — Geocoding & Search (Base plan)
- Links: https://www.here.com/get-started/pricing (403 to WebFetch; figures from its calculator JSON)
- Cost: 30,000 transactions/month free, then US$0.88/1,000 to 5M; "Permanent Geocoding is not included in the Base Plan" [helper]. Storage terms UNVERIFIED.
- Category · Class: geocoding · 🟡 Licensed/commercial
- Scores: Q ~8 / Cov ~10 / Rel ~8 / Lat ~9 / Hist ~3 / Doc ~7 / DX ~6 / Cost 7 / Lic ~4 / Com ~7 / RL 7 / NFL ~3 = **6.6**
- Recommendation: OPTIONAL. Verified: 2026-11-25 [helper].

### TomTom — Search/Routing
- Links: https://docs.tomtom.com/pricing
- Cost: monthly free allowances, "no credit card needed": Geocoding 20K, Routing 20K, Matrix 2.5K, tiles 200K [helper]. Paid prices and storage terms UNVERIFIED.
- Category · Class: geo APIs · 🟡 Licensed/commercial
- Scores: Q ~8 / Cov ~10 / Rel ~8 / Lat ~9 / Hist ~3 / Doc ~7 / DX ~7 / Cost 8 / Lic ~4 / Com ~6 / RL 7 / NFL ~3 = **6.7**
- Recommendation: OPTIONAL. Verified: 2026-11-25 [helper].

### Geoapify
- Links: https://www.geoapify.com/pricing/ · /terms-and-conditions/
- Cost: 3,000 credits/day free (5 req/s), free plan allowed "for commercial websites, apps…including in production"; paid $59–$609/month [helper].
- Licensing: OSM attribution always; Geoapify attribution on free plan [helper]; storage UNVERIFIED.
- Category · Class: geocoding/routing · 🟡 Licensed/commercial (OSM-based)
- Scores: Q ~7 / Cov ~10 / Rel ~7 / Lat ~8 / Hist ~3 / Doc ~7 / DX ~8 / Cost 8 / Lic ~6 / Com ~7 / RL 7 / NFL ~3 = **6.8**
- Recommendation: OPTIONAL (best commercial-friendly free tier). Verified: 2026-11-25 [helper].

### LocationIQ
- Links: https://locationiq.com/pricing
- Cost: 5,000 requests/day free (2/s); "Limited Commercial Use" with link-back; free-plan cache ≤48 h; paid $45–$950/month [helper].
- Category · Class: geocoding · 🟡 Licensed/commercial
- Scores: Q ~7 / Cov ~10 / Rel ~7 / Lat ~8 / Hist ~3 / Doc ~7 / DX ~8 / Cost 8 / Lic ~4 / Com ~6 / RL 7 / NFL ~3 = **6.5**
- Recommendation: AVOID (48 h cache). Verified: 2026-11-25 [helper].

### OSRM — public demo server
- Links: https://github.com/Project-OSRM/osrm-backend/wiki/Demo-server (BSD-2-Clause code)
- Policy: "Do not exceed 1 request per second"; "reasonable, non-commercial use-cases"; no uptime guarantee [helper].
- Category · Class: routing · ⚫ Experimental/unstable (demo)
- Scores: Q ~7 / Cov ~10 / Rel ~4 / Lat ~8 / Hist ~3 / Doc ~6 / DX ~8 / Cost 10 / Lic ~5 / Com 1 / RL 3 / NFL ~3 = **5.7**
- Recommendation: AVOID (driving routes are irrelevant to team charter travel; haversine suffices). Verified: 2026-11-25 [helper].

### FOSSGIS — routing.openstreetmap.de / Valhalla
- Links: https://routing.openstreetmap.de/about.html · https://github.com/valhalla/valhalla (MIT)
- Policy: "One request per second max"; no heavy use; full policy behind bot protection (not bypassed) [helper].
- Category · Class: routing · ⚫ Experimental/unstable
- Scores: Q ~7 / Cov ~10 / Rel ~4 / Lat ~8 / Hist ~3 / Doc ~6 / DX ~7 / Cost 10 / Lic ~5 / Com ~2 / RL 3 / NFL ~3 = **5.7**
- Recommendation: AVOID (as OSRM). Verified: 2026-11-25 [helper].

### HeiGIT — openrouteservice
- Links: https://account.heigit.org/info/plans · /info/tos · https://giscience.github.io/openrouteservice/hosted-api-restrictions
- Cost: Standard "Free to use for everyone": Directions 2,000/day (40/min), Matrix 500/day, Isochrones 500/day, Elevation point 2,000/day [helper].
- Licensing: results CC-BY-SA 4.0; key required; software GPL-3.0 [helper].
- Category · Class: routing · 🔵 Public/open data (hosted)
- Scores: Q ~7 / Cov ~10 / Rel ~6 / Lat ~8 / Hist ~3 / Doc ~8 / DX ~8 / Cost 10 / Lic ~6 / Com ~6 / RL 5 / NFL ~3 = **6.7**
- Recommendation: OPTIONAL (fan travel times, if ever). Verified: 2026-11-25 [helper].

### USGS — Elevation Point Query Service (EPQS)
- Links: https://epqs.nationalmap.gov/v1/docs · `https://epqs.nationalmap.gov/v1/json?x=<lon>&y=<lat>&units=Feet&wkid=4326` · https://www.usgs.gov/information-policies-and-instructions/copyrights-and-credits
- Category · Class: elevation (US) · 🟢 Official
- Provides: 3DEP elevation; helper call near Empower Field → 5,195.04 ft.
- Rate limits: none stated (UNVERIFIED). Licence: "U.S. Public Domain"; credit requested.
- Scores: Q ~9 / Cov ~5 / Rel ~7 / Lat ~8 / Hist ~5 / Doc ~6 / DX ~9 / Cost 10 / Lic 10 / Com 10 / RL ~6 / NFL ~5 = **7.5**
- Recommendation: PRIMARY (one-time altitude for US venues). Verified: 2026-11-25 [helper probe].

### Open-Elevation
- Links: https://open-elevation.com · Jorl17/open-elevation (GPL-2.0, push 2024-04-17)
- Cost: keyless 500 coordinates/month per IP; plans €5.99–€59.99 [helper]. SRTM 250 m on free tier.
- Category · Class: elevation · ⚫ Experimental/unstable
- Scores: Q ~5 / Cov ~10 / Rel ~4 / Lat ~6 / Hist ~5 / Doc ~5 / DX ~8 / Cost 8 / Lic ~7 / Com ~5 / RL 2 / NFL ~3 = **5.7**
- Recommendation: AVOID (Open-Meteo/USGS better). Verified: 2026-11-25 [helper].

### timezone-boundary-builder (evansiroky)
- Links: https://github.com/evansiroky/timezone-boundary-builder
- Provides: IANA zone polygons; release 2026f (2026-11-01). Code MIT; output data ODbL [helper].
- Category · Class: time zones · 🔵 Public/open data
- Scores: Q ~9 / Cov ~10 / Rel ~9 / Lat ~7 / Hist ~7 / Doc ~8 / DX ~5 / Cost 10 / Lic ~7 / Com ~8 / RL 10 / NFL ~4 = **7.8**
- Recommendation: OPTIONAL (overkill: ~45 fixed venues can store their zone). Verified: 2026-11-25 [helper].

### TimeZoneDB
- Links: https://timezonedb.com/api · /premium
- Cost: free key, 1 request/second, "free for personal and non-commercial usage"; premium $5/month [helper].
- Category · Class: time zones · 🟡 Licensed/commercial
- Scores: Q ~7 / Cov ~10 / Rel ~6 / Lat ~8 / Hist ~5 / Doc ~6 / DX ~8 / Cost 8 / Lic ~5 / Com ~4 / RL 4 / NFL ~3 = **6.2**
- Recommendation: AVOID (not needed). Verified: 2026-11-25 [helper].

### IANA tz database + Node `Intl` (and Open-Meteo `timezone=auto`)
- Links: https://data.iana.org/time-zones/tz-link.html · https://nodejs.org/docs/latest-v18.x/api/intl.html
- Provides: "The public-domain time zone database"; Node official binaries use full ICU, so `Intl.DateTimeFormat({timeZone})` handles DST [helper]. Open-Meteo `timezone=auto` returned the zone for every venue in one call (this track): e.g. Lucas Oil → America/Indiana/Indianapolis, State Farm → America/Phoenix, Ford Field → America/Detroit, Estadio Banorte → America/Mexico_City.
- Category · Class: time zones · 🔵 Public/open data
- Scores: Q ~10 / Cov ~10 / Rel ~10 / Lat ~10 / Hist ~10 / Doc ~9 / DX ~10 / Cost 10 / Lic 10 / Com 10 / RL 10 / NFL ~7 = **9.7**
- Recommendation: PRIMARY (store each venue's IANA zone in `shared/teams.json`; compute offsets per kickoff).
- Verified: 2026-11-25 — Open-Meteo call (this track); Node check [helper].

### OurAirports
- Links: https://ourairports.com/data/ (TLS certificate expired on 2026-11-25 — not bypassed) · https://github.com/davidmegginson/ourairports-data (Unlicense)
- Provides: airports.csv (12.8 MB; ident, type, lat/lon, elevation, ICAO/IATA/GPS codes), runways, etc.; mirror "updated daily" (Last-Modified 2026-11-25 02:53 GMT).
- Category · Class: airports/stations · 🔵 Public/open data (public domain)
- Scores: Q ~7 / Cov ~10 / Rel ~8 / Lat ~7 / Hist ~4 / Doc ~7 / DX ~9 / Cost 10 / Lic 10 / Com 10 / RL 10 / NFL ~6 = **8.2**
- Recommendation: PRIMARY (nearest-station table and travel origins; filter to stations with ASOS/METAR via IEM).
- Verified: 2026-11-25 — one download of the GitHub mirror (HTTP 200); licence [helper].

### F. Maps and boundaries

### OpenStreetMap Foundation — tile.openstreetmap.org
- Links: https://operations.osmfoundation.org/policies/tiles/
- Policy: clear attribution; valid User-Agent and Referer; cache ≥7 days; no bulk/pre-fetch; "Offline use is not permitted"; commercial access "may be withdrawn at any point" [helper].
- Category · Class: map tiles · 🔵 Public/open data (donated service)
- Scores: Q ~8 / Cov ~10 / Rel ~6 / Lat ~9 / Hist ~3 / Doc ~8 / DX ~9 / Cost 10 / Lic ~6 / Com 2 / RL ~4 / NFL ~3 = **6.5**
- Recommendation: AVOID for a product (fine for a prototype). Verified: 2026-11-25 [helper].

### Protomaps — PMTiles basemap (self-hosted)
- Links: https://docs.protomaps.com/basemaps/downloads · /deploy/ · /pmtiles/cloud-storage
- Provides: single-file vector basemap; planet ~120 GB (z0–15); area extracts via `pmtiles extract`; host needs HTTP Range + CORS (GitHub Pages "up to 1 GB") [helper].
- Licensing: PMTiles code BSD-3, spec CC0; basemap data "ODbL Produced Work (OpenStreetMap attribution required)" [helper].
- Category · Class: map tiles · 🔵 Public/open data
- Scores: Q ~8 / Cov ~10 / Rel ~9 / Lat ~9 / Hist ~3 / Doc ~8 / DX ~6 / Cost 10 / Lic ~7 / Com ~9 / RL 10 / NFL ~4 = **7.8**
- Recommendation: SECONDARY (if a street-level map is ever wanted; the claude.ai static page may not serve range requests — UNVERIFIED).
- Verified: 2026-11-25 [helper].

### MapLibre GL JS
- Links: https://github.com/maplibre/maplibre-gl-js (BSD-3; v6.19.0, 2026-11-17) [helper]
- Category · Class: map SDK · 🔵 Public/open data (open source)
- Scores: Q ~9 / Cov ~10 / Rel ~9 / Lat ~10 / Hist ~5 / Doc ~9 / DX ~6 / Cost 10 / Lic 10 / Com 10 / RL 10 / NFL ~4 = **8.5**
- Recommendation: OPTIONAL (a dependency; the current hand-drawn Natural Earth map needs none). Verified: 2026-11-25 [helper].

### Stadia Maps
- Links: https://stadiamaps.com/pricing/
- Cost: free 200,000 credits/month, "Commercial use not allowed"; Starter $20, Standard $80, Professional $250 [helper].
- Category · Class: map tiles · 🟡 Licensed/commercial
- Scores: Q ~8 / Cov ~10 / Rel ~8 / Lat ~9 / Hist ~3 / Doc ~8 / DX ~8 / Cost 7 / Lic ~5 / Com ~5 / RL 7 / NFL ~3 = **6.8**
- Recommendation: OPTIONAL. Verified: 2026-11-25 [helper].

### MapTiler Cloud
- Links: https://www.maptiler.com/cloud/pricing/
- Cost: free 5k sessions and 100k requests/month, "personal, or non-commercial use", logo required; Flex $30/month [helper].
- Category · Class: map tiles · 🟡 Licensed/commercial
- Scores: Q ~8 / Cov ~10 / Rel ~8 / Lat ~9 / Hist ~3 / Doc ~8 / DX ~8 / Cost 7 / Lic ~5 / Com ~5 / RL 6 / NFL ~3 = **6.7**
- Recommendation: OPTIONAL. Verified: 2026-11-25 [helper].

### Natural Earth (in use for the map)
- Links: https://www.naturalearthdata.com/about/terms-of-use/
- Licensing: "All versions … are in the public domain"; credit "unnecessary" [helper].
- Category · Class: boundaries · 🔵 Public/open data
- Scores: Q ~7 / Cov ~10 / Rel ~10 / Lat ~5 / Hist ~5 / Doc ~7 / DX ~9 / Cost 10 / Lic 10 / Com 10 / RL 10 / NFL ~5 = **8.2**
- Recommendation: PRIMARY (keep). Verified: 2026-11-25 [helper].

### US Census Bureau — cartographic boundary files
- Links: https://www.census.gov/geographies/mapping-files/time-series/geo/cartographic-boundary.html
- Provides: 1:500k/5M/20M shapefile, GDB, KML, GeoPackage; vintage 2025 [helper]. Public-domain status not stated on page (inference from 17 U.S.C. §105).
- Category · Class: boundaries (US) · 🟢 Official
- Scores: Q ~9 / Cov ~5 / Rel ~9 / Lat ~5 / Hist ~8 / Doc ~7 / DX ~6 / Cost 10 / Lic 10 / Com 10 / RL 10 / NFL ~4 = **7.8**
- Recommendation: SECONDARY (state/county detail if needed). Verified: 2026-11-25 [helper].

### G. Flight tracking

### OpenSky Network — REST API
- Links: https://openskynetwork.github.io/opensky-api/ (terms page returned 403)
- Terms (docs): "research and non-commerical purposes"; OAuth2 client credentials; daily credits 400 anonymous / 4,000 standard; may block cloud providers [helper].
- Category · Class: ADS-B positions · 🔵 Public/open data (research)
- Scores: Q ~7 / Cov ~7 / Rel ~6 / Lat ~8 / Hist ~6 / Doc ~7 / DX ~5 / Cost 8 / Lic ~2 / Com 1 / RL 4 / NFL ~1 = **5.2**
- Recommendation: AVOID (see below). Verified: 2026-11-25 [helper]; terms UNVERIFIED (403).

### ADS-B Exchange (JETNET)
- Links: https://www.adsbexchange.com/data-products/ · https://www.jetnet.com/products/adsb-exchange
- Cost: community API $10/month via RapidAPI, 10,000 requests, "built for non-commercial use"; enterprise by demo [helper]. Acquisition date UNVERIFIED.
- Category · Class: ADS-B positions · 🟡 Licensed/commercial
- Scores: Q ~7 / Cov ~8 / Rel ~7 / Lat ~9 / Hist ~6 / Doc ~5 / DX ~5 / Cost 6 / Lic ~2 / Com ~2 / RL 4 / NFL ~1 = **5.2**
- Recommendation: AVOID. Tracking named team charters defeats the FAA's LADD/PIA owner privacy programs (FAA pages read [helper]), exposes movements of identifiable people, and adds safety and league-relations risk, against the project's privacy rules. Schedule-based travel metrics give the analytic value without aircraft data.
- Verified: 2026-11-25 [helper].

### H. Algorithms

### NOAA Global Monitoring Laboratory — solar position algorithm (Meeus)
- Links: https://gml.noaa.gov/grad/solcalc/calcdetails.html
- Provides: equations behind NOAA's solar calculator (from Meeus, *Astronomical Algorithms*); spreadsheets valid 1901–2099; sunrise/sunset "accurate to within a minute" between ±72° latitude; "for research and recreational use only"; no longer maintained.
- Category · Class: algorithm · 🟢 Official
- Scores: Q ~9 / Cov ~10 / Rel ~10 / Lat ~10 / Hist ~10 / Doc ~7 / DX ~9 / Cost 10 / Lic ~8 / Com ~9 / RL 10 / NFL ~5 = **8.9**
- Recommendation: PRIMARY (implement in ~40 lines; formulas in §5; this track's Python check gave Buffalo 2026-12-27 16:25 EST: elevation 2.7°, azimuth 234°).
- Verified: 2026-11-25 — page read; implementation tested locally.

### I. Recommended mapping: stadium → coordinates → station → forecast → observed

1. **Venue record (once, with provenance)** in `shared/teams.json` (orchestrator-owned): coordinates (Wikidata id + OSM way id), `roof`, field azimuth (OSM, ODbL notice), elevation (USGS EPQS for US; Open-Meteo abroad), IANA zone, nearest observing stations (ICAO, distance, bearing). Add every neutral venue used since 2025 (today only Estadio Banorte, Tottenham and Wembley are listed; missing: Melbourne Cricket Ground, Maracanã, Stade de France, Bernabéu, Allianz Arena, plus Croke Park, Olympiastadion Berlin and Arena Corinthians for 2025 history). Correct Buffalo to the new stadium (42.77297, −78.79219 per Wikidata; OSM pitch centroid 42.77287, −78.79216).
2. **Station choice rule:** nearest METAR/ASOS station ≤ 25 km with similar exposure (same side of a large lake or sea front, similar elevation), else the nearest major airport, and always store the distance. Prefer a station that reports every hour (check IEM row count). Nearest medium/large airport with an ICAO code (OurAirports, haversine; computed here):

| Venue | Roof | Nearest (km) | Next (km) | Note |
|---|---|---|---|---|
| Highmark (old and new) | open | KBUF 19 | KIAG 39 | far; lake-effect gradients |
| Hard Rock | open | KHWO 5 | KOPF 7 | |
| Gillette | open | KOWD 13 | KBOS 37 | |
| MetLife | open | KTEB 4 | KEWR 16 | |
| M&T Bank | open | KBWI 12 | KMTN 19 | |
| Paycor | open | KLUK 8 | KCVG 14 | |
| Huntington Bank Field | open | KBKL 2 | KCLE 16 | lakefront, good match |
| Acrisure | open | KAGC 13 | KPIT 19 | |
| NRG | retractable | KHOU 14 | KSGR 25 | |
| Lucas Oil | retractable | KIND 12 | KBAK 60 | |
| EverBank | open | KNIP 11 | KCRG 12 | |
| Nissan | open | KBNA 10 | KMQY 29 | |
| Empower Field | open | KBJC 20 | KBKF 23 | KDEN farther; check altitude difference |
| Arrowhead | open | KMKC 13 | KMCI 34 | |
| AT&T | retractable | KDFW 17 | KDAL 26 | |
| Lincoln Financial | open | KPHL 7 | KPNE 24 | |
| Northwest Stadium | open | KADW 11 | KDCA 16 | |
| Soldier Field | open | KMDW 14 | KORD 27 | lakefront venue, inland stations |
| Lambeau | open | KGRB 6 | KATW 45 | |
| Mercedes-Benz | retractable | KFTY 12 | KATL 13 | |
| Bank of America | open | KCLT 8 | KJQF 22 | |
| Raymond James | open | KTPA 3 | KMCF 14 | |
| State Farm | retractable | KLUF 11 | KPHX 26 | |
| Levi's | open | KSJC 6 | KNUQ 7 | |
| Lumen | open | KBFI 8 | KSEA 17 | |
| Estadio Banorte | open | MMMX 17 | MMTO 44 | 2,245 m venue |
| Tottenham / Wembley | open (roofed stands) | EGLC 14 / EGWU 10 | EGWU 25 / EGLL 16 | |

Domes and SoFi (fixed roof) need no station. Ford Field's nearest is CYQG (Windsor, Canada) — irrelevant (dome) but shows why a country/sanity filter is needed. International venues not yet in `teams.json` (MCG → YMEN, Maracanã → SBRJ, Stade de France → LFPB, Bernabéu → LEMD, Allianz Arena → EDDM, Olympiastadion → EDDB, Croke Park → EIDW, Arena Corinthians → SBGR) were located from approximate coordinates typed from memory, NOT verified — re-derive from Wikidata/OSM before use.
3. **Forecast** (pre-game): Open-Meteo hourly at the venue grid cell (+ NWS hourly as US cross-check); freeze the value with `retrievedAt` and the model run if known.
4. **Observed** (post-game): nfldata `temp`/`wind` (gamebook-like, at the stadium) → else IEM ASOS at the chosen station (label distance) → else Open-Meteo Historical Forecast (≥2017/2021) or ERA5 (any year), each labelled by kind.
5. **Retractable roofs:** nfldata `roof` per game (`open`/`closed`) is the only per-game source found; it is blank before kickoff (2026 has 17 blanks for future games). No official pre-game roof feed found (UNVERIFIED that none exists; clubs announce on social media — not machine-readable). Until known, show "roof status unknown" and do not apply outdoor weather.

**Leakage-free historical weather.** Kinds and allowed uses:
- *Forecast-at-decision-time* (allowed as a pre-game feature): Open-Meteo Previous Runs `_previous_dayN` (2024+, GFS temperature 2021+); Single Runs (ECMWF 2024-03-14+, others 2026-04-02+); our own frozen fabric snapshots (from Nov. 2026). Choose N so that the run was published before the decision time (run start + 4–6 h publication delay ≤ decision time).
- *Near-observed / observed* (allowed only for post-game explanation, or as a stand-in for "perfect forecast" in an explicitly labelled upper-bound experiment): nfldata temp/wind, IEM/NCEI observations, Open-Meteo Historical Forecast (first hours of each run), ERA5.
- *Market proxy*: the total and spread at a frozen time already embed public weather forecasts — the cleanest pre-2024 pre-game "weather" input is the line itself (the project already uses lines).
- Never take a game-hour value from a source updated after kickoff and feed it to a pre-game model; store `kind` (`forecast|observed|reanalysis|model-analysis`) and `issuedAt` on every weather record.

## R6. Injuries, rosters, depth charts, transactions, contracts

Evidence file: [tracks/R6-injuries-rosters-transactions.md](tracks/R6-injuries-rosters-transactions.md) (matrix rows, research log and the track's own notes).

### NFL.com — Official injury report pages
- Links: https://www.nfl.com/injuries/ · docs: none · terms: https://www.nfl.com/legal/terms/ (updated May 16, 2024) · GitHub: none
- Category · Class: injuries (practice and game status) · 🟢 Official
- Provides: per game, per team: player, position, injury (body part), practice status (Full / Limited / Did Not Participate), game status (Questionable / Doubtful / Out, blank if none); "No Injuries Reported" per team
- History · Live · Latency: season navigation back to 1965 shown on the page (depth of real data not checked) · near-live during report days · no timestamps on the page; publication time per report UNVERIFIED (secondary sources say 4 p.m. ET)
- Coverage: all 32 teams, every game of the week (week 12 page, read 2026-11-25, lists games from Wed Nov 25 to Mon Nov 30)
- Technical: HTML (server-rendered) · URL patterns seen in search results: `/injuries/league/<season>/<REGn>` · SDK: none · Auth: none · Rate limits: none published · Pagination/Webhooks: none
- Cost: free: yes · free tier: n/a · paid: n/a · est. monthly for a small app: $0, but not licensed (see below)
- Licensing: commercial: needs "express prior written consent" · redistribution: §1.3 "Systematic retrieval of data ... to create ... a collection ... is prohibited" without written consent · caching/storage: same clause · attribution: n/a · other restrictions: §(f) bars robots harvesting "for any commercial purpose". Linking: only the home page may be linked without permission ("For any other type of link ... you must obtain our express written permission")
- Quality: accuracy authoritative (league publishes the clubs' filings) · completeness high · reliability high · notes: robots.txt does not disallow `/injuries` or `/transactions`, but robots.txt is not a licence
- Scores: Q 9 / Cov 9 / Rel ~8 / Lat ~8 / Hist ~6 / Doc 3 / DX 3 / Cost 10 / Lic 2 / Com 1 / RL ~5 / NFL 10 = **6.2**
- Recommendation: AVOID for automated ingest (terms) — use as the human reference truth and as the "official" column in a manual latency audit; the owner could ask the NFL (Legal Department, 345 Park Ave) for permission
- Verified: 2026-11-25 — page structure read (WebFetch); terms read in full (curl); robots.txt read

### NFL.com — League transactions pages
- Links: https://www.nfl.com/transactions/ · categories `/transactions/league/{trades|signings|reserve-list|waivers|terminations|other}/<year>/<month>` · terms as above
- Category · Class: transactions · 🟢 Official
- Provides: From team, To team, Date (MM/DD only, no time), Name, Position (blank in every row seen), Transaction type. Types seen 2026-11-25 (Nov, Sep and Mar 2026 first pages): Traded; Free Agent Signing; Unrestricted Free Agent Signing; Exclusive Rights Signing; Practice Squad; Practice Squad Veteran; Reserve/Injured; Reserve/Suspended By Commissioner-Less than One Year; Terminated Via Waivers, all contracts; Waived, No Recall; Assigned via Waivers (claims); Terminated, Vested Veteran (incl. Post-June 1 Designation); Exempt/Commissioner Permission; Suspension Lifted by Commissioner
- History · Live · Latency: year selector back to 1965 · same-day entries present (ten 11/25 signings and two 11/25 reserve moves at 22:50 UTC) · date granularity only
- Coverage: league-wide. Not seen in sampled pages: practice-squad elevations, extensions, restructures, franchise tags, retirements (UNVERIFIED whether listed at all)
- Technical: HTML table · SDK: none · Auth: none · Rate limits: none published · Pagination: 25 rows a page with an opaque `?after=` cursor
- Cost: free · est. monthly: $0 (not licensed)
- Licensing: same NFL.com terms (§1.3 systematic retrieval prohibited; deep links need permission)
- Quality: authoritative; position column empty; no player ids (names only), so identity must be resolved
- Scores: Q 8 / Cov 8 / Rel ~8 / Lat ~7 / Hist 9 / Doc 2 / DX 4 / Cost 10 / Lic 2 / Com 1 / RL ~5 / NFL 9 = **6.1**
- Recommendation: AVOID for automated ingest; manual verification reference only
- Verified: 2026-11-25 — fetched 1 landing page + 11 category pages (curl, 1 s apart); parsed columns and types

### NFL — Injury-report policy and roster rules (operations.nfl.com, NFL.com rules articles)
- Links: https://www.nfl.com/news/competition-committee-approves-revisions-to-injury-report-0ap3000000688693 · https://www.nfl.com/news/nfl-training-camp-roster-faqs-defining-injured-reserve-pup-list-nfi-and-more · https://www.nfl.com/news/approved-2024-nfl-season-playing-rules-bylaws-and-resolutions · https://operations.nfl.com/ (rulebook; the 2016 injury-policy page now returns 404)
- Category · Class: rules reference · 🟢 Official
- Provides (what the pages say):
  - Game-status designations: Questionable ("participation in the game is uncertain"), Doubtful (unlikely), Out (will not play). Probable eliminated (2016 revision; the league said about 95% of Probable players played). A player certain to play is left off the game-status report; deactivating an unlisted injured player requires an explanation to the league.
  - Practice report: Did Not Participate; Limited (less than 100% of normal reps); Full (100%). "Out" removed from the practice report.
  - Days and deadlines: **not stated on any primary page read**. Secondary sources (WFAA, Splash Sports, Pro Football Network) say: Sunday game: practice reports Wed–Fri, game status Friday by 4 p.m. ET; Thursday game: Mon–Wed reports, status Wednesday; Saturday game: status Thursday; Monday game: status Saturday. UNVERIFIED against a primary text.
  - Reserve/Injured, designated to return: 8 designations per club per regular season; at least 4 games on the list (NFL.com FAQ, 2022 rules). 2024 bylaw (NFL.com): up to two players placed on a reserve list on final-cutdown day may be designated, counting against the total. 21-day practice window and 2 extra postseason designations: Pro Football Rumors 2024-06-20 citing Tom Pelissero (secondary). Conflict: the NFL.com "approved 2024" list also shows a Detroit amendment for "unlimited" postseason designations.
  - PUP: Active/PUP (camp) vs Reserve/PUP (must miss at least the first 4 games). NFI: similar 4-game rule; pay negotiable. Commissioner Exempt list: only the Commissioner places players; exempt from roster limits. Reserve/Suspended: not counted, no base salary (2022 FAQ).
  - Practice squad 16 (+1 international exemption); standard elevations up to 2 per game (2022 FAQ); 2024 bylaw allows unlimited elevations of a bona fide QB as Emergency Third Quarterback.
  - Game-day inactives about 90 minutes before kickoff: UNVERIFIED (no primary text found; search budget exhausted).
- History · Live · Latency: rule texts by season · n/a · n/a
- Coverage: league rules; 2025–2026 changes UNVERIFIED (no NFL.com article for 2025/2026 IR or injury-report changes found)
- Technical: HTML articles · Auth: none
- Cost: free
- Licensing: facts may be restated in our own words; NFL.com terms apply to the pages
- Quality: authoritative but scattered; article dates are blank on several NFL.com pages
- Scores: Q 7 / Cov 5 / Rel 8 / Lat ~5 / Hist 5 / Doc 6 / DX 3 / Cost 10 / Lic 5 / Com 5 / RL 8 / NFL 8 = **6.2**
- Recommendation: SECONDARY (reference) — encode rules as versioned constants with source links; re-verify each preseason
- Verified: 2026-11-25 — three NFL.com articles read; operations.nfl.com home and rulebook links listed; 2016 policy URL 404

### NFL Communications — media portal (injury reports, transactions, game-day rosters)
- Links: https://media.nfl.com/football-information · `/news-and-releases/media/injury-reports`, `/transactions`, `/game-day-rosters`
- Category · Class: official media distribution · 🟢 Official (accredited media only)
- Provides: per the navigation, injury reports, transactions and game-day rosters (the actual documents could not be seen)
- History · Live · Latency: UNVERIFIED (login-gated)
- Coverage: league
- Technical: all three pages return **HTTP 401**; sign-in via NFL SSO (`login.nfl.net`); registration form for media
- Cost: n/a (accreditation)
- Licensing: not reviewed (gated); do not create an account
- Quality: likely the most authoritative and earliest official distribution (inference)
- Scores: Q 10 / Cov 10 / Rel ~9 / Lat ~9 / Hist ~5 / Doc 2 / DX 1 / Cost ~8 / Lic 1 / Com 1 / RL ~3 / NFL 10 = **5.8**
- Recommendation: AVOID — not available to this project
- Verified: 2026-11-25 — portal page links listed; three section URLs returned 401

### NFL — Shield API (upstream of nflverse injuries and rosters)
- Links: no public documentation. Evidence: `nflverse/nflverse-rosters` `exec/update-injuries.R` calls `nflapi::nflapi_injuries()`; `R/rosters_shield.R` calls `nflapi::nflapi_roster()`; `nflverse/nflapi` is not public (GitHub 404). Older weekly rosters used the NFL Data Exchange (`https://www.nfl.info/nfldataexchange/...`, HTTP basic auth, defaults user "media").
- Category · Class: official raw feed · 🟢 Official / ⚫ undocumented for third parties
- Provides: injuries and practice reports (2009 on), rosters with status codes, GSIS ids
- Technical: UNVERIFIED (not probed; credentials or tokens would be needed)
- Licensing: no developer programme found; NFL.com terms would apply
- Scores: Q 9 / Cov 9 / Rel ~7 / Lat ~8 / Hist 8 / Doc 1 / DX 2 / Cost ~5 / Lic 1 / Com 1 / RL ~3 / NFL 10 = **5.3**
- Recommendation: AVOID direct use; consume it only through nflverse's published files, with the provenance chain recorded
- Verified: 2026-11-25 — nflverse scripts read via `gh api`; endpoint itself not probed

### NFL clubs — team websites (injury reports, transaction releases, game-notes PDFs with depth charts)
- Links: `https://www.<club domain>/` (e.g. https://www.raiders.com/news/...); game-notes PDFs on `static.clubs.nfl.com`
- Category · Class: injuries, transactions, depth charts · 🟢 Official (club)
- Provides: club press releases for signings, releases, IR moves, elevations; weekly injury-report articles; weekly game-release PDFs that usually include the club's own depth chart (format and timing vary by club; UNVERIFIED per club)
- History · Live · Latency: varies; press releases same day (inference) · yes · minutes to hours (UNVERIFIED)
- Coverage: one club each; formats differ
- Technical: HTML, RSS (`/rss/news`, verified Nov 23–24 by the project), PDF
- Cost: free
- Licensing: per-club terms; the project's registry (checked Nov. 23–24, 2026) found none clearly allowing a site to show headlines with deep links; several bar automated access entirely (BUF, NE, CIN, CLE, TEN, JAX; SF, LAC, LAR)
- Quality: authoritative for that club; the only official depth chart (in PDFs) but unstructured
- Scores: Q 8 / Cov ~7 / Rel ~6 / Lat ~8 / Hist ~4 / Doc 1 / DX 2 / Cost 10 / Lic 2 / Com 1 / RL ~4 / NFL 8 = **5.1**
- Recommendation: AVOID automated; OPTIONAL manual source for curated items (`data/news.json` pattern: own-words summary + link where allowed)
- Verified: 2026-11-25 — relied on the project's Nov. 23–24 terms survey; no club page probed today

### nflverse — injuries (`injuries_<season>.csv`)
- Links: https://github.com/nflverse/nflverse-data/releases/tag/injuries · dictionary https://github.com/nflverse/nflreadr/blob/main/data-raw/dictionary_injuries.csv · licence https://github.com/nflverse/nflverse-data/blob/master/LICENSE.md · builder https://github.com/nflverse/nflverse-rosters (`exec/update-injuries.R`, `.github/workflows/update_injuries.yaml`)
- Category · Class: injuries (weekly report) · 🔵 Public/open data (republished official data)
- Provides: one row per player-week: `season, season_type, game_type, team, week, gsis_id, position, full_name, first_name, last_name, report_primary_injury, report_secondary_injury, report_status, practice_primary_injury, practice_secondary_injury, practice_status` (2026 header). `report_status` ∈ {Out, Doubtful, Questionable, blank}; `practice_status` ∈ {Full / Limited / Did Not Participate In Practice}
- History · Live · Latency: 2009–2026 · no · runs twice a day: a `workflow_dispatch` at about 07:00 UTC plus the `7 7 * 1,2,9-12 *` cron, which GitHub has been starting 7–12 h late (14:03–19:09 UTC, Nov 11–25). So a 4 p.m. ET (21:00 UTC) report appears around 07:00 UTC next morning (about 10 h later; inference from run times). Last release 2026-11-25 17:59 UTC
- Coverage: 2026 file has 3,585 rows, weeks 1–12, 0 duplicate player-weeks, all with `gsis_id`. Week 12 on Wed Nov 25: 104 rows from 10 teams (Thanksgiving-week early reports). Only the **latest** practice status per player-week is kept: the Wed→Thu→Fri sequence is lost unless snapshots are kept. No IR/PUP lists, no inactives, no return dates
- Technical: files (csv, csv.gz, parquet, rds) · SDK: nflreadr (R), nflreadpy (Python) · Auth: none · Rate limits: GitHub release CDN, none published · `timestamp.json` gives `last_updated`
- Cost: free
- Licensing: commercial: CC-BY-4.0 on nflverse's compilation; nflreadr README: NFL data "belong to their respective owners" · redistribution: CC-BY for nflverse's part; underlying NFL rights not granted · attribution: credit nflverse · other: upstream is the NFL API, whose terms bar systematic retrieval (§1.3) — a risk carried by nflverse and by anyone republishing
- Quality: accurate (official upstream); **`date_modified` is documented in the dictionary but missing from the 2026 file** (present in 2024); blank `report_status` rows are practice-only entries
- Scores: Q 8 / Cov 8 / Rel 8 / Lat 5 / Hist 8 / Doc 7 / DX 9 / Cost 10 / Lic ~6 / Com ~4 / RL 9 / NFL 9 = **7.6**
- Recommendation: PRIMARY (public) for official designations and practice status; poll every 6–12 h and keep every version to rebuild daily practice sequences
- Verified: 2026-11-25 — downloaded the 2026 CSV (410 KB) and parsed it; release assets, timestamps, workflow file, script and 30 recent runs read via `gh api`

### nflverse — rosters and weekly rosters (`roster_<season>.csv`, `roster_weekly_<season>.csv`)
- Links: https://github.com/nflverse/nflverse-data/releases/tag/weekly_rosters · .../tag/rosters · dictionaries `dictionary_rosters.csv`, `dictionary_roster_status.csv` (nflreadr data-raw)
- Category · Class: rosters, roster status, id crosswalk · 🔵 Public/open data (republished official data + third-party id map)
- Provides: per player-week: team, position, depth_chart_position, jersey, `status`, `status_description_abbr`, names, bio, ids (`gsis_id, espn_id, sportradar_id, yahoo_id, rotowire_id, pff_id, pfr_id, fantasy_data_id, sleeper_id, esb_id, gsis_it_id, smart_id`), `week`, `game_type`, entry/rookie year, draft club and number
- History · Live · Latency: weekly rosters 2002–2026, season rosters 1920–2026 · no · same twice-daily schedule as injuries (runs at ~07:00 UTC and 14:00–19:00 UTC)
- Coverage: week 12 (2026-11-25): 2,592 rows. `status`: ACT 1,683; DEV (practice squad) 538; RES 319; CUT 26; RET 22; TRT, RLS, TRD, EXE 1 each. Observed status × code pairs: ACT/A01 1,525; ACT/I01 146; ACT/I02 12; DEV/P01 309, P07 123, P06 66, P03 28, P02 12; RES/R01 264, R48 34, R04 14, R05 5, R40 1, R49 1; RET/R02 22; CUT/W03 14; EXE/E02 1. **The meaning of the `status_description_abbr` codes is not documented** (UNVERIFIED; e.g. R48 co-occurs with Sleeper "IR" 22 of 25 times and R04 with Sleeper "PUP" 10 of 10 — consistent with IR-designated-to-return and Reserve/PUP, but that is inference)
- Status dictionary (nflreadr `dictionary_roster_status.csv`): ACT active; EXE Commissioner exempt; DEV practice squad; CUT cut; E14 international exempt; INA inactive (under contract, not active); NWT rarely used, waived; PUP physically unable to perform; RES reserve list; RET retired; RFA cut RFA; RSN non-football injury reserve; RSR released from IR; SUS suspended; TRC/TRD/TRT released from practice squad; TRL unknown 1960s; UFA released UFA
- Technical: files (csv ~10 MB, parquet, rds) · SDK: nflreadr/nflreadpy · Auth: none
- Cost: free
- Licensing: as nflverse injuries. **Extra caveat:** `sleeper_id, rotowire_id, sportradar_id, yahoo_id, fantasy_data_id` are joined from `nflreadr::load_ff_playerids()` (`nflverse-rosters/R/utils_roster_ids.R`), i.e. dynastyprocess `db_playerids` (GPL-3.0)
- Quality: id coverage in week 12: gsis 2,591; esb 2,588; espn 1,964; rotowire 1,964; pfr 1,956; pff 1,911; sleeper 1,835; sportradar 1,835; fantasy_data 1,834; yahoo 1,135. Missing `sleeper_id` by status: ACT 416, DEV 242, RES 83
- Scores: Q 8 / Cov 9 / Rel 8 / Lat 5 / Hist 9 / Doc 6 / DX 9 / Cost 10 / Lic ~6 / Com ~4 / RL 9 / NFL 9 = **7.7**
- Recommendation: PRIMARY (public) for roster status and reserve lists; derive "roster move" events from week-to-week diffs (team or status change) as a delayed transactions proxy
- Verified: 2026-11-25 — downloaded `roster_weekly_2026.csv` (9.6 MB) and parsed; dictionaries and builder code read via `gh api`

### nflverse — depth charts (`depth_charts_<season>.csv`)
- Links: https://github.com/nflverse/nflverse-data/releases/tag/depth_charts · dictionary `dictionary_depth_charts.csv` · builder `nflverse-rosters/exec/update-depth-charts.R` · nflreadr NEWS 1.5.0
- Category · Class: depth charts · 🔵 Public/open data, **derived from ESPN (2025 on)**
- Provides: 2025+ format: `dt` (load time, ISO 8601 UTC), `team, player_name, espn_id, gsis_id, pos_grp_id, pos_grp` (e.g. "3WR 1TE", "Base 4-3 D", "Base 3-4 D", "Special Teams"), `pos_id, pos_name, pos_abb, pos_slot, pos_rank`. 2001–2024 format (NFL Data Exchange, weekly): `season, club_code, week, game_type, depth_team, last_name, first_name, football_name, formation, gsis_id, jersey_number, position, elias_id, depth_position, full_name`
- History · Live · Latency: 2001–2024 weekly; 2025–2026 dated snapshots · no · **twice a day**: in the 2026 file's newest 125,675 rows there are 54 distinct `dt` values over 27 days (about 07:01 UTC and 14:00–19:11 UTC), each covering all 32 teams with about 2,340–2,400 rows
- Coverage: 288 of 2,007 players in the newest snapshot appear in more than one slot; 7 of 2,358 rows lack `gsis_id` (ids mapped from ESPN ids via nflverse-players)
- Measured churn (2026-11-16 → 11-25, consecutive snapshots): median 23 rows added, median 7 teams changed and median 4.5 rank-1 (starter) changes per snapshot; peaks of 105–124 rows on Monday/Tuesday mornings after games; several afternoon snapshots had zero changes
- Technical: CSV about 80 MB for 2026 (rows prepended newest-first, `arrange(desc(dt), team, pos_grp_id, pos_rank)`), csv.gz 16 MB, parquet 3.7 MB · Auth: none
- Cost: free
- Licensing: CC-BY-4.0 on nflverse's work; the content is ESPN's depth chart, collected by `nflverse.espn::espn_depth_charts()` (switch committed 2025-08-03 "use nflverse.espn for depth charts"; nflreadr NEWS: source "had to be changed from NFL Data Exchange to ESPN"). ESPN content falls under the Disney Terms of Use (project registry, DEC-006)
- Quality: ESPN depth charts are editorial, not club-official; slot model differs from the 2001–2024 format, so histories across 2024/2025 are not directly comparable
- Scores: Q ~6 / Cov 9 / Rel 8 / Lat 6 / Hist 9 / Doc 7 / DX 7 / Cost 10 / Lic ~4 / Com ~2 / RL 9 / NFL 9 = **7.2**
- Recommendation: PRIMARY (public) for depth charts today, with an explicit owner decision recorded that it is ESPN-derived; keep every snapshot to build the Depth Chart History (section 5)
- Verified: 2026-11-25 — first 12 MB of the 2026 CSV read and analysed; 2024 and 2025 headers read; builder script and its commit history read via `gh api`

### nflverse — players master (`players.csv`)
- Links: https://github.com/nflverse/nflverse-data/releases/tag/players · dictionary `dictionary_players.csv` · builder https://github.com/nflverse/nflverse-players (internal package)
- Category · Class: player identity · 🔵 Public/open data
- Provides: `gsis_id` (primary key), names, `esb_id, nfl_id, pfr_id, pff_id, otc_id, espn_id, smart_id`, positions (NFL, NGS, PFF), status (NFL, NGS, PFF), latest team, draft, bio. **No `sleeper_id`**
- History · Live · Latency: all eras (24,872 players) · no · nightly (last release 2026-11-25 18:30 UTC)
- Coverage: among 21,131 current-ish rows: espn 13,603; pfr 19,587; otc 8,169; pff 9,564; nfl_id 9,813. For week-12 rostered players: otc_id 2,477 of 2,592; it supplies an ESPN id for 608 of the 628 roster rows without one
- Technical: CSV 7.3 MB, parquet, rds · Auth: none
- Licensing: CC-BY-4.0 (nflverse); `otc_id`/`pff_id` are fetched from OverTheCap (README: `players_otc_release()`), ESPN ids from ESPN; ids are facts, low risk (judgment)
- Quality: duplicate-id validator and manual overrides in nflverse-players
- Scores: Q 8 / Cov 9 / Rel 8 / Lat 6 / Hist 9 / Doc 8 / DX 8 / Cost 10 / Lic ~6 / Com ~4 / RL 9 / NFL 9 = **7.8**
- Recommendation: PRIMARY identity backbone (gsis_id as canonical key)
- Verified: 2026-11-25 — downloaded and parsed; README of nflverse-players read

### nflverse — trades (`trades.csv`, from nflverse/nfldata)
- Links: https://github.com/nflverse/nflverse-data/releases/tag/trades · upstream https://github.com/nflverse/nfldata/blob/master/data/trades.csv (no licence file)
- Category · Class: transactions (trades only) · 🔵 Public/open data (hand-maintained by Lee Sharpe)
- Provides: `trade_id, season, trade_date, gave, received, pick_season, pick_round, pick_number, conditional, pfr_id, pfr_name`
- History · Live · Latency: 2002–2026 (4,975 rows) · no · **stale**: release last updated 2026-05-19; newest `trade_date` 2026-04-17; last upstream commit 2026-04-19. The Nov 10, 2026 deadline trades listed on NFL.com are absent
- Technical: CSV · players keyed by PFR id
- Licensing: release under CC-BY-4.0 (nflverse-data); upstream repository has no licence
- Scores: Q 7 / Cov ~5 / Rel 5 / Lat 2 / Hist 9 / Doc 7 / DX 9 / Cost 10 / Lic ~5 / Com ~4 / RL 9 / NFL 7 = **6.6**
- Recommendation: OPTIONAL — historical trade analysis only; not a current fallback
- Verified: 2026-11-25 — downloaded and parsed; commit history read

### nflverse — contracts (`historical_contracts.*`, from OverTheCap)
- Links: https://github.com/nflverse/nflverse-data/releases/tag/contracts · dictionary `dictionary_contracts.csv` · builder https://github.com/nflverse/rotc (MIT code; `otc_historical_contracts()` scrapes `https://overthecap.com/contract-history/<position>` with httr2/rvest)
- Category · Class: contracts, cap figures · 🔴 Scraping (by nflverse) republished as 🔵
- Provides: player, position, team, is_active, year_signed, years, value, apy, guaranteed, apy_cap_pct, inflated values, OTC player page and `otc_id`, `gsis_id`, bio, draft; nested `season_history` (base salary, prorated/option/roster bonuses, guaranteed salary, cap number, cap percent, cash paid, workout and per-game bonuses) and `contract_history` (contract type incl. Franchise/Transition/UDFA/Practice; status incl. Extended/Terminated/Traded/Renegotiated/June 1 Terminated)
- History · Live · Latency: OTC's contract history (deep) · no · daily cron `0 7 * * *` (release 2026-11-25 18:00 UTC)
- Technical: **only parquet, rds and qs are current; `historical_contracts.csv.gz` was last updated 2022-05-29**. The project's stdlib Python / dependency-free Node stack cannot read parquet or rds, so there is no usable current file without a new dependency
- Licensing: OverTheCap terms (read 2026-11-25): personal informational use only; "Any systematic retrieval ... is prohibited without our express written consent"; no data "provided to any websites ... unless contracted by OTC". No permission statement from OTC to nflverse was found in rotc, nflreadr or nflverse-data
- Scores: Q 8 / Cov 8 / Rel 7 / Lat 6 / Hist 9 / Doc 8 / DX 3 / Cost 10 / Lic 2 / Com 1 / RL 9 / NFL 8 = **6.6**
- Recommendation: AVOID for the public page (owner decision; ask OTC at support@overthecap.com, the licensing contact its terms give); acceptable only for private, local analysis if the owner accepts the risk
- Verified: 2026-11-25 — assets and timestamps listed; rotc DESCRIPTION, workflow and scraper read; OTC terms read in full

### DynastyProcess — `db_playerids.csv` (source of nflverse `load_ff_playerids()`)
- Links: https://github.com/dynastyprocess/data (GPL-3.0) · `files/db_playerids.csv`
- Category · Class: player-id crosswalk (fantasy ids) · 🔵 Public/open data (GPL-3.0)
- Provides: ids across MFL, Sleeper, ESPN, Yahoo, RotoWire, Sportradar, FantasyData, PFR, GSIS and more (archived `database.csv` header shows `gsis_id, pfr_id, mfl_id, sleeper_id, fantasy_data_id, rotowire_id, sportradar_id, rotoworld_id, yahoo_id, ...`)
- History · Live · Latency: current · no · weekly (`cron: 23 0 * * 5`, Fridays 00:23 UTC); built mainly from MyFantasyLeague (`R/player_ids/update_mfl.R`) plus a manual `missing_ids.json`
- Licensing: GPL-3.0 applied to data (copyleft effect on a data file is legally unclear); project rule (GITHUB_RESEARCH.md) is owner decision before use
- Scores: Q 7 / Cov 8 / Rel 7 / Lat 4 / Hist 6 / Doc 5 / DX 8 / Cost 10 / Lic 3 / Com ~3 / RL 9 / NFL 7 = **6.4**
- Recommendation: SECONDARY — already used indirectly through nflverse rosters; record the dependency and the owner's decision
- Verified: 2026-11-25 — repo licence, README, workflow and code search via `gh`

### Sleeper — players database (`/v1/players/nfl`)
- Links: https://docs.sleeper.com/ · endpoint `https://api.sleeper.app/v1/players/nfl` · General Terms https://support.sleeper.com/en/articles/5486620-general-terms-of-use (last updated November 17, 2026)
- Category · Class: rosters, injury status, depth order, ids · 🟠 Unofficial but commonly used (vendor API with conflicting terms)
- Provides: per player (12,229 records; 2,778 with a team): `injury_status, injury_body_part, injury_notes, injury_start_date, practice_participation, practice_description, depth_chart_position, depth_chart_order, status, news_updated` (ms epoch), `team, team_abbr, team_changed_at, active`, ids (`gsis_id, espn_id, sportradar_id, rotowire_id, rotoworld_id, yahoo_id, fantasy_data_id, stats_id, swish_id, oddsjam_id, kalshi_id, opta_id, pandascore_id`), `metadata` (incl. `injury_override_*` keys)
- Population among the 2,778 players with a team (2026-11-25 22:48 UTC): `injury_status` 483 (IR 286, Questionable 139, Out 30, PUP 20, Doubtful 3, COV 2, NA 2, Sus 1); `injury_body_part` 477; `injury_notes` 127 (short, e.g. "Sprain", "Surgery"); **`injury_start_date` 0; `practice_participation` 1; `practice_description` 1; `team_changed_at` 0**; `depth_chart_position` 1,988; `depth_chart_order` 1,514; `status` Active 2,414 / Inactive 331 / Practice Squad 1 (practice-squad players are mostly labelled "Active"); `news_updated` 2,568 (174 within 24 h, newest 13 min before the download)
- History · Live · Latency: current state only · near-live · CDN headers: `cache-control: public, s-maxage=600, stale-while-revalidate=300` (so up to about 10–15 min stale at the edge); `etag` present
- Coverage: whole league plus free agents; not an official designation. On Wed Nov 25 Sleeper shows "Out" for 8 players whose official week-12 report had only "Did Not Participate" and no game status yet; for week 11 official "Out" players it shows Questionable (23), IR (11), Out (5) — i.e. it tracks the player's **current** fantasy-relevant status, mixing official, reported and editorial states
- Technical: REST JSON, about 14.7 MB uncompressed (docs: "average size ... 5MB", probably compressed) · SDK: community wrappers · Auth: none · Rate limits: docs: stay under 1,000 calls a minute; call this endpoint at most once a day · Webhooks: none
- Cost: free (docs: "free to use for non-commercial purposes"; commercial: contact Sleeper)
- Licensing: **conflict**. docs.sleeper.com: read-only, no token, non-commercial use free, credit trending data. General Terms (2026-11-17) §11.1 bars "Access, query, extract, or receive any data ... through any automated means" without consent and any commercial use; §11.3: no third party is authorized to retrieve data "except pursuant to a separate written agreement ... or other approval given by Sleeper". Whether the public developer docs count as that approval is unresolved
- Quality: ids: Sleeper's own `gsis_id` is filled for only 568 of 2,778 team players; where both exist, it agrees with nflverse's Sleeper↔GSIS map 401 of 402 times. RotoWire lists Sleeper among companies using its data (https://www.rotowire.com/partner/), so some injury text may originate there (inference)
- Scores: Q ~6 / Cov 8 / Rel 8 / Lat 8 / Hist 1 / Doc 5 / DX 9 / Cost 10 / Lic 3 / Com 1 / RL 8 / NFL 8 = **6.2**
- Recommendation: SECONDARY (fallback and "reported status" signal) pending the owner's terms decision; label its statuses "Sleeper status", never "official"; do not rely on practice fields (empty)
- Verified: 2026-11-25 — one download (HTTP 200, 14,663,309 bytes, 0.52 s); fields counted; cross-checked against nflverse injuries and weekly rosters; docs and General Terms read

### ESPN — injuries, transactions, depth charts, rosters (JSON; owner's machine only)
- Links: `site.api.espn.com/apis/site/v2/sports/football/nfl/injuries`, `/transactions`; `sports.core.api.espn.com/.../teams/<id>/depthcharts`, `/roster` · terms https://disneytermsofuse.com/english/
- Category · Class: injuries, transactions, depth charts · 🟠 Unofficial / 🔴 when automated (Disney ToU §2.B(x))
- Provides (from the project registry, verified Nov. 21, 2026): injury status, type, return date for all 32 teams; 25 transactions a page; depth charts and rosters with ESPN ids
- History · Live · Latency: current · yes · hours (registry); not re-probed today by design
- Licensing: Disney ToU bars robots, data mining and dataset building; local-only use is an owner decision (DEC-006)
- Quality: the only free source with return dates and a full transaction stream; nflverse depth charts are this same ESPN data
- Scores: Q 8 / Cov 9 / Rel 8 / Lat 8 / Hist 3 / Doc 2 / DX 8 / Cost 10 / Lic 1 / Com 1 / RL ~6 / NFL 9 = **6.1**
- Recommendation: SECONDARY, local server only (as today); AVOID for public or commercial use
- Verified: not re-probed 2026-11-25 (project rule); relies on registry entries of Nov. 21, 2026

### RotoWire — news, injuries, depth charts data feeds
- Links: https://www.rotowire.com/partner/ · terms https://www.rotowire.com/termsandconditions.php (effective September 19, 2026) · llms.txt https://www.rotowire.com/llms.txt
- Category · Class: news, injuries, depth charts, lineups · 🟡 Licensed/commercial
- Provides (partner page): player news on "injuries, transactions, lineup changes", injury data with context, expected/confirmed lineups, depth charts "refreshed ... immediately after every trade", custom player-id mapping
- History · Live · Latency: UNVERIFIED (sales material says "around the clock") · yes · UNVERIFIED
- Coverage: NFL and other leagues; partner list names ESPN, Yahoo Sports, DraftKings, FanDuel, Fox Sports, Underdog, Sleeper, NBA.com, NFL.com, CBS Sports
- Technical: API key required (third-party SDK pages); format UNVERIFIED
- Cost: commercial feeds: contact sales (demo form); no price published. Consumer subscriptions are separate and do not license data
- Licensing: site terms: personal, non-commercial use only; Article VI bars automated access, scraping and unauthorized APIs; Article VII bars AI use. Copyright footer: Grandstand Limited, sub-licensed to Roto Sports Inc. (Nasdaq GRSD)
- Scores: Q ~9 / Cov 9 / Rel ~9 / Lat ~9 / Hist ~6 / Doc ~4 / DX ~6 / Cost 3 / Lic 6 / Com 8 / RL ~7 / NFL 9 = **7.1**
- Recommendation: OPTIONAL now; PRIMARY candidate for news and injury context in a commercial product (licence required). AVOID scraping rotowire.com
- Verified: 2026-11-25 — partner page, terms, llms.txt, robots.txt read via curl; pricing UNVERIFIED (not published)

### NBC Sports — Rotoworld player news
- Links: https://www.nbcsports.com/fantasy/football/player-news (rotoworld.com redirects to https://www.nbcsports.com/fantasy) · terms https://www.nbcsports.com/terms-use
- Category · Class: player news, injury notes · 🟠 Unofficial (editorial)
- Provides: per item: player, team, position, headline (e.g. practice participation), fantasy analysis, writer credit and often a "Source:" link to a reporter's post; filters All / Headline / Injury Recap / Transaction
- History · Live · Latency: recent items · yes · no explicit timestamps in the visible page
- Technical: HTML; no RSS link seen
- Licensing: NBC Sports general terms (project registry): personal, non-commercial use; scrapers that aggregate content and redistribution barred without written permission
- Scores: Q 8 / Cov 8 / Rel 8 / Lat 8 / Hist 4 / Doc 1 / DX 2 / Cost 10 / Lic 1 / Com 1 / RL ~4 / NFL 8 = **5.2**
- Recommendation: AVOID automated; humans may read it to find the reporter's original post
- Verified: 2026-11-25 — redirect checked (curl); page read (WebFetch)

### FantasyPros — API v2 (news, injuries, players)
- Links: https://www.fantasypros.com/api-data/ · base `https://api.fantasypros.com/public/v2/json` · API terms (Oct 27, 2020; read by the project Nov. 25)
- Category · Class: news, injuries, players, projections · 🟡 Licensed (personal key)
- Provides (product page): `GET /{sport}/news` (filter by category, player, recency); `GET /{sport}/injuries` ("injury statuses by season/week, with optional practice-report probabilities"); `GET /{sport}/players` (FantasyPros ids, external-id cross-references). No depth-chart endpoint listed
- History · Live · Latency: UNVERIFIED
- Technical: REST JSON · Auth: `x-api-key` header · Rate limits: project registry: 1 call a second, 100 a day default, 500 on the owner's plan; product page gives no numbers. Docs page `api.fantasypros.com/v2/docs` answered 403 to WebFetch
- Cost: Free "$0 / mo" (non-production); Premium "$8.99 / mo" (personal, non-commercial; bundled with HOF); Commercial "Custom" with redistribution rights
- Licensing: personal, non-commercial; attribution "Data obtained from FantasyPros" (project registry); no third-party access to API materials
- Scores: Q ~7 / Cov ~7 / Rel ~7 / Lat ~6 / Hist ~4 / Doc 5 / DX 7 / Cost 8 / Lic 4 / Com ~5 / RL 4 / NFL 8 = **6.0**
- Recommendation: OPTIONAL — the owner already has a key; test `/nfl/injuries` and `/nfl/news` within the 500-call budget for a second, non-ESPN injury opinion (fields UNVERIFIED)
- Verified: 2026-11-25 — product page read; endpoint fields not tested (no key used by this research)

### SportsDataIO — NFL API (commercial) and Discovery Lab (personal)
- Links: https://sportsdata.io/nfl-api · https://discoverylab.sportsdata.io/personal-use-apis/nfl · terms https://discoverylab.sportsdata.io/terms-of-service · help https://sportsdata.io/help/data-rights-and-licensing-questions
- Category · Class: injuries, rosters, depth charts, news · 🟡 Licensed/commercial
- Provides: commercial NFL API lists Injuries, Rosters & Depth Charts, Player News & Notes, Player Profiles, DFS salaries; transactions and contracts not mentioned on the product page
- Discovery Lab plans (embedded plan JSON on the NFL page, read 2026-11-25): Fantasy $99/month or $599/year (100 API calls a day); Odds $99/month or $599/year (100 a day); Fantasy + Odds $149/month or $899/year (1,000 a day). All include Teams/Stadiums, Rosters, Standings and **Injuries**; "Includes Current Season + Last 3 Years"; player stats "Delivered 6am ET next day". Depth charts not listed. Free tier: last season's rosters, schedules and results
- Commercial prices: not published ("Get In Touch"); free trial data is scrambled per third-party summaries (UNVERIFIED)
- Technical: REST JSON/XML · Auth: key
- Licensing: commercial licence by agreement; Discovery Lab terms page does not state personal-only (marketing says "personal use")
- Scores: Q ~8 / Cov 9 / Rel ~8 / Lat ~8 / Hist 7 / Doc 8 / DX 8 / Cost 4 / Lic 5 / Com 8 / RL 5 / NFL 9 = **7.2**
- Recommendation: OPTIONAL now; SECONDARY commercial candidate (cheaper entry than Sportradar)
- Verified: 2026-11-25 — product page (WebFetch), Discovery Lab HTML and its embedded plan JSON (curl), terms page (curl)

### Sportradar — NFL API v7 (Weekly Injuries, Weekly Depth Charts, Daily Transactions, rosters)
- Links: https://developer.sportradar.com/football/docs/nfl-ig-api-basics · https://developer.sportradar.com/football/docs/nfl-ig-update-frequencies · changelog https://developer.sportradar.com/sportradar-updates/changelog/nfl-api-estimated-injury-return-date
- Category · Class: injuries, depth charts, transactions, rosters · 🟡 Licensed/commercial
- Provides: Weekly Injuries (now with optional `injury.estimated_return_date`, alongside `status`, `status_date`); Weekly Depth Charts; Daily Transactions ("all transfers created during the league-defined day"); Team and Game Rosters; Player Profile; Free Agents; Push feeds
- History · Live · Latency: multi-season · yes · update-frequency page: injuries TTL 4 h, "Pull every hour or less during the current week"; depth charts "update shortly before each game"; transactions "Updates in realtime as transactions are entered"
- Technical: `GET https://api.sportradar.com/nfl/official/{trial|production}/v7/{lang}/{feed}.{format}` · Auth: `x-api-key` header · rate-limited answers 429 · trial (general docs): 1,000 requests per rolling 30 days, 1 QPS, 30-day trial
- Cost: trial free; production: contact sales (not published)
- Licensing: B2B licence; data "collected by Sportradar's in-house operators" (docs). Whether Sportradar's NFL data is league-official today is UNVERIFIED: reporting says Genius Sports replaced Sportradar as the NFL's exclusive official data distributor in 2021
- Scores: Q ~9 / Cov 10 / Rel 9 / Lat 8 / Hist 8 / Doc 9 / DX 8 / Cost 2 / Lic 6 / Com 9 / RL 3 / NFL 10 = **7.6**
- Recommendation: PRIMARY candidate for a commercial product (the only provider found with documented transactions, depth charts and injury return dates in one licence); a free trial is not a production licence
- Verified: 2026-11-25 — three developer pages read (WebFetch); no trial key created

### Genius Sports — NFL official data distribution
- Links: https://www.nfl.com/news/nfl-extends-strategic-partnership-with-genius-sports (search result) · https://www.sportsvideo.org/2025/06/12/the-nfl-expands-and-extends-strategic-partnership-with-genius-sports/ (search result)
- Category · Class: official league data (live stats, Next Gen Stats, betting feed) · 🟡 Licensed/commercial
- Provides: per search summaries, exclusive distribution of real-time official play-by-play, Next Gen Stats and the official betting data feed (2021 deal, extended 2023 and June 2025). Injury, roster or transaction feeds: UNVERIFIED
- Cost: contact sales (no public price)
- Scores: Q ~9 / Cov ~8 / Rel ~9 / Lat ~9 / Hist ~6 / Doc ~2 / DX ~4 / Cost 1 / Lic ~5 / Com ~8 / RL ~5 / NFL 9 = **6.2**
- Recommendation: OPTIONAL — ask in a commercial phase whether official injury/roster feeds are included
- Verified: UNVERIFIED (search snippets only; pages not opened; search budget exhausted)

### Ourlads — NFL depth charts
- Links: https://www.ourlads.com/nfldepthcharts/ · terms https://www.ourlads.com/tc/ · robots https://www.ourlads.com/robots.txt
- Category · Class: depth charts · 🟠 Unofficial (editorial) / 🔴 if automated
- Provides: depth charts and rosters for all 32 teams, colour legend for 2026 FA/trade acquisitions, rookies, UDFAs
- History · Live · Latency: current · near-live · page header "Last updated on Wednesday, November 25 2026, 1:46 PM ET"
- Technical: HTML · Auth: none
- Licensing: terms forbid any robot, scraper, AI system or "other automated means" to access or copy Ourlads content, and specifically forbid systematically monitoring depth-chart "additions, deletions, substitutions ... ordering changes" to build or validate another product; public accessibility "does not constitute permission"
- Scores: Q ~8 / Cov 9 / Rel ~7 / Lat ~7 / Hist ~3 / Doc 1 / DX 2 / Cost 10 / Lic 1 / Com 1 / RL 2 / NFL 8 = **4.9**
- Recommendation: AVOID (explicitly prohibited); a licence could be requested in writing
- Verified: 2026-11-25 — page header, robots.txt and terms read (curl)

### OverTheCap — contracts and salary cap
- Links: https://overthecap.com/ · terms https://overthecap.com/terms-and-conditions · robots https://overthecap.com/robots.txt (updated 2026-06-14)
- Category · Class: contracts, cap space, transactions table, release tracker · 🟠 Unofficial (analyst-compiled; "in some cases, estimated")
- Provides: contracts, cash flows, cap space, transactions table, restructure potential, tag projections, contract history
- History · Live · Latency: deep contract history · near-live (UNVERIFIED) · UNVERIFIED
- Technical: HTML; `/api` answers HTTP 401 (an authenticated API exists; purpose UNVERIFIED); "embed" for single instances
- Cost: free site; OTC Premium subscription (price not checked); data licence via support@overthecap.com
- Licensing: "solely for your own individual use"; no derivative works; systematic retrieval prohibited without written consent; no data to websites "for the purpose of providing comprehensive information on professional football contracts, rosters, or player valuations unless contracted by OTC". robots.txt disallows `Anthropic-AI`, GPTBot, CCBot and other training crawlers
- Scores: Q 9 / Cov 9 / Rel 8 / Lat 7 / Hist 9 / Doc 3 / DX 3 / Cost 9 / Lic 1 / Com ~3 / RL 2 / NFL 9 = **6.0**
- Recommendation: AVOID without a licence; best candidate to license for contracts in a serious product
- Verified: 2026-11-25 — terms and robots.txt read in full (curl)

### Spotrac — contracts, cap, transactions
- Links: https://www.spotrac.com/ · terms https://www.spotrac.com/service (and /terms)
- Category · Class: contracts, cap, transactions · 🟠 Unofficial
- Provides: UNVERIFIED (site not readable by automated clients)
- Technical: curl with a generic UA → HTTP 403 (CloudFront "Request blocked") for `/terms`, `/robots.txt`, `/api`; WebFetch → HTTP 402. Not worked around
- Licensing: search snippet only: licence to review content "for personal and educational purposes". Sports-Reference's data-use page names Spotrac as its paid source for contract data
- Scores: Q ~8 / Cov 9 / Rel ~7 / Lat ~7 / Hist 8 / Doc 1 / DX 1 / Cost ~6 / Lic 1 / Com ~2 / RL 1 / NFL 8 = **4.9**
- Recommendation: AVOID (blocks automation; no public data programme found)
- Verified: 2026-11-25 — blocked (403/402); terms UNVERIFIED

### NFLPA — Public Salary Cap Report
- Links: https://nflpa.com/reports/public-salary-cap-report · terms https://nflpa.com/tos
- Category · Class: team cap figures · 🟢 Official (players' union)
- Provides: team-level cap report (rendered client-side from an Azure API `api.azure-api.net/papi/v2/reports`; content not read)
- Licensing: content for "information and personal use only"; no commercial use without authorization; automated systems may not exceed human request rates
- Scores: Q 10 / Cov ~6 / Rel ~7 / Lat ~5 / Hist ~4 / Doc 1 / DX 2 / Cost 10 / Lic 2 / Com 1 / RL ~4 / NFL 7 = **4.9**
- Recommendation: AVOID automated; cite single facts manually with a link
- Verified: 2026-11-25 — page shell and terms read (curl); report data not loaded

### NFL.com — official salary cap figure (fact)
- 2026 salary cap $301.2 million per club, up $22 million from $279.2 million in 2025 (NFL.com headline "NFL announces 2026 salary cap set at $301.2 million per team"; corroborated by ESPN and NBC). Seen in search results only; article not opened. Usable as a single fact with a link; no feed needed. Score not given (single fact).

### Sports Reference — Pro-Football-Reference (injuries page, transactions on player pages)
- Links: https://www.pro-football-reference.com/players/injuries.htm · data use https://www.sports-reference.com/data_use.html
- Category · Class: injuries, transactions history, ids (PFR ids) · 🟠 Unofficial
- Licensing: "Please do not attempt to aggressively spider data"; no building sites or tools from scraped data; no competing database; no AI training; custom data from "a minimum of $5,000"; facts are not copyrightable. Some licensed sources (e.g. Spotrac contracts) forbid redistribution
- Scores: Q 8 / Cov 7 / Rel 8 / Lat 5 / Hist 10 / Doc 5 / DX 3 / Cost 9 / Lic 2 / Com 2 / RL 2 / NFL 8 = **5.8**
- Recommendation: AVOID automated; PFR ids still useful as join keys (via nflverse)
- Verified: 2026-11-25 — data-use page read (WebFetch)

### Pro Sports Transactions — prosportstransactions.com
- Links: https://www.prosportstransactions.com/
- Category · Class: transactions history (all moves) · 🟠 Unofficial (volunteer-compiled)
- Technical: HTTP 403 to the generic research UA for both `/` and `/robots.txt`; not worked around
- Licensing: UNVERIFIED (terms unreadable; search budget exhausted)
- Scores: Q ~6 / Cov ~7 / Rel ~5 / Lat ~5 / Hist ~9 / Doc 1 / DX 1 / Cost 10 / Lic ~1 / Com 1 / RL 1 / NFL 6 = **4.4**
- Recommendation: AVOID
- Verified: 2026-11-25 — blocked (403)

### CBS Sports / Yahoo Sports — injury pages
- Links: https://www.cbssports.com/nfl/injuries/ (HTTP 200 to curl) · CBSi terms https://legal.paramount.com/us/en/cbsi/terms-of-use · Yahoo terms https://legal.yahoo.com/us/en/yahoo/terms/otos/index.html
- Category · Class: injuries · 🟠 Unofficial
- Licensing (project registry, Nov. 21): personal, non-commercial; scraping and redistribution barred (CBSi); Yahoo §2(e) bars commercial reuse
- Scores: Q 7 / Cov 8 / Rel 7 / Lat 7 / Hist 2 / Doc 1 / DX 2 / Cost 10 / Lic 1 / Com 1 / RL ~4 / NFL 7 = **4.8**
- Recommendation: AVOID
- Verified: 2026-11-25 — CBS page status only; terms from the registry

### Social media — team accounts, beat reporters, nflverse injury bot
- Links: https://github.com/nflverse/nflverse-injurybot (posts NFL injury reports to Bluesky; repo pushed 2025-02-10)
- Category · Class: earliest reports, rumours · ⚫ Experimental/unstable (and 🟡 for the X API)
- Provides: first word of inactives, IR moves, signings; mix of confirmed and reported claims
- Licensing/cost: X API pricing and terms UNVERIFIED (search budget exhausted); Bluesky public API terms not reviewed
- Scores: Q ~5 / Cov ~7 / Rel ~5 / Lat 10 / Hist ~5 / Doc ~5 / DX ~4 / Cost ~3 / Lic ~2 / Com ~2 / RL ~3 / NFL 7 = **4.8**
- Recommendation: AVOID ingest; use only as the human-checked "reported" tier with the reporter's link, and as the fastest reference in the latency study if terms allow
- Verified: UNVERIFIED (no API probed)

## R7. Betting odds, line history, splits, prediction markets

Evidence file: [tracks/R7-odds-markets.md](tracks/R7-odds-markets.md) (matrix rows, research log and the track's own notes).

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

## R8. Fantasy football

Evidence file: [tracks/R8-fantasy.md](tracks/R8-fantasy.md) (matrix rows, research log and the track's own notes).

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

## R9. News, press conferences, social, media

Evidence file: [tracks/R9-news-social-media.md](tracks/R9-news-social-media.md) (matrix rows, research log and the track's own notes).

Scores: Q quality / Cov coverage / Rel reliability / Lat latency / Hist history / Doc docs / DX / Cost (10 = free) / Lic licensing (10 = permissive) / Com commercial usability / RL rate limits (10 = generous) / NFL usefulness. "~" marks a judgment component. Overall = mean of the 12, one decimal. All URLs read or probed on 2026-11-25 unless stated.

### 2A. News search and aggregation APIs

### NewsAPI.org — News API v2
- Links: https://newsapi.org · https://newsapi.org/docs · https://newsapi.org/terms (last updated Apr. 30, 2020) · https://newsapi.org/pricing
- Category · Class: news search/aggregation · 🟡 Licensed/commercial
- Provides: headlines, description, URL, source name, publish time, image URL (aggregated from publishers' public pages)
- History · Live · Latency: Developer: up to 1 month, 24-hour delay; Business/Advanced: up to 5 years, real time (pricing page) · yes on paid · real time paid / 24 h free
- Coverage: general news; NFL only via keyword/source filters; no team tagging
- Technical: REST · JSON · SDK: community · Auth: API key · Rate limits: Developer 100 requests/day; Business 250,000/month; Advanced 2,000,000/month · Pagination: page/pageSize; no webhooks
- Cost: free: Developer $0 "for development and testing in a development environment only" · paid: Business $449/mo, Advanced $1,749/mo, Enterprise contact sales (pricing page) · est. monthly for a small app: $449 (no lawful production use below that)
- Licensing: commercial: paid plans only · redistribution: terms bar using the service "to reproduce or republish copyrighted material"; third-party content stays the publishers' responsibility, you need your own licence · caching/storage: not addressed · attribution: must not remove source labels · AI/ML use: not mentioned · other: Developer plan CORS only for localhost; cannot be used in staging or production
- Quality: accuracy of metadata good; completeness depends on crawled sources; reliability good; notes: grants no rights in the underlying articles
- Scores: Q 6 / Cov 6 / Rel ~7 / Lat 8 / Hist 7 / Doc 8 / DX 8 / Cost 2 / Lic 3 / Com 5 / RL 4 / NFL ~4 = **5.7**
- Recommendation: AVOID for this project — free plan is development-only; paid plan is $449/mo and still gives no publisher licence.
- Verified: 2026-11-25 — pricing and terms pages read; no account created.

### GNews — GNews API v4
- Links: https://gnews.io · https://gnews.io/docs · https://gnews.io/terms (last updated Oct. 18, 2026) · https://gnews.io/pricing
- Category · Class: news search/aggregation · 🟡 Licensed/commercial
- Provides: title, description, content snippet, URL, image, publishedAt, source
- History · Live · Latency: Free: last 30 days, 12-hour delay; paid: since 2020, real time · yes on paid · 12 h free
- Coverage: general; "sports" topic; NFL by keyword only
- Technical: REST · JSON · SDK: none official · Auth: key · Rate limits: Free 100 req/day, 10 articles/req; Essential 1,000/day; Business 5,000/day; Enterprise 25,000/day · Pagination: page on paid
- Cost: free: €0 non-commercial · paid: Essential €49.99, Business €99.99, Enterprise €249.99 per month (yearly €39.99/€79.99/€199.99 equivalent) · est. monthly for a small app: €49.99 if commercial
- Licensing: commercial: paid plan "mandatory for as long as you use the API for a commercial purpose" (§3.3) · redistribution: none granted; licence non-sublicensable (§3.1); no database of API content for redistribution (§7) · caching/storage: "reasonable caching" allowed (§7) · attribution: appreciated, not required · AI/ML use: not mentioned · other: content remains property of owners (§5.2, §6.2)
- Quality: good metadata; 12-hour delay makes free tier useless for live news
- Scores: Q 6 / Cov 6 / Rel ~7 / Lat 4 / Hist 6 / Doc 7 / DX 8 / Cost 7 / Lic 4 / Com 6 / RL 3 / NFL ~4 = **5.7**
- Recommendation: OPTIONAL (commercial phase, if a search API is wanted) / AVOID for the free page — 12-hour free delay; no rights to publishers' content.
- Verified: 2026-11-25 — pricing and terms read.

### NewsData.io — News API
- Links: https://newsdata.io · https://newsdata.io/documentation · https://newsdata.io/terms (no date shown; "2018-2026") · https://newsdata.io/pricing
- Category · Class: news search/aggregation · 🟡 Licensed/commercial
- Provides: articles with title, link, description, keywords, category, country, language, pubDate, source
- History · Live · Latency: Free: past 48 h, delayed 12 h; Basic 6 months; Professional 2 years; Corporate 10 years · yes paid · 12 h free
- Coverage: global; sports category; NFL via query
- Technical: REST · JSON · SDK: Python/JS clients · Auth: key · Rate limits: Free 200 credits/day (1–10 articles/credit); Basic 20,000/month; Professional 50,000/month; Corporate 1,000,000/month · Pagination: nextPage token
- Cost: free: 200 credits/day · paid: Basic $199.99, Professional $349.99, Corporate $1,299.99 per month · est. monthly for a small app: $199.99
- Licensing: commercial: terms contradictory (API for "personal or internal business purposes", derivatives for external use) · redistribution: says customers may share data "on their own risk"; raw data grants no rights · caching: not addressed · attribution: required, "Powered by NewsData.io API" with link · AI/ML use: not mentioned · other: content "remains the sole property of those who make it available"
- Quality: broad but shallow; contradictory licence text is a risk
- Scores: Q 5 / Cov 6 / Rel ~6 / Lat 4 / Hist 7 / Doc 7 / DX 7 / Cost 6 / Lic 3 / Com 4 / RL 4 / NFL ~3 = **5.2**
- Recommendation: AVOID — contradictory licence, 12-hour free delay.
- Verified: 2026-11-25 — pricing and terms read.

### apilayer — Mediastack
- Links: https://mediastack.com · https://mediastack.com/documentation · https://mediastack.com/terms (dated 10-06-2020) · https://mediastack.com/pricing
- Category · Class: news aggregation · 🟡 Licensed/commercial
- Provides: live and historical news articles (title, description, url, source, image, category, published_at)
- History · Live · Latency: free delayed, no history; paid live with history · yes paid
- Coverage: general; "sports" category
- Technical: REST · JSON · Auth: key · Rate limits: Free 100 calls/month; Standard 10,000; Professional 50,000; Business 250,000
- Cost: free: 100 calls/month, delayed, "Non-Commercial Use" · paid: Standard $24.99 ($22.99 yearly), Professional $99.99, Business $249.99, Enterprise custom
- Licensing: commercial: paid · redistribution: data only to individual end users for personal use; "posting it publicly in print, broadcast, or online is prohibited" (summary of terms) · caching: no use after the agreement ends · attribution: optional link · AI/ML: not mentioned; derivative works barred · other: apilayer claims ownership of "API data"
- Quality: weakest of the group for sports; 100 calls/month free is too little
- Scores: Q 4 / Cov 5 / Rel ~6 / Lat 4 / Hist 5 / Doc 7 / DX 7 / Cost 7 / Lic 2 / Com 4 / RL 2 / NFL ~3 = **4.7**
- Recommendation: AVOID — terms bar public online display of the data.
- Verified: 2026-11-25 — pricing and terms read.

### Event Registry — NewsAPI.ai
- Links: https://newsapi.ai · https://newsapi.ai/documentation · https://newsapi.ai/plans
- Category · Class: news search with event clustering and entity tagging · 🟡 Licensed/commercial
- Provides: articles, events (clustered stories), concepts/entities, sentiment field, categories
- History · Live · Latency: free: last 30 days; paid: since 2014 · yes
- Coverage: global, 150k+ sources (vendor claim, not checked); entity tagging can find NFL teams/players
- Technical: REST · JSON · SDK: Python, Node · Auth: key · Rate limits: tokens; free 2,000 one-time tokens (= 2,000 recent searches or 400 event searches) · Pagination: yes
- Cost: free: 2,000 tokens once · paid: 5K $90, 10K $150, 20K $220, 50K $400, 100K $700, 200K $1,300, 500K $3,000 per month; custom above · est. monthly for a small app: $90–150
- Licensing: plans page silent on commercial use; terms not read (UNVERIFIED) · redistribution: UNVERIFIED · AI/ML: UNVERIFIED
- Quality: best entity/event model of the paid aggregators; sentiment field is a black box
- Scores: Q 7 / Cov 7 / Rel ~7 / Lat 8 / Hist 9 / Doc 7 / DX 7 / Cost 4 / Lic ~4 / Com ~5 / RL 4 / NFL ~5 = **6.2**
- Recommendation: OPTIONAL (commercial phase, for clustering and archive research) — free tokens fit a one-off backfill experiment only.
- Verified: 2026-11-25 — plans page read; terms UNVERIFIED (not read).

### Webz.io — Open Web Data / News API Lite
- Links: https://webz.io · https://webz.io/pricing/
- Category · Class: web/news crawl data · 🟡 Licensed/commercial
- Provides: news, blogs, forums, reviews posts with full text and metadata
- History · Live · Latency: "limited historical access" on free/pay-as-you-go; archive up to 10 years on High Volume (contact sales) · yes
- Technical: REST · JSON · Auth: token · Rate limits: credit-based
- Cost: free: $5 monthly credit · paid: pay-as-you-go Open Web feed $0.01/call + $0.005/post; Search API $0.001/call + $0.0005/result; High Volume contact sales
- Licensing: commercial-use permission not stated on pricing page (UNVERIFIED); full-text delivery conflicts with DEC-008 anyway
- Scores: Q 6 / Cov 7 / Rel ~7 / Lat 7 / Hist 7 / Doc 6 / DX 6 / Cost 6 / Lic ~3 / Com ~5 / RL 6 / NFL ~4 = **5.8**
- Recommendation: AVOID for the page; OPTIONAL for a commercial forum/blog-sentiment study after reading its terms.
- Verified: 2026-11-25 — pricing page read; terms not read.

### Perigon — Perigon API (formerly goperigon.com, now perigon.io)
- Links: https://perigon.io/pricing (301 from goperigon.com/pricing)
- Category · Class: news API with story clustering, entities, social · 🟡 Licensed/commercial
- Provides: articles, clustered stories, people/company entities, "social" requests, monitors
- History · Live: Individual 3 months; Launch 3 years; Growth 10+ years · yes
- Technical: REST · JSON · MCP offered · Auth: key · Rate limits: credit pools (articles 1, stories 2, social 3 credits)
- Cost: free: "testing ... with your own API key and one monitor, for free" (terms of trial not stated) · paid: Individual from $25/mo (personal use only), Launch from $225/mo ("limited commercial use"), Growth from $875/mo (commercial), Custom negotiated
- Licensing: plan-level commercial labels as above; redistribution and AI terms UNVERIFIED (terms not read)
- Scores: Q 7 / Cov 7 / Rel ~7 / Lat 8 / Hist 7 / Doc 7 / DX 7 / Cost 5 / Lic ~4 / Com 6 / RL 5 / NFL ~5 = **6.3**
- Recommendation: OPTIONAL (commercial phase) — the cheapest plan with a stated commercial grant is $225/mo.
- Verified: 2026-11-25 — pricing page read; terms not read.

### Quantexa (formerly AYLIEN) — News API
- Links: https://aylien.com (acquired by Quantexa, Feb. 2023 per public reporting — UNVERIFIED here)
- Category · Class: news intelligence API · 🟡 Licensed/commercial
- Cost: no public price found; enterprise sales (UNVERIFIED)
- Scores: not scored (insufficient evidence)
- Recommendation: AVOID for now — enterprise only, nothing verifiable.
- Verified: UNVERIFIED (no primary page read; time spent on higher-value sources)

### Microsoft — Bing News Search API
- Links: https://learn.microsoft.com/en-us/lifecycle/announcements/bing-search-api-retirement
- Category · Class: news search · ⚫ Retired
- Status: Microsoft: "Bing Search APIs will be retired on August 11, 2025. Any existing instances ... will be decommissioned completely"; replacement is "Grounding with Bing Search" inside Azure AI Agents (an LLM tool, not a news feed). Page dated May 15, 2025.
- Scores: not scored (retired)
- Recommendation: AVOID — retired Aug. 11, 2025 (confirmed).
- Verified: 2026-11-25 — Microsoft lifecycle page read.

### Google — Google News RSS (search and topic feeds)
- Links: https://news.google.com/rss/search?q=NFL&hl=en-US&gl=US&ceid=US:en (probed)
- Category · Class: news aggregation feed · 🔴 Unlicensed for this use (feed itself forbids it)
- Provides: ~100 items: title ("Headline - Publisher"), Google redirect link, pubDate, source
- History · Live · Latency: hours-to-days window · yes · minutes (top item 18:54 GMT when probed at ~22:50 GMT)
- Technical: RSS · XML · Auth: none · Rate limits: unpublished
- Cost: free
- Licensing: the feed's own `<copyright>`: "made available solely for the purpose of rendering Google News results within a personal feed reader for personal, non-commercial use. Any other use of the feed is expressly prohibited." · redistribution: prohibited · AI/ML: n/a
- Quality: excellent recall; links are Google redirects, not publisher URLs
- Scores: Q 7 / Cov 9 / Rel ~7 / Lat 8 / Hist 3 / Doc 2 / DX 8 / Cost 10 / Lic 1 / Com 1 / RL ~5 / NFL 7 = **5.7**
- Recommendation: AVOID — a public page (or a server feeding one) is not "a personal feed reader". Owner's private reader only.
- Verified: 2026-11-25 — HTTP 200, application/xml, 108 items; copyright clause read in the feed. A topic-feed URL tried returned 404.

### The GDELT Project — DOC 2.0 API and GKG
- Links: https://www.gdeltproject.org · https://www.gdeltproject.org/about.html (terms) · https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/
- Category · Class: global news index (URLs, titles, themes, tone) · 🔵 Public/open data
- Provides: DOC API: article lists (URL, title, seendate, domain, language, source country, social image), timelines, tone charts; GKG: themes, entities, tone per article
- History · Live · Latency: DOC API searches "a rolling window of the last 3 months" (2017 announcement; the same page says historical search back to Jan. 1, 2017); GDELT 2.0 publishes in 15-minute batches (GDELT 2.0 documentation; the DOC page mentions 15 minutes only as minimum TIMESPAN — cadence UNVERIFIED from a primary page today) · near-live
- Coverage: worldwide news sites; US sports sites included, but NFL recall/precision not measured
- Technical: REST · JSON/CSV/RSS/JSONFeed · Auth: none · Rate limits: our probes got HTTP 429 with "Please limit requests to one every 5 seconds" (twice, 8 s apart; the second may have been a longer penalty) · max 250 records per call
- Cost: free
- Licensing: "for any academic, commercial, or governmental use of any kind without fee"; may "redistribute, rehost, republish, and mirror"; must cite GDELT with a link · third-party articles: terms silent (GDELT licenses its index, not the articles; headlines-and-links per DEC-008 still applies) · AI/ML: no restriction stated
- Quality: noisy entity matching; duplicate syndications; titles sometimes truncated; tone is a lexicon score
- Scores: Q 5 / Cov 8 / Rel ~5 / Lat 7 / Hist 7 / Doc 6 / DX 6 / Cost 10 / Lic 9 / Com 9 / RL 3 / NFL ~5 = **6.7**
- Recommendation: SECONDARY — the only free, permissively licensed, commercially usable news index; good as a discovery/backstop layer and for media-volume metrics. Needs ≥5 s spacing and its own retry; reachability from GitHub Actions UNVERIFIED.
- Verified: 2026-11-25 — terms and DOC 2.0 page read; endpoint answered 429 twice (rate limit), data shape not observed today.

### Common Crawl — CC-NEWS
- Links: https://commoncrawl.org/blog/news-dataset-available · https://commoncrawl.org/terms-of-use
- Category · Class: WARC news crawl archive · 🔵 Public/open data (content rights stay with publishers)
- Provides: raw HTML of news pages (WARC), daily since 2016 (per Common Crawl's announcement; not re-read today)
- Licensing: terms (LAST UPDATED March 7, 2024): crawled content "may be subject to separate terms of use" of its owners (§2); users must respect third parties' copyrights (§3); users indemnify Common Crawl for claims from use "in connection with artificial intelligence, machine learning" (§9). A News/Media Alliance letter to Common Crawl (Apr. 29, 2026) appeared in search results (not read)
- Scores: Q 5 / Cov 7 / Rel 7 / Lat 3 / Hist 9 / Doc 6 / DX 3 / Cost 10 / Lic 3 / Com 3 / RL 8 / NFL ~3 = **5.6**
- Recommendation: AVOID for product; full article bodies conflict with DEC-008. Research-only, private.
- Verified: 2026-11-25 — terms read; CC-NEWS dataset page not read (cadence and start year from memory, UNVERIFIED)


### 2B. Publisher RSS feeds (beyond ESPN, Yahoo, PFT, CBS already in the registry)

Probe method for every feed below: one GET from the owner's Mac on 2026-11-25 ~22:45–23:00 UTC, User-Agent `nfl-universe-research/1.0`. "GitHub reachability" cannot be tested from here; the project's committed run report (`data/fabric/runs.json`, run at 2026-11-25T17:46Z on GitHub) shows `rss-yahoo`, `youtube-official`, `youtube-reel` and `podcasts-nfl` (Omny) succeeding there and `rss-espn` stale (DEC-024). CDN headers seen (provider inferred from headers): FOX = Varnish with Fastly-style `x-served-by`; Sporting News and PFN = Cloudflare; SI and Yardbarker = CloudFront (the CDN that refuses GitHub for ESPN — a configurable WAF, so not proof); NBC = CloudFront+Envoy; SB Nation = Fastly; CBS = own ContentServer.

### FOX Sports — NFL RSS ("optimized-rss")
- Links: feed list https://www.foxsports.com/rss-feeds · NFL feed (URL as published on foxsports.com/nfl and the RSS page) `https://api.foxsports.com/v2/content/optimized-rss?partnerKey=MB0Wehpmuj2lUhuRhQaafhBjAJqaPU244mlTDK1i&size=30&tags=fs%2Fnfl` · general terms https://www.foxsports.com/terms-of-use (Last Revised 08/21/2025)
- Category · Class: publisher headlines · 🟢 Official publisher feed with an explicit RSS grant
- Provides: title, link, guid, category, description (1–2 sentences), pubDate, media:content image, **content:encoded full article body** (must be dropped under DEC-008)
- History · Live · Latency: 26 items (size=30) · yes · newest item 5 minutes before probe
- Coverage: national NFL news, FOX game coverage, videos
- Technical: RSS 2.0 · XML · Auth: none (the `partnerKey` is FOX's own published public parameter, not a secret) · Rate limits: none stated
- Cost: free
- Licensing: RSS page: "The feeds are free of charge to use for individuals and non-profit organizations for non-commercial use. Attribution (included in each feed) is required." · general ToU §4: personal, non-commercial; bars data mining/scraping "for the purpose of training any artificial intelligence algorithm"; bars framing/deep-linking "unless expressly permitted" (the RSS page is that express permission for feed use — our reading) · commercial: needs FOX permission
- Quality: fast, clean, team names in titles; includes full bodies (drop them)
- Scores: Q 8 / Cov 7 / Rel ~7 / Lat 9 / Hist 2 / Doc 5 / DX 9 / Cost 10 / Lic 7 / Com 2 / RL ~6 / NFL 8 = **6.7**
- Recommendation: PRIMARY candidate for the public page (replaces ESPN on GitHub) — the only national publisher found today with an explicit, written non-commercial RSS grant beyond ESPN and Yahoo. Keep headline+link+time; credit "FOX Sports"; never pass bodies to an LLM (ToU AI clause). GitHub reachability UNVERIFIED.
- Verified: 2026-11-25 — feed HTTP 200, 26 items, `<copyright>Copyright 2026 FOX Sports</copyright>`; RSS page text and ToU read.

### The Athletic (New York Times) — NFL RSS
- Links: `https://www.nytimes.com/athletic/rss/nfl/` · NYT robots.txt read
- Category · Class: publisher headlines · 🟠 Unofficial use (feed public; no display grant found)
- Provides: 100 items: title, link, guid, short description (~100 chars), pubDate, media:content
- History · Live: 100 items · yes · newest within minutes
- Licensing: NYT Terms of Service (effective Jan. 20, 2026, per search snippet; page not readable by our fetch tool — it is blocked from nytimes.com): personal, non-commercial use; non-commercial use excludes developing software or generative-AI tools without written consent (snippet). robots.txt disallows `/athletic/rss-feed/` and `/athletic/*?*rss=1` for all agents (not the `/athletic/rss/nfl/` path we used) and disallows ClaudeBot, Claude-User, Claude-SearchBot, anthropic-ai site-wide. RSS-specific NYT terms page: UNVERIFIED (not read).
- Scores: Q 9 / Cov 8 / Rel ~8 / Lat 9 / Hist 3 / Doc 2 / DX 9 / Cost 10 / Lic 2 / Com 1 / RL ~5 / NFL 9 = **6.3**
- Recommendation: AVOID on the public page until NYT's RSS terms are read by a human and permit display; at most a link to theathletic.com/nfl.
- Verified: 2026-11-25 — feed HTTP 200 application/xml, 100 items, copyright "2026 The Athletic Media Company"; robots.txt read; terms only via search snippet.

### Sporting News — RSS
- Links: `https://www.sportingnews.com/us/rss` · terms https://sportingnewsholdings.com/policies/terms-of-use/ (last updated Sept. 22, 2026)
- Category · Class: publisher headlines · 🟠 (no RSS grant)
- Provides: 20 items (all sports, NFL-heavy today), title, link, short description, enclosure image
- Licensing: personal, non-exclusive, revocable licence (§4); bars "scraper, or data mining tool" (§8P); bars using content to train, fine-tune **or prompt/instruct** AI models (§8M); RSS not mentioned · commercial: written consent
- Scores: Q 6 / Cov 5 / Rel ~7 / Lat 8 / Hist 2 / Doc 2 / DX 8 / Cost 10 / Lic 2 / Com 1 / RL ~5 / NFL 5 = **5.1**
- Recommendation: AVOID — terms bar automated gathering and even prompting AI with its content.
- Verified: 2026-11-25 — feed HTTP 200 (20 items); terms read (our fetch tool is blocked from sportingnews.com; the holdings-site copy was read).

### Pro Football Network — RSS (WordPress)
- Links: `https://www.profootballnetwork.com/feed/`
- Category · Class: publisher headlines · 🟠
- Provides: 50 items, long descriptions (~2,000 chars), categories
- Licensing: terms page not found (`/terms-of-service/` 404; footer links not in static HTML) — UNVERIFIED
- Scores: Q 5 / Cov 7 / Rel ~6 / Lat 9 / Hist 2 / Doc 1 / DX 8 / Cost 10 / Lic ~3 / Com ~2 / RL ~5 / NFL 7 = **5.4**
- Recommendation: OPTIONAL only after its terms are found and read; content is often aggregation of other reports (low tier).
- Verified: 2026-11-25 — feed HTTP 200, 50 items; terms UNVERIFIED.

### SB Nation (Vox Media) — league and team-blog Atom feeds
- Links: `https://www.sbnation.com/rss/nfl/index.xml` (team blogs follow `<blog>/rss/index.xml`, not probed) · Vox Media terms (our fetch tool is blocked from voxmedia.com)
- Category · Class: publisher/fan-blog headlines · 🟠
- Provides: 10 Atom entries with **full HTML content**
- Licensing: UNVERIFIED (terms not readable); Vox Media joined the RSL Collective for AI licensing (Digiday, search snippet only)
- Scores: Q 5 / Cov 6 / Rel ~6 / Lat 8 / Hist 2 / Doc 1 / DX 7 / Cost 10 / Lic ~2 / Com ~1 / RL ~5 / NFL 6 = **4.9**
- Recommendation: AVOID until terms are read; fan-blog tier.
- Verified: 2026-11-25 — feed HTTP 200, 10 entries.

### Sports Illustrated — site feed
- Links: `https://www.si.com/feed` (NFL-specific `/nfl/rss` and `/nfl/.rss/full/` → 404)
- Category · Class: publisher headlines · 🟠
- Provides: 81 mixed-sport items with author, sponsor fields
- Licensing: terms page `/terms-of-use` 404; operator and terms UNVERIFIED
- Scores: Q 5 / Cov 4 / Rel ~6 / Lat 8 / Hist 2 / Doc 1 / DX 6 / Cost 10 / Lic ~2 / Com ~1 / RL ~5 / NFL 4 = **4.5**
- Recommendation: AVOID — no NFL feed, terms unknown.
- Verified: 2026-11-25 — feed HTTP 200, 81 items.

### Yardbarker (YB Media) — RSS by sport
- Links: `https://www.yardbarker.com/rss/sport/1` (= MLB; `/rss/sport/9` returned 1 stale item) · terms https://www.yardbarker.com/terms (Sept. 16, 2022)
- Category · Class: aggregator · 🟠
- Licensing: personal use only, "not for resale or further distribution"; bars "any automated tool (e.g., robots, spiders)"; bars compiling content into a database
- Scores: Q 4 / Cov 3 / Rel ~5 / Lat 7 / Hist 2 / Doc 1 / DX 5 / Cost 10 / Lic 1 / Com 1 / RL ~5 / NFL 3 = **3.9**
- Recommendation: AVOID — terms bar automated access; NFL feed id not found.
- Verified: 2026-11-25.

### NBC Sports — Rotoworld player news RSS (Rotoworld's current home)
- Links: `https://www.nbcsports.com/fantasy/football/player-news.rss` · terms https://www.nbcsports.com/terms-use (updated June 28, 2023)
- Category · Class: fantasy player news · 🟠 (no RSS grant)
- Provides: 10 items, title, link, 1-line description, dc:creator, pubDate
- Licensing: same NBC terms as PFT (registry: Owner decision): bars robots/spiders "operated automatically or manually" for scraping, and aggregation/redistribution; links must be text-only, open in a new window, and NBC may "suspend or prohibit linking" · commercial route: SportsDataIO is NBC's "exclusive distribution partner" for Rotoworld Player News (announced Oct. 6, 2022)
- Scores: Q 8 / Cov 6 / Rel ~7 / Lat 9 / Hist 2 / Doc 2 / DX 8 / Cost 10 / Lic 2 / Com 1 / RL ~5 / NFL 8 = **5.7**
- Recommendation: AVOID on the public page (as PFT); commercial: license via SportsDataIO.
- Verified: 2026-11-25 — feed HTTP 200, 10 items; terms read (two passes).

### RotoWire — NFL news RSS and RotoWire API
- Links: `https://www.rotowire.com/rss/news.php?sport=NFL` · terms https://www.rotowire.com/termsandconditions.php (effective Sept. 19, 2026) · API docs https://rotowire.readme.io/docs/quick-start
- Category · Class: fantasy player news/injury notes · 🟡 Licensed (API) / 🟠 (RSS)
- Provides: RSS: 5 latest items (e.g., practice participation notes); API: key-based REST (`api.rotowire.com`, `/Football/` prefix), endpoints for NFL not shown in quick start
- Licensing: personal, non-commercial; automated means (scraping, crawling) need express prior written consent (Art. VI); no archiving/redistribution (Art. V); explicit ban on using RotoWire data to "train, pre-train, post-train, fine-tune, align, evaluate, benchmark" AI (Art. VII(b)) · API pricing: not published (contact) · `<copyright>` "All rights reserved"
- Scores: Q 8 / Cov 7 / Rel ~7 / Lat 9 / Hist 3 / Doc 5 / DX 6 / Cost ~4 / Lic 1 / Com ~4 / RL ~5 / NFL 9 = **5.7**
- Recommendation: AVOID RSS for automation; OPTIONAL licensed API for a commercial product (ask about AI-assistant use explicitly).
- Verified: 2026-11-25 — RSS HTTP 200, 5 items; terms and API quick-start read; price UNVERIFIED.

### NFL Trade Rumors — WordPress RSS
- Links: `https://nfltraderumors.co/feed/`
- Category · Class: rumor aggregator · 🟠
- Provides: 10 items with full content, categories by team
- Licensing: terms not read (UNVERIFIED)
- Scores: Q 5 / Cov 6 / Rel ~6 / Lat 9 / Hist 2 / Doc 1 / DX 8 / Cost 10 / Lic ~2 / Com ~1 / RL ~5 / NFL 7 = **5.2**
- Recommendation: AVOID as a display source; it is an aggregator of others' reports (tier 4 in §2H).
- Verified: 2026-11-25 — feed HTTP 200, 10 items.

### Other feeds probed (no catalog record: unusable or not NFL)
- USA TODAY `rssfeeds.usatoday.com/usatodaycomnfl-topstories` → HTTP 402 (the old Gannett feed host no longer serves).
- AP `apnews.com/hub/nfl.rss` → HTTP 403; AP offers no public NFL RSS (licensed AP Media API only, §2C).
- Bleacher Report `/articles/feed?tag_id=16` → 404. theScore `/rss/nfl` → 404. Spotrac `/rss/nfl/` → 403.
- Washington Post `feeds.washingtonpost.com/rss/sports` → 200, 13 items, all sports; terms not read.
- NYT `rss.nytimes.com/.../ProFootball.xml` → 200, 20 items; same NYT terms issue as The Athletic.
- NFL Communications (`nflcommunications.com`) → public pages for injury reports, transactions, game-day rosters and weekly notes; media material behind a registered NFL media login (`login.nfl.net`), so transcripts there are not a public source (UNVERIFIED whether any transcripts are public).

### 2C. Licensed wires and commercial news feeds (commercial path)

### Associated Press — AP Media API (AP sports report)
- Links: https://developer.ap.org/ap-media-api/ (our fetch tool is blocked from developer.ap.org)
- Category · Class: wire service · 🟡 Licensed/commercial
- Provides: text, photos, video, graphics per customer entitlements; AP's sports report (FanDuel is the exclusive odds provider in AP's sports report per Axios, search snippet)
- Technical: REST, API key tied to a licence; per-key throughput negotiated (third-party guides, UNVERIFIED)
- Cost: contact sales; no public price (UNVERIFIED beyond absence of published pricing)
- Licensing: full publication rights per contract — the cleanest way to show text (not just links) commercially
- Scores: Q 9 / Cov 8 / Rel 9 / Lat 9 / Hist 8 / Doc ~6 / DX ~6 / Cost 2 / Lic 8 / Com 9 / RL ~7 / NFL 7 = **7.3**
- Recommendation: PRIMARY for a commercial product needing publishable text; not for the free page.
- Verified: UNVERIFIED (official page blocked to our tool; facts from search snippets only)

### Reuters — Reuters Connect (with Field Level Media sports)
- Links: https://www.thomsonreuters.com/en/press-releases/2018/january/reuters-partners-with-field-level-media-and-opta-to-bring-media-customers-expanded-sports-content (search result) · AWS Marketplace listing (search result)
- Category · Class: wire marketplace · 🟡 Licensed/commercial
- Provides: Reuters text/photo/video; Field Level Media recaps and analysis for NFL; Imagn (USA TODAY Network photos) editorial content sold via Reuters (search snippet)
- Cost: points-based subscription; expanded licensing by quote (UNVERIFIED)
- Scores: Q 8 / Cov 7 / Rel 9 / Lat 8 / Hist 8 / Doc ~5 / DX ~5 / Cost 2 / Lic 8 / Com 9 / RL ~7 / NFL 6 = **6.8**
- Recommendation: SECONDARY (commercial) — alternative to AP; FLM text is the NFL-relevant part.
- Verified: UNVERIFIED (press releases seen only as search results)

### Field Level Media — syndicated sports content
- Links: https://fieldlevelmedia.com/
- Category · Class: sports wire · 🟡 Licensed/commercial
- Provides: game recaps, previews, news ("syndicated and/or custom content"); clients shown include Reuters, Gracenote, Stats Perform; "200+ professional journalists"
- Cost: contact (info@fieldlevelmedia.com per footer)
- Scores: Q 7 / Cov 7 / Rel ~8 / Lat 8 / Hist ~6 / Doc 2 / DX ~4 / Cost 2 / Lic ~8 / Com 9 / RL ~6 / NFL 7 = **6.2**
- Recommendation: OPTIONAL (commercial) — buy directly or via Reuters.
- Verified: 2026-11-25 — home page read.

### SportsDataIO — Player News & Notes, RotoBaller Premium News, Rotoworld Player News
- Links: https://sportsdata.io/news-and-images · https://sportsdata.io/help/data-rights-and-licensing-questions · NBC deal (Oct. 6, 2022) https://sportsdata.io/sportsdataio-and-nbc-sports-partner-to-create-360-degree-player-data-and-news-feed
- Category · Class: licensed player news feed · 🟡 Licensed/commercial
- Provides: short player notes (injury, sit/start, trades) "365 days per year", long-form previews/recaps "pre-packaged wire service", headshots; Rotoworld Player News (exclusive distributor), RotoBaller Premium News (Swagger listing per search)
- Licensing: commercial licences permit "ingesting, caching, and storing API responses on your own infrastructure"; reselling the feed itself not permitted; attribution "a standard requirement of commercial licenses"; Discovery Lab is personal non-commercial only
- Cost: free trial key; custom proposal via sales (no public price)
- Scores: Q 8 / Cov 8 / Rel 8 / Lat 9 / Hist 6 / Doc 7 / DX 7 / Cost 3 / Lic 7 / Com 9 / RL ~7 / NFL 10 = **7.4**
- Recommendation: PRIMARY (commercial) for player news/injury notes with display rights.
- Verified: 2026-11-25 — three SportsDataIO pages read; price not published.

### RotoBaller — B2B player news feed
- Links: https://rotoballer.com/partners (search result); media kit PDF (Aug. 2026, search result)
- Category · Class: licensed player news · 🟡
- Provides: player news via API (JSON or XML) to businesses; "purchasing or bartering" (search snippet)
- Scores: not scored (only search snippets)
- Recommendation: OPTIONAL (commercial), compare with SportsDataIO bundle.
- Verified: UNVERIFIED (pages not read)

### 2D. Press conferences and transcripts

### NFL (iHeartMedia-distributed) — official podcast feeds' `podcast:transcript` files
- Links: the six Omny feeds in `lib/fabric/adapters/media.js` (e.g. NFL Daily `https://www.omnycontent.com/d/playlist/e73c998e-.../deff018f-.../podcast.rss`)
- Category · Class: episode transcripts · 🟢 Official (rights reserved, TDM prohibited)
- Provides: every episode carries three `<podcast:transcript>` links (`application/srt`, `text/vtt`, `text/plain`, language en) at `api.omny.fm/orgs/<org>/clips/<clip>/transcript?format=...`; 62 episodes × 3 in the first 250 KB of NFL Daily; same pattern in all six feeds (96–186 tags each)
- History · Live: per-episode, as far back as the feed · near-live (with each episode)
- Technical: RSS + plain HTTP GET · text · Auth: none
- Cost: free
- Licensing: every feed's `<copyright>`: "2026 iHeartMedia, Inc. © Any use of this intellectual property for text and data mining or computational analysis including as training material for artificial intelligence systems is strictly prohibited without express written consent from iHeartMedia" · display: not granted · AI/ML: prohibited
- Quality: machine transcripts (quality not inspected; only a HEAD request was made: HTTP 200 text/plain)
- Scores: Q ~7 / Cov 6 / Rel 8 / Lat 8 / Hist 6 / Doc 4 / DX 9 / Cost 10 / Lic 1 / Com 1 / RL ~6 / NFL 8 = **6.2**
- Recommendation: AVOID for any processing (claim extraction, search, summaries, LLM input). Linking a listener to the transcript URL is the most that is defensible without iHeart's consent. This also rules out local Whisper transcription of these six shows (§2D Whisper).
- Verified: 2026-11-25 — first 250 KB of all six feeds read; one transcript URL checked with HEAD only (content not downloaded).

### Other major NFL podcasts — transcript availability
- Feeds (found via iTunes Search API): The Pat McAfee Show, Fantasy Focus Football, Move the Sticks with Daniel Jeremiah, The Rich Eisen Show (all megaphone.fm, "Copyright 2026, ESPN. All Rights Reserved."), The Ringer NFL Show (megaphone, "© All rights reserved"), Pardon My Take (Barstool), The Athletic Football Show (Acast), The PFF NFL Podcast (Simplecast)
- Finding: **0 `podcast:transcript` tags** in the first 200 KB of each of the eight feeds; all newest episodes Nov. 19–25, 2026.
- Recommendation: list/link episodes only (as today's `podcasts-nfl` does for the league's shows); no transcripts available without transcribing, which raises the Whisper question below.
- Verified: 2026-11-25 — eight feeds read (first 200 KB).

### YouTube Data API v3 — `captions.download`
- Links: https://developers.google.com/youtube/v3/docs/captions/download · https://developers.google.com/youtube/terms/developer-policies
- Category · Class: video captions · 🟢 Official API, but not available for others' videos
- Facts: requires OAuth (`youtube.force-ssl` or `youtubepartner`); "This method requires the user to have permission to edit the video"; 200 units/call; `captions.list` 50 units. Developer Policies bar scraping YouTube and bar downloading/caching "copies of YouTube audiovisual content" without prior written approval.
- Scores: Q 8 / Cov 2 / Rel 9 / Lat 7 / Hist 7 / Doc 9 / DX 5 / Cost 9 / Lic 2 / Com 2 / RL 6 / NFL 5 = **5.9**
- Recommendation: AVOID — only a club itself (or a club granting OAuth) could fetch its press-conference captions. Confirms FEATURE_RESEARCH §6.
- Verified: 2026-11-25 — both pages read.

### ASAP Sports — FastScripts transcripts
- Links: http://www.asapsports.com/ · football category `showcat.php?id=1`
- Category · Class: press-conference transcripts · 🟡 (commercial transcription service; site public)
- Finding: the football category's newest 15 entries (Nov. 10–24, 2026) are all college (Iowa, Penn State, Notre Dame, Indiana, CFP); no NFL regular-season transcripts seen; terms link not found on the home page (UNVERIFIED)
- Scores: Q 8 / Cov 1 / Rel ~7 / Lat 6 / Hist 8 / Doc 1 / DX 3 / Cost 10 / Lic ~2 / Com ~2 / RL ~5 / NFL 2 = **4.6**
- Recommendation: AVOID for regular season; possibly relevant around Super Bowl week (UNVERIFIED).
- Verified: 2026-11-25 — home and football category pages read.

### Team-site and NFL Communications transcripts
- Six club `/rss/news` feeds sampled (NE 5 items, GB 100, BUF 10, PHI 100, KC 20, DAL 100): **0 items titled "transcript"** today. NFL Communications' media material sits behind `login.nfl.net` registration.
- Club terms already block automated use (registry, F14).
- Recommendation: link to club press-conference pages and official YouTube uploads (already done); no transcript ingestion.
- Verified: 2026-11-25.

### Local Whisper-class transcription — legal considerations (approach, not a source)
- Facts: the league's six feeds expressly prohibit "text and data mining or computational analysis" without iHeartMedia's consent (feed `<copyright>`); ESPN-produced shows reserve all rights; YouTube policies bar downloading audiovisual content.
- Inference (not legal advice): transcribing makes a full copy of the spoken work; for a public product, quotation of short claims with attribution may be defensible as fair use in the US, but an express TDM reservation weakens that and would bind in the EU (DSM Directive Art. 4 opt-out). FEATURE_RESEARCH §6 calls local transcription "lower risk for private use"; that holds at most for shows without such a notice, and **not** for the six league feeds.
- Recommendation: AVOID for the league feeds; owner decision for others, private only, never store transcripts, short own-words claims with episode URL and timestamp.
- Verified: 2026-11-25 — feed copyright notices read (above); legal reading is inference, not legal advice.

### 2E. Social platforms

### X Corp — X API v2 (pay-per-use)
- Links: https://docs.x.com/x-api/getting-started/pricing · https://docs.x.com/x-api/getting-started/about-x-api · Developer Agreement https://docs.x.com/developer-terms/agreement.md (Last Updated Apr. 27, 2026) · Display Requirements https://docs.x.com/developer-terms/display-requirements.md
- Category · Class: social posts · 🟡 Licensed/commercial
- Provides: posts, users, lists, spaces, community notes, trends, counts; webhooks (Activity API)
- History · Live: full archive via search (cost per resource) · yes · real time
- Coverage: where NFL insiders, teams and the league are most active (not measured here)
- Technical: REST + webhooks · JSON · Auth: OAuth 2.0 / bearer · Rate limits: pay-per-usage capped at 3 million post reads per monthly billing cycle; Enterprise above · Dedup: a resource read twice in one UTC day billed once ("soft guarantee")
- Cost: "X API v2 uses pay-per-usage pricing" (credits; no subscription on the page): post read $0.005/resource; user read $0.010; owned reads $0.001; post create $0.015 ($0.200 with URL); counts recent $0.005/request; trends $0.010. Free tier: not on the page (third-party reports say discontinued for new developers Feb. 6, 2026 — UNVERIFIED); $20 promotional credit after first purchase. **Est. monthly for a small app:** following 50 accounts × ~15 posts/day ≈ 22,500 post reads ≈ **$112/month**; 200 accounts ≈ $450.
- Licensing: commercial use requires a commercial designation ("If your Services are designated as 'non-commercial,' you shall not make Commercial Use", §III(B)); no redistribution except as permitted (§III(A)(d)); copy "a reasonable amount" for display (§II(A)(2)); delete/modify removed content "as soon as possible", within 24 h of X's request (§IV(B)); **bars using X content to "fine-tune or train a foundation or frontier model"** (§III(A)(k)); display rules: unmodified text, avatar, name, @handle, linked timestamp, X logo, actions; embeds "strongly encourage[d]"
- Quality: highest-signal insider source; cost scales with reads
- Scores: Q 9 / Cov 9 / Rel 8 / Lat 10 / Hist 8 / Doc 8 / DX 7 / Cost 3 / Lic 4 / Com 6 / RL 6 / NFL 10 = **7.3**
- Recommendation: OPTIONAL now (owner decision, paid key), PRIMARY social source for a commercial product. A curated list of ~30–60 insiders/teams is the affordable design.
- Verified: 2026-11-25 — pricing, overview, agreement and display pages read; unauthenticated `api.x.com/2/tweets/search/recent` → 401.

### X Corp — oEmbed / embedded posts (publish.x.com)
- Links: `https://publish.x.com/oembed?url=...` (probed); old `publish.twitter.com/oembed` → 301
- Category · Class: embed · 🟢 Official
- Provides: embed HTML (`blockquote.twitter-timeline` + `platform.x.com/widgets.js`); no key; `cache_age` 3,153,600,000 s
- Licensing: embeds are the preferred display route; Developer Agreement §III(K) bars putting X content "within an iframe ... or any similar embedding mechanism" other than X's own embeds; sites above 10 million daily embed impressions must contact X (search snippet)
- Limits: needs X's script; claude.ai's viewer blocks outside scripts (MEDIA_ARCHITECTURE), so on the published page it degrades to a link
- Scores: Q 8 / Cov 8 / Rel 7 / Lat 9 / Hist 6 / Doc 6 / DX 8 / Cost 10 / Lic 7 / Com 7 / RL ~7 / NFL 8 = **7.6**
- Recommendation: SECONDARY — show hand-picked insider posts (chosen by a human or from another source) as embeds on Render/local; links on claude.ai. Not a discovery source (needs post URLs).
- Verified: 2026-11-25 — profile oEmbed HTTP 200 JSON.

### Bluesky Social PBC — public AppView (XRPC) for curated accounts
- Links: `https://public.api.bsky.app/xrpc/...` · rate limits (docs source) https://github.com/bluesky-social/bsky-docs/blob/main/docs/advanced-guides/rate-limits.md · developer guidelines https://github.com/bluesky-social/bsky-docs/blob/main/docs/support/developer-guidelines.md · ToS https://bsky.social/about/support/tos (Last Updated Aug. 14, 2025). Note: docs.bsky.app now 308-redirects to bsky.network (client-rendered).
- Category · Class: social posts · 🔵 Public/open (open protocol; authors keep copyright)
- Provides: `app.bsky.actor.getProfile`, `app.bsky.feed.getAuthorFeed` (posts, times, embeds, links), `searchActors`; `searchPosts` **403 on public.api.bsky.app** but answered unauthenticated on `api.bsky.app` (undocumented whether intended for automated use)
- History · Live: full account history via cursor · yes · seconds (Rapoport's newest post 20:24 UTC seen at ~22:50)
- Coverage (probed today): **active**: Ian Rapoport (`rapsheet.bsky.social`, verified, 222,589 followers, 4,154 posts, posting today), ProFootballTalk (36,471 followers, 30,303 posts, posting every few minutes), AP (`apnews.com`, verified), Mina Kimes (verified), Nick Baumgardner (The Athletic, verified), Matt Lombardo (verified), Arif Hasan (verified), Tim McManus (ESPN, Nov. 23), Ben Standig (Nov. 11); **dormant or near-dormant**: Adam Schefter (3 posts ever), Tom Pelissero (last Nov. 20, monthly), ESPN (last Sept. 8), Jonathan Jones (Aug. 2026), Brooke Pryor (Mar. 2025), "NFL Network" account (unverified, last July 2025); **teams**: no verified club account found; Packers-named account (Nov. 7, unverified), Eagles-named (Sept. 20), Lions-named (Jan. 2025), "seahawksofficial.com" (Mar. 2025, not the club's domain), Chiefs-named (1 post). The NFL itself: `nfl.com` and `nfl.bsky.social` handles do not resolve.
- Technical: REST (XRPC) · JSON · SDK: official TS/Python (not needed; plain fetch) · Auth: none on the AppView ("These direct endpoints do not support authentication") · Rate limits: AppView "generous", unspecified; PDS 3,000 requests per 5 min per IP · Pagination: cursor
- Cost: free
- Licensing: Bluesky ToS licenses content to Bluesky, says "Bluesky does not control how others may use your Content"; no third-party AI or scraping clause; developer guidelines require a way to delete content a user deleted, and report/block mechanisms only for apps with user-generated content · AI/ML: Bluesky's March 2025 "user intents" proposal (TechCrunch, search snippet) — adoption UNVERIFIED · redistribution of post text: authors' copyright; safest to link or use the official embed
- Quality: high for the few active insiders; low coverage of clubs and beat writers vs X
- Scores: Q 7 / Cov 4 / Rel 8 / Lat 9 / Hist 7 / Doc 7 / DX 9 / Cost 10 / Lic 7 / Com 7 / RL 8 / NFL 6 = **7.4**
- Recommendation: PRIMARY free social source — a curated, verified list of active insiders read with `getAuthorFeed` every 10–15 min from GitHub/Render; show handle, time, link (or the official embed); honor deletions on each refresh. Reachability from GitHub: UNVERIFIED (BunnyCDN; no block seen from the Mac).
- Verified: 2026-11-25 — ~40 profile/feed calls; rate-limit and guideline sources read on GitHub; ToS read.

### Bluesky Social PBC — Jetstream (firehose JSON)
- Links: https://github.com/bluesky-social/jetstream (MIT/Apache-2.0, pushed 2026-11-25) · 2024 announcement (docs source) lists `jetstream1/2.us-east.bsky.network`, `jetstream1/2.us-west.bsky.network`
- Category · Class: social firehose · 🔵 Public/open · ⚫ evolving (README now "Full-network archive, replay, and streaming service"; original code moved to `jetstream-legacy`)
- Provides: all network events as JSON over WebSocket, filterable by collection and DID, with cursor replay (filter names per the 2024 post; replay window UNVERIFIED today)
- Technical: WebSocket · JSON · Auth: none · all three probed hosts answered HTTP 426 (upgrade required) to a plain GET
- Fit: Node 18 has no built-in WebSocket client and the project takes no npm dependencies; a long-lived socket does not fit scheduled GitHub jobs. Polling `getAuthorFeed` for a curated list is enough at this scale.
- Scores: Q 7 / Cov 5 / Rel 7 / Lat 10 / Hist 5 / Doc 6 / DX 5 / Cost 10 / Lic 7 / Com 7 / RL 8 / NFL 5 = **6.8**
- Recommendation: OPTIONAL (local server or a future always-on service; needed only for broad keyword/sentiment sampling).
- Verified: 2026-11-25 — README and blog source read; endpoints answer 426.

### Bluesky — oEmbed (`embed.bsky.app/oembed`)
- Provides: embed HTML (`blockquote.bluesky-embed`), author name/URL, `cache_age` 86,400; post URLs only ("only bsky.app post URLs currently supported")
- Scores: Q 8 / Cov 4 / Rel 8 / Lat 9 / Hist 6 / Doc 5 / DX 9 / Cost 10 / Lic 8 / Com 8 / RL ~7 / NFL 6 = **7.3**
- Recommendation: SECONDARY — display path for the Bluesky items above (degrades to links on claude.ai).
- Verified: 2026-11-25 — post oEmbed HTTP 200; profile URL → 400.

### Meta — Threads API (keyword search)
- Links: https://developers.facebook.com/docs/threads/keyword-search
- Category · Class: social posts · 🟡 Official API with approval
- Facts: `threads_keyword_search` + `threads_basic` permissions; without approval, search covers only the authenticated user's own posts; "A user can send a maximum of 2,200 queries within a rolling 24-hour period"; limit ≤100 per query; sensitive keywords return nothing; `owner` field not returned; data back to July 2023 (`since` ≥ 1688540400)
- Cost: free API (Meta app + review); terms for display/storage not read (UNVERIFIED)
- Scores: Q 6 / Cov 5 / Rel 7 / Lat 8 / Hist 6 / Doc 7 / DX 5 / Cost 9 / Lic ~5 / Com ~5 / RL 6 / NFL 5 = **6.2**
- Recommendation: OPTIONAL — needs a Meta app, a Threads account and approval (owner actions); NFL insider presence on Threads not measured.
- Verified: 2026-11-25 — docs page read.

### Mastodon — hashtag timelines
- Probe: `https://mastodon.social/api/v1/timelines/tag/nfl?limit=5` → 200 without auth; 4 of 5 newest posts from one bot account (`Blitz_Burgh@sportsbots.xyz`)
- Licensing: per-instance terms; authors' copyright
- Scores: Q 3 / Cov 2 / Rel 6 / Lat 8 / Hist 4 / Doc 7 / DX 8 / Cost 10 / Lic 5 / Com 5 / RL ~6 / NFL 2 = **5.5**
- Recommendation: AVOID — negligible NFL signal.
- Verified: 2026-11-25.

### Reddit — Data API (r/nfl and team subreddits)
- Links: Developer Terms https://www.redditinc.com/policies/developer-terms ("Effective September 24, 2024. Last Revised March 24, 2026"; read via curl — our fetch tool is blocked from redditinc.com) · Responsible Builder Policy (support.reddithelp.com returned 403; announced in r/redditdev Nov. 11, 2025 per mirrored threads)
- Category · Class: forum posts/comments · 🟡 Licensed (approval required)
- Facts: anonymous `www.reddit.com/r/nfl/new.json` → **403** from the Mac; `/r/nfl/.rss` → 404 Atom "Not Found". Developer Terms: fees "at Reddit's sole discretion"; commercial use or "research in excess of rate limits" needs "a separate agreement with Reddit"; no use of User Content "for training a machine learning or artificial intelligence model" without rightsholders' permission, and no use of Reddit data to train AI "without our permission"; attribution by linking back to the content; delete/modify content that is deleted or removed "as soon as possible". Approval before any API access (Responsible Builder Policy, per secondary sources: "request access and get explicit approval"). Free rate 100 queries/min per OAuth client (secondary source — UNVERIFIED).
- Cost: free non-commercial after approval; commercial by contract (price UNVERIFIED)
- Scores: Q 6 / Cov 8 / Rel 5 / Lat 8 / Hist 6 / Doc 5 / DX 4 / Cost 7 / Lic 2 / Com 2 / RL 6 / NFL 8 = **5.6**
- Recommendation: OPTIONAL (owner decision) for fan-sentiment research only after approval; AVOID on GitHub (blocked anonymously; would need OAuth secrets and approval). No AI training on it.
- Verified: 2026-11-25 — Developer Terms read (curl); endpoints probed; policy pages blocked.

### Google — YouTube Data API v3 (metadata, live status, comments)
- Links: quota https://developers.google.com/youtube/v3/determine_quota_cost · policies https://developers.google.com/youtube/terms/developer-policies
- Category · Class: video metadata · 🟢 Official
- Quota (as the page reads today): 10,000 units/day "combined for all other endpoints"; `search.list` and `videos.insert` "have their own quota buckets ... default daily limit of 100 per day", "The quota cost is 1 per call"; `videos.list`, `channels.list`, `playlistItems.list`, `commentThreads.list`, `comments.list` 1 unit each; `captions.list` 50; `captions.download` 200
- Policies: delete or refresh stored API data after 30 days; "Do not aggregate API Data" except within one content owner; do not "create new or derived data or metrics" from API data (III.E.4.h); no scraping
- Use: `videos.list` (liveBroadcastContent, madeForKids) for the open DEC-022 items costs 1 unit per 50 ids
- Scores: Q 9 / Cov 8 / Rel 9 / Lat 8 / Hist 8 / Doc 9 / DX 7 / Cost 9 / Lic 5 / Com 6 / RL 7 / NFL 7 = **7.7**
- Recommendation: SECONDARY (owner decision: key) — useful for live status and Made-for-Kids checks; **AVOID comment sentiment** (aggregation and derived-metric bans).
- Verified: 2026-11-25 — quota page read twice; policies read.

### Meta — Instagram/Facebook oEmbed
- Links: https://developers.facebook.com/docs/instagram-platform/oembed · reference https://developers.facebook.com/docs/graph-api/reference/instagram-oembed/
- Facts: "only meant to be used for embedding Instagram content in websites and apps"; analytics use of the metadata prohibited; up to 1,000 requests/hour; examples use an `{access-token}` placeholder (token type and App Review requirement not stated on the pages read — UNVERIFIED); a tokenless probe with a fake post id returned OAuthException "Media Not Found"
- Scores: Q 7 / Cov 6 / Rel 7 / Lat 8 / Hist 5 / Doc 6 / DX 4 / Cost 9 / Lic 5 / Com 5 / RL 7 / NFL 5 = **6.2**
- Recommendation: OPTIONAL — embed-only; no data mining.
- Verified: 2026-11-25 — both pages read; one probe.

### TikTok — oEmbed / Embed Player; Research API
- Links: https://developers.tiktok.com/doc/embed-videos · https://developers.tiktok.com/products/research-api/ · Research Tools terms (effective Jan. 22, 2026) https://www.tiktok.com/legal/page/global/terms-of-service-research-api/en
- Facts: `www.tiktok.com/oembed?url=` needs no key (profile probe HTTP 200 for `@nfl`); "Embed Videos will be deprecated soon" in favour of Embed Player. Research API: academic institutions (US, EEA, UK, CH, CA; some non-profits in beta), "independent of commercial interests"; refresh data "at least every thirty (30) days" and delete what disappeared; quota "determined by TikTok at its sole discretion"; TikTok gets a copy 7 days before publication.
- Scores: Q 6 / Cov 5 / Rel 6 / Lat 8 / Hist 4 / Doc 6 / DX 6 / Cost 10 / Lic 4 / Com 3 / RL ~5 / NFL 5 = **5.7**
- Recommendation: OPTIONAL embed of specific official NFL TikToks (owner choice); Research API AVOID (not eligible).
- Verified: 2026-11-25 — pages read; oEmbed probe.

### 2F. Podcast directories

### Podcast Index LLC — Podcast Index API
- Links: terms https://github.com/Podcastindex-org/legal/blob/main/TermsOfService.md (v1.1, Mar. 2, 2021) · docs source https://github.com/Podcastindex-org/docs-api (MIT, pushed 2026-07-08) · podcastindex.org returned 403 to our fetch tool
- Category · Class: podcast directory · 🔵 Public/open (free key)
- Provides: feeds, episodes, search, by-iTunes-id, `podcast:` namespace fields including transcripts
- Technical: REST · JSON · Auth: free key + secret with hashed auth headers (per client READMEs, search snippet) · Rate limits: "Podcast Index sets and enforces limits ... in our sole discretion" (§2.4)
- Licensing: ToS v1.1: use only as documented; comply with third-party rights; Wikipedia says the database is MIT and downloadable (secondary, UNVERIFIED)
- Scores: Q 7 / Cov 8 / Rel ~7 / Lat 7 / Hist 7 / Doc 7 / DX 7 / Cost 10 / Lic 7 / Com 7 / RL ~6 / NFL 5 = **7.1**
- Recommendation: SECONDARY — the lawful way to discover more NFL podcast feeds (owner creates the key). Feed content rights stay with each publisher.
- Verified: 2026-11-25 — ToS read on GitHub.

### Apple — iTunes Search API
- Links: https://performance-partners.apple.com/search-api
- Facts: "approximately 20 calls per minute (subject to change)"; results 1–200; promotional content "only to promote store content"; link with store badges; cache recommended
- Scores: Q 7 / Cov 8 / Rel 8 / Lat 6 / Hist 5 / Doc 7 / DX 9 / Cost 10 / Lic 5 / Com 5 / RL 4 / NFL 4 = **6.5**
- Recommendation: OPTIONAL — one-off lookup of feed URLs (used in this research: 8 lookups); not a display source.
- Verified: 2026-11-25 — page read; 8 queries answered.

### Spotify — Web API
- Links: https://developer.spotify.com/terms (Version 10, effective May 15, 2025)
- Facts: no "ingesting Spotify Content into a machine learning or AI model"; apps for private personal use; no selling Spotify content; caching only as strictly necessary
- Scores: Q 7 / Cov 7 / Rel 8 / Lat 7 / Hist 5 / Doc 8 / DX 7 / Cost 10 / Lic 2 / Com 2 / RL ~6 / NFL 3 = **6.0**
- Recommendation: AVOID — RSS + Podcast Index cover the need without these restrictions.
- Verified: 2026-11-25 — terms read.

### 2G. Video, highlights and images

### NFL — NFL.com video, NFL Films, NFL+
- Links: NFL.com Terms https://www.nfl.com/legal/terms (last updated May 16, 2024) · NFL Films licensing disclaimer (page returned HTTP 500 today)
- Facts: NFL.com terms: "Systematic retrieval of data or other content" prohibited without written consent (§1.3); use "solely for your own individual non-commercial and informational purposes" (§1.3); link to the home page without permission, deep links need approval (§8); "Modular Content" may be incorporated "via an RSS feed" subject to the agreement (§6), but NFL.com's RSS URL returns HTML (registry). Search snippets: NFL Films "is the exclusive copyright holder in and to all NFL Footage" (not re-read).
- Recommendation: AVOID any NFL.com video ingestion; official YouTube embeds (already wired, DEC-017/022) remain the lawful free route. Commercial highlights need an NFL licence.
- Verified: 2026-11-25 — NFL.com terms read; NFL Films page HTTP 500.

### WSC Sports — automated highlights (B2B)
- Facts (Sofascore's own articles, search snippets, autumn 2026): Sofascore shows "in-game NFL highlights" worldwide through a WSC Sports partnership, usually 10+ clips per game. WSC's deals are with rights holders/licensed platforms; no public API.
- Recommendation: AVOID (not available to a fan project); commercial only through the NFL/WSC.
- Verified: UNVERIFIED (search snippets only)

### Imagn Images (USA TODAY Network) — editorial sports photos
- Links: https://www.imagn.com/services · api.imagn.com (not read)
- Facts: "All content subject to terms of License Agreement"; "Any use without specific permission is a violation of federal law"; 300+ photographers, 10,000+ events/year; sales now via Reuters (search snippet, UNVERIFIED)
- Recommendation: OPTIONAL (commercial) for licensed game photos; price by quote.
- Verified: 2026-11-25 — services page read.

### Getty Images — sports editorial
- Finding: no source found naming Getty as an NFL photo partner (Getty newsroom results cover MLS, MLB, CFP, WWE). UNVERIFIED.
- Recommendation: OPTIONAL (commercial) — standard editorial licences by quote.
- Verified: UNVERIFIED (search results only; no Getty page read)

### Wikimedia Commons — player photos
- Links: https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia · https://commons.wikimedia.org/wiki/Template:Personality_rights · APIs: `en.wikipedia.org/w/api.php?prop=pageimages`, `commons.wikimedia.org/w/api.php?prop=imageinfo&iiprop=extmetadata`
- Category · Class: free-licensed photos · 🔵 Public/open
- Probe: lead images of Mahomes, Allen, Hurts, L. Jackson, Burrow are CC BY-SA 2.0 (3), CC BY 2.0 (1), CC BY 3.0 (1); the Mahomes file carries a `trademarked` restriction flag; `extmetadata` gives licence, artist and restrictions machine-readably
- Licensing: credit the author, link the licence, share-alike for adaptations; "commercial use of images of people may require the explicit agreement of the subject"; personality rights and trademarks (uniform logos) are separate; hotlinking "allowed but not recommended"
- Fit: claude.ai's viewer blocks outside images, so files would be copied into the page with attribution
- Scores: Q 6 / Cov 6 / Rel 8 / Lat 3 / Hist 8 / Doc 8 / DX 8 / Cost 10 / Lic 7 / Com 6 / RL 8 / NFL 6 = **7.0**
- Recommendation: SECONDARY — the only free, lawful player-photo route; editorial (identification) use with per-file credit; avoid files flagged `trademarked` or showing club marks prominently.
- Verified: 2026-11-25 — two Commons pages read; 10 API calls.

### Team websites — photos
- Registry: every club's terms reserve content (F14). Recommendation: AVOID copying club photos; link only.
- Verified: 2026-11-23 (registry, club terms research); not re-checked today.

### 2H. Social listening and sentiment tools (commercial)

### Sprout Social — Listening add-on
- Facts: seats $79 (annual) / $99 (monthly) Essentials, $199 Standard, $299 Professional, $399 Advanced per seat per month; "Premium Analytics and Listening are each available as individual add-ons to the Standard plan and up" — listening price not published (demo)
- Scores: Q 7 / Cov 7 / Rel 8 / Lat 7 / Hist 5 / Doc 6 / DX 5 / Cost 2 / Lic 6 / Com 8 / RL ~6 / NFL 4 = **5.9**
- Recommendation: AVOID for this project; option for a commercial product's marketing team only.
- Verified: 2026-11-25 — pricing page read.

### Brandwatch — Consumer Intelligence
- Facts: no prices published; "Standard" and "Enterprise" per solution; demo request
- Scores: not scored (no price, terms not read)
- Recommendation: OPTIONAL (commercial, enterprise budget).
- Verified: 2026-11-25 — pricing page read.

### Talkwalker (page brands it "Lumen by Talkwalker") — listening
- Facts: plans Core, Analyze, Business; "Pick your plan to get a custom quote"; no prices; ownership not stated on the page (Hootsuite acquisition not confirmed here)
- Scores: not scored
- Recommendation: OPTIONAL (commercial, enterprise budget).
- Verified: 2026-11-25 — pricing page read.

## R10. Historical data, open source, academic, college, draft

Evidence file: [tracks/R10-historical-opensource-draft.md](tracks/R10-historical-opensource-draft.md) (matrix rows, research log and the track's own notes).

### Part A — nflverse release data (validated asset by asset)

Method: `gh api repos/nflverse/nflverse-data/releases --paginate` listed **25 release tags and 4,367 assets** (saved locally to the scratchpad, not the repository). First season = earliest per-season asset name; "newest asset" = max `updated_at` per tag; small files (combine, draft_picks, officials, ESPN QBR, schedules, trades, snap_counts_2012) were downloaded and parsed to confirm season ranges and columns. Loader docs from `nflverse/nflreadr` `R/load_*.R` (read via `gh api`). Schedule from https://nflreadr.nflverse.com/articles/nflverse_data_schedule.html (read).

#### nflverse-data release tags (all 25)

| Tag | Assets | Newest asset `updated_at` | Seasons in asset names / parsed | Upstream (per nflreadr) | Licence of the data | Status note |
|---|---|---|---|---|---|---|
| pbp | 164 | 2026-11-25 19:12 | 1999–2026 (`.zip` only to 2021) | NFL game feed via nflfastR (`nflverse-pbp`) | CC-BY-4.0 | Nightly; pbp of 2023–2025 rewritten today too (stat-correction / model re-runs) |
| player_stats | 1,822 | **2025-05-07** | 1999–2024 | computed from pbp | CC-BY-4.0 | **Frozen/legacy**: superseded by `stats_player` (no 2025/2026 files) |
| stats_player | 554 | 2026-11-25 19:13 | 1999–2026 (week, reg, post, regpost) | computed from pbp | CC-BY-4.0 | Current player stats |
| stats_team | 554 | 2026-11-25 19:13 | 1999–2026 | computed from pbp | CC-BY-4.0 | Current team stats |
| schedules | 6 | 2026-11-25 22:36 | 1999–2026 (7,548 games) | Lee Sharpe `nfldata` games | CC-BY-4.0 tag; nfldata repo has no licence | Every 5 min in season; content identical to `nfldata/data/games.csv` except 5 `spread_line` cells (2013–2017) |
| rosters | 434 | 2026-11-25 17:59 | **1920–2026** | nflverse-rosters (old years presumably PFR — inference; `misc/pfr_rosters` exists) | CC-BY-4.0 | Daily 07:00 UTC |
| weekly_rosters | 104 | 2026-11-25 17:59 | **2002–2026** | nflverse-rosters | CC-BY-4.0 | Daily |
| players | 7 | 2026-11-25 18:30 | all-time player table | nflverse-players (NFL basis, PFR, ESPN, OTC, PFF ids) | CC-BY-4.0 | Nightly |
| players_components | 12 | 2026-11-25 17:50 | – | ditto (OTC/PFF id components) | CC-BY-4.0 | Internal building blocks |
| depth_charts | 109 | 2026-11-25 17:56 | 2001–2026 | nflverse-rosters; **source changed after 2024** | CC-BY-4.0 | 2025+ files are timestamped snapshots, ~15–25× larger (2025: 52.9 MB, 2026: 80.2 MB vs ~3.4 MB/yr before) |
| injuries | 77 | 2026-11-25 17:59 | 2009–2026 | NFL injury reports via nflverse-rosters | CC-BY-4.0 | Daily in season |
| snap_counts | 77 | 2026-11-24 12:01 | asset 2012–2026, **but `snap_counts_2012.csv` is 154 bytes = header only → real data 2013+** | **scraped from PFR** (`nflverse-pfr`, GPL-3.0 code) | CC-BY-4.0 label; PFR ToU applies upstream | 4×/day in season |
| pfr_advstats | 209 | 2026-11-25 21:11 | 2018–2026 (weekly + season pass/rush/rec/def) | **scraped from PFR** | as above | 4×/day; per-year `advstats_season_pass_2026` absent (combined file present) |
| nextgen_stats | 95 | 2026-11-25 17:44 | 2016–2024 per-year files + combined `ngs_passing/receiving/rushing` (all years incl. 2026) | NFL Next Gen Stats site (`ngs-data`) | CC-BY-4.0 label; NFL owns NGS | Nightly in season |
| ftn_charting | 21 | 2026-11-25 12:01 | 2022–2026 | FTN Data (manual charting) | **CC-BY-SA 4.0**, "FTN Data via nflverse" | 4×/day in season |
| pbp_participation | 46 | **2026-02-10** | 2016–2025 (+ `old_2023`) | NGS to 2022; **FTN from 2023** | **NGS years: credit "NFL NextGenStats via nflverse"; 2023+: CC-BY-SA 4.0 "FTN Data via nflverse"** | Not updated in season; released after the Super Bowl, so no 2026 file until ~Feb 2027 |
| espn_data (QBR) | 12 | 2026-11-25 18:55 | 2006–2026 (season and week level) | ESPN QBR | CC-BY-4.0 label; ESPN owns QBR; Disney ToU | Updated today |
| officials | 7 | 2026-09-02 | 2015–2026, **but 2026 has week 1 only (112 rows)** | NFL game data | CC-BY-4.0 | **Stale since Sept 2**: weeks 2–12 of 2026 missing. `nfldata/data/officials.csv` has 1999–2026 week 5 (last commit 2026-10-09) |
| trades | 7 | 2026-05-19 | 2002-03-04 → **2026-04-17** (4,975 rows) | "via PFR / Lee Sharpe" | CC-BY-4.0 label; PFR upstream | **Stale**: no in-season 2026 trades (deadline trades absent) |
| draft_picks | 7 | 2026-11-25 15:09 | 1980–2026 (12,927 picks) | PFR | CC-BY-4.0 label; PFR upstream | Fields include `hof`, `allpro`, `probowls`, `w_av`, `car_av`, `dr_av`, `seasons_started` |
| combine | 7 | 2026-03-12 | 2000–2026 (8,968 rows; 319 in 2026) | PFR | CC-BY-4.0 label; PFR upstream | Yearly after the combine; fields: ht, wt, forty, bench, vertical, broad_jump, cone, shuttle, draft round/pick, `pfr_id`, `cfb_id` |
| contracts | 7 | 2026-11-25 18:00 | historical, all active and past contracts | **scraped from OverTheCap pages** (`nflverse/rotc`, `httr2` request to `overthecap.com/contract-history/`) | CC-BY-4.0 label; **OTC terms bar systematic retrieval to compile a database without written consent** | Daily |
| teams | 7 | 2026-03-27 | 32 teams + historic | nflverse | CC-BY-4.0 (logo URLs point to ESPN/Wikipedia images — trademarks, see registry) | Rarely changes |
| misc | 17 | 2026-09-16 | `pfr_rosters` (2022), pbp patch ids 2022/2023, `espn_draft_player_probs` (2023), multiple-lateral yards, `data_releases` | mixed | mixed | Housekeeping |
| test | 5 | 2024-08-23 | – | – | – | Ignore |

Not in nflverse-data releases but loaded by nflreadr: `load_ff_playerids()` and `load_ff_rankings()` read **dynastyprocess/data (GPL-3.0; rankings are FantasyPros ECR)**; `load_ff_opportunity()` reads **ffverse/ffopportunity releases (repo GPL-3.0), 2006+** (read in `R/load_ffverse.R`).

### nflverse — nflverse-data (release files, overall)
- Links: https://github.com/nflverse/nflverse-data/releases · https://nflreadr.nflverse.com/reference/ · https://github.com/nflverse/nflverse-data/blob/master/LICENSE.md · https://github.com/nflverse/nflverse-data
- Category · Class: historical + current-season stats/rosters/pbp · 🔵 Public/open data (with 🔴-scraped upstream components, see per-tag table)
- Provides: play-by-play with EPA/WP/CPOE, player/team stats, rosters 1920+, weekly rosters, depth charts, injuries, snap counts, NGS, PFR advanced, FTN charting, participation, officials, trades, draft, combine, contracts, ESPN QBR, players crosswalk, schedules with lines/weather/QBs/coaches/referee
- History · Live · Latency: 1920 (rosters) / 1999 (pbp) – 2026 · no (not live) · pbp "nightly after each game day, plus some game-day updates; raw pbp usually within 15 min of a game ending" (schedule page); schedules every 5 min in season; rosters/injuries/depth daily 07:00 UTC; PFR/FTN 4×/day
- Coverage: all 32 teams, regular season and playoffs; no preseason pbp in standard files
- Technical: GitHub release assets (download URLs `github.com/nflverse/nflverse-data/releases/download/<tag>/<file>`) · CSV, CSV.GZ, Parquet, RDS (`.qs` assets stopped updating Feb–Mar 2026 — inference: format being dropped) · SDK: nflreadr (R, MIT), nflreadpy (Python, MIT, Polars) · Auth: none · Rate limits: GitHub release CDN, none published for downloads (UNVERIFIED for heavy use)
- Cost: free: all · paid: none
- Licensing: commercial: CC-BY-4.0 allows it for nflverse's own contribution, but nflreadr's README says the NFL data "belong to their respective owners, and are governed by their terms of use" · redistribution: CC-BY (FTN/participation 2023+ CC-BY-SA: share-alike on derived datasets) · caching/storage: allowed by CC licences · attribution: "nflverse" (+ "FTN Data via nflverse", "NFL NextGenStats via nflverse") · other restrictions: upstream ToU of NFL, PFR, OTC, ESPN, FTN
- Quality: high (community-audited; play-level stat corrections re-pulled Wed–Thu) · complete for 1999+ · reliability: GitHub Actions, several workflows stale (officials, trades) · notes: per-tag gaps above
- Scores: Q 9 / Cov 9 / Rel ~8 / Lat 6 / Hist 9 / Doc 9 / DX 9 / Cost 10 / Lic ~7 / Com ~5 / RL ~8 / NFL 10 = **8.2**
- Recommendation: PRIMARY — historical backbone; treat PFR-, OTC- and ESPN-derived tags as "owner decision" for anything redistributed beyond a fan page
- Verified: 2026-11-25 — every tag listed, newest asset dates, 7 files parsed, licence file read, loader docs read

### nflverse — play-by-play (`pbp`) and nflfastR models
- Links: https://github.com/nflverse/nflverse-data/releases/tag/pbp · https://nflreadr.nflverse.com/articles/dictionary_pbp.html · CC-BY-4.0 (data), nflfastR code MIT · https://github.com/nflverse/nflfastR (558★, pushed 2026-11-25, not archived)
- Category · Class: play-by-play · 🔵 Public/open data
- Provides: every play with down, distance, yard line, clock, players, EPA, WP, vegas-adjusted WP, CPOE, xYAC, success
- History · Live · Latency: 1999–2026 · no · nightly; 2026 parquet updated 2026-11-25 19:09
- Coverage: regular season + postseason; 2026 CSV 57 MB so far (~100 MB a full season)
- Technical: files · CSV/Parquet/RDS (+ ZIP ≤2021) · SDK nflreadr/nflreadpy · Auth none · RL none published
- Cost: free · paid: none
- Licensing: commercial: CC-BY-4.0 on nflverse's work; NFL owns the underlying feed · redistribution: CC-BY · caching: yes · attribution: nflverse/nflfastR · other: nflfastR code MIT
- Quality: high; known patching (`misc/pbp_patch_ids_2022/2023`)
- Scores: Q 9 / Cov 9 / Rel 8 / Lat 6 / Hist 8 / Doc 9 / DX 8 / Cost 10 / Lic ~7 / Com ~5 / RL ~8 / NFL 10 = **8.1**
- Recommendation: PRIMARY for backtests, team efficiency, EP/WP refits. **Leakage warning:** `wp`, `vegas_wp`, `ep` columns were fitted on data that includes later seasons; for an honest backtest refit by season, or use only raw play fields
- Verified: 2026-11-25 — asset list (1999–2026), sizes, loader minimum season 1999 in `R/load_pbp.R`

### nflverse — participation (`pbp_participation`)
- Links: https://github.com/nflverse/nflverse-data/releases/tag/pbp_participation · loader `R/load_participation.R` · licence: NGS-years credit / FTN-years CC-BY-SA 4.0
- Category · Class: on-field personnel per play · 🔵 Public/open data
- Provides: offense/defense players on field, formation, personnel, defenders in box, coverage (fields per dictionary)
- History · Live · Latency: 2016–2025 · no · **once a year, after the postseason** (loader doc: "provided after all post-season games are completed")
- Coverage: NGS source "died during the 2023 season" (schedule page); 2023+ from FTN (files ~2.3× larger)
- Technical: files · CSV/Parquet/RDS · Auth none
- Cost: free
- Licensing: 2016–2022 credit "NFL NextGenStats via nflverse"; 2023+ CC-BY-SA 4.0 "FTN Data via nflverse" (share-alike applies to derived data we publish)
- Quality: good; source discontinuity at 2023 (different charting provider: do not pool naively)
- Scores: Q 8 / Cov 7 / Rel 7 / Lat 2 / Hist 6 / Doc 8 / DX 8 / Cost 10 / Lic 7 / Com ~5 / RL ~8 / NFL 8 = **7.0**
- Recommendation: OPTIONAL — historical personnel analysis only; never a current-season input
- Verified: 2026-11-25 — assets 2016–2025, newest 2026-02-10; licence text in loader

### nflverse — FTN charting (`ftn_charting`)
- Links: https://github.com/nflverse/nflverse-data/releases/tag/ftn_charting · https://ftnfantasy.com/stats/sports-data · CC-BY-SA 4.0
- Category · Class: manual play charting · 🔵 Public/open data (licensed by FTN to nflverse)
- Provides: play-action, RPO, screen, motion, blitz, catchable/contested/drops, QB location etc. (subset of FTN's paid charting)
- History · Live · Latency: 2022–2026 · no · 4×/day in season; 2026 file updated 2026-11-25 12:01
- Coverage: all games; 2026 so far 4.7 MB
- Technical: files · CSV/Parquet/RDS · Auth none
- Cost: free subset; full FTN data paid (contact FTN; pricing not checked — UNVERIFIED)
- Licensing: commercial allowed by CC-BY-SA but derived datasets must be CC-BY-SA; attribution "FTN Data via nflverse"
- Quality: manual charting; high but subjective fields
- Scores: Q 8 / Cov 7 / Rel 8 / Lat 6 / Hist 3 / Doc 8 / DX 8 / Cost 10 / Lic 7 / Com 6 / RL ~8 / NFL 8 = **7.2**
- Recommendation: SECONDARY — descriptive panels; share-alike makes it awkward to mix into a proprietary dataset
- Verified: 2026-11-25 — assets 2022–2026, loader licence text

### nflverse — injuries, depth charts, rosters, weekly rosters, players
- Links: release tags `injuries`, `depth_charts`, `rosters`, `weekly_rosters`, `players` · CC-BY-4.0 · https://github.com/nflverse/nflverse-players (5★, licence NOASSERTION; README: "INTERNAL NFLVERSE PACKAGE")
- Category · Class: rosters/injuries/identity · 🔵 Public/open data
- Provides: weekly injury report status and practice participation (2009+); depth charts (2001+, timestamped from 2025); season rosters (1920+); weekly rosters (2002+); `players.csv` ids gsis, esb, nfl, pfr, pff, otc, espn, smart (header read); season/weekly rosters add sportradar, yahoo, rotowire, fantasy_data and sleeper ids (header read)
- History · Live · Latency: injuries 2009–2026; depth 2001–2026; rosters 1920–2026; weekly rosters 2002–2026 · no · daily 07:00 UTC (schedule page); assets updated 2026-11-25 ~18:00 UTC
- Coverage: all teams; pre-1999 rosters thinner (CSV ~60–300 KB/yr in 1920s–80s vs ~1 MB now)
- Technical: files · CSV/Parquet/RDS · Auth none
- Cost: free
- Licensing: CC-BY-4.0; players table includes OTC and PFF ids (ids are facts; low risk). `headshot`/`headshot_url` columns point to NFL/ESPN images — copyrighted, do not hotlink or copy
- Quality: good; nflverse-players keeps a manual overwrite file for mismatched ids
- Scores: Q 8 / Cov 9 / Rel 8 / Lat 6 / Hist 9 / Doc 8 / DX 8 / Cost 10 / Lic 8 / Com ~6 / RL ~8 / NFL 10 = **8.2**
- Recommendation: PRIMARY (already wired for depth charts and weekly rosters)
- Verified: 2026-11-25 — assets/years, README of nflverse-players

### nflverse — snap counts and PFR advanced stats (`snap_counts`, `pfr_advstats`)
- Links: release tags · code https://github.com/nflverse/nflverse-pfr (**GPL-3.0**, 10★, pushed 2026-11-01) · underlying https://www.pro-football-reference.com
- Category · Class: player usage / advanced stats · 🔵 file, but 🔴 **scraped from PFR upstream**
- Provides: offense/defense/ST snaps and %; PFR advanced passing (pressures, bad throws, drops), rushing (YBC/YAC), receiving, defense (missed tackles, pressures)
- History · Live · Latency: snaps **2013**–2026 (2012 file header-only); advstats 2018–2026 · no · 4×/day in season, depends on PFR's own update
- Coverage: all games
- Technical: files · CSV/Parquet/RDS · Auth none
- Cost: free
- Licensing: nflverse CC-BY-4.0 label, but SR's Data Use page says building sites/tools from SR data needs permission and AI use needs permission (read 2026-11-25). **Owner decision**; for commercial use, avoid or license
- Quality: good; dependent on PFR schedule
- Scores: Q 8 / Cov 8 / Rel 7 / Lat 5 / Hist 6 / Doc 8 / DX 8 / Cost 10 / Lic ~4 / Com ~2 / RL ~8 / NFL 8 = **6.8**
- Recommendation: SECONDARY (fan page, with credit to PFR and nflverse); AVOID for a commercial product without SR permission
- Verified: 2026-11-25 — assets, 2012 file content, loader docs naming PFR

### nflverse — Next Gen Stats (`nextgen_stats`)
- Links: release tag · https://nextgenstats.nfl.com · code https://github.com/nflverse/ngs-data (MIT, 25★)
- Category · Class: tracking-derived aggregates · 🔵 file of 🟠 NFL site data
- Provides: weekly/season passing (time to throw, aggressiveness, CPOE), rushing (RYOE, efficiency), receiving (separation, cushion)
- History · Live · Latency: 2016–2026 · no · nightly 3–5 am ET in season
- Coverage: qualifying players only (thresholds)
- Technical: files · CSV/Parquet/RDS · Auth none
- Cost: free
- Licensing: NFL owns NGS; NFL.com terms apply upstream (not re-read in this track; see R-track on NFL official sources) · attribution nflverse + NGS
- Quality: high (official tracking) but thresholded
- Scores: Q 9 / Cov 6 / Rel 8 / Lat 6 / Hist 6 / Doc 8 / DX 8 / Cost 10 / Lic ~5 / Com ~3 / RL ~8 / NFL 8 = **7.1**
- Recommendation: SECONDARY — descriptive; owner decision for redistribution
- Verified: 2026-11-25 — assets

### nflverse — officials, trades, ESPN QBR, contracts, teams
- Links: release tags `officials`, `trades`, `espn_data`, `contracts`, `teams`; code https://github.com/nflverse/rotc (MIT, 0★) · OTC terms https://overthecap.com/terms-and-conditions
- Category · Class: reference / context · 🔵 files with 🔴 scraped upstream (trades from PFR, contracts from OTC pages, QBR from ESPN)
- Provides: officials per game (2015+); trades (2002+); QBR season/week (2006+); contracts (historical); team colours
- History · Live · Latency: officials 2015–2026 **week 1 only**; trades to 2026-04-17; QBR 2006–2026 (updated today); contracts updated today
- Technical: files · CSV/Parquet/RDS · Auth none
- Cost: free
- Licensing: **OTC terms (read 2026-11-25): content "solely for your own individual use"; "systematic retrieval … to create or compile any database" prohibited without written consent; licences via support@overthecap.com.** QBR is ESPN's proprietary metric (Disney ToU). Trades credit PFR
- Quality: officials/trades stale this season; QBR and contracts current
- Scores: Q 7 / Cov 6 / Rel 5 / Lat 4 / Hist 7 / Doc 7 / DX 8 / Cost 10 / Lic ~3 / Com ~2 / RL ~8 / NFL 7 = **6.2**
- Recommendation: OPTIONAL; contracts and QBR AVOID for redistribution without the owner accepting the risk; officials: use `nfldata/data/officials.csv` (fresher) or ESPN game summary
- Verified: 2026-11-25 — parsed officials, trades and QBR files; read rotc source and OTC terms

### nflverse — schedules (`schedules` tag) and `nflverse/nfldata` data files
- Links: https://github.com/nflverse/nfldata (381★, **no licence**, pushed 2026-11-25) · https://github.com/nflverse/nfldata/blob/master/DATASETS.md
- Category · Class: schedules, results, lines, standings · 🔵 Public/open data (unlicensed repo)
- Provides (files in `data/`, checked one by one): `games.csv` (1999–2026, lines, moneylines, roof, surface, temp, wind, rest, QBs, coaches, referee, stadium); `standings.csv` and `weekly_standings.csv` (2002–2026, updated 2026-11-24/25, include SOV and SOS); `officials.csv` (1999–2026 wk 5, last commit 2026-10-09); `draft_picks.csv`; `draft_values.csv` (Stuart/Johnson/Hill/OTC/PFF charts, 2021); `trades.csv`; `rosters.csv`; `teams.csv`; `predictions.csv` (a community pick'em contest, 31,207 rows, updated 2026-11-24); **frozen**: `closing_lines.csv` (2006–2018, last commit 2019-11-15), `initial_lines.csv` (2021 only), `sc_lines.csv` (2013–2020), `win_totals.csv` (2003–2020)
- History · Live · Latency: 1999–2026 · no · games/standings daily (commits today); schedules release every 5 min in season
- Coverage: all games; spread/total one line per game, source and timing undocumented (DATASETS.md still says games "begins with the 2006 NFL season" — outdated, file starts 1999)
- Technical: raw GitHub CSV/RDS · Auth none
- Cost: free
- Licensing: **no licence file** (facts; credit Lee Sharpe/nflverse); `nflverse-data` `schedules` tag republishes the same data under the CC-BY-4.0 repo licence — inference: prefer the release URL for a cleaner licence trail
- Quality: high, community-standard; frozen line files must not be mistaken for current
- Scores: Q 8 / Cov 8 / Rel 8 / Lat 7 / Hist 8 / Doc 7 / DX 9 / Cost 10 / Lic ~6 / Com ~5 / RL ~8 / NFL 10 = **7.8**
- Recommendation: PRIMARY (already used); switch to `releases/download/schedules/games.csv` as the canonical URL with nfldata raw as fallback (identical content today)
- Verified: 2026-11-25 — compared both files cell by cell (7,548 rows each; 5 cells differ, all `spread_line` 2013–2017); per-file last-commit dates via `gh api .../commits?path=`

### nflverse — nflreadpy / nflreadr (clients)
- Links: https://github.com/nflverse/nflreadpy (MIT, 253★, v0.1.5 2025-11-19, pushed 2026-10-30) · https://github.com/nflverse/nflreadr (MIT + file, 117★, v1.5.1.9002)
- Category · Class: client libraries · 🔵
- Provides: loaders for every dataset above, caching (env `NFLREADPY_CACHE`, `…_DURATION`), dictionaries
- Technical: Python (Polars) / R · not usable inside the stdlib build, but URLs and dictionaries are the reference
- Licensing: MIT (code may be adapted with notice)
- Scores: Q 9 / Cov 9 / Rel 8 / Lat – (n/a, use 6) / Hist 9 / Doc 9 / DX 8 / Cost 10 / Lic 10 / Com 9 / RL 8 / NFL 10 = **8.8**
- Recommendation: SECONDARY (reference; Python analysis outside the build). `nfl_data_py` archived 2025-09-25 — AVOID
- Verified: 2026-11-25 — `gh api` metadata, README

### Part B — Reference sites, historical datasets and public model forecasts

### Sports Reference — Pro Football Reference (PFR) website
- Links: https://www.pro-football-reference.com · terms: https://www.sports-reference.com/data_use.html (read), https://www.sports-reference.com/bot-traffic.html (read); Site Terms of Use clause 5 (not fetched: 2-request cap on SR sites)
- Category · Class: historical reference (all eras) · 🟠 Unofficial but commonly used as a website; 🔴 Scraping if automated
- Provides: season/team/player stats, box scores with game info, per-team "Vegas Lines" pages (search results show pages back to 1968; totals shown as 0.0 in 1968–69), Approximate Value (AV, "since 1960" per PFR's AV page — search snippet), unofficial snap counts from 2012 (PFR FAQ — search snippet), starting lineups/participation back to 1920 (PFR FAQ — search snippet), play-by-play back to 1978 (PFR blog, Aug 2025 — search snippet), officials, draft (all years), combine, awards, Hall of Fame, SRS
- History · Live · Latency: 1920–2026 · no · same-day after games (UNVERIFIED cadence)
- Coverage: every NFL season since 1920 (plus AFL/AAFC); best single historical reference
- Technical: HTML pages only; **no API** ("not our business model", bot-traffic page) · Auth none · **Rate limit: more than 20 requests a minute on PFR (10 on FBref/Stathead) puts a session "in jail" for up to a day** (bot-traffic page, published 2022-10-26, updated 2024-05-29)
- Cost: free website · paid: Stathead Football $9/month or $80/year per sport (SR FAQ, search snippet only, not fetched); custom data only with a **$5,000 minimum** commitment (data_use page, read)
- Licensing: commercial: no licence offered; data_use page says much of the data comes from third parties whose licences "prevent offering it as a download"; building websites/tools from scraped data needs permission; a database that competes with or substitutes for SR is prohibited; **using SR material to train, fine-tune, prompt or instruct AI models needs permission** · redistribution: barred en masse · caching/storage: not granted · attribution: n/a · other: facts themselves "cannot be copyrighted" (data_use page), so citing individual facts with a link is fine
- Quality: excellent, curated; the reference other datasets reconcile to
- Scores: Q 9 / Cov 10 / Rel 8 / Lat 6 / Hist 10 / Doc 7 / DX 2 / Cost 7 / Lic 2 / Com 1 / RL 2 / NFL 10 = **6.2**
- Recommendation: OPTIONAL as a human-checked reference and outbound link; **AVOID automated collection and AVOID feeding PFR material into the AI assistant without written permission** (the AI clause covers "prompting")
- Verified: 2026-11-25 — bot-traffic and data_use pages read (2 requests, the cap); price and coverage years from search snippets only

### Sports Reference — Stathead Football
- Links: https://www.sports-reference.com/stathead/ (search snippet) · terms as PFR
- Category · Class: query tool over PFR database · 🟡 Licensed/commercial (consumer subscription)
- Provides: player/team game and season finders, splits, streaks, play finder
- History · Live · Latency: as PFR · no · –
- Technical: web UI, no API; 10 requests/minute limit (bot-traffic page)
- Cost: paid: $9/month or $80/year single sport; one-month free trial (search snippet of SR FAQ/Stathead page; not fetched)
- Licensing: personal research use; no data export licence for products (inference from data_use page)
- Scores: Q 9 / Cov 10 / Rel 8 / Lat 6 / Hist 10 / Doc 7 / DX 3 / Cost 5 / Lic 2 / Com 1 / RL 2 / NFL 9 = **6.0**
- Recommendation: OPTIONAL — owner's personal research tool only; never a pipeline input
- Verified: UNVERIFIED (pricing from search snippet; not fetched due to the SR request cap)

### spreadspoke (Toby Crabtree) — "NFL scores and betting data" (Kaggle)
- Links: https://www.kaggle.com/datasets/tobycrabtree/nfl-scores-and-betting-data · metadata API `kaggle.com/api/v1/datasets/view/tobycrabtree/nfl-scores-and-betting-data` (read, no auth) · licence CC BY-NC-SA 4.0
- Category · Class: historical scores + closing lines + weather · 🔵 Public/open data (non-commercial)
- Provides: game results since 1966, favourite and spread/total since 1979, stadium, weather (NOAA), per the dataset description
- History · Live · Latency: 1966–2025 · no · yearly; version 82 "NFL 2025 Season Final Update", lastUpdated 2026-02-11
- Coverage: regular season + playoffs; betting data 1978–2013 from repole.com sun4cast, 2014–2024 from sportsline.com and aussportsbetting.com (description) — mixed books, single line, timing not stated
- Technical: Kaggle download (account needed for the official download route; not created) · CSV (1.6 MB) · Auth: Kaggle account · RL n/a
- Cost: free
- Licensing: **commercial: NO (NC)** · redistribution: share-alike, non-commercial · attribution required · other: upstream PFR/ESPN content
- Quality: widely used, decent; mixed-source lines, team-name normalisation needed
- Scores: Q 6 / Cov 7 / Rel 6 / Lat 2 / Hist 9 / Doc 6 / DX 6 / Cost 10 / Lic 4 / Com 1 / RL ~7 / NFL 8 = **6.0**
- Recommendation: OPTIONAL — longest free line history for a non-commercial backtest (1979+); cross-check against nflverse lines (1999+); AVOID for a commercial product
- Verified: 2026-11-25 — Kaggle metadata JSON (licence, lastUpdated, version notes, description)

### Max Horowitz — "Detailed NFL Play-by-Play Data 2009–2018" (Kaggle)
- Links: https://www.kaggle.com/datasets/maxhorowitz/nflplaybyplay2009to2016 · licence "Unknown" (Kaggle metadata)
- Category · Class: historical pbp (nflscrapR) · 🔵 (unlicensed)
- Provides: regular-season plays 2009–2018 with nflscrapR EP/WP
- History · Live · Latency: 2009–2018 · no · frozen (lastUpdated 2018-12-22)
- Technical: Kaggle · CSV, 1.22 GB · Auth Kaggle account
- Cost: free · Licensing: unknown → reference only
- Quality: superseded by nflverse pbp (1999+, same lineage, maintained)
- Scores: Q 6 / Cov 5 / Rel 5 / Lat 1 / Hist 5 / Doc 6 / DX 4 / Cost 10 / Lic 2 / Com 1 / RL ~7 / NFL 6 = **4.8**
- Recommendation: AVOID — use nflverse pbp
- Verified: 2026-11-25 — Kaggle metadata JSON

### NFL Football Operations — Big Data Bowl data
- Links: https://operations.nfl.com/gameday/analytics/big-data-bowl (search) · https://github.com/nfl-football-ops/Big-Data-Bowl (155★, no licence, last push 2019-04-29) · 2027 edition: https://www.sportsvideo.org/2026/10/08/nfl-announces-ninth-annual-big-data-bowl-powered-by-aws/ (read)
- Category · Class: player tracking samples · 🟢 Official (competition-licensed)
- Provides: NGS tracking for sampled weeks/plays (each year different), plus PFF scouting fields in some years; 2027 edition: combine player-tracking 2023–2025 plus in-game data for the same players, five position groups (sportsvideo.org, 2026-10-08)
- History · Live · Latency: samples only, 2017– · no · yearly competition
- Technical: Kaggle competition download (account and rules acceptance required; not done) · CSV
- Cost: free to entrants
- Licensing: governed by Kaggle competition rules — **UNVERIFIED** (Kaggle competitions API answered 401 without login; operations.nfl.com terms URL 404). Treat as competition-use only
- Scores: Q 10 / Cov 2 / Rel 6 / Lat 1 / Hist 3 / Doc 8 / DX 5 / Cost 9 / Lic ~2 / Com ~1 / RL ~6 / NFL 7 = **5.0**
- Recommendation: AVOID as a product source; reference for research only
- Verified: 2026-11-25 — GitHub repos inspected; 2027 announcement read; rules UNVERIFIED

### FiveThirtyEight — NFL Elo (`nfl_elo.csv`) — DISCONTINUED
- Links: https://github.com/fivethirtyeight/data/tree/master/nfl-elo (CC-BY-4.0, repo last push 2025-02-25) · https://github.com/fivethirtyeight/nfl-elo-game (MIT, 355★, last push 2023-05-02) · mirror https://datahub.io/fivethirtyeight/nfl-elo
- Category · Class: public model ratings and forecasts · ⚫ Experimental/unstable (dead upstream)
- Provides: game-by-game Elo and QB-adjusted Elo, win probabilities, 1920–(last 538 season)
- History · Live · Latency: 1920–2022/23 in the original; **original URLs `projects.fivethirtyeight.com/nfl-api/nfl_elo.csv` and `_latest.csv` now 302 → abcnews.go.com/politics (probed 2026-11-25)**; GitHub `nfl-elo-game/data/nfl_games.csv` ends 2021-02-07; datahub mirror ends at the 2017 season (Super Bowl LII), Elo columns only, `Last-Modified 2026-03-12`
- Coverage: complete history but frozen
- Technical: CSV · Auth none
- Cost: free
- Licensing: fivethirtyeight/data is CC-BY-4.0; nfl-elo-game MIT; datahub copy lists no licence
- Quality: good historical baseline; shutdown March 5, 2025 (Wikipedia via search); archive access removed ~May 2026 (search snippet, lawyersgunsmoneyblog.com)
- Scores: Q 7 / Cov 6 / Rel 1 / Lat 1 / Hist 9 / Doc 7 / DX 6 / Cost 10 / Lic 9 / Com 8 / RL 8 / NFL 7 = **6.6**
- Recommendation: AVOID for current use; OPTIONAL as a historical benchmark (MIT file to 2020 season)
- Verified: 2026-11-25 — `gh api` (repos, README, commits), curl of the dead URLs, datahub headers and last rows

### nfelo (Robby Greer) — model outputs (`greerreNFL/nfelo/output_data`)
- Links: https://www.nfeloapp.com · https://github.com/greerreNFL/nfelo (66★, pushed 2026-11-25) · https://github.com/greerreNFL/nfelo/blob/main/LICENSE (custom, added 2026-11-11)
- Category · Class: public model ratings/forecasts · 🟠 Unofficial but commonly used
- Provides: `nfelo_games.csv` (4,809 games 2009 → 2026 wk 12: nfelo ratings, open/close model lines, cover probabilities, EV, **plus market open/close lines and prices**); `historic_projected_spreads.csv` (**append-only ledger of weekly pre-game projections, 2021 →, with model version** — usable for leak-free model-vs-model comparison); `elo_snapshot.csv`; `prediction_tracker.csv` (current week)
- History · Live · Latency: 2009–2026 · no · weekly in season (commit today)
- Technical: raw GitHub CSV · Auth none
- Cost: free
- Licensing: **licence (read 2026-11-25): you may "read, quote, reference, analyze, and republish" the original nfelo outputs; no right to run, import or modify the code; third-party columns (e.g. market lines) "remain under their own licenses"**. Credit is not formally required for outputs, but is good practice. **Changed 2026-11-11: model source moved private; repository is now a fetch client plus outputs (README, CHANGELOG)**
- Quality: well-calibrated public model; transparent versioning
- Scores: Q 8 / Cov 7 / Rel 7 / Lat 6 / Hist 6 / Doc 7 / DX 8 / Cost 10 / Lic 6 / Com ~5 / RL 8 / NFL 9 = **7.2**
- Recommendation: SECONDARY — model-vs-model comparison panel and benchmark; do not reuse its market columns as our own line history
- Verified: 2026-11-25 — LICENSE, README, CHANGELOG, two output files parsed

### nfeloqb — QB Elo values (`greerreNFL/nfeloqb/qb_elos.csv`)
- Links: https://github.com/greerreNFL/nfeloqb (17★, **no licence file**, pushed 2026-11-25)
- Category · Class: QB value model output · 🟠
- Provides: weekly QB values in 538's QB-Elo format; 538's original model up to 2023, nfeloqb model from 2023 (README)
- History · Live · Latency: 538-era history → 2026 · no · "updated every Tuesday and Thursday morning" in season (README)
- Technical: raw CSV (6.6 MB) · Auth none
- Licensing: **no licence**; nfelo's LICENSE covers only "files in output_data/ published here" (i.e. the nfelo repo), not nfeloqb → default all rights reserved
- Scores: Q 7 / Cov 7 / Rel 7 / Lat 6 / Hist 7 / Doc 6 / DX 8 / Cost 10 / Lic 2 / Com 1 / RL 8 / NFL 8 = **6.4**
- Recommendation: SECONDARY (already used by the build) — **owner decision: ask the author for permission or rely on nfelo's licensed outputs**; contradiction with the registry noted in §7
- Verified: 2026-11-25 — repo contents, README, licence absence

### Neil Paine — NFL Elo ratings (GitHub CSV)
- Links: https://github.com/Neil-Paine-1/NFL-elo-ratings · licence MIT (`LICENSE.txt`)
- Category · Class: historical model ratings (538 method continued) · 🔵 Public/open data
- Provides: every game from 1920-09-26 to Super Bowl LIX (2025-02-09), one row per team per game: score, `elo1_pre/post`, `elo_prob1`, playoff round, neutral flag, game number
- History · Live · Latency: 1920–2024 · no · **not updated since 2025-02-10** (no 2025 or 2026 rows)
- Technical: raw CSV (4.1 MB) · Auth none
- Cost: free · Licensing: MIT — commercial use, redistribution and storage allowed with the notice
- Quality: consistent with 538's Elo (same 1920 opening rows as the datahub mirror); stale
- Scores: Q 7 / Cov 6 / Rel 4 / Lat 1 / Hist 10 / Doc 3 / DX 8 / Cost 10 / Lic 10 / Com 9 / RL 8 / NFL 7 = **6.9**
- Recommendation: OPTIONAL — best licensed long-history Elo seed and benchmark; extend forward with our own Elo (§5)
- Verified: 2026-11-25 — repo contents, commits, first and last rows

### Todd Beck — The Prediction Tracker
- Links: https://www.thepredictiontracker.com · NFL results https://www.thepredictiontracker.com/nflresults.php · CSV https://www.thepredictiontracker.com/nflpredictions.csv · robots https://www.thepredictiontracker.com/robots.txt
- Category · Class: aggregated computer-model predictions and accuracy · 🟠 Unofficial
- Provides: current-week predicted margins from 50+ systems (CSV columns include `lineopen`, `line`, `linesag`, `linemass`, `lineelo`, `linenfelo`, `lineespn`, `linemidweek`, `lineavg`, `linemedian`, `linestd`…); season accuracy tables (pct correct, ATS, absolute error, bias, MSE) for 2000–2026
- History · Live · Latency: results pages 2000–2026 · no · CSV `Last-Modified 2026-11-25 20:06 GMT`; results "through 2026-11-24"
- Technical: HTML + one CSV (7 KB) · Auth none
- Cost: free (ad-supported)
- Licensing: no terms page found; footer "Copyright © 2007-2024 Todd Beck"; robots.txt `Content-Signal: search=yes,ai-train=no,use=reference` and blocks ClaudeBot/anthropic-ai and other AI crawlers. **Not licensed for republication** → owner decision / ask the author
- Quality: unique consensus-of-models view; individual systems opaque
- Scores: Q 6 / Cov 6 / Rel 6 / Lat 6 / Hist 7 / Doc 3 / DX 6 / Cost 10 / Lic 2 / Com 1 / RL ~6 / NFL 7 = **5.5**
- Recommendation: OPTIONAL — link out, or ask permission to show the consensus spread; useful to benchmark our model's MSE against the published table
- Verified: 2026-11-25 — home, results page, CSV header, robots.txt

### Jeff Sagarin — NFL ratings
- Links: http://sagarin.com/sports/nflsend.htm (https fails; http answered 200)
- Category · Class: computer ratings · 🟠
- Provides: team rating, predictor, golden mean, recent, schedule strength; division averages
- History · Live · Latency: current season page ("NFL 2026 Ratings through results of 2026 NOVEMBER 23"); `Last-Modified 2026-11-24` · weekly
- Licensing: "All Contents Copyright © 2026 Jeff Sagarin. All Rights Reserved."; page says ratings "are no longer updated on the USA Today website" (usatoday.com Sagarin URL answered 402)
- Scores: Q 7 / Cov 5 / Rel 6 / Lat 6 / Hist 2 / Doc 3 / DX 3 / Cost 10 / Lic 1 / Com 1 / RL ~5 / NFL 6 = **4.6**
- Recommendation: AVOID republication; link only. Sagarin's line also appears in The Prediction Tracker CSV
- Verified: 2026-11-25 — page fetched, header date

### Kenneth Massey — Massey Ratings
- Links: https://masseyratings.com (403 to a plain curl — Cloudflare-style block; not bypassed) · https://masseyratings.com/scorehelp.htm (search snippet)
- Category · Class: computer ratings, composite, score files · 🟠
- Provides: NFL ratings, composite of many systems, historical score files "intended for use with computer databases" (scorehelp, snippet)
- Licensing: informal: users asked to "reference MasseyRatings.com" (snippet); no formal licence found
- Scores: Q 7 / Cov 6 / Rel 5 / Lat 6 / Hist 7 / Doc 4 / DX 3 / Cost 10 / Lic ~3 / Com ~1 / RL 2 / NFL 6 = **5.0**
- Recommendation: AVOID automated use (blocks bots); link only
- Verified: UNVERIFIED — 403 on probe; terms from search snippet only

### FTN — DVOA (ex-Football Outsiders)
- Links: https://ftnfantasy.com/nfl/tools/team-total-dvoa (search result) · Football Outsiders closed 2023-09-01, DVOA moved to FTN (Wikipedia via search)
- Category · Class: proprietary efficiency ratings · 🟡 Licensed/commercial
- Provides: team/player DVOA, DAVE; historical archive extended back to 1979–1981 per FTN articles (search snippets)
- Cost: FTN Stats+ subscription — price UNVERIFIED
- Licensing: proprietary; no redistribution
- Scores: Q 8 / Cov 7 / Rel 7 / Lat 6 / Hist 8 / Doc 6 / DX 3 / Cost 4 / Lic 1 / Com 1 / RL ~4 / NFL 8 = **5.2**
- Recommendation: AVOID as data; compute our own EPA-based opponent-adjusted efficiency from nflverse pbp instead
- Verified: UNVERIFIED (search snippets only)

### ESPN — FPI and QBR
- Links: espn.com/nfl/fpi (not fetched) · QBR via nflverse `espn_data` (2006–2026) · Disney ToU (see registry)
- Category · Class: proprietary model outputs · 🔴 when scraped / local-only class
- Provides: FPI team ratings and season projections; QBR
- Licensing: Disney ToU bar automated access and dataset building (registry, Nov. 21)
- Scores: Q 8 / Cov 8 / Rel 7 / Lat 7 / Hist 6 / Doc 3 / DX 5 / Cost 10 / Lic 1 / Com 1 / RL ~5 / NFL 8 = **5.8**
- Recommendation: AVOID republication (local-only comparison at most, owner decision as for other ESPN endpoints)
- Verified: QBR file parsed 2026-11-25; FPI UNVERIFIED (not probed)

### PFR SRS (Simple Rating System) — compute, don't copy
- Links: PFR team pages (not fetched)
- Recommendation: OPTIONAL — SRS = margin of victory adjusted for schedule; reproducible exactly from nflverse scores (see §5), so no need to take PFR's numbers
- Verified: method well known; PFR values not fetched

### Part C — GitHub sweep (repos not already in docs/GITHUB_RESEARCH.md or FEATURE_RESEARCH.md §5)

Method: 21 queries × 2 sorts via `gh search repos` (888 rows, 754 unique repos; plus topic searches `topic:nfl`, `topic:nflverse`, `topic:american-football`, `topic:fantasy-football`, `topic:college-football`, "nfl draft", "nfl combine", "college football data", "nfl elo", "nfl win probability"). Repos already in the project's docs were excluded. Each repo below was opened with `gh api repos/OWNER/REPO` (licence, stars, push date, archived) and its README read on 2026-11-25. Most hits were soccer, student projects or abandoned scrapers; only the useful or warning-worthy ones are listed. Reuse key as in the project docs: **Data / Ref / Code / Avoid**. Class emoji is for what the repo *touches upstream*.

| Repo | Licence | ★ / last push / archived | What it is · upstream source | Class | Reuse |
|---|---|---|---|---|---|
| [Neil-Paine-1/NFL-elo-ratings](https://github.com/Neil-Paine-1/NFL-elo-ratings) | MIT | 8 / 2025-02-10 / no | 538-style Elo by a former 538 writer: one CSV, every game 1920-09-26 → Super Bowl LIX (2025-02-09), both team perspectives, pre/post Elo and win prob. Not updated for 2025 or 2026 | 🔵 | **Data** (historical Elo benchmark, MIT) |
| [fivethirtyeight/nfl-elo-game](https://github.com/fivethirtyeight/nfl-elo-game) | MIT | 355 / 2023-05-02 / no | 538's Elo game data 1920 → 2021-02-07 + Python Elo code | 🔵 | Data (frozen) / Code |
| [sportsdataverse/sportsdataverse-py](https://github.com/sportsdataverse/sportsdataverse-py) | MIT | 132 / 2026-11-25 / no | Polars-first loaders for 100+ leagues, mostly ESPN and NGS JSON | 🔴 (ESPN upstream) | Ref |
| [sportsdataverse/sportsdataverse-data](https://github.com/sportsdataverse/sportsdataverse-data) | MIT | 15 / 2026-11-21 (assets updated 2026-11-25) / no | **388 release tags**: `espn_nfl_*` (pbp, drives, injuries, depth charts, player box, 30+ "adv" tables), `nfl_ngs_*` (incl. `nfl_ngs_highlight_tracking`), `cfbfastR_cfb_pbp`, `espn_cfb_*`, `cfb_*` | 🔴 ESPN / NFL upstream under an MIT repo | Avoid for redistribution; Ref for schemas |
| [sportsdataverse/cfbfastR](https://github.com/sportsdataverse/cfbfastR) | MIT + file (DESCRIPTION v3.1.0) | 114 / 2026-11-25 / no | College pbp with EPA/WPA: CFBD-sourced 2014+, ESPN-derived 2004+, stats.ncaa.org 2013+ (loader docs) | 🟠/🔴 | Ref; data via CFBD key preferred |
| [sportsdataverse/recruitR](https://github.com/sportsdataverse/recruitR) | NOASSERTION | 21 / 2026-11-25 / no | CFBD recruiting/roster wrapper | 🟠 | Ref |
| [CFBD/cfbd-python](https://github.com/CFBD/cfbd-python) | none in repo | 222 / 2026-11-14 / no | Official CFBD OpenAPI client (API 5.33.3) | 🟢 for CFBD | Ref |
| [henrygd/ncaa-api](https://github.com/henrygd/ncaa-api) | MIT | 275 / 2026-10-06 / no | Unofficial JSON proxy of ncaa.com pages (scores, stats, pbp); public demo limited to 3 req/s/IP | 🔴 (NCAA.com ToS: no commercial use, no redistribution) | Avoid |
| [roclark/sportsipy](https://github.com/roclark/sportsipy) | MIT | 580 / 2025-01-31 / no | Sports Reference scraper; README: "no longer undergoing active development" | 🔴 | Avoid |
| [blnkpagelabs/nflscraPy](https://github.com/blnkpagelabs/nflscraPy) | MIT | 41 / 2023-10-31 / no | PFR scraper (sleeps 3.5–5.5 s; warns PFR/Cloudflare will suspend access) | 🔴 | Avoid |
| [thadhutch/sports-quant](https://github.com/thadhutch/sports-quant) | MIT | 26 / 2026-03-19 / no | Scrapes PFF grades and PFR game data | 🔴 (PFF paid content) | Avoid |
| [BurntSushi/nfldb](https://github.com/BurntSushi/nfldb) | Unlicense | 1,078 / 2021-01-26 / no | "THIS PROJECT IS UNMAINTAINED"; NFL.com GameCenter JSON feed | ⚫ | Avoid |
| [maksimhorowitz/nflscrapR](https://github.com/maksimhorowitz/nflscrapR) | none | 558 / 2020-04-03 / no | Original NFL API pbp scraper (2009+) | ⚫ | Avoid (superseded by nflfastR) |
| [ryurko/nflscrapR-models](https://github.com/ryurko/nflscrapR-models) | none | 40 / 2018-09-18 / no | EP, FG and WP model code incl. **leave-one-season-out calibration** | 🔵 | Ref (method) |
| [ryurko/nflWAR](https://github.com/ryurko/nflWAR) | none | 37 / 2018-09-18 / no | WAR for offensive players (arXiv 1802.00998) | 🔵 | Ref |
| [FantasyFootballAnalytics/ffanalytics](https://github.com/FantasyFootballAnalytics/ffanalytics) | none | 192 / 2026-09-09 / no | Scrapes projections from CBS, ESPN, NFL, FantasyPros etc. with 2-s waits | 🔴 | Avoid (method Ref for averaging projections) |
| [FantasyFootballAnalytics/FantasyFootballAnalyticsR](https://github.com/FantasyFootballAnalytics/FantasyFootballAnalyticsR) | none | 511 / 2026-05-15 / no | Projection/optimisation scripts | 🟠 | Ref |
| [mkreiser/ESPN-Fantasy-Football-API](https://github.com/mkreiser/ESPN-Fantasy-Football-API) | LGPL-3.0 | 356 / 2025-01-04 / no | JS client for ESPN fantasy v3 (league data; notes ESPN deleted pre-2017 league data) | 🔴 | Avoid (league access out of scope) |
| [uberfastman/yfpy](https://github.com/uberfastman/yfpy) | GPL-3.0 | 271 / 2026-04-21 / no | Wrapper for Yahoo Fantasy Sports API (OAuth) | 🟢 Yahoo API | Ref only (GPL) |
| [derekrbreese/fantasy-football-mcp-public](https://github.com/derekrbreese/fantasy-football-mcp-public) | MIT | 94 / 2026-11-25 / no | Yahoo fantasy MCP server; README: Yahoo API access "now requires manual approval" and is read-only | 🟢 | Ref (MCP design) |
| [hvpkod/NFL-Data](https://github.com/hvpkod/NFL-Data) | MIT (code) | 108 / 2026-01-13 / no | Weekly stats/projections extracted from Fantasy.NFL.com, 2015+ | 🔴 (NFL ToU §1.3) | Avoid |
| [jthomasmock/espnscrapeR](https://github.com/jthomasmock/espnscrapeR) | NOASSERTION | 51 / 2024-02-05 / no | ESPN QBR/standings scraper | 🔴 | Avoid |
| [mrcaseb/nfl-data](https://github.com/mrcaseb/nfl-data) | none | 47 / 2026-09-08 / no | Old NGS host; moved to nflverse/ngs-data | ⚫ | Avoid |
| [rmcurtis43/combineR](https://github.com/rmcurtis43/combineR) | NOASSERTION | 13 / 2022-04-26 / no | Combine 2000+ from PFR; draft 1936+ from drafthistory.com | 🔴 | Avoid (use nflverse combine/draft) |
| [tanho63/nfl_combine](https://github.com/tanho63/nfl_combine) | none | 5 / 2026-03-02 / no | NFL.com draft profiles and grades 2008–2025 (mostly Lance Zierlein) + NGS grades | 🔴 copyrighted scouting text | **Avoid** |
| [bcongelio/nfl-analytics-with-r-book](https://github.com/bcongelio/nfl-analytics-with-r-book) | CC0-1.0 | 80 / 2025-02-12 / no | Book source (CRC Press) on nflverse analytics | 🔵 | Ref / Code (CC0) |
| [isaactpetersen/Fantasy-Football-Analytics-Textbook](https://github.com/isaactpetersen/Fantasy-Football-Analytics-Textbook) | CC-BY-4.0 | 20 / 2026-11-18 / no | Open textbook (projection, aggregation, evaluation) | 🔵 | Ref (cite) |
| [JovaniPink/awesome-nfl-data](https://github.com/JovaniPink/awesome-nfl-data) | NOASSERTION | 4 / 2026-11-25 / no | Curated source list with a machine-readable index (`catalog/resources.v1.json`), "Last reviewed: August 2026" | – | Ref (cross-check our registry) |
| [pseudo-r/Public-NFL-API](https://github.com/pseudo-r/Public-NFL-API) | none | 4 / 2026-09-30 / no | Endpoint docs for NFL.com and ESPN; Sept 2026 audit; says "Public" means reachable, not permitted | 🔴 | Ref only |
| [stylo-stack/ESPN-API-Documentation](https://github.com/stylo-stack/ESPN-API-Documentation) | none | 27 / 2025-09-06 / no | ESPN NFL endpoint list | 🔴 | Ref only |
| [UnravelSports/unravelsports](https://github.com/UnravelSports/unravelsports) | MPL-2.0 | 250 / 2026-01-16 / no | Tracking data → Polars; graph-neural-network pipeline that supports American football (BDB format) | 🔵 | Ref |
| [nflverse/NFLData.jl](https://github.com/nflverse/NFLData.jl) | MIT | 6 / 2026-08-31 / no | Julia nflreadr port | 🔵 | Ref |
| [clausherther/nfl-dbt](https://github.com/clausherther/nfl-dbt) | Apache-2.0 | 24 / 2023-12-26 / no | dbt models over nflverse pbp; removes duplicate plays | 🔵 | Code (with notice) |
| [dgrifka/nfl_simulator](https://github.com/dgrifka/nfl_simulator) | MIT | 6 / 2026-11-24 / no | "Deserve-to-win" from success rate and yards/play, weights fit 2016–2023, 40,000 draws | 🔵 | Ref / Code |
| [jackc625/nfl-predict](https://github.com/jackc625/nfl-predict) | MIT | 2 / 2026-11-24 / no | Walk-forward pre-game models with a **fixed information lock (6 PM ET day before)** and pre-registered evaluation | 🔵 | Ref (leakage design) |
| [roni-altshuler/nfl_predictor](https://github.com/roni-altshuler/nfl_predictor) | none | 1 / 2026-11-24 / no | Calibrated forecasts scored against the closing line; key-number lattice, 6,499 games 2002–2025 | 🔵 | Ref only (no licence) |
| [MaddocksJ27/NFL-Market-Efficiency](https://github.com/MaddocksJ27/NFL-Market-Efficiency) | none | 2 / 2026-09-08 / no | Out-of-sample study: 3-day line drift not forecastable (R²≈0, 804 games); props priced at the median | 🔵 | Ref (findings) |
| [cbratkovics/fantasy-football-ai](https://github.com/cbratkovics/fantasy-football-ai) | MIT | 17 / 2026-11-24 / no | As-of feature engineering, rolling-origin folds, causal baseline | 🔵 | Ref |
| [allenwalker3/playcall](https://github.com/allenwalker3/playcall) | MIT | 2 / 2026-06-09 / no | LLM → DuckDB SQL over nflverse parquet | 🔵 | Ref (assistant tool design) |
| [greerreNFL/nfelotranslation](https://github.com/greerreNFL/nfelotranslation) | none | 2 / 2026-08-01 / no | Win prob ↔ spread ↔ discrete margin PMF (−75..+75), cover/push probs | 🔵 | Ref only (no licence) |
| [HuddleScope/huddlescope.github.io](https://github.com/HuddleScope/huddlescope.github.io) | MIT | 1 / 2026-11-25 / no | Non-commercial NFL RSS news aggregator in Go (ingest, store, Hugo export, heartbeat) | 🟠 (feed terms) | Ref — see §7 |
| [howardchung/opencfb](https://github.com/howardchung/opencfb) | none | 4 / 2026-11-25 / no | College data site serving a static SQLite DB through `sql.js-httpvfs` (HTTP range requests), rebuilt daily | 🔵 | Ref (architecture idea for a static page) |
| [andrewneuwirth/football-cv](https://github.com/andrewneuwirth/football-cv) | MIT | 1 / 2026-11-15 / no | Computer vision from game film to 22 position labels (~70% accuracy on 21 plays) | 🔴 if run on broadcast film | Ref only |
| [jgamblin/SeaHawksML](https://github.com/jgamblin/SeaHawksML) | Apache-2.0 | 1 / 2026-11-25 / no | nflverse + Open-Meteo historical weather, holdout scored once | 🔵 | Ref / Code |
| [ThompsonJamesBliss/WeatherData](https://github.com/ThompsonJamesBliss/WeatherData) | none | 30 / 2021-10-06 / no | Hourly game weather 2000–2020 (Meteostat, Weather Underground) + stadium azimuths | 🟠 | Ref (no licence) |
| [veltman/nflplays](https://github.com/veltman/nflplays) | none | 44 / 2020-09-30 / no | Brian Burke's 2002–2012 pbp, cleaned | ⚫ | Avoid |
| [nfl-football-ops/Big-Data-Bowl](https://github.com/nfl-football-ops/Big-Data-Bowl) | none | 155 / 2019-04-29 / no | One 2017 game of tracking + schema/FAQ | 🟢 | Ref |
| [ffverse/ffopportunity](https://github.com/ffverse/ffopportunity) | GPL-3.0 | 26 / 2025-12-11 / no | Expected fantasy points models; releases loaded by `nflreadr::load_ff_opportunity()` 2006+ | 🔵 | Data with caution (GPL code; data licence not stated) |
| [marcusdarmstrong/mockdraftable-web](https://github.com/marcusdarmstrong/mockdraftable-web) | MIT | 36 / 2019-03-01 / no | Mockdraftable website code (data not in repo) | 🔵 code | Ref |

Ecosystem status changes since the project's docs: (1) **nfelo moved its model code private on 2026-11-11** and added a new licence (outputs still public); (2) `pseudo-r` now keeps `Public-NFL-API` (Sept 2026 audit) — the project doc says the old Public-ESPN-API no longer resolves, still true; (3) a maintained MIT NFL RSS aggregator exists (HuddleScope, 1★) — small but contradicts the "none found" line; (4) nflverse `player_stats` tag is legacy since May 2025 (replaced by `stats_player`/`stats_team`).

### Part D — Academic and ML resources (dataset/code availability and leakage pitfalls)

All DOIs below resolved via `api.crossref.org/works/<DOI>` on 2026-11-25 unless marked; arXiv titles read from `export.arxiv.org/abs/<id>`.

| # | Resource | Topic | Data / code | Leakage pitfalls |
|---|---|---|---|---|
| 1 | Yurko, Ventura, Horowitz (2019) "nflWAR: a reproducible method for offensive player evaluation in football", JQAS — DOI 10.1515/jqas-2018-0010; arXiv 1802.00998 | EP/WP models (nflscrapR) + WAR | nflscrapR data; code `ryurko/nflscrapR-models`, `ryurko/nflWAR` (no licences) | They validate EP/WP with **leave-one-season-out CV** — the right template; pbp `ep`/`wp` columns are in-sample for older seasons |
| 2 | Baldwin, "nflfastR EP, WP and CP models" (Open Source Football, 2020-09-28) https://www.opensourcefootball.com/posts/2020-09-28-nflfastr-ep-wp-and-cp-models/ (301 redirect observed; content cited by the project docs) | EP/WP/CP with xgboost | nflfastR (MIT), fastrmodels weights | Same: models fit on all seasons; refit by season for backtests. Spread-adjusted WP uses closing line → uses market info available pre-kickoff only if you take the line at that time |
| 3 | Lock & Nettleton (2014) "Using random forests to estimate win probability before each play of an NFL game", JQAS — DOI 10.1515/jqas-2013-0100 | In-game WP | 2001–2011 pbp (Burke) | Train/test by season; uses pre-game spread |
| 4 | Pelechrinis (2017) "iWinRNFL: A Simple, Interpretable & Well-Calibrated In-Game Win Probability Model for NFL", arXiv 1704.00197 | Interpretable WP | nflscrapR data | Calibration on held-out seasons |
| 5 | Glickman & Stern (1998) "A State-Space Model for National Football League Scores", JASA — DOI 10.1080/01621459.1998.10474084 | Dynamic team strength (Kalman/MCMC) | scores (public) | Ratings must be filtered forward only (no smoothing with future games) |
| 6 | Stern (1991) "On the Probability of Winning a Football Game", The American Statistician — DOI 10.1080/00031305.1991.10475798 | Spread → win probability (normal, σ≈13–14) | lines and scores | Use the line known before kickoff; closing vs opening matters |
| 7 | Levitt (2004) "Why are Gambling Markets Organised so Differently from Financial Markets?", Economic Journal — DOI 10.1111/j.1468-0297.2004.00207.x | Bookmaker pricing / market efficiency | wagering contest data | Market biases are small; beware multiple testing |
| 8 | Moskowitz (2021) "Asset Pricing and Sports Betting", Journal of Finance — DOI 10.1111/jofi.13082 | Momentum/value in betting markets | proprietary odds | Close-to-open movement is not predictive out-of-sample at tradable size |
| 9 | Gray & Gray (1997) "Testing market efficiency: evidence from the NFL sports betting market", Journal of Finance | ATS anomalies | lines | **DOI UNVERIFIED** (two candidate DOIs resolved to other papers); classic finding that anomalies faded — a cautionary tale on data snooping |
| 10 | Yurko et al. (2020) "Going deep: models for continuous-time within-play valuation of game outcomes in American football with tracking data", JQAS — DOI 10.1515/jqas-2019-0056 | Within-play EP from tracking | Big Data Bowl tracking (competition-licensed) | Tracking samples are tiny and non-random weeks |
| 11 | NFL Big Data Bowl (2019 →; 2026 winner Lucca Ferraz, Rice; 2027 uses combine tracking 2023–2025) — https://operations.nfl.com/gameday/analytics/big-data-bowl/ (read) | Tracking analytics, movement prediction | Kaggle (rules UNVERIFIED) | 2026 leaderboard track scored on **future games** (weeks 14–18 2025) — a good anti-leakage design |
| 12 | Mack et al. (2018/2019) "Higher Rates of Lower Extremity Injury on Synthetic Turf Compared With Natural Turf Among NFL Athletes", AJSM — DOI 10.1177/0363546518808499 | Injury risk by surface | NFL Injury Surveillance (not public) | Data not public; cannot be reproduced from nflverse injuries (which are practice-report statuses, not injury incidence) |
| 13 | Kaggle "NFL 1st and Future – Playing Surface Analytics" https://www.kaggle.com/c/nfl-playing-surface-analytics (HTTP 200) | Injury vs surface, player movement | Competition data (rules not read) | Competition-only licence (UNVERIFIED) |
| 14 | "Sports injuries and game stakes: Concussions in the National Football League", Economic Inquiry replication package — https://doi.org/10.3886/E191501V4 (Harvard Dataverse/openICPSR listing) | Concussions vs game stakes | Replication package (openICPSR terms) | Observational; reporting changes over time |
| 15 | "Bye-bye, bye advantage: estimating the competitive impact of rest differential in the NFL" (Frontiers, data sheet on Figshare 2024-10-17) https://frontiersin.figshare.com/articles/dataset/Data_Sheet_1_Bye-bye_bye_advantage_estimating_the_competitive_impact_of_rest_differential_in_the_National_Football_League_pdf/27248217 | Rest differential | data sheet | Directly relevant to the project's rejected rest-day factor — a published counterpoint to compare with `scripts/backtest.py` |
| 16 | Petersen, *Fantasy Football Analytics* textbook (CC-BY-4.0) https://isaactpetersen.github.io/Fantasy-Football-Analytics-Textbook/ | Fantasy projection, wisdom of crowds, evaluation | nflverse-based | Projections must be scored on weeks after they were made |
| 17 | MaddocksJ27 "NFL Betting Market Efficiency" (GitHub, 2026) | Line drift, props | nflverse + The Odds API snapshots | Documents underpowered tests (n=734) — honest-uncertainty example |

Not found / not verified: a public injury-prediction model with an open NFL injury-incidence dataset (none found; nflverse injuries are report statuses), a maintained drive-outcome model package beyond nflfastR's EP/WP, and a public prop-pricing dataset (props need a paid odds feed — see R-track on odds).

**Generic leakage rules distilled for this project:** (a) every model input carries the timestamp at which it was known; (b) use nflverse `games` lines only as "closing-ish, undocumented timing" — never as an opening line; (c) never use nflfastR `wp`/`vegas_wp`/`ep` as features for seasons they were trained on; (d) season-level aggregates (PFR AV, season QBR, end-of-season depth charts, final rosters) are look-ahead features when joined to weekly games; (e) the depth-chart and injury files are dated snapshots — join on the snapshot time ≤ prediction time; (f) participation data arrives after the Super Bowl, so it can never be a weekly input.

### Part E — College, draft and combine

### CollegeFootballData.com (CFBD) — API
- Links: https://collegefootballdata.com · terms https://collegefootballdata.com/terms (read; effective 2026-08-12) · tiers https://collegefootballdata.com/api-tiers (read) · key https://collegefootballdata.com/key (read) · client https://github.com/CFBD/cfbd-python
- Category · Class: college football stats, pbp, recruiting, lines, draft · 🟡 Licensed (free tier available)
- Provides: games, box scores, pbp, drives, advanced metrics (PPA, success rate, WP), recruiting, ratings, betting lines, NFL draft picks, rosters; live scoreboard (Tier 1+), live pbp (Tier 2+), GraphQL (Tier 3+)
- History · Live · Latency: deep history (exact first seasons per endpoint not stated on pages read — UNVERIFIED; cfbfastR's CFBD pbp loader starts 2014) · live from Tier 1 · minutes
- Coverage: FBS fully; FCS partial (inference from cfbfastR notes)
- Technical: REST (+GraphQL) · JSON · SDK: official Python/JS/C# generated clients; cfbfastR (R) · Auth: free API key by email ("No credit card") · **Rate limits: monthly quota by tier — Free 1,000 calls; Academic (.edu/.ac.uk) 3,000; Tier 1 $1 → 5,000; Tier 2 $5 → 30,000; Tier 3 $10 → 75,000; Tier 4 $15 → 125,000; Tier 5 $20 → 200,000; Tier 6 $30 → 500,000** (api-tiers page; no date shown)
- Cost: free: 1,000 calls/month · paid: $1–$30/month via Patreon tiers
- Licensing: **commercial: "Commercial use is permitted"; tier sets quota, not rights** · redistribution: **no** standalone dataset, bulk download, raw feed, mirror or substitute API · caching/storage: private caching and retention allowed, even after subscription ends · attribution: optional, suggested "Data provided by CollegeFootballData.com." · other: model training and commercialising derived outputs allowed; keys server-side only; no multiple accounts; don't present as official NCAA data
- Quality: community standard; upstream sources not stated on pages read (UNVERIFIED)
- Scores: Q 8 / Cov 8 / Rel 7 / Lat 7 / Hist 8 / Doc 8 / DX 8 / Cost 9 / Lic 7 / Com 8 / RL 5 / NFL 6 = **7.4**
- Recommendation: PRIMARY for college context (prospects' college production) if the product adds a draft module; key in a server secret like FantasyPros
- Verified: 2026-11-25 — terms, tiers and key pages read

### SportsDataverse — cfbfastR / sportsdataverse-data (college)
- Links: https://github.com/sportsdataverse/cfbfastR (MIT) · https://github.com/sportsdataverse/sportsdataverse-data/releases
- Category · Class: college pbp with EPA/WPA · 🟠 (CFBD/ESPN/NCAA upstream)
- Provides: CFBD-sourced pbp 2014+, ESPN-derived pbp 2004+, stats.ncaa.org pbp 2013+ (loader docs), recruiting, team talent, portal
- Technical: release assets (parquet/rds/csv) · R/Python
- Licensing: repo MIT; upstream terms apply (ESPN: Disney ToU; NCAA: ToS; CFBD: no redistribution of raw API data — **the release files are effectively a redistribution of upstream data**)
- Scores: Q 7 / Cov 8 / Rel 7 / Lat 6 / Hist 7 / Doc 7 / DX 7 / Cost 10 / Lic 4 / Com 3 / RL 8 / NFL 5 = **6.6**
- Recommendation: OPTIONAL — research/backtests only; production via the CFBD API under its own terms
- Verified: 2026-11-25 — repo metadata, loader source, release tags

### NCAA — stats.ncaa.org / ncaa.com and henrygd/ncaa-api
- Links: https://www.ncaa.com/tos (read; "last updated on: February 21, 2023") · https://stats.ncaa.org (robots.txt answered 403 "Access Denied") · https://github.com/henrygd/ncaa-api (MIT, 275★)
- Category · Class: official college stats · 🟢 Official site / 🔴 when scraped
- Provides: official NCAA statistics, scores, pbp (FCS and lower divisions too)
- Licensing: NCAA.com is operated by Turner Sports Interactive for the NCAA; terms bar using NCAA Content "for commercial purposes" and any copying/redistribution except as provided; ncaa.com robots.txt disallows ClaudeBot, GPTBot and other AI agents
- Scores: Q 8 / Cov 9 / Rel 5 / Lat 7 / Hist 6 / Doc 2 / DX 3 / Cost 10 / Lic 1 / Com 1 / RL 2 / NFL 4 = **4.8**
- Recommendation: AVOID automated use; link only
- Verified: 2026-11-25 — ToS fetched and parsed; stats.ncaa.org 403

### Sports Reference — College Football (sports-reference.com/cfb)
- Same terms and bot limits as PFR (data_use and bot-traffic pages cover all SR sites). Coverage not fetched (2-request cap) — UNVERIFIED.
- Recommendation: AVOID automated use. Score as PFR minus NFL relevance: **≈ 5.5**

### NFL — official Combine results (nfl.com combine tracker) and NFL.com draft profiles
- Links: https://www.nfl.com/combine/tracker/live-results/ (fetched: page shell titled "2026 NFL Combine Results", results rendered by script) · terms https://www.nfl.com/legal/terms/ (read; "Updated: May 16, 2024")
- Category · Class: official combine results / scouting text · 🟢 Official, but site content
- Licensing: **NFL ToU §1.3: use limited to "your own individual non-commercial and informational purposes"; "systematic retrieval of data … to create or compile … a database" needs written consent; §11(f) bars robots for commercial purposes; §8 allows links to the home page only without permission.** Draft profiles (e.g. Lance Zierlein's) are copyrighted editorial text
- Scores: Q 10 / Cov 7 / Rel 7 / Lat 8 / Hist 5 / Doc 2 / DX 2 / Cost 10 / Lic 1 / Com 1 / RL 3 / NFL 8 = **5.3**
- Recommendation: AVOID automated collection; use nflverse `combine` (PFR-derived) for history and link to NFL.com for official results
- Verified: 2026-11-25 — terms read; tracker page shell fetched

### nflverse — combine and draft_picks (validated)
- Links: release tags `combine`, `draft_picks`
- Provides: combine 2000–2026 (8,968 rows; ht, wt, forty, bench, vertical, broad_jump, cone, shuttle, `pfr_id`, `cfb_id`, draft team/round/overall); draft picks 1980–2026 (12,927 picks; `gsis_id`, `pfr_player_id`, `cfb_player_id`, `hof`, `allpro`, `probowls`, `seasons_started`, `w_av`, `car_av`, `dr_av`, career stat totals)
- History · Live · Latency: combine yearly (updated 2026-03-12); draft picks daily (career columns change)
- Licensing: CC-BY-4.0 label; data "courtesy of PFR" (loader docs) — PFR ToU upstream
- **Leakage warning:** `w_av`, `car_av`, `allpro`, `probowls`, `hof`, `seasons_started` and stat totals are *current career* values, not values as of the draft — never use them as features for a draft-time model
- Scores: Q 8 / Cov 7 / Rel 8 / Lat 5 / Hist 8 / Doc 8 / DX 9 / Cost 10 / Lic 5 / Com ~3 / RL 8 / NFL 8 = **7.2**
- Recommendation: PRIMARY for a fan draft/combine panel; owner decision for commercial
- Verified: 2026-11-25 — both files downloaded and parsed

### Mockdraftable
- Links: https://www.mockdraftable.com (read) · code https://github.com/marcusdarmstrong/mockdraftable-web (MIT, 36★, last push 2019-03-01)
- Category · Class: combine measurables database and percentile visualisation · 🟠
- Provides: height, weight, wingspan, arm, hand, 10/20/40-yard, bench, vertical, broad, 3-cone, 20/60-yard shuttle (measurable list embedded in the page), position percentiles; "© MockDraftable, 2011-2026"
- Technical: website (React; internal JSON); no documented public API; no terms page found
- Licensing: no data licence; code MIT only
- Scores: Q 7 / Cov 6 / Rel 5 / Lat 4 / Hist 7 / Doc 2 / DX 3 / Cost 10 / Lic 2 / Com 1 / RL ~4 / NFL 6 = **4.8**
- Recommendation: AVOID data reuse; link to player pages
- Verified: 2026-11-25 — about page fetched; robots.txt returned the HTML shell (no robots file)

### Kent Lee Platte — Relative Athletic Score (RAS)
- Links: https://ras.football (HTTP 429 to curl and to WebFetch, 2026-11-25)
- Category · Class: composite athletic score from combine/pro-day results · 🟠
- Licensing / terms: **UNVERIFIED** (site refused automated requests with 429 — not retried)
- Recommendation: AVOID automated use; RAS-like percentiles can be computed from nflverse combine data (§5)
- Verified: UNVERIFIED

### NFL Mock Draft Database
- Links: https://www.nflmockdraftdatabase.com (403 to curl) · robots https://www.nflmockdraftdatabase.com/robots.txt (read)
- Category · Class: aggregated mock drafts and consensus big board · 🟡 (has a paid API)
- Evidence: robots.txt disallows `/api/v1/` and `/api-checkout`, blocks AI crawlers (incl. ClaudeBot, Claude-User, GPTBot) and comments that bulk access "competes directly with the paid API"; allows search engines to index consensus big-board pages
- Cost/terms: **UNVERIFIED** (site answered 403; pricing not seen)
- Recommendation: OPTIONAL via the paid API if the owner wants a consensus board (pricing and terms to be read by the owner); never scrape
- Verified: robots only

### Grinding the Mocks; Arif Hasan consensus board
- grindingthemocks.com: **DNS/connection failure (curl 000) on 2026-11-25** — status UNVERIFIED (possibly offline)
- Arif Hasan's consensus board: no URL verified this session (web search budget exhausted) — UNVERIFIED
- Recommendation: AVOID until terms are seen; prospect rankings are editorial compilations

### DraftHistory.com (Chris Malumphy)
- Links: https://www.drafthistory.com (read) — "Copyright 2000 - 2026"; draft results by year/position/college/team; RSS feed link present; combineR scrapes its draft data 1936+
- Licensing: no licence offered → AVOID data reuse; nflverse `draft_picks` (1980+) covers the modern era
- Scores: Q 7 / Cov 7 / Rel 6 / Lat 4 / Hist 9 / Doc 2 / DX 2 / Cost 10 / Lic 1 / Com 1 / RL ~4 / NFL 6 = **4.9**

### Draft order (computed) and other draft items
- Draft order is computable from standings plus the NFL's draft-order rules (non-playoff teams by record, ties by strength of schedule, playoff teams by round of exit). nflseedR's simulator outputs draft order (MIT; already a project reference). Inputs: nflverse `games` (results) → standings → SOS
- Pro-day results: no open, licensed source found (published piecemeal by teams, NFL.com and media) — gap
- PFF college grades: paid PFF product — pricing UNVERIFIED; do not scrape (see thadhutch/sports-quant warning)
- Scouting reports (NFL.com, The Athletic, PFF, The Beast): copyrighted text — **never copy**; link out or summarise one or two facts in own words with a link

### Part F — Awards and honours

| Source | What | History | Licence | Verdict |
|---|---|---|---|---|
| PFR awards pages | AP MVP/OPOY/DPOY/ROY, All-Pro, Pro Bowl, HOF | all years | SR terms (no automated use) | Link/manual reference only |
| nflverse `draft_picks` | per drafted player: `hof` flag, `allpro` and `probowls` **counts**, from PFR | drafts 1980–2026 (102 HOF flags) | CC-BY-4.0 label, PFR upstream | OK for counts on drafted players; no award years, no undrafted players |
| Wikidata (`P166` award received) | award statements with point-in-time qualifiers | **patchy**: SPARQL on 2026-11-25 found 315 "Pro Football Hall of Fame" statements dated 1963–2020, only 11 for "AP NFL Defensive Player of the Year Award" (1972–2015), and 0 under the label "AP NFL Most Valuable Player Award" | **CC0** | Usable licence, incomplete data: good as an id hub, needs curation before display |
| Pro Football Hall of Fame (profootballhof.com) | official enshrinee list | 1963– | site terms not read | Link; curate the list by hand (facts) |
| AP (awards announcer) | official award results | – | AP content licence | Facts with link only |

Recommendation: a small hand-curated `awards.json` (facts + source URL per item, like `data/news.json`), seeded from Wikidata (CC0) and checked against PFR/HOF pages by a human. Score for Wikidata as an awards source: Q 6 / Cov 4 / Rel 7 / Lat 4 / Hist 7 / Doc 7 / DX 7 / Cost 10 / Lic 10 / Com 10 / RL 7 / NFL 5 = **7.0**.

### Wikidata — awards and honours (`P166` award received)
- Links: https://query.wikidata.org/sparql · licence CC0 (Wikidata structured data)
- Category · Class: awards, honours, identity hub · 🔵 Public/open data
- Provides: award statements with point-in-time qualifiers; external ids (PFR, ESPN, NFL ids exist as properties — not checked this session)
- History · Live · Latency: patchy (HOF statements dated 1963–2020: 315; AP DPOY: 11; "AP NFL Most Valuable Player Award" label: 0) · no · community edits
- Technical: SPARQL endpoint · JSON · Auth none (User-Agent requested by Wikimedia policy) · Rate limits: query-time limits (not re-read this session)
- Cost: free · Licensing: CC0 — no attribution required (credit anyway)
- Quality: accurate where present; incomplete — needs curation
- Scores: Q 6 / Cov 4 / Rel 7 / Lat 4 / Hist 7 / Doc 7 / DX 7 / Cost 10 / Lic 10 / Com 10 / RL 7 / NFL 5 = **7.0**
- Recommendation: PRIMARY seed for a curated `awards.json`, checked by hand against PFR/HOF pages
- Verified: 2026-11-25 — one SPARQL query (counts above)

### Historical depth (dedicated table)

Bands: **All history** = from 1920; **30+** = starts 1996 or earlier; **20+** = 2006 or earlier; **10+** = 2016 or earlier; **5+** = 2021 or earlier; **<5** = later. "Verified" = asset names or parsed file this session.

| Source / dataset | First – last season | Seasons | Band | Still updating? | Verified how |
|---|---|---|---|---|---|
| nflverse `rosters` | 1920 – 2026 | 107 | All history | yes (daily) | asset names |
| Pro Football Reference (site) | 1920 – 2026 | 107 | All history | yes | search snippets only |
| Neil Paine NFL Elo (MIT) | 1920 – 2024 (SB LIX) | 105 | All history | **no** (last commit 2025-02-10) | file head/tail |
| 538 `nfl-elo-game` (MIT) | 1920 – 2020 | 101 | All history | **no** | file parsed |
| 538 `nfl_elo.csv` (datahub mirror) | 1920 – 2017 | 98 | All history | **no**; original URL dead | headers + tail |
| DraftHistory.com | 1936 – 2026 (per combineR README) | 90 | 30+ | yes | home page; years from combineR README |
| spreadspoke (Kaggle) | scores 1966 – 2025; lines 1979 – 2025 | 60 / 47 | 30+ | yearly (v82, 2026-02-11) | Kaggle metadata |
| nflverse `draft_picks` | 1980 – 2026 | 47 | 30+ | yes | parsed |
| FTN DVOA archive | ~1979/1981 – 2026 | ~46 | 30+ | yes (paid) | search snippets only |
| PFR play-by-play | 1978 – 2026 | 49 | 30+ | yes | PFR blog via search snippet |
| nflverse `pbp`, `stats_player`, `stats_team`, `schedules` | 1999 – 2026 | 28 | 20+ | yes (nightly / 5 min) | asset names + parsed games |
| nfldata `officials.csv` | 1999 – 2026 wk 5 | 28 | 20+ | stale since 2026-10-09 | parsed |
| nflverse `combine` | 2000 – 2026 | 27 | 20+ | yearly | parsed |
| The Prediction Tracker results | 2000 – 2026 | 27 | 20+ | yes | page read |
| ThompsonJamesBliss WeatherData | 2000 – 2020 | 21 | 20+ | **no** | README |
| nflverse `depth_charts` | 2001 – 2026 | 26 | 20+ | yes (format change 2025) | asset names |
| nflverse `weekly_rosters` | 2002 – 2026 | 25 | 20+ | yes | asset names |
| nfldata `standings`, `weekly_standings` | 2002 – 2026 | 25 | 20+ | yes | parsed |
| nflverse `trades` / nfldata `trades.csv` | 2002-03-04 – 2026-04-17 | 25 | 20+ | **stale since April 2026** | parsed both |
| ESPN QBR (nflverse `espn_data`) | 2006 – 2026 | 21 | 20+ | yes | parsed |
| ffopportunity expected fantasy points | 2006 – | 21 | 20+ | yes (nflreadr loader) | loader source |
| nfldata `closing_lines.csv` | 2006 – 2018 | 13 | 10+ | **frozen 2019** | parsed |
| nfldata `win_totals.csv` | 2003 – 2020 | 18 | 20+ | **frozen 2021** | parsed |
| CFB pbp, ESPN-derived (cfbfastR) | 2004 – 2026 | 23 | 20+ | yes | loader docs |
| nflverse `injuries` | 2009 – 2026 | 18 | 10+ | yes | asset names |
| nfelo `nfelo_games.csv` | 2009 – 2026 wk 12 | 18 | 10+ | yes | parsed |
| Kaggle Horowitz pbp | 2009 – 2018 | 10 | 10+ | **frozen 2018** | Kaggle metadata |
| nflverse `snap_counts` | **2013** – 2026 (2012 file empty) | 14 | 10+ | yes | 2012 file read |
| stats.ncaa.org pbp (cfbfastR) | 2013 – 2026 | 14 | 10+ | yes | loader docs |
| CFBD pbp (cfbfastR) | 2014 – 2026 | 13 | 10+ | yes | loader docs |
| nflverse `officials` | 2015 – 2026 wk 1 | 12 | 10+ | **stale since 2026-09-02** | parsed |
| nflverse `nextgen_stats` | 2016 – 2026 | 11 | 10+ | yes | asset names |
| nflverse `pbp_participation` | 2016 – 2025 | 10 | 10+ (5+ per source: NGS 2016–22, FTN 2023–25) | yearly, post-season | asset names |
| nflverse `pfr_advstats` | 2018 – 2026 | 9 | 5+ | yes | asset names |
| nfelo projection ledger | 2021 – 2026 | 6 | 5+ | yes | parsed |
| nflverse `ftn_charting` | 2022 – 2026 | 5 | <5 complete seasons (4 + current) | yes | asset names |
| Big Data Bowl tracking | samples 2017 – 2025 | sampled weeks only | n/a | yearly | GitHub + 2027 article |
| Wikidata HOF statements | 1963 – 2020 (point-in-time) | – | patchy | community | SPARQL |
