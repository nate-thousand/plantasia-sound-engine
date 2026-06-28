import { clampPerformance } from './types.js';

const SMOOTH = 0.35;

/**
 * Expands velocity beyond volume — filter, envelope, brightness, space, saturation.
 */
export class VelocityEngine {
  private smoothed = 0.5;
  private lastRaw = 0.5;
  private peak = 0.5;

  reset(): void {
    this.smoothed = 0.5;
    this.lastRaw = 0.5;
    this.peak = 0.5;
  }

  /** @param velocity 0–1 normalized */
  input(velocity: number): void {
    const v = clampPerformance(velocity, 0, 1);
    this.lastRaw = v;
    this.smoothed = this.smoothed * (1 - SMOOTH) + v * SMOOTH;
    this.peak = Math.max(this.peak * 0.995, v);
  }

  getSmoothed(): number {
    return this.smoothed;
  }

  getLast(): number {
    return this.lastRaw;
  }

  getPeak(): number {
    return this.peak;
  }

  /** Per-note expressive scale (soft floor, musical curve). */
  noteScale(velocity: number): number {
    const v = clampPerformance(velocity, 0, 1);
    return 0.35 + Math.pow(v, 1.15) * 0.65;
  }

  tick(): void {
    this.peak *= 0.998;
  }
}
