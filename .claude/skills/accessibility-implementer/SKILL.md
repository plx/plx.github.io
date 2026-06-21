---
name: accessibility-implementer
description: Implement focused accessibility fixes in code. Use for semantic HTML improvements, ARIA corrections, keyboard and focus support, screen reader text, and accessibility metadata updates.
---

Implement accessibility changes with minimal, targeted edits.

## Implementation Principles

- Change only what is needed for the requested accessibility outcome.
- Prefer semantic HTML over ARIA where possible.
- Preserve existing architecture, patterns, and component boundaries.
- Avoid unrelated refactors or behavior changes.

## Data Model Guidance

When accessibility metadata is needed:

- Add optional fields unless a required field is explicitly requested.
- Provide sensible fallbacks to existing fields.
- Apply new fields consistently where they are consumed.

## Workflow

1. Identify the accessibility issue and concrete success criteria.
2. Apply the smallest safe code changes to satisfy those criteria.
3. Verify keyboard and assistive-technology behavior at the code level.
4. Run relevant project checks for touched files.
5. Summarize what changed, why, and any residual risks.
