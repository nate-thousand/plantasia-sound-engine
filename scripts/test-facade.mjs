#!/usr/bin/env node
/**
 * Phase 18 — unified PlantasiaEngine facade validation.
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
  const facade = await import(join(root, 'dist/public.js'));
  const full = await import(join(root, 'dist/index.js'));

  for (const name of [
    'createPlantasiaEngine',
    'resolvePresetToSpecies',
    'PRESET_SPECIES_MAP',
    'createSeedSoundWorld',
  ]) {
    assert(typeof facade[name] !== 'undefined', `public export missing: ${name}`);
  }

  assert(typeof full.createPlantasiaEngine === 'function', 'root still exports facade');
  assert(typeof full.resolvePresetToSpecies === 'function', 'root exports resolvePresetToSpecies');

  const resolution = facade.resolvePresetToSpecies('plantasonic');
  assert(resolution.speciesId === 'seed', 'plantasonic maps to seed');
  assert(resolution.presetId === 'plantasonic', 'canonical preset id');
  assert(resolution.ecology.growth >= 0 && resolution.ecology.growth <= 1, 'ecology normalized');

  const moss = facade.resolvePresetToSpecies('moss');
  assert(moss.presetId === 'seed', 'moss alias resolves to seed preset');
  assert(moss.speciesId === 'seed', 'moss maps to seed species');

  const engine = facade.createPlantasiaEngine();
  assert(engine.getAvailableSpecies().length === 4, 'four playable species');
  assert(engine.getState() === 'idle', 'initial idle state');

  await engine.loadPreset('mycelium');
  assert(engine.getCurrentSpecies()?.id === 'bacteria', 'loadPreset loads mapped species');
  assert(engine.getState() === 'loaded', 'loaded after loadPreset');

  engine.registerSpecies(() => ({
    metadata: {
      id: 'custom.facade-test',
      name: 'Facade Test',
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

  await engine.loadSpecies('custom.facade-test');
  assert(engine.getCurrentSpecies()?.id === 'custom.facade-test', 'registerSpecies works');

  let noteBeforeStart = false;
  try {
    engine.noteOn('C4');
  } catch (error) {
    noteBeforeStart = error?.name === 'EngineLifecycleError';
  }
  assert(noteBeforeStart, 'facade noteOn before start throws');

  assert(typeof engine.initialize === 'function', 'initialize alias exists');
  assert(typeof engine.loadSpecies === 'function', 'loadSpecies on facade');
  assert(typeof engine.setControl === 'function', 'setControl on facade');

  engine.dispose();
  console.log('[test-facade] OK — unified facade validated');
}

main().catch((err) => {
  console.error('[test-facade]', err.message ?? err);
  process.exit(1);
});
