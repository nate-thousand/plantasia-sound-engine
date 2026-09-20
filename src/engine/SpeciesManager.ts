import type { EcologicalControl, SpeciesId, SoundWorld, SoundWorldMetadata, SoundWorldStartOptions } from './SoundWorld.js';
import { ECOLOGICAL_CONTROLS, EcologyControls, toSpeciesControlValue, type EcologyControlState } from './EcologyControls.js';
import type { ModulationFrame } from './modulation/types.js';
import type { GenerativePreferences } from './generative/types.js';
import { assertNormalizedEcologyValue } from './EcologyControlScaleError.js';
import {
  assertEngineRunning,
  assertNotDisposed,
  assertSpeciesLoaded,
  type EngineState,
} from './EngineLifecycle.js';
import { SpeciesLoader } from './registry/SpeciesLoader.js';
import { SpeciesRegistry } from './registry/SpeciesRegistry.js';
import type { EngineEventBus } from './events/EngineEventBus.js';
import { readSoundWorldContext, type SoundWorldContext } from './SoundWorldContext.js';
import { createEngineScheduler, type EngineScheduler } from './scheduler/EngineScheduler.js';

/** Default species loaded by {@link createSpeciesManager} integrations. */
export const DEFAULT_SPECIES_ID: SpeciesId = 'seed';

export type SpeciesManagerOptions = {
  events?: EngineEventBus;
  scheduler?: EngineScheduler;
};

export class SpeciesManager {
  private readonly registry: SpeciesRegistry;
  private readonly loader: SpeciesLoader;
  private readonly ecologyControls = new EcologyControls();
  private readonly events?: EngineEventBus;
  private readonly rootScheduler?: EngineScheduler;
  private speciesScheduler: EngineScheduler | null = null;
  private state: EngineState = 'idle';
  /** Host generative preference overrides, merged over every species' defaults on load (decision 10 for 1.1.0). */
  private generativePreferences: Partial<GenerativePreferences> = {};
  private polyphonyCap: number | null = null;

