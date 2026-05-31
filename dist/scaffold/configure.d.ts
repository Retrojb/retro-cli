import { ScaffoldConfig } from '../types.js';
/**
 * Configures the scaffolded project by updating package.json,
 * adding optional tooling configs, and removing the .git directory.
 */
export declare function configureProject(config: ScaffoldConfig): Promise<void>;
