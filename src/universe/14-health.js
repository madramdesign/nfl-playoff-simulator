// System health: every source's status, age, latency, failures and breaker; the page's own connection; the snapshot's
// age; and the intelligence gaps, so a quiet feed is never read as an all-clear.
var healthPanel = null;
function storeMeta() { return { payload: store.get("payload"), origin: store.get("origin"), fetchedAt: store.get("fetchedAt"), fails: store.get("pollFails") }; }
// Pure: one sentence on where the page's data stands, from the same rule as the status pill.
function statusSentence(meta, now) {
  var P = meta.payload, f = pillState(meta, now);
  if (!P) return "live feeds unavailable and no snapshot in this build; model data built " + (D.built || "?");
  if (f.state === "fixture") return "fixture data loaded (synthetic test data, not live)";
  if (meta.origin === "snapshot") return "live feeds unavailable; showing the snapshot saved " + fmtAge(Math.max(0, (now - Date.parse(P.generatedAt)) / 1000)) + " ago";
  if (meta.fails > 0) return "live feed not answering; last data received " + fmtAge(Math.max(0, (now - meta.fetchedAt) / 1000)) + " ago";
  if (f.state === "stale") return "server answering, but every source is stale; newest data " + f.label.replace(/^STALE · /, "") + " old";
  if (f.state === "unavailable") return "server answering, but every source is down";
  return "live feed connected" + (f.degraded ? "; " + f.degraded + " source" + (f.degraded > 1 ? "s" : "") + " stale or down" : "");
}
function dataStatusText() { return statusSentence(storeMeta(), Date.now()); }
NFLU.statusSentence = statusSentence;
function buildHealthPanel(host) {
  healthPanel = Panel({ id: "health", title: "System health", badge: function (now) { return overallFreshness(now); } });
  healthPanel.loading();
  host.appendChild(healthPanel.root);
}
function overallFreshness(now) { return pillState(storeMeta(), now); }
function renderHealth() {
  if (!healthPanel) return;
  var st = store.get(), P = st.payload, now = Date.now();
  healthPanel.render(function (body) {
    body.appendChild(el("p", { class: "u-hstatus", text: dataStatusText().replace(/^./, function (c) { return c.toUpperCase(); }) + "." }));
    var conn = canPoll() ? "Server endpoint api/universe: " + (poll.everOk ? "answered" : "not answered yet") + (st.pollFails ? ", " + st.pollFails + " failure" + (st.pollFails > 1 ? "s" : "") + " in a row (" + (st.pollError || "error") + ")" : "") + ", page breaker " + st.breaker + (poll.lastLatency != null ? ", " + poll.lastLatency + " ms" : "") + "."
      : "Opened as a file or static copy: the page does not poll a server.";
    body.appendChild(el("p", { class: "u-note", text: conn }));
    if (P && P._fixture) body.appendChild(el("p", { class: "u-warnline", text: "Fixture data loaded: " + P._fixture }));
    var gaps = intelligenceGaps(P);
    body.appendChild(el("p", { class: "u-gaps" + (gaps.length ? " is-warn" : ""), text: gaps.length ? "Intelligence gaps: " + gaps.map(function (g) { return g.kind + " (" + g.why + ")"; }).join(", ") + ". An empty list in those areas means missing data, not quiet." : "No intelligence gaps: every kind of source has at least one healthy feed." }));
    if (P && P.sources) {
      var base = st.origin === "live" && st.fetchedAt ? Math.max(0, (now - st.fetchedAt) / 1000) : Math.max(0, (now - Date.parse(P.generatedAt)) / 1000);
      var tb = el("tbody");
      Object.keys(P.sources).sort(function (a, b) { var o = { down: 0, stale: 1, pending: 2, disabled: 3, ok: 4 }; return (o[P.sources[a].status] - o[P.sources[b].status]) || a.localeCompare(b); }).forEach(function (id) {
        var s = P.sources[id];
        tb.appendChild(el("tr", {}, [
          el("td", {}, [s.label || id, s.scope === "local" ? el("span", { class: "u-local", title: "Local-only source: served by the server on the owner's computer, never published or committed (DEC-006)", text: "local" }) : null]),
          el("td", {}, el("span", { class: "u-st u-st-" + s.status, text: s.status })),
          el("td", { class: "u-num", text: typeof s.ageSec === "number" ? fmtAge(s.ageSec + base) : "–" }),
          el("td", { class: "u-num", text: typeof s.latencyMs === "number" ? s.latencyMs + " ms" : "–" }),
          el("td", { class: "u-num", text: String(s.fails || 0) }),
          el("td", { text: s.breaker || "–", title: s.lastError || "" })]));
      });
      body.appendChild(el("div", { class: "u-scrollx" }, el("table", { class: "u-table u-health" }, [el("thead", {}, el("tr", {}, ["Source", "Status", "Age", "Latency", "Fails", "Breaker"].map(function (h) { return el("th", { text: h }); }))), tb])));
      body.appendChild(el("p", { class: "u-note", text: "Feed assembled " + new Date(Date.parse(P.generatedAt)).toLocaleString() + ". Ages count from each source's last good answer." }));
    } else body.appendChild(el("p", { class: "u-note", text: "No source list: nothing from the data fabric is loaded." }));
    var s = st.sim;
    body.appendChild(el("p", { class: "u-note", text: "Model data built " + (D.built || "?") + " (nflverse schedule, results and lines). " + (s ? "Simulation: " + s.n.toLocaleString() + " seasons (" + MODE_NAMES[s.mode] + "), " + (s.where === "worker" ? "in a background worker" : "on the main thread (workers unavailable)") + ", " + (s.ms / 1000).toFixed(1) + " s." : st.simBusy ? "Simulation running…" : st.simError ? "Simulation failed: " + st.simError : "") }));
  });
}
