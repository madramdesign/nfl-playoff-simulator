#!/usr/bin/env python3
"""Model evaluation: point-in-time backtest, calibration, historical analogs and tests of popular narratives.

Usage: python3 scripts/evaluate.py <games.csv> <dir with team_week_YYYY.csv> [out.json]     (needs numpy)
Writes data/model_report.json, which scripts/build.py embeds in the page.

Leakage rules followed here:
  * a prediction made after week W uses results through week W and betting lines through week W+1 only;
  * Elo carries over between seasons but is only ever updated with games already played;
  * constants (ridge strength, weights, shrink) were chosen on these same seasons, so the reported scores are
    in-sample for those few constants. That is a known optimism; see docs/BACKTESTING.md.
"""
import csv, json, math, os, sys, collections
import numpy as np

games_path, tw_dir = sys.argv[1], sys.argv[2]
out_path = sys.argv[3] if len(sys.argv) > 3 else os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "model_report.json")
Y0, Y1 = 2021, 2025
FUM_PTS, FUM_SHARE, EPA_W, EPA_S, SHRINK = 4.0, 0.441, 0.2, 1.2, 0.8

def num(x):
    try: return float(x)
    except (TypeError, ValueError): return None
def implied(ml): return (-ml) / (-ml + 100) if ml < 0 else 100 / (ml + 100)
def prob(d): return 1 / (1 + 10 ** (-(d * 25) / 400))

ALL = []
for r in csv.DictReader(open(games_path, newline="")):
    if r["game_type"] != "REG" or num(r["home_score"]) is None: continue
    am, hm = num(r["away_moneyline"]), num(r["home_moneyline"])
    ALL.append(dict(id=r["game_id"], y=int(r["season"]), w=int(r["week"]), a=r["away_team"], h=r["home_team"], hs=float(r["home_score"]), as_=float(r["away_score"]),
                    m=float(r["home_score"]) - float(r["away_score"]), sp=num(r["spread_line"]), tl=num(r["total_line"]), neutral=r["location"] == "Neutral",
                    pline=(implied(hm) / (implied(hm) + implied(am))) if am is not None and hm is not None else None,
                    ar=num(r["away_rest"]) or 7, hr=num(r["home_rest"]) or 7, roof=r["roof"], temp=num(r["temp"]), wind=num(r["wind"]), div=r["div_game"] == "1",
                    wd=r["weekday"], aq=r["away_qb_name"], hq=r["home_qb_name"]))
G = collections.defaultdict(list)
for g in ALL: G[g["y"]].append(g)
S = {}
for y in range(Y0, Y1 + 1):
    for r in csv.DictReader(open(f"{tw_dir}/team_week_{y}.csv", newline="")):
        if r["season_type"] != "REG": continue
        f = lambda k: num(r[k]) or 0
        S[(r["game_id"], r["team"])] = dict(epa=f("passing_epa") + f("rushing_epa"), bounce=f("fumbles_lost_total") - FUM_SHARE * f("fumbles_total"))

def ridge(rows, teams, lam):
    idx = {t: i for i, t in enumerate(teams)}; n = len(teams); A = np.zeros((n + 1, n + 1)); b = np.zeros(n + 1)
    for h, a, v, neu, wt in rows:
        x = np.zeros(n + 1); x[idx[h]] = 1; x[idx[a]] = -1; x[n] = 0 if neu else 1
        A += wt * np.outer(x, x); b += wt * x * v
    A[:n, :n] += lam * np.eye(n); A[n, n] += 1e-6
    s = np.linalg.solve(A, b); s[:n] -= s[:n].mean(); return {t: s[idx[t]] for t in teams}, s[n]

# ---------- Elo, run over every season in the file so it is warmed up by 2021 ----------
ELO_K, ELO_HFA, ELO_REGRESS = 20.0, 48.0, 1 / 3
elo = collections.defaultdict(lambda: 1500.0); elo_after = {}; season = None
for g in sorted(ALL, key=lambda g: (g["y"], g["w"])):
    if g["y"] != season:
        season = g["y"]
        for t in list(elo): elo[t] = 1500 + (elo[t] - 1500) * (1 - ELO_REGRESS)
    d = elo[g["h"]] - elo[g["a"]] + (0 if g["neutral"] else ELO_HFA); e = 1 / (1 + 10 ** (-d / 400))
    res = 1 if g["m"] > 0 else 0 if g["m"] < 0 else .5
    mult = math.log(abs(g["m"]) + 1) * 2.2 / ((d if g["m"] > 0 else -d) * .001 + 2.2)
    ch = ELO_K * mult * (res - e); elo[g["h"]] += ch; elo[g["a"]] -= ch
    elo_after[(g["y"], g["w"], g["h"])] = elo[g["h"]]; elo_after[(g["y"], g["w"], g["a"])] = elo[g["a"]]
