#!/usr/bin/env node
/**
 * Phase 19 — semantic event bus validation.
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
  const { EngineEventBus } = await import(join(root, 'dist/engine/events/EngineEventBus.js'));
  const { createPlantasiaEngine } = await import(join(root, 'dist/public.js'));

  const bus = new EngineEventBus();
  const received = [];
  const unsub = bus.on('controlChanged', (payload) => received.push(payload));
  bus.emit('controlChanged', { control: 'bloom', value: 0.5, speciesId: 'seed' });
  assert(received.length === 1, 'bus delivers controlChanged');
  unsub();
  bus.emit('controlChanged', { control: 'bloom', value: 0.6, speciesId: 'seed' });
  assert(received.length === 1, 'unsubscribe works');

  const engine = createPlantasiaEngine();
  assert(typeof engine.on === 'function', 'facade exposes on()');
  assert(typeof engine.events === 'object', 'facade exposes events bus');

  const events = [];
  engine.on('speciesChanged', (payload) => events.push(['speciesChanged', payload]));
  engine.on('controlChanged', (payload) => events.push(['controlChanged', payload]));
  engine.on('notePlayed', (payload) => events.push(['notePlayed', payload]));

  await engine.loadPreset('plantasonic');
  assert(events.some(([name, p]) => name === 'speciesChanged' && p.speciesId === 'seed'), 'loadPreset emits speciesChanged');
  assert(
    events.some(([name, p]) => name === 'speciesChanged' && p.presetId === 'plantasonic'),
    'loadPreset includes presetId',
  );

  const controlEventsBefore = events.filter(([name]) => name === 'controlChanged').length;
  engine.setControl('growth', 0.42);
  assert(events.length > controlEventsBefore, 'setControl emits controlChanged');

  engine.registerSpecies(() => ({
    metadata: {
      id: 'custom.event-test',
      name: 'Event Test',
      concept: 'x',
      description: 'x',
      inspiration: ['x'],
      character: ['x'],
    },
    initialize: async () => {},
    start: async () => {},
    stop: () => {},
    noteOn: () => {},
    noteOff: () => {},
    allNotesOff: () => {},
    setControl: () => {},
    dispose: () => {},
  }));
  await engine.loadSpecies('custom.event-test');
  await engine.start();
  engine.noteOn('C4', 0.8);
  assert(events.some(([name, p]) => name === 'notePlayed' && p.source === 'host' && p.note === 'C4'), 'host noteOn emits notePlayed');

  engine.dispose();
  console.log('[test-events] OK — event bus validated');
}

main().catch((err) => {
  console.error('[test-events]', err.message ?? err);
  process.exit(1);
});
