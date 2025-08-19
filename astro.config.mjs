import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";

import react from "@astrojs/react";

import expressiveCode from "astro-expressive-code";

export default defineConfig({
  site: "https://plx.github.io",
  integrations: [
    sitemap(), 
    tailwind(), 
    react(), 
    expressiveCode({
      themes: ["github-dark", "github-light"]
    }), 
    mdx()
  ],
});
