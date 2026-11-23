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
| ESPN RSS | Headlines | `www.espn.com/espn/rss/nfl/news` | None | Free | 10 min | Minutes | Few items | **Conditions**: unmodified, linked, credited, no ads | Returned 1 item at test time | Yahoo RSS | Nov. 21 |
| Yahoo Sports NFL RSS (`rss-yahoo`) | Headlines, links, times | `sports.yahoo.com/nfl/rss.xml` | None | Free | 10 min | Minutes | 32 items | **Conditions**: unmodified, credited, linked, no ads, non-commercial | Good | ESPN RSS | Nov. 21: 32 items |
| ProFootballTalk RSS (`rss-pft`) | Headlines | `www.nbcsports.com/profootballtalk.rss` | None | Free | | Minutes | 30 items | **Owner decision** (general terms bar aggregation; ask NBC or skip) | Good | Yahoo RSS | Nov. 21: 30 items |
| CBS Sports NFL RSS (`rss-cbs`) | Headlines | `www.cbssports.com/rss/headlines/nfl/` | None | Free | | Minutes | 36 items | **Owner decision** (as PFT) | Good | Yahoo RSS | Nov. 21: 36 items |
| NFL.com RSS | | `www.nfl.com/rss/rsslanding?searchString=home` | | | | | | **No**: returns an HTML page, not a feed | | | Nov. 21 |
| Open-Meteo (`open-meteo`) | Hourly temperature, wind, gusts, precipitation, snowfall at outdoor stadiums | https://open-meteo.com/en/docs | None | Free non-commercial | One multi-location call per 30 min / 10,000 a day | Hourly | 16-day forecast | **Conditions**: non-commercial, link to open-meteo.com beside the data | Good | api.weather.gov | Nov. 21: 168 hourly rows |
| api.weather.gov (`nws`, wired Nov. 23, 2026 as the backup for Open-Meteo: asked only for outdoor games with no current Open-Meteo forecast; hourly temperature, wind and precipitation chance, no gusts or amounts) | US forecasts | https://www.weather.gov/documentation/services-web-api | None (User-Agent) | Free | Retry after about 5 s on error | Hourly | 7 days | **Yes** | Good | Open-Meteo | Nov. 21: answered |
| Sleeper | NFL state (season, week), trending adds and drops, player database | `api.sleeper.app/v1/state/nfl`, `/players/nfl/trending/add`, `/players/nfl` | None | Free non-commercial | Players at most daily / under 1,000 a minute | Real time (trends) | Current | **Conditions**: non-commercial, credit Sleeper for trends | Good | | Nov. 21: season 2026, week 11 |
| Curated news (`curated-news`) | Hand-checked items with source links; quarterback changes | `data/news.json` | None | Free | | Daily | 10 days | **Yes** (own words, linked) | | | Nov. 21 |
| The Odds API (not wired) | Multi-book moneyline, spread, total; props via event endpoint | https://the-odds-api.com/ | Key | 500 credits a month free | about 166 NFL pulls a month | Minutes | Paid plans only | **Owner decision** (needs a key) | Good | ESPN scoreboard (one book) | Not called (no key) |

## Build-time and historical sources

| Source | Data | URL | Auth | Cost | Update cadence | Historical depth | Usable? | Last verified |
|---|---|---|---|---|---|---|---|---|
| nflverse `nfldata` games | Schedule, scores, one line per game (open or close not documented), rest, roof, weather, starting quarterbacks | `raw.githubusercontent.com/nflverse/nfldata/master/data/games.csv` | None | Free | Daily | 1999 on | **Yes** with credit (no license file; facts) | Used by every daily build |
| nflverse releases | Play-by-play, team and player stats, injuries, depth charts, weekly rosters, snap counts, Next Gen, FTN charting, contracts, draft picks, trades | `github.com/nflverse/nflverse-data/releases` | None | Free | Most nightly | Varies (play-by-play 1999 on) | **Yes**: CC-BY-4.0, credit nflverse; FTN is CC-BY-SA 4.0 ("FTN Data via nflverse") | Nov. 21: 23 release tags updated within a week |
| nfelo quarterback values | Quarterback value per game | `raw.githubusercontent.com/greerreNFL/nfeloqb/main/qb_elos.csv` | None | Free | Weekly | Several seasons | **Yes** for outputs with credit | Used by builds |
| FantasyPros | Quarterback projections | FantasyPros API v2 | Key (repository secret) | Free non-commercial | Weekly | | **Conditions**: 1 call a second, 100 a day, attribution | Workflow never ran |

## Official media

| Source | What | Access | Usable? | Last verified |
|---|---|---|---|---|
| NFL YouTube channel | Highlights, previews, The NFL Report | Channel RSS `youtube.com/feeds/videos.xml?channel_id=UCDVYQ4Zhbm3S2dlz7P1GBDg` (no key); YouTube oEmbed for the embed code | **Conditions**: official embeddable player only, no modification, no sold ads; some videos disable embedding or are age-restricted; send a referrer (`strict-origin-when-cross-origin`, not `no-referrer`) or embeds fail with error 153 | Nov. 21: feed listed current videos; oEmbed returned iframes; playback not tested |
| Team YouTube channels | Press conferences and team video | Same RSS and oEmbed pattern per channel | **Conditions**, as above. Confirmed for the Chiefs and Bills; not checked for all 32. Many press-conference uploads come from local broadcasters, so filter on the oEmbed `author_url` | Nov. 21 |
| Team websites | Press conference video | Links only | **Yes** to link | Nov. 21 (Patriots, Bills) |
| Official NFL podcasts | NFL Daily, Good Morning Football, NFL: The Insiders, NFL News Hub, The NFL Report, NFL Game Previews | Public RSS on Omny (feed URLs in WS3 notes) | **Conditions**: list episodes and link or play the feed's own audio file; display terms not stated | Nov. 21: episodes in November |

Wired in M8 (Nov. 21, 2026) as fabric sources `youtube-official` (the NFL's and all 32 teams' channel feeds, every 30 minutes) and `podcasts-nfl` (six shows, every 6 hours, reading only the start of each feed). Rules and evidence levels: `MEDIA_ARCHITECTURE.md`.

No stream is proxied, downloaded or re-hosted. Live game broadcasts are not available from any authorized free source and are not planned.

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
