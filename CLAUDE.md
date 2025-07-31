# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a Jekyll-based GitHub Pages site with a blog structure. The site uses the jekyll-theme-dinky theme and is configured for GitHub Pages deployment.

## Key Commands

### Local Development

Since this is a GitHub Pages site without a local Gemfile, development is typically done by:

1. **Direct editing and GitHub Pages deployment**: Push changes to the main branch and GitHub Pages will automatically build and deploy
2. **Local Jekyll setup** (if needed):
   ```bash
   # Install Jekyll and bundler if not already installed
   gem install jekyll bundler
   
   # Create a Gemfile for local development
   echo "source 'https://rubygems.org'" > Gemfile
   echo "gem 'github-pages', group: :jekyll_plugins" >> Gemfile
   
   # Install dependencies
   bundle install
   
   # Run Jekyll locally
   bundle exec jekyll serve
   ```

### Creating New Posts

Create new blog posts in the `_posts/` directory with the naming convention:
```
YYYY-MM-DD-title-with-dashes.md
```

Posts should include front matter with:
- layout: post
- title: "Post Title"
- date: YYYY-MM-DD
- description: "Brief description"
- tags: [tag1, tag2]

### Creating New Notes

Create new notes in the `_notes/` directory with any filename ending in `.md`.

Notes should include front matter with:
- title: "Note Title"
- description: "Brief description"

Notes are displayed alphabetically by title and do not support dates or tags.

## Architecture

### Directory Structure
- `_posts/`: Blog posts in Markdown format (time-based articles)
- `_notes/`: Notes in Markdown format (living documents without dates/tags)
- `_layouts/`: Page templates (default, page, post)
- `_includes/`: Reusable components (sidebar.html, tag-link.html)
- `assets/css/`: Custom stylesheets (custom.css for sidebar layout)
- `index.md`: Homepage showing recent articles
- `tags.md`: Tag listing page
- `notes.md`: Notes listing page
- `about.md`: About page

### Key Technical Details
- **Theme**: jekyll-theme-dinky (GitHub Pages theme)
- **Markdown processor**: kramdown with GFM (GitHub Flavored Markdown)
- **Navigation**: Sidebar-based navigation (replaces header navigation)
- **Collections**: 
  - Posts: Time-based articles with dates and tags
  - Notes: Living documents without dates or tags
- **Permalink structure**: 
  - Posts: `/:year/:month/:day/:title/`
  - Notes: `/notes/:title/`
- **Default layouts**: Posts use "post" layout, pages and notes use "page" layout

### Content Flow
1. Posts and notes are written in Markdown with YAML front matter
2. Jekyll processes content through the specified layouts
3. The sidebar navigation (sidebar.html) provides site-wide navigation:
   - Posts link leads to homepage showing all posts
   - Tags link shows all tags used in posts
   - Notes link shows all notes with sub-navigation
   - About link shows the about page
4. The homepage (index.md) displays all posts with their metadata
5. The notes page (notes.md) displays all notes alphabetically by title
6. Tags are extracted from posts and displayed via the tag-link.html include
7. GitHub Pages automatically builds and deploys on push to main branch