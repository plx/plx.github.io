# Major-Version Migration Plan

As of the April 2026 refresh (PR #30), the site is running the newest in-range versions of every direct dependency, and two safe pre-1.0 majors (`sharp`, `markdownlint-cli2`) have been bumped. The remaining cross-major upgrades need their own migration work. This document lists them, calls out the hard compatibility constraints found in each package's npm `peerDependencies` / `engines`, and proposes an order.

## Hard compatibility facts (from npm metadata)

These are the *explicit* constraints published in the registry — not speculation based on issue trackers or blog posts.

| Upgrade target | Key constraint | Implication |
| --- | --- | --- |
| `@astrojs/mdx@5` | `peerDependencies.astro: ^6.0.0` | Must go **together with** Astro 6 (can't bump independently). |
| `@astrojs/react@5` | `engines.node: >=22.12.0`; no explicit astro peer listed | Satisfied by current Node. In practice tied to Astro 6 via integration API; bump with Astro 6. |
| `@astrojs/tailwind@6` | `peerDependencies: { astro: ^3 \|\| ^4 \|\| ^5, tailwindcss: ^3.0.24 }` | **This package cannot be used with Tailwind 4.** Tailwind 4 migration *removes* `@astrojs/tailwind` entirely; the Astro-recommended replacement is the `@tailwindcss/vite` plugin plus Tailwind's CSS-first config. |
| `tailwindcss@4` | No peerDeps declared | `@tailwindcss/typography@0.5.19` explicitly supports both v3 and v4, so it's safe across the boundary. |
| `tailwind-merge@3` | No peerDeps declared | Not an npm-level incompatibility, but the v3 class catalog targets Tailwind 4 class names — treat it as **coupled to Tailwind 4 migration**. |
| `eslint@10` | `engines.node: ^20.19 \|\| ^22.13 \|\| >=24` | Current Node 25 is fine. |
| `eslint-plugin-jsx-a11y@6.10.2` | `peerDependencies.eslint: ^3 .. ^9` | **Does not yet list ESLint 10 support.** Latest published version at time of writing. Blocks ESLint 10 until a new release lands (or until we drop the plugin — currently only needed for React JSX, which is minimal here). |
| `eslint-plugin-astro@1.7` | `peerDependencies.eslint: >=8.57.0` | Compatible with both ESLint 9 and 10. |
| `@typescript-eslint/{parser,eslint-plugin}@8.58+` | `eslint: ^8.57 \|\| ^9 \|\| ^10`; `typescript: >=4.8.4 <6.1.0` | Compatible with **both** ESLint 10 and TypeScript 6 (up to <6.1). No blocker. |
| `typescript@6` | `engines.node: >=14.17` | Fine. Check project-wide for any `tsconfig`/API surface breaks; no external peer issues. |
| `cspell@10` | `engines.node: >=22.18.0`; **no peerDeps** | Totally independent of every other upgrade — see note at the end. |
| `astro-seo@1.1` | No peerDeps declared | Only used in one component (`OpenGraphMeta.astro`); small surface. |
| `accessible-astro-components@5` | No peerDeps declared | **Unused** in `src/` — candidate for removal rather than upgrade. |
| `astro-expressive-code@0.41.7` | `astro: ^3.3 \|\| ^4 \|\| ^5 \|\| ^6-beta` | Already Astro-6 ready. |
| `astro-icon@1.1.5` | No peerDeps declared | Should ride along with Astro 6 without changes. |

Node 25 is currently installed; all upgrades above are satisfied by it.

## Logical grouping

The constraints collapse naturally into four independent tracks:

1. **Astro 6 track** (must ship as one PR): `astro@6`, `@astrojs/mdx@5`, `@astrojs/react@5`, plus `astro-icon` / `astro-expressive-code` float. Content-collection API and image pipeline are the most likely sources of breakage.

2. **Tailwind 4 track** (must ship as one PR): `tailwindcss@4`, `tailwind-merge@3`, **remove** `@astrojs/tailwind`, add `@tailwindcss/vite`, convert `tailwind.config.mjs` + global CSS to the CSS-first `@theme` model. Touches every component.

3. **Lint/TS track** (can ship as one PR or two): `typescript@6`, `eslint@10`. Both are unblocked by `@typescript-eslint/* ^8.58.2`. `eslint-plugin-jsx-a11y` is the one holdout — either wait for a release that lists eslint 10 in its peers, or drop it (we only have one React file).

4. **Independent singles**: `cspell@10`, `astro-seo@1`, remove `accessible-astro-components`. None interact with the above.

Nothing in tracks 1–3 is mutually exclusive; they just each want focused testing. There's no "A blocks B" chain between tracks — for example, Astro 6 does not require Tailwind 4 (and indeed keeping Tailwind 3 during the Astro-6 PR makes that PR smaller).

## Suggested order

**Step 0 — quick wins (single small PR, ~30 min)**
- Bump `astro-seo` to v1.
- Remove `accessible-astro-components` from `package.json` (it's unused).
- Bump `cspell` to v10.

Rationale: these have zero coupling to the other tracks, and shrinking the dep list removes noise from every subsequent upgrade diff.

**Step 1 — lint/TS track (one PR)**
- `typescript@6`, `eslint@10`, plus confirming `@typescript-eslint/*` is on ≥8.58 (it is).
- Handle `eslint-plugin-jsx-a11y`: check if a new release has landed listing eslint 10 support; otherwise drop the plugin (we have minimal JSX).

Rationale: Done before Astro 6 so `astro check` / `tsc` are running on the new compiler when we hit the framework upgrade — you want type-check feedback from the new TS when chasing down Astro-6 API breaks, not two signals at once.

**Step 2 — Astro 6 track (one PR)**
- `astro@6` + `@astrojs/mdx@5` + `@astrojs/react@5` together.
- Float `astro-icon`, `astro-expressive-code`.
- Keep `@astrojs/tailwind@5` + Tailwind 3 in place — don't try to do Tailwind 4 in the same PR.
- Primary risk: content-collection schema / rendering API changes, image service changes. The link-validation and Playwright suites are the safety net.

**Step 3 — Tailwind 4 track (one PR)**
- Replace `@astrojs/tailwind` with `@tailwindcss/vite` (per Astro 6 + Tailwind 4 docs).
- `tailwindcss@4`, `tailwind-merge@3`.
- Move config from `tailwind.config.mjs` to `@theme` directives in the global stylesheet.
- Primary risk: visual regressions. Playwright tests plus `just preview` are the safety net.

Rationale for this ordering: **do lint/TS → Astro 6 → Tailwind 4**, not the reverse. Astro 6 is a *structural* migration (config, APIs, types); Tailwind 4 is a *visual* migration (class output, theme config). Debugging a visual regression is easier when the framework underneath it hasn't also just changed, and the Tailwind PR's diff will be much cleaner against an Astro-6 baseline (the `@astrojs/tailwind` → `@tailwindcss/vite` swap is an Astro-config edit, which you'd rather do once).

If you'd rather minimize total risk per PR: do Step 0, then Tailwind 4 on top of Astro 5 (`@astrojs/tailwind@6` still supports Astro 3/4/5, so you swap integrations without touching the framework), then Astro 6, then Step 1 last. That trades "more PRs" for "each PR changes fewer axes at once." My recommendation is the first order — TS/lint first gives earlier type-check feedback that pays off during the Astro-6 migration.

## Aside: is `cspell` 9 → 10 independent?

**Yes, fully independent** of every other upgrade. Evidence:

- `cspell@10.0.0` declares no `peerDependencies` — it doesn't share a runtime with anything else in the project.
- It's only invoked via the `spellcheck` / `spellcheck:html` npm scripts, which run as a separate process over `.md` / `.html` files. No integration hooks into Astro, Vite, ESLint, or TypeScript.
- The `@cspell/dict-*` dev-deps are data packages (word lists) versioned independently and already current.
- `engines.node: >=22.18.0` is satisfied by the project's Node 25.
- A bump can break only two things: (a) CLI flag changes, and (b) config-file schema changes in `cspell.json` / `.cspell.json`. Both show up immediately when the `spellcheck` script runs — there's no interaction with any other dep's behavior to sequence around.

Practical implication: `cspell@10` can be bundled into Step 0, into any other PR, or shipped as a one-line change. Order doesn't matter.
