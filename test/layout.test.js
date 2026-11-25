// Panel layout logic (src/universe/17-layout.js), loaded from the built page with no DOM: sanitising saved layouts,
// reordering, hiding, sizes, the map divider and reset. Run: node test/layout.test.js
const fs = require("fs"), path = require("path"), assert = require("assert");
const html = fs.readFileSync(path.join(__dirname, "..", "public", "index.html"), "utf8");
const engine = html.match(/<script id="engine">([\s\S]*?)<\/script>/)[1];
const universe = html.match(/<script id="universe">([\s\S]*?)<\/script>/)[1];
const U = new Function(engine + "\n" + universe + "\n;return globalThis.NFLU")();
// The registry (six panels since NFL TV, DEC-022) is checked first. The rest of the file exercises the layout logic on the
// five panels it was written for: the functions take the panel list as an argument, so the logic is the same.
const REG = U && U.layout;
const FIVE = ["feed", "media", "games", "teams", "health"];
const Y = REG && Object.assign({}, REG, { defaultLayout: (ids) => REG.defaultLayout(ids || FIVE), sanitizeLayout: (raw, ids) => REG.sanitizeLayout(raw, ids || FIVE),
  loadLayout: (ids) => REG.loadLayout(ids || FIVE) });
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepStrictEqual(a, b, m); n++; };
ok(Y && typeof Y.sanitizeLayout === "function", "the layout functions are exposed without a DOM");
ok(!U.booted, "nothing boots without a DOM");

// ---- the registry: six panels, NFL TV first in the panel column ----
const R0 = REG.defaultLayout();
eq(REG.PANEL_IDS, ["feed", "media", "tv", "games", "teams", "health"], "the six panels, in phone tab order");
eq(R0.zones, { left: ["teams"], right: ["tv", "feed", "media", "health"], bottom: ["games"] }, "NFL TV sits at the top of the panel column");
eq(R0.tabs, ["feed", "media", "tv", "games", "teams", "health"], "phone tabs: Feed, Media, NFL TV, Games, Teams, Health");
ok(REG.PANEL_IDS.every((id) => typeof REG.PANEL_NAMES[id] === "string" && REG.PANEL_NAMES[id]) && REG.PANEL_NAMES.tv === "NFL TV", "every panel has a display name");
const savedBeforeTv = { v: 1, zones: { left: ["teams"], right: ["feed", "health", "media"], bottom: ["games"] }, tabs: ["feed", "media", "games", "teams", "health"], hidden: ["health"], sizes: { feed: { h: 400 } }, split: 0.6 };
const afterTv = REG.sanitizeLayout(savedBeforeTv);
eq([afterTv.zones.right, afterTv.tabs, afterTv.hidden, afterTv.sizes, afterTv.split], [["tv", "feed", "health", "media"], ["feed", "media", "games", "teams", "health", "tv"], ["health"], { feed: { h: 400 } }, 0.6],
  "a layout saved before NFL TV keeps everything and gains the new panel at the top of its default column and at the end of the tabs");
eq(REG.sanitizeLayout({ v: 1, zones: { left: ["teams"], right: ["health"], bottom: ["games", "feed", "media"] } }).zones.right, ["tv", "health"], "before the next default panel still in the column");
eq(REG.sanitizeLayout({ v: 1, zones: { left: ["teams", "health"], right: [], bottom: ["games", "feed", "media"] } }).zones.right, ["tv"], "alone in an emptied column");

const IDS = FIVE;
const D0 = Y.defaultLayout();
const all = (L) => Y.flatOrder(L).slice().sort();
const frozen = (L) => JSON.parse(JSON.stringify(L));

// ---- defaults ----
eq(D0.zones, { left: ["teams"], right: ["feed", "media", "health"], bottom: ["games"] }, "default arrangement matches today's page");
eq(D0.tabs, ["feed", "media", "games", "teams", "health"], "default phone tabs: Feed, Media, Games, Teams, Health");
eq([D0.hidden, D0.sizes, D0.split], [[], {}, null], "nothing hidden, no sizes, default map width");
ok(IDS.every((id) => typeof Y.PANEL_NAMES[id] === "string" && Y.PANEL_NAMES[id]), "every panel has a display name");
eq(all(D0), IDS.slice().sort(), "every panel is placed exactly once");
eq(Y.defaultLayout(["feed", "media", "extra"]).zones, { left: [], right: ["feed", "media", "extra"], bottom: [] }, "unknown-to-the-defaults panels go to the panel column; absent ones are left out");

