export interface Template {
  name: string;
  displayName: string;
  description: string;
  repoUrl: string;
  cliCommand?: string;
  cliDescription?: string;
}

export interface AdditionalOption {
  name: string;
  displayName: string;
  description: string;
}

export interface ScaffoldConfig {
  projectName: string;
  template: Template;
  additionalOptions: string[];
  targetDir: string;
}

export interface ScaffoldResult {
  projectName: string;
  projectPath: string;
  template: Template;
  appliedOptions: string[];
}

export class ValidationError extends Error {
  constructor(public field: string, message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ScaffoldError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'ScaffoldError';
  }
}

export class TimeoutError extends ScaffoldError {
  constructor(public timeoutMs: number) {
    super(`Clone operation timed out after ${timeoutMs / 1000} seconds`);
    this.name = 'TimeoutError';
  }
}

export class DirectoryConflictError extends ScaffoldError {
  constructor(public dirName: string) {
    super(`Directory '${dirName}' already exists in the current directory`);
    this.name = 'DirectoryConflictError';
  }
}

export class InteractiveCliError extends ScaffoldError {
  constructor(public command: string, public exitCode: number | null) {
    super(`Interactive command "${command}" failed with exit code ${exitCode}`);
    this.name = 'InteractiveCliError';
  }
}

export class InteractiveCliSpawnError extends ScaffoldError {
  constructor(public command: string, cause?: Error) {
    super(`Failed to start interactive command "${command}"`, cause);
    this.name = 'InteractiveCliSpawnError';
  }
}
