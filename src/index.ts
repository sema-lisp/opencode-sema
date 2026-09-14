import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Plugin } from "@opencode/plugin";
import { isBinaryAvailable, isEnvSet, resolveBinary, type SemaOptions } from "./options.js";

const SERVICE = "opencode-sema";
const here = import.meta.dirname;
const guidePath = join(here, "..", "instructions", "sema-for-agents.md");

type LegacyConfig = {
  lsp?: false | Record<string, unknown>;
  mcp?: Record<string, unknown>;
  formatter?: false | Record<string, unknown>;
  instructions?: string[];
};

type LegacyInput = {
  client?: {
    app?: {
      log?: (input: { body: { service: string; level: "warn"; message: string } }) => Promise<void>;
    };
  };
};

type LegacyHooks = {
  config: (config: LegacyConfig) => Promise<void>;
};

/** Logs a v1 warning without letting an unavailable client break configuration. */
async function logLegacyWarning(input: LegacyInput | undefined, message: string): Promise<void> {
  try {
    await input?.client?.app?.log?.({ body: { service: SERVICE, level: "warn", message } });
  } catch {
    // Logging is advisory; configuration must still be applied.
  }
}

function missingBinaryMessage(semaBinary: string): string {
  return (
    `the \`${semaBinary}\` binary was not found on PATH. ` +
    "Install Sema (https://sema-lang.com) or set SEMA_PATH — until then the " +
    "LSP, MCP server, and formatter will be unavailable."
  );
}

/**
 * The OpenCode v1 implementation. OpenCode 1.18.29 and later invokes this
 * method on a combined v1/v2 plugin export.
 */
async function server(input?: LegacyInput, options?: unknown): Promise<LegacyHooks> {
  const opts = (options ?? {}) as SemaOptions;

  return {
    config: async (config) => {
      const semaBinary = resolveBinary(opts);
      if (!isBinaryAvailable(semaBinary)) {
        await logLegacyWarning(input, missingBinaryMessage(semaBinary));
      }

      if (config.lsp !== false) {
        config.lsp ??= {};
        config.lsp.sema ??= {
          command: [semaBinary, "lsp"],
          extensions: [".sema"],
        };
      }

      config.mcp ??= {};
      config.mcp.sema ??= {
        type: "local",
        command: [semaBinary, "mcp"],
        enabled: true,
      };

      const formatterOff = isEnvSet("SEMA_DISABLE_FORMATTER") || opts.formatter === false;
      if (config.formatter !== false && !formatterOff) {
        config.formatter ??= {};
        config.formatter.sema ??= {
          command: [semaBinary, "fmt", "$FILE"],
          extensions: [".sema"],
        };
      }

      const instructionsOff = isEnvSet("SEMA_DISABLE_INSTRUCTIONS") || opts.instructions === false;
      if (!instructionsOff) {
        config.instructions ??= [];
        if (!config.instructions.includes(guidePath)) config.instructions.push(guidePath);
      }
    },
  };
}

const v2 = Plugin.define({
  id: "sema",
  async setup(ctx) {
    const opts = ctx.options as SemaOptions;
    const semaBinary = resolveBinary(opts);

    if (!isBinaryAvailable(semaBinary)) {
      // The v2 context has no application logger. Console output is collected
      // by the OpenCode plugin host and keeps setup non-fatal.
      console.warn(`[${SERVICE}] ${missingBinaryMessage(semaBinary)}`);
    }

    await ctx.mcp.transform((editor) => {
      if (editor.get("sema") === undefined) {
        editor.set("sema", {
          type: "local",
          command: [semaBinary, "mcp"],
        });
      }
    });

    const instructionsOff = isEnvSet("SEMA_DISABLE_INSTRUCTIONS") || opts.instructions === false;
    if (!instructionsOff) {
      const guide = await readFile(guidePath, "utf8");
      await ctx.session.hook("context", (event) => {
        event.system.push({ type: "text", text: guide });
      });
    }
  },
});

/**
 * One package entrypoint for OpenCode v2 and OpenCode v1.18.29+. V2 reads the
 * `id` and `setup` members; v1 reads `server` and receives the legacy hooks.
 */
export const OpenCodeSema = { ...v2, server };

export default OpenCodeSema;
