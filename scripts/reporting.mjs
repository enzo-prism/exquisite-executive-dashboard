export const TIME_ZONE = "America/Los_Angeles";

export function calendarDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function shiftDate(date, days) {
  return new Date(Date.parse(`${date}T12:00:00Z`) + days * 86400000).toISOString().slice(0, 10);
}

export function rangeFor(days, end) {
  const start = shiftDate(end, 1 - days);
  const previousEnd = shiftDate(start, -1);
  return { days, start, end, previousStart: shiftDate(previousEnd, 1 - days), previousEnd };
}

export function metric(value) {
  if ((typeof value !== "number" && typeof value !== "string") || String(value).trim() === "") throw new Error("Missing metric");
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error("Invalid metric");
  return parsed;
}

export function parseGa(report, dimensions, metrics) {
  if ((report.dimensionHeaders ?? []).map(d => d.name).join() !== dimensions.join() ||
      (report.metricHeaders ?? []).map(m => m.name).join() !== metrics.join()) throw new Error("Unexpected GA4 headers");
  if (report.metadata?.timeZone !== TIME_ZONE) throw new Error("Unexpected GA4 timezone");
  if ((report.rowCount ?? 0) > (report.rows?.length ?? 0)) throw new Error("Truncated GA4 report");
  return (report.rows ?? []).map(row => {
    if ((row.dimensionValues ?? []).length !== dimensions.length || row.metricValues?.length !== metrics.length) throw new Error("Incomplete GA4 row");
    return Object.fromEntries([...dimensions.map((name, i) => [name, row.dimensionValues[i].value]), ...metrics.map((name, i) => [name, metric(row.metricValues[i].value)])]);
  });
}

export function trendRows(range, gaDaily, searchDaily, searchEnd) {
  const ga = new Map(gaDaily.map(row => [row.date.replace(/^(\d{4})(\d{2})(\d{2})$/, "$1-$2-$3"), row]));
  const search = new Map(searchDaily.map(row => [row.date, row]));
  return Array.from({ length: range.days }, (_, i) => {
    const date = shiftDate(range.start, i);
    const a = ga.get(date);
    const s = search.get(date);
    return { date, label: new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, month: "short", day: "numeric" }).format(new Date(`${date}T20:00:00Z`)),
      activeUsers: a?.activeUsers ?? 0, sessions: a?.sessions ?? 0, conversions: a?.keyEvents ?? 0,
      clicks: date > searchEnd ? null : s?.clicks ?? 0, impressions: date > searchEnd ? null : s?.impressions ?? 0 };
  });
}

export function cleanPath(value) {
  if (!value || value === "(not set)") return "(not set)";
  return new URL(value, "https://exquisitedentistryla.com").pathname;
}

export function parseGsc(report, dimensions) {
  if (!["byProperty", "byPage"].includes(report.response_aggregation_type) || (report.dimensions ?? []).join() !== dimensions.join()) throw new Error("Unexpected Search Console report");
  return (report.rows ?? []).map(row => {
    if ((row.keys ?? []).length !== dimensions.length) throw new Error("Incomplete search dimensions");
    // gog's typed JSON output omits numeric zero fields (omitempty).
    const parsed = { clicks: metric(row.clicks ?? 0), impressions: metric(row.impressions ?? 0), ctr: metric(row.ctr ?? 0), position: metric(row.position ?? 0) };
    if (parsed.ctr > 1 || parsed.clicks > parsed.impressions) throw new Error("Invalid search counts");
    return { ...parsed, ...Object.fromEntries(dimensions.map((name, i) => [name.toLowerCase(), row.keys[i]])) };
  });
}
