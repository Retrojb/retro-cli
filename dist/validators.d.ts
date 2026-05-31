/**
 * Shared validation functions for project names and npm package names.
 */
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
export declare function validateProjectName(name: string): string | true;
/**
 * Checks whether a string is a valid npm package name.
 * Uses the same rules as `validateProjectName`.
 *
 * @param name - The name to check
 * @returns `true` if valid, `false` otherwise
 */
export declare function isValidNpmPackageName(name: string): boolean;