def elo_at(y, W, t):
    for w in range(W, 0, -1):
        if (y, w, t) in elo_after: return elo_after[(y, w, t)]
    prev = [elo_after[k] for k in elo_after if k[0] == y - 1 and k[2] == t]
    return 1500 + (prev[-1] - 1500) * (1 - ELO_REGRESS) if prev else 1500.0

# ---------- point-in-time predictions ----------
rec = []
for y in range(Y0, Y1 + 1):
    gs = G[y]; teams = sorted({g["h"] for g in gs} | {g["a"] for g in gs}); last = max(g["w"] for g in gs)
    for W in range(5, last):
        played = [g for g in gs if g["w"] <= W]
        margin, _ = ridge([(g["h"], g["a"], g["m"] - FUM_PTS * (S[(g["id"], g["a"])]["bounce"] - S[(g["id"], g["h"])]["bounce"]), g["neutral"], 1.0) for g in played], teams, 4)
        epa, _ = ridge([(g["h"], g["a"], S[(g["id"], g["h"])]["epa"] - S[(g["id"], g["a"])]["epa"], g["neutral"], 1.0) for g in played], teams, 4)
        market, hfa = ridge([(g["h"], g["a"], g["sp"], g["neutral"], .75 ** (W + 1 - g["w"])) for g in gs if g["w"] <= W + 1 and g["sp"] is not None], teams, .05)
        el = {t: (elo_at(y, W, t) - 1500) / 25 for t in teams}; mean_el = sum(el.values()) / len(el); el = {t: v - mean_el for t, v in el.items()}
        for g in gs:
            if g["w"] <= W or g["m"] == 0: continue
            home = 0 if g["neutral"] else hfa; dif = lambda R: R[g["h"]] - R[g["a"]]
            results = (1 - EPA_W) * dif(margin) + EPA_W * EPA_S * dif(epa)
            rec.append(dict(y=y, W=W, ahead=g["w"] - W, win=1 if g["m"] > 0 else 0, pline=g["pline"],
                            market=prob(SHRINK * dif(market) + home), margin=prob(SHRINK * dif(margin) + home), epa=prob(SHRINK * EPA_S * dif(epa) + home),
                            elo=prob(SHRINK * dif(el) + home), results=prob(SHRINK * results + home), ensemble=prob(SHRINK * (.5 * dif(market) + .5 * results) + home),
                            ens_elo=prob(SHRINK * (.45 * dif(market) + .45 * results + .10 * dif(el)) + home), ens_elo2=prob(SHRINK * (.4 * dif(market) + .4 * results + .2 * dif(el)) + home)))
def score(rows, key):
    p = np.clip(np.array([r[key] for r in rows], float), 1e-6, 1 - 1e-6); w = np.array([r["win"] for r in rows], float)
    return dict(n=len(rows), brier=round(float(((p - w) ** 2).mean()), 4), logloss=round(float(-(w * np.log(p) + (1 - w) * np.log(1 - p)).mean()), 4), acc=round(float(((p > .5) == (w == 1)).mean()), 3))
far = [r for r in rec if r["ahead"] >= 2]; near = [r for r in rec if r["ahead"] == 1 and r["pline"] is not None]
NAMES = [("ensemble", "Blend (what the page uses)"), ("market", "Sportsbook-spread rating"), ("results", "Results rating"), ("margin", "Scoring margin, opponent-adjusted"), ("epa", "EPA margin, opponent-adjusted"), ("elo", "Elo")]
models = [dict(key=k, name=nm, **score(far, k)) for k, nm in NAMES]
extra = {k: score(far, k) for k in ("ens_elo", "ens_elo2")}
nextweek = [dict(key="pline", name="Closing moneyline", **score(near, "pline"))] + [dict(key=k, name=nm, **score(near, k)) for k, nm in NAMES[:3]]
by_season = [dict(season=y, **score([r for r in far if r["y"] == y], "ensemble")) for y in range(Y0, Y1 + 1)]
# calibration of the blend, on the favourite's side
cal = []
for lo, hi in ((.5, .55), (.55, .6), (.6, .65), (.65, .7), (.7, .75), (.75, .8), (.8, .9), (.9, 1.01)):
    rows = [(max(r["ensemble"], 1 - r["ensemble"]), r["win"] if r["ensemble"] >= .5 else 1 - r["win"]) for r in far if lo <= max(r["ensemble"], 1 - r["ensemble"]) < hi]
    if rows: cal.append(dict(lo=lo, hi=min(hi, 1.0), n=len(rows), pred=round(sum(p for p, _ in rows) / len(rows), 3), act=round(sum(w for _, w in rows) / len(rows), 3)))
