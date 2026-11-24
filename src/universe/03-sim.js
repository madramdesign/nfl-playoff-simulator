// Simulations for the command center. They run in a Web Worker built from the engine script's own text, so the page never
// blocks; if workers or blob URLs are refused (some browsers on file: pages), a smaller run happens on the main thread.
// The worker gets a fresh copy of the engine (no what-if setting); the main-thread fallback saves, clears and restores it.
var SIM_BASE_N = 20000, SIM_FALLBACK_N = 4000, SIM_DEEP_BATCH = 10000, SIM_DEEP_BATCHES = 10;
var sim = { worker: null, ok: null, seq: 0, pending: {}, queue: [] };
var WORKER_TAIL = "\n;self.onmessage=function(e){var m=e.data;try{if(m.mode!=null&&m.mode!==MODE)setMode(m.mode);" +
  "var r=simulate(m.picks,m.focus||0,m.n,m.liveP||null,false,m.watch||null,m.seed==null?undefined:m.seed);" +
  "self.postMessage({id:m.id,ok:true,r:r})}catch(err){self.postMessage({id:m.id,ok:false,error:String(err&&err.message||err)})}};";

function workerFailed() {
  if (sim.ok === false) return;
  sim.ok = false;
  try { if (sim.worker) sim.worker.terminate(); } catch (e) { /* ignore */ }
  sim.worker = null;
  var pend = sim.pending; sim.pending = {};
  Object.keys(pend).forEach(function (id) { runOnMain(pend[id].job, pend[id].cb); });
}
function getWorker() {
  if (sim.ok === false) return null;
  if (sim.worker) return sim.worker;
  try {
    var src = byId("engine").textContent + WORKER_TAIL;
    var url = URL.createObjectURL(new Blob([src], { type: "text/javascript" }));
    var w = new Worker(url);
    w.onmessage = function (e) {
      var m = e.data, p = sim.pending[m.id];
      sim.ok = true;
      if (!p) return;
      delete sim.pending[m.id]; clearTimeout(p.watchdog);
      if (m.ok) p.cb(null, leagueOnly(m.r), "worker"); else p.cb(new Error(m.error), null, "worker");
    };
    w.onerror = function (e) { if (e && e.preventDefault) e.preventDefault(); workerFailed(); };
    sim.worker = w;
    return w;
  } catch (e) { sim.ok = false; return null; }
}
function runOnMain(job, cb) {
  setTimeout(function () {
    var keepMode = MODE, r, err = null;
    try {
      if (job.mode != null && job.mode !== MODE) setMode(job.mode);
      r = withoutTweak(function () { return simulate(job.picks, 0, Math.min(job.n, job.mainN || SIM_FALLBACK_N), job.liveP || null, false, job.watch || null, job.seed == null ? undefined : job.seed); });
    } catch (e) { err = e; }
    if (MODE !== keepMode) setMode(keepMode);
    cb(err, r ? leagueOnly(r) : r, "main");
  }, 30);
}
// job: {picks, liveP, watch, n, seed, mode}; cb(err, result, where)
function runSim(job, cb) {
  var w = getWorker();
  if (!w) { runOnMain(job, cb); return; }
  var id = ++sim.seq;
  // If the first answer never comes (a worker that silently fails to start), fall back after 25 s.
  var watchdog = sim.ok ? 0 : setTimeout(function () { if (sim.pending[id] && sim.ok !== true) workerFailed(); }, 25000);
  sim.pending[id] = { job: job, cb: cb, watchdog: watchdog };
  try { w.postMessage({ id: id, picks: job.picks, liveP: job.liveP || null, watch: job.watch || null, n: job.n, seed: job.seed, mode: job.mode, focus: 0 }); }
  catch (e) { delete sim.pending[id]; workerFailed(); runOnMain(job, cb); }
}

