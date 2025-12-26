# Astro development commands

# Default port (automatically allocated by trop per-directory)
port := `trop reserve`

# Build: builds the site for production
build:
    npm run build

# Preview: launches dev server with hot reload
# Fails early if another preview is already running
preview port=port:
    bash scripts/preview-server.sh {{port}}

# Shutdown: kills Astro server if running on specified port
shutdown port=port:
    bash scripts/shutdown-server.sh {{port}}

# Open: opens browser if server is running
open port=port:
    bash scripts/open-browser.sh {{port}}

# View: starts preview then opens browser
view port=port:
    @just preview {{port}}
    @just open {{port}}

# Clean: removes built files
clean:
    rm -rf dist

# Install: installs dependencies
install:
    npm install

# Setup: full project setup including dependencies and Playwright browsers
setup:
    npm install
    npx playwright install

# Spellcheck: checks spelling in source files
spellcheck:
    npm run spellcheck

# Spellcheck-html: checks spelling in built HTML output
spellcheck-html:
    npm run spellcheck:html

# Spellcheck-all: full spellcheck workflow (source + build + html)
spellcheck-all:
    npm run spellcheck:all

# Lint: runs ESLint on all files
lint:
    npm run lint

# Lint-fix: auto-fixes ESLint issues where possible
lint-fix:
    npm run lint:fix

# Lint-markdown: runs markdownlint on content files
lint-markdown:
    npm run lint:markdown

# Validate: runs all validation checks (lint + spellcheck + build + links)
validate:
    npm run validate:all

# QA: runs all Playwright QA tests (full suite for CI)
qa:
    npm run qa

# QA-quick: runs quick sample of tests for local development
qa-quick:
    npm run qa:quick

# QA-full: runs complete test suite including all sitemap pages
qa-full:
    npm run qa:full

# QA-comprehensive: runs only the comprehensive sitemap tests
qa-comprehensive:
    npm run qa:comprehensive

# QA-core: runs only the core tests (not comprehensive)
qa-core:
    npm run qa:core

# QA-headed: runs Playwright tests with visible browser
qa-headed:
    npm run qa:headed

# QA-ui: opens Playwright UI for interactive testing
qa-ui:
    npm run qa:ui

# QA-debug: runs Playwright tests in debug mode
qa-debug:
    npm run qa:debug

# QA-report: shows Playwright test report
qa-report:
    npm run qa:report

# QA-codegen: opens Playwright code generator
qa-codegen:
    npm run qa:codegen

# Learn-spelling: adds new words to cspell dictionary (comma-separated)
learn-spelling words:
    node scripts/learn-spelling.js {{words}}
