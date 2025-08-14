---
title: "Lazy Sequences Lack Primary Associated Types"
description: "You can write `Sequence<Element>` but not `LazySequenceProtocol<Element>`"
date: "2025-07-18"
---

Before Swift 6, a very useful *meso-optimization* was to move model types over to a COW-style implementation, and then lazily cache "expensive" computed properties in the backing storage object. 

```swift
public struct Outer<Source: Collection> {
  private(set) var storage: Inner
}

extension Outer {
  // standard COW pattern:
  public var source: Source {
    get { storage.source }
    set { 
      ensureUniqueStorage()
      storage.source = newValue
    }
  }

  // getter-only computed property:
  public var count: Int { storage.count }
}

class Inner<Source: Collection> {
  var source: Source {
    didSet {
      _count.nullify(when: source != oldValue)
    }
  }
  
  private var _count: Int?
  var count: Int {
    switch _count {
    case .some(let count):
      return count
    case .none:
      let count = source.count
      _count = count
      return count
    }
  }
}
```

The nice thing about this pattern is that the caching is transparent to users of the type—the getter for `count` is a standard, non-mutating `get`.

Unfortunately, however, under strict concurrency this convenience proves to have been a lie all along, because our transparent caching is a data-race-risk:

- we could share the same `Inner` between multiple `Outer` values
- we could access `count` from multiple threads at the same time
- we have no synchronization whatsoever

*Even if* this data race is harmless for a an `Int?`, that's just us getting lucky—the situation won't be so favorable with reference types, let alone aggregates[^1] thereof.

[^1]: Aggregates, here, meaning tuples, structs, and so on—the larger the aggregate, the greater the risk.

*Knowing is half the battle*, they say, but...now that we know...what should we do?

The real headache here is that there's not really a one-size-fits-all answer.

The general-purpose answer is to add synchronization to the backing storage, but even this needs to be adapted to the specifics at hand:

- for isolated, stand-alone cached properties you can consider atomics
- if you're caching chains of computed properties you can consider a lock, but now you have additional problems (lock overhead, more-intricate internals)

Alternatively, you can simply make the type actor-isolated: this lets you keep using the original, naive patterns, but at the obvious cost of being isolated to a specific actor. Probably acceptable for dedicated, UI-specific types, but even then it's a bit unfortunate—it'd be natural to want a model type work on both `@MainActor` and on, say, your app's `@DataStoreActor`.

Alternatively, you can simply stop attempting to do transparent caching in your model types (...and move the caching elsewhere, e.g. into UI components). This works, but it's repetitive—wanting to avoid this is *why* the original pattern was so nice.

So, indeed: strict concurrency has revealed that a cool trick was never as cool as it seemed, and there's not really an equally-cool replacement—sometimes that's just the way it is.
