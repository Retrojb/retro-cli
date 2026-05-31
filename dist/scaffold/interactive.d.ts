import { ScaffoldConfig } from '../types.js';
export interface InteractiveCliResult {
    executed: boolean;
    command?: string;
    exitCode?: number;
}
export declare function buildCommand(cliCommand: string, projectName: string): string;
export declare function runInteractiveCli(config: ScaffoldConfig): Promise<InteractiveCliResult>;
