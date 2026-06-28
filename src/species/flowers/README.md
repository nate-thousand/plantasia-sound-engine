# Flowers — Bloom

Juno inspired Sound World with live Tone.js audio.

## Sonic character

Lush, wide, soft, nostalgic, blooming, dreamlike, harmonic. Slow chord blooms, PWM-style pads, ensemble chorus, hall reverb, and wide stereo spread.

## Module layout

| File | Role |
|------|------|
| `metadata.ts` | Identity, 64 BPM, major scale, chord voicings |
| `synth.ts` | Saw + pulse + sub + noise; slow attack, long release |
| `effects.ts` | Dual chorus, hall reverb, stereo delay, widener |
| `generator.ts` | Chord blooms, gentle arpeggios, sparkle notes |
| `index.ts` | `FlowersSoundWorld` — `createFlowersSoundWorld()` |

## Load

```typescript
import { createSpeciesManager } from '../../engine/createSpeciesManager.js';

const manager = createSpeciesManager();
await manager.loadSpecies('flowers');
await manager.start();
manager.setControl('bloom', 75);
manager.noteOn('C4', 0.8);
```

## Anchor presets

Bundled worlds: `bloom`, `fern`, `juno-flowers`. Legacy `playPreset(juno-flowers)` still uses `src/synths/junoFlowersAudio.ts` until full migration.
