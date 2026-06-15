# Exquisite Executive Dashboard

Public executive dashboard for Michael Churchill and Exquisite Dentistry. It combines a local GA4 snapshot, Google Search Console snapshot, and a GitHub-reviewed website-change timeline.

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

The project is deployed as `exquisite-executive-dashboard` on Vercel. Refresh data locally, commit the updated JSON snapshot, push to `main`, then deploy to production.
