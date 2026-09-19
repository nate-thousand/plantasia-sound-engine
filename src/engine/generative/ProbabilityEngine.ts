import { clamp01, type GenerativeEcology, type GenerativeEventKind, type GenerativePreferences } from './types.js';
import type { MemoryEngine } from './MemoryEngine.js';

export type ProbabilityWeights = Record<GenerativeEventKind, number>;

/**
 * Dynamic probability — rates drift over time and respond to ecology.
 */
export class ProbabilityEngine {
  private driftPhase = Math.random() * Math.PI * 2;

  reset(): void {
    this.driftPhase = Math.random() * Math.PI * 2;
  }

  advanceTick(): void {
    this.driftPhase += 0.04 + Math.random() * 0.02;
  }

  private drift(): number {
    return (Math.sin(this.driftPhase) + 1) * 0.5;
  }

  weights(
    ecology: GenerativeEcology,
    prefs: GenerativePreferences,
    memory: MemoryEngine,
  ): ProbabilityWeights {
    const d = this.drift();
    const density =
      prefs.preferredDensity * (0.6 + ecology.growth * 0.55 + ecology.bacteria * 0.25);
    memory.recordDensity(density);

    const bloomOrnament = ecology.bloom * 0.45;
    const moldDecay = ecology.mold * 0.4;
    const rootsDrone = ecology.roots * prefs.dronePreference;
    const bacteriaParticle = ecology.bacteria * 0.65;
    const base = prefs.probabilityBias * (0.75 + d * 0.35) + memory.ecologyDrift(ecology, prefs) * 0.15;

    return {
      phrase: clamp01(base + ecology.growth * 0.35 - moldDecay * 0.15),
      chord: clamp01(base * 0.55 + ecology.bloom * 0.4 + ecology.growth * 0.15),
      drone: clamp01(rootsDrone * 0.7 + prefs.dronePreference * 0.35 - ecology.bloom * 0.1),
      ornament: clamp01(bloomOrnament + bacteriaParticle * 0.25 + d * 0.12),
      particle: clamp01(bacteriaParticle + ecology.growth * 0.2),
      glitch: clamp01(ecology.mold * 0.35 + ecology.bacteria * 0.2),
      silence: clamp01(0.12 + (1 - density) * 0.35 + rootsDrone * 0.1 - ecology.growth * 0.08),
    };
  }

  roll(
    kind: GenerativeEventKind,
    ecology: GenerativeEcology,
    prefs: GenerativePreferences,
    memory: MemoryEngine,
  ): boolean {
    const w = this.weights(ecology, prefs, memory);
    const jitter = (Math.random() - 0.5) * 0.08;
    return Math.random() < clamp01(w[kind] + jitter);
  }
}
