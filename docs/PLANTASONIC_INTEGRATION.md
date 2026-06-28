# Plantasonic Integration (Phase 21)

Integration guide for the Plantasonic host app using v2 Sound World audio.

## Prerequisites

Phases 17–20 must be complete:

- Lifecycle contract (`initialize` → `loadSpecies` → `start` → `noteOn`)
- Unified `createPlantasiaEngine()` facade
- Semantic event bus for visuals
- Central scheduler + Web MIDI scaffold

## Quick start

```typescript
import { createPlantasonicAdapter } from 'plantasia-sound-engine/dist/integration/plantasonicAdapter.js';

const adapter = createPlantasonicAdapter();

// User gesture required
await adapter.engine.initialize();
const { preset, resolution } = await adapter.loadPreset('plantasonic');
await adapter.engine.start();

// Visual layer: keep preset.visual from v1 JSON
console.log(preset.visual);

// Subscribe to engine events (replaces Tone node polling over time)
adapter.on('notePlayed', ({ note, velocity }) => {
  // glyph burst
});

adapter.on('densityChanged', ({ density }) => {
  // motion intensity
});
```

## Preset → species adapter

| Concern | Owner |
|---------|-------|
| Audio engine | `engine.loadPreset(id)` → v2 species |
| Ecology (0–1) | `resolvePresetToSpecies()` default + `setControl()` |
| Visual profile | Preset JSON `visual` / `asciiState` (until visuals subscribe to events) |
| v1 signature synth | Parallel path via `engine.playPreset()` during migration |

## Validation gates

| Gate | Script |
|------|--------|
| Structural API | `validate-species-api.mjs` |
| Audio readiness | `validate-species-audio.mjs` |
| CPU budget | `test-performance-budget.mjs` |
| Events | `test-events.mjs` |
| Scheduler | `test-scheduler.mjs` |
| MIDI facade | `test-midi.mjs` |

Full sonic confirmation still requires browser: `npm run example:basic-engine`

## Semver

First honest integration tag: **`1.0.0-beta.1`**

Do not use tag `v2.0.0` for Plantasonic pinning — see [MIGRATION_V1_TO_V2.md](./MIGRATION_V1_TO_V2.md).

## Migration status

v2 species audio runs **in parallel** with v1 WAAPI graphs. Plantasonic can adopt incrementally:

1. Pin `1.0.0-beta.1` (or commit SHA on `v2-sound-world-engine`)
2. Wire `createPlantasonicAdapter()` for new sessions
3. Subscribe visuals to semantic events (Phase 19)
4. Retire v1 audio path per preset when sonic parity is confirmed
