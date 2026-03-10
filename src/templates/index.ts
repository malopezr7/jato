import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { readdir, readFile, mkdir, writeFile, cp } from "node:fs/promises";

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface TemplateInfo {
  name: string;
  description: string;
}

export async function listTemplates(): Promise<TemplateInfo[]> {
  const entries = await readdir(__dirname, { withFileTypes: true });
  const templates: TemplateInfo[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    try {
      const { parse: parseYaml } = await import("yaml");
      const raw = await readFile(join(__dirname, entry.name, "rig.yaml"), "utf8");
      const manifest = parseYaml(raw);
      templates.push({
        name: entry.name,
        description: manifest.description ?? "",
      });
    } catch {
      // Skip directories without valid rig.yaml
    }
  }

  return templates;
}

export function getTemplatePath(templateName: string): string {
  return join(__dirname, templateName);
}

export async function copyTemplate(
  templateName: string,
  destDir: string,
  rigName: string,
): Promise<void> {
  const srcDir = getTemplatePath(templateName);

  await cp(srcDir, destDir, { recursive: true });

  // Update the name in rig.yaml
  const { parse: parseYaml, stringify: stringifyYaml } = await import("yaml");
  const rigYamlPath = join(destDir, "rig.yaml");
  const raw = await readFile(rigYamlPath, "utf8");
  const manifest = parseYaml(raw);
  manifest.name = rigName;
  await writeFile(rigYamlPath, stringifyYaml(manifest), "utf8");
}
