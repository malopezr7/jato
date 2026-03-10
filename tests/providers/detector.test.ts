import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { detectInstalledProviders } from "../../src/providers/detector.js";

let tmpHome: string;

beforeEach(async () => {
  tmpHome = await mkdtemp(join(tmpdir(), "rig-detector-test-"));
});

afterEach(async () => {
  await rm(tmpHome, { recursive: true, force: true });
});

describe("detectInstalledProviders", () => {
  it("returns all providers with found=false when nothing exists", async () => {
    const results = await detectInstalledProviders(tmpHome);
    expect(results).toHaveLength(4);
    expect(results.every((r) => !r.found)).toBe(true);
  });

  it("detects claude when settings.json exists", async () => {
    await mkdir(join(tmpHome, ".claude"), { recursive: true });
    await writeFile(join(tmpHome, ".claude", "settings.json"), "{}");

    const results = await detectInstalledProviders(tmpHome);
    const claude = results.find((r) => r.name === "claude");
    expect(claude?.found).toBe(true);
  });

  it("detects codex when config.toml exists", async () => {
    await mkdir(join(tmpHome, ".codex"), { recursive: true });
    await writeFile(join(tmpHome, ".codex", "config.toml"), "");

    const results = await detectInstalledProviders(tmpHome);
    const codex = results.find((r) => r.name === "codex");
    expect(codex?.found).toBe(true);
  });

  it("detects gemini when settings.json exists", async () => {
    await mkdir(join(tmpHome, ".gemini"), { recursive: true });
    await writeFile(join(tmpHome, ".gemini", "settings.json"), "{}");

    const results = await detectInstalledProviders(tmpHome);
    const gemini = results.find((r) => r.name === "gemini");
    expect(gemini?.found).toBe(true);
  });

  it("detects opencode when opencode.json exists", async () => {
    await mkdir(join(tmpHome, ".config", "opencode"), { recursive: true });
    await writeFile(join(tmpHome, ".config", "opencode", "opencode.json"), "{}");

    const results = await detectInstalledProviders(tmpHome);
    const opencode = results.find((r) => r.name === "opencode");
    expect(opencode?.found).toBe(true);
  });

  it("detects multiple providers simultaneously", async () => {
    await mkdir(join(tmpHome, ".claude"), { recursive: true });
    await writeFile(join(tmpHome, ".claude", "settings.json"), "{}");
    await mkdir(join(tmpHome, ".codex"), { recursive: true });
    await writeFile(join(tmpHome, ".codex", "config.toml"), "");

    const results = await detectInstalledProviders(tmpHome);
    const found = results.filter((r) => r.found);
    expect(found).toHaveLength(2);
    expect(found.map((r) => r.name).sort()).toEqual(["claude", "codex"]);
  });
});
