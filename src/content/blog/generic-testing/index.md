---
title: "*Generic* Testing For Generic Swift Code"
cardTitle: "Testing Generic Swift Code, *Generically*"
description: "A practical approach to writing generic tests for generic Swift code."
date: "2025-11-01"
---

## Introduction

Generic code is one of Swift's great strengths—write once, use with many types. But what happens when you need to *test* that generic code? Do you write separate tests for each concrete type? Copy and paste? Hope that testing with `Double` is sufficient for `Float16`?

This article presents a practical solution to this problem: generic testing, where the tests themselves are generic and can be systematically executed against multiple concrete types. While this might sound complex, XCTest provides a surprisingly elegant mechanism that makes it straightforward.

We'll explore:

- Why generic testing matters
- How to implement generic tests using XCTest's class inheritance
- Techniques for managing test values and validation logic at scale
- Why Swift Testing doesn't currently support this pattern

If you're writing numerical libraries, generic algorithms, or any code where behavior might subtly vary between type parameters, this technique can save you from subtle bugs that only manifest with specific types.

## What Is Generic Testing?

Generic testing is about writing tests that mirror the genericity of the code being tested. Instead of manually writing separate test functions for each concrete type you want to test, you write the test logic *once* as generic code, then arrange for that logic to be executed against each concrete type of interest.

In other words, in an ideal world we'd be able to write something like this:

- write a generic test function *once* 
- *declare* which types we want to test against
- *automagically* have the test function get executed against each of those concrete types


## Why Does It Matter?

Given how clean Swift's generic semantics are, it's reasonable to ask if generic testing is even necessary.
After all, you might think, generic code is strictly written against the API available via the type bounds, and thus *in general* it "should work" for any conforming type(s).

The short answer is that this is directionally correct, but there's some nuance:

- sometimes protocols capture unintuitively-weak semantics[^1]
- Swift generics can't always differentiate between value and reference types (e.g. code might be correct for `struct` but not `class` types)[^2]
- sometimes types don't *fully* satisfy their API contract (often in subtle ways)[^3]

[^1]: The relationship between e.g. `Numeric`, `Comparable`, and the floating-point numbers is an example: reasoning "mathematically" you might expect `a + b > b` when `b > 0`, for example, but...that's not actually a semantic guarantee you can *fully* rely upon. This is far more salient with low-precision types like `Float16`, but it's applicable to the other floating-point types, too.
[^2]: The easy example here is something like, say, conforming a `class` to `SetAlgebra` and then using it with generic `SetAlgrebra` code that assumes value semantics (e.g. `var original = foo; foo.formIntersection(with: bar)`). 
[^3]: A typical example here is something like `Collection`, which has a large, "multi-type" API contract—the API contract has invariants spanning the collection, its index, its slice type, and so on. In such scenarios, it's easy to get a type to a state where it compiles and works for "easy cases", but has some subtle issues that only manifest under more-intensive usage.

To help make this more concrete, I'll walk through a concrete scenario.

### Concrete Example: `LinearSpan`

For our example, we'll be using the following generic type, which is intended to represent a closed unit interval:

```swift
struct LinearSpan<Representation> where Representation: BinaryFloatingPoint {

  var lowerBound: Representation
  var length: Representation
  var upperBound: Representation { lowerBound + length }

  var center: Representation { lowerBound + (length / 2) }

  func contains(_ coordinate: Representation) -> Bool {
    lowerBound <= coordinate && coordinate <= upperBound
  }

  func translated(by offset: Representation) -> LinearSpan {
    LinearSpan(lowerBound: lowerBound + offset, length: length)
  }
}
```

This is a useful type to have for doing layout calculations[^4], and in reality would have a much broader API than what's shown here—we're showing just enough to illustrate the need for *generic* testing.

[^4]: Such a type is *very useful* when writing, say, custom layouts (e.g. SwiftUI `Layout`, classical custom `UICollectionViewLayout`s, and so on).

#### Our *Non-Generic* Tests

Let's say we've implemented this type, it compiles, and it *seems to work*—so far, so good.
Being diligent, cautious coders, we don't stop there—we write tests, too.

