#!/usr/bin/env python3
"""Rebuild public/index.html from src/template.html and fresh schedule, results and betting lines.

Usage: python3 scripts/build.py [--csv games.csv] [--team-stats stats_team_week.csv] [--season 2026]
Without the file arguments it downloads both from nflverse. Standard library only.

Three ratings come out of this, all in the same units:
  rate   market rating, fitted to sportsbook point spreads (recent weeks weigh more)
  rate2  results rating: opponent-adjusted scoring margin (80%) and opponent-adjusted EPA margin (20%)
The weights, the ridge strengths and SHRINK come from scripts/backtest.py on the 2021-2025 seasons.
"""
import argparse, csv, datetime, io, json, math, os, subprocess, tempfile, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE = "https://raw.githubusercontent.com/nflverse/nfldata/master/data/games.csv"
TEAM_STATS = "https://github.com/nflverse/nflverse-data/releases/download/stats_team/stats_team_week_{season}.csv"
RESULTS_RIDGE = 4.0     # pulls results ratings toward average; worth about four phantom games against an average team
EPA_WEIGHT, EPA_SCALE = 0.2, 1.2
FUMBLE_POINTS, FUMBLE_LOST_SHARE = 4.0, 0.441   # a fumble lost above the league-average share is treated as about 4 points of luck
SHRINK = 0.8            # rating gaps overstate edges for games weeks away; the backtest's best scale
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

class Fit:
    """Ridge fit of value = rating[home] - rating[away] + home edge."""
    def __init__(self): self.A = [[0.0] * 33 for _ in range(33)]; self.b = [0.0] * 33; self.n = 0
    def add(self, h, a, value, neutral, w=1.0):
        x = {h: 1.0, a: -1.0}
        if not neutral: x[32] = 1.0
        for i, xi in x.items():
            self.b[i] += w * xi * value
            for j, xj in x.items(): self.A[i][j] += w * xi * xj
        self.n += 1
    def solve(self, lam):
        A = [r[:] for r in self.A]
        for i in range(32): A[i][i] += lam
        A[32][32] += 1e-6
        s = solve(A, self.b); mean = sum(s[:32]) / 32
        return [v - mean for v in s[:32]], s[32]

def build(text, season, stats_text=None, asof=None):
    """asof=W rebuilds the picture as it stood after week W: later results are hidden and only lines through week W+1 are used."""
    teams, idx = [], {}
    for di, (dn, ts) in enumerate(DIV.items()):
        for t in ts:
            idx[t] = len(teams)
            teams.append({"a": "LAR" if t == "LA" else t, "n": NICK[t], "c": 0 if dn.startswith("AFC") else 1, "d": di, "dn": dn})
    rows = [r for r in csv.DictReader(io.StringIO(text)) if r["season"] == str(season) and r["game_type"] == "REG"]
    lined = [int(r["week"]) for r in rows if num(r["spread_line"]) is not None]
    maxw = max(lined) if lined else 1
    if asof is not None: maxw = min(maxw, asof + 1)
    played, games = [], []
    market, points, epa_fit = Fit(), Fit(), Fit()
    epa = {}; fum = {}
    if stats_text:
        for r in csv.DictReader(io.StringIO(stats_text)):
            if r["season_type"] == "REG":
                epa[(r["game_id"], r["team"])] = (num(r["passing_epa"]) or 0) + (num(r["rushing_epa"]) or 0)
                fum[(r["game_id"], r["team"])] = (num(r["fumbles_lost_total"]) or 0) - FUMBLE_LOST_SHARE * (num(r["fumbles_total"]) or 0)
    for r in rows:
        a, h = idx[r["away_team"]], idx[r["home_team"]]; neutral = r["location"] == "Neutral"; wk = int(r["week"])
        known = asof is None or wk <= asof + 1
        sp = num(r["spread_line"])            # positive means the home team is favored
        if sp is not None and known:
            market.add(h, a, sp, neutral, DECAY ** (maxw - wk))
        if num(r["away_score"]) is not None and num(r["home_score"]) is not None and (asof is None or wk <= asof):
            played.append([a, h, int(float(r["away_score"])), int(float(r["home_score"]))])
            eh, ea = epa.get((r["game_id"], r["home_team"])), epa.get((r["game_id"], r["away_team"]))
            # take out the points that came from fumble bounces going one way: they do not predict later games
            bounce = FUMBLE_POINTS * (fum.get((r["game_id"], r["away_team"]), 0) - fum.get((r["game_id"], r["home_team"]), 0))
            points.add(h, a, float(r["home_score"]) - float(r["away_score"]) - bounce, neutral)
            if eh is not None and ea is not None: epa_fit.add(h, a, eh - ea, neutral)
        else:
            d = datetime.date.fromisoformat(r["gameday"]); p = None
            am, hm = num(r["away_moneyline"]), num(r["home_moneyline"])
            if am is not None and hm is not None and known:
                pa, ph = implied(am), implied(hm); p = round(ph / (pa + ph), 4)   # bookmaker margin removed
            games.append([r["game_id"], wk, a, h, 1 if neutral else 0, d.strftime("%a %b ") + str(d.day), p, num(r["total_line"]) if known else None])
    mk, hfa = market.solve(RIDGE)
    pt, _ = points.solve(RESULTS_RIDGE)
    if epa_fit.n >= points.n * 0.9:      # use EPA only when it covers the season so far
        ep, _ = epa_fit.solve(RESULTS_RIDGE)
        results = [(1 - EPA_WEIGHT) * p + EPA_WEIGHT * EPA_SCALE * e for p, e in zip(pt, ep)]
    else:
        results = pt
    today = datetime.date.today()
    return {"teams": teams, "played": played, "games": games, "built": today.strftime("%b. ") + str(today.day) + today.strftime(", %Y"),
            "rate": [round(v * ELO_PER_POINT, 1) for v in mk], "rate2": [round(v * ELO_PER_POINT, 1) for v in results],
            "hfa": round(hfa * ELO_PER_POINT, 1), "shrink": SHRINK, "epaGames": epa_fit.n}

