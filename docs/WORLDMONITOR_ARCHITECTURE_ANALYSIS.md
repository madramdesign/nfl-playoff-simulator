# World Monitor Architecture Analysis

Reference repository: https://github.com/koala73/worldmonitor

## What was inspected
- Date: Nov. 21, 2026. Shallow clone of the default branch at commit `38e97006` (committed Nov. 21, 2026), version 2.11.8, about 10,500 files.
- Read directly: `ARCHITECTURE.md` (deployment, frontend, API, caching, testing), `package.json`, `LICENSE`.
- Read by a research agent, file by file, without running anything: `src/config/map-layer-definitions.ts`, `src/config/panels.ts`, `src/components/Panel.ts`, `DeckGLMap.ts`, `Map.ts`, `MapContainer.ts`, `src/utils/urlState.ts`, `src/utils/circuit-breaker.ts`, `src/services/data-freshness.ts`, `persistent-cache.ts`, `bootstrap.ts`, `breaking-news-alerts.ts`, `correlation-engine/`, `src/workers/`, `shared/news-catalog.json`, `shared/source-tiers.json`, `shared/news-clustering-core.js`, `server/gateway.ts`, `server/_shared/redis.ts`, `server/_shared/llm.ts`, `api/mcp/`, `api/health.js`, `api/bootstrap.js`, `api/youtube/embed.js`, `scripts/seed-*.mjs`, `e2e/` and `tests/`.
- No code was copied into this project (see [OPEN_SOURCE_LICENSE_DECISION.md](OPEN_SOURCE_LICENSE_DECISION.md)).

## Overall architecture
A TypeScript single-page app (Vite) with two map renderers (deck.gl over MapLibre, and an SVG fallback, plus an optional globe), about 110 panel classes on one `Panel` base class, and Web Workers for clustering and in-browser ML. Behind it: Vercel edge functions generated from protobuf contracts, Railway services that run "seed" loops writing upstream data into Upstash Redis, Convex for accounts and billing, a Tauri desktop app with a Node sidecar, and an MCP server with about 100 tools. Request handlers mostly read Redis; seeders do the fetching. 1,351 news feeds are catalogued with source tiers.

The scale (thousands of feeds, global map data, paying users) explains most of the machinery. NFL Universe has 32 teams, about 16 games a week and a few dozen feeds, so it keeps the ideas and drops most of the infrastructure.

## Transferable patterns

