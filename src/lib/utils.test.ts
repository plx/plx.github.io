import { describe, expect, it } from "vitest";
import { readingTime } from "./utils";

/** Build a string containing exactly `count` whitespace-separated words. */
function words(count: number): string {
  return Array.from({ length: count }, () => "word").join(" ");
}

describe("readingTime", () => {
  // Standard formula is `max(1, ceil(wordCount / 200))`: a short post is
  // always at least "1 min read", and there is no blanket extra minute.
  it.each([
    [0, "1 min read"],
    [1, "1 min read"],
    [199, "1 min read"],
    [200, "1 min read"],
    [201, "2 min read"],
    [399, "2 min read"],
    [400, "2 min read"],
    [401, "3 min read"],
  ])("reports %i words as %s", (count, expected) => {
    expect(readingTime(words(count))).toBe(expected);
  });

  it("normalizes empty content to a 1 min read", () => {
    expect(readingTime("")).toBe("1 min read");
    expect(readingTime("   \n\t  ")).toBe("1 min read");
  });

  it("does not count HTML tags as words", () => {
    expect(readingTime("<p>hello world</p>")).toBe("1 min read");
    expect(readingTime(`<div>${words(200)}</div>`)).toBe("1 min read");
  });

  it("rounds partial minutes up", () => {
    expect(readingTime(words(1000))).toBe("5 min read");
    expect(readingTime(words(1001))).toBe("6 min read");
  });
});
