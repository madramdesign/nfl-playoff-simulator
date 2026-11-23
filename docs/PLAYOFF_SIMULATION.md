# Playoff simulation

1. **Regular season.** Each unpicked game is a weighted coin flip from the current mode's probability, shifted by that season's strength wobble for both teams.
2. **Standings.** Division winners, then seeds 1-4 among them and three wild cards, using the NFL procedure: head-to-head, division record, common games, conference record, strength of victory, strength of schedule, then the points steps, then a coin flip. The points steps are, in order: combined ranking in points scored and allowed within the conference, the same ranking league-wide, net points in common games (division ties) or in conference games (wild-card ties), and net points in all games. They use real scores for games already played and, for the rest, the scores the engine draws for that simulated season (margin from the game's rating gap, total from the posted over/under or the teams' averages). These scores are drawn only when a tie gets that far, and they never change who won a game. Skipped: net touchdowns, the last step before the coin flip, because the data holds no touchdown counts and the engine has no touchdown model for games not yet played.

   How often it matters (data built Nov. 23, 2026, 110 games open, 600,000 simulated seasons over three seeds): a tie reached the points steps in about 1 season in 8,500, and reached the net-points steps once. The rate depends on the standings and on how many games are still open, so it will differ on other dates.
3. **Bracket.** 2 hosts 7, 3 hosts 6, 4 hosts 5; the top seed then hosts the lowest seed left; the better seed hosts the conference final; the Super Bowl is neutral. Game odds come from the mode's team ratings with the 0.8 shrink, home field and the same wobble.
4. **Draft.** Non-playoff teams by record, then playoff teams by round of exit; weaker schedule first among equals. Traded first-round picks from `data/pick_owners.json`.

Because seeds and bracket come from the same simulated season, path dependency is built in: a team's Super Bowl chance already reflects whom it is likely to face and where.

Known limits: no reseeding subtleties beyond the above, playoff games are not weighted differently from regular-season ones, and clinch flags are conservative.
