---
name: dispatches-design
description: Apply Dispatches' Twilight design system when changing the site's appearance or creating branded prototypes and assets.
---

# Dispatches design

Paths below are relative to the repository root.

Read [docs/DESIGN_SYSTEM.md](../../../docs/DESIGN_SYSTEM.md) for the working design contract. Read [the brand narrative](../../../docs/design-system/README.md) when the task involves voice, iconography, or brand assets.

Twilight uses indigo surfaces, plum as the sole accent, Inter UI/headings, and Source Serif 4 prose. Keep its quiet, flat presentation and softer body/strong-heading hierarchy. Motion is 300ms interaction feedback; the old handoff's entrance animations are obsolete.

For production changes:

- Edit live tokens in `src/styles/tokens.css`, utilities in `tailwind.config.mjs`, and shared prose/feed styles in `src/styles/global.css`. `docs/design-system/colors_and_type.css` is a reference copy.
- Semantic color utilities already follow `html.dark`. Only `accent` supports opacity modifiers: `text-fg/50`, for example, produces invalid CSS.
- Follow `ExcerptEntry.astro` for editorial listings and `ContentCard.astro` for projects/category pages. Shared title/category mapping lives in `src/lib/contentCardHelpers.ts`.
- Derive served brand assets from the SVG sources in `docs/design-system/assets/`; those PNGs are generated output.

For prototypes, reuse the reference CSS and brand assets as needed; use the requested artifact format. `docs/design-system/preview/` contains specimens, with the working contract taking precedence over historical examples.

Inspect affected layouts in both themes. For browser or accessibility verification, use the repository's `dispatches-qa` skill.
