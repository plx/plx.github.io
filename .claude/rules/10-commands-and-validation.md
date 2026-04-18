# Commands And Validation

Use `justfile` as the first source of truth for common project workflows.

## Core Commands

- `just install`: install dependencies with `npm ci`.
- `just preview`: start dev server (managed by `trop` with automatic port allocation).
- `just shutdown`: stop dev server started by `just preview`.
- `just build`: produce production build in `dist/`.
- `just lint`: run ESLint checks.
- `just lint-fix`: apply auto-fixable lint updates.
- `just spellcheck`: spellcheck source files.
- `just spellcheck-html`: spellcheck generated HTML.
- `just validate`: run full validation pipeline (lint + spellcheck + build + links).

## Validation Expectations

- Run the most targeted checks that cover your changed files.
- Run broader validation before finalizing high-risk or broad changes.
