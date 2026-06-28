import type { EcologicalControl, SpeciesId, SoundWorld, SoundWorldMetadata } from './SoundWorld.js';
import { EcologyControls, toSpeciesControlValue } from './EcologyControls.js';
import { SpeciesLoader } from './registry/SpeciesLoader.js';
import { SpeciesRegistry } from './registry/SpeciesRegistry.js';

/** Default species loaded by {@link createSpeciesManager} integrations. */
export const DEFAULT_SPECIES_ID: SpeciesId = 'seed';

export class SpeciesManager {
  private readonly registry: SpeciesRegistry;
  private readonly loader: SpeciesLoader;
  private readonly ecologyControls = new EcologyControls();

  constructor(registry?: SpeciesRegistry) {
    this.registry = registry ?? new SpeciesRegistry();
    this.loader = new SpeciesLoader(this.registry);
  }

  /** Access the underlying species registry (plugin discovery). */
  getRegistry(): SpeciesRegistry {
    return this.registry;
  }

  /** Access the species loader (lifecycle). */
  getLoader(): SpeciesLoader {
    return this.loader;
  }

  /** Register a Sound World plugin. Validates before accepting. */
  register(world: SoundWorld): void {
    this.registry.register(world);
  }

  /** Register via factory — preferred for plugin authors. */
  registerFactory(factory: () => SoundWorld): void {
    this.registry.register({ factory });
  }

  /** All registered species (including coming_soon). */
  getAvailableSpecies(): SoundWorldMetadata[] {
    return this.registry.list();
  }

  /** Only loadable active species. */
  getActiveSpecies(): SoundWorldMetadata[] {
    return this.registry.listActive();
  }

  /** Coming soon / disabled species. */
  getUpcomingSpecies(): SoundWorldMetadata[] {
    return this.registry.listUpcoming();
  }

  getCurrentSpecies(): SoundWorldMetadata | null {
    return this.loader.getCurrentMetadata();
  }

  /** Shared ecological control state (normalized 0–1). */
  getEcologyControls(): EcologyControls {
    return this.ecologyControls;
  }

  /** Load the default Seed Sound World. */
  async loadDefaultSpecies(context?: unknown): Promise<void> {
    await this.loadSpecies(DEFAULT_SPECIES_ID, context);
  }

  async loadSpecies(id: SpeciesId, context?: unknown): Promise<void> {
    await this.loader.load(id, context);
    const active = this.loader.getCurrent();
    if (active) {
      this.ecologyControls.applyTo(active);
    }
  }

  start(): void {
    this.loader.getCurrent()?.start();
  }

  stop(): void {
    this.loader.getCurrent()?.stop();
  }

  noteOn(note: string, velocity = 1): void {
    this.loader.getCurrent()?.noteOn(note, velocity);
  }

  noteOff(note: string): void {
    this.loader.getCurrent()?.noteOff(note);
  }

  allNotesOff(): void {
    this.loader.getCurrent()?.allNotesOff();
  }

  /**
   * Set an ecological control (normalized 0–1).
   * Stored centrally and routed to the active species when present.
   */
  setControl(control: EcologicalControl, value: number): void {
    this.ecologyControls.set(control, value);
    const active = this.loader.getCurrent();
    if (active) {
      active.setControl(control, toSpeciesControlValue(this.ecologyControls.get(control)));
    }
  }

  dispose(): void {
    this.loader.disposeCurrent();
    this.registry.clear();
    this.ecologyControls.reset();
  }
}
