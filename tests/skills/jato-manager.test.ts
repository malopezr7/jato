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

  it("has valid YAML frontmatter", async () => {
    const content = await readFile(skillPath, "utf8");
    expect(content).toMatch(/^---\n/);
    expect(content).toContain("name: jato-manager");
    expect(content).toContain("description:");
    // Description should include trigger phrases
    expect(content).toMatch(/Use when/i);
  });

  it("contains prerequisites and install instructions", async () => {
    const content = await readFile(skillPath, "utf8");
    expect(content).toContain("## Prerequisites");
    expect(content).toContain("npx @malopezr7/jato");
  });

  it("contains CLI commands section", async () => {
    const content = await readFile(skillPath, "utf8");
    expect(content).toContain("## CLI Commands");
    expect(content).toContain("jato list");
    expect(content).toContain("jato use");
    expect(content).toContain("jato off");
    expect(content).toContain("jato doctor");
  });

  it("contains jato creation guide with CLI and manual options", async () => {
    const content = await readFile(skillPath, "utf8");
    expect(content).toContain("## Creating a New Jato");
    expect(content).toContain("Via CLI");
    expect(content).toContain("Via guided manual creation");
    expect(content).toContain("Step 1");
  });

  it("contains skill recommendations", async () => {
    const content = await readFile(skillPath, "utf8");
    expect(content).toContain("## Skill Recommendations");
    expect(content).toContain("Mobile");
    expect(content).toContain("Backend");
    expect(content).toContain("Frontend");
  });

  it("contains modification section", async () => {
    const content = await readFile(skillPath, "utf8");
    expect(content).toContain("## Modifying an Existing Jato");
  });

  it("contains MCP server catalog", async () => {
    const content = await readFile(skillPath, "utf8");
    expect(content).toContain("## Common MCP Servers");
    expect(content).toContain("github");
    expect(content).toContain("postgres");
    expect(content).toContain("supabase");
  });

  it("contains troubleshooting section", async () => {
    const content = await readFile(skillPath, "utf8");
    expect(content).toContain("## Troubleshooting");
    expect(content).toContain("Cause:");
    expect(content).toContain("Fix:");
  });

  it("is between 2KB and 10KB", async () => {
    const content = await readFile(skillPath, "utf8");
    expect(content.length).toBeGreaterThan(2048);
    expect(content.length).toBeLessThan(10240);
  });
});
