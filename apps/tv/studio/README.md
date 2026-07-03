# tv-studio

Sanity Studio for **Vesper P4 TV** — the channel's only admin surface (the site
itself has no login). Programming team edits shows, the VOD catalog, and the
linear schedule here; Sanity accounts handle auth (20 free seats).

This is a **separate Sanity project** from the Phase 2 mainsite CMS.

## Schemas

- `show` — recurring program metadata
- `vodAsset` — packaged recording (`hlsUrl` → Blob HLS package from tv-packager)
- `scheduleSlot` — one schedule entry; `live = true` slots carry a Cloudflare
  Stream Live URL that tv-engine splices into the channel

## Setup (once)

1. Create the Sanity project at sanity.io/manage; note the projectId.
2. `SANITY_STUDIO_PROJECT_ID=<id> pnpm --filter tv-studio dev` to run locally.
3. `pnpm --filter tv-studio run deploy` (the `run` is required — plain `deploy`
   hits pnpm's built-in deploy command) hosts the Studio at
   `<name>.sanity.studio` — no Azure resources needed.

Overlap validation is advisory only (see scheduleSlot notes) — tv-engine
tolerates conflicting slots by design.
