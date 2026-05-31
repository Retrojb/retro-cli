import { select } from '@inquirer/prompts';
import { Template } from '../types.js';

export async function promptTemplateSelection(templates: Template[]): Promise<Template> {
  const selected = await select({
    message: 'Select a project template',
    choices: templates.map((template) => ({
      name: template.displayName,
      description: template.description,
      value: template,
    })),
  });

  return selected;
}
