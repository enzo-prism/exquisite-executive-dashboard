import { readFileSync, writeFileSync } from "node:fs";

import seed from "@/data/chatgpt-leads.json";
import { isFollowUpStatus, leadIdentityKey } from "@/lib/leads/ingest";
import type { ChatGptLead, FollowUpStatus, LeadUpdateInput } from "@/types/leads";

const LIVE_STORE_PATH = "/tmp/exquisite-chatgpt-leads.json";

type SeedFile = {
  leads: ChatGptLead[];
};

type LiveFile = {
  leads: ChatGptLead[];
};

let liveCache: ChatGptLead[] | null = null;
const idempotencyIndex = new Map<string, string>();

function exampleLeads() {
  return (seed as SeedFile).leads.filter((lead) => lead.example);
}

function readLiveFromDisk(): ChatGptLead[] {
  try {
    const raw = readFileSync(LIVE_STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as LiveFile;
    if (!Array.isArray(parsed.leads)) return [];
    return parsed.leads.filter((lead) => lead && lead.example === false);
  } catch {
    return [];
  }
}

function writeLiveToDisk(leads: ChatGptLead[]) {
  writeFileSync(
    LIVE_STORE_PATH,
    `${JSON.stringify({ leads }, null, 2)}\n`,
    "utf8",
  );
}

function ensureLiveCache() {
  if (liveCache) return liveCache;
  liveCache = readLiveFromDisk();
  for (const lead of liveCache) {
    idempotencyIndex.set(leadIdentityKey(lead), lead.id);
  }
  return liveCache;
}

function persistLive(leads: ChatGptLead[]) {
  liveCache = leads;
  writeLiveToDisk(leads);
}

export function listExampleLeads() {
  return exampleLeads()
    .slice()
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export function listLiveLeads() {
  return ensureLiveCache()
    .slice()
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export function listPublicLeads() {
  return listExampleLeads();
}

export function findLiveByIdempotencyKey(key: string) {
  ensureLiveCache();
  const id = idempotencyIndex.get(key);
  if (!id) return null;
  return ensureLiveCache().find((lead) => lead.id === id) ?? null;
}

export function insertLiveLead(lead: ChatGptLead, idempotencyKey: string) {
  const existing = findLiveByIdempotencyKey(idempotencyKey);
  if (existing) {
    return { lead: existing, created: false };
  }

  const next = [lead, ...ensureLiveCache()];
  idempotencyIndex.set(idempotencyKey, lead.id);
  persistLive(next);
  return { lead, created: true };
}

export function getLeadById(id: string) {
  return (
    listExampleLeads().find((lead) => lead.id === id) ??
    listLiveLeads().find((lead) => lead.id === id) ??
    null
  );
}

export function updateLiveLead(id: string, patch: LeadUpdateInput) {
  const current = ensureLiveCache();
  const index = current.findIndex((lead) => lead.id === id);
  if (index === -1) return null;

  const nextStatus: FollowUpStatus = isFollowUpStatus(patch.status)
    ? patch.status
    : current[index].status;
  const nextBecamePatient =
    typeof patch.becamePatient === "boolean"
      ? patch.becamePatient
      : current[index].becamePatient;

  const updated: ChatGptLead = {
    ...current[index],
    status: nextStatus,
    becamePatient: nextBecamePatient,
    updatedAt: new Date().toISOString(),
  };

  const next = current.slice();
  next[index] = updated;
  persistLive(next);
  return updated;
}
