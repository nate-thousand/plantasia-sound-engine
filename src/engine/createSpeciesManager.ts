import { SpeciesManager, DEFAULT_SPECIES_ID } from './SpeciesManager.js';
import { registerBuiltinSpecies } from '../species/registerBuiltinSpecies.js';

export { DEFAULT_SPECIES_ID };

/** Create a SpeciesManager with all built-in and placeholder species registered. */
export function createSpeciesManager(): SpeciesManager {
  const manager = new SpeciesManager();
  registerBuiltinSpecies(manager.getRegistry());
  return manager;
}

/** Load the default Seed Sound World on a manager (call after audio context is ready). */
export async function loadDefaultSpecies(
  manager: SpeciesManager,
  context?: unknown,
): Promise<void> {
  await manager.loadSpecies(DEFAULT_SPECIES_ID, context);
}
