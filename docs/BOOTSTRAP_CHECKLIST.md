# Bootstrap Checklist

Status as of Nov. 21, 2026.

## Project operating system
- [x] Root `CLAUDE.md` reviewed and adapted to actual repository (constitution merged above the existing repository notes; Sleeper assumption corrected)
- [x] `.claude/agents/` definitions reviewed against installed Claude Code capabilities (`isolation: worktree` and the other fields used are documented; worktrees start from `main`, see DEC-011)
- [x] `.claude/rules/` rules reviewed and scoped correctly (all six apply project-wide, so no `paths` scoping; they load every session)
- [x] Required docs created and committed (on the integration branch)
- [ ] Claude Code recognizes project instructions (verify with `/context` in a new session opened in this worktree)

## Project audit and research
- [x] Git status and current branch recorded
- [x] Existing architecture and commands documented
- [x] Existing features and critical paths documented
- [x] Tests/build/typecheck/lint baseline run (`npm test` and `build.py --reuse` pass; the project has no type checker or linter)
- [x] World Monitor architecture analysis completed
- [x] World Monitor license and reuse decision completed
- [x] NFL data-source registry researched and populated (endpoints verified and terms read; ESPN JSON use is an open owner decision, DEC-006)
- [x] Data/legal/technical risks documented

## Execution readiness
- [x] Canonical entities/contracts agreed (`shared/teams.json`, `lib/contract.js`)
- [x] Workstream ownership and dependency graph agreed (`WORKSTREAMS.md`)
- [x] Worktree strategy tested (integration worktree created; frontend agent running in its own)
- [x] Integration/review queue initialized
- [x] First bounded implementation tasks approved (by the owner's brief: fabric, command center, MCP)
