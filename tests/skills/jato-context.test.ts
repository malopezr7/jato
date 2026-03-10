import { describe, it, expect } from "vitest";
import { generateJatoContextSkill } from "../../src/skills/jato-context.js";
import type { ResolvedJato } from "../../src/core/jato.js";

function makeRig(overrides?: Partial<ResolvedJato>): ResolvedJato {
  return {
    manifest: {
      name: "test",
      providers: { claude: true },
      mcp_servers: [],
      permissions: { auto_execute: false },
    },
    dir: "/home/user/.jato/rigs/test",
    providerDocs: {},
    skills: [],
    agents: [],
    ...overrides,
  };
}

describe("generateJatoContextSkill", () => {
  it("generates minimal context", () => {
    const content = generateJatoContextSkill(makeRig());
    expect(content).toContain("# jato — Active Context");
    expect(content).toContain("## Active Jato: test");
    expect(content).not.toContain("## Available Skills");
  });

  it("includes description", () => {
    const content = generateJatoContextSkill(
      makeRig({
        manifest: {
          name: "mobile",
          description: "React Native dev",
          providers: {},
          mcp_servers: [],
          permissions: { auto_execute: false },
        },
      })
    );
    expect(content).toContain("React Native dev");
  });

  it("lists skills", () => {
    const content = generateJatoContextSkill(
      makeRig({
        skills: [
          { name: "code-review", path: "/home/.jato/rigs/test/skills/code-review.md" },
          { name: "testing", path: "/home/.jato/rigs/test/skills/testing.md" },
        ],
      })
    );
    expect(content).toContain("## Available Skills");
    expect(content).toContain("code-review");
    expect(content).toContain("testing");
  });

  it("lists MCP servers", () => {
    const content = generateJatoContextSkill(
      makeRig({
        manifest: {
          name: "test",
          providers: {},
          mcp_servers: [
            {
              id: "github",
              transport: "stdio",
              command: "npx",
              args: ["-y", "server-github"],
              env: ["GITHUB_TOKEN"],
              enabled: true,
            },
          ],
          permissions: { auto_execute: false },
        },
      })
    );
    expect(content).toContain("## Configured MCP Servers");
    expect(content).toContain("**github**");
    expect(content).toContain("GITHUB_TOKEN");
  });

  it("skips disabled MCP servers", () => {
    const content = generateJatoContextSkill(
      makeRig({
        manifest: {
          name: "test",
          providers: {},
          mcp_servers: [
            {
              id: "disabled",
              transport: "stdio",
              command: "echo",
              args: [],
              env: [],
              enabled: false,
            },
          ],
          permissions: { auto_execute: false },
        },
      })
    );
    expect(content).not.toContain("disabled");
  });

  it("includes instructions", () => {
    const content = generateJatoContextSkill(
      makeRig({ instructions: "Always use TypeScript." })
    );
    expect(content).toContain("## Global Instructions");
    expect(content).toContain("Always use TypeScript.");
  });

  it("lists agents", () => {
    const content = generateJatoContextSkill(
      makeRig({
        agents: [{ name: "reviewer", path: "/home/.jato/rigs/test/agents/reviewer.md" }],
      })
    );
    expect(content).toContain("## Agents");
    expect(content).toContain("reviewer");
  });

  it("stays under 4KB for reasonable rigs", () => {
    const content = generateJatoContextSkill(
      makeRig({
        manifest: {
          name: "mobile",
          description: "Mobile dev setup",
          providers: { claude: true, codex: true },
          mcp_servers: [
            { id: "github", transport: "stdio", command: "npx", args: ["-y", "s"], env: ["TOKEN"], enabled: true },
            { id: "expo", transport: "stdio", command: "npx", args: ["-y", "s"], env: ["TOKEN2"], enabled: true },
          ],
          permissions: { auto_execute: false },
        },
        instructions: "Short instructions.",
        skills: [
          { name: "code-review", path: "/p/code-review.md" },
          { name: "testing", path: "/p/testing.md" },
        ],
        agents: [{ name: "reviewer", path: "/p/reviewer.md" }],
      })
    );
    expect(content.length).toBeLessThan(4096);
  });
});
