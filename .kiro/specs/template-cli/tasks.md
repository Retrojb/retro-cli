# Implementation Plan: template-cli

## Overview

Implement the `retro-cli` CLI tool that scaffolds new projects from remote git template repositories. The implementation follows a pipeline architecture: CLI Entry → Prompts → Scaffold → Summary. Each module is built incrementally, starting with shared types and validators, then building up through prompts, scaffold logic, and finally wiring everything together in the CLI entry point.

## Tasks

- [x] 1. Set up project structure, dependencies, and shared types
  - [x] 1.1 Configure TypeScript, Vitest, and install dependencies
    - Add `typescript`, `@types/node`, `vitest`, `fast-check`, `@inquirer/prompts`, `simple-git`, `ora` as dependencies
    - Create `tsconfig.json` with strict mode, ES2022 target, NodeNext module resolution
    - Create `vitest.config.ts` with test paths for unit, properties, and integration directories
    - Add scripts to `package.json`: `build`, `test`, `start`
    - Create directory structure: `src/`, `src/prompts/`, `src/templates/`, `src/scaffold/`, `tests/unit/`, `tests/properties/`, `tests/integration/`
    - _Requirements: 1.1_

  - [x] 1.2 Create shared type definitions and error classes
    - Create `src/types.ts` with `Template`, `AdditionalOption`, `ScaffoldConfig`, `ScaffoldResult` interfaces
    - Create error classes: `ValidationError`, `ScaffoldError`, `TimeoutError`, `DirectoryConflictError`
    - _Requirements: 5.3, 5.4, 5.5, 6.5, 6.6_

  - [x] 1.3 Implement validators module
    - Create `src/validators.ts` with `validateProjectName` and `isValidNpmPackageName` functions
    - Validation rules: 1–214 chars, lowercase alphanumeric + hyphens + underscores, must not start with `.` or `_`
    - Return `true` for valid names, descriptive error string for invalid names
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 6.1, 6.6_

  - [x] 1.4 Write property tests for validators
    - **Property 1: Valid project names are accepted**
    - **Property 2: Invalid character names are rejected**
    - **Validates: Requirements 2.2, 2.4**

  - [ ]* 1.5 Write unit tests for validators
    - Test edge cases: empty string, exactly 214 chars, 215 chars, starts with dot, starts with underscore, unicode characters, valid names with hyphens and underscores
    - _Requirements: 2.2, 2.3, 2.4, 2.5_

