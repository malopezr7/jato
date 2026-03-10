import { join } from "node:path";
import { homedir } from "node:os";
import type { Provider, MaterializeResult } from "./types.js";
import type { ResolvedJato } from "../core/jato.js";
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

function renderCodexConfig(jato: ResolvedJato): string {
  const lines: string[] = [];

  lines.push(`approval_policy = ${tomlString(jato.manifest.permissions.auto_execute ? "auto-edit" : "on-request")}`);
  lines.push("");

  for (const server of jato.manifest.mcp_servers) {
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

  materialize(jato: ResolvedJato, home?: string): MaterializeResult {
    const files: MaterializeResult["files"] = [];

    files.push({
      path: this.configPath(home),
      content: renderCodexConfig(jato),
    });

    if (jato.providerDocs["codex"]) {
      files.push({
        path: "AGENTS.md",
        content: jato.providerDocs["codex"],
      });
    }

    return { files };
  },
};
