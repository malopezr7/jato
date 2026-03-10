import type { ResolvedJato } from "../core/jato.js";

export interface FileOutput {
  path: string;
  content: string;
}

export interface MaterializeResult {
  files: FileOutput[];
}

export interface Provider {
  name: string;
  configPath(home?: string): string;
  skillsDir(home?: string): string;
  instructionsFileName: string;
  materialize(rig: ResolvedJato, home?: string): MaterializeResult;
}
