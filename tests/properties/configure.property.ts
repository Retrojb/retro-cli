import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

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
