import type { Command } from "commander";
import { mkdtemp, rm, cp, readdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import chalk from "chalk";
import { ensureHub, getRigsDir, getRigDir } from "../../core/hub.js";

export function registerInstallCommand(program: Command): void {
  program
    .command("install <repo-url>")
    .description("Install rigs from a git repository")
    .option("--rig <name>", "Install only a specific rig from the repo")
    .action(async (repoUrl: string, opts: { rig?: string }) => {
      await ensureHub();

      const tmpDir = await mkdtemp(join(tmpdir(), "rig-install-"));

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

        // Find rigs in the repo
        // Look for directories with rig.yaml
        const rigsDir = existsSync(join(repoDir, "rigs"))
          ? join(repoDir, "rigs")
          : repoDir;

        const entries = await readdir(rigsDir, { withFileTypes: true });
        const rigDirs = entries.filter(
          (e) => e.isDirectory() && existsSync(join(rigsDir, e.name, "rig.yaml")),
        );

        if (rigDirs.length === 0) {
          // Check if the repo root itself is a rig
          if (existsSync(join(repoDir, "rig.yaml"))) {
            const name = opts.rig ?? "imported";
            const destDir = getRigDir(name);
            await cp(repoDir, destDir, {
              recursive: true,
              filter: (src) => !src.includes(".git"),
            });
            process.stdout.write(`  ${chalk.green("✓")} Installed rig '${name}'\n`);
            return;
          }
          process.stderr.write("  No rigs found in repository.\n");
          process.exit(1);
        }

        if (opts.rig) {
          const match = rigDirs.find((d) => d.name === opts.rig);
          if (!match) {
            process.stderr.write(`  Rig '${opts.rig}' not found in repository.\n`);
            process.stderr.write(`  Available: ${rigDirs.map((d) => d.name).join(", ")}\n`);
            process.exit(1);
          }

          const destDir = getRigDir(opts.rig);
          await cp(join(rigsDir, opts.rig), destDir, { recursive: true });
          process.stdout.write(`  ${chalk.green("✓")} Installed rig '${opts.rig}'\n`);
        } else {
          for (const rigDir of rigDirs) {
            const destDir = getRigDir(rigDir.name);
            await cp(join(rigsDir, rigDir.name), destDir, { recursive: true });
            process.stdout.write(`  ${chalk.green("✓")} Installed rig '${rigDir.name}'\n`);
          }
        }
      } finally {
        await rm(tmpDir, { recursive: true, force: true });
      }
    });
}
