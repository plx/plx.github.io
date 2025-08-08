# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is an Astro-based static site deployed to GitHub Pages. The site uses Tailwind CSS for styling and is built using npm/Node.js, then deployed via GitHub Actions.

## Key Commands

### Local Development

The repository includes a justfile for convenient local development:

1. **Initial setup** (one-time):
   ```bash
   # Install dependencies
   npm install
   # OR using justfile
   just install
   ```

2. **Development commands** (via justfile):
   ```bash
   # Start Astro dev server for preview (default port 4000)
   just preview
   
   # Start server and open in browser
   just view
   
   # Stop the server
   just shutdown
   
   # Open browser if server is already running
   just open
   
   # Build for production
   just build
   
   # Clean build artifacts
   just clean
   
   # Use custom port (all commands accept port argument)
   just view 8080
   just shutdown 8080
   ```

3. **Direct npm commands** (if needed):
   ```bash
   # Run development server
   npm run dev
   
   # Build for production
   npm run build
   
   # Preview production build
   npm run preview
   
   # Lint code
   npm run lint
   npm run lint:fix
   ```

4. **GitHub Pages deployment**: Push changes to the main branch and GitHub Actions will automatically build and deploy via the `.github/workflows/deploy.yml` workflow

### Content Structure

#### Blog Posts
Create new blog posts in `src/content/blog/` as folders with an `index.md` file:
```
src/content/blog/my-new-post/
└── index.md
```

Posts should include front matter with relevant metadata.

#### Briefs (Short Notes)
Create brief notes in `src/content/briefs/` as individual markdown files:
```
src/content/briefs/my-brief.md
```

#### Projects
Create project pages in `src/content/projects/` as folders with an `index.md` file:
```
src/content/projects/my-project/
└── index.md
```

### Testing and QA

The repository has Playwright browser automation available via MCP for testing and QA purposes. This enables:
- Visual testing and screenshot capture
- Navigation testing
- Content verification
- Browser automation tasks

Note: the project has a dedicated QA-via-playwright agent named "web-qa-playwright".

## Architecture

### Directory Structure
- `src/`: Source code
  - `components/`: Astro components
  - `content/`: Content collections (blog, briefs, projects)
  - `layouts/`: Page layouts
  - `pages/`: Routes and pages
  - `styles/`: Global styles
  - `lib/`: Utilities
- `public/`: Static assets (fonts, images, etc.)
- `dist/`: Build output (generated, not in repo)
- `.github/workflows/`: GitHub Actions workflows

### Key Technical Details
- **Framework**: Astro with React integration
- **Styling**: Tailwind CSS with Typography plugin
- **Content**: MDX support for enhanced markdown
- **Build**: Static site generation to `dist/` folder
- **Deployment**: GitHub Actions workflow deploys to GitHub Pages
- **Site URL**: https://plx.github.io

### Content Collections
Astro's content collections are used to manage:
- Blog posts with metadata
- Brief notes
- Project pages

### Build & Deployment Flow
1. Content is written in Markdown/MDX files
2. Astro processes content through layouts and components
3. `npm run build` generates static site in `dist/` folder
4. GitHub Actions workflow triggers on push to main
5. Workflow builds site and deploys to GitHub Pages

### CSS Lessons Learned

When implementing mobile navigation, several CSS challenges were encountered and solved:

1. **Element Hiding Best Practices**
   - **Issue**: Using negative `left` positioning (e.g., `left: -100%`) can leave partial elements visible
   - **Solution**: Use `transform: translateX(-100%)` combined with `visibility: hidden` for complete hiding
   - **Why**: Transform moves the element visually while visibility ensures it's not interactable

2. **Mobile Layout Gotchas**
   - **Issue**: Flex layouts can cause unexpected spacing on mobile
   - **Solution**: Change wrapper to `display: block` on mobile breakpoints
   - **Why**: Removes flex-related spacing issues

3. **Z-Index and Positioning**
   - Mobile header needs proper z-index stacking (1000+) to stay above content
   - Fixed positioning requires careful height calculations for content padding
   - Use `overflow: visible` on containers to allow menus to extend beyond

4. **Debugging Overlapping Elements**
   - Browser developer tools are essential for identifying which specific element is causing overlap
   - Check both the container and child elements for positioning issues
   - Sometimes the issue is inherited padding/margin rather than the obvious element

5. **Full-Width Mobile Menus**
   - Set menu width to 100% for better mobile readability
   - Ensure no parent containers constrain the width
   - Test on actual mobile devices or browser mobile emulation