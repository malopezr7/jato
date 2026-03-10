import type { McpServer, RigManifest } from "../core/schema.js";

export interface ImportResult {
  providers: Record<string, boolean>;
  mcpServers: McpServer[];
  providerDocs: Record<string, string>;
  autoExecute: boolean;
  skills: { name: string; content: string }[];
}
