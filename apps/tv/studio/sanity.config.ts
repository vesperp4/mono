import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";

import { schemaTypes } from "./schemas";

// TODO(dev-team): create the Sanity project (sanity.io/manage) and fill in the
// real projectId. This is a SEPARATE Sanity project from the Phase 2
// mainsite CMS — the TV site is its own product.
export default defineConfig({
  name: "vesperp4-tv",
  title: "Vesper P4 TV",
  projectId: process.env.SANITY_STUDIO_PROJECT_ID ?? "todo-project-id",
  dataset: process.env.SANITY_STUDIO_DATASET ?? "production",
  plugins: [structureTool()],
  schema: {
    types: schemaTypes,
  },
});
