import * as Tone from 'tone';
import type { EcologicalControl, SoundWorld, SoundWorldStartOptions } from '../../engine/SoundWorld.js';
import { setRampParam, type RampParam } from '../../utils/ramp.js';
import type { SpeciesModulationFrame } from '../../engine/modulation/types.js';
import type { GenerativePreferences } from '../../engine/generative/types.js';
import { ChangeGate, mergeModulationTargets } from '../../shared/modulationFrame.js';
import {
  connectBacteriaEffects,
  createBacteriaEffects,
  disposeBacteriaEffects,
  type BacteriaEffectsNodes,
} from './effects.js';
import { BacteriaGenerator } from './generator.js';
import {
  BACTERIA_DEFAULT_TEMPO,
  BACTERIA_DEFAULT_SCALE,
  BACTERIA_SOUND_WORLD_METADATA,
  BACTERIA_SUPPORTED_CONTROLS,
  BACTERIA_GENERATIVE_PREFERENCES,
} from './metadata.js';
import {
  BACTERIA_HIGHPASS_HZ,
  BACTERIA_MAX_POLYPHONY,
  createBacteriaSynth,
  disposeBacteriaSynth,
  releaseAllBacteria,
  triggerBacteriaParticle,
  type BacteriaSynthNodes,
} from './synth.js';
import { syncGeneratorEcology } from '../../shared/syncGeneratorEcology.js';
import { syncPerformanceEcology } from '../../shared/syncPerformanceEcology.js';
import { PerformanceEngine } from '../../engine/performance/PerformanceEngine.js';
import { BACTERIA_EXPRESSION_PROFILE } from './expressionProfile.js';
import {
  applyBacteriaPerformance,
  bacteriaParticleProbability,
  type BacteriaPerformanceBase,
} from './performanceApply.js';
import { readSoundWorldContext } from '../../engine/SoundWorldContext.js';
import type { EngineEventSink } from '../../engine/events/EngineEventBus.js';
import type { EngineScheduler } from '../../engine/scheduler/EngineScheduler.js';
import { buildGenerativeCallbacks } from '../../shared/buildGenerativeCallbacks.js';
import { BACTERIA_DEPTHS, type BacteriaDepths } from './depths.js';

type BacteriaControlState = Record<EcologicalControl, number>;

const DEFAULT_CONTROLS: BacteriaControlState = {
  growth: 40,
  bloom: 38,
  roots: 28,
  mold: 12,
  bacteria: 50,
};

function clampControl(value: number): number {
  return Math.max(0, Math.min(100, value));
}

/**
 * Bacteria — microscopic particle Sound World.
 * Probability-driven generator with lightweight dynamic micro-voices.
 */
export class BacteriaSoundWorld implements SoundWorld {
  readonly metadata = BACTERIA_SOUND_WORLD_METADATA;

  private polyphonyCap: number | null = null;
  private depths: BacteriaDepths = { ...BACTERIA_DEPTHS };
  private synth: BacteriaSynthNodes | null = null;
  private effects: BacteriaEffectsNodes | null = null;
  private generator: BacteriaGenerator | null = null;
  private controls: BacteriaControlState = { ...DEFAULT_CONTROLS };
  private modulation: SpeciesModulationFrame | null = null;
  private preferenceOverrides: Partial<GenerativePreferences> = {};
  private readonly gate = new ChangeGate();
  private audioStarted = false;
  private performance: PerformanceEngine | null = null;
  private performanceBase: BacteriaPerformanceBase | null = null;
  private eventSink?: EngineEventSink;
  private scheduler?: EngineScheduler;

  async initialize(context?: unknown): Promise<void> {
    const ctx = readSoundWorldContext(context);
    this.eventSink = ctx.events;
    this.scheduler = ctx.scheduler;
    this.teardownGraph();
    this.controls = { ...DEFAULT_CONTROLS };
    this.audioStarted = false;
  }

  start(options?: SoundWorldStartOptions): Promise<void> {
    return this.ensureAudioStarted().then(() => {
      syncGeneratorEcology(this.generator, this.controls);
      if (options?.generative !== false) {
        this.generator?.start(BACTERIA_DEFAULT_TEMPO);
      }
    });
  }

  stop(): void {
    this.generator?.stop();
    if (this.synth) {
      releaseAllBacteria(this.synth);
    }
  }

  noteOn(note: string, velocity = 0.8): void {
    this.playNote(note, velocity, true);
  }

