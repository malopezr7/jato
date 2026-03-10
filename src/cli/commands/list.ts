import type { Command } from "commander";
import chalk from "chalk";
import { listJatos, getActiveJato } from "../../core/hub.js";
import { loadJato } from "../../core/jato.js";

export function registerListCommand(program: Command): void {
  program
    .command("list")
    .description("List all available jatos")
    .action(async () => {
      const jatos = await listJatos();
      const active = await getActiveJato();

      if (jatos.length === 0) {
        process.stdout.write("  No jatos found. Run `jato init` to create one.\n");
        return;
      }

      process.stdout.write("\n");
      for (const name of jatos) {
        let description = "";
        try {
          const jato = await loadJato(name);
          description = jato.manifest.description ?? "";
        } catch {
          // Skip invalid jatos
        }

        const isActive = name === active;
        const marker = isActive ? chalk.green(" [active]") : "";
        const displayName = isActive ? chalk.cyan(name) : name;
        const desc = description ? `  ${chalk.dim(description)}` : "";

        process.stdout.write(`  ${displayName.padEnd(isActive ? name.length + 15 : 15)}${desc}${marker}\n`);
      }
      process.stdout.write("\n");
    });
}
