import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { importClaude } from "../../src/importers/claude.js";

let tmpHome: string;

beforeEach(async () => {
  tmpHome = await mkdtemp(join(tmpdir(), "rig-import-claude-"));
});

afterEach(async () => {
  await rm(tmpHome, { recursive: true, force: true });
});

describe("importClaude", () => {
  it("imports basic settings", async () => {
    await mkdir(join(tmpHome, ".claude"), { recursive: true });
    await writeFile(
      join(tmpHome, ".claude", "settings.json"),
      JSON.stringify({
        permissions: { mode: "default" },
        mcpServers: {
          github: {
            command: "npx",
            args: ["-y", "server-github"],
            env: { GITHUB_TOKEN: "" },
          },
        },
      }),
    );

    const result = await importClaude(tmpHome);

    expect(result.providers.claude).toBe(true);
    expect(result.mcpServers).toHaveLength(1);
    expect(result.mcpServers[0].id).toBe("github");
    expect(result.mcpServers[0].command).toBe("npx");
    expect(result.mcpServers[0].env).toEqual(["GITHUB_TOKEN"]);
    expect(result.autoExecute).toBe(false);
  });

  it("detects auto-execute permission", async () => {
    await mkdir(join(tmpHome, ".claude"), { recursive: true });
    await writeFile(
      join(tmpHome, ".claude", "settings.json"),
      JSON.stringify({ permissions: { mode: "allowedCommands" } }),
    );

    const result = await importClaude(tmpHome);
    expect(result.autoExecute).toBe(true);
  });

  it("handles envVars format", async () => {
    await mkdir(join(tmpHome, ".claude"), { recursive: true });
    await writeFile(
      join(tmpHome, ".claude", "settings.json"),
      JSON.stringify({
        mcpServers: {
          test: {
            command: "echo",
            envVars: { API_KEY: "" },
          },
        },
      }),
    );

    const result = await importClaude(tmpHome);
    expect(result.mcpServers[0].env).toEqual(["API_KEY"]);
  });

  it("throws when config does not exist", async () => {
    await expect(importClaude(tmpHome)).rejects.toThrow();
  });
});
