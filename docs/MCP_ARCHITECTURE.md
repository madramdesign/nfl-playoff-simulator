# MCP server

`mcp/server.js` is a small Model Context Protocol server that lets the owner's own AI agents (Claude Code or any MCP client) query NFL Universe. It is read-only, runs locally over stdio, and has no npm dependencies (Node 18 or later).

## What it reads

```
agent ⇄ stdio (JSON-RPC 2.0, one message per line) ⇄ mcp/server.js      protocol: initialize, ping, tools/list, tools/call
                                                       └ mcp/tools.js     14 tools, argument checks, the answer envelope
                                                          ├ mcp/universe.js  lib/fabric createFabric({scopes, cacheDir: null}), or NFLU_FIXTURE
                                                          ├ mcp/engine.js    the page's engine from public/index.html, loaded once; 60 s result cache
                                                          └ data/snapshots/  saved daily forecasts (get_what_changed)
```

- **Live data** comes from the data fabric (`lib/fabric`), the same code behind `/api/universe`. The MCP server calls no source itself; every outbound address is fixed in the fabric's adapters, never taken from a tool argument.
- **Forecasts** come from the page's engine (`<script id="engine">` in `public/index.html`), loaded once the way `scripts/snapshot.js` does it. Simulations run in blend mode, the page's default, with the engine's fixed seed unless a seed is given. Identical simulation requests within 60 seconds reuse the result.
- **What changed** compares the current forecast with the newest snapshot in `data/snapshots/` that was made from a different build (a snapshot of the same build would show nothing; the page's what-changed view uses the same rule).

## Register it with Claude Code

```
claude mcp add nfl-universe -- node /abs/path/nfl-playoff-simulator/mcp/server.js
claude mcp add nfl-universe -e NFLU_SCOPES=public -- node /abs/path/nfl-playoff-simulator/mcp/server.js   # public sources only
```

The same server as a project `.mcp.json` entry (shown here only; the repository does not ship this file):

```json
{
  "mcpServers": {
    "nfl-universe": {
      "type": "stdio",
      "command": "node",
      "args": ["/abs/path/nfl-playoff-simulator/mcp/server.js"],
      "env": { "NFLU_SCOPES": "public,local" }
    }
  }
}
```

Paths inside the server are relative to its own file, so it works from any working directory.

| Variable | Default | Effect |
|---|---|---|
| `NFLU_SCOPES` | `public,local` | `public` leaves out the local-only ESPN JSON sources (DEC-006). Anything it cannot parse also means `public`. |
| `NFLU_FIXTURE` | unset | Path to a universe JSON (for example `test/fixtures/universe.sample.json`). The server reads it instead of calling the fabric: no network. The file must pass `validateUniverse`; `NFLU_SCOPES` filters it the same way. |
| `NFLU_TIMEOUT_MS` | `25000` | How long a tool waits for the sources. The first call after start fetches every source; if they are slow, the tool answers with an error and the source states, and the load finishes in the background. |

## Protocol

- JSON-RPC 2.0 over stdin and stdout, one JSON message per line. Only protocol messages are written to stdout; logs go to stderr (`console.log` is redirected there too).
- `initialize`: the client's `protocolVersion` is echoed when it is `2025-06-18`, `2025-03-26` or `2024-11-05`; any other gets `2025-06-18`. Capabilities: `tools` only (`listChanged: false`). The answer includes short `instructions` for the agent.
- `notifications/initialized` and other notifications get no answer. `ping` answers `{}`. Batches (arrays) are answered as arrays, for older clients.
- `tools/list` returns every tool with its JSON Schema (`additionalProperties: false`) and annotations `readOnlyHint: true`, `destructiveHint: false`, `idempotentHint: true`.
- `tools/call` returns `{content: [{type: "text", text: <JSON>}], structuredContent: <the same object>, isError?}`.
- Errors: `-32700` a line that is not JSON; `-32600` not a JSON-RPC 2.0 request; `-32601` unknown method (resources, prompts and the rest are not offered); `-32602` malformed `params`, a non-object `arguments`, or an unknown tool name. Argument values that break a tool's schema (unknown property, wrong type, out of range, unknown team) and impossible picks come back as a tool result with `isError: true` and a message listing every problem, so an agent can correct itself.
- Requests are accepted before `initialize`; the server does not enforce the handshake order.

## Every answer

```
{ generatedAt,            when this answer was made
  mode,                   "live" or "fixture"
  scopes,                 the scopes in force
  dataAsOf,               the universe payload's generatedAt (tools that read it)
  fixture,                present in fixture mode: the fixture's own "invented data" label
  sources: [{id, label, status, scope, ageSec, lastOk}],   every source the answer drew on
  unavailableSources: [{id, status, scope, lastOk, lastError}],  those whose status is not "ok"
  ...the tool's own fields, often with notes[] }
```

Besides the fabric's sources, two local ones can appear: `engine` (the build in `public/index.html`; stale after 48 hours or when the page was rebuilt after the server loaded it) and `forecast-snapshots` (`data/snapshots/`). When a source is down or stale the answer says so in `unavailableSources` and, where it matters, in a note ("No injury source answered; the absence of entries says nothing about this team"). Each item keeps its own `source` and `sourceScope`; events carry a `basis` that separates reported claims (headlines), source reports (injuries, transactions), source facts (scores), market data, forecasts and model estimates.

## Tools

Team arguments take the page's abbreviations (`BUF`, `NYG`, `LAR`, `WAS`, `JAX`, from `shared/teams.json`), case-insensitive; provider forms such as `WSH`, `JAC` and `LA` are mapped. Chances are 0 to 1.

| Tool | Arguments | Returns |
|---|---|---|
| `get_games` | `team?`, `state?` (pre, in, post) | This week's games: state, score (null before kickoff), period, clock, venue, line (`spreadHome`, `total`, `homeWinProbNoVig`, moneylines, each open/current/move, with source and provider), kickoff-hour weather with source, live situation and the source's win estimate, and `engine` (engine game id, the model's home chance, and a note when the feed shows a final the engine still simulates) |
| `get_live_games` | none | Games in progress, the live source's status, counts by state; says when no live source is in scope or it is stale or down |
| `get_injuries` | `team?` | Per team: descriptive burden, counts, players with status, injury, source, and the other source's report where two disagree |
| `get_news` | `team?`, `hours?` 1-720, `limit?` 1-100 (default 20) | Headlines and curated quarterback changes, newest first, with publisher, link, corroboration and rule-based importance and confidence |
| `get_events` | `type?` (contract event types), `team?`, `hours?`, `minImportance?` 0-100, `limit?` | The unified event feed |
| `get_odds` | `team?` | Lines with open, current and move, source and provider, plus the line the engine was built with |
| `get_weather` | none | Forecasts for outdoor games, flags (wind, rain, snow, cold), indoor games marked, and why a game has no forecast |
| `get_team` | `team` | Identity, record, ratings in points with ranks (spread-based, results, Elo, scoring margin, EPA, and the blend), quarterback adjustment, remaining games with engine game ids and win chances, this week's game, injuries, recent events, transactions |
| `get_standings` | `conference?` (AFC, NFC) | Records from the engine's finished games (wins, losses, ties, percentage, points, division and conference records) by division, and the seeds if the season ended today |
| `get_playoff_odds` | `team?`, `sims?` 1000-100000 (default 20000) | Playoffs, division, top seed, reach and win the Super Bowl, projected wins; with `team`, the chance of each seed; `monteCarloMargin95` |
| `run_simulation` | `picks` {engine game id: winner}, `sims?`, `seed?` | The same chances with the picks applied, the chances without them (same sims and seed), and the change, for all 32 teams |
| `get_what_changed` | none | Snapshot compared (file, date, build), playoff movers of 3 points or more, line moves of 2 points of win chance or more, new lines, results added, and the largest moves even when under the thresholds |
| `get_source_health` | none | Every source: status, scope, tier, breaker, age, last success, last error, failures, latency, records; plus `engine` and `forecast-snapshots` |
| `search` | `query` (1-200 characters) | Case-insensitive matches grouped as teams (names, nicknames, aliases, cities), events (titles), injured players and engine game ids |

Engine game ids follow nflverse (`2026_12_NYG_IND`; the Rams are `LA` there). `run_simulation` rejects ids that are not among the engine's remaining games and winners that do not play in the game, and simulates nothing when any pick is invalid.

## Rules

- **Read-only.** No tool writes a file, saves a pick, posts, buys or touches an account. Picks exist only inside one `run_simulation` call. The fabric runs with `cacheDir: null`, so the server keeps last-good answers in memory and writes nothing to `.cache/`.
- **No arbitrary fetches.** Tool arguments never become URLs; only the fabric's fixed adapter addresses are called.
- **Scope (DEC-006).** The server is a local tool for the owner, so by default it uses public and local sources; `NFLU_SCOPES=public` restricts it. Every item names its source and scope. Nothing the server returns is committed or published by it.
- **Never invent.** Values come from the payload, the engine or a snapshot. Missing data is reported as missing, with the source's status.
- **Facts, claims and estimates stay apart** (each answer's `basis` fields and notes).

## Testing

`node test/mcp.test.js` spawns the server with `NFLU_FIXTURE=test/fixtures/universe.sample.json`, runs the handshake, lists the tools, calls all 14 tools (including `get_playoff_odds` with 2000 seasons and `run_simulation` with one pick), checks invalid arguments, unknown tools and methods, malformed JSON, invalid requests and a batch, then repeats key calls with `NFLU_SCOPES=public`. It also checks the argument validator and, in-process with a fake fetch that always fails, that answers say the sources are down instead of looking empty. No network; about one second.

## Known limits

- The engine is loaded once. After the daily refresh rebuilds `public/index.html`, the `engine` source shows as stale until the MCP server restarts.
- Forecasts use the engine data as of its build. Games finished since then are simulated as open; `get_games` flags them with the pick that would apply the result in `run_simulation`. Live scores of games in progress are not applied to simulations.
- No disk cache: the first call after start fetches every source (a few seconds, up to `NFLU_TIMEOUT_MS`), and the server cannot reuse the local web server's `.cache/fabric` answers. A read-only cache option in `lib/fabric/source.js` would allow that.
- While the first load is still running, `get_source_health` shows sources that have not answered yet as `down` (the fabric's status for "tried, no data yet").
- Standings are ordered by win percentage and net points for display; only `seedsIfSeasonEndedToday` applies tiebreakers, with the engine's known gaps (three rare steps skipped).
- `hours` filters count back from the payload's `generatedAt`, not from the wall clock (the same in live use; it keeps fixture tests stable).
- In fixture mode with `NFLU_SCOPES=public`, games whose state came from a local source are dropped, since the fixture cannot say what a public source would have shown.
- No resources, prompts, subscriptions, pagination or progress notifications. Ties cannot be picked (an engine limit).
