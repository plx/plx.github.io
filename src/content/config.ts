import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    draft: z.boolean().optional()
  }),
});

const briefs = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    cardTitle: z.string().optional(),
    description: z.string(),
    category: z.string(),
    date: z.coerce.date(),
    draft: z.boolean().optional()
  }).transform((data) => ({
    ...data,
    cardTitle: data.cardTitle ?? data.title
  }))
});

const projects = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    draft: z.boolean().optional(),
    demoURL: z.string().optional(),
    repoURL: z.string().optional()
  }),
});

export const collections = { blog, briefs, projects };
