#!/usr/bin/env node

import { Command } from "commander";
import { registerInitCommand } from "./commands/init.js";
import { registerUseCommand } from "./commands/use.js";
import { registerListCommand } from "./commands/list.js";
import { registerOffCommand } from "./commands/off.js";
import { registerDoctorCommand } from "./commands/doctor.js";
import { registerInstallCommand } from "./commands/install.js";

export type CliResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
};

export function createProgram(): Command {
  const program = new Command();

  program
    .name("jato")
    .description("Centralized configuration manager for AI coding tools")
    .version("0.1.0");

  registerInitCommand(program);
  registerUseCommand(program);
  registerListCommand(program);
  registerOffCommand(program);
  registerDoctorCommand(program);
  registerInstallCommand(program);

  return program;
}

async function main(): Promise<void> {
  const program = createProgram();
  await program.parseAsync(process.argv);
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`Error: ${message}\n`);
  process.exit(1);
});
