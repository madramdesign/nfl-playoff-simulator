#!/usr/bin/env node
// NFL Universe MCP server: read-only tools over the data fabric and the page's simulation engine, spoken as
// JSON-RPC 2.0 over stdio (one JSON message per line). No dependencies. Only protocol messages go to stdout;
// logs go to stderr. Documentation: docs/MCP_ARCHITECTURE.md.
//
//   claude mcp add nfl-universe -- node /abs/path/mcp/server.js
//
// Environment: NFLU_SCOPES=public (default "public,local"), NFLU_FIXTURE=<universe JSON> (tests; no network),
// NFLU_TIMEOUT_MS (how long a tool waits for the sources, default 25000).
"use strict";
const { createTools } = require("./tools");
const { isObj } = require("./validate");

const SUPPORTED = ["2025-06-18", "2025-03-26", "2024-11-05"];   // newest first
const SERVER_INFO = { name: "nfl-universe", title: "NFL Universe (read-only)", version: "1.0.0" };
const INSTRUCTIONS = "Read-only NFL data and forecasts. Every tool answer lists the sources it used with status and scope, and unavailableSources: " +
  "when a source is down or stale, missing items are unknown, not absent. Headlines are reported claims; chances from get_playoff_odds and " +
  "run_simulation are model estimates (Monte Carlo, see monteCarloMargin95). Engine game ids for run_simulation come from get_team, get_games or search. " +
  "Nothing is ever saved, posted or bought.";
const MAX_LINE = 4 * 1024 * 1024;

const rpcError = (id, code, message, data) => ({ jsonrpc: "2.0", id: id === undefined ? null : id, error: Object.assign({ code, message }, data === undefined ? {} : { data }) });
const rpcResult = (id, result) => ({ jsonrpc: "2.0", id, result });

function createServer({ env = process.env, log = (m) => process.stderr.write("[nfl-universe-mcp] " + m + "\n") } = {}) {
  const tools = createTools({ env, log });
  let initialized = false, protocolVersion = null;

  async function handleRequest(msg) {
    const id = msg.id, params = msg.params;
    if (params !== undefined && !isObj(params)) return rpcError(id, -32602, "Invalid params: params must be an object");
    const p = params || {};
    switch (msg.method) {
      case "initialize": {
        if (typeof p.protocolVersion !== "string") return rpcError(id, -32602, "Invalid params: protocolVersion (string) is required");
        protocolVersion = SUPPORTED.includes(p.protocolVersion) ? p.protocolVersion : SUPPORTED[0];
        return rpcResult(id, { protocolVersion, capabilities: { tools: { listChanged: false } }, serverInfo: SERVER_INFO, instructions: INSTRUCTIONS });
      }
      case "ping":
        return rpcResult(id, {});
      case "tools/list":
        return rpcResult(id, { tools: tools.list() });
      case "tools/call": {
        if (typeof p.name !== "string") return rpcError(id, -32602, "Invalid params: name (string) is required");
        if (p.arguments !== undefined && p.arguments !== null && !isObj(p.arguments)) return rpcError(id, -32602, "Invalid params: arguments must be an object");
        if (!tools.has(p.name)) return rpcError(id, -32602, "Unknown tool: " + p.name.slice(0, 100), { tools: tools.list().map((t) => t.name) });
        return rpcResult(id, await tools.call(p.name, p.arguments || {}));
      }
      default:
        return rpcError(id, -32601, "Method not found: " + String(msg.method).slice(0, 100));
    }
  }

  // One parsed message -> a response object, or null when none is due (notifications, responses).
  async function handleMessage(msg) {
    if (!isObj(msg)) return rpcError(null, -32600, "Invalid Request: expected a JSON object");
    const hasId = Object.prototype.hasOwnProperty.call(msg, "id");
    const idOk = hasId && (typeof msg.id === "string" || (typeof msg.id === "number" && Number.isFinite(msg.id)));
    if (!("method" in msg) && ("result" in msg || "error" in msg)) return null;   // a response to us; we send no requests
    if (msg.jsonrpc !== "2.0" || typeof msg.method !== "string" || (hasId && !idOk))
      return rpcError(idOk ? msg.id : null, -32600, "Invalid Request: needs jsonrpc \"2.0\", a string method and a string or number id");
    if (!hasId) {                                                                  // notification: never answered
      if (msg.method === "notifications/initialized") initialized = true;
      return null;
    }
    try {
      return await handleRequest(msg);
    } catch (err) {
      log("request " + msg.method + " failed: " + ((err && err.stack) || err));
      return rpcError(msg.id, -32603, "Internal error");
    }
  }

  // One line of input -> a response (object or array) or null.
  async function handleLine(line) {
    let parsed;
    try { parsed = JSON.parse(line); } catch (_) { return rpcError(null, -32700, "Parse error: the line is not valid JSON"); }
    if (Array.isArray(parsed)) {
      if (!parsed.length) return rpcError(null, -32600, "Invalid Request: empty batch");
      const out = (await Promise.all(parsed.map(handleMessage))).filter(Boolean);
      return out.length ? out : null;
    }
    return handleMessage(parsed);
  }

  return { handleLine, handleMessage, state: () => ({ initialized, protocolVersion }) };
}

function main() {
  // stdout carries protocol messages only; anything else that tries to print goes to stderr
  console.log = console.info = console.debug = (...a) => process.stderr.write(a.map(String).join(" ") + "\n");
  const server = createServer();
  const write = (obj) => { if (obj) process.stdout.write(JSON.stringify(obj) + "\n"); };
  let buf = "", pending = 0, ended = false;
  const done = () => { if (ended && pending === 0) process.exit(0); };
  const onLine = (line) => {
    if (!line.trim()) return;
    pending++;
    server.handleLine(line).then(write, (err) => { process.stderr.write("[nfl-universe-mcp] " + ((err && err.stack) || err) + "\n"); write(rpcError(null, -32603, "Internal error")); })
      .finally(() => { pending--; done(); });
  };
  process.stdout.on("error", () => process.exit(0));   // the client went away
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk) => {
    buf += chunk;
    let i;
    while ((i = buf.indexOf("\n")) >= 0) { const line = buf.slice(0, i).replace(/\r$/, ""); buf = buf.slice(i + 1); onLine(line); }
    if (buf.length > MAX_LINE) { buf = ""; write(rpcError(null, -32700, "Parse error: message longer than " + MAX_LINE + " bytes without a newline")); }
  });
  process.stdin.on("end", () => { if (buf.trim()) onLine(buf); buf = ""; ended = true; done(); });
}

if (require.main === module) main();

module.exports = { createServer, SUPPORTED };
