import {
  corsHeadersFor,
  jsonWithCors,
  operatorSecretConfigured,
  requestHasValidOperatorSecret,
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
    headers: corsHeadersFor(request, "operator"),
  });
}

export async function PATCH(request: Request, context: RouteParams) {
  if (!operatorSecretConfigured()) {
    return jsonWithCors(
      request,
      "operator",
      {
        error:
          "LEADS_OPERATOR_SECRET is not configured or matches LEADS_INGEST_SECRET",
      },
      { status: 503 },
    );
  }

  if (!requestHasValidOperatorSecret(request)) {
    return jsonWithCors(request, "operator", { error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const existing = getLeadById(id);

  if (!existing) {
    return jsonWithCors(request, "operator", { error: "Lead not found" }, { status: 404 });
  }

  if (existing.example) {
    return jsonWithCors(
      request,
      "operator",
      { error: "EXAMPLE rows are read-only" },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonWithCors(request, "operator", { error: "Invalid JSON" }, { status: 400 });
  }

  const payload = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const status = payload.status;
  const becamePatient = payload.becamePatient ?? payload.became_patient;

  if (status !== undefined && !isFollowUpStatus(status)) {
    return jsonWithCors(request, "operator", { error: "Invalid status" }, { status: 400 });
  }

  if (becamePatient !== undefined && typeof becamePatient !== "boolean") {
    return jsonWithCors(
      request,
      "operator",
      { error: "becamePatient must be a boolean" },
      { status: 400 },
    );
  }

  const updated = updateLiveLead(id, {
    status: isFollowUpStatus(status) ? status : undefined,
    becamePatient: typeof becamePatient === "boolean" ? becamePatient : undefined,
  });

  if (!updated) {
    return jsonWithCors(request, "operator", { error: "Lead not found" }, { status: 404 });
  }

  return jsonWithCors(request, "operator", { ok: true, lead: updated });
}
