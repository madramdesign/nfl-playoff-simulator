# R9 — News, press conferences, social, sentiment, video/images/podcasts licensing

Research track R9 for NFL Universe. Date of research: 2026-11-25 (all "Verified" dates are this day unless stated). Repository read-only; this file is the only output.

## 1. Summary

56 sources catalogued.

- **Replacing ESPN on GitHub:** FOX Sports is the only national publisher found with written RSS terms that fit: feeds are free "for individuals and non-profit organizations for non-commercial use", with attribution. Recommended public stack: Yahoo RSS (in use), FOX NFL RSS (headlines only, bodies dropped), and curated verified Bluesky accounts. Rapoport and ProFootballTalk post daily there; Schefter and the clubs effectively do not. Add official video titles, GDELT as a permissive backstop for discovery and coverage volume, and the curated news. GitHub's reach to FOX, Bluesky and GDELT is untested.
- **Avoid:** Google News RSS (its feed allows only "a personal feed reader"), Sporting News, Yardbarker, RotoWire and NBC/Rotoworld (automation barred), The Athletic, Mediastack, Spotify, and Bing (retired Aug. 11, 2025). Free news-API tiers are delayed 12–24 hours or development-only.
- **Transcripts:** all six official NFL podcast feeds publish transcripts, but each feed's iHeartMedia notice forbids "text and data mining or computational analysis". That blocks F37 and corrects the note on Whisper. YouTube captions are owner-only.
- **Social:** X is pay-per-use ($0.005 per post read; about $110 a month for 50 accounts) and bars model training. Reddit needs approval and bars AI training. YouTube's policies bar comment sentiment.
- **Commercial path:** AP or Reuters/Field Level Media for text; SportsDataIO for player news (it distributes Rotoworld exclusively); paid X; licensed photos; an NFL licence for highlights.

## 2. Catalog

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

## 3. Matrix rows

