# Jakefile — @sema-lang/opencode-sema plugin (jakefile.dev).
#
# `@rooted` resolves relative paths against THIS repo so the workspace meta-repo can
# `@import "opencode-sema/Jakefile" as opencode` and run `opencode.build` from root.
#
# Node is pinned to 26 via `.nvmrc` (fnm/nvm auto-switch on `cd`); recipes only
# require `npm` on PATH — they don't manage the Node version themselves.
@rooted

# File recipe: recompile only when sources/config change (incremental no-op builds).
file dist/index.js: src/**/* package.json tsconfig.json
    @command -v npm >/dev/null || { echo "npm not found — install Node.js" >&2; exit 1; }
    npm install
    npm run build

@group opencode
@desc "Build the plugin (TypeScript -> dist/; skips if sources unchanged)"
task build: [dist/index.js]
    echo "opencode-sema built: dist/index.js"

@group opencode
@desc "Type-check without emitting (tsc --noEmit)"
task typecheck:
    @needs npm
    npm run typecheck

@group opencode
@desc "Format sources with Prettier"
task fmt:
    @needs npm
    npm install
    npm run format

@group opencode
@desc "Check formatting (CI-friendly, no writes)"
task fmt-check:
    @needs npm
    npm run format:check

@group opencode
@desc "Publish to npm (OIDC — run locally only for testing; CI uses publish-npm.yml)"
task publish: [build]
    @confirm "Publish @sema-lang/opencode-sema to npm?"
    npm publish --provenance --access public
