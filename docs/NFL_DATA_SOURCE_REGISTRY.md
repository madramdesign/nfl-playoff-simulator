# NFL Data Source Registry

> Every candidate must be verified before production use. "Publicly accessible" does not automatically mean free to scrape, store, or redistribute.

- **Last verified** means a real request from this project's machine returned the shape described, on that date.
- **Terms** were researched on Nov. 21, 2026 (WS3); links are to the provider's own pages.
- **Usable?** is this project's reading of those terms for a free, non-commercial fan project: *Yes*; *Conditions* (usable if the listed conditions are met); *Owner decision* (terms do not grant the use; the owner must accept the risk or drop the source); *No*.
- Fabric source ids (`espn-scoreboard` and so on) are the keys used in `/api/universe` `sources`.

## Terms in brief

| Provider | What the terms say | Source |
|---|---|---|
| ESPN (all JSON endpoints) | Covered by the Disney Terms of Use (updated May 24, 2024). Section 2.B(x) bars access by "robot, spider, script, or other automated means", data mining and building datasets. ESPN stopped issuing API keys in 2014, so no public API is licensed. espn.com's robots.txt blocks AI crawlers (including `anthropic-ai`) site-wide | [Disney ToU](https://disneytermsofuse.com/english/), [robots.txt](https://www.espn.com/robots.txt) |
| ESPN RSS | Separate RSS rules: show the feed content unmodified, link to espn.com, credit ESPN, no ads | [ESPN RSS info](https://www.espn.com/espn/news/story?page=rssinfo) |
| Yahoo RSS | Terms §2(o): show feed content unmodified with credit and link, no ads, feeds can be withdrawn; §2(e) bars commercial reuse | [Yahoo ToS](https://legal.yahoo.com/us/en/yahoo/terms/otos/index.html) |
| NBC Sports (ProFootballTalk) | No RSS-specific terms found. General terms allow personal, non-commercial use and bar scrapers that aggregate content and redistribution without written permission | [NBC Sports terms](https://www.nbcsports.com/terms-use) |
| CBS Sports | No RSS-specific terms found. CBSi terms allow personal, non-commercial use and bar unauthorized scraping and redistribution; whether they cover cbssports.com is not stated | [CBSi terms](https://legal.paramount.com/us/en/cbsi/terms-of-use) |
| nflverse | `nflverse-data` is CC-BY-4.0; nflreadr notes the NFL data still belongs to its owners. FTN charting is CC-BY-SA 4.0, credited "FTN Data via nflverse" | [LICENSE.md](https://github.com/nflverse/nflverse-data/blob/master/LICENSE.md), [nflreadr](https://nflreadr.nflverse.com/) |
| nfldata games file | No license file | [repo](https://github.com/nflverse/nfldata) |
| nfelo | Outputs may be republished with credit; the code may not be run, imported or modified | [LICENSE](https://github.com/greerreNFL/nfelo/blob/main/LICENSE) |
| Sleeper | Read-only, no token; stay under 1,000 calls a minute; fetch `/players/nfl` (about 5 MB) at most once a day and store it; free for non-commercial use; credit Sleeper for trending data | [docs.sleeper.com](https://docs.sleeper.com/) |
| Open-Meteo | Free tier for non-commercial use (Creative Commons definition: no ads or subscriptions); under 10,000 calls a day, 5,000 an hour, 600 a minute, 300,000 a month; data CC BY 4.0 with a link to open-meteo.com next to the data | [terms](https://open-meteo.com/en/terms), [licence](https://open-meteo.com/en/licence) |
| api.weather.gov | Open data, any purpose; User-Agent required (docs suggest an app domain and contact email; this project will not send the owner's email without approval) | [docs](https://www.weather.gov/documentation/services-web-api) |
| The Odds API | Key required; showing and storing data in an app allowed; re-serving as a raw feed or API not allowed | [terms](https://the-odds-api.com/terms-and-conditions.html) |
| YouTube | Embeddable player allowed for personal, non-commercial viewing; no sold ads on pages whose main draw is YouTube content; no modification; uploaders can disable embedding | [YouTube ToS](https://www.youtube.com/static?template=terms), [Help](https://support.google.com/youtube/answer/171780) |

## Live and current-season sources

| Source (fabric id) | Data | URL | Auth | Cost | Rate limits (ours / theirs) | Update cadence | Historical depth | Usable? | Reliability | Fallback | Last verified |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ESPN scoreboard (`espn-scoreboard`; also `/api/live` today) | Week's games: state, clock, scores, venue with indoor flag, broadcast, DraftKings spread, total and moneyline with open and current, weather summary | `site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard` | None | Free | 15 s during games, 2 min otherwise / none published | Seconds | Current week | **Owner decision** (Disney ToU). Already used by the existing simulator | Stable for years per community docs; unofficial | nflverse games file (daily) | Nov. 21: 13 games |
| ESPN game summary | Win-probability series, scoring plays, drives, plays, game injuries, odds | `.../summary?event=<id>` | None | Free | On demand | Live | Per game | **Owner decision** | As above | None | Nov. 21: 160 win-probability points on a final game |
| ESPN news (`espn-news`) | Headlines, times, team tags, links | `.../news?limit=50` | None | Free | 5 min | Minutes | Latest 50 | **Owner decision** (the JSON is not the RSS service) | As above | Yahoo RSS, ESPN RSS | Nov. 21: 50 articles |
| ESPN injuries (`espn-injuries`) | Every team's injury list: status, position, type, return date | `.../injuries` (8.8 MB) | None | Free | 15 min | Hours | Current | **Owner decision** | As above | nflverse `injuries` release (daily) | Nov. 21: 32 teams; 70 Out, 8 Doubtful, 73 Questionable, 49 IR |
| ESPN transactions (`espn-transactions`) | Signings, waivers, releases, trades, IR moves | `.../transactions` | None | Free | 30 min | Daily | 25 per page | **Owner decision** | As above | None found (nflverse has trades only) | Nov. 21: 25 items |
| ESPN depth charts and rosters | Starters and backups by position; names and ids | `sports.core.api.espn.com/.../teams/<id>/depthcharts`, `.../teams/<id>/roster` | None | Free | 12 h | Weekly | Current | **Owner decision** | As above | nflverse `depth_charts`, `weekly_rosters` (daily) | Nov. 21 (Giants) |
| ESPN RSS (`rss-espn`) | Headlines | `www.espn.com/espn/rss/nfl/news` | None | Free | 10 min | Minutes | 30 items (Nov. 25) | **Conditions**: unmodified, linked, credited, no ads | **Refuses GitHub's servers** since Nov. 24 evening: ESPN's CloudFront answers Azure (GitHub Actions, Virginia) with HTTP 202 and no content, whatever the user agent or accept header. Answers normally from the owner's Mac and from Render (Nov. 25). Off in the GitHub workflows (`FABRIC_OFF`, DEC-024); not worked around | Yahoo RSS | Nov. 21; Nov. 25 diagnosis |
| Yahoo Sports NFL RSS (`rss-yahoo`) | Headlines, links, times | `sports.yahoo.com/nfl/rss.xml` | None | Free | 10 min | Minutes | 32 items | **Conditions**: unmodified, credited, linked, no ads, non-commercial | Good | ESPN RSS | Nov. 21: 32 items |
| ProFootballTalk RSS (`rss-pft`) | Headlines | `www.nbcsports.com/profootballtalk.rss` | None | Free | | Minutes | 30 items | **Owner decision** (general terms bar aggregation; ask NBC or skip) | Good | Yahoo RSS | Nov. 21: 30 items |
| CBS Sports NFL RSS (`rss-cbs`) | Headlines | `www.cbssports.com/rss/headlines/nfl/` | None | Free | | Minutes | 36 items | **Owner decision** (as PFT) | Good | Yahoo RSS | Nov. 21: 36 items |
| NFL.com RSS | | `www.nfl.com/rss/rsslanding?searchString=home` | | | | | | **No**: returns an HTML page, not a feed | | | Nov. 21 |
| Open-Meteo (`open-meteo`) | Hourly temperature, wind, gusts, precipitation, snowfall at outdoor stadiums | https://open-meteo.com/en/docs | None | Free non-commercial | One multi-location call per 30 min / 10,000 a day | Hourly | 16-day forecast | **Conditions**: non-commercial, link to open-meteo.com beside the data | Good | api.weather.gov | Nov. 21: 168 hourly rows |
| api.weather.gov (`nws-alerts`, wired Nov. 23) | Active weather alerts (wind, winter, cold, heat, storms, fog) at outdoor stadiums with a game in the next 2 days; only alerts in force from 3 h before to 4 h after kickoff are kept | `api.weather.gov/alerts/active?point=<lat>,<lon>`; link: `forecast.weather.gov/MapClick.php?lat=..&lon=..` | None (User-Agent) | Free | Every 30 min, 3 stadiums at a time; retry after about 5 s on error | Minutes | Active alerts only | **Yes** (US government work; credited "National Weather Service" with a link) | Good | Open-Meteo forecast (no alerts) | Nov. 23: answered for 6 stadiums, no alerts in force; points outside the US answer 400 and count as outside coverage |
| Sleeper (`sleeper-trending`, wired Nov. 23) | NFL state (season, week), trending adds and drops (24 h, top 25 each); the 5 MB player database is not used, nflverse's roster crosswalk names the players | `api.sleeper.app/v1/state/nfl`, `/players/nfl/trending/add`, `/players/nfl/trending/drop` | None | Free non-commercial | 3 calls an hour / under 1,000 a minute | Real time (trends) | Current | **Conditions**: non-commercial, credit Sleeper for trends ("Trending data: Sleeper" in the team panel) | Good | Nothing: the block is left out | Nov. 23: week 11; 25 adds and 25 drops, all named through the crosswalk |
| nflverse depth charts (`nflverse-depth`, wired Nov. 23) | Every team's depth chart: player, nflverse and ESPN ids, group, slot, rank; dated snapshots | `github.com/nflverse/nflverse-data/releases/download/depth_charts/depth_charts_<season>.csv` (about 80 MB: a snapshot per team per day since March, not in date order) | None | Free | Every 12 h; only each team's newest snapshot is kept | Daily snapshots | Season | **Yes**: CC-BY-4.0, credit nflverse | Good | ESPN injuries' own starter flag; last game's starting quarterback | Nov. 23: 2,395 rows, 32 teams, as of 19:11 UTC; 142 of 143 injured players matched by id |
| nflverse weekly rosters (`nflverse-rosters`, wired Nov. 23) | Each week's players with ids on other services (nflverse, ESPN, Sleeper and more): the player crosswalk | `.../weekly_rosters/roster_weekly_<season>.csv` (about 10 MB) | None | Free | Every 12 h | Weekly | Season | **Yes**: CC-BY-4.0, credit nflverse | Good | Unmatched Sleeper players are counted, not named | Nov. 23: week 12, 2,574 players, 1,826 with a Sleeper id |
| Curated news (`curated-news`) | Hand-checked items with source links; quarterback changes | `data/news.json` | None | Free | | Daily | 10 days | **Yes** (own words, linked) | | | Nov. 21 |
| The Odds API (`odds-api`, built Nov. 23, off until a key is set) | Moneyline, spread and total from each US book, for games not yet started (this week's); the consensus is the median spread and total and the median no-vig home chance | `api.the-odds-api.com/v4/sports/americanfootball_nfl/odds/?regions=us&markets=h2h,spreads,totals&oddsFormat=american&commenceTimeFrom=..&commenceTimeTo=..`; key in the `x-api-key` header, never in the URL | Key (`ODDS_API_KEY`) | 500 credits a month free; a look costs markets × regions = 3 | At most one look every 11 h on the local server and one every 11 h in GitHub's data fetch (its cache carries the last look between runs): about 13 credits a day at most; stops below 15 credits left until the next month; reads `x-requests-remaining` | Minutes | Paid plans only | **Conditions**: show and store in the app; no re-serving as a raw feed. So only the consensus is published; each book's prices only on the local server (the public-snapshot check refuses them) | Good | ESPN scoreboard (one book), nflverse (one book) | Nov. 23 (first real call, owner's key): 14 games not yet started, 8 US books each (DraftKings, FanDuel, BetMGM, BetRivers, BetUS, MyBookie.ag, BetOnline.ag, LowVig.ag), every team matched; 3 credits a look as documented |

## Build-time and historical sources

| Source | Data | URL | Auth | Cost | Update cadence | Historical depth | Usable? | Last verified |
|---|---|---|---|---|---|---|---|---|
| nflverse `nfldata` games | Schedule, scores, one line per game (open or close not documented), rest, roof, weather, starting quarterbacks | `raw.githubusercontent.com/nflverse/nfldata/master/data/games.csv` | None | Free | Daily | 1999 on | **Yes** with credit (no license file; facts) | Used by every daily build |
| nflverse releases | Play-by-play, team and player stats, injuries, depth charts, weekly rosters, snap counts, Next Gen, FTN charting, contracts, draft picks, trades | `github.com/nflverse/nflverse-data/releases` | None | Free | Most nightly | Varies (play-by-play 1999 on) | **Yes**: CC-BY-4.0, credit nflverse; FTN is CC-BY-SA 4.0 ("FTN Data via nflverse") | Nov. 21: 23 release tags updated within a week |
| nfelo quarterback values | Quarterback value per game | `raw.githubusercontent.com/greerreNFL/nfeloqb/main/qb_elos.csv` | None | Free | Weekly | Several seasons | **Yes** for outputs with credit | Used by builds |
| FantasyPros | Quarterback projections; only each team's top-projected quarterback (name, points) is kept | FantasyPros API v2 (`<season>/projections?position=QB&scoring=STD`) | Key (repository secret `FANTASYPROS_API_KEY`, set Nov. 25) | Free non-commercial (owner's plan: premium) | Daily, one call | | **Conditions** (Terms of Use, Oct. 27, 2020, read Nov. 25): personal, non-commercial use only; historical player statistics and player image URLs not licensed; key confidential; 1 call a second, 100 a day by default (500 on the owner's plan); cache rather than poll; no giving third parties access to the API materials; no competing with FantasyPros; published work based on the data must conspicuously say it uses "Data obtained from FantasyPros" (the page: "Quarterback projections are based on data obtained from FantasyPros"). The raw answer is not kept in this public repository; only `data/fantasypros/qb_top.json` is committed | Nov. 25 (first real run): answer keys `count, experts, last_updated, last_updated_ts, players, positions, public_api, scoring, season, tier, week`; 77 quarterbacks, week 12; all 32 teams mapped (plus `FA`, free agents, now dropped). Names carry suffixes ("Patrick Mahomes II", "Anthony Richardson Sr."), so names are compared without them |

## Official media

| Source | What | Access | Usable? | Last verified |
|---|---|---|---|---|
| NFL YouTube channel | Highlights, previews, The NFL Report | Channel RSS `youtube.com/feeds/videos.xml?channel_id=UCDVYQ4Zhbm3S2dlz7P1GBDg` (no key); YouTube oEmbed for the embed code | **Conditions**: official embeddable player only, no modification, no sold ads; some videos disable embedding or are age-restricted; send a referrer (`strict-origin-when-cross-origin`, not `no-referrer`) or embeds fail with error 153 | Nov. 21: feed listed current videos; oEmbed returned iframes; playback not tested |
| Team YouTube channels | Press conferences and team video | Same RSS and oEmbed pattern per channel | **Conditions**, as above. Confirmed for the Chiefs and Bills; not checked for all 32. Many press-conference uploads come from local broadcasters, so filter on the oEmbed `author_url` | Nov. 21 |
| Team websites | Press conference video | Links only | **Yes** to link | Nov. 21 (Patriots, Bills) |
| Official NFL podcasts | NFL Daily, Good Morning Football, NFL: The Insiders, NFL News Hub, The NFL Report, NFL Game Previews | Public RSS on Omny (feed URLs in WS3 notes) | **Conditions**: list episodes and link or play the feed's own audio file; display terms not stated | Nov. 21: episodes in November |

NFL TV (Nov. 25, 2026, DEC-022): fabric source `youtube-reel` asks YouTube's oEmbed endpoint (no key, three at a time, each video once) whether each picked video may be embedded; the page uses YouTube's IFrame Player API (`https://www.youtube.com/iframe_api`), which makes the page an API client under the YouTube API Services Terms and Developer Policies (checked Nov. 25: automatic playback only while more than half of the player is visible, at most one player playing by itself, a viewport of at least 200 by 200 pixels, no overlays, a referrer sent, YouTube named as the source with links to its terms). The NFL blocks its own videos, and team videos with its game footage, on sites it has not approved; oEmbed does not show that block.

Wired in M8 (Nov. 21, 2026) as fabric sources `youtube-official` (the NFL's and all 32 teams' channel feeds, every 30 minutes) and `podcasts-nfl` (six shows, every 6 hours, reading only the start of each feed). Rules and evidence levels: `MEDIA_ARCHITECTURE.md`.

No stream is proxied, downloaded or re-hosted. Live game broadcasts are not available from any authorized free source and are not planned.

## Official club news feeds (checked Nov. 23–24, 2026)

All 32 clubs publish an RSS 2.0 feed at `https://www.<club domain>/rss/news` (up to 100 items, each with a date and a link to the club's own site). Each club has its own terms page; none clearly allows a site to show its headlines with links to the articles:

| Terms pattern | Clubs |
|---|---|
| RSS ("Modular Content") clause, but links only to the home page without written permission | BAL, PIT, HOU, LV, DAL, NYG, PHI, GB, MIN, CAR, NO, SEA; DET and ARI also need express permission per use |
| RSS clause, but no deep links and no automated access at all | SF, LAC, LAR |
| RSS clause, deep-link question open | DEN (no robots clause found), CHI (links allowed but revocable), KC (any link needs written consent) |
| Personal, non-commercial use only, no RSS clause | MIA, NYJ, WAS, TB, JAX (also bars robots) |
| Robots or automated access barred | BUF (any link needs consent), NE, CIN, CLE, TEN (also bans text and data mining) |
| Commercial robots barred only, no RSS or link clause | IND |
| No terms page found; the FAQ asks for written consent for any use | ATL |

**Usable? No, not without permission** (backlog F14). The options are the owner writing to clubs, linking only to each club's home page, or a personal local reader for the few clubs whose terms do not bar automated access. Raw downloads and per-club details are in the Nov. 23 research hand-back.

## Team logos and marks (checked Nov. 23, 2026)

| Candidate | What it is | Usable? |
|---|---|---|
| nflverse `load_teams()` logo columns | Links to images hosted by ESPN and Wikipedia; nflverse's MIT license covers its code, not the images | No: the images are the clubs' trademarks; no license is offered |
| Wikimedia Commons NFL files | Some simple logos are tagged public domain for copyright | No: Commons says trademark restrictions still apply and are the reuser's problem |
| ESPN logo CDN, logo download sites, GitHub "NFL logos" repos | Copies of club logos | No: no right to redistribute them |
| Team names, abbreviations, colours | Facts used to identify a team | Yes (already in `shared/teams.json`); never presented so as to suggest endorsement |
| Generic helmet artwork: our own SVG, or game-icons.net "american-football-helmet" (CC BY 3.0, attribution, confirmed only via Iconify's mirror) | Not any club's design | Yes, coloured with team colours and the abbreviation |

Club logos, helmets and uniform designs belong to the NFL and its clubs, which enforce them. Any use of official logos needs the owner to obtain permission first. Also, claude.ai's viewer blocks images from other sites, so a logo would have to be copied into the page.

## Verification checklist
- [x] Endpoints reached and shapes recorded (Nov. 21, 2026)
- [x] Terms of service reviewed for each source in use or proposed (Nov. 21, 2026)
- [x] License and attribution requirements recorded
- [ ] Storage and redistribution rights confirmed: not granted for ESPN, PFT or CBS; owner decision recorded as open (DEC-006)
- [x] Authentication and rate limits documented where published
- [ ] Coverage and update cadence measured over a full game day
- [ ] Historical depth and known gaps recorded for every source
- [x] Failure behavior and fallback identified
- [x] Last verified date recorded
