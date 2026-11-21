# Git Worktree Rules

- One concurrent implementation agent per worktree/branch.
- Never edit another agent's worktree.
- Record branch, worktree path, task, owned paths, dependencies, and status in `docs/AGENT_COORDINATION.md`.
- Check `git status` before editing and before committing.
- Do not discard, reset, or overwrite user changes.
- Integrate through `docs/INTEGRATION_QUEUE.md`; review diffs before merge.
- If isolation cannot be established, serialize conflicting tasks.
