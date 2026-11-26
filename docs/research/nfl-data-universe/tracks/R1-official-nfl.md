# R1 — Official NFL sources and league structure

Research track R1, NFL Universe. Researched and probed on 2026-11-25 from the owner's machine (generic User-Agent `nfl-universe-research/1.0`, no keys, no cookies, no sign-ins). The web-search budget for the session ran out near the end; the last items (Super Bowl sites, flex windows) rest on secondary sources found earlier and are flagged.

## 1. Summary

- **The NFL offers no public data API.** `api.nfl.com` answers 401, `developer.nfl.com` redirects to a private NFL login, the old GameCenter feeds (`nfl.com/liveupdate/...`) 301 to the home page, and the Next Gen Stats site's JSON answers 401. Minting app tokens is out of bounds; sportsdataverse-js, which the project lists as a reference, has an `nfl_api` family that does exactly that. Avoid it.
- **Official data is sold only through Genius Sports.** Genius has exclusive rights to real-time play-by-play, NGS and the betting feed through the 2029 season (June 11, 2025 extension). No pricing or self-serve plan found; the route is sales. GSIS and NFL Communications' transactions, injury reports and game-day rosters need a media login (on-site news organizations only).
- **Public official material is pages and PDFs.** NFL.com Terms (May 16, 2024) bar "systematic retrieval" (§1.3) and allow links only to the home page without permission (§8). Game books restrict use to media coverage. Use them to check our numbers by hand, never as feeds.
- **League structure belongs in config plus nflverse.** `nfldata` gives 2026's 272 games (2 Wednesday, 4 Friday, 9 international) and head coaches per game. Wikidata is CC0 but stale: its current head coach matches only 18 of 32 clubs. No machine-readable source exists for coordinators, GMs or official club colours.

## 2. Catalog

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

## 3. Matrix rows

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

## 4. Redundancy

