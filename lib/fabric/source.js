// One external source behind a timeout, retries, a circuit breaker and a last-good cache.
// The pattern follows World Monitor's documented approach (serve cache while refreshing, cool down after repeated
// failures, one recovery probe at a time); the code is written from scratch for this project.
"use strict";
const fs = require("fs");
const path = require("path");

const UA = "nfl-universe/1.0 (independent fan project; non-commercial)";

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

// fetch with a hard deadline and a small number of retries with backoff. Throws on the last failure.
async function fetchWithRetry(url, { timeoutMs = 8000, retries = 1, as = "json", headers = {}, fetchImpl = fetch } = {}) {
  let last;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeoutMs);
    try {
      const res = await fetchImpl(url, { headers: { "user-agent": UA, accept: as === "json" ? "application/json" : "*/*", ...headers }, signal: ctl.signal });
      if (!res.ok) throw new Error("answered " + res.status);
      const body = as === "json" ? await res.json() : await res.text();
      clearTimeout(timer);
      return body;
    } catch (err) {
      clearTimeout(timer);
      last = err.name === "AbortError" ? new Error("timeout after " + timeoutMs + " ms") : err;
      if (attempt < retries) await sleep(400 * 2 ** attempt);
    }
  }
  throw last;
}

// createSource({id, label, tier, ttlMs, maxStaleSec, load, cacheDir, maxFailures, cooldownMs})
//   load(ctx) -> Promise<data>; it does the fetching and normalizing.
// get() returns {data, at, mode} where mode is "live" (just fetched), "cached" (fresh cache), "stale" (old cache served)
// or "unavailable" (nothing to serve). It never throws.
function createSource(def) {
  const s = {
    id: def.id, label: def.label, tier: def.tier || 3, scope: def.scope === "local" ? "local" : "public", ttlMs: def.ttlMs || 60000, maxStaleSec: def.maxStaleSec || 3600,
    maxFailures: def.maxFailures || 3, cooldownMs: def.cooldownMs || 5 * 60000, enabled: def.enabled !== false,
    data: null, at: 0, fails: 0, lastError: null, lastTry: 0, openedAt: 0, latencyMs: null, inflight: null, records: 0,
  };
  const file = def.cacheDir ? path.join(def.cacheDir, def.id + ".json") : null;
  if (file) {
    try { const saved = JSON.parse(fs.readFileSync(file, "utf8")); s.data = saved.data; s.at = saved.at; s.records = count(saved.data); } catch (_) { /* no cache yet */ }
  }
  function count(d) {
    if (Array.isArray(d)) return d.length;
    if (!d || typeof d !== "object") return 0;
    if (Array.isArray(d.games)) return d.games.length;
    if (d.forecasts && typeof d.forecasts === "object") return Object.keys(d.forecasts).length;
    if (Array.isArray(d.videos)) return d.videos.length;
    if (Array.isArray(d.episodes)) return d.episodes.length;
    if (d.teams && typeof d.teams === "object") return Object.values(d.teams).reduce((n, l) => n + (Array.isArray(l) ? l.length : 0), 0);
    return Object.keys(d).length;
  }
  function breaker(now) {
    if (s.fails < s.maxFailures) return "closed";
    return now - s.openedAt >= s.cooldownMs ? "half-open" : "open";
  }
  async function refresh(now) {
    if (s.inflight) return s.inflight;           // one request at a time; callers share it (also the half-open probe)
    s.lastTry = now;
    const t0 = Date.now();
    s.inflight = (async () => {
      try {
        const data = await def.load();
        // times use the caller's clock (`now`), so ages and breaker cooldowns stay consistent with status(now)
        s.data = data; s.at = now; s.fails = 0; s.lastError = null; s.latencyMs = Date.now() - t0; s.records = count(data);
        if (file) { try { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify({ at: s.at, data })); } catch (_) {} }
      } catch (err) {
        s.fails++; s.lastError = String(err && err.message || err).slice(0, 200); s.latencyMs = Date.now() - t0;
        if (s.fails >= s.maxFailures) s.openedAt = now;
      } finally { s.inflight = null; }
    })();
    return s.inflight;
  }
  async function get({ force = false, now = Date.now() } = {}) {
    if (!s.enabled) return { data: s.data, at: s.at, mode: s.data ? "stale" : "unavailable" };
    const age = now - s.at, state = breaker(now);
    if (!force && s.data && age < s.ttlMs) return { data: s.data, at: s.at, mode: "cached" };
    if (state === "open") return { data: s.data, at: s.at, mode: s.data ? "stale" : "unavailable" };
    if (s.data && !force) {                      // stale-while-revalidate: answer now, refresh in the background
      refresh(now);
      return { data: s.data, at: s.at, mode: "stale" };
    }
    await refresh(now);
    return s.data ? { data: s.data, at: s.at, mode: s.fails ? "stale" : "live" } : { data: null, at: 0, mode: s.lastTry ? "unavailable" : "pending" };
  }
  // used: optionally the {at, mode} a caller actually served, so the reported age describes that data even if a
  // background refresh has landed since (otherwise old data could be reported with a fresh age).
  function status(now = Date.now(), used = null) {
    const at = used ? used.at : s.at;
    const ageSec = at ? Math.round((now - at) / 1000) : null;
    const st = !s.enabled ? "disabled" : !at && (!s.lastTry || s.inflight) ? "pending" : !at ? "down"
      : breaker(now) === "open" && ageSec > s.maxStaleSec ? "down" : ageSec > s.maxStaleSec || s.fails ? "stale" : "ok";
    return { id: s.id, label: s.label, tier: s.tier, scope: s.scope, status: st, breaker: breaker(now), lastOk: at ? new Date(at).toISOString() : null,
      lastError: s.lastError, ageSec, latencyMs: s.latencyMs, fails: s.fails, records: used && used.data ? count(used.data) : at ? s.records : 0, maxStaleSec: s.maxStaleSec };
  }
  return { id: s.id, get, status, _state: s };
}

module.exports = { createSource, fetchWithRetry, UA };
