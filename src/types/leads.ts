export const FOLLOW_UP_STATUSES = [
  "new",
  "contacted",
  "appointment_scheduled",
  "not_a_fit",
  "closed",
] as const;

export type FollowUpStatus = (typeof FOLLOW_UP_STATUSES)[number];

export type ChatGptLead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  utmTerm: string;
  adId: string;
  landingPage: string;
  notes: string;
  submittedAt: string;
  status: FollowUpStatus;
  becamePatient: boolean;
  example: boolean;
  idempotencyKey?: string;
  createdAt: string;
  updatedAt: string;
};

export type LeadIngestInput = {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  source?: unknown;
  utm_source?: unknown;
  utmSource?: unknown;
  utm_medium?: unknown;
  utmMedium?: unknown;
  utm_campaign?: unknown;
  utmCampaign?: unknown;
  utm_content?: unknown;
  utmContent?: unknown;
  utm_term?: unknown;
  utmTerm?: unknown;
  ad_id?: unknown;
  adId?: unknown;
  landing_page?: unknown;
  landingPage?: unknown;
  notes?: unknown;
  message?: unknown;
  submitted_at?: unknown;
  submittedAt?: unknown;
  _date?: unknown;
  status?: unknown;
  became_patient?: unknown;
  becamePatient?: unknown;
  idempotency_key?: unknown;
  idempotencyKey?: unknown;
  "bot-field"?: unknown;
  _gotcha?: unknown;
};

export type LeadUpdateInput = {
  status?: FollowUpStatus;
  becamePatient?: boolean;
};
