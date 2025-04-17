// scripts/build-worker-string.js
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

async function bundleWorker() {
  try {
    // Ensure the output directory exists
    const outputDir = path.resolve(__dirname, '../src/workers');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // First check if the source worker file exists
    const workerPath = path.resolve(__dirname, '../src/workers/data-worker.ts');
    if (!fs.existsSync(workerPath)) {
      console.error(`Worker file not found: ${workerPath}`);
      console.error('Please create this file before running the build script');
      process.exit(1);
    }

    const result = await esbuild.build({
      entryPoints: [workerPath],
      bundle: true,
      minify: true,
      format: 'iife',
      write: false,
      platform: 'browser',
      target: ['es2020'],
      // Add specific external modules that should be excluded from the bundle
      // This might be needed if you have modules that can't be bundled
      // external: ['some-module-to-exclude'],
    });

    const bundledCode = result.outputFiles[0].text;
    
    const workerStringModule = `// Auto-generated worker string module
// This file is generated during the build process - do not edit directly

export const dataWorkerCode = \`${bundledCode.replace(/`/g, '\\`')}\`;
`;

    const outputPath = path.resolve(__dirname, '../src/workers/data-worker-string.ts');
    fs.writeFileSync(outputPath, workerStringModule);

    console.log(`Worker string module generated successfully at: ${outputPath}`);
  } catch (error) {
    console.error('Error generating worker string:');
    console.error(error);
    // Don't exit the process with error in development
    // This allows CRA to continue even if there's an issue with worker generation
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}

// Create a placeholder file if it doesn't exist
function createPlaceholderIfNeeded() {
  const placeholderPath = path.resolve(__dirname, '../src/workers/data-worker-string.ts');
  if (!fs.existsSync(placeholderPath)) {
    const placeholder = `// Placeholder file - will be replaced during build
export const dataWorkerCode = '';
`;
    fs.writeFileSync(placeholderPath, placeholder);
    console.log(`Created placeholder worker string file at: ${placeholderPath}`);
  }
}

// Run both functions
createPlaceholderIfNeeded();
bundleWorker();