import { spawn } from 'node:child_process';
import path from 'node:path';
import {
  ScaffoldConfig,
  InteractiveCliError,
  InteractiveCliSpawnError,
} from '../types.js';

export interface InteractiveCliResult {
  executed: boolean;
  command?: string;
  exitCode?: number;
}

export function buildCommand(cliCommand: string, projectName: string): string {
  return `${cliCommand} ${projectName}`;
}

export function runInteractiveCli(
  config: ScaffoldConfig,
): Promise<InteractiveCliResult> {
  return new Promise((resolve, reject) => {
    if (!config.template.cliCommand) {
      return resolve({ executed: false });
    }

    const command = buildCommand(config.template.cliCommand, config.projectName);
    const cwd = path.dirname(config.targetDir);

    if (config.template.cliDescription) {
      console.log(
        `\nRunning: ${config.template.cliCommand}\n${config.template.cliDescription}\n`,
      );
    } else {
      console.log(`\nRunning: ${config.template.cliCommand}\n`);
    }

    const child = spawn(command, {
      shell: true,
      stdio: 'inherit',
      cwd,
    });

    child.on('close', (exitCode) => {
      if (exitCode === 0) {
        resolve({ executed: true, command, exitCode: 0 });
      } else {
        reject(new InteractiveCliError(command, exitCode));
      }
    });

    child.on('error', (error: NodeJS.ErrnoException) => {
      reject(new InteractiveCliSpawnError(command, error));
    });
  });
}
