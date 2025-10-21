---
title: "*Generic* Testing For Generic Swift Code"
cardTitle: "Testing Generic Swift Code, *Generically*"
description: "A practical approach to writing generic tests for generic Swift code."
date: "2025-10-18"
draft: true
---

## Introduction

This article explores the concept of "generic testing"—writing test suites that are *themselves* generic, and can thus be evaluated against multiple concrete types. This is particularly important when testing generic code whose behavior subtly depends on the specific types being used, even when those dependencies aren't fully captured by the generic constraints.

### What Is Generic Testing?

Generic testing is about writing tests that mirror the genericity of the code being tested. Instead of manually writing separate test functions for each concrete type you want to test, you write the test logic *once* as generic code, then arrange for that logic to be executed against each concrete type of interest.

Consider a generic type like `LinearSpan<Representation>`:

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

This type relies on generic floating-point arithmetic, which can be surprisingly subtle. With 16-bit floats (`Float16`), numerical surprises arise even at typical UI scales—for instance:

- ✅ `Float16(2048) - Float16(1) == Float16(2047)`: this works as-expected
- ❌ `Float16(2048) + Float16(1) == Float16(2049)`: this fails b/c the next `Float16` after 2048 is `2050`

...which can, in turn, lead to otherwise-correct looking code producing unexpected results.

Consider the following test, which verifies a seemingly-trivial property of `LinearSpan`: "the center of a span with a non-zero length is not an endpoint":

```swift
import Testing

@Test
func `LinearSpan.center is not the endpoint`() {
  let span = LinearSpan(lowerBound: 2048.0, length: 1) // inferred to be `LineraSpan<Double>`
  // all of these pass for `Double`, but not for `Float16`:
  #expect(span.lowerBound < span.upperBound)
  #expect(span.lowerBound < span.center)
  #expect(span.center < span.upperBound)
}
```

Since this is an article about generic testing, we'll focus on testing: discovering this  won't dwell on the numerical aspects focus on the testing aspects. Since this isn't an article about floating-point numerics, I'm not going to dwell on the numerical aspects much further. 

Instead, I'm go

Without generic testing, we'd be stuck writing repetitive boilerplate like:

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

This approach doesn't scale: it's tedious to write, difficult to maintain, and the duplication makes it easy for tests to drift out of sync when requirements change.

### Desired Properties for Generic Testing

An ideal generic testing strategy should have several key properties:

**Write tests generically:** Following the famous "M + N instead of M × N" principle from generic programming, we want to write M test functions that can work with N types, not M × N separate test implementations. 

**Minimal invocation boilerplate:** While classic generic programming is about *writing* M algorithms for N types, testing requires actually *invoking* each of the M × N test-type pairs. Our case deviates from the classic formulation because we need some mechanism to trigger execution of each combination, but we want this overhead to be as lightweight as possible.

**Standard framework integration:** The solution should work within vanilla XCTest or Swift Testing, not require a complex custom framework layered on top. Each test-type pair should be individually runnable and debuggable from both Xcode's GUI and the command line.

### Overview of Topics

We'll explore three interconnected topics in this article:

1. **The XCTest strategy:** Using generic test-case base classes that get subclassed for each concrete type—a solution that satisfies all our requirements
2. **Improvement techniques:** Ways to enhance the XCTest approach through better value provisioning and validation helper functions
3. **Swift Testing limitations:** Why there's currently no equivalently satisfactory approach for Swift Testing, despite it being more modern

## The XCTest Strategy

XCTest provides an elegant solution to generic testing through class inheritance. The approach involves creating a generic base test class containing all test methods, then creating lightweight concrete subclasses for each type you want to test.

### Basic Implementation

Let's start with a simple example testing `LinearSpan`. First, we create a generic base class:

```swift
class LinearSpanTests<Representation>: XCTestCase where Representation: BinaryFloatingPoint {

  // Abstract method for subclasses to provide test values
  func representativeSpans() -> [LinearSpan<Representation>] {
    // Base implementation returns empty array
    // Subclasses must override to provide actual test data
    return []
  }
  
  // Generic test checking point containment
  func testPointContainment() {
    let spans = representativeSpans()
    XCTAssertFalse(spans.isEmpty, "Subclass must provide test spans")
    
    for span in spans {
      // Points that should be inside
      XCTAssertTrue(span.contains(span.lowerBound), "Lower bound should be contained")
      XCTAssertTrue(span.contains(span.upperBound), "Upper bound should be contained")
      
      // Calculate midpoint (being careful about overflow)
      let center = span.lowerBound + (span.length / 2)
      if span.lowerBound < span.upperBound {
        XCTAssertTrue(span.contains(center), "Center should be contained")
      }
      
      // Points that should be outside
      let before = span.lowerBound - abs(span.length)
      let after = span.upperBound + abs(span.length)
      XCTAssertFalse(span.contains(before), "Point before span shouldn't be contained")
      XCTAssertFalse(span.contains(after), "Point after span shouldn't be contained")
    }
  }
}
```

Then we create concrete subclasses for each type we want to test:

```swift
final class DoubleLinearSpanTests: LinearSpanTests<Double> {
  override func representativeSpans() -> [LinearSpan<Double>] {
    return [
      LinearSpan(lowerBound: 0, length: 1),
      LinearSpan(lowerBound: -100, length: 200),
      LinearSpan(lowerBound: 1e-10, length: 1e-8)
    ]
  }
}

final class FloatLinearSpanTests: LinearSpanTests<Float> {
  override func representativeSpans() -> [LinearSpan<Float>] {
    return [
      LinearSpan(lowerBound: 0, length: 1),
      LinearSpan(lowerBound: -100, length: 200),
      LinearSpan(lowerBound: 1e-6, length: 1e-4)  // Adjusted for Float precision
    ]
  }
}

final class Float16LinearSpanTests: LinearSpanTests<Float16> {
  override func representativeSpans() -> [LinearSpan<Float16>] {
    return [
      LinearSpan(lowerBound: 0, length: 1),
      LinearSpan(lowerBound: -100, length: 200),
      LinearSpan(lowerBound: 0.001, length: 0.1)  // Much coarser due to Float16 limits
    ]
  }
}
```

### Xcode Quirks and Caveats

While this technique works well, Xcode sometimes exhibits quirky behavior with generic test classes:

