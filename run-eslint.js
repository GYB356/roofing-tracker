const { ESLint } = require('eslint');

async function main() {
  try {
    // Create an instance of ESLint
    const eslint = new ESLint({
      // Use the configuration from eslint.config.js
      fix: process.argv.includes('--fix')
    });

    // Define the files to lint
    const patterns = process.argv.length > 2 && !process.argv[2].startsWith('--') 
      ? [process.argv[2]]
      : ['./'];

    console.log(`Linting ${patterns.join(', ')}...`);
    
    // Lint files
    const results = await eslint.lintFiles(patterns);

    // Apply automatic fixes if --fix flag is provided
    if (process.argv.includes('--fix')) {
      await ESLint.outputFixes(results);
    }

    // Format the results
    const formatter = await eslint.loadFormatter('stylish');
    const resultText = formatter.format(results);

    // Output the results
    console.log(resultText);

    // Count errors and warnings
    const errorCount = results.reduce((count, result) => count + result.errorCount, 0);
    const warningCount = results.reduce((count, result) => count + result.warningCount, 0);
    
    console.log(`Found ${errorCount} errors and ${warningCount} warnings.`);

    // Return the appropriate exit code
    process.exit(errorCount > 0 ? 1 : 0);
  } catch (error) {
    console.error('Error running ESLint:', error);
    process.exit(1);
  }
}

main();