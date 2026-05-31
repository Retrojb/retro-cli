/**
 * Shared validation functions for project names and npm package names.
 */

const MAX_LENGTH = 214;
const VALID_CHARS_REGEX = /^[a-z0-9\-_]+$/;
const INVALID_CHARS_REGEX = /[^a-z0-9\-_]/g;

/**
 * Validates a project name against npm package naming rules.
 *
 * Rules:
 * - Must be 1–214 characters long
 * - Must contain only lowercase alphanumeric characters, hyphens, and underscores
 * - Must not start with a dot (`.`) or underscore (`_`)
 *
 * @param name - The project name to validate
 * @returns `true` if valid, or a descriptive error string if invalid
 */
export function validateProjectName(name: string): string | true {
  if (name.length === 0) {
    return 'Project name is required';
  }

  if (name.length > MAX_LENGTH) {
    return `Project name must not exceed ${MAX_LENGTH} characters`;
  }

  if (name.startsWith('.') || name.startsWith('_')) {
    return 'Project name must not start with a dot or underscore';
  }

  if (!VALID_CHARS_REGEX.test(name)) {
    const matches = name.match(INVALID_CHARS_REGEX) ?? [];
    const invalidChars = Array.from(new Set(matches));
    return `Project name contains invalid characters: ${invalidChars.join(', ')}`;
  }

  return true;
}

/**
 * Checks whether a string is a valid npm package name.
 * Uses the same rules as `validateProjectName`.
 *
 * @param name - The name to check
 * @returns `true` if valid, `false` otherwise
 */
export function isValidNpmPackageName(name: string): boolean {
  return validateProjectName(name) === true;
}
