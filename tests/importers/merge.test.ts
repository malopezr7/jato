import { describe, it, expect } from "vitest";
import { mergeImports } from "../../src/importers/merge.js";
import type { ImportResult } from "../../src/importers/types.js";

describe("mergeImports", () => {
  it("merges providers from multiple results", () => {
    const result = mergeImports([
      {
        providers: { claude: true },
        mcpServers: [],
        providerDocs: {},
        autoExecute: false,
        skills: [],
      },
      {
        providers: { codex: true },
        mcpServers: [],
        providerDocs: {},
        autoExecute: false,
        skills: [],
      },
    ]);

    expect(result.providers).toEqual({ claude: true, codex: true });
  });

  it("deduplicates MCP servers by id", () => {
    const result = mergeImports([
      {
        providers: { claude: true },
        mcpServers: [
          { id: "github", transport: "stdio", command: "npx", args: ["-y", "v1"], env: ["TOKEN"], enabled: true },
          { id: "unique-claude", transport: "stdio", command: "echo", args: [], env: [], enabled: true },
        ],
        providerDocs: {},
        autoExecute: false,
        skills: [],
      },
      {
        providers: { codex: true },
        mcpServers: [
          { id: "github", transport: "stdio", command: "npx", args: ["-y", "v2"], env: ["TOKEN"], enabled: true },
          { id: "unique-codex", transport: "stdio", command: "echo", args: [], env: [], enabled: true },
        ],
        providerDocs: {},
        autoExecute: false,
        skills: [],
      },
    ]);

    expect(result.mcpServers).toHaveLength(3);
    const ids = result.mcpServers.map((s) => s.id);
    expect(ids).toContain("github");
    expect(ids).toContain("unique-claude");
    expect(ids).toContain("unique-codex");
    // First occurrence wins
    expect(result.mcpServers.find((s) => s.id === "github")?.args).toEqual(["-y", "v1"]);
  });

  it("merges provider docs", () => {
    const result = mergeImports([
      {
        providers: { claude: true },
        mcpServers: [],
        providerDocs: { claude: "Claude docs" },
        autoExecute: false,
        skills: [],
      },
      {
        providers: { codex: true },
        mcpServers: [],
        providerDocs: { codex: "Codex docs" },
        autoExecute: false,
        skills: [],
      },
    ]);

    expect(result.providerDocs).toEqual({
      claude: "Claude docs",
      codex: "Codex docs",
    });
  });

  it("uses most conservative permission (false wins)", () => {
    const result = mergeImports([
      {
        providers: { claude: true },
        mcpServers: [],
        providerDocs: {},
        autoExecute: true,
        skills: [],
      },
      {
        providers: { codex: true },
        mcpServers: [],
        providerDocs: {},
        autoExecute: false,
        skills: [],
      },
    ]);

    expect(result.autoExecute).toBe(false);
  });

  it("sets auto_execute true only when all agree", () => {
    const result = mergeImports([
      {
        providers: { claude: true },
        mcpServers: [],
        providerDocs: {},
        autoExecute: true,
        skills: [],
      },
      {
        providers: { codex: true },
        mcpServers: [],
        providerDocs: {},
        autoExecute: true,
        skills: [],
      },
    ]);

    expect(result.autoExecute).toBe(true);
  });
});
