# Engine

Core engine systems for the Plantasia Sound World Engine.

This folder hosts the runtime controller layer: audio lifecycle, public API facade, species loading, scheduling, transport, and voice routing. Host applications interact with the engine through this layer — never with species internals or Tone.js nodes directly.

## Planned responsibilities

- Audio context initialization and teardown
- `PlantasiaEngine` public facade (v1 and v2 APIs)
- `SpeciesManager` — load and switch Sound Worlds by species id
- Voice router — `noteOn` / `noteOff` dispatch to the active species graph
- Transport and tempo
- Central scheduler for generative and sequenced events
- Metering and analyser taps for visualization hosts
- Event emission (`speciesChanged`, `notePlayed`, `parameterChanged`, …)

## Current state (v1)

Today this folder contains the shipped runtime:

| File | Role |
|------|------|
| `plantasiaEngine.ts` | Public facade class |
| `audioEngine.ts` | Tone.js graph, preset playback, botanical mapping |

Species-specific graphs still live in `src/synths/` until migration phases move them under `src/species/`.

See [docs/ENGINE_AUDIT.md](../../docs/ENGINE_AUDIT.md) for the migration plan.
