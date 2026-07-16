import type { Plugin } from "@opencode-ai/plugin";

const semaBinary: string = process.env.SEMA_PATH ?? "sema";

const OpenCodeSema: Plugin = async () => {
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
