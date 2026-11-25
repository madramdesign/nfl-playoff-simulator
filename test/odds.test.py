#!/usr/bin/env python3
"""Checks scripts/fetch_odds.py on a hand-made response (test/fixtures/odds/events.json). Standard library, no network."""
import importlib.util, json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("fetch_odds", os.path.join(HERE, "..", "scripts", "fetch_odds.py")); fo = importlib.util.module_from_spec(spec); spec.loader.exec_module(fo)
checks = 0
def ok(cond, msg):
    global checks; checks += 1
    if not cond: sys.exit("FAILED: " + msg)
def near(a, b, msg): ok(a is not None and abs(a - b) < 1e-4, f"{msg}: got {a}, expected {b}")

names = fo.team_names()
ok(len(names) == 32 and names["los angeles rams"] == "LAR" and names["new york giants"] == "NYG", "32 team names map to this repository's abbreviations")
games, skipped = fo.consensus(json.load(open(os.path.join(HERE, "fixtures", "odds", "events.json"))), names)
ok(sorted(games) == ["GB@LAR", "NYG@IND"], "two usable games, keyed away@home")
ok(skipped == 3, "an unknown team, a game with no books and a malformed entry are skipped and counted")
g = games["NYG@IND"]
# Book A: 0.6 and 0.43478 -> 0.57983; book B: 0.61538 and 0.41667 -> 0.59627; book C has a moneyline of 0 and is left out.
near(g["homeProb"], (0.6 / (0.6 + 100 / 230) + (160 / 260) / (160 / 260 + 100 / 240)) / 2, "home win chance: margin removed per book, then the median")
ok(g["spread"] == -3.25, "home spread is the median of -3.0 and -3.5")
ok(g["total"] == 45.0 and g["books"] == 2 and g["kickoff"] == "2026-11-29T18:00Z", "total median, books counted, kickoff in UTC")
r = games["GB@LAR"]
near(r["homeProb"], 0.5 / (0.5 + 120 / 220), "an underdog home team")
ok(r["spread"] is None and r["total"] is None, "a market no book posted stays empty, never guessed")
ok(fo.consensus(None, names) == ({}, 0) and fo.consensus([], names) == ({}, 0), "an empty or malformed response gives nothing")

# history: a point only when something changed; the first point (the open) is never dropped
h = fo.update_history({}, games, "2026-11-25T08:20:00Z")
h = fo.update_history(h, games, "2026-11-25T21:20:00Z")
ok(len(h["NYG@IND"]["points"]) == 1, "an unchanged line adds no point")
moved = dict(games, **{"NYG@IND": dict(g, spread=-4.0)})
h = fo.update_history(h, moved, "2026-11-26T08:20:00Z")
ok([p["spread"] for p in h["NYG@IND"]["points"]] == [g["spread"], -4.0] and h["NYG@IND"]["points"][0]["at"] == "2026-11-25T08:20:00Z", "a moved line adds a point after the open")
for k in range(200): h = fo.update_history(h, dict(games, **{"NYG@IND": dict(g, total=40 + k % 7)}), "2026-11-27T%02d:%02d:00Z" % (k // 60, k % 60))
ok(len(h["NYG@IND"]["points"]) == fo.MAX_POINTS and h["NYG@IND"]["points"][0]["at"] == "2026-11-25T08:20:00Z", "the history is bounded and keeps the open")
h2 = fo.update_history(h, {}, "2027-01-15T00:00:00Z")
ok(h2 == {}, "games long past are dropped")
rematch = {"NYG@IND": dict(g, kickoff="2026-12-27T18:00Z")}
ok(len(fo.update_history(fo.update_history({}, games, "2026-11-25T08:20:00Z"), rematch, "2026-11-30T08:20:00Z")["NYG@IND"]["points"]) == 1, "a later meeting of the same teams starts a new record")
print(f"ok: sportsbook consensus passes ({checks} checks)")
