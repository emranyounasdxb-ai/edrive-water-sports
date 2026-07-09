# eDrive Water Sports Deployment Rules

These rules apply only to the eDrive Water Sports repository.

Repository:
`emranyounasdxb-ai/edrive-water-sports`

## Active deployment

This repository is deployed to cPanel using GitHub Actions FTP static deploy only.

Active deployment flow:

```text
GitHub main branch -> npm run build -> Next.js static export out/ -> FTP upload to cPanel public_html
```

## Do not use

Do not change this project to any of the following unless a new deployment plan is approved first:

- Vercel
- cPanel Git Version Control
- Node server deployment
- Express
- API routes
- Server actions
- cPanel Node app

## Static export rules

Keep `next.config.mjs` static export compatible:

```js
output: 'export'
trailingSlash: true
images.unoptimized: true
```

## Active workflow

The active FTP deployment workflow is:

```text
.github/workflows/static-export.yml
```

Do not create duplicate deploy workflows.

## GitHub secrets

The deployment workflow uses these existing repository secrets:

```text
CPANEL_FTP_SERVER
CPANEL_FTP_USERNAME
CPANEL_FTP_PASSWORD
CPANEL_FTP_DIR
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_OPENWEATHER_API_KEY
```

Do not rename these secrets without approval.

## Database rule

The live website/admin booking flow uses:

```text
public.booking_requests
```

Do not switch the live flow to `public.bookings` unless a full migration plan is approved first.

## Change process

Before changing deployment, database, or booking workflow files:

1. Check the current repo files first.
2. Explain the exact files that will change.
3. Avoid random repair SQL.
4. Do not suggest destructive SQL unless approved.
5. Keep the current cPanel FTP static deploy architecture intact.

## Deployment marker

Last FTP deploy trigger: 2026-07-09 17:02 GST from main.
