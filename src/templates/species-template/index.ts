import type { EcologicalControl, SoundWorld } from '../../engine/SoundWorld.js';
import type { SpeciesModulationFrame } from '../../engine/modulation/types.js';
import { syncGeneratorEcology } from '../../shared/syncGeneratorEcology.js';
import { syncPerformanceEcology } from '../../shared/syncPerformanceEcology.js';
import { PerformanceEngine } from '../../engine/performance/PerformanceEngine.js';
import { TEMPLATE_EXPRESSION_PROFILE } from './expressionProfile.js';
import { applyTemplatePerformance, type TemplatePerformanceBase } from './performanceApply.js';
import { TemplateGenerator } from './generator.js';
import {
  TEMPLATE_DEFAULT_TEMPO,
  TEMPLATE_SOUND_WORLD_METADATA,
  TEMPLATE_SUPPORTED_CONTROLS,
} from './metadata.js';

type TemplateControlState = Record<EcologicalControl, number>;

const DEFAULT_CONTROLS: TemplateControlState = {
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
 * Template Sound World — copy this folder to create a new species.
 *
 * Replace "Template" with your species name throughout.
 * Implement synth.ts, effects.ts, generator.ts, and metadata.ts.
 */
export class TemplateSoundWorld implements SoundWorld {
  readonly metadata = TEMPLATE_SOUND_WORLD_METADATA;

  private polyphonyCap: number | null = null;
  private controls: TemplateControlState = { ...DEFAULT_CONTROLS };
  private generator: TemplateGenerator | null = null;
  private performance: PerformanceEngine | null = null;
  private performanceBase: TemplatePerformanceBase | null = null;
  private audioStarted = false;
  private modulation: SpeciesModulationFrame | null = null;

  async initialize(_context?: unknown): Promise<void> {
    this.controls = { ...DEFAULT_CONTROLS };
    this.audioStarted = false;
    this.teardownGraph();
  }

  start(): void {
    void this.ensureGraph().then(() => {
      syncGeneratorEcology(this.generator, this.controls);
      this.generator?.start(TEMPLATE_DEFAULT_TEMPO);
    });
  }

  stop(): void {
    this.generator?.stop();
  }

  noteOn(note: string, velocity = 0.8): void {
    if (!this.audioStarted) {
      return;
    }
    const ctx = this.performance?.noteOn(note, velocity);
    this.applyPerformanceModulation();
    this.generator?.triggerNote(note, ctx?.shapedVelocity ?? velocity);
  }

  noteOff(note: string): void {
    this.performance?.noteOff(note);
    this.applyPerformanceModulation();
    this.generator?.releaseNote(note);
  }

  allNotesOff(): void {
    this.generator?.releaseAll();
  }

  setControl(control: EcologicalControl, value: number): void {
    if (!TEMPLATE_SUPPORTED_CONTROLS.includes(control)) {
      return;
    }
    this.controls[control] = clampControl(value);
    this.applyEcologicalControls();
  }

  /**
   * Optional (engine 1.1). Arrives at 30 Hz while modulation routes exist:
   * `frame.controls` are the modulated values (0..100), `frame.targets` are
   * offsets to add to the routed performance targets, `frame.rampSec` is one
   * tick. `frame.routes === 0` is the clearing frame; drop the held frame.
   * Read `this.modulation?.controls ?? this.controls` wherever ecology is
   * applied, and pass `rampSec` to your ramps. See the built in species.
   */
  applyModulation(frame: SpeciesModulationFrame): void {
    this.modulation = frame.routes > 0 ? frame : null;
    this.applyEcologicalControls();
  }

  /**
   * Optional (engine 1.2). Host voice cap; `null` removes it. Keep your own
   * polyphony curve and clamp it to the cap wherever you set `maxPolyphony`.
   */
  setPolyphony(voices: number | null): void {
    this.polyphonyCap = voices;
    this.applyEcologicalControls();
  }

  dispose(): void {
    this.stop();
    this.teardownGraph();
    this.audioStarted = false;
  }

  private async ensureGraph(): Promise<void> {
    if (this.generator && this.performance) {
      return;
    }

    this.teardownGraph();

    // TODO: create synth + effects, connect graph
    // this.synth = createTemplateSynth();
    // this.effects = createTemplateEffects();
    // connectTemplateEffects(this.synth.output, this.effects);

    this.generator = new TemplateGenerator({
      noteOn: (note, velocity) => {
        this.performance?.recordGenerativeActivity('phrase');
        this.noteOn(note, velocity);
      },
      noteOff: (note) => this.noteOff(note),
    });

    this.performance = new PerformanceEngine(TEMPLATE_EXPRESSION_PROFILE);
    syncPerformanceEcology(this.performance, this.controls);
    this.audioStarted = true;
    this.applyEcologicalControls();
  }

  private teardownGraph(): void {
    this.performance?.reset();
    this.performance = null;
    this.performanceBase = null;
    this.generator?.dispose();
    this.generator = null;
    // TODO: dispose synth + effects
  }

  private applyEcologicalControls(): void {
    if (!this.generator) {
      return;
    }

    const controls = this.modulation?.controls ?? this.controls;
    const growth = controls.growth / 100;
    const bloom = controls.bloom / 100;
    const roots = controls.roots / 100;
    const mold = controls.mold / 100;
    const bacteria = controls.bacteria / 100;

    // Polyphony: your own curve, clamped to the host cap (engine 1.2).
    const curve = Math.round(3 + growth * 5);
    const polyphony = this.polyphonyCap === null ? curve : Math.max(1, Math.min(curve, this.polyphonyCap));
    void polyphony; // TODO: this.synth.poly.maxPolyphony = polyphony

    // TODO: map ecology → base DSP levels
    this.performanceBase = {
      filterHz: 1200 * (1 + growth * 0.2 + bloom * 0.1),
      effectLevels: {
        reverbWet: 0.2 + bloom * 0.3,
        chorusWet: 0.15 + bloom * 0.25,
        releaseScale: 1 + bloom * 0.4 + roots * 0.15,
      },
    };

    void mold;
    void bacteria;

    syncGeneratorEcology(this.generator, this.controls);
    syncPerformanceEcology(this.performance, this.controls);
    this.applyPerformanceModulation();
  }

  private applyPerformanceModulation(): void {
    if (!this.performance || !this.performanceBase) {
      return;
    }
    // TODO: pass synth + effects when implemented
    applyTemplatePerformance(
      this.performanceBase,
      this.performance.getTargets(),
      this.audioStarted,
    );
  }
}

/** Factory for registry registration. */
export function createTemplateSoundWorld(): SoundWorld {
  return new TemplateSoundWorld();
}
