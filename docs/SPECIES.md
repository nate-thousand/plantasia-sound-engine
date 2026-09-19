# Species

The four organism archetypes of the Plantasia Sound World Engine. Each species is a `SoundWorld` implementation registered with `SpeciesManager`.

> **Release:** v2.0.0 — four live species, plugin registry, generative + performance engines. v1 presets unchanged.

See also: [SOUND_WORLD_ENGINE.md](./SOUND_WORLD_ENGINE.md) · [API.md](./API.md) · [ENGINE_AUDIT.md](./ENGINE_AUDIT.md)

---

## Registry

```typescript
import { createSpeciesManager, loadDefaultSpecies } from '../engine/createSpeciesManager.js';

const manager = createSpeciesManager();
await loadDefaultSpecies(manager); // Seed — default species
await manager.start();
```

| Export | ID | Status | Module |
|--------|-----|--------|--------|
| `createSeedSoundWorld()` | `seed` | **Live audio** | `src/species/seed/` |
| `createFlowersSoundWorld()` | `flowers` | **Live audio** | `src/species/flowers/` |
| `createMoldSoundWorld()` | `mold` | **Live audio** | `src/species/mold/` |
| `createBacteriaSoundWorld()` | `bacteria` | **Live audio** | `src/species/bacteria/` |

Validate: `npm run test:species`, `npm run test:ecology`, `npm run test` (v2.0 full suite).

---

## Shared ecological controls

All four species expose the same five controls through `EcologyControls` (`src/engine/EcologyControls.ts`):

| Control | Range | Role |
|---------|-------|------|
| `growth` | 0.0–1.0 | Temporal expansion, density, voice activity |
| `bloom` | 0.0–1.0 | Harmonic/spatial opening, shimmer, air |
| `roots` | 0.0–1.0 | Foundation, low energy, grounding |
| `mold` | 0.0–1.0 | Degradation, instability, time |
| `bacteria` | 0.0–1.0 | Microscopic motion, particles, randomness |

Values are **normalized and clamped** at the engine layer. `SpeciesManager` stores control state and applies it when switching species.

Generative composition (phrases, harmony, rhythm, probability, memory) is handled by the shared engine documented in [GENERATIVE_ENGINE.md](./GENERATIVE_ENGINE.md). Ecological controls shape both synthesis and musical behavior.

**Why shared controls, species-specific mappings?** The five knobs describe ecological forces that exist in every Sound World. Each species interprets those forces through its own synthesis architecture — Seed adds melodic density, Flowers widens chorus, Mold increases degradation, Bacteria swarms particles. Mappings live in each species `setControl()`, not in `EcologyControls`.

---

## Seed (reference implementation)

**Concept:** Birth, first growth, Plantasonic / Plantasia inspiration

**Character:** Warm, organic, melodic, gentle, analog

**Description:** The canonical Sound World — PolySynth voices with Plantasonic-inspired effects and pentatonic generative motion. Default species for `SpeciesManager`.

### Module layout

| File | Role |
|------|------|
| `metadata.ts` | Name, concept, default tempo (72 BPM), pentatonic scale, supported controls |
| `synth.ts` | `Tone.PolySynth` — fatsawtooth stack, soft attack, long release, drift LFO → filter |
| `effects.ts` | Tape saturation, chorus, delay, reverb chain |
| `generator.ts` | Pentatonic generative notes — density, probability, bacteria ornaments |
| `index.ts` | `SeedSoundWorld` implementing `SoundWorld` |

### Signal flow

```
PolySynth → Filter → Tape → Chorus → Delay → Reverb → Out
              ↑
         drift LFO
```

### Ecological controls (0–100)

| Control | Seed mapping |
|---------|----------------|
| `growth` | Polyphony, generative density, filter opening |
| `bloom` | Chorus/reverb/delay wet, longer release |
| `roots` | Lower filter emphasis, longer sustain tail |
| `mold` | Tape drive/wet, delay feedback, drift depth |
| `bacteria` | Micro-ornaments, faster drift LFO |

### Defaults

- Tempo: 72 BPM
- Scale: C pentatonic (`C4`–`E5`)
- Bundled preset alignment: `plantasonic`, `seed`, `root`, `coral`

Legacy `playPreset(plantasonic)` still uses the WAAPI graph in `src/synths/plantasonicAudio.ts` until full migration.

---

## Flowers (Juno-inspired bloom)

**Concept:** Bloom, flowering, lush harmonic expansion, Juno-inspired synthesis

**Character:** Lush, wide, soft, nostalgic, blooming, dreamlike, harmonic

**Description:** The opening gesture — slow chord blooms, PWM-style pads, ensemble chorus, hall reverb, and wide stereo spread. Clearly distinct from Seed's Plantasonic warmth: Flowers leans on chorus as identity, not decoration.

