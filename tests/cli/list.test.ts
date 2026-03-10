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

async function createJato(name: string, description: string) {
  const jatoDir = join(tmpHome, ".jato", "jatos", name);
  await mkdir(jatoDir, { recursive: true });
  await writeFile(
    join(jatoDir, "jato.yaml"),
    stringifyYaml({ name, description }),
  );
}

describe("jato list", () => {
  it("shows no jatos message", () => {
    const output = runCli("list");
    expect(output).toContain("No jatos found");
  });

  it("lists available jatos", async () => {
    await createJato("mobile", "Mobile dev");
    await createJato("backend", "Backend dev");

    const output = runCli("list");
    expect(output).toContain("mobile");
    expect(output).toContain("backend");
    expect(output).toContain("Mobile dev");
    expect(output).toContain("Backend dev");
  });
});
