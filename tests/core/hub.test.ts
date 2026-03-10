import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  getHubDir,
  getRigsDir,
  getSkillsDir,
  getRigDir,
  ensureHub,
  readGlobalConfig,
  writeGlobalConfig,
  getActiveRig,
  listRigs,
} from "../../src/core/hub.js";

let tmpHome: string;

beforeEach(async () => {
  tmpHome = await mkdtemp(join(tmpdir(), "rig-test-"));
});

afterEach(async () => {
  await rm(tmpHome, { recursive: true, force: true });
});

describe("path helpers", () => {
  it("returns correct hub dir", () => {
    expect(getHubDir("/fake")).toBe("/fake/.rig");
  });

  it("returns correct rigs dir", () => {
    expect(getRigsDir("/fake")).toBe("/fake/.rig/rigs");
  });

  it("returns correct skills dir", () => {
    expect(getSkillsDir("/fake")).toBe("/fake/.rig/skills");
  });

  it("returns correct rig dir for a named rig", () => {
    expect(getRigDir("mobile", "/fake")).toBe("/fake/.rig/rigs/mobile");
  });
});

describe("ensureHub", () => {
  it("creates hub directories", async () => {
    await ensureHub(tmpHome);
    const { existsSync } = await import("node:fs");
    expect(existsSync(join(tmpHome, ".rig"))).toBe(true);
    expect(existsSync(join(tmpHome, ".rig", "rigs"))).toBe(true);
    expect(existsSync(join(tmpHome, ".rig", "skills"))).toBe(true);
  });

  it("is idempotent", async () => {
    await ensureHub(tmpHome);
    await ensureHub(tmpHome);
  });
});

describe("global config", () => {
  it("returns empty config when no file exists", async () => {
    const config = await readGlobalConfig(tmpHome);
    expect(config).toEqual({});
  });

  it("writes and reads config", async () => {
    await writeGlobalConfig({ active_rig: "mobile" }, tmpHome);
    const config = await readGlobalConfig(tmpHome);
    expect(config.active_rig).toBe("mobile");
  });

  it("reads active rig", async () => {
    await writeGlobalConfig({ active_rig: "backend" }, tmpHome);
    const active = await getActiveRig(tmpHome);
    expect(active).toBe("backend");
  });

  it("returns undefined when no active rig", async () => {
    const active = await getActiveRig(tmpHome);
    expect(active).toBeUndefined();
  });
});

describe("listRigs", () => {
  it("returns empty array when no rigs", async () => {
    const rigs = await listRigs(tmpHome);
    expect(rigs).toEqual([]);
  });

  it("lists rig directories", async () => {
    await ensureHub(tmpHome);
    await mkdir(join(tmpHome, ".rig", "rigs", "mobile"), { recursive: true });
    await mkdir(join(tmpHome, ".rig", "rigs", "backend"), { recursive: true });
    // Create a file to ensure it's filtered out
    await writeFile(join(tmpHome, ".rig", "rigs", ".DS_Store"), "");

    const rigs = await listRigs(tmpHome);
    expect(rigs.sort()).toEqual(["backend", "mobile"]);
  });
});
