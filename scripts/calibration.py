#!/usr/bin/env python3
"""Calibration tracking: scores this season's saved forecasts (data/snapshots/YYYY-MM-DD.json) against actual results.

Usage: python3 scripts/calibration.py [--snapshots DIR] [--games games.csv] [--out data/calibration.json]
Standard library only. Without --games the nflverse games file is downloaded (the same file scripts/build.py uses).
Prints a summary; --out also writes the same numbers as JSON (intended location: data/calibration.json, written by
the daily refresh, not by hand). Everything here is DESCRIPTIVE: it measures forecasts already made. It changes no
model and fits nothing.

What is scored: each home-win probability in a snapshot's `lines` map (game id -> probability). scripts/snapshot.js
stores there the sportsbook moneyline probability with the bookmaker margin removed, for games that had a line; the
blend and sportsbook modes use that number unchanged. So today this measures the market input the forecast leans on,
not the ratings (see docs/CALIBRATION.md).

Leakage rules:
  * a forecast is scored only if the game's date (nflverse `gameday`, US Eastern) is strictly AFTER the snapshot's
    date (also US Eastern). Snapshots carry no time of day, so a game on the snapshot's own day is left out: it may
    already have kicked off;
  * the forecast is read from the snapshot file alone. The games file supplies only the game date and the final
    score; its current betting lines are never read;
  * the home-team base rate used as a baseline for a snapshot counts only games dated before that snapshot.
Ties are left out of every score and counted. Every excluded forecast is counted under a named reason.
"""
import argparse, csv, datetime, io, json, math, os, re, sys, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE = "https://raw.githubusercontent.com/nflverse/nfldata/master/data/games.csv"     # same file as scripts/build.py
EPS = 1e-6               # probabilities are clamped to [EPS, 1-EPS] for log loss only, so a 0 or 1 cannot give infinity
BUCKETS = 10             # reliability table: ten equal buckets of home-win probability, [lo, hi), the last one includes 1
MIN_GAMES = 100          # fewer distinct games than this: the output says it is too few to conclude anything
NAME = re.compile(r"^(\d{4}-\d{2}-\d{2})\.json$")
REASONS = ("notAfterSnapshot", "pending", "tie", "unknownGame", "ambiguousGame", "noGameDate", "badProbability")

def num(x):
    try:
        v = float(x)
        return v if math.isfinite(v) else None
    except (TypeError, ValueError): return None

def day(s):
    try: return datetime.date.fromisoformat((s or "").strip())
    except ValueError: return None

def load_games(text):
    """game id -> {day, result, season}; result is 1 home win, 0 away win, 'tie', or None while unplayed.
    An id that appears on more than one row is ambiguous and is never scored."""
    games, seen = {}, set()
    for r in csv.DictReader(io.StringIO(text)):
        gid = (r.get("game_id") or "").strip()
        if not gid: continue
        if gid in seen: games[gid] = {"ambiguous": True}; continue
        seen.add(gid)
        hs, as_ = num(r.get("home_score")), num(r.get("away_score"))
        res = None if hs is None or as_ is None else ("tie" if hs == as_ else (1 if hs > as_ else 0))
        games[gid] = {"day": day(r.get("gameday")), "result": res, "season": (r.get("season") or "").strip(), "reg": r.get("game_type") == "REG"}
    return games

def load_snapshots(directory):
    """Every YYYY-MM-DD.json in the directory, oldest first. Unreadable or malformed files are reported, not fatal."""
    snaps, skipped = [], []
    names = sorted(n for n in os.listdir(directory) if NAME.match(n)) if os.path.isdir(directory) else []
    for n in names:
        try:
            with open(os.path.join(directory, n)) as f: s = json.load(f)
            if not isinstance(s, dict) or not isinstance(s.get("lines"), dict): raise ValueError("no `lines` map")
            fd, sd = day(NAME.match(n).group(1)), day(str(s.get("date", "")))
            if fd is None: raise ValueError("file name is not a date")
            # the later of the file's name and its own `date` field, so a mislabelled file cannot be scored early
            snaps.append({"file": n, "day": max(fd, sd) if sd else fd, "dateMismatch": sd != fd, "mode": str(s.get("mode") or "unspecified"),
                          "lines": s["lines"], "probs": {k: v for k, v in (s.get("probs") or {}).items() if isinstance(v, dict)} if isinstance(s.get("probs"), dict) else {}, "played": s.get("played") if isinstance(s.get("played"), int) else None})
        except (OSError, ValueError) as err: skipped.append({"file": n, "why": str(err)})
    return snaps, skipped

