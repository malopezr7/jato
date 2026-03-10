import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

export interface GlobalConfig {
  active_jato?: string;
}

export function getHubDir(home?: string): string {
  return join(home ?? homedir(), ".jato");
}

export function getConfigPath(home?: string): string {
  return join(getHubDir(home), "config.yaml");
}

export function getJatosDir(home?: string): string {
  return join(getHubDir(home), "jatos");
}

export function getSkillsDir(home?: string): string {
  return join(getHubDir(home), "skills");
}

export function getJatoDir(jatoName: string, home?: string): string {
  return join(getJatosDir(home), jatoName);
}

export async function ensureHub(home?: string): Promise<void> {
  const hubDir = getHubDir(home);
  await mkdir(join(hubDir, "jatos"), { recursive: true });
  await mkdir(join(hubDir, "skills"), { recursive: true });
}

export async function readGlobalConfig(home?: string): Promise<GlobalConfig> {
  try {
    const raw = await readFile(getConfigPath(home), "utf8");
    const parsed = parseYaml(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as GlobalConfig;
  } catch {
    return {};
  }
}

export async function writeGlobalConfig(
  config: GlobalConfig,
  home?: string,
): Promise<void> {
  await ensureHub(home);
  await writeFile(getConfigPath(home), stringifyYaml(config), "utf8");
}

export async function getActiveJato(home?: string): Promise<string | undefined> {
  const config = await readGlobalConfig(home);
  return config.active_jato;
}

export async function listJatos(home?: string): Promise<string[]> {
  try {
    const entries = await readdir(getJatosDir(home), { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    return [];
  }
}
