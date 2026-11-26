# NFL data and API universe research (NU-018)

Nov. 25, 2026. Docs only; no code changed. **Start at [NFL_API_UNIVERSE.md](NFL_API_UNIVERSE.md).**

| File | Contents |
|---|---|
| [NFL_API_UNIVERSE.md](NFL_API_UNIVERSE.md) | Blueprint, headline findings, corrections to the project's docs, self-critique, answers to the final questions |
| [NFL_API_CATALOG.md](NFL_API_CATALOG.md) | 369 source records with verified corrections first (assembled from the tracks) |
| [NFL_DATA_SOURCE_MATRIX.md](NFL_DATA_SOURCE_MATRIX.md) | 334-row comparison matrix |
| [NFL_DATA_ARCHITECTURE.md](NFL_DATA_ARCHITECTURE.md) | Pipeline, dependency graph, canonical database, refresh intervals, security |
| [NFL_API_RECOMMENDATIONS.md](NFL_API_RECOMMENDATIONS.md) | Stacks, cost model, implementation tasks |
| [NFL_DATA_BACKUP_STRATEGY.md](NFL_DATA_BACKUP_STRATEGY.md) | Primary, secondary, fallback for 45 categories |
| [NFL_DERIVED_METRICS.md](NFL_DERIVED_METRICS.md) | Recipes to compute ourselves |
| [NFL_DATA_GAPS.md](NFL_DATA_GAPS.md) | What is locked, unlicensed, expensive, thin or to avoid |
| [NFL_API_RESEARCH_LOG.md](NFL_API_RESEARCH_LOG.md) | Method and every search and page read |
| [tracks/](tracks/) | Evidence: R1–R10 track reports, V1 (nflverse provenance) and V2 (terms and prices) verification reports |

## How it was made
Ten read-only research agents worked one domain each (R1 official NFL and league, R2 commercial providers, R3 play-by-play and analytics, R4 tracking and computer vision, R5 weather, stadiums and geography, R6 injuries, rosters and transactions, R7 odds and prediction markets, R8 fantasy, R9 news, social and media, R10 history, open source, college and draft). Two verification agents then re-checked the claims most likely to be wrong against the providers' own pages and code. The orchestrator merged the results; the catalog, matrix, derived-metric, backup and log files are assembled from the track reports by script, with hand-written introductions and summary tables, so the track files remain the evidence.

## Limits
- One shared web-search allowance ran out partway through the tracks; later checks read pages directly.
- No accounts, trials, keys, cookies or accepted terms; prices behind sales calls are recorded as "quote".
- A usage limit interrupted the first session; R5 had finished its file, and V1 and V2 were run again from the start in a second session the same evening.
- Remaining unverified items are listed in [NFL_API_UNIVERSE.md](NFL_API_UNIVERSE.md) ("Self-critique") and marked UNVERIFIED in the records.

## Regenerating the assembled files
The assembly scripts were scratch tools, not part of the project. If the track files change, re-assemble by hand or ask for the scripts again; do not edit the assembled files and the tracks separately.
