import type { SpeciesRegistry } from '../engine/registry/SpeciesRegistry.js';
import { createSeedSoundWorld } from './seed/index.js';
import { createFlowersSoundWorld } from './flowers/index.js';
import { createMoldSoundWorld } from './mold/index.js';
import { createBacteriaSoundWorld } from './bacteria/index.js';
import { FUTURE_SPECIES_METADATA } from './future/metadata.js';

/**
 * Register all built-in Sound Worlds with the species registry.
 * Add new active species here — the engine core stays unchanged.
 */
export function registerBuiltinSpecies(registry: SpeciesRegistry): void {
  registry.register({ factory: createSeedSoundWorld });
  registry.register({ factory: createFlowersSoundWorld });
  registry.register({ factory: createMoldSoundWorld });
  registry.register({ factory: createBacteriaSoundWorld });

  for (const metadata of FUTURE_SPECIES_METADATA) {
    registry.registerPlaceholder(metadata);
  }
}
