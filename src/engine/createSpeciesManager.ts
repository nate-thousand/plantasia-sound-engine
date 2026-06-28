import { SpeciesManager, DEFAULT_SPECIES_ID } from './SpeciesManager.js';
import {
  registerBuiltinSpecies,
  registerFutureSpecies,
} from '../species/registerBuiltinSpecies.js';
import type { EngineEventBus } from './events/EngineEventBus.js';
import type { EngineScheduler } from './scheduler/EngineScheduler.js';

export { DEFAULT_SPECIES_ID };

export type CreateSpeciesManagerOptions = {
  /** Register coming_soon placeholder metadata (default: false). */
  includeFuture?: boolean;
  /** Shared semantic event bus (provided by {@link PlantasiaEngine}). */
  events?: EngineEventBus;
  /** Root scheduler (provided by {@link PlantasiaEngine}). */
  scheduler?: EngineScheduler;
};

/** Create a SpeciesManager with built-in playable species registered. */
export function createSpeciesManager(options: CreateSpeciesManagerOptions = {}): SpeciesManager {
  const { includeFuture = false, events, scheduler } = options;
  const manager = new SpeciesManager(undefined, { events, scheduler });
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
