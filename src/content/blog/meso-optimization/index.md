---
title: "The Importance of \"Meso Optimization\""
description: "A look at *meso-optimization*: optimizations that sit in-between close-to-the-machine *micro-optimization* and system-design-level *macro-optimization*."
date: 2025-07-19
draft: false
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

