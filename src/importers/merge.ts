import type { ImportResult } from "./types.js";
import type { McpServer } from "../core/schema.js";

export function mergeImports(results: ImportResult[]): ImportResult {
  const providers: Record<string, boolean> = {};
  const mcpMap = new Map<string, McpServer>();
  const providerDocs: Record<string, string> = {};
  let autoExecute = false;
  const skills: { name: string; content: string }[] = [];

  for (const result of results) {
    Object.assign(providers, result.providers);

    for (const server of result.mcpServers) {
      if (!mcpMap.has(server.id)) {
        mcpMap.set(server.id, server);
      }
    }

    Object.assign(providerDocs, result.providerDocs);

    // Most conservative: only auto_execute if ALL say so
    // But actually: use the most conservative (false wins)
    // We start with false and only set true if ALL results agree
    if (result.autoExecute) {
      autoExecute = true;
    }

    skills.push(...result.skills);
  }

  // Most conservative permission: if any result says no auto_execute, then no
  if (results.some((r) => !r.autoExecute)) {
    autoExecute = false;
  }

  return {
    providers,
    mcpServers: [...mcpMap.values()],
    providerDocs,
    autoExecute,
    skills,
  };
}