// ---- sanitising what was saved (storage may hold anything) ----
for (const bad of [undefined, null, 0, 1, "x", "{}", [], [1, 2], true, { v: 2 }, { v: "1" }, {}]) {
  eq(Y.sanitizeLayout(bad), D0, "falls back to the defaults for " + JSON.stringify(bad));
}
const saved = { v: 1, zones: { left: ["feed", "bogus", "feed"], right: ["media", "feed", "__proto__", 7, null], bottom: ["games", "teams"] }, tabs: ["health", "x", "health", "games"],
  hidden: ["media", "nope", "media"], sizes: { feed: { h: 50, w: 9 }, media: { h: 1e9, w: 0 }, games: { h: "300", w: NaN }, bogus: { h: 300 }, __proto__: { h: 300 }, teams: "big", health: { h: 333.4, w: 2.6 } },
  split: 0.1 };
const S = Y.sanitizeLayout(saved);
eq(S.zones.left, ["feed"], "unknown ids and duplicates dropped from a zone");
eq(S.zones.right, ["media", "health"], "a panel already placed in an earlier zone is not placed twice; junk dropped; health, missing from the save, returns to its default zone");
eq(S.zones.bottom, ["games", "teams"], "valid zones kept as saved");
eq(all(S), IDS.slice().sort(), "after sanitising every known panel is placed exactly once");
eq(S.tabs, ["health", "games", "feed", "media", "teams"], "tabs: known and unique first, missing ones appended in default order");
eq(S.hidden, ["media"], "hidden: known and unique only");
eq(S.sizes.feed, { h: Y.LIM.minH, w: Y.LIM.maxSpan }, "sizes clamped to the minimum height and the maximum span");
eq(S.sizes.media, { h: Y.LIM.maxH, w: 1 }, "sizes clamped to the maximum height and at least one column");
ok(!("games" in S.sizes), "non-numeric and NaN sizes dropped");
ok(!("bogus" in S.sizes) && !("teams" in S.sizes) && Object.getPrototypeOf(S.sizes) === Object.prototype && !Object.prototype.hasOwnProperty.call(S.sizes, "__proto__"), "unknown ids, non-object sizes and __proto__ ignored");
eq(S.sizes.health, { h: 333, w: 3 }, "sizes rounded");
eq(S.split, Y.LIM.minSplit, "map share clamped to its minimum");
eq(Y.sanitizeLayout({ v: 1, split: 0.99 }).split, Y.LIM.maxSplit, "map share clamped to its maximum");
eq(Y.sanitizeLayout({ v: 1, split: "0.5" }).split, null, "a string map share is ignored");
eq(Y.sanitizeLayout({ v: 1, split: Infinity }).split, null, "an infinite map share is ignored");
eq(Y.sanitizeLayout({ v: 1, zones: "nope", tabs: "nope", hidden: "feed", sizes: [1] }), D0, "wrong shapes fall back field by field");
eq(Y.sanitizeLayout({ v: 1, zones: { right: ["feed"] } }).zones, { left: ["teams"], right: ["feed", "media", "health"], bottom: ["games"] }, "zones missing from a saved layout get their default panels");
eq(Y.sanitizeLayout({ v: 1, hidden: IDS.slice() }).hidden, [], "a saved layout that hides everything shows everything");
eq(Y.sanitizeLayout({ v: 1, hidden: ["feed", "media", "games", "teams"] }).hidden, ["feed", "media", "games", "teams"], "hiding all but one is allowed");
const big = { v: 1, zones: { right: Array(5000).fill("feed") }, tabs: Array(5000).fill("x") };
eq(all(Y.sanitizeLayout(big)), IDS.slice().sort(), "huge saved arrays are read safely");
const sub = Y.sanitizeLayout({ v: 1, zones: { left: ["teams", "media"], right: ["feed"] }, hidden: ["teams"] }, ["feed", "teams"]);
eq([sub.zones, sub.tabs, sub.hidden], [{ left: ["teams"], right: ["feed"], bottom: [] }, ["feed", "teams"], ["teams"]], "sanitising against a smaller panel list keeps only those ids");
const custom = Y.setSplit(Y.setSize(Y.setHidden(Y.movePanel(D0, "games", "right", 0), "health", true), "feed", { h: 420, w: 2 }), 0.55);
eq(Y.sanitizeLayout(JSON.parse(JSON.stringify(custom))), custom, "a layout survives the round trip through storage");
eq(Y.sanitizeLayout(Y.sanitizeLayout(saved)), Y.sanitizeLayout(saved), "sanitising is idempotent");