In fact, we write extensive, property-test-style unit tests for this type, and successfully achieve *full test* coverage.
I'm not going to write that entire suite just for this article, but you can imagine the `LinearSpanTests.swift` contains a very large number of tests along the following lines;

```swift
@Test(arguments: LinearSpan<Double>.exampleSpans)
func `LinearSpan.center is not an endpoint`(span: LinearSpan<Double>) {
  guard span.length > 0 else { return } // skip the degenerate case
  // for non-empty spans, verify the expected start-center-end ordering:
  #expect(span.lowerBound < span.center)
  #expect(span.center < span.upperBound)
}

@Test(arguments: LinearSpan<Double>.exampleSpans, LinearSpan<Double>.exampleTranslations)
func `Invariants-of: LinearSpan.translated(by:)`(
  span: LinearSpan<Double>, 
  translation: Double
) {
  let translated = span.translated(by: translation)
  // length should *always* be preserved 
  #expect(translated.length == span.length)
  // bounds should be shifted by offset
  #expect(translated.lowerBound == span.lowerBound + translation)
  guard translation != 0 else { return } // skip the degenerate case
  // redundant, weaker check that we moved *at all* - "you can never be too careful"
  #expect(translated.lowerBound != span.lowerBound)
  #expect(translated.upperBound != span.upperBound)
  #expect(translated.center != span.center)
}
```

At this point, we think we're in good shape: our type is complete, its tests pass, and its test coverage is *very* thorough. Perhaps we *should* be more concerned, but we're not, so we move on to what we're actually trying to do: write custom layouts.

#### Where Things Go Wrong

We write the layouts, they also work well, and *initially* everything seems OK.
Sometime later, however, we start encountering surprising runtime bugs in our layouts: items are mispositioned and mis-sized, item movement is sometimes "jumpy", and so on.

I'll spare you the play-by-play and jump to the punchline: for performance reasons, at some point we migrated some of our layouts from `LinearSpan<Double>` to `LinearSpan<Float16>`
At the time, this seemed like an easy win: 1/4th the memory usage, microbenchmarks showed improved performance, and it *seemed* to work.

Unfortunately, however, `Float16` has low-enough precision that the "quirkiness" of floating-point math becomes salient at far more quotidian scales than `Double`; for a particularly *screen-sized* example:

- ✅ `Float16(2048) - Float16(1) == Float16(2047)`: this works as-expected
- ❌ `Float16(2048) + Float16(1) == Float16(2049)`: this fails b/c the next `Float16` after 2048 is `2050`

#### Back To *Generic* Testing

Since this is an article about *testing*—and generic testing, specifically!—we're not going to dwell on the numerical surprise above. 

Instead, we're going to focus on the testing situation, and its specific relevancy to *generic testing*:

- this was an issue we *could have* caught in unit tests
- *in fact*, we had unit tests that "would have caught it"...
- ...but only if we ran them for `Float16`, not `Double`

If there were a simple, obvious, and widely-known way to make that happen, this would be a short article. 

Thankfully, however, it turns out there *is* a way to write these tests in an ergonomic-and-maintainable fashion.

## Generic Testing In `XCTest`

As alluded to in the introduction, the `XCTest` framework contains a surprisingly-ergonomic mechanism for generic testing.
To date I've never seen this feature explicitly *suggested* in their documentation, but you'll see references to it being intended-to-work if you read through enough release notes and forum threads.

In this section I'll walk through the following:

- the basic concept
- some implementation details
- Xcode quirks and caveats
- why this approach is satisfactory

### Basic Concept

Here's the basic idea:

1. create a generic test case class
2. write the *generic* test cases you want
3. define *concrete*, *trivial* subclasses for each type you want to test

Going back to our `LinearSpan` example, we could write the following:

```swift
// step 1: define the generic test case class
class LinearSpanTests<Representation: BinaryFloatingPoint>: XCTestCase {
  // step 2: write the generic test cases you want
  func testCenterIsNotEndpoint() {
    for span in LinearSpan<Double>.exampleSpans where span.length > 0 {
      XCTAssertLessThan(span.lowerBound, span.center)
      XCTAssertLessThan(span.center, span.upperBound)
    }
  }

  // (still) step 2: write the generic test cases you want
  func testTranslatedByInvariants() {
    for span in LinearSpan<Double>.exampleSpans {
      for translation in LinearSpan<Double>.exampleTranslations {
        let translated = span.translated(by: translation)
        XCTAssertEqual(translated.length, span.length)
        XCTAssertEqual(translated.lowerBound, span.lowerBound + translation)
        if translation != 0 {
          XCTAssertNotEqual(translated.lowerBound, span.lowerBound)
          XCTAssertNotEqual(translated.upperBound, span.upperBound)
          XCTAssertNotEqual(translated.center, span.center)
        }
      }
    }
  }
}

// step 3: define concrete classes for each type you want to test
final class LinearSpanDoubleTests: LinearSpanTests<Double> {}
final class LinearSpanFloatTests: LinearSpanTests<Float> {}
final class LinearSpanFloat16Tests: LinearSpanTests<Float16> {}
```

I've put all of these steps into a single snippet for this article, but in real life would suggest splitting things up.

When the concrete subclasses are truly-trivial, I'd suggest a two-file pattern:

- `LinearSpanTests.swift`: the generic test case class (and thus the test logic itself)
- `LinearSpanTests+ConcreteTypes.swift`: a slim file containing *just* the concrete subclasses

On the other hand, if the concrete subclasses are *not* trivial, I'd suggest using one file per class:

- `LinearSpanTests.swift`: the generic test case class (and thus the test logic itself)
- `LinearSpanDoubleTests.swift`: the concrete subclass for `Double`
- `LinearSpanFloatTests.swift`: the concrete subclass for `Float`
- `LinearSpanFloat16Tests.swift`: the concrete subclass for `Float16`

If you're wondering about when the test-case subclass is non-trivial, don't fret—we'll be discussing that in the immediately-subsequent section. 

### Implementation Detail: Obtaining Values, Generically 

As you've probably already noticed, both our original `Swift Testing` tests and their `XCTest` test ports strongly-resemble property-based tests:

- we have some generic test logic
- we have some generic way of getting "example values":
  - `LinearSpan<Double>.exampleSpans` for "spans to test against"
  - `LinearSpan<Double>.exampleTranslations` for "translations to test against"
- our sketches assume these methods exist, but never got into the details

Once you start writing generic tests, you'll quickly find that "getting values, generically" will be a recurring, central consideration.
There's a lot of ways you can obtain these values, but from my experience there's two strategies to consider:

- emulating property-style composable generators
- defining hooks in the generic base class, and manually overriding them in each concrete subclass

I'll sketch each approach enough to convey the idea without getting bogged down in the details.

#### Emulating Property-Style Composable Generators

In this approach, you incrementally build up your example values:

```swift
extension LinearSpan {
  static var exampleLowerBounds: [Representation] { [0, 1, -1, 42] }
  static var exampleLengths: [Representation] { [0, 1, 2, 10] }
  static var exampleSpans: [LinearSpan] { 
    mapCartesianProduct(
      exampleLowerBounds, 
      exampleLengths,
      LinearSpan<Representation>.init(lowerBound:length:)
    )
  }

  static var exampleTranslations: [Representation] { [0, 1, -1, 42] }
}
```

Note that for real tests you would probably want more-interesting sets of example values, but this shows you the basics.
For cases where you need more fine-tuning for specific types, you can introduce a protocol to accommodate that:

```swift
protocol LinearSpanTestValueProviding: BinaryFloatingPoint {
  // give each of these a default implementation with the values from above
  static var exampleLowerBounds: [Self] { get }
  static var exampleLengths: [Self] { get }
  static var exampleTranslations: [Self] { get }
}

extension LinearSpan where Representation: LinearSpanTestValueProviding {
  // source the values from the protocol
  static var exampleLowerBounds: [Representation] { Representation.exampleLowerBounds }
  static var exampleLengths: [Representation] { Representation.exampleLengths }
  static var exampleTranslations: [Representation] { Representation.exampleTranslations }

  // include derived things as-before, e.g. exapmle spans, etc.
}
```

