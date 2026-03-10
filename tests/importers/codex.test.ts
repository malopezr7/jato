import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { importCodex } from "../../src/importers/codex.js";

let tmpHome: string;

beforeEach(async () => {
  tmpHome = await mkdtemp(join(tmpdir(), "rig-import-codex-"));
});

afterEach(async () => {
  await rm(tmpHome, { recursive: true, force: true });
});

describe("importCodex", () => {
  it("imports basic TOML config", async () => {
    await mkdir(join(tmpHome, ".codex"), { recursive: true });
    await writeFile(
      join(tmpHome, ".codex", "config.toml"),
      `approval_policy = "on-request"

[mcp_servers.github]
type = "stdio"
command = "npx"
args = ["-y", "server-github"]
env_keys = ["GITHUB_TOKEN"]
`,
    );

    const result = await importCodex(tmpHome);

    expect(result.providers.codex).toBe(true);
    expect(result.mcpServers).toHaveLength(1);
    expect(result.mcpServers[0].id).toBe("github");
    expect(result.mcpServers[0].command).toBe("npx");
    expect(result.mcpServers[0].env).toEqual(["GITHUB_TOKEN"]);
    expect(result.autoExecute).toBe(false);
  });

  it("detects auto-edit permission", async () => {
    await mkdir(join(tmpHome, ".codex"), { recursive: true });
    await writeFile(
      join(tmpHome, ".codex", "config.toml"),
      `approval_policy = "auto-edit"\n`,
    );

    const result = await importCodex(tmpHome);
    expect(result.autoExecute).toBe(true);
  });

  it("handles http transport", async () => {
    await mkdir(join(tmpHome, ".codex"), { recursive: true });
    await writeFile(
      join(tmpHome, ".codex", "config.toml"),
      `[mcp_servers.remote]
type = "http"
url = "https://example.com/mcp"
`,
    );

    const result = await importCodex(tmpHome);
    expect(result.mcpServers[0].transport).toBe("http");
    expect(result.mcpServers[0].url).toBe("https://example.com/mcp");
  });
});
