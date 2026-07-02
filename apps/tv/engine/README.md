# tv-engine

Playout service for **Vesper P4 TV** — an [Eyevinn Channel Engine](https://github.com/Eyevinn/channel-engine)
wrapper that turns the Sanity schedule into one continuous 24/7 HLS channel by
manifest stitching (no transcoding, fraction-of-a-vCPU footprint).

- `SanityAssetManager` — "what plays next": the scheduled VOD slot, else rotates the catalog
- `SanityChannelManager` — the single `vesperp4` channel + rendition ladder (must match the packager output)
- `SanityStreamSwitchManager` — splices live slots (Cloudflare Stream Live HLS URLs) into the channel

## Environment

| Variable | Purpose |
| --- | --- |
| `PORT` | HTTP port (default 8080, ACA convention) |
| `SANITY_PROJECT_ID` / `SANITY_DATASET` | TV Sanity project (dataset defaults to `production`) |
| `SANITY_READ_TOKEN` | Only if the dataset is private |
| `SLATE_HLS_URL` | "Be right back" VOD used on schedule gaps/errors |

## Endpoints

- `/channels/vesperp4/master.m3u8` — the channel playlist consumed by tv-web
- `/` — heartbeat (used as the ACA health probe)

## PoC checklist (before infra wiring)

1. `pnpm --filter tv-engine dev` with two HLS-packaged VODs in Sanity — verify seamless looping.
2. Add a live slot pointing at a Cloudflare Stream Live playlist — verify splice-in and fall-back.
   This is the only integration taken on faith from docs (see `docs/tv-architecture.md`).

Deployed to the existing Azure Container Apps environment (min = max = 1 replica —
the playout session is stateful). Image built by `tv-engine-build.yaml` on release tags.
