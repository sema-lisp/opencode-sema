<div align="center">

<img src="https://sema-lang.com/logo.svg" alt="Sema" height="64">

# Sema for OpenCode

**[Sema](https://sema-lang.com) support for [OpenCode](https://opencode.ai)** — a Lisp with first-class LLM primitives.

[![CI](https://img.shields.io/github/actions/workflow/status/sema-lisp/opencode-sema/ci.yml?branch=main&label=CI&logo=github)](https://github.com/sema-lisp/opencode-sema/actions)
[![npm](https://img.shields.io/npm/v/@sema-lang/opencode-sema?color=c8a855&logo=npm)](https://www.npmjs.com/package/@sema-lang/opencode-sema)
[![License](https://img.shields.io/github/license/sema-lisp/opencode-sema?color=c8a855)](LICENSE)
[![Website](https://img.shields.io/badge/website-sema--lang.com-c8a855)](https://sema-lang.com)

</div>

An [OpenCode](https://opencode.ai) plugin that wires Sema's MCP server, agent guidance, and editor theme into the agent.

## Install

Add the plugin to your `opencode.json`:

```json
{
  "plugins": ["@sema-lang/opencode-sema"]
}
```

OpenCode auto-installs the plugin from npm (via Bun) on next startup — you don't need to install it yourself. To pin or vendor it explicitly, add it as a dev dependency:

```bash
npm i -D @sema-lang/opencode-sema
```

## Features

- **MCP server** (`sema mcp`) — exposes Sema's eval, build, compile, docs, and notebook tools to the agent as MCP tools.
- **Agent guidance** — injects a concise "Sema for LLM agents" cheat sheet into every session so the agent writes idiomatic Sema (slash-namespaced builtins, LLM primitives, the semantics that bite). Opt out with the `instructions: false` option or `SEMA_DISABLE_INSTRUCTIONS=1`.
- **Theme** — a dark, gold-accented Sema editor theme (optional — see [Theme](#theme)).

## Requirements

The `sema` binary must be installed and on your `PATH`. Install it via Homebrew or Cargo, or point the plugin at a custom path with `SEMA_PATH`:

```bash
brew install helgesverre/tap/sema-lang
# or
cargo install sema-lang
```

## Configuration

The plugin can be configured two ways: **plugin options** in `opencode.json` (committed, per-project) and **environment variables** (per-machine / CI). For any setting that supports both, the environment wins, so an env var stays a reliable local override of committed config.

### Plugin options

Pass options using the object form of the `plugins` array in `opencode.json`:

```json
{
  "plugins": [
    {
      "package": "@sema-lang/opencode-sema",
      "options": { "path": "~/bin/sema", "instructions": false }
    }
  ]
}
```

| Option         | Type      | Effect                                                                                                              |
| -------------- | --------- | ------------------------------------------------------------------------------------------------------------------- |
| `path`         | `string`  | Path to the `sema` binary. A leading `~` is expanded; a bare name is resolved on `PATH`. Overridden by `SEMA_PATH`. |
| `formatter`    | `boolean` | OpenCode v1 compatibility only. It has no effect in v2; configure the formatter in `opencode.json`.                 |
| `instructions` | `boolean` | Set to `false` to skip injecting the Sema agent cheat sheet. Default `true`.                                        |

### Environment variables

| Variable                    | Effect                                                                                                                                                                                   |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SEMA_PATH`                 | Path to the `sema` binary. A leading `~` is expanded; a bare name is resolved on `PATH` (so `sema` / `sema.exe` both work). Takes precedence over the `path` option. Defaults to `sema`. |
| `SEMA_DISABLE_FORMATTER`    | OpenCode v1 compatibility only. It has no effect in v2; configure the formatter in `opencode.json`.                                                                                      |
| `SEMA_DISABLE_INSTRUCTIONS` | Set to `1` to skip injecting the Sema agent cheat sheet.                                                                                                                                 |
| `OPENCODE_NO_THEME_COPY`    | Set to `1` to skip the `postinstall` theme copy.                                                                                                                                         |

```bash
export SEMA_PATH=~/bin/sema
```

### OpenCode v2 limits and manual configuration

The v2 plugin adds the `sema` MCP server only when the project does not already define one. Your `mcp.servers.sema` configuration always wins.

OpenCode v2 does not yet have an LSP runtime. It accepts LSP configuration, but does not start language servers or add diagnostics. The plugin cannot register an LSP server until OpenCode exposes that API.

OpenCode v2 supports formatters in project configuration, but its plugin API has no formatter transform. Add Sema formatting yourself:

```jsonc
{
  "formatter": {
    "sema": {
      "command": ["sema", "fmt", "$FILE"],
      "extensions": [".sema"],
    },
  },
  "lsp": {
    "sema": {
      "command": ["sema", "lsp"],
      "extensions": [".sema"],
    },
  },
}
```

The `lsp` entry is forward-compatible configuration only. It does not enable LSP behavior in current OpenCode v2 releases.

### OpenCode v1 compatibility

The package also supports OpenCode v1.18.29 and later through its documented combined entrypoint. The v1 path retains automatic LSP, formatter, MCP, and instruction configuration. Earlier v1 releases are not supported by this package version.

## Theme

The plugin ships a dark, gold-accented Sema theme (`themes/sema.json`) and declares it via the `oc-themes` manifest field, so on OpenCode versions that support plugin-contributed themes it is registered automatically once the plugin is listed in your config — OpenCode resolves the correct themes directory for your OS (honoring `XDG_CONFIG_HOME`). Then select `sema` as your theme in OpenCode.

If your OpenCode version doesn't auto-register plugin themes, install the package with npm and run this from the project that has it installed:

```bash
theme_source="$(node -p "require.resolve('@sema-lang/opencode-sema/theme')")"
config_home="${XDG_CONFIG_HOME:-"$HOME/.config"}"
mkdir -p "$config_home/opencode/themes"
cp "$theme_source" "$config_home/opencode/themes/sema.json"
```

For a source checkout of this repository, use `themes/sema.json` as the source instead:

```bash
config_home="${XDG_CONFIG_HOME:-"$HOME/.config"}"
mkdir -p "$config_home/opencode/themes"
cp themes/sema.json "$config_home/opencode/themes/sema.json"
```

> **Note:** A `postinstall` script also copies the theme on a direct `npm install` (skip it with `OPENCODE_NO_THEME_COPY=1`), but OpenCode's own auto-install runs through Bun, which **blocks** dependency lifecycle scripts by default — so don't rely on it; the `oc-themes` registration and the manual `cp` above are the supported paths.

## Commands

```bash
bun install           # Install dependencies
bun test              # Run the test suite
bun run build         # Compile TypeScript → dist/
bun run typecheck     # Typecheck without emitting
bun run format        # Format with Prettier
bun run format:check  # Check formatting
```

## Links

- **Website** — [sema-lang.com](https://sema-lang.com)
- **Playground** — [sema.run](https://sema.run)
- **Documentation** — [sema-lang.com/docs](https://sema-lang.com/docs/)
- **Grammar** — [tree-sitter-sema](https://github.com/sema-lisp/tree-sitter-sema)
- **Repository** — [sema-lisp/opencode-sema](https://github.com/sema-lisp/opencode-sema)

## License

[MIT](LICENSE) © [Helge Sverre](https://github.com/HelgeSverre)
