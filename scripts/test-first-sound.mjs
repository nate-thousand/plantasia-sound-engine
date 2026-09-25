#!/usr/bin/env node
/**
 * Lines to first sound (ROADMAP decisions on simplicity, 15). The README's
 * first TypeScript block is the snippet a host copies. This gate keeps it at
 * six statements, on the public entry, naming only methods that exist. The
 * browser harness runs the same block and checks that it makes sound.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const MAX_LINES = 6;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

export function firstSnippet(markdown) {
  const match = markdown.match(/```typescript\n([\s\S]*?)```/);
  assert(match, 'README has a typescript block');
  return match[1];
}

/** Statements: non blank lines with comments stripped. */
export function statements(snippet) {
  return snippet
    .split('\n')
    .map((line) => line.replace(/\/\/.*$/, '').trim())
    .filter(Boolean);
}

async function main() {
  const readme = readFileSync(join(root, 'README.md'), 'utf8');
  const snippet = firstSnippet(readme);
  const lines = statements(snippet);
  assert(lines.length <= MAX_LINES, `first sound in ${lines.length} lines, bar is ${MAX_LINES}:\n${lines.join('\n')}`);
  assert(lines[0].includes("from 'plantasia-sound-engine/public'"), 'snippet imports the public entry');
  assert(/noteOn\(/.test(snippet), 'snippet ends in a note');

  const facade = await import(join(root, 'dist/public.js'));
  const engine = facade.createPlantasiaEngine();
  const called = [...snippet.matchAll(/engine\.([a-zA-Z]+)\(/g)].map((m) => m[1]);
  assert(called.length >= 4, `snippet calls engine methods: ${called.join(', ')}`);
  for (const name of called) {
    assert(typeof engine[name] === 'function', `snippet calls a method that does not exist: ${name}`);
  }
  // Node has no audio context, so only the load step runs here; the browser
  // harness row "first sound from the README" runs the whole block for real.
  await engine.loadSpecies('seed');
  assert(engine.getState() === 'loaded', 'snippet path loads the species');
  engine.dispose();
  console.log(`[test-first-sound] OK — first sound in ${lines.length} lines (bar ${MAX_LINES}): ${called.join(', ')}`);
}

main().catch((err) => {
  console.error('[test-first-sound]', err.message ?? err);
  process.exit(1);
});
