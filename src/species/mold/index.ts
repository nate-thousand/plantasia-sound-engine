import * as Tone from 'tone';
import type { EcologicalControl, SoundWorld, SoundWorldStartOptions } from '../../engine/SoundWorld.js';
import type { SpeciesModulationFrame } from '../../engine/modulation/types.js';
import type { GenerativePreferences } from '../../engine/generative/types.js';
import { ChangeGate, mergeModulationTargets } from '../../shared/modulationFrame.js';
import { setRampParam, type RampParam } from '../../utils/ramp.js';
import {
  connectMoldEffects,
  createMoldEffects,
  disposeMoldEffects,
  MOLD_PRE_BANDPASS_HZ,
  type MoldEffectsNodes,
} from './effects.js';
import { MoldGenerator } from './generator.js';
import {
  MOLD_DEFAULT_TEMPO,
  MOLD_DEFAULT_SCALE,
  MOLD_SOUND_WORLD_METADATA,
  MOLD_SUPPORTED_CONTROLS,
  MOLD_GENERATIVE_PREFERENCES,
} from './metadata.js';
import {
  createMoldSynth,
  disposeMoldSynth,
  MOLD_BANDPASS_HZ,
  MOLD_MAX_POLYPHONY,
  releaseAllMold,
  triggerMoldAttack,
  triggerMoldGlitch,
  triggerMoldRelease,
  type MoldSynthNodes,
} from './synth.js';
import { syncGeneratorEcology } from '../../shared/syncGeneratorEcology.js';
import { syncPerformanceEcology } from '../../shared/syncPerformanceEcology.js';
import { PerformanceEngine } from '../../engine/performance/PerformanceEngine.js';
import { MOLD_EXPRESSION_PROFILE } from './expressionProfile.js';
import {
  applyMoldPerformance,
  type MoldPerformanceBase,
} from './performanceApply.js';
import { readSoundWorldContext } from '../../engine/SoundWorldContext.js';
import type { EngineEventSink } from '../../engine/events/EngineEventBus.js';
import type { EngineScheduler } from '../../engine/scheduler/EngineScheduler.js';
import { buildGenerativeCallbacks } from '../../shared/buildGenerativeCallbacks.js';

type MoldControlState = Record<EcologicalControl, number>;

const DEFAULT_CONTROLS: MoldControlState = {
  growth: 35,
  bloom: 40,
  roots: 55,
  mold: 58,
  bacteria: 22,
};

function clampControl(value: number): number {
  return Math.max(0, Math.min(100, value));
}

/**
 * Mold — decay Sound World.
 * Layered drones, soft FM haze, and a continuously evolving degradation chain.
 */
export class MoldSoundWorld implements SoundWorld {
  readonly metadata = MOLD_SOUND_WORLD_METADATA;

