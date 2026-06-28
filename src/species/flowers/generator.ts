import * as Tone from 'tone';
import { fromSpeciesControlValue } from '../../engine/EcologyControls.js';
import { Generator, type GenerativeEcology } from '../../engine/generative/Generator.js';
import { FLOWERS_GENERATIVE_PREFERENCES } from './metadata.js';

export type FlowersGeneratorCallbacks = {
  noteOn: (note: string, velocity: number) => void;
  noteOff: (note: string) => void;
};

/** Flowers generative adapter — chord blooms and flowing phrases via shared engine. */
export class FlowersGenerator {
  private readonly engine: Generator;

  constructor(callbacks: FlowersGeneratorCallbacks) {
    this.engine = new Generator(FLOWERS_GENERATIVE_PREFERENCES, callbacks);
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

  start(tempo = FLOWERS_GENERATIVE_PREFERENCES.preferredTempo): void {
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
