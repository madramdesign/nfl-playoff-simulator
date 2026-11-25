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
INJURIES = "https://github.com/nflverse/nflverse-data/releases/download/injuries/injuries_{season}.csv"
QB_VALUES = "https://raw.githubusercontent.com/greerreNFL/nfeloqb/main/qb_elos.csv"   # nfelo's published quarterback values; credit nfeloapp.com
QB_TEAM = {"LA": "LAR", "LV": "OAK"}     # nflverse abbreviation -> the one used in the quarterback file
QB_ELO_PER_VALUE = 3.3                   # the file's own convention: adjustment = 3.3 x (quarterback value - team baseline)
ELO_K, ELO_HFA, ELO_REGRESS = 20.0, 48.0, 1 / 3   # Elo is shown as a second opinion only; adding it to the blend did not help in the backtest
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

def elo_ratings(text, season, asof=None):
    """Margin-aware Elo carried over from earlier seasons, as points above or below this season's average team."""
    elo = {}; cur = None
    rows = [r for r in csv.DictReader(io.StringIO(text)) if r["game_type"] == "REG" and num(r["home_score"]) is not None and int(r["season"]) <= season]
    for r in sorted(rows, key=lambda r: (int(r["season"]), int(r["week"]))):
        y, wk = int(r["season"]), int(r["week"])
        if y == season and asof is not None and wk > asof: continue
        if y != cur:
            cur = y
            for t in elo: elo[t] = 1500 + (elo[t] - 1500) * (1 - ELO_REGRESS)
        h, a = r["home_team"], r["away_team"]; m = float(r["home_score"]) - float(r["away_score"])
        d = elo.get(h, 1500.0) - elo.get(a, 1500.0) + (0 if r["location"] == "Neutral" else ELO_HFA); e = 1 / (1 + 10 ** (-d / 400))
        mult = math.log(abs(m) + 1) * 2.2 / ((d if m > 0 else -d) * .001 + 2.2)
        ch = ELO_K * mult * ((1 if m > 0 else 0 if m < 0 else .5) - e); elo[h] = elo.get(h, 1500.0) + ch; elo[a] = elo.get(a, 1500.0) - ch
    order = [t for ts in DIV.values() for t in ts]; vals = [elo.get(t, 1500.0) for t in order]; mean = sum(vals) / len(vals)
    return [round(v - mean, 1) for v in vals]

def qb_flags(text, season, inj_text):
    """Starting quarterbacks who show up on this week's injury report. A flag, not an adjustment: the lines already react to it."""
    if not inj_text: return None, None
    rows = [r for r in csv.DictReader(io.StringIO(text)) if r["season"] == str(season) and r["game_type"] == "REG"]
    starter = {}
    for r in sorted((r for r in rows if num(r["home_score"]) is not None), key=lambda r: int(r["week"])):
        starter[r["home_team"]] = r["home_qb_name"]; starter[r["away_team"]] = r["away_qb_name"]
    inj = [r for r in csv.DictReader(io.StringIO(inj_text)) if r["position"] == "QB"]
    if not inj: return None, None
    week = max(int(r["week"]) for r in inj); order = [t for ts in DIV.values() for t in ts]; out = {}
    for r in inj:
        if int(r["week"]) != week or starter.get(r["team"]) != r["full_name"]: continue
        status, practice = r["report_status"], r["practice_status"]
        if status in ("Out", "Doubtful", "Questionable") or practice.startswith("Did Not") or practice.startswith("Limited"):
            out[str(order.index(r["team"]))] = {"name": r["full_name"], "status": status or None, "practice": practice or None}
    return out, week

# A name for comparing sources: letters only, without suffixes (FantasyPros writes "Patrick Mahomes II" and
# "Anthony Richardson Sr.", nflverse "Patrick Mahomes").
NAME_SUFFIXES = {"jr", "sr", "ii", "iii", "iv", "v"}
def _plain(name):
    words = "".join(ch if ch.isalpha() else " " for ch in (name or "").lower()).split()
    return "".join(w for w in words if w not in NAME_SUFFIXES)

