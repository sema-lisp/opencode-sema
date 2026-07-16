import { homedir } from "node:os";
import type { Plugin } from "@opencode-ai/plugin";

/**
 * Expand a leading `~` to the user's home directory so a value like
 * `SEMA_PATH=~/bin/sema` resolves correctly. Handles both `/` and `\`
 * separators for Windows. A bare `sema` (resolved on PATH) is returned as-is.
 */
function expandHome(p: string): string {
  if (p === "~") return homedir();
  if (p.startsWith("~/") || p.startsWith("~\\")) return homedir() + p.slice(1);
  return p;
}

const semaBinary: string = expandHome(process.env.SEMA_PATH ?? "sema");

export const OpenCodeSema: Plugin = async () => {
  return {
    config: async (config) => {
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
    },
  };
};

export default OpenCodeSema;
