---
title: "The \"Three-File Pattern\" in Objective-C"
cardTitle: "The \"Three-File Pattern\""
description: "Objective-C's \"-Private\"-Header Pattern & the Problems it Solves"
date: "2025-08-19"
---

An *apparently-obscure*[^1] Objective-C pattern is what I call the three-file pattern:

- `ClassName.h`: "public" header with outward-facing API
- `ClassName-Private.h`[^2]: "private" header with internal details (usually in a "class continuation", e.g. `@interface ClassName ()`)
- `ClassName.m` (or `.mm`): implementation file

[^1]: It's rarely discussed online (except in passing); when I introduce it developers, it's rare for them to have seen it.

[^2]: Different naming conventions exist: `+Private.h`, `_Private.h`, etc., as well as e.g. `Details` or `Internals` (etc.) instead of `Private`.

When writing Objective-C++, the breakdown looks like:

- `ClassName.h`: a purely Objective-C API
- `ClassName-Private.h`: C++ elements included here
- `ClassName.mm`: implementation file

Small, simple Objective-C classes do not benefit from the pattern, but larger, more-complex constructions often do.
In particular, in the "modern era" I'd say there are two main beneficiaries of this pattern:

- Objective-C++ classes (particularly ones with Objective-C APIs and/or subclasses)
- class clusters (particularly "closed" class clusters, e.g. ones not meant for external subclassing)

These scenarios *can* overlap, but can also happen separately.

As an example illustrating both, let's say we're writing a class cluster that:

- represents an in-memory OpenCV image
- is essentially "just a wrapper around an OpenCV `cv::Mat` value"
- has subclasses for various concrete types (e.g. monochrome, RGB, BGRA, etc.)
- should have a purely objective-c API (e.g. no C++ "leakage")
- will have a large API surface area, broken down into topic-specific categories

In that case, our base class might look like this:


```objc++
// OpenCVImage.h
@interface OpenCVImage : NSObject 

@property(nonatomic, assign, readonly) NSInteger width;
@property(nonatomic, assign, readonly) NSInteger height;
@property(nonatomic, assign, readonly) OpenCVImageType imageType;

- (instancetype)init NS_UNAVAILABLE;

@end

// OpenCVImage-Private.h
@interface OpenCVImage () {
  cv::Mat _mat;
}

- (instancetype)initWithCVMat:(const cv::Mat&)mat NS_DESIGNATED_INITIALIZER;

@end

// OpenCVImage.mm
#import "OpenCVImage.h"
#import "OpenCVImage-Private.h"

@implementation OpenCVImage

- (NSInteger)width {
  return static_cast<NSInteger>(_mat.cols);
}

- (NSInteger)height {
  return static_cast<NSInteger>(_mat.rows);
}

- (OpenCVImageType)imageType {
  // helper function
  return OpenCVImageTypeFromCVMat(_mat);
}

- (instancetype)initWithMat:(cv::Mat)mat {
  self = [super init];
  if (self) {
    _mat = mat;
  }
  return self;
}

@end
```

As you can see, this:

- gives us a base class that "looks" purely like Objective-C
- completely hides the C++ implementation details (no `#if __cplusplus` or similar)
- allows subclasses and categories to access the C++ implementation details via the private header

To see the latter point, here's a sample subclass:

```objc++
// BGRAOpenCVImage.h

// optional: mark this as a "final"-ish class (best we can do in Objective-C)
__attribute__((objc_subclassing_restricted))
@interface BGRAOpenCVImage : OpenCVImage

@end

// BGRAOpenCVImage-Private.h
#import "BGRAOpenCVImage.h"
#import "OpenCVImage-Private.h"

@interface BGRAOpenCVImage ()

- (instancetype)initWithCVMat:(const cv::Mat&)mat NS_DESIGNATED_INITIALIZER;

@end

// BGRAOpenCVImage.mm
#import "BGRAOpenCVImage.h"
#import "BGRAOpenCVImage-Private.h"

@implementation BGRAOpenCVImage

- (instancetype)initWithMat:(cv::Mat)mat {
  NSParameterAssert(mat.type() == CV_8UC4);
  return [super initWithMat:mat];
}

@end
```

Here's an example category on the base class:

```objc++
// OpenCVImage+Loading.h
@interface OpenCVImage (Loading)

+ (nullable __kindof instancetype)imageWithContentsOfFile:(NSString *)filePath;

@end

// OpenCVImage+Drawing.mm
#import "OpenCVImage.h"
#import "OpenCVImage-Private.h"
#import "OpenCVImage+Loading.h"
#import "BGRAOpenCVImage-Private.h"
#import "MonochromeOpenCVImage-Private.h"

@implementation OpenCVImage (Drawing)

+ (nullable instancetype)imageWithContentsOfFile:(NSString *)filePath {
    cv::Mat mat = cv::imread([filePath UTF8String]);
    if (mat.empty()) {
      return nil;
    }
    OpenCVImageType imageType = OpenCVImageTypeFromCVMat(mat);
    if (imageType == OpenCVImageTypeUnknown) {
      return nil;
    }

    switch (imageType) {
    case OpenCVImageTypeBGRA:
      return [[OpenCVImage alloc] initWithMat:mat];
    case OpenCVImageTypeMonochrome:
      return [[MonochromeOpenCVImage alloc] initWithMat:mat];
    }
}

- (void)drawRect:(CGRect)rect {
  // use _mat to draw
}

@end
```

Note that you could also define narrower categories on specific subclasses, e.g. a `MonochromeOpenCVImage+Loading.h` that adds a `+monochromeImageWithContentsOfFile:` method—this is just showing you how the three-file pattern plays out in practice.

Anyways, for situations like the one above, I find the three-file pattern tremendously useful, and am unsure why it remains obscure.
Somewhat curiously, I didn't invent it myself, but can't pin down where I came across it: I don't remember where I learned it, and can't find an obvious place I might've seen it before.
The closest matches I could find were the below, neither of which feels like the right spot:

- [Microsoft's (legacy?) Objective-C style guide](https://microsoft.github.io/objc-guide/Headers/Factoring.html)
- [A WWDC talk from 2011](https://nonstrict.eu/wwdcindex/wwdc2011/322/) (strangely hard to locate)