# spread of model opinions vs how often the blend's favourite won
dis = []
for lo, hi in ((0, .05), (.05, .1), (.1, .15), (.15, 1)):
    rows = [r for r in far if lo <= max(r[k] for k in ("market", "margin", "epa", "elo")) - min(r[k] for k in ("market", "margin", "epa", "elo")) < hi]
    if rows:
        fav = [(max(r["ensemble"], 1 - r["ensemble"]), r["win"] if r["ensemble"] >= .5 else 1 - r["win"]) for r in rows]
        dis.append(dict(lo=lo, hi=hi, n=len(rows), pred=round(sum(p for p, _ in fav) / len(fav), 3), act=round(sum(w for _, w in fav) / len(fav), 3), **{"brier": score(rows, "ensemble")["brier"]}))

# ---------- historical analogs: how often favourites of each size actually won (2010 on) ----------
hist = [g for g in ALL if g["y"] >= 2010 and g["sp"] is not None and g["m"] != 0]
analogs = []
for lo, hi in ((0, 1), (1.5, 3), (3.5, 6), (6.5, 9.5), (10, 13.5), (14, 99)):
    for side in ("home", "away"):
        rows = [g for g in hist if lo <= abs(g["sp"]) <= hi and ((g["sp"] > 0) == (side == "home")) and (g["sp"] != 0)]
        if lo == 0: rows = [g for g in hist if abs(g["sp"]) <= 1 and (g["sp"] >= 0) == (side == "home")]
        if rows:
            wins = sum(1 for g in rows if (g["m"] > 0) == (side == "home"))
            analogs.append(dict(lo=lo, hi=hi, fav=side, n=len(rows), favWin=round(wins / len(rows), 3)))

# ---------- narratives: does the claim show up against the closing spread? ----------
def verdict(vals, unit="points"):
    v = np.array(vals, float); n = len(v)
    if n < 30: return dict(n=n, effect=None, se=None, verdict="Too few games to say")
    m, se = float(v.mean()), float(v.std(ddof=1) / math.sqrt(n))
    return dict(n=n, effect=round(m, 2), se=round(se, 2), verdict="Not supported" if abs(m) < 2 * se else ("Supported" if m > 0 else "Opposite of the claim"))
mod = [g for g in ALL if g["y"] >= 2015 and g["sp"] is not None]
by_team = collections.defaultdict(list)
for g in sorted(mod, key=lambda g: (g["y"], g["w"])): by_team[(g["y"], g["h"])].append(g); by_team[(g["y"], g["a"])].append(g)
def cover(g, team): return (g["m"] - g["sp"]) if team == g["h"] else -(g["m"] - g["sp"])     # points better than the spread expected
def won(g, team): return (g["m"] > 0) == (team == g["h"]) and g["m"] != 0
hot, close, home_roof = [], [], {}
for (y, t), gs in by_team.items():
    roofs = collections.Counter(g["roof"] for g in gs if g["h"] == t and not g["neutral"]); home_roof[(y, t)] = roofs.most_common(1)[0][0] if roofs else "outdoors"
    for i, g in enumerate(gs):
        if i >= 3 and all(won(x, t) for x in gs[i - 3:i]): hot.append(cover(g, t))
        one = [x for x in gs[:i] if abs(x["m"]) <= 8]
        if len(one) >= 4 and sum(won(x, t) for x in one) / len(one) >= .75: close.append(cover(g, t))
