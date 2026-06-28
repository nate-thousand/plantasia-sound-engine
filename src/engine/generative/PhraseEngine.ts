import type { GenerativeEcology, GenerativePreferences } from './types.js';
import type { HarmonyEngine } from './HarmonyEngine.js';
import type { MemoryEngine } from './MemoryEngine.js';

export type Phrase = {
  id: string;
  notes: string[];
  vitality: number;
  age: number;
};

let phraseIdCounter = 0;

function nextPhraseId(): string {
  phraseIdCounter += 1;
  return `p${phraseIdCounter}`;
}

/**
 * Reusable phrases — creation, mutation, decay, regeneration, altered recall.
 */
export class PhraseEngine {
  private active: Phrase | null = null;

  reset(): void {
    this.active = null;
  }

  create(
    ecology: GenerativeEcology,
    prefs: GenerativePreferences,
    harmony: HarmonyEngine,
    memory: MemoryEngine,
  ): Phrase {
    const recallKey = memory.recallPhrase();
    const length =
      prefs.phraseLength + Math.floor(ecology.growth * 3) + (Math.random() > 0.5 ? 1 : 0);

    const notes = harmony.pickPhraseNotes(ecology, prefs, memory, Math.max(2, length));
    const phrase: Phrase = {
      id: recallKey ? `${recallKey}-var` : nextPhraseId(),
      notes,
      vitality: 0.85 + ecology.bloom * 0.15,
      age: 0,
    };
    memory.recordPhrase(phrase.id);
    this.active = phrase;
    return phrase;
  }

  mutate(phrase: Phrase, ecology: GenerativeEcology): Phrase {
    const notes = [...phrase.notes];
    if (notes.length === 0) {
      return phrase;
    }

    const mutationRate = 0.15 + ecology.mold * 0.45 + ecology.bloom * 0.15;
    for (let i = 0; i < notes.length; i += 1) {
      if (Math.random() < mutationRate) {
        if (ecology.mold > 0.5 && Math.random() < ecology.mold * 0.4) {
          notes.splice(i, 1);
          i -= 1;
        } else {
          const offset = Math.random() > 0.5 ? 1 : -1;
          const match = /^([A-G][#b]?)(-?\d+)$/.exec(notes[i] ?? 'C4');
          if (match) {
            const oct = Number(match[2]) + (Math.random() < 0.2 ? offset : 0);
            notes[i] = `${match[1]}${oct}`;
          }
        }
      }
    }

    return {
      id: `${phrase.id}-m`,
      notes,
      vitality: phrase.vitality * (0.88 - ecology.mold * 0.12),
      age: phrase.age + 1,
    };
  }

  decay(phrase: Phrase, ecology: GenerativeEcology): boolean {
    phrase.age += 1;
    phrase.vitality -= 0.08 + ecology.mold * 0.12;
    return phrase.vitality <= 0.15 || phrase.age > 6 + Math.floor(ecology.growth * 4);
  }

  getOrEvolve(
    ecology: GenerativeEcology,
    prefs: GenerativePreferences,
    harmony: HarmonyEngine,
    memory: MemoryEngine,
  ): Phrase {
    if (
      this.active &&
      !this.decay(this.active, ecology) &&
      Math.random() > 0.35 + ecology.growth * 0.2
    ) {
      return this.mutate(this.active, ecology);
    }
    return this.create(ecology, prefs, harmony, memory);
  }
}