The point of this fancier approach would be if, say, you want to use different examples of "big" and "small" values for `Float16` than you do for `Double`—introducing the protocol gives you a mechanism to fine-tune the values the type-under-test drags in, *without* going all the way to mandatory hooks in the generic base class.

#### Mandatory Hooks

In the alternative approach, the "get me some values" logic gets moved into the generic base class, and each concrete subclass is responsible for overriding them:

```swift
class LinearSpanTests<Representation: BinaryFloatingPoint>: XCTestCase {
  func representativeSpans() -> [LinearSpan<Representation>] {
    // base implementation returns an empty array
    // concrete subclasses must override to provide actual test data
    XCTFail("Forgot to override representativeSpans in concrete subclass!")
    return []
  }

  func testPointContainment() {
    let spans = representativeSpans()
    XCTAssertFalse(spans.isEmpty, "Subclass must provide test spans")
    for span in spans {
      // ... test logic using span
    }
  }
}

class LinearSpanDoubleTests: LinearSpanTests<Double> {
  override func representativeSpans() -> [LinearSpan<Double>] {
    [
      LinearSpan(lowerBound: 0, length: 1),
      LinearSpan(lowerBound: -100, length: 200),
      LinearSpan(lowerBound: 1e-10, length: 1e-8)
    ]
  }
}
```

Note that for `LinearSpan` we could also have had hooks for lower bounds, lengths, and translations, but for the sake of brevity I'm only showing the "spans" hook.

#### When To Use Each?

My advice is:

- for generic code involving numerical types, containers, or anything else with some kind of predictable/regular structure, favor emulating property tests
- for generic code involving wildly-divergent types (`String`, `Int`, `Data`, `URL`, all needing testing), favor the "mandatory hooks" approach

Put a bit differently: emulate property-test style generators when it's easy to generically create representative values for all types under test; fall back on mandatory hooks when there's no such generic mechanism available.

### Implementation Detail: Validation Helpers

Up until now, I've been writing our test logic "inline" in the test methods themselves, e.g.:

```swift
func testTranslatedByInvariants() {
  for span in LinearSpan<Double>.exampleSpans {
    for translation in LinearSpan<Double>.exampleTranslations {
      let translated = span.translated(by: translation)
      XCTAssertEqual(translated.length, span.length)
      XCTAssertEqual(translated.lowerBound, span.lowerBound + translation)
      if translation != 0 {
        XCTAssertNotEqual(translated.lowerBound, span.lowerBound)
        XCTAssertNotEqual(translated.upperBound, span.upperBound)
        XCTAssertNotEqual(translated.center, span.center)
      }
    }
  }
}
```

When writing generic tests, there's a strong argument to be made for (a) extracting this logic into validation helpers and (b) taking the time to provide additional explanatory information into them. For example, after extracting the logic into a validation helper, the above example might look like this:

