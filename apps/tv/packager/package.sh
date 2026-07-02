#!/usr/bin/env bash
# Packages one source recording into the channel's fixed HLS rendition ladder.
#
# The ladder MUST stay in lockstep with SanityChannelManager.profile() in
# apps/tv/engine — Channel Engine stitches manifests, so every asset needs
# identical profiles: 1080p/720p/480p, H.264 main, AAC 128k, 30fps, 4s
# segments, aligned GOPs (g = keyint_min = 120).
#
# Required env (set per job execution):
#   INPUT_URL   — source MP4 (Blob URL; SAS or reachable via azcopy MSI login)
#   OUTPUT_URL  — destination Blob container/prefix for the HLS package
#   ASSET_ID    — output folder name (Sanity vodAsset _id or slug)
# Optional:
#   AZCOPY_AUTO_LOGIN_TYPE=MSI  — use the job's managed identity for both copies
set -euo pipefail

: "${INPUT_URL:?INPUT_URL is required}"
: "${OUTPUT_URL:?OUTPUT_URL is required}"
: "${ASSET_ID:?ASSET_ID is required}"

WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT
cd "$WORKDIR"

echo "[packager] downloading source for ${ASSET_ID}"
azcopy copy "$INPUT_URL" source.mp4

mkdir -p out
echo "[packager] transcoding to HLS ladder"
ffmpeg -hide_banner -y -i source.mp4 \
  -filter_complex "[0:v]fps=30,split=3[v1][v2][v3];[v1]scale=1920:1080[v1o];[v2]scale=1280:720[v2o];[v3]scale=854:480[v3o]" \
  -map "[v1o]" -map 0:a -map "[v2o]" -map 0:a -map "[v3o]" -map 0:a \
  -c:v libx264 -preset veryfast -profile:v main -sc_threshold 0 \
  -g 120 -keyint_min 120 \
  -b:v:0 5000k -maxrate:v:0 5500k -bufsize:v:0 7500k \
  -b:v:1 3000k -maxrate:v:1 3300k -bufsize:v:1 4500k \
  -b:v:2 1200k -maxrate:v:2 1400k -bufsize:v:2 2000k \
  -c:a aac -b:a 128k -ar 48000 -ac 2 \
  -f hls -hls_time 4 -hls_playlist_type vod -hls_segment_type mpegts \
  -hls_segment_filename "out/%v/seg_%04d.ts" \
  -master_pl_name master.m3u8 \
  -var_stream_map "v:0,a:0 v:1,a:1 v:2,a:2" \
  "out/%v/index.m3u8"

echo "[packager] uploading HLS package"
azcopy copy "out/*" "${OUTPUT_URL%/}/${ASSET_ID}/" --recursive

echo "[packager] done: ${OUTPUT_URL%/}/${ASSET_ID}/master.m3u8"
# TODO(dev-team): PATCH the Sanity vodAsset with the resulting hlsUrl + duration
# (Sanity mutation API with a write token) so uploads self-register.
