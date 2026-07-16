import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { delimiter, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "@opencode-ai/plugin";

const here = dirname(fileURLToPath(import.meta.url));

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

/**
 * True when `bin` resolves to an executable — either a direct path or a bare
 * name found on PATH. Cross-platform: honors PATHEXT on Windows. Purely
 * filesystem-based (no subprocess), so it's safe to call from the config hook.
 */
function isBinaryAvailable(bin: string): boolean {
  const hasSep = bin.includes("/") || bin.includes("\\");
  const dirs = hasSep ? [""] : (process.env.PATH ?? "").split(delimiter);
  const exts =
    process.platform === "win32"
      ? ["", ...(process.env.PATHEXT ?? ".EXE;.CMD;.BAT;.COM").split(";")]
      : [""];
  for (const dir of dirs) {
    const base = hasSep ? bin : join(dir, bin);
    if (!base) continue;
    for (const ext of exts) {
      if (existsSync(base + ext)) return true;
    }
  }
  return false;
}

/** A `SEMA_*` toggle is "set" for any value other than unset/empty/`0`/`false`. */
function isEnvSet(name: string): boolean {
  const v = process.env[name];
  return v !== undefined && v !== "" && v !== "0" && v.toLowerCase() !== "false";
}

const semaBinary: string = expandHome(process.env.SEMA_PATH ?? "sema");

export const OpenCodeSema: Plugin = async () => {
  return {
    config: async (config) => {
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
      // `sema fmt` (in-place). Opt out with SEMA_DISABLE_FORMATTER=1, or override
      // `formatter.sema` in opencode.json. Respects a global `formatter: false`.
      if (config.formatter !== false && !isEnvSet("SEMA_DISABLE_FORMATTER")) {
        config.formatter ??= {};
        config.formatter["sema"] ??= {
          command: [semaBinary, "fmt", "$FILE"],
          extensions: [".sema"],
        };
      }

      // Inject a concise Sema cheat sheet into every session so the agent writes
      // idiomatic Sema. Opt out with SEMA_DISABLE_INSTRUCTIONS=1.
      if (!isEnvSet("SEMA_DISABLE_INSTRUCTIONS")) {
        const guide = join(here, "..", "instructions", "sema-for-agents.md");
        config.instructions ??= [];
        if (!config.instructions.includes(guide)) config.instructions.push(guide);
      }
    },
  };
};

export default OpenCodeSema;
