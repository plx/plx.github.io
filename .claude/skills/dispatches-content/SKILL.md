---
name: dispatches-content
description: Author or revise Dispatches blog posts, briefs, and project entries, including frontmatter, category metadata, and publication checks.
---

# Dispatches content

Paths below are relative to the repository root.

Use [src/content/AGENTS.md](../../../src/content/AGENTS.md) for collection layouts and `src/content.config.ts` for the actual schema. Read a neighboring entry for the relevant collection's presentation.

Publication details that are easy to miss:

- Dates are calendar dates in `YYYY-MM-DD` form, normalized to UTC by `src/lib/contentDate.ts`. `modifiedDate` is available separately.
- `draft: true` excludes an entry from generated routes and listings, including in development. Inspect a temporary published local copy when previewing a draft, and restore its intended state afterwards.
- `description` supplies listing excerpts; they are not derived from the body. `cardTitle` overrides listing titles and otherwise defaults to `title`. Titles support limited inline Markdown through `src/lib/markdown.ts`; inspect rendering when using it.
- Brief categories come from directory names. Optional `category.yaml` controls display names, title prefixes, descriptions, and ordering, not route slugs; the accepted fields are in `src/lib/category.ts`.
- Blog-only `sidenotes: true` opts standard Markdown footnotes into the margin layout. Without it, footnotes remain collected at the bottom. See [the design reference](../../../docs/DESIGN_SYSTEM.md) for layout limits.
- RSS currently contains published blog and project entries, not briefs (`src/pages/rss.xml.ts`). Social metadata overrides are shared across collections; check `src/lib/opengraph.ts` when using them.

For prose changes, use `just lint-markdown`, `just spellcheck`, and `just lint-prose`. [.vale/README.md](../../../.vale/README.md) explains terminology rules and local exceptions; alt text is checked too. For changes to publication metadata, routes, or links, build and run the relevant feed/link validators from `package.json`, then inspect the affected listing and article.
