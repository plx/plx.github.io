---
title: "Swift: Warts"
description: "Remarks on \"warts\" in Swift."
---

# Swift: Warts

These notes are all about inelegant, obscure parts of the Swift language and its standard libraries.
Since these are "notes", be aware that these try to get to the point without much hand-holding or build-up—potentially great or terrible, depending on your perspective.
Some of these may grow to become articles, but many will not.

- [First Trailing Closure Cannot Have A Label](#first-trailing-closure-cannot-have-a-label)
- [Lazy Sequences Decay Easily](#lazy-sequences-decay-easily)
- [Lazy Sequences Lack Primary Associated Types](#lazy-sequences-lack-primary-associated-types)
- [Name Collisions in Result Builders](#name-collisions-in-result-builders)
- [`Sendable`, Custom COW-Style Types, And Lazy/Cached Properties](#sendable-custom-cow-style-types-and-lazy-cached-properties)
- [Inability to do Generic Actor Confinement](#inability-to-do-generic-actor-confinement)

## First Trailing Closure Cannot Have A Label

**BLUF:** Swift's syntax for *multiple* trailing closures allows closure labels on all closures *except* for the first; this asymmetry precludes certain APIs from being expressed in a clean, readable way.

As a motivating example, consider a fused operation like `mapFilterMap`:

```swift
extension Sequence {
    /// More-efficient equivalent to doing "map, filter, map" in 3 separate eager steps.
    func mapFilterMap<T, R>(
        map extraction: (Element) throws -> T,
        filter isIncluded: (T) throws -> Bool,
        map transform: (T) throws -> R
    ) rethrows -> [R] { 
      var results: [R] = [] // real version would have a hint for how much to reserve
      for item in self {
        let extractedValue = try extraction(item)
        guard try isIncluded(extractedValue) else {
          continue
        }
        results.append(try transform(extractedValue))
      }

      return results
    }
}
```

Handy to have, but awkward to use:

```swift
// original, highly-readable 
let premiumContactInfo = orders
    .map(\.customer)
    .filter(\.isPremium)
    .map(\.contactInfo)    

// *theoretical* replacement with similar readability
let premiumContactInfo = orders.mapFilterMap
  map: { $0.customer }
  filter: { $0.isPremium }
  map: { $0.contactInfo }

// *actually-possible* replacement with awkward readability;
// feels clunky no matter how you finesse the format
let premiumContactInfo = orders.mapFilterMap 
  { $0.customer } 
  filter: { $0.isPremium } 
  map: { $0.contactInfo }
```

Sadly, this capability has already been discussed-and-decided against, [as discussed a bit here](https://forums.swift.org/t/can-first-trailing-closure-be-named/69793/8).

## Lazy Sequences Decay Easily

**BLUF:** Swift's `lazy` APIs exploit a usually-tricky aspect of Swift's method resolution rules in a clever way; the ergonomics are good, but it's brittle and easy for lazy-looking code to accidentally "decay" back to eager evaluation.

The tricky bit is relying on Swift's overload resolution rules to select the "right" implementation of a method; the key part of the trick is (a) having `LazySequenceProtocol` refine `Sequence` and then (b) defining a overloaded methods that provide lazy results. For example, here's `map`:

- `Sequence.map`: `func map<T>(_ transform: (Element) throws -> T) rethrows -> [T]`
- `LazySequenceProtocol.map`: `func map<U>(_ transform: @escaping (Element) -> U) -> LazyMapSequence<Elements, U>`

Together with `Sequence`'s `var lazy: LazySequence<Self>` property, this gives us the "cute" capability to "lazify" an entire functional chain just by prepending `.lazy` to it:

For example, consider the following:

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

When it works, this is great, but relying on this aspect of overload-resolution makes the laziness prone to "decay" in a way that's unusual for Swift—you can lose some or all of your laziness by including a throwing method, or extracting a reusable chain to an extension on `Sequence`, or invoking it in a context where an array is the expected return type, or by mixing in a method that doesn't have a lazy equivalent (e.g. `dropLast(_:)` is never lazy, whereas `drop(while:)` can be, etc.).

If using lazy sequences were more important, I'd call this API design a clever mistake; as it is, it's more of a wart, but also a good API-design case study.

## Lazy Sequences Lack Primary Associated Types

**BLUF:** Unlike Sequence, Swift's `LazySequenceProtocol` cannot be written as `LazySequenceProtocol<Element>`.

This wart is short and sweet: you can write `some Sequence<Element>`, but not `some LazySequenceProtocol<Element>`. Not a big deal but still an occasional speed bump.

## Name Collisions In Result-Builders

BLUF: `@resultBuilder` is a great way to embed domain-specific-languages (dialects?) into Swift, but it can be challenging to avoid name collisions when doing so idiomatically, because achieving an idiomatic DSL relies on defining "keyword-like" structs:

- SwiftUI: `ForEach`
- RegexBuilder: `ZeroOrMore`, `OneOrMore`, `ChoiceOf`
- Square's Predicate: `Or`, `And` (etc.)

Great for ergonomics, but leaves you at risk of name collisions. For example, it's easy to imagine:

- a "MacroValidationBuilder" that both (a) defines its own `ChoiceOf` struct *and* (b) uses `RegexBuilder` internally
- an "HTTPHeaderBuilder" that needs its own version of a `ForEach` 

...and so on. As with the first trailing closure issue, this has been [discussed in the past](https://forums.swift.org/t/pitch-result-builder-scoped-unqualified-lookup/62190/); my read of the situation is it's not rejected, but also has no forward momementum at this time.

## `Sendable`, Custom COW-Style Types, And Lazy/Cached Properties

**BLUF:** caching "expensive" computed properties in COW storage is a useful pattern, but doing so in a `Sendable` world requires *disproportionate effort* in complex cases, making it a questionable pattern in many cases.

This is surprisingly difficult to summarize, but IMHO it's a big deal (and a case where Swift's strict concurrency reveals a legitimate problem, but it's not clear if the effort to mitigate is generally worth it).

The tl;dr is that *before* Swift 6, a pretty easy optimization for large-and-complex model types was (a) adopt the COW pattern and then (b) cache "expensive" computed properties; the neat thing with this was that this caching could be done inside ordinary, non-mutating `get` operations on the outer struct, which made this caching transparent to users of the type.

If you try to use this pattern with strict concurrency, however, transparent caching is problematic: if you do it the naive way you're mutating shared state without any synchronization, and that's correct:

```swift
struct Outer<Source: Collection> {

  private(set) var storage: Inner

  var count: Int { storage.count }
}

// assume this is storage for some COW type
class Inner<Source: Collection> {
  var source: Source { 
    didSet {
      _source.nullify(when: source!= oldValue) // invalidate cached value if it exists and `source` changed
    }
  }

  // look, no synchronization!
  private var _count: Int? = 0
  var count: Int {
    _count.provided(by: source.count) // cached value *or* "calculate, cache, and return the value"
  }
}
```

It's obvious once pointed out, but...should you fix it, make the type main-actor-only, or just stop using this part of the COW pattern altogether? 
It's not clear there's a general answer.

## Inability to do Generic Actor Confinement

**BLUF:** Swift's statically-checked actor-confinement concepts like `@MainActor` are great, but there's no way to do generic actor confinement (e.g. no analog to Rust's concept of being lifetime-generic).

This is an extremely niche requirement, but it's still a bit of a wart: you can mark a type as being explicitly confined to a concrete choice of *global actor* (e.g. `@MainActor`, or `@MyCustomDatabaseActor`, etc.), but there's no way to express the concept of "this type must be confined to some global actor" (e.g., in fake syntax, `@'A struct ActorConfined {}`, wherein `'A` is a generic variable representing a global actor).
