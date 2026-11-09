import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { calendarDate, shiftDate, rangeFor, parseGa, trendRows, cleanPath, parseGsc, TIME_ZONE } from "./reporting.mjs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const account = process.env.GOGCLI_ACCOUNT ?? "enzo@design-prism.com";
const gogcli = process.env.GOGCLI_BIN ?? ["/Users/enzo/.local/bin/gog", "/Users/enzo/.local/bin/gogcli"].find(existsSync) ?? "gog";
const ga4Property = process.env.GA4_PROPERTY ?? "properties/498175984";
const ga4Name = process.env.GA4_NAME ?? "Exquisite Dentistry - Live";
const gscSite = process.env.GSC_SITE ?? "sc-domain:exquisitedentistryla.com";
const githubRepo =
  process.env.SOURCE_GITHUB_REPO ?? "enzo-prism/exquisite-dentistry";

const dayMs = 24 * 60 * 60 * 1000;
const windowDays = [30, 60, 90];
const today = new Date();
const endDate = shiftDate(calendarDate(today), -1);
const maxCommitWindowDays = Math.max(...windowDays);

function runJson(command, args) {
  console.log(`Running ${path.basename(command)} ${args.slice(0, 4).join(" ")}...`);
  const output = execFileSync(command, args, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 60,
    stdio: ["ignore", "pipe", "pipe"],
  });
  return JSON.parse(output);
}

function gaReport({ from, to, metrics, dimensions, max = "250000" }) {
  const body = {
    dateRanges: [{ startDate: from, endDate: to }],
    metrics: metrics.map(name => ({ name })),
    dimensions: dimensions.map(name => ({ name })),
    dimensionFilter: { filter: { fieldName: "hostName", inListFilter: { values: ["exquisitedentistryla.com", "www.exquisitedentistryla.com"], caseSensitive: false } } },
    limit: max,
    ...(dimensions.length ? { orderBys: [{ metric: { metricName: metrics.includes("sessions") ? "sessions" : metrics[0] }, desc: true }] } : {}),
  };
  const report = runJson(gogcli, ["api", "call", "analyticsdata", "v1beta", "properties.runReport", "--params", JSON.stringify({ property: ga4Property }), "--body", JSON.stringify(body), "--account", account, "--scope", "https://www.googleapis.com/auth/analytics.readonly", "--json", "--no-input", "--readonly"]);
  if (report.metadata?.samplingMetadatas?.length || report.metadata?.subjectToThresholding || report.metadata?.dataLossFromOtherRow) qualityWarnings.add("GA4 reports sampling, thresholding, or grouped data limitations; totals and breakdowns may differ.");
  return parseGa(report, dimensions, metrics);
}

const qualityWarnings = new Set();

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
    "--data-state=FINAL",
    `--aggregation=${dimensions.includes("PAGE") ? "BY_PAGE" : "BY_PROPERTY"}`,
    "--readonly",
    `--max=${max}`,
    "--json",
    "--no-input",
  ]);
}

