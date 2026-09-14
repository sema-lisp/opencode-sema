import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { homedir } from "node:os";
import { join } from "node:path";
import * as entry from "./index.js";
import { OpenCodeSema } from "./index.js";
import {
  expandHome,
  isBinaryAvailable,
  isEnvSet,
  resolveBinary,
  type SemaOptions,
} from "./options.js";

const ENV_KEYS = [
  "SEMA_PATH",
  "SEMA_DISABLE_FORMATTER",
  "SEMA_DISABLE_INSTRUCTIONS",
  "SEMA_TEST_TOGGLE",
];
const savedEnv: Record<string, string | undefined> = {};

type LogEntry = { service: string; level: string; message: string };
type LegacyConfig = Record<string, any>;
let logs: LogEntry[] = [];

function mockLegacyInput() {
  return {
    client: { app: { log: async ({ body }: { body: LogEntry }) => void logs.push(body) } },
  };
}

async function applyLegacyConfig(
  config: LegacyConfig = {},
  options?: SemaOptions,
): Promise<LegacyConfig> {
  const hooks = await OpenCodeSema.server(mockLegacyInput(), options);
  await hooks.config(config);
  return config;
}

function mockV2Context(options: SemaOptions = {}, servers = new Map<string, any>()) {
  let contextHook: ((event: { system: { type: string; text: string }[] }) => void) | undefined;
  const context = {
    options,
    mcp: {
      transform: async (transform: (editor: any) => void) =>
        transform({
          get: (name: string) => servers.get(name),
          set: (name: string, config: any) => servers.set(name, config),
        }),
    },
    session: {
      hook: async (name: string, hook: typeof contextHook) => {
        expect(name).toBe("context");
        contextHook = hook;
      },
    },
  };

  return {
    context,
    servers,
    applyInstructions: () => {
      const event = { system: [] as { type: string; text: string }[] };
      contextHook?.(event);
      return event.system;
    },
  };
}

beforeEach(() => {
  logs = [];
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

describe("options", () => {
  test.each(["1", "true", "TRUE", "yes"])("%p counts as set", (value) => {
    process.env.SEMA_TEST_TOGGLE = value;
    expect(isEnvSet("SEMA_TEST_TOGGLE")).toBe(true);
  });

  test.each(["", "0", "false", "FALSE"])("%p counts as unset", (value) => {
    process.env.SEMA_TEST_TOGGLE = value;
    expect(isEnvSet("SEMA_TEST_TOGGLE")).toBe(false);
  });

  test("finds a bare name and rejects a missing binary", () => {
    expect(isBinaryAvailable("ls")).toBe(true);
    expect(isBinaryAvailable("/bin/ls")).toBe(true);
    expect(isBinaryAvailable("definitely-not-a-real-binary-xyz")).toBe(false);
    expect(isBinaryAvailable("/tmp")).toBe(false);
  });

  test("resolves environment, option, and default paths in order", () => {
    expect(resolveBinary()).toBe("sema");
    expect(resolveBinary({ path: "~/bin/sema" })).toBe(homedir() + "/bin/sema");
    process.env.SEMA_PATH = "/from/env/sema";
    expect(resolveBinary({ path: "/from/option/sema" })).toBe("/from/env/sema");
  });

  test("falls through blank environment and option values", () => {
    process.env.SEMA_PATH = "   ";
    expect(resolveBinary({ path: "/opt/sema" })).toBe("/opt/sema");
    expect(resolveBinary({ path: "  " })).toBe("sema");
  });
});

describe("OpenCode v1 compatibility", () => {
  test("exports the default and named combined plugin", () => {
    expect(Object.keys(entry).sort()).toEqual(["OpenCodeSema", "default"]);
    expect(entry.default).toBe(entry.OpenCodeSema);
    expect(entry.default.id).toBe("sema");
    expect(typeof entry.default.setup).toBe("function");
    expect(typeof entry.default.server).toBe("function");
  });

  test("populates v1 LSP, MCP, formatter, and instructions", async () => {
    const config = await applyLegacyConfig();
    expect(config.lsp.sema).toEqual({ command: ["sema", "lsp"], extensions: [".sema"] });
    expect(config.mcp.sema).toEqual({ type: "local", command: ["sema", "mcp"], enabled: true });
    expect(config.formatter.sema).toEqual({
      command: ["sema", "fmt", "$FILE"],
      extensions: [".sema"],
    });
    expect(config.instructions).toEqual([
      expect.stringContaining(join("instructions", "sema-for-agents.md")),
    ]);
  });

  test("preserves user entries and global disable flags", async () => {
    const userMcp = { type: "local", command: ["my-sema", "mcp"], enabled: false };
    const config = await applyLegacyConfig({
      lsp: false,
      mcp: { sema: userMcp },
      formatter: false,
    });
    expect(config.lsp).toBe(false);
    expect(config.mcp.sema).toBe(userMcp);
    expect(config.formatter).toBe(false);
  });

  test("uses SEMA_PATH for every v1 command", async () => {
    process.env.SEMA_PATH = "~/bin/sema";
    const config = await applyLegacyConfig();
    const binary = homedir() + "/bin/sema";
    expect(config.lsp.sema.command).toEqual([binary, "lsp"]);
    expect(config.mcp.sema.command).toEqual([binary, "mcp"]);
    expect(config.formatter.sema.command).toEqual([binary, "fmt", "$FILE"]);
  });

  test("keeps v1 formatter and instruction opt-outs", async () => {
    process.env.SEMA_DISABLE_FORMATTER = "1";
    const formatterDisabled = await applyLegacyConfig();
    expect(formatterDisabled.formatter).toBeUndefined();

    process.env.SEMA_DISABLE_INSTRUCTIONS = "1";
    const instructionsDisabled = await applyLegacyConfig();
    expect(instructionsDisabled.instructions).toBeUndefined();

    process.env.SEMA_DISABLE_FORMATTER = "0";
    delete process.env.SEMA_DISABLE_INSTRUCTIONS;
    const formatterEnabled = await applyLegacyConfig();
    expect(formatterEnabled.formatter.sema).toBeDefined();
  });

  test("does not duplicate the v1 guide path", async () => {
    const config = await applyLegacyConfig();
    const hooks = await OpenCodeSema.server(mockLegacyInput());
    await hooks.config(config);
    expect(config.instructions).toHaveLength(1);
  });

  test("logs but does not fail when the v1 binary is missing", async () => {
    await applyLegacyConfig({}, { path: "/definitely/missing/sema" });
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ service: "opencode-sema", level: "warn" });
  });
});

