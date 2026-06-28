import { SpeciesRegistry } from './registry/SpeciesRegistry.js';
import { registerBuiltinSpecies } from '../species/registerBuiltinSpecies.js';

/** Create a registry with all built-in active species and coming_soon placeholders. */
export function createSpeciesRegistry(): SpeciesRegistry {
  const registry = new SpeciesRegistry();
  registerBuiltinSpecies(registry);
  return registry;
}
