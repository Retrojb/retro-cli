# Implementation Plan: Template CLI Enhancements

## Overview

This plan implements two capabilities for retro-cli: adding Vite as a new template with an interactive CLI command, and introducing a new pipeline step that spawns template-defined shell commands interactively between clone and configure. The implementation extends the existing TypeScript codebase incrementally, starting with type definitions, then registry updates, then the new interactive module, and finally wiring everything together in the main pipeline.

## Tasks

- [x] 1. Extend types and add new error classes
  - [x] 1.1 Add `cliCommand` and `cliDescription` optional fields to the `Template` interface and add `InteractiveCliError` and `InteractiveCliSpawnError` error classes in `src/types.ts`
    - Add `cliCommand?: string` and `cliDescription?: string` to the existing `Template` interface
    - Add `InteractiveCliError` class extending `ScaffoldError` with `command` and `exitCode` properties
    - Add `InteractiveCliSpawnError` class extending `ScaffoldError` with `command` property and optional `cause`
    - _Requirements: 2.1, 2.5, 3.4, 3.5_

  - [x] 1.2 Write unit tests for new error classes in `tests/unit/types.test.ts`
    - Test `InteractiveCliError` instantiation with command and exit code, verify message format
    - Test `InteractiveCliSpawnError` instantiation with command and optional cause
    - Verify both extend `ScaffoldError`
    - _Requirements: 3.4, 3.5_

- [x] 2. Update template registry with Vite and CLI command fields
  - [x] 2.1 Add Vite template to the registry and add `cliCommand`/`cliDescription` fields to Expo and Vite entries in `src/templates/registry.ts`
    - Add Vite template entry with name `'vite'`, displayName `'Vite'`, description `'Frontend tooling with Vite'`, repoUrl pointing to the Vite template repo, `cliCommand: 'npm create vite@latest'`, and `cliDescription`
    - Add `cliCommand: 'npx create-expo-app'` and `cliDescription` to the existing Expo template entry
    - Storybook and Angular entries remain unchanged (no cliCommand)
    - _Requirements: 1.1, 1.2, 2.2, 2.3_

  - [x] 2.2 Update existing registry unit tests in `tests/unit/registry.test.ts` to cover Vite template and new fields
    - Update template count assertion from 3 to 4
    - Add test verifying Vite template has correct fields including `cliCommand` and `cliDescription`
    - Add test verifying Expo template now includes `cliCommand` and `cliDescription`
    - Add test verifying Storybook and Angular do NOT have `cliCommand` or `cliDescription`
    - _Requirements: 1.1, 2.2, 2.3, 2.4_

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement the interactive CLI module
  - [x] 4.1 Create `src/scaffold/interactive.ts` with `buildCommand` and `runInteractiveCli` functions
    - Export `InteractiveCliResult` interface with `executed`, `command?`, and `exitCode?` fields
    - Implement `buildCommand(cliCommand: string, projectName: string): string` that returns `${cliCommand} ${projectName}`
    - Implement `runInteractiveCli(config: ScaffoldConfig): Promise<InteractiveCliResult>` that:
      - Returns `{ executed: false }` if `config.template.cliCommand` is undefined
      - Displays a message with the command and description (if present) before spawning
      - Spawns the command via `child_process.spawn` with `shell: true`, `stdio: 'inherit'`, and `cwd` set to `path.dirname(config.targetDir)`
      - Resolves with `{ executed: true, command, exitCode: 0 }` on exit code 0
      - Throws `InteractiveCliError` on non-zero exit code
      - Throws `InteractiveCliSpawnError` on spawn error (ENOENT, EACCES)
    - _Requirements: 2.4, 2.6, 2.7, 3.1, 3.2, 3.3, 3.4, 3.5, 3.7, 3.8_

  - [x] 4.2 Write property test for command construction (Property 4) in `tests/properties/interactive.property.ts`
    - **Property 4: Command construction appends project name**
    - Generate arbitrary non-empty `cliCommand` strings and valid project names
    - Verify `buildCommand(cliCommand, projectName)` always equals `${cliCommand} ${projectName}`
    - **Validates: Requirements 3.8**

  - [x] 4.3 Write property test for conditional execution (Property 1) in `tests/properties/interactive.property.ts`
    - **Property 1: Interactive step conditional execution**
    - Generate Template objects with and without `cliCommand` field
    - Mock `child_process.spawn` to simulate successful execution
    - Verify `runInteractiveCli` spawns a process if and only if `cliCommand` is defined
    - **Validates: Requirements 2.4, 2.6, 2.7**

  - [x] 4.4 Write property test for exit code behavior (Property 3) in `tests/properties/interactive.property.ts`
    - **Property 3: Exit code determines success or failure**
    - Generate exit codes in range 0–255
    - Mock spawn to emit 'close' with the generated exit code
    - Verify exit code 0 resolves successfully, non-zero throws `InteractiveCliError` containing the command string
    - **Validates: Requirements 3.3, 3.4**

  - [x] 4.5 Write unit tests for `runInteractiveCli` in `tests/unit/interactive.test.ts`
    - Test that spawn is called with `shell: true`, `stdio: 'inherit'`, and correct `cwd`
    - Test that spawn receives the full command string with project name appended
    - Test skip behavior when template has no `cliCommand`
    - Test `InteractiveCliError` thrown on non-zero exit
    - Test `InteractiveCliSpawnError` thrown on ENOENT spawn error
    - Test message output includes `cliCommand` and `cliDescription` when both present
    - Test message output includes only `cliCommand` when `cliDescription` is absent
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.7, 3.8_

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Wire interactive step into the main pipeline
  - [x] 6.1 Modify `src/index.ts` to import and call `runInteractiveCli` between clone and configure steps
    - Import `runInteractiveCli` from `'./scaffold/interactive.js'`
    - Insert `await runInteractiveCli(config)` after `cloneTemplate(config)` and before `configureProject(config)`
    - Update step numbering comments to reflect the new step order (clone → interactive → configure → summary)
    - No changes needed to error handling — new errors extend `ScaffoldError` and are caught by existing catch block
    - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.5_

  - [x] 6.2 Write integration tests verifying pipeline order in `tests/integration/cli.test.ts`
    - Test that for a template with `cliCommand`, the execution order is: clone → interactive → configure → summary
    - Test that for a template without `cliCommand`, the execution order is: clone → configure → summary (interactive skipped)
    - Test that when interactive command fails, configure and summary are not reached
    - _Requirements: 4.1, 4.2, 4.3, 4.5_

- [x] 7. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The project uses Vitest with fast-check for property-based testing (already configured)
- All imports use `.js` extensions per the project's ESM convention

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "2.1"] },
    { "id": 2, "tasks": ["2.2", "4.1"] },
    { "id": 3, "tasks": ["4.2", "4.3", "4.4", "4.5"] },
    { "id": 4, "tasks": ["6.1"] },
    { "id": 5, "tasks": ["6.2"] }
  ]
}
```