```swift
func testTranslatedByInvariants() {
  for span in LinearSpan<Double>.exampleSpans {
    for translation in LinearSpan<Double>.exampleTranslations {
      validateSpanTranslation(
        original: span,
        translation: translation
      )
    }
  }  
}

func validateSpanTranslation<R: BinaryFloatingPoint>(
  original: LinearSpan<R>,
  translation: R,
  file: StaticString = #filePath,
  line: UInt = #line
) {
  let translated = original.translated(by: translation)
  // this is a bit reusable
  validateEqualLengths(
    translated, 
    original, 
    "Translation should preserve length", 
    file: file, 
    line: line
  )
  // this isn't super-reusable
  XCTAssertEqual(
    translated.lowerBound, 
    original.lowerBound + translation,
    "Expected translated lower bound to be original lower bound plus translation; got \(translated.lowerBound) instead of \(original.lowerBound + translation)",
    file: file, 
    line: line
  )
  if translation != 0 {
    // this is a bit reusable
    validateDistinctEndpoints(
      translated, 
      original, 
      "Translation should move endpoints", 
      file: file, 
      line: line
    )
  }
}

func validateEqualLengths<R: BinaryFloatingPoint>(
  _ lhs: LinearSpan<R>,
  _ rhs: LinearSpan<R>,
  _ explanation: @autoclosure () -> String,
  file: StaticString = #filePath,
  line: UInt = #line
) {
  XCTAssertEqual(
    lhs.length, 
    rhs.length,
    "Expected equal lengths for span \(lhs) and \(rhs), but got \(lhs.length) and \(rhs.length); explanation: \(explanation())",
    file: file, 
    line: line
  )
}

func validateDistinctEndpoints<R: BinaryFloatingPoint>(
  _ lhs: LinearSpan<R>,
  _ rhs: LinearSpan<R>,
  _ explanation: @autoclosure () -> String,
  file: StaticString = #filePath,
  line: UInt = #line
) {
  XCTAssertNotEqual(
    lhs.lowerBound, 
    rhs.lowerBound,
    "Expected distinct lower bounds for span \(lhs) and \(rhs), but got \(lhs.lowerBound) and \(rhs.lowerBound); explanation: \(explanation())",
    file: file, 
    line: line
  )
  XCTAssertNotEqual(
    lhs.upperBound, 
    rhs.upperBound,
    "Expected distinct upper bounds for span \(lhs) and \(rhs), but got \(lhs.upperBound) and \(rhs.upperBound); explanation: \(explanation())",
    file: file, 
    line: line
  )
  XCTAssertNotEqual(
    lhs.center, 
    rhs.center,
    "Expected distinct centers for span \(lhs) and \(rhs), but got \(lhs.center) and \(rhs.center); explanation: \(explanation())",
    file: file, 
    line: line
  )
}
```

These examples are somewhat little contrived, but illustrate the general concept.

Although there's an appeal to having test logic captured into reusable helpers like this, for this use case I consider that a secondary benefit. The *primary* benefit, here, is as follows:

- we're testing against programmatically-generated exapmle values (and probably *a lot* of them)
- if we have any failures, we're probably going to have *lots of them*
- compared to hand-written tests, we have much less context available about the values and specifics[^7]

As such, for this type of testing I think it's worth the extra effort to write high-quality failure messages, etc., but to keep that approach feasible it'll behoove you to extract the test logic into helpers.

[^7]: Even setting breakpoints near failing assertions can be tricky in this paradigm, due to the "risk" of having a comparatively-small amount of failures spread across a *lot* of successful test invocations.

### Implementation Detail: Controlling Failure Quantity

As a related point, an unfortunate reality of all the Xcodes I've known and "loved" is that the UI is not built to handle having hundreds-or-thousands of failures at the same line of source code. This is one of my pet peeves and may someday make a guest appearance in a longer article about property-testing in Swift, but that's a story for another day. For this article, let's just say that the scale looks like:

- 1 failure at a single line: everything's ok
- 10 failures at a single line: questionable
- 100+ failures at a single line: expect hangs, freezes, and other Xcode quirks

To mitigate this, I'd strongly encourage putting something like the below somewhere in your codebase:

```swift
extension XCTestCase {
  
  func haltingAfterFirstFailure<R>(_ body: () throws -> R) rethrows -> R {
    let previousPreference = continueAfterFailure
    defer { continueAfterFailure = previousPreference }
    continueAfterFailure = false
    return try body()
  }

}
```

With that in place, you'd then wrap your test logic in `haltingAfterFirstFailure`, e.g.:

```swift
func testTranslatedByInvariants() {
  haltingAfterFirstFailure {
    for span in LinearSpan<Double>.exampleSpans {
      for translation in LinearSpan<Double>.exampleTranslations {
        validateSpanTranslation(
          original: span,
          translation: translation
        )
      }
    }
  }
}
```

Alternatively, you could simply override `continueAfterFailure` in your generic test case class to default-to `false` (instead of its original default of `true`). If all of your tests are heavyweight, I'd recommend that instead of `haltingAfterFirstFailure`, in fact—go with the method that's appropriate for your use case.

It'd be better yet if Xcode were more robust on this front, but, again that's a topic for another day—for now, this seems to be making a reasonable trade-off.

### Xcode Quirks and Caveats

Although this *mechanism* is intentionally-present and fully-supported, it's consistently confused Xcode and even some of the CLI tooling.
This doesn't impact its *functionality*, but depending on the tooling and version, don't be surprised if you see quirky behavior:

