import type { Command } from "commander";
import { mkdtemp, rm, cp, readdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import chalk from "chalk";
import { ensureHub, getJatosDir, getJatoDir } from "../../core/hub.js";

export function registerInstallCommand(program: Command): void {
  program
    .command("install <repo-url>")
    .description("Install jatos from a git repository")
    .option("--jato <name>", "Install only a specific jato from the repo")
    .action(async (repoUrl: string, opts: { jato?: string }) => {
      await ensureHub();

      const tmpDir = await mkdtemp(join(tmpdir(), "jato-install-"));

      try {
        // Normalize URL
        let gitUrl = repoUrl;
        if (!gitUrl.startsWith("http") && !gitUrl.startsWith("git@")) {
          gitUrl = `https://${gitUrl}`;
        }
        if (!gitUrl.endsWith(".git")) {
          gitUrl = `${gitUrl}.git`;
        }

        process.stdout.write(`  Cloning ${gitUrl}...\n`);
        execSync(`git clone --depth 1 ${gitUrl} ${tmpDir}/repo`, {
          stdio: "pipe",
        });

        const repoDir = join(tmpDir, "repo");

        // Find jatos in the repo
        // Look for directories with jato.yaml
        const jatosDir = existsSync(join(repoDir, "jatos"))
          ? join(repoDir, "jatos")
          : repoDir;

        const entries = await readdir(jatosDir, { withFileTypes: true });
        const jatoDirs = entries.filter(
          (e) => e.isDirectory() && existsSync(join(jatosDir, e.name, "jato.yaml")),
        );

        if (jatoDirs.length === 0) {
          // Check if the repo root itself is a jato
          if (existsSync(join(repoDir, "jato.yaml"))) {
            const name = opts.jato ?? "imported";
            const destDir = getJatoDir(name);
            await cp(repoDir, destDir, {
              recursive: true,
              filter: (src) => !src.includes(".git"),
            });
            process.stdout.write(`  ${chalk.green("✓")} Installed jato '${name}'\n`);
            return;
          }
          process.stderr.write("  No jatos found in repository.\n");
          process.exit(1);
        }

        if (opts.jato) {
          const match = jatoDirs.find((d) => d.name === opts.jato);
          if (!match) {
            process.stderr.write(`  Jato '${opts.jato}' not found in repository.\n`);
            process.stderr.write(`  Available: ${jatoDirs.map((d) => d.name).join(", ")}\n`);
            process.exit(1);
          }

          const destDir = getJatoDir(opts.jato);
          await cp(join(jatosDir, opts.jato), destDir, { recursive: true });
          process.stdout.write(`  ${chalk.green("✓")} Installed jato '${opts.jato}'\n`);
        } else {
          for (const jatoDir of jatoDirs) {
            const destDir = getJatoDir(jatoDir.name);
            await cp(join(jatosDir, jatoDir.name), destDir, { recursive: true });
            process.stdout.write(`  ${chalk.green("✓")} Installed jato '${jatoDir.name}'\n`);
          }
        }
      } finally {
        await rm(tmpDir, { recursive: true, force: true });
      }
    });
}
