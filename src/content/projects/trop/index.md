---
title: "trop"
description: "Idempotent local port-reservation tool."
date: 2025-10-18
demoURL: "https://plx.github.io"
repoURL: "https://github.com/plx/trop/"
draft: false
---

`trop` is a CLI tool that acts as a "reservation manager" for port numbers.
Reservations are tied to file-system paths, which has several benefits:

- `trop` is idempotent, and will return sticky/stable ports when invoked with the same path
- `trop` can automatically cleanup reservations tied to no-longer-existent paths

The intended use case was as a drop-in replacement for hard-coded port numbers in project automation scripts, e.g.:

```bash
# before
my-server --port 8080

# after
my-server --port $(trop reserve)
```

## Origin Story

The *motivation* for this tool was to streamline the "simultaneous agents in multiple worktrees"-style workflows, e.g. wherein:

- you have multiple claude code instances operating concurrently
- each instance is working on a distinct task 
- each instance is working within a distinct worktree

`trop` exists because using that workflow with *small-and-simple* projects can easily lead to port collisions.
For example, envision this scenario:

- you're working on a static website
- the project has a "preview" command that launches a local server
- for convenience, the "preview" command hardcodes a specific port number (e.g. `4040`)
- you start using "simultaneous agents in multiple worktrees":
  - agent 1 is working on adding tagging support
  - agent 2 is fixing a layout bug
  - agent 3 is adding no-follow links
  - agent 4 is improving the CSS adaptivity
- each agent is trying to assess its own work by:
  - launching the preview server
  - using the playwright-mcp to QA its changes

Easy to see how things could go sideways here: in the best outcome, agent burns tokens figuring out there's a collision then successfully working around it; in the worst outcome, the agents *don't* notice the issue, and proceed to get each other very, very confused.

`trop` exists to address this specific problem, and its design choices reflect that:

- the path-based system plays nicely with worktrees and multi-agent workflows
- it has a concept of "reservation groups" for recurring reservation-patterns, suitable for use in worktree-setup scripts
- its built-in defaults for the optional `project` and `task` metadata map to the "repo" and "worktree", respectively
- the path-based cleanup makes it easy to (eventually) prune reservations for finished worktrees—no need for custom scripts or hooks

Note that `trop` is purely a local system, and is very much *not* meant to handle large-and-complex scenarios—you won't need `trop` if you're already using kubernetes.
It's also not meant to handle the even-more-advanced practice of having multiple concurrent agents in the same worktree—`trop`'s design is only intended for the "one agent per worktree" strategy.

## Implementation Remarks

The CLI is implemented in Rust, and uses SQLite for two distinct purposes:

- persistence: a sqlite db contains the central "reservation store"
- synchronization: `trop` uses SQLite's built-in support for cross-process locking to synchronize between concurrent invocations

Internally the project is structured as a library with a (thin) CLI wrapper. It also extensively uses the plan-execute design pattern internally, wherein most operations are structured as a two-step process:

- a "plan" phase, wherein it prepares a "plan" *describing* the actions to be taken
- an "execute" phase, wherein it executes the "plan" prepared during the previous phase

This pattern *greatly* increases testability, and has additional side benefits (e.g. easy, robust, and consistent support for "dry-run" mode). On that note, the test suite is *quite* extensive, and includes a mix of unit tests, integration tests, end-to-end tests, and property-based tests.

## Implementation Strategy

I treated this project as another "vibe-coding experiment", with a couple meta-goals; my desired workflow was:

- spend a lot of time on the specification
- have Claude decompose it into a phased implementation plan
- have Claude Code write *all* the code
- operate Claude Code in a "high-autonomy, hands-off" mode

In other words, I would *ideally* have been able to tell Claude "go implement phase 07" and then let Claude run attended until it opened a PR for "phase 07"; for this approach to work, the code Claude wrote would obviously also need to adhere to the spec and be fit-for-purpose.

I'll save a detailed summary of my strategies for a separate article, but I'll give you some early takeaways now:

1. The workflow I came up with worked surprisingly well, but "go do phase 07" was too large for a single session. As such, I had to manually "puppet" Claude through the major workflow steps, although that was thankfully low-effort for me since each step was encapsulated into a custom slash command. To get that truly hands-off experience I would need to run Claude through an orchestration wrapper—will explore that another time.
2. Relying on Claude to review Claude's work worked reasonably well, but with one troubling pattern: in some cases where the task seemed *too complex* for Claude to understand while implementing, it'd still pass "review", too. My *suspicion* here is that "if it's too complex for Claude to code, it's also too complex for the *reviewer* to understand"; this deserves a dedicated article.
3. Towards the end I had to bring in ChatGPT's Codex, which proved *invaluable*. Another "needs an article" topic, but the highlights are:
    - Claude is like an artificial, highly-steerable "team member"
    - Codex is more like an "oracle": consistently provides correct answers to challenging tasks, but isn't as (obviously) steerable (TBD)

Despite having to undertake a few significant interventions, my overall experience is very positive!

Overall, I'd say that we're closer than I thought to being able to write a detailed spec and have coding agents diligently implement it (and implement it *correctly*, at that).
We may even be at that point, in fact, if your skill level is high enough and your strategy is sufficiently sophisticated.

As a final remark—just to put some concrete measurements on the table—I'd ballpark this project as just about 1 week of end-to-end, full-time work. 
It's hard to be too precise because I was doing this in-between other things, but to the best of my recollection:

- 2 full days spent writing-and-revising the specification
- 1 full day spent on getting the "Claude infrastructure in place"
- 2 full days of actual Claude Code "coding time" (if I just let it run in yolo mode)

Worst-case, add another day (total) to account for the various times I had to intervene and correct Claude's direction.

## Future Directions

Currently, none other than bug fixes: the project is "done" in the sense that it solves the problem I set out to solve, and feels feature-complete vis-a-vis my actual-and-foreseeable needs.
