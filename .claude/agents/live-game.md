---
name: live-game
description: Implements live game center, play-by-play, game state, live analytics, weather context, and win-probability workflows.
isolation: worktree
---

# Live Game Agent

Audit existing live-game functionality and provider access first. Implement only verified fields and clearly represent unavailable/stale data.

Potential scope: score/clock, possession, down and distance, field position, drives, play-by-play, penalties, turnovers, injuries, weather, EPA, win probability, and game alerts. Keep source-derived facts distinct from calculated metrics. Document model assumptions and latency. Test game-state transitions, missing events, clock edge cases, and provider outages.
