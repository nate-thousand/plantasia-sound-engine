import type { SoundWorld, SoundWorldMetadata, SpeciesId } from '../SoundWorld.js';
import { assertCustomSpeciesId } from '../reservedSpeciesIds.js';
import { assertValidSpecies, SpeciesValidationError } from './Validation.js';

export type SpeciesFactory = () => SoundWorld;

export type SpeciesRegistration = {
  factory: SpeciesFactory;
  /** Engine bootstrap only — allows reserved built-in IDs. */
  builtin?: boolean;
};

export class DuplicateSpeciesError extends Error {
  readonly speciesId: SpeciesId;

  constructor(id: SpeciesId) {
    super(`Species "${id}" is already registered`);
    this.name = 'DuplicateSpeciesError';
    this.speciesId = id;
  }
}

/**
 * Central registry for Sound World plugins.
 * Prevents duplicate IDs, validates on registration, and exposes discovery APIs.
 */
export class SpeciesRegistry {
  private factories = new Map<SpeciesId, SpeciesFactory>();
  private metadataCache = new Map<SpeciesId, SoundWorldMetadata>();

  /** Register a Sound World factory. Validates before accepting. */
  register(registration: SpeciesRegistration): void;
  /** Convenience — register a pre-built instance (wraps as factory; do not dispose on switch). */
  register(world: SoundWorld): void;
  register(input: SpeciesRegistration | SoundWorld): void {
    if ('metadata' in input && typeof input.initialize === 'function') {
      this.registerInstance(input as SoundWorld, false);
      return;
    }

    const { factory, builtin = false } = input as SpeciesRegistration;
    this.registerFactory(factory, builtin);
  }

  private registerInstance(world: SoundWorld, builtin: boolean): void {
    const id = world.metadata.id;
    if (!builtin) {
      assertCustomSpeciesId(id);
    }
    if (this.factories.has(id)) {
      throw new DuplicateSpeciesError(id);
    }

    assertValidSpecies(world);

    this.factories.set(id, () => world);
    this.metadataCache.set(id, { ...world.metadata });
  }

  private registerFactory(factory: SpeciesFactory, builtin: boolean): void {
    let preview: SoundWorld;
    try {
      preview = factory();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new SpeciesValidationError(
        `Species factory threw during registration: ${message}`,
        [`factory() threw: ${message}`],
      );
    }

    const id = preview.metadata?.id;
    if (!id) {
      throw new SpeciesValidationError('Species factory must return metadata.id', [
        'metadata.id is missing',
      ]);
    }

    if (!builtin) {
      assertCustomSpeciesId(id);
    }
    if (this.factories.has(id)) {
      throw new DuplicateSpeciesError(id);
    }

    assertValidSpecies(preview);

    this.factories.set(id, factory);
    this.metadataCache.set(id, { ...preview.metadata });
    preview.dispose();
  }

  has(id: SpeciesId): boolean {
    return this.factories.has(id);
  }

  getMetadata(id: SpeciesId): SoundWorldMetadata | undefined {
    return this.metadataCache.get(id);
  }

  /** All registered species metadata. Every registered species is playable. */
  list(): SoundWorldMetadata[] {
    return Array.from(this.metadataCache.values());
  }

  /** Same as {@link list}; kept for callers of the older name. */
  listActive(): SoundWorldMetadata[] {
    return this.list();
  }

  ids(): SpeciesId[] {
    return Array.from(this.factories.keys());
  }

  create(id: SpeciesId): SoundWorld {
    const factory = this.factories.get(id);
    if (!factory) {
      throw new Error(`Unknown species: ${id}`);
    }
    return factory();
  }

  clear(): void {
    this.factories.clear();
    this.metadataCache.clear();
  }
}