| Category | PRIMARY → SECONDARY → FALLBACK | Notes |
|---|---|---|
| Schedule (date, time, weekday, venue, neutral, network) | nflverse `games.csv` (daily, already used) → ESPN scoreboard (owner's machine only, DEC-006) → config snapshot of the official schedule release + manual NFL.com check | Real backup for public deploys: none besides our own dated snapshot. Keep a copy of each day's schedule to detect flex moves |
| Flex / time changes | nflverse daily diff vs our previous snapshot → ESPN (local) → curated news item with nfl.com/club source URL | No official machine log of flex changes |
| Results and standings | our engine from nflverse results → nflverse `standings.csv` (updated 2026-11-24) → NFL.com standings, read by hand | Cross-check two computed sources; NFL.com only by eye |
| Official clinch codes | our `status()` (conservative) → nflseedR-style solver (port, F03) → NFL.com `x/y/z/*` read by hand and media.nfl.com Playoff Scenarios | No lawful automated feed of official flags |
| Tie-break procedure | NFL.com tie-break page → Record & Fact Book → nflseedR's documentation | Config; re-check each March |
| Official injury report | nflverse `injuries` (daily) → ESPN injuries (local) → NFL.com/injuries read by hand | No lawful automated official feed |
| Transactions | ESPN transactions (local only) → curated news → NFL.com transactions read by hand | **No real backup for the public page** (nflverse has trades only) |
| Officials (crew per game) | nflverse `officials.csv` (lags; 2026 only through Week 5) → game book, read by hand → Football Zebras (reported) | **Weak**: show "as of" and gaps |
| Head coach | nflverse `games.csv` coach per game (current every week) → club website (manual) → Wikidata (stale) | Mid-season firings show as a coach-name change between games |
| Coordinators (OC/DC/ST), GM, owner, president | hand-kept config with club URL + date → Record & Fact Book (season start) → Wikidata (GM 4/32) | **No machine source**; config only |
| Club colours, names, abbreviations | `shared/teams.json` (config) → nflverse `teamcolors.csv` (2020) → teamcolorcodes.com | No official machine source |
| Venues, roof, surface | nflverse `games.csv` stadium fields → Wikidata (coordinates, CC0) → club sites | |
| International / neutral games | nflverse `location=Neutral` → operations.nfl.com international page → config | |
| Super Bowl sites | config with source URL → Record & Fact Book → Wikidata | Future sites taken from secondary press (see §7) |
| Official live play-by-play | Genius Sports (paid; future) → ESPN summary (local) → nflverse PBP (post-game, nightly) | **No free, lawful official live feed** |
| Weekly league releases / scenarios | media.nfl.com (link) → our simulator → none | |
| Hall of Fame / awards | PFHOF (link) → Wikidata → hand config | |

**League-structure data that needs no external API (keep in config, cite the source and the date checked):** conferences and divisions (stable since the 2002 realignment; nflverse `standings.csv` confirms 8 × 4 for 2002–2026); team ids, names, abbreviations, colours (`shared/teams.json`); tie-break procedure steps; schedule formula (6 + 4 + 4 + 2 + 1, 17 games, 18 weeks); playoff format (7 per conference, No. 1 seed bye — general knowledge, not re-checked here); flex windows per season; Week 18 slot pattern; Super Bowl sites; international venues of the year; stadium roof and surface (change rarely); Hall of Fame classes (annual). The schedule, results, coaches per game and officials need a data source (nflverse); everything live needs ESPN (local) or a paid feed.

**Official source per category:** schedule — NFL.com schedule and the annual schedule release; standings/clinch — NFL.com standings codes and media.nfl.com Playoff Scenarios; rules/tie-breakers — NFL.com tie-break page and the Official Playing Rules PDF; injuries — NFL.com official injury report (media.nfl.com version is gated); transactions — NFL Communications transaction wire (gated) and NFL.com transactions; officials — game books; stats and play-by-play — GSIS via Genius Sports (game books post-game); tracking — Next Gen Stats via Genius (site shows leaderboards); history — Record & Fact Book; staff — club websites; Hall of Fame — PFHOF.

**Official data simply not available to a small app:** the real-time official play-by-play and NGS feeds (Genius contract), GSIS, the NFL Shield API, NFL Communications' gated wire (transactions, injury reports, game-day rosters, guides), game books for anything but media coverage, NFL Pro/All-22 exports, and any automated retrieval of NFL.com (Terms §1.3).

## 5. Derived metrics

| RAW DATA REQUIRED | CALCULATION | RESULT |
|---|---|---|
| Game results + division/conference membership (config) | Win % with ties = ½ W + ½ L, per scope (all, division, conference, common opponents with minimum four for wild card) | Tie-break inputs; standings tables |
| Results + opponents' records | SOV = combined win % of beaten opponents; SOS = combined win % of all opponents | Tie-break steps 5–6 (division) / 4–5 (wild card) |
| Points for/against per team | Rank within conference and league for points scored and allowed; sum ranks; lowest wins; ties share rank | Tie-break steps 7–8 |
| Points by game | Net points in common games, conference games, all games | Tie-break steps the engine skips today (CLAUDE.md known gap) |
| Touchdowns by game (nflverse PBP or team stats) | Net touchdowns (TDs scored − allowed) in all games | Last step before coin toss |
| Standings + remaining schedule | Clinch/elimination solver; compare weekly with NFL.com `x/y/z/*` and media.nfl.com scenarios | Validated clinch flags |
| `gameday`, `gametime`, `weekday` | Days since each team's previous game; flag Wednesday/Friday/Saturday/Tuesday games; bye week = week with no game | Rest days, short weeks, bye map (descriptive, not model input without backtest) |
| Stadium coordinates (Wikidata CC0 or config) + schedule | Great-circle travel per game; time zones crossed; international trips and the following week | Travel burden (descriptive) |
| Our dated daily schedule snapshots | Diff of `gametime`/`gameday`/network per game_id | Flex-move log (no official log exists) |
| `home_coach`/`away_coach` by game | Coach change between consecutive games of a club; tenure in games | Coaching-change events with exact effective game |
| `officials.csv` / game book crew + nflverse PBP penalties | Penalties and flags per game by referee crew, normalised by plays | Crew tendencies (descriptive only) |
| Schedule + standings | Remaining strength of schedule (opponents' current win %) | SOS-remaining panel |

## 6. Gaps

- **Official real-time data** (play-by-play, NGS, betting feed): Genius Sports exclusive through the 2029 season; no published price or self-serve plan; enterprise contract assumed.
- **Machine-readable official transactions and injury reports**: NFL Communications versions are gated to on-site media; NFL.com's pages may not be collected systematically. ESPN's endpoints are usable only on the owner's machine (DEC-006), leaving the public page without an automated transactions source.
- **Officials**: no official advance assignments found; nflverse's file lags (2026 through Week 5 on Nov. 25); game books are media-only.
- **Coordinators, GMs, owners, presidents**: no structured public source; Wikidata is stale and partly wrong; must be hand-kept with citations.
- **Official club colours**: none public in machine form (Design Playbook covers only league colours).
- **Historical flex/time changes**: no official log; only our own snapshots from now on.
- **Expensive**: Genius (contact sales), Sportradar (commercial track), NFL Pro/NFL+ (personal use only even when paid).
- **Avoid**: NFL Shield API and any token minting (sportsdataverse-js `nfl_api`, sportscrape); NGS site JSON; automated NFL.com page collection; game-book parsing for publication; the dead `liveupdate` feeds; GSIS access requests.

## 7. Contradictions & UNVERIFIED

**Conflicts with the project's docs:**
- `docs/GITHUB_RESEARCH.md` lists sportsdataverse-js as an ESPN wrapper (Ref). It also has an `nfl_api` family that mints `api.nfl.com` tokens (src/core/auth.ts). Treat that family as AVOID.
- `docs/GITHUB_RESEARCH.md` says BurntSushi/nflgame's "feed's existence not verified": now verified **retired** (all `nfl.com/liveupdate/...` paths 301 to the home page).
- No conflict found with the registry's NFL entries (NFL.com RSS answers HTML; club terms restrictive). No repository file links `operations.nfl.com/the-rules/...`, which now 404s.
- The 2026 schedule has **Wednesday** (Sept. 9 opener NE at SEA; Nov. 25 GB at LA) and **Friday** (4) games. Any code that assumes Thursday/Sunday/Monday slots should be checked (not checked in code here; `src/universe/12-game.js`, `lib/fabric/score.js` mention weekday).

**Conflicts between sources:**
- Genius deal term: nfl.com's (2023) article says through 2027-28; Genius's June 11, 2025 release says through the 2029 season. Different announcements; the later one governs. One search summary mixed them up.
- Flex rules for TNF in 2026: Chargers.com says Weeks 13–17; Yahoo Sports says only twice in Weeks 14–16. The operations.nfl.com text is labelled for 2025 (TNF Weeks 13–17). **Unresolved** for 2026.
- Week 18 Saturday games: operations.nfl.com (2025 text) says three Saturday games. Not checked against the 2026 Week 18 schedule, which is set after Week 17.
- Wikidata vs nflverse head coaches: 14 of 32 differ; nflverse matches the games played (Wikidata stale).
- Wikidata owner (P127) errors: BAL → Eric DeCosta (the GM), SEA → Paul Allen, DEN → Pat Bowlen.

**UNVERIFIED:**
- NFL+ and NFL+ Premium prices (support.nfl.com refused, 403; figures from search snippets).
- 2026 Record & Fact Book contents (file is 22.8 MB, above the fetch limit).
- How far back game books are hosted on `static.www.nfl.com`; whether every game has one (only one checked).
- Big Data Bowl data licence (Kaggle rules are JavaScript-only).
- Football Zebras, teamcolorcodes.com and ECAL terms (not read).
- Genius Sports pricing and media/app licensing terms (none published).
- Super Bowl LXI (SoFi, Feb. 14, 2027), LXII (Mercedes-Benz Stadium, Atlanta), LXIII (Allegiant, Las Vegas) and LXIV (Nashville): from CBS Sports, Fox Sports and NBC search results, not from nfl.com (search budget ran out before an official check).
- The 2023 BUF–CIN "no contest" and the owners' AFC neutral-site resolution: from search results (buffalobills.com, ESPN, SI); not read in full. nflverse is consistent (2022 shows 271 regular-season games).
- Whether NFL Communications' gated area publishes weekly officiating assignments.
- The NGS site's history depth (2016 start is general knowledge).

**Most at risk of being wrong:** the claim that no public price or self-serve route exists for official NFL data through Genius Sports. It rests on Genius's and the NFL's press releases plus two searches that found no pricing; a media/developer offer could exist behind a sales page that was not read.

## 8. Research log

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
