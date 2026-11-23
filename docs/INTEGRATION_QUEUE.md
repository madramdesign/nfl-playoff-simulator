# Integration Queue

| Item | Branch/worktree | Authoring agent | Review status | Checks | Merge status | Notes |
|---|---|---|---|---|---|---|
| Contracts, entities, build assembly (WS0) | `worktree-nfl-universe` | Orchestrator | Self-reviewed | `npm test` pass; fixture validates; `build.py --reuse` pass | Committed on integration branch (`8363f78`) | |
| Owner's bootstrap files (NU-005) | `worktree-nfl-universe` | Orchestrator | Self-reviewed | Claude Code support for `isolation` and `.claude/rules/` confirmed from docs | Committed on integration branch | Templates filled with real content |
| Data fabric (WS1) | `worktree-nfl-universe` | Orchestrator | Independent review: 3 blocking, 9 non-blocking findings, all fixed in `cef8e79` | `npm test` (engine + 25 fabric tests, negative cases verified against deliberately broken code); live run of both scopes passes the contract | Committed | |
| Command-center interface (WS2) | `worktree-agent-adaeb813e8038ab4d` at `c5e93fd` | Frontend | Diff read; independent review: 3 blocking, 8 non-blocking findings, all fixed | `npm test` with 104 interface checks (checked against 16 deliberate breaks); browser on real data at 1440 px and 375 px, before and after the fixes | Merged (`315c558`, `64525d6`) | |
| Project instructions and docs to `main` | `main` | Orchestrator | Self-reviewed | Docs and config only; no application code | See `CURRENT_STATE.md` | Owner asked for `CLAUDE.md` to be committed in the project root |
| MCP server (WS4) | `worktree-agent-ad1ce008d0e55eb4f` at `f1962b5` | MCP | Diff read: only owned files; no writes, fetches or code execution beyond loading the page's engine | `npm test` with 4 MCP tests; one live stdio session | Merged `ef668bc`; quarterback rule aligned in `aaef0b3` | |
| M8 media center | `worktree-nfl-universe` (agent branch `worktree-agent-adaeb813e8038ab4d` at `d0ee0fe` merged) | Orchestrator, frontend, researcher | Diff read; browser check of real playback; independent review: 3 blocking and 11 non-blocking findings, all fixed (`e2e607e`) | `npm test`: engine, 37 fabric, 4 MCP, 174 interface checks; podcast-survives-refresh and live links checked in the browser | Squash-merged into `main` as `0523d28` (owner approved, Nov. 21) | Staged tree identical to the tested branch; `npm test` passed in the main checkout |
| Integration branch into `main` | `worktree-nfl-universe` at `d72f306` | Owner approved (Nov. 21) | Staged tree identical to the tested branch | `npm test` (4 suites) passed in the main checkout before committing | Squash-merged as `8bd0cff` | Squashed so the ESPN-derived fixture from early in the session is not in `main`'s history (DEC-006) |

## Review checklist
- [ ] Scope and acceptance criteria satisfied
- [ ] Diff reviewed; no unrelated changes
- [ ] No user changes overwritten
- [ ] Types/schema/contracts remain compatible (`lib/contract.js`)
- [ ] Tests run and results recorded
- [ ] Lint/typecheck/build run where relevant (`python3 scripts/build.py --reuse`; there is no linter or type checker in this project)
- [ ] Security, licensing, and data provenance reviewed
- [ ] Docs and current state updated
- [ ] Merge performed in dependency order
- [ ] Post-merge regression checks completed

## Queue, Nov. 23, 2026
| Order | Stream | Branch | Review | Merged |
|---|---|---|---|---|
| 1 | S-A tiebreakers | `worktree-agent-a46ce6d7bb3789620` (`9d22ae8`) | diff read by the orchestrator; `npm test` after merge | yes, Nov. 23 |
| 2 | S-B calibration | `worktree-agent-a71a23f748c18a6f0` (`8e8fe41`) | diff read by the orchestrator; `npm test` after merge | yes, Nov. 23 |
| 3 | S-D intelligence depth | agent worktree | pending | no |
| 4 | S-C time machine | `worktree-agent-aad54c9f774786bcb` (`552d48f`) | shared-file diffs read by the orchestrator; `npm test` and a browser check after merge | yes, Nov. 23 (before S-D, which was still running) |

