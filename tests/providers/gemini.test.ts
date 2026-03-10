import { describe, it, expect } from "vitest";
import { geminiProvider } from "../../src/providers/gemini.js";
import type { ResolvedJato } from "../../src/core/jato.js";

function makeJato(overrides?: Partial<ResolvedJato>): ResolvedJato {
  return {
    manifest: {
      name: "test",
      providers: { gemini: true },
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

describe("geminiProvider", () => {
  it("materializes settings with approvalMode", () => {
    const result = geminiProvider.materialize(makeJato(), "/home/user");
    const settings = JSON.parse(result.files[0].content);
    expect(settings.approvalMode).toBe("default");
  });

  it("sets yolo mode for auto_execute", () => {
    const jato = makeJato({
      manifest: {
        name: "test",
        providers: {},
        mcp_servers: [],
        permissions: { auto_execute: true },
      },
    });

    const result = geminiProvider.materialize(jato, "/home/user");
    const settings = JSON.parse(result.files[0].content);
    expect(settings.approvalMode).toBe("yolo");
  });

  it("materializes MCPs with trust flag", () => {
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
            env: ["GITHUB_TOKEN"],
            enabled: true,
          },
        ],
        permissions: { auto_execute: false },
      },
    });

    const result = geminiProvider.materialize(jato, "/home/user");
    const settings = JSON.parse(result.files[0].content);
    expect(settings.mcpServers.github.trust).toBe(true);
    expect(settings.mcpServers.github.env).toEqual({ GITHUB_TOKEN: "" });
  });

  it("materializes GEMINI.md", () => {
    const jato = makeJato({
      providerDocs: { gemini: "# Gemini" },
    });

    const result = geminiProvider.materialize(jato, "/home/user");
    expect(result.files).toHaveLength(2);
    expect(result.files[1].path).toBe("GEMINI.md");
  });
});
