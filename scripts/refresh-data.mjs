import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const account = process.env.GOGCLI_ACCOUNT ?? "enzo@design-prism.com";
const gogcli = process.env.GOGCLI_BIN ?? "/Users/enzo/.local/bin/gogcli";
const ga4Property = process.env.GA4_PROPERTY ?? "properties/498175984";
const ga4Name = process.env.GA4_NAME ?? "Exquisite Dentistry - Live";
const gscSite = process.env.GSC_SITE ?? "sc-domain:exquisitedentistryla.com";
const githubRepo =
  process.env.SOURCE_GITHUB_REPO ?? "enzo-prism/exquisite-dentistry";

const today = new Date();
const endDate = shiftLocalDate(today, -1);
const startDate = shiftLocalDate(endDate, -29);
const previousEndDate = shiftLocalDate(startDate, -1);
const previousStartDate = shiftLocalDate(previousEndDate, -29);
const commitSince = shiftLocalDate(today, -60);

function shiftLocalDate(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function dateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function labelDate(value) {
  const normalized = value.length === 8
    ? `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`
    : value;
  const date = new Date(`${normalized}T12:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function runJson(command, args) {
  console.log(`Running ${path.basename(command)} ${args.slice(0, 4).join(" ")}...`);
  const output = execFileSync(command, args, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 40,
    stdio: ["ignore", "pipe", "pipe"],
  });
  return JSON.parse(output);
}

function gaReport({ from, to, metrics, dimensions, max = "250000" }) {
  return runJson(gogcli, [
    "analytics",
    "report",
    ga4Property,
    "--account",
    account,
    `--from=${from}`,
    `--to=${to}`,
    `--metrics=${metrics.join(",")}`,
    `--dimensions=${dimensions.join(",")}`,
    `--max=${max}`,
    "--json",
    "--no-input",
  ]);
}

function gscQuery({ from, to, dimensions, max = "25000" }) {
  return runJson(gogcli, [
    "searchconsole",
    "query",
    gscSite,
    "--account",
    account,
    `--from=${from}`,
    `--to=${to}`,
    `--dimensions=${dimensions.join(",")}`,
    `--max=${max}`,
    "--json",
    "--no-input",
  ]);
}

function ghApi(endpoint) {
  return runJson("gh", ["api", "-X", "GET", endpoint]);
}

function parseGa(report) {
  const dimensions = report.dimensions ?? report.dimensionHeaders?.map((d) => d.name) ?? [];
  const metrics = report.metrics ?? report.metricHeaders?.map((m) => m.name) ?? [];
  return (report.rows ?? []).map((row) => {
    const parsed = {};
    dimensions.forEach((name, index) => {
      parsed[name] = row.dimensionValues?.[index]?.value ?? "";
    });
    metrics.forEach((name, index) => {
      parsed[name] = Number(row.metricValues?.[index]?.value ?? 0);
    });
    return parsed;
  });
}

function parseGsc(report, dimensions) {
  return (report.rows ?? []).map((row) => {
    const parsed = {
      clicks: Number(row.clicks ?? 0),
      impressions: Number(row.impressions ?? 0),
      ctr: Number(row.ctr ?? 0),
      position: Number(row.position ?? 0),
    };
    dimensions.forEach((name, index) => {
      parsed[name.toLowerCase()] = row.keys?.[index] ?? "";
    });
    return parsed;
  });
}

function sum(rows, key) {
  return rows.reduce((total, row) => total + Number(row[key] ?? 0), 0);
}

function weightedPosition(rows) {
  const impressions = sum(rows, "impressions");
  if (!impressions) return 0;
  return rows.reduce((total, row) => {
    return total + Number(row.position ?? 0) * Number(row.impressions ?? 0);
  }, 0) / impressions;
}

function kpi({ label, current, previous, format, note, lowerIsBetter = false }) {
  const deltaPercent = previous === 0 ? null : ((current - previous) / previous) * 100;
  let direction = "flat";
  if (deltaPercent !== null && Math.abs(deltaPercent) >= 0.1) {
    const improved = lowerIsBetter ? current < previous : current > previous;
    direction = improved ? "up" : "down";
  }
  return {
    label,
    value: roundForFormat(current, format),
    previousValue: roundForFormat(previous, format),
    deltaPercent: deltaPercent === null ? null : Number(deltaPercent.toFixed(1)),
    direction,
    format,
    note,
  };
}

function roundForFormat(value, format) {
  if (format === "percent") return Number(value.toFixed(4));
  if (format === "decimal") return Number(value.toFixed(1));
  return Math.round(value);
}

function cleanPath(value) {
  if (!value) return "/";
  try {
    const url = value.startsWith("http")
      ? new URL(value)
      : new URL(value, "https://exquisitedentistryla.com");
    return url.pathname + url.search;
  } catch {
    return value;
  }
}

function categoryFor(title, files) {
  const titleOnly = title.toLowerCase();
  const fileText = files.map((file) => file.filename).join(" ").toLowerCase();
  const haystack = `${titleOnly} ${fileText}`;
  if (titleOnly.includes("insurance") || titleOnly.includes("ppo")) {
    return {
      category: "Insurance",
      impactArea: "Plan verification",
      summary: "Insurance acceptance messaging was clarified.",
      impact:
        "PPO language is more precise, reducing confusion before the team verifies benefits.",
    };
  }
  if (titleOnly.includes("analytics") || titleOnly.includes("event") || titleOnly.includes("tracking")) {
    return {
      category: "Measurement",
      impactArea: "Attribution",
      summary: "Website tracking and conversion event visibility were improved.",
      impact:
        "The team has a cleaner path to understand which website actions are driving inquiries.",
    };
  }
  if (titleOnly.includes("gallery") || titleOnly.includes("review") || titleOnly.includes("imagery")) {
    return {
      category: "Proof",
      impactArea: "Trust signals",
      summary: "Smile proof and review assets were expanded.",
      impact:
        "Prospective patients can see more treatment evidence before contacting the office.",
    };
  }
  if (titleOnly.includes("seo") || titleOnly.includes("redirect") || titleOnly.includes("meta") || titleOnly.includes("canonical")) {
    return {
      category: "SEO",
      impactArea: "Search visibility",
      summary: "Search metadata and high-intent redirects were cleaned up.",
      impact:
        "Legacy and high-intent paths now guide patients and search crawlers toward the right canonical pages.",
    };
  }
  if (titleOnly.includes("cherry") || titleOnly.includes("financ") || titleOnly.includes("payment")) {
    return {
      category: "Financing",
      impactArea: "Patient confidence",
      summary: "Cherry financing language tightened across key decision points.",
      impact:
        "Patients get clearer credit-check expectations while payment-plan copy stays reassuring.",
    };
  }
  if (haystack.includes("seo") || haystack.includes("redirect") || haystack.includes("meta") || haystack.includes("canonical")) {
    return {
      category: "SEO",
      impactArea: "Search visibility",
      summary: "Search metadata and high-intent redirects were cleaned up.",
      impact:
        "Legacy and high-intent paths now guide patients and search crawlers toward the right canonical pages.",
    };
  }
  if (haystack.includes("gallery") || haystack.includes("review") || haystack.includes("before") || haystack.includes("after") || haystack.includes("imagery")) {
    return {
      category: "Proof",
      impactArea: "Trust signals",
      summary: "Smile proof and review assets were expanded.",
      impact:
        "Prospective patients can see more treatment evidence before contacting the office.",
    };
  }
  if (haystack.includes("insurance") || haystack.includes("ppo")) {
    return {
      category: "Insurance",
      impactArea: "Plan verification",
      summary: "Insurance acceptance messaging was clarified.",
      impact:
        "PPO language is more precise, reducing confusion before the team verifies benefits.",
    };
  }
  if (haystack.includes("analytics") || haystack.includes("event") || haystack.includes("tracking")) {
    return {
      category: "Measurement",
      impactArea: "Attribution",
      summary: "Website tracking and conversion event visibility were improved.",
      impact:
        "The team has a cleaner path to understand which website actions are driving inquiries.",
    };
  }
  if (haystack.includes("production") || haystack.includes("monitor") || haystack.includes("vercel") || haystack.includes("domain")) {
    return {
      category: "Reliability",
      impactArea: "Production monitoring",
      summary: "Production monitoring and domain checks were hardened.",
      impact:
        "Operational checks are stronger, making it easier to catch production issues quickly.",
    };
  }
  return {
    category: "Website",
    impactArea: "Experience",
    summary: humanizeTitle(title),
    impact:
      "The website received a focused update that supports patient experience or operating visibility.",
  };
}

function humanizeTitle(title) {
  const cleaned = title.replace(/^(feat|fix|docs|chore|refactor)(\([^)]+\))?:\s*/i, "");
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function bulletsFor(commit, files) {
  const topFiles = files.slice(0, 4).map((file) => file.filename);
  const netChanges = commit.stats?.total ?? files.reduce((total, file) => total + Number(file.changes ?? 0), 0);
  return [
    `Commit ${commit.sha.slice(0, 7)} touched ${files.length} file${files.length === 1 ? "" : "s"}.`,
    `${netChanges.toLocaleString()} line-level change${netChanges === 1 ? "" : "s"} were reviewed from GitHub commit detail.`,
    topFiles.length
      ? `Primary affected file${topFiles.length === 1 ? "" : "s"}: ${topFiles.join(", ")}.`
      : "GitHub did not return file-level detail for this commit.",
  ];
}

function sanitizeTimelineText(value) {
  return value
    .replace(/\b20\d{2}-\d{2}-\d{2}\b/g, "[date]")
    .replace(/\b20\d{6}\b/g, "[date]")
    .replace(/\b\d{1,2}:\d{2}(?::\d{2})?\b/g, "[time]");
}

const start = dateString(startDate);
const end = dateString(endDate);
const previousStart = dateString(previousStartDate);
const previousEnd = dateString(previousEndDate);

const gaMetrics = ["activeUsers", "sessions", "totalUsers", "eventCount", "conversions"];
const gaDaily = parseGa(
  gaReport({ from: start, to: end, metrics: gaMetrics, dimensions: ["date"] }),
);
const gaPreviousDaily = parseGa(
  gaReport({ from: previousStart, to: previousEnd, metrics: gaMetrics, dimensions: ["date"] }),
);
const channels = parseGa(
  gaReport({
    from: start,
    to: end,
    metrics: gaMetrics,
    dimensions: ["sessionDefaultChannelGroup"],
    max: "100",
  }),
);
const landingPages = parseGa(
  gaReport({
    from: start,
    to: end,
    metrics: ["activeUsers", "sessions", "conversions"],
    dimensions: ["landingPagePlusQueryString"],
    max: "20",
  }),
);

const gscDaily = parseGsc(
  gscQuery({ from: start, to: end, dimensions: ["DATE"], max: "25000" }),
  ["DATE"],
);
const gscPreviousDaily = parseGsc(
  gscQuery({ from: previousStart, to: previousEnd, dimensions: ["DATE"], max: "25000" }),
  ["DATE"],
);
const gscQueries = parseGsc(
  gscQuery({ from: start, to: end, dimensions: ["QUERY"], max: "20" }),
  ["QUERY"],
);
const gscPages = parseGsc(
  gscQuery({ from: start, to: end, dimensions: ["PAGE"], max: "20" }),
  ["PAGE"],
);
const gscQueryPages = parseGsc(
  gscQuery({ from: start, to: end, dimensions: ["QUERY", "PAGE"], max: "30" }),
  ["QUERY", "PAGE"],
);

const gaByDate = new Map(
  gaDaily.map((row) => {
    const date = `${row.date.slice(0, 4)}-${row.date.slice(4, 6)}-${row.date.slice(6, 8)}`;
    return [date, row];
  }),
);
const gscByDate = new Map(gscDaily.map((row) => [row.date, row]));
const allDates = Array.from(new Set([...gaByDate.keys(), ...gscByDate.keys()])).sort();
const trafficTrend = allDates.map((date) => {
  const ga = gaByDate.get(date) ?? {};
  const gsc = gscByDate.get(date) ?? {};
  return {
    date,
    label: labelDate(date),
    activeUsers: Math.round(Number(ga.activeUsers ?? 0)),
    sessions: Math.round(Number(ga.sessions ?? 0)),
    conversions: Math.round(Number(ga.conversions ?? 0)),
    clicks: Math.round(Number(gsc.clicks ?? 0)),
    impressions: Math.round(Number(gsc.impressions ?? 0)),
  };
});

const currentSessions = sum(gaDaily, "sessions");
const channelMix = channels
  .map((row) => ({
    channel: row.sessionDefaultChannelGroup || "Unassigned",
    activeUsers: Math.round(Number(row.activeUsers ?? 0)),
    sessions: Math.round(Number(row.sessions ?? 0)),
    conversions: Math.round(Number(row.conversions ?? 0)),
    share: currentSessions ? Number((Number(row.sessions ?? 0) / currentSessions).toFixed(4)) : 0,
  }))
  .sort((a, b) => b.sessions - a.sessions);
const channelSessionTotal = sum(channelMix, "sessions");
if (channelSessionTotal < currentSessions) {
  channelMix.push({
    channel: "Other / thresholded",
    activeUsers: 0,
    sessions: currentSessions - channelSessionTotal,
    conversions: 0,
    share: Number(((currentSessions - channelSessionTotal) / currentSessions).toFixed(4)),
  });
}

const landingPageRows = landingPages.map((row) => ({
  path: cleanPath(row.landingPagePlusQueryString),
  activeUsers: Math.round(Number(row.activeUsers ?? 0)),
  sessions: Math.round(Number(row.sessions ?? 0)),
  conversions: Math.round(Number(row.conversions ?? 0)),
}));

const commits = ghApi(
  `repos/${githubRepo}/commits?since=${dateString(commitSince)}T00:00:00Z&per_page=100`,
);
const timeline = commits
  .map((commit, index) => {
    const detail = ghApi(`repos/${githubRepo}/commits/${commit.sha}`);
    const files = (detail.files ?? []).map((file) => ({
      filename: sanitizeTimelineText(file.filename),
      status: file.status,
      additions: Number(file.additions ?? 0),
      deletions: Number(file.deletions ?? 0),
      changes: Number(file.changes ?? 0),
    }));
    const title = commit.commit.message.split("\n")[0];
    const classification = categoryFor(title, files);
    return {
      id: commit.sha,
      order: index + 1,
      sha: commit.sha.slice(0, 7),
      title: classification.summary,
      category: classification.category,
      impactArea: classification.impactArea,
      summary: humanizeTitle(title),
      impact: classification.impact,
      filesChanged: files.length,
      additions: Number(detail.stats?.additions ?? 0),
      deletions: Number(detail.stats?.deletions ?? 0),
      fileDetails: files,
      bullets: bulletsFor(detail, files),
    };
  })
  .sort((a, b) => a.order - b.order);

const snapshot = {
  generatedAt: new Date().toISOString(),
  source: {
    ga4Property,
    ga4Name,
    gscSite,
    githubRepo,
    analyticsRange: {
      start,
      end,
      days: 30,
    },
    commitWindowDays: 60,
  },
  kpis: [
    kpi({
      label: "Active users",
      current: sum(gaDaily, "activeUsers"),
      previous: sum(gaPreviousDaily, "activeUsers"),
      format: "number",
      note: "GA4 active users",
    }),
    kpi({
      label: "Sessions",
      current: currentSessions,
      previous: sum(gaPreviousDaily, "sessions"),
      format: "number",
      note: "GA4 sessions",
    }),
    kpi({
      label: "Conversions",
      current: sum(gaDaily, "conversions"),
      previous: sum(gaPreviousDaily, "conversions"),
      format: "number",
      note: "GA4 conversions",
    }),
    kpi({
      label: "Search clicks",
      current: sum(gscDaily, "clicks"),
      previous: sum(gscPreviousDaily, "clicks"),
      format: "number",
      note: "Google Search Console clicks",
    }),
    kpi({
      label: "Search impressions",
      current: sum(gscDaily, "impressions"),
      previous: sum(gscPreviousDaily, "impressions"),
      format: "number",
      note: "Google Search Console impressions",
    }),
    kpi({
      label: "Avg. search position",
      current: weightedPosition(gscDaily),
      previous: weightedPosition(gscPreviousDaily),
      format: "decimal",
      note: "Weighted by impressions",
      lowerIsBetter: true,
    }),
  ],
  trafficTrend,
  channelMix,
  landingPages: landingPageRows,
  gscQueries: gscQueries.map((row) => ({
    query: row.query,
    clicks: Math.round(row.clicks),
    impressions: Math.round(row.impressions),
    ctr: Number(row.ctr.toFixed(4)),
    position: Number(row.position.toFixed(1)),
  })),
  gscPages: gscPages.map((row) => ({
    page: cleanPath(row.page),
    clicks: Math.round(row.clicks),
    impressions: Math.round(row.impressions),
    ctr: Number(row.ctr.toFixed(4)),
    position: Number(row.position.toFixed(1)),
  })),
  gscQueryPages: gscQueryPages.map((row) => ({
    query: row.query,
    page: cleanPath(row.page),
    clicks: Math.round(row.clicks),
    impressions: Math.round(row.impressions),
    ctr: Number(row.ctr.toFixed(4)),
    position: Number(row.position.toFixed(1)),
  })),
  timeline,
};

const outputPath = path.join(root, "src/data/dashboard-snapshot.json");
mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(`Wrote ${path.relative(root, outputPath)}`);
console.log(
  `Snapshot: ${snapshot.kpis.length} KPIs, ${snapshot.trafficTrend.length} trend rows, ${snapshot.timeline.length} website changes.`,
);
