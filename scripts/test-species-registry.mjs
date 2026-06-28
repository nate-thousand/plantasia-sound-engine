#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const { SpeciesRegistry, SpeciesValidationError, SpeciesNotLoadableError } = await import(
    join(root, 'dist/engine/registry/index.js')
  );
  const { createStubSoundWorld } = await import(
    join(root, 'dist/engine/registry/SpeciesRegistry.js')
  );
  const { registerBuiltinSpecies } = await import(
    join(root, 'dist/species/registerBuiltinSpecies.js')
  );
  const { FUTURE_SPECIES_METADATA } = await import(
    join(root, 'dist/species/future/metadata.js')
  );
  const { createSpeciesManager } = await import(
    join(root, 'dist/engine/createSpeciesManager.js')
  );

  const registry = new SpeciesRegistry();
  registerBuiltinSpecies(registry);

  assert(registry.has('seed'), 'seed registered');
  assert(registry.has('canopy'), 'future canopy registered');
  assert(registry.list().length === 4 + FUTURE_SPECIES_METADATA.length, 'all species count');

  const active = registry.listActive();
  assert(active.length === 4, 'four active species');
  assert(active.every((m) => m.status === 'active' || m.status === undefined), 'active status');

  const upcoming = registry.listUpcoming();
  assert(upcoming.length === FUTURE_SPECIES_METADATA.length, 'future placeholders listed');

  // Duplicate registration
  let duplicateCaught = false;
  try {
    registry.register({ factory: () => createStubSoundWorld(upcoming[0]) });
  } catch (error) {
    duplicateCaught = error.name === 'DuplicateSpeciesError';
  }
  assert(duplicateCaught, 'duplicate ID rejected');

  // Invalid species
  let invalidCaught = false;
  try {
    registry.register({
      factory: () =>
        createStubSoundWorld({
          id: 'INVALID ID',
          name: 'Bad',
          concept: 'x',
          description: 'x',
          inspiration: ['x'],
          character: ['x'],
          status: 'coming_soon',
        }),
    });
  } catch (error) {
    invalidCaught = error instanceof SpeciesValidationError;
    assert(error.issues.length > 0, 'validation issues listed');
  }
  assert(invalidCaught, 'invalid ID rejected');

  // Manager loads active species
  const manager = createSpeciesManager();
  assert(manager.getAvailableSpecies().length === 4 + FUTURE_SPECIES_METADATA.length, 'manager list');

  await manager.loadSpecies('flowers');
  assert(manager.getCurrentSpecies()?.id === 'flowers', 'flowers loaded');

  // coming_soon not loadable
  let notLoadable = false;
  try {
    await manager.loadSpecies('tundra');
  } catch (error) {
    notLoadable = error instanceof SpeciesNotLoadableError;
  }
  assert(notLoadable, 'coming_soon species rejected');

  manager.dispose();
  console.log('test-species-registry: ok');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
