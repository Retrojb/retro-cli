export class ValidationError extends Error {
    field;
    constructor(field, message) {
        super(message);
        this.field = field;
        this.name = 'ValidationError';
    }
}
export class ScaffoldError extends Error {
    cause;
    constructor(message, cause) {
        super(message);
        this.cause = cause;
        this.name = 'ScaffoldError';
    }
}
export class TimeoutError extends ScaffoldError {
    timeoutMs;
    constructor(timeoutMs) {
        super(`Clone operation timed out after ${timeoutMs / 1000} seconds`);
        this.timeoutMs = timeoutMs;
        this.name = 'TimeoutError';
    }
}
export class DirectoryConflictError extends ScaffoldError {
    dirName;
    constructor(dirName) {
        super(`Directory '${dirName}' already exists in the current directory`);
        this.dirName = dirName;
        this.name = 'DirectoryConflictError';
    }
}
export class InteractiveCliError extends ScaffoldError {
    command;
    exitCode;
    constructor(command, exitCode) {
        super(`Interactive command "${command}" failed with exit code ${exitCode}`);
        this.command = command;
        this.exitCode = exitCode;
        this.name = 'InteractiveCliError';
    }
}
export class InteractiveCliSpawnError extends ScaffoldError {
    command;
    constructor(command, cause) {
        super(`Failed to start interactive command "${command}"`, cause);
        this.command = command;
        this.name = 'InteractiveCliSpawnError';
    }
}
//# sourceMappingURL=types.js.map