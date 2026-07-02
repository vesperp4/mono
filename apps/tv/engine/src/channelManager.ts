import { Channel, ChannelProfile, IChannelManager } from "eyevinn-channel-engine";

// Single linear channel. The profile ladder MUST match the renditions the
// packager job produces (apps/tv/packager) — Channel Engine stitches
// manifests, so every asset needs identical, aligned profiles.
export class SanityChannelManager implements IChannelManager {
  getChannels(): Channel[] {
    return [
      {
        id: "vesperp4",
        profile: this.profile(),
      },
    ];
  }

  private profile(): ChannelProfile[] {
    return [
      { bw: 5500000, codecs: "avc1.4d4028,mp4a.40.2", resolution: [1920, 1080] },
      { bw: 3300000, codecs: "avc1.4d401f,mp4a.40.2", resolution: [1280, 720] },
      { bw: 1400000, codecs: "avc1.4d401e,mp4a.40.2", resolution: [854, 480] },
    ];
  }
}
