---
title: "*Generic* Testing For Generic Swift Code"
cardTitle: "Testing Generic Swift Code, *Generically*"
description: "Options For Writing Generic Tests For Generic Code."
date: "2025-08-26"
---

This article is a review of the available strategies for "generically testing generic code":

- you have some generic code that you want to test
- you want to write tests that are themselves *generic*
- you want to run those tests over multiple concrete types

## The Problem

The situation in which we'd *want* to write "generic tests for generic code" are cases where we're not confident that the generic type bounds fully capture the behavior we're relying upon.
The sources of this "low confidence" are varied, and often include some combination of things like:

- relying on behavior not fully captured by the generic type bounds (e.g. physical representations, value-vs-reference types in Swift[^1], inexpressible semantic expectations)
- relying on behavior that is subtle and complex (e.g. floating-point numerics)
- dealing with implementations of questionable correctness (e.g. in-house components)

[^1]: This perhaps deserves another "Swift Wart": there's currently no way to express "`T` must have value semantics" as a generic type constraint.

In practice, this means that code like the below *probably* only needs to be tested with a specific choice of concrete types (e.g. `[Int]`):

```swift
extension Sequence where Element: Equatable {

  func countElements(equalTo target: Element) -> Int {
    var count = 0
    for element in self where element == target {
      count += 1
    }
    return count
  }

}
```

In contrast, consider a generic type like the below:

```swift
struct LinearSpan<Representation> where Representation: BinaryFloatingPoint {

  var lowerBound: Representation
  var length: Representation
  var upperBound: Representation { lowerBound + length }

  func translated(by offset: Representation) -> LinearSpan {
    LinearSpan(lowerBound: lowerBound + offset, length: length)
  }
}
```

This type's behavior is relying upon *generic* floating point arithmetic, which can be subtle and non-intuitive, particularly with lower-precision types—numerical surprises can arise even at "typical UI scales"[^2]. As such, this is a case where we'd want to write tests against as many concrete types as possible, but *without* writing quite as much boilerplate this:

[^2]: For example, in `Float16`, `2048 + 1 == 2048`.

```swift
@Test(arguments: [0.0, 0.01, 1.0])
func nonZeroLengthImpliesDistinctBounds_Double(length: Double) {
  let span = LinearSpan(lowerBound: 0, length: length)
  #expect(span.lowerBound < span.upperBound || length == 0.0)
}

@Test(arguments: [0.0, 0.01, 1.0] as [Float])
func nonZeroLengthImpliesDistinctBounds_Float(length: Float) {
  let span = LinearSpan(lowerBound: 0, length: length)
  #expect(span.lowerBound < span.upperBound || length == 0.0)
}

@Test(arguments: [0.0, 0.01, 1.0] as [Float16])
func nonZeroLengthImpliesDistinctBounds_Float16(length: Float16) {
  let span = LinearSpan(lowerBound: 0, length: length)
  #expect(span.lowerBound < span.upperBound || length == 0.0)
}
```

I hope the downsides of the above are clear: it's tedious to write, it won't scale beyond "a few functions with a few types", and it has maintainability challenges that'll become immediately obvious the first time you need to modify your "shared" test logic.

Having said that, it's not *entirely* bad, either—the boilerplate above actually has very nice ergonomics for running and debugging tests, because each test for each concrete type gets its own test function[^3].

[^3]: In "Swift Testing", we can even run and debug the test for specific choices of parameter values.

As such, we'd like to find a solution that preserves those ergonomic benefits, without nearly as much boilerplate; here's our tentative list of desiderata:

1. using native test frameworks (`XCTest`, "Swift Testing")
2. each pair of test-and-type shuold be individually runnable and debuggable (from GUI and CLI)
3. minimal boilerplate:
    - test *logic* should be written once (not once per type)
    - test *invocation* should be minimal and scale nicely[^4]

[^4]: Scaling nicely, here, means "more like `M + N` than `M * N`", keeping in mind that testing is a bit different from the classic formulation of the "M + N" problem: the original formulation is just about *writing* "M algorithms" that can be used with "N types", whereas here we're writing-and-invoking "M tests" on "N types", which is inherently a bit more "M * N"-ish.

