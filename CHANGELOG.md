# Changelog

## 2.0.0 — Unreleased

### Changed

- Migrate the package to the OpenCode v2 plugin API. The default export now has
  the stable `sema` ID and registers the Sema MCP server through the v2 MCP
  transform.
- Require OpenCode v2. Remove the v1 entrypoint and its formatter option and
  `SEMA_DISABLE_FORMATTER` environment variable. OpenCode v1 users must pin
  `@sema-lang/opencode-sema@1.2.1`.
- Inject the bundled Sema guide through the v2 session context hook.
- Document that OpenCode v2 has no LSP runtime and no plugin formatter transform.
  Users must configure the formatter manually; LSP configuration is inactive until
  OpenCode provides an LSP runtime.

## 1.2.1 — 2026-10-05

### Fixed

- Preserve an explicit global `"lsp": false` setting instead of registering the Sema
  language server.
- Keep the runtime entry module compatible with OpenCode's legacy plugin loader by
  exporting only the default plugin function and its identical named alias.
- Make the manual theme installation commands resolve the installed package path and
  honor `XDG_CONFIG_HOME`.
