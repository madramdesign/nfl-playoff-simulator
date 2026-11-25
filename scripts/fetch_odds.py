#!/usr/bin/env python3
"""Fetch NFL lines from The Odds API and save a sportsbook consensus per game into data/odds/.

Needs the environment variable ODDS_API_KEY (a GitHub repository secret; never put the key in a file here, and never
print the request address, which carries the key). One call costs 3 credits of the free tier's 500 a month
(moneyline, spread and total for United States books), so twice a day uses about 180.

What is stored is derived, not the raw feed: for each game the median across books of the home win chance with the
bookmaker's margin removed, the home spread and the total, plus how many books were counted. The Odds API's terms allow
showing and storing its data in an app but not re-serving it as a raw feed, and this repository is public.

data/odds/latest.json   the newest consensus for every listed game
data/odds/history.json  for each game, the consensus each time it changed, so opening lines and movement come from
                        our own record (the free tier has no history)

Usage: ODDS_API_KEY=... python3 scripts/fetch_odds.py            (or --from-file saved.json to rebuild offline)
"""
import argparse, datetime, json, os, statistics, sys, urllib.error, urllib.parse, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL = "https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds"
PARAMS = dict(regions="us", markets="h2h,spreads,totals", oddsFormat="american", dateFormat="iso")
MAX_POINTS = 60          # history entries kept per game
KEEP_DAYS = 21           # games that kicked off longer ago than this are dropped from the history

def team_names():
    """Full team name (as sportsbooks write it) -> the abbreviation the page uses (`a` in shared/teams.json, same as D.teams)."""
    teams = json.load(open(os.path.join(ROOT, "shared", "teams.json")))["teams"]
    return {t["name"].lower(): t["a"] for t in teams}

def implied(ml):
    ml = float(ml)
    if ml == 0: raise ValueError("a moneyline of 0")
    return (-ml) / (-ml + 100) if ml < 0 else 100 / (ml + 100)

def num(x):
    return float(x) if isinstance(x, (int, float)) and not isinstance(x, bool) and x == x and abs(x) != float("inf") else None

def consensus(events, names):
    """events: The Odds API's list. Returns ({key: game}, skipped) where key is "AWAY@HOME" and a game holds the kickoff,
    the number of books counted and the medians. A game with no usable book, or a team name that is not one of the 32,
    is skipped and counted, never guessed."""
    out, skipped = {}, 0
    for ev in events if isinstance(events, list) else []:
        try:
            home, away = names[str(ev["home_team"]).lower()], names[str(ev["away_team"]).lower()]
            kick = datetime.datetime.fromisoformat(str(ev["commence_time"]).replace("Z", "+00:00"))
        except (KeyError, ValueError, TypeError):
            skipped += 1; continue
        probs, spreads, totals = [], [], []
        for b in ev.get("bookmakers") or []:
            for m in (b.get("markets") or []) if isinstance(b, dict) else []:
                try:
                    oc = {str(o["name"]).lower(): o for o in m.get("outcomes") or []}
                    if m.get("key") == "h2h":
                        h, a = implied(oc[str(ev["home_team"]).lower()]["price"]), implied(oc[str(ev["away_team"]).lower()]["price"])
                        if 0 < h < 1 and 0 < a < 1: probs.append(h / (h + a))          # the bookmaker's margin removed
                    elif m.get("key") == "spreads":
                        p = num(oc[str(ev["home_team"]).lower()].get("point"))
                        if p is not None and abs(p) <= 40: spreads.append(p)
                    elif m.get("key") == "totals":
                        p = num(oc["over"].get("point"))
                        if p is not None and 15 <= p <= 90: totals.append(p)
                except (KeyError, ValueError, TypeError, ZeroDivisionError): continue
        if not probs and not spreads and not totals: skipped += 1; continue
        med = lambda v, d: round(statistics.median(v), d) if v else None
        out[away + "@" + home] = {"kickoff": kick.astimezone(datetime.timezone.utc).isoformat(timespec="minutes").replace("+00:00", "Z"),
                                  "books": max(len(probs), len(spreads), len(totals)),
                                  "homeProb": med(probs, 4), "spread": med(spreads, 2), "total": med(totals, 2)}
    return out, skipped

def update_history(history, games, now):
    """Adds a point for a game only when its consensus changed, so the first point is the earliest line we recorded."""
    cutoff = (datetime.datetime.fromisoformat(now.replace("Z", "+00:00")) - datetime.timedelta(days=KEEP_DAYS)).isoformat()
    hist = {k: v for k, v in (history or {}).items() if isinstance(v, dict) and str(v.get("kickoff", "")) >= cutoff[:16]}
    for key, g in games.items():
        h = hist.setdefault(key, {"kickoff": g["kickoff"], "points": []})
        # the same two teams can meet twice: a new kickoff more than a week from the recorded one starts a new record
        if abs((datetime.datetime.fromisoformat(g["kickoff"].replace("Z", "+00:00")) - datetime.datetime.fromisoformat(str(h["kickoff"]).replace("Z", "+00:00"))).days) > 7:
            h = hist[key] = {"kickoff": g["kickoff"], "points": []}
        h["kickoff"] = g["kickoff"]
        point = {"at": now, "books": g["books"], "homeProb": g["homeProb"], "spread": g["spread"], "total": g["total"]}
        last = h["points"][-1] if h["points"] else None
        if not last or any(last.get(f) != point[f] for f in ("homeProb", "spread", "total")):
            h["points"].append(point)
            if len(h["points"]) > MAX_POINTS: h["points"] = h["points"][:1] + h["points"][-(MAX_POINTS - 1):]   # the first point is the open: keep it
    return hist

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--from-file"); ap.add_argument("--out", default=os.path.join(ROOT, "data", "odds")); a = ap.parse_args()
    now = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    remaining = None
    if a.from_file: events = json.load(open(a.from_file))
    else:
        key = os.environ.get("ODDS_API_KEY")
        if not key: sys.exit("ODDS_API_KEY is not set")
        req = urllib.request.Request(URL + "?" + urllib.parse.urlencode(dict(PARAMS, apiKey=key)), headers={"accept": "application/json", "user-agent": "nfl-universe"})
        try:
            with urllib.request.urlopen(req, timeout=60) as res:
                events = json.loads(res.read().decode()); remaining = res.headers.get("x-requests-remaining")
        except urllib.error.HTTPError as err: sys.exit(f"The Odds API answered {err.code} {err.reason}")     # never the address: it carries the key
        except Exception as err: sys.exit("The Odds API could not be reached: " + type(err).__name__)
    games, skipped = consensus(events, team_names())
    if not games: sys.exit(f"no usable games in the response ({skipped} skipped); nothing written")
    os.makedirs(a.out, exist_ok=True)
    hpath = os.path.join(a.out, "history.json")
    try: history = json.load(open(hpath)).get("games", {})
    except Exception: history = {}
    meta = {"source": "The Odds API", "url": "https://the-odds-api.com/", "kind": "median across United States sportsbooks; home win chance has the bookmaker's margin removed"}
    json.dump(dict(meta, fetched=now, games=games), open(os.path.join(a.out, "latest.json"), "w"), separators=(",", ":"))
    json.dump(dict(meta, updated=now, games=update_history(history, games, now)), open(hpath, "w"), separators=(",", ":"))
    print(f"saved the consensus for {len(games)} games ({skipped} skipped)" + (f"; credits left this month: {remaining}" if remaining else ""))

if __name__ == "__main__": main()
