import { join } from "node:path";
import { homedir } from "node:os";
import type { Provider, MaterializeResult } from "./types.js";
import type { ResolvedJato } from "../core/jato.js";
import type { McpServer } from "../core/schema.js";

function mapPermission(autoExecute: boolean): string {
  return autoExecute ? "auto" : "interactive";
}

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
      const env: Record<string, string> = {};
      for (const key of server.env) {
        env[key] = "";
      }
      entry.env = env;
    }
    result[server.id] = entry;
  }
  return result;
}

export const opencodeProvider: Provider = {
  name: "opencode",

  configPath(home?: string): string {
    return join(home ?? homedir(), ".config", "opencode", "opencode.json");
  },

  skillsDir(home?: string): string {
    return join(home ?? homedir(), ".config", "opencode", "skills");
  },

  instructionsFileName: "",

  materialize(jato: ResolvedJato, home?: string): MaterializeResult {
    const files: MaterializeResult["files"] = [];

    const config: Record<string, unknown> = {
      mode: mapPermission(jato.manifest.permissions.auto_execute),
      mcp: mapMcpServers(jato.manifest.mcp_servers),
    };

    files.push({
      path: this.configPath(home),
      content: JSON.stringify(config, null, 2) + "\n",
    });

    return { files };
  },
};
