---
name: dispatches-design
description: Use this skill to generate well-branded interfaces and assets for Dispatches, Paul Berman's personal technical blog (plx.github.io), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

# Dispatches Design Skill

Read `README.md` in this directory first — it covers brand context,
visual foundations, content fundamentals, iconography, and an index of
the other files available.

Then explore as needed:

- `colors_and_type.css` — CSS variables for color, type, motion, shape.
  Include it and add `class="ds"` to a container for the semantic defaults.
- `assets/` — logos, favicons, OG image source.
- `ui_kits/blog/` — high-fidelity recreation of the live site, with
  componentized JSX you can crib from (`Header`, `Footer`, `ContentCard`,
  `ArticleBody`, …).
- `preview/` — single-purpose specimen cards used to populate this
  project's Design System tab (also useful as visual references).

## If you're making a visual artifact

(slides, mocks, throwaway prototypes, marketing one-pagers, etc.)

1. Copy `colors_and_type.css` and any assets you need into the artifact.
2. Build a single self-contained HTML file the user can open.
3. Stay on-brand: Inter + Source Serif 4, **Twilight palette (paper / night / ink / moon + plum accent)**, no shadows, no emoji, no second accent color,
   restrained 700ms fade-up + 300ms hover transitions. See the "What to
   avoid" list in README.

## If you're working on production code

Read the rules in `README.md` and use the `ui_kits/blog/` JSX as a guide
to the patterns the live Astro site uses. Don't change the type or color
direction without checking — the low-contrast body / strong-heading
hierarchy is load-bearing for the brand.

## If invoked with no other guidance

Ask the user what they want to build or design, ask a few clarifying
questions (audience, format, length, whether they want options or a
single direction), and act as an expert designer who outputs HTML
artifacts *or* production code, depending on the need.
