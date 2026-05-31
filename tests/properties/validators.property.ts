import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validateProjectName } from '../../src/validators.js';

// Feature: template-cli, Property 1: Valid project names are accepted
// Feature: template-cli, Property 2: Invalid character names are rejected

describe('validateProjectName properties', () => {
  /**
   * Property 1: Valid project names are accepted
   *
   * For any string that is 1–214 characters long, contains only lowercase
   * alphanumeric characters, hyphens, and underscores, and does not start
   * with a dot or underscore, the validateProjectName function shall return true.
   *
   * **Validates: Requirements 2.2**
   */
  it('Property 1: accepts all valid project names', () => {
    const validNameArb = fc
      .stringMatching(/^[a-z0-9\-_]{1,214}$/)
      .filter((name) => !name.startsWith('_'));

    fc.assert(
      fc.property(validNameArb, (name) => {
        expect(validateProjectName(name)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2: Invalid character names are rejected
   *
   * For any string that contains at least one character outside the set of
   * lowercase alphanumeric characters, hyphens, and underscores, the
   * validateProjectName function shall return an error string.
   *
   * **Validates: Requirements 2.4**
   */
  it('Property 2: rejects names with invalid characters', () => {
    const nameWithInvalidCharArb = fc
      .string({ minLength: 1, maxLength: 214 })
      .filter((name) => /[^a-z0-9\-_]/.test(name));

    fc.assert(
      fc.property(nameWithInvalidCharArb, (name) => {
        const result = validateProjectName(name);
        expect(typeof result).toBe('string');
      }),
      { numRuns: 100 }
    );
  });
});
