---
title: "Definition Order Matters in Swift Packages"
description: "You *Can* Use Helpers in `Package.swift`, but only if they are defined before use."
date: "2025-08-22"
---

Short and sweet: in larger projects it can be helpful to define helper functions within your `Package.swift` file, but there's a catch: you *must* define them before their use site. 

What makes this a wart is the following:

- your `Package.swift` file will "compile" ok (you just get bizarre errors)
- it's different from the rest of Swift, which imposes no such ordering restriction

For this one there isn't really a fix—it's just something to be aware of.
