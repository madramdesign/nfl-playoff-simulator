#!/usr/bin/env python3
"""Three checks that need nfelo's published files (github.com/greerreNFL/nfelo and nfeloqb; credit nfeloapp.com):

1. Quarterback adjustment: does shifting a team's rating by (current starter's value - average value of the
   quarterbacks who produced its results so far) improve forecasts of games two or more weeks ahead?
2. Benchmarks: our numbers beside nfelo's own probabilities and the opening and closing lines on next-week games.
3. Hold-out: constants tuned only on earlier seasons, scored on the following season.

Usage: python3 scripts/backtest_qb.py <games.csv> <dir with team_week_YYYY.csv> <nfelo_games.csv> <qb_elos.csv>   (needs numpy)
"""
import csv, math, sys, collections, itertools, json, os
import numpy as np
games_path, tw_dir, nfelo_path, qb_path = sys.argv[1:5]
Y0, Y1 = 2021, 2025
FUM_PTS, FUM_SHARE = 4.0, 0.441
def num(x):
    try:
        v = float(x); return None if math.isnan(v) else v
    except (TypeError, ValueError): return None
def implied(ml): return (-ml) / (-ml + 100) if ml < 0 else 100 / (ml + 100)
def prob(d): return 1 / (1 + 10 ** (-(np.asarray(d) * 25) / 400))
def ll(p, w):
    p = np.clip(np.asarray(p, float), 1e-6, 1 - 1e-6); w = np.asarray(w, float); return float(-(w * np.log(p) + (1 - w) * np.log(1 - p)).mean())

G = collections.defaultdict(list)
for r in csv.DictReader(open(games_path, newline="")):
    y = int(r["season"])
    if r["game_type"] != "REG" or not (Y0 <= y <= Y1) or num(r["home_score"]) is None: continue
    am, hm = num(r["away_moneyline"]), num(r["home_moneyline"])
    G[y].append(dict(id=r["game_id"], w=int(r["week"]), a=r["away_team"], h=r["home_team"], m=float(r["home_score"]) - float(r["away_score"]), sp=num(r["spread_line"]),
                     neutral=r["location"] == "Neutral", pline=(implied(hm) / (implied(hm) + implied(am))) if am is not None and hm is not None else None))
S = {}
for y in range(Y0, Y1 + 1):
    for r in csv.DictReader(open(f"{tw_dir}/team_week_{y}.csv", newline="")):
        if r["season_type"] != "REG": continue
        f = lambda k: num(r[k]) or 0
        S[(r["game_id"], r["team"])] = dict(epa=f("passing_epa") + f("rushing_epa"), bounce=f("fumbles_lost_total") - FUM_SHARE * f("fumbles_total"))
NF = {r["game_id"]: r for r in csv.DictReader(open(nfelo_path, newline=""))}
QB = {}
for r in csv.DictReader(open(qb_path, newline="")):
    if r.get("game_id"): QB[r["game_id"]] = r
def qb_of(g, team):
    """(quarterback name, pre-game value adjustment in points) for a team in a game, from nfelo's QB file."""
    r = QB.get(g["id"])
    if not r: return None
    side = "1" if r["team1"] == team else "2" if r["team2"] == team else None
    if side is None:      # nfelo uses a few different abbreviations
        alias = {"LA": "LAR", "LV": "OAK"}; t2 = alias.get(team, team)
        side = "1" if r["team1"] == t2 else "2" if r["team2"] == t2 else None
    v = num(r.get(f"qb{side}_adj")) if side else None
    return (r[f"qb{side}"], v / 25.0) if v is not None else None

def ridge(rows, teams, lam):
    idx = {t: i for i, t in enumerate(teams)}; n = len(teams); A = np.zeros((n + 1, n + 1)); b = np.zeros(n + 1)
    for h, a, v, neu, wt in rows:
        x = np.zeros(n + 1); x[idx[h]] = 1; x[idx[a]] = -1; x[n] = 0 if neu else 1
        A += wt * np.outer(x, x); b += wt * x * v
    A[:n, :n] += lam * np.eye(n); A[n, n] += 1e-6
    s = np.linalg.solve(A, b); s[:n] -= s[:n].mean(); return {t: s[idx[t]] for t in teams}, s[n]

