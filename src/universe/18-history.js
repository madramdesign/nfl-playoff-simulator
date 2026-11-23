// Time machine: replay the intelligence feed as it stood at an earlier moment (state `asOf`, an ISO minute in UTC, or
// null for now; kept in the URL as ?asOf=2026-11-22T18:00Z).
// The rule that keeps later knowledge out: at asOf = T an item is shown only if this system had first SEEN it by T
// (seen <= T). Its event time (ts) is never enough, because a story dated before T may only have reached us after T.
// Time ranges then count back from T, not from the real now. Items with no recorded first-seen time are left out, and
// the banner says how many.
// History comes from three places, merged by event id with the earliest first-seen record winning: the archive
// embedded at build (D.eventArchive, made from data/fabric/events/ by scripts/event-archive.js), the snapshot embedded
// at build (D.fabric) and the current payload. Nothing is invented: an empty record means the control is disabled.
// Only the feed, the ticker and the map's event badges are replayed. Scores, lines, injuries, the simulation and
// everything else stay current, because no dated copies of them exist; the banner says so for as long as a replay is on.
var HIST_STEP_MS = 15 * 60e3;   // the slider moves in quarter hours

// ---- asOf: strict parsing. Returns the canonical form "YYYY-MM-DDTHH:MMZ" (seconds dropped), or null. ----
function parseAsOf(v, now) {
  if (typeof v !== "string") return null;
  var m = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})(?::\d{2}(?:\.\d{1,3})?)?Z$/.exec(v);
  if (!m) return null;
  var ms = Date.parse(m[1] + ":00Z");
  // a real calendar minute (Feb. 31 or 25:00 must not roll over into another day), not before 2000, not in the future
  if (!isFinite(ms) || new Date(ms).toISOString().slice(0, 16) !== m[1] || ms < 946684800000) return null;
  if (ms > (typeof now === "number" && isFinite(now) ? now : Date.now())) return null;
  return m[1] + "Z";
}
function asOfMs(a) { return typeof a === "string" ? Date.parse(a.slice(0, 16) + ":00Z") : NaN; }
function toAsOf(ms) { return new Date(Math.floor(ms / 60e3) * 60e3).toISOString().slice(0, 16) + "Z"; }

// ---- the archive ----
function looksLikeArchive(a) { return !!a && typeof a === "object" && a.v === 1 && Array.isArray(a.events); }
// Archive entries as raw events. An entry holding only {id, seenAt} refers to the event with that id in the snapshot
// embedded beside it; when that event is not there the entry is dropped (never filled in).
function expandArchive(archive, snapshotEvents) {
  if (!looksLikeArchive(archive)) return [];
  var byId = dict();
  (Array.isArray(snapshotEvents) ? snapshotEvents : []).forEach(function (e) { if (e && typeof e === "object" && e.id != null) byId[String(e.id)] = e; });
  var out = [];
  archive.events.forEach(function (e) {
    if (!e || typeof e !== "object" || e.id == null) return;
    if (e.title !== undefined) { out.push(e); return; }
    var body = byId[String(e.id)];
    if (body) out.push(Object.assign({}, body, { seenAt: e.seenAt }));
  });
  return out;
}
// Pure: several lists of raw events as one, one record per id. The record with the earliest first-seen time wins whole
// (so the headline, importance and source count are the ones recorded then, not later revisions); on a tie the earlier
// list wins. A record with no usable seenAt loses to any record that has one.
function mergeSeen(lists) {
  var by = dict(), order = [];
  (Array.isArray(lists) ? lists : []).forEach(function (L) {
    (Array.isArray(L) ? L : []).forEach(function (e) {
      if (!e || typeof e !== "object" || e.id == null) return;
      var id = String(e.id), s = Date.parse(e.seenAt), cur = by[id];
      if (!cur) { by[id] = { e: e, s: s }; order.push(id); return; }
      if (isFinite(s) && (!isFinite(cur.s) || s < cur.s)) by[id] = { e: e, s: s };
    });
  });
  return order.map(function (id) { return by[id].e; });
}
// Pure: everything the replay can draw on, as model events (01-data.js), newest first. pageEvents: the page's own
// curated news, which carries a date but no first-seen time; unless the same link is in the record, it is kept with an
// unknown seen time so the replay leaves it out and counts it.
function historyEvents(archive, snapshotEvents, payloadEvents, pageEvents) {
  var out = [], urls = dict();
  mergeSeen([expandArchive(archive, snapshotEvents), snapshotEvents, payloadEvents]).forEach(function (e) {
    if (typeof e.title !== "string" || !e.title) return;
    var n = normEvent(e); if (!isFinite(n.ts)) return;
    if (n.url) urls[n.url] = 1;
    out.push(n);
  });
  (Array.isArray(pageEvents) ? pageEvents : []).forEach(function (p) { if (p && !(p.url && urls[p.url])) out.push(Object.assign({}, p, { seen: NaN })); });
  out.sort(function (a, b) { return b.ts - a.ts || (b.importance || 0) - (a.importance || 0); });
  return out;
}
// Pure: the first and last first-seen times in a list of model events, or null when none has one.
function historySpan(events) {
  var from = Infinity, to = -Infinity, n = 0;
  (events || []).forEach(function (e) { if (e && isFinite(e.seen)) { n++; if (e.seen < from) from = e.seen; if (e.seen > to) to = e.seen; } });
  return n ? { from: from, to: to, n: n } : null;
}

