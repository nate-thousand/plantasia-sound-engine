import * as Tone from 'tone';
import { fromSpeciesControlValue } from '../../engine/EcologyControls.js';
import { Generator, type GenerativeEcology } from '../../engine/generative/Generator.js';
import { MOLD_GENERATIVE_PREFERENCES } from './metadata.js';

export type MoldGeneratorCallbacks = {
  noteOn: (note: string, velocity: number) => void;
  noteOff: (note: string) => void;
  onGlitch?: (intensity: number) => void;
};

/** Mold generative adapter — sparse drones and decay clusters via shared engine. */
export class MoldGenerator {
  private readonly engine: Generator;

  constructor(callbacks: MoldGeneratorCallbacks) {
    this.engine = new Generator(MOLD_GENERATIVE_PREFERENCES, {
      noteOn: callbacks.noteOn,
      noteOff: callbacks.noteOff,
      onGlitch: callbacks.onGlitch,
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
