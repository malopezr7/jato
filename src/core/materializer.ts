import { join } from "node:path";
import { mkdir, readFile, writeFile as fsWriteFile } from "node:fs/promises";
import { loadRig, type ResolvedRig } from "./rig.js";
import { writeGlobalConfig, getSkillsDir } from "./hub.js";
import { writeWithBackup, type BackupResult } from "./backup.js";
import { getProvider } from "../providers/registry.js";
import { generateRigContextSkill } from "../skills/rig-context.js";

export interface MaterializeOptions {
  home?: string;
  targetRoot?: string;
}

export interface MaterializeOutput {
  rigName: string;
  filesWritten: BackupResult[];
}

export async function materialize(
  rigName: string,
  options: MaterializeOptions = {},
): Promise<MaterializeOutput> {
  const { home, targetRoot = process.cwd() } = options;
  const rig = await loadRig(rigName, home);

  const filesWritten: BackupResult[] = [];

  const enabledProviders = Object.entries(rig.manifest.providers)
    .filter(([, enabled]) => enabled)
    .map(([name]) => name);

  for (const providerName of enabledProviders) {
    const provider = getProvider(providerName);
    if (!provider) continue;

    const result = provider.materialize(rig, home);

    for (const file of result.files) {
      const filePath = file.path.startsWith("/")
        ? file.path
        : join(targetRoot, file.path);
      const backup = await writeWithBackup(filePath, file.content);
      filesWritten.push(backup);
    }

    const skillsDir = provider.skillsDir(home);

    const contextSkillDir = join(skillsDir, "rig-context");
    await mkdir(contextSkillDir, { recursive: true });
    const contextContent = generateRigContextSkill(rig);
    const contextBackup = await writeWithBackup(
      join(contextSkillDir, "SKILL.md"),
      contextContent,
    );
    filesWritten.push(contextBackup);

    const managerSkillDir = join(skillsDir, "rig-manager");
    await mkdir(managerSkillDir, { recursive: true });
    const managerSourcePath = join(getSkillsDir(home), "rig-manager.md");
    let managerContent: string;
    try {
      managerContent = await readFile(managerSourcePath, "utf8");
    } catch {
      const { fileURLToPath } = await import("node:url");
      const { dirname } = await import("node:path");
      const __dirname = dirname(fileURLToPath(import.meta.url));
      managerContent = await readFile(
        join(__dirname, "..", "skills", "rig-manager.md"),
        "utf8",
      );
    }
    const managerBackup = await writeWithBackup(
      join(managerSkillDir, "SKILL.md"),
      managerContent,
    );
    filesWritten.push(managerBackup);
  }

  await writeGlobalConfig({ active_rig: rigName }, home);

  return { rigName, filesWritten };
}
