import type { MoldStageId } from './types.js';
import { normalizeMold } from './normalize.js';

/** Smooth 0–1 ramp across a mold sub-range. */
export function stageAmount(mold: number, start: number, end: number): number {
  const t = normalizeMold(mold) / 100;
  if (t <= start) return 0;
  if (t >= end) return 1;
  const x = (t - start) / (end - start);
  return x * x * (3 - 2 * x);
}

/**
 * Resolve per-stage blend weights for the five mold bands:
 * 0–20% aging, 20–40% decay, 40–60% mutation, 60–80% corruption, 80–100% overgrowth.
 */
export function resolveMoldStages(mold: number): Record<MoldStageId, number> {
  return {
    aging: stageAmount(mold, 0, 0.2),
    decay: stageAmount(mold, 0.2, 0.4),
    mutation: stageAmount(mold, 0.4, 0.6),
    corruption: stageAmount(mold, 0.6, 0.8),
    overgrowth: stageAmount(mold, 0.8, 1),
  };
}