## The Solutions

Now that we've laid out the problem, we'll spend the rest of this article exploring our options. 
It would be great to have multiple solutions, that satisfy all of our desiderata, but unfortunately the overall situation is more mixed:

- we have a partial solution that work in both `XCTest` and "Swift Testing"
- we have a complete, nearly-ideal solution that is `XCTest`-specific
- we have *ideas* for future directions in "Swift Testing", but no complete solutions

As such, final take
If you just want the punchline, *if* you need to write generic tests for generic Swift, you should use `XCTest` *unless* you're at such a small scale that the boilerplate won't be a material issue.

### Partial Solution: Validation Helpers

The simplest solution is to admit defeat and settle for only a partial solution: we can stick with "copy and paste" as our strategy, but make it a lot less boilerplate by doing the following:

1. put core test logic into generic validation helpers
2. use protocols or constants for frequently-reused test values
3. write concrete tests that call those helpers

Despite being only a partial solution, this approach has many benefits:

- it's adaptable to both `XCTest` and "Swift Testing"
- it's "conceptually incremental": you can start with a single concrete type, and add more as needed
- it winds up resembling property-based testing, which is itself advantageous
- it scales *almost* nicely:
  - the core logic has the "M + N" property
  - the test invocations still scale like "M * N", but in a lightweight way

As such, I suggest thinking of this approach as an intermediate step towards a more-ideal solution. Keeping that in mind, let's see it in action.

#### Put Core Test Logic Into Generic Validation Helpers

The first step is to pull our core test logic into generic validation helpers. 
Writing "validation helpers" is, itself, a pretty involved topic; in thi article, I'll be writing them as free functions. 

Here's what our "non-zero length implies distinct bounds" implication looks like when extracted to a stand-alone validation function:

```swift
func validateNonZeroLengthBoundsImplications<Representation: BinaryFloatingPoint>(
  span: LinearSpan<Representation>,
  sourceLocation: SourceLocation = #_sourceLocation
) {
  // treat cases separately for better error messages
  switch span.length > 0.0 {
  case true:
    #expect(
      span.lowerBound < span.upperBound,
      "Non-zero length should imply different bounds", 
      sourceLocation: sourceLocation
    )
  case false:
    #expect(
      span.lowerBound < span.upperBound,
      "(Effectively) zero length should imply equal lower and upper bounds", 
      sourceLocation: sourceLocation
    )
  }  
}
```

As an additional, more-fully-developed example, here's a validation function validating the behavior of `LinearSpan.translated(by:)`:

```swift
func validateTranslatedBy<Representation: BinaryFloatingPoint>(
  span: LinearSpan<Representation>,
  offset: Representation,
  sourceLocation: SourceLocation = #_sourceLocation
) {
  let translated = span.translated(by: offset)
  #expect(translated.length == span.length)  
  #expect(translated.lowerBound == span.lowerBound + offset)
  #expect(translated.upperBound == span.upperBound + offset)
  // double-check our relative positioning relationships hold up:
  if offset < 0.0 {
    #expect(translated.lowerBound < span.lowerBound)
  } else if offset > 0.0 {
    #expect(translated.lowerBound > span.lowerBound)
  }
}
```

The examples above are written with "Swift Testing" in mind, but could easily be adapted to work with `XCTest`, as well—this is a very general approach.

In any case, once we have these written, our tests become a bit friendlier to copy-and-paste:

#### Put Frequently Reused Test Values Into Protocols Or Constants

The next step is to make our test values obtainable in a way that's copy-and-paste friendly.
As with the validation functions in the previous section, the result of this initiative is going to resemble what you'd need to do property-based testing.

The minimum version of this is to define static variables in appropriate places, e.g.:

```swift
// somewhere in our test target
extension LinearSpan {
  static var exampleLowerBounds: [Representation] { 
    [-10.0, -1.0, -0.1, 0.0, 0.1, 1.0, 10.0] // or whatever
  }

  static var exampleLengths: [Representation] {
    [0.0, 0.01, 1.0] // etc.
  }

  static var exampleOffsets: [Representation] {
    [-10.0, -1.0, -0.1, 0.0, 0.1, 1.0, 10.0] // or whatever
  }

  static var examples: [Self] {
    var result: [Self] = [] //
    for lowerBound in Representation.exampleLinearSpanLowerBounds {
      for exampleLength in Representation.exampleLinearSpanLengths {
        result.append(
          Self(
            lowerBound: lowerBound,
            length: length
          )
        )
      }
    }
  }
}
```