// ---- storage: blocked, empty, malformed, valid ----
const realLS = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
const setLS = (v) => Object.defineProperty(globalThis, "localStorage", { value: v, configurable: true, writable: true });
setLS({ getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } });
eq(Y.loadLayout(), D0, "blocked storage gives the defaults");
setLS({ getItem: () => null });
eq(Y.loadLayout(), D0, "empty storage gives the defaults");
setLS({ getItem: () => "{not json" });
eq(Y.loadLayout(), D0, "malformed storage gives the defaults");
setLS({ getItem: () => JSON.stringify({ layout: "x", theme: "dark" }) });
eq(Y.loadLayout(), D0, "a non-object saved layout gives the defaults");
setLS({ getItem: () => JSON.stringify({ layout: custom }) });
eq(Y.loadLayout(), custom, "a saved layout is read back");
if (realLS) Object.defineProperty(globalThis, "localStorage", realLS); else delete globalThis.localStorage;

// ---- reorder ----
const before = frozen(D0);
const m1 = Y.movePanel(D0, "games", "right", 1);
eq(m1.zones, { left: ["teams"], right: ["feed", "games", "media", "health"], bottom: [] }, "move into another zone at an index");
eq(D0, before, "the input layout is never changed");
eq(Y.movePanel(D0, "feed", "bottom", 99).zones.bottom, ["games", "feed"], "an index past the end appends");
eq(Y.movePanel(D0, "feed", "bottom", -5).zones.bottom, ["feed", "games"], "a negative index puts it first");
eq(Y.movePanel(D0, "feed", "sideways", 0), D0, "an unknown zone changes nothing");
eq(Y.movePanel(D0, "bogus", "left", 0), D0, "an unknown panel changes nothing");
eq(Y.placeBefore(D0, "health", "right", "feed").zones.right, ["health", "feed", "media"], "drop before a panel");
eq(Y.placeBefore(D0, "feed", "right", null).zones.right, ["media", "health", "feed"], "drop at the end of a zone");
eq(Y.placeBefore(D0, "feed", "right", "feed").zones.right, ["media", "health", "feed"], "dropping before itself is the end, never a loss");
eq(Y.placeBefore(D0, "teams", "bottom", "games").zones, { left: [], right: ["feed", "media", "health"], bottom: ["teams", "games"] }, "drop into another zone before its panel");

// one place at a time (keyboard and menu arrows), wide order: left column, panel column, bottom row
eq(Y.moveBy(D0, "media", -1, "wide").zones.right, ["media", "feed", "health"], "up one within a zone");
eq(Y.moveBy(D0, "media", 1, "wide").zones.right, ["feed", "health", "media"], "down one within a zone");
eq(Y.moveBy(D0, "feed", -1, "wide").zones, { left: ["teams", "feed"], right: ["media", "health"], bottom: ["games"] }, "up from the top of a zone goes to the end of the previous zone");
eq(Y.moveBy(D0, "health", 1, "wide").zones, { left: ["teams"], right: ["feed", "media"], bottom: ["health", "games"] }, "down from the end of a zone goes to the start of the next");
eq(Y.moveBy(D0, "teams", -1, "wide"), D0, "the first panel cannot move up");
eq(Y.moveBy(D0, "games", 1, "wide"), D0, "the last panel cannot move down");
const hidMedia = Y.setHidden(D0, "media", true);
eq(Y.moveBy(hidMedia, "health", -1, "wide").zones.right, ["health", "feed", "media"], "hidden panels are skipped: health jumps over hidden media and swaps with feed");
eq(Y.moveBy(hidMedia, "media", -1, "wide"), hidMedia, "a hidden panel does not move");
eq(Y.moveBy(D0, "feed", 0, "wide"), D0, "no direction, no change");
eq(Y.moveBy(D0, "bogus", 1, "wide"), D0, "an unknown panel does not move");
let walk = D0;
for (let i = 0; i < 10; i++) walk = Y.moveBy(walk, "teams", 1, "wide");
eq(walk.zones, { left: [], right: ["feed", "media", "health"], bottom: ["games", "teams"] }, "repeated moves walk through every place and stop at the end");
eq(all(walk), IDS.slice().sort(), "no panel is lost or duplicated by moves");

