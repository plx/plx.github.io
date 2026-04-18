---
name: web-qa-playwright
description: Run browser-based QA with Playwright for layout, responsiveness, navigation, and interaction quality. Use after UI/content/style changes and before release verification.
disable-model-invocation: true
argument-hint: "[url or scope]"
---

Execute a focused Playwright QA pass and report findings clearly.

## Scope

- Treat `$ARGUMENTS` as the primary target when provided (URL, route, or feature).
- Otherwise test the most relevant pages affected by recent changes.

## Test Pass

1. Validate layout and visual consistency.
2. Test key interactions (links, buttons, forms, menus).
3. Check responsive behavior on mobile and desktop viewports.
4. Confirm there are no obvious console/runtime errors in tested flows.
5. Capture screenshots for failures or visual regressions.

## Report Format

1. Summary and scope.
2. Findings by severity (`critical`, `major`, `minor`, `cosmetic`).
3. Reproduction steps per issue.
4. Suggested fixes or next checks.
5. Coverage and known limitations.
