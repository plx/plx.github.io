---
layout: post
title: "Lazy Swift Part II: `lazy`, `LazySequenceProtocol`, And All That"
date: 2025-07-25
description: "How `lazy`, `LazySequenceProtocol`, And All That Actually Work"
tags: [swift, lazy-swift, functional-programming, performance, meso-optimization]
---

**BLUF:** `lazy` converts entire chains to lazy evaluation via an intricate combination of wrapper structs, protocol refinement, and method overloading.

## Introduction

In [Part 1](./2025-07-24-swift-laziness-part-1.md), we saw how we can convert an entire functional chain from "eager" to "lazy" evaluation just by prepending a `lazy` to the start of the chain:

```swift
// eager original:
let premiumContactInfo = orders
    .map(\.customer)
    .filter(\.isPremium)
    .map(\.contactInfo)    

// now it's lazy:
let premiumContactInfo = orders
    .lazy
    .map(\.customer)
    .filter(\.isPremium)
    .map(\.contactInfo)
```

What makes this particularly curious is that the standard `map` and `filter` are defined in the `Sequence` protocol, both of which explicitly return arrays:

- `func map<T>(_ transform: (Element) throws -> T) rethrows -> [T]`
- `func filter(_ predicate: (Element) throws -> Bool) rethrows -> [T]`

So, then, how does this "lazification" actually work?

## How `lazy` Makes A Chain Lazy

The tl;dr is that `lazy` relies on all of the following working together:

- a `LazySequenceProtocol` refining `Sequence`
- a family of ``LazySequenceProtocol`-conforming sequence-wrapper types
- `LazySequenceProtocol`'s "alternative" methods returning lazy sequences
- `lazy` returns a `LazySequenceProtocol`-conforming wrapper type around `self`
- Swift's overload resolution favoring "less-general" methods over "more-general" methods

Let's go through each of these "puzzle pieces" before seeing how they fit together.

### `LazySequenceProtocol` Refines `Sequence`

The Swift standard library defines a [`LazySequenceProtocol`](https://developer.apple.com/documentation/swift/lazysequenceprotocol) that refines [`Sequence`](https://developer.apple.com/documentation/swift/sequence) like so:

```swift
protocol LazySequenceProtocol: Sequence {
    // not relevant to our discussion, but included for completenss
    associatedtype Elements: Sequence where Elements.Element == Element
    var elements: Elements { get }
}
```

Since all `LazySequenceProtocol` types are also `Sequence`s, they can be used in any context that expects a `Sequence`; they also inherit the complete API from `Sequence`, including the functional methods like `map`, `filter`, `compactMap`, and so on.

### A Family of Lazy Sequence Wrapper Types

The Swift standard library defines a family of types that conform to `LazySequenceProtocol` and wrap a base `Sequence`:

- `LazySequence`: a nearly-"transparent" wrapper that adds nothing beyond the `LazySequenceProtocol` conformance
- `LazyMapSequence`: a wrapper that applies a transformation to each element on-demand
- `LazyFilterSequence`: a wrapper that applies a predicate to each element on-demand

...(and similar wrappers for `compactMap`, `drop(while:)`, `prefix(while:)`, etc.).

### `LazySequenceProtocol`'s "Alternative" Methods

In an extension on `LazySequenceProtocol`, the standard library defines alternative, "lazy" versions of the standard functional APIs. Here's the alternative `map` (the others are broadly similar):

```swift
extension LazySequenceProtocol {
    // the original, from Sequence, here for comparison:Sequence: 
    // func map<T>(_ transform: (Element) throws -> T) rethrows -> [T]
    func map<U>(_ transform: @escaping (Elements.Element) -> U) -> LazyMapSequence<Self.Elements, U>
}
```

### `lazy` Returns a `LazySequenceProtocol`-Conforming Wrapper

The `Sequence` protocol defines a `lazy` property, and that property returns a `LazySequenceProtocol`-conforming wrapper around `self`, essentially like this [^1]:

```swift
extension Sequence {