### Module layout

| File | Role |
|------|------|
| `metadata.ts` | Name, concept, default tempo (64 BPM), major scale, chord voicings |
| `synth.ts` | Juno-style stack — saw poly, pulse/PWM poly, sub poly, pink noise; slow attack, long release |
| `effects.ts` | Dual chorus (primary + ensemble), hall reverb, stereo delay, widener, subtle tape |
| `generator.ts` | Slow chord blooms, gentle arpeggios, sparkle notes (bacteria), sustained pads |
| `index.ts` | `FlowersSoundWorld` implementing `SoundWorld` |

### Signal flow

```
Saw + Pulse + Sub + Noise → Filter → Tape → Chorus → Ensemble → Delay → Reverb → Widener → Out
                                    ↑
                              slow filter LFO
```

### Ecological controls (0–100)

| Control | Flowers mapping |
|---------|-----------------|
| `growth` | More voices, larger chord voicings, wider note range |
| `bloom` | Chorus depth, filter opening, shimmer, longer release, stereo width |
| `roots` | Sub oscillator depth, lower chord tones, grounded harmony |
| `mold` | Gentle detune, tape wear, subtle instability — beautiful, not broken |
| `bacteria` | Tiny sparkle notes, occasional micro arpeggios, small harmonic events |

### Defaults

- Tempo: 64 BPM
- Scale: C major (`C3`–`E5`)
- Bundled preset alignment: `bloom`, `fern`, `juno-flowers`

Load via `createSpeciesManager()` → `loadSpecies('flowers')`. Legacy `playPreset(juno-flowers)` still uses the WAAPI graph in `src/synths/junoFlowersAudio.ts` until full migration.

```typescript
const manager = createSpeciesManager();
await manager.loadSpecies('flowers');
await manager.start();
manager.noteOn('C4', 0.8);
manager.setControl('bloom', 0.75);
```

---

## Mold (decay / decomposition)

**Concept:** Decay, decomposition, memory, transformation

**Character:** Decaying, organic, textured, fragile, haunted, slow, unpredictable, beautifully imperfect

**Description:** Evolving atmospheres of natural decomposition — not darkness for its own sake. Sine drones, soft FM haze, and brown noise drift through a continuously modulated degradation chain. Fundamentally different from Seed (melodic warmth) and Flowers (lush harmonic bloom): Mold favors texture over melody, and effects are the species identity.

### Module layout

| File | Role |
|------|------|
| `metadata.ts` | Concept, inspiration, oscillators, effects, control mapping, future expansion |
| `synth.ts` | Sine drones, soft FM (`FMSynth`), filtered triangle harmonics, brown noise bed |
| `effects.ts` | Tape → distortion → bit crush → comb → delays → vibrato → long reverb; continuous LFO modulation |
| `generator.ts` | Slow drones, sparse clusters, harmonic decay, long silences, bacteria glitches |
| `index.ts` | `MoldSoundWorld` implementing `SoundWorld` |

### Signal flow

```
Drone + FM + Harmonic + Noise → Bandpass → Tape → Distortion → BitCrush → Comb
    → MicroDelay → FeedbackDelay → Vibrato → Reverb → Panner → Out
         ↑ LFOs modulate delay time, feedback, comb, filter, pan, vibrato depth
```

### Ecological controls (0–100)

| Control | Mold mapping |
|---------|----------------|
| `growth` | Texture layers (FM, harmonics, noise), harmonic density, more drone voices |
| `bloom` | Shimmer, brighter band-pass, spatial delay/reverb, longer release |
| `roots` | Deepens drones (transpose down), lowers tonal center, low resonances |
| `mold` | **Primary identity** — tape wear, flutter, feedback, distortion, bit crush, comb resonance |
| `bacteria` | Random clicks, microscopic glitches, granular-style artifacts |

### Defaults

- Tempo: 48 BPM
- Scale: sparse modal palette (`C2`–`G4`)
- Bundled preset alignment: `vine`, `crystal`, `mutation`

Load via `createSpeciesManager()` → `loadSpecies('mold')`. The shared Mold macro in `src/mold/` remains cross-species infrastructure; this species owns its own independent signal path.

```typescript
const manager = createSpeciesManager();
await manager.loadSpecies('mold');
await manager.start();
manager.noteOn('C3', 0.7);
manager.setControl('mold', 0.9);
manager.setControl('bacteria', 0.5);
```

### How Mold differs from Seed and Flowers

