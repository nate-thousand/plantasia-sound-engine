import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertClose(actual, expected, message) {
  if (Math.abs(actual - expected) > 1e-9) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

function createMockSoundWorld(id = 'seed') {
  const applied = {};
  return {
    metadata: {
      id,
      name: id,
      concept: 'Mock species for ecology tests',
      description: 'Test double implementing SoundWorld.',
      inspiration: ['test'],
      character: ['mock'],
    },
    initialize: async () => {},
    start: () => {},
    stop: () => {},
    noteOn: () => {},
    noteOff: () => {},
    allNotesOff: () => {},
    setControl(control, value) {
      applied[control] = value;
    },
    dispose: () => {},
    applied,
  };
}

async function main() {
  const {
    EcologyControls,
    DEFAULT_ECOLOGY_STATE,
    ECOLOGICAL_CONTROLS,
    toSpeciesControlValue,
  } = await import(join(root, 'dist/engine/EcologyControls.js'));

  const { SpeciesManager } = await import(join(root, 'dist/engine/SpeciesManager.js'));

  // Default control state
  const controls = new EcologyControls();
  for (const key of ECOLOGICAL_CONTROLS) {
    assertClose(controls.get(key), DEFAULT_ECOLOGY_STATE[key], `default ${key}`);
  }

  // Setting each control
  controls.set('growth', 0.7);
  controls.set('bloom', 0.4);
  controls.set('roots', 0.6);
  controls.set('mold', 0.2);
  controls.set('bacteria', 0.5);
  assertClose(controls.get('growth'), 0.7, 'growth set');
  assertClose(controls.get('bloom'), 0.4, 'bloom set');
  assertClose(controls.get('roots'), 0.6, 'roots set');
  assertClose(controls.get('mold'), 0.2, 'mold set');
  assertClose(controls.get('bacteria'), 0.5, 'bacteria set');

  const state = controls.getState();
  assertClose(state.growth, 0.7, 'getState growth');
  assert(Object.keys(state).length === 5, 'getState has five controls');

  // Clamping
  controls.set('growth', -0.5);
  assertClose(controls.get('growth'), 0, 'clamp below 0');
  controls.set('bloom', 1.8);
  assertClose(controls.get('bloom'), 1, 'clamp above 1');

  // Reset
  controls.reset();
  for (const key of ECOLOGICAL_CONTROLS) {
    assertClose(controls.get(key), DEFAULT_ECOLOGY_STATE[key], `reset ${key}`);
  }

  // Apply to mock Sound World
  controls.set('growth', 0.75);
  controls.set('mold', 0.33);
  const mock = createMockSoundWorld();
  controls.applyTo(mock);
  assertClose(mock.applied.growth, toSpeciesControlValue(0.75), 'applyTo growth');
  assertClose(mock.applied.mold, toSpeciesControlValue(0.33), 'applyTo mold');
  assertClose(mock.applied.bloom, toSpeciesControlValue(DEFAULT_ECOLOGY_STATE.bloom), 'applyTo default bloom');

  // SpeciesManager: persist state when switching species
  const manager = new SpeciesManager();
  const seed = createMockSoundWorld('custom.ecology-seed');
  const flowers = createMockSoundWorld('custom.ecology-flowers');
  manager.register(seed);
  manager.register(flowers);

  manager.setControl('growth', 0.65);
  manager.setControl('bacteria', 0.8);

  await manager.loadSpecies('custom.ecology-seed');
  assertClose(seed.applied.growth, 65, 'seed loaded with persisted growth');
  assertClose(seed.applied.bacteria, 80, 'seed loaded with persisted bacteria');

  await manager.loadSpecies('custom.ecology-flowers');
  assertClose(flowers.applied.growth, 65, 'flowers loaded with persisted growth');
  assertClose(flowers.applied.bacteria, 80, 'flowers loaded with persisted bacteria');

  manager.setControl('bloom', 0.55);
  assertClose(flowers.applied.bloom, 55, 'flowers bloom after setControl');

  // Store when no species active — set before first load
  const manager2 = new SpeciesManager();
  const mold = createMockSoundWorld('custom.ecology-mold');
  manager2.register(mold);
  manager2.setControl('mold', 0.9);
  await manager2.loadSpecies('custom.ecology-mold');
  assertClose(mold.applied.mold, 90, 'deferred apply on first load');

  // Host boundary rejects 0–100 scale
  const { EcologyControlScaleError } = await import(join(root, 'dist/engine/EcologyControlScaleError.js'));
  let scaleRejected = false;
  try {
    manager2.setControl('growth', 75);
  } catch (error) {
    scaleRejected = error instanceof EcologyControlScaleError;
  }
  assert(scaleRejected, 'SpeciesManager rejects 0–100 control values');

  manager.dispose();
  manager2.dispose();

  console.info('[test-ecology-controls] OK — ecology control layer validated');
}

main().catch((error) => {
  console.error('[test-ecology-controls]', error.message ?? error);
  process.exit(1);
});
