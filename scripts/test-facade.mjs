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

  // Public tier (ROADMAP decision 5): what ships, and what does not.
  for (const name of [
    'createPlantasiaEngine',
    'presets',
    'getPresetById',
    'resolvePresetId',
    'createPlantasonicAdapter',
    'ECOLOGICAL_CONTROLS',
    'BAND_EDGES_HZ',
    'EngineLifecycleError',
  ]) {
    assert(typeof facade[name] !== 'undefined', `public export missing: ${name}`);
  }
  for (const name of ['resolvePresetToSpecies', 'PRESET_SPECIES_MAP', 'createSeedSoundWorld', 'EngineEventBus', 'Transport']) {
    assert(typeof facade[name] === 'undefined', `public export should be root only: ${name}`);
    assert(typeof full[name] !== 'undefined', `root export missing: ${name}`);
  }

  assert(typeof full.createPlantasiaEngine === 'function', 'root still exports facade');

  const resolution = full.resolvePresetToSpecies('plantasonic');
  assert(resolution.speciesId === 'seed', 'plantasonic maps to seed');
  assert(resolution.presetId === 'plantasonic', 'canonical preset id');
  assert(resolution.ecology.growth >= 0 && resolution.ecology.growth <= 1, 'ecology normalized');

  const moss = full.resolvePresetToSpecies('moss');
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

  // The twenty four public tier methods (decision 5) are all callable.
  const PUBLIC_METHODS = [
    'init', 'loadSpecies', 'loadDefaultSpecies', 'loadPreset', 'start', 'stop', 'dispose', 'getState',
    'noteOn', 'noteOff', 'allNotesOff', 'setControl', 'getControl', 'setTempo',
    'getCurrentSpecies', 'getAvailableSpecies', 'registerSpecies',
    'on', 'off', 'getAudioFeatures', 'getWaveform', 'getLevel', 'enableMidi',
  ];
  for (const name of PUBLIC_METHODS) {
    assert(typeof engine[name] === 'function', `public method missing: ${name}`);
  }
  assert(PUBLIC_METHODS.length === 23, 'twenty three methods plus createPlantasiaEngine');

  // 1.2 additions (decision 17 after 1.1.0): polyphony cap and enableMidi(inputId).
  for (const name of ['setPolyphony', 'getPolyphony']) {
    assert(typeof engine[name] === 'function', `public method missing: ${name}`);
  }
  assert(engine.getPolyphony() === null, 'no polyphony cap by default');
  engine.setPolyphony(4);
  assert(engine.getPolyphony() === 4, 'polyphony cap stored');
  let badPolyphony = false;
  try { engine.setPolyphony(0); } catch (err) { badPolyphony = err instanceof RangeError; }
  assert(badPolyphony, 'setPolyphony(0) throws RangeError');
  try { engine.setPolyphony(2.5); badPolyphony = false; } catch { badPolyphony = true; }
  assert(badPolyphony, 'setPolyphony(2.5) throws RangeError');
  await engine.loadSpecies('flowers');
  assert(engine.getPolyphony() === 4, 'polyphony cap survives a species switch');
  engine.setPolyphony(null);
  assert(engine.getPolyphony() === null, 'setPolyphony(null) removes the cap');
  assert(engine.enableMidi.length === 1, 'enableMidi takes an inputId');
  engine.setControl('bloom', 0.61);
  assert(Math.abs(engine.getControl('bloom') - 0.61) < 1e-9, 'getControl reads back setControl');
  assert(typeof engine.initialize === 'function', 'initialize alias kept on root instance');

  // v1 deprecation line (decision 15 after 1.1.0): one notice per session, on the first legacy call.
  const infos = [];
  const originalInfo = console.info;
  console.info = (...args) => infos.push(args.join(' '));
  try {
    engine.getMold();
    engine.getParameterMetadata();
    engine.getMold();
  } finally {
    console.info = originalInfo;
  }
  const notices = infos.filter((line) => line.includes('removed at 2.0'));
  assert(notices.length === 1, `one deprecation notice per session, got ${notices.length}`);
  assert(notices[0].includes('getMold()'), 'notice names the first legacy method called');

  engine.dispose();
  console.log('[test-facade] OK — unified facade validated');
}

main().catch((err) => {
  console.error('[test-facade]', err.message ?? err);
  process.exit(1);
});
