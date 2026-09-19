import type { EcologicalControl } from '../engine/SoundWorld.js';
import type { PerformanceEngine } from '../engine/performance/PerformanceEngine.js';

/** Push species control state (0–100) into the Performance Engine (0–1). */
export function syncPerformanceEcology(
  performance: PerformanceEngine | null,
  controls: Record<EcologicalControl, number>,
): void {
  if (!performance) {
    return;
  }
  performance.setEcology({
    growth: controls.growth / 100,
    bloom: controls.bloom / 100,
    roots: controls.roots / 100,
    mold: controls.mold / 100,
    bacteria: controls.bacteria / 100,
  });
}