// ---- the leakage rule ----
// Pure: what had been seen by T. Returns {events, later, unknown}: later = first seen after T (hidden, whatever their
// event time), unknown = no usable first-seen time (left out).
function replayFilter(events, T) {
  var shown = [], later = 0, unknown = 0;
  (Array.isArray(events) ? events : []).forEach(function (e) {
    if (!e || typeof e.seen !== "number" || !isFinite(e.seen)) { unknown++; return; }
    if (isFinite(T) && e.seen <= T) shown.push(e); else later++;
  });
  return { events: shown, later: later, unknown: unknown };
}
// Pure: the replayed list inside a time range, counted back from T (never from the real now).
function replayWindow(events, T, range) { return filterByTime(replayFilter(events, T).events, range, T); }

// ---- wording ----
function fmtLocal(ms) {
  if (!isFinite(ms)) return "an unknown time";
  var d = new Date(ms);
  try { return d.toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" }); } catch (e) { return d.toString().slice(0, 21); }
}
var REPLAY_RANGE = { live: "in the 30 minutes before", "1h": "in the hour before", "6h": "in the 6 hours before", "12h": "in the 12 hours before", "24h": "in the 24 hours before",
  "48h": "in the 48 hours before", "7d": "in the 7 days before", "30d": "in the 30 days before", season: "this season up to" };
// Pure: "in the last 7 days" now, "in the 7 days before <when>" in a replay. when: a ready-made time label.
function replayRangePhrase(range, when) { return when ? (REPLAY_RANGE[range] || REPLAY_RANGE[DEFAULT_RANGE]) + " " + when : RANGE_PHRASE[range]; }
var REPLAYED_TEXT = "Replayed from first-seen times: the intelligence feed, the ticker and the map's news, transaction and breaking badges; time ranges count back from this moment.";
var CURRENT_TEXT = "Not replayed, still current, because no dated copies of them exist: scores, lines, injuries, the simulation and playoff chances, team and game pages, the brief and media.";
// Pure: the banner's sentences. o: {when, from (label or null), shown, unknown, before (T is earlier than the record)}.
function replayBannerText(o) {
  var bits = [REPLAYED_TEXT, CURRENT_TEXT];
  bits.push(o.from ? "The event record begins " + o.from + "; anything first seen before then is missing from the replay." : "No dated event record is available.");
  if (o.before) bits.push("This moment is before the record begins, so nothing is shown.");
  else bits.push(o.shown + " item" + (o.shown === 1 ? " had" : "s had") + " been seen by then.");
  if (o.unknown) bits.push(o.unknown + " item" + (o.unknown === 1 ? "" : "s") + " with no recorded first-seen time " + (o.unknown === 1 ? "is" : "are") + " left out.");
  return { main: "Replaying the feed as of " + o.when, info: bits.join(" ") };
}

// ---- state: what the feed, the ticker and the map's badges read (the only callers are marked in those files) ----
var hist = { model: null, payload: null, list: [], span: null, asOf: null, replay: null, banner: null, box: null, timer: 0 };
function histAll(st) {
  if (hist.model !== st.model || hist.payload !== st.payload || !hist.list) {
    var page = st.model ? st.model.events.filter(function (e) { return e.origin === "page"; }) : [];
    hist.list = historyEvents(D.eventArchive, D.fabric && Array.isArray(D.fabric.events) ? D.fabric.events : [], st.payload && Array.isArray(st.payload.events) ? st.payload.events : [], page);
    hist.span = historySpan(hist.list); hist.model = st.model; hist.payload = st.payload; hist.asOf = null; hist.replay = null;
  }
  return hist;
}
function replayState(st) {
  var h = histAll(st);
  if (h.asOf !== st.asOf || !h.replay) { h.replay = replayFilter(h.list, asOfMs(st.asOf)); h.asOf = st.asOf; }
  return h.replay;
}
function feedSource(st) { return st.asOf ? replayState(st).events : st.model ? st.model.events : []; }
function feedNow(st) { return st.asOf ? asOfMs(st.asOf) : refNow(); }
function rangePhrase(st) { return replayRangePhrase(st.timeRange, st.asOf ? fmtLocal(asOfMs(st.asOf)) : null); }
function tickerLabel(st) { return st.asOf ? "Replay" : "Top events"; }
// One line for the top of the feed while replaying ("" otherwise).
function replayFeedNote(st) {
  if (!st.asOf) return "";
  var r = replayState(st);
  return "Replay: the feed as first seen by " + fmtLocal(asOfMs(st.asOf)) + ". Times are counted from that moment." +
    (r.unknown ? " " + r.unknown + " item" + (r.unknown === 1 ? "" : "s") + " with no recorded first-seen time left out." : "");
}

// ---- the rail control ----
function setAsOf(ms) {
  var now = Date.now(), a = isFinite(ms) && ms < now - 30e3 ? parseAsOf(toAsOf(ms), now) : null;
  store.set({ asOf: a });
}
function localInputValue(ms) { var d = new Date(ms), p = function (n) { return (n < 10 ? "0" : "") + n; }; return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + "T" + p(d.getHours()) + ":" + p(d.getMinutes()); }
function historyControl() {
  var input = el("input", { type: "datetime-local", id: "uAsOf", class: "u-hist-when", step: "60", "data-fk": "asof-input", "aria-describedby": "uHistNote" });
  var slide = el("input", { type: "range", id: "uAsOfSlide", class: "u-hist-slide", min: "0", max: "1", step: "1", value: "1", "data-fk": "asof-slide", "aria-label": "Replay time, from the start of the event record to now" });
  var back = el("button", { type: "button", class: "u-btn u-small", id: "uAsOfNow", "data-fk": "asof-now", text: "Back to now", onclick: function () { store.set({ asOf: null }); } });
  input.addEventListener("change", function () { var t = input.value ? new Date(input.value).getTime() : NaN; setAsOf(t); var a = store.get("asOf"); input.value = a ? localInputValue(asOfMs(a)) : ""; });
  slide.addEventListener("input", function () {
    var k = +slide.value, max = +slide.max, t = k >= max ? NaN : hist.slideFrom + k * HIST_STEP_MS;
    slide.setAttribute("aria-valuetext", isFinite(t) ? fmtLocal(t) : "Now");
    clearTimeout(hist.timer); hist.timer = setTimeout(function () { setAsOf(t); }, 80);
  });
  hist.box = el("div", { class: "u-hist", id: "uHist" }, [
    el("label", { class: "u-hist-label", for: "uAsOf", text: "Replay the feed as of" }), input, slide,
    el("div", { class: "u-hist-row" }, [back, el("span", { class: "u-hist-state", id: "uHistState" })]),
    el("p", { class: "u-note", id: "uHistNote" })]);
  return hist.box;
}
function buildHistory() {
  var top = byId("uTop"); if (!top || byId("uReplay")) return;
  var back = el("button", { type: "button", class: "u-btn u-small u-rp-back", "data-fk": "replay-now", text: "Back to now", onclick: function () {
    store.set({ asOf: null });
    // the banner is gone: hand the keyboard to the control that started the replay, or to the rail's own toggle
    var a = byId("uAsOf"), t = document.querySelector(".u-railtoggle"), to = a && a.offsetParent ? a : t;
    if (to && to.focus) to.focus();
  } });
  // On narrow screens the banner stays pinned while the page scrolls, so its details can be folded away there (they
  // start open); on wide screens they are always shown.
  var more = el("button", { type: "button", class: "u-btn u-small u-rp-more", "data-fk": "replay-more", "aria-expanded": "true", "aria-controls": "uReplayInfo", text: "Hide details", onclick: function () {
    var min = hist.banner.classList.toggle("is-min");
    more.setAttribute("aria-expanded", min ? "false" : "true"); more.textContent = min ? "Show details" : "Hide details";
  } });
  hist.banner = el("div", { class: "u-replay", id: "uReplay", hidden: true }, [
    el("p", { class: "u-rp-main", role: "status" }, [el("span", { class: "u-rp-tag", text: "Replay" }), el("span", { class: "u-rp-text" })]), back, more, el("p", { class: "u-rp-info", id: "uReplayInfo" })]);
  top.parentNode.insertBefore(hist.banner, top.nextSibling);
  var st = store.get();
  // a replay time from the URL with nothing to replay is dropped rather than shown over an empty record
  if (st.asOf && !histAll(st).span) store.set({ asOf: null });
}
function renderHistory() {
  if (!HAS_DOM || !store) return;
  var st = store.get(), h = histAll(st), span = h.span, now = Date.now(), T = st.asOf ? asOfMs(st.asOf) : NaN, on = !!st.asOf;
  document.documentElement.classList.toggle("u-replaying", on);
  if (hist.box) {
    var input = byId("uAsOf"), slide = byId("uAsOfSlide"), note = byId("uHistNote"), state = byId("uHistState"), back = byId("uAsOfNow");
    input.disabled = slide.disabled = !span;
    back.disabled = !on;
    if (span) {
      var from = Math.ceil(span.from / HIST_STEP_MS) * HIST_STEP_MS, steps = Math.max(1, Math.ceil((now - from) / HIST_STEP_MS));
      hist.slideFrom = from;
      input.min = localInputValue(from); input.max = localInputValue(now);
      if (document.activeElement !== input) input.value = on ? localInputValue(T) : "";
      slide.max = String(steps);
      var pos = on ? clamp(Math.round((T - from) / HIST_STEP_MS), 0, steps - 1) : steps;
      if (document.activeElement !== slide) slide.value = String(pos);
      slide.setAttribute("aria-valuetext", on ? fmtLocal(T) : "Now");
      state.textContent = on ? fmtLocal(T) : "Showing now";
      var arc = looksLikeArchive(D.eventArchive) && D.eventArchive.events.length;
      note.textContent = "The event record holds " + span.n + " item" + (span.n === 1 ? "" : "s") + " first seen from " + fmtLocal(span.from) + " to " + fmtLocal(span.to) +
        (arc ? "" : " (this build has no dated archive, so that is only the current feed)") + ". Only the feed, the ticker and the map's event badges are replayed.";
    } else {
      input.value = ""; state.textContent = "Unavailable";
      note.textContent = "Replay is unavailable: this build has no dated event archive and the current feed holds no events with a first-seen time.";
    }
  }
  if (!hist.banner) return;
  var show = on && st.view === "universe";
  if (hist.banner.hidden === show) hist.banner.hidden = !show;
  if (!on) return;
  var r = replayState(st), txt = replayBannerText({ when: fmtLocal(T), from: span ? fmtLocal(span.from) : null, shown: r.events.length, unknown: r.unknown, before: !!span && T < span.from });
  var main = hist.banner.querySelector(".u-rp-text"), info = hist.banner.querySelector(".u-rp-info");
  if (main.textContent !== txt.main) main.textContent = txt.main;
  if (info.textContent !== txt.info) info.textContent = txt.info;
}

Object.assign(NFLU, { parseAsOf: parseAsOf, asOfMs: asOfMs, toAsOf: toAsOf, mergeSeen: mergeSeen, expandArchive: expandArchive, historyEvents: historyEvents, historySpan: historySpan,
  replayFilter: replayFilter, replayWindow: replayWindow, replayRangePhrase: replayRangePhrase, replayBannerText: replayBannerText, HIST_STEP_MS: HIST_STEP_MS });
