#!/usr/bin/env python3
"""Checks scripts/calibration.py against hand-made fixtures (test/fixtures/calibration). Standard library, no network.
Expected values are worked out by hand in the comments. Run: python3 test/calibration.test.py"""
import importlib.util, json, math, os, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPT = os.path.join(HERE, "..", "scripts", "calibration.py")
FIX = os.path.join(HERE, "fixtures", "calibration")
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("calibration", SCRIPT); cal = importlib.util.module_from_spec(spec); spec.loader.exec_module(cal)

checks = 0
def ok(cond, msg):
    global checks
    checks += 1
    if not cond: sys.exit("FAILED: " + msg)
def near(a, b, msg): ok(a is not None and abs(a - b) < 1e-9, f"{msg}: got {a}, expected {b}")
ln = math.log

with open(os.path.join(FIX, "games.csv"), newline="") as fh: games = cal.load_games(fh.read())
snaps, skipped = cal.load_snapshots(os.path.join(FIX, "snapshots"))
per, modes = cal.evaluate(snaps, games)
by = {s["date"]: s for s in per}

# malformed snapshot is reported and skipped, not fatal
ok([s["file"] for s in skipped] == ["2026-09-11.json"], "malformed snapshot is skipped and named")
ok(sorted(by) == ["2026-09-10", "2026-09-12", "2026-09-15", "2026-09-16"], "four readable snapshots")

# --- snapshot of Sep. 10: only G2 (0.7, home won) and G3 (0.6, away won) may be scored
s = by["2026-09-10"]; sc = s["scores"]
ok(sc["n"] == 2 and sc["games"] == 2, "Sep. 10 scores exactly two games")
# leakage rule: G0 was played the day before and G1 on the snapshot's own day; both have results and must not be scored
ok(s["excluded"]["notAfterSnapshot"] == 2, "games on or before the snapshot date are not scored")
ok(s["excluded"]["tie"] == 1, "the tie is left out and counted")
ok(s["excluded"]["pending"] == 1, "the unplayed game is pending")
ok(s["excluded"]["unknownGame"] == 1 and s["excluded"]["badProbability"] == 1, "unknown id and out-of-range probability are counted")
ok(s["excluded"]["ambiguousGame"] == 1 and s["excluded"]["noGameDate"] == 1, "duplicated id and undated game are counted")
ok(s["recorded"] == sc["n"] + sum(s["excluded"].values()), "every recorded forecast is either scored or counted as left out")
near(sc["brier"], (0.3 ** 2 + 0.6 ** 2) / 2, "Sep. 10 Brier")                      # (0.09 + 0.36) / 2 = 0.225
near(sc["brier"], 0.225, "Sep. 10 Brier, literal")
near(sc["logLoss"], (-ln(0.7) - ln(0.4)) / 2, "Sep. 10 log loss")                # 0.636483
ok(abs(sc["logLoss"] - 0.636483) < 1e-6, "Sep. 10 log loss, literal")
near(sc["baselines"]["half"]["brier"], 0.25, "50% baseline Brier"); near(sc["baselines"]["half"]["logLoss"], ln(2), "50% baseline log loss")
# home rate before Sep. 10: P1, P2, P3 and G0 home wins, P4 away win = 4 of 5. G1 (same day) must not count.
near(s["homeBaseRate"]["rate"], 0.8, "Sep. 10 home rate"); ok(s["homeBaseRate"]["n"] == 5, "Sep. 10 home rate uses five games")
near(sc["baselines"]["homeRate"]["brier"], 0.34, "Sep. 10 home-rate Brier")          # (0.2^2 + 0.8^2) / 2
near(sc["baselines"]["homeRate"]["logLoss"], (-ln(0.8) - ln(0.2)) / 2, "Sep. 10 home-rate log loss")
ok(s["playedCheck"] == {"snapshot": 5, "gamesFileBeforeDate": 5}, "played cross-check")
ok(sc["tooFew"] is True, "two games are flagged as too few")
ok([(r["lo"], r["n"], r["observed"]) for r in sc["reliability"]] == [(0.6, 1, 0.0), (0.7, 1, 1.0)], "Sep. 10 reliability buckets")

