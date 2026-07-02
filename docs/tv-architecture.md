# Vesper P4 TV — Architecture

A 24/7 linear streaming channel at **vesperp4.tv**, inspired by Cloudflare TV
([how they built it](https://blog.cloudflare.com/building-cloudflare-tv-from-scratch/),
[how it matured](https://blog.cloudflare.com/cloudflare-tv-as-a-service/)) but redesigned
so nothing transcodes 24/7 and no VM exists. Public site, no login; streaming only
(no viewer questions/call-ins).

## System diagram

```
                         ┌──────────────────────────────┐
  OBS / Zoom ──RTMPS──▶  │ Cloudflare Stream Live       │──live HLS──┐
  (live shows only)      │ (pay-per-use, no always-on)  │            │
                         └──────────────────────────────┘            ▼
┌────────────┐  upload  ┌────────────┐  ACA Job  ┌──────────┐  ┌───────────────┐
│ recordings │─────────▶│ Blob (mp4) │──────────▶│ Blob HLS │─▶│  tv-engine    │
└────────────┘          └────────────┘ tv-packager└──────────┘  │ (Channel     │
                                                                │  Engine, ACA) │
        ┌───────────────┐   GROQ (what plays when?)             └──────┬────────┘
        │ Sanity (TV    │◀──────────────────────────────────────────────┘
        │ project):     │                                          one linear
        │ Studio=admin  │   GROQ (schedule page)      ┌────────┐   HLS channel
        └───────────────┘◀────────────────────────────│ tv-web │◀───(Cloudflare
                                                      │ (SWA)  │     CDN proxy)
                                                      └────────┘
```

## Components (this repo)

| App | What it is | Runs on |
| --- | --- | --- |
| `apps/tv/web` | Public player + schedule pages (Next.js, hls.js) | SWA Free, `vesperp4.tv` |
| `apps/tv/engine` | Eyevinn Channel Engine + Sanity-backed managers — stitches HLS manifests into one continuous channel (no transcoding) | Existing ACA env, 1 replica, ~0.25–0.5 vCPU |
| `apps/tv/packager` | One-shot ffmpeg job: MP4 → fixed HLS ladder in Blob | ACA Job, per upload |
| `apps/tv/studio` | Sanity Studio — the only admin surface (schedule, catalog, shows) | `*.sanity.studio` (hosted by Sanity) |

## Key design decisions

1. **No 24/7 encoder.** VOD2Live by manifest stitching (Channel Engine) instead of an
   always-on media server (OvenMediaEngine/Brave-style). This is what makes ACA viable —
   an always-on 2 vCPU media container costs ~5× a small VM; a manifest stitcher is a
   fraction of a vCPU. Trade-off: every asset must share an identical rendition ladder.
2. **Live ingest terminates at Cloudflare Stream Live**, not at our infra. ACA has no UDP
   ingress and external TCP needs a VNet env; offloading RTMPS ingest sidesteps both and
   costs per-minute only while actually live.
3. **Sanity is the schedule DB and the admin UI** (the role Contentful played for
   Cloudflare TV). Separate Sanity project from the Phase 2 mainsite CMS. Overlap
   prevention is advisory (Studio validation); the engine tolerates conflicts — first
   match wins, gaps fall back to catalog rotation, then slate.
4. **The ladder contract**: `tv-packager`'s ffmpeg profiles and
   `SanityChannelManager.profile()` must stay in lockstep (1080p/720p/480p, 30fps,
   4s segments, aligned GOPs). Breaking this breaks stitching.

## Not in this repo

- **Infra (Bicep)** — tv-engine container app (min=max=1, health probe `/`), tv-packager
  job, storage account + HLS container, SWA for tv-web, Cloudflare DNS records for
  `vesperp4.tv` → infra repo (`apps/{dev,prod}/tv/*.bicepparam` for image pins).
- **Cloudflare** — vesperp4.tv zone: proxy + cache rules for `/channels/*` (short TTL on
  `.m3u8`, longer on segments); Stream Live inputs created per live show.
- **Sanity project** — create at sanity.io/manage, set `SANITY_STUDIO_PROJECT_ID`.

## PoC gate (do this before any infra work)

Run tv-engine locally against two packaged VODs + one Cloudflare Stream Live playlist and
verify: (a) seamless VOD looping, (b) live splice-in and fall-back. The live-mix behavior
is the single integration taken from docs rather than verified first-hand.
Cost target all-in: ~$15–50/mo (engine compute + Blob + Stream Live minutes; SWA/CDN free).
