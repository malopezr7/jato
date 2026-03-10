import { join } from "node:path";
import { homedir } from "node:os";
import type { Provider, MaterializeResult } from "./types.js";
import type { ResolvedJato } from "../core/jato.js";
import type { McpServer } from "../core/schema.js";

function mapMcpServers(
  servers: McpServer[],
): Record<string, Record<string, unknown>> {
  const result: Record<string, Record<string, unknown>> = {};
  for (const server of servers) {
    if (!server.enabled) continue;
    const entry: Record<string, unknown> = {};
    if (server.command) entry.command = server.command;
    if (server.args.length > 0) entry.args = server.args;
    if (server.url) entry.url = server.url;
    if (server.env.length > 0) {
      const envVars: Record<string, string> = {};
      for (const key of server.env) {
        envVars[key] = "";
      }
      entry.env = envVars;
    }
    result[server.id] = entry;
  }
  return result;
}

function mapPermission(autoExecute: boolean): string {
  return autoExecute ? "allowedCommands" : "default";
}

export const claudeProvider: Provider = {
  name: "claude",

  configPath(home?: string): string {
    return join(home ?? homedir(), ".claude", "settings.json");
  },

  skillsDir(home?: string): string {
    return join(home ?? homedir(), ".claude", "skills");
  },

  instructionsFileName: "CLAUDE.md",

  materialize(jato: ResolvedJato, home?: string): MaterializeResult {
    const files: MaterializeResult["files"] = [];

    const settings: Record<string, unknown> = {
      permissions: {
        mode: mapPermission(jato.manifest.permissions.auto_execute),
      },
      mcpServers: mapMcpServers(jato.manifest.mcp_servers),
    };

    files.push({
      path: this.configPath(home),
      content: JSON.stringify(settings, null, 2) + "\n",
    });

    if (jato.providerDocs["claude"]) {
      files.push({
        path: "CLAUDE.md",
        content: jato.providerDocs["claude"],
      });
    }

    return { files };
  },
};
