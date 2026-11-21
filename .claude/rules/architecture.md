# Architecture Rules

- Extend the existing architecture; do not replace it without an evidence-based decision.
- Keep ingestion, normalization, persistence, analytics, AI, and UI responsibilities separated.
- Define typed contracts before parallel work crosses subsystem boundaries.
- Prefer small modules, explicit dependencies, and reversible migrations.
- Record significant decisions in `docs/DECISIONS.md`.