// phone tabs
eq(Y.moveBy(D0, "games", -1, "tabs").tabs, ["feed", "games", "media", "teams", "health"], "tab moves earlier");
eq(Y.moveBy(D0, "games", 1, "tabs").tabs, ["feed", "media", "teams", "games", "health"], "tab moves later");
eq(Y.moveBy(D0, "feed", -1, "tabs"), D0, "first tab stays first");
eq(Y.moveBy(D0, "health", 1, "tabs"), D0, "last tab stays last");
eq(Y.moveBy(hidMedia, "games", -1, "tabs").tabs, ["games", "feed", "media", "teams", "health"], "tab moves skip hidden tabs");
eq(Y.moveBy(D0, "games", 1, "tabs").zones, D0.zones, "tab moves leave the wide arrangement alone");
eq(Y.moveBy(D0, "games", 1, "wide").tabs, D0.tabs, "wide moves leave the tab order alone");

// ---- hide and show ----
eq(hidMedia.hidden, ["media"], "hide a panel");
eq(Y.setHidden(hidMedia, "media", true), hidMedia, "hiding twice is a no-op");
eq(Y.setHidden(hidMedia, "media", false).hidden, [], "show it again");
eq(Y.setHidden(D0, "bogus", true), D0, "an unknown panel cannot be hidden");
let h4 = D0;
["feed", "media", "games", "teams"].forEach((id) => { h4 = Y.setHidden(h4, id, true); });
eq(Y.setHidden(h4, "health", true), h4, "the last shown panel cannot be hidden");
eq(Y.describePos(D0, "media", true), "Media: 2 of 3 in the panel column", "position described for screen readers");
eq(Y.describePos(hidMedia, "health", true), "System health: 2 of 2 in the panel column", "hidden panels are not counted");
eq(Y.describePos(D0, "teams", false), "Teams: tab 4 of 5", "tab position described on phones");

// ---- sizes ----
eq(Y.setSize(D0, "feed", { h: 400 }).sizes, { feed: { h: 400 } }, "set a height");
eq(Y.setSize(D0, "feed", { h: 5, w: 99 }).sizes.feed, { h: Y.LIM.minH, w: Y.LIM.maxSpan }, "sizes clamp");
eq(Y.setSize(Y.setSize(D0, "feed", { h: 400, w: 2 }), "feed", { h: null }).sizes, { feed: { w: 2 } }, "null clears one size");
eq(Y.setSize(Y.setSize(D0, "feed", { h: 400 }), "feed", { h: null }).sizes, {}, "clearing the last size removes the entry");
eq(Y.setSize(D0, "feed", { h: "400" }).sizes, {}, "a non-number size is ignored");
eq(Y.setSize(D0, "bogus", { h: 400 }), D0, "an unknown panel gets no size");
eq([Y.clampH(119.4), Y.clampH(1e6), Y.clampSpan(0), Y.clampSpan(3.4)], [120, 1600, 1, 3], "clamp helpers");
eq([Y.zoneCols(384), Y.zoneCols(607), Y.zoneCols(608), Y.zoneCols(1424), Y.zoneCols(99999), Y.zoneCols(0), Y.zoneCols(NaN), Y.zoneCols(-5)], [1, 1, 2, 4, 4, 1, 1, 1], "columns a zone holds (300 px columns, 8 px gaps, at most 4)");
eq([Y.spanFor(D0, "feed", "right", 1, 3), Y.spanFor(D0, "feed", "right", 3, 3), Y.spanFor(D0, "feed", "right", 2, 3), Y.spanFor(D0, "feed", "right", 2, 1)], [1, 1, 1, 2], "panel-column panels: one column each, a lone panel fills the row");
eq([Y.spanFor(D0, "games", "bottom", 4, 1), Y.spanFor(D0, "games", "bottom", 4, 2), Y.spanFor(D0, "games", "bottom", 4, 9), Y.spanFor(D0, "games", "bottom", 4, 0)], [4, 2, 1, 4], "bottom-row panels share the row");
eq([0, 1, 2].map((i) => Y.spanFor(D0, "x", "bottom", 4, 3, i)), [2, 1, 1], "no empty column: 3 panels in 4 columns span 2, 1, 1");
eq([0, 1].map((i) => Y.spanFor(D0, "x", "right", 3, 2, i)), [2, 1], "no empty column: 2 panels in 3 columns span 2, 1");
for (const [cols, n] of [[1, 1], [2, 1], [2, 2], [3, 1], [3, 2], [3, 3], [4, 1], [4, 2], [4, 3], [4, 4]]) {
  const spans = Array.from({ length: n }, (_, i) => Y.spanFor(D0, "x", "right", cols, n, i));
  ok(spans.reduce((a, b) => a + b, 0) === cols && Y.gridRows(spans, cols) === 1, "default spans fill exactly one row: " + n + " panels in " + cols + " columns");
}
const wide2 = Y.setSize(D0, "feed", { w: 3 });
eq([Y.spanFor(wide2, "feed", "right", 2, 3), Y.spanFor(wide2, "feed", "right", 4, 3), Y.spanFor(wide2, "feed", "right", 0, 3)], [2, 3, 1], "a set width never exceeds the zone's columns");