| Pattern | How World Monitor does it | NFL Universe adaptation | Existing project equivalent | Action | Risks/tradeoffs |
|---|---|---|---|---|---|
| Map | deck.gl/MapLibre, SVG fallback on mobile, Supercluster clustering, zoom thresholds per layer | One SVG map of the lower 48 with stadium nodes; division and "intelligence" (power against playoff chance) modes; zoom-dependent labels and badges. No clustering needed for 32 nodes | None | Rebuild (small) | SVG is enough until hundreds of markers |
| Layer registry | One table: key, icon, label, renderers, premium; separate tables for defaults, variant order, zoom thresholds, source per layer | One registry entry per layer with id, label, group, default, modes, source ids and render function, in one place | None | Rebuild | Keep it one table: World Monitor's split across files caused duplication it now tests for |
| Panels | `Panel` base class; loading, error with auto-retry backoff, empty, live/cached/unavailable badge, freshness badge; content writes only through helpers (a lint enforces it, after stuck error chips in production) | A small panel helper with the same states; one render path that always clears the error state | Cards with no states | Rebuild | |
| URL state | Allowlisted enums, clamped numbers, comma list of layers or `none`, debounced `replaceState`, URL beats saved settings on load | Same rules for `view`, `mode`, `layers`, `timeRange`, `team`, `game` | `localStorage` only | Rebuild | |
| Time range | `1h`, `6h`, `24h`, `48h`, `7d`, `all`; one filter shared by map and panels, memoized per minute | Adds `live`, `12h`, `30d`, `season`; historical replay later from the event log | None | Rebuild | Items without a time: World Monitor keeps them on the map and drops them in panels; we drop them in both |
| Freshness | Per-source tracker with fresh, stale, very stale and no data, thresholds from each source's maximum staleness; status panel; "intelligence gaps" so silence is not read as all clear | Source status in every payload; panel badges; a System Health panel; gaps called out | One build date | Rebuild | |
| Circuit breaker and cache | Failure count, cooldown, single recovery probe, stale-while-revalidate, last good data persisted (IndexedDB, 24-hour ceiling) | Per-source breaker in `lib/fabric/source.js` with last-good cache on disk; the page keeps last good payload | `server.js` 15-second cache | Rebuild | |
| Seeders write, API reads | Cron seeders fetch upstream and keep last good data on failure; handlers only read Redis; health compares age with maximum staleness | Adapters refresh lazily with stale-while-revalidate behind one server; a daily snapshot script for the static page | Daily build | Adapt | No Redis: one process, files on disk |
| Bootstrap snapshot | `/api/bootstrap` bundles small datasets for first paint, cached locally, read once | `D.fabric` embedded at build; the page paints from it and then polls | `D` blob | Adapt | Snapshot can be many hours old; must be labelled |
| Source registry and tiers | `news-catalog.json` (1,351 feeds), tiers 1-4, credibility from tier, propaganda risk and corroboration | Source definitions in the fabric with tier, refresh time, maximum staleness, terms notes; `docs/NFL_DATA_SOURCE_REGISTRY.md` | None | Rebuild | |
| News importance and clustering | Importance = 0.55 severity + 0.20 tier + 0.15 corroboration + 0.10 recency; title clustering by word overlap (Jaccard 0.5); breaking alerts gated on recency, importance and cooldowns | Same weighting idea with football keywords; clustering threshold 0.34 on short headlines; corroboration counts distinct publishers | Hand-curated news | Rebuild | Keyword severity is crude; it sorts a feed, it is not a model input |
| Composite index (Country Instability Index) | Components 0-100, weighted, plus baseline prior, capped boosts, floors and bands; trend against 24 hours | A per-team composite later (power, injuries, volatility, momentum), descriptive until backtested | Ratings and simulation | Defer | Composite indexes invite false precision |
| Correlation and cross-source signals | Adapters emit typed signals; "composite escalation" when 3 or more categories fire together in one place | Flag a game or team when injury, line move and weather fire together | News effect estimate | Later | |
| Workers | Clustering and correlation worker, ONNX ML worker, vector store | Simulation in a Web Worker so 20,000 to 100,000 seasons never block the page | Main-thread simulation | Adopt (simulation only) | Blob workers may be blocked in some hosts; fall back to main thread |
| AI | All model calls server-side, provider fallback chain, cached; insights brief precomputed every 30 minutes | Rule-based brief now; a model-written brief only after the owner picks a provider and accepts cost | None | Defer | Cost, keys, grounding |
| MCP | JSON-RPC over HTTP, about 100 tools reading cached data with freshness metadata, OAuth and quotas | A local stdio MCP server with a handful of read-only tools over the fabric and the engine, each answer carrying source and age | None | Rebuild (small) | |
| Live video | Only YouTube embeds through a small page with an id check, strict CSP, origin-checked messages; nothing hosted or proxied | Official league and team YouTube embeds only, links otherwise | None | Later | Embedding permission varies per video |
| Alerts | Breaking banner with dedupe and cooldowns; server relay to Telegram, Slack, email | In-page alerts for watched teams first; no outside delivery | None | Later | |
| Testing | Thousands of node:test files, Playwright per variant, explicit failure-mode tests (breaker persistence, cache recovery, blocked storage) | node:test-style plain scripts; failure-mode tests for every adapter (timeout, bad payload, breaker open, stale cache) | Engine invariants | Adapt | |

## Patterns not suitable here
1. Three map renderers, WebGL, clustering libraries: 32 stadiums fit one SVG.
2. Protobuf code generation, Redis, edge functions, two CDN layers: one Node process and flat files serve this load.
3. In-browser ML models, vector store, multi-provider model chain, streaming chat: no model yet, and no need for local embeddings.
4. The full MCP stack with OAuth, quotas and 100 tools: a local read-only server is enough.
5. Variants, entitlements, internationalization, notification relays with quiet hours.

## Conclusion
- Patterns to adopt: layer registry, panel state contract, URL state, shared time filter, per-source freshness and health, circuit breakers with last-good cache, bootstrap snapshot, source tiers with transparent importance scoring, simulation in a worker, a small MCP server.
- Patterns not suitable: the infrastructure listed above.
- Open questions: whether to add a language model (cost and provider); whether a paid multi-book odds source is wanted; how far official YouTube embedding is allowed per channel.
