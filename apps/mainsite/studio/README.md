# mainsite-studio

Sanity Studio for the **mainsite CMS** — editorial content (events + blog) for
[vesperp4.com](https://vesperp4.com). Editors publish here; the site itself stays
static and rebuilds via webhook on publish. Sanity accounts handle auth (20 free
seats).

This is a **separate Sanity project** from the TV one (`uphuxt07`) — the TV site
is its own product.

## Schemas

- `post` — blog post (title, slug, publishedAt, author, excerpt, cover image,
  Portable Text body); posts appear once `publishedAt` is in the past
- `event` — chapter event (title, slug, start/end, location, description,
  optional RSVP URL and image); split into upcoming/past on the site

Project id: `3osgfq6s` (created 2026-07-03, org Vesper P4). It is public
(read-only GROQ against a public dataset), not a secret — same as
tv-studio / tv-web — and is the hardcoded fallback in both `sanity.config.ts`
(here) and `apps/mainsite/web/lib/cms.ts`.

## Setup (once)

1. `pnpm --filter mainsite-studio dev` to run locally.
2. `pnpm --filter mainsite-studio run deploy` (the `run` is required —
   plain `deploy` hits pnpm's built-in deploy command) hosts the Studio at
   `<name>.sanity.studio` — no Azure resources needed.
3. Configure the publish webhook so content changes redeploy the site — see
   the comment in `.github/workflows/mainsite-web-deploy.yaml`.
