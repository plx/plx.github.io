# Validation & CI Parity Guide

This document explains how to run the same validation checks locally that run in CI, ensuring your changes will pass all checks before pushing.

## Quick Start

To run all CI checks locally (exactly as they run in GitHub Actions):

```bash
npm run test:ci
```

The parity run expects dependencies, Playwright's Chromium browser, and
`xmllint` to be installed. `just setup` installs the locked npm dependencies
and Playwright browsers and reports if `xmllint` is unavailable.

For a more verbose version with progress indicators:

```bash
npm run test:ci:verbose
```

## Individual Validation Commands

### 1. Linting (ESLint)
Checks code style and catches common errors:
```bash
npm run lint        # Check for issues
npm run lint:fix    # Auto-fix where possible
```

### 2. Markdown Linting

Checks Markdown and MDX structure without changing prose:

```bash
npm run lint:markdown
```

### 3. Spell Checking

#### Source Files
Checks markdown, TypeScript, and Astro files:
```bash
npm run spellcheck
```

#### HTML Output
Checks generated HTML files (requires build first):
```bash
npm run build
npm run spellcheck:html
```

#### Both
```bash
npm run spellcheck:all
```

### 4. Prose Linting
Checks article content for Vale style and terminology rules:
```bash
npm run lint:prose
```

### 5. Vale Fixture Tests
Checks that Vale terminology fixtures fail and pass as expected:
```bash
npm run test:vale
```

### 6. Unit Tests

Runs Vitest coverage for application utilities and validation helpers:

```bash
npm run test:unit
```

### 7. Build
Generates the static site:
```bash
npm run build
```

### 8. Link Validation
Checks for broken internal links (requires build first):
```bash
npm run validate:links
```

### 9. Feed Validation

Checks the generated RSS feed for XML and namespace errors (requires a build
and `xmllint`):

```bash
npm run validate:feed
```

### 10. Browser QA

Runs the Chromium suite used in CI, including accessibility and responsive
behavior checks:

```bash
npm run qa:ci
```

Use `npm run qa` when you want the full local Chromium, Firefox, WebKit, and
mobile-project suite.

### 11. All Validations
Runs everything in sequence:
```bash
npm run validate:all

# Full CI parity, including unit tests:
npm run test:ci
```

## CI/CD Workflow

The GitHub Actions workflow runs these exact same checks:
1. Linting (`npm run lint`)
2. Markdown linting (`npm run lint:markdown`)
3. Type checking (`npm run typecheck`)
4. Unit tests (`npm run test:unit`)
5. Source spell check (`npm run spellcheck`)
6. Prose lint (`npm run lint:prose`)
7. Vale fixture tests (`npm run test:vale`)
8. Build (`npm run build`)
9. HTML spell check (`npm run spellcheck:html`)
10. Link validation (`npm run validate:links`)
11. RSS feed validation (`npm run validate:feed`)
12. Chromium browser QA (`npm run qa:ci`)

## Troubleshooting

### Spell Check Issues

If spell check is failing:

1. **For technical terms**: Add them to `cspell.json` in the `words` array
2. **For actual typos**: Fix them in the source files
3. **HTML entity issues**: Words with HTML entities (like `doesn&#x27;t`) may need special handling

To debug spell check issues:
```bash
# See which files are being checked
npx cspell "dist/**/*.html" --no-progress --verbose

# Check the ignore patterns
cat cspell.json | grep -A10 "ignorePaths"
```

### Build Issues

If the build fails:
```bash
# Run with verbose output
npm run build

# Check for TypeScript errors
npx astro check
```

### Link Validation Issues

If link validation fails:
```bash
# Run the validator directly
node scripts/validate-links.js

# Check which links are broken
ls -la dist/  # Ensure build output exists
```

## Pre-Push Checklist

Before pushing changes:

1. ✅ Run `npm run test:ci` locally
2. ✅ Fix any issues that arise
3. ✅ If adding new terms, update `cspell.json`
4. ✅ If adding new terminology rules, update `.vale/styles/`
5. ✅ Commit all changes including config updates

## Common Gotchas

1. **Spell check ignores entire directories**: Check `ignorePaths` in `cspell.json`
2. **HTML spell check requires build**: Always run `npm run build` first
3. **CI uses exact npm scripts**: Don't rely on different local commands
4. **Case sensitivity**: File paths are case-sensitive in CI (Linux) but may not be locally (macOS/Windows)
5. **Vale fixture failures**: Update `.vale/fixtures/` and `scripts/check-vale-fixtures.js` when changing expected terminology rule behavior

## Maintaining CI/CD Parity

To ensure local development matches CI:

1. Always use the npm scripts rather than direct commands
2. Run `npm run test:ci` before pushing
3. Install the locked dependency graph with `npm ci`; use reviewed Dependabot
   PRs (or an intentional `npm install`) when updating the lockfile
4. If CI fails but local passes, check for:
   - Missing files in git
   - Different Node.js versions
   - Platform-specific issues (Linux CI vs local macOS/Windows)
