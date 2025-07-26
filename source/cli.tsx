#!/usr/bin/env node

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

async function main() {
  // Get package.json path
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const packageJsonPath = join(__dirname, '..', 'package.json');

  // Handle --version and --help flags before launching interactive mode
  const args = process.argv.slice(2);

  if (args.includes('--version') || args.includes('-v')) {
    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
      console.log(`zeroide v${packageJson.version}`);
    } catch (error) {
      console.log('zeroide v0.1.4');
    }
    process.exit(0);
  }

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
zeroide - CLI-based AI coder

Usage:
  zeroide [options]

Options:
  -h, --help     Show this help message
  -v, --version  Show version information

Commands:
  zeroide        Start interactive AI coding session

For more information, visit: https://github.com/siddhartha/zeroide
`);
    process.exit(0);
  }

  // Only import and run the CLI if no flags were provided
  // Import and run the CLI from @zeroide/cli
  await import('@zeroide/cli');
}

main().catch(console.error);