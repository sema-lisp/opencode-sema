# Jakefile — opencode-sema plugin build + publish.
#
# @rooted resolves relative paths against THIS repo so the workspace meta-repo can
# @import "opencode-sema/Jakefile" as opencode and run opencode.build from root.
@rooted

@group opencode
@desc "Build the plugin (TypeScript -> dist/)"
build: [node_modules]
    npx tsc

@group opencode
@desc "Typecheck without emitting"
typecheck:
    npx tsc --noEmit

@group opencode
@desc "Publish to npm (OIDC — run locally only for testing; CI uses publish-npm.yml)"
publish: [build]
    @confirm "Publish opencode-sema to npm?"
    npm publish --provenance --access public

node_modules:
    npm install
