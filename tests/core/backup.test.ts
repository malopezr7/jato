import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { writeWithBackup } from "../../src/core/backup.js";

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), "rig-backup-test-"));
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

describe("writeWithBackup", () => {
  it("writes content to file", async () => {
    const filePath = join(tmpDir, "test.json");
    await writeWithBackup(filePath, '{"hello": "world"}');

    const content = await readFile(filePath, "utf8");
    expect(content).toBe('{"hello": "world"}');
  });

  it("creates backup of existing file", async () => {
    const filePath = join(tmpDir, "test.json");
    await writeFile(filePath, "original", "utf8");

    const result = await writeWithBackup(filePath, "updated");

    expect(existsSync(result.backupPath)).toBe(true);
    const backup = await readFile(result.backupPath, "utf8");
    expect(backup).toBe("original");

    const current = await readFile(filePath, "utf8");
    expect(current).toBe("updated");
  });

  it("creates empty backup when file does not exist", async () => {
    const filePath = join(tmpDir, "new.json");
    const result = await writeWithBackup(filePath, "content");

    expect(existsSync(result.backupPath)).toBe(true);
    const backup = await readFile(result.backupPath, "utf8");
    expect(backup).toBe("");
  });

  it("creates parent directories if needed", async () => {
    const filePath = join(tmpDir, "a", "b", "c", "test.json");
    await writeWithBackup(filePath, "nested");

    const content = await readFile(filePath, "utf8");
    expect(content).toBe("nested");
  });

  it("returns correct paths", async () => {
    const filePath = join(tmpDir, "test.json");
    const result = await writeWithBackup(filePath, "content");

    expect(result.filePath).toBe(filePath);
    expect(result.backupPath).toMatch(/\.bak\.\d+$/);
  });
});
