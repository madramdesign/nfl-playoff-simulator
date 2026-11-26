# NFL API Research Log

Part of the NFL data and API universe research (NU-018, Nov. 25, 2026). Start at [NFL_API_UNIVERSE.md](NFL_API_UNIVERSE.md).

## Method

- **When:** Nov. 25, 2026 (all access dates below are that day unless a row says otherwise).
- **Who:** ten research agents, one per domain (R1–R10), working at the same time and read-only on the repository; then two verification agents (V1, V2) re-checking the claims most at risk; the orchestrator merged the results. Agent definitions: `.claude/agents/researcher.md`, `.claude/agents/red-team.md`.
- **Tools:** web search (one shared allowance for the whole session, about 200 searches, used up partway through the tracks), direct page reads, the `gh` command line for GitHub repositories, releases and code, and single `curl` probes of key-free endpoints with a generic user agent and no personal data.
- **Not done:** no accounts, trials, sign-ins, keys, cookies or accepted terms; no CAPTCHA or bot-block was bypassed; no large datasets were downloaded except the small files named in the logs (for example nfldata `games.csv`, Sleeper's player file once to count fields), all kept outside the repository.
- **Interruption:** a usage limit stopped the session in the evening of Nov. 25; R5 had finished its file, V1 and V2 were re-run from the start of their lists in a second session the same evening.

Each section below is the log a track kept: the searches it ran and every page or endpoint it read or probed, with the outcome (ok, refused, 404, paywalled, JavaScript-only).

## R1. Official NFL sources and league structure

From [tracks/R1-official-nfl.md](tracks/R1-official-nfl.md), section 8.

| # | Query / URL | Outcome |
|---|---|---|
| 1 | Read repo: CLAUDE.md, docs/NFL_DATA_SOURCE_REGISTRY.md, docs/GITHUB_RESEARCH.md, docs/FEATURE_RESEARCH.md L160–244 | ok |
| 2 | curl https://www.nfl.com/robots.txt | ok 200: disallows /_ctv/, /_fantasy-app/, /_mobile-app/, /account/, /search/ etc.; Mediapartners-Google barred from /stats/player-stats/*; no general bar on /injuries, /transactions, /standings, /schedules |
| 3 | curl https://api.nfl.com/v1/games ; /football/v2/games/season/2026/seasonType/REG/week/12 | 401 Unauthorized (Varnish) — auth required |
| 4 | curl https://www.nfl.com/liveupdate/scores/scores.json ; /liveupdate/scorestrip/ss.xml ; /liveupdate/game-center/2019090500/2019090500_gtd.json | 301 → https://www.nfl.com/ (retired legacy GameCenter/scorestrip feeds) |
| 5 | curl https://developer.nfl.com/ | 401, page redirects to oauth.dm.nfl.com (`client_id=developer-portal`): private NFL portal, no public sign-up |
| 6 | curl https://www.nfl.com/injuries/ | 200 text/html 393 KB, server-rendered: title "Official Latest NFL Injury Report for Players - Week 12 of the 2026 Season", 23 per-team tables (Player, Position, Injuries, Practice Status, Game Status) |
| 7 | curl https://www.nfl.com/transactions/ ; /standings/ ; /schedules/ | 200 HTML ("2026 NFL League Transactions"); 200 HTML ("2026 NFL Division Standings"); 308 → /schedules |
| 8 | WebFetch https://www.nfl.com/legal/terms/ | ok: updated May 16, 2024; operated by NFL Enterprises LLC; §8 links only to home page without permission; §1.3 no systematic retrieval; §6 Modular Content (RSS) conditions; NY law, AAA arbitration |
| 9 | curl https://nextgenstats.nfl.com/ ; /robots.txt ; app bundle /dist/app.*.js | 200 Vue SPA; robots `Disallow:` (empty); bundle references api.ngs.nfl.com, api.nfl.com and relative /api/statboard/*, /api/live/*, /api/leaders/* paths |
| 10 | curl https://nextgenstats.nfl.com/api/statboard/passing?season=2025&seasonType=REG | 401, empty body (CloudFront) — token required |
| 11 | curl https://appapi.ngs.nfl.com/statboard/passing?... | TLS failure: certificate expired (legacy host, CNAME to CloudFront) |
| 12 | curl https://operations.nfl.com/robots.txt ; /the-rules/nfl-tiebreaking-procedures ; /the-rules/2026-nfl-rulebook | 404 / 404 / 404 — site restructured (Next.js); old /the-rules/ paths dead |
| 13 | curl https://operations.nfl.com/ (nav) | 200; new paths /rules-officiating/2026-nfl-rulebook, /calendar-events/nfl-schedule/making-the-schedule, /game-operations-logistics/technology/performance-tracking-data-next-gen-stats, /platforms-initiatives/international-growth/nfl-international-games; no tiebreaking or officials-roster page in nav |
| 14 | curl those four operations.nfl.com pages | 200 each; text extracted (flex rules, 2026 international slate summary, tracking-system description) |
| 15 | curl -I static.www.nfl.com rulebook PDF (tqivdkzt9mu6wdgsh1ku.pdf) | 200 application/pdf 3.8 MB, last-modified 2026-07-23 (linked from 2026 rulebook page) |
| 16 | curl -I static.www.nfl.com .../media-guides/2024/2024_Record_and_Fact_Book_incl_Supplemental.pdf | 200 application/pdf 27 MB, last-modified 2024-09-11 (still the "Record & Fact Book" footer link on operations.nfl.com) |
| 17 | curl -I .../media-guides/2025/2025_Record_and_Fact_Book.pdf (guessed name) | 404 (guess; not evidence that no 2025 edition exists) |
| 18 | curl https://nflcommunications.com/ ; /robots.txt | 301 → https://media.nfl.com/ ; robots → mediaarchive.nfl.net/robots.txt (403) |
| 19 | curl https://media.nfl.com/ ; /football-information ; one "What To Look For – Week 12" article | 200 (Adobe AEM); public articles + PDF at media.nfl.com/content/dam/communications/football-communications/2026/what-to-look-for/WTLF%20Week%2012.pdf; categories incl. Playoff Scenarios, Weekly Preview/Capsules, Awards |
| 20 | curl media.nfl.com /news-and-releases/media/transactions, /injury-reports, /game-day-rosters, /assets/guides-publications | 401 each — login (Okta SAML, login.nfl.net); site says registration "granted solely to members of news organizations who cover the NFL on-site" |
| 21 | WebSearch "operations.nfl.com tiebreaking procedures" | ok; pointed to nfl.com/standings/tie-breaking-procedures, support.nfl.com article, nflseedr |
| 22 | WebSearch "operations.nfl.com rules tiebreaking 2026 NFL rulebook" (extended) | ok; only secondary sources; no operations.nfl.com tiebreak page |
| 23 | WebFetch https://www.nfl.com/standings/tie-breaking-procedures | ok; 12-step division, 11/12-step wild-card procedures incl. net points in common / conference games, net TDs, coin toss; no season/date on page |
| 24 | WebSearch "Genius Sports NFL official data Next Gen Stats agreement extension 2026" (extended) | ok; June 11, 2025 extension; Oct 15, 2026 X/Gametime release |
| 25 | WebFetch geniussports.com newsroom 2025 NFL extension | ok: June 11, 2025; through end of 2029 season; exclusive distributor of real-time official PBP, NGS, official betting feed to media and betting operators globally; FANHub ad inventory |
| 26 | WebFetch nfl.com/news/nfl-extends-strategic-partnership-with-genius-sports | ok, but this is the 2023 extension (through 2027-28); no date shown on page |
| 27 | WebSearch "Sportradar NFL API data not official after Genius Sports exclusive deal..." (extended) | ok; 2021 switch from Sportradar to Genius (CNBC, ESPN, Action Network) |
| 28 | WebFetch nationalfootballpost.com 2026/05/29 nfl-genius-sports-reach-data-deal | refused (403) |
| 29 | WebSearch "Sportradar NFL API v7 documentation..." ; WebFetch developer.sportradar.com/football/reference/nfl-faq | ok; FAQ describes in-house data entry, weekly league stat changes; does not claim official status |
| 30 | WebSearch "Genius Sports official NFL data feed for media apps licensing contact sales..." | ok; no pricing or self-serve portal found |
| 31 | WebSearch "NFL Pro pro.nfl.com subscription price All-22 Next Gen Stats NFL+ Premium 2026" (extended) | ok; prices only from search snippets of support.nfl.com |
| 32 | curl pro.nfl.com ; /robots.txt ; nfl.com/legal/subscriptions_terms | 200 SPA ("NFL Pro"); robots 404; terms 200 |
| 33 | WebFetch nfl.com/legal/subscriptions_terms | ok: updated Sept 4, 2026; §1(d) personal non-commercial; §12(e) no archiving/republishing; §14(d) no scraping; NFL+ Premium includes NFL Pro "including NextGen Stats" |
| 34 | WebFetch pro.nfl.com | JS-only ("Connecting to Next Gen Stats..."); no feature text |
| 35 | WebFetch support.nfl.com NFL+ price article ; Game Books article | refused (403) both |
| 36 | WebSearch "NFL official game book PDF static.nfl.com gamebooks download" ; "\"static.www.nfl.com\" gamecenter pdf game book" | ok; support articles say game books are in Game Center; nfl-scraper repo |
| 37 | curl https://www.nflgsis.com/ → /GameStatsLive/ | 200 login page: "As of July 7, 2026, our login process has changed"; NFL, club or media.nfl.com users log in; others "Register ... to request access" |
| 38 | curl https://static.nfl.com/robots.txt | DNS: could not resolve host (legacy static.nfl.com gone) |
| 39 | curl nfl.com/schedules/2026/REG11/ ; /schedules/2026/by-week/reg-11 | 200 HTML 2.4 MB; Week 12 list incl. Wed Nov 25 Packers at Rams (Netflix), Thu tripleheader, Fri Nov 27 Broncos at Steelers 3:00 PM (Prime) |
| 40 | curl nfl.com/games/dolphins-at-bills-2026-reg-11 | 200; "Download Game Book (PDF)" link → static.www.nfl.com/image/upload/v1795434524/gamecenter/<uuid>.pdf; page also links 2026 Record & Fact Book |
| 41 | curl -I that game book PDF ; 2026-Record-and-Fact-Book.pdf | 200 PDF 336 KB, last-modified 2026-11-23 11:48 UTC (game Sun Nov 22); 200 PDF 22.8 MB, last-modified 2026-07-28 |
| 42 | WebFetch + Read game book PDF pp.1–3, 10, 19 | ok: 19 pages; header notice restricts use to media coverage; weather, officials, lineups, inactives, scoring, attendance, game time, individual stats, full play-by-play, snap counts |
| 43 | Wikidata SPARQL (query.wikidata.org) NFL teams (P118=Q1215884, P31=Q17156793) with P286, P505, P127, P6364 | 200 JSON; 32 teams; GM (P505) on 4 teams; owner (P127) on 24 with errors (Ravens owner = Eric DeCosta, Seahawks = Paul Allen); P6364 colour on 0 |
| 44 | Wikidata SPARQL P286 statements with P580/P582 qualifiers | 200; 140 statements; open-ended head coach matches nflverse 2026 coach for 18 of 32 teams |
| 45 | curl raw.githubusercontent.com/nflverse/nfldata/master/data/games.csv | 200 2.2 MB; 2026: 272 games, weekdays Sun 228/Thu 19/Mon 17/Fri 4/Wed 2/Sat 2; 9 neutral (international) games; home_coach/away_coach for all 32; referee filled for 65 of 163 completed 2026 games |
| 46 | WebSearch "NFL team schedule calendar sync ECAL terms ..." ; "ecal.com NFL club schedule sync calendar ECAL terms of use" | ok; third-party calendar sites; ECAL terms not found |
| 47 | WebSearch "NFL official team colors source style guide hex codes teamcolorcodes.com accuracy" | ok; designplaybook.nfl.com, teamcolorcodes.com, GitHub teamcolors |
| 48 | curl designplaybook.nfl.com/color ; /robots.txt | 200; league masterbrand palette only; robots `Allow: /` |
| 49 | curl chiefs.com, packers.com, giants.com /schedule/ ; stanzacal.com/nfl-giants/ | 200 each; Giants "Add to Calendar" → Stanza; Chiefs/Packers JS widget; Stanza JS app |
| 50 | WebSearch "NFLPA public salary cap report active players list nflpa.com terms of use data" | ok |
| 51 | curl nflpa.com/robots.txt, profootballhof.com/robots.txt, /terms-of-use | 200, 200, 404 (real terms at /service/terms-of-use) |
| 52 | curl nflpa.com home (links) ; WebFetch nflpa.com/reports/public-salary-cap-report ; nflpa.com/tos | ok; report JS-only ("loading..."); ToS read (§3.1, 3.4, 3.5, 4.1) |
| 53 | curl profootballhof.com home (links) ; WebFetch /service/terms-of-use | ok; Terms effective Feb. 24, 2026 (§3 no scraping/data mining, no commercial use) |
| 54 | WebSearch "Super Bowl LXI LXII LXIII host sites announced ..." | ok; secondary sources only (CBS, Fox, NBC, SI) |
| 55 | WebSearch "2026 NFL flexible scheduling rules ..." (extended) | ok; Chargers.com, Yahoo, Sportscal; TNF window conflict |
| 56 | WebSearch "2026 NFL officiating crews referees roster list official site" | ok; Football Zebras 2026 crews (17 crews, 121 officials), ESPN/FOS on referees' CBA |
| 57 | curl nfl.com/transactions/ (structure) | 200; one table (From, To, Date, Name, Position, Transaction); monthly pages /transactions/league/{trades,signings,waivers,terminations,reserve-list,other}/2026/11 |
| 58 | gh search code "api.nfl.com/identity/v3/token" ; gh search repos "nfl gamebook parser" | ok: sportsdataverse-js, lightning-dabbler/sportscrape, yt-dlp forks, toddrob99/redball; no gamebook-parser repos |
| 59 | gh api sportsdataverse/sportsdataverse-js (meta + src/core/auth.ts) | MIT, 89 stars, pushed 2026-11-25; `nfl_api` token family (`nflTokenGen`) |
| 60 | WebFetch operations.nfl.com/updates/the-game/2023-nfl-record-and-fact-book | 404 (old path) |
| 61 | WebSearch "\"Record and Fact Book\" NFL 2026 contents ..." | ok; nothing relevant |
| 62 | WebFetch 2026-Record-and-Fact-Book.pdf | refused by tool: file over 10 MB |
| 63 | curl nfl.com/standings/ (legend) ; /standings/playoff-picture | 200; legend x Clinched Playoff, y Clinched Wild Card, z Clinched Division, * Division and Homefield; playoff picture 200 |
| 64 | WebSearch "NFL Big Data Bowl 2026 Kaggle data license ..." ; WebFetch kaggle.com/competitions/nfl-big-data-bowl-2025/rules | search ok; Kaggle rules JS-only |
| 65 | WebSearch "nfl.com Bills-Bengals game will not be resumed no contest ..." | ok; buffalobills.com, ESPN, SI, Yahoo |
| 66 | gh api nflverse/nfldata contents/data ; curl data/teams.csv, officials.csv, teamcolors.csv, standings.csv ; gh api commits per file | 200 each; officials 2026 = 65 games (last commit 2026-10-09); teamcolors last commit 2020-07-03; standings 2026-11-24 |
| 67 | grep (read-only) repo docs/src/scripts/lib for operations.nfl.com, nflcommunications.com, weekday | no links; weekday mentioned in src/universe/00-core.js, 12-game.js, lib/fabric/score.js, scripts/evaluate.py |
| 68 | WebSearch "\"developer.nfl.com\" API" | not run: session web-search budget exhausted |
| 69 | WebFetch wikidata.org/wiki/Wikidata:Licensing ; mediawiki.org Wikidata_Query_Service/User_Manual | ok: CC0; 60 s deadline, 60 s/min processing, 30 errors/min, 5 parallel per IP, 429 + Retry-After, User-Agent required |

## R2. Commercial and freemium multi-domain providers

From [tracks/R2-commercial-providers.md](tracks/R2-commercial-providers.md), section 8.

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

## R3. Play-by-play, advanced analytics, coaching, officiating, special teams

From [tracks/R3-pbp-analytics.md](tracks/R3-pbp-analytics.md), section 8.

All on 2026-11-25. gh = GitHub CLI (read-only API calls); curl used a generic User-Agent (nfl-universe-research/1.0), no keys or cookies.

- gh api repos/nflverse/nflverse-data/releases (all tags) — ok (2026-11-25)
- gh api .../releases/tags/{pbp,pbp_participation,ftn_charting,officials,espn_data,nextgen_stats,pfr_advstats,snap_counts} asset lists with updated_at — ok
- gh api repos/nflverse/nflreadr/contents/data-raw/dictionary_{pbp,participation,ftn_charting,nextgenstats,pfr_passing,snap_counts,espn_qbr,schedules}.csv — ok
- gh api repos/nflverse/nflfastR/contents/NEWS.md — ok (dev version notes: EP/WP/xpass rebuilt)
- gh api repos/nflverse/nflfastR/releases — ok (v6.0.0 2026-09-18)
- gh api repos/nflverse/nflverse-pbp (readme, .github/workflows/update_data.yaml, exec/update_data.R, R/raw_pbp.R, releases raw_pbp_2026) — ok
- gh api orgs/nflverse/repos — ok (found nflverse-pbp-internal, undercover "Proxy Scraping", nflverse-ftn, ngs-data, nflverse-pff, nflverse-pfr GPL-3.0)
- gh api repos/nflverse/nflverse-ftn (R/participation.R, exec/update_ftn_participation.R, workflows) — ok
- gh api repos/nflverse/nflverse-data/contents/LICENSE.md — ok (plain CC-BY-4.0 text, no FTN clause)
- gh api repos/nflverse/nflreadr/contents/R/load_{ftn_charting,participation,officials,nextgen_stats,pfr_advstats,snap_counts,espn_qbr,pbp}.R — ok
- curl https://github.com/nflverse/nflverse-data/releases/download/officials/officials.csv — 200, 1.29 MB, 2015–2026 (2026 = week 1 only)
- gh search code "release_tag = \"officials\"" owner nflverse → nflverse-rosters/exec/update_officials.R — ok (scrapes NGS via ngsscrapR)
- gh run list -R nflverse/nflverse-rosters --workflow update_officials.yaml — daily failures 2026-09-07..09-14
- gh api commits?path=.github/workflows/update_officials.yaml — ecc6ef1 2026-09-15 "Disable schedule because the workflow keeps failing"
- curl .../pbp/play_by_play_2026.csv.gz — 200, 11.4 MB; 28,467 rows × 372 cols, weeks 1–11, 163 games, max game_date 2026-11-23
- curl .../ftn_charting/ftn_charting_2026.csv — 200, 4.7 MB; 27,636 rows, weeks 1–11
- curl .../pbp/timestamp.json → {"last_updated":"2026-11-25 14:12:56 EST"}; ftn_charting/timestamp.json → "2026-11-25 07:01:33 EST"
- curl .../pbp_participation/pbp_participation_2025.csv (first 3 KB only) — 200; header matches dictionary
- gh api repos/nflverse/nflfastR/commits (2026-11-25: "bump dev version to make clear what's included in rebuild", EP model PR #644) — ok; DESCRIPTION Version 6.0.0.9001, License MIT + file LICENSE
- gh run list -R nflverse/nflverse-pbp --workflow update_data.yaml — ok (scheduled + manual runs, all success 2026-11-24/25)
- gh api .../releases/tags/pbp parquet update times — 2001–2026 all rebuilt 2026-11-25; 1999 (2025-04-30) and 2000 (2025-07-16) not rebuilt
- python analysis of pbp 2026 (time_of_day, end_clock_time, drive_real_start_time, play_clock, penalties, declined/offsetting, replay, kickoffs, punts, temp/wind/roof) — ok
- python analysis of FTN 2026 (weeks, date_pulled, value distributions) — ok
- curl .../nextgen_stats/ngs_passing.csv.gz, pfr_advstats/advstats_week_{pass,def}_2026.csv, espn_data/qbr_week_level.csv.gz, snap_counts/snap_counts_2026.csv — all 200; column lists and week coverage recorded
- ftndata.com → 302 to ftnfantasy.com/stats/sports-data → 403 (curl and WebFetch); ftnfantasy.com/robots.txt → 403. FTN pricing only via search snippets (UNVERIFIED)
- https://charting.ftntools.com/api/docs — 200 (Swagger UI shell); /api/openapi.json — 200, 146 paths, auth = query param `key`
- WebSearch "FTN Data NFL API pricing charting data license" (extended); "FTN Data charting API "$5,000" ..." (extended); "FTN DVOA data download subscription price 2026" (no relevant results)
- WebSearch "PFF data API for businesses ..." (extended); https://www.pff.com/terms — ok (Last Updated Oct 12, 2026); https://developer.pff.com/ — ok; /reference/ — JS shell; https://developer.pff.com/openapi.json — 200, 1.2 MB, v2.1.0; https://www.pff.com/subscribe — ok (prices)
- WebSearch "PFF enterprise data licensing teams sportsbooks ..."; https://teamworks.com/blog/teamworks-acquires-pff-enterprise/ — ok; https://b2b.pff.com → 301 to teamworks.com
- WebSearch "Sports Info Solutions SIS DataHub NFL data API licensing pricing" (extended); https://www.sportsinfosolutions.com/ — ok; https://pro.sisdatahub.com/Home/FAQ — ok (prices)
- WebSearch "sportsinfosolutions.com terms of service ..." (SIS ToS not found); https://www.sports-reference.com/data_use.html — ok; https://www.sports-reference.com/bot-traffic.html — ok
- curl https://www.pro-football-reference.com/robots.txt and /years/2025/passing_advanced.htm — 403 Cloudflare managed challenge (not bypassed)
- gh search code "undercover" owner nflverse — nflverse-pfr R/game_snaps.R, R/game_advstats.R, R/combine.R, auto/update_draft_picks.R and nflverse-players use undercover::scrapeops_request (proxy scraping)
- WebSearch "Pro Football Reference advanced passing stats "Sports Info Solutions" ..."; https://www.pro-football-reference.com/about/advanced_stats.htm — 403; faq.stathead.com / info.sports-reference.com knowledge pages — 404; https://sports-reference.com/blog/2019/09/adding-advanced-stats-to-pro-football-reference-for-2018-and-2019/ — ok (Sportradar)
- WebSearch "Sportradar NFL API v7 play-by-play push feed ..."; https://developer.sportradar.com/football/reference/nfl-overview — ok; /football/reference/nfl-faq — ok (partial, 100k of 105k chars); WebSearch "... NFL historical coverage ..." ; WebSearch "Sportradar API trial "1,000" ..."; https://developer.sportradar.com/getting-started/docs/your-account — ok; https://developer.sportradar.com/football/docs/nfl-ig-push — ok
- WebSearch "SportsDataIO NFL play-by-play API pricing free trial ..." (extended); https://sportsdata.io/free-trial — ok; https://sportsdata.io/help/data-rights-and-licensing-questions — ok
- WebSearch "NFL Genius Sports official data distribution rights extension ..."; WebSearch "nfl.com liveupdate game-center json feed discontinued ..."
- curl www.nfl.com/liveupdate/game-center/2019090500/2019090500_gtd.json → 301 to nfl.com home; www.nfl.com/liveupdate/scores/scores.json → 301 home; feeds.nfl.com/feeds-rs/scores.json → 403
- curl site.api.espn.com .../scoreboard?dates=20261123 → 200 (1 event, CIN at WAS final); .../summary?event=401873078 → 200, 625 KB, 20 drives, play keys incl. id, sequenceNumber, wallclock, modified, isPenalty; 182 win-probability points (research existence check only; Disney ToU applies)
- WebSearch Sumer, TruMedia, Sharp; https://sumersports.com/terms-of-service/ — ok (effective May 19, 2025); https://www.sharpfootballanalysis.com/terms-of-service/ — ok
- https://rbsdm.com/ — 200, JavaScript SPA shell only (no terms visible); gh search repos rbsdm
- WebSearch "nflpenalties.com penalty data source terms referee stats"; curl https://nflpenalties.com/robots.txt (Allow: /); homepage 200 "Data From 2009-2026", no terms or source statement found
- WebSearch Football Zebras 2026 assignments; WebSearch operations.nfl.com officials roster 2026; https://www.footballzebras.com/2026/08/officiating-crews-for-the-2026-season/ — ok
- curl https://raw.githubusercontent.com/nflverse/nfldata/master/data/games.csv — 200, 2.2 MB; coach/referee/temp/surface coverage by week analysed
- WebSearch coordinators/play-callers datasets; gh search repos "nfl coordinators", "nfl play callers"
- Wikidata SPARQL (query.wikidata.org) current head coaches of NFL teams (P286 without end date) — 200, 30 rows, many stale (e.g. Raiders "Antonio Pierce", Jets "Jeff Ulbrich")
- https://www.nfl.com/legal/terms/ — ok (Updated May 16, 2024)
- WebSearch Big Data Bowl data license; WebSearch nflfastR EP/WP model documentation
- WebSearch "NFL dynamic kickoff rule 2026 changes touchback 35 return rate 2025 season data" — ok (AP/NFL/SI results)
- WebSearch "field goal success temperature wind altitude study NFL kicking weather effect analysis" — ok (Sloan, Phys.org, Covers, Lewin, Ledoux results; papers not opened)
- WebSearch "nfl4th fourth down decision model ..." — refused: shared 200-search budget exhausted; no further WebSearch calls were made
- https://operations.nfl.com/updates/football-ops/new-nfl-kickoff-rule/ — 404
- https://www.si.com/nfl/explaining-five-new-nfl-rules-for-2026-season — ok (2026 kickoff changes)
- gh api repos/nflverse/nfl4th (+ DESCRIPTION, README) — ok (MIT, 1.0.7.9002)
- curl https://nextgenstats.nfl.com/ — 200; robots.txt "Disallow:" (empty); gh search code "nextgenstats.nfl.com/api" → ngs-data/R/ngs_functions.R statboard URLs
- https://operations.nfl.com/the-game/big-data-bowl/terms-and-conditions — 404
- https://www.nfl.com/news/nfl-extends-strategic-partnership-with-genius-sports — ok (no date shown); https://www.businesswire.com/news/home/20250611456305/en — 403
- gh api repos/nflverse/fastrmodels (+ DESCRIPTION 2.1.0, MIT); nflfastR README model section — ok
- https://www.nfeloapp.com/ — ok; gh api repos/greerreNFL/nfelo/contents/LICENSE — ok; gh api repos/nflverse/espnscrapeR-data — ok (no licence)
- curl .../pbp_participation/pbp_participation_{2016,2022,2025}.csv — 200 (21/22/49 MB), analysed, then deleted
- gh api repos/nflverse/nflreadr/contents/data-raw/dictionary_{playerstats.csv,team_stats.json} — ok
- Earlier WebSearch queries (all "standard" unless noted): "FTN Data NFL API pricing charting data license" (extended); "FTN DVOA data download subscription price 2026 "DVOA" ftnfantasy"; "FTN Data charting API "$5,000" OR "per year" commercial private pricing FAQ" (extended); "PFF data API for businesses NFL data feed licensing ..." (extended); "PFF enterprise data licensing teams sportsbooks ..."; "Sports Info Solutions SIS DataHub NFL data API licensing pricing" (extended); "sportsinfosolutions.com terms of service data reuse ..."; "Pro Football Reference advanced passing stats "Sports Info Solutions" ..."; "Sportradar NFL API v7 play-by-play push feed documentation latency trial"; "developer.sportradar.com NFL "historical" coverage ..."; "Sportradar API trial "1,000" requests ..."; "SportsDataIO NFL play-by-play API pricing free trial terms latency" (extended); "NFL Genius Sports official data distribution rights extension ..."; "nfl.com liveupdate game-center json feed discontinued ..."; "Sumer Sports NFL stats site terms of use data download API"; "TruMedia Networks NFL football analytics platform ..."; "Sharp Football Analysis stats subscription data source terms ..."; "nflpenalties.com penalty data source terms referee stats"; "Football Zebras 2026 referee crew assignments week 12 ..."; "operations.nfl.com officials roster 2026 ..."; "NFL offensive defensive coordinators play-callers dataset github csv 2026 ..."; "NFL Big Data Bowl 2026 data license terms Kaggle ..."; "nflfastR expected points win probability model documentation ..."

## R4. Player tracking, Next Gen Stats and computer vision

From [tracks/R4-tracking-cv.md](tracks/R4-tracking-cv.md), section 8.

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

## R5. Weather, stadiums, geospatial and travel

From [tracks/R5-weather-stadium-geo.md](tracks/R5-weather-stadium-geo.md), section 8.

All on 2026-11-25. UA "nfl-universe-research/1.0", no keys, no cookies.

**Repository (read-only):** `CLAUDE.md`; `docs/NFL_DATA_SOURCE_REGISTRY.md`; `docs/GITHUB_RESEARCH.md`; `docs/FEATURE_RESEARCH.md` (lines 160–244 and weather mentions); `shared/teams.json`; `lib/fabric/index.js` (grep); `lib/fabric/adapters/public.js` lines 134–175; `lib/fabric/adapters/nws.js` (grep); `scripts/evaluate.py` (grep); `docs/DECISIONS.md` (grep); `data/model_report.json` (narratives, rejected).

**GitHub (`gh api`):** `repos/nflverse/nfldata` (licence null, pushed 2026-11-25T22:45Z, 381 stars); `/contents/data` (listing); `/contents/data/airports.csv`; `/contents/DATASETS.md`; `/contents/README.md`; `repos/ThompsonJamesBliss/WeatherData` (+README, stadium_coordinates.csv).

**Downloads (single):** `raw.githubusercontent.com/nflverse/nfldata/master/data/games.csv` (200, 2,192,463 B); `davidmegginson.github.io/ourairports-data/airports.csv` (200, 12.8 MB).

**Probes:**
- `api.open-meteo.com/v1/forecast` (Buffalo; units) — 200, snowfall unit "inch".
- `historical-forecast-api.open-meteo.com/v1/forecast` — 2016-01-03 (200, all null), 2021-01-03 (200), 2025-12-14 (200), 2025-09-07..2026-01-05 (200).
- `previous-runs-api.open-meteo.com/v1/forecast` — 200, previous_day1/2/3 columns.
- `archive-api.open-meteo.com/v1/archive` — 1960-01-03 ERA5 (200); 2025 season (200).
- `api.open-meteo.com/v1/elevation` (Denver, Buffalo) — 200.
- `api.open-meteo.com/v1/forecast` with 34 venues, `timezone=auto` — 200, 34 results.
- `api.weather.gov/points/42.7738,-78.787` — 200; `/gridpoints/BUF/39,42/forecast/hourly` — 200 (156 periods); `/gridpoints/BUF/39,42/stations?limit=5` — 200; `/stations/KBUF/observations/latest` — 200; `/stations/KBUF/observations?start=…` for 2026-10-01, 11-10, 11-15 (0 features) and 11-22 (11 features).
- `mesonet.agron.iastate.edu/cgi-bin/request/asos.py?station=BUF…2025-09-01..2026-01-06` — 200, 3,042 rows.
- `mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/5/8/11.png` — 200 PNG.
- `www.ncei.noaa.gov/access/services/data/v1?dataset=global-hourly&stations=72528014733…` — 200 CSV.
- `query.wikidata.org/sparql` (NFL teams → P115 venues) — 200, 43 rows; label query — 502; `wikidata.org/w/api.php?action=wbsearchentities&search=Highmark Stadium` — 200; `Special:EntityData/Q16251517.json` — 200.
- `overpass-api.de/api/interpreter` (pitches/stadiums within 700 m of 42.7730, −78.7900) — 200, 5 pitches.
- `nominatim.openstreetmap.org/search?q=Lambeau Field` — 200 (one request).
- `api.rainviewer.com/public/weather-maps.json` — 200 (13 past, 0 nowcast, 0 satellite).
- `noaa-goes19.s3.amazonaws.com/?list-type=2&prefix=GLM-L2-LCFA/2026/329/22/` — 200.
- `opengeo.ncep.noaa.gov/geoserver/conus/conus_bref_qcd/ows?…GetCapabilities` — 200.
- `en.wikipedia.org/wiki/Lambeau_Field` (licence footer) — 200.

**Pages read (WebFetch/curl):** open-meteo.com/en/docs/historical-forecast-api; /en/docs/previous-runs-api; /en/docs/single-runs-api; /en/pricing (+ raw HTML grep); /en/terms; /en/licence; /en/docs/historical-weather-api; /en/docs (raw grep for multi-location); openmeteo.substack.com/p/api-subscriptions-for-commercial; weather.gov/documentation/services-web-api; ncei.noaa.gov/support/access-data-service-api-user-documentation; ncdc.noaa.gov/cdo-web/webservices/v2; ncei.noaa.gov/products/land-based-station/integrated-surface-database; ncei.noaa.gov/products/global-historical-climatology-network-hourly; mesonet.agron.iastate.edu/disclaimer.php; mesonet.agron.iastate.edu/request/download.phtml; dev.meteostat.net/license; rainviewer.com/api.html (+ raw grep); blitzortung.org/en/cover_your_area.php; registry.opendata.aws/noaa-goes/; operations.nfl.com/the-rules/nfl-video-rulebook/inclement-weather/ (404); en.wikipedia.org/wiki/NFL_International_Series (first 100k chars); gml.noaa.gov/grad/solcalc/calcdetails.html; openstreetmap.org/copyright; nflweather.com; nflweather.com/terms_of_use; sports-reference.com/termsofuse.html; sports-reference.com/data_use.html; earthnetworks.com.

**Web searches (this track):** "Open-Meteo API Standard Professional plan price per month euro" (extended) — found the 2023 Substack post; "NFL lightning delay policy 8 miles 30 minutes game operations" — refused, budget exhausted.

**Helper agents (same day; their full URL lists are in their reports and summarised here):**
- *Commercial weather APIs:* Visual Crossing (editions, pricing, terms, JS bundle); Tomorrow.io (weather-api, rate-limiting docs, ToS); OpenWeather (price, one-call-3/4, migration, history, FAQ, T&C of sale PDF); Weatherbit (pricing, terms); WeatherAPI.com (pricing, terms); Pirate Weather (site, docs, GitHub); Apple WeatherKit (get-started, attribution, DPLA Attachment 8); Google Weather API (overview, policies, billing, Service Terms §22); AccuWeather (developer site, FAQ, terms, brand guidelines); Meteomatics (API, pricing); Xweather (pricing, PAYG, legal, docs); Meteostat (license, terms, api, bulk, python, RapidAPI pricing); Met Office DataHub (pricing, FAQ); Bright Sky (site, OpenAPI, GitHub, DWD legal). 7 searches.
- *Geo/maps:* OSMF Nominatim and tile policies; Photon; Google pricing, March 2025 change, geocoding and time-zone policies; Mapbox geocoding docs and pricing; HERE pricing widget JSON; TomTom pricing; Geoapify pricing and terms; LocationIQ pricing; OSRM demo wiki; routing.openstreetmap.de; HeiGIT plans/ToS; USGS EPQS docs and copyright; Open-Elevation; timezone-boundary-builder (gh); TimeZoneDB; IANA tz-link; Node 18 Intl; OurAirports mirror (gh); Protomaps docs; MapLibre (gh); Mapbox GL JS licence; Stadia Maps; MapTiler; Natural Earth terms; Census cartographic boundary and citation pages; 17 U.S.C. §105; FAA LADD and PIA; ADS-B Exchange data products/developer hub; JETNET; OpenSky API docs (terms 403). 3 searches; EPQS and Open-Elevation probed once each.
- *Literature:* PMC3825451 (Smith 2013); PMC5307448 (Song 2017); Frontiers frbhe.2024.1479832 (Lopez & Bliss); Frontiers fphys.2022.892681 (Leota); SSAC "Going for Three" PDF; arXiv 1701.05976, 2104.11595, 2401.16392; PMC8282683 (Higgs & Stavness); nfeloapp.com HFA analysis; PFF HFA article; Covers wind article; SI 2012; UF 2004 press release; The Upside; IDEAS/RePEc abstracts (Nichols 2014, Borghesi 2007/2008, Coleman 2017, Nutting 2010, Nutting & Price 2017, Vergin & Sosik 1999); Europe PMC records. 15 searches; several 403/404 listed in its report.

## R6. Injuries, rosters, depth charts, transactions, contracts

From [tracks/R6-injuries-rosters-transactions.md](tracks/R6-injuries-rosters-transactions.md), section 8.

All on 2026-11-25. "gh" = `gh api` (read-only); "curl" = generic UA, no cookies.

**Repository files read (read-only):** CLAUDE.md; docs/NFL_DATA_SOURCE_REGISTRY.md; docs/GITHUB_RESEARCH.md; docs/DATA_MODEL.md (lines 1–98); docs/FEATURE_RESEARCH.md lines 160–244; lib/fabric/adapters/public.js (grep); docs/DECISIONS.md (grep).

**GitHub (gh):**
- `repos/nflverse/nflverse-data/releases` (25 tags) and tags injuries, depth_charts, weekly_rosters, rosters, contracts, trades, players (bodies, assets, sizes, update times) — OK
- `repos/nflverse/nflreadr/contents/data-raw` + dictionaries injuries, depth_charts, rosters, roster_status, contracts, trades, players — OK
- `repos/nflverse/nflreadr` NEWS.md (depth-chart source change), README (terms of use), R/load_contracts.R, vignettes/articles/nflverse_data_schedule.Rmd — OK
- `repos/nflverse/nflverse-data/contents/.github/workflows` (no update workflows there), LICENSE.md, README — OK
- `orgs/nflverse/repos` — OK
- `repos/nflverse/nflverse-rosters` workflows update_injuries.yaml, update_depth_charts.yaml, update_rosters.yaml; exec/update-injuries.R, exec/update-depth-charts.R (+ commit history), R/rosters_shield.R, R/rosters_dataexchange.R, R/utils_roster_ids.R; Actions runs for the three workflows (30 each) — OK
- `repos/nflverse/nflapi`, `repos/nflverse/nflverse.espn` — 404 (private/not found)
- `repos/nflverse/rotc` DESCRIPTION, LICENSE.md, R/otc_historical_contracts.R, R/otc_player_details.R, workflows/update_otc.yaml — OK
- `repos/nflverse/nflverse-players` README — OK
- `repos/nflverse/nfldata` commits for data/trades.csv — OK
- `repos/dynastyprocess/data` (licence, README, weekly-playerids.yml, files list), code search "mfl" — OK
- `gh search code "R48" / "status_description_abbr" --owner nflverse` — no useful result

**Files downloaded to scratch (curl):** nflverse `injuries_2026.csv` (410 KB), `roster_weekly_2026.csv` (9.6 MB), `players.csv` (7.3 MB), `trades.csv` (287 KB), first 12 MB of `depth_charts_2026.csv`, first lines of `depth_charts_2024.csv`, `depth_charts_2025.csv`, `injuries_2024.csv`; `timestamp.json` for six releases; Sleeper `https://api.sleeper.app/v1/players/nfl` (once; 200; 14,663,309 bytes; headers kept).

**Pages probed or read (curl unless noted):**
- https://www.nfl.com/injuries/ (WebFetch) — week 12 structure; https://www.nfl.com/robots.txt — read; https://www.nfl.com/legal/terms/ — read in full
- https://www.nfl.com/transactions/ and `/transactions/league/{reserve-list,signings,waivers,terminations,other}/2026/11`, `other/2026/9`, `other/2026/3`, `reserve-list/2026/9`, `signings/2026/9`, `signings/2026/3`, `terminations/2026/3` — parsed
- https://www.nfl.com/news/competition-committee-approves-revisions-to-injury-report-0ap3000000688693 (WebFetch) — read
- https://www.nfl.com/news/nfl-training-camp-roster-faqs-defining-injured-reserve-pup-list-nfi-and-more (WebFetch) — read
- https://www.nfl.com/news/approved-2024-nfl-season-playing-rules-bylaws-and-resolutions (WebFetch) — read
- https://operations.nfl.com/updates/football-ops/2016-nfl-injury-report-policy (WebFetch) — 404; https://operations.nfl.com/ — links listed; /the-rules/ 404; robots.txt 404; /rules-officiating/enforcement/compliance and /nfl-football-basics/football-terms — no injury-report policy
- https://media.nfl.com/football-information — links; `/news-and-releases/media/{injury-reports,transactions,game-day-rosters}` — 401; nflcommunications.com → media.nfl.com
- https://www.profootballrumors.com/2024/06/nfl-issues-new-rules-for-ir-activations (WebFetch) — read
- https://www.nationalfootballpost.com/2026/10/23/nfl-injured-reserve-rules (WebFetch) — 403
- https://docs.sleeper.com/ (WebFetch) — read; https://support.sleeper.com/en/articles/5486620-general-terms-of-use (WebFetch ×2, curl) — read
- https://sportsdata.io/nfl-api (WebFetch) — read; https://discoverylab.sportsdata.io/personal-use-apis/nfl (WebFetch, curl; embedded plan JSON parsed); https://discoverylab.sportsdata.io/terms-of-service (curl) — read
- https://developer.sportradar.com/football/docs/nfl-ig-api-basics, .../nfl-ig-update-frequencies, https://developer.sportradar.com/sportradar-updates/changelog/nfl-api-estimated-injury-return-date (WebFetch) — read
- https://www.fantasypros.com/api-data/ (WebFetch) — read; https://api.fantasypros.com/v2/docs (WebFetch) — 403
- https://www.rotowire.com/robots.txt, /llms.txt, /termsandconditions.php, /partner/, /football/injury-report.php (200); /terms.php, /legal/terms.php, /partners/, /data/, /content-partners.php, /football/nfl-depth-charts.php (404)
- https://www.rotoworld.com/ redirects to https://www.nbcsports.com/fantasy; https://www.nbcsports.com/fantasy/football/player-news (WebFetch) — read
- https://www.ourlads.com/nfldepthcharts/, /robots.txt, /tc/ — read; /terms/, /terms.cfm — 404
- https://overthecap.com/terms → /terms-and-conditions — read; /robots.txt — read; /api — 401; /terms-of-use — 404
- https://www.spotrac.com/terms, /robots.txt, /api — 403 (curl); /terms and /service (WebFetch) — 402
- https://nflpa.com/public-salary-cap-report → /reports/public-salary-cap-report (shell only); https://nflpa.com/tos — read; /salary-cap, /active-players/salary-cap — 404
- https://www.sports-reference.com/data_use.html (WebFetch) — read
- https://www.prosportstransactions.com/ and /robots.txt — 403
- https://www.cbssports.com/nfl/injuries/ — 200 (status only)

**Web searches (WebSearch):**
1. "NFL injury report policy 2026 practice participation Wednesday Thursday Friday game status designations" (standard) — NFL.com weekly pages only
2. "NFL operations "injury report" policy questionable doubtful out "probable" eliminated 2016" (standard) — 2016 change coverage, NFL.com article
3. "NFL injured reserve designated to return 2026 rules number of players return 8 games" (standard) — secondary explainers
4. "operations.nfl.com injury report policy practice report "4 p.m." game status report Friday Thursday games" (extended) — secondary sources on deadlines
5. "site:operations.nfl.com injury report" (standard) — nothing on that host
6. "NFL injury report rules "Game Status Report" "Practice Report" clubs must Wednesday "Tuesday" Thursday night game estimated practice report" (extended) — secondary only
7. ""injury report policy" NFL 2025 OR 2026 change league memo clubs fined inaccurate injury report" (extended) — no 2025/26 policy change found
8. "NFL.com terms and conditions automated means scraping "data mining" robots nfl.com/legal/terms" (standard) — pointed to terms page
9. "NFL owners approve injured reserve designated for return eight players 2025 OR 2026 rule change nfl.com" (extended) — 2022 rules; no 2025/26 NFL.com article
10. "nfl.com 2024 owners approve injured reserve two players designated return roster cutdown postseason additional designations" (standard) — 2024 bylaws
11. "OverTheCap nflverse load_contracts permission Jason Fitzgerald data partnership" (standard) — no permission found
12. "Over The Cap data license API "overthecap" licensing contracts data feed" (standard) — nothing official
13. "Sleeper API terms of service commercial use "api.sleeper.app" developers" (standard) — led to General Terms
14. "SportsDataIO NFL API injuries depth charts pricing free trial 2026" (extended)
15. "Sportradar NFL API v7 injuries depth charts transactions endpoint documentation trial" (standard)
16. "RotoWire data feeds API NFL injuries news pricing license" (extended) — no official price
17. "SportsDataIO "Discovery Lab" NFL personal use price per month injuries depth charts" (extended) — third-party prices (then verified on the vendor page)
18. "Sportradar NFL exclusive official data distribution partnership extension 2025 2026 Genius Sports" (standard)
19. "Sportradar developer portal trial key 30 days 1,000 requests NFL "trial" QPS limit" (standard)
20. "FantasyPros API v2 documentation news endpoint injuries "api.fantasypros.com" public/v2" (extended)
21. "Rotoworld player news moved NBC Sports 2026 "player news" fantasy football rotoworld.com redirect" (standard)
22. "NFL 2026 salary cap set official figure per club nfl.com announced" (standard)
23. "NFLPA public salary cap report team cap space "NFLPA" salary cap report page" (standard)
24. "Spotrac API data licensing contracts transactions feed "Spotrac" terms of use scraping" (extended)
25. "prosportstransactions.com football NFL transactions database terms of use copyright reproduction" — **not run**: session web-search budget exhausted
26. "NFL transaction wire daily personnel notice clubs "transaction wire" practice squad elevations standard elevation reverted" — **not run**: budget exhausted

Searches stopped producing new primary sources for injury-report policy text after query 7; the remaining open items need either a follow-up session with search budget or the owner contacting the providers.

## R7. Betting odds, line history, splits, prediction markets

From [tracks/R7-odds-markets.md](tracks/R7-odds-markets.md), section 8.

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

## R8. Fantasy football

From [tracks/R8-fantasy.md](tracks/R8-fantasy.md), section 8.

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

## R9. News, press conferences, social, media

From [tracks/R9-news-social-media.md](tracks/R9-news-social-media.md), section 8.

All on 2026-11-25. Probes: User-Agent `nfl-universe-research/1.0`, no keys, no cookies, no sign-ins.

**Endpoint probes (curl)**
- `news.google.com/rss/search?q=NFL...` → 200 XML, 108 items; copyright clause read. `news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFZ6ZHpZU0FtVnVHZ0pWVXlnQVAB...` → 404.
- `api.gdeltproject.org/api/v2/doc/doc?...` → 429 ×3 ("one every 5 seconds"); `data.gdeltproject.org/gdeltv2/lastupdate.txt` → 301 → 200 (23:00 UTC batch: export, mentions, gkg 5.5 MB zipped).
- `public.api.bsky.app/xrpc/app.bsky.actor.searchActors` (q = nfl, Green Bay Packers, Kansas City Chiefs, Seattle Seahawks, Philadelphia Eagles, Detroit Lions, AP Sports, NFL reporter, beat writer NFL, The Athletic NFL) → 200; `getProfile` and `getAuthorFeed` for ~30 handles → 200 or InvalidRequest (nfl.com, nfl.bsky.social, diannaespn, mikegarafolo, theathletic); `searchPosts` on public host → 403; on `api.bsky.app` → 200 JSON.
- `embed.bsky.app/oembed` → profile 400, post 200. `jetstream1.us-east`, `jetstream2.us-east`, `jetstream1.us-west.bsky.network/subscribe` → 426.
- `www.reddit.com/r/nfl/new.json` → 403; `www.reddit.com/r/nfl/.rss` → 404 Atom "Not Found".
- `mastodon.social/api/v1/timelines/tag/nfl` → 200 (bot-dominated).
- `publish.twitter.com/oembed` → 301; `publish.x.com/oembed?url=https://x.com/NFL` → 200; `api.x.com/2/tweets/search/recent` (no auth) → 401.
- `graph.facebook.com/v21.0/instagram_oembed` (fake id, no token) → 400 OAuthException "Media Not Found". `www.tiktok.com/oembed?url=https://www.tiktok.com/@nfl` → 200.
- RSS: FOX `api.foxsports.com/v2/content/optimized-rss?...tags=fs/nfl` 200 (26); Yardbarker `/rss/sport/1` 200 (MLB, 20), `/rss/sport/9` 200 (1 stale), `/rss` 404; Sporting News `/us/rss` 200 (20); PFN `/feed/` 200 (50); SB Nation `/rss/nfl/index.xml` 200 (10 entries); NBC `/nfl.rss` 200 (4), `/profootballtalk.rss` 200 (30), `/fantasy/football/player-news.rss` 200 (10); RotoWire `/rss/news.php?sport=NFL` 200 (5); The Athletic `nytimes.com/athletic/rss/nfl/` 200 (100); NYT `ProFootball.xml` 200 (20); USA TODAY `rssfeeds.usatoday.com/usatodaycomnfl-topstories` 402; SI `/nfl/.rss/full/` 404, `/nfl/rss` 404, `/feed` 200 (81); Bleacher Report feed 404; AP `apnews.com/hub/nfl.rss` 403; CBS `/rss/headlines/nfl/` 200 (36); Spotrac 403; theScore 404; NFL Trade Rumors `/feed/` 200 (10); Washington Post sports 200 (13); ESPN `/espn/rss/nfl/news` 200 (28, from the Mac).
- Pages for links/terms: `foxsports.com/nfl` (RSS link found), `foxsports.com/rss-feeds` (terms text), `profootballnetwork.com/`, `yardbarker.com/`, `nfltraderumors.co/`, `rotowire.com/` (terms link), robots.txt of PFN, Yardbarker, Sporting News, SB Nation, FOX, SI, CBS, NBC, Yahoo, NFL Trade Rumors, NYT; response headers (CDN) for 12 feeds.
- Club feeds `www.{patriots,packers,buffalobills,philadelphiaeagles,chiefs,dallascowboys}.com/rss/news` → 200 (5/100/10/100/20/100 items; 0 transcripts).
- `asapsports.com/` and `showcat.php?id=1` → 200; `nflcommunications.com/` → 200 (login links).
- Podcasts: six Omny feeds (first 250 KB each); one transcript URL (HEAD only) → 200 text/plain; `itunes.apple.com/search?entity=podcast` ×8; eight non-league feeds (first 200 KB each: megaphone ×6, Barstool, Acast, Simplecast).
- Wikipedia `api.php?prop=pageimages` ×5; Commons `api.php?prop=imageinfo&iiprop=extmetadata` ×5.
- `redditinc.com/policies/data-api-terms` and `/policies/developer-terms` → 200 (read); `support.reddithelp.com/.../42728983564564` → 403.
- `api.crossref.org/works/10.1111/ecin.12506` → 200.
- Project files read (read-only): CLAUDE.md, docs/NFL_DATA_SOURCE_REGISTRY.md, MEDIA_ARCHITECTURE.md, DECISIONS.md (DEC-006–024), GITHUB_RESEARCH.md, FEATURE_RESEARCH.md (160–244 and grep), FEATURE_BACKLOG.md (F54), CURRENT_STATE.md (grep), lib/fabric/adapters/media.js (feed URLs), data/fabric/runs.json.

**Pages read (WebFetch unless noted)**
- newsapi.org/pricing; newsapi.org/terms; gnews.io/pricing; gnews.io/terms; newsdata.io/pricing; newsdata.io/terms; mediastack.com/pricing; mediastack.com/terms; newsapi.ai/plans; webz.io/pricing/; goperigon.com/pricing (301) → perigon.io/pricing; learn.microsoft.com/en-us/lifecycle/announcements/bing-search-api-retirement; gdeltproject.org/about.html; blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/.
- foxsports.com/terms-of-use (first 100k chars); sportingnews.com/us/terms-of-use (tool blocked); sportingnewsholdings.com/policies/terms-of-use/; profootballnetwork.com/terms-of-service/ (404); voxmedia.com/pages/terms-of-use (tool blocked); yardbarker.com/terms_of_service (404) → yardbarker.com/terms; nytimes.com/rss (tool blocked); si.com/terms-of-use (404); nbcsports.com/terms-use (two passes); rotowire.com/termsandconditions.php; rotowire.readme.io/docs/quick-start.
- docs.x.com/x-api/getting-started/pricing; docs.x.com/x-api/getting-started/about-x-api; docs.x.com/developer-terms/agreement.md; docs.x.com/developer-terms/display-requirements.md.
- redditinc.com/policies/data-api-terms (tool blocked; read via curl); support.reddithelp.com Data API Wiki (403).
- docs.bsky.app rate-limits, developer-guidelines, blog/jetstream (308 → bsky.network, client-rendered, empty); read instead via `gh api` from bluesky-social/bsky-docs (`docs/advanced-guides/rate-limits.md`, `docs/support/developer-guidelines.md`, `blog/2024-10-16-jetstream.md`) and bluesky-social/jetstream README; bsky.social/about/support/tos.
- developers.google.com/youtube/v3/determine_quota_cost (twice); /youtube/v3/docs/captions/download; /youtube/terms/developer-policies.
- developers.facebook.com/docs/threads/keyword-search; /docs/instagram-platform/oembed; /docs/graph-api/reference/instagram-oembed/.
- developers.tiktok.com/products/research-api/; developers.tiktok.com/doc/embed-videos; tiktok.com/legal/page/global/terms-of-service-research-api/en.
- podcastindex-org.github.io/docs-api/ (empty render); podcastindex.org (403); `gh api` Podcastindex-org/docs-api and Podcastindex-org/legal TermsOfService.md; performance-partners.apple.com/search-api; developer.spotify.com/terms.
- developer.ap.org/ap-media-api/ (tool blocked); fieldlevelmedia.com; sportsdata.io/help/data-rights-and-licensing-questions; sportsdata.io/news-and-images; sportsdata.io/sportsdataio-and-nbc-sports-partner-...; imagn.com/services; nfl.com/_amp/nfl-films-licensing-disclaimer (500); nfl.com/legal/terms.
- commons.wikimedia.org/wiki/Template:Personality_rights; Commons:Reusing_content_outside_Wikimedia; commoncrawl.org/terms-of-use.
- sproutsocial.com/pricing/; brandwatch.com/pricing/; talkwalker.com/pricing.
- arxiv.org/abs/1310.6998; doi.org/10.1111/ecin.12506 (302) → onlinelibrary.wiley.com (403) → Crossref API.

**Web searches (22 run; the 23rd was refused: shared 200-search budget reached)**
1. Bing News Search API retirement August 11 2025 Microsoft announcement → Microsoft lifecycle page.
2. foxsports.com RSS feeds page NFL optimized-rss partnerKey → third-party lists only; confirmed on FOX's own pages instead.
3. New York Times RSS feeds terms and conditions "personal, non-commercial" display on website attribution → NYT ToS snippets (Jan. 20, 2026).
4. Vox Media terms of use RSS feeds "SB Nation" automated scraping artificial intelligence → RSL Collective (Digiday); no terms text.
5. Pro Football Network profootballnetwork.com terms of use → not found.
6. Yardbarker terms of use RSS → not found (read /terms directly).
7. Sporting News terms of use RSS feeds personal non-commercial → sportingnewsholdings.com terms.
8. X API pricing pay-per-use 2026 read posts cost per post developer console (extended) → docs.x.com pricing + third-party.
9. X developer agreement policy display requirements embed posts oEmbed publish.twitter.com 2026 restrictions storing posts → docs.x.com developer terms.
10. Reddit Data API 2026 access approval Responsible Builder Policy free tier 100 queries per minute non-commercial (extended) → secondary sources.
11. "Responsible Builder Policy" Reddit support.reddithelp.com → mirrors only.
12. Bluesky terms of service 2025 2026 third-party developers scraping public posts AI training user intents proposal → TechCrunch (Mar. 2025).
13. podcastindex.org API free key secret terms of use database dump license → legal repo pointer.
14. AP Media API sports content licensing pricing developer.ap.org NFL (extended) → nothing official.
15. Field Level Media NFL content syndication wire service partners Reuters → fieldlevelmedia.com.
16. SportsDataIO news API RotoBaller NFL player news feed pricing licensing → SportsDataIO pages.
17. RotoWire API NFL news feed pricing data feeds licensing → rotowire.readme.io.
18. "AP Media API" customers API key content entitlements sports → third-party guides only.
19. Reuters Connect sports content licensing NFL pricing subscription API → Thomson Reuters releases (2018, 2019).
20. Imagn Images NFL photo licensing editorial pricing USA TODAY Sports images API → imagn.com; Reuters sales (snippet).
21. Getty Images NFL official photography partner agreement editorial licensing → no NFL deal found.
22. WSC Sports NFL partnership automated highlights 2025 2026 → Sofascore articles.
23. USA TODAY RSS feeds terms … → refused (budget).

## R10. Historical data, open source, academic, college, draft

From [tracks/R10-historical-opensource-draft.md](tracks/R10-historical-opensource-draft.md), section 8.

Repository files read (read-only): `CLAUDE.md` (in context), `docs/NFL_DATA_SOURCE_REGISTRY.md`, `docs/GITHUB_RESEARCH.md`, `docs/FEATURE_RESEARCH.md` lines 160–244.

GitHub API (`gh`):
- `gh api repos/nflverse/nflverse-data/releases --paginate` (tags, assets, `updated_at`) → 25 tags, 4,367 assets
- `gh api repos/nflverse/nflverse-data`, `/readme`, `/contents/LICENSE.md` → CC-BY-4.0, 449★
- `gh api repos/nflverse/nflreadr`, `/contents/R`, `/contents/R/load_*.R` (pbp, participation, officials, trades, espn_qbr, contracts, draft_picks, combine, nextgen_stats, depth_charts, injuries, snap_counts, pfr_advstats, ftn_charting, rosters, ffverse), `/contents/DESCRIPTION`, `/contents/LICENSE`, `/readme`
- `gh api repos/nflverse/nflfastR` + readme; `nflverse/nflverse-pbp`, `nflverse-players`, `nflreadpy` (+ releases), `nflverse-rosters`, `nflverse-pfr` (+readme), `rotc` (+ `R/otc_historical_contracts.R`, DESCRIPTION), `ngs-data`, `nfl_data_py`, `nflseedR`, `nflplotR`, `nfl4th`, `nflverse-ftn`; 404s: `nflverse/espnscrapeR`, `nflverse/ffopportunity`, `nflverse/nflverse-participation`
- `gh api repos/nflverse/nfldata` + `/contents/data`, `/readme`, `/contents/DATASETS.md`, `/commits?path=data/<file>` for 10 files
- `gh api repos/fivethirtyeight/{data,nfl-elo-game,checking-our-work-data}`, `/contents/nfl-elo`, README, commits
- `gh api repos/greerreNFL/{nfelo,nfeloqb}`, contents, LICENSE, README, CHANGELOG; `greerreNFL/nfelo-power-rankings` → 404
- `gh api repos/nfl-football-ops/Big-Data-Bowl` (+readme, contents), `ThompsonJamesBliss/nfl-big-data-bowl-regional-event-data`
- `gh api repos/sportsdataverse/sportsdataverse-data/releases --paginate` → 388 tags; `sportsdataverse/cfbfastR` R sources (`load_cfb_pbp.R`, `load_ncaa_mfb.R`, `cfbd_*.R`, `data-raw/min_year_map_df.R`), DESCRIPTION; `gh api search/code?q=min_year_map_df+repo:sportsdataverse/cfbfastR`
- `gh api repos/Neil-Paine-1/NFL-elo-ratings` (+contents, commits); `marcusdarmstrong/mockdraftable-web`
- Metadata + README for 50 repos (list in Part C, plus `CFBD/cfbd-api-docs` → 404)
- `gh search repos` (each with `--sort stars` and `--sort updated`, `--limit 25`): "nfl api", "nfl data", "nfl scraper", "nfl play by play", "nfl tracking", "nfl fantasy", "fantasy football api", "nfl odds", "nfl injuries", "nfl news", "nfl schedule", "nfl roster", "nfl depth chart", "nfl weather", "nfl stadium", "nfl prediction", "nfl machine learning", "american football computer vision", "football analytics" (one call hit the 30/min search limit and was retried); plus `--sort stars --limit 30`: "topic:nfl" (also updated), "topic:nfl-data", "topic:nflverse", "topic:american-football", "topic:fantasy-football", "topic:college-football", "nfl draft", "nfl combine", "college football data", "nfl elo", "nfl win probability", "football analytics nfl"; `gh search repos "big data bowl" --sort stars`
- `gh api rate_limit`

Files downloaded to the scratchpad (small) and parsed: nflverse `snap_counts_2012.csv` (154 B), `trades.csv`, `combine.csv`, `draft_picks.csv.gz`, `officials.csv.gz`, `qbr_season_level.csv.gz`, `qbr_week_level.csv.gz`, `schedules/games.csv.gz`; `nfldata/data/games.csv`, `trades.csv`, and the heads of 9 other nfldata files; `fivethirtyeight/nfl-elo-game/data/nfl_games.csv`; nfelo `nfelo_games.csv`, `historic_projected_spreads.csv`, `prediction_tracker.csv`; datahub 538 Elo (headers + byte ranges); Neil Paine Elo (byte ranges); Prediction Tracker `nflpredictions.csv` (first 700 bytes + headers). Byte-range header reads (first 1.5 KB) of nflverse `players.csv`, `roster_2026.csv`, `roster_weekly_2026.csv`.

Web pages read (WebFetch or curl):
- https://nflreadr.nflverse.com/articles/nflverse_data_schedule.html — schedule, participation/depth source changes
- https://nflreadr.nflverse.com/reference/index.html — loader list, nflreadr 1.5.1.9002
- https://www.sports-reference.com/bot-traffic.html — 20/10 requests per minute, jail up to a day (SR request 1 of 2)
- https://www.sports-reference.com/data_use.html — permissions, AI clause, $5,000 minimum (SR request 2 of 2)
- https://overthecap.com/terms → https://overthecap.com/terms-and-conditions (parsed), https://overthecap.com/robots.txt; `/terms-of-use` 404
- Kaggle `api/v1/datasets/view/tobycrabtree/nfl-scores-and-betting-data` and `/maxhorowitz/nflplaybyplay2009to2016` — licences, dates; `api/v1/competitions/list` → 401
- https://operations.nfl.com/the-game/big-data-bowl/terms-and-conditions → 404
- https://www.sportsvideo.org/2026/10/08/nfl-announces-ninth-annual-big-data-bowl-powered-by-aws/ — 2027 edition
- https://operations.nfl.com/gameday/analytics/big-data-bowl/ — 2026 winner, 2027 theme
- https://projects.fivethirtyeight.com/nfl-api/nfl_elo.csv, `/nfl_elo_latest.csv`, `/2023-nfl-predictions/` → 302 to abcnews.go.com/politics
- https://datahub.io/fivethirtyeight/nfl-elo (+ file headers)
- https://www.thepredictiontracker.com/ , `/nflresults.php`, `/prednfl.php`, `/nflpredictions.csv`, `/robots.txt`; `/nflpredictions.html`, `/ptnfl.html`, `/nfl_games.csv` → 404
- http://sagarin.com/sports/nflsend.htm (https failed); https://www.usatoday.com/sports/nfl/sagarin/ → 402
- https://masseyratings.com/ and `/nfl/ratings` → 403 (not bypassed)
- https://collegefootballdata.com/terms, `/key`, `/api-tiers`, `/` (home)
- https://www.ncaa.com/tos (parsed via curl; WebFetch returned empty), https://www.ncaa.com/robots.txt; https://stats.ncaa.org/robots.txt → 403; ncaa.org ToS URL → redirect to home
- https://www.nfl.com/legal/terms/ ; https://www.nfl.com/combine/tracker/live-results/ (shell only)
- https://www.mockdraftable.com/about , `/robots.txt` (HTML shell)
- https://ras.football/ (+ robots, ToS paths) → 429 (curl and WebFetch)
- https://www.nflmockdraftdatabase.com/ → 403; `/robots.txt` read
- https://grindingthemocks.com/ , https://www.grindingthemocks.com/ → connection failure
- https://www.drafthistory.com/ (read); https://www.prosportstransactions.com/ → 403
- https://opensourcefootball.com/posts/2020-09-28-nflfastr-ep-wp-and-cp-models/ (200 after 301)
- https://www.kaggle.com/c/nfl-playing-surface-analytics (200), https://isaactpetersen.github.io/Fantasy-Football-Analytics-Textbook/ (200)
- Crossref DOI lookups `api.crossref.org/works/<DOI>`: 10.1515/jqas-2018-0010, 10.1515/jqas-2013-0100, 10.1080/01621459.1998.10474084, 10.1111/j.1468-0297.2004.00207.x, 10.1080/00031305.1991.10475798, 10.1515/jqas-2019-0056, 10.1177/0363546518808499, 10.1111/jofi.13082 (all matched); 10.1111/j.1540-6261.1997.tb01122.x, …tb01127.x, …tb01128.x, 10.1080/01621459.1980.10477469 (did not match the intended papers)
- arXiv: `export.arxiv.org/abs/1802.00998`, `/abs/1704.00197`
- Wikidata SPARQL (`query.wikidata.org/sparql`): award statements for HOF, AP DPOY, AP MVP labels
- Repository catalogue APIs: `zenodo.org/api/records?q="National Football League"` (27 hits), `dataverse.harvard.edu/api/search?q="National Football League"&type=dataset` (40 hits), `api.figshare.com/v2/articles/search` (datasets) — mostly paper supplements; no maintained NFL dataset

Web searches (WebSearch tool; the shared session budget ran out after these):
1. "sports-reference.com bot traffic rate limit 20 requests per minute data use policy" (standard) — bot-traffic and data_use URLs
2. "overthecap.com terms of use data scraping redistribution" (standard) — no OTC page; found it by URL probing
3. "Stathead Football subscription price per month 2026" (extended) — $9/$80 from SR FAQ snippet
4. "Pro Football Reference box scores "Vegas Line" "Over/Under" weather game info how far back" (standard) — team Vegas-lines pages back to 1968
5. "pro-football-reference boxscore "Game Info" Roof Surface Weather "Vegas Line" "Over/Under" Officials" (standard) — no box-score pages
6. "Pro Football Reference Approximate Value AV snap counts since 2012 data coverage "play index" 1920 NFL season" (standard) — AV since 1960, snaps 2012, pbp 1978, lineups 1920 (snippets)
7. "sports-reference.com "terms of use" "artificial intelligence" OR "machine learning" data …" (standard) — AI clause snippet
8. "kaggle tobycrabtree nfl-scores-and-betting-data spreadspoke license updated" (standard) — HF mirror only; Kaggle API used instead
9. "NFL Big Data Bowl 2026 Kaggle competition data rules "non-commercial" tracking data winners" (standard) — winner, 2027 edition
10. "FiveThirtyEight shut down March 2025 ABC News data GitHub nfl_elo.csv archive mirror" (standard) — shutdown date, datahub mirror
11. "masseyratings.com NFL ratings composite terms of use data export 2026" (standard) — scorehelp snippet
12. "FTN DVOA database history subscription price ftnfantasy.com NFL team DVOA 1978" (standard) — irrelevant results
13. ""DVOA" FTN Fantasy historical team DVOA ratings database premium Football Outsiders acquired" (standard) — FO closure, archive years
14. "CollegeFootballData.com data coverage years games since 1869 …" — **not performed: session web-search budget exhausted**; later items were verified by direct URL fetches only

## Verification: V1-nflverse-provenance.md

The verifier's sources are cited claim by claim in [tracks/V1-nflverse-provenance.md](tracks/V1-nflverse-provenance.md).

## Verification: V2-terms-pricing.md

The verifier's sources are cited claim by claim in [tracks/V2-terms-pricing.md](tracks/V2-terms-pricing.md).