See [Four-species comparison](#four-species-comparison) below.

---

## Bacteria (microscopic particles)

**Concept:** Microscopic life, invisible activity, constant motion, emergence

**Character:** Microscopic, curious, swarming, constantly evolving, organic, light, invisible, alive

**Description:** Particle swarms and probability-driven micro-events — many small sounds instead of few large ones. The generator is the species identity; synthesis stays lightweight and dynamic. Feels like something is always happening beneath the surface without obvious melody or rhythmic loops.

### Module layout

| File | Role |
|------|------|
| `metadata.ts` | Concept, generator philosophy, oscillators, effects, control mapping, future expansion |
| `synth.ts` | NoiseSynth, FM micro-voices, sine blips, PluckSynth impulses; high-pass + pan drift |
| `effects.ts` | Gentle saturation, auto-pan, micro ping-pong delay, small room reverb |
| `generator.ts` | Probability triggering, random walks, swarms, micro-fragments, background ticks |
| `index.ts` | `BacteriaSoundWorld` implementing `SoundWorld` |

### Signal flow

```
Noise + FM + Sine + Pluck → Highpass → Saturation → AutoPan → MicroDelay → Freeverb → Out
              ↑ LFO filter + pan drift          ↑ LFOs modulate pan rate, delay wet, room size
```

### Ecological controls (0–100)

| Control | Bacteria mapping |
|---------|------------------|
| `growth` | Event density, simultaneous particles, activity expansion |
| `bloom` | Brighter harmonics, sparkle, resonator tails, stereo width |
| `roots` | Lower resonant events, slower movement, subtle drones |
| `mold` | Instability, corruption, randomness, occasional glitches |
| `bacteria` | **Primary identity** — particle count, trigger probability, swarm complexity |

### Defaults

- Tempo: 88 BPM (timing reference only — events are not grid-locked)
- Scale: high chromatic pool (`C5`–`G6`) with lower roots pool
- Bundled preset alignment: `mycelium`, `mutation`

```typescript
const manager = createSpeciesManager();
await manager.loadSpecies('bacteria');
await manager.start();
manager.noteOn('C4', 0.8);
manager.setControl('bacteria', 1.0);
manager.setControl('growth', 0.7);
```

---

## Four-species comparison

### Synthesis architecture

| Species | Primary sources | Voice character |
|---------|-----------------|-----------------|
| **Seed** | Fat saw `PolySynth` | Warm melodic body, soft attack, long release |
| **Flowers** | Saw + pulse + sub + pink noise | Lush Juno-style harmonic stack |
| **Mold** | Sine drones + soft FM + triangle + brown noise | Slow evolving texture layers |
| **Bacteria** | NoiseSynth + FM + sine blips + PluckSynth | Many tiny transient particles |

### Effects chain identity

| Species | Chain focus | Identity effect |
|---------|-------------|-----------------|
| **Seed** | Tape → chorus → delay → reverb | Gentle Plantasonic warmth |
| **Flowers** | Dual chorus → hall reverb → widener | Wide chorus ensemble bloom |
| **Mold** | Tape → distortion → bit crush → comb → delays → vibrato → long reverb | Continuous degradation |
| **Bacteria** | Saturation → auto-pan → micro delay → small room | Delicate spatial micro-detail |

### Generator style

| Species | Timing | Output | Repetition |
|---------|--------|--------|------------|
| **Seed** | Moderate intervals | Pentatonic notes, bacteria ornaments | Low |
| **Flowers** | Slow | Chord blooms, gentle arpeggios, sparkles | Low |
| **Mold** | Very slow | Drones, sparse clusters, long silences | Extremely low |
| **Bacteria** | Fast variable | Probability swarms, random walks, fragments | Never exact repeat |

### Ecological control emphasis

| Control | Seed | Flowers | Mold | Bacteria |
|---------|------|---------|------|----------|
| `growth` | Polyphony, density | Voices, chord size | Texture layers | Event density, particles |
| `bloom` | Space wet levels | Chorus, shimmer, width | Brighter band-pass, reverb | Sparkle, resonator tails |
| `roots` | Filter weight, sustain | Sub depth, low tones | Deep drones, transpose | Low resonant events |
| `mold` | Tape, drift | Gentle detune | **Primary** — degradation | Instability, glitches |
| `bacteria` | Micro-ornaments | Sparkle notes | Clicks, artifacts | **Primary** — swarm density |

### Emotional character (intended)

| Species | Feels like… |
|---------|-------------|
| **Seed** | Birth — warm emergence, first breath of life |
| **Flowers** | Bloom — lush harmonic opening, nostalgic petals |
| **Mold** | Decay — natural decomposition, haunted memory |
| **Bacteria** | Microscopic life — invisible swarming activity beneath the surface |

---

## Migration notes

| v1 preset | Future species |
|-----------|----------------|
| `plantasonic`, `seed`, `root`, `coral` | Seed |
| `bloom`, `fern`, `juno-flowers` | Flowers |
| `vine`, `crystal`, `mutation` | Mold |
| `mycelium`, `mutation` | Bacteria |

All four species load their own synthesis graphs via `createSpeciesManager()`. Legacy `playPreset()` remains unchanged.
