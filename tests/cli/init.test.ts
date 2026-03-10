import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, mkdir, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { execSync } from "node:child_process";

let tmpHome: string;
const cliPath = join(process.cwd(), "dist", "cli", "index.js");

beforeEach(async () => {
  tmpHome = await mkdtemp(join(tmpdir(), "rig-cli-init-"));
});

afterEach(async () => {
  await rm(tmpHome, { recursive: true, force: true });
});

function runCli(args: string): string {
  return execSync(`node ${cliPath} ${args}`, {
    env: { ...process.env, HOME: tmpHome },
    encoding: "utf8",
    timeout: 10000,
  });
}

describe("jato init --empty", () => {
  it("creates an empty jato", () => {
    const output = runCli("init --empty --name test-rig --yes");

    expect(output).toContain("Created empty jato");
    expect(existsSync(join(tmpHome, ".jato", "jatos", "test-rig", "jato.yaml"))).toBe(true);
    expect(existsSync(join(tmpHome, ".jato", "jatos", "test-rig", "instructions.md"))).toBe(true);
    expect(existsSync(join(tmpHome, ".jato", "skills", "jato-manager.md"))).toBe(true);
  });
});

describe("jato init --template", () => {
  it("creates a jato from template", () => {
    const output = runCli("init --template starter --name my-starter --yes");

    expect(output).toContain("Created jato from template");
    expect(existsSync(join(tmpHome, ".jato", "jatos", "my-starter", "jato.yaml"))).toBe(true);
    expect(existsSync(join(tmpHome, ".jato", "jatos", "my-starter", "instructions.md"))).toBe(true);
    expect(existsSync(join(tmpHome, ".jato", "jatos", "my-starter", "providers", "claude.md"))).toBe(true);
    expect(existsSync(join(tmpHome, ".jato", "jatos", "my-starter", "skills", "code-review.md"))).toBe(true);
  });

  it("updates jato name in manifest", async () => {
    runCli("init --template starter --name custom-name --yes");

    const { parse: parseYaml } = await import("yaml");
    const raw = await readFile(join(tmpHome, ".jato", "jatos", "custom-name", "jato.yaml"), "utf8");
    const manifest = parseYaml(raw);
    expect(manifest.name).toBe("custom-name");
  });
});

describe("jato init --from", () => {
  it("imports from claude when config exists", async () => {
    // Create a fake claude config
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

    const output = runCli("init --from claude --name imported --yes");

    expect(output).toContain("Imported");
    expect(existsSync(join(tmpHome, ".jato", "jatos", "imported", "jato.yaml"))).toBe(true);
  });
});
