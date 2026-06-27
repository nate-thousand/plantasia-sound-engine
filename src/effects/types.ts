/** Supported effect module identifiers (future effect rack). */
export type EffectId =
  | 'reverb'
  | 'delay'
  | 'chorus'
  | 'phaser'
  | 'distortion'
  | 'eq'
  | 'compression';

/** Placeholder interface for a serializable effect module. */
export interface EffectModule {
  readonly id: EffectId;
  readonly enabled: boolean;
  /** Wet mix 0–1 when applicable. */
  readonly wet: number;
}

/** Ordered effect rack placeholder — DSP wiring not implemented yet. */
export interface EffectRack {
  readonly effects: readonly EffectModule[];
}

/** Create an empty effect rack scaffold. */
export function createEffectRack(): EffectRack {
  return { effects: [] };
}
