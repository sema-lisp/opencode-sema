<div align="center">

<img src="https://sema-lang.com/logo.svg" alt="Sema" height="64">

# Sema for OpenCode

**[Sema](https://sema-lang.com) support for [OpenCode](https://opencode.ai)** — a Lisp with first-class LLM primitives.

[![CI](https://img.shields.io/github/actions/workflow/status/sema-lisp/opencode-sema/ci.yml?branch=main&label=CI&logo=github)](https://github.com/sema-lisp/opencode-sema/actions)
[![npm](https://img.shields.io/npm/v/@sema-lang/opencode-sema?color=c8a855&logo=npm)](https://www.npmjs.com/package/@sema-lang/opencode-sema)
[![License](https://img.shields.io/github/license/sema-lisp/opencode-sema?color=c8a855)](LICENSE)
[![Website](https://img.shields.io/badge/website-sema--lang.com-c8a855)](https://sema-lang.com)

</div>

An [OpenCode](https://opencode.ai) plugin that wires Sema's language server, MCP server, and editor theme into the agent — so OpenCode can lint, navigate, evaluate, and build `.sema` code.

## Install

Add the plugin to your `opencode.json`:

```json
{
  "plugin": ["@sema-lang/opencode-sema"]
}
```

OpenCode auto-installs the plugin from npm (via Bun) on next startup — you don't need to install it yourself. To pin or vendor it explicitly, add it as a dev dependency:

```bash
npm i -D @sema-lang/opencode-sema
```

## Features

- **Language server** (`sema lsp`) — completions, hover docs, go-to-definition, references, rename, semantic tokens, and formatting for `.sema` files.
- **MCP server** (`sema mcp`) — exposes Sema's eval, build, compile, docs, and notebook tools to the agent as MCP tools.
- **Theme** — a dark, gold-accented Sema editor theme (optional — see [Theme](#theme)).

## Requirements

The `sema` binary must be installed and on your `PATH`. Install it via Homebrew or Cargo, or point the plugin at a custom path with `SEMA_PATH`:

```bash
brew install helgesverre/tap/sema-lang
# or
cargo install sema-lang
```

## Configuration

Customize the Sema binary path via environment variable. A leading `~` is expanded to your home directory, and the value is resolved on `PATH` (so `sema` / `sema.exe` both work):

```bash
export SEMA_PATH=~/bin/sema
```

## Theme

The plugin ships a dark, gold-accented Sema theme (`themes/sema.json`) and declares it via the `oc-themes` manifest field, so on OpenCode versions that support plugin-contributed themes it is registered automatically once the plugin is listed in your config — OpenCode resolves the correct themes directory for your OS (honoring `XDG_CONFIG_HOME`). Then select `sema` as your theme in OpenCode.

If your OpenCode version doesn't auto-register plugin themes, copy it in manually:

```bash
cp themes/sema.json ~/.config/opencode/themes/sema.json
# or, if XDG_CONFIG_HOME is set:
cp themes/sema.json "$XDG_CONFIG_HOME/opencode/themes/sema.json"
```

> **Note:** A `postinstall` script also copies the theme on a direct `npm install` (skip it with `OPENCODE_NO_THEME_COPY=1`), but OpenCode's own auto-install runs through Bun, which **blocks** dependency lifecycle scripts by default — so don't rely on it; the `oc-themes` registration and the manual `cp` above are the supported paths.

## Commands

```bash
npm run build         # Compile TypeScript → dist/
npm run typecheck     # Typecheck without emitting
npm run format        # Format with Prettier
npm run format:check  # Check formatting
```

## Links

- **Website** — [sema-lang.com](https://sema-lang.com)
- **Playground** — [sema.run](https://sema.run)
- **Documentation** — [sema-lang.com/docs](https://sema-lang.com/docs/)
- **Grammar** — [tree-sitter-sema](https://github.com/sema-lisp/tree-sitter-sema)
- **Repository** — [sema-lisp/opencode-sema](https://github.com/sema-lisp/opencode-sema)

## License

[MIT](LICENSE) © [Helge Sverre](https://github.com/HelgeSverre)
