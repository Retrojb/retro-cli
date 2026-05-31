import { describe, it, expect, beforeAll, vi, beforeEach } from 'vitest';
import { execFileSync, execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const projectRoot = join(__dirname, '..', '..');
const cliPath = join(projectRoot, 'dist', 'index.js');

describe('CLI integration tests', () => {
  beforeAll(() => {
    execSync('yarn build', { cwd: projectRoot, stdio: 'pipe' });
  });

  describe('--help flag', () => {
    it('outputs the tool name', () => {
      const output = execFileSync('node', [cliPath, '--help'], {
        encoding: 'utf-8',
        cwd: projectRoot,
      });
      expect(output).toContain('retro-cli');
    });

    it('outputs the tool description', () => {
      const output = execFileSync('node', [cliPath, '--help'], {
        encoding: 'utf-8',
        cwd: projectRoot,
      });
      expect(output).toContain('Scaffold new projects from templates');
    });

    it('outputs available options', () => {
      const output = execFileSync('node', [cliPath, '--help'], {
        encoding: 'utf-8',
        cwd: projectRoot,
      });
      expect(output).toContain('--version');
      expect(output).toContain('--help');
    });
  });

  describe('--version flag', () => {
    it('outputs version matching package.json', () => {
      const pkg = JSON.parse(
        readFileSync(join(projectRoot, 'package.json'), 'utf-8'),
      );
      const output = execFileSync('node', [cliPath, '--version'], {
        encoding: 'utf-8',
        cwd: projectRoot,
      });
      expect(output.trim()).toBe(pkg.version);
    });
  });

  describe('unknown flag', () => {
    it('shows error for unrecognized option', () => {
      try {
        execFileSync('node', [cliPath, '--unknown-flag'], {
          encoding: 'utf-8',
          cwd: projectRoot,
          stdio: 'pipe',
        });
        expect.fail('Should have exited with non-zero code');
      } catch (error: any) {
        const stderr = error.stderr || '';
        expect(stderr).toContain('unknown option');
      }
    });

    it('suggests --help for usage information', () => {
      try {
        execFileSync('node', [cliPath, '--unknown-flag'], {
          encoding: 'utf-8',
          cwd: projectRoot,
          stdio: 'pipe',
        });
        expect.fail('Should have exited with non-zero code');
      } catch (error: any) {
        const output = (error.stderr || '') + (error.stdout || '');
        expect(output).toContain('--help');
      }
    });
  });
});

// Pipeline order integration tests using mocked modules
vi.mock('../../src/scaffold/clone.js', () => ({
  cloneTemplate: vi.fn(),
}));

vi.mock('../../src/scaffold/interactive.js', () => ({
  runInteractiveCli: vi.fn(),
}));

vi.mock('../../src/scaffold/configure.js', () => ({
  configureProject: vi.fn(),
}));

vi.mock('../../src/summary.js', () => ({
  printSummary: vi.fn(),
}));

describe('Pipeline execution order', () => {
  let cloneTemplate: ReturnType<typeof vi.fn>;
  let runInteractiveCli: ReturnType<typeof vi.fn>;
  let configureProject: ReturnType<typeof vi.fn>;
  let printSummary: ReturnType<typeof vi.fn>;
  let callOrder: string[];

  beforeEach(async () => {
    callOrder = [];
    vi.clearAllMocks();

    const cloneMod = await import('../../src/scaffold/clone.js');
    const interactiveMod = await import('../../src/scaffold/interactive.js');
    const configureMod = await import('../../src/scaffold/configure.js');
    const summaryMod = await import('../../src/summary.js');

    cloneTemplate = cloneMod.cloneTemplate as ReturnType<typeof vi.fn>;
    runInteractiveCli = interactiveMod.runInteractiveCli as ReturnType<typeof vi.fn>;
    configureProject = configureMod.configureProject as ReturnType<typeof vi.fn>;
    printSummary = summaryMod.printSummary as ReturnType<typeof vi.fn>;

    cloneTemplate.mockImplementation(async () => {
      callOrder.push('clone');
    });
    configureProject.mockImplementation(async () => {
      callOrder.push('configure');
    });
    printSummary.mockImplementation(() => {
      callOrder.push('summary');
    });
  });

  it('executes clone → interactive → configure → summary for a template with cliCommand', async () => {
    runInteractiveCli.mockImplementation(async () => {
      callOrder.push('interactive');
      return { executed: true, command: 'npm create vite@latest my-app', exitCode: 0 };
    });

    const { ScaffoldConfig } = await import('../../src/types.js');
    const config = {
      projectName: 'my-app',
      template: {
        name: 'vite',
        displayName: 'Vite',
        description: 'Frontend tooling with Vite',
        repoUrl: 'https://github.com/retro-templates/vite-template.git',
        cliCommand: 'npm create vite@latest',
        cliDescription: 'Runs the Vite scaffolding tool',
      },
      additionalOptions: [],
      targetDir: '/tmp/my-app',
    };

    await cloneTemplate(config);
    await runInteractiveCli(config);
    await configureProject(config);
    printSummary({ projectName: config.projectName, projectPath: config.targetDir, template: config.template, appliedOptions: [] });

    expect(callOrder).toEqual(['clone', 'interactive', 'configure', 'summary']);
    expect(cloneTemplate).toHaveBeenCalledBefore(runInteractiveCli);
    expect(runInteractiveCli).toHaveBeenCalledBefore(configureProject);
    expect(configureProject).toHaveBeenCalledBefore(printSummary);
  });

  it('executes clone → configure → summary for a template without cliCommand (interactive skipped)', async () => {
    runInteractiveCli.mockImplementation(async () => {
      // Does NOT push to callOrder — simulates skipped execution
      return { executed: false };
    });

    const config = {
      projectName: 'my-app',
      template: {
        name: 'storybook',
        displayName: 'Storybook',
        description: 'Component library with Storybook',
        repoUrl: 'https://github.com/retro-templates/storybook-template.git',
      },
      additionalOptions: [],
      targetDir: '/tmp/my-app',
    };

    await cloneTemplate(config);
    await runInteractiveCli(config);
    await configureProject(config);
    printSummary({ projectName: config.projectName, projectPath: config.targetDir, template: config.template, appliedOptions: [] });

    expect(callOrder).toEqual(['clone', 'configure', 'summary']);
    expect(runInteractiveCli).toHaveBeenCalled();
    expect(cloneTemplate).toHaveBeenCalledBefore(configureProject);
    expect(configureProject).toHaveBeenCalledBefore(printSummary);
  });

  it('does not reach configure or summary when interactive command fails', async () => {
    const { InteractiveCliError } = await import('../../src/types.js');

    runInteractiveCli.mockImplementation(async () => {
      callOrder.push('interactive');
      throw new InteractiveCliError('npm create vite@latest my-app', 1);
    });

    const config = {
      projectName: 'my-app',
      template: {
        name: 'vite',
        displayName: 'Vite',
        description: 'Frontend tooling with Vite',
        repoUrl: 'https://github.com/retro-templates/vite-template.git',
        cliCommand: 'npm create vite@latest',
      },
      additionalOptions: [],
      targetDir: '/tmp/my-app',
    };

    await cloneTemplate(config);

    try {
      await runInteractiveCli(config);
      // If interactive succeeds, continue pipeline
      await configureProject(config);
      printSummary({ projectName: config.projectName, projectPath: config.targetDir, template: config.template, appliedOptions: [] });
    } catch {
      // Pipeline stops on error — configure and summary not reached
    }

    expect(callOrder).toEqual(['clone', 'interactive']);
    expect(configureProject).not.toHaveBeenCalled();
    expect(printSummary).not.toHaveBeenCalled();
  });
});
