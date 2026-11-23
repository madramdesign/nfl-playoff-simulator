# Test fixtures

- `universe.sample.json`, `universe.public.json`, `game.sample.json`: synthetic feed payloads written by
  `make-fixtures.js`. Matchups are real schedule facts; everything else is invented and labelled as a fixture.
- `engine-data.js`: the engine's season data (the single `var D=...` line of `public/index.html`) from the
  Nov. 22, 2026 build, the one the payload fixtures were written against. `test/universe.test.js` and
  `test/mcp.test.js` (through `NFLU_ENGINE_DATA`) swap it in for the current build's data, so the fixtures'
  matchups stay among the engine's remaining games after the daily refresh counts them as played. The engine
  and command-center code under test is still the current build's; `test/run.js` runs on the current data.

If the shape of `D` changes, or the fixtures are rewritten for a later week, regenerate it:

    grep '^var D=' public/index.html > test/fixtures/engine-data.js
