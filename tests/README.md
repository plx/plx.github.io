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
# Run all tests (headless)
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
# Run all tests
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

## Test Suites

### Navigation Tests (`navigation.spec.ts`)
- Home page loads
- Navigation between pages
- 404 page handling
- Consistent navigation across pages

### Accessibility Tests (`accessibility.spec.ts`)
- Proper heading structure
- Alt text on images
- Descriptive link text
- Language attributes
- Skip links for keyboard navigation
- Focus visibility
- No duplicate IDs

### Content Tests (`content.spec.ts`)
- Page content rendering
- Blog posts display
- Briefs categories
- Projects display
- RSS feed validity
- Sitemap generation
- Code block rendering
- External link security

### Responsive Design Tests (`responsive.spec.ts`)
- Mobile, tablet, and desktop viewports
- No horizontal scrolling
- Responsive images
- Readable text on mobile
- Touch target sizing
- Content reflow

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

## Tips

- Tests automatically build the site and start the preview server
- Use `--headed` flag to see what's happening in the browser
- Use Playwright UI for the best debugging experience
- Screenshots and traces are saved on test failures
- Run `just qa-report` after failures to see detailed reports with screenshots
