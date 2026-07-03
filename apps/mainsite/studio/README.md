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

## Setup (once)

1. Create the Sanity project at sanity.io/manage (org Vesper P4); note the
   projectId. **The project does not exist yet** — until then the config falls
   back to an empty id (fine for `sanity build`; `dev`/`deploy` need the real
   one).
2. Fill in the real projectId as the fallback in **both** `sanity.config.ts`
   (here) and `apps/mainsite/web/lib/cms.ts`. The id is public (read-only GROQ
   against a public dataset), not a secret — same as tv-studio / tv-web.
3. `SANITY_STUDIO_PROJECT_ID=<id> pnpm --filter mainsite-studio dev` to run
   locally (or just `pnpm --filter mainsite-studio dev` once the fallback is
   filled in).
4. `pnpm --filter mainsite-studio deploy` hosts the Studio at
   `<name>.sanity.studio` — no Azure resources needed.

After the project exists, also configure the publish webhook so content changes
redeploy the site — see the comment in
`.github/workflows/mainsite-web-deploy.yaml`.
