# Data and Provenance Rules

- Preserve source, retrieval timestamp, event/effective timestamp, and confidence.
- Validate external payloads at boundaries.
- Track stale, missing, conflicting, and unresolved data explicitly.
- Never silently merge uncertain player/team identities.
- Use UTC internally; prevent future-data leakage in historical analysis.
- Maintain `docs/NFL_DATA_SOURCE_REGISTRY.md`.
