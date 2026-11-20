# Models

All ratings are in points per game against an average team (stored as points times 25).

| Model | Built from | Role | Backtest log loss |
|---|---|---|---|
| Sportsbook line | Posted moneyline, bookmaker margin removed | Used as it stands whenever a game has a line | 0.597 on next-week games |
| Sportsbook-spread rating | Ridge fit to this season's point spreads, recent weeks weighted 0.75 per week | Half of the blend for games without a line | 0.645 |
| Scoring margin | Ridge fit (strength 4) to final margins, with points from fumble bounces removed | 80% of the results rating | 0.643 |
| EPA margin | Same fit on passing plus rushing EPA per game, scaled 1.2 | 20% of the results rating | 0.655 |
| Results rating | 0.8 margin + 0.2 EPA | Half of the blend | 0.643 |
| Blend | 0.5 spread rating + 0.5 results rating, gap multiplied by 0.8, plus home field | What the page shows for games without a line | 0.639 |
| Elo | K 20, home 48, one-third reversion each season, margin multiplier | Displayed second opinion only | 0.649 |

Log loss is for games two or more weeks ahead, 2021-2025, 5,922 forecasts. A coin flip scores 0.693.

## Quarterback adjustment

Each team's results rating is moved by (current starter's pre-game adjustment in nfelo's quarterback file) minus (the average adjustment across the team's games so far). The current starter is the last game's starter unless `data/news.json` names a new one. A new starter with no value this season gets no adjustment and a caution in the reasoning panel, because a value from an earlier season is stale. Credit: nfeloapp.com.

## Decisions and the evidence

- **Use the line when it exists.** On next-week games the closing moneyline (0.597) beat the blend (0.618) and every rating.
- **Blend for later games.** The blend beat both of its halves. An outside analysis (nfelo) found about 65% market weight optimal on its own model; ours came out near 50%.
- **Shrink rating gaps by 20%.** Best scale in the backtest. Unshrunk ratings were overconfident.
- **Elo not in the blend.** 10% Elo: 0.6393. 20%: 0.6396. No gain over 0.6391.
- **Fumble luck in.** 0.6391 with, 0.6396 without. A small gain; the regression of fumble recovery is well documented elsewhere.
- **Left out after testing:** quarterback-change discount, return-touchdown discount, recency weighting, rest days.

## Simulation

Each run draws a strength wobble for every team (standard deviation 1.4 points) so a team that is better than rated is better all season, then plays every unpicked game, breaks ties with the NFL procedure, plays the bracket and orders the draft. 8,000 seasons per interactive run; sampling error on a 50% figure is about 0.6 points.

## Not modelled

Injuries and quarterback changes beyond what the lines reflect, weather, coaching, matchups, travel. See the audit for why.
