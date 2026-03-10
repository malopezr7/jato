import type { Command } from "commander";
import { mkdir, writeFile, readFile, cp } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { stringify as stringifyYaml } from "yaml";
import chalk from "chalk";
import { ensureHub, getRigDir, getRigsDir, getSkillsDir } from "../../core/hub.js";
import { detectInstalledProviders } from "../../providers/detector.js";
import { importClaude } from "../../importers/claude.js";
import { importCodex } from "../../importers/codex.js";
import { importGemini } from "../../importers/gemini.js";
import { importOpenCode } from "../../importers/opencode.js";
import { mergeImports } from "../../importers/merge.js";
import { copyTemplate, listTemplates } from "../../templates/index.js";
import type { ImportResult } from "../../importers/types.js";
import type { RigManifest } from "../../core/schema.js";

const importerMap: Record<string, (home?: string) => Promise<ImportResult>> = {
  claude: importClaude,
  codex: importCodex,
  gemini: importGemini,
  opencode: importOpenCode,
};

async function installRigManagerSkill(home?: string): Promise<void> {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const sourcePath = join(__dirname, "..", "..", "skills", "rig-manager.md");
  const destDir = getSkillsDir(home);
  await mkdir(destDir, { recursive: true });

  let content: string;
  try {
    content = await readFile(sourcePath, "utf8");
  } catch {
    // Fallback for development: read from src
    const srcPath = join(__dirname, "..", "..", "..", "src", "skills", "rig-manager.md");
    content = await readFile(srcPath, "utf8");
  }
  await writeFile(join(destDir, "rig-manager.md"), content, "utf8");
}

async function createEmptyRig(name: string, home?: string): Promise<void> {
  const rigDir = getRigDir(name, home);
  await mkdir(join(rigDir, "providers"), { recursive: true });
  await mkdir(join(rigDir, "skills"), { recursive: true });
  await mkdir(join(rigDir, "agents"), { recursive: true });

  const detected = await detectInstalledProviders(home);
  const providers: Record<string, boolean> = {};
  for (const d of detected) {
    if (d.found) providers[d.name] = true;
  }

  const manifest: RigManifest = {
    name,
    description: "",
    providers,
    mcp_servers: [],
    permissions: { auto_execute: false },
  };

  await writeFile(join(rigDir, "rig.yaml"), stringifyYaml(manifest), "utf8");
  await writeFile(
    join(rigDir, "instructions.md"),
    "# Instructions\n\nAdd your global instructions here.\n",
    "utf8",
  );
}

async function createFromImport(
  providerNames: string[],
  name: string,
  home?: string,
): Promise<{ mcpCount: number; providerDocs: string[] }> {
  const results: ImportResult[] = [];

  for (const providerName of providerNames) {
    const importer = importerMap[providerName];
    if (!importer) continue;
    try {
      const result = await importer(home);
      results.push(result);
    } catch {
      // Provider not importable, skip
    }
  }

  if (results.length === 0) {
    throw new Error("No providers could be imported");
  }

  const merged = mergeImports(results);
  const rigDir = getRigDir(name, home);
  await mkdir(join(rigDir, "providers"), { recursive: true });
  await mkdir(join(rigDir, "skills"), { recursive: true });
  await mkdir(join(rigDir, "agents"), { recursive: true });

  const manifest: RigManifest = {
    name,
    description: "",
    providers: merged.providers,
    mcp_servers: merged.mcpServers,
    permissions: { auto_execute: merged.autoExecute },
  };

  await writeFile(join(rigDir, "rig.yaml"), stringifyYaml(manifest), "utf8");

  const docNames: string[] = [];
  for (const [provider, content] of Object.entries(merged.providerDocs)) {
    await writeFile(join(rigDir, "providers", `${provider}.md`), content, "utf8");
    docNames.push(provider);
  }

  await writeFile(
    join(rigDir, "instructions.md"),
    "# Instructions\n\nAdd your global instructions here.\n",
    "utf8",
  );

  return { mcpCount: merged.mcpServers.length, providerDocs: docNames };
}

