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

Customize the Sema binary path via environment variable:

```bash
export SEMA_PATH=/path/to/sema
```

## Theme

The Sema theme is optional and must be copied into OpenCode's themes directory:

```bash
cp themes/sema.json ~/.config/opencode/themes/sema.json
```

> **Note:** When you install the package directly with `npm install`, a `postinstall` script copies the theme for you (skip it with `OPENCODE_NO_THEME_COPY=1`). OpenCode's own auto-install runs through Bun, which **blocks** dependency lifecycle scripts by default (only allow-listed / `trustedDependencies` packages run them), so on the auto-install path use the manual `cp` above.

Then select `sema` as your theme in OpenCode.

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
