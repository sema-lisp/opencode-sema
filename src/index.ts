import { homedir } from "node:os";
import { join } from "node:path";
import type { Plugin, PluginOptions } from "@opencode-ai/plugin";

const here = import.meta.dirname;

/**
 * Options a user can pass to the plugin from `opencode.json`, using the tuple
 * form of the `plugin` array:
 *
 *   { "plugin": [["@sema-lang/opencode-sema", { "path": "~/bin/sema" }]] }
 *
 * Precedence is env var > this option > built-in default: the environment stays
 * the per-machine / CI escape hatch, while these give a committed, per-project
 * home in `opencode.json` for everything that used to be env-only.
 */
export type SemaOptions = {
  /** Path to the `sema` binary. Overridden by `SEMA_PATH`. Defaults to `sema` (resolved on PATH). */
  path?: string;
  /** Register `sema fmt` as the `.sema` formatter. Default true; `SEMA_DISABLE_FORMATTER=1` also disables. */
  formatter?: boolean;
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

/** Narrow the untyped `PluginOptions` bag to the fields we understand. */
function asSemaOptions(options?: PluginOptions): SemaOptions {
  return (options ?? {}) as SemaOptions;
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

export const OpenCodeSema: Plugin = async (_input, options) => {
  const opts = asSemaOptions(options);
  return {
    config: async (config) => {
      // Read per-call rather than at import so SEMA_PATH set by the host (or
      // tests) after module load is still honored.
      const semaBinary = resolveBinary(opts);
      // Warn early if the binary is missing — otherwise the LSP/MCP/formatter
      // all fail later with an opaque spawn error.
      if (!isBinaryAvailable(semaBinary)) {
        console.warn(
          `opencode-sema: the \`${semaBinary}\` binary was not found on PATH. ` +
            "Install Sema (https://sema-lang.com) or set SEMA_PATH — until then the " +
            "LSP, MCP server, and formatter will be unavailable.",
        );
      }

      if (!config.lsp) config.lsp = {};
      if (!config.lsp["sema"]) {
        config.lsp["sema"] = {
          command: [semaBinary, "lsp"],
          extensions: [".sema"],
        };
      }

      if (!config.mcp) config.mcp = {};
      if (!config.mcp["sema"]) {
        config.mcp["sema"] = {
          type: "local",
          command: [semaBinary, "mcp"],
          enabled: true,
        };
      }

      // Auto-format `.sema` files whenever OpenCode writes or edits one, using
      // `sema fmt` (in-place). Opt out with SEMA_DISABLE_FORMATTER=1, the
      // `formatter: false` plugin option, or by defining your own
      // `formatter.sema` in opencode.json. Respects a global `formatter: false`.
      const formatterOff = isEnvSet("SEMA_DISABLE_FORMATTER") || opts.formatter === false;
      if (config.formatter !== false && !formatterOff) {
        config.formatter ??= {};
        config.formatter["sema"] ??= {
          command: [semaBinary, "fmt", "$FILE"],
          extensions: [".sema"],
        };
      }

      // Inject a concise Sema cheat sheet into every session so the agent writes
      // idiomatic Sema. Opt out with SEMA_DISABLE_INSTRUCTIONS=1 or the
      // `instructions: false` plugin option.
      const instructionsOff = isEnvSet("SEMA_DISABLE_INSTRUCTIONS") || opts.instructions === false;
      if (!instructionsOff) {
        const guide = join(here, "..", "instructions", "sema-for-agents.md");
        config.instructions ??= [];
        if (!config.instructions.includes(guide)) config.instructions.push(guide);
      }
    },
  };
};

export default OpenCodeSema;
