# NFL API Recommendations: stacks, cost model, implementation tasks

Part of the NFL data and API universe research (NU-018, Nov. 25, 2026). Start at [NFL_API_UNIVERSE.md](NFL_API_UNIVERSE.md). Every price below was read on the provider's own page on Nov. 25, 2026 unless marked "quote" (sales only) or "unverified" (secondary source only). Prices change: re-check at checkout. The language-model cost of an AI assistant (DEC-009) is not included; estimates are in `docs/FEATURE_RESEARCH.md` §6.

## The decision that shapes everything: non-commercial or commercial

Most free sources in this research are free **for non-commercial use only**: Open-Meteo's free tier, Sleeper's API, FantasyPros' personal licence, FOX's RSS grant (individuals and non-profits), RainViewer, Stadia and MapTiler free tiers, spreadspoke and Big Data Bowl data. Several nflverse datasets republish data whose owners restrict reuse (Next Gen Stats scraped from the NFL's site, ESPN depth charts, Pro Football Reference tables, OverTheCap contracts). So:

- **As long as NFL Universe stays a free, ad-free fan project**, a $0–$100 a month stack covers almost everything except live play-by-play, transactions and in-season charting.
- **The moment it earns money** (ads, subscriptions, affiliate links, sponsorship), the floor jumps: weather, fantasy projections and news all need paid licences, and live data needs a contract. Realistically **$1,000 a month or more**, mostly quote-only.

## 1. Minimum-cost stack ($0 a month, plus the owner's existing FantasyPros subscription)

What this project runs today, corrected and extended with free, lawful sources only.

| Need | Source | Notes |
|---|---|---|
| Schedule, results, play-by-play, stats, injuries, rosters | nflverse (CC-BY-4.0 label; check each dataset's upstream, see corrections) | Pin the nflfastR model version; read the files the build uses, not stale formats (`.qs`, old `.csv.gz`) |
| Charting (play action, RPO, motion, blitz) | FTN via nflverse (CC-BY-SA) | Credit "FTN Data via nflverse"; share-alike on adapted tables |
| Odds | The Odds API free (500 credits a month) | Consensus published, per-book local (DEC-019); about 2 looks a day |
| Weather | Open-Meteo (non-commercial), NWS forecasts and alerts, Iowa Mesonet ASOS observations | Fix the snowfall unit bug first |
| Venues | Config built from Wikidata (CC0) and OpenStreetMap (ODbL, for field azimuths) | Update Buffalo's new stadium and the 2026 international venues |
| Maps | Natural Earth (public domain) | In use |
| Headlines | Yahoo RSS, FOX Sports NFL RSS (headline and link only), curated news | Test FOX from a GitHub runner first (DEC-024 precedent) |
| Insider posts | Bluesky curated accounts (public API, no key) | Owner decision: show post text or only handle and link |
| News discovery | GDELT DOC API | Count and link; show only publishers whose terms allow headlines |
| Fantasy | Our own fantasy points from nflverse; FantasyPros (owner's HOF key, about $8.99 a month billed annually, derived values only); Fantasy Football Calculator ADP; Sleeper trending (owner decision) | |
| Media | Official NFL and club YouTube (embed or link), official podcasts (titles and audio only) | No transcripts (iHeartMedia notice) |
| History and benchmarks | nflverse 1999 on; Neil Paine Elo (MIT, 1920–2024); nfelo outputs (licence allows republishing) | Ask nfelo about `nfeloqb` (no licence) |
| College and draft | CollegeFootballData.com free tier (1,000 calls a month; commercial use allowed; display yes, raw redistribution no); nflverse `draft_picks` and `combine` only for local analysis (Pro Football Reference upstream) | Draft facts themselves are public; avoid copying PFR tables |
| Live, owner's machine only | ESPN JSON (DEC-006) | Never published |

**Missing at $0:** live scores and play-by-play on the public page, transactions, in-season personnel and coverage, props history, closing lines, splits, contracts.

## 2. Production stack (a serious public app, possibly commercial)

| Need | Source | Cost |
|---|---|---|
| Live scores, play-by-play, injuries, depth charts, transactions | Sportradar NFL (push feeds; display on the properties named in the order form; "powered by Sportradar") **or** SportsDataIO NFL (5-minute injury and depth sync) | Quote; Rolling Insights' $599 a month per sport is the only published live price found (display terms ambiguous) |
| Odds, props, line history | The Odds API 100K plan ($59) or 5M ($119); add OpticOdds or Sportradar Odds for streaming | $59–119 plus quotes |
| Betting splits | Sportradar or SportsDataIO | Quote |
| Weather | Open-Meteo commercial plan + NWS; Visual Crossing as backup | About $29–99 (Open-Meteo, from its own posts; current page shows no prices) + $35–150 (Visual Crossing) |
| News | AP Media API or Reuters Connect with Field Level Media; SportsDataIO player news (Rotoworld, RotoBaller) | Quote |
| Insider social | X API pay-per-use (about $0.005 per post read; about $110 a month for 50 accounts) | Usage-based |
| Fantasy | FantasyPros Commercial (redistribution rights only in that tier) or SportsDataIO fantasy and DFS, or Fantasy Nerds ($499 or $2,999 a year) | Quote / $42–250 a month |
| Charting | FTN API | About $3,000–5,000 a year (unverified) |
| History | nflverse datasets with clean upstreams only (play-by-play, schedules, FTN with share-alike); vendor history for the rest | — |
| Photos | Imagn, Getty or AP | Quote |
| Contracts | OverTheCap or Spotrac licence, or a vendor | Quote |

## 3. Premium stack (best data regardless of cost)

Everything in the production stack, plus: Genius Sports official data (GSIS play-by-play and Next Gen Stats, the NFL's exclusive distributor through the 2029 season); video-derived tracking for NFL and college (SkillCorner, or Teamworks' Telemetry and Sportlogiq); PFF enterprise data and grades (now Teamworks); OpticOdds streaming with player props; a licensed lightning feed (Xweather about $0.006 a call, or Earth Networks by quote); a licensed highlights deal (NFL or WSC Sports); both AP and Reuters wires; a social-listening suite for sentiment (Brandwatch, Talkwalker or Sprout; quotes). All quote-only; budget in the tens of thousands of dollars a year at least (an inference from the absence of any published price, not a quote).

## 4. Hybrid stack (recommended for this project)

The minimum-cost stack as the open core, plus a few cheap licensed pieces where they unlock something visible, plus computed metrics in place of anything sold, plus explicit fallbacks:

1. **Open core:** nflverse (clean datasets published; restricted ones used locally or only as derived labels, per the owner's decision), Open-Meteo + NWS + ASOS, Wikidata/OSM venue config, Natural Earth, official media, Yahoo + FOX RSS, Bluesky, GDELT, FFC ADP, CFBD free.
2. **Cheap licensed pieces:** The Odds API 20K plan ($30) to add **licensed live scores** to the public page (about 30-second updates) and hourly odds; keep FantasyPros on the owner's personal key.
3. **Computed instead of bought:** consensus and no-vig probabilities (Shin for futures), opening and closing capture, EPA and tendencies, fantasy points and usage, travel and rest descriptors, wind components, Elo/SRS ([NFL_DERIVED_METRICS.md](NFL_DERIVED_METRICS.md)).
4. **Local only:** ESPN JSON for live play-by-play, inactives and transactions on the owner's machine (DEC-006).
5. **Fallbacks:** every chain in [NFL_DATA_BACKUP_STRATEGY.md](NFL_DATA_BACKUP_STRATEGY.md), with last-good carry-forward (exists).
6. **Add a licensed live feed** (Sportradar or SportsDataIO) only if live public play-by-play becomes a goal, and only with the owner's budget decision.

## 5. Cost model

Monthly. Each level includes everything in the levels below it. "Non-commercial" means the level is lawful only while the project earns nothing.

| Budget | Add | What it unlocks | Commercial? |
|---|---|---|---|
| **$0** | Section 1 stack (FantasyPros is the owner's existing subscription, about $8.99) | Everything shown today, plus FOX headlines, Bluesky insiders, GDELT discovery, ASOS observed weather, field azimuths, computed metrics | No |
| **$25** | Nothing material. CFBD's low tiers ($1–5) for more college calls; Render cron ($1) for a scheduler independent of GitHub's | Slightly more reliable scheduling; more college data | No |
| **$50** | The Odds API 20K plan ($30) | Licensed live scores on the public page (`/scores`, about 30 s; 1 credit a call); odds hourly on game days; one month of historical odds for a backtest of closing lines | No (other sources still non-commercial) |
| **$100** | The Odds API 100K ($59 instead of $30) and Fantasy Nerds Standard ($499 a year, about $42 a month) | Odds every 5–15 minutes, player props, closing lines captured near kickoff; a second, commercially licensed projection source | Partly (odds and Fantasy Nerds yes; others no) |
| **$250** | X API pay-per-use (about $110) and Open-Meteo commercial (about $29–99) | Breaking insider news from X; weather that is lawful in a commercial product | Closer: news text, fantasy and live data still not licensed |
| **$500** | FTN API (about $250–420 a month equivalent; unverified) or a public-display multi-book odds feed (TheRundown Pro $249, SportsGameOdds Pro $299, SharpAPI Pro $229) | In-season personnel, coverage and charting; or licensed multi-book history and a second odds source | Partly |
| **$1,000+** | A licensed live feed (Sportradar or SportsDataIO; quote; Rolling Insights $599 as a published lower bound), a news wire (AP or Reuters; quote), SportsDataIO fantasy/DFS, OpticOdds, NewsAPI.org ($449) | Live public play-by-play, injuries within minutes, transactions, depth charts, DFS salaries, splits, licensed news text | Yes, with contracts |
| **$10,000+ (inference)** | Genius Sports official data and NGS, Teamworks or SkillCorner tracking, PFF enterprise, licensed highlights and photos | Official data and tracking; the premium stack | Yes |

How the $50 level was sized (inference from the documented credit costs): polling `/scores` every 30 seconds through a Sunday window of about 11 hours is about 1,300 calls, Thursday and Monday about 500 each, so roughly 2,300 credits a game week, or about 9,500–10,000 a month in season; hourly `/odds` looks on game days (3 credits each) add a few thousand. That fits the 20,000-credit plan with room for an occasional props or history call, and does not fit the free 500.

## 6. Core dependencies, optional sources, backups, and sources never to trust as primary

| Role | Sources |
|---|---|
| **Core dependencies** | nflverse (schedule, results, play-by-play, injuries, rosters); The Odds API; Open-Meteo; NWS; GitHub Actions (fetching); the project's own fabric and snapshots |
| **Optional** | FantasyPros, Fantasy Football Calculator, Sleeper trending, FOX RSS, Bluesky, GDELT, CFBD, Neil Paine Elo, nfelo outputs, Iowa Mesonet, Wikidata, OpenStreetMap, official YouTube and podcasts |
| **Backups** | ESPN JSON (local only), NWS hourly for Open-Meteo, IEM/NCEI for nfldata weather, Neil Paine Elo for historical results, MyFantasyLeague for ADP, curated news for every feed, our own last-good snapshots for everything |
| **Never primary** | Wikidata for current staff (stale), Sleeper statuses for official injury designations (blend reported and official), any RapidAPI reseller, scraped sites, prediction-market prices, Covers "consensus", social posts for facts until confirmed, ESPN for anything published, Big Data Bowl samples for current-season claims |

## 7. Recommended implementation tasks (after this research; none started)

Ordered by value and risk. Each needs its own task, tests and, where it touches the contract or `shared/teams.json`, the orchestrator. Owner decisions are marked.

**Correctness and compliance (do first)**
1. Fix the snowfall unit in `lib/fabric/adapters/public.js` (divided by 2.54 twice).
2. Check the FantasyPros call: the projections endpoint has no `scoring` parameter; confirm from the answer's own `scoring` field what the stored points mean, and label them accordingly.
3. Registry: classify nflverse dataset by dataset (upstream owner, our verdict), add Sleeper's Nov. 17 terms, nfeloqb's missing licence, the podcast notice, FOX RSS, FantasyPros tiers (done in this pass; see the registry).
4. **Owner decision:** whether the public snapshot may keep ESPN-derived depth-chart starter labels (via nflverse) and Sleeper names resolved through the GPL DynastyProcess crosswalk; options are keep with attribution, keep only derived labels, or resolve from other sources.
5. **Owner decision:** Sleeper trending under the new terms (keep, ask Sleeper for written confirmation, or drop).
6. Ask nfelo about a licence for `nfeloqb/qb_elos.csv`, or switch to the licensed `nfelo` outputs or our own quarterback metric.
7. Update `shared/teams.json`: Buffalo's new stadium coordinates; the 2026 international venues in `neutralSites` (orchestrator; contract file).
8. Pin the nflfastR model version used for any stored EPA or win probability (the Nov. 25, 2026 rebuild changed every season).

**New public data (free)**
9. FOX Sports NFL RSS: one read-only GitHub workflow run to confirm reach, then an adapter keeping title, link, time, publisher (drop `content:encoded`); credit FOX Sports (backlog F54).
10. Bluesky curated insiders adapter (public API, no key), after the owner decides on post text.
11. Venue config: field azimuths from OpenStreetMap, elevations, IANA time zones; nearest ASOS station per venue; observed weather from Iowa Mesonet for history.
12. Derived descriptors: travel, time zones, body clock, rest; wind along and across the field; glare flag (descriptive only).
13. Own Elo and SRS from nflverse results, seeded and checked against Neil Paine's MIT Elo.
14. Our own snapshots as the record of practice participation and depth-chart changes (event model in R6).
15. Shin or power devig for futures; opening and closing capture with the gap shown.

**Needs the owner's budget**
16. The Odds API $30 plan and a `/scores` adapter for licensed live scores on the public page.
17. A paid month of The Odds API history for a closing-line backtest.
18. Only if live public play-by-play becomes a goal: a Sportradar or SportsDataIO quote.
