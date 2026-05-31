import { input } from '@inquirer/prompts';
import { validateProjectName } from '../validators.js';
/**
 * Prompts the user to enter a project name with inline validation.
 * Re-prompts on invalid input with descriptive error messages.
 *
 * @returns The validated project name
 */
export async function promptProjectName() {
    const projectName = await input({
        message: 'What is your project name?',
        validate: (value) => validateProjectName(value),
    });
    return projectName;
}
//# sourceMappingURL=projectName.js.map