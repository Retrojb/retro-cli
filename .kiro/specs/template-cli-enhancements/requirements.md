# Requirements Document

## Introduction

The template-cli-enhancements feature extends the existing retro-cli scaffolding tool with two capabilities: adding Vite as a new template option in the template registry, and introducing an interactive CLI step that allows templates to define a post-clone command. When a template specifies a CLI command (e.g., Expo's `npx create-expo-app` or Vite's `npm create vite@latest`), the retro-cli tool spawns that command interactively so the user can complete template-specific setup, then resumes the retro-cli workflow (configuration and summary) after the interactive command exits.

## Glossary

- **CLI**: The retro-cli command-line interface application that orchestrates the template scaffolding workflow
- **Template_Registry**: The component responsible for listing and resolving available templates, including their metadata and optional interactive CLI commands
- **Template**: A predefined application scaffold stored in a remote git repository, optionally associated with an interactive CLI command
- **Interactive_CLI_Command**: An optional shell command defined on a template that is spawned as an interactive child process after cloning, allowing the user to interact with a template-specific setup tool (e.g., Expo CLI, Vite CLI)
- **Scaffold_Engine**: The component responsible for cloning templates, running interactive CLI commands, applying user configuration, and producing the final project directory
- **Child_Process**: A spawned subprocess that inherits the parent terminal's stdin, stdout, and stderr, enabling the user to interact with the template's CLI tool directly

## Requirements

### Requirement 1: Vite Template Registration

**User Story:** As a developer, I want to select Vite as a template option, so that I can scaffold a new Vite-based project using retro-cli.

#### Acceptance Criteria

1. THE Template_Registry SHALL include a Vite template with the display name "Vite", a description of "Frontend tooling with Vite", and a valid repository URL pointing to the Vite template repository
2. WHEN the user reaches the template selection prompt, THE CLI SHALL display the Vite template alongside existing templates (Expo, Storybook, Angular) in the selection list
3. WHEN the user selects the Vite template, THE Scaffold_Engine SHALL clone the Vite template repository using the same shallow-clone mechanism used for all other templates

### Requirement 2: Template Interactive CLI Command Definition

**User Story:** As a template author, I want to associate an optional interactive CLI command with a template, so that users can run template-specific setup tools during scaffolding.

#### Acceptance Criteria

1. THE Template interface SHALL support an optional `cliCommand` field of type string that specifies the shell command to execute interactively after cloning
2. THE Template_Registry SHALL define the Expo template with a `cliCommand` value of `npx create-expo-app`
3. THE Template_Registry SHALL define the Vite template with a `cliCommand` value of `npm create vite@latest`
4. IF a template does not define a `cliCommand` field, THEN THE Scaffold_Engine SHALL skip the interactive CLI step and proceed directly to project configuration
5. THE Template interface SHALL support an optional `cliDescription` field of type string, with a maximum length of 200 characters, that provides a plain-text explanation of what the interactive CLI command does
6. IF a template defines a `cliDescription` field without a corresponding `cliCommand` field, THEN THE Scaffold_Engine SHALL ignore the `cliDescription` field and skip the interactive CLI step
7. IF a template defines a `cliCommand` field without a `cliDescription` field, THEN THE Scaffold_Engine SHALL proceed with the interactive CLI step using only the command value

### Requirement 3: Interactive CLI Execution

**User Story:** As a developer, I want the template's CLI tool to run interactively after cloning, so that I can complete template-specific setup (e.g., choosing an Expo template variant or Vite framework) before retro-cli continues.

#### Acceptance Criteria

1. WHEN the clone step completes and the selected template defines a `cliCommand`, THE Scaffold_Engine SHALL display a message indicating which interactive CLI command will be executed and its `cliDescription`
2. WHEN the interactive CLI command is spawned, THE Scaffold_Engine SHALL execute the command as a child process via the system shell with stdin, stdout, and stderr inherited from the parent terminal, allowing full user interaction
3. WHEN the interactive CLI command exits with exit code 0, THE Scaffold_Engine SHALL proceed to the project configuration step of the retro-cli workflow
4. IF the interactive CLI command exits with a non-zero exit code, THEN THE Scaffold_Engine SHALL display an error message indicating the command name and that it failed, and exit with a non-zero exit code
5. IF the interactive CLI command fails to spawn (e.g., command not found or permission denied), THEN THE Scaffold_Engine SHALL display an error message indicating the command could not be started and exit with a non-zero exit code
6. IF the user sends SIGINT (Ctrl+C) during the interactive CLI command execution, THEN THE Scaffold_Engine SHALL forward the signal to the child process and exit the retro-cli workflow with a non-zero exit code
7. WHILE the interactive CLI command is running, THE CLI SHALL yield full terminal control to the child process without displaying spinners or intercepting input
8. WHEN the interactive CLI command is spawned, THE Scaffold_Engine SHALL execute the command with the current working directory set to the cloned project directory and append the project name as the final argument to the `cliCommand` string

### Requirement 4: Workflow Continuity After Interactive CLI

**User Story:** As a developer, I want the retro-cli workflow to resume after the interactive CLI step completes, so that my project still receives the standard configuration and summary output.

#### Acceptance Criteria

1. WHEN the interactive CLI command completes with exit code 0, THE Scaffold_Engine SHALL proceed to apply project configuration (package.json name update to the user-specified project name, additional options such as Jest or ESLint config injection, and .git directory removal) to the project directory
2. WHEN the interactive CLI command completes with exit code 0, THE CLI SHALL print the completion summary including the project name, the absolute project path, and next-step instructions (cd into project directory and npm install)
3. IF the interactive CLI command modifies the project directory contents, THEN THE Scaffold_Engine SHALL apply configuration to the modified directory state without reverting changes made by the interactive CLI command
4. IF the project directory does not contain a package.json file after the interactive CLI command completes, THEN THE Scaffold_Engine SHALL display an error message indicating that package.json is missing and exit with a non-zero exit code
5. WHEN the interactive CLI command completes with exit code 0, THE Scaffold_Engine SHALL apply configuration after the interactive CLI step completes and before the completion summary is printed
