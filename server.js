// Serves the simulator and a small live-score endpoint. No dependencies; needs Node 18+.
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
// ESPN's public scoreboard JSON. It is unofficial and undocumented, so it can change without notice.
const LIVE_URL = process.env.LIVE_URL || "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard";
const CACHE_MS = Number(process.env.CACHE_MS || 15000);
const ABBR = { WSH: "WAS", LA: "LAR", JAC: "JAX" }; // feed abbreviation -> the page's abbreviation

let cache = { at: 0, games: [] };

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
  if (Date.now() - cache.at < CACHE_MS) return { games: cache.games, stale: false };
  try {
    const res = await fetch(LIVE_URL, { headers: { "user-agent": "nfl-playoff-simulator" } });
    if (!res.ok) throw new Error("feed answered " + res.status);
    cache = { at: Date.now(), games: normalize(await res.json()) };
    return { games: cache.games, stale: false };
  } catch (err) {
    console.error("live feed:", err.message);
    return { games: cache.games, stale: true };
  }
}

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".json": "application/json", ".css": "text/css" };

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname === "/api/live") {
    const body = JSON.stringify(await liveGames());
    res.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
    return res.end(body);
  }
  const rel = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
  const file = path.join(__dirname, "public", path.normalize(rel));
  if (!file.startsWith(path.join(__dirname, "public"))) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end("Not found"); }
    res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
    res.end(data);
  });
});

if (require.main === module) server.listen(PORT, () => console.log("Simulator running at http://localhost:" + PORT));
module.exports = { normalize };
