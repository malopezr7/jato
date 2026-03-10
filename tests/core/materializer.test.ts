import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, mkdir, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { stringify as stringifyYaml } from "yaml";
import { materialize } from "../../src/core/materializer.js";

let tmpHome: string;
let tmpTarget: string;

beforeEach(async () => {
  tmpHome = await mkdtemp(join(tmpdir(), "rig-mat-home-"));
  tmpTarget = await mkdtemp(join(tmpdir(), "rig-mat-target-"));
});

afterEach(async () => {
  await rm(tmpHome, { recursive: true, force: true });
  await rm(tmpTarget, { recursive: true, force: true });
});

async function createRig(name: string, manifest: Record<string, unknown>, extras?: {
  instructions?: string;
  providerDocs?: Record<string, string>;
  skills?: Record<string, string>;
}) {
  const jatoDir = join(tmpHome, ".jato", "rigs", name);
  await mkdir(join(jatoDir, "providers"), { recursive: true });
  await mkdir(join(jatoDir, "skills"), { recursive: true });
  await mkdir(join(jatoDir, "agents"), { recursive: true });
  await writeFile(join(jatoDir, "jato.yaml"), stringifyYaml(manifest));

  if (extras?.instructions) {
    await writeFile(join(jatoDir, "instructions.md"), extras.instructions);
  }
  if (extras?.providerDocs) {
    for (const [pname, content] of Object.entries(extras.providerDocs)) {
      await writeFile(join(jatoDir, "providers", `${pname}.md`), content);
    }
  }
  if (extras?.skills) {
    for (const [sname, content] of Object.entries(extras.skills)) {
      await writeFile(join(jatoDir, "skills", `${sname}.md`), content);
    }
  }
}

describe("materialize", () => {
  it("materializes a jato with claude provider", async () => {
    await createRig("test", {
      name: "test",
      providers: { claude: true },
      mcp_servers: [
        { id: "github", command: "npx", args: ["-y", "server-github"], env: ["GITHUB_TOKEN"] },
      ],
    }, {
      providerDocs: { claude: "# Claude\nBe helpful." },
    });

    const result = await materialize("test", { home: tmpHome, targetRoot: tmpTarget });

    expect(result.jatoName).toBe("test");
    expect(result.filesWritten.length).toBeGreaterThan(0);

    // Check settings.json was written
    const settingsPath = join(tmpHome, ".claude", "settings.json");
    expect(existsSync(settingsPath)).toBe(true);
    const settings = JSON.parse(await readFile(settingsPath, "utf8"));
    expect(settings.mcpServers.github).toBeDefined();

    // Check CLAUDE.md was written in target
    const claudeMd = join(tmpTarget, "CLAUDE.md");
    expect(existsSync(claudeMd)).toBe(true);
    const claudeContent = await readFile(claudeMd, "utf8");
    expect(claudeContent).toContain("Be helpful");

    // Check jato-context skill was installed
    const contextSkill = join(tmpHome, ".claude", "skills", "jato-context", "SKILL.md");
    expect(existsSync(contextSkill)).toBe(true);
    const contextContent = await readFile(contextSkill, "utf8");
    expect(contextContent).toContain("Active Jato: test");

    // Check jato-manager skill was installed
    const managerSkill = join(tmpHome, ".claude", "skills", "jato-manager", "SKILL.md");
    expect(existsSync(managerSkill)).toBe(true);
    const managerContent = await readFile(managerSkill, "utf8");
    expect(managerContent).toContain("jato — Manager Skill");
  });

  it("updates global config with active rig", async () => {
    await createRig("myrig", {
      name: "myrig",
      providers: { claude: true },
    });

    await materialize("myrig", { home: tmpHome, targetRoot: tmpTarget });

    const configPath = join(tmpHome, ".jato", "config.yaml");
    const configContent = await readFile(configPath, "utf8");
    expect(configContent).toContain("myrig");
  });

  it("skips disabled providers", async () => {
    await createRig("test", {
      name: "test",
      providers: { claude: true, gemini: false },
    });

    await materialize("test", { home: tmpHome, targetRoot: tmpTarget });

    const claudeSettings = join(tmpHome, ".claude", "settings.json");
    expect(existsSync(claudeSettings)).toBe(true);

    const geminiSettings = join(tmpHome, ".gemini", "settings.json");
    expect(existsSync(geminiSettings)).toBe(false);
  });

  it("throws for nonexistent rig", async () => {
    await expect(
      materialize("nonexistent", { home: tmpHome })
    ).rejects.toThrow("Jato 'nonexistent' not found");
  });
});
