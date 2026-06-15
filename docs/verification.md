# Verification Log

This dashboard was verified with local snapshot data and production deployment checks.

## Current Snapshot

- GA4 property: `properties/498175984`
- GSC site: `sc-domain:exquisitedentistryla.com`
- GitHub source repo: `enzo-prism/exquisite-dentistry`
- Dashboard windows: last 30, 60, and 90 days
- Timeline source window: latest 90 days
- Timeline commits reviewed: 5 in the 30-day view, 11 in the 60-day view, 23 in the 90-day view

## Commands

```bash
npm run refresh:data
npm run lint
npm run build
```

## Production

- Project: `exquisite-executive-dashboard`
- Public URL: `https://exquisite-executive-dashboard.vercel.app/`
- Vercel framework preset: Next.js
- Deployment protection: SSO disabled for public v1 access
- GitHub repo connected: `enzo-prism/exquisite-executive-dashboard`

## Browser QA

Chrome verification confirmed:

- Main dashboard title renders
- Last 30, Last 60, and Last 90 day filters render at the top of the app
- Filter clicks update the active dashboard window and website-update count
- Three main Recharts visualizations render
- Timeline cards render as one full-width, one-column list
- First timeline card opens a detail dialog
- Timeline card text contains no date/time-looking strings
- Dialog detail text contains no date/time-looking strings
- Console had no useful warnings or page errors after filtering extension/dev-only messages
