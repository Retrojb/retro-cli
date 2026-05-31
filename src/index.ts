#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promptProjectName } from './prompts/projectName.js';
import { promptTemplateSelection } from './prompts/templateSelect.js';
import { promptAdditionalOptions } from './prompts/options.js';
import { getAvailableTemplates, getAvailableOptions } from './templates/registry.js';
import { cloneTemplate } from './scaffold/clone.js';
import { runInteractiveCli } from './scaffold/interactive.js';
import { configureProject } from './scaffold/configure.js';
import { printSummary } from './summary.js';
import { ScaffoldConfig, ScaffoldResult } from './types.js';

// Read version from package.json
const __dirname = fileURLToPath(new URL('.', import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));

const program = new Command();

program
  .name('retro-cli')
  .description('Scaffold new projects from templates')
  .version(pkg.version)
  .showHelpAfterError('(use --help for usage information)')
  .action(async () => {
    try {
      // 1. Get available templates
      const templates = getAvailableTemplates();
      if (templates.length === 0) {
        console.error('Error: No templates are currently available');
        process.exit(1);
      }

      // 2. Prompt for project name
      const projectName = await promptProjectName();

      // 3. Prompt for template selection
      const template = await promptTemplateSelection(templates);

      // 4. Prompt for additional options
      const options = getAvailableOptions();
      const selectedOptions = await promptAdditionalOptions(options);

      // 5. Build scaffold config
      const targetDir = resolve(process.cwd(), projectName);
      const config: ScaffoldConfig = {
        projectName,
        template,
        additionalOptions: selectedOptions,
        targetDir,
      };

      // 6. Clone template
      await cloneTemplate(config);

      // 7. Run interactive CLI (if template defines one)
      await runInteractiveCli(config);

      // 8. Configure project
      await configureProject(config);

      // 9. Print summary
      const result: ScaffoldResult = {
        projectName,
        projectPath: targetDir,
        template,
        appliedOptions: selectedOptions,
      };
      printSummary(result);
    } catch (error) {
      if (error instanceof Error && error.message.includes('User force closed')) {
        process.exit(1);
      }
      console.error(`\nError: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });

// Graceful SIGINT handling
process.on('SIGINT', () => {
  console.log('\nOperation cancelled.');
  process.exit(1);
});

program.parse();
