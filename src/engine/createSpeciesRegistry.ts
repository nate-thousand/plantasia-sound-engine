import { SpeciesRegistry } from './registry/SpeciesRegistry.js';
import {
  registerBuiltinSpecies,
  registerFutureSpecies,
} from '../species/registerBuiltinSpecies.js';

export type CreateSpeciesRegistryOptions = {
  /** Register coming_soon placeholder metadata (default: false). */
  includeFuture?: boolean;
};

/** Create a registry with built-in playable species (optional future placeholders). */
export function createSpeciesRegistry(options: CreateSpeciesRegistryOptions = {}): SpeciesRegistry {
  const { includeFuture = false } = options;
  const registry = new SpeciesRegistry();
  registerBuiltinSpecies(registry);
  if (includeFuture) {
    registerFutureSpecies(registry);
  }
  return registry;
}
