import { timingSafeEqual } from "node:crypto";

const SECRET_HEADERS = ["authorization", "x-leads-ingest-secret"] as const;

export function getIngestSecret() {
  return process.env.LEADS_INGEST_SECRET?.trim() ?? "";
}

export function ingestSecretConfigured() {
  return getIngestSecret().length > 0;
}

export function readPresentedSecret(request: Request) {
  const authorization = request.headers.get("authorization");
  if (authorization) {
    const [scheme, token] = authorization.split(" ");
    if (scheme?.toLowerCase() === "bearer" && token) {
      return token.trim();
    }
  }

  for (const header of SECRET_HEADERS) {
    const value = request.headers.get(header);
    if (header === "authorization") continue;
    if (value?.trim()) return value.trim();
  }

  return "";
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
  return secretsMatch(readPresentedSecret(request), expected);
}

const DEFAULT_ALLOWED_ORIGINS = [
  "https://exquisitedentistryla.com",
  "https://www.exquisitedentistryla.com",
  "https://exquisite-executive-dashboard.vercel.app",
];

export function allowedIngestOrigins() {
  const extra = (process.env.LEADS_INGEST_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const origins = new Set([...DEFAULT_ALLOWED_ORIGINS, ...extra]);

  if (process.env.NODE_ENV !== "production") {
    origins.add("http://localhost:3000");
    origins.add("http://127.0.0.1:3000");
    origins.add("http://localhost:8080");
    origins.add("http://127.0.0.1:8080");
  }

  return origins;
}

export function corsHeadersFor(request: Request) {
  const origin = request.headers.get("origin");
  const headers = new Headers({
    Vary: "Origin",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
    "Access-Control-Allow-Headers":
      "Authorization, Content-Type, x-leads-ingest-secret",
    "Access-Control-Max-Age": "86400",
  });

  if (origin && allowedIngestOrigins().has(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
  }

  return headers;
}

export function jsonWithCors(
  request: Request,
  body: unknown,
  init?: { status?: number },
) {
  const headers = corsHeadersFor(request);
  headers.set("Content-Type", "application/json");
  return new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers,
  });
}
