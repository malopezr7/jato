import type { Command } from "commander";
import chalk from "chalk";
import { getActiveRig, writeGlobalConfig } from "../../core/hub.js";

export function registerOffCommand(program: Command): void {
  program
    .command("off")
    .description("Deactivate the current rig")
    .action(async () => {
      const active = await getActiveRig();

      if (!active) {
        process.stdout.write("  No rig is currently active.\n");
        return;
      }

      await writeGlobalConfig({});
      process.stdout.write(`  ${chalk.green("✓")} Deactivated rig '${active}'\n`);
    });
}
