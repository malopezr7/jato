import type { ResolvedRig } from "../core/rig.js";

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
  materialize(rig: ResolvedRig, home?: string): MaterializeResult;
}
