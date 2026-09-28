#!/usr/bin/env node
import { resolve } from 'node:path';
import { forge } from '../src/core.js';

const args = process.argv.slice(2);
const command = args[0] || 'build';
if (!['build', 'generate'].includes(command)) {
  console.error('Usage: icon-forge [build|generate] [--root directory] [--prefix name] [--css path] [--icon-source api|local] [--offline]');
  process.exitCode = 1;
} else {
  const value = (flag) => args[args.indexOf(flag) + 1];
  const root = resolve(value('--root') || process.cwd());
  try {
    const result = await forge(root, {
      prefix: value('--prefix') || undefined,
      cssFile: value('--css') || undefined,
      iconSource: value('--icon-source') || undefined,
      cacheDir: value('--cache-dir') || undefined,
      offline: args.includes('--offline'),
    });
    console.log(`icon-forge: generated ${result.icons.length} icon(s) in ${result.cssFile}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