describe("OpenCode v2", () => {
  test("registers the native MCP server with the resolved binary", async () => {
    const mock = mockV2Context({ path: "/bin/ls" });
    await OpenCodeSema.setup(mock.context as never);
    expect(mock.servers.get("sema")).toEqual({
      type: "local",
      command: ["/bin/ls", "mcp"],
    });
  });

  test("does not replace a user-owned MCP server", async () => {
    const userMcp = { type: "local", command: ["my-sema", "mcp"] };
    const mock = mockV2Context({}, new Map([["sema", userMcp]]));
    await OpenCodeSema.setup(mock.context as never);
    expect(mock.servers.get("sema")).toBe(userMcp);
  });

  test("adds the bundled guide to v2 model context", async () => {
    const mock = mockV2Context();
    await OpenCodeSema.setup(mock.context as never);
    expect(mock.applyInstructions()).toEqual([
      expect.objectContaining({ type: "text", text: expect.stringContaining("Sema") }),
    ]);
  });

  test("skips the v2 context hook when instructions are disabled", async () => {
    const mock = mockV2Context({ instructions: false });
    await OpenCodeSema.setup(mock.context as never);
    expect(mock.applyInstructions()).toEqual([]);
  });

  test("uses the environment instruction opt-out in v2", async () => {
    process.env.SEMA_DISABLE_INSTRUCTIONS = "1";
    const mock = mockV2Context();
    await OpenCodeSema.setup(mock.context as never);
    expect(mock.applyInstructions()).toEqual([]);
  });

  test("warns but completes v2 setup when the binary is missing", async () => {
    const originalWarn = console.warn;
    const warnings: unknown[][] = [];
    console.warn = (...args: unknown[]) => warnings.push(args);
    try {
      const mock = mockV2Context({ path: "/definitely/missing/sema", instructions: false });
      await OpenCodeSema.setup(mock.context as never);
    } finally {
      console.warn = originalWarn;
    }
    expect(warnings).toHaveLength(1);
    expect(warnings[0]?.join(" ")).toContain("/definitely/missing/sema");
  });
});
