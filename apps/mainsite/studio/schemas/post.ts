import { defineArrayMember, defineField, defineType } from "sanity";

// A blog post on the mainsite (vesperp4.com/blog). Published posts only reach
// the site once `publishedAt` is in the past — the web queries filter on
// `publishedAt <= now()`, so future-dating a post schedules it.
export const post = defineType({
  name: "post",
  title: "Blog Post",
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
      name: "publishedAt",
      type: "datetime",
      validation: (rule) => rule.required(),
    }),
    defineField({
      // Plain author name for now — this becomes a reference to a teamMember
      // document when the team roster lands in a later phase.
      name: "author",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "excerpt",
      type: "text",
      rows: 2,
      description: "Short summary shown on the blog index and in link previews",
      validation: (rule) => rule.required().max(300),
    }),
    defineField({
      name: "coverImage",
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
      name: "body",
      type: "array",
      of: [
        defineArrayMember({ type: "block" }),
        defineArrayMember({
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
    }),
  ],
  orderings: [
    {
      title: "Published (newest first)",
      name: "publishedAtDesc",
      by: [{ field: "publishedAt", direction: "desc" }],
    },
  ],
  preview: {
    select: { title: "title", publishedAt: "publishedAt", author: "author" },
    prepare({ title, publishedAt, author }) {
      const date = publishedAt ? new Date(publishedAt).toISOString().slice(0, 10) : "unpublished";
      return {
        title,
        subtitle: `${date} — ${author ?? "unknown author"}`,
      };
    },
  },
});
