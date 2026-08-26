import {
  corsHeadersFor,
  jsonWithCors,
  operatorSecretConfigured,
  requestHasValidOperatorSecret,
} from "@/lib/leads/auth";
import { leadSummary } from "@/lib/leads/metrics";
import { listLiveLeads } from "@/lib/leads/store";

export const dynamic = "force-dynamic";

export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 204,
    headers: corsHeadersFor(request, "operator"),
  });
}

export async function GET(request: Request) {
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

  const leads = listLiveLeads();
  return jsonWithCors(request, "operator", {
    leads,
    summary: leadSummary(leads),
  });
}
