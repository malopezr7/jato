import type { Command } from "commander";
import { existsSync } from "node:fs";
import { join } from "node:path";
import chalk from "chalk";
import { getHubDir, getActiveRig, getRigDir, getSkillsDir } from "../../core/hub.js";
import { loadRig } from "../../core/rig.js";
import { getProvider } from "../../providers/registry.js";
import { detectInstalledProviders } from "../../providers/detector.js";

interface CheckResult {
  label: string;
  ok: boolean;
  detail?: string;
}

export function registerDoctorCommand(program: Command): void {
  program
    .command("doctor")
    .description("Check health of rig setup")
    .action(async () => {
      const checks: CheckResult[] = [];

      // Check 1: Hub exists
      const hubExists = existsSync(getHubDir());
      checks.push({
        label: "Hub directory (~/.rig/) exists",
        ok: hubExists,
      });

      if (!hubExists) {
        printChecks(checks);
        return;
      }

      // Check 2: Active rig
      const activeRigName = await getActiveRig();
      checks.push({
        label: "Active rig is set",
        ok: !!activeRigName,
        detail: activeRigName ? `active_rig: ${activeRigName}` : "No active rig",
      });

      if (!activeRigName) {
        printChecks(checks);
        return;
      }

      // Check 3: Rig is valid
      let rigValid = false;
      try {
        const rig = await loadRig(activeRigName);
        rigValid = true;
        checks.push({
          label: `Rig '${activeRigName}' has valid rig.yaml`,
          ok: true,
        });

        // Check 4: Enabled providers are installed
        const detected = await detectInstalledProviders();
        const enabledProviders = Object.entries(rig.manifest.providers)
          .filter(([, enabled]) => enabled)
          .map(([name]) => name);

        for (const providerName of enabledProviders) {
          const provider = getProvider(providerName);
          if (!provider) {
            checks.push({
              label: `Provider '${providerName}' is registered`,
              ok: false,
              detail: "Unknown provider",
            });
            continue;
          }

          const isInstalled = detected.find((d) => d.name === providerName)?.found ?? false;
          checks.push({
            label: `Provider '${providerName}' is installed`,
            ok: isInstalled,
            detail: isInstalled ? provider.configPath() : "Config not found",
          });
        }

        // Check 5: Env vars for MCPs
        for (const server of rig.manifest.mcp_servers) {
          for (const envKey of server.env) {
            const defined = process.env[envKey] !== undefined;
            checks.push({
              label: `MCP '${server.id}' env var ${envKey}`,
              ok: defined,
              detail: defined ? "defined" : "not set",
            });
          }
        }

        // Check 6: Materialized files exist
        for (const providerName of enabledProviders) {
          const provider = getProvider(providerName);
          if (!provider) continue;

          const configExists = existsSync(provider.configPath());
          checks.push({
            label: `Materialized config for ${providerName}`,
            ok: configExists,
            detail: provider.configPath(),
          });

          const contextSkillPath = join(provider.skillsDir(), "rig-context", "SKILL.md");
          checks.push({
            label: `Rig context skill for ${providerName}`,
            ok: existsSync(contextSkillPath),
          });

          const managerSkillPath = join(provider.skillsDir(), "rig-manager", "SKILL.md");
          checks.push({
            label: `Rig manager skill for ${providerName}`,
            ok: existsSync(managerSkillPath),
          });
        }

        // Check 7: Meta-skill installed
        const metaSkillPath = join(getSkillsDir(), "rig-manager.md");
        checks.push({
          label: "Meta-skill rig-manager.md installed in hub",
          ok: existsSync(metaSkillPath),
        });
      } catch (err: unknown) {
        checks.push({
          label: `Rig '${activeRigName}' has valid rig.yaml`,
          ok: false,
          detail: err instanceof Error ? err.message : "Invalid manifest",
        });
      }

      printChecks(checks);
    });
}

function printChecks(checks: CheckResult[]): void {
  process.stdout.write("\n  rig doctor\n\n");

  for (const check of checks) {
    const icon = check.ok ? chalk.green("✓") : chalk.red("✗");
    const detail = check.detail ? chalk.dim(` (${check.detail})`) : "";
    process.stdout.write(`    ${icon} ${check.label}${detail}\n`);
  }

  const passed = checks.filter((c) => c.ok).length;
  const total = checks.length;
  process.stdout.write(`\n  ${passed}/${total} checks passed\n\n`);
}
