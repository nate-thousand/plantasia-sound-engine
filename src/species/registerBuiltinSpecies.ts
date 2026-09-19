import type { SpeciesRegistry } from '../engine/registry/SpeciesRegistry.js';
import { createSeedSoundWorld } from './seed/index.js';
import { createFlowersSoundWorld } from './flowers/index.js';
import { createMoldSoundWorld } from './mold/index.js';
import { createBacteriaSoundWorld } from './bacteria/index.js';

/**
 * Register the four playable built-in Sound Worlds.
 */
export function registerBuiltinSpecies(registry: SpeciesRegistry): void {
  registry.register({ factory: createSeedSoundWorld, builtin: true });
  registry.register({ factory: createFlowersSoundWorld, builtin: true });
  registry.register({ factory: createMoldSoundWorld, builtin: true });
  registry.register({ factory: createBacteriaSoundWorld, builtin: true });
}

