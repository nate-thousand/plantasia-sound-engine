import type { GenerativeEcology, GenerativePreferences } from './types.js';

const MAX_RECENT_NOTES = 32;
const MAX_PHRASE_HISTORY = 16;
const MAX_HARMONIC_HISTORY = 12;
const MAX_DENSITY_HISTORY = 24;

/**
 * Musical memory — avoids repetition and enables altered recall.
 */
export class MemoryEngine {
  private recentNotes: string[] = [];
  private phraseHistory: string[] = [];
  private harmonicHistory: string[] = [];
  private densityHistory: number[] = [];
  private lastControlSnapshot: GenerativeEcology | null = null;

  recordNote(note: string): void {
    this.recentNotes.push(note);
    if (this.recentNotes.length > MAX_RECENT_NOTES) {
      this.recentNotes.shift();
    }
  }

  recordPhrase(key: string): void {
    this.phraseHistory.push(key);
    if (this.phraseHistory.length > MAX_PHRASE_HISTORY) {
      this.phraseHistory.shift();
    }
  }

  recordHarmonic(root: string): void {
    this.harmonicHistory.push(root);
    if (this.harmonicHistory.length > MAX_HARMONIC_HISTORY) {
      this.harmonicHistory.shift();
    }
  }

  recordDensity(density: number): void {
    this.densityHistory.push(density);
    if (this.densityHistory.length > MAX_DENSITY_HISTORY) {
      this.densityHistory.shift();
    }
  }

  recordEcology(ecology: GenerativeEcology): void {
    this.lastControlSnapshot = { ...ecology };
  }

  repetitionPenalty(note: string): number {
    const recent = this.recentNotes.slice(-8);
    const count = recent.filter((n) => n === note).length;
    return Math.min(1, count * 0.35);
  }

  shouldAvoidNote(note: string, threshold = 0.55): boolean {
    return this.repetitionPenalty(note) >= threshold;
  }

  recallPhrase(): string | null {
    if (this.phraseHistory.length === 0 || Math.random() > 0.28) {
      return null;
    }
    const idx = Math.floor(Math.random() * this.phraseHistory.length);
    return this.phraseHistory[idx] ?? null;
  }

  lastHarmonicRoot(): string | null {
    return this.harmonicHistory[this.harmonicHistory.length - 1] ?? null;
  }

  averageDensity(): number {
    if (this.densityHistory.length === 0) {
      return 0.5;
    }
    const sum = this.densityHistory.reduce((a, b) => a + b, 0);
    return sum / this.densityHistory.length;
  }

  ecologyDrift(ecology: GenerativeEcology, prefs: GenerativePreferences): number {
    if (!this.lastControlSnapshot) {
      return 0;
    }
    let drift = 0;
    for (const key of Object.keys(ecology) as (keyof GenerativeEcology)[]) {
      drift += Math.abs(ecology[key] - this.lastControlSnapshot[key]);
    }
    return Math.min(1, drift / 5) * prefs.probabilityBias;
  }
}
