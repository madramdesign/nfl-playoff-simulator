# Agent Handoff

- Agent: WS4 (AI/MCP engineer)
- Task ID: WS4, read-only MCP server
- Branch/worktree: `worktree-agent-ad1ce008d0e55eb4f` (started from `main`, merged `worktree-nfl-universe`); code commit `4baaeb2`, this file in the next commit
- Date: 2026-11-21

## Scope and acceptance criteria
- Dependency-free MCP server over stdio: `initialize` (echoes 2025-06-18, 2025-03-26 or 2024-11-05, else answers 2025-06-18), `notifications/initialized`, `ping`, `tools/list`, `tools/call`; JSON-RPC errors -32700, -32600, -32601, -32602. Met.
- 14 read-only tools with self-checked JSON Schemas; every answer carries `generatedAt`, its sources with status and scope, and `unavailableSources`. Met.
- Default scopes public and local, `NFLU_SCOPES=public` restricts; engine loaded once; 60 s simulation cache; `NFLU_FIXTURE` test hook. Met.

## Files changed
- `mcp/server.js` (protocol), `mcp/tools.js` (tools, envelope), `mcp/universe.js` (fabric or fixture, scope filter), `mcp/engine.js` (engine loader, simulation cache), `mcp/validate.js` (schema subset)
- `test/mcp.test.js`, `docs/MCP_ARCHITECTURE.md`, this file

## Decisions made
- Argument values that break a schema, and impossible picks, return `isError: true` with every problem listed (agents can self-correct); malformed `params`, non-object `arguments` and unknown tools return -32602.
- The fabric runs with `cacheDir: null`, so no tool writes files (no `.cache/` writes either).
- `get_what_changed` uses the newest snapshot made from a different build than the engine's, the page's own rule; the newest file (2026-11-21) is the same build and would show nothing. The skipped file and the reason are in the answer.
- Ratings in points are rating / 25, the page's convention.
- Team arguments are case-insensitive and accept provider forms (WSH, JAC, LA).

## Tests/checks run
| Command | Result |
|---|---|
| `node test/mcp.test.js` | `ok: 4 MCP tests pass (1.0 s)`, exit 0 |
| same, with one expectation deliberately broken | `1 of 4 MCP tests failed`, exit 1 (then restored) |
| `npm test` | engine, feed parser and 21 fabric tests pass, exit 0 |
| `node -e 'require("./test/run.js"); require("./test/mcp.test.js")'` | all three suites pass |
| one manual live run (`get_source_health`, `get_games`), default scopes | all 12 sources ok, NYG game matched to `2026_11_JAX_NYG`; no files written |
| manual timeout check (hanging fetch, `NFLU_TIMEOUT_MS=300`) | tool answers `isError` with source states |

## Risks / known limitations
- Live mode was exercised once by hand; the tests use the fixture and a fake fetch only.
- Engine loaded once: after the daily rebuild the `engine` source reads stale until restart.
- Games finished after the build are simulated as open (`get_games` flags them with the pick that applies the result); live scores are not applied to simulations.
- No disk cache, so the first call fetches every source; sources still loading show as `down`.
- Standings order within a division is display-only; tiebreakers apply only to `seedsIfSeasonEndedToday`.

## Follow-up tasks
- Orchestrator: add `require("./mcp.test.js");` as the last line of `test/run.js`.
- Optional: a read-only cache option in `lib/fabric/source.js` so the MCP server can reuse the web server's `.cache/fabric`.

## Self-check
Changed only the WS4 files listed above. Assumed the page's /25 point scale and that `D.built` dates the build. Tested as above. Could still be wrong: real-world shapes in live mode beyond the one run. Nothing duplicated except a short standings tally from `D.played` and a team slice built from the same payload instead of a second `fabric.team()` call. No future-data use: filters count back from the payload's time. External sources: none read; the one live run used the fabric's own adapters. Docs owned (`MCP_ARCHITECTURE.md`, this file) are current.

## Ready for review?
- Yes
