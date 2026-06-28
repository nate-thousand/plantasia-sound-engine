import type { EngineScheduler } from './EngineScheduler.js';

export type TransportState = 'stopped' | 'playing' | 'paused';

/**
 * Shared transport clock — BPM and play/pause for generative + host scheduling.
 */
export class Transport {
  private bpm = 120;
  private state: TransportState = 'stopped';
  private tickTimer: ReturnType<typeof setTimeout> | null = null;
  private tickHandlers = new Set<(timeMs: number) => void>();

  constructor(private readonly scheduler: EngineScheduler) {}

  getBpm(): number {
    return this.bpm;
  }

  getState(): TransportState {
    return this.state;
  }

  setBpm(bpm: number): void {
    this.bpm = Math.max(20, Math.min(300, bpm));
    if (this.state === 'playing') {
      this.scheduleNextTick();
    }
  }

  onTick(handler: (timeMs: number) => void): () => void {
    this.tickHandlers.add(handler);
    return () => this.tickHandlers.delete(handler);
  }

  play(): void {
    if (this.state === 'playing') {
      return;
    }
    this.state = 'playing';
    this.scheduleNextTick();
  }

  pause(): void {
    this.state = 'paused';
    if (this.tickTimer != null) {
      this.scheduler.clearTimeout(this.tickTimer);
      this.tickTimer = null;
    }
  }

  stop(): void {
    this.state = 'stopped';
    if (this.tickTimer != null) {
      this.scheduler.clearTimeout(this.tickTimer);
      this.tickTimer = null;
    }
  }

  dispose(): void {
    this.stop();
    this.tickHandlers.clear();
  }

  private scheduleNextTick(): void {
    if (this.tickTimer != null) {
      this.scheduler.clearTimeout(this.tickTimer);
    }
    const intervalMs = (60_000 / this.bpm) * 0.25;
    this.tickTimer = this.scheduler.setTimeout(() => {
      this.tickTimer = null;
      if (this.state !== 'playing') {
        return;
      }
      const now = this.scheduler.now();
      for (const handler of this.tickHandlers) {
        handler(now);
      }
      this.scheduleNextTick();
    }, intervalMs);
  }
}
