# Spell Checking Setup

This project uses CSpell for spell checking both source files and generated HTML output.

## Features

✅ **Smart Technical Recognition**: CSpell understands camelCase, PascalCase, and snake_case naming conventions, making it ideal for technical content.

✅ **Custom Dictionary**: Project-specific terms are maintained in `cspell.json` for easy management.

✅ **Dual-Phase Checking**: 
- Source files (markdown, TypeScript, Astro) are checked pre-build
- HTML output is checked post-build to catch rendering issues

✅ **CI/CD Integration**: Automated spell checking in GitHub Actions prevents typos from reaching production.

## Usage

### Check Source Files
```bash
npm run spellcheck
```

### Check Generated HTML
```bash
npm run build
npm run spellcheck:html
```

### Check Everything
```bash
npm run spellcheck:all
```

### Add New Terms

Edit the `words` array in `cspell.json`:

```json
{
  "words": [
    "yourNewTerm",
    // ... other terms
  ]
}
```

## Configuration

The spell checker is configured in `cspell.json` with:

- **Multiple Dictionaries**: TypeScript, npm packages, HTML, CSS, and software terms
- **Smart Ignoring**: Excludes code blocks, import statements, and HTML attributes
- **File-Specific Rules**: Different rules for markdown vs code files
- **Path Exclusions**: Ignores node_modules, dist, and other generated files

## Example Output

When a typo is found:
```
src/content/projects/personal-website/index.md:24:53 - Unknown word (sytem) fix: (system)
```

## Alternatives Considered

We evaluated several spell-checking solutions:

- **Hunspell/Aspell**: Traditional spell checkers, but poor at handling technical terms and camelCase
- **LanguageTool**: Excellent for grammar but overkill for basic spell checking
- **textlint**: Good but requires more configuration for technical content
- **Vale**: Great for style guides but complex setup for simple spell checking

CSpell was chosen because it:
- Has built-in understanding of code conventions
- Includes extensive technical dictionaries
- Integrates easily with npm scripts and CI/CD
- Provides fast performance
- Offers smart suggestions for technical terms