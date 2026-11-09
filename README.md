# Exquisite Executive Dashboard

Public executive dashboard for Michael Churchill and Exquisite Dentistry. It combines a local GA4 snapshot, Google Search Console snapshot, and a GitHub-reviewed website-change timeline.

Production: <https://exquisite-executive-dashboard.vercel.app/>

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Recharts
- Vercel deployment

## Data Sources

- GA4: `Exquisite Dentistry - Live`, `properties/498175984`
- GSC: `sc-domain:exquisitedentistryla.com`
- Website commits: `enzo-prism/exquisite-dentistry`
- Dashboard windows: last 30, 60, and 90 days
- Timeline source window: latest 90 days from the GitHub API

Google and GitHub credentials are local-only. Vercel serves the committed snapshot at `src/data/dashboard-snapshot.json`; it does not run `gogcli` in production.

## Local Workflow

```bash
npm run refresh:data
npm run lint
npm run build
npm run dev
```

`npm run refresh:data` requires:

- `gog` (or `GOGCLI_BIN`) authenticated for `enzo@design-prism.com`
- `gh` authenticated with access to `enzo-prism/exquisite-dentistry`

Useful environment overrides:

```bash
GOGCLI_ACCOUNT=enzo@design-prism.com
GOGCLI_BIN=/Users/enzo/.local/bin/gog
GA4_PROPERTY=properties/498175984
GSC_SITE=sc-domain:exquisitedentistryla.com
SOURCE_GITHUB_REPO=enzo-prism/exquisite-dentistry
```

## Timeline Rules

- The top filter switches GA4, GSC, and website-update views between last 30, 60, and 90 days.
- Most recent website changes appear first.
- Cards do not show actual dates or times.
- Website-update cards always render as a one-column list.
- Clicking a card opens full details, including affected files and line-level GitHub change counts.

## Deployment

The project is deployed as `exquisite-executive-dashboard` on Vercel with the Next.js framework preset.

Refresh data locally, commit the updated JSON snapshot, push to `main`, then deploy to production:

```bash
npm run refresh:data
npm run lint
npm run build
git add .
git commit -m "Refresh executive dashboard snapshot"
git push
vercel deploy --prod --yes --project exquisite-executive-dashboard
```

The Vercel project is connected to `enzo-prism/exquisite-executive-dashboard`.

## Verification

Current implementation checks:

- `npm run refresh:data`
- `npm run lint`
- `npm run build`
- Production HTTP 200 at `https://exquisite-executive-dashboard.vercel.app/`
- Browser check confirms the Last 30, Last 60, and Last 90 day filters update the dashboard.
- Browser check confirms 3 rendered chart surfaces
- Browser check confirms timeline cards stay in a single-column list and detail dialogs contain no visible date/time strings
- Snapshot reconciliation confirms displayed GA4/GSC KPI totals match `src/data/dashboard-snapshot.json`

## November 8 freshness and accuracy release

The committed snapshot was refreshed from Google and GitHub on November 8, with GA4 and finalized Search Console reports through November 7. Each 30/60/90-day period has its own exact dates and equally long previous period. GA4 queries canonical website hosts and uses an ungrouped period report for unique users. Search totals come from ungrouped property reports, with the latest finalized source date discovered first. Unpublished search days are null. Channel discrepancies are disclosed rather than balanced with invented rows. Public landing paths omit query strings.

“Key events” means GA4-configured actions, not verified inquiries or booked patients. The ChatGPT landing page intentionally has no GA4 tracking. Campaign status comes from `src/data/campaign-status.json`, a dated manual readback; analytics refresh never advances its verification timestamp. Update that record only from verified Ads Manager evidence.

The page shows snapshot refresh time, exact source windows, measurement limits and a warning after 48 hours. It does not automatically refresh the committed data. No recurring job was added. Refreshes fail without replacing the last good snapshot when a source is incomplete or invalid. GitHub timeline pagination is complete; commit history does not itself prove production deployment.

Run `npm test` for timezone, metric validation, missing search days and public-path privacy regression checks. Next.js is patched to 16.4.5. The shadcn CLI is removed from the app dependency graph; its MIT-licensed Tailwind helpers are vendored under `src/shadcn.css` and `licenses/`. Production dependency audit is clean. Eight moderate development-only findings remain in the upstream ESLint/typescript-eslint minimatch chain; no breaking forced downgrade was applied.
