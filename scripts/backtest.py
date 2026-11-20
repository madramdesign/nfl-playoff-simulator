#!/usr/bin/env python3
"""Backtest rating methods on past seasons. Needs numpy.

Usage: python3 scripts/backtest.py <games.csv> <dir with team_week_YYYY.csv> [first_season last_season]

At each week W of each season it builds ratings from what was known then (results through W, spreads through W+1)
and predicts every game from W+2 to the end of the regular season: the games that have no betting line yet.
"""
import csv, math, sys, collections
import numpy as np

games_path, tw_dir = sys.argv[1], sys.argv[2]
Y0, Y1 = (int(sys.argv[3]), int(sys.argv[4])) if len(sys.argv) > 4 else (2021, 2025)
def num(x):
    try: return float(x)
    except (TypeError, ValueError): return None

G = collections.defaultdict(list)
for r in csv.DictReader(open(games_path, newline="")):
    y = int(r["season"])
    if r["game_type"] != "REG" or not (Y0 <= y <= Y1) or num(r["home_score"]) is None: continue
    G[y].append(dict(id=r["game_id"], w=int(r["week"]), a=r["away_team"], h=r["home_team"], m=float(r["home_score"]) - float(r["away_score"]),
                     sp=num(r["spread_line"]), neutral=r["location"] == "Neutral", ar=num(r["away_rest"]), hr=num(r["home_rest"])))
EPA = {}
for y in range(Y0, Y1 + 1):
    for r in csv.DictReader(open(f"{tw_dir}/team_week_{y}.csv", newline="")):
        if r["season_type"] != "REG": continue
        EPA[(r["game_id"], r["team"])] = (num(r["passing_epa"]) or 0) + (num(r["rushing_epa"]) or 0)

def ridge(rows, teams, lam, decay=1.0, maxw=None):
    """rows: (week, home, away, value, neutral). Returns ratings dict and home edge."""
    idx = {t: i for i, t in enumerate(teams)}; n = len(teams)
    A = np.zeros((n + 1, n + 1)); b = np.zeros(n + 1)
    for w, h, a, v, neu in rows:
        wt = decay ** (maxw - w) if maxw else 1.0
        x = np.zeros(n + 1); x[idx[h]] = 1; x[idx[a]] = -1; x[n] = 0 if neu else 1
        A += wt * np.outer(x, x); b += wt * x * v
    A[:n, :n] += lam * np.eye(n); A[n, n] += 1e-6
    s = np.linalg.solve(A, b); s[:n] -= s[:n].mean()
    return {t: s[idx[t]] for t in teams}, s[n]

def simple(rows_played, teams):
    """The page's original results rating: regressed win pct and point differential, no opponent adjustment (in points)."""
    w = collections.Counter(); g = collections.Counter(); pd = collections.Counter()
    for _, h, a, m, _ in rows_played:
        g[h] += 1; g[a] += 1; pd[h] += m; pd[a] -= m
        w[h] += 1 if m > 0 else .5 if m == 0 else 0; w[a] += 1 if m < 0 else .5 if m == 0 else 0
    out = {}
    for t in teams:
        p = (w[t] + 3) / (g[t] + 6); e1 = 400 * math.log10(p / (1 - p)) * .9; e2 = 25 * (pd[t] / g[t]) * (g[t] / (g[t] + 3)) if g[t] else 0
        out[t] = (.5 * e1 + .5 * e2) / 25
    return out

def prob(d, k=25.0): return 1 / (1 + 10 ** (-(d * k) / 400))

