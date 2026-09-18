/**
 * Audio clock — the time base every engine event is stamped with.
 *
 * Returns AudioContext seconds so hosts can place events against sound
 * rather than against wall time. Falls back to a monotonic clock when no
 * audio context exists (Node gates, pre-init).
 */
import * as Tone from 'tone';

export function audioNow(): number {
  try {
    const t = Tone.getContext().currentTime;
    if (Number.isFinite(t) && t > 0) {
      return t;
    }
  } catch {
    // no audio context yet
  }
  return typeof performance !== 'undefined' ? performance.now() / 1000 : Date.now() / 1000;
}
