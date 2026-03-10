import { describe, it, expect } from "vitest";
import { parseJatoManifest, jatoManifestSchema } from "../../src/core/schema.js";

describe("jatoManifestSchema", () => {
  it("parses a minimal valid manifest", () => {
    const result = parseJatoManifest({ name: "test" });
    expect(result).toEqual({
      name: "test",
      providers: {},
      mcp_servers: [],
      permissions: { auto_execute: false },
    });
  });

  it("parses a full manifest with all fields", () => {
    const input = {
      name: "mobile",
      description: "React Native mobile development setup",
      providers: { claude: true, codex: true, gemini: false },
      mcp_servers: [
        {
          id: "github",
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-github"],
          env: ["GITHUB_TOKEN"],
        },
        {
          id: "expo",
          transport: "stdio",
          command: "npx",
          args: ["-y", "expo-mcp-server"],
          env: ["EXPO_TOKEN"],
        },
      ],
      permissions: { auto_execute: false },
    };

    const result = parseJatoManifest(input);
    expect(result.name).toBe("mobile");
    expect(result.description).toBe("React Native mobile development setup");
    expect(result.providers).toEqual({ claude: true, codex: true, gemini: false });
    expect(result.mcp_servers).toHaveLength(2);
    expect(result.mcp_servers[0].id).toBe("github");
    expect(result.mcp_servers[0].transport).toBe("stdio");
    expect(result.mcp_servers[1].env).toEqual(["EXPO_TOKEN"]);
    expect(result.permissions.auto_execute).toBe(false);
  });

  it("applies defaults for optional fields", () => {
    const result = parseJatoManifest({
      name: "minimal",
      mcp_servers: [{ id: "test", command: "echo" }],
    });

    expect(result.mcp_servers[0]).toEqual({
      id: "test",
      transport: "stdio",
      command: "echo",
      args: [],
      env: [],
      enabled: true,
    });
    expect(result.permissions).toEqual({ auto_execute: false });
    expect(result.providers).toEqual({});
  });

  it("rejects a manifest without name", () => {
    expect(() => parseJatoManifest({})).toThrow();
  });

  it("rejects a manifest with empty name", () => {
    expect(() => parseJatoManifest({ name: "" })).toThrow();
  });

  it("rejects invalid mcp_server transport", () => {
    expect(() =>
      parseJatoManifest({
        name: "test",
        mcp_servers: [{ id: "s", transport: "websocket" }],
      })
    ).toThrow();
  });

  it("parses http transport mcp server", () => {
    const result = parseJatoManifest({
      name: "test",
      mcp_servers: [
        { id: "remote", transport: "http", url: "https://example.com/mcp" },
      ],
    });

    expect(result.mcp_servers[0].transport).toBe("http");
    expect(result.mcp_servers[0].url).toBe("https://example.com/mcp");
  });
});
