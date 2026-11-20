import csv, math, sys, collections
import numpy as np
games_path, tw_dir = sys.argv[1], sys.argv[2]; Y0, Y1 = 2021, 2025
def num(x):
    try: return float(x)
    except (TypeError, ValueError): return None
G = collections.defaultdict(list)
for r in csv.DictReader(open(games_path, newline="")):
    y = int(r["season"])
    if r["game_type"] != "REG" or not (Y0 <= y <= Y1) or num(r["home_score"]) is None: continue
    G[y].append(dict(id=r["game_id"], w=int(r["week"]), a=r["away_team"], h=r["home_team"], m=float(r["home_score"]) - float(r["away_score"]),
                     sp=num(r["spread_line"]), neutral=r["location"] == "Neutral", aq=r["away_qb_name"], hq=r["home_qb_name"]))
S = {}
tot_f = tot_l = 0
for y in range(Y0, Y1 + 1):
    for r in csv.DictReader(open(f"{tw_dir}/team_week_{y}.csv", newline="")):
        if r["season_type"] != "REG": continue
        f = lambda k: num(r[k]) or 0
        S[(r["game_id"], r["team"])] = dict(epa=f("passing_epa") + f("rushing_epa"), fum=f("fumbles_total"), lost=f("fumbles_lost_total"),
                                           ret=f("def_tds") + f("special_teams_tds") + f("fumble_recovery_tds"), ints=f("passing_interceptions"))
        tot_f += f("fumbles_total"); tot_l += f("fumbles_lost_total")
P = tot_l / tot_f; print("league share of fumbles lost", round(P, 3))
def ridge(rows, teams, lam):
    idx = {t: i for i, t in enumerate(teams)}; n = len(teams); A = np.zeros((n + 1, n + 1)); b = np.zeros(n + 1)
    for h, a, v, neu, wt in rows:
        x = np.zeros(n + 1); x[idx[h]] = 1; x[idx[a]] = -1; x[n] = 0 if neu else 1
        A += wt * np.outer(x, x); b += wt * x * v
    A[:n, :n] += lam * np.eye(n); A[n, n] += 1e-6
    s = np.linalg.solve(A, b); s[:n] -= s[:n].mean(); return {t: s[idx[t]] for t in teams}, s[n]
def prob(d): return 1 / (1 + 10 ** (-(d * 25) / 400))
variants = {}
def luck(g, fp, tdp):
    h, a = S.get((g["id"], g["h"])), S.get((g["id"], g["a"]))
    if not h or not a: return 0.0
    # points the home team gained from bounces: opponent fumbles lost above expectation minus its own, plus return touchdowns
    return fp * ((a["lost"] - P * a["fum"]) - (h["lost"] - P * h["fum"])) + tdp * (h["ret"] - a["ret"])
rec = []
for y in range(Y0, Y1 + 1):
    gs = G[y]; teams = sorted({g["h"] for g in gs} | {g["a"] for g in gs}); last = max(g["w"] for g in gs)
    for W in range(5, last - 1):
        played = sorted([g for g in gs if g["w"] <= W], key=lambda g: g["w"])
        cur = {}
        for g in played: cur[g["h"]] = g["hq"]; cur[g["a"]] = g["aq"]
        def qbw(g, c): return min(1.0 if g["hq"] == cur[g["h"]] else c, 1.0 if g["aq"] == cur[g["a"]] else c)
        R = {}
        R["srs"] = ridge([(g["h"], g["a"], g["m"], g["neutral"], 1.0) for g in played], teams, 4)
        for c in (.25, .5, .75): R[f"qb{c}"] = ridge([(g["h"], g["a"], g["m"], g["neutral"], qbw(g, c)) for g in played], teams, 4)
        for fp, tdp in ((4, 0), (0, 5), (4, 5), (2, 3), (4, 7)): R[f"luck{fp}_{tdp}"] = ridge([(g["h"], g["a"], g["m"] - luck(g, fp, tdp), g["neutral"], 1.0) for g in played], teams, 4)
        R["both"] = ridge([(g["h"], g["a"], g["m"] - luck(g, 4, 5), g["neutral"], qbw(g, .5)) for g in played], teams, 4)
        R["epa"] = ridge([(g["h"], g["a"], S[(g["id"], g["h"])]["epa"] - S[(g["id"], g["a"])]["epa"], g["neutral"], 1.0) for g in played if (g["id"], g["h"]) in S and (g["id"], g["a"]) in S], teams, 4)
        R["market"] = ridge([(g["h"], g["a"], g["sp"], g["neutral"], .75 ** (W + 1 - g["w"])) for g in gs if g["w"] <= W + 1 and g["sp"] is not None], teams, .05)
        hfa = R["market"][1]
        for g in gs:
            if g["w"] < W + 2 or g["m"] == 0: continue
            row = {k: v[0][g["h"]] - v[0][g["a"]] for k, v in R.items()}; row.update(home=0 if g["neutral"] else hfa, win=1 if g["m"] > 0 else 0); rec.append(row)
win = np.array([r["win"] for r in rec]); home = np.array([r["home"] for r in rec])
col = lambda k: np.array([r[k] for r in rec])
def ll(d):
    p = np.clip(prob(d + home), 1e-6, 1 - 1e-6); return float(-(win * np.log(p) + (1 - win) * np.log(1 - p)).mean())
print("n", len(rec))
for k in [k for k in rec[0] if k not in ("home", "win")]:
    alone = min(ll(col(k) * s) for s in np.arange(.5, 1.21, .1))
    res = .8 * col(k) + .2 * 1.2 * col("epa") if k not in ("epa", "market") else col(k)
    blend = ll(.8 * (.5 * col("market") + .5 * res))
    print(f"{k:10s} alone {alone:.4f}   in the full blend {blend:.4f}")
