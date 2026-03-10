import { join } from "node:path";
import { mkdir, readFile, writeFile as fsWriteFile } from "node:fs/promises";
import { loadJato, type ResolvedJato } from "./jato.js";
import { writeGlobalConfig, getSkillsDir } from "./hub.js";
import { writeWithBackup, type BackupResult } from "./backup.js";
import { getProvider } from "../providers/registry.js";
import { generateJatoContextSkill } from "../skills/jato-context.js";

export interface MaterializeOptions {
  home?: string;
  targetRoot?: string;
}

export interface MaterializeOutput {
  jatoName: string;
  filesWritten: BackupResult[];
}

export async function materialize(
  jatoName: string,
  options: MaterializeOptions = {},
): Promise<MaterializeOutput> {
  const { home, targetRoot = process.cwd() } = options;
  const rig = await loadJato(jatoName, home);

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

    const contextSkillDir = join(skillsDir, "jato-context");
    await mkdir(contextSkillDir, { recursive: true });
    const contextContent = generateJatoContextSkill(rig);
    const contextBackup = await writeWithBackup(
      join(contextSkillDir, "SKILL.md"),
      contextContent,
    );
    filesWritten.push(contextBackup);

    const managerSkillDir = join(skillsDir, "jato-manager");
    await mkdir(managerSkillDir, { recursive: true });
    const managerSourcePath = join(getSkillsDir(home), "jato-manager.md");
    let managerContent: string;
    try {
      managerContent = await readFile(managerSourcePath, "utf8");
    } catch {
      const { fileURLToPath } = await import("node:url");
      const { dirname } = await import("node:path");
      const __dirname = dirname(fileURLToPath(import.meta.url));
      managerContent = await readFile(
        join(__dirname, "..", "skills", "jato-manager.md"),
        "utf8",
      );
    }
    const managerBackup = await writeWithBackup(
      join(managerSkillDir, "SKILL.md"),
      managerContent,
    );
    filesWritten.push(managerBackup);
  }

  await writeGlobalConfig({ active_jato: jatoName }, home);

  return { jatoName, filesWritten };
}
