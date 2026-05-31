import { checkbox } from '@inquirer/prompts';
export async function promptAdditionalOptions(options) {
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
//# sourceMappingURL=options.js.map