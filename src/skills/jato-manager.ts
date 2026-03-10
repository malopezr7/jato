import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function getJatoManagerContent(): Promise<string> {
  return readFile(join(__dirname, "jato-manager.md"), "utf8");
}

export function getJatoManagerSkillPath(): string {
  return join(__dirname, "jato-manager.md");
}