function sum(rows, key) {
  return rows.reduce((total, row) => total + Number(row[key] ?? 0), 0);
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

function buildWindow(range, allTimeline, searchEnd) {
  const searchRange = rangeFor(range.days, searchEnd);
  const gaMetrics = ["activeUsers", "sessions", "keyEvents"];
  const readGa = (from, to, dimensions, metrics = gaMetrics, max) => gaReport({ from, to, dimensions, metrics, max });
  const current = readGa(range.start, range.end, [])[0] ?? { activeUsers: 0, sessions: 0, keyEvents: 0 };
  const previous = readGa(range.previousStart, range.previousEnd, [])[0] ?? { activeUsers: 0, sessions: 0, keyEvents: 0 };
  const gaDaily = readGa(range.start, range.end, ["date"]);
  const channels = readGa(range.start, range.end, ["sessionDefaultChannelGroup"], gaMetrics, "100");
  const landingPages = readGa(range.start, range.end, ["landingPage"], gaMetrics, "25000");
  const search = (from, to, dimensions, max = "25000") => parseGsc(gscQuery({ from, to, dimensions, max }), dimensions);
  const currentSearch = search(searchRange.start, searchRange.end, [])[0];
  const previousSearch = search(searchRange.previousStart, searchRange.previousEnd, [])[0];
  if (!currentSearch || !previousSearch) throw new Error("Missing Search Console period totals; existing snapshot retained.");
  const gscDaily = search(range.start, searchEnd, ["DATE"]);
  const queries = search(searchRange.start, searchRange.end, ["QUERY"], "30");
  const pages = search(searchRange.start, searchRange.end, ["PAGE"], "30");
  const pairs = search(searchRange.start, searchRange.end, ["QUERY", "PAGE"], "40");
  const periodNote = `GA4, ${range.start}–${range.end}; previous ${range.previousStart}–${range.previousEnd}. Canonical website hosts only.`;
  const searchNote = `GSC final web-search data, ${searchRange.start}–${searchRange.end}; previous ${searchRange.previousStart}–${searchRange.previousEnd}. Equal ${range.days}-day periods.`;
  const channelMix = channels.map(row => ({ channel: row.sessionDefaultChannelGroup || "Unassigned", activeUsers: row.activeUsers, sessions: row.sessions, conversions: row.keyEvents, share: current.sessions ? row.sessions / current.sessions : 0 })).sort((a, b) => b.sessions - a.sessions);
  const channelDifference = sum(channelMix, "sessions") - current.sessions;
  const searchRows = rows => rows.map(row => ({ ...row, ...(row.page ? { page: cleanPath(row.page) } : {}), position: Number(row.position.toFixed(1)) }));
  return {
    days: range.days, range: { start: range.start, end: range.end }, searchRange,
    qualityNotes: ["Key events are GA4-configured actions, not verified inquiries, booked consultations, patients or revenue. The paid ChatGPT landing page intentionally has no GA4 tracking.", "Search tables omit anonymized queries and are limited to top rows; they do not sum to property totals.", ...(channelDifference ? [`Channel sessions differ from the period total by ${channelDifference}; no balancing or estimated rows were added.`] : [])],
    kpis: [
      kpi({ label: "Active users", current: current.activeUsers, previous: previous.activeUsers, format: "number", note: `${periodNote} Unique users for the full period; never a sum of daily users.` }),
      kpi({ label: "Sessions", current: current.sessions, previous: previous.sessions, format: "number", note: periodNote }),
      kpi({ label: "Key events", current: current.keyEvents, previous: previous.keyEvents, format: "number", note: `${periodNote} Configured website actions, not confirmed leads or appointments.` }),
      kpi({ label: "Search clicks", current: currentSearch.clicks, previous: previousSearch.clicks, format: "number", note: searchNote }),
      kpi({ label: "Search impressions", current: currentSearch.impressions, previous: previousSearch.impressions, format: "number", note: searchNote }),
      kpi({ label: "Avg. search position", current: currentSearch.position, previous: previousSearch.position, format: "decimal", note: searchNote, lowerIsBetter: true }),
    ],
    trafficTrend: trendRows(range, gaDaily, gscDaily, searchEnd), channelMix,
    landingPages: landingPages.sort((a,b) => b.sessions-a.sessions).slice(0, 30).map(row => ({ path: cleanPath(row.landingPage), activeUsers: row.activeUsers, sessions: row.sessions, conversions: row.keyEvents })),
    gscQueries: searchRows(queries), gscPages: searchRows(pages), gscQueryPages: searchRows(pairs),
    timeline: allTimeline.filter(item => item.ageDays <= range.days),
  };
}

function buildTimeline() {
  const commitSince = shiftDate(calendarDate(today), -maxCommitWindowDays);
  const commits = runJson("gh", ["api", "--paginate", "--slurp", `repos/${githubRepo}/commits?since=${commitSince}T00:00:00Z&per_page=100`]).flat();

  return commits
    .map((commit, index) => {
      const detailPages = runJson("gh", ["api", "--paginate", "--slurp", `repos/${githubRepo}/commits/${commit.sha}?per_page=100`]);
      const detail = { ...detailPages[0], files: detailPages.flatMap(page => page.files ?? []) };
      const files = (detail.files ?? []).map((file) => ({
        filename: sanitizeTimelineText(file.filename),
        status: file.status,
        additions: Number(file.additions ?? 0),
        deletions: Number(file.deletions ?? 0),
        changes: Number(file.changes ?? 0),
      }));
      const title = commit.commit.message.split("\n")[0];
      const classification = categoryFor(title, files);
      const commitDate = new Date(commit.commit.committer.date);
      const ageDays = Math.max(0, Math.floor((today.getTime() - commitDate.getTime()) / dayMs));

      return {
        id: commit.sha,
        order: index + 1,
        ageDays,
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
}

const finalSearchDays = parseGsc(gscQuery({ from: shiftDate(endDate, -14), to: endDate, dimensions: ["DATE"] }), ["DATE"]);
const searchEnd = finalSearchDays.map(row => row.date).sort().at(-1);
if (!searchEnd) throw new Error("No finalized search data; existing snapshot retained.");
const allTimeline = buildTimeline();
const windows = Object.fromEntries(
  windowDays.map((days) => {
    const range = rangeFor(days, endDate);
    return [String(days), buildWindow(range, allTimeline, searchEnd)];
  }),
);
const defaultRange = rangeFor(30, endDate);

const snapshot = {
  generatedAt: new Date().toISOString(),
  campaignStatus: JSON.parse(readFileSync(path.join(root, "src/data/campaign-status.json"), "utf8")),
  source: {
    timeZone: TIME_ZONE,
    latestSourceDates: { ga4: endDate, gscFinal: searchEnd },
    validationNotes: [...qualityWarnings],
    ga4Property,
    ga4Name,
    gscSite,
    githubRepo,
    analyticsRange: {
      start: defaultRange.start,
      end: defaultRange.end,
      days: 30,
    },
    commitWindowDays: maxCommitWindowDays,
    defaultWindowDays: 30,
    availableWindowDays: windowDays,
  },
  windows,
};

const outputPath = path.join(root, "src/data/dashboard-snapshot.json");
mkdirSync(path.dirname(outputPath), { recursive: true });
const temporaryPath = `${outputPath}.tmp`;
writeFileSync(temporaryPath, `${JSON.stringify(snapshot, null, 2)}\n`);
renameSync(temporaryPath, outputPath);
console.log(`Wrote ${path.relative(root, outputPath)}`);
console.log(
  `Snapshot: ${Object.keys(windows).length} windows, ${allTimeline.length} website changes across ${maxCommitWindowDays} days.`,
);
