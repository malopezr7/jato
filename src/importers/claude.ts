import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";
import type { ImportResult } from "./types.js";
import type { McpServer } from "../core/schema.js";

interface ClaudeSettings {
  permissions?: { mode?: string };
  mcpServers?: Record<string, {
    command?: string;
    args?: string[];
    url?: string;
    env?: Record<string, string>;
    envVars?: Record<string, string>;
    enabled?: boolean;
  }>;
  instructions?: string;
}

function mapPermission(mode: string | undefined): boolean {
  return mode === "allowedCommands";
}

function extractMcpServers(
  servers: ClaudeSettings["mcpServers"],
): McpServer[] {
  if (!servers) return [];

  return Object.entries(servers).map(([id, config]) => ({
    id,
    transport: config.url ? ("http" as const) : ("stdio" as const),
    command: config.command,
    args: config.args ?? [],
    url: config.url,
    env: Object.keys(config.env ?? config.envVars ?? {}),
    enabled: config.enabled !== false,
  }));
}

export async function importClaude(home?: string): Promise<ImportResult> {
  const h = home ?? homedir();
  const configPath = join(h, ".claude", "settings.json");
  const raw = await readFile(configPath, "utf8");
  const settings: ClaudeSettings = JSON.parse(raw);

  const mcpServers = extractMcpServers(settings.mcpServers);
  const autoExecute = mapPermission(settings.permissions?.mode);

  const providerDocs: Record<string, string> = {};

  // Try to find CLAUDE.md in home or cwd
  for (const dir of [process.cwd(), h]) {
    try {
      const content = await readFile(join(dir, "CLAUDE.md"), "utf8");
      providerDocs["claude"] = content;
      break;
    } catch {
      // continue
    }
  }

  return {
    providers: { claude: true },
    mcpServers,
    providerDocs,
    autoExecute,
    skills: [],
  };
}
