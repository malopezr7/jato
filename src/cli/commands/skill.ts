import type { Command } from "commander";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import chalk from "chalk";
import { getSkillsDir } from "../../core/hub.js";
import { detectInstalledProviders } from "../../providers/detector.js";
import { getProvider } from "../../providers/registry.js";

async function readManagerSkill(home?: string): Promise<string> {
  const hubPath = join(getSkillsDir(home), "jato-manager.md");
  try {
    return await readFile(hubPath, "utf8");
  } catch {
    // Fallback: read from dist/src
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const distPath = join(__dirname, "..", "..", "skills", "jato-manager.md");
    try {
      return await readFile(distPath, "utf8");
    } catch {
      const srcPath = join(
        __dirname,
        "..",
        "..",
        "..",
        "src",
        "skills",
        "jato-manager.md",
      );
      return await readFile(srcPath, "utf8");
    }
  }
}

export function registerSkillCommand(program: Command): void {
  const skill = program
    .command("skill")
    .description("Manage jato skills");

  skill
    .command("install")
    .description(
      "Install the jato-manager skill directly into provider skills directories",
    )
    .option(
      "--provider <names...>",
      "Providers to install to (e.g. claude, codex, gemini). Defaults to all detected.",
    )
    .action(async (opts: { provider?: string[] }) => {
      const content = await readManagerSkill();

      let targetProviders: string[];

      if (opts.provider) {
        targetProviders = opts.provider;
      } else {
        const detected = await detectInstalledProviders();
        targetProviders = detected
          .filter((d) => d.found)
          .map((d) => d.name);
      }

      if (targetProviders.length === 0) {
        process.stderr.write(
          `  ${chalk.red("✗")} No AI providers detected. Use --provider to specify one.\n`,
        );
        process.exitCode = 1;
        return;
      }

      let installed = 0;

      for (const name of targetProviders) {
        const provider = getProvider(name);
        if (!provider) {
          process.stderr.write(
            `  ${chalk.yellow("!")} Unknown provider: ${name}\n`,
          );
          continue;
        }

        const skillDir = join(provider.skillsDir(), "jato-manager");
        await mkdir(skillDir, { recursive: true });
        await writeFile(join(skillDir, "SKILL.md"), content, "utf8");
        process.stdout.write(
          `  ${chalk.green("✓")} Installed jato-manager skill → ${name} (${skillDir})\n`,
        );
        installed++;
      }

      if (installed > 0) {
        process.stdout.write(
          `\n  ${chalk.dim("Your AI tools can now help you manage jatos. Try asking:")} ${chalk.cyan('"Create a jato for my React project"')}\n`,
        );
      }
    });
}
