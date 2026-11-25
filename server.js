// Serves the simulator and a small live-score endpoint. No dependencies; needs Node 18+.
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
// ESPN's public scoreboard JSON. It is unofficial and undocumented, so it can change without notice.
const LIVE_URL = process.env.LIVE_URL || "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard";
const cacheMs = () => Number(process.env.CACHE_MS || 15000);
const ABBR = { WSH: "WAS", LA: "LAR", JAC: "JAX" }; // feed abbreviation -> the page's abbreviation

// A stalled feed must not hang the request, and a failing one must not be asked again on every poll: each request has a
// timeout, a failure waits LIVE_RETRY_MS before the next try, and concurrent callers share one request.
const liveTimeoutMs = () => Number(process.env.LIVE_TIMEOUT_MS || 8000);
const liveRetryMs = () => Number(process.env.LIVE_RETRY_MS || 30000);
let liveFetch = (...a) => fetch(...a);
let cache = { at: 0, games: [], failedAt: 0, inflight: null };

function normalize(board) {
  return (board.events || []).map((ev) => {
    const comp = (ev.competitions || [])[0] || {};
    const teams = comp.competitors || [];
    const home = teams.find((t) => t.homeAway === "home");
    const away = teams.find((t) => t.homeAway === "away");
    const st = comp.status || ev.status || {};
    if (!home || !away) return null;
    const ab = (t) => ABBR[t.team.abbreviation] || t.team.abbreviation;
    return {
      away: ab(away), home: ab(home),
      awayScore: Number(away.score) || 0, homeScore: Number(home.score) || 0,
      state: (st.type && st.type.state) || "pre",      // pre | in | post
      period: Number(st.period) || 0,
      clock: st.displayClock || "0:00",
      minutes: (Number(st.clock) || 0) / 60,            // minutes left in the period
    };
  }).filter(Boolean);
}

async function liveGames() {
  const now = Date.now();
  if (now - cache.at < cacheMs()) return { games: cache.games, stale: false };
  if (now - cache.failedAt < liveRetryMs()) return { games: cache.games, stale: true };   // failed recently: don't ask again yet
  if (cache.inflight) return cache.inflight;
  cache.inflight = (async () => {
    await null;   // so even a fetch that throws at once settles after cache.inflight is set, never before
    const ctl = new AbortController(), wait = liveTimeoutMs(), timer = setTimeout(() => ctl.abort(), wait);
    try {
      const res = await liveFetch(LIVE_URL, { headers: { "user-agent": "nfl-playoff-simulator" }, signal: ctl.signal });
      if (!res.ok) throw new Error("feed answered " + res.status);
      const games = normalize(await res.json());   // the body is read inside the timeout too
      cache.at = Date.now(); cache.games = games; cache.failedAt = 0;
      return { games, stale: false };
    } catch (err) {
      cache.failedAt = Date.now();
      console.error("live feed:", err && err.name === "AbortError" ? "no answer within " + wait + " ms" : err && err.message);
      return { games: cache.games, stale: true };
    } finally { clearTimeout(timer); cache.inflight = null; }
  })();
  return cache.inflight;
}

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".json": "application/json", ".css": "text/css" };

// NFL Universe data fabric (lib/fabric): public sources plus ESPN, which is for local use only (docs/DECISIONS.md DEC-006).
// FABRIC_SCOPES=public serves public sources only.
let fabric = null;
const scopes = () => (process.env.FABRIC_SCOPES || "public,local").split(",").map((s) => s.trim());
function getFabric() {
  if (!fabric) fabric = require("./lib/fabric").createFabric({ scopes: scopes() });
  return fabric;
}
function sendJson(res, status, obj) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" });
  res.end(JSON.stringify(obj));
}
async function fabricRoute(url, res) {
  const f = getFabric(), p = url.pathname;
  try {
    if (p === "/api/universe") {
      const u = await f.universe(), since = Date.parse(url.searchParams.get("since") || "");
      return sendJson(res, 200, Number.isFinite(since) ? Object.assign({}, u, { events: u.events.filter((e) => Date.parse(e.seenAt) > since) }) : u);
    }
    if (p === "/api/health") return sendJson(res, 200, f.health());
    let m = p.match(/^\/api\/game\/(\d{6,12})$/);
    if (m) { const g = await f.game(m[1]); return g ? sendJson(res, 200, g) : sendJson(res, 404, { error: "no detail for this game" }); }
    m = p.match(/^\/api\/team\/([A-Za-z]{2,3})$/);
    if (m) { const t = await f.team(m[1]); return t ? sendJson(res, 200, t) : sendJson(res, 404, { error: "unknown team" }); }
    return sendJson(res, 404, { error: "not found" });
  } catch (err) {
    console.error("fabric:", err && err.message);
    return sendJson(res, 503, { error: "data fabric unavailable" });
  }
}

// API answers only requests addressed to this machine by name, so a web page cannot reach local-only data through the
// owner's browser with a rebound DNS name. ALLOWED_HOSTS=name1,name2 adds names (for example a LAN address with HOST=0.0.0.0).
// On Render the service's own public name (RENDER_EXTERNAL_HOSTNAME) is added automatically.
const ALLOWED_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"].concat(((process.env.ALLOWED_HOSTS || "") + "," + (process.env.RENDER_EXTERNAL_HOSTNAME || "")).split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)));
function hostAllowed(req) {
  const h = String(req.headers.host || "").toLowerCase();
  const name = h.startsWith("[") ? h.slice(0, h.indexOf("]") + 1) : h.split(":")[0];
  return ALLOWED_HOSTS.has(name);
}

