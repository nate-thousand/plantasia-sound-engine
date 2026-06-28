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
