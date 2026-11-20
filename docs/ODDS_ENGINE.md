# Odds engine

What exists:

- **Implied probability** from an American moneyline: `-m/(-m+100)` for favorites, `100/(m+100)` for underdogs.
- **Vig removal:** the two implied probabilities are divided by their sum.
- **Market-implied team ratings:** a ridge fit of every posted spread this season, recent weeks weighted more, with a fitted home edge.
- **Model against market:** per game, each method's probability beside the line, the largest disagreement, and a conflict chip at 8 points or more.

What it deliberately does not do: label anything a bet. A gap between model and line is shown as disagreement, and the backtest says the line usually wins that argument.

Not built: multiple sportsbooks and consensus, futures, totals and props analysis, opening lines and line movement. All need a timestamped multi-book odds source; see the research notes for candidates and costs.
