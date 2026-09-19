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
import type {
  EcologicalControl,
  SpeciesId,
  SoundWorld,
  SoundWorldMetadata,
  SoundWorldStartOptions,
} from './SoundWorld.js';
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
import { AudioAnalyser, type AudioFeatures } from './analysis/AudioAnalyser.js';
import type { PlantasiaEngineApi } from './PlantasiaEngineApi.js';

/** How often the engine reads the master bus for onsets while running. */
const ANALYSIS_TICK_MS = 16;

export type CreatePlantasiaEngineOptions = CreateSpeciesManagerOptions;

/**
 * Unified host facade — v2 Sound World lifecycle + v1 preset compatibility.
 *
 * Two tiers (ROADMAP decision 5): the methods of {@link PlantasiaEngineApi}
 * are the public surface and the only ones `plantasia-sound-engine/public`
 * types. Everything below the "root only" and "legacy" markers ships from the
 * root export for existing hosts and the demo.
 */
export class PlantasiaEngine implements PlantasiaEngineApi {
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
  private readonly analyser = new AudioAnalyser();
  private analysisTimer: number | null = null;
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
    this.analyser.onOnset((event) => this.events.emit('onset', event));
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

  /** Root only. Coming soon species when registered via {@link CreatePlantasiaEngineOptions.includeFuture}. */
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

  /** Unlock the audio context (requires user gesture in browsers). */
  async init(): Promise<void> {
    return initAudio();
  }

  /** @deprecated Root only. Use {@link init}. */
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

  /** Root only. Apply several ecological controls at once (0..1). */
  applyEcology(ecology: Partial<EcologyControlState>): void {
    for (const [control, value] of Object.entries(ecology) as [EcologicalControl, number][]) {
      if (value !== undefined) {
        this.setControl(control, value);
      }
    }
  }

  /**
   * Start the active Sound World (awaits audio graph readiness).
   * `{ generative: false }` runs the graph for played notes only; call
   * {@link stopSpecies} then `start()` to switch generative playback on.
   */
  async start(options?: SoundWorldStartOptions): Promise<void> {
    await this.species.start(options);
    this.startAnalysis();
  }

  /** Root only. Stop generative playback on the active Sound World. Idempotent. Public tier hosts use {@link stop}. */
  stopSpecies(): void {
    this.species.stop();
    this.stopAnalysis();
  }

  /**
   * Per frame features from the master bus: `{ time, rms, peak, bass, mid, high, centroid, onset }`.
   * Raw values, except `peak` which holds and decays. Poll from your render loop.
   */
  getAudioFeatures(): AudioFeatures {
    return this.analyser.read();
  }

  private startAnalysis(): void {
    if (this.analysisTimer !== null) {
      return;
    }
    this.analyser.reset();
    this.analysisTimer = this.scheduler.setInterval(
      () => {
        this.analyser.read();
      },
      ANALYSIS_TICK_MS,
      'analysis',
    );
  }

  private stopAnalysis(): void {
    if (this.analysisTimer === null) {
      return;
    }
    this.scheduler.clearInterval(this.analysisTimer);
    this.analysisTimer = null;
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

  /** Current value of an ecological control (0..1). */
  getControl(control: EcologicalControl): number {
    return this.species.getControl(control);
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
        const speciesId = this.getCurrentSpecies()?.id ?? null;
        this.events.emit('noteReleased', { note, source: 'midi', speciesId });
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
    this.stopAnalysis();
    this.analyser.dispose();
    this.transport.dispose();
    this.species.dispose();
    this.scheduler.dispose();
    this.events.clear();
  }

  // --- v1 preset API (legacy, root export only, preserved) ---

  /** Apply preset synth settings and trigger a chord (v1 path). */
  playPreset(preset: PlantasiaPreset): void {
    playPreset(preset);
  }

  /**
   * Stop playback and release every voice: the active species (state returns
   * to `loaded`) and any v1 preset voices. Public tier.
   */
  stop(): void {
    this.species.stop();
    this.species.allNotesOff();
    this.stopAnalysis();
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
