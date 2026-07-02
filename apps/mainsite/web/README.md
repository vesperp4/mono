# mainsite-web

The **public site** for VESPER P4 — [`vesperp4.com`](https://vesperp4.com)
(dev: `dev.vesperp4.com`).

This Next.js app is the chapter's public showcase: landing page, about, team, projects,
and contact (Phase 1). It is **content-only** — it makes no API calls. Membership
functionality (sign up, sign in, email confirmation) lives in the separate `portal-web`
app ([`portal.vesperp4.com`](https://portal.vesperp4.com)), which this site links to for
joining. Editorial content moves to Sanity in Phase 2.

## Getting Started

From the repo root:

```bash
mise run dev
```

Open [http://localhost:3000](http://localhost:3000).

Quality gates for just this app: `mise run check-mainsite-web`.

## Deployment

Pushes to `main` touching this app trigger `mainsite-web-deploy.yaml`, which builds the
app and uploads it to Azure Static Web Apps via the deploy token. See
[docs/cicd-pipeline.md](../../../docs/cicd-pipeline.md).
