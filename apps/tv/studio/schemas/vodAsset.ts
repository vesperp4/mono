import { defineField, defineType } from "sanity";

// One packaged recording in the channel catalog. `hlsUrl` points at the
// master playlist produced by apps/tv/packager in Blob Storage; the engine's
// auto-rotation only picks assets where it is set.
export const vodAsset = defineType({
  name: "vodAsset",
  title: "VOD Asset",
  type: "document",
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "show", type: "reference", to: [{ type: "show" }] }),
    defineField({
      name: "hlsUrl",
      title: "HLS master playlist URL",
      type: "url",
      description: "Set after the packager job finishes (…/<assetId>/master.m3u8)",
    }),
    defineField({
      name: "durationSeconds",
      type: "number",
      description: "Used by the auto-scheduler to fill gaps accurately",
    }),
  ],
});