def home_rate(games, before, season):
    """Share of home wins among decided regular-season games of the season dated before `before` (ties left out)."""
    w = n = 0
    for g in games.values():
        if g.get("ambiguous") or not g["reg"] or g["season"] != season or g["day"] is None or g["day"] >= before or g["result"] in (None, "tie"): continue
        n += 1; w += g["result"]
    return (w / n if n else None), n

def bucket(p): return min(int(round(p * 10 ** 6)) // (10 ** 6 // BUCKETS), BUCKETS - 1)
def brier(p, y): return (p - y) ** 2
def logloss(p, y):
    p = min(max(p, EPS), 1 - EPS)
    return -math.log(p if y else 1 - p)
def mean(v): return sum(v) / len(v)

def score(rows, independent=True):
    """rows: dicts with p (forecast home-win probability), y (1 home win, 0 away win), base (home rate known at the
    forecast's snapshot, or None). Returns the descriptive scores, or nulls when there is nothing to score."""
    n = len(rows); ids = {r["id"] for r in rows}
    out = {"n": n, "games": len(ids), "brier": None, "logLoss": None, "brierSE": None, "homeWins": None, "meanForecast": None,
           "baselines": {"half": None, "homeRate": None}, "reliability": [],
           "tooFew": len(ids) < MIN_GAMES}
    if not n: return out
    b = [brier(r["p"], r["y"]) for r in rows]
    out.update(brier=mean(b), logLoss=mean([logloss(r["p"], r["y"]) for r in rows]), homeWins=sum(r["y"] for r in rows), meanForecast=mean([r["p"] for r in rows]))
    # standard error of the mean Brier score; only meaningful when each game appears once
    if independent and n > 1: out["brierSE"] = math.sqrt(sum((x - out["brier"]) ** 2 for x in b) / (n - 1) / n)
    out["baselines"]["half"] = {"brier": 0.25, "logLoss": math.log(2), "n": n}
    based = [r for r in rows if r["base"] is not None]
    if len(based) == n:
        out["baselines"]["homeRate"] = {"brier": mean([brier(r["base"], r["y"]) for r in based]), "logLoss": mean([logloss(r["base"], r["y"]) for r in based]), "n": n}
    for k in range(BUCKETS):
        hit = [r for r in rows if bucket(r["p"]) == k]
        if hit: out["reliability"].append({"lo": k / BUCKETS, "hi": (k + 1) / BUCKETS, "n": len(hit), "meanForecast": mean([r["p"] for r in hit]), "observed": mean([r["y"] for r in hit])})
    return out

def series_of(s):
    """What a snapshot recorded: its `lines` map (the sportsbook probability, under the snapshot's mode name, as before),
    then, in newer snapshots, the per-mode game probabilities in `probs` under "model: <mode>"."""
    return [(s["mode"], s["lines"], True)] + [("model: " + k, v, False) for k, v in sorted(s["probs"].items())]

def evaluate(snaps, games):
    """Applies the leakage rule and scores. Returns (per-snapshot list, per-series summary)."""
    per, by_mode = [], {}
    for s0 in snaps:
      extra = {}
      for name, forecasts, primary in series_of(s0):
        s = dict(s0, lines=forecasts, mode=name)
        excluded = dict.fromkeys(REASONS, 0); rows = []
        seasons = [games[g]["season"] for g in s["lines"] if g in games and not games[g].get("ambiguous")]
        season = max(set(seasons), key=seasons.count) if seasons else None
        base, base_n = home_rate(games, s["day"], season) if season else (None, 0)
        for gid, raw in s["lines"].items():
            g = games.get(gid); p = None if isinstance(raw, bool) else num(raw)
            if g is None: excluded["unknownGame"] += 1
            elif g.get("ambiguous"): excluded["ambiguousGame"] += 1
            elif p is None or not 0 <= p <= 1: excluded["badProbability"] += 1
            elif g["day"] is None: excluded["noGameDate"] += 1
            elif g["day"] <= s["day"]: excluded["notAfterSnapshot"] += 1       # the leakage rule
            elif g["result"] is None: excluded["pending"] += 1
            elif g["result"] == "tie": excluded["tie"] += 1
            else: rows.append({"id": gid, "p": p, "y": g["result"], "base": base, "snap": s["day"]})
        known = sum(1 for g in games.values() if not g.get("ambiguous") and g["reg"] and g["season"] == season and g["day"] is not None and g["day"] < s["day"] and g["result"] is not None) if season else None
        by_mode.setdefault(s["mode"], []).extend(rows)
        if not primary: extra[name] = {"recorded": len(forecasts), "excluded": excluded, "scores": score(rows)}; continue
        per.append({"date": s["day"].isoformat(), "file": s["file"], "dateMismatch": s["dateMismatch"], "mode": s["mode"], "recorded": len(s["lines"]),
                    "excluded": excluded, "homeBaseRate": {"rate": base, "n": base_n},
                    # a cross-check, not a filter: how many results the snapshot says it had against how many the games file dates before it
                    "playedCheck": {"snapshot": s["played"], "gamesFileBeforeDate": known},
                    "scores": score(rows), "model": extra})
    modes = {}
    for m, rows in by_mode.items():
        latest = {}
        for r in rows:                                   # one forecast a game: the last snapshot before its game day
            if r["id"] not in latest or r["snap"] > latest[r["id"]]["snap"]: latest[r["id"]] = r
        modes[m] = {"snapshots": sum(1 for s in snaps if m in [n for n, _, _ in series_of(s)]),
                    "latestPerGame": score(sorted(latest.values(), key=lambda r: r["id"])),
                    "allForecasts": score(rows, independent=False)}
    return per, modes

def f(v, d=4): return "   n/a" if v is None else f"{v:.{d}f}"

def line(label, sc):
    b = sc["baselines"]; hr = b["homeRate"] or {}; hf = b["half"] or {}
    se = f" +/-{sc['brierSE']:.3f}" if sc["brierSE"] is not None else ""
    return (f"  {label:<22} n={sc['n']:<4} games={sc['games']:<4} Brier {f(sc['brier'])}{se}  log loss {f(sc['logLoss'])}"
            f"  | always 50%: {f(hf.get('brier'))} / {f(hf.get('logLoss'))}  | home rate: {f(hr.get('brier'))} / {f(hr.get('logLoss'))}")

def report(per, modes, skipped):
    out = ["Calibration of saved forecasts against results (descriptive: scores forecasts already made; nothing is fitted)",
           "Scored: each home-win probability in a snapshot's `lines`, for games dated after the snapshot and now final.",
           "Lower is better for both scores. Baselines are scored on the same games: 'always 50%' and the home-team win",
           "rate in games dated before the snapshot. Each cell shows Brier / log loss.", ""]
    if not per: out.append("No snapshots found.")
    for m in sorted(modes):
        out.append(f"Win-chance mode recorded in the snapshots: {m} (snapshots: {modes[m]['snapshots']})")
        for s in per:
            if s["mode"] != m: continue
            ex = ", ".join(f"{k} {v}" for k, v in s["excluded"].items() if v) or "none"
            out.append(line(s["date"], s["scores"]))
            rate = s["homeBaseRate"]
            out.append(f"      recorded {s['recorded']}, left out: {ex}; home rate before this date {f(rate['rate'], 3).strip()} from {rate['n']} games"
                       + ("; FILE NAME AND DATE FIELD DISAGREE, later date used" if s["dateMismatch"] else ""))
            pc = s["playedCheck"]
            if pc["snapshot"] is not None and pc["gamesFileBeforeDate"] is not None and pc["snapshot"] != pc["gamesFileBeforeDate"]:
                out.append(f"      note: the snapshot says it had {pc['snapshot']} results; the games file dates {pc['gamesFileBeforeDate']} before it (a cross-check, not a filter)")
        lp, al = modes[m]["latestPerGame"], modes[m]["allForecasts"]
        out.append(line("one forecast a game", lp))
        out.append(line("all forecasts pooled", al))
        out.append("      'one forecast a game' keeps the last snapshot before each game. The pooled row repeats the same games across")
        out.append("      snapshots, so its forecasts are not independent and it has no error bar.")
        if lp["n"]:
            out.append(f"  Reliability, one forecast a game ({lp['n']} games; home team won {lp['homeWins']}, mean forecast {lp['meanForecast']:.3f}):")
            out.append("      forecast bucket    games   mean forecast   home team won")
            for r in lp["reliability"]:
                out.append(f"      {r['lo']:.1f} to {r['hi']:.1f}        {r['n']:>5}   {r['meanForecast']:>13.3f}   {r['observed']:>13.3f}")
        if not lp["n"]:
            out.append("  No forecast could be scored yet: no recorded game is both dated after its snapshot and final.")
        elif lp["tooFew"]:
            out.append(f"  SAMPLE SIZE: {lp['games']} distinct games. That is too few to conclude anything (this script asks for at least {MIN_GAMES}")
            out.append("  before a reading is even suggestive). Do not read these numbers as evidence for or against the forecast.")
        else:
            out.append(f"  SAMPLE SIZE: {lp['games']} distinct games. Still one partial season: a difference smaller than about two error bars is noise.")
        out.append("")
    for s in skipped: out.append(f"skipped snapshot {s['file']}: {s['why']}")
    return "\n".join(out).rstrip() + "\n"

def main(argv=None):
    ap = argparse.ArgumentParser(description="Score saved forecasts against results (descriptive; no model change).")
    ap.add_argument("--snapshots", default=os.path.join(ROOT, "data", "snapshots"), help="directory of YYYY-MM-DD.json snapshots")
    ap.add_argument("--games", help="nflverse games.csv; downloaded when omitted")
    ap.add_argument("--out", help="also write the results as JSON here (intended: data/calibration.json)")
    a = ap.parse_args(argv)
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    if a.games:
        with open(a.games, newline="") as fh: text = fh.read()
        source = {"file": os.path.basename(a.games)}
    else:
        try: text = urllib.request.urlopen(SOURCE, timeout=60).read().decode()
        except Exception as err:
            print("could not download the games file; pass one with --games <games.csv>:", err, file=sys.stderr); return 2
        source = {"url": SOURCE}
    source["retrievedAt"] = now
    games = load_games(text)
    snaps, skipped = load_snapshots(a.snapshots)
    per, modes = evaluate(snaps, games)
    sys.stdout.write(report(per, modes, skipped))
    if a.out:
        doc = {"kind": "descriptive", "generatedAt": now, "gamesSource": source,
               "scored": "home-win probability in each snapshot's `lines` (sportsbook moneyline, margin removed, as saved by scripts/snapshot.js)",
               "rules": {"leakage": "scored only when the game's date is strictly after the snapshot's date; forecasts come from the snapshot file alone",
                         "ties": "left out and counted", "logLossClamp": EPS, "buckets": BUCKETS, "minGamesForAnyReading": MIN_GAMES,
                         "homeRateBaseline": "home wins among decided regular-season games of the season dated before the snapshot"},
               "snapshots": per, "modes": modes, "skippedSnapshots": skipped}
        os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
        with open(a.out, "w") as fh: json.dump(doc, fh, indent=1); fh.write("\n")
        print("wrote", a.out)
    return 0

if __name__ == "__main__":
    sys.exit(main())
