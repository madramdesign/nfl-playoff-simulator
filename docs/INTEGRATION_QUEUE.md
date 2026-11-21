# Integration Queue

| Item | Branch/worktree | Authoring agent | Review status | Checks | Merge status | Notes |
|---|---|---|---|---|---|---|
| Contracts, entities, build assembly (WS0) | `worktree-nfl-universe` | Orchestrator | Self-reviewed | `npm test` pass; fixture validates; `build.py --reuse` pass | Committed on integration branch (`8363f78`) | |
| Owner's bootstrap files (NU-005) | `worktree-nfl-universe` | Orchestrator | Self-reviewed | Claude Code support for `isolation` and `.claude/rules/` confirmed from docs | Committed on integration branch | Templates filled with real content |
| Data fabric (WS1) | `worktree-nfl-universe` | Orchestrator | Not submitted | | Paused before commit | Waiting for plan approval |
| Command-center interface (WS2) | `worktree-agent-adaeb813e8038ab4d` at `cf03470` | Frontend | Not reviewed | Agent reports `npm test` and `build.py --reuse` pass | Parked, not merged | Holds only the map-outline generator and its output |
| Project instructions and docs to `main` | `main` | Orchestrator | Self-reviewed | Docs and config only; no application code | See `CURRENT_STATE.md` | Owner asked for `CLAUDE.md` to be committed in the project root |
| MCP server (WS4) | to be created | | | | Not started | |
| Integration branch into `main` | | Owner | Needs owner approval | | Not merged | The daily refresh commits to `main` |

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