def fantasypros_qb(text, season, path=None, today=None):
    """Teams whose projected starting quarterback (FantasyPros weekly projections) is not the one who started their last game.
    A flag for the reasoning panel only. It is not used in the ratings: there is no history to backtest it against.
    Reads data/fantasypros/qb_top.json (each team's top-projected quarterback; scripts/fetch_fantasypros.py), never
    FantasyPros's raw answer, which this public repository does not keep."""
    path = path or os.path.join(ROOT, "data", "fantasypros", "qb_top.json")
    if not os.path.exists(path): return None
    try:
        raw = json.load(open(path)); teams = raw["teams"]; week = int(raw.get("week") or 0)
        fetched = datetime.datetime.fromisoformat(raw["fetched"]).date()
        best = {t: (v["name"], float(v["points"])) for t, v in teams.items() if isinstance(v, dict) and isinstance(v.get("name"), str)}
    except Exception as err:
        print("FantasyPros projections file could not be read:", err); return None
    if ((today or datetime.date.today()) - fetched).days > 4: print("FantasyPros projections are more than four days old; skipped"); return None
    rows = [r for r in csv.DictReader(io.StringIO(text)) if r["season"] == str(season) and r["game_type"] == "REG"]
    last = {}
    for r in sorted((r for r in rows if num(r["home_score"]) is not None), key=lambda r: int(r["week"])):
        last[r["home_team"]] = r["home_qb_name"]; last[r["away_team"]] = r["away_qb_name"]
    order = [t for ts in DIV.values() for t in ts]; out = {}
    for team, (name, pts) in best.items():
        if team not in last or team not in order: continue
        if pts >= 5 and _plain(name) != _plain(last[team]): out[str(order.index(team))] = {"proj": name, "last": last[team], "points": round(pts, 1)}
    return {"week": week, "fetched": raw["fetched"][:10], "teams": out}

def qb_shift(text, season, qb_text, asof=None, news=None):
    """Rating shift for each team's results rating when its current quarterback differs in quality from the ones who
    produced its results: (current starter's pre-game adjustment) - (average adjustment over the season so far), in rating points.
    Backtest (scripts/backtest_qb.py): log loss 0.6383 with the shift against 0.6391 without, and 0.6335 against 0.6345 in games after a change.
    A starter named in data/news.json with no value this season gets no shift: a stale value is not evidence."""
    order = [t for ts in DIV.values() for t in ts]; shift = [0.0] * 32; info = {}
    if not qb_text: return shift, info
    games = {}
    for r in csv.DictReader(io.StringIO(text)):
        if r["season"] == str(season) and r["game_type"] == "REG" and num(r["home_score"]) is not None and (asof is None or int(r["week"]) <= asof): games[r["game_id"]] = int(r["week"])
    per = {t: [] for t in order}; latest = {}
    for r in csv.DictReader(io.StringIO(qb_text)):
        for s in "12":
            v = num(r.get(f"qb{s}_value_post")) or num(r.get(f"qb{s}_value_pre"))
            if v is not None and r.get("season") == str(season) and (r.get("game_id") in games): latest[r[f"qb{s}"]] = v
        if r.get("game_id") not in games: continue
        for t in order:
            s = "1" if r["team1"] == QB_TEAM.get(t, t) else "2" if r["team2"] == QB_TEAM.get(t, t) else None
            adj = num(r.get(f"qb{s}_adj")) if s else None; val = num(r.get(f"qb{s}_value_pre")) if s else None
            if adj is not None and val is not None: per[t].append((games[r["game_id"]], r[f"qb{s}"], adj, val))
    change = {n["team"]: n for n in (news or []) if n.get("kind") == "qb_change" and n.get("to")} if asof is None else {}
    for i, t in enumerate(order):
        rows = sorted(per[t])
        if not rows: continue
        mean = sum(x[2] for x in rows) / len(rows); wk, name, adj, val = rows[-1]; baseline = val - adj / QB_ELO_PER_VALUE
        if t in change and "".join(c for c in change[t]["to"].lower() if c.isalpha()) != "".join(c for c in name.lower() if c.isalpha()):
            new = change[t]["to"]; nv = latest.get(new)
            if nv is None: info[str(i)] = {"qb": new, "was": name, "shift": None}; continue
            adj = QB_ELO_PER_VALUE * (nv - baseline); name = new
        shift[i] = round(adj - mean, 1)
        if abs(shift[i]) >= 12.5: info[str(i)] = {"qb": name, "shift": round(shift[i] / ELO_PER_POINT, 1), "starts": sum(1 for x in rows if x[1] == name), "games": len(rows)}
    return shift, info

def lines_before(item):
    """Home win chances seen before a news item: from the latest snapshot dated before it, plus any `lineBefore` recorded with the item."""
    out = {}; d = os.path.join(ROOT, "data", "snapshots")
    if os.path.isdir(d):
        earlier = sorted(f for f in os.listdir(d) if f.endswith(".json") and f[:10] < item.get("date", ""))
        if earlier:
            try: out.update(json.load(open(os.path.join(d, earlier[-1]))).get("lines") or {})
            except Exception: pass
    out.update(item.get("lineBefore") or {})
    return {k: v for k, v in out.items() if ("_" + item["team"] + "_") in (k + "_") or k.endswith("_" + item["team"])}

