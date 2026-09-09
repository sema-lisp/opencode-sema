# Changelog

## Unreleased

### Fixed

- Preserve an explicit global `"lsp": false` setting instead of registering the Sema
  language server.
- Keep the runtime entry module compatible with OpenCode's legacy plugin loader by
  exporting only the default plugin function and its identical named alias.
- Make the manual theme installation commands resolve the installed package path and
  honor `XDG_CONFIG_HOME`.
