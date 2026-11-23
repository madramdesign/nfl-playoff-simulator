// Intelligence feed (right column) and the scrolling ticker. Headlines are shown exactly as the source gives them,
// with the publisher and a link (DEC-012); long ones are cut only by CSS.
var FEED_CHIPS = [
  ["breaking", "Breaking", null], ["news", "News", ["news", "qb_change"]], ["injury", "Injury", ["injury"]], ["transaction", "Transaction", ["transaction"]],
  ["odds", "Odds", ["odds_move"]], ["weather", "Weather", ["weather"]], ["game", "Game", ["game"]], ["model", "Model", ["model", "playoff_move"]]
];
var FEED_PAGE = 150;
var feedShown = FEED_PAGE, feedPanel = null;
// Pure: the feed's filter. chips: selected chip ids ([] = all types); "breaking" narrows to importance >= BREAKING_MIN.
function filterFeed(events, chips, range, now, query) {
  var types = [], breaking = chips.indexOf("breaking") >= 0;
  FEED_CHIPS.forEach(function (c) { if (c[2] && chips.indexOf(c[0]) >= 0) types = types.concat(c[2]); });
  var out = filterByTime(events, range, now).filter(function (e) {
    if (types.length && types.indexOf(e.type) < 0) return false;
    if (breaking && !(e.importance != null && e.importance >= BREAKING_MIN)) return false;
    return true;
  });
  return query ? searchEvents(out, query) : out;
}
var FEED_PLURAL = { breaking: "breaking items", news: "news", injury: "injuries", transaction: "transactions", odds: "odds moves", weather: "weather flags", game: "game updates", model: "model events" };
function feedEmptyText(chips, range, query) {
  var names = chips.length ? FEED_CHIPS.filter(function (c) { return chips.indexOf(c[0]) >= 0; }).map(function (c) { return FEED_PLURAL[c[0]]; }) : ["events"];
  return "No " + names.join(" or ") + " " + RANGE_PHRASE[range] + (query ? " matching \u201c" + query + "\u201d" : "") + ".";
}
function teamChip(i) {
  var t = TEAMS[i];
  return el("button", { type: "button", class: "u-tchip", "data-team": i, title: "Open " + t.name, style: t.color ? { "--tc": t.color } : null, text: t.a });
}
function eventRow(e, now) {
  var srcs = e.sourceCount > 1 ? e.sourceCount + " sources" : null;
  var title = e.url ? el("a", { href: e.url, target: "_blank", rel: "noopener", class: "u-ev-title", text: e.title }) : el("span", { class: "u-ev-title", text: e.title });
  var meta = [el("span", { class: "u-ev-pub", text: e.publisher || "" })];
  if (e.confidence != null) meta.push(el("span", { text: "confidence " + Math.round(e.confidence * 100) + "%" }));
  if (srcs) meta.push(el("span", { class: "u-ev-srcs", text: srcs, title: e.sources.map(function (s) { return s.publisher; }).join(", ") }));
  if (e.type === "weather") meta.push(weatherCredit(e.source));
  if (e.origin === "page") meta.push(el("span", { text: "curated news file" }));
  return el("li", { class: "u-ev u-ev-" + e.type + (e.importance != null && e.importance >= BREAKING_MIN ? " is-breaking" : ""), "data-id": e.id }, [
    el("div", { class: "u-ev-top" }, [
      el("time", { class: "u-ev-time", datetime: new Date(e.ts).toISOString(), title: e.dateOnly ? "Dated " + fmtDateUTC(e.ts) + " (no time given)" : new Date(e.ts).toLocaleString(), text: fmtRel(e.ts, now, e.dateOnly) }),
      el("span", { class: "u-ev-type", text: e.type.replace("_", " ") }),
      e.teams.slice(0, 4).map(teamChip), e.teams.length > 4 ? el("span", { class: "u-more", text: "+" + (e.teams.length - 4) }) : null]),
    title,
    el("div", { class: "u-ev-meta" }, meta),
    eventConflictNode(e),   // S-D: both injury reports side by side when sources differ (17-watch.js)
    e.importance != null ? el("div", { class: "u-imp", title: "Importance " + Math.round(e.importance) + " of 100 (a rule score from the feed, not a judgment)" }, [el("i", { style: { width: Math.round(e.importance) + "%" } })]) : null
  ]);
}
function buildFeedPanel(host) {
  var fids = ["rss-*", "espn-*", "curated-news", "nflverse-*", "open-meteo", "nws"];
  feedPanel = Panel({ id: "feed", title: "Intelligence feed", sources: fids, badge: buildOrFeedBadge(fids) });
  var chips = el("div", { class: "u-chips", role: "group", "aria-label": "Event types" });
  FEED_CHIPS.forEach(function (c) {
    chips.appendChild(el("button", { type: "button", class: "u-chipbtn", "data-chip": c[0], "aria-pressed": "false", text: c[1], onclick: function () {
      var cur = store.get("feedTypes").slice(), k = cur.indexOf(c[0]);
      if (k >= 0) cur.splice(k, 1); else cur.push(c[0]);
      feedShown = FEED_PAGE; store.set({ feedTypes: cur }); lsSet({ feedTypes: cur });
    } }));
  });
  feedPanel.root.insertBefore(chips, feedPanel.body);
  feedPanel.chips = chips;
  feedPanel.loading("Loading the feed…");
  host.appendChild(feedPanel.root);
  feedPanel.body.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target.closest("[data-team]") : null;
    if (t) { e.preventDefault(); openTeam(+t.getAttribute("data-team")); }
  });
}
function renderFeed() {
  if (!feedPanel) return;
  var st = store.get(), chips = st.feedTypes;
  Array.prototype.forEach.call(feedPanel.chips.children, function (b) { b.setAttribute("aria-pressed", chips.indexOf(b.getAttribute("data-chip")) >= 0 ? "true" : "false"); });
  var now = refNow(), q = (st.search || "").trim().toLowerCase();
  var list = focusEvents(filterFeed(st.model ? st.model.events : [], chips, st.timeRange, now, q), focusSet(st.focus));
  if (!list.length) {
    var gap = !st.payload ? " No feed data is loaded: no server answered and this build has no embedded snapshot, so silence here is not an all-clear." : "";
    feedPanel.empty(feedEmptyText(chips, st.timeRange, q).replace(/\.$/, focusPhrase(st.focus) + ".") + gap);
    return;
  }
  feedPanel.render(function (body) {
    if (st.model && st.model.fixture) body.appendChild(el("p", { class: "u-warnline", text: "Fixture data: synthetic events for development, not real news." }));
    if (!st.payload) body.appendChild(el("p", { class: "u-warnline", text: "Live feeds unavailable and no snapshot in this build: only the curated news built into the page is listed. Injuries, transactions and other news may be missing." }));
    var ul = el("ul", { class: "u-evlist" });
    var built = eventRows(list.slice(0, feedShown), now);
    built.rows.forEach(function (r) { ul.appendChild(r); });
    body.appendChild(ul);
    if (built.skipped) body.appendChild(el("p", { class: "u-warnline", text: built.skipped + " item" + (built.skipped > 1 ? "s" : "") + " could not be shown (malformed data)." }));
    body.appendChild(el("p", { class: "u-count", text: Math.min(feedShown, list.length) + " of " + list.length + " " + RANGE_PHRASE[st.timeRange] + focusPhrase(st.focus) }));
    if (list.length > feedShown) body.appendChild(el("button", { type: "button", class: "u-btn", "data-fk": "feed-more", text: "Show more", onclick: function () { feedShown += FEED_PAGE; renderFeed(); } }));
  });
}
// Ticker: the highest-importance items in range, one line, paused on hover or focus; static under reduced motion.
// Each event row is built on its own, so one malformed item is skipped rather than blanking the list.
function eventRows(list, now) {
  var rows = [], skipped = 0;
  list.forEach(function (e) { try { rows.push(eventRow(e, now)); } catch (err) { skipped++; uReport("event " + (e && e.id), err); } });
  return { rows: rows, skipped: skipped };
}
// Pure: which events the ticker shows (the highest importance in range).
function tickerEvents(events, range, now) {
  return filterByTime(events || [], range, now).filter(function (e) { return e.importance != null; })
    .sort(function (a, b) { return b.importance - a.importance || b.ts - a.ts; }).slice(0, 12);
}
var tickerKey = null;
function renderTicker(host) {
  var st = store.get(), now = refNow();
  var top = tickerEvents(focusEvents(st.model ? st.model.events : [], focusSet(st.focus)), st.timeRange, now);
  // rebuild (and so restart the scroll) only when the set of events changes
  var key = (st.payload ? "p" : "n") + "|" + (st.focus || "") + "|" + top.map(function (e) { return e.id; }).join(",");
  if (key === tickerKey && host.firstChild) return;
  tickerKey = key;
  clearNode(host);
  if (!top.length) { host.appendChild(el("p", { class: "u-tick-empty", text: st.payload ? "No scored events " + RANGE_PHRASE[st.timeRange] + focusPhrase(st.focus) + "." : "Ticker: no live feed and no embedded snapshot." })); return; }
  var track = el("div", { class: "u-track" });
  for (var copy = 0; copy < 2; copy++) top.forEach(function (e) {
    var item = el(e.url ? "a" : "span", { class: "u-tk", href: e.url || null, target: e.url ? "_blank" : null, rel: e.url ? "noopener" : null, "aria-hidden": copy ? "true" : null, tabindex: copy ? "-1" : null }, [
      el("b", { text: e.teams.map(teamAbbr).slice(0, 2).join(" ") || "NFL" }), el("span", { class: "u-tk-when", text: fmtRel(e.ts, now, e.dateOnly) }), e.title, el("span", { class: "u-tk-pub", text: " · " + e.publisher })]);
    track.appendChild(item);
  });
  track.style.animationDuration = Math.max(30, top.length * 9) + "s";
  host.appendChild(el("span", { class: "u-tk-label", text: "Top events" }));
  host.appendChild(el("div", { class: "u-tk-window" }, [track]));
}
NFLU.filterFeed = filterFeed;
NFLU.tickerEvents = tickerEvents;
NFLU.feedEmptyText = feedEmptyText;
