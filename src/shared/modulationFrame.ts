import type { PerformanceTargets } from '../engine/performance/types.js';
import type { SpeciesModulationFrame } from '../engine/modulation/types.js';

/** Routed targets plus the modulation offsets of the current frame. */
export function mergeModulationTargets(
  targets: Readonly<PerformanceTargets>,
  frame: SpeciesModulationFrame | null,
): PerformanceTargets {
  if (!frame) {
    return targets;
  }
  const merged: PerformanceTargets = { ...targets };
  for (const [key, offset] of Object.entries(frame.targets)) {
    if (offset !== undefined) {
      const k = key as keyof PerformanceTargets;
      if (k !== 'legato') {
        (merged as unknown as Record<string, number>)[k] = (targets[k] as number) + offset;
      }
    }
  }
  return merged;
}

/**
 * Keep the last value written to an expensive setter (PolySynth.set) and
 * report whether a new value differs enough to write again. Modulation
 * ticks at 30 Hz; without this every tick would touch every voice.
 */
export class ChangeGate {
  private last = new Map<string, number>();

  changed(key: string, value: number, epsilon = 0.005): boolean {
    const prev = this.last.get(key);
    if (prev !== undefined && Math.abs(prev - value) <= epsilon) {
      return false;
    }
    this.last.set(key, value);
    return true;
  }

  reset(): void {
    this.last.clear();
  }
}