def history(text, season, stats, page):
    """Playoff and division odds for every team after each completed week, by rerunning the page's own engine in Node."""
    rows = [r for r in csv.DictReader(io.StringIO(text)) if r["season"] == str(season) and r["game_type"] == "REG"]
    open_weeks = {int(r["week"]) for r in rows if num(r["home_score"]) is None}
    done = sorted({int(r["week"]) for r in rows} - open_weeks)
    weeks = [w for w in done if w >= 4 and all(x in done for x in range(1, w + 1))]
    if not weeks: return None
    blobs = [json.dumps(build(text, season, stats, asof=w), separators=(",", ":")) for w in weeks]
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as f: json.dump(blobs, f); tmp = f.name
    try:
        out = subprocess.run(["node", os.path.join(ROOT, "scripts", "history.js"), os.path.join(ROOT, "src", "template.html"), tmp], capture_output=True, text=True, timeout=600)
        if out.returncode: raise RuntimeError(out.stderr[-400:])
        res = json.loads(out.stdout)
    except Exception as err:
        print("history skipped (needs Node):", err); return None
    finally:
        os.unlink(tmp)
    return {"weeks": weeks, "po": res["po"], "dv": res["dv"]}

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--csv"); ap.add_argument("--team-stats"); ap.add_argument("--season", type=int, default=2026); a = ap.parse_args()
    text = open(a.csv, newline="").read() if a.csv else urllib.request.urlopen(SOURCE, timeout=60).read().decode()
    if a.team_stats: stats = open(a.team_stats, newline="").read()
    else:
        try: stats = urllib.request.urlopen(TEAM_STATS.format(season=a.season), timeout=120).read().decode()
        except Exception as err: print("team stats unavailable, results rating will use scoring margin only:", err); stats = None
    data = build(text, a.season, stats)
    page = open(os.path.join(ROOT, "src", "template.html")).read()
    assert page.count("/*DATA*/") == 1
    data["history"] = history(text, a.season, stats, page)
    blob = json.dumps(data, separators=(",", ":"))
    assert "</script" not in blob
    os.makedirs(os.path.join(ROOT, "public"), exist_ok=True)
    open(os.path.join(ROOT, "public", "index.html"), "w").write(page.replace("/*DATA*/", blob))
    print(f"built public/index.html: {len(data['played'])} games played, {len(data['games'])} remaining, {sum(1 for g in data['games'] if g[6] is not None)} with sportsbook lines, EPA from {data['epaGames']} games")

if __name__ == "__main__": main()
