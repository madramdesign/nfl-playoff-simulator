#!/usr/bin/env python3
"""Rebuild public/index.html from src/template.html and fresh schedule, results and betting lines.

Usage: python3 scripts/build.py [--csv path/to/games.csv] [--season 2026]
Without --csv it downloads the nflverse games file. Standard library only.
"""
import argparse, csv, datetime, io, json, math, os, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE = "https://raw.githubusercontent.com/nflverse/nfldata/master/data/games.csv"
DIV = {"AFC East":["BUF","MIA","NE","NYJ"],"AFC North":["BAL","CIN","CLE","PIT"],"AFC South":["HOU","IND","JAX","TEN"],"AFC West":["DEN","KC","LV","LAC"],
       "NFC East":["DAL","NYG","PHI","WAS"],"NFC North":["CHI","DET","GB","MIN"],"NFC South":["ATL","CAR","NO","TB"],"NFC West":["ARI","LA","SF","SEA"]}
NICK = dict(BUF="Bills",MIA="Dolphins",NE="Patriots",NYJ="Jets",BAL="Ravens",CIN="Bengals",CLE="Browns",PIT="Steelers",HOU="Texans",IND="Colts",JAX="Jaguars",TEN="Titans",DEN="Broncos",KC="Chiefs",LV="Raiders",LAC="Chargers",DAL="Cowboys",NYG="Giants",PHI="Eagles",WAS="Commanders",CHI="Bears",DET="Lions",GB="Packers",MIN="Vikings",ATL="Falcons",CAR="Panthers",NO="Saints",TB="Buccaneers",ARI="Cardinals",LA="Rams",SF="49ers",SEA="Seahawks")
ELO_PER_POINT = 25.0   # one point of spread is worth about 25 rating points
DECAY = 0.75           # weight of a spread from one week earlier, relative to the latest week
RIDGE = 0.05

def num(x):
    try: return float(x)
    except (TypeError, ValueError): return None

def implied(ml): return (-ml) / (-ml + 100) if ml < 0 else 100 / (ml + 100)

def solve(M, v):
    n = len(v); M = [row[:] + [v[i]] for i, row in enumerate(M)]
    for c in range(n):
        p = max(range(c, n), key=lambda r: abs(M[r][c])); M[c], M[p] = M[p], M[c]
        for r in range(n):
            if r != c and M[r][c]:
                f = M[r][c] / M[c][c]
                for k in range(c, n + 1): M[r][k] -= f * M[c][k]
    return [M[i][n] / M[i][i] for i in range(n)]

def build(text, season):
    teams, idx = [], {}
    for di, (dn, ts) in enumerate(DIV.items()):
        for t in ts:
            idx[t] = len(teams)
            teams.append({"a": "LAR" if t == "LA" else t, "n": NICK[t], "c": 0 if dn.startswith("AFC") else 1, "d": di, "dn": dn})
    rows = [r for r in csv.DictReader(io.StringIO(text)) if r["season"] == str(season) and r["game_type"] == "REG"]
    lined = [int(r["week"]) for r in rows if num(r["spread_line"]) is not None]
    maxw = max(lined) if lined else 1
    played, games = [], []
    XtX = [[0.0] * 33 for _ in range(33)]; Xty = [0.0] * 33
    for r in rows:
        a, h = idx[r["away_team"]], idx[r["home_team"]]; neutral = r["location"] == "Neutral"; wk = int(r["week"])
        sp = num(r["spread_line"])            # positive means the home team is favored
        if sp is not None:
            w = DECAY ** (maxw - wk); x = {h: 1.0, a: -1.0}
            if not neutral: x[32] = 1.0
            for i, xi in x.items():
                Xty[i] += w * xi * sp
                for j, xj in x.items(): XtX[i][j] += w * xi * xj
        if num(r["away_score"]) is not None and num(r["home_score"]) is not None:
            played.append([a, h, int(float(r["away_score"])), int(float(r["home_score"]))])
        else:
            d = datetime.date.fromisoformat(r["gameday"]); p = None
            am, hm = num(r["away_moneyline"]), num(r["home_moneyline"])
            if am is not None and hm is not None:
                pa, ph = implied(am), implied(hm); p = round(ph / (pa + ph), 4)   # bookmaker margin removed
            games.append([r["game_id"], wk, a, h, 1 if neutral else 0, d.strftime("%a %b ") + str(d.day), p])
    for i in range(32): XtX[i][i] += RIDGE
    XtX[32][32] += 1e-9
    sol = solve(XtX, Xty); mean = sum(sol[:32]) / 32
    return {"teams": teams, "played": played, "games": games,
            "rate": [round((v - mean) * ELO_PER_POINT, 1) for v in sol[:32]], "hfa": round(sol[32] * ELO_PER_POINT, 1)}

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--csv"); ap.add_argument("--season", type=int, default=2026); a = ap.parse_args()
    text = open(a.csv, newline="").read() if a.csv else urllib.request.urlopen(SOURCE, timeout=60).read().decode()
    data = build(text, a.season); blob = json.dumps(data, separators=(",", ":"))
    assert "</script" not in blob
    page = open(os.path.join(ROOT, "src", "template.html")).read()
    assert page.count("/*DATA*/") == 1
    os.makedirs(os.path.join(ROOT, "public"), exist_ok=True)
    open(os.path.join(ROOT, "public", "index.html"), "w").write(page.replace("/*DATA*/", blob))
    print(f"built public/index.html: {len(data['played'])} games played, {len(data['games'])} remaining, {sum(1 for g in data['games'] if g[6] is not None)} with sportsbook lines")

if __name__ == "__main__": main()
