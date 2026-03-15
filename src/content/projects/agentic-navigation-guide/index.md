---
title: "Agentic Navigation Guide"
cardTitle: "Keep your CLAUDE.md content accurate."
description: "Keep your CLAUDE.md content accurate."
date: "August 2, 2025"
repoURL: "https://github.com/plx/agentic-navigation-guide/"
draft: true
---

The [`agentic-navigation-guide` project](https://github.com/plx/agentic-navigation-guide/) is a small CLI tool primarily for *maintaining* "navigation guides" for use in memory files like `CLAUDE.md`.
It's also the result of a deliberate, successful experiment in "pure vibe coding"—see [development notes](#development-notes) for discussion on that process.

## Overview

What's a "navigation guide", you ask?

Easy: it's a list of files and folders, with optional comments, that looks about like this:

```md
<agentic-navigation-guide>
- astro.config.js # sitewide astro configuration
- justfile # local development commands
- public/ # static resources, installed to site root
- scripts/ # (project-specific) custom scripts
  - validate-links.js # link validation script
- src/ # source code
  - lib/ # utility libraries
  - components/ # UI components (in .astro files)
  - content/ # content collections (blog, briefs, projects)
    - briefs/ # categorized short notes, one folder per category
    - blog/ # longer-form articles (one folder per post)
    - projects/ # project pages (one folder per project)
  - layouts/ # page layouts
  - pages/ # routes and pages
    - index.astro # site root
  - styles/ # global styles
</agentic-navigation-guide>
```

Maybe *someday* this will be a fancy "standard" with an RFC, a domain name, and all that.
For now, though, it's just a thing I've been using when working with Claude Code in larger repositories.

The *tool*'s primary job is to check the guide against the state of the file-system:

- it parses the content of the `<agentic-navigation-guide>` tag
- it checks if each listed path actually exists
- if the guide mentions non-existent files, it reports useful errors

You can use it yourself (e.g. as a pre-commit hook, etc.), if you like.
You can also set it up as a "hook" for Claude Code, in which case:

- it tells Claude when the navigation guide has become inaccurate
- it gives Claude enough help he can probably fix it himself

You should still check his work, of course, but it's a good start.

## Development Notes

As noted above, I deliberately implemented this purely via vibe coding: I'd *review* Claude's output and offer feedback, but intentionally had Claude write *all the code*.

### Development Process: Primary Implementation

For the *initial* implementation, I used a specification-driven workflow:

1. I hand-wrote [a detailed specification document](https://github.com/plx/agentic-navigation-guide/blob/main/Specification.md)
2. In *plan mode*, I had Opus generate a high-level roadmap with distinct *phases* (and iterated a bit until it was satisfactory)
3. I asked Claude to implement "phase 1" (and just "phase 1")
4. I had Claude write a `ContinuingMission.md` file that:
    - described the work done so far
    - described the work remaining
    - described the immediate "next steps" for the next session
5. I then entered a loop like this:
    - start a fresh session
    - have Claude copy the `ContinuingMission.md` file into a `missions/` folder in the repo (and rename with a timestamp, to make it unique)
    - have Claude read the `ContinuingMission.md` file and take on the next task
    - review the results, offer feedback, and keep Claude iterating until he finished the task
    - have Claude *rewrite* `ContinuingMission.md` to once again:
        - describe the work done so far
        - describe the work remaining
        - describe the immediate "next steps" for the next session
6. I kept repeating that loop until the initial pass on the project was complete

Since this was my first pure vibe-coding experiment, I iteratively improved my workflow as I went:

- initially, I manually copied the `ContinuingMission.md` file and manually typed out the start-of-session and end-of-session prompts
- eventually, I setup slash commands for the start-of-session and end-of-session prompts (and had the prompts include the backup-file operation)

This approach isn't as robust as the fancier "project management" workflows I'd studied prior to this experiment, but it proved effective for this project.
For future projects I'd consider a fancier workflow, but think there's definitely a complexity spike when you go from "all task information is in a single file" to "we have per-task files"—having everything in a single file sidesteps the challenge of updating future tasks in response to discoveries during the current task.

I had given a little thought to what I'd need to do if Claude went haywire during a step, but never had to test those ideas—things basically just "worked out."

### Development Process: Subsequent Refinements

After initial development was done, I used a simpler workflow:

- start a new session
- ask Claude to do what I needed done 
- review the results, and either keep, revise, or reset and try again

This was actually where I found Claude Code to be particularly helpful, because I could offload some tedious research tasks to him, too:

- with Claude: "how do I publish this crate? OK, great, please do that."
- without: google for how to publish, fiddle with this or that, and so on

Experiences like this make me think the commonly-made point that you don't learn when using agents is true, but not the full story: there's a very real cognitive burden to having to learn necessary-but-trivial things, and it's nice to *have the option to be selective*. Longer-term, this points to increasing returns on meta-skills like "learning *when* to learn" (...now that learning is increasingly optional).

### Development Experience: Faster, Not Easier

If you measure time-to-completion, I'd estimate I finished this 7x faster than I would have doing the work myself (including tool-writing time, deepening my knowledge of Rust, and so on). If I wrote Rust on a regular basis I'd guess the speedup factor would be closer to 4x, but that's more-speculative.

So, purely for speed, this was a big win.

If you measure cognitive effort, the picture's a bit more nuanced: the cognitive effort *was* reduced, but it was also *compressed* and *front-loaded*—writing that specification document was *a lot* of work!

Ordinarily, I use a process like this:

- think it through *enough* to feel confident about my general approach
- begin with the bits for which I feel most confident
- use the insight gained from implementing the "easy bits" to help think through the "harder bits"

Generally this works well for me, and has the benefit of alternating between mentally-taxing "thinking" and comparatively-easy "coding".

For this project, however, writing the spec required that I do essentially all the thinking-through at the beginning (and without the benefit of learning from the implementation). This changed the overall process to something more like:

- mentally-taxing: thinking it through *fully* before writing any code
- chill-and-easy: supervising Claude through the implementation

I don't have a deeper conclusion or grand theory about this, but it's interesting.

### Development Process: Claude Is Pretty Resourceful

One minor surprise was how "resourceful" Claude turned out to be with this project.

The particular thing that stuck out was that Claude figured out how to write unit tests that created temporary files and then checked "agentic navigation guides" against them. This approach makes a lot of sense, and it was a little uncanny seeing Claude reach for it on his own.

It rhymes with another case from a project I haven't (yet) written up: I'd asked Claude to match the behavior of a system with existing python and javascript implementations, and watched as it autonomously decided to write dozens of little "tester" programs to identify exactly how those other implementations handled each edge case. Agentic assistants remain very jagged intelligences, but at least for Claude the "learn by conducting experiments" capability seems very well-developed.
