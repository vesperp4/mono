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

  // Values match the packager's actual ffmpeg output (verified against the
  // first packaged asset's master.m3u8) — including 480p at level 3.1
  // (avc1.4d401f), which ffmpeg selects despite the sub-720p resolution.
  private profile(): ChannelProfile[] {
    return [
      { bw: 5640800, codecs: "avc1.4d4028,mp4a.40.2", resolution: [1920, 1080] },
      { bw: 3440800, codecs: "avc1.4d401f,mp4a.40.2", resolution: [1280, 720] },
      { bw: 1460800, codecs: "avc1.4d401f,mp4a.40.2", resolution: [854, 480] },
    ];
  }
}
