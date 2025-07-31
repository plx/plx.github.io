---
layout: post
title: "Your Post Title Here"
date: YYYY-MM-DD
description: "A brief description of your post that will appear in the post listing"
tags: [tag1, tag2, tag3]
---

Replace this opening paragraph with your introduction. This should grab the reader's attention and explain what the post is about.

## Main Section

Your main content goes here. You can use various Markdown features:

### Subsection

You can create multiple levels of headings.

## Formatting Examples

**Bold text** and *italic text* and ***bold italic text***.

You can create [external links](https://example.com) or [internal links to other posts]({{ site.baseurl }}{% post_url 2025-01-31-getting-started-with-jekyll %}).

Link to pages: [About page]({{ '/about/' | relative_url }}) or [Tags page]({{ '/tags/' | relative_url }}).

## Lists

Unordered list:
- First item
- Second item
  - Nested item
  - Another nested item
- Third item

Ordered list:
1. First step
2. Second step
3. Third step

## Code Examples

Inline code: `const example = "Hello World";`

Code block with syntax highlighting:

```javascript
function greet(name) {
  return `Hello, ${name}!`;
}

console.log(greet("Jekyll"));
```

```bash
# Command line example
jekyll serve --watch
```

## Blockquotes

> This is a blockquote. It's useful for highlighting important information
> or quoting external sources.

## Images

If you have images in your repository:

```markdown
![Alt text for image]({{ '/assets/images/example.png' | relative_url }})
```

## Tables

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Row 1    | Data     | More data|
| Row 2    | Data     | More data|
| Row 3    | Data     | More data|

## Horizontal Rule

---

## Task Lists (GitHub Flavored Markdown)

- [x] Completed task
- [ ] Incomplete task
- [ ] Another todo item

## Conclusion

Wrap up your post with a conclusion that summarizes the key points or provides next steps for the reader.