import * as Tone from 'tone';
import type { EngineScheduler } from '../../engine/scheduler/EngineScheduler.js';
import { fromSpeciesControlValue } from '../../engine/EcologyControls.js';
import {
  Generator,
  type GenerativeCallbacks,
  type GenerativeEcology,
} from '../../engine/generative/Generator.js';
import { MOLD_GENERATIVE_PREFERENCES } from './metadata.js';

export type MoldGeneratorOptions = {
  scheduler?: EngineScheduler;
};

/** Mold generative adapter — sparse drones and decay clusters via shared engine. */
export class MoldGenerator {
  private readonly engine: Generator;

  constructor(callbacks: GenerativeCallbacks, options: MoldGeneratorOptions = {}) {
    this.engine = new Generator(MOLD_GENERATIVE_PREFERENCES, callbacks, {
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

  start(tempo = MOLD_GENERATIVE_PREFERENCES.preferredTempo): void {
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
