import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { stringify as stringifyYaml } from "yaml";

let tmpHome: string;
const cliPath = join(process.cwd(), "dist", "cli", "index.js");

beforeEach(async () => {
  tmpHome = await mkdtemp(join(tmpdir(), "rig-cli-list-"));
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

async function createRig(name: string, description: string) {
  const rigDir = join(tmpHome, ".rig", "rigs", name);
  await mkdir(rigDir, { recursive: true });
  await writeFile(
    join(rigDir, "rig.yaml"),
    stringifyYaml({ name, description }),
  );
}

describe("rig list", () => {
  it("shows no rigs message", () => {
    const output = runCli("list");
    expect(output).toContain("No rigs found");
  });

  it("lists available rigs", async () => {
    await createRig("mobile", "Mobile dev");
    await createRig("backend", "Backend dev");

    const output = runCli("list");
    expect(output).toContain("mobile");
    expect(output).toContain("backend");
    expect(output).toContain("Mobile dev");
    expect(output).toContain("Backend dev");
  });
});
