import { z } from "zod";

export const mcpServerSchema = z.object({
  id: z.string().min(1),
  transport: z.enum(["stdio", "http"]).default("stdio"),
  command: z.string().optional(),
  args: z.array(z.string()).default([]),
  url: z.string().optional(),
  env: z.array(z.string()).default([]),
  enabled: z.boolean().default(true),
});

export type McpServer = z.infer<typeof mcpServerSchema>;

export const jatoManifestSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),

  providers: z.record(z.string(), z.boolean()).default({}),

  mcp_servers: z.array(mcpServerSchema).default([]),

  permissions: z
    .object({
      auto_execute: z.boolean().default(false),
    })
    .default({ auto_execute: false }),
});

export type JatoManifest = z.infer<typeof jatoManifestSchema>;

export function parseJatoManifest(data: unknown): JatoManifest {
  return jatoManifestSchema.parse(data);
}
