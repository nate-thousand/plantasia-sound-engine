import type { SpeciesRegistry } from '../engine/registry/SpeciesRegistry.js';
import { createSeedSoundWorld } from './seed/index.js';
import { createFlowersSoundWorld } from './flowers/index.js';
import { createMoldSoundWorld } from './mold/index.js';
import { createBacteriaSoundWorld } from './bacteria/index.js';
import { FUTURE_SPECIES_METADATA } from './future/metadata.js';

/**
 * Register the four playable built-in Sound Worlds.
 * Does not register `coming_soon` placeholders — use {@link registerFutureSpecies} for discovery docs.
 */
export function registerBuiltinSpecies(registry: SpeciesRegistry): void {
  registry.register({ factory: createSeedSoundWorld, builtin: true });
  registry.register({ factory: createFlowersSoundWorld, builtin: true });
  registry.register({ factory: createMoldSoundWorld, builtin: true });
  registry.register({ factory: createBacteriaSoundWorld, builtin: true });
}

/** Opt-in registration of future / coming_soon species metadata for discovery UIs. */
export function registerFutureSpecies(registry: SpeciesRegistry): void {
  for (const metadata of FUTURE_SPECIES_METADATA) {
    registry.registerPlaceholder(metadata, undefined, true);
  }
}
