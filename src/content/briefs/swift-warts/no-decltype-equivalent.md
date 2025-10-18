---
title: "Swift lacks a `decltype` Equivalent"
cardTitle: "Lack of a `decltype` Equivalent"
description: "In the absence of a `decltype`-like mechanism, some nice-to-have macros wind up unimplementable"
date: "2025-08-15"
---

**Update:** the specific issue prompting this brief disappeared between when I drafted it (beta season) and when I finished it (Xcode 26 public release). This doesn't invalidate the broader potential benefit of a `decltype`-like construct, but does significantly lessen its salience—I've shortened the brief appropriately.

In C++, the `decltype($expression)` construct works like a "magic preprocessor macro" that gets replaced by the compiler-inferred type of `$expression`:

```c++
int32_t a = 1;
decltype(a) b = 2; // b is inferred to be `int32_t`
int64_t c = 3;
decltype(a + c) d = 4; // d is inferred to be `int64_t`, due to numeric promotion rules
```

In C++ this capability is *necessary* because there are often situations wherein you *must* provide an explicit type declaration, but *writing it* falls somewhere between *difficult* to *impossible*; here's an example taken from [cppreference](https://en.cppreference.com/w/cpp/language/decltype.html), wherein we need to use `decltype` to declare the a-priori *unknowable* return type of a function template:

```c++
template<typename T, typename U>
auto add(T t, U u) -> decltype(t + u) { return t + u; }
```

Swift (thankfully) avoids the need for such a construct:

- Swift's type inference largely allows us to omit type annotations for variables and closures (etc.)
- Swift's generic system ensures that even the types of operations are always knowable[^1]

[^1]: In C++, that `add` function works like a text template: `add(x,y)` behaves as-if you (1) naively replaced it with `x + y` in the source and only then (2) tried to compile it; this is very different from Swift's generic system, which directly compiles generic methods against explicitly-specified protocol APIs.

As such, (a) we mostly don't need to write annotations but (b) we *can* write them when we need to do so, because we have all the information we need.

Or so I thought, but there's one exception: sometimes Swift *macros* can generate code that falls into a trap:

- the generated code is syntactically and semantically correct
- the code is too complex to rely purely on type inference (e.g. complex/nested closures)
- the ordinary fix is to add explicit type annotations 
- this is unavailable within a macro because it cannot "see" the type parameters during expansion

As such, in this one specific case it'd *potentially* be helpful to have a `decltype` equivalent within the language. Given how awkward a fit it is with the rest of the language, however, it'd seem reasonable to limit it to only being valid within macro expansions.