| Category | Provider | Data | Live | Historical | Free | Paid | Cost | License | Quality | Latency | Commercial | Primary/Backup | Score |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| News feed | FOX Sports NFL RSS | headlines, links, times (+bodies to drop) | yes | 26 items | yes | – | $0 | explicit RSS grant: individuals/non-profits, non-commercial, attribution | high | minutes | needs permission | PRIMARY (public page) | 6.7 |
| News feed | Yahoo Sports NFL RSS (registry) | headlines | yes | 32 items | yes | – | $0 | unmodified, credited, linked, no ads, non-commercial | high | minutes | no (§2(e)) | PRIMARY (in use; works from GitHub) | – |
| News index | GDELT DOC 2.0 / GKG | URL, title, domain, time, tone, themes | 15-min batches | DOC 3 months; raw files since 2015 | yes | – | $0 | free incl. commercial; redistribute with citation | medium-low | 15 min | yes | SECONDARY (discovery, volume) | 6.7 |
| News feed | The Athletic NFL RSS | headlines | yes | 100 items | yes | – | $0 | NYT personal non-commercial; AI use barred | very high | minutes | no | AVOID (until terms read) | 6.3 |
| News feed | Google News RSS | headlines via Google links | yes | days | yes | – | $0 | personal feed reader only | high | minutes | no | AVOID | 5.7 |
| News feed | NBC Rotoworld player-news RSS | player notes | yes | 10 items | yes | via SportsDataIO | $0 | NBC terms bar automation | high | minutes | via SportsDataIO | AVOID (public) | 5.7 |
| News feed | RotoWire RSS / API | player notes | yes | 5 items | RSS | API by quote | ? | automation and AI barred without consent | high | minutes | API licence | AVOID / OPTIONAL (commercial) | 5.7 |
| News feed | PFN RSS | headlines (long descriptions) | yes | 50 | yes | – | $0 | terms not found | medium | minutes | ? | OPTIONAL after terms | 5.4 |
| News feed | NFL Trade Rumors RSS | rumor aggregation | yes | 10 | yes | – | $0 | not read | low-medium | minutes | ? | AVOID | 5.2 |
| News feed | Sporting News RSS | headlines | yes | 20 | yes | – | $0 | scrapers and AI prompting barred | medium | minutes | no | AVOID | 5.1 |
| News feed | SB Nation Atom | full posts | yes | 10 | yes | – | $0 | unreadable (blocked) | medium | minutes | ? | AVOID | 4.9 |
| News feed | SI site feed | mixed sport | yes | 81 | yes | – | $0 | unknown | medium | minutes | ? | AVOID | 4.5 |
| News feed | Yardbarker | aggregation | yes | 20 | yes | – | $0 | robots barred, personal only | low | minutes | no | AVOID | 3.9 |
| News API | NewsAPI.org | articles metadata | paid only | 5 y | dev only | $449–1,749/mo | $$$ | no publisher rights | medium | real time | paid | AVOID | 5.7 |
| News API | GNews | articles metadata | paid | since 2020 | 100/day, 12 h delay | €49.99–249.99/mo | $ | paid for commercial | medium | 12 h free | paid | OPTIONAL (commercial) | 5.7 |
| News API | NewsData.io | articles | paid | up to 10 y | 200 credits/day, 12 h delay | $199.99–1,299.99/mo | $$ | contradictory | medium | 12 h free | unclear | AVOID | 5.2 |
| News API | Mediastack | articles | paid | yes | 100 calls/mo | $24.99–249.99/mo | $ | no public online display | low | delayed free | paid | AVOID | 4.7 |
| News API | NewsAPI.ai (Event Registry) | articles, events, entities | yes | since 2014 (paid) | 2,000 tokens once | $90–3,000/mo | $$ | terms not read | high | real time | unverified | OPTIONAL (commercial) | 6.2 |
| News API | Perigon | articles, stories, entities | yes | 3 mo–10+ y | trial | $25 personal; $225 limited commercial; $875 commercial | $$ | per plan | high | real time | from $225 | OPTIONAL (commercial) | 6.3 |
| News API | Webz.io | full-text web/news | yes | limited; 10 y by quote | $5 credit/mo | pay-as-you-go | $ | not read | medium | real time | unverified | AVOID / research | 5.8 |
| News API | Bing News Search | – | – | – | – | – | – | retired Aug. 11, 2025 | – | – | – | AVOID | – |
| Archive | Common Crawl CC-NEWS | WARC pages | no | since 2016 | yes | – | $0 | publishers' rights apply | raw | days | risky | AVOID | 5.6 |
| Wire | AP Media API | text, photo, video | yes | deep | no | contract | $$$ | full licence | very high | real time | yes | PRIMARY (commercial text) | 7.3 |
| Wire | Reuters Connect (+FLM, Imagn) | text, photo, video | yes | deep | no | points/contract | $$$ | full licence | high | real time | yes | SECONDARY (commercial) | 6.8 |
| Wire | Field Level Media | recaps, news | yes | ? | no | contract | $$ | licence | good | real time | yes | OPTIONAL (commercial) | 6.2 |
| Player news | SportsDataIO (Rotoworld, RotoBaller, own notes) | player notes, injuries | yes | season+ | trial | contract | $$ | store/display; no resale; attribution | high | real time | yes | PRIMARY (commercial player news) | 7.4 |
| Social | X API v2 | posts, users | yes | full archive | no | $0.005/post read; 3M cap | ~$110/mo for 50 accounts | no AI training; delete on request; display rules | very high | seconds | yes (commercial designation) | OPTIONAL now; PRIMARY commercial | 7.3 |
| Social embed | X oEmbed (publish.x.com) | embed HTML | yes | – | yes | – | $0 | embeds preferred | high | – | yes | SECONDARY (display) | 7.6 |
| Social | Bluesky public AppView | posts of curated accounts | yes | full account history | yes | – | $0 | authors' copyright; honor deletions | high (few accounts) | seconds | yes | PRIMARY (free social) | 7.4 |
| Social | Bluesky Jetstream | firehose JSON | yes | replay window ? | yes | – | $0 | as above | raw | sub-second | yes | OPTIONAL (always-on server) | 6.8 |
| Social embed | Bluesky oEmbed | embed HTML | yes | – | yes | – | $0 | official embed | high | – | yes | SECONDARY (display) | 7.3 |
| Social | Threads keyword search | public posts | yes | since Jul. 2023 | yes (approval) | – | $0 | terms not read | medium | minutes | ? | OPTIONAL | 6.2 |
| Social | Reddit Data API | posts, comments | yes | yes | approval | contract | ? | AI training barred; commercial by agreement | medium | minutes | contract | OPTIONAL (research, approval) | 5.6 |
| Social | Mastodon tag timelines | posts | yes | – | yes | – | $0 | per instance | low (bots) | minutes | ? | AVOID | 5.5 |
| Video meta | YouTube Data API v3 | metadata, live status, comments | yes | yes | 10,000 units/day | – | $0 | no aggregation or derived metrics; 30-day refresh | very high | minutes | with policy limits | SECONDARY (live status, Made for Kids) | 7.7 |
| Captions | YouTube captions.download | captions | – | – | edit-permission only | – | – | owner-only | – | – | – | AVOID | 5.9 |
| Transcripts | NFL/iHeart podcast transcripts | SRT/VTT/text | per episode | feed depth | yes | – | $0 | TDM/AI prohibited | ? | with episode | no | AVOID (link only) | 6.2 |
| Transcripts | ASAP Sports | Q&A transcripts | – | deep | yes | – | $0 | unknown | high | hours | ? | AVOID (no NFL seen) | 4.6 |
| Podcasts | Podcast Index API | feeds, episodes | yes | deep | key | – | $0 | ToS v1.1 | good | hours | yes | SECONDARY (discovery) | 7.1 |
| Podcasts | iTunes Search API | podcast lookup | – | – | yes | – | $0 | promote store content | good | – | limited | OPTIONAL | 6.5 |
| Podcasts | Spotify Web API | catalog | – | – | yes | – | $0 | no ML ingestion; personal use | good | – | no | AVOID | 6.0 |
| Images | Wikimedia Commons | player photos | – | yes | yes | – | $0 | CC BY / BY-SA per file; personality rights | medium | – | yes with care | SECONDARY | 7.0 |
| Images | Imagn / Getty / AP photos | game photos | yes | deep | no | quote | $$ | editorial licence | very high | minutes | yes | OPTIONAL (commercial) | – |
| Embeds | Instagram oEmbed | embed HTML | – | – | token? | – | $0 | embed-only, no analytics | – | – | limited | OPTIONAL | 6.2 |
| Embeds | TikTok oEmbed / Research API | embed / research data | – | – | oEmbed yes | – | $0 | Research API academic only | – | – | no (research) | OPTIONAL / AVOID | 5.7 |
| Listening | Sprout / Brandwatch / Talkwalker | social listening | yes | varies | no | quote ($199–399/seat + add-on for Sprout) | $$$ | vendor licence | high | minutes | yes | AVOID now; OPTIONAL commercial | 5.9 (Sprout) |

