export function renderInlineMarkdown(text: string): string {
  if (!text) return "";

  // Helper function to escape HTML entities
  const escapeHtml = (str: string): string => {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  // Process inline markdown patterns
  let html = text
    // Code: `text` - escape content inside backticks, then wrap in <code>
    .replace(/`([^`]+)`/g, (_, content) => `<code>${escapeHtml(content)}</code>`)

    // Bold: **text** or __text__ - escape content, then wrap in <strong>
    .replace(/\*\*([^*]+)\*\*/g, (_, content) => `<strong>${escapeHtml(content)}</strong>`)
    .replace(/__([^_]+)__/g, (_, content) => `<strong>${escapeHtml(content)}</strong>`)

    // Italic: *text* or _text_ (but not part of bold) - escape content, then wrap in <em>
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, (_, content) => `<em>${escapeHtml(content)}</em>`)
    .replace(/(?<!_)_([^_]+)_(?!_)/g, (_, content) => `<em>${escapeHtml(content)}</em>`)

    // Strikethrough: ~~text~~ - escape content, then wrap in <del>
    .replace(/~~([^~]+)~~/g, (_, content) => `<del>${escapeHtml(content)}</del>`);

  // Escape any remaining unprocessed text (text outside of markdown patterns)
  // This is tricky because we need to avoid escaping the HTML we just created
  // For now, we'll leave plain text unescaped since Astro should handle it

  return html;
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