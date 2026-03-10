import { join } from "node:path";
import { homedir } from "node:os";
import type { Provider, MaterializeResult } from "./types.js";
import type { ResolvedRig } from "../core/rig.js";
import type { McpServer } from "../core/schema.js";

function mapPermission(autoExecute: boolean): string {
  return autoExecute ? "yolo" : "default";
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
    entry.trust = true;
    result[server.id] = entry;
  }
  return result;
}

export const geminiProvider: Provider = {
  name: "gemini",

  configPath(home?: string): string {
    return join(home ?? homedir(), ".gemini", "settings.json");
  },

  skillsDir(home?: string): string {
    return join(home ?? homedir(), ".gemini", "skills");
  },

  instructionsFileName: "GEMINI.md",

  materialize(rig: ResolvedRig, home?: string): MaterializeResult {
    const files: MaterializeResult["files"] = [];

    const settings: Record<string, unknown> = {
      approvalMode: mapPermission(rig.manifest.permissions.auto_execute),
      mcpServers: mapMcpServers(rig.manifest.mcp_servers),
    };

    files.push({
      path: this.configPath(home),
      content: JSON.stringify(settings, null, 2) + "\n",
    });

    if (rig.providerDocs["gemini"]) {
      files.push({
        path: "GEMINI.md",
        content: rig.providerDocs["gemini"],
      });
    }

    return { files };
  },
};
