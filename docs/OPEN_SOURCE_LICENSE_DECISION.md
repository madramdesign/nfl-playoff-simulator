# Open-Source License and Reuse Decision

## Project reviewed
- Repository: https://github.com/koala73/worldmonitor
- License detected: GNU Affero General Public License v3.0 (`"license": "AGPL-3.0-only"` in `package.json`; full AGPL v3 text in `LICENSE`).
- Date verified: Nov. 21, 2026, at commit `38e97006`.
- License file/source: `LICENSE` and `package.json` in the repository root.

## Options
1. Compliant fork or derivative with all applicable obligations.
2. Reuse individual components only where license and notices permit.
3. Clean-room implementation inspired by high-level architecture and UX concepts.
4. Do not use the project.

## Decision
- Status: Accepted (engineering decision, not legal advice). The owner can revisit it.
- Selected option: 3, clean-room implementation.
- Rationale:
  - AGPL-3.0 is reciprocal: a derivative work must be offered under the AGPL, including source to anyone who uses it over a network. This repository has no license file and its owner has not chosen to open-source it, so copying AGPL code would force that choice.
  - The stacks do not match (D1 in `DECISIONS.md`): World Monitor's code assumes Vite, TypeScript, deck.gl, Redis and protobuf. Little of it would run here unchanged anyway.
  - The valuable parts are ideas (circuit breakers, freshness tracking, layer registries, importance scoring), and ideas are not covered by copyright.
- How the clean room was kept:
  - The research agent that read World Monitor's source returned descriptions of mechanisms and file locations, not code.
  - The implementing agents were told not to consult World Monitor's code.
  - Every NFL Universe file was written from scratch for this project. Where a formula's weights were adopted (news importance: 0.55, 0.20, 0.15, 0.10), the source of the idea is credited in a comment and in `WORLDMONITOR_ARCHITECTURE_ANALYSIS.md`.
- Required notices/attribution: none legally required for ideas. As a courtesy, the README and the analysis document credit World Monitor as the inspiration.
- Source files or assets proposed for reuse: none. No icons, styles, map tiles, catalog files (`news-catalog.json`, `source-tiers.json`) or test files.
- Distribution/network-use obligations: none, because no AGPL code is included. They would apply in full if any World Monitor code were ever added.
- Trademarks: "World Monitor" and its logo belong to that project. NFL Universe must not be presented as World Monitor, as an official fork, or as affiliated with it; World Monitor's README makes the same distinction for forks. NFL team names and marks belong to the league and the clubs. The page states it is an independent fan project.
- Open questions: if the owner later wants to publish NFL Universe as open source, AGPL or a permissive license are both possible; reusing World Monitor code would then also become possible under AGPL terms.

Do not treat this as legal advice. Do not copy World Monitor code or assets without changing this decision first.

## Other licenses in use
| Material | License | Obligation |
|---|---|---|
| nflverse-data releases | CC-BY-4.0 (`LICENSE.md`, checked Nov. 21; this corrects the Nov. 20 note that no licence was stated). The NFL data itself still belongs to its owners. FTN charting is CC-BY-SA 4.0 | Credit nflverse; "FTN Data via nflverse" and share-alike for anything derived from FTN |
| nflverse `nfldata` games file | No license file | Facts with credit |
| nfelo quarterback values | Published by nfeloapp.com | Credit nfeloapp.com (already on the page) |
| Natural Earth map outlines | Public domain | None; credited anyway |
| Open-Meteo forecasts | Free for non-commercial use, CC-BY 4.0 data | Credit Open-Meteo |
| ESPN JSON endpoints | Disney Terms of Use bar automated access and building datasets | Not licensed; use is an open owner decision (DEC-006) |
| ESPN and Yahoo RSS | Provider RSS terms | Unmodified headlines with credit and link, no ads, non-commercial (DEC-012) |
| Other news and sportsbook content | Proprietary | Not used without permission |
| GPL or AGPL projects found in research | GPL-3.0 / AGPL-3.0 | Reference only; no code copied (`GITHUB_RESEARCH.md`) |
