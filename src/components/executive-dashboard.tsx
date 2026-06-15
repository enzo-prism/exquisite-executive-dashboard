"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  ChevronRight,
  FileCode2,
  GitCommitHorizontal,
  Globe2,
  LineChart,
  MousePointerClick,
  Search,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  DashboardSnapshot,
  Kpi,
  LandingPageRow,
  SearchRow,
  TimelineItem,
} from "@/types/dashboard";

const chartColors = ["#0f766e", "#2563eb", "#d97706", "#7c3aed", "#be123c"];

type ExecutiveDashboardProps = {
  snapshot: DashboardSnapshot;
};

export function ExecutiveDashboard({ snapshot }: ExecutiveDashboardProps) {
  const totals = {
    activeUsers: snapshot.kpis.find((kpi) => kpi.label === "Active users")?.value ?? 0,
    searchClicks: snapshot.kpis.find((kpi) => kpi.label === "Search clicks")?.value ?? 0,
    commits: snapshot.timeline.length,
  };

  return (
    <main className="min-h-screen bg-[#f6f7f5] text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-950 p-2">
                <Image
                  src="/brand/exquisite-logo.webp"
                  alt="Exquisite Dentistry logo"
                  width={96}
                  height={96}
                  className="h-auto w-full"
                  priority
                />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="rounded-sm">
                    Public snapshot
                  </Badge>
                  <Badge variant="outline" className="rounded-sm border-teal-200 bg-teal-50 text-teal-800">
                    Michael Churchill
                  </Badge>
                </div>
                <h1 className="mt-2 text-2xl font-semibold tracking-normal text-slate-950 sm:text-3xl">
                  Exquisite Dentistry Executive Dashboard
                </h1>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                  GA4, Google Search Console, and GitHub website-change visibility for the live Exquisite Dentistry site.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 rounded-md border border-slate-200 bg-slate-50 p-2 text-center">
              <MiniStat label="Active users" value={formatValue(totals.activeUsers, "number")} />
              <MiniStat label="Search clicks" value={formatValue(totals.searchClicks, "number")} />
              <MiniStat label="Site updates" value={formatValue(totals.commits, "number")} />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <SourcePill
              icon={<Activity className="h-4 w-4" />}
              label="GA4 property"
              value={`${snapshot.source.ga4Name} (${snapshot.source.ga4Property})`}
            />
            <SourcePill
              icon={<Search className="h-4 w-4" />}
              label="Search Console"
              value={snapshot.source.gscSite}
            />
            <SourcePill
              icon={<GitCommitHorizontal className="h-4 w-4" />}
              label="Website commits"
              value={`${snapshot.source.githubRepo}, latest ${snapshot.source.commitWindowDays} days`}
            />
          </div>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {snapshot.kpis.map((kpi) => (
            <KpiCard key={kpi.label} kpi={kpi} />
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.9fr)]">
          <Card className="rounded-md border-slate-200 shadow-none">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <LineChart className="h-4 w-4 text-teal-700" />
                    Traffic and Search Trend
                  </CardTitle>
                  <CardDescription>
                    Daily GA4 users, sessions, conversions, and GSC clicks for the snapshot window.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="rounded-sm">
                  {snapshot.source.analyticsRange.days} days
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[330px] w-full min-w-0">
                <MountedChart>
                  <ResponsiveContainer
                    initialDimension={{ width: 700, height: 330 }}
                    minWidth={0}
                  >
                    <AreaChart data={snapshot.trafficTrend} margin={{ left: 0, right: 10 }}>
                      <defs>
                        <linearGradient id="users" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="5%" stopColor="#0f766e" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#0f766e" stopOpacity={0.04} />
                        </linearGradient>
                        <linearGradient id="sessions" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0.03} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis fontSize={11} tickLine={false} axisLine={false} width={36} />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Area
                        type="monotone"
                        dataKey="activeUsers"
                        name="Active users"
                        stroke="#0f766e"
                        fill="url(#users)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="sessions"
                        name="Sessions"
                        stroke="#2563eb"
                        fill="url(#sessions)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="clicks"
                        name="Search clicks"
                        stroke="#d97706"
                        fill="transparent"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="conversions"
                        name="Conversions"
                        stroke="#be123c"
                        fill="transparent"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </MountedChart>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-md border-slate-200 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4 text-blue-700" />
                Channel Mix
              </CardTitle>
              <CardDescription>Sessions by GA4 default channel group.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[235px] min-w-0">
                <MountedChart>
                  <ResponsiveContainer
                    initialDimension={{ width: 420, height: 235 }}
                    minWidth={0}
                  >
                    <PieChart>
                      <Pie
                        data={snapshot.channelMix.slice(0, 5)}
                        dataKey="sessions"
                        nameKey="channel"
                        innerRadius={54}
                        outerRadius={84}
                        paddingAngle={2}
                      >
                        {snapshot.channelMix.slice(0, 5).map((row, index) => (
                          <Cell key={row.channel} fill={chartColors[index % chartColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </MountedChart>
              </div>
              <div className="grid gap-2">
                {snapshot.channelMix.slice(0, 5).map((row, index) => (
                  <div key={row.channel} className="flex items-center justify-between gap-3 text-sm">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: chartColors[index % chartColors.length] }}
                      />
                      <span className="truncate text-slate-700">{row.channel}</span>
                    </div>
                    <span className="font-medium tabular-nums text-slate-950">
                      {formatValue(row.sessions, "number")}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <RankingCard
            icon={<Globe2 className="h-4 w-4 text-teal-700" />}
            title="Top Landing Pages"
            description="GA4 landing pages ranked by sessions."
            rows={snapshot.landingPages}
          />
          <SearchPerformanceCard
            queries={snapshot.gscQueries}
            pages={snapshot.gscPages}
            queryPages={snapshot.gscQueryPages}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
          <Card className="rounded-md border-slate-200 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-amber-700" />
                Search Demand by Page
              </CardTitle>
              <CardDescription>Top Search Console pages by impressions.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] min-w-0">
                <MountedChart>
                  <ResponsiveContainer
                    initialDimension={{ width: 620, height: 300 }}
                    minWidth={0}
                  >
                    <BarChart
                      data={snapshot.gscPages.slice(0, 8).map((row) => ({
                        page: compactPath(row.page ?? "/"),
                        impressions: row.impressions,
                        clicks: row.clicks,
                      }))}
                      layout="vertical"
                      margin={{ left: 16, right: 18 }}
                    >
                      <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis
                        dataKey="page"
                        type="category"
                        width={116}
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="impressions" name="Impressions" fill="#2563eb" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="clicks" name="Clicks" fill="#0f766e" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </MountedChart>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-md border-slate-200 shadow-none">
            <div className="relative h-full min-h-[300px] bg-slate-950">
              <Image
                src="/brand/patient-care.avif"
                alt="Exquisite Dentistry patient consultation"
                fill
                loading="eager"
                sizes="(min-width: 1280px) 420px, 100vw"
                className="object-cover opacity-65"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/55 to-slate-950/10" />
              <div className="relative flex h-full min-h-[300px] flex-col justify-end p-6 text-white">
                <Badge className="mb-4 w-fit rounded-sm bg-white/15 text-white hover:bg-white/15">
                  Executive readout
                </Badge>
                <h2 className="text-2xl font-semibold tracking-normal">
                  The current snapshot connects acquisition, search demand, and site iteration in one place.
                </h2>
                <p className="mt-3 max-w-lg text-sm leading-6 text-white/78">
                  A concise operating view for conversations about patient demand, website performance, and recent improvements.
                </p>
              </div>
            </div>
          </Card>
        </section>

        <TimelineSection timeline={snapshot.timeline} />
      </div>
    </main>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[92px] px-2 py-1">
      <div className="text-lg font-semibold tabular-nums text-slate-950">{value}</div>
      <div className="text-[11px] uppercase tracking-[0.16em] text-slate-500">{label}</div>
    </div>
  );
}

function SourcePill({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="text-slate-500">{icon}</div>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-[0.16em] text-slate-500">{label}</div>
        <div className="truncate text-sm font-medium text-slate-900">{value}</div>
      </div>
    </div>
  );
}

function MountedChart({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  if (!mounted) {
    return <Skeleton className="h-full w-full rounded-md bg-slate-100" />;
  }

  return children;
}

function KpiCard({ kpi }: { kpi: Kpi }) {
  const positive = kpi.direction === "up";
  const negative = kpi.direction === "down";
  return (
    <Card className="rounded-md border-slate-200 shadow-none">
      <CardHeader className="space-y-0 pb-2">
        <CardDescription className="text-xs">{kpi.note}</CardDescription>
        <CardTitle className="text-sm font-medium text-slate-700">{kpi.label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tabular-nums text-slate-950">
          {formatValue(kpi.value, kpi.format)}
        </div>
        <div
          className={[
            "mt-2 flex items-center gap-1 text-xs font-medium",
            positive ? "text-teal-700" : "",
            negative ? "text-rose-700" : "",
            !positive && !negative ? "text-slate-500" : "",
          ].join(" ")}
        >
          {positive ? <ArrowUpRight className="h-3.5 w-3.5" /> : null}
          {negative ? <ArrowDownRight className="h-3.5 w-3.5" /> : null}
          {kpi.deltaPercent === null ? "New baseline" : `${Math.abs(kpi.deltaPercent).toFixed(1)}%`}
        </div>
      </CardContent>
    </Card>
  );
}

function RankingCard({
  icon,
  title,
  description,
  rows,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  rows: LandingPageRow[];
}) {
  return (
    <Card className="rounded-md border-slate-200 shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Page</TableHead>
              <TableHead className="text-right">Users</TableHead>
              <TableHead className="text-right">Sessions</TableHead>
              <TableHead className="text-right">Conv.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.slice(0, 8).map((row) => (
              <TableRow key={row.path}>
                <TableCell className="max-w-[280px] truncate font-medium">{row.path}</TableCell>
                <TableCell className="text-right tabular-nums">{formatValue(row.activeUsers, "number")}</TableCell>
                <TableCell className="text-right tabular-nums">{formatValue(row.sessions, "number")}</TableCell>
                <TableCell className="text-right tabular-nums">{formatValue(row.conversions, "number")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function SearchPerformanceCard({
  queries,
  pages,
  queryPages,
}: {
  queries: SearchRow[];
  pages: SearchRow[];
  queryPages: SearchRow[];
}) {
  return (
    <Card className="rounded-md border-slate-200 shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MousePointerClick className="h-4 w-4 text-blue-700" />
          GSC Performance
        </CardTitle>
        <CardDescription>Queries, pages, and query-page pairs from Search Console.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="queries">
          <TabsList className="grid w-full grid-cols-3 rounded-md">
            <TabsTrigger value="queries">Queries</TabsTrigger>
            <TabsTrigger value="pages">Pages</TabsTrigger>
            <TabsTrigger value="pairs">Pairs</TabsTrigger>
          </TabsList>
          <TabsContent value="queries" className="mt-3">
            <SearchTable rows={queries} primary="query" />
          </TabsContent>
          <TabsContent value="pages" className="mt-3">
            <SearchTable rows={pages} primary="page" />
          </TabsContent>
          <TabsContent value="pairs" className="mt-3">
            <SearchTable rows={queryPages} primary="pair" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function SearchTable({
  rows,
  primary,
}: {
  rows: SearchRow[];
  primary: "query" | "page" | "pair";
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{primary === "pair" ? "Query + page" : primary}</TableHead>
          <TableHead className="text-right">Clicks</TableHead>
          <TableHead className="text-right">Impr.</TableHead>
          <TableHead className="text-right">Pos.</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.slice(0, 8).map((row, index) => (
          <TableRow key={`${row.query ?? ""}-${row.page ?? ""}-${index}`}>
            <TableCell className="max-w-[330px]">
              <div className="truncate font-medium">
                {primary === "pair" ? row.query : row[primary]}
              </div>
              {primary === "pair" ? (
                <div className="truncate text-xs text-slate-500">{row.page}</div>
              ) : null}
            </TableCell>
            <TableCell className="text-right tabular-nums">{formatValue(row.clicks, "number")}</TableCell>
            <TableCell className="text-right tabular-nums">{formatValue(row.impressions, "number")}</TableCell>
            <TableCell className="text-right tabular-nums">{formatValue(row.position, "decimal")}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function TimelineSection({ timeline }: { timeline: TimelineItem[] }) {
  const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null);

  return (
    <section className="grid gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-normal text-slate-950">
            Website Change Timeline
          </h2>
          <p className="text-sm leading-6 text-slate-600">
            Most recent website updates appear first.
          </p>
        </div>
        <Badge variant="outline" className="w-fit rounded-sm">
          {timeline.length} GitHub updates reviewed
        </Badge>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {timeline.map((item) => (
          <TimelineCard
            item={item}
            key={item.id}
            onSelect={() => setSelectedItem(item)}
          />
        ))}
      </div>

      <Dialog
        open={selectedItem !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedItem(null);
        }}
      >
        {selectedItem ? <TimelineDialogContent item={selectedItem} /> : null}
      </Dialog>
    </section>
  );
}

function TimelineCard({
  item,
  onSelect,
}: {
  item: TimelineItem;
  onSelect: () => void;
}) {
  return (
    <button
      className="group flex min-h-[156px] w-full flex-col justify-between rounded-md border border-slate-200 bg-white p-4 text-left shadow-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
      onClick={onSelect}
      type="button"
    >
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="rounded-sm bg-slate-950 text-white hover:bg-slate-950">
            {item.category}
          </Badge>
          <Badge variant="secondary" className="rounded-sm">
            {item.impactArea}
          </Badge>
          <Badge variant="outline" className="rounded-sm font-mono">
            {item.sha}
          </Badge>
        </div>
        <h3 className="mt-3 text-base font-semibold leading-6 text-slate-950">
          {item.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
          {item.impact}
        </p>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 text-xs text-slate-500">
        <span>{item.filesChanged} files reviewed</span>
        <span className="inline-flex items-center gap-1 font-medium text-slate-700">
          Full details
          <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
        </span>
      </div>
    </button>
  );
}

function TimelineDialogContent({ item }: { item: TimelineItem }) {
  return (
    <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="rounded-sm bg-slate-950 text-white hover:bg-slate-950">
            {item.category}
          </Badge>
          <Badge variant="secondary" className="rounded-sm">
            {item.impactArea}
          </Badge>
          <Badge variant="outline" className="rounded-sm font-mono">
            {item.sha}
          </Badge>
        </div>
        <DialogTitle className="pt-2 text-xl">{item.title}</DialogTitle>
        <DialogDescription>{item.impact}</DialogDescription>
      </DialogHeader>

      <div className="grid gap-5">
        <div className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3">
          <DetailStat label="Files" value={item.filesChanged} />
          <DetailStat label="Additions" value={item.additions} />
          <DetailStat label="Deletions" value={item.deletions} />
        </div>

        <div>
          <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-amber-700" />
            What changed
          </h4>
          <ul className="grid gap-2 text-sm leading-6 text-slate-700">
            {item.bullets.map((bullet) => (
              <li className="rounded-md border border-slate-200 bg-white px-3 py-2" key={bullet}>
                {bullet}
              </li>
            ))}
          </ul>
        </div>

        <Separator />

        <div>
          <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <FileCode2 className="h-4 w-4 text-blue-700" />
            Affected files
          </h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Changes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {item.fileDetails.map((file) => (
                <TableRow key={`${item.id}-${file.filename}`}>
                  <TableCell className="max-w-[360px] truncate font-mono text-xs">
                    {file.filename}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="rounded-sm">
                      {file.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-xs tabular-nums">
                    +{file.additions} / -{file.deletions}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </DialogContent>
  );
}

function DetailStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-2xl font-semibold tabular-nums">{formatValue(value, "number")}</div>
      <div className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</div>
    </div>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number | string; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm">
      {label ? <div className="mb-1 font-medium text-slate-950">{label}</div> : null}
      <div className="grid gap-1">
        {payload.map((entry) => (
          <div key={`${entry.name}-${entry.value}`} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-slate-600">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}
            </span>
            <span className="font-medium tabular-nums text-slate-950">
              {typeof entry.value === "number" ? formatValue(entry.value, "number") : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatValue(value: number, format: "number" | "percent" | "decimal") {
  if (format === "percent") {
    return new Intl.NumberFormat("en-US", {
      style: "percent",
      maximumFractionDigits: 1,
    }).format(value);
  }
  if (format === "decimal") {
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 1,
      minimumFractionDigits: 1,
    }).format(value);
  }
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function compactPath(value: string) {
  if (value === "/") return "/";
  const clean = value.replace(/^https:\/\/exquisitedentistryla\.com/, "");
  if (clean.length <= 22) return clean;
  return `${clean.slice(0, 19)}...`;
}
