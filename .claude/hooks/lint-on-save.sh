#!/bin/bash
# Runs linters on files after Claude edits them

# Read hook input from stdin
input=$(cat)
file_path=$(echo "$input" | jq -r '.tool_input.file_path // empty')

# Exit silently if no file path
[ -z "$file_path" ] && exit 0

# Only lint specific file types
case "$file_path" in
  *.js|*.jsx|*.ts|*.tsx|*.astro)
    cd "$CLAUDE_PROJECT_DIR"
    npm run lint:fix -- "$file_path" 2>/dev/null || true
    ;;
  *.md|*.mdx)
    cd "$CLAUDE_PROJECT_DIR"
    npm run spellcheck 2>/dev/null || true
    ;;
esac

exit 0
