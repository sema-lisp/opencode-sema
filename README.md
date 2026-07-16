# opencode-sema

OpenCode plugin for [Sema](https://sema-lang.com) — a Lisp with LLM primitives.

Adds Sema's LSP server, MCP server, and theme to OpenCode automatically.

## Install

Add to your `opencode.json`:

```json
{
  "plugin": ["opencode-sema"]
}
```

OpenCode auto-installs the plugin via Bun on next startup. The Sema theme is
copied to `~/.config/opencode/themes/sema.json` on install (set
`OPENCODE_NO_THEME_COPY=1` to skip).

## What you get

| Feature | Command | Description |
|---------|---------|-------------|
| **LSP** | `sema lsp` | Completions, hover, go-to-def, references, rename, semantic tokens, formatting for `.sema` files |
| **MCP** | `sema mcp` | Sema eval, build, compile, docs, notebook tools exposed as MCP tools for the agent |
| **Theme** | — | Dark, gold-accented Sema theme (optional, copied on install) |

## Requirements

The `sema` binary must be installed and on `PATH`. Set `SEMA_PATH` to a custom
path if needed.

```bash
brew install sema-lang/tap/sema
```

## Configuration

Customize the sema binary path via environment variable:

```bash
export SEMA_PATH=/path/to/sema
```

## Manual theme install

```bash
cp themes/sema.json ~/.config/opencode/themes/sema.json
```

## License

MIT