- The test navigator may occasionally show the generic base class as runnable (it shouldn't be)
- test discovery might briefly fail to recognize new concrete subclasses—or even any subclasses—until you build
- error messages in failed assertions sometimes show the base class name rather than the concrete subclass

None of these issues affect the actual execution of tests, but they can be certainly be confusing.

### Why Is This Satisfactory?

Other than `XCTest` being less ergonomic than Swift Testing, the mechanism I just described is very ergonomic:

- you write your generic test code *once* (in the base, generic class)
- the effort to *run* your test against a specific type parameter is close to the minimum conceivable
- there's *some* effort needed to provide values for testing, but it can be kept light-weight via shrewd use of generics

This brings us close to the M + N scaling we'd want, and keeps the overall test suite highly maintainable.

Perhaps in the future Swift Testing will gain a similar mechanism, but, until then, if you need generic testing capabilities, you can do it via `XCTest`

## Swift Testing: Why It Doesn't Work (Yet)

You might reasonably wonder: can we do this in Swift Testing? After all, it's more modern, more Swift-native, and generally more ergonomic than XCTest.

Unfortunately, the answer is no—and it's not for lack of trying. The fundamental issue is architectural: Swift Testing discovers all tests at compile time through its `@Test` attribute, which means:

- test functions cannot be generic (they need concrete types at compile time)
- you can define test suites as structs, but equivalent mechanism like class inheritance to exploit
- parameterized tests with metatypes don't work because metatype values are too limited at runtime

To unpack that last point, here's something that you might hope would work, but doesn't work out:

```swift
@Test(arguments: [Double.self, Float.self, Float16.self])
func testSpan(type: any BinaryFloatingPoint.Type) {
  // Can't instantiate LinearSpan<T> with a metatype
  // Can't call generic functions with the metatype
  // Can't really do anything useful here
}
```

Even writing a generic validation function won't help us, despite looking like it might:

```swift
func validateSpanBehavior<T: BinaryFloatingPoint>(type: T.Type) {
  // here we *can* write generic code against `T`, and thus can have our test logic...
}

// but this still won't work
@Test(arguments: [Double.self, Float.self, Float16.self])
func testSpan(type: any BinaryFloatingPoint.Type) {
  validateSpanBehavior(type: type)
  // ^ this doesn't work because *in this context* `type` is just a metatype, 
  // and doesn't give us a way to invoke the generic function we're trying to call.
}
```

A bit curiously, this does work with parameter packs:

```swift
func validateSpanBehavior<T: BinaryFloatingPoint>(type: T.Type) {
  // here we *can* write generic code against `T`, and thus can have our test logic...
}

func validateSpans<each T: BinaryFloatingPoint>(types: repeat (each T.Type)) {
  for type in types {
    // this actuall works!
    validateSpanBehavior(type: type)
  }
}
```

But, unfortunately, this doesn't work in a generic way for arbitrary closures, e.g. this won't work:

```swift
func forEachBinaryFloatingPointType<each T: BinaryFloatingPoint>(
  _ types: repeat (each T).type,
  body: (T.Type) -> Void
) {
  for type in types {
    body(type)
  }
}
```

The specific limitation is that `body` itself needs to be a generic function, but Swift doesn't currently support such "generic closures" (e.g. generic functions can take closures, but the closures aren't themselves generic).

Since this isn't an article about Swift's type arcana I'll cut it off here—suffice to say there's a lot of promising leads that uniformly fail to pan out.

## Conclusion

Generic testing is a powerful technique that becomes essential when your generic code's correctness depends on subtle properties of its type parameters. This is particularly true for:

- **Numerical code** where precision limits and floating-point quirks vary dramatically between types
- **Custom collections** wherein correctness hinges on complex api contracts involving multiple types
- **Protocol-heavy code** where conformances might have subtle semantic shortcomings

When you need generic testing, the XCTest approach illustrated in this article is available and surprisingly-ergonomic. 
Perhaps someday Swift Testing will provide a similar mechanism, but until then this seems to be the best option.
