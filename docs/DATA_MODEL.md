# Data model and contracts

The machine check for everything below is `lib/contract.js` (`validateUniverse`). If this page and that file disagree, the file wins and this page is the bug.

## Entities

| Entity | Canonical key | Where it lives | Provider ids mapped |
|---|---|---|---|
| Team | `a`, the page abbreviation (`LAR`, `WAS`, `JAX`) | `shared/teams.json` | nflverse `nv` (`LA`), ESPN `espnId` and `espnAbbr` (`WSH`), FantasyPros `fp` (`JAC`), Sleeper `sleeper` |
| Stadium | team's `stadium` block; neutral sites in `neutralSites` | `shared/teams.json` | ESPN venue name |
| Game | ESPN event id (`id`); nflverse `game_id` (`gid`, e.g. `2026_12_NYG_IND`) when matched | `/api/universe` `games[]`, `D.games` | matched on week, away and home |
| Player | ESPN athlete id plus display name | inside events and injuries | Sleeper and nflverse ids: not mapped yet |
| Event | `id`, a stable hash of type and identifying fields | `/api/universe` `events[]`, `data/fabric/events/` | |

Team index `i` in `shared/teams.json` equals the team's index in `D.teams`, so the engine's arrays and the entity file line up. `scripts/build.py` is the source of that order; the generator for the entity file checks it.

## The page's two data inputs

1. **`D`**, built by `scripts/build.py`: schedule, results, lines, ratings, history, news, report (see `DATA_SOURCES.md`). Since this pass it also carries `D.fabric`, the last fabric snapshot (`data/fabric/latest.json`), so the static page has injuries, transactions and headlines as of the build.
2. **`GET /api/universe`**, served by `server.js` when it runs: the same shape as `D.fabric`, live. The page polls it and falls back to `D.fabric` when it is missing. A static copy of the page has no server, so it shows the snapshot with its age.

## `/api/universe` (version 1)

```
{
  v: 1,
  generatedAt: ISO,                 when this payload was assembled
  season, week, seasonType,
  sources: { <sourceId>: Source },  every adapter, healthy or not
  games:   [Game],                  this week's games from the scoreboard
  events:  [Event],                 the unified intelligence feed, newest first
  injuries: { <team>: TeamInjuries },
  transactions: [ {date, team, text, kind} ]
}
```

**Source**: `{id, label, tier 1-4, scope public|local, status ok|stale|down|disabled|pending, breaker closed|open|half-open, lastOk ISO|null, lastError, ageSec, latencyMs, fails, records, maxStaleSec}`. Status is `stale` when the last good answer is older than the source's `maxStaleSec`, `down` when it has never answered or the breaker is open with no usable cache. `scope` follows DEC-006: `local` sources (ESPN's JSON) are served only by the local server and never committed or published.

**Game**: `{id, gid, week, kickoff, away, home, state pre|in|post, period, clock, awayScore, homeScore, situation, venue {name, city, indoor, neutral}, broadcast, odds, weather, winProb, source}`. `source` is the id of the source the game's state came from (nflverse schedule publicly; ESPN scoreboard locally, which overrides it).
- `odds`: `{source, provider, spread {open, current}, total {open, current}, homeML {open, current}, awayML {open, current}, homeProb {open, current}}`. `spread` is from the home team's side (negative: home favored). `homeProb` is the moneyline with the bookmaker margin removed. Any value may be null; nflverse gives one current line and no open.
- `weather`: `{source, tempF, windMph, gustMph, precipProb, precipIn, snowIn, summary, flags[]}` at the kickoff hour; `source` is a source id. Flags: `wind` (sustained 15 mph or more, or gusts 25 or more), `rain` (precipitation chance 60% or more), `snow`, `cold` (25°F or below). Indoor games get `null`. The flags are descriptions, not model inputs.
- `situation` (live only): `{possession, down, distance, yardLine, text, redZone, awayTimeouts, homeTimeouts}`.
- `winProb` (live only): `{home, source}`.

**Event**: `{id, type, subtype, ts, seenAt, teams[], players[], title, url, source, publisher, importance 0-100, confidence 0-1, sourceCount, sources[{publisher,url}], gameId, data}`.
- Types: `news`, `injury`, `transaction`, `odds_move`, `weather`, `game`, `qb_change`, `model`, `playoff_move`.
- `ts` is when it happened (publication, report or line time); `seenAt` is when the fabric first saw it. Time-range filters use `ts`; point-in-time replay must use `seenAt`.
- `data.tsEstimated` (true, optional) and `data.between` ([ISO, ISO], optional): `ts` is an estimate. For kickoff and score events, `between` is the gap the change fell in: not in the data fetched at the first time, in the data fetched at the second. Kickoffs take the scheduled kickoff when it falls in the gap; gaps of two minutes or less are not marked. Final events are always estimates (kickoff plus a typical game length) and carry no gap.
- `data.beforeWatch` (ISO time, optional): the item has no time of its own and was already in its source when this cache folder started watching that source, so its `ts` is only the start of watching and its real time is unknown and earlier. The fabric and the page list such items after every item with a real time, and the ticker and the brief leave them out. Game events (kickoffs, scores) are never marked.
- `title` is a source headline or a sentence the fabric writes from structured fields. No article text is stored.
- `importance` and `confidence` are rules, not judgments. Planned formula (adapted from World Monitor's published weighting): importance = 0.55 headline severity + 0.20 source tier + 0.15 corroboration (distinct publishers, capped at 5) + 0.10 recency (linear decay over 24 hours); confidence = the best source's tier value plus 0.04 per further independent publisher. The final rules and their tests arrive with milestone M1.

**TeamInjuries**: `{burden, out, doubtful, questionable, ir, qbOut, reportWeek, depthAsOf, players[{name, pos, status, type, returnDate, date, espnId, gsisId, starter, starterSource, depthRank}]}`. `burden` is a descriptive index (status weight times position weight times a starter factor, summed). It is not a model input: no injury factor has passed a backtest here yet.
- `starter`: true, false or null (unknown). Decided first by the team's current depth chart (`starterSource: "depth chart"`, `depthRank` the player's best rank at an offensive or defensive slot, or kicker, punter or long snapper; matched by nflverse or ESPN player id, else full name on the same team); otherwise by who started the last game (quarterbacks, `"last start"`) or ESPN's own flag (`"ESPN"`). `depthAsOf` is the depth chart snapshot's time (nflverse `dt`), null without one.

