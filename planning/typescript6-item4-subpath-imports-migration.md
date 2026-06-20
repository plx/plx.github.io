# Mini-Spec: Migrate TS Path Aliases from `@*` to `#/*` (TypeScript 6)

## Context

This project currently uses a TypeScript path alias pattern based on `@*` in `tsconfig.json`, with imports like `@components/Container.astro`.

TypeScript 6.0 adds support for Node subpath imports starting with `#/` under modern module resolution modes (notably `bundler` and `nodenext`).

This migration standardizes import aliasing on the `#/*` convention so TypeScript, runtime tooling, and ecosystem behavior stay aligned going into TypeScript 7.

## Goals

- Replace internal `@...` import aliases with `#/...` across source files.
- Configure `package.json#imports` to define the alias at runtime/tooling level.
- Update TypeScript path mapping to match `#/*`.
- Preserve existing behavior (no functional app changes).

## Non-Goals

- No content changes.
- No routing changes.
- No refactors unrelated to module resolution.
- No runtime feature or dependency upgrades beyond what is required for alias resolution.

## Scope

In scope:

- `tsconfig.json` path mapping for aliases.
- `package.json` `imports` field.
- All internal source imports that currently use `@...`.
- Validation scripts/build/test commands to ensure alias resolution remains correct.

Out of scope:

- External dependency import style.
- Renaming directories or moving files.

## Current State

- Alias is configured in TypeScript via:
  - `compilerOptions.paths`: `"@*": ["./src/*"]`
- Many source files import through `@...` aliases.
- Module resolution is already modern (`bundler` via Astro strict config), which is compatible with TS 6 support for `#/` subpath imports.

## Target State

- Imports use `#/...` for internal source paths.
- `package.json` defines:

```json
{
  "imports": {
    "#/*": "./src/*"
  }
}
```

- `tsconfig.json` defines equivalent `paths` mapping for editor/type-check alignment.
- Build, checks, and tests pass with no runtime resolution regressions.

## Design

### Configuration

1. Add `imports` mapping in `package.json` for `#/* -> ./src/*`.
2. Update `tsconfig.json` `paths` from `@*` to `#/*` (or equivalent explicit mapping).

### Code Migration

1. Bulk-rewrite imports from:
   - `from "@..."` to `from "#/..."`
2. Verify no remaining `@...` aliases in source/config.

### Validation

Run at minimum:

- `npm run lint`
- `npm run build`
- `npm run validate:links`
- `npm run qa` (if Playwright/browser availability is present)

## Risks and Mitigations

### Risk: Incomplete import rewrite

- Mitigation: grep-based verification for remaining `from "@` occurrences.

### Risk: Tooling mismatch (`imports` vs `paths`)

- Mitigation: keep `package.json#imports` and `tsconfig.json#paths` in lockstep; validate via `tsc -p` and `astro check`/build.

### Risk: Runtime resolution differences in scripts/tests

- Mitigation: validate build and node-executed paths; avoid aliasing in places not covered by configured resolution.

## Rollout Plan

1. Add config changes (`package.json`, `tsconfig.json`).
2. Rewrite imports in source files.
3. Run full validation.
4. Merge as one focused PR/commit series.

## Rollback Plan

If any critical resolution issue appears:

1. Revert migration commit(s).
2. Restore previous alias mappings and import forms.
3. Re-run baseline validation.

## Acceptance Criteria

- No source files import internal modules via `@...` aliases.
- `package.json#imports` contains `#/*` mapping.
- `tsconfig` path mapping resolves `#/*`.
- `npm run build` passes.
- Link validation and lint pass.
- No observable behavior change in generated site output.

## Estimated Effort

- Implementation: ~1-2 hours
- Validation/fixes: ~30-60 minutes

## Suggested Commit Strategy

- Commit 1: config updates (`package.json`, `tsconfig.json`)
- Commit 2: bulk import rewrite
- Commit 3: any follow-up fixes from validation
