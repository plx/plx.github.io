---
name: dispatches-design
description: Use this skill to generate well-branded interfaces and assets for Dispatches, Paul Berman's personal technical blog (plx.github.io) — either production code in this Astro repo or throwaway prototypes/mocks. Contains the brand's colors, type, fonts, assets, and component patterns (the "Twilight" design system).
user-invocable: true
---

# Dispatches Design Skill

The site runs on the **Twilight** design system (a.k.a. "Twilight 3b Deeper"):
a single indigo-night-sky family for surfaces and text, with deep plum as the
**only** chromatic accent. Quiet, plain, serif-on-paper.

## Start here

- **`docs/DESIGN_SYSTEM.md`** — the repo-specific quick reference: the token
  table, the token → Tailwind-utility mapping, dos & don'ts, where everything
  lives, how dark mode works, and the opt-in/deferred patterns. **Read it first
  for any visual change.**
- **`docs/design-system/README.md`** — the full brand narrative (voice, tone,
  iconography, OG/favicon/wordmark specs, "what to avoid").
- **`docs/design-system/colors_and_type.css`** — the canonical token *reference*
  (CSS variables). The **live** wiring is `src/styles/tokens.css` (tokens +
  `@font-face`) and `tailwind.config.mjs` (utilities). Edit those, not the
  reference copy.

## If you're working on production code (this repo)

The live patterns to mirror:

- **Tokens** are CSS variables in `src/styles/tokens.css`, exposed as Tailwind
  utilities (`bg-bg`, `text-fg`, `text-fg-strong`, `text-muted`, `border-border`,
  `bg-bg-hover`, `text-accent`, `decoration-accent`, `bg-accent-soft`,
  `ring-accent`/`outline-accent`). They **auto-flip in dark mode** — do not add
  `dark:` color variants; use the semantic token.
- **Type:** Inter (UI/headings, via `@fontsource/inter`) + Source Serif 4 (prose
  body, local woff2 in `public/fonts/`, `font-serif`). Monospace = Expressive
  Code default. Do **not** reintroduce Lora or add a third family.
- **Components:** `src/components/ExcerptEntry.astro` (the editorial listing),
  `ContentCard.astro` (projects), `Link.astro`, `Header/Footer.astro`. Global
  prose + editorial-feed + article-kind styles live in `src/styles/global.css`.
- **Don't change the type or color direction without checking** — the
  low-contrast body / strong-heading hierarchy is load-bearing for the brand.

## If you're making a throwaway visual artifact (slides, mocks, one-pagers)

1. Copy `docs/design-system/colors_and_type.css` and any needed
   `docs/design-system/assets/` into a single self-contained HTML file.
2. Stay on-brand: Inter + Source Serif 4, the Twilight palette (paper / night /
   ink / moon + plum accent), **no shadows, no gradients, no second accent,
   no emoji**, 300ms hover/focus transitions and **no entrance animation**.
   See the "What to avoid" list in `docs/design-system/README.md`.

## Hard rules (see docs/DESIGN_SYSTEM.md for the full list)

- Plum is the only chroma. No green/red/second accent.
- No gradients, no shadows, no decorative SVG/mascots/sparkles.
- No emoji as iconography (and none in body copy).
- Layout caps: 640px (briefs/default), 540+280 gutter (Tufte blog), never >880px.
- **Motion is interaction feedback only** — 300ms hover/focus cross-fades; there
  is **no** page-load fade-up. (The bundled `_ds_manifest.json`/`README` SKILL
  text mentioning a "700ms fade-up" is stale; the README §Motion is authoritative.)

## If invoked with no other guidance

Ask what to build, ask a few clarifying questions (audience, format, length,
options vs. a single direction), then act as an expert designer producing either
an HTML artifact or production code as appropriate.
