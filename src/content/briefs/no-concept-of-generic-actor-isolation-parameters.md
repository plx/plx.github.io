---
title: "Swift Cannot Express Generic Actor Isolation Parameters"
cardTitle: "You Cannot Express Generic Actor Isolation Parameters"
description: "Swift lets you write `@MainActor` and `@SomeOtherActor`, but not `@'A`, where `A` is a generic actor parameter."
category: "Swift Wart"
date: "2025-07-20"
---

Swift's statically-checked actor-confinement concepts like `@MainActor` are great, but there's no way to do generic actor confinement (e.g. no analog to Rust's generic lifetime parameters). 

Despite being a very niche requirement, its absence is still very much a wart: there's a lot of optimizations and simplifications you can make when you know a type *will* be isolated to a single actor, and it's unfortunate the only way to take advantage of those is to "lock in" to a specific choice of global actor.

For a concrete example, refer to [this brief](https://github.com/plx/swift-briefs/blob/main/content/briefs/sendable-custom-cow-and-lazy-cached-properties.md) on COW types, transparent caching, and how they interact with strict concurrency.
