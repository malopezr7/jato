import { describe, it, expect } from "vitest";
import { claudeProvider } from "../../src/providers/claude.js";
import type { ResolvedJato } from "../../src/core/jato.js";

function makeJato(overrides?: Partial<ResolvedJato>): ResolvedJato {
  return {
    manifest: {
      name: "test",
      providers: { claude: true },
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

describe("claudeProvider", () => {
  it("has correct config path", () => {
    expect(claudeProvider.configPath("/home/user")).toBe(
      "/home/user/.claude/settings.json"
    );
  });

  it("materializes basic settings", () => {
    const result = claudeProvider.materialize(makeJato(), "/home/user");
    expect(result.files).toHaveLength(1);

    const settings = JSON.parse(result.files[0].content);
    expect(settings.permissions.mode).toBe("default");
    expect(settings.mcpServers).toEqual({});
  });

  it("materializes MCP servers", () => {
    const jato = makeJato({
      manifest: {
        name: "test",
        providers: { claude: true },
        mcp_servers: [
          {
            id: "github",
            transport: "stdio",
            command: "npx",
            args: ["-y", "@modelcontextprotocol/server-github"],
            env: ["GITHUB_TOKEN"],
            enabled: true,
          },
          {
            id: "disabled",
            transport: "stdio",
            command: "echo",
            args: [],
            env: [],
            enabled: false,
          },
        ],
        permissions: { auto_execute: false },
      },
    });

    const result = claudeProvider.materialize(jato, "/home/user");
    const settings = JSON.parse(result.files[0].content);

    expect(settings.mcpServers.github).toBeDefined();
    expect(settings.mcpServers.github.command).toBe("npx");
    expect(settings.mcpServers.github.args).toEqual(["-y", "@modelcontextprotocol/server-github"]);
    expect(settings.mcpServers.github.env).toEqual({ GITHUB_TOKEN: "" });
    expect(settings.mcpServers.disabled).toBeUndefined();
  });

  it("materializes auto_execute permission", () => {
    const jato = makeJato({
      manifest: {
        name: "test",
        providers: {},
        mcp_servers: [],
        permissions: { auto_execute: true },
      },
    });

    const result = claudeProvider.materialize(jato, "/home/user");
    const settings = JSON.parse(result.files[0].content);
    expect(settings.permissions.mode).toBe("allowedCommands");
  });

  it("materializes provider docs as CLAUDE.md", () => {
    const jato = makeJato({
      providerDocs: { claude: "# Claude Instructions\nDo things." },
    });

    const result = claudeProvider.materialize(jato, "/home/user");
    expect(result.files).toHaveLength(2);
    expect(result.files[1].path).toBe("CLAUDE.md");
    expect(result.files[1].content).toContain("Claude Instructions");
  });
});
