import { join } from "node:path";
import { homedir } from "node:os";
import type { Provider, MaterializeResult } from "./types.js";
import type { ResolvedRig } from "../core/rig.js";
import type { McpServer } from "../core/schema.js";

function tomlString(value: string): string {
  return JSON.stringify(value);
}

function tomlArray(values: string[]): string {
  return `[${values.map(tomlString).join(", ")}]`;
}

function tomlKey(key: string): string {
  return /^[a-zA-Z0-9_-]+$/.test(key) ? key : JSON.stringify(key);
}

function renderCodexConfig(rig: ResolvedRig): string {
  const lines: string[] = [];

  lines.push(`approval_policy = ${tomlString(rig.manifest.permissions.auto_execute ? "auto-edit" : "on-request")}`);
  lines.push("");

  for (const server of rig.manifest.mcp_servers) {
    if (!server.enabled) continue;
    lines.push(`[mcp_servers.${tomlKey(server.id)}]`);

    if (server.url) {
      lines.push(`type = "http"`);
      lines.push(`url = ${tomlString(server.url)}`);
    } else {
      lines.push(`type = "stdio"`);
      if (server.command) {
        lines.push(`command = ${tomlString(server.command)}`);
      }
      if (server.args.length > 0) {
        lines.push(`args = ${tomlArray(server.args)}`);
      }
    }

    if (server.env.length > 0) {
      lines.push(`env_keys = ${tomlArray(server.env)}`);
    }

    lines.push("");
  }

  return lines.join("\n");
}

export const codexProvider: Provider = {
  name: "codex",

  configPath(home?: string): string {
    return join(home ?? homedir(), ".codex", "config.toml");
  },

  skillsDir(home?: string): string {
    return join(home ?? homedir(), ".codex", "skills");
  },

  instructionsFileName: "AGENTS.md",

  materialize(rig: ResolvedRig, home?: string): MaterializeResult {
    const files: MaterializeResult["files"] = [];

    files.push({
      path: this.configPath(home),
      content: renderCodexConfig(rig),
    });

    if (rig.providerDocs["codex"]) {
      files.push({
        path: "AGENTS.md",
        content: rig.providerDocs["codex"],
      });
    }

    return { files };
  },
};
