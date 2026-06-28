import { SpeciesManager, DEFAULT_SPECIES_ID } from './SpeciesManager.js';
import {
  registerBuiltinSpecies,
  registerFutureSpecies,
} from '../species/registerBuiltinSpecies.js';

export { DEFAULT_SPECIES_ID };

export type CreateSpeciesManagerOptions = {
  /** Register coming_soon placeholder metadata (default: false). */
  includeFuture?: boolean;
};

/** Create a SpeciesManager with built-in playable species registered. */
export function createSpeciesManager(options: CreateSpeciesManagerOptions = {}): SpeciesManager {
  const { includeFuture = false } = options;
  const manager = new SpeciesManager();
  registerBuiltinSpecies(manager.getRegistry());
  if (includeFuture) {
    registerFutureSpecies(manager.getRegistry());
  }
  return manager;
}

/** Load the default Seed Sound World on a manager (call after audio context is ready). */
export async function loadDefaultSpecies(
  manager: SpeciesManager,
  context?: unknown,
): Promise<void> {
  await manager.loadSpecies(DEFAULT_SPECIES_ID, context);
}
