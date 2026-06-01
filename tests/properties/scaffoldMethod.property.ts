import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { shouldPromptScaffoldMethod } from '../../src/prompts/scaffoldMethod.js';
import type { Template } from '../../src/types.js';

// Feature: framework-cli-scaffolding, Property 1: Scaffolding method prompt eligibility is determined by cliCommand presence
// Feature: framework-cli-scaffolding, Property 2: Orphaned cliDescription does not grant CLI eligibility

/**
 * Arbitrary for a Template object WITH a non-empty cliCommand defined.
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
 * Arbitrary for a Template object with an empty string cliCommand.
 */
const templateWithEmptyCliCommandArb = fc
  .record({
    name: fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.trim().length > 0),
    displayName: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
    description: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
    repoUrl: fc.webUrl(),
    cliCommand: fc.constant(''),
    cliDescription: fc.option(
      fc.string({ minLength: 1, maxLength: 200 }).filter((s) => s.trim().length > 0),
      { nil: undefined },
    ),
  })
  .map((t): Template => t);

/**
 * Arbitrary for a Template with cliDescription but NO cliCommand.
 */
const templateWithOrphanedDescriptionArb = fc
  .record({
    name: fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.trim().length > 0),
    displayName: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
    description: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
    repoUrl: fc.webUrl(),
    cliDescription: fc.string({ minLength: 1, maxLength: 200 }).filter((s) => s.trim().length > 0),
  })
  .map((t): Template => t);

describe('Scaffolding method prompt eligibility properties', () => {
  /**
   * Property 1: Scaffolding method prompt eligibility is determined by cliCommand presence
   *
   * For any template object, shouldPromptScaffoldMethod(template) SHALL return
   * true if and only if the template's cliCommand field is a non-empty string.
   * Templates without cliCommand (or with an empty string) SHALL always return false.
   *
   * **Validates: Requirements 1.1, 1.2, 3.3, 3.4**
   */
  describe('Property 1: Scaffolding method prompt eligibility is determined by cliCommand presence', () => {
    it('returns true for any template with a non-empty cliCommand', () => {
      fc.assert(
        fc.property(templateWithCliCommandArb, (template) => {
          expect(shouldPromptScaffoldMethod(template)).toBe(true);
        }),
        { numRuns: 100 },
      );
    });

    it('returns false for any template without a cliCommand', () => {
      fc.assert(
        fc.property(templateWithoutCliCommandArb, (template) => {
          expect(shouldPromptScaffoldMethod(template)).toBe(false);
        }),
        { numRuns: 100 },
      );
    });

    it('returns false for any template with an empty string cliCommand', () => {
      fc.assert(
        fc.property(templateWithEmptyCliCommandArb, (template) => {
          expect(shouldPromptScaffoldMethod(template)).toBe(false);
        }),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 2: Orphaned cliDescription does not grant CLI eligibility
   *
   * For any template that has a cliDescription field defined but does NOT have
   * a cliCommand field (or has an empty cliCommand), shouldPromptScaffoldMethod(template)
   * SHALL return false.
   *
   * **Validates: Requirements 3.5**
   */
  describe('Property 2: Orphaned cliDescription does not grant CLI eligibility', () => {
    it('returns false when template has cliDescription but no cliCommand', () => {
      fc.assert(
        fc.property(templateWithOrphanedDescriptionArb, (template) => {
          expect(shouldPromptScaffoldMethod(template)).toBe(false);
        }),
        { numRuns: 100 },
      );
    });

    it('returns false when template has cliDescription with empty cliCommand', () => {
      const templateWithDescAndEmptyCommandArb = fc
        .record({
          name: fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.trim().length > 0),
          displayName: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
          description: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
          repoUrl: fc.webUrl(),
          cliCommand: fc.constant(''),
          cliDescription: fc.string({ minLength: 1, maxLength: 200 }).filter((s) => s.trim().length > 0),
        })
        .map((t): Template => t);

      fc.assert(
        fc.property(templateWithDescAndEmptyCommandArb, (template) => {
          expect(shouldPromptScaffoldMethod(template)).toBe(false);
        }),
        { numRuns: 100 },
      );
    });
  });
});
