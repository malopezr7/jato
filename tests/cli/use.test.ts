import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, mkdir, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { stringify as stringifyYaml } from "yaml";

let tmpHome: string;
let tmpTarget: string;
const cliPath = join(process.cwd(), "dist", "cli", "index.js");

beforeEach(async () => {
  tmpHome = await mkdtemp(join(tmpdir(), "rig-cli-use-"));
  tmpTarget = await mkdtemp(join(tmpdir(), "rig-cli-target-"));
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
    timeout: 10000,
  });
}

async function createRig(name: string) {
  const jatoDir = join(tmpHome, ".jato", "rigs", name);
  await mkdir(join(jatoDir, "providers"), { recursive: true });
  await mkdir(join(jatoDir, "skills"), { recursive: true });
  await mkdir(join(jatoDir, "agents"), { recursive: true });
  await writeFile(
    join(jatoDir, "jato.yaml"),
    stringifyYaml({
      name,
      description: `${name} rig`,
      providers: { claude: true },
      mcp_servers: [{ id: "github", command: "npx", args: ["-y", "server-github"] }],
    }),
  );
  await writeFile(join(jatoDir, "providers", "claude.md"), `# ${name} Claude docs`);
}

describe("jato use", () => {
  it("shows no active rig when none set", () => {
    const output = runCli("use");
    expect(output).toContain("No jato is currently active");
  });

  it("activates a jato", async () => {
    await createRig("test");
    const output = runCli("use test");

    expect(output).toContain("Active jato: test");

    // Check files were written
    expect(existsSync(join(tmpHome, ".claude", "settings.json"))).toBe(true);
    expect(existsSync(join(tmpTarget, "CLAUDE.md"))).toBe(true);
    expect(existsSync(join(tmpHome, ".claude", "skills", "jato-context", "SKILL.md"))).toBe(true);
  });

  it("shows active rig after activation", async () => {
    await createRig("myrig");
    runCli("use myrig");

    const output = runCli("use");
    expect(output).toContain("myrig");
  });
});
