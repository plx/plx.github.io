# Vale Prose Linting

Vale checks article prose in `src/content`.

## Structure

- `.vale.ini`: selects the content paths and enabled style namespaces.
- `.vale/styles/Terminology/`: consistency checks for product, platform, API, and brand terms.

Add new rule files under the most specific style namespace that fits the rule. If a new family of checks does not fit `Terminology`, add another directory under `.vale/styles` and include it in `.vale.ini` with `BasedOnStyles`.

## Usage

```bash
npm run lint:prose
just lint-prose
```
