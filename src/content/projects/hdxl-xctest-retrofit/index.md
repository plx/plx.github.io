---
title: "XCTest Retrofit"
description: "Streamlined migration from `XCTest` to Swift Testing."
date: "July 25, 2025"
repoURL: "https://github.com/plx/hdxl-xctest-retrofit/"
---

## Overview

[`HDXLXCTestRetrofit`](https://github.com/plx/hdxl-xctest-retrofit/) is a small library of *macros* that you can use to adapt *most*[^1] existing [`XCTest`](https://developer.apple.com/documentation/xctest) unit tests to [Swift Testing](https://developer.apple.com/documentation/testing/) without having to substantively rewrite them:

1. migrate from `XCTestCase` subclasses to `@Suite` structs
2. apply `@Test` annotation to test functions[^1]
2. prepend `#` to `XCTAssert*` calls

[^1]: The primary gaps are around expectations, expected failures, and attachments—IMHO those don't map cleanly to Swift Testing's APIs, so they're currently unsupported.

[^2]: And consider removing `test` from the function name, for readability.

For tests within the supported scope, this largely de-risks your migration, because your core test logic can be left intact:

```swift
// BEFORE: typical xctest 
class FooTests: XCTestCase {

  func testBarConversionRoundTrip() throws {
    let example = Foo.barConvertibleExample
    XCTAssertTrue(example.isBarConvertible)
    let bar = try XCTUnwrap(example.barRepresentation)
    let roundTrip = try XCTUnwrap(bar.fooRepresentation)
    XCTAssertEqual(example, roundTrip)
  }

}

// AFTER: Swift Testing
@Suite
struct FooTests {

  @Test
  func barConversionRoundTrip() throws {
    let example = Foo.barConvertibleExample
    #XCTAssertTrue(example.isBarConvertible)
    let bar = try #XCTUnwrap(example.barRepresentation)
    let roundTrip = try #XCTUnwrap(bar.fooRepresentation)
    #XCTAssertEqual(example, roundTrip)
  }

}
```

The intended usage for this library is to facilitate migration of existing `XCTest`-based tests to Swift Testing *without* having to risk regressions from rewriting the existing test logic. If you've been considering a migration but concerned about your existing suite, you might find this project helpful. 

In any case, this is a narrow-purpose library and at this point I consider it feature-complete.

## Implementation Details

### Why Use Macros?

Under the hood, these macros rewrite the `#XCTAssert*` macro invocations into the equivalent usage of `#expect` and `#require`, e.g. `#XCTAssertEqual(a, b)` gets expanded to something equivalent-to `#expect(a == b)`. Using macros here instead of ordinary functions has two benefits:

- ergonomic syntax for the migration (b/c `Symbol` and `#Symbol` don't collide)
- `#expect` and `#require` receive the original expression, not the value

### Attribution Support

The examples above show simple usage like `#XCTAssertEqual(lhs, rhs)`.

The retrofit macros also have full support for the "attribution" parameters, and come in two flavors:

- an `XCTest`-style variant that takes `message`, `file`, and `line` arguments (identically to the wrapped API)
- a "Swift Testing"-style variant that takes `message` and `sourceLocation` arguments (analogous to `#expect` and `#require`)

Supporting the `XCTest` parameters keeps these macros as drop-in replacements, whereas the `SourceLocation`-flavored variant is for easier "partial migration" to "Swift Testing".

Supporting attribution like this is particularly-useful for porting "validation functions" that encapsulate test logic; for example:

```swift
// Example of a *ported* validation helper
func validateCodableRoundTrip<T: Equatable & Codable>(
  _ example: T,
  codec: JSONCodec,
  file: StaticString = #filePath,
  line: UInt = #line
) throws {
  let roundTripped = try codec.roundTrip(example)
  #XCTAssertEqual(
    example, 
    roundTripped,
    "\(example) should have round-tripped to itself, but instead became \(roundTripped) via \(codec)",
    file: file,
    line: line
  )
}
```

## Development Remarks

### Time To Completion

This project would have taken under a week, end-to-end, if done with full-time focus—it's a nice, self-contained task.

### Surprise Gotcha: Expansion Testing

The expansion tests proved harder to write than I thought b/c the macro-expansion helpers I was using don't fully account for whitespace within the macro expansion:

- they ignore leading and trailing whitespace (for the overall expansion)
- they ignore trailing whitespace within each line of the expansion

Not a big deal, but makes me suspicious that the basic expansion-testing scheme is going to scale to larger, more-complex macros.
It also feels like "expand and match local formatting conventions" remains an unresolved problem (and something that might need enhancements to the macro system to solve in full—something like an "imputed indentation style" on the macro-expansion context parameters, or similar).

### Deliberately Omitted: FixIts

In general, it's preferable for macros to provide explanatory `FixIt`s when used incorrectly.

In this case, however, the benefit isn't there: the individual macros are mostly simple rewrites to the underlying `XCTest` assertion, at which point ordinary compiler errors seem sufficiently informative.

### Deliberately Omitted: Inlining Closure Bodies

Swift Macros *generally* work in a purely-additive fashion: they can *add* code, but can't modify-or-remove existing code.

If you squint at things a bit, however, there's an exception to this rule: macro *arguments* aren't considered "existing code" in the sense above, and that means your macro has some additional freedom—it can introspect-and-rewrite the content of its arguments, when interesting to do so.

This is of particular interest with closure parameters, because *in principle* they can be inlined directly into the expansion:

```swift
#XCTAssertThrowsError(expression) { error in
  #XCTAssertTrue(error is FooError)
}

// naive expansion (note: we're not using a more-refined error b/c we're expanding from the XCTest version, which doesn't let us specify the error type)
{
  let uniqueName_error = #expect(throws: (any Error).self) { expression }
  if let uniqueName_error {
    { error in 
      #XCTAssertTrue(error is FooError)
    }(uniqueName_error)
  }
}()

// cleaner expansion, by inlining:
{
  let uniqueName_error = #expect(throws: (any Error).self) { expression }
  if let uniqueName_error {
    #XCTAssertTrue(uniqueName_error is FooError)
  }
}()
```

I plan to explore this possibility further in future projects, but opted against it here—IIRC there's only one closure-taking assertion, and so exploring closure-inlining didn't seem worthwhile.

### Claude Code Usage

Towards the end of the project I experimented with Claude Code. 
Results were overall beneficial, but not universally so—some interesting misses mixed in with the hits.

#### What Worked

##### Filling In Unit Tests

I found Claude did a pretty good job of filling in unit tests *based on the patterns I'd already established*.
In other words:

- I added some new macros 
- I asked Claude to write tests for them 
- I specifically asked Claude to match the existing patterns

...and it worked, without any hand-holding vis-a-vis what would be reasonable things for the macros in question to assert—seems like its pretraining included enough `XCTest` examples that it already "knew" how the assertions should be used.

##### Basic Project Polish

Claude did a good job making the readme look reasonable, setting up github actions, getting an .spi.yml file in place, and so on.

Each of these tasks is individually "no big deal", but also fatigue-inducing bits of friction—was very nice to just "hand them off" to Claude.

##### Getting Per-Macro Documentation

I asked Claude to add documentation to each macro, and specifically requested that it do the following:

- find the original, wrapped method
- write analogous documentation for the retrofit macro
- (and adjust for `sourceLocation`, etc.)

This went well, presumably due to being a simple, well-structured task.

##### Getting Documentation *Started*

I asked Claude to write the higher-level documentation: an overview, a longer "details" writeup, and some guides for migrating existing tests.

Like the [basic project polish](#basic-project-polish)[^3], there's a tremendous benefit to having "someone else" get things started: there, it was setting up a lot of administrivia; here, it was going from "having nothing" to having a passable first draft. I didn't expect usable content out of the first draft, and indeed it wasn't, but for unexpected reasons—see the [keeping Claude on-topic](#keeping-claude-on-topic) section below.

[^3]: As a point of order, writing the documentation overlapped with the "basic project polish" effort—easier to write them up as sequential, however.

#### What Didn't Work

##### Writing Missing Macros

In my initial release, I didn't support the [`XCTAssertThrowsError`](https://developer.apple.com/documentation/xctest/xctassertthrowserror(_:_:file:line:_:)) and [`XCTAssertNoThrow`](https://developer.apple.com/documentation/xctest/xctassertnothrow) assertions.
As an experiment, I tasked Claude with implementing them:

- following existing conventions
- including positive and negative tests

The result, here, was a bit surprising: in each case, Claude seemed conceptually-confused.
As so often the case, I suspect better prompting would have one-shotted these—the interesting thing here is to note the conceptual trap for the future.

For `#XCTAssertThrowsError`, Claude's "mistake" was simply a lack of elegance: emitted distinct expansions for the "error-handler" and "no-error-handler" cases, even though they could have been unified into a single expansion built around a call to [`#expect(throws:_sourceLocation:performing:)`](https://developer.apple.com/documentation/testing/expect(throws:_:sourcelocation:performing:)-1hfms); aside from cleaner expansions, using the same `#expect` call for both variants also provides more-consistent error messages.

For `#XCTAssertNoThrow`, Claude's "mistake" was more-substantial: it mistakenly gave the macro a rethrows-like expansion, e.g.:

```swift
// unexpanded:
#XCTAssertNoThrow(expression)

// expanded:
{
  do {
    let _ = try expression
  }
  catch let error {
    Issue.record(error) //  <- but with better details
    throw error // <- we don't want this
  }
}()
```

Given these failures for both tasks, using Claude to plug these gaps wound up as, at best, a wash: saved some time getting things stood up, then wasted about the same amount of time detecting, diagnosing, and fixing the mistakes.

##### Keeping Claude On-Topic

I've saved this for last because I find it the most amusing *and* the most intriguing—it's the rare issue that yields some insight into Claude's personality quirks.

[As I mentioned earlier](#getting-documentation-started), Claude did a great job writing a first draft of the documentation, which specifically was supposed to include 4 things:

- a brief overview
- a longer "details" writeup
- a guide for migrating existing tests
- a guide for migrating existing validation functions

Somehow, however, Claude kept "getting distracted" from the task at hand, and kept inserting segues into *lengthy* bits of advisory-and-advocacy for using validation functions in your test suite. 
Per my recollection, Claude did this in each section, just a bit differently; a bit cheekily, what he actually wrote breaks down as:

- a brief overview, ending in a pitch to use validation functions in your codebase
- a longer "details" writeup, ending in a detailed discussion of the benefits of validation functions
- a guide for migrating existing tests, ending in a pitch to use validation functions
- a guide for migrating existing validation functions, with a lot of advocacy for their use 

In fairness to Claude, these were some of my early vibe-coding experiments, and I suspect I could one-shot these now; on the other hand, it's still curious to me simply because the prompts I wrote didn't seem to have any obvious trigger for this behavior (at least not to this extent)—it feels like I inadvertently stumbled onto one of the model's "personal" hobbyhorses.

## Next Steps

Hopefully none, frankly: this is a narrow-purpose library and, as of now, I consider it done for my use case.

Having said that, if I do pick it up again, the likeliest next steps will be adding support for additional assertions *not* currently part of the `XCTest` API—think things like a version of `XCTAssertThrowsError` that lets you specify the expected error type, and so on. If I did that, it'd because I was porting some project that would benefit directly; until then, consider this one complete.
