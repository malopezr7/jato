import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const skillPath = join(__dirname, "../../src/skills/rig-manager.md");

describe("rig-manager.md", () => {
  it("exists and has content", async () => {
    const content = await readFile(skillPath, "utf8");
    expect(content.length).toBeGreaterThan(1000);
  });

  it("contains CLI operations section", async () => {
    const content = await readFile(skillPath, "utf8");
    expect(content).toContain("## CLI Operations");
    expect(content).toContain("rig list");
    expect(content).toContain("rig use");
    expect(content).toContain("rig off");
    expect(content).toContain("rig doctor");
  });

  it("contains rig creation wizard", async () => {
    const content = await readFile(skillPath, "utf8");
    expect(content).toContain("## Creating a New Rig");
    expect(content).toContain("Step 1");
    expect(content).toContain("Step 7");
  });

  it("contains modification section", async () => {
    const content = await readFile(skillPath, "utf8");
    expect(content).toContain("## Modifying an Existing Rig");
  });

  it("contains MCP server catalog", async () => {
    const content = await readFile(skillPath, "utf8");
    expect(content).toContain("## Common MCP Server References");
    expect(content).toContain("github");
    expect(content).toContain("postgres");
    expect(content).toContain("supabase");
  });

  it("is between 2KB and 6KB", async () => {
    const content = await readFile(skillPath, "utf8");
    expect(content.length).toBeGreaterThan(2048);
    expect(content.length).toBeLessThan(6144);
  });
});
