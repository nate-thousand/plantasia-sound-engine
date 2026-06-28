import type { EcologicalControl, SpeciesId, SoundWorld, SoundWorldMetadata } from './SoundWorld.js';
import { EcologyControls, toSpeciesControlValue } from './EcologyControls.js';
import { assertNormalizedEcologyValue } from './EcologyControlScaleError.js';
import {
  assertEngineRunning,
  assertNotDisposed,
  assertSpeciesLoaded,
  type EngineState,
} from './EngineLifecycle.js';
import { SpeciesLoader } from './registry/SpeciesLoader.js';
import { SpeciesRegistry } from './registry/SpeciesRegistry.js';

/** Default species loaded by {@link createSpeciesManager} integrations. */
export const DEFAULT_SPECIES_ID: SpeciesId = 'seed';

export class SpeciesManager {
  private readonly registry: SpeciesRegistry;
  private readonly loader: SpeciesLoader;
  private readonly ecologyControls = new EcologyControls();
  private state: EngineState = 'idle';

  constructor(registry?: SpeciesRegistry) {
    this.registry = registry ?? new SpeciesRegistry();
    this.loader = new SpeciesLoader(this.registry);
  }

  /** Current lifecycle state (`idle` → `loaded` → `running`; `disposed` is terminal). */
  getState(): EngineState {
    return this.state;
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

  /** Playable species only (status `active`). Default host-facing discovery list. */
  getAvailableSpecies(): SoundWorldMetadata[] {
    return this.registry.listActive();
  }

  /** Alias for {@link getAvailableSpecies}. */
  getActiveSpecies(): SoundWorldMetadata[] {
    return this.getAvailableSpecies();
  }

  /** Coming soon / disabled species registered on this manager (empty unless future species were registered). */
  getUpcomingSpecies(): SoundWorldMetadata[] {
    return this.registry.listUpcoming();
  }

  /** All registered species metadata, including upcoming placeholders when registered. */
  getAllRegisteredSpecies(): SoundWorldMetadata[] {
    return this.registry.list();
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
    assertNotDisposed(this.state, 'loadSpecies()');

    if (this.state === 'running') {
      this.loader.getCurrent()?.stop();
      this.state = 'loaded';
    }

    await this.loader.load(id, context);
    const active = this.loader.getCurrent();
    if (active) {
      this.ecologyControls.applyTo(active);
      this.state = 'loaded';
    }
  }

  start(): void {
    assertSpeciesLoaded(this.state, 'start()');
    if (this.state === 'running') {
      return;
    }
    this.loader.getCurrent()?.start();
    this.state = 'running';
  }

  stop(): void {
    if (this.state !== 'running') {
      return;
    }
    this.loader.getCurrent()?.stop();
    this.state = 'loaded';
  }

  noteOn(note: string, velocity = 1): void {
    assertEngineRunning(this.state, 'noteOn()');
    this.loader.getCurrent()?.noteOn(note, velocity);
  }

  noteOff(note: string): void {
    assertSpeciesLoaded(this.state, 'noteOff()');
    this.loader.getCurrent()?.noteOff(note);
  }

  allNotesOff(): void {
    if (this.state === 'idle' || this.state === 'disposed') {
      return;
    }
    this.loader.getCurrent()?.allNotesOff();
  }

  /**
   * Set an ecological control (normalized 0–1).
   * Stored centrally and routed to the active species when present.
   * @throws EcologyControlScaleError when value is outside 0–1
   */
  setControl(control: EcologicalControl, value: number): void {
    assertNormalizedEcologyValue(value, control);
    this.ecologyControls.set(control, value);
    const active = this.loader.getCurrent();
    if (active) {
      active.setControl(control, toSpeciesControlValue(this.ecologyControls.get(control)));
    }
  }

  dispose(): void {
    if (this.state === 'disposed') {
      return;
    }
    this.loader.disposeCurrent();
    this.registry.clear();
    this.ecologyControls.reset();
    this.state = 'disposed';
  }
}
