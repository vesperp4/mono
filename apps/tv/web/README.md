# tv-web

Public frontend for **Vesper P4 TV** (`vesperp4.tv`) — the chapter's 24/7 streaming
channel. Fully public, no login. Two pages:

- `/` — the player (hls.js) tuned to the linear channel served by `tv-engine`
- `/schedule` — upcoming programming, read from the TV Sanity project

## Environment

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_CHANNEL_HLS_URL` | Channel master playlist URL (tv-engine behind Cloudflare) |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | TV Sanity project id (public read) |
| `NEXT_PUBLIC_SANITY_DATASET` | Sanity dataset, defaults to `production` |

Without `NEXT_PUBLIC_SANITY_PROJECT_ID` the pages render with placeholders — fine for
local dev before the Sanity project exists.

## Hosting

Azure Static Web Apps (Free tier), provisioned in the infra repo; deployed by
`.github/workflows/tv-web-deploy.yaml`. See `docs/tv-architecture.md` for the full
system design.