# --- Sep. 12: G2 at 0.8. Home rate before it adds G1 (home win): 5 of 6
near(by["2026-09-12"]["scores"]["brier"], 0.04, "Sep. 12 Brier"); near(by["2026-09-12"]["homeBaseRate"]["rate"], 5 / 6, "Sep. 12 home rate")
ok(by["2026-09-12"]["scores"]["brierSE"] is None, "no error bar from one game")

# --- Sep. 15: G2 is already played (not scored), G7 (0.25, away won) is scored, G5 pending
s = by["2026-09-15"]
ok(s["scores"]["n"] == 1 and s["excluded"]["notAfterSnapshot"] == 1 and s["excluded"]["pending"] == 1, "Sep. 15 scores only the later game")
near(s["scores"]["brier"], 0.0625, "Sep. 15 Brier"); near(s["scores"]["logLoss"], -ln(0.75), "Sep. 15 log loss")
# home rate before Sep. 15: 5 earlier home wins + G2 + G8 = 7; away wins P4 + G3 = 2; the tie, the duplicate and the undated game are out
near(s["homeBaseRate"]["rate"], 7 / 9, "Sep. 15 home rate ignores ties"); ok(s["homeBaseRate"]["n"] == 9, "Sep. 15 home rate uses nine games")

# --- modes are kept apart
ok(sorted(modes) == ["blend", "results"], "one summary for each recorded mode")
r = modes["results"]["latestPerGame"]; ok(r["n"] == 1, "results mode has its one forecast"); near(r["brier"], 0.16, "results-mode Brier"); near(r["logLoss"], -ln(0.6), "results-mode log loss")
b = modes["blend"]
ok(b["allForecasts"]["n"] == 4 and b["allForecasts"]["games"] == 3, "blend pooled: four forecasts of three games")
near(b["allForecasts"]["brier"], 0.138125, "blend pooled Brier")          # (0.09 + 0.36 + 0.04 + 0.0625) / 4
ok(b["allForecasts"]["brierSE"] is None, "pooled forecasts repeat games, so no error bar")
lp = b["latestPerGame"]                                   # G2 from Sep. 12 (0.8), G3 from Sep. 10 (0.6), G7 from Sep. 15 (0.25)
ok(lp["n"] == 3 and lp["games"] == 3 and lp["homeWins"] == 1, "one forecast a game")
vals = [0.04, 0.36, 0.0625]; m = sum(vals) / 3
near(lp["brier"], m, "latest-per-game Brier")                                                       # 0.154167
near(lp["logLoss"], (-ln(0.8) - ln(0.4) - ln(0.75)) / 3, "latest-per-game log loss")               # 0.475706
ok(abs(lp["logLoss"] - 0.475706) < 1e-6, "latest-per-game log loss, literal")
near(lp["brierSE"], math.sqrt(sum((v - m) ** 2 for v in vals) / 2 / 3), "latest-per-game standard error")
ok(abs(lp["brierSE"] - 0.103121) < 1e-6, "latest-per-game standard error, literal")
near(lp["meanForecast"], (0.8 + 0.6 + 0.25) / 3, "mean forecast")
# each forecast is compared with the home rate known at its own snapshot: 5/6 for G2, 0.8 for G3, 7/9 for G7
near(lp["baselines"]["homeRate"]["brier"], ((1 / 6) ** 2 + 0.8 ** 2 + (7 / 9) ** 2) / 3, "latest-per-game home-rate Brier")
ok([(x["lo"], x["hi"], x["n"], x["meanForecast"], x["observed"]) for x in lp["reliability"]] == [(0.2, 0.3, 1, 0.25, 0.0), (0.6, 0.7, 1, 0.6, 0.0), (0.8, 0.9, 1, 0.8, 1.0)], "reliability table")

# --- small pieces
ok(cal.bucket(0.0) == 0 and cal.bucket(0.3) == 3 and cal.bucket(0.2999) == 2 and cal.bucket(0.7) == 7 and cal.bucket(1.0) == 9, "bucket edges")
ok(math.isfinite(cal.logloss(1.0, 0)) and math.isfinite(cal.logloss(0.0, 1)), "log loss stays finite at 0 and 1")
# a snapshot whose `date` field is later than its file name is treated as the later date
with tempfile.TemporaryDirectory() as d:
    with open(os.path.join(d, "2026-09-10.json"), "w") as fh: json.dump({"date": "2026-09-13", "mode": "blend", "lines": {"2026_02_G2": 0.7}}, fh)
    sn, _ = cal.load_snapshots(d); p2, _ = cal.evaluate(sn, games)
    ok(p2[0]["dateMismatch"] and p2[0]["scores"]["n"] == 0 and p2[0]["excluded"]["notAfterSnapshot"] == 1, "date disagreement resolves to the later date")

