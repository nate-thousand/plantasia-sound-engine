type TimerKind = 'timeout' | 'interval';

type TimerRecord = {
  id: ReturnType<typeof setTimeout>;
  kind: TimerKind;
};

let nextOwnerId = 1;

/**
 * Central scheduler — owns timers for generative systems, transport, and species layers.
 * Call {@link dispose} on species switch or engine shutdown to prevent leaks.
 */
export class EngineScheduler {
  private timers = new Map<number, TimerRecord>();
  private nextTimerId = 1;
  private disposed = false;

  now(): number {
    return Date.now();
  }

  setTimeout(callback: () => void, delayMs: number, owner = 'engine'): number {
    this.assertActive();
    const timerId = this.nextTimerId++;
    const id = setTimeout(() => {
      this.timers.delete(timerId);
      if (!this.disposed) {
        callback();
      }
    }, delayMs);
    this.timers.set(timerId, { id, kind: 'timeout' });
    void owner;
    return timerId;
  }

  setInterval(callback: () => void, intervalMs: number, owner = 'engine'): number {
    this.assertActive();
    const timerId = this.nextTimerId++;
    const id = setInterval(() => {
      if (!this.disposed) {
        callback();
      }
    }, intervalMs);
    this.timers.set(timerId, { id, kind: 'interval' });
    void owner;
    return timerId;
  }

  clearTimeout(timerId: number): void {
    const record = this.timers.get(timerId);
    if (!record) {
      return;
    }
    clearTimeout(record.id);
    this.timers.delete(timerId);
  }

  clearInterval(timerId: number): void {
    const record = this.timers.get(timerId);
    if (!record) {
      return;
    }
    clearInterval(record.id);
    this.timers.delete(timerId);
  }

  /** Cancel all timers owned by this scheduler instance. */
  clearAll(): void {
    for (const record of this.timers.values()) {
      if (record.kind === 'interval') {
        clearInterval(record.id);
      } else {
        clearTimeout(record.id);
      }
    }
    this.timers.clear();
  }

  dispose(): void {
    this.clearAll();
    this.disposed = true;
  }

  /** Create an isolated child scheduler scope (e.g. per species instance). */
  createScope(_label: string): EngineScheduler {
    return new EngineScheduler();
  }

  get activeTimerCount(): number {
    return this.timers.size;
  }

  private assertActive(): void {
    if (this.disposed) {
      throw new Error('EngineScheduler has been disposed');
    }
  }
}

export function createEngineScheduler(): EngineScheduler {
  return new EngineScheduler();
}

/** @deprecated internal — used for stable owner labels in logs */
export function nextSchedulerOwnerId(): number {
  nextOwnerId += 1;
  return nextOwnerId;
}
