# QA Testing

This directory contains Playwright-based end-to-end tests for the website. These tests verify functionality, accessibility, responsive design, and content rendering.

## Setup

### System Requirements

Playwright requires certain system libraries to run browsers. On Ubuntu/Debian systems, you can install them with:

```bash
npx playwright install --with-deps
```

**Note**: In highly sandboxed environments (like some CI containers), you may need to install system dependencies separately or use containerized Playwright images.

### First Time Setup

**Recommended**: Use the justfile setup command which handles everything:

```bash
just setup
```

This installs both npm dependencies and Playwright browsers.

**Alternative**: Manual setup:

```bash
# Install npm dependencies
npm install

# Install Playwright browsers
npx playwright install
```

Or install with system dependencies for all browsers:

```bash
npx playwright install --with-deps
```

## Running Tests

### Using Just Commands

The recommended way to run tests is via the justfile:

```bash
# Quick sample for local dev (tests ~5 pages)
just qa-quick

# Run core tests only (navigation, accessibility, content, responsive)
just qa-core

# Run comprehensive tests only (all sitemap pages)
just qa-comprehensive

# Run all tests - full suite (for CI or before major changes)
just qa-full

# Legacy: same as qa-full
just qa

# Run tests with visible browser
just qa-headed

# Open Playwright UI for interactive testing
just qa-ui

# Run tests in debug mode
just qa-debug

# View test report
just qa-report

# Generate test code interactively
just qa-codegen
```

### Using npm Scripts

Alternatively, use npm scripts directly:

```bash
# Quick sample for local dev
npm run qa:quick

# Run core tests only
npm run qa:core

# Run comprehensive tests only
npm run qa:comprehensive

# Run all tests - full suite
npm run qa:full

# Legacy: same as qa:full
npm run qa

# Run with visible browser
npm run qa:headed

# Open Playwright UI
npm run qa:ui

# Debug mode
npm run qa:debug

# Show report
npm run qa:report

# Code generator
npm run qa:codegen
```

### Recommended Workflow

**During development:**
```bash
just qa-quick
```
Tests a sample of pages across the site for quick feedback.

**Before committing structural changes:**
```bash
just qa-full
```
Tests all pages from the sitemap plus all core functionality.

**Just the comprehensive tests:**
```bash
just qa-comprehensive
```
Useful when reorganizing site structure to verify all pages still work.

## Test Suites

### Core Test Suites (Fast, Fixed Pages)

These tests run on a fixed set of core pages and are fast enough for local development:

**Navigation Tests** (`navigation.spec.ts`)
- Home page loads
- Navigation between pages
- 404 page handling
- Consistent navigation across pages

**Accessibility Tests** (`accessibility.spec.ts`)
- Proper heading structure
- Alt text on images
- Descriptive link text
- Language attributes
- Skip links for keyboard navigation
- Focus visibility
- No duplicate IDs

**Content Tests** (`content.spec.ts`)
- Page content rendering
- Blog posts display
- Briefs categories
- Projects display
- RSS feed validity
- Sitemap generation
- Code block rendering
- External link security

**Responsive Design Tests** (`responsive.spec.ts`)
- Mobile, tablet, and desktop viewports
- No horizontal scrolling
- Responsive images
- Readable text on mobile
- Touch target sizing
- Content reflow

### Comprehensive Test Suite (Sitemap-Based)

**Comprehensive Tests** (`comprehensive.spec.ts`)
- **Discovers all pages from sitemap** automatically
- Tests every page in your site for:
  - Page loads successfully (< 400 status)
  - Has valid title
  - Has content (>50 characters)
  - Exactly one H1
  - Proper heading hierarchy (no skipped levels)
  - All images have alt text
  - No duplicate IDs
  - All links have accessible labels

**Two modes:**
1. **Full mode** (CI): Tests ALL pages from sitemap
2. **Sample mode** (Local): Tests ~5 representative pages for quick feedback

