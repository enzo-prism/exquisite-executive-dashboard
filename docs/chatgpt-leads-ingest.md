# ChatGPT lead ingest contract

This dashboard stores ChatGPT-ad leads for Exquisite Dentistry (Michael Churchill). The dedicated landing page and form live in a separate repo (`enzo-prism/exquisite-dentistry`). Do not invent Formspree hashes for that LP. Spend stays off.

## What the live site does today

Public pages on [exquisitedentistryla.com](https://exquisitedentistryla.com) currently capture interest in two ways:

- Contact / benefits forms POST to the existing Formspree form `https://formspree.io/f/xkgknpkl` with `name`, `email`, `phone`, and `message` (plus a honeypot). Those are **not** ChatGPT ad leads.
- `/schedule-consultation` sends people to the Simplifeye scheduler, not a first-party form.

The ChatGPT LP should **not** reuse that Formspree form. Point it at this dashboard ingest instead so ChatGPT traffic stays isolated.

## Endpoint

```
POST /api/leads/ingest
```

Production host: `https://exquisite-executive-dashboard.vercel.app` (or the preview URL for this PR).

### Auth

Shared secret only. No second login system.

Send either:

```http
Authorization: Bearer <LEADS_INGEST_SECRET>
```

or

```http
x-leads-ingest-secret: <LEADS_INGEST_SECRET>
```

If `LEADS_INGEST_SECRET` is unset, ingest returns `503`. A missing or wrong secret returns `401`.

Set the same value on Vercel for this project (Preview + Production) before wiring the LP. Do not commit the secret.

### Body

JSON or `application/x-www-form-urlencoded` / `multipart/form-data`. Snake_case or camelCase are both accepted.

Required:

- `name` (string)
- `email` **or** `phone` (at least one)

Optional:

| Field | Notes |
| --- | --- |
| `source` | Defaults to `chatgpt` |
| `utm_source` / `utmSource` | |
| `utm_medium` / `utmMedium` | |
| `utm_campaign` / `utmCampaign` | |
| `utm_content` / `utmContent` | |
| `utm_term` / `utmTerm` | |
| `ad_id` / `adId` | ChatGPT ads creative / ad id when the LP has it |
| `landing_page` / `landingPage` | Path or full URL of the dedicated LP |
| `notes` or `message` | Free-text from the form |
| `submitted_at` / `submittedAt` | ISO-8601. Defaults to ingest time |
| `status` | `new` (default), `contacted`, `appointment_scheduled`, `not_a_fit`, `closed` |
| `became_patient` / `becamePatient` | boolean, default `false` |
| `idempotency_key` / `idempotencyKey` | Optional. Defaults to `email\|digits(phone)\|America/Los_Angeles day` |

Honeypot: if `bot-field` or `_gotcha` is non-empty, the endpoint returns `200` and stores nothing.

### Success

```json
{
  "ok": true,
  "created": true,
  "lead": {
    "id": "lead-…",
    "name": "…",
    "email": "…",
    "phone": "…",
    "source": "chatgpt",
    "utmSource": "chatgpt",
    "utmMedium": "cpc",
    "utmCampaign": "…",
    "utmContent": "…",
    "utmTerm": "…",
    "adId": "…",
    "landingPage": "/…",
    "notes": "…",
    "submittedAt": "2026-08-31T18:00:00.000Z",
    "status": "new",
    "becamePatient": false,
    "example": false
  }
}
```

Duplicate submissions for the same identity on the same Pacific day return `200` with `created: false` and the existing row.

### Example

```bash
curl -X POST "$DASHBOARD_URL/api/leads/ingest" \
  -H "Authorization: Bearer $LEADS_INGEST_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "EXAMPLE — Wire check",
    "email": "wirecheck@example.com",
    "phone": "(555) 010-0100",
    "source": "chatgpt",
    "utm_source": "chatgpt",
    "utm_medium": "cpc",
    "utm_campaign": "veneers-pilot",
    "ad_id": "ad_123",
    "landing_page": "/chatgpt-consult"
  }'
```

Do not send real patient data in examples.

## Other routes

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/leads` | ingest secret | Live leads only. Never a public PII dump. |
| `PATCH` | `/api/leads/:id` | ingest secret | Update `status` and/or `becamePatient` on a live row. EXAMPLE rows are read-only via API. |
| `GET` | `/leads` | none | Table UI. EXAMPLE rows only until the operator key unlocks live rows. |

CORS is open to `exquisitedentistryla.com` (www and apex) and this dashboard host. Extra origins can be added with `LEADS_INGEST_ORIGINS` (comma-separated). There is no geo-block.

## Persistence

- EXAMPLE rows are committed in `src/data/chatgpt-leads.json`.
- Live rows persist in process memory and `/tmp/exquisite-chatgpt-leads.json`.
- That is enough to prove the contract. Vercel serverless instances do not share `/tmp`, so treat this as the wiring target for the LP, not a multi-instance CRM. Durable storage can be added later on the same Vercel account (no new third-party form vendor).

## Follow-up values

- `new`
- `contacted`
- `appointment_scheduled`
- `not_a_fit`
- `closed`

`becamePatient` is a separate boolean so a lead can be marked a patient without collapsing the follow-up trail.
