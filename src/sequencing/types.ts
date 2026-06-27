/** Euclidean rhythm pattern (placeholder). */
export interface EuclideanPattern {
  steps: number;
  pulses: number;
  rotation: number;
}

/** Arpeggiator mode (placeholder). */
export type ArpMode = 'up' | 'down' | 'upDown' | 'random';

/** Scale quantizer definition (placeholder). */
export interface ScaleQuantizer {
  root: string;
  scale: readonly string[];
}

/** Probability gate for generative sequencing (placeholder). */
export interface ProbabilityGate {
  probability: number;
  seed?: number;
}

/** Sequencing subsystem scaffold — not implemented yet. */
export interface SequencerState {
  euclidean: EuclideanPattern;
  arpMode: ArpMode;
  quantizer: ScaleQuantizer;
  probability: ProbabilityGate;
}

export function createSequencerState(): SequencerState {
  return {
    euclidean: { steps: 16, pulses: 5, rotation: 0 },
    arpMode: 'up',
    quantizer: { root: 'C', scale: ['C', 'D', 'E', 'G', 'A'] },
    probability: { probability: 1 },
  };
}
