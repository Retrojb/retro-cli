import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { printSummary } from '../../src/summary.js';
import { ScaffoldResult } from '../../src/types.js';

describe('printSummary', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  const makeResult = (overrides: Partial<ScaffoldResult> = {}): ScaffoldResult => ({
    projectName: 'my-app',
    projectPath: '/home/user/projects/my-app',
    template: {
      name: 'expo',
      displayName: 'Expo',
      description: 'Mobile app with Expo',
      repoUrl: 'https://github.com/retro-templates/expo-template.git',
    },
    appliedOptions: [],
    ...overrides,
  });

  function getFullOutput(): string {
    return logSpy.mock.calls.map((args) => args.join(' ')).join('\n');
  }

  it('output includes the project name', () => {
    const result = makeResult({ projectName: 'cool-project' });
    printSummary(result);

    const output = getFullOutput();
    expect(output).toContain('cool-project');
  });

  it('output includes the absolute path', () => {
    const result = makeResult({ projectPath: '/Users/dev/workspace/my-app' });
    printSummary(result);

    const output = getFullOutput();
    expect(output).toContain('/Users/dev/workspace/my-app');
  });

  it('output includes a cd command to the project directory', () => {
    const result = makeResult({ projectName: 'my-app' });
    printSummary(result);

    const output = getFullOutput();
    expect(output).toContain('cd my-app');
  });

  it('output includes a command to install dependencies', () => {
    printSummary(makeResult());

    const output = getFullOutput();
    expect(output).toContain('npm install');
  });
});
