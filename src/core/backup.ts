import { access, copyFile, mkdir, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export interface BackupResult {
  filePath: string;
  backupPath: string;
}

export async function writeWithBackup(
  filePath: string,
  content: string,
): Promise<BackupResult> {
  const backupPath = `${filePath}.bak.${Date.now()}`;
  const tmpPath = `${filePath}.tmp`;

  await mkdir(dirname(filePath), { recursive: true });

  try {
    await access(filePath);
    await copyFile(filePath, backupPath);
  } catch {
    await writeFile(backupPath, "", "utf8");
  }

  await writeFile(tmpPath, content, "utf8");
  await rename(tmpPath, filePath);

  return { filePath, backupPath };
}
