#!/usr/bin/env python3
"""Fetch FantasyPros quarterback projections and keep only what the page uses: each team's top-projected quarterback.

Needs the environment variable FANTASYPROS_API_KEY. Never put the key in a file in this repository.
Terms (FantasyPros API & Data Terms of Use, Oct. 27, 2020): personal, non-commercial use only; no historical player
statistics or player image URLs; key kept confidential; one call a second and 100 a day (500 on the owner's plan);
cache rather than poll; published work based on the data must conspicuously say it uses data obtained from FantasyPros.
This repository is public, so FantasyPros's raw answer is never written into it: the script makes one call and writes
data/fantasypros/qb_top.json, each team's top-projected quarterback with his projected points, credited to FantasyPros.
The build compares that name with the team's last starter (a flag for the reasoning panel, not a model input).

Usage: FANTASYPROS_API_KEY=... python3 scripts/fetch_fantasypros.py [--season 2026]
       python3 scripts/fetch_fantasypros.py --from-file answer.json [--out DIR]   (derive from a saved answer, no call)
       ... --raw DIR   (also keep the raw answer for inspection, in a folder outside this repository)
"""
import argparse, datetime, json, os, sys, urllib.error, urllib.parse, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = "https://api.fantasypros.com/public/v2/json/nfl"
CREDIT = "Quarterback projections are based on data obtained from FantasyPros"
# FantasyPros team ids that differ from nflverse's
FP_TEAM = {"JAC": "JAX", "LAR": "LA", "WSH": "WAS", "GBP": "GB", "KCC": "KC", "NEP": "NE", "NOS": "NO", "SFO": "SF", "TBB": "TB", "LVR": "LV"}

def get(path, key, **params):
    url = f"{BASE}/{path}" + ("?" + urllib.parse.urlencode(params) if params else "")
    req = urllib.request.Request(url, headers={"x-api-key": key, "accept": "application/json", "user-agent": "nfl-playoff-simulator"})
    with urllib.request.urlopen(req, timeout=60) as res:
        return json.loads(res.read().decode())

def top_qbs(data):
    """Pure: each team's top-projected quarterback in a FantasyPros projections answer, {nflverse team: {name, points}}.
    Raises ValueError, naming the answer's keys only, when it has no list of players."""
    players = data.get("players") if isinstance(data, dict) else None
    if not isinstance(players, list):
        raise ValueError("no players list in the answer (keys: " + (", ".join(sorted(data)) if isinstance(data, dict) else type(data).__name__) + ")")
    best = {}
    for p in players:
        if not isinstance(p, dict): continue
        team, name = FP_TEAM.get(p.get("team_id"), p.get("team_id")), p.get("name")
        try: pts = float((p.get("stats") or {}).get("points"))
        except (TypeError, ValueError): continue
        # "FA": FantasyPros's code for free agents, who have no team to flag
        if not isinstance(team, str) or not team or team == "FA" or not isinstance(name, str) or not name.strip() or pts != pts: continue
        if team not in best or pts > best[team]["points"]: best[team] = {"name": name.strip()[:60], "points": round(pts, 1)}
    return best

def derive(data, fetched, season):
    """Pure: the file this repository keeps, from one projections answer."""
    try: week = int(data.get("week") or 0) if isinstance(data, dict) else 0
    except (TypeError, ValueError): week = 0
    return {"fetched": fetched, "source": "FantasyPros API", "credit": CREDIT, "season": season, "week": week, "teams": top_qbs(data)}

def inside_repo(path):
    root, p = os.path.realpath(ROOT), os.path.realpath(path)
    return p == root or p.startswith(root + os.sep)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--season", type=int, default=2026)
    ap.add_argument("--from-file", help="derive from a saved answer instead of calling the API")
    ap.add_argument("--out", default=os.path.join(ROOT, "data", "fantasypros"), help="where qb_top.json is written")
    ap.add_argument("--raw", help="also keep the raw answer here (must be outside this repository)")
    a = ap.parse_args()
    if a.raw and inside_repo(a.raw): sys.exit("--raw must be a folder outside this repository: FantasyPros's raw data is not published")
    fetched = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")
    if a.from_file:
        data = json.load(open(a.from_file))
    else:
        key = os.environ.get("FANTASYPROS_API_KEY")
        if not key: sys.exit("FANTASYPROS_API_KEY is not set")
        try: data = get(f"{a.season}/projections", key, position="QB", scoring="STD")
        except urllib.error.HTTPError as err: sys.exit(f"the API answered {err.code} {err.reason}")
        except Exception as err: sys.exit(f"no answer from the API: {err}")
    if a.raw:
        os.makedirs(a.raw, exist_ok=True)
        json.dump({"fetched": fetched, "data": data}, open(os.path.join(a.raw, "qb_projections.json"), "w"))
    try: out = derive(data, fetched, a.season)
    except ValueError as err: sys.exit(f"the answer was not in the expected form: {err}")
    # the answer's shape, never its contents, so a first run's log shows whether the field names were right
    print("answer keys:", ", ".join(sorted(data)) if isinstance(data, dict) else type(data).__name__,
          "| players:", len(data.get("players") or []) if isinstance(data, dict) else 0, "| week:", out["week"], "| teams with a quarterback:", len(out["teams"]))
    if not out["teams"]: sys.exit("no team's quarterback could be read from the answer; nothing written")
    os.makedirs(a.out, exist_ok=True)
    json.dump(out, open(os.path.join(a.out, "qb_top.json"), "w"), indent=1, sort_keys=True)
    print(f"saved qb_top.json: {len(out['teams'])} teams, week {out['week']}")

if __name__ == "__main__": main()
