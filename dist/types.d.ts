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
export declare class ValidationError extends Error {
    field: string;
    constructor(field: string, message: string);
}
export declare class ScaffoldError extends Error {
    cause?: Error | undefined;
    constructor(message: string, cause?: Error | undefined);
}
export declare class TimeoutError extends ScaffoldError {
    timeoutMs: number;
    constructor(timeoutMs: number);
}
export declare class DirectoryConflictError extends ScaffoldError {
    dirName: string;
    constructor(dirName: string);
}
export declare class InteractiveCliError extends ScaffoldError {
    command: string;
    exitCode: number | null;
    constructor(command: string, exitCode: number | null);
}
export declare class InteractiveCliSpawnError extends ScaffoldError {
    command: string;
    constructor(command: string, cause?: Error);
}
