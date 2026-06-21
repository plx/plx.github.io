---
name: accessibility-auditor
description: Audit accessibility and provide prioritized recommendations with tradeoffs. Use for WCAG and ARIA reviews, semantic HTML analysis, keyboard and screen reader checks, and post-fix verification.
---

Perform an accessibility audit and return actionable guidance.

## Scope

- Treat `$ARGUMENTS` as the primary scope when present.
- If scope is unclear, start with the smallest relevant surface area, then expand only when needed.

## Audit Checklist

- Keyboard navigation, focus order, and visible focus states.
- Semantic HTML and heading/landmark structure.
- Form labels, instructions, and error communication.
- ARIA role, state, and property correctness.
- Screen reader name/role/value quality and announcements.
- Color contrast and non-color affordances.
- Mobile/touch accessibility and target sizing.
- Cognitive load and interaction clarity.

## Output

Return sections in this order:

1. Current state summary.
2. Findings by severity (`critical`, `major`, `minor`) with impacted files or UI areas.
3. Solution options with tradeoffs (`quick`, `balanced`, `comprehensive`).
4. Recommended path and rationale.
5. Verification checklist.

Do not implement code changes unless explicitly requested.