rec = []   # one row per (prediction, method): rating gaps in points for each method, and the result
for y in range(Y0, Y1 + 1):
    gs = G[y]; teams = sorted({g["h"] for g in gs} | {g["a"] for g in gs}); last = max(g["w"] for g in gs)
    for W in range(5, last - 1):
        played = [g for g in gs if g["w"] <= W]
        pts_rows = [(g["w"], g["h"], g["a"], g["m"], g["neutral"]) for g in played]
        epa_rows = [(g["w"], g["h"], g["a"], EPA[(g["id"], g["h"])] - EPA[(g["id"], g["a"])], g["neutral"]) for g in played if (g["id"], g["h"]) in EPA and (g["id"], g["a"]) in EPA]
        mk_rows = [(g["w"], g["h"], g["a"], g["sp"], g["neutral"]) for g in gs if g["w"] <= W + 1 and g["sp"] is not None]
        R = {"simple": (simple(pts_rows, teams), None)}
        for lam in (2, 4, 8):
            R[f"srs{lam}"] = ridge(pts_rows, teams, lam)
            R[f"epa{lam}"] = ridge(epa_rows, teams, lam)
        R["epa4d"] = ridge(epa_rows, teams, 4, .9, W); R["srs4d"] = ridge(pts_rows, teams, 4, .9, W)
        R["market"] = ridge(mk_rows, teams, .05, .75, W + 1)
        hfa = R["market"][1]
        for g in gs:
            if g["w"] < W + 2 or g["m"] == 0: continue
            row = {k: v[0][g["h"]] - v[0][g["a"]] for k, v in R.items()}
            row.update(y=y, W=W, ahead=g["w"] - W, home=0 if g["neutral"] else hfa, win=1 if g["m"] > 0 else 0, margin=g["m"], sp=g["sp"],
                       rest=(g["hr"] or 7) - (g["ar"] or 7), hbye=(g["hr"] or 7) >= 13, abye=(g["ar"] or 7) >= 13, hshort=(g["hr"] or 7) <= 5, ashort=(g["ar"] or 7) <= 5)
            rec.append(row)

win = np.array([r["win"] for r in rec]); home = np.array([r["home"] for r in rec])
def col(k): return np.array([r[k] for r in rec])
def logloss(d, k=25.0):
    p = np.clip(prob(d + home, k), 1e-6, 1 - 1e-6); return float(-(win * np.log(p) + (1 - win) * np.log(1 - p)).mean())
print(f"predictions: {len(rec)} (seasons {Y0}-{Y1}); coin-flip log loss 0.6931")
keys = ["simple", "srs2", "srs4", "srs8", "srs4d", "epa2", "epa4", "epa8", "epa4d", "market"]
for k in keys:
    # each method gets its own best points scale, so none is penalised for being on a different scale
    best = min(((logloss(col(k) * s), s) for s in np.arange(.4, 2.01, .1)), key=lambda x: x[0])
    acc = float(((col(k) * best[1] + home > 0) == (win == 1)).mean())
    print(f"{k:8s} log loss {best[0]:.4f}  scale {best[1]:.1f}  picks right {acc:.3f}")
# EPA is in expected points per game; find the blend of market, points and EPA ratings that predicts best
best = None
for wm in np.arange(0, 1.01, .1):
    for we in np.arange(0, 1.01 - wm, .1):
        wp = 1 - wm - we
        for s_e in (.8, 1.0, 1.2):
            d = wm * col("market") + we * s_e * col("epa4") + wp * col("srs4")
            for s in (.8, .9, 1.0, 1.1):
                ll = logloss(d * s)
                if best is None or ll < best[0]: best = (ll, round(wm, 1), round(we, 1), round(wp, 1), s_e, s)
print("best blend: log loss %.4f  market %.1f  epa %.1f  points %.1f  (epa scale %.1f, overall scale %.1f)" % best)
for wm in (0, .3, .5, .7, 1):
    d = wm * col("market") + (1 - wm) * (.5 * col("epa4") + .5 * col("srs4")); print(f"  market weight {wm:.1f} with the rest split epa/points: {logloss(d):.4f}")
# no-market blend (what a pure results model should use)
bb = min(((logloss((we * col("epa4") + (1 - we) * col("srs4")) * s), round(we, 1), s) for we in np.arange(0, 1.01, .1) for s in (.8, .9, 1.0, 1.1, 1.2)), key=lambda x: x[0])
print("best results-only blend: log loss %.4f  epa %.1f  points %.1f  scale %.1f" % (bb[0], bb[1], 1 - bb[1], bb[2]))
by = collections.defaultdict(list)
for i, r in enumerate(rec): by[min(r["ahead"], 8)].append(i)
print("by weeks ahead (market vs best results-only):", {a: (round(logloss_i, 3)) for a, logloss_i in [(a, float(-(win[ix] * np.log(np.clip(prob(col("market")[ix] + home[ix]), 1e-6, 1 - 1e-6)) + (1 - win[ix]) * np.log(1 - np.clip(prob(col("market")[ix] + home[ix]), 1e-6, 1 - 1e-6))).mean())) for a, ix in sorted(by.items())]})
# rest: does the market rating miss anything that rest explains? residual of actual margin vs market-rating prediction
resid = col("margin") - (col("market") + home)
for name in ("hbye", "abye", "hshort", "ashort"):
    m = col(name).astype(bool); print(f"rest check {name}: n={int(m.sum())} mean margin residual {resid[m].mean():+.2f} (se {resid[m].std() / math.sqrt(max(1, m.sum())):.2f})")
