import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";
import type { ImportResult } from "./types.js";
import type { McpServer } from "../core/schema.js";

function parseTomlSimple(content: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  let currentSection = "";

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const sectionMatch = trimmed.match(/^\[(.+)]$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1];
      continue;
    }

    const kvMatch = trimmed.match(/^(\S+)\s*=\s*(.+)$/);
    if (kvMatch) {
      const key = currentSection ? `${currentSection}.${kvMatch[1]}` : kvMatch[1];
      let value: unknown = kvMatch[2].trim();

      if (typeof value === "string") {
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        } else if (value.startsWith("[")) {
          try {
            value = JSON.parse(value);
          } catch {
            // keep as string
          }
        } else if (value === "true") {
          value = true;
        } else if (value === "false") {
          value = false;
        }
      }

      result[key] = value;
    }
  }

  return result;
}

function extractMcpServers(parsed: Record<string, unknown>): McpServer[] {
  const servers: McpServer[] = [];
  const serverIds = new Set<string>();

  for (const key of Object.keys(parsed)) {
    const match = key.match(/^mcp_servers\.([^.]+)\.(\w+)$/);
    if (match) serverIds.add(match[1]);
  }

  for (const id of serverIds) {
    const prefix = `mcp_servers.${id}`;
    const type = parsed[`${prefix}.type`] as string | undefined;
    const command = parsed[`${prefix}.command`] as string | undefined;
    const args = parsed[`${prefix}.args`] as string[] | undefined;
    const url = parsed[`${prefix}.url`] as string | undefined;
    const envKeys = parsed[`${prefix}.env_keys`] as string[] | undefined;

    servers.push({
      id,
      transport: type === "http" ? "http" : "stdio",
      command,
      args: args ?? [],
      url,
      env: envKeys ?? [],
      enabled: true,
    });
  }

  return servers;
}

export async function importCodex(home?: string): Promise<ImportResult> {
  const h = home ?? homedir();
  const configPath = join(h, ".codex", "config.toml");
  const raw = await readFile(configPath, "utf8");
  const parsed = parseTomlSimple(raw);

  const mcpServers = extractMcpServers(parsed);
  const policy = parsed["approval_policy"] as string | undefined;
  const autoExecute = policy === "auto-edit";

  const providerDocs: Record<string, string> = {};

  for (const dir of [process.cwd(), h]) {
    try {
      const content = await readFile(join(dir, "AGENTS.md"), "utf8");
      providerDocs["codex"] = content;
      break;
    } catch {
      // continue
    }
  }

  return {
    providers: { codex: true },
    mcpServers,
    providerDocs,
    autoExecute,
    skills: [],
  };
}
