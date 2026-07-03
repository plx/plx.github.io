import { describe, expect, it, vi } from "vitest";
import rehypeSidenotes from "./rehype-sidenotes.mjs";

function run(tree) {
  const transform = rehypeSidenotes();
  transform(tree, {
    data: { astro: { frontmatter: { sidenotes: true } } },
    message: vi.fn(),
  });
}

function footnoteRef(id, label) {
  return {
    type: "element",
    tagName: "sup",
    properties: {},
    children: [
      {
        type: "element",
        tagName: "a",
        properties: { href: `#fn-${id}`, dataFootnoteRef: true },
        children: [{ type: "text", value: label }],
      },
    ],
  };
}

describe("rehypeSidenotes", () => {
  it("keeps the original footnote reference when the note definition is missing", () => {
    const ref = footnoteRef(1, "1");
    const tree = {
      type: "root",
      children: [
        {
          type: "element",
          tagName: "p",
          properties: {},
          children: [{ type: "text", value: "Body " }, ref],
        },
      ],
    };

    run(tree);

    const paragraph = tree.children[0];
    expect(paragraph.children[1]).toBe(ref);
    expect(paragraph.children).toHaveLength(2);
  });
});
