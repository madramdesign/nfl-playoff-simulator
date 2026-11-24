// MCP server tests: the stdio protocol end to end (a spawned `node mcp/server.js` reading the synthetic fixture), the
// scope restriction, the argument validator, and the answers when every source is offline. No network, no deps.
// Run: node test/mcp.test.js (finishes in a few seconds; exits non-zero on failure).
"use strict";
const assert = require("assert");
const path = require("path");
const { spawn } = require("child_process");

const root = path.join(__dirname, "..");
const SERVER = path.join(root, "mcp", "server.js");
const FIXTURE = path.join(root, "test", "fixtures", "universe.sample.json");
// The fixture's matchups are checked against the engine's remaining games, so the engine's season data is pinned to
// the build the fixture was written against (see test/fixtures/README.md). Spawned servers inherit it.
process.env.NFLU_ENGINE_DATA = path.join(root, "test", "fixtures", "engine-data.js");
const { validate } = require(path.join(root, "mcp", "validate.js"));
const { createTools } = require(path.join(root, "mcp", "tools.js"));
const TOOL_NAMES = ["get_games", "get_live_games", "get_injuries", "get_news", "get_events", "get_odds", "get_weather", "get_team", "get_standings",
  "get_playoff_odds", "run_simulation", "get_what_changed", "get_source_health", "search"];
const isIso = (x) => typeof x === "string" && !Number.isNaN(Date.parse(x));

const children = [];
const deadline = setTimeout(() => { console.error("FAIL mcp tests: took longer than 25 s"); for (const c of children) c.kill(); process.exit(1); }, 25000);
deadline.unref();

// A minimal MCP client over the child's stdio: one JSON message per line, answers taken in order.
function startServer(env) {
  const child = spawn(process.execPath, [SERVER], { cwd: root, env: Object.assign({}, process.env, { NFLU_SCOPES: "", NFLU_FIXTURE: FIXTURE }, env), stdio: ["pipe", "pipe", "pipe"] });
  children.push(child);
  let buf = "", stderr = "";
  const queue = [], waiting = [], raw = [];
  child.stdout.setEncoding("utf8");
  child.stdout.on("data", (d) => {
    buf += d;
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i); buf = buf.slice(i + 1); raw.push(line);
      let msg; try { msg = JSON.parse(line); } catch (_) { msg = { notJson: line }; }
      if (waiting.length) waiting.shift()(msg); else queue.push(msg);
    }
  });
  child.stderr.on("data", (d) => { stderr += d; });
  const next = () => (queue.length ? Promise.resolve(queue.shift()) : new Promise((ok) => waiting.push(ok)));
  let id = 0;
  return {
    raw, stderr: () => stderr,
    sendLine(line) { child.stdin.write(line + "\n"); return next(); },
    request(method, params) { const m = { jsonrpc: "2.0", id: ++id, method }; if (params !== undefined) m.params = params; return this.sendLine(JSON.stringify(m)); },
    notify(method, params) { child.stdin.write(JSON.stringify({ jsonrpc: "2.0", method, params }) + "\n"); },
    async call(name, args) {
      const r = await this.request("tools/call", { name, arguments: args });
      assert.ok(r.result, name + ": expected a result, got " + JSON.stringify(r).slice(0, 300));
      const res = r.result;
      assert.ok(Array.isArray(res.content) && res.content[0].type === "text", name + ": text content");
      assert.deepStrictEqual(JSON.parse(res.content[0].text), res.structuredContent, name + ": text and structuredContent agree");
      return res;
    },
    close() { child.stdin.end(); return new Promise((ok) => child.on("exit", (code) => ok(code))); },
  };
}

// Every answer carries the provenance envelope (generatedAt, sources with status and scope, unavailableSources).
function envelope(name, s) {
  assert.ok(isIso(s.generatedAt), name + ": generatedAt");
  assert.ok(Array.isArray(s.sources) && Array.isArray(s.unavailableSources), name + ": sources and unavailableSources");
  for (const src of s.sources) assert.ok(typeof src.id === "string" && typeof src.status === "string" && ["public", "local"].includes(src.scope), name + ": source " + JSON.stringify(src));
  for (const u of s.unavailableSources) assert.notStrictEqual(u.status, "ok", name + ": unavailable source marked ok");
  const ids = new Set(s.sources.map((x) => x.id));
  for (const u of s.unavailableSources) assert.ok(ids.has(u.id), name + ": unavailable source " + u.id + " is also listed in sources");
}

