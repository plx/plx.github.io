# Vale Prose Linting

Vale checks article prose in `src/content`.

## Structure

- `.vale.ini`: selects the content paths and enabled style namespaces.
- `.vale/styles/Terminology/`: consistency checks for product, platform, API, and brand terms.

Add new rule files under the most specific style namespace that fits the rule. If a new family of checks does not fit `Terminology`, add another directory under `.vale/styles` and include it in `.vale.ini` with `BasedOnStyles`.

## Rule Notes

Apple terminology substitutions are case-sensitive and list the incorrect forms they should catch. That keeps correctly cased terms from depending on case-insensitive substitution behavior.

The substitution list is a regression-tested guardrail for common incorrect forms, not an exhaustive casing detector. Add explicit variants when a new mistake shows up in content or review.

Historical Apple platform names such as `classic Mac OS` and `Mac OS X` are valid when discussing older systems. If a passage intentionally uses a form that a rule flags, keep the exception local:

```markdown
<!-- vale Terminology.Apple = NO -->
classic mac os spelling retained for quoted or historical context
<!-- vale Terminology.Apple = YES -->
```

MDX files are treated as Markdown. JSX component attribute values can be linted as prose, so use local Vale disable comments around intentional non-prose values when needed.

Image alt text is linted with the rest of article prose because it ships to readers and assistive technology.

The local `@vvago/vale` package downloads the Vale binary during npm install. The lint command itself uses the checked-in rules and does not run `vale sync`.

## Usage

```bash
npm run lint:prose
npm run test:vale
just lint-prose
```
