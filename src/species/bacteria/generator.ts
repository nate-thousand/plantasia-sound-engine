import * as Tone from 'tone';
import type { EngineScheduler } from '../../engine/scheduler/EngineScheduler.js';
import { fromSpeciesControlValue } from '../../engine/EcologyControls.js';
import {
  Generator,
  type GenerativeCallbacks,
  type GenerativeEcology,
} from '../../engine/generative/Generator.js';
import { BACTERIA_GENERATIVE_PREFERENCES } from './metadata.js';

export type BacteriaGeneratorCallbacks = {
  onParticle: (type: 'noise' | 'fm' | 'sine' | 'impulse', note: string, velocity: number) => void;
};

export type BacteriaGeneratorOptions = {
  scheduler?: EngineScheduler;
};

const PARTICLE_TYPES = ['noise', 'fm', 'sine', 'impulse'] as const;

/** Bacteria generative adapter — particle swarms via shared engine. */
export class BacteriaGenerator {
  private readonly engine: Generator;
  private particleIndex = 0;

  constructor(
    callbacks: BacteriaGeneratorCallbacks,
    generativeCallbacks: GenerativeCallbacks,
    options: BacteriaGeneratorOptions = {},
  ) {
    this.engine = new Generator(BACTERIA_GENERATIVE_PREFERENCES, {
      noteOn: (note, velocity) => {
        generativeCallbacks.onGeneratorEvent?.({ kind: 'particle', note, velocity });
        generativeCallbacks.noteOn(note, velocity);
        const type = PARTICLE_TYPES[this.particleIndex % PARTICLE_TYPES.length] ?? 'sine';
        this.particleIndex += 1;
        callbacks.onParticle(type, note, velocity);
      },
      noteOff: generativeCallbacks.noteOff,
      onGlitch: (intensity) => {
        generativeCallbacks.onGeneratorEvent?.({ kind: 'glitch', intensity });
        generativeCallbacks.onGlitch?.(intensity);
        callbacks.onParticle('noise', 'E5', 0.12 + intensity * 0.25);
      },
      onGeneratorEvent: generativeCallbacks.onGeneratorEvent,
    }, { scheduler: options.scheduler });
  }

  setEcology(partial: Partial<GenerativeEcology>): void {
    this.engine.setEcology(partial);
  }

  setGrowth(value: number): void {
    this.engine.setEcology({ growth: fromSpeciesControlValue(value) });
  }

  setBloom(value: number): void {
    this.engine.setEcology({ bloom: fromSpeciesControlValue(value) });
  }

  setRoots(value: number): void {
    this.engine.setEcology({ roots: fromSpeciesControlValue(value) });
  }

  setMold(value: number): void {
    this.engine.setEcology({ mold: fromSpeciesControlValue(value) });
  }

  setBacteria(value: number): void {
    this.engine.setEcology({ bacteria: fromSpeciesControlValue(value) });
  }

  triggerAtNote(note: string, velocity: number): void {
    this.engine.triggerAtNote(note, velocity);
  }

  start(tempo = BACTERIA_GENERATIVE_PREFERENCES.preferredTempo): void {
    this.stop();
    Tone.getTransport().bpm.value = tempo;
    this.engine.start(tempo);
  }

  stop(): void {
    this.engine.stop();
  }

  dispose(): void {
    this.engine.stop();
    this.engine.dispose();
  }
}
