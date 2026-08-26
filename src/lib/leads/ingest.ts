import { randomUUID } from "node:crypto";

import {
  FOLLOW_UP_STATUSES,
  type ChatGptLead,
  type FollowUpStatus,
  type LeadIngestInput,
} from "@/types/leads";

const PRACTICE_TIME_ZONE = "America/Los_Angeles";

const practiceDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: PRACTICE_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function asTrimmedString(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

export function isHoneypot(input: LeadIngestInput) {
  return Boolean(asTrimmedString(input["bot-field"]) || asTrimmedString(input._gotcha));
}

export function isFollowUpStatus(value: unknown): value is FollowUpStatus {
  return (
    typeof value === "string" &&
    FOLLOW_UP_STATUSES.includes(value as FollowUpStatus)
  );
}

export function practiceDayKey(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso.slice(0, 10);
  const parts = Object.fromEntries(
    practiceDateFormatter.formatToParts(date).map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function leadIdentityKey(lead: Pick<ChatGptLead, "email" | "phone" | "submittedAt">) {
  const email = lead.email.toLowerCase();
  const phone = lead.phone.replace(/\D/g, "");
  return `${email}|${phone}|${practiceDayKey(lead.submittedAt)}`;
}

function readBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1" || normalized === "yes") return true;
    if (normalized === "false" || normalized === "0" || normalized === "no") return false;
  }
  return false;
}

function readSubmittedAt(input: LeadIngestInput) {
  const raw =
    asTrimmedString(input.submitted_at) ||
    asTrimmedString(input.submittedAt) ||
    asTrimmedString(input._date);

  if (!raw) return new Date().toISOString();

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString();
  return parsed.toISOString();
}

export function parseIngestPayload(input: LeadIngestInput): {
  ok: true;
  lead: ChatGptLead;
  idempotencyKey: string;
} | {
  ok: false;
  error: string;
} {
  const name = asTrimmedString(input.name);
  const email = asTrimmedString(input.email);
  const phone = asTrimmedString(input.phone);
  const notes =
    asTrimmedString(input.notes) || asTrimmedString(input.message);

  if (!name) {
    return { ok: false, error: "name is required" };
  }

  if (!email && !phone) {
    return { ok: false, error: "email or phone is required" };
  }

  const now = new Date().toISOString();
  const submittedAt = readSubmittedAt(input);
  const status = isFollowUpStatus(input.status) ? input.status : "new";
  const id = `lead-${randomUUID()}`;

  const lead: ChatGptLead = {
    id,
    name,
    email,
    phone,
    source: asTrimmedString(input.source) || "chatgpt",
    utmSource: asTrimmedString(input.utm_source) || asTrimmedString(input.utmSource),
    utmMedium: asTrimmedString(input.utm_medium) || asTrimmedString(input.utmMedium),
    utmCampaign:
      asTrimmedString(input.utm_campaign) || asTrimmedString(input.utmCampaign),
    utmContent:
      asTrimmedString(input.utm_content) || asTrimmedString(input.utmContent),
    utmTerm: asTrimmedString(input.utm_term) || asTrimmedString(input.utmTerm),
    adId: asTrimmedString(input.ad_id) || asTrimmedString(input.adId),
    landingPage:
      asTrimmedString(input.landing_page) || asTrimmedString(input.landingPage),
    notes,
    submittedAt,
    status,
    becamePatient:
      readBoolean(input.became_patient) || readBoolean(input.becamePatient),
    example: false,
    createdAt: now,
    updatedAt: now,
  };

  const idempotencyKey =
    asTrimmedString(input.idempotency_key) ||
    asTrimmedString(input.idempotencyKey) ||
    leadIdentityKey(lead);

  return { ok: true, lead, idempotencyKey };
}

export function parseRequestBody(raw: unknown): LeadIngestInput {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }

  return raw as LeadIngestInput;
}