// A per-client cap on API requests for when the server is reachable from the internet. Upstream sources are already
// protected by the fabric's caches; this keeps one client from tying up the process. RATE_LIMIT is requests a minute
// (0 turns it off). Behind a host's proxy the client is the last X-Forwarded-For entry, the one the proxy itself added.
const hits = new Map();
function rateLimited(req) {
  const max = Number(process.env.RATE_LIMIT === undefined ? 240 : process.env.RATE_LIMIT);
  if (!(max > 0)) return false;
  const fwd = String(req.headers["x-forwarded-for"] || "").split(",").map((x) => x.trim()).filter(Boolean);
  const who = (process.env.TRUST_PROXY === "1" && fwd.length ? fwd[fwd.length - 1] : req.socket.remoteAddress) || "?";
  const now = Date.now();
  if (hits.size > 5000) for (const [k, v] of hits) if (now - v.at >= 60000) hits.delete(k);
  let h = hits.get(who);
  if (!h || now - h.at >= 60000) { h = { at: now, n: 0 }; hits.set(who, h); }
  return ++h.n > max;
}

const server = http.createServer(async (req, res) => {
  try {
    let url;
    try { url = new URL(req.url, "http://localhost"); } catch (_) { res.writeHead(400); return res.end("Bad request"); }
    if (url.pathname.startsWith("/api/") && !hostAllowed(req)) return sendJson(res, 403, { error: "host not allowed" });
    if (url.pathname.startsWith("/api/") && rateLimited(req)) { res.writeHead(429, { "content-type": "application/json; charset=utf-8", "retry-after": "60" }); return res.end('{"error":"too many requests"}'); }
    // /api/live reads ESPN's scoreboard, which is for local use only (DEC-006): off unless the local scope is on.
    if (url.pathname === "/api/live" && !scopes().includes("local")) return sendJson(res, 404, { error: "live scores are not available on this server" });
    if (url.pathname === "/api/live") {
      const body = JSON.stringify(await liveGames());
      res.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
      return res.end(body);
    }
    if (url.pathname.startsWith("/api/")) return await fabricRoute(url, res);
    return serveStatic(url, res);
  } catch (err) {
    console.error("request failed:", err && err.message);
    if (!res.headersSent) { res.writeHead(500); res.end("Server error"); }
  }
});

// The file a request path names inside public/, or null when it would land outside it. The prefix check includes the
// separator, so a sibling such as public-old/ never counts as inside.
const PUBLIC_DIR = path.join(__dirname, "public");
function publicFile(pathname) {
  const rel = pathname === "/" ? "index.html" : pathname.slice(1);
  const file = path.join(PUBLIC_DIR, path.normalize(rel));
  return file.startsWith(PUBLIC_DIR + path.sep) ? file : null;
}
// Content-Security-Policy for a page: only its own inline scripts run (each allowed by its SHA-256 hash, computed from
// the file being served, so a rebuild needs no restart), the simulation worker runs from a blob, and outside content is
// limited to what the page uses: Google Fonts, YouTube thumbnails and the privacy-enhanced player, and podcast audio
// (https, since the NFL's feeds go through several measurement redirects before the audio file).
function cspFor(html) {
  const hashes = [], re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  // the browser hashes the script as its HTML parser sees it, with every line break turned into a plain \n
  while ((m = re.exec(html))) hashes.push("'sha256-" + require("crypto").createHash("sha256").update(m[1].replace(/\r\n?/g, "\n"), "utf8").digest("base64") + "'");
  // https://www.youtube.com: YouTube's IFrame Player API, which NFL TV loads when it plays (DEC-022)
  return ["default-src 'self'", "script-src 'self' https://www.youtube.com " + hashes.join(" "), "worker-src 'self' blob:", "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com", "img-src 'self' data: blob: https://i.ytimg.com", "frame-src https://www.youtube-nocookie.com https://www.youtube.com",
    "media-src 'self' https:", "connect-src 'self'", "object-src 'none'", "base-uri 'none'", "form-action 'self'", "frame-ancestors 'self'"].join("; ");
}
function serveStatic(url, res) {
  const file = publicFile(url.pathname);
  if (!file) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end("Not found"); }
    const headers = { "content-type": TYPES[path.extname(file)] || "application/octet-stream", "x-content-type-options": "nosniff", "cache-control": "no-cache" };
    if (path.extname(file) === ".html") { headers["content-security-policy"] = cspFor(data.toString("utf8")); headers["referrer-policy"] = "strict-origin-when-cross-origin"; }
    res.writeHead(200, headers);
    res.end(data);
  });
}

// Listens on this machine only by default: ESPN data is for the owner's local use (DEC-006). HOST=0.0.0.0 opens it to the network.
const HOST = process.env.HOST || "127.0.0.1";
if (require.main === module) server.listen(PORT, HOST, () => {
  console.log("NFL Universe running at http://" + (HOST === "127.0.0.1" ? "localhost" : HOST) + ":" + PORT);
  // Keep live scores and game events current with no page open: only where the live scoreboard is read (local
  // scope); FABRIC_WATCH=0 turns it off. Hosted public servers have no live scoreboard, so they don't poll.
  if (scopes().includes("local") && process.env.FABRIC_WATCH !== "0") getFabric().startWatch();
});
// setFabric, setLiveFetch, resetLive: tests only
module.exports = { normalize, server, liveGames, publicFile, cspFor, setFabric: (f) => { fabric = f; },
  setLiveFetch: (f) => { liveFetch = f; }, resetLive: () => { cache = { at: 0, games: [], failedAt: 0, inflight: null }; } };
