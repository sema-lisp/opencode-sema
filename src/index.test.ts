import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { homedir } from "node:os";
import { join } from "node:path";
import type { Config } from "@opencode-ai/plugin";
import { OpenCodeSema, expandHome, isBinaryAvailable, isEnvSet } from "./index.js";

const ENV_KEYS = ["SEMA_PATH", "SEMA_DISABLE_FORMATTER", "SEMA_DISABLE_INSTRUCTIONS"];
const savedEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const key of ENV_KEYS) {
    savedEnv[key] = process.env[key];
    delete process.env[key];
  }
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
});

/** Run the plugin's config hook against `config` and return the mutated object. */
async function applyConfig(config: Config = {}): Promise<Config> {
  const hooks = await OpenCodeSema({} as never);
  await hooks.config!(config);
  return config;
}

// The SDK's Config sections are unions (`false | {...}`, local/remote MCP), which
// makes direct indexing noisy in assertions. Tests only care about the shape.
type Dict = Record<string, any>;
const lsp = (c: Config) => c.lsp as Dict;
const mcp = (c: Config) => c.mcp as Dict;
const fmt = (c: Config) => c.formatter as Dict;

describe("expandHome", () => {
  test("expands a bare ~ to the home directory", () => {
    expect(expandHome("~")).toBe(homedir());
  });

  test("expands ~/ and ~\\ prefixes", () => {
    expect(expandHome("~/bin/sema")).toBe(homedir() + "/bin/sema");
    expect(expandHome("~\\bin\\sema")).toBe(homedir() + "\\bin\\sema");
  });

  test("leaves bare names, absolute paths, and ~user untouched", () => {
    expect(expandHome("sema")).toBe("sema");
    expect(expandHome("/usr/local/bin/sema")).toBe("/usr/local/bin/sema");
    expect(expandHome("~other/bin/sema")).toBe("~other/bin/sema");
  });
});

describe("isEnvSet", () => {
  const KEY = "SEMA_TEST_TOGGLE";
  afterEach(() => delete process.env[KEY]);

  test.each(["1", "true", "TRUE", "yes"])("%p counts as set", (value) => {
    process.env[KEY] = value;
    expect(isEnvSet(KEY)).toBe(true);
  });

  test.each(["", "0", "false", "FALSE"])("%p counts as unset", (value) => {
    process.env[KEY] = value;
    expect(isEnvSet(KEY)).toBe(false);
  });

  test("missing variable counts as unset", () => {
    expect(isEnvSet(KEY)).toBe(false);
  });
});

describe("isBinaryAvailable", () => {
  test("finds a bare name on PATH", () => {
    expect(isBinaryAvailable("ls")).toBe(true);
  });

  test("finds an executable by direct path", () => {
    expect(isBinaryAvailable("/bin/ls")).toBe(true);
  });

  test("rejects missing binaries, directories, and non-executable files", () => {
    expect(isBinaryAvailable("definitely-not-a-real-binary-xyz")).toBe(false);
    expect(isBinaryAvailable("/tmp")).toBe(false);
    expect(isBinaryAvailable("/etc/hosts")).toBe(false);
  });
});

describe("config hook", () => {
  test("populates lsp, mcp, formatter, and instructions on an empty config", async () => {
    const config = await applyConfig();
    expect(lsp(config)["sema"]).toEqual({ command: ["sema", "lsp"], extensions: [".sema"] });
    expect(mcp(config)["sema"]).toEqual({ type: "local", command: ["sema", "mcp"], enabled: true });
    expect(fmt(config)["sema"]).toEqual({
      command: ["sema", "fmt", "$FILE"],
      extensions: [".sema"],
    });
    expect(config.instructions).toHaveLength(1);
    expect(config.instructions![0]).toEndWith(join("instructions", "sema-for-agents.md"));
  });

  test("honors SEMA_PATH (with ~ expansion) in every command", async () => {
    process.env.SEMA_PATH = "~/bin/sema";
    const expected = homedir() + "/bin/sema";
    const config = await applyConfig();
    expect(lsp(config)["sema"].command).toEqual([expected, "lsp"]);
    expect(mcp(config)["sema"].command).toEqual([expected, "mcp"]);
    expect(fmt(config)["sema"].command).toEqual([expected, "fmt", "$FILE"]);
  });

  test("does not clobber pre-existing user entries", async () => {
    const userLsp = { command: ["my-sema", "lsp"], extensions: [".sema"] };
    const userMcp = { type: "local", command: ["my-sema", "mcp"], enabled: false };
    const userFmt = { command: ["my-fmt", "$FILE"], extensions: [".sema"] };
    const config = await applyConfig({
      lsp: { sema: userLsp },
      mcp: { sema: userMcp },
      formatter: { sema: userFmt },
    } as Config);
    expect(lsp(config)["sema"]).toEqual(userLsp);
    expect(mcp(config)["sema"]).toEqual(userMcp);
    expect(fmt(config)["sema"]).toEqual(userFmt);
  });

  test("respects a global `formatter: false`", async () => {
    const config = await applyConfig({ formatter: false } as Config);
    expect(config.formatter).toBe(false as never);
  });

  test("SEMA_DISABLE_FORMATTER skips the formatter but nothing else", async () => {
    process.env.SEMA_DISABLE_FORMATTER = "1";
    const config = await applyConfig();
    expect(config.formatter).toBeUndefined();
    expect(lsp(config)["sema"]).toBeDefined();
  });

  test("SEMA_DISABLE_FORMATTER=0 keeps the formatter", async () => {
    process.env.SEMA_DISABLE_FORMATTER = "0";
    const config = await applyConfig();
    expect(fmt(config)["sema"]).toBeDefined();
  });

  test("SEMA_DISABLE_INSTRUCTIONS skips the instructions injection", async () => {
    process.env.SEMA_DISABLE_INSTRUCTIONS = "1";
    const config = await applyConfig();
    expect(config.instructions).toBeUndefined();
  });

  test("running the hook twice does not duplicate the instructions entry", async () => {
    const config = await applyConfig();
    const hooks = await OpenCodeSema({} as never);
    await hooks.config!(config);
    expect(config.instructions).toHaveLength(1);
  });
});
