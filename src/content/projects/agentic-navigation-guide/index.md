---
title: "Agentic Navigation Guide"
description: "Create-and-maintain navigation guides for coding assistants."
date: "July 31, 2025"
repoURL: "https://github.com/plx/agentic-navigation-guide/"
draft: false
---

## Introduction

My [`agentic-coding-guide`](https://github.com/plx/agentic-navigation-guide/) is a tool for creating-and-maintaining hand-written "navigation guides" for coding assistants like Claude Code.

It's also an intentional, successful experiment in deliberately relying purely on a coding agent (e.g. 100% vibe-coding).

## Background

Coding agents spend *a lot* of time looking for files. Within Claude Code, you'll *see* this directly if you watch what the root agent is doing; you'll also*feel* it, indirectly, whenever Claude farms work out to subagents, since each of those may need to do their own looking-for-files.

Particularly in larger codebases, this file-search time can be an ongoing, noticeable drag on your agents' velocity (and potentially also a source of token-inefficiency). 

One thing that seems to speed things up is including a small, "navigation guide" in the memory file: "here's the basic structure, including what kinds of things are where". The way I've been doing it is as a markdown list, with comments on some lines:

```markdown
- Package.swift
- Sources/ 
  - Primary/ # main library
    - Filter.swift # core filter definition
    - Filters/ # concrete filter implementations
      - ... # one file per filter type
  - TestSupport/ # auxiliary capabilities used while testing
- Tests/
```

This isn't meant to be the whole tree, but it's enough to help the agent know where to look (e.g. "filters live Sources/Primary/Filters/"). 

The challenge with these guides is the obvious one: how do you keep it *accurate* over time?

That's where the tool comes into 

*When accurate*, this really seems to help agents navigate, particularly within larger codebases, but that's also the catch: it might be accurate when you first create it, but will you keep it accurate over time?

That's where this tool comes into play: the `agentic-navigation-guide` understands markdown like the above, and knows how to verify it vis-a-vis the current state of the filesystem.

This verification can be run by itself, but also has dedicated support for being used a hook for Claude Code; when used as a hook, Claude will take responsility to keep the guide in sync vis-a-vis the changes its making.

## Development

This was purely vibe-coded from start to finish (and purely via Opus 4).
I chose Rust because:

- I am familiar-enough with Rust to edit it if necessary
- I know what Rust CLI source "should look like"
- it has a *great* story for cross-platform functionality
- it has a *great* story for distribution and deployment

My vibe-coding process for the initial version was a three-step process:

1. write a detailed specification (in markdown)
2. have Claude translate that into an execution plan
3. have Claude Code implement that plan step-by-step

### Phase 1: Specification

Most of the time was spent on [the initial specification](https://github.com/plx/agentic-navigation-guide/blob/main/Specification.md), which included:

- context for what it was trying to do
- discussion of each subcommand 
- discussion of each option / argument for each subcommand
- detailed breakdown of syntactic and semantic requirements for the navigation guide

### Phase 2 & 3: Implementation

These went pretty smoothly—all I had to do was tell Claude to move on to the next item.

To streamline this work, I used a file called `ContinuingMission.md` and a pair of slash commands:

- an end-of-session command to:
  - copy the previous mission to a `missions/` folder (with a unique name)
  - rewrite `ContinuingMission.md` with instructions for the next session
- a start-of-session command to read `ContinuingMission.md` and resume working

This manual approach kept me in the loop, which made sense for this learning exercise; having said that, it *was* very tedious, and I'd explore further automation strategies if I were going to work on the project for a longer period.

### Subsequent Work

After that initial pass, I went through and had Claude address very minor issues I'd encountered:

- tweaking error messages
- adding the `...` syntax
- fixing some under-specified whitespace rules

Each of these went so straightforwardly I have no real memory (beyond that of having done them, of course).

## Remarks

### Main Challenge: Formalizing The Informal

The main challenge implementing this was in formalizing my informal "agent navigation guides" to an extent sufficient to allow parsing-and-verification. Not too surprising, but—as per usual—there's a lot of edge cases lurking in-between an informal convention and a machine-checkable "format".

### Most Work Was "Thought Work" (Which *Is* Most Of the Work)

How much benefit Claude brought me depends on whether you measure "time to completion", "coding effort", or "mental effort".

For "time to completion", I'd ballpark this as about 10x faster than doing it all myself (assuming a Rust implementation). This is ony a medium-confidence estimate given my current level of Rust knowledge, but still feels approximately correct.

For "coding effort" this was objectively a 100% reduction: I spent *zero time* doing hands-on coding on this project—this really was purely vibe-coded, end-to-end.

For "mental effort", it's very mixed. For *annoyances* like project setup and administrivia, the savings were remarkable—maybe 90%? For the *central functionality*, however, the savings were very light—only about 10-15% (if even that). 

Additionally, the specification-driven development strategy meant that I needed to front-load the entirety of my "thinking things through". All of this mental work would've been necessary either way, but doing it all "up front" is a change of pace—usually I think through the high-level design and then work through the fine details as the process of implementation makes me aware of them.

As such, I'd classify this vibe-coding strategy as more about "time compression" than about "making things easier": I got a result in 2 days instead of 1-2 weeks, at cost of doing *more-intense work* for most of those 2 days.

### Helpful: Self-Verifying

A nice aspect of this project is how particularly self-contained it is: the tool has well-defined behavior and can be run against its own project (etc.); being able to use itself to validate its implementation against its own project really streamlined the process.

## Future Directions

Currently, none: it's a small project that does what I need it to do, and correctly as far as I can tell.

At present, I'd only revisit it if there were some shift in the structure or conventions for memory files.
