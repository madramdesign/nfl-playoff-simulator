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

3. **`D.eventArchive`** (time machine, stream S-C), built by `scripts/event-archive.js` and embedded by `scripts/build.py`: the last 7 days of `data/fabric/events/*.json`, public sources only, at most 200,000 bytes (the oldest first-seen day is dropped first when it does not fit). Shape: `{v: 1, days, maxBytes, files: [YYYY-MM-DD], from, to, events: [...]}`, events ordered by `seenAt`; `from` and `to` are the earliest and latest `seenAt`. An entry is either an event with empty fields left out, or `{id, seenAt}` alone when the event is identical to the one with that id in `D.fabric` (the page reads the body from there). `validateEventArchive` checks it at build; a failing archive is not embedded. It is not part of the `/api/universe` contract.

## Replay (`?asOf=`)

`asOf` is page state: a UTC minute such as `2026-11-22T18:00Z`, or absent for now. Anything malformed or in the future is dropped. Rules (`src/universe/18-history.js`, tested in `test/universe.test.js`):
- At `asOf = T` an item is shown only if `seenAt <= T`. Its `ts` is never enough. Time ranges count back from `T`.
- History is the archive, the embedded snapshot and the current payload merged by event id; the record with the earliest `seenAt` wins whole, so a headline or source count revised later does not leak back.
- Items with no first-seen time (the page's dated-only curated news) are left out and counted in the banner.
- Only the feed, the ticker and the map's news, transaction and breaking badges are replayed. Scores, lines, injuries, the simulation and everything else stay current, because no dated copies of them exist; the banner says so.

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
- `title` is a source headline or a sentence the fabric writes from structured fields. No article text is stored.
- `importance` and `confidence` are rules, not judgments. Planned formula (adapted from World Monitor's published weighting): importance = 0.55 headline severity + 0.20 source tier + 0.15 corroboration (distinct publishers, capped at 5) + 0.10 recency (linear decay over 24 hours); confidence = the best source's tier value plus 0.04 per further independent publisher. The final rules and their tests arrive with milestone M1.

**TeamInjuries**: `{burden, out, doubtful, questionable, ir, qbOut, players[{name, pos, status, type, returnDate, date, espnId}]}`. Each player also carries `source` (the report the listed status came from). When a second source lists the same player, `also` holds its report as `{source, status, practice, week}`, and `disagree: true` marks the two statuses differing (injured reserve against out does not count). An `injury` event repeats this as `data.disagree` and `data.other`. The second report has only a week number, no time or link, so the two cannot be dated against each other; the page shows both side by side and picks no winner. `burden` is a descriptive index (status weight times position weight, summed). It is not a model input: no injury factor has passed a backtest here yet.

**Media** (optional): `{channels, videos, podcasts}` from official channels and podcasts; field list and rules in [MEDIA_ARCHITECTURE.md](MEDIA_ARCHITECTURE.md).

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
