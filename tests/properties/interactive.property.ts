import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { EventEmitter } from 'node:events';
import { ScaffoldConfig, InteractiveCliError } from '../../src/types.js';
import type { Template } from '../../src/types.js';

// Mock child_process
vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}));

import { spawn } from 'node:child_process';
import { buildCommand, runInteractiveCli } from '../../src/scaffold/interactive.js';

const mockedSpawn = vi.mocked(spawn);

function createMockChild() {
  return new EventEmitter();
}

/**
 * Arbitrary for a Template object WITH a cliCommand defined.
 */
const templateWithCliCommandArb = fc
  .record({
    name: fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.trim().length > 0),
    displayName: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
    description: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
    repoUrl: fc.webUrl(),
    cliCommand: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
    cliDescription: fc.option(
      fc.string({ minLength: 1, maxLength: 200 }).filter((s) => s.trim().length > 0),
      { nil: undefined },
    ),
  })
  .map((t): Template => t);

/**
 * Arbitrary for a Template object WITHOUT a cliCommand defined.
 */
const templateWithoutCliCommandArb = fc
  .record({
    name: fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.trim().length > 0),
    displayName: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
    description: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
    repoUrl: fc.webUrl(),
  })
  .map((t): Template => t);

/**
 * Arbitrary for a valid project name (lowercase alphanumeric, hyphens, underscores).
 */
const projectNameArb = fc
  .stringMatching(/^[a-z][a-z0-9\-_]{0,49}$/)
  .filter((s) => s.length > 0);

describe('Interactive CLI property tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  /**
   * Property 1: Interactive step conditional execution
   *
   * For any template, the interactive CLI step SHALL execute (attempt to spawn
   * a child process) if and only if the template defines a `cliCommand` field.
   * Templates without `cliCommand` SHALL result in a skipped execution
   * (no process spawned) regardless of whether `cliDescription` is present.
   *
   * **Validates: Requirements 2.4, 2.6, 2.7**
   */
  describe('Property 1: Interactive step conditional execution', () => {
    it('spawns a process when template has cliCommand defined', async () => {
      await fc.assert(
        fc.asyncProperty(
          templateWithCliCommandArb,
          projectNameArb,
          async (template, projectName) => {
            vi.clearAllMocks();

            const child = createMockChild();
            mockedSpawn.mockReturnValue(child as any);

            const config: ScaffoldConfig = {
              projectName,
              template,
              additionalOptions: [],
              targetDir: `/tmp/projects/${projectName}`,
            };

            const promise = runInteractiveCli(config);

            // Simulate successful exit
            child.emit('close', 0);

            const result = await promise;

            // spawn MUST have been called
            expect(mockedSpawn).toHaveBeenCalledTimes(1);
            expect(result.executed).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('does NOT spawn a process when template has no cliCommand', async () => {
      await fc.assert(
        fc.asyncProperty(
          templateWithoutCliCommandArb,
          projectNameArb,
          async (template, projectName) => {
            vi.clearAllMocks();

            const config: ScaffoldConfig = {
              projectName,
              template,
              additionalOptions: [],
              targetDir: `/tmp/projects/${projectName}`,
            };

            const result = await runInteractiveCli(config);

            // spawn MUST NOT have been called
            expect(mockedSpawn).not.toHaveBeenCalled();
            expect(result.executed).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('does NOT spawn a process when template has cliDescription but no cliCommand', async () => {
      const templateWithDescriptionOnlyArb = fc
        .record({
          name: fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.trim().length > 0),
          displayName: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
          description: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
          repoUrl: fc.webUrl(),
          cliDescription: fc.string({ minLength: 1, maxLength: 200 }).filter((s) => s.trim().length > 0),
        })
        .map((t): Template => t);

      await fc.assert(
        fc.asyncProperty(
          templateWithDescriptionOnlyArb,
          projectNameArb,
          async (template, projectName) => {
            vi.clearAllMocks();

            const config: ScaffoldConfig = {
              projectName,
              template,
              additionalOptions: [],
              targetDir: `/tmp/projects/${projectName}`,
            };

            const result = await runInteractiveCli(config);

            // spawn MUST NOT have been called even with cliDescription present
            expect(mockedSpawn).not.toHaveBeenCalled();
            expect(result.executed).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 3: Exit code determines success or failure
   *
   * For any interactive CLI execution, if the child process exits with code 0
   * the function SHALL resolve successfully (not throw). If the child process
   * exits with any non-zero exit code, the function SHALL throw an
   * InteractiveCliError whose message contains the command string (including
   * the appended project name).
   *
   * **Validates: Requirements 3.3, 3.4**
   */
  describe('Property 3: Exit code determines success or failure', () => {
    it('exit code 0 resolves successfully, non-zero throws InteractiveCliError containing the full command string', async () => {
      const exitCodeArb = fc.integer({ min: 0, max: 255 });

      await fc.assert(
        fc.asyncProperty(exitCodeArb, async (exitCode) => {
          vi.clearAllMocks();

          const child = createMockChild();
          mockedSpawn.mockReturnValue(child as any);

          const config: ScaffoldConfig = {
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
            targetDir: '/home/user/projects/my-app',
          };

          const promise = runInteractiveCli(config);

          // Emit 'close' with the generated exit code
          child.emit('close', exitCode);

          if (exitCode === 0) {
            // Should resolve successfully
            const result = await promise;
            expect(result.executed).toBe(true);
            expect(result.exitCode).toBe(0);
          } else {
            // Should throw InteractiveCliError containing the full command string
            try {
              await promise;
              expect.fail('Expected InteractiveCliError to be thrown for non-zero exit code');
            } catch (error) {
              expect(error).toBeInstanceOf(InteractiveCliError);
              // The full command includes the project name appended
              const expectedCommand = 'npm create vite@latest my-app';
              expect((error as InteractiveCliError).command).toBe(expectedCommand);
              expect((error as InteractiveCliError).message).toContain(expectedCommand);
              expect((error as InteractiveCliError).exitCode).toBe(exitCode);
            }
          }
        }),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 4: Command construction appends project name
   *
   * For any non-empty cliCommand string and any valid project name,
   * buildCommand(cliCommand, projectName) shall equal `${cliCommand} ${projectName}`.
   *
   * **Validates: Requirements 3.8**
   */
  describe('Property 4: Command construction appends project name', () => {
    it('buildCommand always produces cliCommand + space + projectName', () => {
      const cliCommandArb = fc
        .string({ minLength: 1, maxLength: 100 })
        .filter((s) => s.trim().length > 0);

      fc.assert(
        fc.property(cliCommandArb, projectNameArb, (cliCommand, projectName) => {
          const result = buildCommand(cliCommand, projectName);
          expect(result).toBe(`${cliCommand} ${projectName}`);
        }),
        { numRuns: 100 },
      );
    });
  });
});
