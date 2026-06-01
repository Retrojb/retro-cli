import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Template, ScaffoldConfig } from '../../src/types.js';

// Mock all prompt modules
vi.mock('../../src/prompts/projectName.js', () => ({
  promptProjectName: vi.fn(),
}));

vi.mock('../../src/prompts/templateSelect.js', () => ({
  promptTemplateSelection: vi.fn(),
}));

vi.mock('../../src/prompts/options.js', () => ({
  promptAdditionalOptions: vi.fn(),
}));

vi.mock('../../src/prompts/scaffoldMethod.js', () => ({
  shouldPromptScaffoldMethod: vi.fn(),
  promptScaffoldMethod: vi.fn(),
}));

// Mock all scaffold modules
vi.mock('../../src/scaffold/clone.js', () => ({
  cloneTemplate: vi.fn(),
}));

vi.mock('../../src/scaffold/interactive.js', () => ({
  runInteractiveCli: vi.fn(),
}));

vi.mock('../../src/scaffold/configure.js', () => ({
  configureProject: vi.fn(),
}));

// Mock summary
vi.mock('../../src/summary.js', () => ({
  printSummary: vi.fn(),
}));

// Mock registry
vi.mock('../../src/templates/registry.js', () => ({
  getAvailableTemplates: vi.fn(),
  getAvailableOptions: vi.fn(),
}));

// Mock commander to capture the action handler
vi.mock('commander', () => {
  let actionHandler: (() => Promise<void>) | null = null;

  const programMock = {
    name: vi.fn().mockReturnThis(),
    description: vi.fn().mockReturnThis(),
    version: vi.fn().mockReturnThis(),
    showHelpAfterError: vi.fn().mockReturnThis(),
    action: vi.fn((handler: () => Promise<void>) => {
      actionHandler = handler;
      return programMock;
    }),
    parse: vi.fn(),
  };

  return {
    Command: vi.fn(() => programMock),
    __getActionHandler: () => actionHandler,
    __program: programMock,
  };
});

// Mock node:fs for package.json reading
vi.mock('node:fs', () => ({
  readFileSync: vi.fn(() => JSON.stringify({ version: '0.1.0' })),
}));

import { promptProjectName } from '../../src/prompts/projectName.js';
import { promptTemplateSelection } from '../../src/prompts/templateSelect.js';
import { promptAdditionalOptions } from '../../src/prompts/options.js';
import { shouldPromptScaffoldMethod, promptScaffoldMethod } from '../../src/prompts/scaffoldMethod.js';
import { cloneTemplate } from '../../src/scaffold/clone.js';
import { runInteractiveCli } from '../../src/scaffold/interactive.js';
import { configureProject } from '../../src/scaffold/configure.js';
import { printSummary } from '../../src/summary.js';
import { getAvailableTemplates, getAvailableOptions } from '../../src/templates/registry.js';

const mockedPromptProjectName = vi.mocked(promptProjectName);
const mockedPromptTemplateSelection = vi.mocked(promptTemplateSelection);
const mockedPromptAdditionalOptions = vi.mocked(promptAdditionalOptions);
const mockedShouldPromptScaffoldMethod = vi.mocked(shouldPromptScaffoldMethod);
const mockedPromptScaffoldMethod = vi.mocked(promptScaffoldMethod);
const mockedCloneTemplate = vi.mocked(cloneTemplate);
const mockedRunInteractiveCli = vi.mocked(runInteractiveCli);
const mockedConfigureProject = vi.mocked(configureProject);
const mockedPrintSummary = vi.mocked(printSummary);
const mockedGetAvailableTemplates = vi.mocked(getAvailableTemplates);
const mockedGetAvailableOptions = vi.mocked(getAvailableOptions);

const templateWithCli: Template = {
  name: 'vite',
  displayName: 'Vite',
  description: 'Frontend tooling with Vite',
  repoUrl: 'https://github.com/retro-templates/vite-template.git',
  cliCommand: 'npm create vite@latest',
  cliDescription: 'Runs the Vite scaffolding tool',
};

const templateWithoutCli: Template = {
  name: 'storybook',
  displayName: 'Storybook',
  description: 'Component library with Storybook',
  repoUrl: 'https://github.com/retro-templates/storybook-template.git',
};

async function getActionHandler(): Promise<() => Promise<void>> {
  const { __getActionHandler } = await import('commander') as any;
  // Re-import index to register the action handler
  await import('../../src/index.js');
  return __getActionHandler();
}

