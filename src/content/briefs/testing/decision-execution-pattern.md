---
title: "The Decision-Execution Pattern"
cardTitle: "The Decision-Execution Pattern"
description: "Dividing your code into separate \"decision\" and \"execution\" phases clarifies intent and improves testability."
date: "2025-08-31"
draft: true
---

One design pattern I find *tremendously* helpful for improving testability is what I call the "decision-execution" pattern; consider this a smaller-scale version of the ["plan-execute" pattern](https://mmapped.blog/posts/29-plan-execute).

The basic idea is to divide the operation you want to test into two phases: 

1. a "decision" phase that determines what needs to be done, and returns some kind of data item describing what to do
2. an "execution" phase that actually does whatever work was decided-upon in the "decision" phase

TODO: provide a *motivated*, *concrete* example.

*Postscript:* another way to interpret this pattern is as an informal, private, delegate-like design pattern:

The code in the "decision" phase should *generally* be structured as a pure function that receives all relevant information via parameters and returns a   a function that returns a data item, e.g.:
