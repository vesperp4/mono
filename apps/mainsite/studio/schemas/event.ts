import { defineField, defineType } from "sanity";

// A chapter event (workshop, talk, social, …) shown on vesperp4.com/events.
// Events with `coalesce(end, start) >= now()` are "upcoming"; everything else
// falls into the compact "past events" section.
export const event = defineType({
  name: "event",
  title: "Event",
  type: "document",
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "title" },
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
      description: "Optional — leave empty for events without a fixed end time",
      validation: (rule) => rule.min(rule.valueOfField("start")).error("End must be after start"),
    }),
    defineField({
      name: "location",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      type: "text",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "rsvpUrl",
      title: "RSVP URL",
      type: "url",
      description: "Optional link to a signup / RSVP form",
    }),
    defineField({
      name: "image",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Alternative text",
          type: "string",
          validation: (rule) => rule.required(),
        }),
      ],
    }),
  ],
  orderings: [
    {
      title: "Start (newest first)",
      name: "startDesc",
      by: [{ field: "start", direction: "desc" }],
    },
  ],
  preview: {
    select: { title: "title", start: "start" },
    prepare({ title, start }) {
      return {
        title,
        subtitle: start,
      };
    },
  },
});
