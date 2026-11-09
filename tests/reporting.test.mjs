import assert from "node:assert/strict";
import test from "node:test";
import { calendarDate, cleanPath, parseGa, parseGsc, rangeFor, trendRows } from "../scripts/reporting.mjs";

test("completed Pacific periods remain correct across DST and the UTC midnight boundary", () => {
  assert.equal(calendarDate(new Date("2026-11-09T05:15:00Z")), "2026-11-08");
  assert.deepEqual(rangeFor(30, "2026-11-07"), { days: 30, start: "2026-10-09", end: "2026-11-07", previousStart: "2026-09-09", previousEnd: "2026-10-08" });
});
test("period unique-user reports retain exact values and reject truncated or malformed data", () => {
  const report = { metadata: { timeZone: "America/Los_Angeles" }, metricHeaders: [{ name: "activeUsers" }], rowCount: 1, rows: [{ metricValues: [{ value: "28" }] }] };
  assert.equal(parseGa(report, [], ["activeUsers"])[0].activeUsers, 28);
  assert.throws(() => parseGa({ ...report, rowCount: 2 }, [], ["activeUsers"]));
  assert.throws(() => parseGa({ ...report, rows: [{ metricValues: [{ value: "bad" }] }] }, [], ["activeUsers"]));
});
test("unpublished Search Console days remain null while measured empty days are zero", () => {
  const rows = trendRows(rangeFor(3, "2026-11-07"), [], [{ date: "2026-11-05", clicks: 2, impressions: 50 }], "2026-11-06");
  assert.deepEqual(rows.map(row => row.clicks), [2, 0, null]);
});
test("public landing-page breakdowns never preserve query strings or fragments", () => {
  assert.equal(cleanPath("/contact?email=private@example.com#form"), "/contact");
  assert.equal(cleanPath("(not set)"), "(not set)");
});

test("gog's omitted zero clicks remain measured zeros, not missing source failures", () => {
  const rows = parseGsc({ response_aggregation_type: "byProperty", dimensions: ["DATE"], rows: [{ keys: ["2026-11-05"], impressions: 249, position: 13.6 }] }, ["DATE"]);
  assert.equal(rows[0].clicks, 0);
  assert.equal(rows[0].ctr, 0);
  assert.throws(() => parseGsc({}, []));
});
