import { Generator, type GenerativeEcology } from '../../engine/generative/Generator.js';
import { TEMPLATE_GENERATIVE_PREFERENCES } from './metadata.js';

export type TemplateGeneratorCallbacks = {
  noteOn: (note: string, velocity: number) => void;
  noteOff: (note: string) => void;
};

/**
 * Thin adapter — delegates composition to the shared Generative Engine.
 * Do not duplicate phrase/harmony logic here.
 */
export class TemplateGenerator {
  private readonly engine: Generator;

  constructor(callbacks: TemplateGeneratorCallbacks) {
    this.engine = new Generator(TEMPLATE_GENERATIVE_PREFERENCES, callbacks);
  }

  setEcology(partial: Partial<GenerativeEcology>): void {
    this.engine.setEcology(partial);
  }

  start(tempo = TEMPLATE_GENERATIVE_PREFERENCES.preferredTempo): void {
    this.engine.start(tempo);
  }

  stop(): void {
    this.engine.stop();
  }

  triggerNote(note: string, velocity: number): void {
    this.engine.triggerAtNote(note, velocity);
  }

  releaseNote(_note: string): void {
    // Micro-voices or sustained voices — release if applicable
  }

  releaseAll(): void {
    this.stop();
  }

  dispose(): void {
    this.engine.dispose();
  }
}
