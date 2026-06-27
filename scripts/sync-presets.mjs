#!/usr/bin/env node
/**
 * Copies root-level preset JSON into src/presets/bundled for TypeScript bundling.
 * Run automatically before build via npm prebuild.
 */
import { cpSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const source = path.join(rootDir, 'presets');
const target = path.join(rootDir, 'src', 'presets', 'bundled');

rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
cpSync(source, target, { recursive: true });
console.info('[sync-presets] copied presets/ -> src/presets/bundled/');
