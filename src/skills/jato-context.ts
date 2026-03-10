import type { ResolvedJato } from "../core/jato.js";

export function generateJatoContextSkill(jato: ResolvedJato): string {
  const lines: string[] = [];

  lines.push("---");
  lines.push("name: jato-context");
  lines.push(
    "description: >",
  );
  lines.push(
    `  Active jato environment context for '${jato.manifest.name}'. Provides current configuration,`,
  );
  lines.push(
    "  available skills, MCP servers, and global instructions. Automatically loaded to inform",
  );
  lines.push(
    "  about the active AI environment setup.",
  );
  lines.push("---");
  lines.push("");
  lines.push("# jato — Active Context");
  lines.push("");
  lines.push("You are working within a jato-managed environment.");
  lines.push("");

  lines.push(`## Active Jato: ${jato.manifest.name}`);
  if (jato.manifest.description) {
    lines.push(jato.manifest.description);
  }
  lines.push("");

  if (jato.skills.length > 0) {
    lines.push("## Available Skills");
    lines.push("");
    lines.push("The following skill files contain specialized context. Read them when the task is relevant:");
    lines.push("");
    for (const skill of jato.skills) {
      lines.push(`- \`${skill.path}\` — ${skill.name}`);
    }
    lines.push("");
  }

  if (jato.manifest.mcp_servers.length > 0) {
    lines.push("## Configured MCP Servers");
    lines.push("");
    lines.push("The following MCP servers are configured and available in this session:");
    lines.push("");
    for (const server of jato.manifest.mcp_servers) {
      if (!server.enabled) continue;
      const cmd = server.url ?? `${server.command ?? ""} ${server.args.join(" ")}`.trim();
      const envNote = server.env.length > 0 ? ` (requires: ${server.env.join(", ")})` : "";
      lines.push(`- **${server.id}** — \`${cmd}\`${envNote}`);
    }
    lines.push("");
  }

  if (jato.instructions) {
    lines.push("## Global Instructions");
    lines.push("");
    lines.push(jato.instructions.trim());
    lines.push("");
  }

  if (jato.agents.length > 0) {
    lines.push("## Agents");
    lines.push("");
    for (const agent of jato.agents) {
      lines.push(`- \`${agent.path}\` — ${agent.name}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}
