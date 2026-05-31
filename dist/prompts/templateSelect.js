import { select } from '@inquirer/prompts';
export async function promptTemplateSelection(templates) {
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
//# sourceMappingURL=templateSelect.js.map