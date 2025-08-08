---
title: "Name Collisions in Result Builders"
description: "You get a `ForEach`, and you get a `ForEach`, and..."
category: "Swift Wart"
date: "2025-07-17"
---

Writing an idiomatic `@resultBuilder` requires defining "keyword-like" structs. For example, when you write `ForEach` in SwiftUI, what you're actually seeing is something like this:

- there's a `ForEach` struct (defined in SwiftUI) 
- there's a `ViewBuilder` result-builder (defined in SwiftUI)
- the `ViewBuilder` has `buildExpression` overload that takes a `ForEach` value 

In addition to SwiftUI's `ForEach`, there's also `RegexBuilder`'s `ZeroOrMore`, `OneOrMore`, and `ChoiceOf`, as well as  Square's `Predicate`'s `Or` and `And`. 

All of these are great ergonomics and yield a very DSL-like feel, but there's a catch: all of these keyword-like structs are living in their module's top-level namespace, which introduces a real risk of name collisions.

For example, you make your own `ContentValidation` builder, you want it to include its own `ChoiceOf`, *and* you want it to use Swift's native regexes in its validation rules...and now you likely have to prefix each `ChoiceOf` with its module name. 

The same would be true if you wanted to use your own `ForEach` in a project using SwiftUI, and so on—no need to belabor the point. 

In any case, [compiler-level solutions have already been proposed and discussed, but don't seem to have any forward momentum](https://forums.swift.org/t/pitch-result-builder-scoped-unqualified-lookup/62190/).
