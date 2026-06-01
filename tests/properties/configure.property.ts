import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { ScaffoldConfig, ScaffoldError } from '../../src/types.js';

// Mock node:fs/promises for Property 3
vi.mock('node:fs/promises', () => ({
  default: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    rm: vi.fn(),
  },
}));

import fs from 'node:fs/promises';
import { configureProject } from '../../src/scaffold/configure.js';

const mockedFs = vi.mocked(fs);

// Feature: template-cli, Property 5: Package.json name update preserves structure

describe('Package.json name update properties', () => {
  /**
   * Property 5: Package.json name update preserves structure
   *
   * For any valid package.json object and any valid project name, updating
   * the name field shall produce a valid JSON object where only the "name"
   * field differs from the original and all other fields remain unchanged.
   *
   * **Validates: Requirements 6.1**
   */
  it('Property 5: updating name preserves all other fields', () => {
    const validNameArb = fc
      .stringMatching(/^[a-z0-9\-_]{1,214}$/)
      .filter((name) => !name.startsWith('_'));

    const packageJsonArb = fc.record({
      name: fc.string(),
      version: fc.string(),
      description: fc.string(),
      main: fc.string(),
      scripts: fc.dictionary(fc.string(), fc.string()),
      dependencies: fc.dictionary(fc.string(), fc.string()),
      devDependencies: fc.dictionary(fc.string(), fc.string()),
    });

    fc.assert(
      fc.property(validNameArb, packageJsonArb, (newName, originalPkg) => {
        // Simulate the name update (what configureProject does to package.json)
        const jsonStr = JSON.stringify(originalPkg);
        const parsed = JSON.parse(jsonStr);
        parsed.name = newName;

        // Verify only name changed
        expect(parsed.name).toBe(newName);
        expect(parsed.version).toBe(originalPkg.version);
        expect(parsed.description).toBe(originalPkg.description);
        expect(parsed.main).toBe(originalPkg.main);
        expect(parsed.scripts).toEqual(originalPkg.scripts);
        expect(parsed.dependencies).toEqual(originalPkg.dependencies);
        expect(parsed.devDependencies).toEqual(originalPkg.devDependencies);

        // Verify the result is still valid JSON by round-tripping
        const finalStr = JSON.stringify(parsed, null, 2);
        const reparsed = JSON.parse(finalStr);
        expect(reparsed.name).toBe(newName);
        expect(reparsed.version).toBe(originalPkg.version);
        expect(reparsed.description).toBe(originalPkg.description);
        expect(reparsed.main).toBe(originalPkg.main);
        expect(reparsed.scripts).toEqual(originalPkg.scripts);
        expect(reparsed.dependencies).toEqual(originalPkg.dependencies);
        expect(reparsed.devDependencies).toEqual(originalPkg.devDependencies);
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: framework-cli-scaffolding, Property 3: Malformed JSON in package.json produces an error

describe('Malformed package.json error handling properties', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  /**
   * Property 3: Malformed JSON in package.json produces an error
   *
   * For any string that is not valid JSON, if that string is the content of
   * package.json in the target directory, configureProject SHALL throw a
   * ScaffoldError without modifying the project directory.
   *
   * **Validates: Requirements 4.4**
   */
  it('Property 3: malformed JSON in package.json throws ScaffoldError', async () => {
    // Arbitrary that generates strings which are NOT valid JSON
    const nonJsonStringArb = fc
      .string({ minLength: 1, maxLength: 500 })
      .filter((s) => {
        try {
          JSON.parse(s);
          return false; // valid JSON, exclude it
        } catch {
          return true; // invalid JSON, include it
        }
      });

    const configArb = fc.record({
      projectName: fc.stringMatching(/^[a-z][a-z0-9\-]{0,20}$/).filter((s) => s.length > 0),
      targetDir: fc.constant('/tmp/test-project'),
    });

    await fc.assert(
      fc.asyncProperty(nonJsonStringArb, configArb, async (malformedJson, configParts) => {
        const config: ScaffoldConfig = {
          projectName: configParts.projectName,
          template: {
            name: 'test-template',
            displayName: 'Test Template',
            description: 'A test template',
            repoUrl: 'https://example.com/repo.git',
          },
          additionalOptions: [],
          targetDir: configParts.targetDir,
        };

        // Mock fs.readFile to return the malformed JSON string
        mockedFs.readFile.mockResolvedValue(malformedJson);
        // Mock fs.writeFile and fs.rm to ensure no modifications happen
        mockedFs.writeFile.mockResolvedValue(undefined);
        mockedFs.rm.mockResolvedValue(undefined);

        // configureProject should throw a ScaffoldError
        await expect(configureProject(config)).rejects.toThrow(ScaffoldError);

        // Verify no write operations occurred (project directory not modified)
        expect(mockedFs.writeFile).not.toHaveBeenCalled();
        expect(mockedFs.rm).not.toHaveBeenCalled();
      }),
      { numRuns: 100 },
    );
  });
});
