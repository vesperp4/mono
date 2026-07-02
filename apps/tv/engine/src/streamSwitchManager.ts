import { IStreamSwitchManager, Schedule } from "eyevinn-channel-engine";
// Not re-exported from the package root (verified against v5.1.3 typings).
import { ScheduleStreamType } from "eyevinn-channel-engine/dist/engine/server";

import { groq } from "./sanity";

interface LiveSlotDoc {
  _id: string;
  title: string;
  start: string;
  end: string;
  liveHlsUrl: string;
}

// Splices live shows into the linear channel. When a schedule slot marked
// `live` is active, the engine switches from VOD2Live to the slot's live HLS
// URL (a Cloudflare Stream Live playlist fed by OBS/Zoom over RTMPS), then
// falls back to VOD when the slot ends.
export class SanityStreamSwitchManager implements IStreamSwitchManager {
  async getSchedule(_channelId: string): Promise<Schedule[]> {
    const slots = await groq<LiveSlotDoc[]>(
      `*[_type == "scheduleSlot" && live && defined(liveHlsUrl) && end > now()] | order(start asc)[0...10]{ _id, title, start, end, liveHlsUrl }`,
    );
    if (!slots) return [];

    return slots.map((slot) => ({
      eventId: slot._id,
      assetId: slot._id,
      title: slot.title,
      type: ScheduleStreamType.LIVE,
      start_time: Date.parse(slot.start),
      end_time: Date.parse(slot.end),
      uri: slot.liveHlsUrl,
    }));
  }
}
