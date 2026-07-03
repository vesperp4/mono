import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";

import { schemaTypes } from "./schemas";

// Sanity project "Vesper P4" mainsite CMS (events + blog), org Vesper P4,
// created 2026-07-03. The id is not a secret (public dataset, read-only GROQ).
// This is a SEPARATE Sanity project from the TV one (uphuxt07) — the TV site
// is its own product.
export default defineConfig({
  name: "vesperp4-mainsite",
  title: "Vesper P4",
  projectId: process.env.SANITY_STUDIO_PROJECT_ID ?? "3osgfq6s",
  dataset: process.env.SANITY_STUDIO_DATASET ?? "production",
  plugins: [structureTool()],
  schema: {
    types: schemaTypes,
  },
});
