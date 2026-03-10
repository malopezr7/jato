import type { Provider } from "./types.js";
import { claudeProvider } from "./claude.js";
import { codexProvider } from "./codex.js";
import { geminiProvider } from "./gemini.js";
import { opencodeProvider } from "./opencode.js";

const providers: Record<string, Provider> = {
  claude: claudeProvider,
  codex: codexProvider,
  gemini: geminiProvider,
  opencode: opencodeProvider,
};

export function getProvider(name: string): Provider | undefined {
  return providers[name];
}

export function getAllProviders(): Provider[] {
  return Object.values(providers);
}

export function getProviderNames(): string[] {
  return Object.keys(providers);
}
