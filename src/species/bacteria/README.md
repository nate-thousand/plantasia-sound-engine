# Bacteria — Microscopic particles

Particle Sound World with live Tone.js audio.

## Sonic character

Microscopic, curious, swarming, constantly evolving, organic, light, invisible, alive. Something always happening beneath the surface — not random, but controlled unpredictability.

## Module layout

| File | Role |
|------|------|
| `metadata.ts` | Concept, generator philosophy, control mapping |
| `synth.ts` | NoiseSynth, FM micro-voices, sine blips, PluckSynth impulses |
| `effects.ts` | Saturation, auto-pan, micro delay, small room reverb |
| `generator.ts` | Probability swarms, random walks, micro-fragments |
| `index.ts` | `BacteriaSoundWorld` — `createBacteriaSoundWorld()` |

## Load

```typescript
import { createSpeciesManager } from '../../engine/createSpeciesManager.js';

const manager = createSpeciesManager();
await manager.loadSpecies('bacteria');
await manager.start();
manager.setControl('bacteria', 100);
manager.setControl('growth', 70);
manager.noteOn('C4', 0.8);
```

## Anchor presets

Bundled worlds: `mycelium`, `mutation`.

## Future expansion

Background ecosystem layer for host apps, spatial particle fields, sample playback.
