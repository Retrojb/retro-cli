import { describe, it, expect } from 'vitest';
import {
  ValidationError,
  ScaffoldError,
  TimeoutError,
  DirectoryConflictError,
  InteractiveCliError,
  InteractiveCliSpawnError,
} from '../../src/types.js';

describe('ValidationError', () => {
  it('should set field, message, and name', () => {
    const err = new ValidationError('projectName', 'Name is required');
    expect(err.field).toBe('projectName');
    expect(err.message).toBe('Name is required');
    expect(err.name).toBe('ValidationError');
    expect(err).toBeInstanceOf(Error);
  });
});

describe('ScaffoldError', () => {
  it('should set message and name', () => {
    const err = new ScaffoldError('Clone failed');
    expect(err.message).toBe('Clone failed');
    expect(err.name).toBe('ScaffoldError');
    expect(err.cause).toBeUndefined();
    expect(err).toBeInstanceOf(Error);
  });

  it('should accept an optional cause', () => {
    const cause = new Error('network error');
    const err = new ScaffoldError('Clone failed', cause);
    expect(err.cause).toBe(cause);
  });
});

describe('TimeoutError', () => {
  it('should format timeout message in seconds', () => {
    const err = new TimeoutError(30000);
    expect(err.message).toBe('Clone operation timed out after 30 seconds');
    expect(err.name).toBe('TimeoutError');
    expect(err.timeoutMs).toBe(30000);
    expect(err).toBeInstanceOf(ScaffoldError);
    expect(err).toBeInstanceOf(Error);
  });
});

describe('DirectoryConflictError', () => {
  it('should format conflict message with directory name', () => {
    const err = new DirectoryConflictError('my-project');
    expect(err.message).toBe(
      "Directory 'my-project' already exists in the current directory"
    );
    expect(err.name).toBe('DirectoryConflictError');
    expect(err.dirName).toBe('my-project');
    expect(err).toBeInstanceOf(ScaffoldError);
    expect(err).toBeInstanceOf(Error);
  });
});

describe('InteractiveCliError', () => {
  it('should format error message with command and exit code', () => {
    const err = new InteractiveCliError('npm create vite@latest', 1);
    expect(err.message).toBe(
      'Interactive command "npm create vite@latest" failed with exit code 1'
    );
    expect(err.name).toBe('InteractiveCliError');
    expect(err.command).toBe('npm create vite@latest');
    expect(err.exitCode).toBe(1);
    expect(err).toBeInstanceOf(ScaffoldError);
    expect(err).toBeInstanceOf(Error);
  });

  it('should handle null exit code', () => {
    const err = new InteractiveCliError('npx create-expo-app', null);
    expect(err.message).toBe(
      'Interactive command "npx create-expo-app" failed with exit code null'
    );
    expect(err.exitCode).toBeNull();
  });
});

describe('InteractiveCliSpawnError', () => {
  it('should format error message with command', () => {
    const err = new InteractiveCliSpawnError('npm create vite@latest');
    expect(err.message).toBe(
      'Failed to start interactive command "npm create vite@latest"'
    );
    expect(err.name).toBe('InteractiveCliSpawnError');
    expect(err.command).toBe('npm create vite@latest');
    expect(err).toBeInstanceOf(ScaffoldError);
    expect(err).toBeInstanceOf(Error);
  });

  it('should accept an optional cause', () => {
    const cause = new Error('ENOENT: command not found');
    const err = new InteractiveCliSpawnError('npx create-expo-app', cause);
    expect(err.cause).toBe(cause);
    expect(err.command).toBe('npx create-expo-app');
  });
});
