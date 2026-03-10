import { describe, it, expect } from "vitest";
import { opencodeProvider } from "../../src/providers/opencode.js";
import type { ResolvedJato } from "../../src/core/jato.js";

function makeJato(overrides?: Partial<ResolvedJato>): ResolvedJato {
  return {
    manifest: {
      name: "test",
      providers: { opencode: true },
      mcp_servers: [],
      permissions: { auto_execute: false },
    },
    dir: "/fake/.jato/jatos/test",
    providerDocs: {},
    skills: [],
    agents: [],
    ...overrides,
  };
}

describe("opencodeProvider", () => {
  it("has correct config path", () => {
    expect(opencodeProvider.configPath("/home/user")).toBe(
      "/home/user/.config/opencode/opencode.json"
    );
  });

  it("materializes config with interactive mode", () => {
    const result = opencodeProvider.materialize(makeJato(), "/home/user");
    const config = JSON.parse(result.files[0].content);
    expect(config.mode).toBe("interactive");
  });

  it("sets auto mode for auto_execute", () => {
    const jato = makeJato({
      manifest: {
        name: "test",
        providers: {},
        mcp_servers: [],
        permissions: { auto_execute: true },
      },
    });

    const result = opencodeProvider.materialize(jato, "/home/user");
    const config = JSON.parse(result.files[0].content);
    expect(config.mode).toBe("auto");
  });

  it("materializes MCP servers", () => {
    const jato = makeJato({
      manifest: {
        name: "test",
        providers: {},
        mcp_servers: [
          {
            id: "github",
            transport: "stdio",
            command: "npx",
            args: ["-y", "server-github"],
            env: ["TOKEN"],
            enabled: true,
          },
        ],
        permissions: { auto_execute: false },
      },
    });

    const result = opencodeProvider.materialize(jato, "/home/user");
    const config = JSON.parse(result.files[0].content);
    expect(config.mcp.github).toBeDefined();
    expect(config.mcp.github.command).toBe("npx");
  });

  it("does not emit provider docs (no instructionsFileName)", () => {
    const jato = makeJato();
    const result = opencodeProvider.materialize(jato, "/home/user");
    expect(result.files).toHaveLength(1);
  });
});