    var lazy: LazySequence<Self> {
        LazySequence(self)
    }

}
```

[^1]: `LazySequence` does not have a public `init`, but this is conceptually accurate.

### Swift's Overload Resolution Rules

The last piece of the puzzle is Swift's method overload resolution rules. 
These are regrettably a bit under-explained in the language documentation, but the general rule is that *all else being equal*, Swift will favor "less-general" methods over "more-general" ones.

We'll touch on this more-directly during our step-by-step breakdown—let's just continue on to that.

## Step-By-Step Breakdown

Now that we have the puzzle pieces ready, let's break down what actually happens within our functional chain.

### Eager Version

As a warm-up, here's how the eager version "breaks down" step-by-step:

```swift
// we're calling `Sequence.map` (on an array), so we get an array
let customers: [Customer] = orders.map(\.customer)                        

// we're calling `Sequence.filter` (on an array), so we get an array
let premiumCustomers: [Customer] = customers.filter(\.isPremium)

// we're calling `Sequence.map` (on an array), so we get an array
let premiumContactInfo: [ContactInfo] = premiumCustomers.map(\.contactInfo)
```

Hopefully nothing too surprising in there.

### Lazy Version

Now let's do the lazy version, once again going step-by-step.

#### Initial `.lazy` Call

The initial call to `lazy` returns a `LazySequenceProtocol`-conforming wrapper type around `orders`:

```swift
// calling `Sequence.lazy` gives us `LazySequence<[Order]>`
let lazyOrders: LazySequence<[Order]> = orders.lazy
```

#### First `.map` Call

This is the first call where things get interesting. 
Just looking at the source, you might expect ambiguity here: 

- the source just says `orders.lazy.map(...)`
- `map` is called on `LazySequence<[Order]>`, which has two `map` methods (`Sequence.map` *and* `LazySequenceProtocol.map`)
- either method could work in this context

This is where Swift's overload resolution rules come into play, however: per those rules, Swift deems `LazySequenceProtocol.map` unambiguously "less general" than `Sequence.map`, and thus chooses it over `Sequence.map`.

As such, we wind up proceeding with the lazy version:

```swift
// calling `Sequence.lazy` gives us `LazySequence<[Order]>`
let orders: LazySequence<[Order]> = orders.lazy

// as per the above, the lazy version of map "wins", leaving us with this
let customers: LazyMapSequence<LazySequence<[Order]>, Customer> = orders.map(\.customer)
```

#### Remaining Calls

The same method-overload rules wind up applying to the remaining calls in our chain.

Our call to `filter` is made on a `LazyMapSequence`, which is a `LazySequenceProtocol`-conforming type, so we wind up calling `LazySequenceProtocol.ftiler`, which returns another `LazySequenceProtocol`-conforming type (`LazyFilterSequence`, this time).

Our second call to `map` is made on that `LazyFilterSequence`, which is also "lazy", so once again the "lazy" `map` wins...

This leads to our fully-expanded lazy chain:

```swift
// calling `Sequence.lazy` gives us `LazySequence<[Order]>`
let orders: LazySequence<[Order]> = orders.lazy

// as per the above, the lazy version of map "wins", leaving us with this
let customers: LazyMapSequence<LazySequence<[Order]>, Customer> = orders.map(\.customer)

// again, the lazy version of `filter` "wins" over the original `Sequence.filter`, so our result is still lazy
let premiumCustomers: LazyFilterSequence<LazyMapSequence<LazySequence<[Order]>, Customer>, Customer> = customers.filter(\.isPremium)

// the concrete return type is getting more and more unwieldy, but it's definitely still lazy
let customerContactInfo: LazyMapSequence<LazyFilterSequence<LazyMapSequence<LazySequence<[Order]>, Customer>, Customer>, ContactInfo> = premiumCustomers.map(\.contactInfo)
```

We're done with our original snippet, so we'll stop now; if we did continue, however, the pattern would continue for as long as we kept calling "lazy methods".

## Remarks

As you can see, mechanics are fairly intricate, but the end result is pretty neat: all you have to do is put `lazy` at the start of your chain, and then your entire chain becomes "lazy" automatically, without any additional code modification.

On the positive side, I'd say this is a very elegant use of Swift's language features—it's a good API-design case study.

On the negative side, however, the ease of converting your code to be "lazy" without significant modification is also its Achilles' heel—anything that disrupts the mechanisms we just described can silently revert your "lazy" code back to its original, eager interpretation. 

We'll be discussing this decay effect [in the next part](./2025-07-26-swift-laziness-part-3.md). Before clicking through, however, I'd encourage you to see if you can identify situations where "decay" might happen—it's a good exercise.
