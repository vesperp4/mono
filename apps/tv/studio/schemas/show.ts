import { defineField, defineType } from "sanity";

// A recurring program (e.g. "Intro to Systems", "Project Night"). Groups
// episodes/recordings for the discover-style pages later.
export const show = defineType({
  name: "show",
  title: "Show",
  type: "document",
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "description", type: "text" }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "title" },
      validation: (rule) => rule.required(),
    }),
  ],
});