This suite is designed to catch issues during site reorganization and ensures structural consistency across all pages.

### Link Validation (External to Playwright)

In addition to the Playwright tests, the repository includes **comprehensive link validation** via `scripts/validate-links.js`:

- ✅ Validates **all internal links** across all built HTML files
- ✅ Validates **fragment links** (e.g., `#section-id`)
- ✅ Checks both `href` and `src` attributes
- ✅ Verifies fragment targets exist on destination pages
- ✅ External links are intentionally ignored (they change frequently)

Run with:
```bash
npm run validate:links
```

This runs as part of `npm run validate:all` and in CI. Together with the Playwright tests, this provides comprehensive coverage of your site's link integrity.

## Test Configuration

Configuration is in `playwright.config.ts`. Key settings:

- **Base URL**: `http://localhost:4321` (or `$BASE_URL` env var)
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Auto-start**: Automatically builds and starts preview server before tests
- **Retries**: 2 retries on CI, 0 locally
- **Screenshots**: Captured on failure
- **Traces**: Captured on first retry

## Writing New Tests

Create new test files in the `tests/` directory:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/');
    // Your test code here
  });
});
```

## CI Integration

Tests can be integrated into CI by adding to your workflow:

```yaml
- name: Install dependencies
  run: npm ci

- name: Install Playwright Browsers
  run: npx playwright install --with-deps

- name: Run QA tests
  run: npm run qa
```

## Debugging

### Visual Debugging

Run tests with visible browser:

```bash
just qa-headed
```

### Interactive UI

Open the Playwright UI for interactive test development:

```bash
just qa-ui
```

### Debug Mode

Step through tests line by line:

```bash
just qa-debug
```

### Generate Test Code

Use the code generator to create tests by interacting with your site:

```bash
just qa-codegen
```

This opens a browser where you can click around, and Playwright will generate test code.

## Summary: What Gets Tested

### Playwright Tests

**Coverage:**
- **Core tests** (33 tests × 5 browsers = 165 test executions)
  - Test ~7 fixed pages (/, /blog, /briefs, /projects, /about, RSS, sitemap)
  - Run structural, accessibility, content, and responsive checks

- **Comprehensive tests** (variable count based on site size)
  - **Sample mode** (~5 pages × 5 tests × 5 browsers = ~125 test executions)
  - **Full mode** (all sitemap pages × 5 tests × 5 browsers = hundreds/thousands of executions)
  - Discovers all pages from sitemap automatically
  - Tests structure, headings, images, IDs, and links on every page

**What changes require test updates:**
- ✅ **No updates needed:** Adding blog posts, briefs, or projects
- ✅ **No updates needed:** Content changes within pages
- ✅ **No updates needed:** Styling changes (as long as accessibility maintained)
- ⚠️ **Updates needed:** Renaming main sections (update URLs in core tests)
- ⚠️ **Updates needed:** Changing navigation HTML structure (update selectors)
- ⚠️ **Updates needed:** Removing main sections (remove/skip tests)

### Link Validation (scripts/validate-links.js)

**Coverage:**
- **All** internal links across **all** built HTML files
- **All** fragment links with verification targets exist
- Runs independently of Playwright, as part of build validation

**What changes require updates:**
- ✅ **No updates needed:** This automatically adapts to site structure changes

### Recommended Usage

**Quick local feedback:**
```bash
just qa-quick
```

**Before structural reorganization:**
```bash
just qa-full && npm run validate:links
```

**In CI:**
```bash
npm run qa:full
npm run validate:links
```

## Tips

- Tests automatically build the site and start the preview server
- Use `--headed` flag to see what's happening in the browser
- Use Playwright UI for the best debugging experience
- Screenshots and traces are saved on test failures
- Run `just qa-report` after failures to see detailed reports with screenshots
- The comprehensive tests adapt automatically to your sitemap—no maintenance needed as you add content!
