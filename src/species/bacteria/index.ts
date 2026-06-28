import * as Tone from 'tone';
import type { EcologicalControl, SoundWorld } from '../../engine/SoundWorld.js';
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

  private synth: BacteriaSynthNodes | null = null;
  private effects: BacteriaEffectsNodes | null = null;
  private generator: BacteriaGenerator | null = null;
  private controls: BacteriaControlState = { ...DEFAULT_CONTROLS };
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

  start(): Promise<void> {
    return this.ensureAudioStarted().then(() => {
      syncGeneratorEcology(this.generator, this.controls);
      this.generator?.start(BACTERIA_DEFAULT_TEMPO);
    });
  }

  stop(): void {
    this.generator?.stop();
    if (this.synth) {
      releaseAllBacteria(this.synth);
    }
  }

  noteOn(note: string, velocity = 0.8): void {
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
    this.generator?.triggerAtNote(note, shaped);
    triggerBacteriaParticle(this.synth, 'sine', note, shaped * 0.45);
    const bacteria = this.controls.bacteria / 100;
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

  setControl(control: EcologicalControl, value: number): void {
    if (!BACTERIA_SUPPORTED_CONTROLS.includes(control)) {
      return;
    }
    this.controls[control] = clampControl(value);
    this.applyEcologicalControls();
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
          noteOn: (note, velocity) => this.noteOn(note, velocity),
          noteOff: (note) => this.noteOff(note),
        },
        this.eventSink,
      ),
      { scheduler: this.scheduler },
    );

    this.performance = new PerformanceEngine(BACTERIA_EXPRESSION_PROFILE);
    syncPerformanceEcology(this.performance, this.controls);

    this.applyEcologicalControls();
    syncGeneratorEcology(this.generator, this.controls);
  }

  private teardownGraph(): void {
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

  private applyEcologicalControls(): void {
    if (!this.synth || !this.effects) {
      return;
    }

    const growth = this.controls.growth / 100;
    const bloom = this.controls.bloom / 100;
    const roots = this.controls.roots / 100;
    const mold = this.controls.mold / 100;
    const bacteria = this.controls.bacteria / 100;

    const polyphony = Math.round(4 + growth * (BACTERIA_MAX_POLYPHONY - 4));
    this.synth.fmPoly.maxPolyphony = polyphony;
    this.synth.sinePoly.maxPolyphony = polyphony;

    const highpass =
      BACTERIA_HIGHPASS_HZ * (0.75 + bloom * 0.45) * (1 - roots * 0.18);
    const filterDepth = 0.18 + bacteria * 0.22 + mold * 0.12;
    const panRate = 0.06 + bacteria * 0.18 + mold * 0.08;

    this.synth.fmPoly.volume.value = Tone.gainToDb(0.12 + growth * 0.18 + bloom * 0.08);
    this.synth.sinePoly.volume.value = Tone.gainToDb(0.14 + growth * 0.12);
    this.synth.noiseSynth.volume.value = -14 + mold * 6 + bacteria * 4;

    this.synth.pluck.set({
      dampening: 4200 + bloom * 2800,
      resonance: 0.28 + bloom * 0.35,
      release: 0.05 + bloom * 0.08 + roots * 0.06,
    });

    this.performanceBase = {
      highpassHz: highpass,
      filterDepth,
      panRate: panRate * (1 - roots * 0.35),
      effectLevels: {
        satWet: 0.06 + mold * 0.2,
        satDrive: 0.04 + mold * 0.22,
        pannerDepth: 0.35 + bloom * 0.45 + bacteria * 0.15,
        pannerRate: 0.14 + bacteria * 0.35 + mold * 0.12,
        delayWet: 0.08 + bloom * 0.16 + bacteria * 0.08,
        delayFeedback: 0.12 + mold * 0.28 + bloom * 0.1,
        roomWet: 0.12 + bloom * 0.28,
        roomSize: 0.32 + bloom * 0.35,
        roomDampening: 2800 + bloom * 2200 - roots * 800,
      },
    };

    syncGeneratorEcology(this.generator, this.controls);
    syncPerformanceEcology(this.performance, this.controls);
    this.applyPerformanceModulation();
  }

  private applyPerformanceModulation(): void {
    if (!this.synth || !this.effects || !this.performance || !this.performanceBase) {
      return;
    }
    applyBacteriaPerformance(
      this.synth,
      this.effects,
      this.performanceBase,
      this.performance.getTargets(),
      this.audioStarted,
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
