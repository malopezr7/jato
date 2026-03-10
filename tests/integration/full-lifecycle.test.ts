import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { execSync } from "node:child_process";

let tmpHome: string;
let tmpTarget: string;
const cliPath = join(process.cwd(), "dist", "cli", "index.js");

beforeEach(async () => {
  tmpHome = await mkdtemp(join(tmpdir(), "rig-integration-"));
  tmpTarget = await mkdtemp(join(tmpdir(), "rig-int-target-"));
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

describe("full lifecycle: init → use → list → off", () => {
  it("completes the full lifecycle", async () => {
    // Step 1: Init with template
    const initOutput = runCli("init --template starter --name my-rig --yes");
    expect(initOutput).toContain("Created jato from template");

    // Verify rig was created
    expect(existsSync(join(tmpHome, ".jato", "rigs", "my-rig", "jato.yaml"))).toBe(true);
    expect(existsSync(join(tmpHome, ".jato", "skills", "jato-manager.md"))).toBe(true);

    // Step 2: Use the jato
    const useOutput = runCli("use my-rig");
    expect(useOutput).toContain("Active jato: my-rig");

    // Verify materialized files
    expect(existsSync(join(tmpHome, ".claude", "settings.json"))).toBe(true);
    expect(existsSync(join(tmpTarget, "CLAUDE.md"))).toBe(true);
    expect(existsSync(join(tmpHome, ".claude", "skills", "jato-context", "SKILL.md"))).toBe(true);
    expect(existsSync(join(tmpHome, ".claude", "skills", "jato-manager", "SKILL.md"))).toBe(true);

    // Verify jato-context content
    const contextSkill = await readFile(
      join(tmpHome, ".claude", "skills", "jato-context", "SKILL.md"),
      "utf8",
    );
    expect(contextSkill).toContain("Active Jato: my-rig");
    expect(contextSkill).toContain("github");

    // Step 3: List rigs
    const listOutput = runCli("list");
    expect(listOutput).toContain("my-rig");
    expect(listOutput).toContain("[active]");

    // Step 4: Check status
    const statusOutput = runCli("use");
    expect(statusOutput).toContain("my-rig");

    // Step 5: Off
    const offOutput = runCli("off");
    expect(offOutput).toContain("Deactivated");

    // Step 6: Verify deactivated
    const statusAfterOff = runCli("use");
    expect(statusAfterOff).toContain("No jato is currently active");

    // Step 7: List still shows the jato but not active
    const listAfterOff = runCli("list");
    expect(listAfterOff).toContain("my-rig");
    expect(listAfterOff).not.toContain("[active]");
  });
});

describe("multiple rigs", () => {
  it("can create and switch between rigs", () => {
    // Create two rigs
    runCli("init --template starter --name rig-a --yes");
    runCli("init --template backend --name rig-b --yes");

    // Use first
    runCli("use rig-a");
    let list = runCli("list");
    expect(list).toContain("rig-a");
    expect(list).toContain("rig-b");

    // Switch to second
    runCli("use rig-b");
    list = runCli("list");
    expect(list).toContain("rig-b");
  });
});
