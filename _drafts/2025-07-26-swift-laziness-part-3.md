---
layout: post
title: "Lazy Swift Part 3: Accidental Decay"
date: 2025-07-28
description: "Swift's `lazy` can silently decay to eager evaluation."
tags: [swift, functional-programming, performance]
---

**BLUF:** Unusually for Swift, seemingly-innocuous code changes can cause the `lazy` construct to silently decay back to eager evaluation.

## Introduction

In [Part 1](./2025-07-24-swift-laziness-part-1.md), we saw how we can convert an entire functional chain from "eager" to "lazy" evaluation just by prepending a `lazy` to the start of the chain; in [Part 2](./2025-07-25-swift-laziness-part-2.md), we how `lazy` works under the hood, and spotted an intricate, potentially-delicate mechanism.

Here in Part 3, we'll see how this delicacy can lead to "laziness decay": lazy-looking code that *looks* lazy, but isn't.

## Decay Mechanism: Method Resolution

Recall that the core trick behind `lazy` functional chains is a combination of:

- having overloaded methods *available*, e.g.:
  - `Sequence`: `func map<T>(_ transform: (Element) throws -> T) rethrows -> [T]`
  - `LazySequenceProtocol`: `func map<U>(_ transform: @escaping (Element) -> U) -> LazyMapSequence<Elements, U>`
- operating on a `LazySequenceProtocol`-conforming type
- getting Swift's overload-resolution rules to select the (desired) lazy variant

When laziness decays, it's because something in that combination has broken down.

In the rest of this section, I'll illustrate-and-explain three distinct routes to laziness decay:

- [refactoring that moves logic into a generic extension](#refactoring)
- [using throwing functions within a lazy chain](#throwing)
- [mixing lazy and eager operations within the same chain](#mixing-lazy-and-eager-operations)

### Refactoring

Refactoring is an easy route to unintentionally breaking your laziness.

Going back to our example snippet, let's say we decide to do the following:

- to extract "get premium contact info" into a reusable extension
- to place it in a generic extension on `Sequence`

...via something like this:

```swift
extension Sequence<Order> {
    var premiumContactInfo: some Sequence<ContactInfo> {
        self
            .map(\.customer)
            .filter(\.isPremium)
            .map(\.contactInfo)    
    }
}
```

After extracting that logic, we go back and update our call site(s):

```swift
let premiumContactInfo = orders
    .lazy
    .premiumContactInfo
```

At a glance, this still looks lazy—we have `.lazy` at the start of the chain, the rest of our logic is unchanged...but, yep, you guessed it: we're not lazy anymore, in any step of our chain.

#### Why It Breaks

This breaks because we moved our logic into an extension on `Sequence`, which means we only have access to the API on `Sequence`. As such, within that extension the only `map` and `filter` available are the eager ones from `Sequence`, so that's what you get. 

## Throwing

Another route to decay is using throwing functions within a lazy chain. 

For example, let's say that `isPremium` is cached, we really need up-to-date information, and so we're updating our snippet to use a method that's more-appropriate but also throwing: 

```swift
let premiumContactInfo = try orders
    .lazy
    .map(\.customer)
    .filter { try $0.resolveMembershipTier() == .premium } // <- this is now eager
    .map(\.contactInfo) // <- so is this
```

Once again this code still looks lazy, and once again it's not (fully) lazy: every thing after the first throwing call is eager.

#### Why It Breaks

Simple: there's no throwing version of `filter` available on `LazySequenceProtocol`, ergo the only matching method is the eager `filter` from `Sequence`, so that `filter` call will be eager; the subsequent calls are also eager, because now they're no longer being called on `LazySequenceProtocol`-conforming types.

This incompatibility between laziness and throwing-ness is consistent across all of the lazy operations, which makes sense given Swift's error model—there's no way to propagate errors from "inside" a lazy sequence [^1].

[^1]: You can handle errors if you're willing to change the type signature, however—see [Part 5](./2025-07-28-swift-laziness-part-5.md) for further details.

### Mixing Lazy and Eager Operations

Our third-and-final route to "decay" is mixing lazy and eager operations within the same chain; this is particularly easy to do because there are some innocent-looking functional APIs that *do not* have lazy equivalents.

For example, let's say we are interfacing with some legacy system, and learn that we need to always ignore the last element of `orders` (e.g.: it's always some "dummy order", or similar).
We keep our code clean-and-functional via strategic use of `dropLast()`:

```swift
let premiumContactInfo = try orders
    .lazy
    .dropLast()          // <- oops, this is eager 
    .map(\.customer)     // <- also eager
    .filter(\.isPremium) // <- also eager
    .map(\.contactInfo)  // <- also eager
```

As you can see in the comments, this code looks lazy, but isn't.

#### Why It Breaks

This code breaks because `dropLast()` doesn't have a lazy equivalent; this may be a bit unintuitive given that `drop(while:)` and `prefix(while:)` *do* have lazy equivalents, but that's the way it is [^2].

[^2]: AIUI, there's not so much a technical barrier here as there is some semantic ones vis-a-vis pre-iteration and/or having lazy API that's collection-only—perhaps worth a deeper dive at another time.

In addition to `dropLast()`, the other missing lazy operation to be aware of is `reversed()`, which is something of a special case:

- there's an eager `reversed()` on `Sequence` that returns an array
- there's another `reversed()` on `Collection` that returns a `ReversedCollection`
- `ReversedCollection` has a conditional conformance to `LazySequenceProtocol` when its `Base` is a `BidirectionalCollection`

In practice, what this means is that the laziness of `reversed()` winds up being contingent on where and how it's called; a particularly subtle example is that `reversed()` will *never* be lazy when used within extensions on `Collection`.The performance regression was gradual—log volume grew, the eager evaluation got slower, and nobody connected it to the "harmless" refactoring from months earlier.

## Remarks

We've now seen three distinct routes to "decay", each of which fits the following pattern:

- you make a seemingly-innocuous change
- your code still *looks* lazy 
- your code still *compiles*

...except, surprise, the code you intended to be lazy is no longer lazy. 

It's this "silent semantic change" that motivated the entire series: *in general* Swift has achieved admirably-predictable-and-sensible behavior, Swift's design strongly prioritizes "local reasoning", and, generally, Swift code tends to do what it looks like it does.

Even though laziness, itself, is a niche topic, I think it's worth a deeper dive into its mechanical underpinnings solely due to how unusual they are vis-a-vis typical Swift code *and* the rest of the standard library. In fact, I'd go so far as to say that *if* laziness was a central part of day-to-day Swift, *then* the elegant-but-fragile design of these lazy APIs would unambiguously have been a mistake; as it is, its niche-ness means that even if it's suboptimal, it's also not salient-enough, either.

Without further ado, let's move on to our [final section](./2025-07-28-swift-laziness-part-5.md), wherein we discuss ways to protect your use of laziness against unwanted decay.
