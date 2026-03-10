import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function getRigManagerContent(): Promise<string> {
  return readFile(join(__dirname, "rig-manager.md"), "utf8");
}

export function getRigManagerSkillPath(): string {
  return join(__dirname, "rig-manager.md");
}
