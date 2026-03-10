import type { Command } from "commander";
import chalk from "chalk";
import { getActiveJato } from "../../core/hub.js";
import { materialize } from "../../core/materializer.js";

export function registerUseCommand(program: Command): void {
  program
    .command("use [jato-name]")
    .description("Activate a jato (or show active jato if no name given)")
    .option("--target-root <path>", "Target directory for provider instruction files")
    .action(async (jatoName: string | undefined, opts: { targetRoot?: string }) => {
      if (!jatoName) {
        const active = await getActiveJato();
        if (active) {
          process.stdout.write(`  Active jato: ${chalk.cyan(active)}\n`);
        } else {
          process.stdout.write("  No jato is currently active.\n");
        }
        return;
      }

      const result = await materialize(jatoName, {
        targetRoot: opts.targetRoot,
      });

      process.stdout.write(`\n  ${chalk.green("✓")} Active jato: ${chalk.cyan(result.jatoName)}\n\n`);
      process.stdout.write("  Files written:\n");
      for (const file of result.filesWritten) {
        process.stdout.write(`    ${chalk.dim("→")} ${file.filePath}\n`);
      }
      process.stdout.write("\n");
    });
}
