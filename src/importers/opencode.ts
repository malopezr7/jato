import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";
import type { ImportResult } from "./types.js";
import type { McpServer } from "../core/schema.js";

interface OpenCodeConfig {
  mode?: string;
  instructions?: string;
  mcp?: Record<string, {
    command?: string;
    args?: string[];
    url?: string;
    env?: Record<string, string>;
  }>;
}

function mapPermission(mode: string | undefined): boolean {
  return mode === "auto";
}

function extractMcpServers(
  mcp: OpenCodeConfig["mcp"],
): McpServer[] {
  if (!mcp) return [];

  return Object.entries(mcp)
    .filter(([id]) => id.length > 0)
    .map(([id, config]) => ({
      id,
      transport: config.url ? ("http" as const) : ("stdio" as const),
      command: config.command,
      args: config.args ?? [],
      url: config.url,
      env: Object.keys(config.env ?? {}),
      enabled: true,
    }));
}

export async function importOpenCode(home?: string): Promise<ImportResult> {
  const h = home ?? homedir();
  const configPath = join(h, ".config", "opencode", "opencode.json");
  const raw = await readFile(configPath, "utf8");
  const config: OpenCodeConfig = JSON.parse(raw);

  const mcpServers = extractMcpServers(config.mcp);
  const autoExecute = mapPermission(config.mode);

  return {
    providers: { opencode: true },
    mcpServers,
    providerDocs: {},
    autoExecute,
    skills: [],
  };
}
