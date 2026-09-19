# Engine Events (Phase 19)

Semantic event bus for host visualization — **no Tone node coupling**.

## Usage

```typescript
import { createPlantasiaEngine } from 'plantasia-sound-engine/public';

const engine = createPlantasiaEngine();

engine.on('speciesChanged', ({ speciesId, previousSpeciesId, presetId }) => {
  // Swap organism grammar / palette
});

engine.on('notePlayed', ({ note, velocity, source, speciesId }) => {
  // source: 'host' | 'generative' | 'midi'
});

engine.on('controlChanged', ({ control, value, speciesId }) => {
  // Morph ASCII organism from ecology macros
});

engine.on('generatorEvent', ({ kind, note, velocity, intensity, speciesId }) => {
  // kind: 'phrase' | 'chord' | 'drone' | 'particle' | 'glitch' | ...
});

engine.on('densityChanged', ({ density, speciesId }) => {
  // Scale motion intensity from PerformanceEngine density
});
```

## Event sources

| Event | Emitted by |
|-------|------------|
| `speciesChanged` | `SpeciesManager.loadSpecies()` |
| `controlChanged` | `SpeciesManager.setControl()` |
| `notePlayed` | Host `noteOn()`, generative callbacks, Web MIDI |
| `generatorEvent` | Generative engine via species event sink |
| `densityChanged` | Species `noteOn()` after performance density update |

## Sound World context

Species receive an optional event sink in `initialize(context)`:

```typescript
async initialize(context?: unknown): Promise<void> {
  const { events, scheduler } = readSoundWorldContext(context);
  // events.emitGeneratorEvent({ kind: 'particle', note, velocity });
}
```

Use `buildGenerativeCallbacks()` in species generators to wire generative note paths.

## Unsubscribe

`engine.on()` returns an unsubscribe function. Prefer one handler per event type in host apps.
