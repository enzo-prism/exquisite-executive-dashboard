import { timingSafeEqual } from "node:crypto";

export type LeadAuthRole = "ingest" | "operator";

function envSecret(name: "LEADS_INGEST_SECRET" | "LEADS_OPERATOR_SECRET") {
  return process.env[name]?.trim() ?? "";
}

export function getIngestSecret() {
  return envSecret("LEADS_INGEST_SECRET");
}

export function getOperatorSecret() {
  return envSecret("LEADS_OPERATOR_SECRET");
}

export function ingestSecretConfigured() {
  return getIngestSecret().length > 0;
}

export function operatorSecretConfigured() {
  const operator = getOperatorSecret();
  const ingest = getIngestSecret();
  return operator.length > 0 && !secretsMatch(operator, ingest);
}

export function readPresentedSecret(request: Request, role: LeadAuthRole) {
  const authorization = request.headers.get("authorization");
  if (authorization) {
    const [scheme, token] = authorization.split(" ");
    if (scheme?.toLowerCase() === "bearer" && token) {
      return token.trim();
    }
  }

  const headerName =
    role === "ingest" ? "x-leads-ingest-secret" : "x-leads-operator-secret";
  return request.headers.get(headerName)?.trim() ?? "";
}

export function secretsMatch(presented: string, expected: string) {
  if (!presented || !expected) return false;
  const left = Buffer.from(presented);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function requestHasValidIngestSecret(request: Request) {
  const expected = getIngestSecret();
  if (!expected) return false;
  return secretsMatch(readPresentedSecret(request, "ingest"), expected);
}

export function requestHasValidOperatorSecret(request: Request) {
  if (!operatorSecretConfigured()) return false;
  return secretsMatch(readPresentedSecret(request, "operator"), getOperatorSecret());
}

const DEFAULT_INGEST_ORIGINS = [
  "https://exquisitedentistryla.com",
  "https://www.exquisitedentistryla.com",
];

export function allowedIngestOrigins() {
  const extra = (process.env.LEADS_INGEST_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const origins = new Set([...DEFAULT_INGEST_ORIGINS, ...extra]);

  if (process.env.NODE_ENV !== "production") {
    origins.add("http://localhost:8080");
    origins.add("http://127.0.0.1:8080");
  }

  return origins;
}

export function corsHeadersFor(request: Request, role: LeadAuthRole) {
  const headers = new Headers({
    Vary: "Origin",
    "Access-Control-Max-Age": "86400",
  });

  if (role === "ingest") {
    headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    headers.set(
      "Access-Control-Allow-Headers",
      "Authorization, Content-Type, x-leads-ingest-secret",
    );
    const origin = request.headers.get("origin");
    if (origin && allowedIngestOrigins().has(origin)) {
      headers.set("Access-Control-Allow-Origin", origin);
    }
    return headers;
  }

  headers.set("Access-Control-Allow-Methods", "GET, PATCH, OPTIONS");
  headers.set(
    "Access-Control-Allow-Headers",
    "Authorization, Content-Type, x-leads-operator-secret",
  );
  return headers;
}

export function jsonWithCors(
  request: Request,
  role: LeadAuthRole,
  body: unknown,
  init?: { status?: number },
) {
  const headers = corsHeadersFor(request, role);
  headers.set("Content-Type", "application/json");
  return new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers,
  });
}