// simulate() also counts figures for the simulator's chosen team: lev (each game's swing for that team) and hist (its
// win totals). The command center runs league-wide with focus 0, so those would quietly describe team 0. They are
// dropped here, so a result can never be read as if they meant something.
function leagueOnly(r) { if (r) { r.lev = null; r.hist = null; } return r; }
// Pure: adds simulation b's counts into a (same games, same teams). Used to sum independent deep-run batches.
function addSimCounts(a, b) {
  if (!a) {
    a = { n: 0, open: b.open, first: b.first, lev: null, hist: null, watch: {} };
    ["po", "dv", "sw", "rDiv", "rConf", "rSB", "wSB", "draftSum", "draftN", "pick1", "top5"].forEach(function (k) { a[k] = new Float64Array(b[k].length); });
    a.seedC = b.seedC.map(function (r) { return r.map(function () { return 0; }); });
  }
  a.n += b.n;
  ["po", "dv", "sw", "rDiv", "rConf", "rSB", "wSB", "draftSum", "draftN", "pick1", "top5"].forEach(function (k) { for (var i = 0; i < b[k].length; i++) a[k][i] += b[k][i]; });
  b.seedC.forEach(function (r, i) { r.forEach(function (v, j) { a.seedC[i][j] += v; }); });
  for (var wk in (b.watch || {})) {
    var s = b.watch[wk], t = a.watch[wk] || (a.watch[wk] = { nH: 0, nA: 0, H: new Float64Array(s.H.length), A: new Float64Array(s.A.length) });
    t.nH += s.nH; t.nA += s.nA; for (var i2 = 0; i2 < s.H.length; i2++) { t.H[i2] += s.H[i2]; t.A[i2] += s.A[i2]; }
  }
  return a;
}

// Runs fn with the simulator's what-if setting cleared, then restores it: command-center numbers never include a what-if.
function withoutTweak(fn) {
  var saved = Array.prototype.map.call(TWEAK, function (v) { return v / 25; }), any = saved.some(function (v) { return v !== 0; }), out;
  if (any) setTweak([]);
  try { out = fn(); } finally { if (any) setTweak(saved); }
  return out;
}
// This page's in-game chance for a live game (engine model, no what-if).
function pageLiveProb(g) {
  var m = parseClock(g.clock), q = Math.min(5, Math.max(1, g.period || 1));
  return withoutTweak(function () { return liveProbFor(g.gi, { a: g.awayScore, h: g.homeScore, q: q, m: m == null ? 15 : m }); });
}
// What the feed says has already happened. A decisive final becomes a pick for the winner; a tied final is left to the
// simulation (the engine cannot pick ties). A game counts as live only by gameIsLive (live data, source ok and recent):
// it then uses the feed's in-game chance where the feed gives one, else this page's in-game model.
// meta: {origin, fetchedAt, fails}; now: ms.
function feedInputs(M, meta, now) {
  meta = meta || {}; now = now == null ? Date.now() : now;
  var picks = GAMES.map(function () { return 0; }), liveP = GAMES.map(function () { return null; });
  var out = { finals: 0, ties: 0, lives: 0, feedLive: 0, staleLive: 0 };
  (M ? M.games : []).forEach(function (g) {
    if (g.gi < 0) return;
    if (g.state === "post" && num(g.awayScore) != null && num(g.homeScore) != null) {
      if (g.awayScore === g.homeScore) out.ties++;
      else { picks[g.gi] = g.homeScore > g.awayScore ? 2 : 1; out.finals++; }
    } else if (g.state === "in") {
      if (!gameIsLive(g, M, meta, now) || num(g.awayScore) == null || num(g.homeScore) == null) { out.staleLive++; return; }
      var fp = g.winProb && num(g.winProb.home) != null ? g.winProb.home : null;
      liveP[g.gi] = clamp(fp != null ? fp : pageLiveProb(g), 0.001, 0.999); out.lives++; if (fp != null) out.feedLive++;
    }
  });
  out.picks = picks; out.liveP = out.lives ? liveP : null;
  return out;
}
function parseClock(c) { var m = /^(\d{1,2}):(\d{2})$/.exec(String(c || "")); return m ? +m[1] + m[2] / 60 : null; }
function watchList(M) { return (M ? M.games : []).filter(function (g) { return g.gi >= 0 && g.state !== "post"; }).map(function (g) { return g.gi; }); }
// The simulator view saves its win-chance mode ({m: 0|1|2} in "nfl-picks-2026"); the command center starts in the same one.
function savedSimMode(raw) {
  try { var s = JSON.parse(raw || "null"); return s && (s.m === 0 || s.m === 1 || s.m === 2) ? s.m : null; } catch (e) { return null; }
}
NFLU.savedSimMode = savedSimMode;
function liveMeta() { return { origin: store.get("origin"), fetchedAt: store.get("fetchedAt"), fails: store.get("pollFails") }; }
function simInputs() {
  var M = store.get("model"), inp = feedInputs(M, liveMeta(), Date.now()), watch = watchList(M);
  inp.watch = watch;
  inp.key = JSON.stringify([inp.picks, inp.liveP && inp.liveP.map(function (p) { return p == null ? null : Math.round(p * 100); }), watch, MODE]);
  return inp;
}
function simRecord(r, where, t0, inp, mode, deep) {
  return { r: r, n: r.n, where: where, ms: Date.now() - t0, finals: inp.finals, ties: inp.ties, lives: inp.lives, feedLive: inp.feedLive, staleLive: inp.staleLive,
    watch: inp.watch, at: Date.now(), mode: mode, deep: deep, key: inp.key };
}
// Why the playoff chances moved since the saved forecast (F04): one run in the blend, from the build's data with no picks,
// live games or what-ifs, watching the games whose chance has moved. Once per page load, when first asked for, and only
// when the saved forecast carries the figures (version 2).
var whyAsked = false;
function requestWhySim() {
  if (whyAsked) return;
  whyAsked = true;
  var w = changeWatch(D.prev);
  // later, never inside the render that asked (a store change re-renders the drawer)
  if (!w) { setTimeout(function () { store.set({ why: { unavailable: D.prev ? "old" : "none", date: D.prev ? D.prev.date : null } }); }, 0); return; }
  runSim({ picks: GAMES.map(function () { return 0; }), watch: w, n: SIM_BASE_N, mode: 2 }, function (err, r) {
    var e = err || !r ? null : explainChange(D.prev, r);
    store.set({ why: e ? e : { unavailable: err ? "error" : "old", date: D.prev.date, error: err ? String(err.message || err) : null } });
  });
}
var simTimer = 0, simKey = "", simSeq = 0;
function requestBaseSim(force) {
  var inp = simInputs();
  if (!force && inp.key === simKey) return;
  simKey = inp.key;
  clearTimeout(simTimer);
  simTimer = setTimeout(function () {
    var seq = ++simSeq, t0 = Date.now(), mode = MODE;
    store.set({ simBusy: true });
    runSim({ picks: inp.picks, liveP: inp.liveP, watch: inp.watch, n: SIM_BASE_N, mode: mode }, function (err, r, where) {
      if (seq !== simSeq) return;   // a newer request superseded this one
      if (err || !r) { store.set({ simBusy: false, simError: String(err && err.message || err) }); return; }
      store.set({ simBusy: false, simError: null, sim: simRecord(r, where, t0, inp, mode, false) });
    });
  }, 60);
}
// 100,000 seasons as ten independent batches of 10,000 (seeds 1 to 10, DEC-015), summed. Worker only. If the inputs
// change while it runs (new results, a mode change), the result is discarded rather than shown over newer numbers.
function runDeep() {
  if (store.get("deepProgress") != null) return;
  if (sim.ok === false || !getWorker()) { store.set({ deepError: "The deep run needs Web Workers, which this browser refused for this page." }); return; }
  var inp = simInputs(), acc = null, k = 0, t0 = Date.now(), mode = MODE;
  store.set({ deepProgress: 0, deepError: null });
  (function next() {
    runSim({ picks: inp.picks, liveP: inp.liveP, watch: inp.watch, n: SIM_DEEP_BATCH, seed: k + 1, mode: mode }, function (err, r, where) {
      if (err || !r || where !== "worker") { store.set({ deepProgress: null, deepError: "The deep run stopped: " + (err ? err.message : "the worker was unavailable") + "." }); return; }
      acc = addSimCounts(acc, r); k++;
      if (k < SIM_DEEP_BATCHES) { store.set({ deepProgress: k / SIM_DEEP_BATCHES }); next(); return; }
      if (simInputs().key !== inp.key) { store.set({ deepProgress: null, deepError: "The inputs changed while the deep run was going (new results or a different mode), so its result was discarded. Run it again." }); return; }
      simSeq++;   // an older base run still in flight must not replace this one
      store.set({ deepProgress: null, sim: simRecord(acc, "worker", t0, inp, mode, true) });
    });
  })();
}
NFLU.addSimCounts = addSimCounts;
NFLU.leagueOnly = leagueOnly;
NFLU.feedInputs = feedInputs;
NFLU.withoutTweak = withoutTweak;