In my experience, this approach of "static variables on the type" works fine for *almost* all cases. The rare exceptions are things like:

- you're already doing property-based testing, and want to lean on whatever protocols you're using for that
- you're going to re-use the same "component values" for many different types
- it's challenging to construct examples of your subcomponents unless they adopt some kind of example-providing protocol 

When those apply, a more-sophisticated approach may be beneficial, but mostly for cleanliness reasons—the end result will still be about the same.

#### Write Concrete Tests That Call Those Helpers

We've now reached the part we can't quite avoid: we need to write some concrete tests that call our generic validation helpers, and this is going to look like copy-and-paste—just a bit nicer.

Since we've been definining everything as static properties on the type we'll be testing, we've arrived at a place that's a bit more copy-and-paste friendly:

```swift
@Test(arguments: LinearSpan<Double>.examples)
func nonZeroLengthImpliesDistinctBounds_Double(example: LinearSpan<Double>) {
  validateNonZeroLengthBoundsImplications(span: example)
}

@Test(arguments: LinearSpan<Float>.examples)
func nonZeroLengthImpliesDistinctBounds_Float(example: LinearSpan<Float>) {
  validateNonZeroLengthBoundsImplications(span: example)
}

@Test(arguments: LinearSpan<Float16>.examples)
func nonZeroLengthImpliesDistinctBounds_Float(example: LinearSpan<Float16>) {
  validateNonZeroLengthBoundsImplications(span: example)
}
```

This isn't great—and is *never* going to be great—but it's a bit better than it was.

TODO: check the fileprivate typealias works

In any case, that's the end of this first, partial approach: it's very much *not* the complete solution we're hoping for, but it *is* a surprisingly-feasible approach at smaller scales.

### Solving It Directly In `XCTest`

If we're willing to stick with `XCTest`, there's a somewhat-obscure technique that will yield a *complete* solution for our problem:

1. write your generic tests in a generic subclass of `XCTTestCase`
2. create non-generic subclasses for the concrete types you want tested

Let's go through this step-by-step.

#### Write Generic Subclass of `XCTestCase`

The first step is to write a generic "test case class" roughly like so:

```swift
class LinearSpanTests<Representation: BinaryFloatingPoint> : XCTestCase {

  var spans: [LinearSpan<Representation>] {
    LinearSpan<Representation>.examples
  }

  var offsets: [Representation] {
    LinearSpan<Representation>.exampleOffsets
  }

  func testNonEmptySpanImplications() {
    for span in spans {
      if span.length == 0 {
        XCTAssertEqual(
          span.lowerBound,
          span.upperBound,
          "(Effectively) zero length should imply equal lower and upper bounds"
        )
      } else {
        XCTAssertNotEqual(
          span.lowerBound,
          span.upperBound,
          "Non-zero length should imply different bounds"
        )
      }
    }
  }

  func testTranslatedBy() {
    for span in spans {
      for offset in offset {
        let translated = span.translated(by: offset)
        XCTAssertEqual(translated.length, span.length)
        XCTAssertEqual(translated.lowerBound, span.lowerBound + offset)
        XCTAssertEqual(translated.upperBound, span.upperBound + offset)
        if offset < 0.0 {
          XCTAssertLessThan(translated.lowerBound, span.lowerBound)
        } else if offset > 0.0 {
          XCTAssertGreaterThan(translated.lowerBound, span.lowerBound)
        }
      }
    }
  }

}
```

In other words: you're writing a generic base class that includes generic unit tests. Note that to make this work, you'll need a generic way to obtain your example values—this will look *a lot* like what we just did for the partial solution based on validation functions. Also note that for larger test suites, you'll probably want to do two more things:

- to make tests halt immediately on the first error (e.g. via `continueAfterFailure`)
- to have test-specific shorthands for iteration (`forEachSpan`, `forEachSpanAndOffset`, etc.) 

