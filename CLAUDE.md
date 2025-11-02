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
- just validate: runs all validation checks (lint + spellcheck + build + links)

## Key Technical Decisions

- **Framework**: Astro with React integration
- **Styling**: Tailwind CSS with Typography plugin
- **Content**: MDX support for enhanced markdown
- **Build**: Static site generation to `dist/` folder
- **Deployment**: GitHub Actions workflow deploys to GitHub Pages
- **Site URL**: https://plx.github.io

Additionally, we aim to have *reasonable* accessibility support throughout the site.

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
