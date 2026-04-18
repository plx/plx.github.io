---
name: lint-fixer
description: Apply mechanical lint and formatting fixes without changing behavior. Use for ESLint or style violations in local development or CI.
disable-model-invocation: true
argument-hint: "[optional lint command]"
---

Fix lint issues mechanically and verify the result.

## Command Selection

- If `$ARGUMENTS` is provided, run that lint command first.
- If no arguments are provided, run project defaults in order:
  1. `just lint-fix`
  2. `just lint`

## Rules

- Make minimal, non-behavioral edits only.
- Preserve logic, APIs, and architecture.
- Follow project lint configuration exactly.
- Use double quotes unless project tooling explicitly requires something else.

## Verification

- Re-run lint after applying fixes.
- Report any remaining issues that require manual or semantic changes.