- The test navigator may occasionally show the generic base class as runnable (it shouldn't be)
- Test discovery might briefly fail to recognize new concrete subclasses until you build
- Error messages in failed assertions sometimes show the base class name rather than the concrete subclass

None of these issues affect the actual execution of tests, but they can be momentarily confusing during development.

### Why This Approach Is Satisfactory

The XCTest strategy meets all our desired criteria:

**Truly generic test logic:** The test methods in the base class are written once and contain no type-specific code. All type-specific behavior is isolated to the concrete subclasses.

**Minimal dispatch overhead:** Creating a new test target requires only:
- Declaring a subclass (one line of code)
- Overriding methods to provide test values (typically just a few lines)

Each concrete subclass automatically inherits all test methods from the base class, and XCTest's runtime handles test discovery and execution. The result is that adding a new type to test requires minimal boilerplate while maintaining full integration with Xcode's test runner.

## Improving the XCTest Approach

While the basic XCTest strategy works well, we can enhance it in two key ways: using protocols for systematic value provisioning and extracting validation logic into helper functions.

### Generic Protocols for Test Values

Rather than having each subclass independently implement `representativeSpans()`, we can use protocols to systematize how test values are provided:

```swift
protocol LinearSpanTestValueProviding: BinaryFloatingPoint {
  static var representativeSpanParameters: [(lowerBound: Self, length: Self)] { get }
  static var boundaryCases: [Self] { get }
  static var typicalValues: [Self] { get }
}

// Provide conformances for our test types
extension Double: LinearSpanTestValueProviding {
  static let representativeSpanParameters = [
    (lowerBound: 0.0, length: 1.0),
    (lowerBound: -100.0, length: 200.0),
    (lowerBound: 1e-10, length: 1e-8),
    (lowerBound: .leastNormalMagnitude, length: .ulpOfOne)
  ]
  
  static let boundaryCases = [0.0, .infinity, -.infinity, .nan]
  static let typicalValues = [0.0, 1.0, -1.0, 42.0, 1e10, 1e-10]
}

extension Float16: LinearSpanTestValueProviding {
  static let representativeSpanParameters = [
    (lowerBound: Float16(0), length: Float16(1)),
    (lowerBound: Float16(-100), length: Float16(200)),
    (lowerBound: Float16(0.001), length: Float16(0.1))  // Coarser values
  ]
  
  static let boundaryCases = [Float16(0), .infinity, -.infinity, .nan]
  static let typicalValues = [Float16(0), Float16(1), Float16(-1), Float16(42)]
}
```

Now our base test class can be even more generic:

```swift
class LinearSpanTests<Representation>: XCTestCase 
  where Representation: BinaryFloatingPoint & LinearSpanTestValueProviding {
  
  func testPointContainment() {
    for (lowerBound, length) in Representation.representativeSpanParameters {
      let span = LinearSpan(lowerBound: lowerBound, length: length)
      // ... test logic using span
    }
  }
  
  func testBoundaryBehavior() {
    for value in Representation.boundaryCases {
      // Test behavior with boundary values
      let span = LinearSpan(lowerBound: value, length: 1)
      // ... assertions about boundary behavior
    }
  }
}
```

This approach starts to resemble property-based testing, where we're testing properties that should hold across a range of inputs, but with more control over the specific values used.

### Validation Helper Functions

Extracting test logic into validation helpers provides two major benefits: increased semantic clarity in tests and reusability across similar test contexts.

Consider this validation helper for span ordering:

```swift
func verify<R: BinaryFloatingPoint>(
  span: LinearSpan<R>,
  isStrictlyBefore other: LinearSpan<R>,
  sourceLocation: StaticString = #filePath,
  line: UInt = #line
) {
  XCTAssertLessThan(
    span.upperBound, other.lowerBound,
    "Span \(span) should be strictly before \(other)",
    file: sourceLocation, line: line
  )
  
  // Additional semantic checks
  XCTAssertFalse(
    span.overlaps(with: other),
    "Strictly ordered spans should not overlap",
    file: sourceLocation, line: line
  )
}

func verifyConsistentOrdering<T: Comparable>(
  _ values: [T],
  sourceLocation: StaticString = #filePath,
  line: UInt = #line
) {
  for i in 0..<values.count {
    for j in 0..<values.count {
      let vi = values[i]
      let vj = values[j]
      
      // Verify ordering is internally consistent
      if i < j {
        XCTAssertLessThanOrEqual(vi, vj, file: sourceLocation, line: line)
      }
      if i == j {
        XCTAssertEqual(vi, vj, file: sourceLocation, line: line)
      }
      if i > j {
        XCTAssertGreaterThanOrEqual(vi, vj, file: sourceLocation, line: line)
      }
      
      // Verify Comparable laws
      if vi < vj {
        XCTAssertFalse(vj < vi, "Comparable antisymmetry violated", 
                       file: sourceLocation, line: line)
      }
    }
  }
}
```

These helpers can be reused across different test contexts. For example, `verifyConsistentOrdering` is useful for testing any custom `Comparable` conformance, while `verify(span:isStrictlyBefore:)` encapsulates domain-specific invariants about span relationships.

Here's a more complete example showing validation helpers in action:

```swift
func validateTranslatedBy<R: BinaryFloatingPoint>(
  original: LinearSpan<R>,
  offset: R,
  sourceLocation: StaticString = #filePath,
  line: UInt = #line
) {
  let translated = original.translated(by: offset)
  
  // Length should be preserved
  XCTAssertEqual(
    translated.length, original.length,
    "Translation should preserve span length",
    file: sourceLocation, line: line
  )
  
  // Bounds should be shifted by offset
  let expectedLower = original.lowerBound + offset
  let expectedUpper = original.upperBound + offset
  
  // Use appropriate comparison for floating point
  if offset.isFinite && original.lowerBound.isFinite {
    XCTAssertEqual(
      translated.lowerBound, expectedLower,
      accuracy: R.ulpOfOne * max(abs(expectedLower), 1),
      "Lower bound should be translated by offset",
      file: sourceLocation, line: line
    )
  }
  
  // Verify containment relationships are preserved
  let testPoint = original.lowerBound + (original.length / 2)
  if original.contains(testPoint) && offset.isFinite {
    XCTAssertTrue(
      translated.contains(testPoint + offset),
      "Translated span should contain translated points",
      file: sourceLocation, line: line
    )
  }
}
```

Validation helpers make tests more semantic and help identify exactly what property is being tested. They're particularly valuable when testing numerical code where the same mathematical properties need to be verified across multiple scenarios.

## Swift Testing Limitations

Despite Swift Testing being the more modern framework with better Swift integration in many ways, it currently lacks any satisfactory approach for generic testing comparable to what we've achieved with XCTest.

### No Generic Test-Case Classes

Swift Testing doesn't have test-case classes at all—tests are just functions, potentially organized within structs annotated with `@Suite`. This fundamental architectural difference means the XCTest inheritance strategy has no direct equivalent.

### Test Functions Cannot Be Generic

You might hope to write something like:

```swift
@Test
func testSpanTranslation<T: BinaryFloatingPoint>() {
  let span = LinearSpan<T>(lowerBound: 0, length: 1)
  // ... test logic
}
```

But this isn't supported—test functions in Swift Testing cannot have generic parameters. The framework needs to know all test functions at compile time with concrete signatures.

### Failed Approach: Metatypes and Parameter Packs

One might attempt to use Swift Testing's parameterized test feature with metatypes:

```swift
@Test(
  arguments: [
    Float16.self as any BinaryFloatingPoint.Type,
    Float.self as any BinaryFloatingPoint.Type,
    Double.self as any BinaryFloatingPoint.Type
  ]
)
func testWithMetatype(type: any BinaryFloatingPoint.Type) {
  // Attempt to use 'type' to perform generic testing...
}
```

Unfortunately, this approach quickly hits fundamental limitations. What you can do with protocol-metatype values is extremely limited—you can't use them to instantiate generic types or call generic functions in any useful way. Parameter packs don't help here either, as they solve a different problem (variadic generic parameters) and still require compile-time resolution.

### Macro-Based Solutions: A Future Possibility?

The most promising future direction appears to be custom macros that could generate the necessary boilerplate. Imagine something like:

```swift
@Suite("LinearSpan<T>")
@GenerateTestSpecializations(types: Float16.self, Float.self, Double.self)
struct LinearSpanTests {
  
  @GenericTestTemplate("Translation preserves length ({{typename}})")
  private func _testTranslation<T: BinaryFloatingPoint>(type: T.Type) {
    let span = LinearSpan<T>(lowerBound: 0, length: 1)
    let translated = span.translated(by: 10)
    #expect(translated.length == span.length)
  }
}
```

This would expand to create individual test functions for each type. However, this remains speculative—at time of writing, the necessary macro capabilities are either unavailable or still behind feature flags. Additionally, designing such a system well would require careful consideration of parameterized tests, multiple generic parameters, and how to specify type-dependent test metadata.

### Current Recommendation: Stick with XCTest

Given these limitations, if you need to write generic tests for generic Swift code at any non-trivial scale, XCTest remains the better choice. While you could write validation helpers and copy-paste concrete test functions in Swift Testing, this approach only works for very small test suites.

For simple cases with just a few tests and types, the copy-paste approach with validation helpers is acceptable:

```swift
// Validation helper
func validateStackBehavior<T: Equatable>(type: T.Type, values: [T]) {
  var stack = Stack<T>()
  for value in values {
    stack.push(value)
  }
  for value in values.reversed() {
    #expect(stack.pop() == value)
  }
}

// Concrete tests (copy-pasted)
@Test func testStack_Int() {
  validateStackBehavior(type: Int.self, values: [1, 2, 3])
}

@Test func testStack_String() {
  validateStackBehavior(type: String.self, values: ["a", "b", "c"])
}
```

But this doesn't scale—once you have dozens of tests across multiple types, the maintenance burden becomes untenable.

## Conclusion

Generic testing—writing test suites that are themselves generic—is a powerful technique for validating generic Swift code, particularly when that code's correctness depends on subtle properties of the concrete types being used. This is especially important for numerical and algorithmic code, where behaviors can vary significantly between types like `Float16`, `Float`, and `Double`.

The XCTest-based approach using generic base classes provides an excellent solution that meets all our requirements: truly generic test logic, minimal invocation overhead, and full integration with standard tooling. Combined with validation helpers and systematic value provisioning through protocols, it creates a robust testing strategy that scales well.

While it's somewhat ironic that the older XCTest framework handles this advanced use case better than the more modern Swift Testing, the current reality is clear: if you need generic testing capabilities, XCTest is the way to go. Swift Testing may eventually grow to support these use cases—perhaps through macros or other language features—but for now, the situation is what it is.

The good news is that the XCTest solution works well. It's battle-tested, integrates perfectly with Xcode, and provides all the flexibility needed to thoroughly test generic code. For those working on libraries with complex generic algorithms or numerical code with multiple floating-point types, mastering this pattern is well worth the investment.