#### Create Non-Generic Subclasses of Your Base Class

Now that we have our base class ready, how are we doing?

The good news is that we're a lot closer to our goal: we've written our generic tests once, generically, rather than via copy-and-paste.

The bad news is that we don't (yet) have any runnable tests[^5]. To have *runnable* tests we need to create some non-generic subclasses of our base class, but this is thankfully very, very easy:

[^5]: Conceptually it makes sense that these aren't runnable in generic form; mechanically, they're not runnable because (a) `XCTest` needs to create an instance of the class to run its tests, (b) there's no way to instantiate an instance of a generic class without specifying concrete choices for the type parameters, and (c) there's no direct way to *tell* `XCTest` to instantiate such-and-such generic test-case class with such-and-such concrete type parameters.


```swift
class LinearSpanTests_Double : LinearSpanTests<Double> {}
class LinearSpanTests_Float : LinearSpanTests<Float> {}
class LinearSpanTests_Float16 : LinearSpanTests<Float16> {}
```

That's it, actually! With those in place, we'll now have a complete solution in place:

- we've written our generic tests once, generically
- we're invoking our tests on each concrete type we care about
- we have *very* minimal per-type boilerplate

#### Advice: Validation Helpers Are Still Useful

In the example above, I inlined all the generic test logic into the test methods in our generic base test class.

This works and is helpful for *illustration*, but *in real life* I'd still encourage factoring the generic logic into validation helpers whenever possible. The benefits of doing so are the same as always: 

