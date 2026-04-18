---
paths:
  - "src/content/blog/**"
  - "src/content/briefs/**"
  - "src/content/projects/**"
  - "src/content/config.ts"
---

# Content Collections

## Blog Posts

- Store each post in `src/content/blog/<slug>/index.md`.
- Keep front matter complete and consistent with existing posts.

## Briefs

- Store briefs directly in `src/content/briefs/<category>/` as markdown files.
- Do not add extra per-brief nesting under category folders.
- Categories are discovered from directory names.
- Optional category metadata belongs in `category.yaml` inside each category directory.

## Projects

- Store each project in `src/content/projects/<slug>/index.md`.
- Follow front matter and structure patterns used by existing project entries.
