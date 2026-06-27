/**
 * Tone params throw on exponential ramps before the AudioContext is running
 * (their valid range is [0, 0] while suspended). Until the user starts audio we
 * set values immediately; afterwards we ramp smoothly.
 */
export type RampParam = {
  value: unknown;
  linearRampTo: (value: number, time: number) => unknown;
};

export function setRampParam(
  started: boolean,
  param: RampParam,
  value: number,
  time = 0.2,
): void {
  if (started) {
    param.linearRampTo(value, time);
  } else {
    (param as { value: number }).value = value;
  }
}
