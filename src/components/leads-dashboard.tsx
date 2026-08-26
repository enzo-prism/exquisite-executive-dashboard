"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import Image from "next/image";
import {
  CalendarClock,
  LockKeyhole,
  Sparkles,
  Stethoscope,
  UserPlus,
} from "lucide-react";

import { DashboardNav } from "@/components/dashboard-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { leadSummary } from "@/lib/leads/metrics";
import type { ChatGptLead, FollowUpStatus } from "@/types/leads";

const STATUS_LABELS: Record<FollowUpStatus, string> = {
  new: "New",
  contacted: "Contacted",
  appointment_scheduled: "Appointment scheduled",
  not_a_fit: "Not a fit",
  closed: "Closed",
};

type LeadsDashboardProps = {
  examples: ChatGptLead[];
};

function formatSubmittedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function sourceLabel(lead: ChatGptLead) {
  const parts = [
    lead.source,
    lead.utmSource && lead.utmSource !== lead.source ? lead.utmSource : "",
    lead.utmCampaign,
    lead.adId,
  ].filter(Boolean);
  return parts.join(" · ") || "chatgpt";
}

export function LeadsDashboard({ examples }: LeadsDashboardProps) {
  const [operatorKey, setOperatorKey] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [liveLeads, setLiveLeads] = useState<ChatGptLead[]>([]);
  const [loadError, setLoadError] = useState("");
  const [loadingLive, setLoadingLive] = useState(false);
  const [localExamples, setLocalExamples] = useState(examples);
  const [savingId, setSavingId] = useState("");

  const visibleLeads = useMemo(() => {
    const live = unlocked ? liveLeads : [];
    return [...live, ...localExamples].sort((a, b) =>
      b.submittedAt.localeCompare(a.submittedAt),
    );
  }, [liveLeads, localExamples, unlocked]);

  const liveSummary = leadSummary(unlocked ? liveLeads : []);
  const exampleSummary = leadSummary(localExamples);

  async function unlockLiveLeads(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoadingLive(true);
    setLoadError("");

    const response = await fetch("/api/leads", {
      headers: {
        Authorization: `Bearer ${operatorKey}`,
      },
    });

    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
      leads?: ChatGptLead[];
    };

    setLoadingLive(false);

    if (!response.ok) {
      setUnlocked(false);
      setLoadError(payload.error ?? "Could not unlock live leads");
      return;
    }

    setLiveLeads(payload.leads ?? []);
    setUnlocked(true);
  }

  async function updateLead(
    lead: ChatGptLead,
    patch: { status?: FollowUpStatus; becamePatient?: boolean },
  ) {
    if (lead.example) {
      setLocalExamples((current) =>
        current.map((row) =>
          row.id === lead.id
            ? {
                ...row,
                ...patch,
                updatedAt: new Date().toISOString(),
              }
            : row,
        ),
      );
      return;
    }

    if (!unlocked || !operatorKey) return;

    setSavingId(lead.id);
    const response = await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${operatorKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(patch),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      lead?: ChatGptLead;
    };
    setSavingId("");

    if (response.ok && payload.lead) {
      setLiveLeads((current) =>
        current.map((row) => (row.id === payload.lead?.id ? payload.lead : row)),
      );
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f7f5] text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-950 p-2">
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
                <Badge
                  variant="outline"
                  className="rounded-sm border-teal-200 bg-teal-50 text-teal-800"
                >
                  Michael Churchill
                </Badge>
                <h1 className="mt-2 text-xl font-semibold tracking-normal text-slate-950 sm:text-2xl">
                  ChatGPT Lead Dashboard
                </h1>
                <p className="mt-1 max-w-xl text-sm leading-6 text-slate-600">
                  Name, contact, source, follow-up, and whether a ChatGPT lead
                  became a patient. Next review: Monday Aug 31, 11am PT.
                </p>
              </div>
            </div>
            <DashboardNav current="leads" />
          </div>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Live ChatGPT leads"
            value={liveSummary.total}
            note={
              unlocked
                ? "Ingested from the dedicated LP form"
                : "Unlock with the operator secret to load live rows"
            }
            icon={<UserPlus className="h-4 w-4 text-teal-700" />}
          />
          <KpiCard
            label="New"
            value={liveSummary.new}
            note="Awaiting first follow-up"
            icon={<Sparkles className="h-4 w-4 text-teal-700" />}
          />
          <KpiCard
            label="Appointments"
            value={liveSummary.appointmentScheduled}
            note="Scheduled after a ChatGPT inquiry"
            icon={<CalendarClock className="h-4 w-4 text-teal-700" />}
          />
          <KpiCard
            label="Became patients"
            value={liveSummary.becamePatients}
            note="Marked after the practice confirms care"
            icon={<Stethoscope className="h-4 w-4 text-teal-700" />}
          />
        </section>

        <Card className="rounded-md border-slate-200 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Live ingest</CardTitle>
            <CardDescription>
              The public table never dumps live PII. EXAMPLE rows are always
              visible. Live rows require <code>LEADS_OPERATOR_SECRET</code>,
              which is separate from the form ingest secret. The dedicated
              ChatGPT LP is being built in a separate repo and is not wired yet.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
            <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
              {unlocked ? (
                <p>
                  Live roster unlocked. {liveSummary.total} real ChatGPT lead
                  {liveSummary.total === 1 ? "" : "s"} loaded.{" "}
                  {exampleSummary.total} EXAMPLE row
                  {exampleSummary.total === 1 ? "" : "s"} remain labeled below.
                </p>
              ) : (
                <p>
                  0 live ChatGPT leads are shown. The two EXAMPLE rows prove the
                  table for the Aug 31 review. They are not patients.
                </p>
              )}
              {loadError ? (
                <p className="mt-2 text-sm text-red-700">{loadError}</p>
              ) : null}
            </div>
            <form className="grid gap-2" onSubmit={unlockLiveLeads}>
              <label className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                Operator key
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  autoComplete="off"
                  value={operatorKey}
                  onChange={(event) => setOperatorKey(event.target.value)}
                  placeholder="LEADS_OPERATOR_SECRET"
                  className="h-8 w-full rounded-md border border-slate-200 bg-white px-2.5 text-sm outline-none focus-visible:border-teal-400"
                />
                <Button type="submit" disabled={loadingLive || !operatorKey}>
                  <LockKeyhole />
                  {loadingLive ? "Checking" : unlocked ? "Refresh" : "Unlock"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-md border-slate-200 shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-base">Lead roster</CardTitle>
                <CardDescription>
                  Name, email, phone, submitted time, source / UTM / ad id,
                  follow-up status, and became-patient.
                </CardDescription>
              </div>
              <Badge variant="outline" className="rounded-sm">
                {visibleLeads.length} rows
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Source / UTM / ad</TableHead>
                  <TableHead>Follow-up</TableHead>
                  <TableHead>Became patient</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-slate-500">
                      No ChatGPT leads yet. The ingest contract is documented in
                      the PR.
                    </TableCell>
                  </TableRow>
                ) : (
                  visibleLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="min-w-[180px]">
                        <div className="font-medium text-slate-950">{lead.name}</div>
                        {lead.example ? (
                          <Badge
                            variant="outline"
                            className="mt-1 rounded-sm border-amber-200 bg-amber-50 text-amber-900"
                          >
                            EXAMPLE
                          </Badge>
                        ) : null}
                      </TableCell>
                      <TableCell>{lead.email || "—"}</TableCell>
                      <TableCell>{lead.phone || "—"}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatSubmittedAt(lead.submittedAt)}
                      </TableCell>
                      <TableCell className="max-w-[240px] whitespace-normal text-xs leading-5 text-slate-600">
                        {sourceLabel(lead)}
                      </TableCell>
                      <TableCell>
                        <select
                          aria-label={`Follow-up status for ${lead.name}`}
                          className="h-8 rounded-md border border-slate-200 bg-white px-2 text-sm"
                          disabled={savingId === lead.id || (!lead.example && !unlocked)}
                          value={lead.status}
                          onChange={(event) =>
                            void updateLead(lead, {
                              status: event.target.value as FollowUpStatus,
                            })
                          }
                        >
                          {Object.entries(STATUS_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </TableCell>
                      <TableCell>
                        <label className="inline-flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={lead.becamePatient}
                            disabled={savingId === lead.id || (!lead.example && !unlocked)}
                            onChange={(event) =>
                              void updateLead(lead, {
                                becamePatient: event.target.checked,
                              })
                            }
                          />
                          {lead.becamePatient ? "Yes" : "No"}
                        </label>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function KpiCard({
  label,
  value,
  note,
  icon,
}: {
  label: string;
  value: number;
  note: string;
  icon: ReactNode;
}) {
  return (
    <Card className="rounded-md border-slate-200 shadow-none">
      <CardHeader className="pb-2">
        <CardDescription className="flex items-center gap-2">
          {icon}
          {label}
        </CardDescription>
        <CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      <CardContent className="text-xs leading-5 text-slate-500">{note}</CardContent>
    </Card>
  );
}
