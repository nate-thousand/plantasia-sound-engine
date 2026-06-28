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
  const { ReservedSpeciesIdError } = await import(join(root, 'dist/engine/reservedSpeciesIds.js'));
  const { createStubSoundWorld } = await import(
    join(root, 'dist/engine/registry/SpeciesRegistry.js')
  );
  const { registerBuiltinSpecies, registerFutureSpecies } = await import(
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
  registerFutureSpecies(registry);

  assert(registry.has('seed'), 'seed registered');
  assert(registry.has('canopy'), 'future canopy registered');
  assert(registry.list().length === 4 + FUTURE_SPECIES_METADATA.length, 'all species count');

  const active = registry.listActive();
  assert(active.length === 4, 'four active species');
  assert(active.every((m) => m.status === 'active' || m.status === undefined), 'active status');

  const upcoming = registry.listUpcoming();
  assert(upcoming.length === FUTURE_SPECIES_METADATA.length, 'future placeholders listed');

  const stubMetadata = (id) => ({
    id,
    name: 'Stub',
    concept: 'x',
    description: 'x',
    inspiration: ['x'],
    character: ['x'],
    status: 'coming_soon',
  });

  // Duplicate registration
  registry.register({ factory: () => createStubSoundWorld(stubMetadata('custom.duplicate-test')) });
  let duplicateCaught = false;
  try {
    registry.register({ factory: () => createStubSoundWorld(stubMetadata('custom.duplicate-test')) });
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

  // Reserved built-in ID
  let reservedCaught = false;
  try {
    registry.register({
      factory: () => createStubSoundWorld(stubMetadata('seed')),
    });
  } catch (error) {
    reservedCaught = error instanceof ReservedSpeciesIdError;
  }
  assert(reservedCaught, 'reserved built-in ID rejected for custom registration');

  // Manager loads active species
  const manager = createSpeciesManager({ includeFuture: true });
  assert(manager.getAvailableSpecies().length === 4, 'manager playable list');
  assert(manager.getAllRegisteredSpecies().length === 4 + FUTURE_SPECIES_METADATA.length, 'manager full list');

  await manager.loadSpecies('flowers');
  assert(manager.getCurrentSpecies()?.id === 'flowers', 'flowers loaded');
  assert(manager.getState() === 'loaded', 'loaded state after loadSpecies');

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
