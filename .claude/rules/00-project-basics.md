# Project Basics

- Build this project as a static Astro site.
- Preserve existing Tailwind CSS patterns when adding or updating styles.
- Treat `main` as deployment-sensitive because GitHub Actions publishes from it.

## Repository Areas

- `src/pages/`: route entrypoints.
- `src/components/`: reusable UI components.
- `src/layouts/`: page layouts.
- `src/lib/`: shared utilities.
- `src/content/`: content collections and metadata.
- `public/`: static assets.
- `tests/`: Playwright test suite.
