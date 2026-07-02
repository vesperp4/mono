// tv-engine — the Vesper P4 TV playout service.
//
// Wraps Eyevinn Channel Engine (VOD2Live by HLS manifest stitching — no
// transcoding) with managers that read the programming schedule from the TV
// Sanity project. Live shows are spliced in via the stream switch manager,
// pointing at a Cloudflare Stream Live HLS URL stored on the schedule slot.
//
// TODO(poc): validate live-mix behavior against a real Cloudflare Stream Live
// playlist before wiring prod infra — the one integration taken from docs.

import { ChannelEngine, ChannelEngineOpts } from "eyevinn-channel-engine";

import { SanityAssetManager } from "./assetManager";
import { SanityChannelManager } from "./channelManager";
import { SanityStreamSwitchManager } from "./streamSwitchManager";

const PORT = Number(process.env.PORT ?? 8080);

// A short "be right back" VOD used whenever the schedule has a gap or an
// asset fails to load. Must exist before the channel is considered healthy.
const DEFAULT_SLATE_URI = process.env.SLATE_HLS_URL ?? "";

const assetManager = new SanityAssetManager();
const channelManager = new SanityChannelManager();
const streamSwitchManager = new SanityStreamSwitchManager();

const opts: ChannelEngineOpts = {
  heartbeat: "/",
  averageSegmentDuration: 4000,
  channelManager,
  streamSwitchManager,
  defaultSlateUri: DEFAULT_SLATE_URI,
  slateRepetitions: 10,
  slateDuration: 4000,
};

const engine = new ChannelEngine(assetManager, opts);
engine.start();
engine.listen(PORT);

console.log(`tv-engine listening on :${PORT}`);
