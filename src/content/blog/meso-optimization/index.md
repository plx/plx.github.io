---
title: "Meso-Optimization: A Term I'm Inventing Right Now"
cardTitle: "Meso-Optimization: Fake Term, Real Idea"
description: "On the performance work that actually makes your app feel fast (but nobody talks about)"
date: 2025-07-19
draft: false
---

## The Missing Middle of Performance Work

Here's something that's been bothering me: we have great terminology for performance work at the extremes, but there's no agreed-upon shorthand for all the little details that actually makes apps feel fast.

At one end, we have **micro-optimization**—the close-to-the-metal stuff. SIMD instructions, cache line optimization, atomic operations. The kind of work where you stare at assembly output and mutter about pipeline stalls.

At the other end, there's **macro-optimization**—the big architectural decisions. Choosing the right data structure, adding database indices, implementing caching layers. The stuff that shows up in system design interviews.

In between the extremes, there's a whole world of performance work that doesn't have a name. The stuff that's too high-level to be micro-optimization but too implementation-focused to be macro-optimization. The work that makes your app feel snappy, but doesn't show up in any benchmarks. Things like:

- Making sure you don't trigger unnecessary UI updates
- Avoiding those temporary arrays that Swift loves to create
- Prefetching content before users need it
- Not accidentally retaining objects longer than necessary

I'm calling this **meso-optimization**, and yes, I made that term up. Will it catch on? To be frank, I hope not—I'd find it mortifying if I went to a conference and heard someone using it in earnest. But, well, I need a shorthand term—and a tag, once this blog gains tags—and "that middle-ground stuff" just wasn't cutting it. So, yeah, there we are: time for some real talk about **meso-optimization**.

## Why Meso-Optimization Matters (And Why It's Hard)

Meso-optimization has a different focus area from its smaller and larger brethren, but it's not just about the substance—it's also about the process, and the process of meso-optimization is different from the other two:

**Micro and macro-optimization are reactive.** Your profiler screams at you about a hot function. Your database queries are taking 30 seconds. You have a specific villain to defeat. You optimize it, you measure the improvement, you ship it, you're a hero.

**Meso-optimization is proactive.** It's about consistently applying patterns that prevent performance problems from emerging in the first place. It's playing defense across your entire codebase, not just fixing the parts that are currently on fire.

**Micro and macro-optimization are targeted.** That one method is slow. That one component uses too much memory. You focus your energy like a laser on the problem spot.

**Meso-optimization is diffused.** It's everywhere and nowhere. It's making sure every view controller releases properly. It's using lazy sequences consistently. It's death by a thousand cuts, except in reverse—life by a thousand tiny good decisions.

**Micro and macro-optimization are measurable.** "This function is now 70% faster." "Memory usage dropped by 2GB." "Time to first byte improved by 400ms." This is good, I like numbers, graphs, and things you can measure—when you can, you should!

**Meso-optimization is...vibes (laudatory).** The app feels snappier, scrolling feels smoother, users say "it feels better." Can you quantify any of that? *Kinda*, via proxies like TTI and slow frames, but they're just the fingers (metrids) pointing at the moon (immaculate vibes).

## The Craftsmanship Connection

Here's what I've come to believe: micro and macro-optimization are situational skills you deploy when needed. Meso-optimization, on the other hand—that's craftsmanship. It's the accumulated effect of hundreds of small decisions made right. It's what bridges the gap between code that happens to work and code that *feels good to use*.

When someone says an app feels "native" or "polished," they're often responding to good meso-optimization[^1]. It's not that the app has some genius algorithm or hand-tuned assembly, it's that the team cared enough to dot every i, cross every t, and let no cycle go wasted.

[^1]: Many of the best "native apps" aren't even native—there's lots of world-class, incredibly-polished Reactive Native out there.

The frustrating part? This stuff is hard to teach, hard to measure, and incredibly easy to break. One well-meaning refactor can silently undo a meso-optimization, or even several. [Your beautiful lazy sequence chains suddenly become eager](/briefs/lazy-sequences-decay-easily). Your carefully-managed view updates start firing twice. The app still works, all your tests pass, but somehow it doesn't feel quite as good anymore.

## The Point of All This

Why invent terminology for something that's hard to define, harder to measure, and—bluntly—cringe-worthy to use? Because I think we need to talk about it more. 

Too much performance discussion focuses on the extremes—either we're debating whether to use `structs` vs `classes` (micro) or whether to use REST vs GraphQL (macro). Meanwhile, the actual day-to-day performance characteristics of most apps are determined by this unnamed middle layer of decisions.

Meso-optimization isn't the only thing I'll be writing about on this blog, but expect it to be a recurring topic: expect deep dives on patterns that work, traps to avoid, and ways to maintain these optimizations as your codebase evolves. 

None of this stuff is individually earth-shattering, and none of it is going to make anything "10x faster"...but they might just make your apps vibes 10x better.
