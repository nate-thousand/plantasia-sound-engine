import { clamp01, type GenerativeEcology, type GenerativePreferences, type RhythmStyle } from './types.js';

export type RhythmPlan = {
  intervalMs: number;
  cluster: boolean;
  humanizeMs: number;
  stepMs: number;
  holdScale: number;
};

const STYLE_BOUNDS: Record<
  RhythmStyle,
  { minMs: number; maxMs: number; stepMs: number; holdScale: number }
> = {
  sparse: { minMs: 4800, maxMs: 14000, stepMs: 520, holdScale: 1.6 },
  moderate: { minMs: 1800, maxMs: 4200, stepMs: 340, holdScale: 1.0 },
  flowing: { minMs: 2400, maxMs: 5200, stepMs: 420, holdScale: 1.35 },
  swarm: { minMs: 80, maxMs: 900, stepMs: 55, holdScale: 0.35 },
  atmospheric: { minMs: 5200, maxMs: 18000, stepMs: 2800, holdScale: 2.4 },
};

/**
 * Evolving rhythmic structures — variable spacing, humanization, silence, clustering.
 */
export class RhythmEngine {
  private pulseStep = 0;

  reset(): void {
    this.pulseStep = 0;
  }

  /** Optional Euclidean pulse — true when this step is an onset. */
  euclideanOnset(pulses: number, steps: number): boolean {
    if (steps <= 0 || pulses <= 0) {
      return false;
    }
    const bucket = Math.floor((this.pulseStep * pulses) / steps);
    const prev = Math.floor(((this.pulseStep - 1 + steps) % steps) * pulses / steps);
    this.pulseStep = (this.pulseStep + 1) % steps;
    return bucket !== prev;
  }

  nextPlan(ecology: GenerativeEcology, prefs: GenerativePreferences): RhythmPlan {
    const bounds = STYLE_BOUNDS[prefs.rhythmStyle];
    const density = clamp01(prefs.preferredDensity + ecology.growth * 0.35 - ecology.roots * 0.08);
    const range = bounds.maxMs - bounds.minMs;
    let intervalMs = bounds.maxMs - density * range;

    intervalMs *= 1 + ecology.mold * 0.35;
    intervalMs *= 1 - ecology.bacteria * 0.15 * (prefs.rhythmStyle === 'swarm' ? 1 : 0.3);
    intervalMs += Math.random() * range * 0.25;

    const humanizeMs = 20 + ecology.mold * 80 + Math.random() * 60;
    const cluster =
      prefs.rhythmStyle === 'swarm' ||
      (ecology.bacteria > 0.45 && Math.random() < ecology.bacteria * 0.5);

    return {
      intervalMs: Math.max(60, intervalMs),
      cluster,
      humanizeMs,
      stepMs: bounds.stepMs * (0.85 + ecology.mold * 0.25),
      holdScale: bounds.holdScale * (1 + ecology.roots * 0.4 + ecology.bloom * 0.2),
    };
  }

  holdMs(baseMs: number, plan: RhythmPlan, ecology: GenerativeEcology): number {
    let hold = baseMs * plan.holdScale;
    hold *= 1 + ecology.roots * 0.5;
    hold *= 1 - ecology.mold * 0.2;
    return Math.max(80, hold + (Math.random() - 0.5) * plan.humanizeMs);
  }
}
