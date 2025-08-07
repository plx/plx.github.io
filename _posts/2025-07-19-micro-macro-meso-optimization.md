---
layout: post
title: "The Importance of \"Meso Optimization\""
date: 2025-07-19
description: "A look at *meso-optimization*: optimizations that sit in-between close-to-the-machine *micro-optimization* and system-design-level *macro-optimization*."
tags: [optimization, meso-optimization, swift, performance] 
---

## Defining *Meso-Optimization*

**BLUF:** *meso-optimization* has an outsized impact on application quality, but can challenging to measure; this makes it challenging to implement and challenging to maintain.

In this blog I'll be talking a lot about *meso-optimizations*: "optimizations" that are higher-level than close-to-the-machine *micro-optimization* and lower-level than system-design-level *macro-optimization*; to jog your intuition:

- *micro-optimization*: SIMD and vectorization, atomics, platform intrinsics, etc.
- *macro-optimization*: algorithm and data-structure choices, database indices, caching, etc.
- *meso-optimization*: minimizing redundant ui updates, prefetching pending content, avoiding transient allocations, etc.

In addition to the different focus, I think the practice of *meso-optimization* differs substantially from the other two:

- *reactive* vs *proactive*:
  - *micro-optimization* and *macro-optimization* are performed *reactively*: "we identified-and-addressed a specific performance bottleneck"
  - *meso-optimization* is performed *proactively*: "we consistently applied a set of best practices and consistently avoided known performance anti-patterns"
- *targeted* vs *diffused*:
  - *micro-optimization* and *macro-optimization* are typically *targeting* a specific bottleneck (a slow method, a slow component, etc.)
  - *meso-optimization* is typically diffused throughout the codebase (e.g. "we consistently uses patterns that minimize redundant UI updates")
- *verifiable* vs *vibe(-ish)*:
  - *micro-optimization* and *macro-optimization* are typically *verifiable*: "$function takes 30% of the original time, $component uses 70% less memory, TTI is 200ms faster..."
  - *meso-optimization* is typically *vibe(-ish)*: "the app feels snappier, I don't notice as much jank while scrolling, ..."

In fact, I think it's helpful to treat these differences not as *descriptive* but as *definitive*: the substance of *meso-optimization* consists of the performance-aware decisions you *should* be making proactively, as you write your code. Building on this, I think it's correct to consider *meso-optimization* as a portion of a larger notion of *software craftsmanship*, whereas the other two are simply situationally-relevant skills.

In any case, that's what I mean by *meso-optimization*, and it's something I'll be talking about a lot in future articles. Most of these articles will focus on *meso-optimization* within the context of native mobile application development, but I think the concept itself generalizes beyond this context.

The remainder of this article are some unstructured brief notes on aspects of *meso-optimization*—consider them IOUs for potential future articles.
If you're looking for code samples, I have to apologize in advance—future articles will have plenty, but there's none to be had here—it's just a topic overview.

## General Remarks

### Core/Platform Teams Should Prioritize *Meso-Optimization* 

Teams maintaining in-house core/foundational libraries have a lot of concerns on their plate: performance, correctness, accessibility, security, localization, developer ergonomics, reliability, design systems, fitness-for-purpose—it's a lot!

Having said that, I think *meso-optimization* should be a top priority for core/platform teams, and in two distinct ways:

1. core/foundational components should, of course, have internals that are thoroughly *meso-optimized*
2. core/foundational components should have APIs designed to preclude anti-patterns to the greatest extent possible

Although both of these overlap with common advice like "be performant" and "design good APIs", I think considering *meso-optimization* yields a distinct perspective, but it'll take a future article to unpack that view.

### SwiftUI Makes Meso-Optimization More-Salient

Within user-interface code, most *meso-optimization* is some combination of:

- avoiding redundant UI updates: layouts, redraws, rebuilds (etc.)
- keeping intensive work away from the UI: caching data and calculations, using off-main work, etc.
- matching resources to UI: context-appropriate (thumbnail) image size(s), etc.
- decoupling UI from state changes: context-appropriate prefetching, starting network requests "early", etc.

SwiftUI's reactive-and-declarative paradigm greatly simplifies writing *correctly-behaving* UI code, but—counterintuitively—both increases the risk of falling into a performance trap *and* reduces the size-and-scope of your toolkit for getting yourself back out again. A deep dive would require a separate article, but I think [this recent article from AirBnB](https://medium.com/airbnb-engineering/understanding-and-improving-swiftui-performance-37b77ac61896) conveys the general flavor: it took a nontrivial effort to make the implicit behavior easily-visible, and then required a large-scale codebase update to address[^1].

[^1]: The large-scale update involved adopting equatability for all of their views, which was done via some macros; IMHO this is a rare case study of retroactively applying a *meso-optimization* across an entire codebase, and thus deserves a closer look in the future.

### *Meso-Optimization* Is Hard To Measure 

As a general rule, I think it's fairly self-evident that most individual *meso-optimizations* are challenging to measure under realistic circumstances[^2].

At a more conceptual level, however, the real challenge with measuring the absence of *meso-optimization* is that it's *diffuse*: the application is running "fine, but maybe a bit laggy", and your overall performance profile may even look "flat"—there's no single "hot path" to focus on. Aside from making it challenging to investigate, it's also an epistemological challenge: it's hard to assess how what you're seeing relates to what you could be seeing.

One of my *untested* theses is that you can use the energy profiling tools as a proxy for overall "*meso-optimality*"—this will take research to verify, and an article to unpack. In the interim, the available proxies are things like TTI, slow frames, hangs, and so on—informative, but only indirectly, and with some challenges around interpretation.

[^2]: The challenge isn't so much "can you measure?"—you can!—but "can you obtain measurements of the impact on our actual application?"

### AI Reviewers Can Help

*In general*, I think enforcing *meso-optimizations* is challenging for linters and other static analysis tools because they're mostly about applying appropriate design patterns; it's easy to lint for things like "use `modernBar`, not the deprecated `originalBar`", but it's a lot harder to, say, lint for "did you use track the difference between current and intended state, and then coalesce your pending updates into a single batch?" 

Or at least it *was* harder, but maybe not any more: I am quite optimistic that narrow-purpose AI reviewers will be able to help enforce the previously-unenforceable—the main challenge here is just (a) getting the prompting right and (b) accepting the expense. Unpacking this is another topic for a future article.

As such, trying to keep the codebase *meso-optimized* largely required lots of diligent human attention: in-house libraries, educational efforts, code review, and so on; CI could catch egregious regressions, but not really the more-granular stuff I've been calling *meso-optimization*.
