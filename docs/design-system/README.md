# Dispatches — Design System

The brand+visual system for **Dispatches**, the personal technical blog at
[plx.github.io](https://plx.github.io) by Paul Berman.

The live site is an Astro Nano template, customized — what's captured here
is the *current* visual direction (carefully read out of the codebase) plus
the room to refine and explore alternatives the author wants.

---

## 1. Brand Context

| | |
| --- | --- |
| **Site name** | Dispatches |
| **Author** | Paul Berman |
| **Tagline** | *Technical writing on topics of personal interest.* |
| **URL** | https://plx.github.io |
| **Stack** | Astro 5 + MDX + Tailwind + React (theme: [Astro Nano](https://github.com/markhorn-dev/astro-nano)) |
| **Audience** | Working software engineers — heavy Swift, iOS, and recently-coding-agent communities |
| **Type** | Static personal blog (GitHub Pages) |

### What it is

A long-running, low-frequency technical journal. The site distinguishes
**three** kinds of content:

| Section | What it's for | Length | Examples |
| --- | --- | --- | --- |
| **Blog** | Longer-form essays | 1.5k–10k+ words | "Generic Testing", "Meso-Optimization" |
| **Briefs** | Short notes filed under categories (Swift Warts, Claude Code, Objective-C, Testing) | 100–800 words | "Lazy Sequences Decay Easily", "Claude Code's Subscription Pricing vs GPT-5" |
| **Projects** | Long-lived write-ups of personal OSS tools | 500–4k words | `trop`, `hdxl-xctest-retrofit`, `agentic-navigation-guide` |

There's also an **About** page in the nav.

### Sources used

- **Repo:** [`plx/plx.github.io`](https://github.com/plx/plx.github.io) — `main` branch.
  Files read while building this system are listed in `SOURCES.md`.
- **Live site:** https://plx.github.io
- **Template lineage:** [Astro Nano](https://github.com/markhorn-dev/astro-nano)
  (Tailwind, MIT). Several files (`BlockQuote`, `CallToAction`, `ExternalLink`)
  are still leftover boilerplate from an earlier template (`accessible-astro-starter`)
  and are *not* active on the live site — they're noted but not modeled.

---

## 2. Index — what's in this folder

```
.
├── README.md                  ← you are here
├── SKILL.md                   ← Agent Skill entry point (Claude Code-compatible)
├── SOURCES.md                 ← exact files read from the upstream repo
├── colors_and_type.css        ← CSS variables: colors, type, motion, shape
│
├── assets/                    ← logos, favicons, OG image
│   ├── logo.jpeg              ← the brand "logo" (a photograph of icy water)
│   ├── logo-144.jpeg          ← square crop @ 144px, used in OG image
│   ├── favicon-32.png
│   ├── favicon-48.png
│   ├── apple-touch-icon.png
│   └── android-chrome-192.png
│
├── preview/                   ← cards that populate the Design System tab
│   └── *.html
│
└── ui_kits/
    └── blog/                  ← clickable recreation of the live site
        ├── README.md
        ├── index.html         ← runnable, scrollable, theme-toggleable
        └── *.jsx              ← Header, Footer, ContentCard, ArticleBody, …
```

---

## 3. Visual Foundations

> **The vibe.** Quiet, plain, serif-on-paper — but the paper has cooled
> down. The system runs on a single indigo-night-sky family with deep
> plum as the only chromatic accent. No illustrations, no gradients, no
> wordmark on the live page itself (one was extracted as a standalone
> asset in `assets/wordmark*.svg` for off-site reuse); the only
> decoration on the page is the page-load fade-up and the
> arrow that draws itself on card hover.

### Palette — Twilight 3b “Deeper”

Four anchor colors plus a two-step plum accent. Everything else is one
of the anchors at an alpha.

| Token | Hex | Role |
| --- | --- | --- |
| `--paper` | `#f6f6fa` | Light-mode background — cool desaturated near-white |
| `--night` | `#0f1126` | Dark-mode background — indigo, a step toward midnight |
| `--ink`   | `#161830` | Light-mode strong text (and the source color for body text at 62% alpha) |
| `--moon`  | `#eff1fb` | Dark-mode strong text (and the source color for body text at 76% alpha) |
| `--plum-700` | `#762263` | Accent — light mode. Focus ring, hovered prose link, code-chip tint, current-page underline. |
| `--plum-300` | `#d088b3` | Accent — dark mode. Same roles, lifted for contrast on `--night`. |

**Why low-contrast body text?** Same as before: it pushes hierarchy.
Headings, hovered links, and `<code>` are the only things that hit full
`--ink` / `--moon`, so the eye walks the page along those rails. The
narrow column (640 / 540 in the Tufte layout) and generous leading
(1.7–1.75 on prose) make this comfortable for long reads.

**Where the accent shows up.**
- Focus ring (replaces the previous blue-600 / blue-400)
- Hovered prose link — text and underline color both flip to accent
- `<code>` chip backdrop — `accent-soft` (the accent at ≈9% / 13% alpha)
- Current-page underline in the header nav
- Marker color in numbered footnotes / sidenotes (subtle, on hover)

**Where the accent does *not* show up.** Filled buttons, banners,
gradients, illustrations. The system has none of those.

### Alternate theme (planned, for one specific essay)

A forthcoming essay draws an analogy between AI and artificial light
and will lean heavily on color-theory illustrations (spectrograms,
high-vs-low CRI samples, single-wavelength examples). The plum-on-indigo
Twilight palette would fight with those figures. The **Steel** palette
from `explorations/05-colors.html` is held as the per-article alternate:

| Token | Steel light | Steel dark |
| --- | --- | --- |
| `--bg` | `#f1f2f4` | `#1c2026` |
| `--fg-strong` | `#1c2026` | `#eef0f3` |
| `--accent` | `#5a1e4a` (aubergine) | `#b78097` |

Not wired into the live site yet. When the essay is closer, we'll add a
`theme: "steel"` frontmatter field that swaps a class on the article
root, leaving the rest of the site on Twilight.

### Typography

| Use | Family | Weight |
| --- | --- | --- |
| Headings, nav, UI | **Inter** | 600 (semibold) |
| Prose body (`<p>`, `<li>` inside `<article>`) | **Source Serif 4** | 400 / 400 italic *(variable; whole range available)* |
| Code (inline + blocks) | Monospace (Expressive Code default) | 400/500 |

Inter loads at 400 + 600. Source Serif 4 ships locally as two variable
font files (regular + italic) and is loaded via `@font-face` from
`fonts/`. **No third family** is used. JetBrains Mono is included here
as a reasonable code stand-in for static mocks.

> **Heads up: this is a change from the live site.** The Astro template
> ships Lora as the prose serif; the uploaded font files replace it with
> Source Serif 4. The two have meaningfully different feels — Source
> Serif 4 is taller, more spacious, and slightly more "editorial /
> scholarly"; Lora is rounder and a bit more contemporary. If you want
> the live site to follow this design system, you'll need to update the
> Astro project to load Source Serif 4 instead of `@fontsource/lora`.

The serif-for-prose / sans-for-everything-else split is the strongest
typographic move on the site. It's worth preserving in any new direction —
it makes long-form posts feel like a quiet book, not a SaaS landing page.

### Spacing & shape

- Container: **640px** (`max-w-screen-sm`). Single column, centered.
- Header: fixed top, `py-5`, frosted glass via `backdrop-blur-sm` over an
  opaque-ish veil (`--bg-frost`: paper at 75% light / night at 68% dark). No
  `saturate()` — an earlier `saturate-200` amplified saturated content scrolling
  behind the bar (e.g. a list title mid-hover flipping to plum) into a flash.
- Main content: `py-32` — *very* generous top/bottom padding.
- Cards: `rounded-lg` (8px), thin border, no shadow.
- Buttons: `rounded` (6px) or `rounded-full` for icon buttons.
- **No shadow system** on the live site. None. Elevation is communicated
  with the frosted header backdrop only.

### Background, imagery & illustration

The site has **no decorative illustrations, no full-bleed photography, no
gradients, no repeating patterns, no textures.** The body is a flat single
cool-paper or indigo-night-sky surface — *except* for one piece of brand
imagery, the OG image.

**`assets/og-image.{svg,png}`** — the brand image and Open Graph card.
A monochrome ink drawing of a starry sky in the engraving tradition:
dense plum-ink stippling (Bold tier, ~21k dots on a 280×155 grid) on
the cool `--paper` surface, with stars left as **reserves** where the
paper shows through. Density falls off linearly from ~100% at the top
edge to ~0% at the horizon (78% of the way down), so the bottom of the
frame matches the rest of the brand's flat-paper feel. Wordmark sits
on the lower-left in Inter Semibold with the tagline in Source Serif 4
italic — typography is *inside* the SVG, so it travels with any export.

A bare variant without the wordmark (`assets/og-image-bare.svg/.png`)
is available for use as a recurring background motif on essay landings.

A dark-mode OG variant lives at **`assets/og-image-dark.svg/.png`**
(and `-dark-bare.svg/.png`) — same plum-300 ink stippling on the
indigo `--night` surface, identical geometry. It ships as a brand
asset but isn't wired into the page metadata: `og:image:dark` is not
part of the Open Graph protocol and no major platform honors it, so
social cards use the single light `og-image.png` until a supported
mechanism exists.

### Favicon

Same engraving family, tuned for tiny rendering. `assets/favicon.svg`
is the canonical adaptive favicon — it embeds a `prefers-color-scheme`
media query inside the SVG, so a single file flips between modes.

Specific PNG sizes are also shipped because (a) some browsers ignore
SVG color-scheme switching and (b) at small sizes a downsampled SVG
goes muddy. Each PNG is rendered **natively** at its target size with
disproportionately larger dots and added jaggedness — at 16px the dot
radius is **7×** the canonical 144 size, the grid is **1.5× denser**,
and the density floor is raised by **+0.45** so the image stays
saturated. Roughly **10% of dots in the top band flip to moon color**
(`#f0eafa` on dark, `#3a0e30` on light) as "bright stars" — these
break up the monotone field and survive aggressive downscaling.

Files in `assets/`:
- `favicon.svg` — adaptive primary
- `favicon-light-{16,32,48,180,192}.png` and `favicon-dark-*` — raster fallbacks
- `apple-touch-icon.png` — light variant at 180px (iOS rarely honors dark)
- `android-chrome-192.png` — light variant at 192px

The previous icy-water photo was retained for one revision; it has now
been removed.

### Motion

Interaction feedback only. No entrance animation, no decorative motion.

- **Hover transitions.** Color, background, border, and text-decoration
  changes are **300ms ease-in-out** (`--dur-base` / `--ease-in-out`).
  Everything is on a transition; nothing snaps.
- **No page-load fade-up.** Content paints immediately. The legacy
  `.animate` / `.show` pattern, its 700ms timing, and the 150ms index
  stagger have all been removed. `<Animate>` in the UI kit is now a
  no-op passthrough kept only so old call sites compile.
- **No arrow-draw choreography.** The `ContentCard` right-chevron and
  `BackToPrev` left-chevron are now static glyphs — visible at rest,
  no transform on hover. The arrow still indicates affordance; it just
  doesn't perform.
- **No bounces, no springs, no rotation, no scale-on-press.**
- **Reduced motion respected.** A `@media (prefers-reduced-motion: reduce)`
  block collapses every transition/animation to ~one frame, so users who
  ask their OS to reduce motion get instant state changes, not missing
  feedback. Lives in `colors_and_type.css` (and mirrored in the blog kit's
  `styles.css`).
- **Theme toggle disables all transitions** for one frame (a `<style>`
  with `transition: none !important` is injected, then removed) so the
  light↔dark flip is instant.

### States

- **Hover (cards, buttons):** background fills to `black/10` or
  `white/10`; text/border step from soft to strong. Cross-fade only,
  no arrow choreography.
- **Hover (prose link):** text color goes from `fg` (soft black/white) to
  `fg-strong` (pure black/white); underline `decoration` color from
  `black/15` to `black/25` (or `white/30 → white/50`).
- **Focus:** 2px solid `blue-600` (light) / `blue-400` (dark) outline,
  offset 2px. Always visible — never hidden, never restyled to a glow.
- **Pressed:** no dedicated press state. Active uses the focus ring.
- **Disabled:** not used on the site (it's a blog, there are no forms).

### Borders, radii, elevation

- **Borders:** always low-alpha (`black/15` light, `white/20` dark),
  always 1px, no thick outlines.
- **Radii:** only three — `sm` (4px), default (6px), `lg` (8px),
  plus `full` for circular icon buttons.
- **Shadows:** none.
- **Backdrop blur:** only on the fixed header, `backdrop-blur-sm` over the
  `--bg-frost` veil (no `saturate()`). Used as the *only* layering signal.

### Layout rules

- **Single column, 640px wide.** Always.
- **Fixed header** (top, full-width, frosted).
- **Footer** is in flow, not sticky; theme-switcher lives there.
- **No sidebars, no sticky TOC, no breadcrumbs.** A `<BackToPrev>` button
  at the top of an article is the only nav-within-article element.
- **No grids.** Posts in a list are a vertical stack of `ContentCard`s.

### What to *avoid* (so new work stays on-brand)

- ❌ Bluish-purple gradients (yes, *gradients* — the *flat* indigo+plum pairing is the system, but never blend them).
- ❌ Multi-accent palettes. Plum is the only chroma. Don't introduce a green, a red, or a second accent.
- ❌ Emoji as iconography (the brand uses zero emoji in body text).
- ❌ Shadows. Cards are flat-with-border.
- ❌ Multi-column layouts wider than 880px (640 for briefs; 540 + 280 gutter for blog posts).
- ❌ Rounded-corner cards with a colored left-border accent stripe.
- ❌ Animated mascots, decorative SVGs, "AI sparkle" gradients.

---

## 4. Content Fundamentals

### Voice

**First person, conversational, technically self-aware.** The author writes
like an experienced engineer thinking out loud — opinions are stated
directly, then immediately qualified or footnoted.

> "I'm calling this **meso-optimization**, and yes, I made that term up.
> Will it catch on? To be frank, I hope not—I'd find it mortifying if I
> went to a conference and heard someone using it in earnest. But, well,
> I need a shorthand term…"
> — *Meso-Optimization*

### Tone

- **Direct.** No throat-clearing intros, no "in today's fast-paced world".
- **Wry, dry humor.** Self-deprecation, occasional asides in parentheses.
- **Honest about uncertainty.** Hedges with "I think", "I worry that",
  "I'm extremely skeptical that".
- **Never hype.** No exclamation points except in the rare *aside*.
  No "amazing", "powerful", "revolutionary".

### Casing

- **Site name:** `Dispatches` — title case.
- **Page titles & post titles:** Title Case. *Most* significant words
  capitalized: *"Lazy Sequences Decay Easily"*, *"The Three-File Pattern"*.
- **Nav items:** all-lowercase. `blog / briefs / projects / about`.
- **Inline code in titles is allowed:** *"You can write `Sequence<Element>`
  but not `LazySequenceProtocol<Element>`"*.
- **Section headings inside posts:** Title Case for `##`, sentence-or-title
  for `###`. Sometimes both within one post — author isn't strict.

### Pronouns

- **"I" everywhere** for the author's own opinions and decisions.
- **"You" for the reader**, especially when describing a pattern's
  user-facing effect ("Your beautiful lazy sequence chains suddenly
  become eager").
- **"We"** is rare — used only when the author genuinely means "the
  community".

### Punctuation tells

- **Em-dashes — used as asides — without spaces in published text but
  always rendered as the typographic dash.**
  Used heavily as a parenthetical aside marker (cf. en-dash for ranges,
  hyphen for compounds).
- **Footnotes are heavy.** `[^1]`, `[^2]` — used to park asides that
  would derail the paragraph. Often the *funny* line is in the footnote.
- **Italic asides for emphasis or for "this is the right word":**
  *"the implementation is making clever use of an unusually-tricky
  aspect"*.
- **Hyphenated compound modifiers** are everywhere:
  *"early-adopter uptake"*, *"close-to-the-metal stuff"*,
  *"low-stimulation letters"*. Very Latinate / very legal-brief.
- **Inline code** for any code identifier, even outside a code block.

### Phrasing patterns

- "**The tl;dr here is:**" — sets up a one-sentence summary at the top
  of a section.
- "**Here's what I've come to believe:**" — pivots from observation to
  thesis.
- "*mutatis mutandis*" / "*kinda*" / "(laudatory)" — comfortable
  switching registers from formal to colloquial within one sentence.
- "**Quite literally:**" — used when reaching for the strongest version
  of a claim.

### Emoji & decorative characters

**No emoji in body text. None.** Not "rarely" — never. Avoid them in any
new content unless the author specifically asks.

The only place a non-letter unicode appears is the bullet separator `|`
in the footer (*"© 2024 | Dispatches"*) and the slash divider `/` in
the header nav.

### Tagline & micro-copy

- Site description: *"Technical writing on topics of personal interest."*
- Blog index description: *"Longer-form articles on technical topics."*
- Briefs index description: *"Brief notes on various topics."*
- Projects index description: *"A collection of my projects, with links
  to repositories and demos."*

Pattern: terse, declarative, no marketing verbs.

---

## 5. Iconography

### Approach

**Inline SVG, drawn directly into the component.** Stroke-based, 1.5–2px,
`currentColor`, lucide-shaped. No icon font is loaded; no icon library
ships in the bundle.

The set used on the live site is *tiny*:

| Icon | Where | Visual |
| --- | --- | --- |
| Sun (8 rays + center circle) | Footer theme toggle | lucide `sun` |
| Moon (crescent) | Footer theme toggle | lucide `moon` |
| Monitor (rect + base) | Footer theme toggle | lucide `monitor` |
| Right-arrow (line + chevron) | `ContentCard` static affordance | custom (lucide-ish) |
| Left-arrow (line + chevron) | `BackToPrev` static affordance | custom mirror of above |

`astro-icon` *is* installed in the project and a couple of *unused*
template components (`BlockQuote`, `ExternalLink`, `CallToAction`) reference
`lucide:quote`, `lucide:external-link`, `lucide:arrow-right` — but none of
them actually render on the live pages. Treat lucide as the implicit
"if we needed more icons, we'd use these" library.

### Substitutions for this design system

- **Production / fidelity work:** redraw inline SVG in the existing
  style — 24×24 viewBox, stroke 1.5–2, `currentColor`, no fill, round
  joins. The `ui_kits/blog/` recreation does this.
- **Wider explorations:** load **Lucide** from a CDN. It's the same
  visual family as what's already in use:
  ```html
  <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
  ```

### Emoji & unicode icons

**Do not use emoji as iconography.** This is a hard rule for new
artifacts. The site uses none, and the technical-writing register
would clash with them immediately.

Plain unicode glyphs (`/`, `|`, `→`, `·`) are fine as separators in
inline UI — the header already uses `/` between nav items.

### Logos / brand imagery

- **`assets/favicon.svg`** — adaptive favicon, primary. Stippled plum
  fade matching the OG image; embedded `prefers-color-scheme` media
  query flips light ↔ dark.
- **`assets/favicon-{light,dark}-{16,32,48,180,192}.png`** — raster
  fallbacks. Each rendered natively at its target size with
  disproportionately larger dots & added jaggedness so the texture
  survives below 48px.
- **`assets/og-image.{svg,png}`** + **`-dark.{svg,png}`** — Open Graph
  card. Same engraving language as the favicon, with the wordmark
  set inside the SVG.
- **`assets/wordmark.svg`** + **`-dark.svg`** — the wordmark lockup
  extracted from the OG image: "Dispatches" in Inter Semibold 56/-0.5
  over the italic tagline in Source Serif 4 20. Light variant uses
  `--ink` over `--paper`; dark uses `--moon` over `--night` (the SVG
  itself is transparent — place it on the appropriate surface).
  Tagline uses the same 62% / 68% alpha the body text does.
- **`assets/wordmark-bare.svg`** + **`-bare-dark.svg`** — name only,
  no tagline. Use this anywhere the lockup would be too tall or the
  tagline would be redundant (page headers, RSS-reader avatars,
  "powered by" stamps, conference badges). The header on the live
  site is still set as live text, not this file.

  All four wordmark SVGs use live `<text>` and rely on Inter +
  Source Serif 4 being available at render time. If you need a
  rasterized version that doesn't depend on font availability,
  open the SVG in a browser with the design system's fonts loaded
  and export to PNG, or convert the text to outlines.

---

## 6. Font substitution notes

| Family | Status |
| --- | --- |
| Inter 400 / 600 | ✅ Same family the live site uses (via `@fontsource/inter`). Loaded here from Google Fonts CDN. |
| Source Serif 4 (variable, regular + italic) | ⚠️ **Intentional substitution from Lora.** Loaded locally from `fonts/`. See typography note above — the live site uses Lora; this design system uses Source Serif 4 per your upload. |
| JetBrains Mono | ⚠️ **Substitution.** The live site uses Expressive Code's default monospace (system mono on most platforms — SF Mono / Consolas / etc.). I added JetBrains Mono here because static HTML mocks render more consistently with an explicit webfont. Easy to swap to `ui-monospace` if you'd rather match exactly. |

If you'd like the woff2 files copied into this system instead of pulled
from Google Fonts (offline use, deterministic rendering), say the word and
I'll inline them under `fonts/`.

---

## 7. Caveats & known gaps

- The OG-image generator on the live site uses **Tailgraph** for dynamic
  Open Graph cards. I haven't recreated this — the design system simply
  treats the logo photo as the brand image.
- The site has an **`/about`** page in the nav, but its content wasn't
  in the snapshots I successfully read. The UI kit includes the route in
  the header but leaves the body as a placeholder.
- **Speaker notes, decks, presentations:** not part of this project.
  Dispatches is a written-form blog only.
- A handful of source files (`Cargo.toml`, `meso-optimization/index.md`,
  `BackToTop.astro`, `trop/index.md`) returned 500s when I tried to read
  them. The relevant patterns are recovered from sibling files; please
  let me know if anything in the system contradicts the live site.
