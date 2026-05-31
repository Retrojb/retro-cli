import { spawn } from 'node:child_process';
import path from 'node:path';
import { InteractiveCliError, InteractiveCliSpawnError, } from '../types.js';
export function buildCommand(cliCommand, projectName) {
    return `${cliCommand} ${projectName}`;
}
export function runInteractiveCli(config) {
    return new Promise((resolve, reject) => {
        if (!config.template.cliCommand) {
            return resolve({ executed: false });
        }
        const command = buildCommand(config.template.cliCommand, config.projectName);
        const cwd = path.dirname(config.targetDir);
        if (config.template.cliDescription) {
            console.log(`\nRunning: ${config.template.cliCommand}\n${config.template.cliDescription}\n`);
        }
        else {
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
            }
            else {
                reject(new InteractiveCliError(command, exitCode));
            }
        });
        child.on('error', (error) => {
            reject(new InteractiveCliSpawnError(command, error));
        });
    });
}
//# sourceMappingURL=interactive.js.map