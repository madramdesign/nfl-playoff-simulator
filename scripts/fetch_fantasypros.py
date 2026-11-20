#!/usr/bin/env python3
"""Fetch quarterback projections and injury news from the FantasyPros API into data/fantasypros/.

Needs the environment variable FANTASYPROS_API_KEY. Never put the key in a file in this repository.
Terms of the free key: personal, non-commercial use, one call a second, 100 calls a day, attribution required.
This script makes three calls. Raw responses are stored as they arrive so the build can read them offline.

Usage: FANTASYPROS_API_KEY=... python3 scripts/fetch_fantasypros.py [--season 2026]
"""
import argparse, datetime, json, os, sys, time, urllib.error, urllib.parse, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = "https://api.fantasypros.com/public/v2/json/nfl"

def get(path, key, **params):
    url = f"{BASE}/{path}" + ("?" + urllib.parse.urlencode(params) if params else "")
    req = urllib.request.Request(url, headers={"x-api-key": key, "accept": "application/json", "user-agent": "nfl-playoff-simulator"})
    with urllib.request.urlopen(req, timeout=60) as res:
        return json.loads(res.read().decode())

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--season", type=int, default=2026); a = ap.parse_args()
    key = os.environ.get("FANTASYPROS_API_KEY")
    if not key: sys.exit("FANTASYPROS_API_KEY is not set")
    out = os.path.join(ROOT, "data", "fantasypros"); os.makedirs(out, exist_ok=True)
    now = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")
    calls = [("qb_projections.json", f"{a.season}/projections", dict(position="QB", scoring="STD")),
             ("injury_news.json", "news", dict(category="injury", limit=50)),
             ("players.json", "players", {})]
    failed = 0
    for name, path, params in calls:
        try:
            data = get(path, key, **params)
            json.dump({"fetched": now, "source": "FantasyPros API", "request": path, "data": data}, open(os.path.join(out, name), "w"))
            size = len(data.get("players", data.get("items", []))) if isinstance(data, dict) else len(data)
            print(f"saved {name}: {size} rows")
        except urllib.error.HTTPError as err:
            failed += 1; print(f"{name}: the API answered {err.code} {err.reason}")
        except Exception as err:
            failed += 1; print(f"{name}: {err}")
        time.sleep(1.2)      # stay under one call a second
    if failed == len(calls): sys.exit("no FantasyPros data could be fetched")

if __name__ == "__main__": main()
