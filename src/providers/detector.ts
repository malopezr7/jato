import { access } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";

export interface DetectedProvider {
  name: string;
  configPath: string;
  instructionsFile: string;
  found: boolean;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

const providerPaths: {
  name: string;
  configPath: (home: string) => string;
  instructionsFile: string;
}[] = [
  {
    name: "claude",
    configPath: (home) => join(home, ".claude", "settings.json"),
    instructionsFile: "CLAUDE.md",
  },
  {
    name: "codex",
    configPath: (home) => join(home, ".codex", "config.toml"),
    instructionsFile: "AGENTS.md",
  },
  {
    name: "gemini",
    configPath: (home) => join(home, ".gemini", "settings.json"),
    instructionsFile: "GEMINI.md",
  },
  {
    name: "opencode",
    configPath: (home) => join(home, ".config", "opencode", "opencode.json"),
    instructionsFile: "",
  },
];

export async function detectInstalledProviders(
  home?: string,
): Promise<DetectedProvider[]> {
  const h = home ?? homedir();
  const results: DetectedProvider[] = [];

  for (const p of providerPaths) {
    const configPath = p.configPath(h);
    const found = await fileExists(configPath);
    results.push({
      name: p.name,
      configPath,
      instructionsFile: p.instructionsFile,
      found,
    });
  }

  return results;
}
