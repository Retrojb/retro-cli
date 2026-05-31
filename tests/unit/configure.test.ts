import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { configureProject } from '../../src/scaffold/configure.js';
import { ScaffoldConfig, ScaffoldError } from '../../src/types.js';

describe('configureProject', () => {
  let tempDir: string;

  const makeConfig = (overrides: Partial<ScaffoldConfig> = {}): ScaffoldConfig => ({
    projectName: 'my-new-project',
    template: {
      name: 'expo',
      displayName: 'Expo',
      description: 'test',
      repoUrl: 'https://example.com',
    },
    additionalOptions: [],
    targetDir: tempDir,
    ...overrides,
  });

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'configure-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('updates package.json name while preserving other fields', async () => {
    const originalPkg = {
      name: 'template-name',
      version: '1.0.0',
      description: 'A template project',
      dependencies: { lodash: '^4.0.0' },
    };
    await fs.writeFile(
      path.join(tempDir, 'package.json'),
      JSON.stringify(originalPkg, null, 2),
    );

    await configureProject(makeConfig());

    const updatedPkg = JSON.parse(
      await fs.readFile(path.join(tempDir, 'package.json'), 'utf-8'),
    );
    expect(updatedPkg.name).toBe('my-new-project');
    expect(updatedPkg.version).toBe('1.0.0');
    expect(updatedPkg.description).toBe('A template project');
    expect(updatedPkg.dependencies).toEqual({ lodash: '^4.0.0' });
  });

  it('creates jest.config.js and adds jest devDependency', async () => {
    await fs.writeFile(
      path.join(tempDir, 'package.json'),
      JSON.stringify({ name: 'template', version: '1.0.0' }),
    );

    await configureProject(makeConfig({ additionalOptions: ['jest'] }));

    const jestConfigExists = await fs
      .access(path.join(tempDir, 'jest.config.js'))
      .then(() => true)
      .catch(() => false);
    expect(jestConfigExists).toBe(true);

    const pkg = JSON.parse(
      await fs.readFile(path.join(tempDir, 'package.json'), 'utf-8'),
    );
    expect(pkg.devDependencies.jest).toBeDefined();
  });

  it('creates eslint.config.js and adds eslint devDependency', async () => {
    await fs.writeFile(
      path.join(tempDir, 'package.json'),
      JSON.stringify({ name: 'template', version: '1.0.0' }),
    );

    await configureProject(makeConfig({ additionalOptions: ['eslint'] }));

    const eslintConfigExists = await fs
      .access(path.join(tempDir, 'eslint.config.js'))
      .then(() => true)
      .catch(() => false);
    expect(eslintConfigExists).toBe(true);

    const pkg = JSON.parse(
      await fs.readFile(path.join(tempDir, 'package.json'), 'utf-8'),
    );
    expect(pkg.devDependencies.eslint).toBeDefined();
  });

  it('creates both jest and eslint configs when both options selected', async () => {
    await fs.writeFile(
      path.join(tempDir, 'package.json'),
      JSON.stringify({ name: 'template', version: '1.0.0' }),
    );

    await configureProject(makeConfig({ additionalOptions: ['jest', 'eslint'] }));

    const jestConfigExists = await fs
      .access(path.join(tempDir, 'jest.config.js'))
      .then(() => true)
      .catch(() => false);
    const eslintConfigExists = await fs
      .access(path.join(tempDir, 'eslint.config.js'))
      .then(() => true)
      .catch(() => false);
    expect(jestConfigExists).toBe(true);
    expect(eslintConfigExists).toBe(true);

    const pkg = JSON.parse(
      await fs.readFile(path.join(tempDir, 'package.json'), 'utf-8'),
    );
    expect(pkg.devDependencies.jest).toBeDefined();
    expect(pkg.devDependencies.eslint).toBeDefined();
  });

  it('removes .git directory from the project', async () => {
    await fs.writeFile(
      path.join(tempDir, 'package.json'),
      JSON.stringify({ name: 'template', version: '1.0.0' }),
    );
    await fs.mkdir(path.join(tempDir, '.git'));
    await fs.writeFile(path.join(tempDir, '.git', 'HEAD'), 'ref: refs/heads/main');

    await configureProject(makeConfig());

    const gitDirExists = await fs
      .access(path.join(tempDir, '.git'))
      .then(() => true)
      .catch(() => false);
    expect(gitDirExists).toBe(false);
  });

  it('throws ScaffoldError when package.json is missing', async () => {
    await expect(configureProject(makeConfig())).rejects.toThrow(ScaffoldError);
    await expect(configureProject(makeConfig())).rejects.toThrow(
      'Template is missing a valid package.json file',
    );
  });
});
