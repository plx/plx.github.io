---
title: "You (Often) Want `EquivalentObjects`, Not `isEqual:`"
cardTitle: "`EquivalentObjects` vs `isEqual:`"
description: "`nil`-Messaging Lays a Subtle Trap for `isEqual:`"
date: "2025-08-22"
---

A quirky aspect of Objective-C is that sending messages to `nil` is *valid*: 

- it's a no-op, not a crash
- the return value is the "all-zero" value for the return type[^1]

This is *very* different from most other languages:

- modern languages[^2] tend to make "calling a method on `nil`" impossible via compile-time checks.
- older languages[^3] tend to make "calling a method on `nil`" a crash.

[^1]: In Swift terminology, it's as-if `bar.someMethod()` were getting implicitly-rewritten to `bar?.someMethod() ?? 0` (loosely-speaking).

[^2]: Swift, Rust, Kotlin, and so on.

[^3]: C++, Java, and so on.

The focus of this brief is a specific pitfall that arises from this behavior:

- in Objective-C, you check semantic equality via `isEqual:` (e.g. `[foo isEqual:bar]`)
- `isEqual:` returns `NO` when sent to `nil`, which probably isn't what you want

In other words, the truth table you *want* looks like this:

|   | `nil` | X | Y |
|---|---|---|---|
| `nil` | `YES` | `NO` | `NO` |
| X  | `NO` | `YES` | `NO` |
| Y | `NO` | `NO` | `YES` |

...but the truth table you *get* from `[foo isEqual:bar]` looks like this:

|   | `nil` | X | Y |
|---|---|---|---|
| `nil` | **`NO`** | `NO` | `NO` |
| X  | `NO` | `YES` | `NO` |
| Y | `NO` | `NO` | `YES` |

This can lead to subtle bugs like in the code below:

```objective-c
// ProjectDescriptor.h
@interface ProjectDescriptor : NSObject 

@property(nonatomic, nonnull, copy, readonly) NSString *projectName;
@property(nonatomic, nullable, copy, readonly) NSURL *repositoryURL;

- (instancetype)init NS_UNAVAILABLE;
- (instancetype)initWithProjectName:(NSString *)projectName repositoryURL:(NSURL *)repositoryURL NS_DESIGNATED_INITIALIZER;

// dedicated equality-checker that we will also call from within `isEqual:` 
- (BOOL)isEqualToProjectDescriptor:(ProjectDescriptor *)other;

@end
```

```objective-c
// ProjectDescriptor.m
@implementation ProjectDescriptor

- (BOOL)isEqualToProjectDescriptor:(ProjectDescriptor *)other {  
  return [self.projectName isEqual:other.projectName] && [self.repositoryURL isEqual:other.repositoryURL];
}

@end
```

```objective-c
// ProjectDescriptorTests.m
@import XCTest;

@interface ProjectDescriptorTests : XCTestCase

@end

@implementation ProjectDescriptorTests

- (void)testEquality {
  ProjectDescriptor *foo = [[ProjectDescriptor alloc] initWithProjectName:@"Foo" repositoryURL:nil];
  ProjectDescriptor *bar = [[ProjectDescriptor alloc] initWithProjectName:@"Foo" repositoryURL:nil];
  XCTAssertTrue([foo isEqualToProjectDescriptor:bar]);
}

@end
```

Can you spot why `testEquality` will fail?

If not, here's the explanation: `isEqualToProjectDescriptor:` when `repositoryURL` is `nil`, then `[foo.repositoryURL isEqual:bar.repositoryURL]` will *always* return `NO`, *even if* `bar.repositoryURL` is also `nil`—that's just `nil`-messaging at work!

Thankfully, in this case knowing is ~half~ about ~80%~ of the battle: once you're aware of this trap, it's easy to avoid via consistent use of a C-style wrapper function. 

The way I usually write it looks like this:

```objective-c
static inline 
BOOL EquivalentObjects(id _Nullable lhs, id _Nullable rhs) {
  return lhs == rhs || [lhs isEqual:rhs];
}
```

As such a simple function, there's not much to say about it beyond administrivia:

- it's not a bad idea to put a namespace prefix on it
- it's also not a bad idea to give it a hard-to-use Swift name (e.g. `NS_SWIFT_NAME(__don't_use_EquivalentObjects(_:_:)`)
- you can *consider* replacing it with a macro, but I wouldn't—it's trickier than it looks!
- you want to make sure it's not visible-from/used-within your public headers[^5]

[^5]: Mainly to avoid any possible chance of ambiguity / name conflicts / duplicate symbols / other shenanigans.

That's about it!

Once you have that function defined, the rest is just being consistent with using it instead of `isEqual:`. 
My personal strategy for it is:

- use it unconditionally for *all* equality checks *inside* methods like `isEqual:` (and type-specific helpers like `isEqualToProjectDescriptor:`)
- use it *when appropriate* for checks impacting control flow (it's often more legible to include explict `!= nil` checks in those cases, however)

