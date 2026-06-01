import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { printSummary } from '../../src/summary.js';
import { ScaffoldResult, Template } from '../../src/types.js';

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

// Feature: framework-cli-scaffolding, Property 4: Summary output includes template displayName and all applied options

describe('Summary output with applied options properties', () => {
  /**
   * Property 4: Summary output includes template displayName and all applied options
   *
   * For any ScaffoldResult with a non-empty appliedOptions array, the printed
   * summary shall contain the template's displayName and every option name
   * from appliedOptions.
   *
   * **Validates: Requirements 5.1**
   */
  it('Property 4: summary contains template displayName and all applied option names', () => {
    const validNameArb = fc
      .stringMatching(/^[a-z0-9\-_]{1,50}$/)
      .filter((name) => !name.startsWith('_'));

    const displayNameArb = fc
      .stringMatching(/^[A-Za-z][A-Za-z0-9 ]{0,29}$/)
      .filter((s) => s.trim().length > 0);

    const optionNameArb = fc
      .stringMatching(/^[a-zA-Z][a-zA-Z0-9\-_]{0,19}$/)
      .filter((s) => s.trim().length > 0);

    const templateArb = fc.record({
      name: validNameArb,
      displayName: displayNameArb,
      description: fc.string({ minLength: 1, maxLength: 50 }),
      repoUrl: fc.constant('https://example.com/repo.git'),
    }) as fc.Arbitrary<Template>;

    const scaffoldResultArb = fc.record({
      projectName: validNameArb,
      projectPath: validNameArb.map((name) => `/home/user/projects/${name}`),
      template: templateArb,
      appliedOptions: fc.array(optionNameArb, { minLength: 1, maxLength: 5 }),
    }) as fc.Arbitrary<ScaffoldResult>;

    fc.assert(
      fc.property(scaffoldResultArb, (result) => {
        const logs: string[] = [];
        const spy = vi.spyOn(console, 'log').mockImplementation((...args) => {
          logs.push(args.join(' '));
        });

        printSummary(result);

        const output = logs.join('\n');

        // Summary must contain the template displayName
        expect(output).toContain(result.template.displayName);

        // Summary must contain every applied option name
        for (const option of result.appliedOptions) {
          expect(output).toContain(option);
        }

        spy.mockRestore();
      }),
      { numRuns: 100 }
    );
  });
});
