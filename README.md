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
- Timeline window: latest 60 days from the GitHub API

Google and GitHub credentials are local-only. Vercel serves the committed snapshot at `src/data/dashboard-snapshot.json`; it does not run `gogcli` in production.

## Local Workflow

```bash
npm run refresh:data
npm run lint
npm run build
npm run dev
```

`npm run refresh:data` requires:

- `gogcli` authenticated for `enzo@design-prism.com`
- `gh` authenticated with access to `enzo-prism/exquisite-dentistry`

Useful environment overrides:

```bash
GOGCLI_ACCOUNT=enzo@design-prism.com
GOGCLI_BIN=/Users/enzo/.local/bin/gogcli
GA4_PROPERTY=properties/498175984
GSC_SITE=sc-domain:exquisitedentistryla.com
SOURCE_GITHUB_REPO=enzo-prism/exquisite-dentistry
```

## Timeline Rules

- Most recent website changes appear first.
- Cards do not show actual dates or times.
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
- Browser check confirms 3 rendered chart surfaces
- Browser check confirms timeline cards and detail dialog contain no visible date/time strings
- Snapshot reconciliation confirms displayed GA4/GSC KPI totals match `src/data/dashboard-snapshot.json`

## Known Caveat

`npm audit --audit-level=moderate` currently reports a moderate `postcss` advisory through the installed Next.js package. The suggested `npm audit fix --force` would downgrade Next.js to an old breaking version, so this project keeps the current create-next-app/Next.js stack and treats the advisory as an upstream dependency caveat.
