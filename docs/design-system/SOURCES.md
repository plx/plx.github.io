# Sources

Files read from `plx/plx.github.io@main` while building this design system:

- `README.md`
- `package.json` — Astro 5, Tailwind, `@fontsource/inter`, `@fontsource/lora`, `astro-expressive-code`, `astro-icon`
- `astro.config.mjs`
- `tailwind.config.mjs` — `darkMode: ["class"]`, sans=Inter, serif=Lora
- `src/consts.ts` — site name, nav metadata
- `src/styles/global.css` — the single global stylesheet
- `src/layouts/PageLayout.astro`
- `src/components/Head.astro`
- `src/components/Header.astro`
- `src/components/Footer.astro`
- `src/components/Container.astro`
- `src/components/Link.astro`
- `src/components/ContentCard.astro`
- `src/components/BackToPrev.astro`
- `src/components/FormattedDate.astro`
- `src/components/BlockQuote.astro` *(template leftover, not on live site)*
- `src/components/CallToAction.astro` *(template leftover, not on live site)*
- `src/components/ExternalLink.astro` *(template leftover, not on live site)*
- `src/content/config.ts` listed; not opened (categories cover it)
- `src/content/blog/claude-code-skills/index.md`
- `src/content/briefs/swift-warts/lazy-sequences-decay-easily.md`
- `src/content/briefs/swift-warts/lazy-sequences-lack-primary-associated-types.md`
- `src/content/briefs/swift-warts/category.yaml`
- `src/content/briefs/claude-code/claude-code-pricing.md`
- `src/content/briefs/claude-code/category.yaml`
- `src/content/projects/personal-website/index.md`

## Files that returned 500s and were not read

- `src/content/blog/meso-optimization/index.md` (content recovered from
  the duplicate excerpt embedded in `claude-code-skills/index.md`)
- `src/content/projects/trop/index.md`
- `src/content/briefs/testing/decision-execution-pattern.md`
- `src/components/BackToTop.astro` (pattern inferred from `BackToPrev.astro`)
- `Cargo.toml` (not relevant — Astro project)

## Assets imported

From `public/`:

- `Logo.jpeg`, `Logo-144.jpeg` — the icy-water photo used as OG image badge
- `favicon-32x32.png`, `favicon-48x48.png`
- `apple-touch-icon.png`, `android-chrome-192x192.png`
- `site.webmanifest`
