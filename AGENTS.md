# Dispatches

Personal website at `plx.github.io`: an Astro static site with Markdown/MDX
content, TypeScript, and Tailwind CSS 3 via PostCSS. Components are Astro-native;
there is no client UI framework. GitHub Actions deploys `main` to GitHub Pages.

We use `just` to organize and execute repo commands and tasks. `justfile` is the
command index; `just preview` uses `trop` for a workspace-specific port.

- `src/`: site code; see [source notes](src/AGENTS.md) and
  [content notes](src/content/AGENTS.md).
- [Design system](docs/DESIGN_SYSTEM.md): the visual contract for site changes.
- [Validation](VALIDATION.md), [browser test notes](tests/AGENTS.md), and
  [migration watch items](planning/major-migration-plan.md).
- `.agents/skills/`: project workflows, mirrored into `.claude/skills/`.
  [Agent tooling](docs/agent-tooling.md) covers setup and maintenance.