bye = [cover(g, g["h"]) for g in mod if g["hr"] >= 13 and g["ar"] < 13] + [cover(g, g["a"]) for g in mod if g["ar"] >= 13 and g["hr"] < 13]
short_road = [cover(g, g["a"]) for g in mod if g["wd"] == "Thursday" and g["ar"] <= 5 and g["w"] > 1]
cold_dome = [cover(g, g["a"]) for g in mod if g["roof"] == "outdoors" and g["temp"] is not None and g["temp"] <= 35 and home_roof.get((g["y"], g["a"])) in ("dome", "closed")]
div_dog = [cover(g, g["h"] if g["sp"] < 0 else g["a"]) for g in mod if g["div"] and g["sp"] != 0]
windy = [(g["hs"] + g["as_"]) - g["tl"] for g in mod if g["wind"] is not None and g["wind"] >= 15 and g["tl"] is not None]
windy_raw = [(g["hs"] + g["as_"]) for g in mod if g["wind"] is not None and g["wind"] >= 15]; calm_raw = [(g["hs"] + g["as_"]) for g in mod if g["roof"] == "outdoors" and g["wind"] is not None and g["wind"] < 8]
hfa_old = [g["m"] for g in ALL if 2010 <= g["y"] <= 2018 and not g["neutral"]]; hfa_new = [g["m"] for g in ALL if 2019 <= g["y"] <= 2025 and not g["neutral"]]
narr = [
    dict(claim="A team on a three-game winning streak is hot and will keep beating expectations", measure="points better than the closing spread in the next game", **verdict(hot)),
    dict(claim="Teams that keep winning close games know how to win", measure="points better than the spread after going 75% or better in four or more one-score games", **verdict(close)),
    dict(claim="A team coming off its bye has an edge the odds miss", measure="points better than the spread when only that team had the bye", **verdict(bye)),
    dict(claim="Road teams on a short Thursday week are at a hidden disadvantage", measure="road team's points against the spread (negative means worse)", **{**verdict([-x for x in short_road]), "note": "A positive effect here means the road team did worse than the spread."}),
    dict(claim="Dome teams cannot play outdoors in the cold", measure="dome team's points against the spread on the road, outdoors, 35F or colder (negative means worse)", **{**verdict([-x for x in cold_dome]), "note": "A positive effect here means the dome team did worse than the spread."}),
    dict(claim="Division underdogs play their rivals closer than the odds say", measure="underdog's points better than the spread in division games", **verdict(div_dog)),
    dict(claim="Wind lowers scoring more than the over/under allows for", measure="points under the total in games with 15 mph wind or more", **{**verdict([-x for x in windy]), "note": f"Scoring itself does drop: {np.mean(windy_raw):.1f} points a game in 15 mph or more against {np.mean(calm_raw):.1f} in calm outdoor games. The question is whether the total already accounts for it."}),
]
narr.append(dict(claim="Home-field advantage is as strong as ever", measure="average home margin, 2019-2025 against 2010-2018", n=len(hfa_new), effect=round(float(np.mean(hfa_new)) - float(np.mean(hfa_old)), 2),
                 se=round(math.sqrt(np.var(hfa_new, ddof=1) / len(hfa_new) + np.var(hfa_old, ddof=1) / len(hfa_old)), 2),
                 verdict="Not supported" if np.mean(hfa_new) < np.mean(hfa_old) - 2 * math.sqrt(np.var(hfa_new, ddof=1) / len(hfa_new) + np.var(hfa_old, ddof=1) / len(hfa_old)) else "No clear change",
                 note=f"Home teams won by {np.mean(hfa_old):.2f} points on average in 2010-2018 and {np.mean(hfa_new):.2f} in 2019-2025."))
report = dict(seasons=[Y0, Y1], horizon="games two or more weeks ahead", models=models, tested=extra, nextweek=nextweek, bySeason=by_season, calibration=cal, disagreement=dis, analogs=analogs, narratives=narr,
              rejected=[dict(what="Quarterback-change discount on earlier results", why="no measurable gain (log loss 0.6395 against 0.6396)"),
                        dict(what="Discount for return touchdowns", why="made predictions worse (0.6411 against 0.6396)"),
                        dict(what="Weighting recent games more in the results rating", why="worse than equal weighting (0.6459 against 0.6438)"),
                        dict(what="Rest-day adjustment", why="effect was inconsistent between home and road teams")])
os.makedirs(os.path.dirname(out_path), exist_ok=True); json.dump(report, open(out_path, "w"), indent=1)
print("far n", len(far), "| near n", len(near))
for m in models: print(f"  {m['name']:36s} brier {m['brier']:.4f} logloss {m['logloss']:.4f} acc {m['acc']:.3f}")
print("  with 10% / 20% Elo in the blend:", extra)
print("next week:"); [print(f"  {m['name']:36s} brier {m['brier']:.4f} logloss {m['logloss']:.4f} acc {m['acc']:.3f}") for m in nextweek]
print("by season:", [(s["season"], s["logloss"]) for s in by_season])
print("calibration:", [(c["lo"], c["n"], c["pred"], c["act"]) for c in cal])
print("disagreement:", [(d["lo"], d["n"], d["pred"], d["act"], d["brier"]) for d in dis])
print("analogs:", [(a["lo"], a["fav"], a["n"], a["favWin"]) for a in analogs])
for x in narr: print(f"  {x['verdict']:22s} n={x['n']:5d} effect={x['effect']} se={x['se']}  {x['claim'][:70]}")
