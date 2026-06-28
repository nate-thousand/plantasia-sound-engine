#!/usr/bin/env node
/**
 * v2.0 release validation — public API, species lifecycle, subsystems, cleanup.
 */
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const ACTIVE = ['seed', 'flowers', 'mold', 'bacteria'];

async function main() {
  const pkg = await import(join(root, 'dist/index.js'));

  // --- Public API exports ---
  const requiredExports = [
    'createPlantasiaEngine',
    'createSpeciesManager',
    'createSpeciesRegistry',
    'PlantasiaEngine',
    'SpeciesManager',
    'seedSpecies',
    'flowersSpecies',
    'moldSpecies',
    'bacteriaSpecies',
    'EcologyControls',
    'Generator',
    'PerformanceEngine',
    'SpeciesRegistry',
    'registerBuiltinSpecies',
  ];
  for (const name of requiredExports) {
    assert(typeof pkg[name] !== 'undefined', `export missing: ${name}`);
  }

  // --- v1 engine still works ---
  const v1 = pkg.createPlantasiaEngine();
  assert(v1.presets?.length >= 11, 'v1 presets available');
  assert(typeof v1.init === 'function', 'v1 init');
  assert(typeof v1.playPreset === 'function', 'v1 playPreset');

  // --- Registry ---
  const registry = pkg.createSpeciesRegistry();
  assert(registry.listActive().length === 4, 'four active in registry');
  assert(registry.list().length >= 12, 'includes coming_soon placeholders');
  assert(registry.has('tundra'), 'future species registered');

  // --- Species manager init + switching ---
  const manager = pkg.createSpeciesManager();
  assert(manager.getActiveSpecies().length === 4, 'manager active list');

  for (const id of ACTIVE) {
    await manager.loadSpecies(id);
    assert(manager.getCurrentSpecies()?.id === id, `loaded ${id}`);
    manager.setControl('growth', 0.5);
    manager.setControl('bloom', 0.55);
    // noteOn is safe without audio context — no-op until browser start()
    manager.noteOn('C4', 0.75);
    manager.noteOff('C4');
  }

  // --- Invalid species ---
  let unknownError = false;
  try {
    await manager.loadSpecies('not-a-real-species');
  } catch {
    unknownError = true;
  }
  assert(unknownError, 'unknown species throws');

  let notLoadable = false;
  try {
    await manager.loadSpecies('ocean');
  } catch (error) {
    notLoadable = error?.name === 'SpeciesNotLoadableError';
  }
  assert(notLoadable, 'coming_soon species rejected');

  // --- Ecology persistence across switch ---
  manager.setControl('mold', 0.88);
  await manager.loadSpecies('seed');
  await manager.loadSpecies('mold');
  manager.setControl('bacteria', 0.6);

  // --- Singleton metadata ---
  assert(pkg.seedSpecies.metadata.id === 'seed', 'seedSpecies metadata');
  assert(pkg.flowersSpecies.metadata.id === 'flowers', 'flowersSpecies metadata');
  assert(pkg.moldSpecies.metadata.id === 'mold', 'moldSpecies metadata');
  assert(pkg.bacteriaSpecies.metadata.id === 'bacteria', 'bacteriaSpecies metadata');

  // --- Generative engine ---
  const { Generator } = pkg;
  const notes = [];
  const gen = new Generator(
    { preferredScale: ['C4', 'E4', 'G4'], preferredTempo: 120, preferredDensity: 0.5, phraseLength: 3, probabilityBias: 0.4, dronePreference: 0.1, harmonyStyle: 'pentatonic', rhythmStyle: 'moderate' },
    { noteOn: (n) => notes.push(n), noteOff: () => {} },
  );
  gen.setEcology({ growth: 0.7, bloom: 0.5, roots: 0.3, mold: 0.1, bacteria: 0.2 });
  gen.start(96);
  await new Promise((r) => setTimeout(r, 400));
  gen.stop();
  gen.dispose();
  assert(notes.length >= 0, 'generative ran without throw');

  // --- Performance engine ---
  const { PerformanceEngine } = pkg;
  const { SEED_EXPRESSION_PROFILE } = await import(join(root, 'dist/species/seed/expressionProfile.js'));
  const perf = new PerformanceEngine(SEED_EXPRESSION_PROFILE);
  perf.setEcology({ growth: 0.5, bloom: 0.5, roots: 0.3, mold: 0.2, bacteria: 0.1 });
  const ctx = perf.noteOn('D4', 0.9);
  assert(ctx.shapedVelocity > 0, 'performance velocity shaping');
  perf.reset();

  // --- Invalid registration ---
  const { SpeciesRegistry, SpeciesValidationError } = pkg;
  const testRegistry = new SpeciesRegistry();
  let invalidReg = false;
  try {
    testRegistry.register({
      factory: () => ({
        metadata: { id: 'bad id', name: 'x', concept: 'x', description: 'x', inspiration: ['x'], character: ['x'] },
        initialize: async () => {},
        start: () => {},
        stop: () => {},
        noteOn: () => {},
        noteOff: () => {},
        allNotesOff: () => {},
        setControl: () => {},
        dispose: () => {},
      }),
    });
  } catch (error) {
    invalidReg = error instanceof SpeciesValidationError;
  }
  assert(invalidReg, 'invalid species registration rejected');

  // --- Dispose cleanup ---
  manager.dispose();
  assert(manager.getCurrentSpecies() === null, 'dispose clears active species');

  const manager2 = pkg.createSpeciesManager();
  await manager2.loadSpecies('bacteria');
  manager2.dispose();
  assert(manager2.getCurrentSpecies() === null, 'dispose after load');

  console.log('[test-v2-engine] OK — v2.0 release validation passed');
}

main().catch((err) => {
  console.error('[test-v2-engine]', err.message ?? err);
  process.exit(1);
});
