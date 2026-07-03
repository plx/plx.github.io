import { createMarkdownProcessor } from "@astrojs/markdown-remark";
import { describe, expect, it, vi } from "vitest";
import rehypeSidenotes from "./rehype-sidenotes.mjs";

async function render(content, frontmatter = {}) {
  const processor = await createMarkdownProcessor({
    rehypePlugins: [rehypeSidenotes],
  });

  const result = await processor.render(content, {
    frontmatter,
    fileURL: new URL("file:///tmp/sidenote-test.md"),
  });

  return result.code;
}

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

  it("leaves standard footnotes alone by default", async () => {
    const html = await render("Text.[^1]\n\n[^1]: Footnote.");

    expect(html).toContain("data-footnotes");
    expect(html).toContain("data-footnote-ref");
    expect(html).not.toContain("class=\"sidenote\"");
  });

  it("moves opted-in footnotes inline and removes backrefs", async () => {
    const html = await render("Text.[^1]\n\n[^1]: Footnote **body**.", {
      sidenotes: true,
    });

    expect(html).toContain("<sup class=\"fnref\" data-n=\"1\">1</sup>");
    expect(html).toContain("<span class=\"sidenote\">");
    expect(html).toContain("<strong>body</strong>");
    expect(html).not.toContain("data-footnotes");
    expect(html).not.toContain("data-footnote-backref");
    expect(html).not.toContain("↩");
  });
});
