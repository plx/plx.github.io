---
name: dispatches-qa
description: Audit or fix Dispatches browser, responsive-layout, and accessibility issues using the existing Playwright and axe coverage.
---

# Dispatches QA

Paths below are relative to the repository root.

Start with the affected route or interaction. The suite's route sample is in `tests/helpers.ts`; sitemap-based tests cover all generated HTML routes.

Run the relevant existing spec, for example:

```sh
npm run qa:ci -- tests/accessibility.spec.ts
```

`npm run qa:ci` runs Chromium; `just qa` runs all configured browsers/devices. Read [tests/AGENTS.md](../../../tests/AGENTS.md) and `playwright.config.ts` for static-server ownership and external targets. Add coverage to the appropriate spec when fixing a behavioral regression:

- `accessibility.spec.ts`: axe in both themes, heading structure, skip-link focus, external-link announcements.
- `navigation.spec.ts`: parent/back navigation, persistent theme selection, reduced-motion scrolling and focus.
- `responsive.spec.ts`: narrow-screen reflow and touch targets.
- `content.spec.ts`: generated routes, browser errors, feeds, and social metadata.

Site-specific checks:

- Theme controls use `localStorage.theme` (`light`, `dark`, `system`), `html.dark`, and `aria-pressed`. Verify the chosen state before inspecting colors.
- `ExcerptEntry.astro` and `ContentCard.astro` make the whole item one link. Check accessible names against their visible titles, including Markdown and category prefixes; avoid nested interactive elements.
- `Head.astro` enables keyboard scrolling only for overflowing Expressive Code blocks. Its ResizeObserver settles asynchronously; reuse the accessibility spec's readiness condition.
- For sidenote changes, check standard footnote links, backlinks, and narrow-screen reflow; transformation coverage lives in `src/lib/rehype-sidenotes.test.mjs`.

Automated axe checks do not establish complete accessibility. Reproduce relevant keyboard/focus behavior and inspect visual changes directly. Report concrete failures with route, theme, viewport, and reproduction evidence; implement and recheck when fixes are requested. Audit-only requests stay reviews.
