import { ScaffoldResult } from './types.js';

export function printSummary(result: ScaffoldResult): void {
  console.log('');
  console.log(`✓ Project '${result.projectName}' created successfully at ${result.projectPath}`);
  console.log('');
  console.log('Next steps:');
  console.log(`  cd ${result.projectName}`);
  console.log('  npm install');
}
