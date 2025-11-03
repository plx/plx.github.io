export function renderInlineMarkdown(text: string): string {
  if (!text) return "";

  const escapeHtml = (str: string): string =>
    str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const pattern = /(`([^`]+)`)|(\*\*([^*]+)\*\*)|(__([^_]+)__)|(~~([^~]+)~~)|(?<!\*)\*([^*]+)\*(?!\*)|(?<!_)_([^_]+)_(?!_)/g;

  let result = "";
  let lastIndex = 0;

  for (const match of text.matchAll(pattern)) {
    const matchIndex = match.index ?? 0;
    if (matchIndex > lastIndex) {
      result += escapeHtml(text.slice(lastIndex, matchIndex));
    }

    if (match[1]) {
      // `code`
      result += `<code>${escapeHtml(match[2] ?? "")}</code>`;
    } else if (match[3]) {
      // **bold**
      result += `<strong>${escapeHtml(match[4] ?? "")}</strong>`;
    } else if (match[5]) {
      // __bold__
      result += `<strong>${escapeHtml(match[6] ?? "")}</strong>`;
    } else if (match[7]) {
      // ~~strikethrough~~
      result += `<del>${escapeHtml(match[8] ?? "")}</del>`;
    } else if (match[9]) {
      // *italic*
      result += `<em>${escapeHtml(match[10] ?? "")}</em>`;
    } else if (match[11]) {
      // _italic_
      result += `<em>${escapeHtml(match[12] ?? "")}</em>`;
    }

    lastIndex = matchIndex + match[0].length;
  }

  if (lastIndex < text.length) {
    result += escapeHtml(text.slice(lastIndex));
  }

  return result;
}

/**
 * Strip markdown and HTML from text, returning plain text.
 * Useful for meta tags, alt text, and other contexts where plain text is needed.
 */
export function stripMarkdown(text: string): string {
  if (!text) return "";

  return text
    // Remove code: `text`
    .replace(/`([^`]+)`/g, "$1")

    // Remove bold: **text** or __text__
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")

    // Remove italic: *text* or _text_
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "$1")
    .replace(/(?<!_)_([^_]+)_(?!_)/g, "$1")

    // Remove strikethrough: ~~text~~
    .replace(/~~([^~]+)~~/g, "$1")

    // Remove HTML tags (in case any slipped through)
    .replace(/<[^>]*>/g, "");
}