import fs from 'node:fs/promises';
import path from 'node:path';
import { ScaffoldConfig, ScaffoldError } from '../types.js';
import { isValidNpmPackageName } from '../validators.js';

/**
 * Configures the scaffolded project by updating package.json,
 * adding optional tooling configs, and removing the .git directory.
 */
export async function configureProject(config: ScaffoldConfig): Promise<void> {
  // 1. Validate project name
  if (!isValidNpmPackageName(config.projectName)) {
    throw new ScaffoldError(
      `Invalid npm package name: "${config.projectName}"`
    );
  }

  // 2. Read package.json from the cloned template
  const packageJsonPath = path.join(config.targetDir, 'package.json');
  let packageJsonContent: string;

  try {
    packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
  } catch {
    throw new ScaffoldError('Template is missing a valid package.json file');
  }

  // 3. Parse and update the name field
  const packageJson = JSON.parse(packageJsonContent);
  packageJson.name = config.projectName;

  // 4. If Jest selected: add jest config and devDependency
  if (config.additionalOptions.includes('jest')) {
    if (!packageJson.devDependencies) {
      packageJson.devDependencies = {};
    }
    packageJson.devDependencies.jest = '^29.0.0';

    const jestConfigPath = path.join(config.targetDir, 'jest.config.js');
    await fs.writeFile(
      jestConfigPath,
      "export default { testEnvironment: 'node' };\n",
      'utf-8'
    );
  }

  // 5. If ESLint selected: add eslint config and devDependency
  if (config.additionalOptions.includes('eslint')) {
    if (!packageJson.devDependencies) {
      packageJson.devDependencies = {};
    }
    packageJson.devDependencies.eslint = '^9.0.0';

    const eslintConfigPath = path.join(config.targetDir, 'eslint.config.js');
    await fs.writeFile(
      eslintConfigPath,
      'export default [{ rules: {} }];\n',
      'utf-8'
    );
  }

  // 6. Write updated package.json back with 2-space indentation
  await fs.writeFile(
    packageJsonPath,
    JSON.stringify(packageJson, null, 2) + '\n',
    'utf-8'
  );

  // 7. Remove .git directory
  await fs.rm(path.join(config.targetDir, '.git'), {
    recursive: true,
    force: true,
  });
}