  private polyphonyCap: number | null = null;
  private synth: MoldSynthNodes | null = null;
  private effects: MoldEffectsNodes | null = null;
  private generator: MoldGenerator | null = null;
  private controls: MoldControlState = { ...DEFAULT_CONTROLS };
  private modulation: SpeciesModulationFrame | null = null;
  private preferenceOverrides: Partial<GenerativePreferences> = {};
  private readonly gate = new ChangeGate();
  private audioStarted = false;
  private performance: PerformanceEngine | null = null;
  private performanceBase: MoldPerformanceBase | null = null;
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
        this.generator?.start(MOLD_DEFAULT_TEMPO);
      }
    });
  }

  stop(): void {
    this.generator?.stop();
    if (this.synth) {
      releaseAllMold(this.synth);
    }
  }

  noteOn(note: string, velocity = 0.7): void {
    if (!this.audioStarted || !this.synth) {
      return;
    }
    const ctx = this.performance?.noteOn(note, velocity);
    this.applyPerformanceModulation();
    this.eventSink?.emitDensityChanged({
      density: this.performance?.getDensityEngine().getState().averageDensity ?? 0,
    });
    const roots = this.effectiveControls().roots / 100;
    const transpose = roots > 0.35 ? -12 : roots > 0.15 ? -7 : 0;
    const pitched = Tone.Frequency(note).transpose(transpose).toNote();
    const layers = this.layerLevels();
    triggerMoldAttack(this.synth, pitched, ctx?.shapedVelocity ?? velocity, layers);
  }

  noteOff(note: string): void {
    if (!this.synth) {
      return;
    }
    this.performance?.noteOff(note);
    this.applyPerformanceModulation();
    const roots = this.effectiveControls().roots / 100;
    const transpose = roots > 0.35 ? -12 : roots > 0.15 ? -7 : 0;
    const pitched = Tone.Frequency(note).transpose(transpose).toNote();
    triggerMoldRelease(this.synth, pitched);
  }

  allNotesOff(): void {
    if (this.synth) {
      releaseAllMold(this.synth);
    }
  }

  setGenerativePreferences(partial: Partial<GenerativePreferences>): void {
    this.preferenceOverrides = { ...this.preferenceOverrides, ...partial };
    this.generator?.setPreferences(partial);
  }

  getGenerativePreferences(): Readonly<GenerativePreferences> {
    return this.generator?.getPreferences() ?? { ...MOLD_GENERATIVE_PREFERENCES, ...this.preferenceOverrides };
  }

  setPolyphony(voices: number | null): void {
    this.polyphonyCap = voices;
    this.applyEcologicalControls();
  }

  applyModulation(frame: SpeciesModulationFrame): void {
    this.modulation = frame.routes > 0 ? frame : null;
    this.applyEcologicalControls(frame.rampSec);
  }

  setControl(control: EcologicalControl, value: number, rampSec = 0.2): void {
    if (!MOLD_SUPPORTED_CONTROLS.includes(control)) {
      return;
    }
    this.controls[control] = clampControl(value);
    this.applyEcologicalControls(rampSec);
  }

  dispose(): void {
    this.stop();
    this.teardownGraph();
    this.audioStarted = false;
  }

  private layerLevels(): { fmLevel: number; harmonicLevel: number; noiseLevel: number } {
    const growth = this.effectiveControls().growth / 100;
    return {
      fmLevel: 0.15 + growth * 0.75,
      harmonicLevel: 0.08 + growth * 0.65,
      noiseLevel: 0.006 + growth * 0.022,
    };
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

    this.synth = createMoldSynth();
    this.effects = createMoldEffects();
    connectMoldEffects(this.synth.bandpass, this.effects);

    this.generator = new MoldGenerator(
      buildGenerativeCallbacks(
        {
          noteOn: (note, velocity) => {
            this.performance?.recordGenerativeActivity('drone');
            this.noteOn(note, velocity);
          },
          noteOff: (note) => this.noteOff(note),
          onGlitch: (intensity) => {
            this.performance?.recordGenerativeActivity('ornament');
            if (this.synth) {
              triggerMoldGlitch(this.synth, intensity);
            }
          },
        },
        this.eventSink,
      ),
      { scheduler: this.scheduler },
    );

    if (Object.keys(this.preferenceOverrides).length > 0) {
      this.generator.setPreferences(this.preferenceOverrides);
    }

    this.performance = new PerformanceEngine(MOLD_EXPRESSION_PROFILE);
    syncPerformanceEcology(this.performance, this.controls);

    this.applyEcologicalControls();
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
      disposeMoldSynth(this.synth);
      this.synth = null;
    }
    if (this.effects) {
      disposeMoldEffects(this.effects);
      this.effects = null;
    }
  }

  /** Host controls, or the modulated values of the current frame. */
  private effectiveControls(): MoldControlState {
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

    const curve = Math.round(2 + growth * (MOLD_MAX_POLYPHONY - 2));
    const polyphony = this.polyphonyCap === null ? curve : Math.max(1, Math.min(curve, this.polyphonyCap));
    if (this.gate.changed('polyphony', polyphony, 0.5)) {
      this.synth.dronePoly.maxPolyphony = polyphony;
      this.synth.fmPoly.maxPolyphony = polyphony;
      this.synth.harmonicPoly.maxPolyphony = polyphony;
    }

    const bandCenter = MOLD_BANDPASS_HZ * (0.75 + roots * 0.35) * (1 + bloom * 0.28);
    const filterDepth = 0.22 + mold * 0.28 + bacteria * 0.08;
    const layers = this.layerLevels();
    setRampParam(this.audioStarted, this.synth.fmPoly.volume as unknown as RampParam, Tone.gainToDb(layers.fmLevel), rampSec);
    setRampParam(this.audioStarted, this.synth.harmonicPoly.volume as unknown as RampParam, Tone.gainToDb(layers.harmonicLevel), rampSec);

    const preBandCenter = MOLD_PRE_BANDPASS_HZ * (0.7 + bloom * 0.55) * (0.85 + roots * 0.25);

    this.performanceBase = {
      bandCenter,
      filterDepth,
      preBandCenter,
      effectLevels: {
        tapeWet: 0.12 + mold * 0.48,
        tapeDrive: 0.08 + mold * 0.38,
        softDistWet: 0.06 + mold * 0.32,
        softDistDrive: 0.1 + mold * 0.42,
        bitCrushWet: 0.02 + mold * 0.22 + bacteria * 0.08,
        bitCrushBits: Math.max(4, 16 - mold * 10 - bacteria * 2),
        combResonance: 0.18 + mold * 0.55 + bloom * 0.12,
        microDelayWet: 0.04 + mold * 0.18 + bacteria * 0.12,
        microDelayFeedback: 0.28 + mold * 0.45 + bacteria * 0.15,
        feedbackDelayWet: 0.18 + bloom * 0.38 + mold * 0.22,
        feedbackDelayFeedback: 0.22 + mold * 0.58,
        vibratoWet: 0.1 + mold * 0.35,
        vibratoDepth: 0.02 + mold * 0.08 + bacteria * 0.03,
        reverbWet: 0.38 + bloom * 0.48 + mold * 0.12,
        wowDepth: 0.001 + mold * 0.004,
        flutterDepth: 0.0004 + mold * 0.002 + bacteria * 0.0006,
        releaseScale: 1 + bloom * 0.35 + mold * 0.55 + roots * 0.25,
      },
    };

    setRampParam(this.audioStarted, this.synth.noiseGain.gain as unknown as RampParam, layers.noiseLevel);

    syncGeneratorEcology(this.generator, controls);
    syncPerformanceEcology(this.performance, controls);
    this.applyPerformanceModulation(rampSec);
  }

  private applyPerformanceModulation(rampSec = 0.2): void {
    if (!this.synth || !this.effects || !this.performance || !this.performanceBase) {
      return;
    }
    applyMoldPerformance(
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

export function createMoldSoundWorld(): SoundWorld {
  return new MoldSoundWorld();
}

/** @deprecated Use {@link createMoldSoundWorld} for runtime audio — metadata only, not a live instance. */
export const moldSpecies = { metadata: MOLD_SOUND_WORLD_METADATA } as const;

export {
  MOLD_SUPPORTED_CONTROLS,
  MOLD_DEFAULT_TEMPO,
  MOLD_DEFAULT_SCALE,
  MOLD_SOUND_WORLD_METADATA,
};
