# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is an Astro-based static site deployed to GitHub Pages. The site uses Tailwind CSS for styling and is built using npm/Node.js, then deployed via GitHub Actions; as such, any changes pushed to `main` will be automatically deployed—convenient, but be careful!

## Key Commands

The repository includes a justfile to gather all project commands in a single place; if you're unsure "how do I X?", look there first.
It also manages the preview server using a tool called `trop` (https://github.com/plx/trop).

Some key commands are:

- just install: installs dependencies (npm ci)
- just preview: launches dev server with hot reload (port automatically allocated by trop)
- just shutdown: kills dev server if running (port automatically allocated by trop)
- just build: builds the site for production (to dist/)
- just spellcheck: checks spelling in source files
- just spellcheck-html: checks spelling in built HTML output
- just lint: runs ESLint on all files
- just lint-fix: auto-fixes ESLint issues where possible
- just lint-prose: runs Vale on article content
- just test-vale: verifies Vale terminology fixture behavior
- just validate-feed: builds the site then validates the RSS feed XML (well-formedness + namespaces, via xmllint)
- just validate: runs all validation checks (lint + spellcheck + prose + Vale fixtures + build + links + feed)

## Key Technical Decisions

- **Framework**: Astro 7 with React integration
- **Styling**: Tailwind CSS v3 (Typography plugin), wired through `postcss.config.mjs`.
  The old `@astrojs/tailwind` integration is gone (unsupported on Astro 7); PostCSS
  runs `tailwindcss` + `autoprefixer` exactly as that integration did.
- **Content**: Content Layer collections (`src/content.config.ts`, `glob()` loaders);
  MDX support for enhanced markdown
- **TypeScript**: TypeScript 7. The **native compiler** (`tsgo`, from
  `@typescript/native-preview`) does the type-checking — `npm run typecheck`. Classic
  `typescript@6` is still installed because the native compiler doesn't yet expose the
  programmatic API that `astro check` and `typescript-eslint` rely on; those tools run
  on 6.x. Keep the dated native-preview snapshot pinned and its lockfile entry refreshed
  until TypeScript 7 is stable; remove `typescript@6` once those tools support the native
  compiler.
- **Build**: Static site generation to `dist/` folder
- **Deployment**: GitHub Actions workflow deploys to GitHub Pages
- **Site URL**: https://plx.github.io

Additionally, we aim to have *reasonable* accessibility support throughout the site.

## Design System

The site's visual design is the **Twilight** design system: a single
indigo-night-sky surface/text family with deep **plum** as the only accent;
serif prose (Source Serif 4) on sans UI (Inter); flat-with-border, no shadows,
no gradients, no emoji. **Before making any visual change, read
[`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md)** (token table, the
token→Tailwind-utility mapping, dos & don'ts, dark-mode mechanics, and the
opt-in Tufte / deferred patterns). The `/dispatches-design` skill and the full
brand narrative in `docs/design-system/README.md` are also available.

Key things to know:

- **Tokens** are CSS variables in `src/styles/tokens.css`, exposed as Tailwind
  utilities in `tailwind.config.mjs` (`bg-bg`, `text-fg`, `text-fg-strong`,
  `text-muted`, `border-border`, `bg-bg-hover`, `text-accent`, `bg-accent-soft`,
  `ring-accent`). They **auto-flip in dark mode** — use the semantic token, don't
  add `dark:` color variants.
- **Served brand assets** (`public/favicon.svg`, `og-image*.png`, etc.) are
  generated from `docs/design-system/` — don't hand-edit the PNGs.
- **Motion is interaction feedback only** (300ms hover/focus); there is no
  page-load animation.

## Content Structure

The site's content is organized into three main collections:

- Blog posts (longer-form articles): `src/content/blog/`
- Briefs (short notes): `src/content/briefs/`
- Projects: `src/content/projects/`

Here are brief remarks about each.

### Blog Posts

Structured as folders containing *at least* an `index.md` file, placed in `src/content/blog/`; for example, `my-new-post` looks like:

```
src/content/blog/my-new-post/
src/content/blog/my-new-post/index.md
```

Posts should include front matter with relevant metadata.

### Briefs (Short Notes)

Organized into categories represented as folders within `src/content/briefs/`, and stored *directly* as markdown files (no additional nesting / generic `index.md`).
For example, the following contains two briefs—one in the `swift-warts` category and one in the `claude-code` category:

```
src/content/briefs/swift-warts/my-swift-brief.md
src/content/briefs/claude-code/my-claude-brief.md
```

Categories are auto-discovered from folder names. To add a new category, simply create a new folder.
Categories may also customize their display name, description, and sort priority by establishing a `category.yaml` file in the category folder; this is useful because the category name is used in multiple places throughout the site, and benefits from having distinct, contextually-appropriate representations.

### Projects (Descriptions of Projects)

Structured analogously to "Blog Posts`, but placed in `src/content/projects/`, instead.

## Directory Structure

- `src/`: Source code
  - `components/`: Astro components
  - `content/`: Content collections (blog, briefs, projects)
    - `blog/`: where blog posts live
    - `briefs/`: where briefs live
    - `projects/`: where project pages live
  - `layouts/`: Page layouts
  - `pages/`: Routes and pages
  - `styles/`: Global styles
  - `lib/`: Utilities
- `public/`: Static assets (fonts, images, etc.)
- `dist/`: Build output (generated, not in repo)
- `.github/workflows/`: GitHub Actions workflows

## Testing and QA

The repository has Playwright browser automation available via MCP for testing and QA purposes. This enables:

- Visual testing and screenshot capture
- Navigation testing
- Content verification
- Browser automation tasks
