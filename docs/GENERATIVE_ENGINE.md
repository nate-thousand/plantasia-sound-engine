# Generative Ecosystem Engine

> **v2.0.0** — Shared by all four live species. Validate: `npm run test:generative` or `npm run test`.

The shared generative composition system used by all four Sound Worlds. Replaces simple random note picking with probability, memory, phrases, harmonic movement, rhythm, and ecological interaction.

> **Location:** `src/engine/generative/`  
> **Species adapters:** `src/species/*/generator.ts` + `*_GENERATIVE_PREFERENCES` in `metadata.ts`

---

## Architecture

```text
┌─────────────────────────────────────────────────────────┐
│                      Generator.ts                        │
│  Schedule · orchestrate · dispatch note events           │
└────────┬──────────┬──────────┬──────────┬───────────────┘
         │          │          │          │
   PhraseEngine  HarmonyEngine  RhythmEngine  ProbabilityEngine
         │          │          │          │
         └──────────┴──────────┴──────────┘
                         │
                   MemoryEngine
```

The **Generator** knows nothing about Tone.js or oscillators. It emits `{ note, velocity, holdMs, kind }` events through callbacks. Species Sound Worlds route those to their synth graphs.

---

## Generator (`Generator.ts`)

Central orchestration:

- Schedules composition ticks via `RhythmEngine`
- Rolls event types via `ProbabilityEngine`
- Builds phrases, chords, drones, ornaments, particles via `PhraseEngine` + `HarmonyEngine`
- Records history via `MemoryEngine`
- Applies ecological control state (normalized 0–1)
- Dispatches `noteOn` / `noteOff` / optional `onGlitch`

```typescript
import { Generator } from '../engine/generative/Generator.js';

const engine = new Generator(preferences, {
  noteOn: (note, velocity) => { /* species routes to synth */ },
  noteOff: (note) => { /* release */ },
});

engine.setEcology({ growth: 0.7, bloom: 0.5 });
engine.start(72);
engine.stop();
```

---

## Phrase Engine

Reusable musical phrases that evolve:

| Capability | Behavior |
|------------|----------|
| Creation | Random-walk notes within active scale |
| Variation | Mutate pitch, octave, drop notes under high `mold` |
| Repetition | Re-use phrase IDs from memory in altered form |
| Decay | Vitality decreases; phrases regenerate when spent |
| Regeneration | New phrases when decay threshold reached |

Avoids exact repetition through mutation + memory recall.

---

## Harmony Engine

Harmonic movement instead of isolated random notes:

- Scale selection (primary + alternate for `roots`)
- Voice leading toward last harmonic root
- Chord voicings from species preferences
- Pentatonic / major / minor / modal / drone styles
- Register biasing for `bloom` (bright) and `roots` (low)
- Mold degradation — randomly drops notes from phrases/chords

---

## Rhythm Engine

Evolving timing without obvious loops:

| Style | Character |
|-------|-----------|
| `moderate` | Seed — balanced intervals |
| `flowing` | Flowers — chord bloom spacing |
| `atmospheric` | Mold — very slow, long holds |
| `swarm` | Bacteria — fast micro-events |
| `sparse` | Extended silence bias |

Features: variable spacing, humanization, clustering, optional Euclidean pulse, density scaling from ecology.

---

## Probability Engine

Every event passes through dynamic probability:

| Event kind | Typical drivers |
|------------|-----------------|
| `phrase` | growth, base bias |
| `chord` | bloom, growth |
| `drone` | roots, dronePreference |
| `ornament` | bloom, bacteria |
| `particle` | bacteria, growth |
| `glitch` | mold, bacteria |
| `silence` | low density, roots |

Probabilities **drift continuously** (sinusoidal phase + jitter) — never fixed.

---

## Memory Engine

Musical memory to avoid repetition and enable recall:

- Recently played notes (repetition penalty)
- Phrase history (altered recall)
- Harmonic roots (voice leading)
- Density history (probability balance)
- Previous ecology snapshot (control drift detection)

---

## Species integration

Each species defines `GenerativePreferences` in `metadata.ts`:

```typescript
export const SEED_GENERATIVE_PREFERENCES: GenerativePreferences = {
  preferredScale: SEED_DEFAULT_SCALE,
  preferredTempo: 72,
  preferredDensity: 0.42,
  phraseLength: 4,
  probabilityBias: 0.38,
  dronePreference: 0.12,
  harmonyStyle: 'pentatonic',
  rhythmStyle: 'moderate',
};
```

Species `generator.ts` files are thin adapters:

```typescript
export class SeedGenerator {
  private readonly engine: Generator;
  // setEcology, start, stop — delegates to shared engine
}
```

`syncGeneratorEcology()` (`src/shared/syncGeneratorEcology.ts`) pushes species control state (0–100) into the engine (0–1).

| Species | rhythmStyle | harmonyStyle | Identity |
|---------|-------------|--------------|----------|
| Seed | moderate | pentatonic | Melodic phrases |
| Flowers | flowing | major | Chord blooms |
| Mold | atmospheric | modal | Drones + decay |
| Bacteria | swarm | minor | Particle swarms |

---

## Ecological control influence

Ecological controls shape **composition**, not just synthesis:

| Control | Generative effect |
|---------|-------------------|
| `growth` | More phrases, higher density, larger phrases |
| `bloom` | Chords, ornaments, brighter register, harmonic movement |
| `roots` | Drones, lower scale pool, longer holds, more silence |
| `mold` | Phrase degradation, lost notes, slower timing, glitches |
| `bacteria` | Particles, ornaments, micro-events, clustering |

---

## Validation

```bash
npm run test:generative
npm run test:species
```

Listen test: run each species continuously — expect slow evolution, no obvious loops, distinct behavior per world.

---

## Related docs

- [SPECIES.md](./SPECIES.md) — per-species generative preferences
- [SOUND_WORLD_ENGINE.md](./SOUND_WORLD_ENGINE.md) — Sound World architecture
- [API.md](./API.md) — public API contract
