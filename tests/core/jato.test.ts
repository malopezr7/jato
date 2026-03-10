import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { stringify as stringifyYaml } from "yaml";
import { loadJato } from "../../src/core/jato.js";

let tmpHome: string;

beforeEach(async () => {
  tmpHome = await mkdtemp(join(tmpdir(), "rig-test-"));
});

afterEach(async () => {
  await rm(tmpHome, { recursive: true, force: true });
});

async function createRig(name: string, manifest: Record<string, unknown>, extras?: {
  instructions?: string;
  providerDocs?: Record<string, string>;
  skills?: Record<string, string>;
  agents?: Record<string, string>;
}) {
  const jatoDir = join(tmpHome, ".jato", "jatos", name);
  await mkdir(join(jatoDir, "providers"), { recursive: true });
  await mkdir(join(jatoDir, "skills"), { recursive: true });
  await mkdir(join(jatoDir, "agents"), { recursive: true });
  await writeFile(join(jatoDir, "jato.yaml"), stringifyYaml(manifest));

  if (extras?.instructions) {
    await writeFile(join(jatoDir, "instructions.md"), extras.instructions);
  }
  if (extras?.providerDocs) {
    for (const [name, content] of Object.entries(extras.providerDocs)) {
      await writeFile(join(jatoDir, "providers", `${name}.md`), content);
    }
  }
  if (extras?.skills) {
    for (const [name, content] of Object.entries(extras.skills)) {
      await writeFile(join(jatoDir, "skills", `${name}.md`), content);
    }
  }
  if (extras?.agents) {
    for (const [name, content] of Object.entries(extras.agents)) {
      await writeFile(join(jatoDir, "agents", `${name}.md`), content);
    }
  }
}

describe("loadJato", () => {
  it("loads a minimal jato", async () => {
    await createRig("test", { name: "test" });
    const jato = await loadJato("test", tmpHome);

    expect(jato.manifest.name).toBe("test");
    expect(jato.instructions).toBeUndefined();
    expect(jato.providerDocs).toEqual({});
    expect(jato.skills).toEqual([]);
    expect(jato.agents).toEqual([]);
  });

  it("loads a full jato with all files", async () => {
    await createRig("mobile", {
      name: "mobile",
      description: "Mobile dev",
      providers: { claude: true, codex: true },
      mcp_servers: [{ id: "github", command: "npx", args: ["-y", "server-github"] }],
    }, {
      instructions: "# Global Instructions\nBe awesome.",
      providerDocs: {
        claude: "# Claude specific\nUse tools.",
        codex: "# Codex specific\nBe concise.",
      },
      skills: {
        "code-review": "# Code Review\nReview patterns.",
        "testing": "# Testing\nTest patterns.",
      },
      agents: {
        reviewer: "# Reviewer\nReview agent.",
      },
    });

    const jato = await loadJato("mobile", tmpHome);

    expect(jato.manifest.name).toBe("mobile");
    expect(jato.manifest.providers).toEqual({ claude: true, codex: true });
    expect(jato.manifest.mcp_servers).toHaveLength(1);
    expect(jato.instructions).toContain("Be awesome");
    expect(jato.providerDocs["claude"]).toContain("Use tools");
    expect(jato.providerDocs["codex"]).toContain("Be concise");
    expect(jato.skills).toHaveLength(2);
    expect(jato.skills.map((s) => s.name).sort()).toEqual(["code-review", "testing"]);
    expect(jato.agents).toHaveLength(1);
    expect(jato.agents[0].name).toBe("reviewer");
  });

  it("throws when jato does not exist", async () => {
    await expect(loadJato("nonexistent", tmpHome)).rejects.toThrow(
      "Jato 'nonexistent' not found"
    );
  });

  it("throws on invalid manifest", async () => {
    const jatoDir = join(tmpHome, ".jato", "jatos", "bad");
    await mkdir(jatoDir, { recursive: true });
    await writeFile(join(jatoDir, "jato.yaml"), stringifyYaml({ description: "no name" }));

    await expect(loadJato("bad", tmpHome)).rejects.toThrow();
  });
});
