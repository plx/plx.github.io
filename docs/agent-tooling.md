# Agent tooling

Configuration reviewed against current upstream documentation on 2026-09-06;
Claude plugin discovery was verified with Claude Code 2.1.252.

## Guidance and skills

`AGENTS.md` contains the short repository orientation. Scoped notes live in
`src/`, `src/content/`, `tests/`, and `docs/design-system/`; each accompanying
`CLAUDE.md` contains only `@AGENTS.md`. Root links make scoped notes discoverable
even in harnesses that only load instructions along their launch directory.
See [Codex instruction discovery](https://developers.openai.com/codex/guides/agents-md)
and [Claude's AGENTS.md import](https://code.claude.com/docs/en/memory#agentsmd).

Edit skills in `.agents/skills/`, then run `just skills-sync`. Commit both the
portable sources and `.claude/skills/` copies; `just skills-check` and CI catch
drift. The sync copies skill resources while omitting OpenAI's `agents/`
sidecars; it reports extra files without deleting them. Plugin-only directories
such as `project-lsp` are independent.

- `dispatches-design`: Twilight styling and brand assets.
- `dispatches-content`: content authoring and publication details.
- `dispatches-qa`: browser and accessibility investigation, including fixes.

All three support automatic selection and explicit invocation (`$name` in
Codex, `/name` in Claude). They use portable frontmatter with OpenAI UI metadata
in `agents/openai.yaml`. See [Codex skills](https://developers.openai.com/codex/skills)
and [Claude skills](https://code.claude.com/docs/en/skills).

The old subagent personas are retired. Language conventions stay in compiler
and lint configuration, with non-obvious project facts in scoped notes and
skills. No Claude-only language rules, model choices, tool grants, or forced
subagent execution are needed for these workflows.

## Language servers

Use the Node version in `.nvmrc`, then run:

```sh
just install
just lsp-check
claude plugin details project-lsp@skills-dir
```

`just install` installs the locked npm dependencies and runs `astro sync`, which
generates the content types the TypeScript server needs. Conductor's shared setup
script does the same before installing browsers. Conductor reads shared settings
from the remote default branch, so that setup change takes effect for new local
workspaces after merge. Existing workspaces can run `just install` now.
See [Conductor repository settings](https://conductor.build/docs/reference/settings).

Start Claude from the workspace root and accept Claude's trust dialog for that
specific workspace. `.claude/skills/project-lsp/.claude-plugin/plugin.json` loads
in place as `project-lsp@skills-dir`, with no marketplace installation. This also
fits Conductor's normal workspace-root launch. A current Claude Code release is
required: older clients may not discover project skills-directory plugins.

This trust step matters: parent-folder trust and noninteractive `claude -p` do
not authorize the project plugin. This change does not set trust on your behalf.
For an existing trusted session, run `/reload-plugins` or restart it after setup.
Check `/plugin` for the plugin and any server errors. See
[Claude's project-plugin discovery and trust rules](https://code.claude.com/docs/en/plugins-reference#skills-directory-plugins).

The plugin calls `node` with absolute paths to this worktree's locked server
packages, using `${CLAUDE_PROJECT_DIR}` in its arguments and workspace folder.
There is no global server install, PATH override, startup hook, or custom
marketplace. `.claude/settings.json` disables the official TypeScript and Pyright
plugins for this project to avoid two servers claiming the same extensions.
[Claude's LSP reference](https://code.claude.com/docs/en/plugins-reference#lsp-servers)
documents extension ownership; its
[path substitution reference](https://code.claude.com/docs/en/plugins-reference#environment-variables)
documents worktree-local paths.

### Project scope

- **TypeScript/JavaScript:** the server uses the repository's classic
  `typescript` package and `tsconfig.json`, including `@*` aliases and generated
  Astro content types. `tests/tsconfig.json` makes the Playwright configuration
  discoverable by editors and language servers; the existing
  `tsconfig.playwright.json` remains the CLI check entrypoint. `.context`,
  `.conductor`, dependencies, and build output are excluded from application
  project discovery. The pinned `tsgo` compiler remains the additional CLI check.
- **Astro/MDX:** these are not mapped to the plain TypeScript server. Keep using
  `astro check` through `just build` for Astro diagnostics and the recommended
  Astro editor extension for `.astro` editing.
- **Python:** Pyright is installed and configured for open-file diagnostics.
  There is currently no tracked Python source, Python package, or virtual
  environment in this repository. No speculative `pyproject.toml`, interpreter
  path, or dependency environment is imposed. If a Python tool is added, put
  its dependencies and Pyright configuration beside that tool and verify its
  imports using its actual environment.

See [TypeScript project discovery](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html),
[TypeScript language-server configuration](https://github.com/typescript-language-server/typescript-language-server/blob/master/docs/configuration.md),
and [Pyright project configuration](https://github.com/microsoft/pyright/blob/main/docs/configuration.md).

### Verification and troubleshooting

`just lsp-check` starts both servers from the committed plugin configuration and
exchanges real LSP messages. It checks TypeScript hover, navigation through a
site alias, generated Astro collection types, Playwright helper navigation and
project selection, and diagnostics after an in-memory edit. Python checks hover,
sibling imports, standard-library definitions, and a deliberate type error in a
temporary `.context` fixture, which is removed afterward.

This verifies the server processes and project scope without an account or a
model request. It does not establish Claude workspace trust or prove that an
interactive Claude session has invoked its LSP tool. After trusting a workspace,
ask Claude to use LSP to find the definition of `published` in
`src/pages/rss.xml.ts`; it should lead to `src/lib/collections.ts`.

If no server appears, check the Claude version, launch directory, exact-workspace
trust, and `claude plugin details project-lsp@skills-dir`. If it appears but fails
to start, rerun `just install`, check that `node` is available to the agent, and
inspect `/plugin` errors. The first navigation request can arrive while
TypeScript loads its project; retry once loading completes. Do not map `.astro`
to TypeScript to work around missing Astro language support.

The GitHub Claude workflows continue to use normal diff/file review. Their fresh
headless runners do not bootstrap this project's servers or establish the
interactive trust required by automatic project-plugin discovery.
