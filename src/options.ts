import { homedir } from "node:os";

/**
 * Options a user can pass to the plugin from `opencode.json`, using the object
 * form of the `plugins` array:
 *
 *   { "plugins": [{ "package": "@sema-lang/opencode-sema", "options": { "path": "~/bin/sema" } }] }
 *
 * Precedence is env var > this option > built-in default: the environment stays
 * the per-machine / CI escape hatch, while these give a committed, per-project
 * home in `opencode.json` for everything that used to be env-only.
 */
export type SemaOptions = {
  /** Path to the `sema` binary. Overridden by `SEMA_PATH`. Defaults to `sema` (resolved on PATH). */
  path?: string;
  /** Inject the Sema agent cheat sheet. Default true; `SEMA_DISABLE_INSTRUCTIONS=1` also disables. */
  instructions?: boolean;
};

/**
 * Expand a leading `~` to the user's home directory so a value like
 * `SEMA_PATH=~/bin/sema` resolves correctly. Handles both `/` and `\`
 * separators for Windows. A bare `sema` (resolved on PATH) is returned as-is.
 */
export function expandHome(p: string): string {
  if (p === "~") return homedir();
  if (p.startsWith("~/") || p.startsWith("~\\")) return homedir() + p.slice(1);
  return p;
}

/**
 * True when `bin` resolves to an executable — either a direct path or a bare
 * name found on PATH. `Bun.which` checks PATH (and PATHEXT on Windows) for
 * bare names and rejects directories and non-executable files. OpenCode runs
 * plugins under Bun, so the global is always present.
 */
export function isBinaryAvailable(bin: string): boolean {
  return Bun.which(bin) !== null;
}

/** A `SEMA_*` toggle is "set" for any value other than unset/empty/`0`/`false`. */
export function isEnvSet(name: string): boolean {
  const v = process.env[name];
  return v !== undefined && v !== "" && v !== "0" && v.toLowerCase() !== "false";
}

/**
 * Resolve the `sema` binary path: `SEMA_PATH` env, then the `path` option, then
 * the default `sema`. Blank/whitespace values fall through so `SEMA_PATH=""`
 * doesn't shadow a real option or the default.
 */
export function resolveBinary(opts: SemaOptions = {}): string {
  const fromEnv = process.env.SEMA_PATH?.trim();
  const fromOption = typeof opts.path === "string" ? opts.path.trim() : "";
  return expandHome(fromEnv || fromOption || "sema");
}