- you can reuse consistent assertion patterns in multiple tests
- you get "economies of scale" that help write really-thorough tests
- you get some future flexibility (e.g. it's easier to migrate to alternative organizational patterns)

This is also why I started with the validation-function based partial solution—this `XCTest` based solution can be seen as building on top of that foundation.

#### Warning: Expect Xcode Quirks

In my experience, this technique has always fallen into an unusual limbo:

- *`XCTest`* understands the technique and runs everything as expected
- *Xcode* doesn't understand the technique, and acts a bit quirky

In our example above, what we'd want to see from Xcode's test UI is:

- `LinearSpanTests_Double`
  - `testNonEmptySpanImplications`
  - `testTranslatedBy`
- `LinearSpanTests_Float`
  - `testNonEmptySpanImplications`
  - `testTranslatedBy`
- `LinearSpanTests_Float16`
  - `testNonEmptySpanImplications`
  - `testTranslatedBy`

In practice, we're probably going to see something else, but the details vary by Xcode version.

In more-recent Xcode versions, you'll probably see something like this:

- `LinearSpanTests`
  - `testNonEmptySpanImplications`
  - `testTranslatedBy`
- `LinearSpanTests_Double`
  - `testNonEmptySpanImplications`
  - `testTranslatedBy`
- `LinearSpanTests_Float`
  - `testNonEmptySpanImplications`
  - `testTranslatedBy`
- `LinearSpanTests_Float16`
  - `testNonEmptySpanImplications`
  - `testTranslatedBy`

The entries for `LinearSpanTests` are essentially "phantoms": Xcode thinks they're real, includes them in its test counts, and lets you "run" them, but this is an illusion—they're not runnable, they won't actually run, and they'll never "go green". A bit strange, but thankfully just a moderately-confusing, GUI-level annoyance—there's no *functional* issue.

In older Xcode versions, the behavior is even stranger: when you *first* opened the project, you'd see a hierarchy with a lot of empty test-case classes, like this:

- `LinearSpanTests`
- `LinearSpanTests_Double`
- `LinearSpanTests_Float`
- `LinearSpanTests_Float16`

*After* the first time you ran the tests, however, the hierarchy would get filled out to look like this:

- `LinearSpanTests`
- `LinearSpanTests_Double`
  - `testNonEmptySpanImplications`
  - `testTranslatedBy`
- `LinearSpanTests_Float`
  - `testNonEmptySpanImplications`
  - `testTranslatedBy`
- `LinearSpanTests_Float16`
  - `testNonEmptySpanImplications`
  - `testTranslatedBy`

This makes sense if you think about the implementation: 

- `XCTest` uses runtime introspection to *discover* the test case classes and their test methods
- Xcode *presumptively* uses a two-phase approach:
  - *during editing*, it relies on heuristics to identify tests in the source
  - *after running tests*, it incorporates information produced by `XCTest` during execution

Still a bit quirky and confusing to see, but seemingly a thing of the past.

### Solving It In *Swift Testing*

Whereas `XCTest` provides us with a *complete* solution, *Swift Testing* does not: on the one hand, the technique I just illustrated relies on inheritance between test-case classes, which has no equivalent in *Swift Testing*; on the other hand, there's seemingly no straightforward way to may to achieve the same outcome, either.

More-precisely, there's a large number of concepts that *almost* work, but fail due to some subtle, blocking flaw.

#### Passing Metatype Values

Conceptually it'd be nice if we could do this:

```swift
// pass the types to check into our test function:
@Test(arguments: [Int.self, Int8.self, Int16.self])
func additionIsCumulative(type: (any Equatable & AdditiveArithmetic & ExpressibleByIntegerLiteral).Type) {
  // hop over to a generic validation helper to perform the test:
  verifyCommutativeAddition(forType: type)
}

private func verifyCommutativeAddition<T>(forType type: T.Type) where T: Equatable & AdditiveArithmetic & ExpressibleByIntegerLiteral {
  let a = 1 as T
  let b = 2 as T
  #expect(a + b == b + a)
}
```

Unfortunately, this doesn't quite work because the metatype *values* don't conform to the relevant protocols (e.g. a *value* of `any (Equatable & AdditiveArithmetic & ExpressibleByIntegerLiteral).Type` doesn't "count" as conforming to `Equatable & AdditiveArithmetic & ExpressibleByIntegerLiteral`).

#### Using Parameter Packs

A related concept that comes a bit *closer* to working is to use parameter packs like so:

```swift
// types no longer passed into test function:
@Test
func variadicCommutivity() {
  verifyCommutativeAddition(Float.self, Float16.self, Double.self)
}

// variadic outer helper:
private func verifyCommutativeAddition<each T: AdditiveArithmetic & Equatable & ExpressibleByIntegerLiteral>(
  _ types: repeat (each T).Type,
  sourceLocation: SourceLocation = #_sourceLocation
) {
  for type in repeat each types {
    verifyCommutativeAddition(forType: type, sourceLocation: sourceLocation)
  }
}

// generic inner helper (unchanged from before):
private func verifyCommutativeAddition<T: AdditiveArithmetic & Equatable & ExpressibleByIntegerLiteral>(
  forType type: T.Type,
  sourceLocation: SourceLocation = #_sourceLocation
) {
  let a: T = 1
  let b: T = 2
  #expect(a + b == b + a, sourceLocation: sourceLocation)
}
```

The *good news* is this approach actually (a) compiles and (b) works as expected—we really are passing in a list of metatypes and then running our generic tests over each one. The *bad news* is that this pattern strongly resists any attempt to make it more generic and reusable, because doing so falls outside the scope of what's currently expressible within Swift's type system.

Here's a quick gallery of what doesn't work:

```swift
// doesn't work b/c you can't express `T: TypeConcept` if `TypeConcept` is a type parameter
func forEachMetatype<TypeConcept, each T: TypeConcept>(
  _ types: repeat (each T).Type,
  body: (TypeConcept.Type) -> Void
) {
  for type in repeat each types {
    body(type)
  }
}

// won't work even if we are ok writing one of these per "concept"?
func forEachAdditiveArithmeticType<each T: AdditiveArithmetic & Equatable & ExpressibleByIntegerLiteral>(
  _ types: repeat (each T).Type,
  body: (any (AdditiveArithmetic & Equatable & ExpressibleByIntegerLiteral).Type) -> Void
) {
  for type in repeat each types {
    // doesn't work b/c the compiler doesn't think `type` is convertible to `any (AdditiveArithmetic & Equatable & ExpressibleByIntegerLiteral)`    
    body(type) // won't work even with explicit `as any (AdditiveArithmetic & Equatable & ExpressibleByIntegerLiteral).Type`    
  }
}

// still won't work even if we force-cast: this function now compiles,
// but you can't use it at the call site b/c of the issue with metatypes we 
// were seeing *before* we started using parameter packs
func forEachAdditiveArithmeticType<each T: AdditiveArithmetic & Equatable & ExpressibleByIntegerLiteral>(
  _ types: repeat (each T).Type,
  body: (any (AdditiveArithmetic & Equatable & ExpressibleByIntegerLiteral).Type) -> Void
) {
  for type in repeat each types {
    body(type as! any (AdditiveArithmetic & Equatable & ExpressibleByIntegerLiteral).Type)
  }
}
```



```swift
func forEachFloating

1. Swift doesn't allow you to pass a "concrete 

- you can't 


- provide a generic 

*At time of writing*, the *Swift Testing* framework has no direct equivalent to the technique I just outlined for doing generic testing via `XCTest`: the `XCTest` strategy inherently relies on inheritance relationships between test-case classes, which doesn't even exist as a concept in *Swift Testing*.

### Quick Approach: Copy & Paste

If you *must* use "Swift Testing", have a small number of generic tests to write, and don't want to over-invest in these capabilities, I'd suggest just optimizing for copy-and-paste:

- write a generic validation function suitable for use as the body of a test
- write an easily-editable concrete test that calls that validation function
- copy-and-paste it for each concrete type of interest

Far from exciting, but often the best choice *when* your situation is simple.
Here's what it looks like "in action", taking advantage of `Swift Testing`'s support for parameterized tests so as to have the capability to run against multiple test-value lists:

```swift
// concrete tests, designed to be copy-and-paste friendly:
@Test
func testPushAndPop_Int() {
  validatedPushAndPop(valueType: Int.self)
}

@Test
func testPushAndPop_String() {
  validatedPushAndPop(valueType: String.self)
}

@Test
func testPushAndPop_Double() {
  validatedPushAndPop(valueType: Double.self)
}

// generic validation helper, with heavyweight validation logic:
func validatedPushAndPop<T: Equatable & TestValueProviding>(
  valueType: T.Type,
  sourceLocation: SourceLocation = #_sourceLocation
) {
  let values = T.testValues
  let valueCount = values.count
  // check we have usable test values:
  #expect(valueCount > 0, "We need at least one value in `distinctValuesForTesting()`", sourceLocation: sourceLocation)

  var stack = Stack<T>()
  // stack starts empty
  #expect(stack.count == 0, "Stack should be empty to start", sourceLocation: sourceLocation)

  // push values in, one by one
  for (index, value) in values.enumerated() {
    #expect(!stack.contains(value), "Stack shouldn't have the value yet.", sourceLocation: sourceLocation)
    #expect(stack.count == index, "Stack count should match the number of values pushed", sourceLocation: sourceLocation)
    stack.push(value)
    #expect(stack.contains(value), "Stack should have the value after it's been pushed.", sourceLocation: sourceLocation)
  }

  // verify count is what it should be:
  #expect(stack.count == valueCount, "Stack count should match the number of values pushed", sourceLocation: sourceLocation)

  // pop values out, verify the order is what we expected
  for (index, value) in values.reversed().enumerated() {
    #expect(stack.count ==  valueCount - index, "Stack count should match the number of values remaining to pop", sourceLocation: sourceLocation)
    #expect(stack.contains(value), "Stack should contain the value until we've popped it.", sourceLocation: sourceLocation)
    #expect(stack.pop() == value, "Found an inconsistent order while popping", sourceLocation: sourceLocation)
    #expect(!stack.contains(value), "Stack shouldn't have the value after we've popped it.", sourceLocation: sourceLocation)
  }
  #expect(nil == stack.pop(), "Popping an empty stack should return `nil`", sourceLocation: sourceLocation)
  #expect(0 == stack.count, "Stack should be empty after popping all values", sourceLocation: sourceLocation)
}
```

### An Approach That Doesn't Work: Metatype Arguments

Seeing the above, you might think you use *Swift Testing*'s data-driven test capability to do better, e.g. something like this:

```swift
@Test(
  arguments: [
    Half.self as (Sendable & BinaryFloatingPoint).Type,
    Float.self as (Sendable & BinaryFloatingPoint).Type,
    Double.self as (Sendable & BinaryFloatingPoint).Type,
  ]
)
func zeroPlusZeroIsZero(metatype: (any Sendable & BinaryFloatingPoint).Type) {
  // *do something here to check `0 == 0 + 0`
}
```

If you try to make it work, you'll quickly hit numerous seemingly-impassable issues, because what you can do with protocol-metatype values is *extremely limited*. If there is some clever way to make this actually work, it'd be cool to find out what it is!

### Future Approach: Macros?

The approach above works, but is only really feasible for small-scale test suites—once we have a large number of tests, the copy-and-paste overhead will quickly become untenable. *At time of writing*, the only feasible solution appears to be writing a suite of custom macros, but I consider this speculative:

- there's a large "design space" for how such macros might work
- I haven't *personally* experimented with implementing them
- some of the tools we might need are still behind feature flags (body macros, code-block macros, etc.)
- IMHO we'd want to have careful support for both parameterized and ordinary tests

Having said all that, I have some strong intuitions for the general shape I'd want, which is roughly like this:

```swift
@Suite("Stack<T>")
@GenerateTestSpecializations(types: Int.self, String.self, Double.self)
struct StackTests {

  // simple example
  @GenericTestTemplate("Empty Stack ({{typename}})")
  private func _verifyEmptyStack<T: Equatable>(type: T.Type, sourceLocation: SourceLocation = #_sourceLocation) {
    validateEmptyStack(of: type)
  }

  // expands to something like these:
  @Test
  func `Empty Stack (Int)`() {
    _verifyEmptyStack(type: Int.self)
  }

  @Test
  func `Empty Stack (String)`() {
    _verifyEmptyStack(type: String.self)
  }

  @Test
  func `Empty Stack (Double)`() {
    _verifyEmptyStack(type: String.self)
  }
}
```

...except with a lot more rigor around:

- handling *multiple* generic parameters 
- generating parameterized tests (e.g. to emit specialized test functions that take arguments)
- clarifying what values are available for the `{{...}}` blocks in the above (or finding some other scheme for specifying generic-parameter-dependent values like test names)
- generating test tags, documentation comments, and other test nice-to-haves in a reusable, expressive way (including in particular some way of specifying generic-parameter-dependent values)

That's a lot! Generally my instinct is to be skeptical of feature creep, but in this specific case my intuition is that the fully-operational solution would be *actually usable* in a way that a feature-limited "MVP" just wouldn't be. That's a suspicion I'd like to be wrong about, but for now it's my best guess vis-a-vis this set of features.

Additionally, I am curious to see if (and *when*) the Swift Testing maintainers pursue anything in this direction; it feels like an obvious gap, but it's potentially-also an obvious gap without a single obvious "right answer". It also feels like something that will benefit from waiting some other features stabilize (body and code-block macros no longer behind feature flags, further capabilities for parameter packs, etc.)—it's definitely something to keep an eye on!

## Remarks

We've now reached the end of this "brief".

When I started out writing this, I legitimately thought it would be a brief: "here's a useful test pattern that works in `XCTest` and has no equivalent in Swift Testing (and *despite* Swift Testing being so much friendlier to advanced Swift features, etc.).

That's still an interesting facet of the topic, but not the only interesting angle on this topic—whence the very elaborate "brief" you see here.

## Appendix: Motivating Generic Testing

As noted above, I used `Stack<T>` as our example due to its familiarity: I can safely assume my readers *almost surely* need to explanation for what it is and how it should behave. As also noted, however, it's unfortunately an uninteresting example to *motivate* the need for generic testing, because the behavior of any reasonable implementation will truly be, well, *generic*—the specifics of `T` just aren't involved in any meaningful way.

As a better example, consider something like a binary 

Testing your generics becomes more critical the more the correctness of the generic code depends on the specifics being abstracted into generics. In my experience, this can be particularly the case even for simple-looking code generic involving floating-point types: it's natural to write that type of code as-if you're dealing with arbitary-precision real numbers, only to wind up with lots of small "surprises" due to differences in precision between `Float`, `Double`, and now also `Half`. 

For example, 