const tests = [];
const test = (name, fn) => tests.push([name, fn]);

test("protocol and every tool over stdio (fixture, default scopes)", async () => {
  const c = startServer({});
  try {
    let r = await c.request("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "test", version: "0" } });
    assert.strictEqual(r.jsonrpc, "2.0"); assert.strictEqual(r.id, 1);
    assert.strictEqual(r.result.protocolVersion, "2025-06-18");
    assert.ok(r.result.capabilities.tools, "declares tools");
    assert.strictEqual(r.result.serverInfo.name, "nfl-universe");
    r = await c.request("initialize", { protocolVersion: "2024-11-05", capabilities: {} });
    assert.strictEqual(r.result.protocolVersion, "2024-11-05", "a supported older version is echoed");
    r = await c.request("initialize", { protocolVersion: "1999-01-01", capabilities: {} });
    assert.strictEqual(r.result.protocolVersion, "2025-06-18", "an unknown version gets the latest");
    c.notify("notifications/initialized");
    r = await c.request("ping");
    assert.deepStrictEqual(r.result, {}, "ping answers {} and the notification got no answer");

    r = await c.request("tools/list");
    const tools = r.result.tools;
    assert.deepStrictEqual(tools.map((t) => t.name).sort(), TOOL_NAMES.slice().sort());
    for (const t of tools) {
      assert.ok(t.description && t.inputSchema && t.inputSchema.type === "object" && t.inputSchema.additionalProperties === false, t.name + ": schema");
      assert.strictEqual(t.annotations.readOnlyHint, true, t.name + ": read-only");
      assert.strictEqual(t.annotations.destructiveHint, false, t.name + ": not destructive");
    }

    let s = (await c.call("get_games", {})).structuredContent;
    envelope("get_games", s);
    assert.strictEqual(s.mode, "fixture"); assert.ok(s.fixture, "fixture answers say so");
    assert.strictEqual(s.games.length, 6);
    const ids = new Set(s.sources.map((x) => x.id));
    for (const g of s.games) {
      assert.ok(ids.has(g.source), "game source listed");
      if (g.line) assert.ok(ids.has(g.line.source) && g.line.sourceScope, "line source listed with scope");
      if (g.weather) assert.ok(ids.has(g.weather.source), "weather source listed");
      if (g.state === "pre") assert.strictEqual(g.score, null, "no 0-0 score before kickoff");
    }
    const final = s.games.find((g) => g.state === "post");
    assert.ok(final.engine && final.engine.gameId && /run_simulation/.test(final.engine.note), "a final the engine still simulates is flagged");

    s = (await c.call("get_live_games", {})).structuredContent;
    envelope("get_live_games", s);
    assert.ok(s.games.length >= 1 && s.games.every((g) => g.state === "in" && g.situation), "live games with situation");
    assert.strictEqual(s.liveSource.id, "espn-scoreboard");

    s = (await c.call("get_injuries", { team: "nyg" })).structuredContent;
    envelope("get_injuries", s);
    assert.strictEqual(s.team, "NYG", "team is case-insensitive");
    assert.ok(s.injuries.players.length > 0 && s.injuries.players.every((p) => p.source), "players carry their source");
    s = (await c.call("get_injuries", { team: "BUF" })).structuredContent;
    assert.strictEqual(s.injuries, null);
    assert.ok(s.notes.some((n) => /No injury listed for BUF/.test(n)), "an empty team says what was checked");

    s = (await c.call("get_news", { hours: 24, limit: 5 })).structuredContent;
    envelope("get_news", s);
    assert.ok(s.items.length > 0 && s.items.length <= 5 && s.items.every((e) => ["news", "qb_change"].includes(e.type) && e.basis));
    assert.ok(s.unavailableSources.some((u) => u.id === "rss-espn" && u.status === "stale"), "the stale feed is reported");

    s = (await c.call("get_events", { type: "injury", minImportance: 10 })).structuredContent;
    envelope("get_events", s);
    assert.ok(s.items.length > 0 && s.items.every((e) => e.type === "injury" && e.importance >= 10));
    assert.ok(s.unavailableSources.some((u) => u.id === "espn-transactions" && u.status === "down"), "the down source is reported");

    s = (await c.call("get_odds", { team: "WSH" })).structuredContent;
    envelope("get_odds", s);
    assert.ok(s.games.length === 1 && s.games[0].home === "WAS" && s.games[0].line.source, "provider abbreviation WSH maps to WAS");

    s = (await c.call("get_weather", {})).structuredContent;
    envelope("get_weather", s);
    assert.ok(s.games.some((g) => g.indoor && g.weather === null && g.note), "indoor games are marked");
    assert.ok(s.flagged.length > 0);

    s = (await c.call("get_team", { team: "NYG" })).structuredContent;
    envelope("get_team", s);
    assert.strictEqual(s.team.abbr, "NYG");
    for (const k of ["spread", "results", "elo"]) assert.ok(typeof s.ratings[k].points === "number" && s.ratings[k].rank >= 1 && s.ratings[k].rank <= 32, "rating " + k);
    assert.ok(Number.isInteger(s.record.wins) && s.remainingGames.length > 0);
    const pickGame = s.remainingGames[0];

    s = (await c.call("get_standings", { conference: "afc" })).structuredContent;
    envelope("get_standings", s);
    assert.strictEqual(s.conferences.length, 1); assert.strictEqual(s.conferences[0].divisions.length, 4);
    assert.strictEqual(s.conferences[0].seedsIfSeasonEndedToday.length, 7);

    s = (await c.call("get_playoff_odds", { sims: 2000 })).structuredContent;
    envelope("get_playoff_odds", s);
    assert.strictEqual(s.sims, 2000); assert.strictEqual(s.teams.length, 32);
    assert.strictEqual(s.sources[0].id, "engine");
    const sum = (k) => s.teams.reduce((a, t) => a + t[k], 0);
    assert.ok(Math.abs(sum("playoffs") - 14) < 0.05, "14 playoff teams");
    assert.ok(Math.abs(sum("winSuperBowl") - 1) < 0.02, "one champion");
    const nygBefore = s.teams.find((t) => t.team === "NYG").playoffs;

    s = (await c.call("run_simulation", { picks: { [pickGame.gameId]: "NYG" }, sims: 2000 })).structuredContent;
    envelope("run_simulation", s);
    assert.strictEqual(s.picks.length, 1); assert.strictEqual(s.picks[0].winner, "NYG");
    const nyg = s.teams.find((t) => t.team === "NYG");
    assert.strictEqual(nyg.playoffsBefore, nygBefore, "baseline equals get_playoff_odds for the same sims and seed");
    assert.ok(nyg.playoffsChange > -s.monteCarloMargin95, "a win does not lower a team's chances beyond noise");
    assert.strictEqual(s.teams.length, 32);

    let res = await c.call("run_simulation", { picks: { [pickGame.gameId]: pickGame.opponent === "BUF" ? "MIA" : "BUF" } });
    assert.strictEqual(res.isError, true); assert.ok(res.structuredContent.invalidPicks.length === 1, "a team not in the game is rejected");
    res = await c.call("run_simulation", { picks: { "2026_01_NYG_DAL": "NYG" } });
    assert.strictEqual(res.isError, true, "an unknown game is rejected");

    s = (await c.call("get_what_changed", {})).structuredContent;
    envelope("get_what_changed", s);
    assert.ok(/^data\/snapshots\/\d{4}-\d{2}-\d{2}\.json$/.test(s.comparedWith.file) && s.comparedWith.date);
    assert.ok(Array.isArray(s.playoffMovers) && Array.isArray(s.lineMoves));
    assert.ok(s.explanation && typeof s.explanation.available === "boolean" && (s.explanation.available ? s.playoffMovers.every((m) => m.why && typeof m.why.rest === "number") : typeof s.explanation.reason === "string"),
      "each mover's change is split when the saved forecast allows it, and says why not otherwise");

    s = (await c.call("get_source_health", {})).structuredContent;
    envelope("get_source_health", s);
    assert.ok(s.sources.some((x) => x.id === "espn-transactions" && x.status === "down" && x.breaker === "open"));
    assert.ok(s.sources.some((x) => x.id === "engine") && s.summary.down >= 1);

    s = (await c.call("search", { query: "Giants" })).structuredContent;
    envelope("search", s);
    assert.ok(s.teams.some((t) => t.team === "NYG") && s.events.length >= 1 && s.games.length >= 1);
    s = (await c.call("search", { query: "fixture qb" })).structuredContent;
    assert.ok(s.injuries.some((p) => p.name === "Fixture QB One"), "injured players are searched");

    // invalid arguments: tool errors the agent can read and correct
    for (const [name, args] of [["get_news", { hours: 0 }], ["get_team", {}], ["get_events", { bogus: 1 }], ["get_injuries", { team: "XYZ" }],
      ["get_playoff_odds", { sims: 1000.5 }], ["search", { query: "" }], ["run_simulation", { picks: {} }], ["get_standings", { conference: "XFL" }]]) {
      res = await c.call(name, args);
      assert.strictEqual(res.isError, true, name + " " + JSON.stringify(args) + " is rejected");
      assert.ok(/Invalid arguments/.test(res.structuredContent.error));
      envelope(name + " (invalid)", res.structuredContent);
    }

    // protocol errors
    r = await c.request("tools/call", { name: "place_bet", arguments: {} });
    assert.strictEqual(r.error.code, -32602, "unknown tool");
    r = await c.request("tools/call", { name: "get_games", arguments: "x" });
    assert.strictEqual(r.error.code, -32602, "arguments must be an object");
    r = await c.request("resources/list");
    assert.strictEqual(r.error.code, -32601, "unknown method"); assert.strictEqual(typeof r.id, "number", "the error keeps the request id");
    r = await c.sendLine("{not json");
    assert.strictEqual(r.error.code, -32700); assert.strictEqual(r.id, null);
    r = await c.sendLine(JSON.stringify({ jsonrpc: "1.0", id: 99, method: "ping" }));
    assert.strictEqual(r.error.code, -32600); assert.strictEqual(r.id, 99);
    r = await c.sendLine(JSON.stringify([{ jsonrpc: "2.0", id: "a", method: "ping" }, { jsonrpc: "2.0", method: "notifications/initialized" }]));
    assert.ok(Array.isArray(r) && r.length === 1 && r[0].id === "a", "batch answers its requests only");
  } finally {
    const code = await c.close();
    assert.strictEqual(code, 0, "exits cleanly when stdin closes");
  }
  for (const line of c.raw) { const m = JSON.parse(line); for (const x of [].concat(m)) assert.strictEqual(x.jsonrpc, "2.0", "stdout carries only JSON-RPC"); }
});

test("NFLU_SCOPES=public drops local sources", async () => {
  const c = startServer({ NFLU_SCOPES: "public" });
  try {
    await c.request("initialize", { protocolVersion: "2025-03-26", capabilities: {} });
    let s = (await c.call("get_source_health", {})).structuredContent;
    assert.deepStrictEqual(s.scopes, ["public"]);
    assert.ok(s.sources.every((x) => x.scope === "public"), "no local source");
    s = (await c.call("get_live_games", {})).structuredContent;
    assert.strictEqual(s.liveSource, null); assert.ok(s.notes.some((n) => /No live-score source is in scope/.test(n)));
    s = (await c.call("get_events", { limit: 100 })).structuredContent;
    assert.ok(s.items.every((e) => e.sourceScope === "public"));
    s = (await c.call("get_games", {})).structuredContent;
    assert.ok(s.games.every((g) => g.sourceScope === "public" && (!g.line || g.line.sourceScope === "public")));
  } finally { await c.close(); }
});

test("argument validator", () => {
  const schema = { type: "object", additionalProperties: false, required: ["q"], properties: { q: { type: "string", minLength: 1, maxLength: 3 }, n: { type: "integer", minimum: 1, maximum: 5 },
    m: { type: "object", propertyNames: { type: "string", pattern: "^[a-z]+$" }, additionalProperties: { type: "string", enum: ["A", "B"] } } } };
  assert.deepStrictEqual(validate(schema, { q: "ab", n: 3, m: { x: "A" } }), []);
  assert.strictEqual(validate(schema, {}).length, 1);
  assert.strictEqual(validate(schema, { q: "abcd" }).length, 1);
  assert.strictEqual(validate(schema, { q: "a", n: 2.5 }).length, 1);
  assert.strictEqual(validate(schema, { q: "a", n: 9 }).length, 1);
  assert.strictEqual(validate(schema, { q: "a", z: 1 }).length, 1);
  assert.strictEqual(validate(schema, { q: "a", m: { X: "A", y: "C" } }).length, 2);
  assert.strictEqual(validate(schema, JSON.parse('{"q":"a","__proto__":{"polluted":true}}')).length, 1, "__proto__ is an unknown property, not a prototype");
  assert.strictEqual({}.polluted, undefined);
});

test("what changed: a version-2 saved forecast splits each mover's change (F04)", async () => {
  const os = require("os"), fs = require("fs");
  const eng = require(path.join(root, "mcp", "engine.js")), L = eng.load(), E = L.E;
  const P = JSON.parse(JSON.stringify(require(path.join(root, "scripts", "snapshot.js")).makeSnapshot(E, 4000, "2026-11-01")));
  const k = E.GAMES.findIndex((g) => g[6] != null && P.playoffs[g[3]] > 0.2 && P.playoffs[g[3]] < 0.8), g = E.GAMES[k], home = E.TM[g[3]].a;   // a home team with something at stake
  P.built = "an earlier build"; P.probs[g[0]] = Math.round((P.probs[g[0]] - 0.1) * 1000) / 1000; P.playoffs[g[3]] = Math.max(0, P.playoffs[g[3]] - 0.1);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nflu-snap-"));
  fs.writeFileSync(path.join(dir, "2026-11-01.json"), JSON.stringify(P));
  process.env.NFLU_SNAPSHOT_DIR = dir;
  try {
    const s = (await createTools({ env: {}, fetchImpl: async () => { throw new Error("offline"); } }).call("get_what_changed", {})).structuredContent;
    assert.ok(s.explanation.available === true && /First order/.test(s.explanation.method));
    const m = s.playoffMovers.find((x) => x.team === home);
    assert.ok(m && m.why, "the home team of the moved line is a mover, with a split");
    assert.ok(m.why.lines > 0 && m.why.lineAndRatingMoves[0].gameId === g[0] && m.why.lineAndRatingMoves[0].kind === "lines", "the moved line is named");
    assert.ok(Math.abs(m.why.ownResults + m.why.otherResults + m.why.lines + m.why.ratings + m.why.rest - m.change) <= 0.004, "the parts add up to the change");
  } finally { delete process.env.NFLU_SNAPSHOT_DIR; fs.rmSync(dir, { recursive: true, force: true }); }
});
test("with every source offline, answers say so instead of looking empty", async () => {
  const t = createTools({ env: {}, fetchImpl: async () => { throw new Error("offline"); } });
  let r = await t.call("get_injuries", { team: "NYG" });
  assert.ok(!r.isError);
  let s = r.structuredContent;
  assert.strictEqual(s.injuries, null);
  assert.ok(s.unavailableSources.some((u) => u.id === "nflverse-injuries" && u.status === "down"));
  assert.ok(s.notes.some((n) => /No injury source answered/.test(n)));
  s = (await t.call("get_games", {})).structuredContent;
  assert.ok(s.notes.some((n) => /does not mean there are no games/.test(n)));
  s = (await t.call("get_live_games", {})).structuredContent;
  assert.ok(s.notes.some((n) => /scoreboard is down/.test(n)));
});

(async () => {
  let failed = 0;
  const t0 = Date.now();
  for (const [name, fn] of tests) {
    try { await fn(); } catch (err) { failed++; console.error("FAIL " + name + "\n  " + ((err && err.stack) || err).split("\n").slice(0, 5).join("\n  ")); }
  }
  for (const c of children) if (c.exitCode === null) c.kill();
  if (failed) { console.error(failed + " of " + tests.length + " MCP tests failed"); process.exit(1); }
  console.log("ok: " + tests.length + " MCP tests pass (" + ((Date.now() - t0) / 1000).toFixed(1) + " s)");
})();
