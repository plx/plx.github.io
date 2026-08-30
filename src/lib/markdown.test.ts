import { describe, expect, it } from "vitest";
import { renderInlineMarkdown, stripMarkdown } from "./markdown";

describe("renderInlineMarkdown", () => {
  it("renders the supported inline emphasis forms", () => {
    expect(renderInlineMarkdown("`code` **bold** *italic* ~~old~~")).toBe(
      "<code>code</code> <strong>bold</strong> <em>italic</em> <del>old</del>",
    );
  });

  it("escapes HTML in both plain and formatted text", () => {
    expect(renderInlineMarkdown("<script> **<b>** & 'quoted'")).toBe(
      "&lt;script&gt; <strong>&lt;b&gt;</strong> &amp; &#039;quoted&#039;",
    );
  });
});

describe("stripMarkdown", () => {
  it("returns plain text suitable for metadata and feeds", () => {
    expect(stripMarkdown("*Generic* `code`, **bold**, _italic_, and ~~old~~")).toBe(
      "Generic code, bold, italic, and old",
    );
  });

  it("removes stray HTML tags", () => {
    expect(stripMarkdown("Read <strong>this</strong>")).toBe("Read this");
  });
});
