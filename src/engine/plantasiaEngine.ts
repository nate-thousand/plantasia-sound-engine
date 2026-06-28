import {
  initAudio,
  playPreset,
  stopAudio,
  applyBotanicalControls,
  triggerChord,
  setTempo,
  getWaveform,
  getLevel,
  updateParameter,
  defaultNotePool,
  setMold,
  getMoldValue,
} from './audioEngine.js';
import { presets } from '../presets/loader.js';
import { initialBotanicalControls } from '../utils/types/botanical.js';
import type { BotanicalControls } from '../utils/types/botanical.js';
import type { PlantasiaPreset, SynthSettings } from '../utils/types/presets.js';
import { ENGINE_PARAMETER_METADATA } from '../mold/parameterMetadata.js';
import type { EngineParameterMeta } from '../mold/types.js';
import {
  createSpeciesManager,
  type CreateSpeciesManagerOptions,
} from './createSpeciesManager.js';
import type { SpeciesManager } from './SpeciesManager.js';
import type { EcologicalControl, SpeciesId, SoundWorld, SoundWorldMetadata } from './SoundWorld.js';
import type { EngineState } from './EngineLifecycle.js';
import { resolvePresetToSpecies } from './resolvePresetToSpecies.js';
import type { EcologyControlState } from './EcologyControls.js';
import {
  EngineEventBus,
  type EngineEventHandler,
  type EngineEventName,
} from './events/EngineEventBus.js';
import { createEngineScheduler, type EngineScheduler } from './scheduler/EngineScheduler.js';
import { Transport } from './scheduler/Transport.js';
import { createWebMidiManager, type WebMidiManager } from '../midi/WebMidiManager.js';

export type CreatePlantasiaEngineOptions = CreateSpeciesManagerOptions;

/**
 * Unified host facade — v2 Sound World lifecycle + v1 preset compatibility.
 * Prefer this entry point over {@link createSpeciesManager} for new integrations.
 */
export class PlantasiaEngine {
  /** Preset definitions shipped with the engine (v1). */
  readonly presets = presets;

  /** Default botanical control values (v1). */
  readonly initialBotanicalControls = initialBotanicalControls;

  /** Default note pool used by {@link triggerChord}. */
  readonly defaultNotePool = defaultNotePool;

  /** Typed semantic event bus for visualization layers. */
  readonly events: EngineEventBus;

  /** Central timer ownership for generative + transport systems. */
  readonly scheduler: EngineScheduler;

  /** Shared transport clock (BPM, play/pause). */
  readonly transport: Transport;

  /** Web MIDI input facade (no-op when Web MIDI unavailable). */
  readonly midi: WebMidiManager;

  private readonly species: SpeciesManager;
  private midiBound = false;

  constructor(options: CreatePlantasiaEngineOptions = {}) {
    this.events = new EngineEventBus();
    this.scheduler = createEngineScheduler();
    this.transport = new Transport(this.scheduler);
    this.midi = createWebMidiManager();
    this.species = createSpeciesManager({
      ...options,
      events: this.events,
      scheduler: this.scheduler,
    });
  }

  // --- v2 Sound World API (preferred) ---

  /** Current lifecycle state of the active Sound World. */
  getState(): EngineState {
    return this.species.getState();
  }

  /** Playable species metadata. */
  getAvailableSpecies(): SoundWorldMetadata[] {
    return this.species.getAvailableSpecies();
  }

  /** Coming soon species when registered via {@link CreatePlantasiaEngineOptions.includeFuture}. */
  getUpcomingSpecies(): SoundWorldMetadata[] {
    return this.species.getUpcomingSpecies();
  }

  /** Active species metadata, or null when none loaded. */
  getCurrentSpecies(): SoundWorldMetadata | null {
    return this.species.getCurrentSpecies();
  }

  /** Subscribe to semantic engine events. Returns an unsubscribe function. */
  on<K extends EngineEventName>(event: K, handler: EngineEventHandler<K>): () => void {
    return this.events.on(event, handler);
  }

  /** Remove an event handler. */
  off<K extends EngineEventName>(event: K, handler: EngineEventHandler<K>): void {
    this.events.off(event, handler);
  }

  /** Unlock the audio context (requires user gesture in browsers). Alias: {@link initialize}. */
  async init(): Promise<void> {
    return initAudio();
  }

