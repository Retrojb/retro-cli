import { describe, it, expect } from 'vitest';
import { validateProjectName, isValidNpmPackageName } from '../../src/validators.js';

describe('validateProjectName', () => {
  it('accepts a valid lowercase name', () => {
    expect(validateProjectName('my-project')).toBe(true);
  });

  it('accepts a name with underscores', () => {
    expect(validateProjectName('my_project')).toBe(true);
  });

  it('accepts a single character name', () => {
    expect(validateProjectName('a')).toBe(true);
  });

  it('accepts a name at exactly 214 characters', () => {
    const name = 'a'.repeat(214);
    expect(validateProjectName(name)).toBe(true);
  });

  it('returns error for empty string', () => {
    const result = validateProjectName('');
    expect(result).toBe('Project name is required');
  });

  it('returns error for name exceeding 214 characters', () => {
    const name = 'a'.repeat(215);
    const result = validateProjectName(name);
    expect(result).toContain('214');
  });

  it('returns error for name starting with a dot', () => {
    const result = validateProjectName('.hidden');
    expect(result).toContain('dot');
  });

  it('returns error for name starting with an underscore', () => {
    const result = validateProjectName('_private');
    expect(result).toContain('underscore');
  });

  it('returns error for name with uppercase characters', () => {
    const result = validateProjectName('MyProject');
    expect(typeof result).toBe('string');
    expect(result).toContain('invalid characters');
  });

  it('returns error for name with spaces', () => {
    const result = validateProjectName('my project');
    expect(typeof result).toBe('string');
    expect(result).toContain('invalid characters');
  });

  it('returns error for name with special characters', () => {
    const result = validateProjectName('my@project!');
    expect(typeof result).toBe('string');
    expect(result).toContain('@');
  });
});

describe('isValidNpmPackageName', () => {
  it('returns true for valid names', () => {
    expect(isValidNpmPackageName('my-project')).toBe(true);
    expect(isValidNpmPackageName('project123')).toBe(true);
    expect(isValidNpmPackageName('a')).toBe(true);
  });

  it('returns false for invalid names', () => {
    expect(isValidNpmPackageName('')).toBe(false);
    expect(isValidNpmPackageName('.hidden')).toBe(false);
    expect(isValidNpmPackageName('_private')).toBe(false);
    expect(isValidNpmPackageName('My-Project')).toBe(false);
    expect(isValidNpmPackageName('a'.repeat(215))).toBe(false);
  });
});
