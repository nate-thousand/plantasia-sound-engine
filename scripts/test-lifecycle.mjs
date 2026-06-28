#!/usr/bin/env node
/**
 * Lifecycle contract validation — explicit states, throws, control scale, reserved IDs.
 */
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function createMockSoundWorld(id) {
  let started = false;
  const notes = [];
  return {
    metadata: {
      id,
      name: id,
      concept: 'Mock',
      description: 'Lifecycle test double.',
      inspiration: ['test'],
      character: ['mock'],
    },
    initialize: async () => {},
    start: () => {
      started = true;
    },
    stop: () => {
      started = false;
    },
    noteOn: (note) => {
      if (!started) {
        throw new Error('mock noteOn without start');
      }
      notes.push(note);
    },
    noteOff: () => {},
    allNotesOff: () => {},
    setControl: () => {},
    dispose: () => {},
    notes,
  };
}

async function main() {
  const { SpeciesManager, EngineLifecycleError, EcologyControlScaleError, ReservedSpeciesIdError } =
    await import(join(root, 'dist/engine/index.js'));
  const { createSpeciesManager } = await import(join(root, 'dist/engine/createSpeciesManager.js'));

  const manager = new SpeciesManager();
  assert(manager.getState() === 'idle', 'initial state is idle');

  // noteOn before load throws
  let noteBeforeLoad = false;
  try {
    manager.noteOn('C4');
  } catch (error) {
    noteBeforeLoad = error instanceof EngineLifecycleError && error.code === 'NO_SPECIES_LOADED';
  }
  assert(noteBeforeLoad, 'noteOn before load throws NO_SPECIES_LOADED');

  // start before load throws
  let startBeforeLoad = false;
  try {
    await manager.start();
  } catch (error) {
    startBeforeLoad = error instanceof EngineLifecycleError && error.code === 'NO_SPECIES_LOADED';
  }
  assert(startBeforeLoad, 'start before load throws NO_SPECIES_LOADED');

  const mock = createMockSoundWorld('custom.lifecycle-test');
  manager.register(mock);
  await manager.loadSpecies('custom.lifecycle-test');
  assert(manager.getState() === 'loaded', 'load transitions to loaded');

  // noteOn before start throws
  let noteBeforeStart = false;
  try {
    manager.noteOn('C4');
  } catch (error) {
    noteBeforeStart = error instanceof EngineLifecycleError && error.code === 'ENGINE_NOT_STARTED';
  }
  assert(noteBeforeStart, 'noteOn before start throws');

  await manager.start();
  assert(manager.getState() === 'running', 'start transitions to running');
  manager.noteOn('C4');
  assert(mock.notes.includes('C4'), 'noteOn works when running');

  // idempotent start
  await manager.start();
  assert(manager.getState() === 'running', 'start is idempotent when running');

  manager.stop();
  assert(manager.getState() === 'loaded', 'stop transitions to loaded');

  // idempotent stop
  manager.stop();
  assert(manager.getState() === 'loaded', 'stop is idempotent when loaded');

  // allNotesOff idempotent when loaded
  manager.allNotesOff();

  // reload while running stops first
  const mock2 = createMockSoundWorld('custom.lifecycle-test-2');
  manager.register(mock2);
  await manager.start();
  await manager.loadSpecies('custom.lifecycle-test-2');
  assert(manager.getState() === 'loaded', 'reload from running lands in loaded');

  // dispose is terminal
  manager.dispose();
  assert(manager.getState() === 'disposed', 'dispose transitions to disposed');

  let loadAfterDispose = false;
  try {
    await manager.loadSpecies('custom.lifecycle-test-2');
  } catch (error) {
    loadAfterDispose = error instanceof EngineLifecycleError && error.code === 'ENGINE_DISPOSED';
  }
  assert(loadAfterDispose, 'loadSpecies after dispose throws');

  // control scale enforcement
  const manager2 = new SpeciesManager();
  manager2.register(createMockSoundWorld('custom.scale-test'));
  let scaleError = false;
  try {
    manager2.setControl('growth', 75);
  } catch (error) {
    scaleError = error instanceof EcologyControlScaleError;
  }
  assert(scaleError, 'setControl rejects 0–100 values at boundary');

  // reserved built-in IDs
  const manager3 = new SpeciesManager();
  let reservedError = false;
  try {
    manager3.register(createMockSoundWorld('seed'));
  } catch (error) {
    reservedError = error instanceof ReservedSpeciesIdError;
  }
  assert(reservedError, 'custom registration cannot use reserved seed id');

  // default manager: playable only
  const builtin = createSpeciesManager();
  assert(builtin.getAvailableSpecies().length === 4, 'default manager lists four playable species');
  assert(builtin.getUpcomingSpecies().length === 0, 'no upcoming without includeFuture');

  const withFuture = createSpeciesManager({ includeFuture: true });
  assert(withFuture.getUpcomingSpecies().length > 0, 'includeFuture registers placeholders');

  builtin.dispose();
  withFuture.dispose();

  console.log('[test-lifecycle] OK — lifecycle contract validated');
}

main().catch((err) => {
  console.error('[test-lifecycle]', err.message ?? err);
  process.exit(1);
});
