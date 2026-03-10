import type { Command } from "commander";
import chalk from "chalk";
import { getActiveJato, writeGlobalConfig } from "../../core/hub.js";

export function registerOffCommand(program: Command): void {
  program
    .command("off")
    .description("Deactivate the current jato")
    .action(async () => {
      const active = await getActiveJato();

      if (!active) {
        process.stdout.write("  No jato is currently active.\n");
        return;
      }

      await writeGlobalConfig({});
      process.stdout.write(`  ${chalk.green("✓")} Deactivated jato '${active}'\n`);
    });
}
