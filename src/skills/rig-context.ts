import type { ResolvedRig } from "../core/rig.js";

export function generateRigContextSkill(rig: ResolvedRig): string {
  const lines: string[] = [];

  lines.push("# rig — Active Context");
  lines.push("");
  lines.push("You are working within a rig-managed environment.");
  lines.push("");

  lines.push(`## Active Rig: ${rig.manifest.name}`);
  if (rig.manifest.description) {
    lines.push(rig.manifest.description);
  }
  lines.push("");

  if (rig.skills.length > 0) {
    lines.push("## Available Skills");
    lines.push("");
    lines.push("The following skill files contain specialized context. Read them when the task is relevant:");
    lines.push("");
    for (const skill of rig.skills) {
      lines.push(`- \`${skill.path}\` — ${skill.name}`);
    }
    lines.push("");
  }

  if (rig.manifest.mcp_servers.length > 0) {
    lines.push("## Configured MCP Servers");
    lines.push("");
    lines.push("The following MCP servers are configured and available in this session:");
    lines.push("");
    for (const server of rig.manifest.mcp_servers) {
      if (!server.enabled) continue;
      const cmd = server.url ?? `${server.command ?? ""} ${server.args.join(" ")}`.trim();
      const envNote = server.env.length > 0 ? ` (requires: ${server.env.join(", ")})` : "";
      lines.push(`- **${server.id}** — \`${cmd}\`${envNote}`);
    }
    lines.push("");
  }

  if (rig.instructions) {
    lines.push("## Global Instructions");
    lines.push("");
    lines.push(rig.instructions.trim());
    lines.push("");
  }

  if (rig.agents.length > 0) {
    lines.push("## Agents");
    lines.push("");
    for (const agent of rig.agents) {
      lines.push(`- \`${agent.path}\` — ${agent.name}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}
