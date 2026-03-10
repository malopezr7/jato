import { describe, it, expect } from "vitest";
import { generateRigContextSkill } from "../../src/skills/rig-context.js";
import type { ResolvedRig } from "../../src/core/rig.js";

function makeRig(overrides?: Partial<ResolvedRig>): ResolvedRig {
  return {
    manifest: {
      name: "test",
      providers: { claude: true },
      mcp_servers: [],
      permissions: { auto_execute: false },
    },
    dir: "/home/user/.rig/rigs/test",
    providerDocs: {},
    skills: [],
    agents: [],
    ...overrides,
  };
}

describe("generateRigContextSkill", () => {
  it("generates minimal context", () => {
    const content = generateRigContextSkill(makeRig());
    expect(content).toContain("# rig — Active Context");
    expect(content).toContain("## Active Rig: test");
    expect(content).not.toContain("## Available Skills");
  });

  it("includes description", () => {
    const content = generateRigContextSkill(
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
    const content = generateRigContextSkill(
      makeRig({
        skills: [
          { name: "code-review", path: "/home/.rig/rigs/test/skills/code-review.md" },
          { name: "testing", path: "/home/.rig/rigs/test/skills/testing.md" },
        ],
      })
    );
    expect(content).toContain("## Available Skills");
    expect(content).toContain("code-review");
    expect(content).toContain("testing");
  });

  it("lists MCP servers", () => {
    const content = generateRigContextSkill(
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
    const content = generateRigContextSkill(
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
    const content = generateRigContextSkill(
      makeRig({ instructions: "Always use TypeScript." })
    );
    expect(content).toContain("## Global Instructions");
    expect(content).toContain("Always use TypeScript.");
  });

  it("lists agents", () => {
    const content = generateRigContextSkill(
      makeRig({
        agents: [{ name: "reviewer", path: "/home/.rig/rigs/test/agents/reviewer.md" }],
      })
    );
    expect(content).toContain("## Agents");
    expect(content).toContain("reviewer");
  });

  it("stays under 4KB for reasonable rigs", () => {
    const content = generateRigContextSkill(
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
