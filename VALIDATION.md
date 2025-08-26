# Validation & CI Parity Guide

This document explains how to run the same validation checks locally that run in CI, ensuring your changes will pass all checks before pushing.

## Quick Start

To run all CI checks locally (exactly as they run in GitHub Actions):

```bash
npm run test:ci
```

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

### 2. Spell Checking

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

### 3. Build
Generates the static site:
```bash
npm run build
```

### 4. Link Validation
Checks for broken internal links (requires build first):
```bash
npm run validate:links
```

### 5. All Validations
Runs everything in sequence:
```bash
npm run validate:all
# OR equivalently:
npm run test:ci
```

## CI/CD Workflow

The GitHub Actions workflow runs these exact same checks:
1. Linting (`npm run lint`)
2. Source spell check (`npm run spellcheck`)
3. Build (`npm run build`)
4. HTML spell check (`npm run spellcheck:html`)
5. Link validation (`npm run validate:links`)

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
4. ✅ Commit all changes including config updates

## Common Gotchas

1. **Spell check ignores entire directories**: Check `ignorePaths` in `cspell.json`
2. **HTML spell check requires build**: Always run `npm run build` first
3. **CI uses exact npm scripts**: Don't rely on different local commands
4. **Case sensitivity**: File paths are case-sensitive in CI (Linux) but may not be locally (macOS/Windows)

## Maintaining CI/CD Parity

To ensure local development matches CI:

1. Always use the npm scripts rather than direct commands
2. Run `npm run test:ci` before pushing
3. Keep dependencies up to date with `npm ci` (not `npm install`)
4. If CI fails but local passes, check for:
   - Missing files in git
   - Different Node.js versions
   - Platform-specific issues (Linux CI vs local macOS/Windows)