import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Plugin } from "@opencode/plugin";
import { isBinaryAvailable, isEnvSet, resolveBinary, type SemaOptions } from "./options.js";

const SERVICE = "opencode-sema";
const here = import.meta.dirname;
const guidePath = join(here, "..", "instructions", "sema-for-agents.md");

function missingBinaryMessage(semaBinary: string): string {
  return (
    `the \`${semaBinary}\` binary was not found on PATH. ` +
    "Install Sema (https://sema-lang.com) or set SEMA_PATH — until then the " +
    "MCP server will be unavailable."
  );
}

export const OpenCodeSema = Plugin.define({
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

export default OpenCodeSema;
