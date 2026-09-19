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

/**
 * Scheduling lookahead in seconds. Tone defaults to 0.1, which puts 100 ms
 * between `noteOn()` and the first audible sample. 0.01 meets the responsive
 * bar (ROADMAP decision 7); the browser harness watches for dropouts it
 * might cause. Tone derives its clock tick from this (lookAhead / 2).
 */
export const ENGINE_LOOK_AHEAD_SEC = 0.01;

let latencyConfigured = false;

/** Apply the engine's scheduling latency to the shared Tone context. Idempotent. */
export function configureContextLatency(lookAheadSec = ENGINE_LOOK_AHEAD_SEC): void {
  if (latencyConfigured) {
    return;
  }
  try {
    const context = Tone.getContext();
    context.lookAhead = lookAheadSec;
    latencyConfigured = true;
  } catch {
    // no audio context available (Node gates)
  }
}
