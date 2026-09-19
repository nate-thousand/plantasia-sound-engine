#!/usr/bin/env node
/**
 * Phase 20 — Web MIDI manager structural validation (no hardware in CI).
 */
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const { createWebMidiManager } = await import(join(root, 'dist/midi/WebMidiManager.js'));
  const { createPlantasiaEngine } = await import(join(root, 'dist/public.js'));

  const midi = createWebMidiManager();
  assert(Array.isArray(midi.devices), 'devices array');
  assert(midi.mpe.enabled === false, 'MPE disabled by default');

  const connected = await midi.connect({
    onNoteOn: () => {},
    onNoteOff: () => {},
  });
  assert(connected === false, 'connect returns false without Web MIDI (Node CI)');

  const engine = createPlantasiaEngine();
  assert(typeof engine.enableMidi === 'function', 'facade exposes enableMidi');
  const enabled = await engine.enableMidi();
  assert(enabled === false, 'enableMidi no-ops in Node');
  assert(typeof engine.midi === 'object', 'facade exposes midi manager');

  engine.dispose();
  console.log('[test-midi] OK — Web MIDI facade validated');
}

main().catch((err) => {
  console.error('[test-midi]', err.message ?? err);
  process.exit(1);
});
