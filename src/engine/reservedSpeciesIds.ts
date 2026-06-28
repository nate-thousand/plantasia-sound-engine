import type { SpeciesId } from './SoundWorld.js';
import { BUILTIN_ACTIVE_SPECIES } from './SoundWorld.js';
import { FUTURE_SPECIES_METADATA } from '../species/future/metadata.js';

/** Built-in species IDs reserved by the engine — custom plugins must not collide. */
export const RESERVED_BUILTIN_SPECIES_IDS: ReadonlySet<SpeciesId> = new Set([
  ...BUILTIN_ACTIVE_SPECIES,
  ...FUTURE_SPECIES_METADATA.map((metadata) => metadata.id),
]);

/** Recommended namespace prefixes for third-party species plugins. */
export const RECOMMENDED_SPECIES_ID_PREFIXES = ['plantasonic.', 'custom.'] as const;

export function isReservedBuiltinSpeciesId(id: SpeciesId): boolean {
  return RESERVED_BUILTIN_SPECIES_IDS.has(id);
}

/**
 * Thrown when registration uses a built-in species ID.
 * Use a namespaced ID (e.g. `plantasonic.my-species`) for custom plugins.
 */
export class ReservedSpeciesIdError extends Error {
  readonly speciesId: SpeciesId;

  constructor(id: SpeciesId) {
    super(
      `Species ID "${id}" is reserved for built-in Sound Worlds. ` +
        `Use a namespaced ID such as "plantasonic.${id}" or "custom.${id}".`,
    );
    this.name = 'ReservedSpeciesIdError';
    this.speciesId = id;
  }
}

export function assertCustomSpeciesId(id: SpeciesId): void {
  if (isReservedBuiltinSpeciesId(id)) {
    throw new ReservedSpeciesIdError(id);
  }
}
