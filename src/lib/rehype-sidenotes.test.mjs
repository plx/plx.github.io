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
  const file = {
    data: { astro: { frontmatter: { sidenotes: true } } },
    message: vi.fn(),
  };
  const transform = rehypeSidenotes();
  transform(tree, file);
  return file;
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
    expect(html).toContain("<span class=\"sidenote\" role=\"note\" aria-label=\"Note 1\">");
    expect(html).toContain("<span class=\"num\" aria-hidden=\"true\">1.</span>");
    expect(html).toContain("<strong>body</strong>");
    expect(html).not.toContain("data-footnotes");
    expect(html).not.toContain("data-footnote-backref");
    expect(html).not.toContain("↩");
  });

  it("uses rendered citation numbers for named and out-of-order labels", async () => {
    const html = await render(
      "First cited.[^later]\n\nSecond cited.[^earlier]\n\n[^earlier]: Earlier definition.\n[^later]: Later definition.",
      { sidenotes: true }
    );

    expect(html).toContain("<sup class=\"fnref\" data-n=\"1\">1</sup>");
    expect(html).toContain("aria-label=\"Note 1\"");
    expect(html).toContain("<span class=\"num\" aria-hidden=\"true\">1.</span>Later definition.");
    expect(html).toContain("<sup class=\"fnref\" data-n=\"2\">2</sup>");
    expect(html).toContain("aria-label=\"Note 2\"");
    expect(html).toContain("<span class=\"num\" aria-hidden=\"true\">2.</span>Earlier definition.");
    expect(html).not.toContain("data-n=\"later\"");
    expect(html).not.toContain("data-n=\"earlier\"");
  });

  it("clones sidenote content when a footnote is cited more than once", async () => {
    const html = await render("Again.[^reuse]\n\nStill again.[^reuse]\n\n[^reuse]: Shared note.", {
      sidenotes: true,
    });

    expect(html.match(/class="sidenote"/g)).toHaveLength(2);
    expect(html.match(/Shared note\./g)).toHaveLength(2);
  });

  it("warns when block-level footnote content cannot be represented inline", () => {
    const tree = {
      type: "root",
      children: [
        {
          type: "element",
          tagName: "p",
          properties: {},
          children: [{ type: "text", value: "Body " }, footnoteRef(1, "1")],
        },
        {
          type: "element",
          tagName: "section",
          properties: { dataFootnotes: true },
          children: [
            {
              type: "element",
              tagName: "ol",
              properties: {},
              children: [
                {
                  type: "element",
                  tagName: "li",
                  properties: { id: "fn-1" },
                  children: [
                    {
                      type: "element",
                      tagName: "p",
                      properties: {},
                      children: [{ type: "text", value: "Inline note." }],
                    },
                    {
                      type: "element",
                      tagName: "ul",
                      properties: {},
                      children: [
                        {
                          type: "element",
                          tagName: "li",
                          properties: {},
                          children: [{ type: "text", value: "Skipped block." }],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    const file = run(tree);

    expect(file.message).toHaveBeenCalledOnce();
    expect(file.message.mock.calls[0][0]).toContain("<ul>");
    expect(JSON.stringify(tree)).toContain("Inline note.");
    expect(JSON.stringify(tree)).not.toContain("Skipped block.");
  });
});