  /**
   * Host notes spawn a particle swarm through the generator; generator notes
   * must not, or the swarm re-triggers itself without bound.
   */
  private playNote(note: string, velocity: number, spawnSwarm: boolean): void {
    if (!this.audioStarted || !this.synth) {
      return;
    }
    const ctx = this.performance?.noteOn(note, velocity);
    this.applyPerformanceModulation();
    this.eventSink?.emitDensityChanged({
      density: this.performance?.getDensityEngine().getState().averageDensity ?? 0,
    });
    const shaped = ctx?.shapedVelocity ?? velocity;
    const targets = this.performance?.getTargets();
    if (spawnSwarm) {
      this.generator?.triggerAtNote(note, shaped);
    }
    triggerBacteriaParticle(this.synth, 'sine', note, shaped * 0.45);
    const bacteria = this.effectiveControls().bacteria / 100;
    const prob =
      targets !== undefined
        ? bacteriaParticleProbability(bacteria, targets)
        : 0.4 + bacteria * 0.4;
    if (Math.random() < prob) {
      triggerBacteriaParticle(this.synth, 'fm', note, shaped * 0.35);
    }
  }

  noteOff(note: string): void {
    this.performance?.noteOff(note);
    this.applyPerformanceModulation();
  }

  allNotesOff(): void {
    if (this.synth) {
      releaseAllBacteria(this.synth);
    }
  }

  setGenerativePreferences(partial: Partial<GenerativePreferences>): void {
    this.preferenceOverrides = { ...this.preferenceOverrides, ...partial };
    this.generator?.setPreferences(partial);
  }

  getGenerativePreferences(): Readonly<GenerativePreferences> {
    return this.generator?.getPreferences() ?? { ...BACTERIA_GENERATIVE_PREFERENCES, ...this.preferenceOverrides };
  }

  setPolyphony(voices: number | null): void {
    this.polyphonyCap = voices;
    this.applyEcologicalControls();
  }

  /** Lab only (engine 1.3): override control depths live; unknown keys ignored. */
  setControlDepths(partial: Record<string, number>): void {
    for (const [key, value] of Object.entries(partial)) {
      if (key in this.depths && Number.isFinite(value)) {
        this.depths[key as keyof BacteriaDepths] = value;
      }
    }
    this.applyEcologicalControls();
  }

  getControlDepths(): Record<string, number> {
    return { ...this.depths };
  }

  applyModulation(frame: SpeciesModulationFrame): void {
    this.modulation = frame.routes > 0 ? frame : null;
    this.applyEcologicalControls(frame.rampSec);
  }

  setControl(control: EcologicalControl, value: number, rampSec = 0.2): void {
    if (!BACTERIA_SUPPORTED_CONTROLS.includes(control)) {
      return;
    }
    this.controls[control] = clampControl(value);
    this.applyEcologicalControls(rampSec);
    syncGeneratorEcology(this.generator, this.controls);
  }

  dispose(): void {
    this.stop();
    this.teardownGraph();
    this.audioStarted = false;
  }

  private async ensureAudioStarted(): Promise<void> {
    this.ensureGraph();
    if (this.audioStarted) {
      return;
    }
    await Tone.start();
    this.audioStarted = true;
    this.applyEcologicalControls();
  }

  private ensureGraph(): void {
    if (this.synth && this.effects && this.generator) {
      return;
    }

    this.teardownGraph();

    this.synth = createBacteriaSynth();
    this.effects = createBacteriaEffects();
    connectBacteriaEffects(this.synth.panner, this.effects);

    this.generator = new BacteriaGenerator(
      {
        onParticle: (type, note, velocity) => {
          this.performance?.recordGenerativeActivity('particle');
          if (this.synth) {
            triggerBacteriaParticle(this.synth, type, note, velocity);
          }
        },
      },
      buildGenerativeCallbacks(
        {
          noteOn: (note, velocity) => this.playNote(note, velocity, false),
          noteOff: (note) => this.noteOff(note),
        },
        this.eventSink,
      ),
      { scheduler: this.scheduler },
    );

    if (Object.keys(this.preferenceOverrides).length > 0) {
      this.generator.setPreferences(this.preferenceOverrides);
    }

    this.performance = new PerformanceEngine(BACTERIA_EXPRESSION_PROFILE);
    syncPerformanceEcology(this.performance, this.controls);

    this.applyEcologicalControls();
    syncGeneratorEcology(this.generator, this.controls);
  }

  private teardownGraph(): void {
    this.gate.reset();
    this.modulation = null;
    this.performance?.reset();
    this.performance = null;
    this.performanceBase = null;
    this.generator?.dispose();
    this.generator = null;
    if (this.synth) {
      disposeBacteriaSynth(this.synth);
      this.synth = null;
    }
    if (this.effects) {
      disposeBacteriaEffects(this.effects);
      this.effects = null;
    }
  }

