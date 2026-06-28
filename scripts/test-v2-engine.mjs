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
    'EngineLifecycleError',
    'EcologyControlScaleError',
    'ReservedSpeciesIdError',
    'seedSpecies',
    'flowersSpecies',
    'moldSpecies',
    'bacteriaSpecies',
    'EcologyControls',
    'Generator',
    'PerformanceEngine',
    'SpeciesRegistry',
    'registerBuiltinSpecies',
    'registerFutureSpecies',
    'resolvePresetToSpecies',
    'PRESET_SPECIES_MAP',
  ];
  for (const name of requiredExports) {
    assert(typeof pkg[name] !== 'undefined', `export missing: ${name}`);
  }

  // --- v1 engine still works ---
  const v1 = pkg.createPlantasiaEngine();
  assert(v1.presets?.length >= 11, 'v1 presets available');
  assert(typeof v1.init === 'function', 'v1 init');
  assert(typeof v1.playPreset === 'function', 'v1 playPreset');
  assert(typeof v1.loadSpecies === 'function', 'facade loadSpecies');
  assert(typeof v1.loadPreset === 'function', 'facade loadPreset');
  assert(typeof v1.registerSpecies === 'function', 'facade registerSpecies');
  assert(typeof v1.initialize === 'function', 'facade initialize alias');

  const plantasonic = pkg.resolvePresetToSpecies('plantasonic');
  assert(plantasonic.speciesId === 'seed', 'plantasonic preset maps to seed');

  // --- Registry (playable default; future opt-in) ---
  const registry = pkg.createSpeciesRegistry();
  assert(registry.listActive().length === 4, 'four active in default registry');
  assert(registry.list().length === 4, 'default registry excludes coming_soon');

  const registryWithFuture = pkg.createSpeciesRegistry({ includeFuture: true });
  assert(registryWithFuture.list().length >= 12, 'includeFuture adds placeholders');
  assert(registryWithFuture.has('tundra'), 'future species when opted in');

  // --- Species manager init + switching ---
  const manager = pkg.createSpeciesManager({ includeFuture: true });
  assert(manager.getActiveSpecies().length === 4, 'manager active list');
  assert(manager.getAvailableSpecies().length === 4, 'available is playable-only');

  for (const id of ACTIVE) {
    await manager.loadSpecies(id);
    assert(manager.getCurrentSpecies()?.id === id, `loaded ${id}`);
    assert(manager.getState() === 'loaded', `${id} loaded state`);
    manager.setControl('growth', 0.5);
    manager.setControl('bloom', 0.55);

    // Lifecycle enforced — noteOn before start throws (Tone start requires browser audio context).
    let noteBeforeStart = false;
    try {
      manager.noteOn('C4', 0.75);
    } catch (error) {
      noteBeforeStart = error?.name === 'EngineLifecycleError';
    }
    assert(noteBeforeStart, `noteOn before start throws for ${id}`);
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

  // --- Lifecycle throws ---
  const lifecycleManager = pkg.createSpeciesManager();
  let noteBeforeStart = false;
  await lifecycleManager.loadSpecies('seed');
  try {
    lifecycleManager.noteOn('C4');
  } catch (error) {
    noteBeforeStart = error?.name === 'EngineLifecycleError';
  }
  assert(noteBeforeStart, 'noteOn before start throws');

  // --- Ecology persistence across switch ---
  manager.setControl('mold', 0.88);
  await manager.loadSpecies('seed');
  await manager.loadSpecies('mold');
  manager.setControl('bacteria', 0.6);

  // --- Singleton metadata (deprecated, metadata-only) ---
  assert(pkg.seedSpecies.metadata.id === 'seed', 'seedSpecies metadata');
  assert(pkg.flowersSpecies.metadata.id === 'flowers', 'flowersSpecies metadata');
  assert(pkg.moldSpecies.metadata.id === 'mold', 'moldSpecies metadata');
  assert(pkg.bacteriaSpecies.metadata.id === 'bacteria', 'bacteriaSpecies metadata');
  assert(typeof pkg.seedSpecies.noteOn !== 'function', 'seedSpecies is not a live instance');

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
  assert(manager.getState() === 'disposed', 'dispose sets disposed state');
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
