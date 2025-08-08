---
title: "Lazy Sequences \"Decay\" Easily"
description: "Swift's lazy functional API is elegant, but prone to silently decaying back to its eager equivalent."
category: "Swift Wart"
date: "2025-07-15"
---

An elegant-*looking* corner of the Swift standard library is its lazy-functional APIs—if you want to convert a "functional chain" into a more memory-efficient lazy equivalent, all you need to do is prepend it with `lazy`, like so:

```swift
// this is eagerly-evaluated, creating multiple intermediate collections:
let badgeIDsToPrint = registrations
  .flatMap(\.attendees)
  .filter(\.isBadgeRequired)
  .map(\.badgeID)

// this is now lazily-evaluated, creating "views" that're executed on-demand
let badgeIDsToPrint = registrations
  .lazy
  .flatMap(\.attendees)
  .filter(\.isBadgeRequired)
  .map(\.badgeID)
```

Looks nice, but there's a catch: the implementation is making clever use of an unusually-tricky aspect of Swift's overload-resolution rules[^1]; the heart of the trick is that `LazySequenceProtocol` refines `Sequence`, and then defines a overloaded methods that provide lazy results:

- `Sequence.map`: `func map<T>(_ transform: (Element) throws -> T) rethrows -> [T]`
- `LazySequenceProtocol.map`: `func map<U>(_ transform: @escaping (Element) -> U) -> LazyMapSequence<Elements, U>`

When you match the intended overload, you get great ergonomics because the laziness "flows" through the entire chain; when it doesn't match, you get code that *looks* lazy, compiles fine, behaves as you'd expect, but is actually being eagerly evaluated. 

Having "same code, different behavior" is rare in Swift—and especially to this extent. If these lazy APIs were more important, I'd call this API design a clever mistake; as it is, it's still a wart, but a minor one (and mostly of interest as an API-design case study).
