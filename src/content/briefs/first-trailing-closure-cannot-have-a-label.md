---
title: "First Trailing Closure Cannot Have a Label"
description: "Swift forbids labeling the first trailing closure, which can be a surprising obstacle to idiomatic API design."
category: "Swift Wart"
date: "2025-07-16"
---

Swift's syntax for trailing closures and multiple trailing closures are fantastic for expressibility, but there's a minor wart: you cannot label the first trailing closure, only the subsequent ones.

Especially in such an otherwise-expressive language, this restriction is a bit jarring, and has real impacts on API design.

### Method Pairs

As a simple example, I think it's helpful to include method pairs like these:

```swift
extension Optional {

  /// Nullify `self` when `condition` is true, skipping the check when already nil.
  mutating func nullify(when condition: @autoclosure () -> Bool) {
    guard case .some = self, condition() else { return }
    self = nil
  }

  /// Nullify `self` when `condition` is false, skipping the check when already nil.
  mutating func nullify(unless condition: @autoclosure () -> Bool) {
    nullify(when: !condition())
  }

}
```

...to help write cache-invalidation logic:

```swift
// conditionally-invalidate derived value:
var someField: Foo {
  didSet {
    _someCachedProperty.nullify(when: oldValue != someField)
  }
}

var activeComponents: Set<ComponentID> {
  didSet {
    _fooDetails.nullify(unless: activeComponents.contains(.foo))
    _barDetails.nullify(unless: activeComponents.contains(.bar))
  }
}
```

Given the need to use labels to disambiguate between the two methods, we wind up with `@autoclosure` being the best fit for this API (instead of just using closures).

### Fused Functional Chains 

As another example, for performance reason I often create "fused" versions of common functional chains: a fused "map, filter", a fused "filter, map", and so on.

Without the ability to label the first trailing closure, however, we're buying performance at the cost of readability. For example, consider a fused operation like `mapFilterMap`:

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

// *hypothetical* replacement with similar readability
let premiumContactInfo = orders.mapFilterMap
  map: { $0.customer }
  filter: { $0.isPremium }
  map: { $0.contactInfo }

// *actually-possible* replacement with awkward readability;
// feels clunky no matter how you finesse the formatting
let premiumContactInfo = orders.mapFilterMap 
  { $0.customer } 
  filter: { $0.isPremium } 
  map: { $0.contactInfo }
```

### Is There Hope?

Sadly, no: this capability has already been discussed-and-decided against, [as discussed a bit here](https://forums.swift.org/t/can-first-trailing-closure-be-named/69793/8).
