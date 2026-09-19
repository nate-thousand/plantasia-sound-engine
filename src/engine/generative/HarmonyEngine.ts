import { clamp01, transposeNote, type GenerativeEcology, type GenerativePreferences } from './types.js';
import type { MemoryEngine } from './MemoryEngine.js';

/**
 * Harmonic movement — scales, voicings, voice leading, register choice.
 */
export class HarmonyEngine {
  activeScale(ecology: GenerativeEcology, prefs: GenerativePreferences): readonly string[] {
    if (prefs.alternateScale && ecology.roots > 0.45 && Math.random() < ecology.roots * 0.6) {
      return prefs.alternateScale;
    }
    return prefs.preferredScale;
  }

  pickNote(
    ecology: GenerativeEcology,
    prefs: GenerativePreferences,
    memory: MemoryEngine,
    biasBright = false,
  ): string {
    const scale = this.activeScale(ecology, prefs);
    if (scale.length === 0) {
      return 'C4';
    }

    const last = memory.lastHarmonicRoot();
    let candidates = [...scale];

    if (last && Math.random() < 0.55 + ecology.bloom * 0.25) {
      const lastIdx = scale.indexOf(last);
      if (lastIdx >= 0) {
        const neighbors = scale.filter((_, i) => Math.abs(i - lastIdx) <= 2);
        if (neighbors.length > 0) {
          candidates = neighbors;
        }
      }
    }

    if (biasBright && ecology.bloom > 0.4) {
      const upperHalf = scale.slice(Math.floor(scale.length * 0.4));
      if (upperHalf.length > 0 && Math.random() < ecology.bloom) {
        candidates = upperHalf;
      }
    }

    if (ecology.roots > 0.35) {
      const lowerHalf = scale.slice(0, Math.ceil(scale.length * 0.55));
      if (lowerHalf.length > 0 && Math.random() < ecology.roots * 0.65) {
        candidates = lowerHalf;
      }
    }

    const shuffled = candidates
      .map((note) => ({
        note,
        score: Math.random() - memory.repetitionPenalty(note),
      }))
      .sort((a, b) => b.score - a.score);

    const pick = shuffled[0]?.note ?? scale[0] ?? 'C4';
    memory.recordNote(pick);
    memory.recordHarmonic(pick);
    return pick;
  }

  pickPhraseNotes(
    ecology: GenerativeEcology,
    prefs: GenerativePreferences,
    memory: MemoryEngine,
    length: number,
  ): string[] {
    const scale = this.activeScale(ecology, prefs);
    if (scale.length === 0) {
      return ['C4'];
    }

    let idx = Math.floor(Math.random() * scale.length);
    const notes: string[] = [];
    for (let i = 0; i < length; i += 1) {
      const step =
        ecology.mold > 0.4 && Math.random() < ecology.mold * 0.3
          ? Math.floor(Math.random() * 3) - 1
          : Math.random() > 0.5
            ? 1
            : -1;
      idx = Math.max(0, Math.min(scale.length - 1, idx + step));
      const note = scale[idx] ?? 'C4';
      notes.push(note);
      memory.recordNote(note);
    }
    if (notes.length > 0) {
      memory.recordHarmonic(notes[0]!);
    }
    return notes;
  }

  pickChord(ecology: GenerativeEcology, prefs: GenerativePreferences, memory: MemoryEngine): string[] {
    if (prefs.chordVoicings && prefs.chordVoicings.length > 0 && Math.random() < 0.72) {
      const voicing = prefs.chordVoicings[Math.floor(Math.random() * prefs.chordVoicings.length)] ?? [];
      const maxNotes = Math.round(2 + ecology.growth * (voicing.length - 2));
      const chord = voicing.slice(0, Math.max(1, maxNotes));
      for (const n of chord) {
        memory.recordNote(n);
      }
      if (chord[0]) {
        memory.recordHarmonic(chord[0]);
      }
      return [...chord];
    }

    const root = this.pickNote(ecology, prefs, memory);
    const intervals =
      prefs.harmonyStyle === 'pentatonic'
        ? [0, 2, 4]
        : prefs.harmonyStyle === 'minor' || prefs.harmonyStyle === 'modal'
          ? [0, 3, 7]
          : [0, 4, 7];

    const semitoneMap = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19, 21, 23];
    return intervals.map((i) => {
      const semi = semitoneMap[Math.min(i, semitoneMap.length - 1)] ?? 0;
      return transposeNote(root, semi);
    });
  }

  applyMoldDegradation(notes: string[], ecology: GenerativeEcology): string[] {
    if (ecology.mold < 0.25 || notes.length <= 1) {
      return notes;
    }
    const dropChance = ecology.mold * 0.35;
    return notes.filter(() => Math.random() > dropChance);
  }

  velocityForKind(
    kind: 'phrase' | 'chord' | 'drone' | 'ornament' | 'particle',
    ecology: GenerativeEcology,
  ): number {
    const base =
      kind === 'drone' || kind === 'chord'
        ? 0.28 + ecology.roots * 0.22 + (kind === 'chord' ? ecology.bloom * 0.12 : 0)
        : kind === 'ornament' || kind === 'particle'
          ? 0.14 + ecology.bacteria * 0.2 + ecology.bloom * 0.12
          : 0.32 + ecology.growth * 0.25;

    return clamp01(base + (Math.random() - 0.5) * 0.15);
  }
}
