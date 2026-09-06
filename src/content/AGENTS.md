# Site content

Blog posts and projects use `<slug>/index.md`; briefs use
`<category>/<name>.md`. Brief categories may have `category.yaml` metadata.
[The collection schemas](../content.config.ts) define frontmatter;
the `dispatches-content` skill covers publishing details.

Keep agent instruction files here, above the collection directories: their
Markdown loaders would treat nested `AGENTS.md` and `CLAUDE.md` as content.
