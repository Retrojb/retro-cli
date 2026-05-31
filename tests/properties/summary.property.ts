import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { printSummary } from '../../src/summary.js';
import { ScaffoldResult } from '../../src/types.js';

// Feature: template-cli, Property 6: Summary output contains all required information

describe('Summary output properties', () => {
  /**
   * Property 6: Summary output contains all required information
   *
   * For any scaffold result with a project name and absolute path, the printed
   * summary shall contain the project name, the absolute path, a `cd` command
   * to the project directory, and a command to install dependencies.
   *
   * **Validates: Requirements 7.1, 7.2**
   */
  it('Property 6: summary contains project name, path, cd command, and install command', () => {
    const validNameArb = fc
      .stringMatching(/^[a-z0-9\-_]{1,50}$/)
      .filter((name) => !name.startsWith('_'));

    fc.assert(
      fc.property(validNameArb, (projectName) => {
        const projectPath = `/home/user/projects/${projectName}`;
        const result: ScaffoldResult = {
          projectName,
          projectPath,
          template: { name: 'expo', displayName: 'Expo', description: 'test', repoUrl: 'https://example.com' },
          appliedOptions: [],
        };

        const logs: string[] = [];
        const spy = vi.spyOn(console, 'log').mockImplementation((...args) => {
          logs.push(args.join(' '));
        });

        printSummary(result);

        const output = logs.join('\n');
        expect(output).toContain(projectName);
        expect(output).toContain(projectPath);
        expect(output).toContain(`cd ${projectName}`);
        expect(output).toContain('npm install');

        spy.mockRestore();
      }),
      { numRuns: 100 }
    );
  });
});
