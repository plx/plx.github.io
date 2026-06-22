# Dispatches Design System — Repo Reference

The site's visual system is **Twilight** ("Twilight 3b Deeper"). The vibe:
quiet, plain, serif-on-paper — but the paper has cooled down. A single
indigo-night-sky family runs every surface and text color; deep **plum** is the
only chromatic accent. No illustrations, no gradients, no shadows.

This file is the working reference for anyone (human or agent) making visual
changes. For the full brand narrative — voice, tone, iconography, OG/favicon
specs — read [`design-system/README.md`](./design-system/README.md). For
prototypes, invoke the `/dispatches-design` skill.

---

## 1. How the system is wired in this repo

| Concern | Lives in |
| --- | --- |
| Design tokens (CSS vars) + `@font-face` | `src/styles/tokens.css` |
| Tailwind utilities backed by tokens | `tailwind.config.mjs` |
| Global element/prose/editorial/article styles | `src/styles/global.css` |
| Fonts (served) | `public/fonts/source-serif-4-latin*.woff2` (Inter via `@fontsource/inter`) |
| Brand assets (served) | `public/favicon.svg`, `public/favicon-*.png`, `public/apple-touch-icon.png`, `public/android-chrome-192x192.png`, `public/og-image.png`, `public/og-image-dark.png` |
| Off-page brand assets (not served) | `docs/design-system/assets/` (dark favicons, OG `.svg` sources, OG bare motifs, wordmark lockups) + `docs/design-system/fonts/` (Source Serif 4 TTF sources) |
| Token reference (not built) | `docs/design-system/colors_and_type.css` |

**Served assets are generated from the bundle — don't hand-edit the PNGs.** To
regenerate, work from the `.svg` sources in `docs/design-system/assets/`. The
woff2 fonts were latin-subset from the TTFs in `docs/design-system/fonts/` via
`pyftsubset` (keeping the `wght` + `opsz` axes).

---

## 2. Tokens

Defined in `src/styles/tokens.css` as CSS variables on `:root`, flipped under
`html.dark`. Body text is intentionally **low-contrast** (`--fg`); only
headings, `strong`, inline `code`, hovered links, and focus rings hit
`--fg-strong` / the accent.

| Semantic token | Light | Dark | Role |
| --- | --- | --- | --- |
| `--bg` | `#f6f6fa` (paper) | `#0f1126` (night) | page surface |
| `--bg-elevated` | `rgba(22 24 48 / .04)` | `rgba(228 230 248 / .05)` | header frost tint |
| `--bg-hover` | `rgba(22 24 48 / .09)` | `rgba(228 230 248 / .11)` | card/button hover |
| `--fg` | `rgba(22 24 48 / .62)` | `rgba(228 230 248 / .76)` | body text (soft) |
| `--fg-strong` | `#161830` (ink) | `#eff1fb` (moon) | headings, strong, code, focus |
| `--fg-muted` | `rgba(22 24 48 / .42)` | `rgba(228 230 248 / .48)` | meta, nav dividers, footer |
| `--border` | `rgba(22 24 48 / .13)` | `rgba(228 230 248 / .16)` | 1px outlines |
| `--border-hover` | `rgba(22 24 48 / .25)` | `rgba(228 230 248 / .40)` | |
| `--decoration` | `rgba(22 24 48 / .15)` | `rgba(228 230 248 / .22)` | prose link underline |
| `--decoration-hover` | `rgba(22 24 48 / .25)` | `rgba(228 230 248 / .45)` | |
| `--accent` / `--focus-ring` | `#762263` (plum-700) | `#d088b3` (plum-300) | the only chroma |
| `--accent-soft` | `rgba(118 34 99 / .09)` | `rgba(208 136 179 / .13)` | inline-code chip |

Raw anchors: `--ink #161830`, `--night #0f1126`, `--paper #f6f6fa`,
`--moon #eff1fb`, `--plum-700 #762263`, `--plum-300 #d088b3`. The accent is also
published as channel triplets (`--accent-rgb`) so `accent` opacity modifiers work.

**Type:** `--font-sans` Inter (UI/headings, 400/600); `--font-serif` Source
Serif 4 (prose `<p>`/`<li>`, variable 200–900 + italic); `--font-mono` system
mono (Expressive Code). Scale `--text-xs`…`--text-4xl` (12→36px), prose leading
`--leading-loose 1.75`. **Radii:** `sm .25rem` / `DEFAULT .375rem` / `lg .5rem` /
`full`. Layout: `--container 640px`, `--page-py 8rem`. Motion: `--dur-base 300ms`,
`--ease-in-out cubic-bezier(.65,0,.35,1)`.

---

## 3. Token → Tailwind-utility mapping

`tailwind.config.mjs` maps the semantic tokens to color utilities that **auto-flip
in dark mode**. Use the semantic utility; **do not add `dark:` color variants.**

| Utility | Token | Notes |
| --- | --- | --- |
| `bg-bg`, `bg-bg-elevated`, `bg-bg-hover` | `--bg` / `--bg-elevated` / `--bg-hover` | surfaces |
| `text-fg`, `text-fg-strong`, `text-muted` | `--fg` / `--fg-strong` / `--fg-muted` | text |
| `border-border`, `hover:border-border-hover` | `--border` / `--border-hover` | bare `border` is also brand-colored |
| `decoration-decoration`, `hover:decoration-decoration-hover` | `--decoration` / `--decoration-hover` | link underlines |
| `text-accent`, `decoration-accent`, `ring-accent`, `outline-accent`, `bg-accent/NN` | `--accent` (channel-triplet) | supports opacity modifiers |
| `bg-accent-soft` | `--accent-soft` | inline-code chip (baked alpha) |
| `font-serif` | Source Serif 4 | prose body |

