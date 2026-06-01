import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shouldPromptScaffoldMethod, promptScaffoldMethod, ScaffoldMethod } from '../../src/prompts/scaffoldMethod.js';
import { Template } from '../../src/types.js';

// Mock @inquirer/prompts
vi.mock('@inquirer/prompts', () => ({
  select: vi.fn(),
}));

import { select } from '@inquirer/prompts';

const mockedSelect = vi.mocked(select);

function makeTemplate(overrides: Partial<Template> = {}): Template {
  return {
    name: 'vite',
    displayName: 'Vite',
    description: 'Frontend tooling with Vite',
    repoUrl: 'https://github.com/retro-templates/vite-template.git',
    ...overrides,
  };
}

describe('shouldPromptScaffoldMethod', () => {
  it('returns true for templates with a non-empty cliCommand', () => {
    const template = makeTemplate({ cliCommand: 'npm create vite@latest' });
    expect(shouldPromptScaffoldMethod(template)).toBe(true);
  });

  it('returns false for templates without cliCommand', () => {
    const template = makeTemplate();
    expect(shouldPromptScaffoldMethod(template)).toBe(false);
  });

  it('returns false for templates with undefined cliCommand', () => {
    const template = makeTemplate({ cliCommand: undefined });
    expect(shouldPromptScaffoldMethod(template)).toBe(false);
  });

  it('returns false for templates with empty string cliCommand', () => {
    const template = makeTemplate({ cliCommand: '' });
    expect(shouldPromptScaffoldMethod(template)).toBe(false);
  });

  it('returns false for templates with cliDescription but no cliCommand', () => {
    const template = makeTemplate({
      cliDescription: 'Runs the Vite scaffolding tool',
    });
    expect(shouldPromptScaffoldMethod(template)).toBe(false);
  });
});

describe('promptScaffoldMethod', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the selected value "cli"', async () => {
    mockedSelect.mockResolvedValue('cli');

    const template = makeTemplate({
      cliCommand: 'npm create vite@latest',
      cliDescription: 'Runs the Vite scaffolding tool',
    });

    const result = await promptScaffoldMethod(template);
    expect(result).toBe('cli');
  });

  it('returns the selected value "repo"', async () => {
    mockedSelect.mockResolvedValue('repo');

    const template = makeTemplate({
      cliCommand: 'npm create vite@latest',
    });

    const result = await promptScaffoldMethod(template);
    expect(result).toBe('repo');
  });

  it('calls select with correct message and choices', async () => {
    mockedSelect.mockResolvedValue('repo');

    const template = makeTemplate({
      cliCommand: 'npm create vite@latest',
      cliDescription: 'Runs the Vite scaffolding tool',
    });

    await promptScaffoldMethod(template);

    expect(mockedSelect).toHaveBeenCalledWith({
      message: 'How would you like to scaffold this project?',
      choices: [
        { name: 'Use template repository', value: 'repo' },
        { name: 'Use framework CLI', value: 'cli', description: 'Runs the Vite scaffolding tool' },
      ],
    });
  });

  it('omits description from framework CLI choice when cliDescription is not defined', async () => {
    mockedSelect.mockResolvedValue('cli');

    const template = makeTemplate({
      cliCommand: 'npx create-expo-app',
    });

    await promptScaffoldMethod(template);

    expect(mockedSelect).toHaveBeenCalledWith({
      message: 'How would you like to scaffold this project?',
      choices: [
        { name: 'Use template repository', value: 'repo' },
        { name: 'Use framework CLI', value: 'cli' },
      ],
    });
  });
});
