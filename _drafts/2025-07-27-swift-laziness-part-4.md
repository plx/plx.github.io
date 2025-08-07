---
layout: post
title: "Lazy Swift Part 4: ~3~ 4 Ways To Survive Laziness Decay"
date: 2025-07-28
description: "Techniques to keep your lazy code lazy."
tags: [swift, functional-programming, performance]
---

## Introduction

This is the fourth-and-final article in our series on laziness in Swift; to recap the series:

- in [Part 1](./2025-07-24-swift-laziness-part-1.md), we talked about functional chains and their cost (intermediate allocations)
- in [Part 2](./2025-07-26-swift-laziness-part-2.md), we discussed the lazy API's elegant-but-fragile implementation 
- in [Part 3](./2025-07-26-swift-laziness-part-3.md), we discussed the phenomenon of "laziness decay", wherein lazy-looking code silently reverts to eager evaluation

In this last article, we'll discuss three ways to survive laziness decay.

## Strategies For Laziness

We're going to walk through four strategies:

- [Using explicitly-lazy operations](#explicitly-lazy-operations)
- [Extracting reusable fused operations](#reusable-fused-operations)
- [Extracting specific operations to dedicated methods](#extracting-specific-operations-to-dedicated-methods)
- [Defining your own lazy overloads](#define-your-own-lazy-overloads)

We'll also talk through one "anti-strategy", just to illustrate what *not* to do:

- [Why Not Just Put `lazy` Inside Extensions?](#why-not-just-put-lazy-inside-extensions)

The goal for each of these strategies is to adopt patterns that will preserve *intended laziness* in your code.

### Explicit Lazy Operations

The simplest strategy to avoid decay is to side-step the delicate overload-resolution logic entirely: 

1. define explicitly-lazy synonyms for the lazy operations (e.g. `lazyMap`, `lazyFilter`, etc.)
2. migrate your code to use the explicitly-lazy synonyms where appropriate

For (1), we'll start by defining these synonyms on `LazySequenceProtocol`; her', e.g.  (and `LazyCollectionProtocol`, if applicable). This is purely boilerplate—here's how `lazyMap` should look:

```swift
extension LazySequenceProtocol {
    // identical signature as `LazySequenceProtocol.map`
    func lazyMap<T>(_ transform: @escaping (Element) -> T) -> LazyMapSequence<Elements, T> {
        map(transform)
    }
}
```

For (2), it's just a question of migrating the code you want to defend against decay. For example, here's our familiar snippet before and after migration:

```swift
// original snippet
let premiumContactInfo = orders
    .lazy
    .map(\.customer)
    .filter(\.isPremium)
    .map(\.contactInfo)

// after migration:
let premiumContactInfo = orders
    .lazy
    .lazyMap(\.customer)
    .lazyFilter(\.isPremium)
    .lazyMap(\.contactInfo)
```

As a mitigation strategy, this works; as an aesthetic, well, it's disappointing—we've definitely traded away some elegance in exchange for predictability.

We're almost done here, but there are two additional nuances to consider before moving on to the next strategy: (a) *linting* and (b) adding analogous methods to `Sequence`, 

For *linting*, if we care enough about lazy to introuce these synonyms, it'd be nice to also use a linter to make sure we're actually using them. Unfortunately, however, detecting this pattern exceeds what can be done *simply* using SwiftLint's regex-based linting rules; writing a custom syntax-based rule would be possible, but I'm skeptical the value is worth the effort—IMHO this is worth considering but not worth doing.

Adding analogous methods to `Sequence`, on the other hand, is a subtler case.
What this would look like is defining synonyms that move the initial `lazy` into the implementation, e.g. here's `lazyMap` on `Sequence`:

```swift
extension Sequence {
    func lazyMap<T>(_ transform: @escaping (Element) -> T) -> LazyMapSequence<Self, T> {
        lazy.map(transform)
    }
}
```

Adding these synonyms on `Sequence` has pros and cons; if you want easy access to laziness, I'd add them; if you want to pay close attention to your use of laziness, I'd skip them. One thing I wouldn't worry about, however, is having excessively-nested `LazySequence`-wrappers: the potential is there, but the impact of nesting is negligible[^1] *and* it won't happen in chains—the non-nesting versions from `LazySequenceProtocol` will usually win, due to the same mechanics we've been discussing:

```swift
let premiumContactInfo = orders
    .lazyMap(\.customer) // <- this calls `Sequence.lazyMap`, which returns `LazyMapSequence<Self, T>`
    .lazyFilter(\.isPremium) // <- this calls the `LazySequenceProtocol` version, which doesn't introduce *unnecessary* nesting 
    .lazyMap(\.contactInfo) // <- this also calls the `LazySequenceProtocol` version
```

### Reusable Fused Operations

This strategy revolves around identifying common patterns in your functional chains and replacing them with dedicated, "fused" methods; these fused methods can be eager, lazy, or a mix, depending on your needs.

As a simple example, some *very* common patterns are (a) filtering-then-mapping and (b) mapping-then-filtering. For both of these, we can define a fused operation that does both steps at once:

```swift
extension Sequence {

    func filterMap<T>(
        where isIncluded: (Element) throws -> Bool,
        transform: (Element) throws -> T
    ) rethrows -> [T] {
        var results: [T] = []
        for element in self where try isIncluded(element) {
            results.append(try transform(element))
        }
        return results
    }

    func mapFilter<T>(
        transform: (Element) throws -> T,
        where isIncluded: (T) throws -> Bool
    ) rethrows -> [T] {
        var results: [T] = []
        for element in self {
            let transformed = try transform(element)
            if try isIncluded(transformed) {
                results.append(transformed)
            }
        }
        return results
    }
}
```

Both of those implementations are eager, but they're not inherently-wasteful the way doing separate `map` and `filter` passes would be. 

If we wanted a lazy version of this, it's a bit more involved—writing a new `Sequence` type can be surprisingly involved. As a quick approximation of that, however, you can abuse the lazy version of `compactMap` like so:

```swift
extension Sequence {

    func lazyFilterMap<T>(
        where isIncluded: @escaping (Element) -> Bool,
        transform: @escaping (Element) -> T
    ) rethrows -> LazyCompactMapSequence<Self, T> {
        lazy.compactMap { 
            guard isIncluded($0) else { return nil }
            return transform($0)
        }        
    }

    func lazyMapFilter<T>(
        transform: @escaping (Element) -> T,
        where isIncluded: (T) -> Bool
    ) rethrows -> LazyCompactMapSequence<Self, T> {
        lazy.compactMap { 
            let candidate = transform($0)
            guard isIncluded(candidate) else { return nil }
            return candidate
         }
    }
}
```

Consider this a lucky special case, however—not every fused operation we can imagine will have an easily-accessible construction like this!

In any case, I generally like this strategy, and think it's a good pattern to adopt even if you're not specifically concerned with laziness—it's just nice when you have an inventory of higher-level fused operations for your repeating patterns.

### Extracting To Dedicated Methods

As a cousin of the previous strategy, you can also extract specific operations to dedicated methods.

The idea here isn't anything complicated: 

- once a chain gets long-enough, it should get extracted to a method
- once it's extracted to a method, you should consider switching to explicit iteration

It's easier to see the value here as chains get longer, so let's introduce a new example:

```swift
// original in-situ logic:
let outcomes = items
    .lazy
    .compactMap(\.optionalValue)
    .filter { $0.meetsComplexCriteria() }
    .flatMap(\.children)
    .filter(\.isValid)
    .map { Outcome(from: $0) }

// extracted to a method:
func complexProcessing(items: [Items]) -> some Sequence<Outcome> {
        items
        .lazy
        .compactMap(\.optionalValue)
        .filter { $0.meetsComplexCriteria() }
        .flatMap(\.children)
        .filter(\.isValid)
        .map { Outcome(from: $0) }
}

// rewritten for explicit iteration
func complexProcessing(items: [Items]) -> some Sequence<Outcome> {
    var results: [Result] = []
    
    for item in items {
        guard 
            let value = item.optionalValue,
            value.meetsComplexCriteria() 
        else { continue }
        
        for child in value.children where child.isValid {
            results.append(Result(from: child))
        }
    }

    return results
}
```

The chain is more readable when inlined into the call site, but the version with explicit iteration will be both easier to read *and* more performant.

### Strategy 4: Explicit Lazy-to-Array Conversion

Unrelated to the previous three strategies, you can consider taking more-explicit control of when-and-where you transition from "some kind of `Sequence` (etc.)" to "a concrete `[Element]` array", and then enforce laziness at the point of transition.

For example, returning to our original example:

```swift
extension Array {
    // explicitly requires lazy source
    static func gather<Source>(elementsFrom elements: Source) -> Self where Source: LazySequenceProtocol, Source.Element == Element {
        Self(elements)
    }
}

extension SalesRecord {

    // explicitly typed as array
    var premiumContactInfo: [ContactInfo] {
        // explicitly require laziness
        .gather(elementsFrom: orders
            .lazy
            .map(\.customer)
            .filter(\.isPremium)
            .map(\.contactInfo)
        )
    }
}
```

### Why Not Just Put `lazy` Inside Extensions?

If you've been following along, you may have noticed that I've studiously avoided a seemingly-simple solution: capture the chain to a method, taking care to put `lazy` inside the method itself. 

For example, you may be wondering why I never proposed something like this:

```swift
extension Sequence<Order> {

    var premiumContactInfo: some Sequence<ContactInfo> {
        self
            .lazy // <- put the lazy *here*, right?
            .map(\.customer)
            .filter(\.isPremium)
            .map(\.contactInfo)
    }
}
```

If you've been thinking this, I have good news and bad news.

The good news: you're absolutely right! If the goal is "*request* this logic use lazy evaluation", then an extraction like this will work.

The bad news: this doesn't do anything to actually *guarantee* your extracted logic is actually using lazy evaluation—it's just as vulnerable to "decay" as the original code.

So that's why this isn't one of my suggestions: it's perfectly-viable as *code organization*, but completely orthogonal to avoiding laziness-decay.


## Parting Thoughts

This article focused on techniques to protect your use of laziness against unwanted decay; this "unwanted decay" phenomenon is somewhat unusual for Swift, and takes a bit of work to avoid—whence this article series.

Having said all that, I want to remind you that laziness, itself, isn't necessarily a "silver bullet" (and is often *not* the answer you're looking for, as we saw in [Part 1](./2025-07-24-swift-laziness-part-1.md)).

As such, my parting advice is that the proper order of operations should be as it always is:

- write code that does what you need it to do
- measure its performance under realistic assumptions
- if necessary, apply the appropriate optimizations

The techniques in this article only come into play when you've already determined laziness is the right tool for the job; we're not suggesting you use laziness everywhere, just helping you mitigate the risk of having your chosen optimization silently come undone.
