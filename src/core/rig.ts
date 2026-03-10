import { readFile, readdir, access } from "node:fs/promises";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import { parseRigManifest, type RigManifest } from "./schema.js";
import { getRigDir } from "./hub.js";

export interface SkillInfo {
  name: string;
  path: string;
}

export interface AgentInfo {
  name: string;
  path: string;
}

export interface ResolvedRig {
  manifest: RigManifest;
  dir: string;
  instructions?: string;
  providerDocs: Record<string, string>;
  skills: SkillInfo[];
  agents: AgentInfo[];
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function readOptionalFile(path: string): Promise<string | undefined> {
  try {
    return await readFile(path, "utf8");
  } catch {
    return undefined;
  }
}

async function listMdFiles(dir: string): Promise<{ name: string; path: string }[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries
      .filter((e) => e.isFile() && e.name.endsWith(".md"))
      .map((e) => ({
        name: e.name.replace(/\.md$/, ""),
        path: join(dir, e.name),
      }));
  } catch {
    return [];
  }
}

export async function loadRig(name: string, home?: string): Promise<ResolvedRig> {
  const dir = getRigDir(name, home);
  const manifestPath = join(dir, "rig.yaml");

  if (!(await fileExists(manifestPath))) {
    throw new Error(`Rig '${name}' not found: ${manifestPath} does not exist`);
  }

  const raw = await readFile(manifestPath, "utf8");
  const parsed = parseYaml(raw);
  const manifest = parseRigManifest(parsed);

  const instructions = await readOptionalFile(join(dir, "instructions.md"));

  const providerDocs: Record<string, string> = {};
  const providersDir = join(dir, "providers");
  const providerFiles = await listMdFiles(providersDir);
  for (const pf of providerFiles) {
    const content = await readFile(pf.path, "utf8");
    providerDocs[pf.name] = content;
  }

  const skills = await listMdFiles(join(dir, "skills"));
  const agents = await listMdFiles(join(dir, "agents"));

  return {
    manifest,
    dir,
    instructions,
    providerDocs,
    skills,
    agents,
  };
}
