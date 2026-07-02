import { IAssetManager, VodRequest, VodResponse } from "eyevinn-channel-engine";

import { groq } from "./sanity";

interface VodAssetDoc {
  _id: string;
  title: string;
  hlsUrl: string;
}

// Decides "what plays next" on the channel (the Contentful/Workers role in
// Cloudflare TV's design):
//   1. If a VOD schedule slot covers "now", play its asset.
//   2. Otherwise rotate through the VOD catalog (auto-scheduler behavior),
//      so the channel keeps humming with zero slots scheduled.
// Live slots are NOT handled here — the stream switch manager splices those.
export class SanityAssetManager implements IAssetManager {
  private rotationIndex = 0;

  async getNextVod(vodRequest: VodRequest): Promise<VodResponse> {
    const scheduled = await groq<VodAssetDoc>(
      `*[_type == "scheduleSlot" && !live && start <= now() && end > now()][0].asset->{ _id, title, hlsUrl }`,
    );
    if (scheduled?.hlsUrl) {
      return { id: scheduled._id, title: scheduled.title, uri: scheduled.hlsUrl };
    }

    const catalog = await groq<VodAssetDoc[]>(
      `*[_type == "vodAsset" && defined(hlsUrl)] | order(_createdAt asc){ _id, title, hlsUrl }`,
    );
    if (!catalog || catalog.length === 0) {
      throw new Error(
        `No playable assets for channel ${vodRequest.playlistId} — engine will fall back to slate`,
      );
    }

    const asset = catalog[this.rotationIndex % catalog.length]!;
    this.rotationIndex += 1;
    return { id: asset._id, title: asset.title, uri: asset.hlsUrl };
  }
}
