export function printSummary(result) {
    console.log('');
    console.log(`✓ Project '${result.projectName}' created successfully at ${result.projectPath}`);
    console.log('');
    console.log('Next steps:');
    console.log(`  cd ${result.projectName}`);
    console.log('  npm install');
}
//# sourceMappingURL=summary.js.map