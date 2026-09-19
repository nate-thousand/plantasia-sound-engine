/**
 * The public tier of the engine (ROADMAP decision 5).
 *
 * This is the whole surface a host builds on: twenty four methods, the
 * shipped presets, and the events and features they produce. The root
 * export (`plantasia-sound-engine`) carries the same instance with the
 * legacy v1 preset methods on top; nothing is removed, but new hosts
 * should not need anything beyond this interface.
 */
import type { AudioFeatures } from './analysis/AudioAnalyser.js';
import type {
  ModulationDestination,
  ModulationRoute,
  ModulationRouteConfig,
  ModulationSourceDescriptor,
  ModulationState,
} from './modulation/types.js';
import type { EngineState } from './EngineLifecycle.js';
import type { EngineEventHandler, EngineEventName } from './events/EngineEventBus.js';
import type {
  EcologicalControl,
  SoundWorld,
  SoundWorldMetadata,
  SoundWorldStartOptions,
  SpeciesId,
} from './SoundWorld.js';

export interface PlantasiaEngineApi {
  // --- lifecycle ---

  /** Unlock the audio context. Call from a user gesture in browsers. */
  init(): Promise<void>;
  /** Load a species by id. State becomes `loaded`. */
  loadSpecies(id: SpeciesId, context?: unknown): Promise<void>;
  /** Load the default species (Seed). */
  loadDefaultSpecies(context?: unknown): Promise<void>;
  /** Resolve a preset id to its species and ecology, then load both. */
  loadPreset(presetId: string, context?: unknown): Promise<void>;
  /**
   * Start the loaded species. Resolves when its audio graph is ready.
   * `{ generative: false }` runs the graph for played notes only.
   */
  start(options?: SoundWorldStartOptions): Promise<void>;
  /** Stop playback and release every voice. State returns to `loaded`. */
  stop(): void;
  /** Tear down the engine. State becomes `disposed`; the instance is done. */
  dispose(): void;
  /** `idle`, `loaded`, `running` or `disposed`. */
  getState(): EngineState;

  // --- notes ---

  /** Play a note on the running species. Throws unless state is `running`. */
  noteOn(note: string, velocity?: number): void;
  /** Release a note. */
  noteOff(note: string): void;
  /** Release every voice without stopping. */
  allNotesOff(): void;

  // --- ecology ---

  /** Set one of the five ecological controls, 0..1. Throws outside that range. */
  setControl(control: EcologicalControl, value: number): void;
  /** Current value of an ecological control, 0..1. */
  getControl(control: EcologicalControl): number;
  /** Set the tempo in BPM for generative playback and the transport. */
  setTempo(bpm: number): void;

  // --- species ---

  /** Metadata for the loaded species, or null. */
  getCurrentSpecies(): SoundWorldMetadata | null;
  /** Metadata for every playable species. */
  getAvailableSpecies(): SoundWorldMetadata[];
  /** Register a species plugin. Ids must not collide with the built in set. */
  registerSpecies(factory: () => SoundWorld): void;

  // --- events and analysis ---

  /** Subscribe to an engine event. Returns the unsubscribe function. */
  on<K extends EngineEventName>(event: K, handler: EngineEventHandler<K>): () => void;
  /** Remove a handler. */
  off<K extends EngineEventName>(event: K, handler: EngineEventHandler<K>): void;
  /** Per frame audio features from the master bus. */
  getAudioFeatures(): AudioFeatures;
  /** Time domain samples from the master bus, -1..1. */
  getWaveform(): Float32Array;
  /** Master level 0..1 from a -60 dB floor. */
  getLevel(): number;

  // --- modulation (1.1) ---

  /**
   * Route a source (LFO, sample and hold, envelope follower, MIDI CC,
   * aftertouch, pitch bend) to an ecology control or `target:<name>` with a
   * depth of -1..1. Adds to the host's base value; never overwrites it.
   */
  modulate(source: ModulationSourceDescriptor, destination: ModulationDestination, depth: number): ModulationRoute;
  /** Remove a route by id. Returns false when there was none. */
  removeModulation(id: string): boolean;
  /** Every route as serializable config. */
  getModulationRoutes(): ModulationRouteConfig[];
  /** Source values, base and modulated controls, target offsets. Poll per frame. */
  getModulationState(): ModulationState;

  // --- input ---

  /** Route Web MIDI notes to the running species. Resolves false when unavailable. */
  enableMidi(): Promise<boolean>;
}
