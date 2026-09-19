import type { EcologicalControl, SoundWorld } from './SoundWorld.js';

/** All shared ecological controls in stable order. */
export const ECOLOGICAL_CONTROLS: readonly EcologicalControl[] = [
  'growth',
  'bloom',
  'roots',
  'mold',
  'bacteria',
] as const;

export type EcologyControlState = Record<EcologicalControl, number>;

/** Default normalized control state (aligned with Seed species defaults). */
export const DEFAULT_ECOLOGY_STATE: EcologyControlState = {
  growth: 0.42,
  bloom: 0.48,
  roots: 0.35,
  mold: 0.12,
  bacteria: 0.18,
};

/** Clamp a normalized ecological value to the 0–1 range. */
export function clampEcologyValue(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }
  return Math.max(0, Math.min(1, value));
}

/** Convert normalized 0–1 value to species-internal 0–100 scale. */
export function toSpeciesControlValue(normalized: number): number {
  return clampEcologyValue(normalized) * 100;
}

/** Convert species-internal 0–100 value to normalized 0–1 scale. */
export function fromSpeciesControlValue(value: number): number {
  return clampEcologyValue(value / 100);
}

/**
 * Shared ecological control layer — stores normalized state and routes updates
 * to Sound Worlds. Species interpret each control differently in `setControl`.
 */
export class EcologyControls {
  private state: EcologyControlState;

  constructor(initial?: Partial<EcologyControlState>) {
    this.state = { ...DEFAULT_ECOLOGY_STATE };
    if (initial) {
      this.setState(initial);
    }
  }

  set(control: EcologicalControl, value: number): void {
    this.state[control] = clampEcologyValue(value);
  }

  get(control: EcologicalControl): number {
    return this.state[control];
  }

  getState(): Readonly<EcologyControlState> {
    return { ...this.state };
  }

  reset(): void {
    this.state = { ...DEFAULT_ECOLOGY_STATE };
  }

  setState(partial: Partial<EcologyControlState>): void {
    for (const control of ECOLOGICAL_CONTROLS) {
      const value = partial[control];
      if (value !== undefined) {
        this.set(control, value);
      }
    }
  }

  /** Push current state to a Sound World (converts 0–1 → 0–100 for species mappings). */
  applyTo(soundWorld: SoundWorld): void {
    for (const control of ECOLOGICAL_CONTROLS) {
      soundWorld.setControl(control, toSpeciesControlValue(this.state[control]));
    }
  }
}