# --- empty cases: no snapshots, and snapshots with nothing to score
with tempfile.TemporaryDirectory() as d:
    sn, sk = cal.load_snapshots(d); p0, m0 = cal.evaluate(sn, games)
    ok(p0 == [] and m0 == {} and sk == [], "empty directory gives empty results")
    ok("No snapshots found" in cal.report(p0, m0, sk), "empty directory is reported plainly")
    ok(cal.load_snapshots(os.path.join(d, "missing")) == ([], []), "a missing directory is empty, not an error")
    e = cal.score([]); ok(e["n"] == 0 and e["brier"] is None and e["logLoss"] is None and e["reliability"] == [] and e["tooFew"], "scoring nothing gives nulls")
    with open(os.path.join(d, "2026-09-15.json"), "w") as fh: json.dump({"date": "2026-09-15", "mode": "blend", "lines": {"2026_03_G5": 0.6}}, fh)
    sn, _ = cal.load_snapshots(d); p1, m1 = cal.evaluate(sn, games)
    ok(p1[0]["scores"]["n"] == 0 and m1["blend"]["latestPerGame"]["n"] == 0 and m1["blend"]["latestPerGame"]["brier"] is None and "No forecast could be scored yet" in cal.report(p1, m1, []), "only pending games: nothing scored, said plainly")
    # an empty games file: every forecast is an unknown game
    pe, me = cal.evaluate(sn, cal.load_games("game_id,season\n"))
    ok(pe[0]["excluded"]["unknownGame"] == 1 and me["blend"]["allForecasts"]["n"] == 0 and pe[0]["homeBaseRate"]["rate"] is None, "empty games file scores nothing")

# --- the command line: reads files, writes JSON to --out, says the sample is too small
with tempfile.TemporaryDirectory() as d:
    out = os.path.join(d, "calibration.json")
    run = subprocess.run([sys.executable, "-B", SCRIPT, "--snapshots", os.path.join(FIX, "snapshots"), "--games", os.path.join(FIX, "games.csv"), "--out", out], capture_output=True, text=True)
    ok(run.returncode == 0, "command line exits cleanly: " + run.stderr)
    ok("too few to conclude anything" in run.stdout and "skipped snapshot 2026-09-11.json" in run.stdout, "summary states the small sample and the skipped file")
    with open(out) as fh: doc = json.load(fh)
    ok(doc["kind"] == "descriptive" and doc["gamesSource"]["file"] == "games.csv" and "retrievedAt" in doc["gamesSource"], "JSON carries kind and provenance")
    near(doc["modes"]["blend"]["latestPerGame"]["brier"], m, "JSON matches the computed score")
    ok(len(doc["snapshots"]) == 4 and doc["rules"]["minGamesForAnyReading"] == cal.MIN_GAMES, "JSON lists snapshots and rules")

# --- newer snapshots also record each mode's own game probabilities (`probs`); they are scored as separate series
# under the same leakage rule. Sep. 10 snapshot: G2 (home won) and G3 (away won) at 0.5 each -> Brier 0.25; G0 was
# already played and must not be scored.
first = dict(snaps[0], probs={"results": {"2026_01_G0": 0.9, "2026_02_G2": 0.5, "2026_02_G3": 0.5}})
per2, modes2 = cal.evaluate([first], games)
mr = modes2["model: results"]["latestPerGame"]
ok(mr["n"] == 2, "a mode's own probabilities are scored on the same two games")
near(mr["brier"], 0.25, "and scored by hand: two 50% forecasts")
ok(per2[0]["model"]["model: results"]["excluded"]["notAfterSnapshot"] == 1, "the leakage rule applies to them too")
near(modes2["blend"]["latestPerGame"]["brier"], by["2026-09-10"]["scores"]["brier"], "the sportsbook-line series is unchanged by their presence")
ok(cal.evaluate(snaps, games)[1].keys() == modes.keys(), "snapshots without `probs` score exactly as before")

print(f"ok: calibration tracking passes ({checks} checks)")
