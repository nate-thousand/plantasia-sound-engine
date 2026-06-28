import * as Tone from 'tone';
import type { EcologicalControl, SoundWorld } from '../../engine/SoundWorld.js';
import {
  connectFlowersEffects,
  createFlowersEffects,
  disposeFlowersEffects,
  type FlowersEffectsNodes,
} from './effects.js';
import { FlowersGenerator } from './generator.js';
import {
  FLOWERS_DEFAULT_TEMPO,
  FLOWERS_DEFAULT_SCALE,
  FLOWERS_SOUND_WORLD_METADATA,
  FLOWERS_SUPPORTED_CONTROLS,
} from './metadata.js';
import {
  createFlowersSynth,
  disposeFlowersSynth,
  FLOWERS_FILTER_HZ,
  FLOWERS_MAX_POLYPHONY,
  FLOWERS_SUB_LEVEL,
  releaseAllFlowers,
  triggerFlowersAttack,
  triggerFlowersRelease,
  type FlowersSynthNodes,
} from './synth.js';
import { syncGeneratorEcology } from '../../shared/syncGeneratorEcology.js';
import { syncPerformanceEcology } from '../../shared/syncPerformanceEcology.js';
import { PerformanceEngine } from '../../engine/performance/PerformanceEngine.js';
import { FLOWERS_EXPRESSION_PROFILE } from './expressionProfile.js';
import {
  applyFlowersPerformance,
  type FlowersPerformanceBase,
} from './performanceApply.js';
import { readSoundWorldContext } from '../../engine/SoundWorldContext.js';
import type { EngineEventSink } from '../../engine/events/EngineEventBus.js';
import type { EngineScheduler } from '../../engine/scheduler/EngineScheduler.js';
import { buildGenerativeCallbacks } from '../../shared/buildGenerativeCallbacks.js';

type FlowersControlState = Record<EcologicalControl, number>;

const DEFAULT_CONTROLS: FlowersControlState = {
  growth: 48,
  bloom: 62,
  roots: 38,
  mold: 10,
  bacteria: 16,
};

function clampControl(value: number): number {
  return Math.max(0, Math.min(100, value));
}

/**
 * Flowers — Juno-inspired bloom Sound World.
 * PWM pads, ensemble chorus, hall reverb, slow chord blooms.
 */
export class FlowersSoundWorld implements SoundWorld {
  readonly metadata = FLOWERS_SOUND_WORLD_METADATA;

  private synth: FlowersSynthNodes | null = null;
  private effects: FlowersEffectsNodes | null = null;
  private generator: FlowersGenerator | null = null;
  private controls: FlowersControlState = { ...DEFAULT_CONTROLS };
  private audioStarted = false;
  private performance: PerformanceEngine | null = null;
  private performanceBase: FlowersPerformanceBase | null = null;
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
      this.generator?.start(FLOWERS_DEFAULT_TEMPO);
    });
  }

  stop(): void {
    this.generator?.stop();
    if (this.synth) {
      releaseAllFlowers(this.synth);
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
    triggerFlowersAttack(this.synth, note, ctx?.shapedVelocity ?? velocity);
  }

  noteOff(note: string): void {
    if (!this.synth) {
      return;
    }
    this.performance?.noteOff(note);
    this.applyPerformanceModulation();
    triggerFlowersRelease(this.synth, note);
  }

  allNotesOff(): void {
    if (this.synth) {
      releaseAllFlowers(this.synth);
    }
  }

  setControl(control: EcologicalControl, value: number): void {
    if (!FLOWERS_SUPPORTED_CONTROLS.includes(control)) {
      return;
    }
    this.controls[control] = clampControl(value);
    this.applyEcologicalControls();
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
    if (this.effects) {
      await this.effects.reverb.generate();
    }
    this.audioStarted = true;
    this.applyEcologicalControls();
  }

  private ensureGraph(): void {
    if (this.synth && this.effects && this.generator) {
      return;
    }

    this.teardownGraph();

    this.synth = createFlowersSynth();
    this.effects = createFlowersEffects();
    connectFlowersEffects(this.synth.filter, this.effects);

    this.generator = new FlowersGenerator(
      buildGenerativeCallbacks(
        {
          noteOn: (note, velocity) => {
            this.performance?.recordGenerativeActivity('chord');
            this.noteOn(note, velocity);
          },
          noteOff: (note) => this.noteOff(note),
        },
        this.eventSink,
      ),
      { scheduler: this.scheduler },
    );

    this.performance = new PerformanceEngine(FLOWERS_EXPRESSION_PROFILE);
    syncPerformanceEcology(this.performance, this.controls);

    this.applyEcologicalControls();
  }

  private teardownGraph(): void {
    this.performance?.reset();
    this.performance = null;
    this.performanceBase = null;
    this.generator?.dispose();
    this.generator = null;
    if (this.synth) {
      disposeFlowersSynth(this.synth);
      this.synth = null;
    }
    if (this.effects) {
      disposeFlowersEffects(this.effects);
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

    const polyphony = Math.round(4 + growth * (FLOWERS_MAX_POLYPHONY - 4));
    this.synth.sawPoly.maxPolyphony = polyphony;
    this.synth.pwmPoly.maxPolyphony = polyphony;
    this.synth.subPoly.maxPolyphony = polyphony;

    const filterOpen = FLOWERS_FILTER_HZ * (1 + bloom * 0.35 + growth * 0.12);
    const filterDepth = 0.14 + bloom * 0.12 + mold * 0.06;
    const subLevel = FLOWERS_SUB_LEVEL * (0.6 + roots * 0.85);
    this.synth.subPoly.volume.value = Tone.gainToDb(subLevel);

    const pwmWidth = 0.85 + mold * 0.22;
    const detuneSpread = 18 + mold * 14;
    const noiseGain = 0.008 + bloom * 0.02 + bacteria * 0.015;

    this.performanceBase = {
      filterHz: filterOpen,
      filterDepth,
      pwmWidth,
      detuneSpread,
      noiseGain,
      effectLevels: {
        tapeWet: 0.04 + mold * 0.18,
        tapeDrive: 0.06 + mold * 0.16,
        chorusWet: 0.38 + bloom * 0.48,
        chorusDepth: 0.55 + bloom * 0.38,
        ensembleWet: 0.28 + bloom * 0.42,
        reverbWet: 0.32 + bloom * 0.52,
        delayWet: 0.08 + bloom * 0.14,
        widenerWidth: 0.45 + bloom * 0.48 + growth * 0.08,
        releaseScale: 1 + bloom * 0.65 + roots * 0.15,
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
    applyFlowersPerformance(
      this.synth,
      this.effects,
      this.performanceBase,
      this.performance.getTargets(),
      this.audioStarted,
    );
  }
}

export function createFlowersSoundWorld(): SoundWorld {
  return new FlowersSoundWorld();
}

/** @deprecated Use {@link createFlowersSoundWorld} for runtime audio — metadata only, not a live instance. */
export const flowersSpecies = { metadata: FLOWERS_SOUND_WORLD_METADATA } as const;

export {
  FLOWERS_SUPPORTED_CONTROLS,
  FLOWERS_DEFAULT_TEMPO,
  FLOWERS_DEFAULT_SCALE,
  FLOWERS_SOUND_WORLD_METADATA,
};
