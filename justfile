# Astro development commands

# Default port (automatically allocated by trop per-directory)
port := `trop reserve`

# Build: builds the site for production
build:
    npm run build

# Preview: launches dev server with hot reload
# Fails early if another preview is already running
preview port=port:
    #!/usr/bin/env bash
    set -euo pipefail
    
    # Check if Astro is already running on the specified port
    if lsof -i :{{port}} | grep -q LISTEN; then
        echo "Error: Port {{port}} is already in use. Another preview may be running."
        echo "Run 'just shutdown {{port}}' to stop it first."
        exit 1
    fi
    
    # Start Astro dev server in background
    echo "Starting Astro dev server on port {{port}}..."
    npm run dev -- --port {{port}} > /tmp/astro-{{port}}.log 2>&1 &
    
    # Wait a moment for server to start
    sleep 3
    
    # Check if server started successfully
    if lsof -i :{{port}} | grep -q LISTEN; then
        echo "Astro server started successfully at http://localhost:{{port}}"
    else
        echo "Error: Failed to start Astro server. Check /tmp/astro-{{port}}.log for details."
        exit 1
    fi

# Shutdown: kills Astro server if running on specified port
shutdown port=port:
    #!/usr/bin/env bash
    set -euo pipefail
    
    # Find Node process on the specified port
    PID=$(lsof -ti :{{port}} 2>/dev/null || true)
    
    if [ -z "$PID" ]; then
        echo "No server found running on port {{port}}"
    else
        echo "Stopping Astro server on port {{port}} (PID: $PID)..."
        kill $PID
        echo "Server stopped."
    fi

# Open: opens browser if server is running
open port=port:
    #!/usr/bin/env bash
    set -euo pipefail
    
    # Check if server is running on the specified port
    if lsof -i :{{port}} | grep -q LISTEN; then
        echo "Opening http://localhost:{{port}} in browser..."
        open "http://localhost:{{port}}"
    else
        echo "Error: No server found running on port {{port}}"
        echo "Run 'just preview {{port}}' to start the server first."
        exit 1
    fi

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