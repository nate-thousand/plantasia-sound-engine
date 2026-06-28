import type { SoundWorld, SoundWorldMetadata, SpeciesId } from '../SoundWorld.js';
import { isSpeciesLoadable } from '../SoundWorld.js';
import { assertCustomSpeciesId } from '../reservedSpeciesIds.js';
import {
  assertValidPlaceholderMetadata,
  assertValidSpecies,
  SpeciesValidationError,
  validateMetadata,
} from './Validation.js';

export type SpeciesFactory = () => SoundWorld;

export type SpeciesRegistration = {
  factory: SpeciesFactory;
  /** When true, skip full SoundWorld validation (metadata-only placeholders). */
  placeholder?: boolean;
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

    const { factory, placeholder = false, builtin = false } = input as SpeciesRegistration;
    this.registerFactory(factory, placeholder, builtin);
  }

  private registerInstance(world: SoundWorld, builtin: boolean): void {
    const id = world.metadata.id;
    if (!builtin) {
      assertCustomSpeciesId(id);
    }
    if (this.factories.has(id)) {
      throw new DuplicateSpeciesError(id);
    }

    const status = world.metadata.status ?? 'active';
    if (status === 'coming_soon' || status === 'disabled') {
      assertValidPlaceholderMetadata(world.metadata);
    } else {
      assertValidSpecies(world);
    }

    this.factories.set(id, () => world);
    this.metadataCache.set(id, { ...world.metadata });
  }

  private registerFactory(factory: SpeciesFactory, placeholder: boolean, builtin: boolean): void {
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

    const status = preview.metadata.status ?? 'active';

    if (placeholder || status === 'coming_soon' || status === 'disabled') {
      assertValidPlaceholderMetadata({ ...preview.metadata, status: status === 'active' ? 'coming_soon' : status });
    } else {
      assertValidSpecies(preview);
    }

    this.factories.set(id, factory);
    this.metadataCache.set(id, { ...preview.metadata });
    preview.dispose();
  }

  /** Register metadata-only placeholder without a full SoundWorld factory. */
  registerPlaceholder(metadata: SoundWorldMetadata, factory?: SpeciesFactory, builtin = false): void {
    assertValidPlaceholderMetadata(metadata);
    if (!builtin) {
      assertCustomSpeciesId(metadata.id);
    }

    if (this.factories.has(metadata.id)) {
      throw new DuplicateSpeciesError(metadata.id);
    }

    const create =
      factory ??
      (() => createStubSoundWorld(metadata));

    this.factories.set(metadata.id, create);
    this.metadataCache.set(metadata.id, { ...metadata });
  }

  has(id: SpeciesId): boolean {
    return this.factories.has(id);
  }

  getMetadata(id: SpeciesId): SoundWorldMetadata | undefined {
    return this.metadataCache.get(id);
  }

  /** All registered species metadata (active, coming_soon, disabled). */
  list(): SoundWorldMetadata[] {
    return Array.from(this.metadataCache.values());
  }

  /** Only species with status `active` (loadable). */
  listActive(): SoundWorldMetadata[] {
    return this.list().filter(isSpeciesLoadable);
  }

  /** Species marked coming_soon or disabled. */
  listUpcoming(): SoundWorldMetadata[] {
    return this.list().filter((m) => !isSpeciesLoadable(m));
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

/** Minimal no-op SoundWorld for coming_soon placeholders. */
export function createStubSoundWorld(metadata: SoundWorldMetadata): SoundWorld {
  const meta: SoundWorldMetadata = {
    ...metadata,
    status: metadata.status ?? 'coming_soon',
  };

  const issues = validateMetadata(meta);
  if (issues.length > 0) {
    throw new SpeciesValidationError(
      `Invalid stub metadata: ${issues[0]}`,
      issues,
      meta.id,
    );
  }

  return {
    metadata: meta,
    initialize: async () => {},
    start: () => {},
    stop: () => {},
    noteOn: () => {},
    noteOff: () => {},
    allNotesOff: () => {},
    setControl: () => {},
    dispose: () => {},
  };
}
