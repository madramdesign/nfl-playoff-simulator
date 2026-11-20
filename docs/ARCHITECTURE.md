# Architecture

```
nflverse files ──► scripts/build.py ──► D (one JSON blob) ──► public/index.html
                        │  ▲                                     ├─ engine (pure functions)
 data/*.json ───────────┘  └── scripts/history.js (Node)         └─ interface
 scripts/evaluate.py ──► data/model_report.json                 server.js ──► /api/live (optional)
```

- **One contract:** the build produces `D`; the page reads only `D`. Field list in `DATA_SOURCES.md`.
- **Engine rules:** no DOM, deterministic for a given seed, callable from Node. `simulate(picks, focus, n, liveProbs, now)` returns counts for every team.
- **Interface rules:** every number on screen comes from a `simulate` result or from `D`. The page must work as a static file with no server.
- **Evaluation is offline.** It needs numpy and several seasons of files, so it is run by hand and its output is committed.

See the audit for recommended next steps.