describe('index.ts orchestration branching', () => {
  let actionHandler: () => Promise<void>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    vi.clearAllMocks();

    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit called');
    }) as any);
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});

    // Default mock setup for a successful flow
    mockedGetAvailableTemplates.mockReturnValue([templateWithCli, templateWithoutCli]);
    mockedGetAvailableOptions.mockReturnValue([]);
    mockedPromptProjectName.mockResolvedValue('my-app');
    mockedPromptAdditionalOptions.mockResolvedValue([]);
    mockedCloneTemplate.mockResolvedValue(undefined);
    mockedRunInteractiveCli.mockResolvedValue({ executed: true, command: 'npm create vite@latest my-app', exitCode: 0 } as any);
    mockedConfigureProject.mockResolvedValue(undefined);
    mockedPrintSummary.mockImplementation(() => {});

    actionHandler = await getActionHandler();
  });

  afterEach(() => {
    processExitSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('when template has cliCommand and user selects "cli"', () => {
    it('does NOT call cloneTemplate and DOES call runInteractiveCli', async () => {
      mockedPromptTemplateSelection.mockResolvedValue(templateWithCli);
      mockedShouldPromptScaffoldMethod.mockReturnValue(true);
      mockedPromptScaffoldMethod.mockResolvedValue('cli');

      await actionHandler();

      expect(mockedCloneTemplate).not.toHaveBeenCalled();
      expect(mockedRunInteractiveCli).toHaveBeenCalled();
    });

    it('calls configureProject and printSummary after runInteractiveCli', async () => {
      mockedPromptTemplateSelection.mockResolvedValue(templateWithCli);
      mockedShouldPromptScaffoldMethod.mockReturnValue(true);
      mockedPromptScaffoldMethod.mockResolvedValue('cli');

      await actionHandler();

      expect(mockedConfigureProject).toHaveBeenCalled();
      expect(mockedPrintSummary).toHaveBeenCalled();
    });
  });

  describe('when template has cliCommand and user selects "repo"', () => {
    it('calls cloneTemplate', async () => {
      mockedPromptTemplateSelection.mockResolvedValue(templateWithCli);
      mockedShouldPromptScaffoldMethod.mockReturnValue(true);
      mockedPromptScaffoldMethod.mockResolvedValue('repo');

      await actionHandler();

      expect(mockedCloneTemplate).toHaveBeenCalled();
    });

    it('calls runInteractiveCli after cloneTemplate', async () => {
      mockedPromptTemplateSelection.mockResolvedValue(templateWithCli);
      mockedShouldPromptScaffoldMethod.mockReturnValue(true);
      mockedPromptScaffoldMethod.mockResolvedValue('repo');

      await actionHandler();

      expect(mockedCloneTemplate).toHaveBeenCalled();
      expect(mockedRunInteractiveCli).toHaveBeenCalled();
    });
  });

  describe('when template has no cliCommand', () => {
    it('skips scaffolding method prompt and calls cloneTemplate', async () => {
      mockedPromptTemplateSelection.mockResolvedValue(templateWithoutCli);
      mockedShouldPromptScaffoldMethod.mockReturnValue(false);

      await actionHandler();

      expect(mockedPromptScaffoldMethod).not.toHaveBeenCalled();
      expect(mockedCloneTemplate).toHaveBeenCalled();
    });

    it('calls runInteractiveCli after cloneTemplate', async () => {
      mockedPromptTemplateSelection.mockResolvedValue(templateWithoutCli);
      mockedShouldPromptScaffoldMethod.mockReturnValue(false);

      await actionHandler();

      expect(mockedCloneTemplate).toHaveBeenCalled();
      expect(mockedRunInteractiveCli).toHaveBeenCalled();
    });
  });

  describe('user cancellation (force-close)', () => {
    it('results in process.exit(1) when prompt is force-closed', async () => {
      mockedPromptTemplateSelection.mockResolvedValue(templateWithCli);
      mockedShouldPromptScaffoldMethod.mockReturnValue(true);
      mockedPromptScaffoldMethod.mockRejectedValue(new Error('User force closed the prompt'));

      await expect(actionHandler()).rejects.toThrow('process.exit called');

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('does not call cloneTemplate or runInteractiveCli after cancellation', async () => {
      mockedPromptTemplateSelection.mockResolvedValue(templateWithCli);
      mockedShouldPromptScaffoldMethod.mockReturnValue(true);
      mockedPromptScaffoldMethod.mockRejectedValue(new Error('User force closed the prompt'));

      await expect(actionHandler()).rejects.toThrow('process.exit called');

      expect(mockedCloneTemplate).not.toHaveBeenCalled();
      expect(mockedRunInteractiveCli).not.toHaveBeenCalled();
    });
  });
});
