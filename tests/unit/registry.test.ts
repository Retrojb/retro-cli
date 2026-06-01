import { describe, it, expect } from 'vitest';
import { getAvailableTemplates, getAvailableOptions } from '../../src/templates/registry.js';

describe('Template Registry', () => {
  describe('getAvailableTemplates', () => {
    it('returns all four templates', () => {
      const templates = getAvailableTemplates();
      expect(templates).toHaveLength(4);
    });

    it('includes Expo template with correct data and cliCommand', () => {
      const templates = getAvailableTemplates();
      const expo = templates.find((t) => t.name === 'expo');
      expect(expo).toEqual({
        name: 'expo',
        displayName: 'Expo (React Native)',
        description: 'Mobile app with Expo and React Native',
        repoUrl: 'https://github.com/retro-templates/expo-template.git',
        cliCommand: 'npx create-expo-app',
        cliDescription: 'Runs the Expo CLI to configure your mobile app with framework selection and TypeScript setup',
      });
    });

    it('includes Vite template with correct data and cliCommand', () => {
      const templates = getAvailableTemplates();
      const vite = templates.find((t) => t.name === 'vite');
      expect(vite).toEqual({
        name: 'vite',
        displayName: 'Vite',
        description: 'Frontend tooling with Vite',
        repoUrl: 'https://github.com/retro-templates/vite-template.git',
        cliCommand: 'npm create vite@latest',
        cliDescription: 'Runs the Vite scaffolding tool to select your framework and variant',
      });
    });

    it('includes Storybook template with correct data and no cliCommand', () => {
      const templates = getAvailableTemplates();
      const storybook = templates.find((t) => t.name === 'storybook');
      expect(storybook).toEqual({
        name: 'storybook',
        displayName: 'Storybook',
        description: 'Component library with Storybook',
        repoUrl: 'https://github.com/retro-templates/storybook-template.git',
      });
      expect(storybook!.cliCommand).toBeUndefined();
    });

    it('includes Angular template with correct data and no cliCommand', () => {
      const templates = getAvailableTemplates();
      const angular = templates.find((t) => t.name === 'angular');
      expect(angular).toEqual({
        name: 'angular',
        displayName: 'Angular',
        description: 'Angular application with TypeScript',
        repoUrl: 'https://github.com/retro-templates/angular-template.git',
      });
      expect(angular!.cliCommand).toBeUndefined();
    });

    it('each template has all required fields', () => {
      const templates = getAvailableTemplates();
      for (const template of templates) {
        expect(template.name).toBeTruthy();
        expect(template.displayName).toBeTruthy();
        expect(template.description).toBeTruthy();
        expect(template.repoUrl).toMatch(/^https:\/\//);
      }
    });
  });

  describe('getAvailableOptions', () => {
    it('returns all additional options', () => {
      const options = getAvailableOptions();
      expect(options).toHaveLength(3);
    });

    it('includes Jest option with correct data', () => {
      const options = getAvailableOptions();
      const jest = options.find((o) => o.name === 'jest');
      expect(jest).toEqual({
        name: 'jest',
        displayName: 'Jest',
        description: 'Jest testing configuration',
      });
    });

    it('includes ESLint option with correct data', () => {
      const options = getAvailableOptions();
      const eslint = options.find((o) => o.name === 'eslint');
      expect(eslint).toEqual({
        name: 'eslint',
        displayName: 'ESLint',
        description: 'ESLint linting configuration',
      });
    });

    it('each option has all required fields', () => {
      const options = getAvailableOptions();
      for (const option of options) {
        expect(option.name).toBeTruthy();
        expect(option.displayName).toBeTruthy();
        expect(option.description).toBeTruthy();
      }
    });
  });
});
