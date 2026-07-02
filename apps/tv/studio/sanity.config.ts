import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";

import { schemaTypes } from "./schemas";

// Sanity project "Vesper P4 TV" (org Vesper P4, created 2026-07-02). The id is
// not a secret (public dataset, read-only GROQ). This is a SEPARATE Sanity
// project from the Phase 2 mainsite CMS — the TV site is its own product.
export default defineConfig({
  name: "vesperp4-tv",
  title: "VesperP4 TV",
  projectId: process.env.SANITY_STUDIO_PROJECT_ID ?? "uphuxt07",
  dataset: process.env.SANITY_STUDIO_DATASET ?? "production",
  plugins: [structureTool()],
  schema: {
    types: schemaTypes,
  },
});
