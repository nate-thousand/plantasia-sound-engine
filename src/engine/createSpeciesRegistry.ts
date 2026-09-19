import { SpeciesRegistry } from './registry/SpeciesRegistry.js';
import { registerBuiltinSpecies } from '../species/registerBuiltinSpecies.js';

/** Create a registry with the built-in playable species. */
export function createSpeciesRegistry(): SpeciesRegistry {
  const registry = new SpeciesRegistry();
  registerBuiltinSpecies(registry);
  return registry;
}
