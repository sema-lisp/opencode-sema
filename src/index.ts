import { join } from "node:path";
import type { Plugin, PluginInput } from "@opencode-ai/plugin";
import { isBinaryAvailable, isEnvSet, resolveBinary, type SemaOptions } from "./options.js";

/** Service name attached to every log entry this plugin writes. */
const SERVICE = "opencode-sema";

const here = import.meta.dirname;

/**
 * Best-effort structured log to the OpenCode server. Never throws — a logging
 * failure (or an absent client, e.g. in tests) must not break config resolution.
 */
async function log(input: PluginInput, level: "warn" | "info", message: string): Promise<void> {
  try {
    await input.client.app.log({ body: { service: SERVICE, level, message } });
  } catch {
    // Logging is advisory; swallow transport/availability errors.
  }
}

export const OpenCodeSema: Plugin = async (input, options) => {
  // Narrow the untyped PluginOptions bag to the fields we understand.
  const opts = (options ?? {}) as SemaOptions;
  return {
    config: async (config) => {
      // Read per-call rather than at import so SEMA_PATH set by the host (or
      // tests) after module load is still honored.
      const semaBinary = resolveBinary(opts);
      // Warn early if the binary is missing — otherwise the LSP/MCP/formatter
      // all fail later with an opaque spawn error.
      if (!isBinaryAvailable(semaBinary)) {
        await log(
          input,
          "warn",
          `the \`${semaBinary}\` binary was not found on PATH. ` +
            "Install Sema (https://sema-lang.com) or set SEMA_PATH — until then the " +
            "LSP, MCP server, and formatter will be unavailable.",
        );
      }

      if (config.lsp !== false) {
        config.lsp ??= {};
        config.lsp["sema"] ??= {
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