def previous_snapshot():
    """The latest saved forecast from an earlier day (or today's first one if that is all there is), for the what-changed view."""
    d = os.path.join(ROOT, "data", "snapshots")
    if not os.path.isdir(d): return None
    files = sorted(f for f in os.listdir(d) if f.endswith(".json"))
    if not files: return None
    today = datetime.date.today().isoformat(); earlier = [f for f in files if f[:10] < today]
    try: s = json.load(open(os.path.join(d, (earlier or files)[-1])))
    except Exception: return None
    return {k: s.get(k) for k in ("v", "date", "built", "teams", "playoffs", "division", "superBowl", "lines", "played", "probs", "gaps", "games") if k in s}

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
    ep = None
    if epa_fit.n >= points.n * 0.9:      # use EPA only when it covers the season so far
        ep, _ = epa_fit.solve(RESULTS_RIDGE)
        results = [(1 - EPA_WEIGHT) * p + EPA_WEIGHT * EPA_SCALE * e for p, e in zip(pt, ep)]
    else:
        results = pt
    # points each team has gained (+) or lost (-) so far from fumble bounces, for the "what could be wrong" notes
    luck = [0.0] * 32
    for r in rows:
        wk = int(r["week"])
        if num(r["home_score"]) is None or (asof is not None and wk > asof): continue
        d = FUMBLE_POINTS * (fum.get((r["game_id"], r["away_team"]), 0) - fum.get((r["game_id"], r["home_team"]), 0))
        luck[idx[r["home_team"]]] += d; luck[idx[r["away_team"]]] -= d
    today = datetime.date.today()
    return {"teams": teams, "played": played, "games": games, "built": today.strftime("%b. ") + str(today.day) + today.strftime(", %Y"),
            "rate": [round(v * ELO_PER_POINT, 1) for v in mk], "rate2": [round(v * ELO_PER_POINT, 1) for v in results],
            "rateP": [round(v * ELO_PER_POINT, 1) for v in pt], "rateE": [round(v * EPA_SCALE * ELO_PER_POINT, 1) for v in ep] if ep else None,
            "rateL": elo_ratings(text, season, asof), "luck": [round(v, 1) for v in luck],
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

def fabric_bootstrap():
    """The last saved data-fabric snapshot (data/fabric/latest.json, written by scripts/fabric-snapshot.js), embedded so the
    static page can show injuries, transactions and headlines as of the build. The page labels it with its age."""
    path = os.path.join(ROOT, "data", "fabric", "latest.json")
    if not os.path.exists(path): return None
    try: return json.load(open(path))
    except Exception as err: print("fabric snapshot unreadable, skipped:", err); return None

def assemble(page, data):
    """Fills the template: the data blob, the team entity file and the command-center modules in src/universe/
    (all .css files, then all .js files, each in file-name order). Output stays one self-contained HTML file."""
    udir = os.path.join(ROOT, "src", "universe"); files = sorted(os.listdir(udir)) if os.path.isdir(udir) else []
    css = "\n".join(open(os.path.join(udir, f)).read() for f in files if f.endswith(".css"))
    js = "\n".join("// ---- src/universe/" + f + "\n" + open(os.path.join(udir, f)).read() for f in files if f.endswith(".js"))
    # "<" is written as < in embedded JSON (same value once parsed), so no text from a feed, such as a headline
    # containing "</script" or "<!--<script", can end or confuse the script element that holds it.
    teams = json.dumps(json.load(open(os.path.join(ROOT, "shared", "teams.json"))), separators=(",", ":")).replace("<", "\\u003c")
    blob = json.dumps(data, separators=(",", ":")).replace("<", "\\u003c")
    assert "</script" not in js.lower() and "<!--" not in js
    for marker in ("/*DATA*/", "/*UNIVERSE_JS*/", "/*UNIVERSE_CSS*/", "/*TEAMS*/"):
        assert page.count(marker) <= 1, marker
        assert all(marker not in part for part in (css, js)), marker + " must not appear inside a module"
    assert page.count("/*DATA*/") == 1
    # the template writes `var UT=/*TEAMS*/null;` so it stays valid JavaScript before it is filled
    page = page.replace("/*UNIVERSE_CSS*/", css).replace("/*UNIVERSE_JS*/", js).replace("/*TEAMS*/null", teams)
    return page.replace("/*DATA*/", blob)

def reuse():
    """Rebuilds public/index.html from the current template and modules, keeping the data already in the built page
    (no downloads). Refreshes only the fabric snapshot. For working on the interface: python3 scripts/build.py --reuse"""
    import re
    built = open(os.path.join(ROOT, "public", "index.html")).read()
    m = re.search(r"^var D=(\{.*\});$", built, re.M)
    if not m: raise SystemExit("public/index.html has no data line to reuse; run a full build")
    data = json.loads(m.group(1)); data["fabric"] = fabric_bootstrap()
    page = open(os.path.join(ROOT, "src", "template.html")).read()
    open(os.path.join(ROOT, "public", "index.html"), "w").write(assemble(page, data))
    print("rebuilt public/index.html from the template, keeping data built", data.get("built"))

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--csv"); ap.add_argument("--team-stats"); ap.add_argument("--injuries"); ap.add_argument("--qb"); ap.add_argument("--season", type=int, default=2026)
    ap.add_argument("--reuse", action="store_true", help="re-render the page with the data already in public/index.html"); a = ap.parse_args()
    if a.reuse: return reuse()
    text =open(a.csv, newline="").read() if a.csv else urllib.request.urlopen(SOURCE, timeout=60).read().decode()
    if a.team_stats: stats = open(a.team_stats, newline="").read()
    else:
        try: stats = urllib.request.urlopen(TEAM_STATS.format(season=a.season), timeout=120).read().decode()
        except Exception as err: print("team stats unavailable, results rating will use scoring margin only:", err); stats = None
    data = build(text, a.season, stats)
    news_path = os.path.join(ROOT, "data", "news.json"); news = []
    if os.path.exists(news_path):
        cutoff = (datetime.date.today() - datetime.timedelta(days=10)).isoformat()
        news = [n for n in json.load(open(news_path)).get("items", []) if n.get("date", "") >= cutoff]
    if a.qb: qb_text = open(a.qb, newline="").read()
    else:
        try: qb_text = urllib.request.urlopen(QB_VALUES, timeout=120).read().decode()
        except Exception as err: print("quarterback values unavailable, no quarterback adjustment:", err); qb_text = None
    shift, data["qbShift"] = qb_shift(text, a.season, qb_text, news=news)
    data["rate2"] = [round(v + s, 1) for v, s in zip(data["rate2"], shift)]     # results rating only; the backtest found no gain on the spread rating
    data["qbCredit"] = bool(qb_text)
    order = [t for ts in DIV.values() for t in ts]
    data["news"] = [dict(n, team=order.index(n["team"]), before=lines_before(n)) for n in news if n.get("team") in order]
    data["prev"] = previous_snapshot()
    if a.injuries: inj = open(a.injuries, newline="").read()
    else:
        try: inj = urllib.request.urlopen(INJURIES.format(season=a.season), timeout=120).read().decode()
        except Exception as err: print("injury report unavailable, quarterback flags skipped:", err); inj = None
    data["qb"], data["qbWeek"] = qb_flags(text, a.season, inj)
    data["fp"] = fantasypros_qb(text, a.season)
    report_path = os.path.join(ROOT, "data", "model_report.json")
    if os.path.exists(report_path): data["report"] = json.load(open(report_path))
    page = open(os.path.join(ROOT, "src", "template.html")).read()
    assert page.count("/*DATA*/") == 1
    data["history"] = history(text, a.season, stats, page)
    owners_path = os.path.join(ROOT, "data", "pick_owners.json")
    if os.path.exists(owners_path):
        raw = json.load(open(owners_path)); order = [t for ts in DIV.values() for t in ts]
        data["owners"] = [order.index(raw[t]) if t in raw else None for t in order]
        data["ownersAsOf"] = datetime.date.fromtimestamp(os.path.getmtime(owners_path)).strftime("%b. ") + str(datetime.date.fromtimestamp(os.path.getmtime(owners_path)).day)
    data["fabric"] = fabric_bootstrap()
    os.makedirs(os.path.join(ROOT, "public"), exist_ok=True)
    open(os.path.join(ROOT, "public", "index.html"), "w").write(assemble(page, data))
    print(f"built public/index.html: {len(data['played'])} games played, {len(data['games'])} remaining, {sum(1 for g in data['games'] if g[6] is not None)} with sportsbook lines, EPA from {data['epaGames']} games")

if __name__ == "__main__": main()
