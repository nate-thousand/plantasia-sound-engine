# Mold — Decay

Decay Sound World with live Tone.js audio.

## Sonic character

Decaying, organic, textured, fragile, haunted, slow, unpredictable, beautifully imperfect. Natural decomposition — not darkness for its own sake.

## Module layout

| File | Role |
|------|------|
| `metadata.ts` | Concept, inspiration, oscillators, effects, control mapping |
| `synth.ts` | Sine drones, soft FM, filtered harmonics, brown noise |
| `effects.ts` | Tape → distortion → bit crush → comb → delays → vibrato → reverb |
| `generator.ts` | Slow drones, sparse clusters, harmonic decay, glitches |
| `index.ts` | `MoldSoundWorld` — `createMoldSoundWorld()` |

## Load

```typescript
import { createSpeciesManager } from '../../engine/createSpeciesManager.js';

const manager = createSpeciesManager();
await manager.loadSpecies('mold');
await manager.start();
manager.setControl('mold', 90);
manager.setControl('bacteria', 50);
manager.noteOn('C3', 0.7);
```

## Anchor presets

Bundled worlds: `vine`, `crystal`, `mutation`. Legacy preset routing via `playPreset()` is unchanged until full migration.

## Future expansion

Sample playback layer, granular clouds, shared `src/mold/` macro integration.