- [x] 2. Implement template registry and prompts
  - [x] 2.1 Create template registry module
    - Create `src/templates/registry.ts` with `getAvailableTemplates()` function
    - Define static template data: Expo, Storybook, Angular with display names, descriptions, and repo URLs
    - Define additional options data: Jest, ESLint with display names and descriptions
    - Export `getAvailableOptions()` function for additional options
    - _Requirements: 3.1, 3.2, 4.4, 4.5_

  - [x] 2.2 Implement project name prompt
    - Create `src/prompts/projectName.ts` with `promptProjectName()` function
    - Use `@inquirer/prompts` input prompt with inline validation using `validateProjectName`
    - Re-prompt on invalid input with descriptive error messages
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 2.3 Implement template selection prompt
    - Create `src/prompts/templateSelect.ts` with `promptTemplateSelection()` function
    - Use `@inquirer/prompts` select prompt displaying template display names and descriptions
    - Return the full `Template` object for the selected item
    - _Requirements: 3.1, 3.3_

  - [x] 2.4 Implement additional options prompt
    - Create `src/prompts/options.ts` with `promptAdditionalOptions()` function
    - Use `@inquirer/prompts` checkbox prompt for multi-select
    - Allow zero or more selections, return array of selected option names
    - _Requirements: 4.1, 4.2, 4.3, 4.6_

  - [x] 2.5 Write property test for options selection preservation
    - **Property 3: Selected options are preserved through the pipeline**
    - **Validates: Requirements 4.3**

  - [x] 2.6 Write unit tests for template registry
    - Test that `getAvailableTemplates()` returns non-empty array with valid Template objects
    - Test that `getAvailableOptions()` returns options with correct structure
    - _Requirements: 3.2, 4.4, 4.5_

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement scaffold engine
  - [x] 4.1 Implement clone module
    - Create `src/scaffold/clone.ts` with `cloneTemplate(config: ScaffoldConfig)` function
    - Use `simple-git` to perform shallow clone (depth 1) with 30-second timeout
    - Check for directory conflict before cloning, throw `DirectoryConflictError` if exists
    - Display spinner via `ora` during clone operation
    - Clean up partial directory on failure or timeout
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ]* 4.2 Write property test for directory conflict detection
    - **Property 4: Directory conflict detection**
    - **Validates: Requirements 5.3**

  - [x] 4.3 Implement configure module
    - Create `src/scaffold/configure.ts` with `configureProject(config: ScaffoldConfig)` function
    - Read and parse `package.json` from cloned template, throw `ScaffoldError` if missing
    - Update the `"name"` field to the user-provided project name
    - If Jest selected: add jest config file and jest devDependency to package.json
    - If ESLint selected: add eslint config file and eslint devDependency to package.json
    - Remove `.git` directory from the scaffolded project
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [x] 4.4 Write property test for package.json name update
    - **Property 5: Package.json name update preserves structure**
    - **Validates: Requirements 6.1**

  - [x] 4.5 Write unit tests for configure module
    - Test package.json name update preserves other fields
    - Test Jest config file creation and devDependency addition
    - Test ESLint config file creation and devDependency addition
    - Test .git directory removal
    - Test error when package.json is missing
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 5. Implement summary and CLI entry point
  - [x] 5.1 Implement summary module
    - Create `src/summary.ts` with `printSummary(result: ScaffoldResult)` function
    - Print success message with project name and absolute path
    - Print next-step instructions: `cd` command and dependency install command
    - _Requirements: 7.1, 7.2_

  - [x] 5.2 Write property test for summary output
    - **Property 6: Summary output contains all required information**
    - **Validates: Requirements 7.1, 7.2**

  - [x] 5.3 Write unit tests for summary module
    - Test output includes project name, absolute path, cd command, install command
    - _Requirements: 7.1, 7.2_

  - [x] 5.4 Implement CLI entry point
    - Create `src/index.ts` with Commander.js program setup
    - Configure `name('retro-cli')`, `description`, `version` (read from package.json)
    - Wire the default action: prompts → scaffold → summary pipeline
    - Handle errors at top level: format error messages, exit with code 1
    - Register SIGINT handler for graceful cancellation
    - Add bin entry to package.json pointing to compiled entry point
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 7.3, 7.4_

- [x] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Integration tests and final wiring
  - [x] 7.1 Write integration tests for CLI flags
    - Test `--help` outputs tool name, description, and options
    - Test `--version` outputs version matching package.json
    - Test unknown flag shows error and help suggestion
    - _Requirements: 1.2, 1.3, 1.4_

  - [ ]* 7.2 Write integration tests for scaffold flow
    - Test full scaffold flow with mocked git (directory created, package.json updated, .git removed)
    - Test directory conflict produces error before clone attempt
    - Test clone timeout triggers cleanup of partial directory
    - _Requirements: 5.1, 5.3, 5.5, 6.1, 6.4_

- [x] 8. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- All code is TypeScript, tested with Vitest + fast-check
- Dependencies: commander, @inquirer/prompts, simple-git, ora (runtime); typescript, vitest, fast-check, @types/node (dev)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3"] },
    { "id": 2, "tasks": ["1.4", "1.5", "2.1"] },
    { "id": 3, "tasks": ["2.2", "2.3", "2.4", "2.6"] },
    { "id": 4, "tasks": ["2.5", "4.1", "4.3"] },
    { "id": 5, "tasks": ["4.2", "4.4", "4.5", "5.1"] },
    { "id": 6, "tasks": ["5.2", "5.3", "5.4"] },
    { "id": 7, "tasks": ["7.1", "7.2"] }
  ]
}
```
