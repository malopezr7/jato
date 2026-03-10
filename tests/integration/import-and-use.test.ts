import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, mkdir, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { parse as parseYaml } from "yaml";

let tmpHome: string;
let tmpTarget: string;
const cliPath = join(process.cwd(), "dist", "cli", "index.js");

beforeEach(async () => {
  tmpHome = await mkdtemp(join(tmpdir(), "rig-int-import-"));
  tmpTarget = await mkdtemp(join(tmpdir(), "rig-int-import-target-"));
});

afterEach(async () => {
  await rm(tmpHome, { recursive: true, force: true });
  await rm(tmpTarget, { recursive: true, force: true });
});

function runCli(args: string): string {
  return execSync(`node ${cliPath} ${args}`, {
    env: { ...process.env, HOME: tmpHome },
    encoding: "utf8",
    cwd: tmpTarget,
    timeout: 15000,
  });
}

describe("import → use lifecycle", () => {
  it("imports from claude and activates", async () => {
    // Set up fake claude config
    await mkdir(join(tmpHome, ".claude"), { recursive: true });
    await writeFile(
      join(tmpHome, ".claude", "settings.json"),
      JSON.stringify({
        permissions: { mode: "default" },
        mcpServers: {
          github: {
            command: "npx",
            args: ["-y", "@modelcontextprotocol/server-github"],
            env: { GITHUB_TOKEN: "" },
          },
          postgres: {
            command: "npx",
            args: ["-y", "@modelcontextprotocol/server-postgres"],
            env: { DATABASE_URL: "" },
          },
        },
      }),
    );

    // Import
    const initOutput = runCli("init --from claude --name imported --yes");
    expect(initOutput).toContain("Imported");

    // Verify jato.yaml was created with imported MCPs
    const jatoYaml = await readFile(
      join(tmpHome, ".jato", "jatos", "imported", "jato.yaml"),
      "utf8",
    );
    const manifest = parseYaml(jatoYaml);
    expect(manifest.name).toBe("imported");
    expect(manifest.mcp_servers).toHaveLength(2);
    expect(manifest.mcp_servers.map((s: { id: string }) => s.id).sort()).toEqual(["github", "postgres"]);

    // Activate
    const useOutput = runCli("use imported");
    expect(useOutput).toContain("Active jato: imported");

    // Verify materialized settings.json has the MCPs
    const settings = JSON.parse(
      await readFile(join(tmpHome, ".claude", "settings.json"), "utf8"),
    );
    expect(settings.mcpServers.github).toBeDefined();
    expect(settings.mcpServers.postgres).toBeDefined();

    // Doctor check
    const doctorOutput = runCli("doctor");
    expect(doctorOutput).toContain("jato doctor");
    expect(doctorOutput).toContain("checks passed");
  });
});