**Lines** (optional): `{<gameId>: [{at, open, source, provider, spread, total, homeProb}]}`, each game's line history (backlog F23) for this payload's games. A new entry is added only when a source's line changes; `at` is when that source's data was fetched; an opening line whose time the source does not give has `at: null` and `open: true`. Kept up to 60 entries per game, dropped 10 days after kickoff; the local server keeps it in its state file, and the daily snapshot merges yesterday's published history with today's. Public snapshots carry lines from public sources only.

**Recent finals** (optional): `[{id, gid, week, kickoff, away, home, awayScore, homeScore, source}]`, the last week's final scores, kept after the payload moves on to the next week: the week just rolled past (the local server rolls as soon as the live feed shows every game final, or ESPN's scoreboard is on the next week), else the schedule's previous week. The page counts one only when the simulation's data still lists that game as unplayed (matched by `gid`) and this week's games do not already have it. Public snapshots carry finals from public sources only.

**Games** (additions): `market` (optional) `{source, provider, books, spread, total, homeProb, at, lastUpdate}`, the median line across sportsbooks (The Odds API, DEC-019); `books` (optional, local server only; refused in public snapshots), each sportsbook's `{key, title, spread, total, homePrice, awayPrice, homeProb, lastUpdate}`; `alerts` (optional), National Weather Service alerts in force around kickoff.

**Fantasy** (optional): `{source, lookbackHours, week, adds[], drops[], unmatched {adds, drops}, crosswalk}`, each entry `{name, team, pos, count, sleeperId, gsisId}`. Sleeper's most added and dropped players across its fantasy leagues over `lookbackHours`, in Sleeper's order, named and placed on a team through nflverse's weekly-roster crosswalk (`sleeper_id`); a team defence's id is its abbreviation. A player the crosswalk lacks is counted in `unmatched`, never guessed at. Fan activity, not news or a forecast; credit "Trending data: Sleeper" wherever shown.

**Media** (optional): `{channels, videos, podcasts, reel}` from official channels and podcasts; `reel` (NFL TV, DEC-022) lists at most 12 video ids, each once and each among `videos`, in playing order; a video may carry `upcoming: true` when YouTube's feed shows it with no views (a live stream scheduled for later); field list and rules in [MEDIA_ARCHITECTURE.md](MEDIA_ARCHITECTURE.md).

**Public snapshot**: the same shape with only `public` sources, no `situation` or `winProb`, and odds and weather only from public sources. `validatePublicSnapshot` enforces it; the snapshot script refuses to write a file that fails.

## `/api/game/<espnId>` (version 1, local scope)

```
{ v: 1, id, generatedAt, source, scope,
  header:   {away, home, state, period, clock, awayScore, homeScore},
  winProb:  [{play, home}],                      home win chance after each play, in order
  scoring:  [{period, clock, team, text, awayScore, homeScore}],
  plays:    [{period, clock, team, text, type}], the most recent 40 plays
  injuries: [{team, name, pos, status}] }
```
Checked by `validateGameDetail`. Play and scoring text are factual descriptions from the local source and are never committed.

Fixtures: `node test/fixtures/make-fixtures.js` writes `universe.sample.json` (all sources), `universe.public.json` (public only) and `game.sample.json`. Matchups are real; every other value is invented.

## Other endpoints

| Path | Returns |
|---|---|
| `/api/universe` | The payload above. `?since=ISO` trims events to those seen after that time |
| `/api/health` | `{generatedAt, sources}` only |
| `/api/game/<espnId>` | The game detail above |
| `/api/team/<abbr>` | Team slice: events, injuries, transactions and the current depth chart |
| `/api/live` | The original trimmed scoreboard, kept for the simulator view |

## Files written

| File | Writer | Committed |
|---|---|---|
| `data/fabric/latest.json` | `scripts/fabric-snapshot.js` | yes (daily), permitted sources only (DEC-006) |
| `data/fabric/events/YYYY-MM-DD.json` | `scripts/fabric-snapshot.js`, events first seen that day | yes: the point-in-time record, permitted sources only |
| `.cache/fabric/*.json` | the server's last good answer per source | no |