## 4. Redundancy

| Data category | PRIMARY → SECONDARY → FALLBACK | Real backup? |
|---|---|---|
| National NFL headlines (public page, fetched on GitHub) | Yahoo RSS (in use) → **FOX Sports NFL RSS** (explicit non-commercial grant; GitHub reachability to verify) → curated news (`data/news.json`) and official YouTube titles | Yes once FOX is verified from GitHub; today only Yahoo + curated |
| National NFL headlines (Render / owner's Mac) | ESPN RSS + Yahoo RSS → FOX RSS → curated | Yes |
| Headline discovery / coverage volume | GDELT DOC API (throttled) → GDELT 15-minute raw files (heavy) → our own feed counts | Partial (GDELT is one provider; DOC throttling seen) |
| Breaking insider news | Bluesky curated insiders (Rapoport, PFT, AP; free) → X API pay-per-use (paid, owner key) → official club/league confirmation via YouTube/curated | **No free backup for X-only insiders** (Schefter, Pelissero, Garafolo are effectively X-only today) |
| Official club news | — (club RSS blocked by terms, F14) → club YouTube channels (titles) → links to club home pages | No text source |
| Press conferences | Club YouTube (embed/link, in use) → club website links → none | **No lawful free transcripts** |
| Podcasts | Six official NFL feeds (in use; titles/audio only) → Podcast Index discovery for other shows (key) → iTunes lookup | Yes for listing; **no** for transcripts |
| Player news / injury notes (commercial) | SportsDataIO (Rotoworld + RotoBaller + own) → RotoWire API → nflverse injuries (data, not news) | Yes (paid) |
| Wire text (commercial) | AP Media API → Reuters Connect (+FLM) → Field Level Media direct | Yes (paid) |
| Social display | Official embeds (X, Bluesky) → plain link with handle and time | Yes; on claude.ai only links work |
| Fan sentiment | Bluesky keyword sample (own classifier) → Reddit (after approval) → none | Weak; YouTube comments barred by policy |
| Player photos | Wikimedia Commons (per-file licence) → licensed agency (Imagn/Getty/AP, paid) → none (initials avatar) | Paid only |
| Highlights video | Official YouTube embeds (in use) → NFL licence / WSC (commercial) → links | No free alternative beyond YouTube |

### Recommended news stacks (answer to the track question)

**Public, non-commercial page, fetched on GitHub Actions (replacing ESPN RSS there, F54):**
1. Yahoo Sports NFL RSS — keep (works from GitHub today; DEC-012 conditions).
2. **FOX Sports NFL RSS** — add as the ESPN replacement: FOX's RSS page grants feeds "for individuals and non-profit organizations for non-commercial use" with attribution. Keep title, link, time, publisher only; drop `description` and `content:encoded` (DEC-008); credit "FOX Sports"; never feed FOX text to an LLM (ToU §4 AI clause). First run a one-off read-only GitHub workflow to confirm FOX's Fastly edge answers Azure runners (as done for ESPN in DEC-024).
3. **Bluesky, curated verified accounts** (start: `rapsheet.bsky.social`, `profootballtalk.bsky.social`, `apnews.com`, plus active beat reporters after a manual check) via `app.bsky.feed.getAuthorFeed` on `public.api.bsky.app`, every 10–15 minutes, no key; show handle, time and link (official embed on Render/local); drop items whose post disappears on the next read (developer guideline 3). Owner decision: whether to show the post text itself (authors' copyright) or only "@handle posted about <team>" with a link.
4. **Official league/club video titles** (already wired) as tier-1 items in the same news panel.
5. **GDELT DOC API** as a discovery/backstop and attention-volume layer (licence allows commercial use and redistribution with a GDELT citation), at most one request every 5 seconds with backoff; show only publishers whose own terms allow headline display, or count without displaying.
6. Curated news (`data/news.json`) — unchanged.
Not included: Google News RSS (personal reader only), The Athletic, Sporting News, NBC/Rotoworld, RotoWire, club feeds (F14).

**Commercial product — license instead:** AP Media API or Reuters Connect (+ Field Level Media) for publishable text and photos; SportsDataIO for player news (Rotoworld exclusive distribution, RotoBaller, own notes) with storage and display rights; X API (commercial designation; pay-per-use up to 3 million post reads a month, Enterprise above) with official embeds; a paid discovery API with a stated commercial grant (Perigon Launch/Growth or NewsAPI.ai; GNews paid) — these still give no rights in publishers' articles, so links only; editorial photos from Imagn/Getty/AP; highlights only through an NFL licence. Ask every vendor explicitly about AI-assistant use, since FOX, Sporting News, RotoWire, NYT, Reddit, X and Spotify all restrict AI training or prompting.

## 5. Derived metrics

| RAW DATA REQUIRED | CALCULATION | RESULT |
|---|---|---|
| Headlines (title, link, publisher, time) from all allowed feeds + Bluesky posts | Normalise titles (lowercase, strip punctuation and publisher suffix), word 3-shingles, Jaccard ≥ 0.5 **or** same matched team+player entities and claim verb within 6 h | Story clusters with first-seen time, source list, source count |
| Story clusters + source tier table (below) + parent-company map (e.g. ESPN/ESPN podcasts; NBC/PFT/Rotoworld; FOX) | Count independent tier-2/3 sources (distinct parent companies); aggregators (tier 4) and reposts never count; official tier-1 item upgrades at once | Verification label per claim: confirmed / reported / rumor / speculation, with the reason shown |
| Cluster first-seen times per source, later official confirmation (nflverse transactions/injuries, club YouTube, curated) | For each source: share of its "reported" claims later confirmed within 14 days; median lead time vs official | Our own insider accuracy and speed ledger (no published study was found to seed it) |
| GDELT DOC `timelinevol` or counts of our own headlines per team per day | Robust z-score vs trailing 28 days (median/MAD, |z| > 3.5) | "Media attention spike" flag per team (descriptive, DEC-007) |
| Bluesky posts (curated list or keyword sample) with times | Transparent lexicon or locally trained classifier; mean polarity with n and a bootstrap interval; minimum n before showing | Team fan-sentiment index (descriptive only; must pass the backtest rule before any model use) |
| Club YouTube feed items with `kind=press` | Count per team per 7 days; newest time | "Last press conference" and cadence indicator |
| Podcast episode titles (not transcripts) | Team-name matches per week across the six league shows | Podcast attention by team (low risk, but see §7 note on iHeart's notice) |
| Existing `newsEffect` inputs (line move around a news item) | Unchanged (CLAUDE.md) | News effect on playoff chances |

**Verification and confidence framework (proposal).**
- Labels (CLAUDE.md requires them in data and UI): `confirmed` (tier-1 official statement, official transaction wire or injury report, or the club's own video of the announcement); `reported` (a named tier-2/3 journalist or wire stating it as fact, usually "sources say"); `rumor` (unnamed or aggregator-only, hedged words: "could", "expected to", "per reports", "linked to"); `speculation` (opinion, analysis, podcast talk, mock drafts); `estimate` (our models).
- Source tiers: 1 official club/league (club sites, NFL Communications, official YouTube/podcasts); 2 national insiders and wires (e.g. Rapoport, Pelissero, Schefter, AP, Reuters/FLM); 3 established beat reporters and national outlets (FOX, Yahoo, ESPN, The Athletic, PFT); 4 aggregators and rumor sites (PFN, NFL Trade Rumors, Yardbarker, Google News); 5 fans and unverified accounts.
- Confidence: start from the best tier present; +1 step for each additional independent tier-2/3 source within 24 h (cap at "reported, high"); only a tier-1 item makes `confirmed`; a deleted post or retraction drops the claim and records why; unconfirmed rumors decay after 72 h to "stale rumor".
- Evidence on insider accuracy: **UNVERIFIED** — no published study was found (this session's search budget ran out before a dedicated search); the ledger above builds the evidence from our own data.

**Published research on sentiment vs outcomes (verified items only).**
- Sinha, Dyer, Gimpel, Smith (2013), "Predicting the NFL using Twitter", ECML/PKDD workshop, arXiv:1310.6998: "simple features using large volumes of tweets can match or exceed" game-statistic features for predicting NFL winners, spreads and totals (abstract read; betting-line comparison not checked in the full text).
- Brown, Rambaccussing, Reade, Rossi (2017/2018), "Forecasting with social media: evidence from tweets on soccer matches", *Economic Inquiry* (DOI 10.1111/ecin.12506; Crossref abstract read): 13.8 million tweets with Betfair prices; tweet tone "contains significant information not in betting prices", mainly right after goals and red cards (in-play soccer, not NFL).
- Hong and Skiena (2010), "The Wisdom of Bookies? Sentiment Analysis versus the NFL Point Spread", ICWSM — recalled, **UNVERIFIED** (not read).
- Implication: any sentiment factor is a candidate for the backtest rule, not a model input; collect timestamped Bluesky samples first so a backtest has history.

## 6. Gaps

- **Free insider news with display rights on GitHub:** only Bluesky (a minority of insiders) and FOX/Yahoo RSS. X is paid (pay-per-use; ~$110/month for 50 accounts at 15 posts/day). Several top insiders are effectively absent from Bluesky (Schefter 3 posts ever; Pelissero monthly).
- **Official club news text:** all 32 club feeds exist but terms block use (F14). No change found.
- **Press-conference transcripts:** no lawful free source. YouTube captions need edit permission; iHeart's league feeds forbid text and data mining; ASAP Sports shows college only; NFL Communications is login-only.
- **Podcast transcripts for non-league shows:** none published in feeds; transcribing them is an owner/legal decision.
- **Reddit:** approval-gated since Nov. 2025, anonymous JSON refused (403), AI training barred.
- **Highlights:** only official YouTube embeds; licensed highlights (NFL, WSC) are rights-holder deals.
- **Photos:** Commons covers stars patchily; everything else is paid (Imagn/Getty/AP).
- **Historical news archive with rights:** paid (NewsAPI.ai since 2014, Perigon, NewsAPI.org 5 years); GDELT DOC only 3 months (raw files deeper but heavy).
- **Expensive:** NewsAPI.org ($449/mo minimum for production), NewsData.io ($199.99), AP/Reuters (contract), listening suites (quote; Sprout seats $199+ before the listening add-on).
- **Avoid and why:** Google News RSS (personal feed reader only), Sporting News (scrapers and AI prompting barred), Yardbarker (robots barred), RotoWire RSS (automation and AI barred), NBC feeds incl. Rotoworld (automation barred; owner decision as PFT), The Athletic/NYT (personal use; AI use barred; our tool is blocked by NYT), Mediastack (no public online display), Bing (retired), Spotify (no ML ingestion), YouTube comment sentiment (aggregation/derived-metric bans), iHeart/NFL podcast transcripts (TDM ban), Common Crawl for product use.

## 7. Contradictions & UNVERIFIED

**Contradictions with the project's documents**
1. `docs/FEATURE_RESEARCH.md` line 236 ("Local Whisper-class transcription of podcasts is lower risk for private use") and backlog F37 ("Claims from official podcasts and pressers"): the six official NFL feeds carry `<copyright>` text from iHeartMedia that prohibits "text and data mining or computational analysis" and AI training without express written consent. F37 as scoped (official podcasts) is blocked without iHeart's consent, whether by Whisper or by the transcripts the feeds already publish.
2. `docs/MEDIA_ARCHITECTURE.md` / registry ("Display terms for third parties are not stated"): the feeds do state a rights notice — iHeartMedia (not the NFL) is named as copyright holder, with the TDM/AI prohibition. Listing and playing episodes is not affected; the `teams[]` tagging of episode titles is a minimal computational use of the feed's text — low risk in our reading, but the owner should know the notice exists. The registry should name iHeartMedia as the feeds' rights holder.
3. `docs/DECISIONS.md` DEC-012 names ESPN and Yahoo as the only feeds with explicit display terms: FOX Sports also has written RSS terms (individuals and non-profits, non-commercial, attribution required). Extension, not conflict.
4. Not a contradiction, but an update: Bluesky's developer docs moved from docs.bsky.app to bsky.network (308); Jetstream's repository is now a rewrite ("Full-network archive, replay, and streaming service"), the original in `jetstream-legacy`.
5. YouTube quota: the quota page now says `search.list` costs "1 per call" in its own bucket of 100 calls a day (commonly cited elsewhere as 100 units per call). No project doc states the old figure; recorded for whoever adds a key.

**UNVERIFIED (and why)**
- GitHub Actions reachability of FOX, PFN, GDELT, Bluesky, Podcast Index: cannot test from here; only Yahoo, YouTube and Omny are proven by `data/fabric/runs.json`. A one-off read-only workflow (as in DEC-024) would settle it.
- GDELT DOC API data shape today: three HTTP 429 answers (one request per 5 s rule; possibly an IP-level penalty). The 15-minute raw-file cadence was confirmed (23:00 UTC batch listed at 23:01 UTC).
- X free tier discontinuation date (Feb. 6, 2026) and "Public Utility" exception: third-party pages only.
- Reddit Responsible Builder Policy text, 100 QPM figure: official pages refused our tools (403/blocked); secondary sources and mirrored r/redditdev threads only.
- NYT/The Athletic RSS terms; Vox Media terms; PFN, SI, ASAP Sports, NFL Trade Rumors, Washington Post terms: pages not found or our tool is blocked.
- AP Media API and Reuters Connect pricing/terms: official pages blocked or not found; contact-sales assumed.
- NewsAPI.ai, Perigon, Webz.io, Threads display/storage terms: not read (pricing only).
- Instagram oEmbed token requirement; TikTok Embed Videos deprecation date; Bluesky "user intents" adoption.
- Insider accuracy studies; Hong & Skiena (2010) content.
- Quantexa/AYLIEN, Getty–NFL relationship, WSC Sports terms: search snippets only or nothing.
- Search budget: the session's shared WebSearch limit (200) was reached mid-track; later checks used only direct page reads, `gh`, Crossref DOI lookup and endpoint probes.

## 8. Research log

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
