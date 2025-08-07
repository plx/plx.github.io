---
title: "Claude Code"
description: "Remarks on working with Claude Code."
---

# Claude Code

These are some notes on working with [Claude Code](https://docs.anthropic.com/en/docs/claude-code/overview); at times these will veer into general thoughts vis-a-vis agentic coding assistants, but in general these will be specific to Claude Code (and will assume some familiarity with it).

- [Claude Code Is Hard To Summarize](#claude-code-is-hard-to-summarize)
- [API Pricing vs Subscription Pricing](#api-pricing-vs-subscription-pricing)
- [Claude Code Is Evolving Fast](#claude-code-is-evolving-fast)
- [Not As Smart As It Seems](#not-as-smart-as-it-seems)
- [One Context Per Task](#one-context-per-task)

## Claude Code Is Hard To Summarize

**BLUF:** Claude Code is hard to summarize because it suffers from the "zombocom" problem: it can do anything, but "it can do anything" isn't a helpful summary; the same is true of agentic coding assistants in general, I suspect.

Perhaps this is an "Anthropic(/vendor) problem", but it still makes it challenging to discuss without prior familiarity (and thus I'll generally be assuming familiarity rather than attempting introductions).

## API Pricing vs Subscription Pricing

**BLUF:** Claude Code's API pricing is *extremely* expensive, but its subscription pricing is *extremely* cheap.

This isn't an original observation, but it's worth repeating: *at time of writing*, using Claude Code via API is orders of magnitude more expensive than doing so via subcription. This isn't hyperbole, either—the subscription service consistently allows you *per-session* token quantities that exceed the monthly cost of the subscription, itself.

As unclear as it is to predict where pricing will eventually settle, but for now the subscription model is incredibly economical.

## Claude Code Is Evolving Fast

**BLUF:** Claude Code is still evolving rapidly day-to-day, and even more so week-to-week; it's hard to keep up, harder to write advice that'll stay relevant, and even harder to justify writing long-form articles (except on big-picture generalities).

For example, as of this writing (July 2025), within a span of—I think—two weeks, Claude Code has gained both (a) hooks and (b) subagents; it's also gained the ability for both subagents and slash commands to specify their model of choice. 

Each of these developments significantly shifts the landscape of "best practices" vis-a-vis Claude Code. Very welcome improvements, but also immediately outmoded a lot of previously-relevant techniques—very challenging to know when to invest in writing lengthier content.

## Not As Smart As It Seems

**BLUF:** Claude Code can be surprisingly intelligent, but it also has non-intuitive, inconsistently-manifesting behavioral gaps—to get really good results you'll want to be much more explicit than you might expect.

For example, asking Claude Code to write tests-for-X is hit-or-miss; for predictable results, you'll want to spell out test-writing procedure in excruciating detail, e.g. "read the code and documentation, figure out how it's intended to work, and then write tests to verify its behavior vis-a-vis that intent". 

Note that tooling can greatly mitigate the *ongoing* burden of being so explicit—the real challenge is mostly in being that explicit (and being *effective* at doing so).

## One Context Per Task

**BLUF:** Claude Code works best with one context per "task"; "compacting" is *almost always* a "usage smell". 

This is controversial, but I think it's correct: `/compact` is narrowly useful in situations like "I've been interactively exploring a new codebase and want to keep going without losing my context", but you should resist the pull of the "jam session"—get in, get it done, and then start fresh.
