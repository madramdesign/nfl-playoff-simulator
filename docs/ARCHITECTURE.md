# Architecture

Two parts: the simulator as it runs today, and the NFL Universe target that extends it. The target is a plan approved for milestone 1 (see `MASTER_PLAN.md`); parts marked "built" exist on the integration branch.

## Today (the simulator)

```
nflverse files ──► scripts/build.py ──► D (one JSON blob) ──► public/index.html
                        │  ▲                                     ├─ engine (pure functions)
 data/*.json ───────────┘  └── scripts/history.js (Node)         └─ interface
 scripts/evaluate.py ──► data/model_report.json                 server.js ──► /api/live (optional)
```

- **One contract:** the build produces `D`; the page reads only `D`. Field list in `DATA_SOURCES.md`.
- **Engine rules:** no DOM, deterministic for a given seed, callable from Node. `simulate(picks, focus, n, liveProbs, now, watch)` returns counts for every team.
- **Interface rules:** every number on screen comes from a `simulate` result or from `D`. The page must work as a static file with no server.
- **Evaluation is offline.** It needs numpy and several seasons of files, so it is run by hand and its output is committed.

## NFL Universe target

```
 EXTERNAL SOURCES        ESPN JSON · RSS · Open-Meteo · nflverse · Sleeper · data/news.json
        │
 SOURCE ADAPTERS         lib/fabric/adapters/*   one per source: fetch, then normalize (pure function)
        │                └ each wrapped by lib/fabric/source.js: timeout, retry, breaker, last-good cache  [built]
 NORMALIZATION           provider payload ─► contract shapes (games, injuries, transactions, items)
 ENTITY RESOLUTION       lib/fabric/entities.js: provider ids and headline aliases ─► team abbreviation   [built]
        │
 EVENT ASSEMBLY          lib/fabric/index.js: diff against the previous poll, cluster headlines,
        │                score importance and confidence (lib/fabric/score.js [built]), stamp ts and seenAt
 STORE                   .cache/fabric/<source>.json (last good)   data/fabric/latest.json (daily snapshot)
        │                data/fabric/events/<day>.json (first-seen events: the point-in-time record)
        │                data/snapshots/<day>.json (forecasts, existing)
 ANALYTICS               the page's engine (simulate, ratings, model views) run in Node by lib/model.js
        │                descriptive indexes: injury burden, weather flags (not model inputs, DEC-007)
 INTERFACES              server.js: /api/universe · /api/health · /api/game/<id> · /api/team/<abbr> · /api/live
        │                mcp/server.js: read-only tools over the same functions
 PRESENTATION            public/index.html: command center (src/universe/*) + simulator view
                         paints from D.fabric, then polls /api/universe; simulation in a Web Worker
```

### Source permissions shape this diagram
The terms research (`NFL_DATA_SOURCE_REGISTRY.md`) splits sources into permitted (nflverse, Open-Meteo, api.weather.gov, Sleeper, ESPN and Yahoo RSS headlines, curated news) and not granted (ESPN JSON, ProFootballTalk and CBS feeds). Until the owner decides DEC-006, the architecture holds, but adapters for sources that are not granted are not built, and nothing published or committed (the embedded snapshot, event files, fixtures) may contain data from them. If the owner chooses "personal, local use" for ESPN, those adapters run only behind the local server and are excluded from `data/fabric/` by the snapshot script.

### Rules that hold the design together
1. **Only adapters call the outside world.** The page, the MCP server and the snapshot script all go through `lib/fabric`. URLs come from the adapter definitions, never from requests, so there is no path for a caller to make the server fetch an arbitrary address.
2. **Every adapter can fail alone.** Breaker states and ages travel in the payload (`sources`), and every panel shows the age of what it draws. A failing source turns its panels stale or unavailable; nothing else changes.
3. **Contracts at the edges.** `lib/contract.js` checks the payload in tests, on real and fixture data. `shared/teams.json` is the only team table.
4. **Two clocks.** `ts` is when something happened; `seenAt` is when the fabric first saw it. Time-range filters use `ts`; any historical replay uses `seenAt`, so no replay can use information that arrived later.
5. **Facts, claims and estimates stay apart.** Source facts (a status, a score, a line) are shown as such with their source; headlines are reported claims with a publisher and corroboration count; anything computed (importance, burden, win chance) is labelled as computed.
6. **The static page is a first-class target.** With no server, the page uses the snapshot built into it and says how old it is.

### Failure model

| Failure | Effect | What the user sees |
|---|---|---|
| One source times out or errors | Breaker counts it; last good answer is served | That source's panels marked stale with their age |
| Three failures in a row | Breaker opens for 5 minutes, then one probe | Source shown as down in System Health |
| Source never answered since start | No data for that source | Panels show "unavailable", never empty-as-all-clear |
| Server down or static copy | Page uses `D.fabric` | "Snapshot, N hours old" on every live panel |
| Malformed payload | Adapter throws; counts as a failure | As above; contract tests catch shape drift in CI |

### Security boundaries
- No user input reaches an outbound URL except validated ids (`/api/game/<digits>`, `/api/team/<known abbreviation>`).
- All text from sources is inserted into the page as text, never as HTML.
- No secrets in the browser or the repository. Keyed sources (FantasyPros, any future odds or model provider) run server-side or in GitHub Actions with secrets.
- The MCP server is read-only and local (stdio); it cannot place picks, post anything or touch accounts.

### Performance
- Server: lazy refresh with stale-while-revalidate, one request in flight per source, small payloads (no raw provider JSON to the browser).
- Page: simulation in a Web Worker (20,000 seasons by default, 100,000 on request), SVG map of 32 nodes, feed rendering capped with "show more".

### Deliberately not built
Redis, a database, a bundler, WebGL maps, clustering libraries, in-browser ML, user accounts. Each is in `WORLDMONITOR_ARCHITECTURE_ANALYSIS.md` under "not suitable", with the reason. A database becomes worth it when the event record outgrows daily JSON files (roughly when replay needs queries across many weeks).
