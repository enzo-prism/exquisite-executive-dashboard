import {
  corsHeadersFor,
  ingestSecretConfigured,
  jsonWithCors,
  requestHasValidIngestSecret,
} from "@/lib/leads/auth";
import { isHoneypot, parseIngestPayload, parseRequestBody } from "@/lib/leads/ingest";
import { findLiveByIdempotencyKey, insertLiveLead } from "@/lib/leads/store";
import type { LeadIngestInput } from "@/types/leads";

export const dynamic = "force-dynamic";

async function readBody(request: Request): Promise<LeadIngestInput> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      return parseRequestBody(await request.json());
    } catch {
      return {};
    }
  }

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const form = await request.formData();
    return parseRequestBody(Object.fromEntries(form.entries()));
  }

  try {
    return parseRequestBody(await request.json());
  } catch {
    return {};
  }
}

export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 204,
    headers: corsHeadersFor(request, "ingest"),
  });
}

export async function POST(request: Request) {
  if (!ingestSecretConfigured()) {
    return jsonWithCors(
      request,
      "ingest",
      {
        error: "LEADS_INGEST_SECRET is not configured",
      },
      { status: 503 },
    );
  }

  if (!requestHasValidIngestSecret(request)) {
    return jsonWithCors(request, "ingest", { error: "Unauthorized" }, { status: 401 });
  }

  const body = await readBody(request);

  if (isHoneypot(body)) {
    return jsonWithCors(request, "ingest", { ok: true, ignored: "honeypot" });
  }

  const parsed = parseIngestPayload(body);
  if (!parsed.ok) {
    return jsonWithCors(request, "ingest", { error: parsed.error }, { status: 400 });
  }

  const existing = findLiveByIdempotencyKey(parsed.idempotencyKey);
  if (existing) {
    return jsonWithCors(request, "ingest", { ok: true, created: false, lead: existing });
  }

  const result = insertLiveLead(parsed.lead, parsed.idempotencyKey);
  return jsonWithCors(
    request,
    "ingest",
    { ok: true, created: result.created, lead: result.lead },
    { status: result.created ? 201 : 200 },
  );
}
