import {
  corsHeadersFor,
  ingestSecretConfigured,
  jsonWithCors,
  requestHasValidIngestSecret,
} from "@/lib/leads/auth";
import { isFollowUpStatus } from "@/lib/leads/ingest";
import { getLeadById, updateLiveLead } from "@/lib/leads/store";

export const dynamic = "force-dynamic";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 204,
    headers: corsHeadersFor(request),
  });
}

export async function PATCH(request: Request, context: RouteParams) {
  if (!ingestSecretConfigured()) {
    return jsonWithCors(
      request,
      { error: "LEADS_INGEST_SECRET is not configured" },
      { status: 503 },
    );
  }

  if (!requestHasValidIngestSecret(request)) {
    return jsonWithCors(request, { error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const existing = getLeadById(id);

  if (!existing) {
    return jsonWithCors(request, { error: "Lead not found" }, { status: 404 });
  }

  if (existing.example) {
    return jsonWithCors(
      request,
      { error: "EXAMPLE rows are read-only" },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonWithCors(request, { error: "Invalid JSON" }, { status: 400 });
  }

  const payload = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const status = payload.status;
  const becamePatient = payload.becamePatient ?? payload.became_patient;

  if (status !== undefined && !isFollowUpStatus(status)) {
    return jsonWithCors(request, { error: "Invalid status" }, { status: 400 });
  }

  if (
    becamePatient !== undefined &&
    typeof becamePatient !== "boolean"
  ) {
    return jsonWithCors(
      request,
      { error: "becamePatient must be a boolean" },
      { status: 400 },
    );
  }

  const updated = updateLiveLead(id, {
    status: isFollowUpStatus(status) ? status : undefined,
    becamePatient: typeof becamePatient === "boolean" ? becamePatient : undefined,
  });

  if (!updated) {
    return jsonWithCors(request, { error: "Lead not found" }, { status: 404 });
  }

  return jsonWithCors(request, { ok: true, lead: updated });
}
