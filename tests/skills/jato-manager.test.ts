import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const skillPath = join(__dirname, "../../src/skills/jato-manager.md");

describe("jato-manager.md", () => {
  it("exists and has content", async () => {
    const content = await readFile(skillPath, "utf8");
    expect(content.length).toBeGreaterThan(1000);
  });

  it("contains installation instructions", async () => {
    const content = await readFile(skillPath, "utf8");
    expect(content).toContain("## IMPORTANT: Before Doing Anything");
    expect(content).toContain("npx @malopezr7/jato");
    expect(content).toContain("Never create jato files manually");
  });

  it("contains CLI operations section", async () => {
    const content = await readFile(skillPath, "utf8");
    expect(content).toContain("## CLI Operations");
    expect(content).toContain("jato list");
    expect(content).toContain("jato use");
    expect(content).toContain("jato off");
    expect(content).toContain("jato doctor");
  });

  it("contains jato creation guide", async () => {
    const content = await readFile(skillPath, "utf8");
    expect(content).toContain("## Creating a New Jato");
    expect(content).toContain("Option A");
    expect(content).toContain("Option B");
    expect(content).toContain("Option C");
  });

  it("contains modification section", async () => {
    const content = await readFile(skillPath, "utf8");
    expect(content).toContain("## Modifying an Existing Jato");
  });

  it("contains MCP server catalog", async () => {
    const content = await readFile(skillPath, "utf8");
    expect(content).toContain("## Common MCP Server References");
    expect(content).toContain("github");
    expect(content).toContain("postgres");
    expect(content).toContain("supabase");
  });

  it("is between 2KB and 8KB", async () => {
    const content = await readFile(skillPath, "utf8");
    expect(content.length).toBeGreaterThan(2048);
    expect(content.length).toBeLessThan(8192);
  });
});
