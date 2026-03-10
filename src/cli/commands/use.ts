import type { Command } from "commander";
import chalk from "chalk";
import { getActiveRig } from "../../core/hub.js";
import { materialize } from "../../core/materializer.js";

export function registerUseCommand(program: Command): void {
  program
    .command("use [rig-name]")
    .description("Activate a rig (or show active rig if no name given)")
    .option("--target-root <path>", "Target directory for provider instruction files")
    .action(async (rigName: string | undefined, opts: { targetRoot?: string }) => {
      if (!rigName) {
        const active = await getActiveRig();
        if (active) {
          process.stdout.write(`  Active rig: ${chalk.cyan(active)}\n`);
        } else {
          process.stdout.write("  No rig is currently active.\n");
        }
        return;
      }

      const result = await materialize(rigName, {
        targetRoot: opts.targetRoot,
      });

      process.stdout.write(`\n  ${chalk.green("✓")} Active rig: ${chalk.cyan(result.rigName)}\n\n`);
      process.stdout.write("  Files written:\n");
      for (const file of result.filesWritten) {
        process.stdout.write(`    ${chalk.dim("→")} ${file.filePath}\n`);
      }
      process.stdout.write("\n");
    });
}
