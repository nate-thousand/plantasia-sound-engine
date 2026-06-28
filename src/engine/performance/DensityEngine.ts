import { clampPerformance, type DensityState } from './types.js';

const LEGATO_GAP_MS = 280;
const STACCATO_GAP_MS = 90;
const DENSITY_WINDOW = 40;

/**
 * Monitors musical activity — active voices, density, phrase/drone signals.
 */
export class DensityEngine {
  private activeNotes = new Set<string>();
  private noteTimestamps: number[] = [];
  private phraseEvents = 0;
  private harmonicEvents = 0;
  private droneEvents = 0;
  private generativeEvents = 0;

  reset(): void {
    this.activeNotes.clear();
    this.noteTimestamps = [];
    this.phraseEvents = 0;
    this.harmonicEvents = 0;
    this.droneEvents = 0;
    this.generativeEvents = 0;
  }

  noteOn(note: string): void {
    this.activeNotes.add(note);
    this.noteTimestamps.push(Date.now());
    if (this.noteTimestamps.length > DENSITY_WINDOW) {
      this.noteTimestamps.shift();
    }
    this.harmonicEvents += 1;
  }

  noteOff(note: string): void {
    this.activeNotes.delete(note);
  }

  recordGenerative(kind: 'phrase' | 'chord' | 'drone' | 'ornament' | 'particle'): void {
    this.generativeEvents += 1;
    if (kind === 'phrase' || kind === 'ornament') {
      this.phraseEvents += 1;
    }
    if (kind === 'chord') {
      this.harmonicEvents += 1;
    }
    if (kind === 'drone') {
      this.droneEvents += 1;
    }
  }

  /** Decay activity counters slowly (call periodically). */
  tick(): void {
    this.phraseEvents *= 0.92;
    this.harmonicEvents *= 0.94;
    this.droneEvents *= 0.9;
    this.generativeEvents *= 0.93;
  }

  getState(): DensityState {
    const now = Date.now();
    const recent = this.noteTimestamps.filter((t) => now - t < 4000);
    const averageDensity = clampPerformance(recent.length / 12, 0, 1);

    return {
      activeNotes: this.activeNotes.size,
      averageDensity,
      phraseActivity: clampPerformance(this.phraseEvents / 8, 0, 1),
      harmonicActivity: clampPerformance(this.harmonicEvents / 10, 0, 1),
      droneActivity: clampPerformance(this.droneEvents / 6, 0, 1),
      generativeEvents: this.generativeEvents,
    };
  }

  isLegato(): boolean {
    if (this.noteTimestamps.length < 2) {
      return false;
    }
    const last = this.noteTimestamps[this.noteTimestamps.length - 1] ?? 0;
    const prev = this.noteTimestamps[this.noteTimestamps.length - 2] ?? 0;
    return last - prev < LEGATO_GAP_MS && this.activeNotes.size > 1;
  }

  isStaccato(): boolean {
    if (this.noteTimestamps.length < 2) {
      return false;
    }
    const last = this.noteTimestamps[this.noteTimestamps.length - 1] ?? 0;
    const prev = this.noteTimestamps[this.noteTimestamps.length - 2] ?? 0;
    return last - prev > STACCATO_GAP_MS && this.activeNotes.size <= 1;
  }

  isChordHeld(): boolean {
    return this.activeNotes.size >= 2;
  }
}