LAMS = (2, 4, 8)
rec = []; covered = 0; total_games = 0
for y in range(Y0, Y1 + 1):
    gs = G[y]; teams = sorted({g["h"] for g in gs} | {g["a"] for g in gs}); last = max(g["w"] for g in gs)
    for g in gs:
        total_games += 1; covered += 1 if (qb_of(g, g["h"]) and qb_of(g, g["a"])) else 0
    for W in range(5, last):
        played = sorted([g for g in gs if g["w"] <= W], key=lambda g: g["w"])
        margin = {lam: ridge([(g["h"], g["a"], g["m"] - FUM_PTS * (S[(g["id"], g["a"])]["bounce"] - S[(g["id"], g["h"])]["bounce"]), g["neutral"], 1.0) for g in played], teams, lam)[0] for lam in LAMS}
        epa = {lam: ridge([(g["h"], g["a"], S[(g["id"], g["h"])]["epa"] - S[(g["id"], g["a"])]["epa"], g["neutral"], 1.0) for g in played], teams, lam)[0] for lam in LAMS}
        market, hfa = ridge([(g["h"], g["a"], g["sp"], g["neutral"], .75 ** (W + 1 - g["w"])) for g in gs if g["w"] <= W + 1 and g["sp"] is not None], teams, .05)
        # quarterback shift: the latest starter's value against the average value behind the results so far
        vals = collections.defaultdict(list); cur = {}; changed = {}
        for g in played:
            for t in (g["h"], g["a"]):
                q = qb_of(g, t)
                if q: vals[t].append(q[1]); changed[t] = (t in cur and cur[t][0] != q[0]) or changed.get(t, False); cur[t] = q
        qshift = {t: (cur[t][1] - sum(vals[t]) / len(vals[t])) if t in cur else 0.0 for t in teams}
        # market ratings lean on recent lines, so the gap to the recent average matters there
        qshift_recent = {t: (cur[t][1] - sum(vals[t][-3:]) / len(vals[t][-3:])) if t in cur else 0.0 for t in teams}
        # nfelo's own rating after week W: the pre-game rating of each team's next game
        nfr = {}
        for t in teams:
            nxt = sorted([g for g in gs if g["w"] > W and t in (g["h"], g["a"]) and g["id"] in NF], key=lambda g: g["w"])
            if nxt:
                v = num(NF[nxt[0]["id"]]["starting_nfelo_home" if nxt[0]["h"] == t else "starting_nfelo_away"]); nfr[t] = (v - 1505) / 25 if v is not None else 0.0
            else: nfr[t] = 0.0
        mean_nf = sum(nfr.values()) / len(nfr); nfr = {t: v - mean_nf for t, v in nfr.items()}
        for g in gs:
            if g["w"] <= W or g["m"] == 0: continue
            d = lambda R: R[g["h"]] - R[g["a"]]; nf = NF.get(g["id"], {})
            row = dict(y=y, ahead=g["w"] - W, win=1 if g["m"] > 0 else 0, home=0 if g["neutral"] else hfa, market=d(market), q=d(qshift), qr=d(qshift_recent), nf=d(nfr),
                       anychange=bool(changed.get(g["h"]) or changed.get(g["a"])), pline=g["pline"],
                       nf_close=num(nf.get("nfelo_home_probability_close")), nf_open=num(nf.get("nfelo_home_probability_open")), open_imp=num(nf.get("home_implied_win_probability_open")))
            for lam in LAMS: row[f"m{lam}"] = d(margin[lam]); row[f"e{lam}"] = d(epa[lam])
            rec.append(row)
far = [r for r in rec if r["ahead"] >= 2]; near = [r for r in rec if r["ahead"] == 1]
col = lambda rows, k: np.array([r[k] for r in rows], float)
win = col(far, "win"); home = col(far, "home")
def blend(rows, lam=4, ew=.2, mw=.5, shrink=.8, qres=0.0, qmkt=0.0, nfw=0.0):
    res = (1 - ew) * col(rows, f"m{lam}") + ew * 1.2 * col(rows, f"e{lam}") + qres * col(rows, "q")
    mk = col(rows, "market") + qmkt * col(rows, "qr")
    core = mw * mk + (1 - mw) * res
    if nfw: core = (1 - nfw) * core + nfw * col(rows, "nf")
    return prob(shrink * core + col(rows, "home"))
