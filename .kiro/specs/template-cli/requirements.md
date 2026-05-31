# Requirements Document

## Introduction

The template-cli feature provides a command-line interface for scaffolding new projects from predefined templates. Users run the CLI tool, answer interactive prompts to select a project name, template type, and additional configuration options, and the tool clones the selected template from a remote git repository into the user's current working directory as a ready-to-use project.

## Glossary

- **CLI**: The command-line interface application built with Commander.js that orchestrates the template scaffolding workflow
- **Template**: A predefined application scaffold stored in a remote git repository (e.g., Expo, Storybook, Angular)
- **Template_Registry**: The component responsible for listing and resolving available templates from the remote repository
- **Prompt_Engine**: The interactive prompt system that collects user input for project configuration
- **Scaffold_Engine**: The component responsible for cloning templates, applying user configuration, and producing the final project directory
- **Project_Directory**: The output directory created in the user's current working directory containing the scaffolded project
- **Additional_Options**: Optional configuration additions applied to a template (e.g., Jest configuration, ESLint configuration)

## Requirements

### Requirement 1: CLI Entry Point

**User Story:** As a developer, I want to invoke the CLI tool from my terminal, so that I can start the project scaffolding workflow.

#### Acceptance Criteria

1. WHEN the user executes the `retro-cli` command with no arguments, THE CLI SHALL display the interactive prompts to begin the scaffolding workflow within 2 seconds of invocation
2. WHEN the user executes the `retro-cli` command with the `--help` flag, THE CLI SHALL display usage information including the tool name, description, available commands, and available options
3. WHEN the user executes the `retro-cli` command with the `--version` flag, THE CLI SHALL display the version string matching the version field defined in the project's package.json
4. IF the user executes the `retro-cli` command with an unrecognized flag or argument, THEN THE CLI SHALL display an error message indicating the unknown input and suggest running `--help` for usage information

### Requirement 2: Project Name Prompt

**User Story:** As a developer, I want to specify a name for my new project, so that the scaffolded project uses my chosen name.

#### Acceptance Criteria

1. WHEN the scaffolding workflow begins, THE Prompt_Engine SHALL prompt the user to enter a project name
2. WHEN the user provides a project name that is 1 to 214 characters long, contains only lowercase alphanumeric characters, hyphens, and underscores, and does not start with a dot or underscore, THE Prompt_Engine SHALL accept the input and proceed to the template selection prompt
3. IF the user provides an empty project name, THEN THE Prompt_Engine SHALL display an error message indicating a name is required and re-prompt for a valid name
4. IF the user provides a project name containing characters other than lowercase alphanumeric characters, hyphens, or underscores, THEN THE Prompt_Engine SHALL display an error message indicating which characters are invalid and re-prompt
5. IF the user provides a project name that exceeds 214 characters, THEN THE Prompt_Engine SHALL display an error message indicating the maximum allowed length and re-prompt

### Requirement 3: Template Selection Prompt

**User Story:** As a developer, I want to choose from available project templates, so that I can scaffold the type of application I need.

#### Acceptance Criteria

1. WHEN the project name is accepted, THE Prompt_Engine SHALL display a list of available templates showing each template's display name and description for the user to select from
2. THE Template_Registry SHALL provide the list of available templates including their display names and descriptions
3. WHEN the user selects a template from the list, THE Prompt_Engine SHALL accept the selection and proceed to the additional options prompt
4. IF the Template_Registry fails to retrieve the available templates, THEN THE CLI SHALL display an error message indicating the retrieval failure and exit with a non-zero exit code
5. IF the Template_Registry returns an empty list of templates, THEN THE CLI SHALL display an error message indicating no templates are available and exit with a non-zero exit code

### Requirement 4: Additional Options Prompt

**User Story:** As a developer, I want to select additional configuration options for my project, so that I can customize the scaffolded project with common tooling.

#### Acceptance Criteria

1. WHEN the template selection is accepted, THE Prompt_Engine SHALL display a multi-select checkbox list of available additional options for the user to select
2. THE Prompt_Engine SHALL allow the user to select zero or more additional options from the list by toggling individual checkboxes before confirming
3. WHEN the user confirms the additional options selection, THE Prompt_Engine SHALL accept the selection and proceed to the scaffolding step with the selected options preserved
4. THE CLI SHALL display "Jest" as a selectable additional option representing Jest testing configuration
5. THE CLI SHALL display "ESLint" as a selectable additional option representing ESLint linting configuration
6. IF the user cancels the additional options prompt, THEN THE CLI SHALL exit with a non-zero exit code without proceeding to the scaffolding step

### Requirement 5: Template Cloning

**User Story:** As a developer, I want the selected template to be cloned from the remote repository, so that I receive the latest version of the template.

#### Acceptance Criteria

1. WHEN the user confirms all prompt selections, THE Scaffold_Engine SHALL clone the selected template from the remote git repository into a new directory named with the user-provided project name in the current working directory
2. WHEN the clone operation is initiated, THE Scaffold_Engine SHALL perform a shallow clone (depth of 1) of the template repository
3. IF a directory with the same name already exists in the current working directory, THEN THE Scaffold_Engine SHALL display an error message indicating the naming conflict and exit with a non-zero exit code without attempting the clone
4. IF the git clone operation fails for any reason including network unavailability, invalid repository URL, or authentication failure, THEN THE Scaffold_Engine SHALL display an error message indicating the cause of failure and exit with a non-zero exit code
5. IF the clone operation does not complete within 30 seconds, THEN THE Scaffold_Engine SHALL abort the operation, display an error message indicating a timeout, remove any partially cloned directory, and exit with a non-zero exit code
6. WHILE the clone operation is in progress, THE CLI SHALL display a spinner indicator to the user

### Requirement 6: Project Configuration

**User Story:** As a developer, I want the scaffolded project to reflect my chosen project name and options, so that the project is ready to use without manual renaming.

#### Acceptance Criteria

1. WHEN the template is cloned, THE Scaffold_Engine SHALL update the "name" field in the package.json file to match the user-provided project name, validated as a valid npm package name (lowercase, no spaces, max 214 characters, containing only URL-safe characters)
2. WHEN the user selected Jest as an additional option, THE Scaffold_Engine SHALL add a Jest configuration file and add Jest as a devDependency in the scaffolded project's package.json
3. WHEN the user selected ESLint as an additional option, THE Scaffold_Engine SHALL add an ESLint configuration file and add ESLint as a devDependency in the scaffolded project's package.json
4. WHEN all configuration is applied, THE Scaffold_Engine SHALL remove the .git directory from the scaffolded project to provide a clean git history
5. IF the cloned template does not contain a valid package.json file, THEN THE Scaffold_Engine SHALL display an error message indicating the template is missing package.json and abort the configuration process without modifying the scaffolded directory
6. IF the user-provided project name is not a valid npm package name, THEN THE Scaffold_Engine SHALL display an error message indicating the name is invalid and abort the scaffolding process

### Requirement 7: Completion Summary

**User Story:** As a developer, I want to see a summary of what was created, so that I know the scaffolding completed successfully and what to do next.

#### Acceptance Criteria

1. WHEN the scaffolding completes successfully, THE CLI SHALL print to stdout a success message that includes the project name and the absolute path to the created project directory
2. WHEN the scaffolding completes successfully, THE CLI SHALL print to stdout next-step instructions containing a `cd` command to the project directory and a command to install dependencies
3. WHEN the scaffolding completes successfully, THE CLI SHALL exit with a zero exit code
4. IF the scaffolding fails at any step, THEN THE CLI SHALL exit with a non-zero exit code
