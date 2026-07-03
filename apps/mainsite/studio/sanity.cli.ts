import { defineCliConfig } from "sanity/cli";

// CLI-side config — `sanity deploy`/`sanity dataset` etc. read this file, not
// sanity.config.ts. studioHost pins the hosted Studio hostname so deploys are
// non-interactive and repeatable.
export default defineCliConfig({
  api: {
    projectId: "3osgfq6s",
    dataset: "production",
  },
  studioHost: "vesperp4",
});
