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
  const { SpeciesRegistry, SpeciesValidationError } = await import(
    join(root, 'dist/engine/registry/index.js')
  );
  const { ReservedSpeciesIdError } = await import(join(root, 'dist/engine/reservedSpeciesIds.js'));
  const { registerBuiltinSpecies } = await import(
    join(root, 'dist/species/registerBuiltinSpecies.js')
  );
  const { createSpeciesManager } = await import(
    join(root, 'dist/engine/createSpeciesManager.js')
  );

  const registry = new SpeciesRegistry();
  registerBuiltinSpecies(registry);

  assert(registry.has('seed'), 'seed registered');
  assert(!registry.has('canopy'), 'no placeholder species (ROADMAP decision 9)');
  assert(registry.list().length === 4, 'four species, all playable');
  assert(registry.listActive().length === 4, 'listActive equals list');
  assert(typeof registry.listUpcoming === 'undefined', 'listUpcoming removed');
  assert(typeof registry.registerPlaceholder === 'undefined', 'registerPlaceholder removed');
  assert(registry.list().every((m) => !('status' in m)), 'metadata carries no status field');

  const world = (id) => ({
    metadata: { id, name: 'Test', concept: 'x', description: 'x', inspiration: ['x'], character: ['x'] },
    initialize: async () => {},
    start: () => {},
    stop: () => {},
    noteOn: () => {},
    noteOff: () => {},
    allNotesOff: () => {},
    setControl: () => {},
    dispose: () => {},
  });

  // Duplicate registration
  registry.register({ factory: () => world('custom.duplicate-test') });
  let duplicateCaught = false;
  try {
    registry.register({ factory: () => world('custom.duplicate-test') });
  } catch (error) {
    duplicateCaught = error.name === 'DuplicateSpeciesError';
  }
  assert(duplicateCaught, 'duplicate ID rejected');

  // Invalid species id
  let invalidCaught = false;
  try {
    registry.register({ factory: () => world('INVALID ID') });
  } catch (error) {
    invalidCaught = error instanceof SpeciesValidationError;
    assert(error.issues.length > 0, 'validation issues listed');
  }
  assert(invalidCaught, 'invalid ID rejected');

  // Incomplete species (missing methods) is rejected: nothing half built gets registered
  let incompleteCaught = false;
  try {
    const partial = world('custom.partial');
    delete partial.noteOn;
    registry.register({ factory: () => partial });
  } catch (error) {
    incompleteCaught = error instanceof SpeciesValidationError;
  }
  assert(incompleteCaught, 'incomplete species rejected');

  // Reserved built-in ID
  let reservedCaught = false;
  try {
    registry.register({ factory: () => world('seed') });
  } catch (error) {
    reservedCaught = error instanceof ReservedSpeciesIdError;
  }
  assert(reservedCaught, 'reserved built-in ID rejected for custom registration');

  // Former placeholder ids are free for third parties now
  registry.register({ factory: () => world('custom.tundra') });
  assert(registry.has('custom.tundra'), 'namespaced id accepted');

  // Manager
  const manager = createSpeciesManager();
  assert(manager.getAvailableSpecies().length === 4, 'manager playable list');
  assert(manager.getAllRegisteredSpecies().length === 4, 'manager full list equals playable list');
  assert(typeof manager.getUpcomingSpecies === 'undefined', 'getUpcomingSpecies removed');

  await manager.loadSpecies('flowers');
  assert(manager.getCurrentSpecies()?.id === 'flowers', 'flowers loaded');
  assert(manager.getState() === 'loaded', 'loaded state after loadSpecies');

  let unknownCaught = false;
  try {
    await manager.loadSpecies('tundra');
  } catch (error) {
    unknownCaught = /Unknown species/.test(error.message);
  }
  assert(unknownCaught, 'unregistered id throws Unknown species');

  manager.dispose();
  console.log('test-species-registry: ok');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
