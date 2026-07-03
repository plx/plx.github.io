/**
 * rehype-sidenotes — Tufte-style sidenotes for opted-in blog posts.
 *
 * Standard markdown footnotes (`[^1]`) are rendered by remark-gfm into an
 * in-text `<sup><a data-footnote-ref>` plus a `<section data-footnotes>` list
 * at the bottom of the document. For posts that set `sidenotes: true` in their
 * frontmatter, this plugin relocates each footnote's content inline next to its
 * reference as a `<span class="sidenote">`, which the `.post-blog` styles float
 * into the right-margin gutter (and collapse inline on narrow viewports). The
 * now-redundant bottom section is removed.
 *
 * Posts WITHOUT the flag are untouched — they keep the default bottom footnotes
 * (brand-styled in global.css). Dependency-free: walks the hast tree directly.
 */

function walkWithParent(node, cb, parent = null, index = -1) {
  cb(node, parent, index);
  if (node.children) {
    for (let i = 0; i < node.children.length; i++) {
      walkWithParent(node.children[i], cb, node, i);
    }
  }
}

function findFirst(node, pred) {
  if (pred(node)) return node;
  if (node.children) {
    for (const child of node.children) {
      const found = findFirst(child, pred);
      if (found) return found;
    }
  }
  return null;
}

function textContent(node) {
  if (node.type === "text") return node.value;
  return (node.children || []).map(textContent).join("");
}

// Pull a footnote definition's inline content out of its <li>, dropping the
// back-reference anchor (pointless once the note sits next to its marker) and
// flattening paragraphs (separated by <br>) so it nests inside an inline span.
//
// Only paragraph content is flattened. Block-level siblings (lists, code blocks,
// blockquotes) can't legally nest inside an inline <span>, so they're skipped —
// but we warn via file.message() rather than drop them silently, since Tufte
// sidenotes are meant to be short inline notes and the author should know the
// note isn't fully represented.
function extractInline(li, file) {
  const out = [];
  const paragraphs = (li.children || []).filter(
    (c) => c.type === "element" && c.tagName === "p"
  );
  const blocks = paragraphs.length ? paragraphs : [li];

  if (paragraphs.length && file) {
    const dropped = (li.children || []).filter(
      (c) => c.type === "element" && c.tagName !== "p"
    );
    if (dropped.length) {
      file.message(
        `rehype-sidenotes: a footnote contains block-level content ` +
          `(${dropped.map((c) => `<${c.tagName}>`).join(", ")}) that can't ` +
          `render inside an inline sidenote; only its paragraph text is kept.`,
        li
      );
    }
  }

  blocks.forEach((block, i) => {
    if (i > 0) {
      out.push({ type: "element", tagName: "br", properties: {}, children: [] });
    }
    for (const child of block.children || []) {
      if (
        child.type === "element" &&
        child.tagName === "a" &&
        child.properties &&
        Object.hasOwn(child.properties, "dataFootnoteBackref")
      ) {
        continue;
      }
      out.push(child);
    }
  });
  return out;
}

export default function rehypeSidenotes() {
  return (tree, file) => {
    const frontmatter = file && file.data && file.data.astro && file.data.astro.frontmatter;
    if (!frontmatter || frontmatter.sidenotes !== true) return;

    // 1. Locate the footnotes section and build a map of note content by id.
    const notes = new Map();
    let footnotesSection = null;
    let footnotesParent = null;

    walkWithParent(tree, (node, parent) => {
      if (
        node.type === "element" &&
        node.tagName === "section" &&
        node.properties &&
        node.properties.dataFootnotes
      ) {
        footnotesSection = node;
        footnotesParent = parent;
      }
    });

    if (footnotesSection) {
      const ol = findFirst(
        footnotesSection,
        (n) => n.type === "element" && n.tagName === "ol"
      );
      if (ol) {
        for (const li of ol.children || []) {
          if (li.type !== "element" || li.tagName !== "li" || !li.properties) continue;
          const id = li.properties.id;
          const idStr = Array.isArray(id) ? id[0] : id;
          if (idStr) notes.set(idStr, extractInline(li, file));
        }
      }
    }

    // 2. Replace each in-text reference with a static marker + sidenote.
    const refs = [];
    walkWithParent(tree, (node, parent) => {
      if (node.type === "element" && node.tagName === "sup" && parent) {
        const ref = findFirst(
          node,
          (n) =>
            n.type === "element" &&
            n.tagName === "a" &&
            n.properties &&
            n.properties.dataFootnoteRef
        );
        if (ref) {
          refs.push({
            sup: node,
            parent,
            href: ref.properties.href,
            label: textContent(ref),
          });
        }
      }
    });

    for (const { sup, parent, href, label } of refs) {
      const targetId = typeof href === "string" ? href.replace(/^#/, "") : "";
      const match = targetId.match(/(\d+)$/);
      const n = label || (match ? match[1] : "");
      const note = notes.get(targetId);
      if (!note || note.length === 0) continue;

      // Clone the note's nodes: a footnote cited more than once would otherwise
      // share the same node objects across sidenotes, breaking the hast
      // invariant that every node has exactly one parent.
      const content = structuredClone(note);

      const marker = {
        type: "element",
        tagName: "sup",
        properties: { className: ["fnref"], dataN: n },
        children: [{ type: "text", value: n }],
      };
      const sidenote = {
        type: "element",
        tagName: "span",
        properties: { className: ["sidenote"] },
        children: [
          {
            type: "element",
            tagName: "span",
            properties: { className: ["num"] },
            children: [{ type: "text", value: `${n}.` }],
          },
          ...content,
        ],
      };

      const idx = parent.children.indexOf(sup);
      if (idx >= 0) parent.children.splice(idx, 1, marker, sidenote);
    }

    // 3. Remove the now-redundant bottom footnotes section.
    if (footnotesSection && footnotesParent) {
      const idx = footnotesParent.children.indexOf(footnotesSection);
      if (idx >= 0) footnotesParent.children.splice(idx, 1);
    }
  };
}
