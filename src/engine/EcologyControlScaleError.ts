import type { EcologicalControl } from './SoundWorld.js';

/**
 * Thrown when an ecological control value is outside the normalized 0–1 host boundary.
 */
export class EcologyControlScaleError extends Error {
  readonly control: EcologicalControl | undefined;
  readonly value: number;

  constructor(control: EcologicalControl | undefined, value: number) {
    const controlLabel = control ? `"${control}"` : 'control';
    let hint = 'Ecological controls must be normalized to the 0–1 range at the host boundary.';
    if (value > 1 && value <= 100) {
      hint += ` Did you pass a 0–100 value? Try ${control ? `${control}: ` : ''}${value / 100}.`;
    }
    super(`Invalid ${controlLabel} value ${value}. ${hint}`);
    this.name = 'EcologyControlScaleError';
    this.control = control;
    this.value = value;
  }
}

/** Validate a host-facing ecological control value (0–1 inclusive). */
export function assertNormalizedEcologyValue(
  value: number,
  control?: EcologicalControl,
): void {
  if (Number.isNaN(value) || value < 0 || value > 1) {
    throw new EcologyControlScaleError(control, value);
  }
}
