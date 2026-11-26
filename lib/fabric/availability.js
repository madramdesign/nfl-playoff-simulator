// Player availability history from official designations only (backlog F56, DEC-026): the weekly injury report's
// game status and practice listing (nflverse injuries) and the roster's reserve lists (nflverse weekly rosters).
// No diagnoses, no inference, no person-level labels: one letter per week and a count of games, each traceable to a
// row in a public file. Pure: no files, no clock.
"use strict";

// One letter per week, week 1 first.
//   O out · D doubtful · Q questionable          game status on that week's official report
//   L on the report for practice only (no game status)
//   R reserve list · U PUP list · N non-football injury list   nflverse roster status RES / PUP / RSN
//   . on the roster, not listed · - the team did not play that week · ? not on a roster we have that week
const LETTERS = "ODQLRUN.-?";
const GAME = { Out: "O", Doubtful: "D", Questionable: "Q" };
const RESERVE = { RES: "R", PUP: "U", RSN: "N" };
const MISSED = new Set(["O", "R", "U", "N"]);   // counted as missed only in weeks the team played
const PRACTICE = (s) => (/did not/i.test(s || "") ? "DNP" : /limited/i.test(s || "") ? "Limited" : /full/i.test(s || "") ? "Full" : null);

const has = (mask, w) => mask != null && Math.floor(mask / 2 ** (w - 1)) % 2 === 1;   // bitmask, week 1 = lowest bit
const bit = (w) => 2 ** (w - 1);

// gsis: the player's nflverse id; team: his team now (byes and the game count are this team's); upTo: last week shown.
// hist[gsis][week] = [gameLetter|"", practice|null, bodyPart|null]; reserve[gsis][week] = roster status;
// onRoster[gsis] and played[team] are week bitmasks. Returns null without an id (never guessed from a name).
function history({ gsis, team, upTo, hist, reserve, onRoster, played }) {
  if (!gsis || !(upTo >= 1)) return null;
  const h = (hist && hist[gsis]) || {}, r = (reserve && reserve[gsis]) || {}, games = played && played[team];
  let lastPlayed = 0; for (const m of Object.values(played || {})) for (let w = 1; w <= 22; w++) if (has(m, w)) lastPlayed = Math.max(lastPlayed, w);
  let weeks = "", missed = 0, teamGames = 0;
  for (let w = 1; w <= upTo; w++) {
    const g = h[w], res = RESERVE[r[w]];
    const c = res || (g && g[0]) || (g ? "L" : null) || (w <= lastPlayed && games != null && !has(games, w) ? "-" : has(onRoster && onRoster[gsis], w) || g ? "." : "?");
    weeks += c;
    if (has(games, w)) { teamGames++; if (MISSED.has(c)) missed++; }
  }
  const latest = Object.keys(h).map(Number).filter((w) => w <= upTo).sort((a, b) => b - a)[0];
  const last = latest ? h[latest] : null;
  return { weeks, missed, teamGames, throughWeek: lastPlayed || null, lastReport: last ? { week: latest, practice: last[1], bodyPart: last[2] } : null };
}

// Current reserve-list stint: the first week of the run of reserve weeks that ends at `week`. A week with no roster
// row for the player (often a bye) does not break the run; a week on the roster with any other status does.
function since(reserveWeeks, onRosterMask, week) {
  if (!reserveWeeks || !reserveWeeks[week]) return null;
  let first = week;
  for (let w = week - 1; w >= 1; w--) {
    if (reserveWeeks[w]) first = w;
    else if (has(onRosterMask, w)) break;
  }
  return first;
}

module.exports = { LETTERS, GAME, RESERVE, PRACTICE, history, since, has, bit };