  /** Alias for {@link init} — v2 lifecycle naming. */
  async initialize(): Promise<void> {
    return this.init();
  }

  async loadSpecies(id: SpeciesId, context?: unknown): Promise<void> {
    await this.species.loadSpecies(id, context);
  }

  /** Load default Seed Sound World. */
  async loadDefaultSpecies(context?: unknown): Promise<void> {
    await this.species.loadDefaultSpecies(context);
  }

  /**
   * Resolve a v1 preset id and load its mapped v2 species with default ecology.
   * Visual profile remains on preset JSON — host reads `preset.visual` separately.
   */
  async loadPreset(presetId: string, context?: unknown): Promise<void> {
    const resolution = resolvePresetToSpecies(presetId);
    await this.species.loadSpecies(resolution.speciesId, context, { presetId: resolution.presetId });
    this.applyEcology(resolution.ecology);
  }

  /** Apply normalized ecological control state (0–1). */
  applyEcology(ecology: Partial<EcologyControlState>): void {
    for (const [control, value] of Object.entries(ecology) as [EcologicalControl, number][]) {
      if (value !== undefined) {
        this.setControl(control, value);
      }
    }
  }

  /** Start the active Sound World (awaits audio graph readiness). */
  async start(): Promise<void> {
    await this.species.start();
  }

  /** Stop generative playback on the active Sound World. Idempotent. */
  stopSpecies(): void {
    this.species.stop();
  }

  noteOn(note: string, velocity = 1): void {
    this.species.noteOn(note, velocity);
  }

  noteOff(note: string): void {
    this.species.noteOff(note);
  }

  allNotesOff(): void {
    this.species.allNotesOff();
  }

  /** Set an ecological control (0–1). */
  setControl(control: EcologicalControl, value: number): void {
    this.species.setControl(control, value);
  }

  /** Register an external Sound World plugin at runtime. */
  registerSpecies(factory: () => SoundWorld): void {
    this.species.registerFactory(factory);
  }

  /** Connect Web MIDI note input to the active Sound World. */
  async enableMidi(): Promise<boolean> {
    const connected = await this.midi.connect({
      onNoteOn: (note, velocity) => {
        if (this.getState() !== 'running') {
          return;
        }
        const speciesId = this.getCurrentSpecies()?.id ?? null;
        this.events.emit('notePlayed', { note, velocity, source: 'midi', speciesId });
        this.species.getLoader().getCurrent()?.noteOn(note, velocity);
      },
      onNoteOff: (note) => {
        this.species.getLoader().getCurrent()?.noteOff(note);
      },
    });
    this.midiBound = connected;
    return connected;
  }

  dispose(): void {
    if (this.midiBound) {
      this.midi.disconnect();
      this.midiBound = false;
    }
    this.transport.dispose();
    this.species.dispose();
    this.scheduler.dispose();
    this.events.clear();
  }

  // --- v1 preset API (legacy — preserved) ---

  /** Apply preset synth settings and trigger a chord (v1 path). */
  playPreset(preset: PlantasiaPreset): void {
    playPreset(preset);
  }

  /**
   * Stop all audio — v1 preset voices and active v2 species playback.
   * Prefer {@link stopSpecies} when only the Sound World layer should stop.
   */
  stop(): void {
    this.species.stop();
    this.species.allNotesOff();
    stopAudio();
  }

  applyBotanicalControls(controls: BotanicalControls): void {
    applyBotanicalControls(controls);
  }

  triggerChord(notes?: string[]): void {
    triggerChord(notes);
  }

  setTempo(bpm: number): void {
    setTempo(bpm);
    this.transport.setBpm(bpm);
  }

  getWaveform(): Float32Array {
    return getWaveform();
  }

  getLevel(): number {
    return getLevel();
  }

  updateParameter(
    parameter: keyof SynthSettings | string,
    value: string | number,
  ): void {
    updateParameter(parameter, value);
  }

  /** Set Mold macro (0–100, v1). */
  setMold(value: number): void {
    setMold(value);
  }

  getMold(): number {
    return getMoldValue();
  }

  getParameterMetadata(): EngineParameterMeta[] {
    return ENGINE_PARAMETER_METADATA;
  }
}

/** Create the unified Plantasia engine facade. */
export function createPlantasiaEngine(options: CreatePlantasiaEngineOptions = {}): PlantasiaEngine {
  return new PlantasiaEngine(options);
}