out = {}
print(f"quarterback data covers {covered}/{total_games} games; forecasts two or more weeks ahead: {len(far)}")
base = ll(blend(far), win); print(f"current blend                                  {base:.4f}")
out["base"] = round(base, 4); out["qb"] = []
for qres, qmkt in ((.5, 0), (1, 0), (.5, .25), (1, .5), (1, 1)):
    v = ll(blend(far, qres=qres, qmkt=qmkt), win); out["qb"].append(dict(results=qres, market=qmkt, logloss=round(v, 4)))
    print(f"  QB shift x{qres} on results, x{qmkt} on market rating   {v:.4f}  ({v - base:+.4f})")
ch = [r for r in far if r["anychange"]]; w2 = col(ch, "win")
print(f"only games where either team changed quarterback (n={len(ch)}): blend {ll(blend(ch), w2):.4f}, with QB shift x1 on results {ll(blend(ch, qres=1), w2):.4f}, x1/x0.5 {ll(blend(ch, qres=1, qmkt=.5), w2):.4f}")
out["qbChangedGames"] = dict(n=len(ch), base=round(ll(blend(ch), w2), 4), shifted=round(ll(blend(ch, qres=1), w2), 4))
print("nfelo rating as an extra voice in the blend:", {w: round(ll(blend(far, nfw=w), win), 4) for w in (.1, .2, .3, .5, 1.0)})
out["nfeloInBlend"] = {str(w): round(ll(blend(far, nfw=w), win), 4) for w in (.1, .2, .3, .5, 1.0)}
# ---- next-week benchmarks ----
nb = [r for r in near if r["pline"] is not None and r["nf_close"] is not None and r["open_imp"] is not None]; wn = col(nb, "win")
bench = dict(n=len(nb), closing_line=ll(col(nb, "pline"), wn), opening_line=ll(col(nb, "open_imp"), wn), nfelo_at_close=ll(col(nb, "nf_close"), wn), nfelo_at_open=ll(col(nb, "nf_open"), wn),
             our_market_rating=ll(prob(.8 * col(nb, "market") + col(nb, "home")), wn), our_blend=ll(blend(nb), wn))
print("next-week games:", {k: (round(v, 4) if isinstance(v, float) else v) for k, v in bench.items()})
out["nextWeek"] = {k: (round(v, 4) if isinstance(v, float) else v) for k, v in bench.items()}
# ---- hold-out: tune on earlier seasons, score on the next ----
grid = list(itertools.product(LAMS, (0, .2, .4), (.3, .5, .7), (.7, .8, .9, 1.0)))
hold = []
for test in (2023, 2024, 2025):
    tr = [r for r in far if r["y"] < test]; te = [r for r in far if r["y"] == test]; wtr = col(tr, "win"); wte = col(te, "win")
    best = min(grid, key=lambda c: ll(blend(tr, *c), wtr))
    hold.append(dict(season=test, n=len(te), chosen=dict(ridge=best[0], epa=best[1], market=best[2], shrink=best[3]), tuned_earlier=round(ll(blend(te, *best), wte), 4), fixed=round(ll(blend(te), wte), 4),
                     market_only=round(ll(prob(.8 * col(te, "market") + col(te, "home")), wte), 4)))
    print(f"hold-out {test}: constants chosen on earlier seasons {best} -> {hold[-1]['tuned_earlier']:.4f}; page's constants {hold[-1]['fixed']:.4f}; market rating alone {hold[-1]['market_only']:.4f}")
out["holdout"] = hold
tot = sum(h["n"] for h in hold); print("hold-out average: tuned-earlier %.4f, page's constants %.4f, market alone %.4f" % tuple(sum(h[k] * h["n"] for h in hold) / tot for k in ("tuned_earlier", "fixed", "market_only")))
out["holdoutAvg"] = {k: round(sum(h[k] * h["n"] for h in hold) / tot, 4) for k in ("tuned_earlier", "fixed", "market_only")}
json.dump(out, open(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "qb_holdout_report.json"), "w"), indent=1)
