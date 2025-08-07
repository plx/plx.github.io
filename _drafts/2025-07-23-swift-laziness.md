---
layout: post
title: "Lazy Swift: Series Overview"
date: 2025-07-24
description: "A five-part series on the Swift standard library's lazy-evaluation capabilities."
tags: [swift, functional-programming, performance, series, lazy-swift]
---

This is a five-part series on the Swift standard library's lazy-evaluation capabilities; the individual posts are:

1. [Lazy Swift Part 1: Functional Chains, Intermediate Values, And You](./2025-07-24-swift-laziness-part-1.md)
2. [Lazy Swift Part 2: `.lazy`, `LazySequenceProtocol`, And All That](./2025-07-25-swift-laziness-part-2.md)
3. [Lazy Swift Part 3: When Laziness "Decays"](./2025-07-26-swift-laziness-part-3.md)
4. [Lazy Swift Part 4: Why Laziness "Decays"](./2025-07-27-swift-laziness-part-4.md)
5. [Lazy Swift Part 5: Preventing Laziness Decay](./2025-07-28-swift-laziness-part-5.md)

## Series Overview

The motivation for this series is specifically to discuss the "decay" phenomenon, because it's a potential source of "spooky action at a distance" in your codebase: code *over here* starts behaving differently due to code changes *over somewhere else*. 

Not an unusual phenomenon in, say, C++, but very unusual for Swift—the langauge and its standard libraries place a tremendous emphasis on preserving the ability to perform "local reasoning", which makes exceptions like lazy all the more exceptional.

To illustrate the issue, throughout the series we'll keep referring to the following snippet as a concrete example of a "functional chain":

```swift
let premiumContactInfo = orders
    .map(\.customer)
    .filter(\.isPremium)
    .map(\.contactInfo)    
```

In [Part 1](./2025-07-24-swift-laziness-part-1.md), we'll see how these can be resource-inefficient, and introduce the use of `lazy` to mitigate that resource-inefficiency.

In [Part 2](./2025-07-25-swift-laziness-part-2.md), we'll do a deeper dive into how `lazy` works under the hood.

In [Part 3](./2025-07-26-swift-laziness-part-3.md), we'll start exploring the phenomenon of "laziness decay", and discuss some common scenarios where this can happen.

In [Part 4](./2025-07-27-swift-laziness-part-4.md), we'll continue exploring the phenomenon of "laziness decay", and identify the reasons for "laziness decay".

Finally, in [Part 5](./2025-07-28-swift-laziness-part-5.md), we'll explore strategies you can adopt in order to protect your use of laziness from unintentional decay.

If you're already familiar with lazy evaluation in Swift, you can skip ahead to [Part 3](./2025-07-26-swift-laziness-part-3.md), which is where we start discussing the "decay" phenomenon motivating the series.

If you're unfamiliar with lazy evaluation in Swift, however, I'd recommend starting with [Part 1](./2025-07-24-swift-laziness-part-1.md), and then continuing on from there.
