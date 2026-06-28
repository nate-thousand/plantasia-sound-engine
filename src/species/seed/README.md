# Seed — Birth

Plantasonic / Plantasia inspired Sound World — **reference implementation**.

## Status

Live Tone.js audio via `SeedSoundWorld` (`index.ts`). Default species for `SpeciesManager`.

## Module layout

| File | Purpose |
|------|---------|
| `metadata.ts` | Species metadata, default tempo, pentatonic scale |
| `synth.ts` | PolySynth voice architecture |
| `effects.ts` | Tape saturation, chorus, delay, reverb |
| `generator.ts` | Pentatonic generative note engine |
| `index.ts` | `SoundWorld` implementation |

## Usage

```typescript
import { createSpeciesManager, loadDefaultSpecies } from '../../engine/createSpeciesManager.js';

const manager = createSpeciesManager();
await loadDefaultSpecies(manager);
await manager.start();
manager.noteOn('C4', 0.8);
```

See [docs/SPECIES.md](../../docs/SPECIES.md) for ecological control mappings.
