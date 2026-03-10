import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";
import type { ImportResult } from "./types.js";
import type { McpServer } from "../core/schema.js";

interface GeminiSettings {
  approvalMode?: string;
  mcpServers?: Record<string, {
    command?: string;
    args?: string[];
    url?: string;
    env?: Record<string, string>;
    trust?: boolean;
    enabled?: boolean;
  }>;
}

function mapPermission(mode: string | undefined): boolean {
  return mode === "yolo";
}

function extractMcpServers(
  servers: GeminiSettings["mcpServers"],
): McpServer[] {
  if (!servers) return [];

  return Object.entries(servers).map(([id, config]) => ({
    id,
    transport: config.url ? ("http" as const) : ("stdio" as const),
    command: config.command,
    args: config.args ?? [],
    url: config.url,
    env: Object.keys(config.env ?? {}),
    enabled: config.enabled !== false,
  }));
}

export async function importGemini(home?: string): Promise<ImportResult> {
  const h = home ?? homedir();
  const configPath = join(h, ".gemini", "settings.json");
  const raw = await readFile(configPath, "utf8");
  const settings: GeminiSettings = JSON.parse(raw);

  const mcpServers = extractMcpServers(settings.mcpServers);
  const autoExecute = mapPermission(settings.approvalMode);

  const providerDocs: Record<string, string> = {};

  for (const dir of [process.cwd(), h]) {
    try {
      const content = await readFile(join(dir, "GEMINI.md"), "utf8");
      providerDocs["gemini"] = content;
      break;
    } catch {
      // continue
    }
  }

  return {
    providers: { gemini: true },
    mcpServers,
    providerDocs,
    autoExecute,
    skills: [],
  };
}
