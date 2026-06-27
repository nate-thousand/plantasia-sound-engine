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
} from './audioEngine.js';
import { presets } from '../presets/loader.js';
import { initialBotanicalControls } from '../utils/types/botanical.js';
import type { BotanicalControls } from '../utils/types/botanical.js';
import type { PlantasiaPreset, SynthSettings } from '../utils/types/presets.js';

/**
 * Public facade for the Plantasia botanical synthesis engine.
 * Wraps the underlying Tone.js graph without altering signal behavior.
 */
export class PlantasiaEngine {
  /** Preset definitions shipped with the engine. */
  readonly presets = presets;

  /** Default botanical control values. */
  readonly initialBotanicalControls = initialBotanicalControls;

  /** Default note pool used by {@link triggerChord}. */
  readonly defaultNotePool = defaultNotePool;

  /** Start the Tone.js AudioContext (requires a user gesture). */
  async init(): Promise<void> {
    return initAudio();
  }

  /** Apply preset synth settings and trigger a chord. */
  playPreset(preset: PlantasiaPreset): void {
    playPreset(preset);
  }

  /** Release all active voices. */
  stop(): void {
    stopAudio();
  }

  /** Map botanical knobs onto the underlying synth graph. */
  applyBotanicalControls(controls: BotanicalControls): void {
    applyBotanicalControls(controls);
  }

  /** Play a short chord (defaults to the first three notes in the pool). */
  triggerChord(notes?: string[]): void {
    triggerChord(notes);
  }

  /** Set transport tempo in BPM. */
  setTempo(bpm: number): void {
    setTempo(bpm);
  }

  /** Read analyser waveform data. */
  getWaveform(): Float32Array {
    return getWaveform();
  }

  /** Normalized output level (0–1). */
  getLevel(): number {
    return getLevel();
  }

  /** Update a single synth setting from the active preset. */
  updateParameter(
    parameter: keyof SynthSettings | string,
    value: string | number,
  ): void {
    updateParameter(parameter, value);
  }
}
