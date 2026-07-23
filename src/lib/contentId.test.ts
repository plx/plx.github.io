import { describe, expect, it } from "vitest";
import { stripIndexId } from "./contentId";

describe("stripIndexId", () => {
  it.each([
    ["my-post/index.md", "my-post"],
    ["my-post/index.mdx", "my-post"],
    ["nested/my-post/index.md", "nested/my-post"],
  ])("normalizes folder-based entry %s to %s", (entry, expected) => {
    expect(stripIndexId({ entry })).toBe(expected);
  });

  it.each([
    ["my-post.md", "my-post"],
    ["nested/my-post.mdx", "nested/my-post"],
  ])("strips the extension from flat fallback entry %s", (entry, expected) => {
    expect(stripIndexId({ entry })).toBe(expected);
  });

  it("leaves non-Markdown entry names unchanged", () => {
    expect(stripIndexId({ entry: "my-post.txt" })).toBe("my-post.txt");
  });
});
