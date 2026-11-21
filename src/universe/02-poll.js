// Polling /api/universe. Only when the page is served over http(s); a static copy (file: or a host with no server)
// keeps the embedded snapshot and says so. Every 20 s while a game is live, otherwise every 2 minutes; paused while the
// tab is hidden; backs off (up to 4x) after a failure; a small circuit breaker stops trying for 5 minutes after three
// failures in a row, then lets one request through. The last good data is kept and marked stale.
var POLL_LIVE_MS = 20e3, POLL_IDLE_MS = 120e3, BREAKER_TRIP = 3, BREAKER_COOL_MS = 5 * 60e3, FETCH_TIMEOUT_MS = 10e3;
var poll = { timer: 0, inflight: false, fails: 0, breaker: "closed", openedAt: 0, everOk: false, waitingVisible: false, lastTry: 0, lastLatency: null };

function canPoll() { return HAS_DOM && typeof fetch === "function" && /^https?:$/.test(location.protocol); }
// Pure: how long to wait before the next request.
function nextPollDelay(anyLive, fails, breaker) {
  if (breaker === "open") return BREAKER_COOL_MS;
  var base = anyLive ? POLL_LIVE_MS : POLL_IDLE_MS;
  return base * Math.min(4, Math.pow(2, Math.max(0, fails)));
}
function schedulePoll() {
  clearTimeout(poll.timer);
  if (!canPoll()) return;
  var M = store.get("model"), anyLive = !!(M && M.games.some(function (g) { return g.state === "in"; }));
  poll.timer = setTimeout(pollNow, nextPollDelay(anyLive, poll.fails, poll.breaker));
}
function pollNow() {
  if (!canPoll() || poll.inflight) return;
  if (document.hidden) { poll.waitingVisible = true; return; }
  if (poll.breaker === "open") {
    if (Date.now() - poll.openedAt < BREAKER_COOL_MS) { schedulePoll(); return; }
    poll.breaker = "half-open";
  }
  poll.inflight = true; poll.lastTry = Date.now();
  var ctl = typeof AbortController === "function" ? new AbortController() : null, t0 = Date.now();
  var kill = setTimeout(function () { if (ctl) ctl.abort(); }, FETCH_TIMEOUT_MS);
  fetch("api/universe", { cache: "no-store", signal: ctl ? ctl.signal : undefined }).then(function (r) {
    if (!r.ok) throw new Error("answered " + r.status);
    return r.json();
  }).then(function (u) {
    if (!looksLikeUniverse(u)) throw new Error("unexpected payload shape");
    poll.fails = 0; poll.breaker = "closed"; poll.everOk = true; poll.lastLatency = Date.now() - t0;
    store.set({ payload: u, origin: "live", fetchedAt: Date.now(), pollFails: 0, pollError: null, breaker: "closed", model: buildModel(u) });
  }).catch(function (err) {
    poll.fails++;
    if (poll.breaker === "half-open" || poll.fails >= BREAKER_TRIP) { poll.breaker = "open"; poll.openedAt = Date.now(); }
    store.set({ pollFails: poll.fails, pollError: String(err && err.message || err), breaker: poll.breaker });
  }).then(function () { clearTimeout(kill); poll.inflight = false; schedulePoll(); });
}
function startPolling() {
  if (!canPoll()) return;
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden && poll.waitingVisible) { poll.waitingVisible = false; pollNow(); }
  });
  pollNow();
}
NFLU.nextPollDelay = nextPollDelay;
