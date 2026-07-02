# tv-packager

One-shot ffmpeg job that packages an uploaded recording (MP4 in Blob Storage)
into the channel's HLS rendition ladder and uploads the result back to Blob.
Runs as an **Azure Container Apps Job** — pay per execution, nothing always-on.

The ladder (1080p/720p/480p, 30fps, 4s segments, aligned GOPs) must stay in
lockstep with `SanityChannelManager.profile()` in `apps/tv/engine` — Channel
Engine requires identical profiles across all assets to stitch manifests.

Trigger (v1): manual job start with env overrides:

```
az containerapp job start -n tv-packager -g <rg> \
  --env-vars INPUT_URL=<blob-url> OUTPUT_URL=<container-url> ASSET_ID=<id>
```

Later: Event Grid on blob-created → job trigger. Image built by
`tv-packager-build.yaml` on release tags; version tracked in `version.txt`
(release-please `simple` type).
