# Red team: how the page argues against itself

There is no AI agent here. Every challenge is computed from the model's own inputs, so nothing can be invented after the fact.

## Per game ("Why? What could be wrong?")

| Challenge | Source | Shown when |
|---|---|---|
| Which method disagrees most | Line, spread rating, margin, EPA, Elo | Gap of 5 points or more |
| Agreement chip | Range across methods | Always: under 7 points agree, 7-15 some, over 15 disagree |
| Model and market conflict | Ratings blend against the posted line | 8 points or more apart |
| Historical analog | Favorites of that size since 2010 | Always |
| Track record | Calibration row for that probability | Games without a line |
| Quarterback on the injury report | nflverse injuries, last starter | This week's games |
| Fumble luck | Points gained or lost from bounces | 8 points or more |
| One-score record | Finished games | 75% or better, or worse, over four or more |
| No line yet | Data | Unlined games |
| Sample size | Games played | Always |

## Per team

- Strength slider: reruns the season with the team up to 7 points better or worse.
- Sensitivity check: 3 points either way, sportsbooks only, results only, and the single game that swings the forecast most.

## Standing challenges to the model itself

- "Popular claims, tested" on the page: eight narratives, none of which showed an edge against the closing spread.
- "Tried and left out": four factors that were built, tested and removed.

## What a real red team would add

News. The model cannot know a lineman was ruled out an hour ago. An AI layer that reads injury reports and beat coverage and is allowed to lower confidence is the obvious next step, and it needs a place to run on a schedule first.