> **Gotcha:** every token except `accent` bakes its own alpha, so opacity
> modifiers like `text-fg/50` **silently produce invalid CSS** — use the whole
> token. Only `accent` is channel-triplet form, so `bg-accent/10` etc. work.

**Link hover behavior** (two distinct kinds):
- *Prose* links (inside `<article>`): hover flips text **and** underline to the
  **accent** (`global.css` `@layer utilities`).
- *UI* links (`Link.astro`): hover flips text to `fg-strong`, underline to accent.

---

## 4. Dos & Don'ts

**Do:** serif prose body + sans headings/UI; low-contrast body with strong
headings; flat-with-border cards; 300ms hover/focus cross-fades; static chevrons;
plum focus ring; honor `prefers-reduced-motion` (handled in `tokens.css`).

**Don't:**
- ❌ Gradients (the flat indigo+plum pairing is the system; never blend them).
- ❌ A second accent — plum is the only chroma. No green/red/blue.
- ❌ Shadows / elevation (the frosted header backdrop is the only layering signal).
- ❌ Emoji as iconography (and none in body copy).
- ❌ Multi-column or content wider than **880px** (640 default/briefs; 540+280
  gutter for Tufte blog posts).
- ❌ Rounded cards with a colored left-border accent stripe; decorative SVGs,
  mascots, "AI sparkle" gradients.
- ❌ Raw hex / px / non-DS fonts in styles — use tokens. (The bundle ships
  `design-system/_adherence.oxlintrc.json` as the canonical rule statement; it is
  reference-only, not wired into this repo's ESLint.)

---

## 5. Dark mode

Class-based (`darkMode: ["class"]`): the `<html>` element gets `.dark`, which
flips every `--token`, so token-backed utilities re-theme automatically. The
toggle (light / dark / system, persisted to `localStorage`, transitions disabled
for one frame on flip) lives in the inline script in `src/components/Head.astro`;
the footer buttons drive it (`data-theme-button`, `aria-pressed`).

---

## 6. Listings — the editorial feed

Home, blog index, and briefs index use **`ExcerptEntry.astro`** (the editorial
feed): a `DATE · KIND · category` meta line, a large Source-Serif title, a 3-line
excerpt, and a "Continue reading →" tail. Styles are the `.ex-*` / `.feed-*` /
`.intro-lede` blocks in `global.css`. The whole entry is one link with an explicit
`aria-label`. The **Projects** list and brief-category pages keep
`ContentCard.astro` (bordered card — reads well for repo-link rows). The excerpt
is currently the entry's `description`; body-derived excerpts are a future option
(see §8). Helpers: `getBlogEntryProps` / `getBriefEntryProps` in
`src/lib/contentCardHelpers.ts`.

---

## 7. Tufte sidenotes (opt-in per article)

Blog posts can opt into a Tufte layout — a wider column (540 body + 280 gutter)
with numbered footnotes floated into the right margin as sidenotes (collapsing
inline below ~880px). **Existing posts keep the default** 640px column with
footnotes collected at the bottom (brand-styled).

**To opt a post in:** set `sidenotes: true` in its frontmatter (blog collection
only — see `src/content/config.ts`). The author still writes standard markdown
footnotes (`[^1]`); the `src/lib/rehype-sidenotes.mjs` plugin relocates each
footnote inline next to its reference (as `<sup class="fnref">` + `.sidenote`) and
removes the bottom section. The `.post-blog` / `.sidenote` / `.marginalia` styles
live in `global.css`. `.marginalia` (unanchored italic margin notes) is wired in
CSS but not yet emitted — a hook for future use.

---

## 8. Deferred / future patterns

- **Steel alternate palette** — a per-article aubergine-on-steel theme planned for
  a forthcoming AI-and-artificial-light essay (whose color figures would fight the
  plum). Not wired in. Activation: a `theme: "steel"` frontmatter field swapping a
  class on the article root + a Steel token block. See `design-system/README.md`
  §"Alternate theme".
- **Body-derived excerpts** — replace the `description` excerpt in `ExcerptEntry`
  with the first rendered paragraph (via a remark step or `render()`); the helper
  boundary in `contentCardHelpers.ts` is where this would change.
- **Per-post OG generator** — the static brand OG art is served sitewide; a
  dynamic per-post card generator (on-brand stipple, not the old Tailgraph
  gradient) could return later. Source art: `design-system/assets/og-image*.svg`.
- **`.marginalia`** — unanchored margin notes for Tufte posts (CSS ready).

---

## 9. Resolved bundle contradiction (motion)

The handoff's `README.md` §Motion is **authoritative**: the page-load fade-up
(700ms) and 150ms stagger are **removed** — content paints immediately; only
300ms hover/focus cross-fades remain and chevrons are static. The bundle's
`_ds_manifest.json` "motion" card and the original `SKILL.md` still describe the
old "700ms fade-up · 150ms stagger" — that text is **stale**. This repo follows
the README: no entrance animation. (`global.css` keeps an inert `.animate` no-op
and the legacy `Head.astro` `animate()` script so re-enabling is a one-line CSS
change; existing `class="animate"` call sites were removed during migration.)