  /** Host controls, or the modulated values of the current frame. */
  private effectiveControls(): BacteriaControlState {
    return this.modulation?.controls ?? this.controls;
  }

  private applyEcologicalControls(rampSec = 0.2): void {
    if (!this.synth || !this.effects) {
      return;
    }

    const controls = this.effectiveControls();
    const growth = controls.growth / 100;
    const bloom = controls.bloom / 100;
    const roots = controls.roots / 100;
    const mold = controls.mold / 100;
    const bacteria = controls.bacteria / 100;

    const curve = Math.round(4 + growth * (BACTERIA_MAX_POLYPHONY - 4));
    const polyphony = this.polyphonyCap === null ? curve : Math.max(1, Math.min(curve, this.polyphonyCap));
    if (this.gate.changed('polyphony', polyphony, 0.5)) {
      this.synth.fmPoly.maxPolyphony = polyphony;
      this.synth.sinePoly.maxPolyphony = polyphony;
    }

    const d = this.depths;
    const highpass =
      BACTERIA_HIGHPASS_HZ * (d.highpass_base + bloom * d.highpass_bloom) * (1 + roots * d.highpass_roots);
    const filterDepth = d.filterDepth_base + bacteria * d.filterDepth_bacteria + mold * d.filterDepth_mold;
    const panRate = d.panRate_base + bacteria * d.panRate_bacteria + mold * d.panRate_mold;

    setRampParam(this.audioStarted, this.synth.fmPoly.volume as unknown as RampParam, Tone.gainToDb(d.fmLevel_base + growth * d.fmLevel_growth + bloom * d.fmLevel_bloom), rampSec);
    setRampParam(this.audioStarted, this.synth.sinePoly.volume as unknown as RampParam, Tone.gainToDb(d.sineLevel_base + growth * d.sineLevel_growth), rampSec);
    setRampParam(this.audioStarted, this.synth.noiseSynth.volume as unknown as RampParam, d.noiseDb_base + mold * d.noiseDb_mold + bacteria * d.noiseDb_bacteria, rampSec);

    const pluckDampening = d.pluckDamp_base + bloom * d.pluckDamp_bloom;
    if (this.gate.changed('pluckDampening', pluckDampening, 20)) {
      this.synth.pluck.set({
        dampening: pluckDampening,
        resonance: d.pluckRes_base + bloom * d.pluckRes_bloom,
        release: d.pluckRelease_base + bloom * d.pluckRelease_bloom + roots * d.pluckRelease_roots,
      });
    }

    this.performanceBase = {
      highpassHz: highpass,
      filterDepth,
      panRate: panRate * (1 + roots * d.panRate_roots),
      effectLevels: {
        satWet: d.satWet_base + mold * d.satWet_mold,
        satDrive: d.satDrive_base + mold * d.satDrive_mold,
        pannerDepth: d.pannerDepth_base + bloom * d.pannerDepth_bloom + bacteria * d.pannerDepth_bacteria,
        pannerRate: d.pannerRate_base + bacteria * d.pannerRate_bacteria + mold * d.pannerRate_mold,
        delayWet: d.delayWet_base + bloom * d.delayWet_bloom + bacteria * d.delayWet_bacteria,
        delayFeedback: d.delayFeedback_base + mold * d.delayFeedback_mold + bloom * d.delayFeedback_bloom,
        roomWet: d.roomWet_base + bloom * d.roomWet_bloom,
        roomSize: d.roomSize_base + bloom * d.roomSize_bloom,
        roomDampening: d.roomDamp_base + bloom * d.roomDamp_bloom + roots * d.roomDamp_roots,
      },
    };

    syncGeneratorEcology(this.generator, controls);
    syncPerformanceEcology(this.performance, controls);
    this.applyPerformanceModulation(rampSec);
  }

  private applyPerformanceModulation(rampSec = 0.2): void {
    if (!this.synth || !this.effects || !this.performance || !this.performanceBase) {
      return;
    }
    applyBacteriaPerformance(
      this.synth,
      this.effects,
      this.performanceBase,
      mergeModulationTargets(this.performance.getTargets(), this.modulation),
      this.audioStarted,
      rampSec,
      this.gate,
    );
  }
}

export function createBacteriaSoundWorld(): SoundWorld {
  return new BacteriaSoundWorld();
}

/** @deprecated Use {@link createBacteriaSoundWorld} for runtime audio — metadata only, not a live instance. */
export const bacteriaSpecies = { metadata: BACTERIA_SOUND_WORLD_METADATA } as const;

export {
  BACTERIA_SUPPORTED_CONTROLS,
  BACTERIA_DEFAULT_TEMPO,
  BACTERIA_DEFAULT_SCALE,
  BACTERIA_SOUND_WORLD_METADATA,
};
