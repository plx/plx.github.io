export function renderInlineMarkdown(text: string): string {
  if (!text) return '';
  
  // Process inline markdown patterns
  let html = text
    // Escape HTML entities first
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    
    // Process markdown patterns
    // Bold: **text** or __text__
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    
    // Italic: *text* or _text_ (but not part of bold)
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
    .replace(/(?<!_)_([^_]+)_(?!_)/g, '<em>$1</em>')
    
    // Code: `text`
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    
    // Strikethrough: ~~text~~
    .replace(/~~([^~]+)~~/g, '<del>$1</del>');
    
  return html;
}