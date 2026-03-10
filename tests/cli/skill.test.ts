import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, mkdir, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

let tmpHome: string;
const cliPath = join(process.cwd(), "dist", "cli", "index.js");

beforeEach(async () => {
  tmpHome = await mkdtemp(join(tmpdir(), "rig-cli-skill-"));
});

afterEach(async () => {
  await rm(tmpHome, { recursive: true, force: true });
});

function runCli(
  args: string,
): { stdout: string; stderr: string; exitCode: number } {
  const result = spawnSync("node", [cliPath, ...args.split(" ")], {
    env: { ...process.env, HOME: tmpHome },
    encoding: "utf8",
    timeout: 10000,
  });
  return {
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    exitCode: result.status ?? 1,
  };
}

describe("jato skill install", () => {
  it("installs skill to a specific provider", async () => {
    // Create the provider's skills dir so detection can work
    await mkdir(join(tmpHome, ".claude"), { recursive: true });

    const { stdout } = runCli("skill install --provider claude");
    expect(stdout).toContain("Installed jato-manager skill");
    expect(stdout).toContain("claude");

    const skillContent = await readFile(
      join(tmpHome, ".claude", "skills", "jato-manager", "SKILL.md"),
      "utf8",
    );
    expect(skillContent).toContain("jato");
  });

  it("fails when no providers are detected and none specified", async () => {
    const { stderr, exitCode } = runCli("skill install");
    expect(exitCode).toBe(1);
    expect(stderr).toContain("No AI providers detected");
  });

  it("warns on unknown provider", async () => {
    const { stdout, stderr } = runCli("skill install --provider fakeprovider");
    const output = stdout + stderr;
    expect(output).toContain("Unknown provider");
  });
});
