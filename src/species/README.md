# Species

Individual Sound Worlds for the Plantasia Sound World Engine.

Each species folder eventually owns a complete audiovisual ecosystem: synthesis architecture, effects chain, modulation routing, generative behavior, ecological control mappings, and bundled world definitions (JSON).

## Organism archetypes

| Folder | Archetype | Character |
|--------|-----------|-----------|
| [`seed/`](./seed/) | Birth | Plantasonic / Plantasia inspiration — intimate emergence |
| [`flowers/`](./flowers/) | Bloom | Juno inspired — harmonic growth, chorus-rich petals |
| [`mold/`](./mold/) | Decay | Tape degradation, spectral drift, haunted ambient |
| [`bacteria/`](./bacteria/) | Microscopic motion | Particles, stochastic life, generative jitter |

Hosts select a species via `loadSpecies()` (v2 API). The engine loads the species module, applies default ecological controls, and routes notes through that world's graph.

## Current state

Folders are structural placeholders. Live DSP for flagship worlds remains in `src/synths/` (`junoFlowersAudio.ts`, `plantasonicAudio.ts`) and the standard PolySynth path in `src/engine/audioEngine.ts` until Phase 4 extraction.

Preset JSON for all worlds lives in `presets/` at the repository root.

See [docs/SOUND_WORLD_ENGINE.md](../../docs/SOUND_WORLD_ENGINE.md) and [docs/ENGINE_AUDIT.md](../../docs/ENGINE_AUDIT.md).
