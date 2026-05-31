import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildCommand, runInteractiveCli, InteractiveCliResult } from '../../src/scaffold/interactive.js';
import { ScaffoldConfig, InteractiveCliError, InteractiveCliSpawnError } from '../../src/types.js';
import { EventEmitter } from 'node:events';

// Mock child_process
vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}));

import { spawn } from 'node:child_process';

const mockedSpawn = vi.mocked(spawn);

function createMockChild() {
  const child = new EventEmitter();
  return child;
}

function makeConfig(overrides: Partial<ScaffoldConfig> = {}): ScaffoldConfig {
  return {
    projectName: 'my-app',
    template: {
      name: 'vite',
      displayName: 'Vite',
      description: 'Frontend tooling with Vite',
      repoUrl: 'https://github.com/retro-templates/vite-template.git',
      cliCommand: 'npm create vite@latest',
      cliDescription: 'Runs the Vite scaffolding tool to select your framework and variant',
    },
    additionalOptions: [],
    targetDir: '/home/user/projects/my-app',
    ...overrides,
  };
}

describe('buildCommand', () => {
  it('appends project name to cliCommand', () => {
    expect(buildCommand('npm create vite@latest', 'my-app')).toBe(
      'npm create vite@latest my-app',
    );
  });

  it('works with npx commands', () => {
    expect(buildCommand('npx create-expo-app', 'expo-project')).toBe(
      'npx create-expo-app expo-project',
    );
  });

  it('handles single-word commands', () => {
    expect(buildCommand('init', 'project')).toBe('init project');
  });
});

describe('runInteractiveCli', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('returns { executed: false } when template has no cliCommand', async () => {
    const config = makeConfig({
      template: {
        name: 'storybook',
        displayName: 'Storybook',
        description: 'Component library with Storybook',
        repoUrl: 'https://github.com/retro-templates/storybook-template.git',
      },
    });

    const result = await runInteractiveCli(config);
    expect(result).toEqual({ executed: false });
    expect(mockedSpawn).not.toHaveBeenCalled();
  });

  it('spawns command with correct options when cliCommand is defined', async () => {
    const child = createMockChild();
    mockedSpawn.mockReturnValue(child as any);

    const config = makeConfig();
    const promise = runInteractiveCli(config);

    // Simulate successful exit
    child.emit('close', 0);

    const result = await promise;
    expect(result).toEqual({
      executed: true,
      command: 'npm create vite@latest my-app',
      exitCode: 0,
    });

    expect(mockedSpawn).toHaveBeenCalledWith('npm create vite@latest my-app', {
      shell: true,
      stdio: 'inherit',
      cwd: '/home/user/projects',
    });
  });

  it('displays message with command and description before spawning', async () => {
    const child = createMockChild();
    mockedSpawn.mockReturnValue(child as any);

    const config = makeConfig();
    const promise = runInteractiveCli(config);
    child.emit('close', 0);
    await promise;

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('npm create vite@latest'),
    );
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('Runs the Vite scaffolding tool'),
    );
  });

  it('displays message with only command when no cliDescription', async () => {
    const child = createMockChild();
    mockedSpawn.mockReturnValue(child as any);

    const config = makeConfig({
      template: {
        name: 'expo',
        displayName: 'Expo',
        description: 'Mobile app with Expo',
        repoUrl: 'https://github.com/retro-templates/expo-template.git',
        cliCommand: 'npx create-expo-app',
      },
    });

    const promise = runInteractiveCli(config);
    child.emit('close', 0);
    await promise;

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('npx create-expo-app'),
    );
  });

  it('throws InteractiveCliError on non-zero exit code', async () => {
    const child = createMockChild();
    mockedSpawn.mockReturnValue(child as any);

    const config = makeConfig();
    const promise = runInteractiveCli(config);
    child.emit('close', 1);

    await expect(promise).rejects.toThrow(InteractiveCliError);
    await expect(promise).rejects.toMatchObject({
      command: 'npm create vite@latest my-app',
      exitCode: 1,
    });
  });

  it('throws InteractiveCliSpawnError on spawn error', async () => {
    const child = createMockChild();
    mockedSpawn.mockReturnValue(child as any);

    const config = makeConfig();
    const promise = runInteractiveCli(config);

    const error = new Error('spawn ENOENT') as NodeJS.ErrnoException;
    error.code = 'ENOENT';
    child.emit('error', error);

    await expect(promise).rejects.toThrow(InteractiveCliSpawnError);
  });

  it('sets cwd to parent directory of targetDir', async () => {
    const child = createMockChild();
    mockedSpawn.mockReturnValue(child as any);

    const config = makeConfig({ targetDir: '/workspace/projects/my-app' });
    const promise = runInteractiveCli(config);
    child.emit('close', 0);
    await promise;

    expect(mockedSpawn).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ cwd: '/workspace/projects' }),
    );
  });
});
