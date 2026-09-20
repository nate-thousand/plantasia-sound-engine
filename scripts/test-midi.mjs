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
  assert((await engine.enableMidi('input-1')) === false, 'enableMidi(inputId) no-ops in Node');
  assert(typeof engine.midi === 'object', 'facade exposes midi manager');

  // 1.1: control decoding, midiControl event, live MIDI sources through feedMidi.
  const controls = [];
  engine.on('midiControl', (payload) => controls.push(payload));
  engine.feedMidi([0xb0, 1, 127]); // CC1 channel 1 full
  engine.feedMidi([0xb3, 74, 64]); // CC74 channel 4 mid
  engine.feedMidi([0xd1, 100]); // channel pressure channel 2
  engine.feedMidi([0xe0, 0x00, 0x60]); // bend up: value 0x3000 = 12288 -> +0.5
  engine.feedMidi([0xe0, 0x00, 0x40]); // bend centre
  assert(controls.length === 5, `five control events: ${controls.length}`);
  assert(controls[0].kind === 'cc' && controls[0].controller === 1 && controls[0].value === 1 && controls[0].channel === 1, 'CC decoded');
  assert(controls[1].channel === 4 && Math.abs(controls[1].value - 64 / 127) < 1e-9, 'CC channel and value');
  assert(controls[2].kind === 'aftertouch' && controls[2].channel === 2, 'aftertouch decoded');
  assert(controls[3].kind === 'bend' && Math.abs(controls[3].value - 0.5) < 1e-9, 'bend +0.5');
  assert(controls[4].kind === 'bend' && controls[4].value === 0, 'bend centre is 0');
  assert(controls.every((c) => Number.isFinite(c.time)), 'midiControl carries time');

  assert(engine.midi.read('cc', 1).active && engine.midi.read('cc', 1).value === 1, 'read last CC on any channel');
  assert(engine.midi.read('cc', 74, 4).active, 'read per channel');
  assert(engine.midi.read('cc', 74, 1).active === false, 'no value on another channel');
  assert(engine.midi.read('cc', 7).active === false, 'unseen controller inactive');

  // A midi-cc source now feeds modulation.
  engine.registerSpecies(() => ({
    metadata: { id: 'custom.midi-test', name: 'Midi Test', concept: 'x', description: 'x', inspiration: ['x'], character: ['x'] },
    initialize: async () => {},
    start: async () => {},
    stop: () => {},
    noteOn: () => {},
    noteOff: () => {},
    allNotesOff: () => {},
    setControl: () => {},
    dispose: () => {},
  }));
  await engine.loadSpecies('custom.midi-test');
  engine.setControl('bloom', 0.2);
  engine.modulate({ id: 'wheel', type: 'midi-cc', cc: 1 }, 'bloom', 0.5);
  engine.modulate({ id: 'press', type: 'midi-aftertouch' }, 'growth', 1);
  engine.modulate({ id: 'wheelCh4', type: 'midi-cc', cc: 74, channel: 4 }, 'roots', 0.5);
  await engine.start();
  await new Promise((resolve) => setTimeout(resolve, 80));
  const state = engine.getModulationState();
  assert(state.sources.wheel.active && Math.abs(state.controls.bloom.modulated - 0.7) < 1e-9, `CC1 modulates bloom: ${state.controls.bloom.modulated}`);
  assert(Math.abs(state.sources.press.value - 100 / 127) < 1e-9, 'aftertouch value');
  assert(Math.abs(state.sources.wheelCh4.value - 64 / 127) < 1e-9, 'channel filtered CC');

  engine.dispose();
  console.log('[test-midi] OK — Web MIDI facade, control decoding, MIDI modulation sources validated');
}

main().catch((err) => {
  console.error('[test-midi]', err.message ?? err);
  process.exit(1);
});
