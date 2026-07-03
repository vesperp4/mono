import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";

import { schemaTypes } from "./schemas";

// Sanity project for the MAINSITE CMS (events + blog). The project has NOT
// been created yet — create it at sanity.io/manage (org Vesper P4), then
// replace the empty fallback below with the real projectId. The id is not a
// secret (public dataset, read-only GROQ). This is a SEPARATE Sanity project
// from the TV one (uphuxt07) — the TV site is its own product.
export default defineConfig({
  name: "vesperp4-mainsite",
  title: "Vesper P4",
  projectId: process.env.SANITY_STUDIO_PROJECT_ID ?? "",
  dataset: process.env.SANITY_STUDIO_DATASET ?? "production",
  plugins: [structureTool()],
  schema: {
    types: schemaTypes,
  },
});