eq([Y.gridRows([1, 1], 2), Y.gridRows([1, 1, 1], 2), Y.gridRows([2, 1], 2), Y.gridRows([1, 2, 1], 2), Y.gridRows([], 3), Y.gridRows([5], 2)], [1, 2, 2, 3, 1, 1], "rows a grid zone needs, placed in order");

// ---- the map divider ----
eq(Y.setSplit(D0, 0.6).split, 0.6, "set the map share");
eq([Y.setSplit(D0, 0).split, Y.setSplit(D0, 2).split], [Y.LIM.minSplit, Y.LIM.maxSplit], "the share clamps");
eq(Y.setSplit(Y.setSplit(D0, 0.6), null).split, null, "null restores the default width");
eq(Y.setSplit(D0, NaN), D0, "NaN is ignored");
eq(Y.panelWidthCss(null), null, "default: the style sheet's 384 px");
eq(Y.panelWidthCss(0.6), "clamp(300px, calc((100% - 276px) * 0.400), calc(100% - 596px))", "the panel column's width keeps both sides at their minimum");
ok(/calc\(\(100% - 276px\) \* 0\.100\)/.test(Y.panelWidthCss(0.99)), "the CSS uses the clamped share");
eq(Y.LIM.maxSplit, 0.9, "the map can take up to 90%, enough for the default panel column on a 4K-wide screen");
// map left edge 268, panel column right edge 1432: 1148 px for map + panels after two 8 px gaps
eq(Y.splitAt(268 + 8 + 574, 268, 1432), 0.5, "a divider in the middle is a half share");
eq(Y.splitAt(0, 268, 1432), Y.LIM.minSplit, "dragging far left stops at the minimum share");
eq(Y.splitAt(5000, 268, 1432), Y.LIM.maxSplit, "dragging far right stops at the maximum share");
eq(Y.splitAt(300, 300, 300), null, "no room: no share");

// ---- reset ----
eq(Y.defaultLayout(), D0, "reset gives the defaults");
eq(Y.sanitizeLayout(null), Y.defaultLayout(), "a reset layout is saved as null and reads back as the defaults");

// ---- the shell markup the layout code needs ----
for (const id of ["uZoneLeft", "uZoneRight", "uZoneBottom", "uSplit", "uPanels", "uPanelsMenu", "uMoveHint", "uLayoutLive", "uFeedHost", "uTeamsHost", "uHealthHost", "uGamesHost"]) {
  ok(new RegExp('id="' + id + '"').test(html), "the page has #" + id);
}
ok(/id="uSplit"[^>]*role="separator"/.test(html) && /id="uPanels"[^>]*aria-expanded="false"/.test(html), "divider and menu button carry their roles");

// ---- review fixes (Nov. 22). Source checks only: these behaviours need a browser, and were checked in one ----
ok(/\.u-top\{position:sticky;top:0;z-index:30;/.test(html) && /\.u-top\.is-menu-open\{z-index:42\}/.test(html), "the top bar sits under the drawer except while its menu is open");
ok(/\.u-rh\{[^}]*bottom:0;/.test(html) && /\.u-rw\{[^}]*right:0;/.test(html), "resize handles stay inside their panel, so the columns never scroll for them");
ok(/addEventListener\("focusin"[^\n]*closeMenu\(false\)/.test(html), "focus moving out of the Panels menu closes it");
ok(/r = visibleRect\(zel\)/.test(html), "drops only land in the visible part of a zone");

console.log("layout: " + n + " checks passed");
