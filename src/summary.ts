import { ScaffoldResult } from './types.js';

export function printSummary(result: ScaffoldResult): void {
  console.log('');
  console.log(`✓ Project '${result.projectName}' created successfully at ${result.projectPath}`);
  console.log(`  Template: ${result.template.displayName}`);
  if (result.appliedOptions.length > 0) {
    console.log(`  Options: ${result.appliedOptions.join(', ')}`);
  }
  console.log('');
  console.log('Next steps:');
  console.log(`  cd ${result.projectName}`);
  console.log('  npm install');
}
