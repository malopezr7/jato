import { describe, it, expect } from "vitest";
import { codexProvider } from "../../src/providers/codex.js";
import type { ResolvedJato } from "../../src/core/jato.js";

function makeRig(overrides?: Partial<ResolvedJato>): ResolvedJato {
  return {
    manifest: {
      name: "test",
      providers: { codex: true },
      mcp_servers: [],
      permissions: { auto_execute: false },
    },
    dir: "/fake/.jato/rigs/test",
    providerDocs: {},
    skills: [],
    agents: [],
    ...overrides,
  };
}

describe("codexProvider", () => {
  it("has correct config path", () => {
    expect(codexProvider.configPath("/home/user")).toBe(
      "/home/user/.codex/config.toml"
    );
  });

  it("materializes basic TOML config", () => {
    const result = codexProvider.materialize(makeRig(), "/home/user");
    expect(result.files).toHaveLength(1);
    expect(result.files[0].content).toContain('approval_policy = "on-request"');
  });

  it("materializes MCP servers in TOML format", () => {
    const rig = makeRig({
      manifest: {
        name: "test",
        providers: { codex: true },
        mcp_servers: [
          {
            id: "github",
            transport: "stdio",
            command: "npx",
            args: ["-y", "server-github"],
            env: ["GITHUB_TOKEN"],
            enabled: true,
          },
        ],
        permissions: { auto_execute: false },
      },
    });

    const result = codexProvider.materialize(rig, "/home/user");
    const content = result.files[0].content;
    expect(content).toContain("[mcp_servers.github]");
    expect(content).toContain('type = "stdio"');
    expect(content).toContain('command = "npx"');
    expect(content).toContain('args = ["-y", "server-github"]');
    expect(content).toContain('env_keys = ["GITHUB_TOKEN"]');
  });

  it("materializes http transport servers", () => {
    const rig = makeRig({
      manifest: {
        name: "test",
        providers: { codex: true },
        mcp_servers: [
          {
            id: "remote",
            transport: "http",
            url: "https://example.com/mcp",
            args: [],
            env: [],
            enabled: true,
          },
        ],
        permissions: { auto_execute: false },
      },
    });

    const result = codexProvider.materialize(rig, "/home/user");
    const content = result.files[0].content;
    expect(content).toContain('type = "http"');
    expect(content).toContain('url = "https://example.com/mcp"');
  });

  it("materializes auto-edit permission", () => {
    const rig = makeRig({
      manifest: {
        name: "test",
        providers: {},
        mcp_servers: [],
        permissions: { auto_execute: true },
      },
    });

    const result = codexProvider.materialize(rig, "/home/user");
    expect(result.files[0].content).toContain('approval_policy = "auto-edit"');
  });

  it("materializes provider docs as AGENTS.md", () => {
    const rig = makeRig({
      providerDocs: { codex: "# Codex Instructions" },
    });

    const result = codexProvider.materialize(rig, "/home/user");
    expect(result.files).toHaveLength(2);
    expect(result.files[1].path).toBe("AGENTS.md");
  });
});
