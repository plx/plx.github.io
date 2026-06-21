# AGENTS.md

Shared instructions for coding agents working in this repository.

## Project Snapshot

- This repository is an Astro static site styled with Tailwind CSS.
- Content lives in `src/content/` collections (`blog`, `briefs`, `projects`).
- Deployments are automated from `main` via GitHub Actions, so treat changes as potentially production-impacting.

## Standard Workflow

- Prefer `just` commands from `justfile` for install, build, lint, and validation tasks.
- Use `just preview` / `just shutdown` to manage local preview server lifecycle.
- Run the narrowest relevant checks first, then broader validation for risky or wide-scope changes.

## Claude Rules

Detailed project guidance is factored into `.claude/rules/` files. For tools that support `@` imports:

@.claude/rules/00-project-basics.md
@.claude/rules/10-commands-and-validation.md
@.claude/rules/20-content-collections.md
@.claude/rules/30-testing-and-qa.md

## Claude Skills

Task-specific workflows are defined as skills under `.claude/skills/`:

- `/accessibility-auditor`
- `/accessibility-implementer`
- `/lint-fixer`
- `/web-qa-playwright`
