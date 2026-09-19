import type { SoundWorld, SoundWorldMetadata, SpeciesId } from '../SoundWorld.js';
import type { SpeciesRegistry } from './SpeciesRegistry.js';
import { assertValidSpecies, SpeciesValidationError } from './Validation.js';

export class SpeciesLoadError extends Error {
  readonly speciesId: SpeciesId;
  readonly cause: unknown;

  constructor(id: SpeciesId, cause: unknown) {
    const message = cause instanceof Error ? cause.message : String(cause);
    super(`Failed to load species "${id}": ${message}`);
    this.name = 'SpeciesLoadError';
    this.speciesId = id;
    this.cause = cause;
  }
}

/**
 * Instantiates species from the registry with dispose/load lifecycle management.
 */
export class SpeciesLoader {
  private registry: SpeciesRegistry;
  private current: SoundWorld | null = null;

  constructor(registry: SpeciesRegistry) {
    this.registry = registry;
  }

  getRegistry(): SpeciesRegistry {
    return this.registry;
  }

  getCurrent(): SoundWorld | null {
    return this.current;
  }

  getCurrentMetadata(): SoundWorldMetadata | null {
    return this.current?.metadata ?? null;
  }

  /** Dispose the currently loaded species without loading a replacement. */
  disposeCurrent(): void {
    if (this.current) {
      try {
        this.current.stop();
      } catch {
        // Best-effort stop before dispose
      }
      this.current.dispose();
      this.current = null;
    }
  }

  /**
   * Load a species by ID — disposes previous, validates, initializes.
   * @throws SpeciesLoadError on factory or initialize failures
   */
  async load(id: SpeciesId, context?: unknown): Promise<SoundWorld> {
    const metadata = this.registry.getMetadata(id);
    if (!metadata) {
      throw new Error(`Unknown species: ${id}`);
    }

    this.disposeCurrent();

    let instance: SoundWorld;
    try {
      instance = this.registry.create(id);
    } catch (error) {
      throw new SpeciesLoadError(id, error);
    }

    try {
      assertValidSpecies(instance);
    } catch (error) {
      instance.dispose();
      throw error instanceof SpeciesValidationError
        ? error
        : new SpeciesLoadError(id, error);
    }

    try {
      await instance.initialize(context);
    } catch (error) {
      instance.dispose();
      throw new SpeciesLoadError(id, error);
    }

    this.current = instance;
    return instance;
  }
}
