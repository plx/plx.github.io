import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

import react from "@astrojs/react";

import expressiveCode from "astro-expressive-code";

import rehypeSidenotes from "./src/lib/rehype-sidenotes.mjs";

// Tailwind CSS is wired through PostCSS (postcss.config.mjs) rather than the
// former @astrojs/tailwind integration, which does not support Astro 7.
export default defineConfig({
  site: "https://plx.github.io",
  markdown: {
    // Tufte sidenotes for blog posts that opt in via `sidenotes: true`.
    // No-ops on every other page (see src/lib/rehype-sidenotes.mjs).
    rehypePlugins: [rehypeSidenotes],
  },
  integrations: [
    sitemap(),
    react(),
    expressiveCode({
      themes: ["github-dark", "github-light"]
    }),
    mdx()
  ],
});
