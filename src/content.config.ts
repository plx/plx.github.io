import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
// Astro 7 deprecated the `z` re-export from `astro:content`; import from astro/zod.
import { z } from "astro/zod";
import { stripIndexId } from "./lib/contentId";

// Blog posts and projects are folders shaped as `<slug>/index.md`; briefs are
// stored directly as `<category>/<name>.md`. The Content Layer glob loader
// derives an entry `id` from the file path, so strip a trailing `/index.md`
// (or `.md`) to keep folder-based entries on their bare slug — e.g.
// `my-post/index.md` -> `my-post` — preserving the URLs the legacy
// content-collections API produced.

// OpenGraph override fields shared by every collection.
const ogFields = {
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.url().optional(),
  ogImageAlt: z.string().optional(),
  noOgImage: z.boolean().optional(),
  modifiedDate: z.coerce.date().optional(),
};

// Default `cardTitle` to `title` so consumers can rely on it always being set.
const withCardTitle = <T extends { title: string; cardTitle?: string }>(data: T) => ({
  ...data,
  cardTitle: data.cardTitle ?? data.title,
});

const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog", generateId: stripIndexId }),
  schema: z
    .object({
      title: z.string(),
      cardTitle: z.string().optional(),
      description: z.string(),
      date: z.coerce.date(),
      draft: z.boolean().optional(),
      // Opt a longer-form essay into the Tufte layout: a wider column with
      // numbered footnotes floated into a right-margin gutter as sidenotes
      // (see src/lib/rehype-sidenotes.mjs + the `.post-blog` styles). Default
      // (omitted/false) keeps the 640px column with footnotes at the bottom.
      sidenotes: z.boolean().optional(),
      ...ogFields,
    })
    .transform(withCardTitle),
});

const briefs = defineCollection({
  // Keep the default ID generator: for flat `<category>/<name>.md` entries,
  // Astro uses the same per-segment slug helper as legacy collections.
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/briefs" }),
  schema: z
    .object({
      title: z.string(),
      cardTitle: z.string().optional(),
      description: z.string(),
      date: z.coerce.date(),
      draft: z.boolean().optional(),
      ...ogFields,
    })
    .transform(withCardTitle),
});

const projects = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/projects", generateId: stripIndexId }),
  schema: z
    .object({
      title: z.string(),
      cardTitle: z.string().optional(),
      description: z.string(),
      date: z.coerce.date(),
      draft: z.boolean().optional(),
      demoURL: z.url().optional(),
      repoURL: z.url().optional(),
      ...ogFields,
    })
    .transform(withCardTitle),
});

export const collections = { blog, briefs, projects };
