import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { stringify as stringifyYaml } from "yaml";

let tmpHome: string;
const cliPath = join(process.cwd(), "dist", "cli", "index.js");

beforeEach(async () => {
  tmpHome = await mkdtemp(join(tmpdir(), "rig-cli-doctor-"));
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

describe("rig doctor", () => {
  it("detects missing hub", () => {
    const output = runCli("doctor");
    expect(output).toContain("rig doctor");
    expect(output).toContain("Hub directory");
  });

  it("runs full checks when hub and rig exist", async () => {
    // Create hub with active rig
    await mkdir(join(tmpHome, ".rig", "rigs", "test", "providers"), { recursive: true });
    await mkdir(join(tmpHome, ".rig", "rigs", "test", "skills"), { recursive: true });
    await mkdir(join(tmpHome, ".rig", "rigs", "test", "agents"), { recursive: true });

    await writeFile(
      join(tmpHome, ".rig", "config.yaml"),
      stringifyYaml({ active_rig: "test" }),
    );
    await writeFile(
      join(tmpHome, ".rig", "rigs", "test", "rig.yaml"),
      stringifyYaml({
        name: "test",
        providers: { claude: true },
        mcp_servers: [],
      }),
    );

    const output = runCli("doctor");
    expect(output).toContain("rig doctor");
    expect(output).toContain("checks passed");
  });
});
