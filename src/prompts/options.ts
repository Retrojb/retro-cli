import { checkbox } from '@inquirer/prompts';
import { AdditionalOption } from '../types.js';

export async function promptAdditionalOptions(options: AdditionalOption[]): Promise<string[]> {
  const selected = await checkbox({
    message: 'Select additional options (optional)',
    choices: options.map((option) => ({
      name: option.displayName,
      value: option.name,
      description: option.description,
    })),
  });

  return selected;
}
