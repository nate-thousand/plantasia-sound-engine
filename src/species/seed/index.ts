import * as Tone from 'tone';
import type { EcologicalControl, SoundWorld } from '../../engine/SoundWorld.js';
import {
  connectSeedEffects,
  createSeedEffects,
  disposeSeedEffects,
  type SeedEffectsNodes,
} from './effects.js';
import { SeedGenerator } from './generator.js';
import {
  SEED_DEFAULT_TEMPO,
  SEED_DEFAULT_SCALE,
  SEED_SOUND_WORLD_METADATA,
  SEED_SUPPORTED_CONTROLS,
} from './metadata.js';
import {
  createSeedSynth,
  disposeSeedSynth,
  SEED_FILTER_HZ,
  SEED_MAX_POLYPHONY,
  type SeedSynthNodes,
} from './synth.js';
import { syncGeneratorEcology } from '../../shared/syncGeneratorEcology.js';
import { syncPerformanceEcology } from '../../shared/syncPerformanceEcology.js';
import { PerformanceEngine } from '../../engine/performance/PerformanceEngine.js';
import { SEED_EXPRESSION_PROFILE } from './expressionProfile.js';
import {
  applySeedPerformance,
  type SeedPerformanceBase,
} from './performanceApply.js';
import { readSoundWorldContext } from '../../engine/SoundWorldContext.js';
import type { EngineEventSink } from '../../engine/events/EngineEventBus.js';
import type { EngineScheduler } from '../../engine/scheduler/EngineScheduler.js';
import { buildGenerativeCallbacks } from '../../shared/buildGenerativeCallbacks.js';

type SeedControlState = Record<EcologicalControl, number>;

const DEFAULT_CONTROLS: SeedControlState = {
  growth: 42,
  bloom: 48,
  roots: 35,
  mold: 12,
  bacteria: 18,
};

function clampControl(value: number): number {
  return Math.max(0, Math.min(100, value));
}

/**
 * Seed — reference Sound World implementation.
 * Warm PolySynth voices with Plantasonic-inspired effects and pentatonic generation.
 */
export class SeedSoundWorld implements SoundWorld {
  readonly metadata = SEED_SOUND_WORLD_METADATA;

  private synth: SeedSynthNodes | null = null;
  private effects: SeedEffectsNodes | null = null;
  private generator: SeedGenerator | null = null;
  private controls: SeedControlState = { ...DEFAULT_CONTROLS };
  private audioStarted = false;
  private performance: PerformanceEngine | null = null;
  private performanceBase: SeedPerformanceBase | null = null;
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
      this.generator?.start(SEED_DEFAULT_TEMPO);
    });
  }

  stop(): void {
    this.generator?.stop();
    this.synth?.poly.releaseAll();
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
    this.synth.poly.triggerAttack(note, undefined, ctx?.shapedVelocity ?? velocity);
  }

  noteOff(note: string): void {
    if (!this.synth) {
      return;
    }
    this.performance?.noteOff(note);
    this.applyPerformanceModulation();
    this.synth.poly.triggerRelease(note);
  }

  allNotesOff(): void {
    this.synth?.poly.releaseAll();
  }

  setControl(control: EcologicalControl, value: number): void {
    if (!SEED_SUPPORTED_CONTROLS.includes(control)) {
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

    this.synth = createSeedSynth();
    this.effects = createSeedEffects();
    connectSeedEffects(this.synth.filter, this.effects);

    this.generator = new SeedGenerator(
      buildGenerativeCallbacks(
        {
          noteOn: (note, velocity) => {
            this.performance?.recordGenerativeActivity('phrase');
            this.noteOn(note, velocity);
          },
          noteOff: (note) => this.noteOff(note),
        },
        this.eventSink,
      ),
      { scheduler: this.scheduler },
    );

    this.performance = new PerformanceEngine(SEED_EXPRESSION_PROFILE);
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
      disposeSeedSynth(this.synth);
      this.synth = null;
    }
    if (this.effects) {
      disposeSeedEffects(this.effects);
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

    const polyphony = Math.round(3 + growth * (SEED_MAX_POLYPHONY - 3));
    this.synth.poly.maxPolyphony = polyphony;

    const filterOpen =
      SEED_FILTER_HZ * (1 + growth * 0.22 + bloom * 0.12) * (1 - roots * 0.1);

    const driftDepth = 0.1 + mold * 0.08;

    const effectLevels = {
      tapeWet: 0.1 + mold * 0.22,
      tapeDrive: 0.1 + mold * 0.2,
      chorusWet: 0.18 + bloom * 0.35,
      reverbWet: 0.22 + bloom * 0.42,
      delayWet: 0.08 + bloom * 0.18,
      delayFeedback: 0.1 + mold * 0.14,
      releaseScale: 1 + bloom * 0.45 + roots * 0.2,
    };

    this.performanceBase = {
      filterHz: filterOpen,
      driftDepth,
      effectLevels,
      driftLfoRate: bacteria > 0.01 ? 0.04 + bacteria * 0.12 : 0,
    };

    syncGeneratorEcology(this.generator, this.controls);
    syncPerformanceEcology(this.performance, this.controls);
    this.applyPerformanceModulation();
  }

  private applyPerformanceModulation(): void {
    if (!this.synth || !this.effects || !this.performance || !this.performanceBase) {
      return;
    }
    applySeedPerformance(
      this.synth,
      this.effects,
      this.performanceBase,
      this.performance.getTargets(),
      this.audioStarted,
    );
  }
}

/** Create a new Seed Sound World instance (safe across species switches). */
export function createSeedSoundWorld(): SoundWorld {
  return new SeedSoundWorld();
}

/** @deprecated Use {@link createSeedSoundWorld} for runtime audio — metadata only, not a live instance. */
export const seedSpecies = { metadata: SEED_SOUND_WORLD_METADATA } as const;

export { SEED_SUPPORTED_CONTROLS, SEED_DEFAULT_TEMPO, SEED_DEFAULT_SCALE, SEED_SOUND_WORLD_METADATA };
