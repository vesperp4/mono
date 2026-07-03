import { defineField, defineType } from "sanity";

// A chapter member shown on the vesperp4.com/team roster. Ordering is manual
// via the `order` field (lower = earlier in the grid) so editors control the
// roster sequence without renaming documents.
export const teamMember = defineType({
  name: "teamMember",
  title: "Team Member",
  type: "document",
  fields: [
    defineField({
      name: "name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "role",
      type: "string",
      description: "Shown under the name, e.g. “Member”, “Webmaster”, “Events Lead”",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "photo",
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
    defineField({
      name: "order",
      type: "number",
      description: "Sort key — lower numbers appear first on the roster",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "linkedinUrl",
      title: "LinkedIn URL",
      type: "url",
    }),
    defineField({
      name: "githubUrl",
      title: "GitHub URL",
      type: "url",
    }),
  ],
  orderings: [
    {
      title: "Roster order",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
  preview: {
    select: { title: "name", subtitle: "role", media: "photo" },
  },
});
