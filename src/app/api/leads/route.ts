import {
  corsHeadersFor,
  ingestSecretConfigured,
  jsonWithCors,
  requestHasValidIngestSecret,
} from "@/lib/leads/auth";
import { leadSummary } from "@/lib/leads/metrics";
import { listLiveLeads } from "@/lib/leads/store";

export const dynamic = "force-dynamic";

export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 204,
    headers: corsHeadersFor(request),
  });
}

export async function GET(request: Request) {
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

  const leads = listLiveLeads();
  return jsonWithCors(request, {
    leads,
    summary: leadSummary(leads),
  });
}