export function registerInitCommand(program: Command): void {
  program
    .command("init")
    .description("Initialize rig hub and create your first rig")
    .option("--from <providers>", "Import from providers (comma-separated, or 'auto')")
    .option("--template <name>", "Create from a template")
    .option("--empty", "Create an empty rig")
    .option("--name <name>", "Name for the new rig")
    .option("--yes", "Skip confirmations")
    .action(async (opts: {
      from?: string;
      template?: string;
      empty?: boolean;
      name?: string;
      yes?: boolean;
    }) => {
      await ensureHub();

      if (opts.from) {
        // Non-interactive import
        const name = opts.name ?? "main";
        let providerNames: string[];

        if (opts.from === "auto") {
          const detected = await detectInstalledProviders();
          providerNames = detected.filter((d) => d.found).map((d) => d.name);
        } else {
          providerNames = opts.from.split(",").map((s) => s.trim());
        }

        const { mcpCount, providerDocs } = await createFromImport(providerNames, name);
        await installRigManagerSkill();

        process.stdout.write(`  ${chalk.green("✓")} Imported ${mcpCount} MCPs\n`);
        for (const doc of providerDocs) {
          process.stdout.write(`  ${chalk.green("✓")} Imported ${doc} instructions → providers/${doc}.md\n`);
        }
        process.stdout.write(`  ${chalk.green("✓")} Created rig.yaml\n`);
        process.stdout.write(`  ${chalk.green("✓")} Installed rig-manager skill\n`);
        process.stdout.write(`\n  Rig '${name}' created. Run ${chalk.cyan(`rig use ${name}`)} to activate.\n`);
        return;
      }

      if (opts.template) {
        const name = opts.name ?? opts.template;
        const rigDir = getRigDir(name);
        await mkdir(rigDir, { recursive: true });
        await copyTemplate(opts.template, rigDir, name);
        await installRigManagerSkill();

        process.stdout.write(`  ${chalk.green("✓")} Created rig from template '${opts.template}'\n`);
        process.stdout.write(`  ${chalk.green("✓")} Installed rig-manager skill\n`);
        process.stdout.write(`\n  Rig '${name}' created. Run ${chalk.cyan(`rig use ${name}`)} to activate.\n`);
        return;
      }

      if (opts.empty || opts.name) {
        const name = opts.name ?? "default";
        await createEmptyRig(name);
        await installRigManagerSkill();

        process.stdout.write(`  ${chalk.green("✓")} Created empty rig '${name}'\n`);
        process.stdout.write(`  ${chalk.green("✓")} Installed rig-manager skill\n`);
        process.stdout.write(`\n  Rig '${name}' created. Run ${chalk.cyan(`rig use ${name}`)} to activate.\n`);
        return;
      }

      // Interactive mode
      const clack = await import("@clack/prompts");

      clack.intro("rig init");

      const detected = await detectInstalledProviders();
      const foundProviders = detected.filter((d) => d.found);

      process.stdout.write("\n  Scanning for AI tools...\n\n");
      for (const d of detected) {
        const icon = d.found ? chalk.green("✓") : "○";
        const status = d.found ? "detected" : "not installed";
        process.stdout.write(`    ${icon} ${d.name.padEnd(14)} — ${status}\n`);
      }
      process.stdout.write("\n");

      const mode = await clack.select({
        message: "How do you want to start?",
        options: [
          ...(foundProviders.length > 0
            ? [{ value: "import" as const, label: `Import from my current tools (detected: ${foundProviders.map((p) => p.name).join(", ")})` }]
            : []),
          { value: "template" as const, label: "Start from a template" },
          { value: "empty" as const, label: "Empty rig (I'll configure it myself)" },
        ],
      });

      if (clack.isCancel(mode)) {
        clack.cancel("Cancelled.");
        process.exit(0);
      }

      if (mode === "import") {
        const name = await clack.text({
          message: "Name for your new rig:",
          placeholder: "main",
          defaultValue: "main",
          validate: (v) => (v.length === 0 ? "Name is required" : undefined),
        });
        if (clack.isCancel(name)) {
          clack.cancel("Cancelled.");
          process.exit(0);
        }

        const providerNames = foundProviders.map((p) => p.name);
        const { mcpCount, providerDocs } = await createFromImport(providerNames, name);
        await installRigManagerSkill();

        process.stdout.write(`\n  ${chalk.green("✓")} Imported ${mcpCount} MCPs\n`);
        for (const doc of providerDocs) {
          process.stdout.write(`  ${chalk.green("✓")} Imported ${doc} instructions → providers/${doc}.md\n`);
        }
        process.stdout.write(`  ${chalk.green("✓")} Created rig.yaml\n`);
        process.stdout.write(`  ${chalk.green("✓")} Installed rig-manager skill\n`);

        clack.outro(`Rig '${name}' created. Run ${chalk.cyan(`rig use ${name}`)} to activate.`);
        return;
      }

      if (mode === "template") {
        const templates = await listTemplates();
        const templateName = await clack.select({
          message: "Choose a template:",
          options: templates.map((t) => ({
            value: t.name,
            label: `${t.name.padEnd(14)} ${t.description}`,
          })),
        });
        if (clack.isCancel(templateName)) {
          clack.cancel("Cancelled.");
          process.exit(0);
        }

        const name = await clack.text({
          message: "Name for your new rig:",
          placeholder: templateName,
          defaultValue: templateName,
          validate: (v) => (v.length === 0 ? "Name is required" : undefined),
        });
        if (clack.isCancel(name)) {
          clack.cancel("Cancelled.");
          process.exit(0);
        }

        const rigDir = getRigDir(name);
        await mkdir(rigDir, { recursive: true });
        await copyTemplate(templateName, rigDir, name);
        await installRigManagerSkill();

        process.stdout.write(`\n  ${chalk.green("✓")} Created rig from template '${templateName}'\n`);
        process.stdout.write(`  ${chalk.green("✓")} Installed rig-manager skill\n`);

        clack.outro(`Rig '${name}' created. Run ${chalk.cyan(`rig use ${name}`)} to activate.`);
        return;
      }

      // Empty rig
      const name = await clack.text({
        message: "Name for your new rig:",
        placeholder: "default",
        defaultValue: "default",
        validate: (v) => (v.length === 0 ? "Name is required" : undefined),
      });
      if (clack.isCancel(name)) {
        clack.cancel("Cancelled.");
        process.exit(0);
      }

      await createEmptyRig(name);
      await installRigManagerSkill();

      process.stdout.write(`\n  ${chalk.green("✓")} Created empty rig '${name}'\n`);
      process.stdout.write(`  ${chalk.green("✓")} Installed rig-manager skill\n`);

      clack.outro(`Rig '${name}' created. Run ${chalk.cyan(`rig use ${name}`)} to activate.`);
    });
}
