import * as Tone from 'tone';
import type { EngineScheduler } from '../../engine/scheduler/EngineScheduler.js';
import { fromSpeciesControlValue } from '../../engine/EcologyControls.js';
import {
  Generator,
  type GenerativeCallbacks,
  type GenerativeEcology,
} from '../../engine/generative/Generator.js';
import { SEED_GENERATIVE_PREFERENCES } from './metadata.js';

export type SeedGeneratorOptions = {
  scheduler?: EngineScheduler;
};

/** Seed generative adapter — delegates to the shared Generative Engine. */
export class SeedGenerator {
  private readonly engine: Generator;

  constructor(callbacks: GenerativeCallbacks, options: SeedGeneratorOptions = {}) {
    this.engine = new Generator(SEED_GENERATIVE_PREFERENCES, callbacks, {
      scheduler: options.scheduler,
    });
  }

  setEcology(partial: Partial<GenerativeEcology>): void {
    this.engine.setEcology(partial);
  }

  setGrowth(value: number): void {
    this.engine.setEcology({ growth: fromSpeciesControlValue(value) });
  }

  setBacteria(value: number): void {
    this.engine.setEcology({ bacteria: fromSpeciesControlValue(value) });
  }

  start(tempo = SEED_GENERATIVE_PREFERENCES.preferredTempo): void {
    this.stop();
    Tone.getTransport().bpm.value = tempo;
    this.engine.start(tempo);
  }

  stop(): void {
    this.engine.stop();
  }

  dispose(): void {
    this.engine.dispose();
  }
}
