import { Template, AdditionalOption } from '../types.js';

const templates: Template[] = [
  {
    name: 'expo',
    displayName: 'Expo (React Native)',
    description: 'Mobile app with Expo and React Native',
    repoUrl: 'https://github.com/retro-templates/expo-template.git',
    cliCommand: 'npx create-expo-app',
    cliDescription: 'Runs the Expo CLI to configure your mobile app with framework selection and TypeScript setup',
  },
  {
    name: 'vite',
    displayName: 'Vite',
    description: 'Frontend tooling with Vite',
    repoUrl: 'https://github.com/retro-templates/vite-template.git',
    cliCommand: 'npm create vite@latest',
    cliDescription: 'Runs the Vite scaffolding tool to select your framework and variant',
  },
  {
    name: 'storybook',
    displayName: 'Storybook',
    description: 'Component library with Storybook',
    repoUrl: 'https://github.com/retro-templates/storybook-template.git',
  },
  {
    name: 'angular',
    displayName: 'Angular',
    description: 'Angular application with TypeScript',
    repoUrl: 'https://github.com/retro-templates/angular-template.git',
  },
];

const additionalOptions: AdditionalOption[] = [
  {
    name: 'jest',
    displayName: 'Jest',
    description: 'Jest testing configuration',
  },
  {
    name: 'eslint',
    displayName: 'ESLint',
    description: 'ESLint linting configuration',
  },
  {
    name: 'prettier',
    displayName: "Prettier",
    description: "prettier configuration"
  }
];

export function getAvailableTemplates(): Template[] {
  return templates;
}

export function getAvailableOptions(): AdditionalOption[] {
  return additionalOptions;
}
