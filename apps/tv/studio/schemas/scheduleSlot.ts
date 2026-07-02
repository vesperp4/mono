import { defineField, defineType } from "sanity";

// One entry on the linear schedule. Two kinds:
//   - VOD slot (live = false): plays `asset` for the window
//   - Live slot (live = true): the engine splices in `liveHlsUrl`
//     (a Cloudflare Stream Live playlist fed by OBS/Zoom over RTMPS)
//
// NOTE: Sanity cannot enforce non-overlapping slots — the engine tolerates
// conflicts (first match wins, gaps fall back to catalog rotation/slate), and
// a Studio validation below gives editors a basic guard.
export const scheduleSlot = defineType({
  name: "scheduleSlot",
  title: "Schedule Slot",
  type: "document",
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "start",
      type: "datetime",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "end",
      type: "datetime",
      validation: (rule) =>
        rule.required().min(rule.valueOfField("start")).error("End must be after start"),
    }),
    defineField({
      name: "live",
      type: "boolean",
      initialValue: false,
      description: "Live show (splice a live stream) instead of a VOD replay",
    }),
    defineField({
      name: "asset",
      type: "reference",
      to: [{ type: "vodAsset" }],
      hidden: ({ document }) => Boolean(document?.live),
    }),
    defineField({
      name: "liveHlsUrl",
      title: "Live HLS URL",
      type: "url",
      description: "Cloudflare Stream Live playback URL for this show",
      hidden: ({ document }) => !document?.live,
    }),
  ],
  preview: {
    select: { title: "title", start: "start", live: "live" },
    prepare({ title, start, live }) {
      return {
        title: `${live ? "🔴 " : ""}${title}`,
        subtitle: start,
      };
    },
  },
});