  constructor(registry?: SpeciesRegistry, options: SpeciesManagerOptions = {}) {
    this.registry = registry ?? new SpeciesRegistry();
    this.loader = new SpeciesLoader(this.registry);
    this.events = options.events;
    this.rootScheduler = options.scheduler;
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

  /** Per-species scheduler scope (cleared on species switch). */
  getSpeciesScheduler(): EngineScheduler | null {
    return this.speciesScheduler;
  }

  /** Register a Sound World plugin. Validates before accepting. */
  register(world: SoundWorld): void {
    this.registry.register(world);
  }

  /** Register via factory — preferred for plugin authors. */
  registerFactory(factory: () => SoundWorld): void {
    this.registry.register({ factory });
  }

  /** Every registered species; a registered species is playable. */
  getAvailableSpecies(): SoundWorldMetadata[] {
    return this.registry.listActive();
  }

  /** Alias for {@link getAvailableSpecies}. */
  getActiveSpecies(): SoundWorldMetadata[] {
    return this.getAvailableSpecies();
  }


  /** All registered species metadata. Same as {@link getAvailableSpecies}; kept for callers of the older name. */
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

  async loadSpecies(id: SpeciesId, context?: unknown, emitOptions?: { presetId?: string }): Promise<void> {
    assertNotDisposed(this.state, 'loadSpecies()');

    if (this.state === 'running') {
      this.loader.getCurrent()?.stop();
      this.state = 'loaded';
    }

    const previousSpeciesId = this.loader.getCurrentMetadata()?.id ?? null;
    this.resetSpeciesScheduler();

    const mergedContext = this.mergeLoadContext(context);
    await this.loader.load(id, mergedContext);
    const active = this.loader.getCurrent();
    if (active) {
      this.ecologyControls.applyTo(active);
      if (Object.keys(this.generativePreferences).length > 0) {
        active.setGenerativePreferences?.(this.generativePreferences);
      }
      if (this.polyphonyCap !== null) {
        active.setPolyphony?.(this.polyphonyCap);
      }
      this.state = 'loaded';
      this.events?.emit('speciesChanged', {
        speciesId: id,
        previousSpeciesId,
        presetId: emitOptions?.presetId,
      });
    }
  }

  /** Awaits species audio readiness before transitioning to `running`. */
  async start(options?: SoundWorldStartOptions): Promise<void> {
    assertSpeciesLoaded(this.state, 'start()');
    if (this.state === 'running') {
      return;
    }
    const current = this.loader.getCurrent();
    if (current) {
      await Promise.resolve(current.start(options));
    }
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
    const speciesId = this.loader.getCurrentMetadata()?.id ?? null;
    this.events?.emit('notePlayed', { note, velocity, source: 'host', speciesId });
    this.loader.getCurrent()?.noteOn(note, velocity);
  }

  noteOff(note: string): void {
    assertSpeciesLoaded(this.state, 'noteOff()');
    const speciesId = this.loader.getCurrentMetadata()?.id ?? null;
    this.events?.emit('noteReleased', { note, source: 'host', speciesId });
    this.loader.getCurrent()?.noteOff(note);
  }

  allNotesOff(): void {
    if (this.state === 'idle' || this.state === 'disposed') {
      return;
    }
    this.loader.getCurrent()?.allNotesOff();
  }

  /** Current normalized value (0..1) of an ecological control. */
  getControl(control: EcologicalControl): number {
    return this.ecologyControls.get(control);
  }

  /** Store host preference overrides and apply them to the loaded species. */
  setGenerativePreferences(partial: Partial<GenerativePreferences>): void {
    this.generativePreferences = { ...this.generativePreferences, ...partial };
    this.loader.getCurrent()?.setGenerativePreferences?.(partial);
  }

  /** Effective preferences of the loaded species, or the overrides alone when none is loaded. */
  getGenerativePreferences(): Partial<GenerativePreferences> {
    const active = this.loader.getCurrent();
    return active?.getGenerativePreferences?.() ?? { ...this.generativePreferences };
  }

  /** Host voice cap, applied to the loaded species now and to every later load. */
  setPolyphony(voices: number | null): void {
    if (voices !== null && (!Number.isInteger(voices) || voices < 1 || voices > 64)) {
      throw new RangeError(`setPolyphony expects an integer 1..64 or null, got ${voices}`);
    }
    this.polyphonyCap = voices;
    this.loader.getCurrent()?.setPolyphony?.(voices);
  }

  getPolyphony(): number | null {
    return this.polyphonyCap;
  }

  /** Snapshot of every control's base value. */
  getControlState(): EcologyControlState {
    return { ...this.ecologyControls.getState() };
  }

  /** Hand a modulation frame to the loaded species, converted to its 0..100 scale. */
  applyModulation(frame: ModulationFrame, rampSec: number): void {
    const active = this.loader.getCurrent();
    if (!active?.applyModulation || this.state !== 'running') {
      return;
    }
    const controls = {} as Record<EcologicalControl, number>;
    for (const control of ECOLOGICAL_CONTROLS) {
      controls[control] = toSpeciesControlValue(frame.controls[control]);
    }
    active.applyModulation({ controls, targets: frame.targets, rampSec, routes: frame.routes });
  }

  /**
   * Set an ecological control (normalized 0–1).
   * Stored centrally and routed to the active species when present.
   * @throws EcologyControlScaleError when value is outside 0–1
   */
  setControl(control: EcologicalControl, value: number, rampSec?: number): void {
    assertNormalizedEcologyValue(value, control);
    this.ecologyControls.set(control, value);
    const active = this.loader.getCurrent();
    if (active) {
      active.setControl(control, toSpeciesControlValue(this.ecologyControls.get(control)), rampSec);
    }
    this.events?.emit('controlChanged', {
      control,
      value,
      speciesId: this.loader.getCurrentMetadata()?.id ?? null,
    });
  }

  dispose(): void {
    if (this.state === 'disposed') {
      return;
    }
    this.resetSpeciesScheduler();
    this.loader.disposeCurrent();
    this.registry.clear();
    this.ecologyControls.reset();
    this.state = 'disposed';
  }

  private resetSpeciesScheduler(): void {
    this.speciesScheduler?.dispose();
    this.speciesScheduler = this.rootScheduler?.createScope('species') ?? createEngineScheduler();
  }

  private mergeLoadContext(context: unknown): SoundWorldContext {
    const hostContext = readSoundWorldContext(context);
    const speciesId = (): SpeciesId | null => this.loader.getCurrentMetadata()?.id ?? null;
    return {
      ...hostContext,
      events: this.events?.createSink(speciesId) ?? hostContext.events,
      scheduler: this.speciesScheduler ?? hostContext.scheduler,
    };
  }
}
