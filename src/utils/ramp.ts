/**
 * Tone params throw on exponential ramps before the AudioContext is running
 * (their valid range is [0, 0] while suspended). Until the user starts audio we
 * set values immediately; afterwards we ramp smoothly.
 */
export type RampParam = {
  value: unknown;
  linearRampTo?: (value: number, time: number) => unknown;
};

export function setRampParam(
  started: boolean,
  param: RampParam,
  value: number,
  time = 0.2,
): void {
  if (param == null || typeof param !== 'object') {
    return;
  }

  if (started && typeof param.linearRampTo === 'function') {
    param.linearRampTo(value, time);
    return;
  }

  if ('value' in param && param.value !== undefined) {
    (param as { value: number }).value = value;
  }
}

/**
 * Same as {@link setRampParam} for a Tone `NormalRange` param (wet, depth,
 * width, resonance, feedback, room size). Tone throws a RangeError on any
 * write outside [0, 1]; species effect math can land just past 1 at control
 * extremes, so the value is clamped here, at the one place it reaches Tone.
 */
export function setRampNormal(
  started: boolean,
  param: RampParam,
  value: number,
  time = 0.2,
): void {
  const clamped = Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
  setRampParam(started, param, clamped, time);
}
