# Playoff simulation

1. **Regular season.** Each unpicked game is a weighted coin flip from the current mode's probability, shifted by that season's strength wobble for both teams.
2. **Standings.** Division winners, then seeds 1-4 among them and three wild cards, using the NFL procedure: head-to-head, division record, common games, conference record, strength of victory, strength of schedule, then simulated scores for combined points rankings and net points, then a coin flip. Skipped: net points in common or conference games, net touchdowns.
3. **Bracket.** 2 hosts 7, 3 hosts 6, 4 hosts 5; the top seed then hosts the lowest seed left; the better seed hosts the conference final; the Super Bowl is neutral. Game odds come from the mode's team ratings with the 0.8 shrink, home field and the same wobble.
4. **Draft.** Non-playoff teams by record, then playoff teams by round of exit; weaker schedule first among equals. Traded first-round picks from `data/pick_owners.json`.

Because seeds and bracket come from the same simulated season, path dependency is built in: a team's Super Bowl chance already reflects whom it is likely to face and where.

Known limits: no reseeding subtleties beyond the above, playoff games are not weighted differently from regular-season ones, and clinch flags are conservative.
