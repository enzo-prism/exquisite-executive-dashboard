export type Direction = "up" | "down" | "flat";

export type Kpi = {
  label: string;
  value: number;
  previousValue: number;
  deltaPercent: number | null;
  direction: Direction;
  format: "number" | "percent" | "decimal";
  note: string;
};

export type DailyTrafficRow = {
  date: string;
  label: string;
  activeUsers: number;
  sessions: number;
  conversions: number;
  clicks: number | null;
  impressions: number | null;
};

export type ChannelRow = {
  channel: string;
  activeUsers: number;
  sessions: number;
  conversions: number;
  share: number;
};

export type LandingPageRow = {
  path: string;
  activeUsers: number;
  sessions: number;
  conversions: number;
};

export type SearchRow = {
  query?: string;
  page?: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type TimelineFile = {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
};

export type TimelineItem = {
  id: string;
  order: number;
  ageDays: number;
  sha: string;
  title: string;
  category: string;
  impactArea: string;
  summary: string;
  impact: string;
  filesChanged: number;
  additions: number;
  deletions: number;
  fileDetails: TimelineFile[];
  bullets: string[];
};

export type WindowKey = "30" | "60" | "90";

export type DashboardWindow = {
  days: number;
  range: {
    start: string;
    end: string;
  };
  searchRange?: { start: string; end: string; previousStart: string; previousEnd: string };
  qualityNotes?: string[];
  kpis: Kpi[];
  trafficTrend: DailyTrafficRow[];
  channelMix: ChannelRow[];
  landingPages: LandingPageRow[];
  gscQueries: SearchRow[];
  gscPages: SearchRow[];
  gscQueryPages: SearchRow[];
  timeline: TimelineItem[];
};

export type DashboardSnapshot = {
  generatedAt: string;
  campaignStatus?: {
    verifiedAt: string;
    chatgpt: string;
    totalBudgetUsd: number;
    maximumCpcUsd: number;
    endsAt: string;
    creativeEnhancements: string;
    note: string;
  };
  source: {
    ga4Property: string;
    ga4Name: string;
    gscSite: string;
    githubRepo: string;
    analyticsRange: {
      start: string;
      end: string;
      days: number;
    };
    commitWindowDays: number;
    defaultWindowDays: number;
    availableWindowDays: number[];
    timeZone?: string;
    latestSourceDates?: { ga4: string; gscFinal: string };
    validationNotes?: string[];
  };
  windows: Record<WindowKey, DashboardWindow>;
};
