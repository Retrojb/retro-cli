import { select } from '@inquirer/prompts';
import { Template } from '../types.js';

export type ScaffoldMethod = 'repo' | 'cli';

/**
 * Determines whether a scaffolding method prompt is needed.
 * Returns true only when the template defines a non-empty cliCommand.
 */
export function shouldPromptScaffoldMethod(template: Template): boolean {
  return typeof template.cliCommand === 'string' && template.cliCommand.length > 0;
}

/**
 * Presents an @inquirer/select prompt asking the user to choose between
 * cloning the template repo or running the framework CLI.
 * Only called when shouldPromptScaffoldMethod returns true.
 */
export async function promptScaffoldMethod(template: Template): Promise<ScaffoldMethod> {
  const choices: Array<{ name: string; value: ScaffoldMethod; description?: string }> = [
    { name: 'Use template repository', value: 'repo' },
    {
      name: 'Use framework CLI',
      value: 'cli',
      ...(template.cliDescription ? { description: template.cliDescription } : {}),
    },
  ];

  const method = await select({
    message: 'How would you like to scaffold this project?',
    choices,
  });

  return method;
}
