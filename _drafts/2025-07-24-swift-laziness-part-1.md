---
layout: post
title: "Lazy Swift Part I: Functional Chains, Intermediate Values, And You"
date: 2025-07-24
description: "Functional chains in Swift are convenient and elegant, but can be surprisingly inefficient."
tags: [swift, lazy-swift, functional-programming, performance, meso-optimization]
---

**BLUF:** Swift's functional APIs create intermediate arrays, which make longer "functional chains" resource-inefficient.

This is the first article in a five-part series on the Swift standard library's lazy-evaluation capabilities; the individual posts are:

1. [Lazy Swift Part I: Functional Chains, Intermediate Values, And You](./2025-07-24-swift-laziness-part-1.md)
2. [Lazy Swift Part II: `.lazy`, `LazySequenceProtocol`, And All That](./2025-07-25-swift-laziness-part-2.md)
3. [Lazy Swift Part III: When Laziness "Decays"](./2025-07-26-swift-laziness-part-3.md)
4. [Lazy Swift Part IV: Why Laziness "Decays"](./2025-07-27-swift-laziness-part-4.md)
5. [Lazy Swift Part V: Preventing Laziness Decay](./2025-07-28-swift-laziness-part-5.md)

## Introduction

In this series we'll be talking about "functional chains" like this:

```swift
let premiumContactInfo = orders
    .map(\.customer)
    .filter(\.isPremium)
    .map(\.contactInfo)    
```

Code like the above is concise, readable, and Swifty; the semantic intent is clear, and the tedious mechanical details of iteration have been abstracted away.

## The Problem: Intermediate Values

Unfortunately, however, the elegance of the code above belies a hidden cost: each call in the chain allocates a new intermediate array. For example, here's how that might play out in the snippet above:

```swift
let premiumContactInfo = orders      // Say this has 10,000 orders
    .map(\.customer)                 // Creates array #1: 10,000 customers
    .filter(\.isPremium)             // Creates array #2: 1,000 premium customers  
    .map(\.contactInfo)              // Creates array #3: 1,000 contact infos
```

If nothing else, that means that functional chains have the risk of being *resource inefficient*: you're allocating a lot of memory to hold intermediate values, and then throwing them away shortly thereafter; in most cases the scale will be too small to matter, but occasionally it can be sigificant—especially when you're dealing with large datasets *or* inside tight loops. 

## The Easy Solution: Lazy Evaluation

Fortunately, Swift offers a powerful but underused feature: lazy sequences. By adding a single call to the start of our chain, we can eliminate those intermediate arrays:

```swift
let premiumContactInfo = orders
    .lazy                 // wrapper struct
    .map(\.customer)      // no new intermediate
    .filter(\.isPremium)  // no new intermediate
    .map(\.contactInfo)   // no new array, either  
```

When you insert a call to `lazy` into a chain like this, it makes the chain "lazy", which means that the work is only done when you iterate through the final result. We'll go into the details of how this works in [Part 2](./2025-07-25-swift-laziness-part-2.md), but to sketch of `map` and `lazy.map` below convey the core idea:

```swift
// `map` returns an array, and is basically this
func map<T>(_ transform: (Element) throws -> T) rethrows -> [T] {
    var result: [T] = []
    result.reserveCapacity(count)
    // eagerly transform each element
    for element in self {
        result.append(try transform(element))
    }
    return result
}

// `lazy.map` winds up returning a wrapper that's basically this:
struct LazyMapSequence<Base: Sequence, Element> {
    // wrap the "original" sequence
    let base: Base

    // store the transform function
    let transform: (Base.Element) -> Element

    // perform the transformation "on-demand",
    // whenever we access an element
    subscript(index: Int) -> Element {
        transform(base[index])
    }

    // other Sequence conformance elided, etc.
}
```

## A Word Of Caution: Don't `lazy` All The Things!

When used judiciously, `lazy` provides an easy way to migrate a functional chain from eager to lazy evaluation—just add `lazy` and, well, now your chain is lazy.

However, it'd be a mistake to add `lazy` to *every* functional chain, and perhaps even to most—using laziness gains resource efficiency at the cost of some time inefficiency. As such, selectively is not at all a "silver bullet" (or even a default choice)—it's just another tool to keep in your toolbox.
