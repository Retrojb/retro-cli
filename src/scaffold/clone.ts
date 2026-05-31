import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import { simpleGit } from 'simple-git';
import ora from 'ora';
import {
  ScaffoldConfig,
  DirectoryConflictError,
  TimeoutError,
  ScaffoldError,
} from '../types.js';

export async function cloneTemplate(config: ScaffoldConfig): Promise<void> {
  if (existsSync(config.targetDir)) {
    throw new DirectoryConflictError(config.projectName);
  }

  const spinner = ora('Cloning template...').start();

  const git = simpleGit({ timeout: { block: 30000 } });

  try {
    await git.clone(config.template.repoUrl, config.targetDir, [
      '--depth',
      '1',
    ]);
    spinner.succeed('Template cloned successfully');
  } catch (error: unknown) {
    spinner.fail('Failed to clone template');

    // Clean up partial directory if it was created
    if (existsSync(config.targetDir)) {
      await fs.rm(config.targetDir, { recursive: true, force: true });
    }

    if (
      error instanceof Error &&
      error.message.includes('timed out')
    ) {
      throw new TimeoutError(30000);
    }

    throw new ScaffoldError(
      `Failed to clone template: ${error instanceof Error ? error.message : String(error)}`,
      error instanceof Error ? error : undefined,
    );
  }
}
