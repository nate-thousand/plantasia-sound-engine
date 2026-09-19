# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-09-18

First stable release of the Sound World engine. The public tier (`plantasia-sound-engine/public`) is the frozen surface: twenty four methods, presets, events, audio features. Measured in Chromium and WebKit: noteOn to audible 12 ms, zero dropouts over 60 s under a mock visual load ([docs/PERFORMANCE.md](./docs/PERFORMANCE.md)). Branch `v2-sound-world-engine` merges into `main` at this tag.

### Added

- **Audio analysis API**: `engine.getAudioFeatures()` returns `{ time, rms, peak, bass, mid, high, centroid, onset }` per frame from the master bus (`src/engine/analysis/AudioAnalyser.ts`). Raw values; `peak` holds and decays. `BAND_EDGES_HZ` exported
- **`onset` event**: spectral flux over an adaptive threshold, emitted while the engine is running and on every `getAudioFeatures()` read
- **`time` on every event**: AudioContext seconds, stamped by the bus when the emitter does not supply one (`TimedEvent`, `EngineEventInput`)
- **`noteReleased` event** for host, generative and MIDI sources (`NoteSource`)
- `EngineEventBus.hasListeners(name)`
- Fifteenth postbuild gate: `scripts/test-analysis.mjs`
- **Browser performance harness**: `npm run test:browser` runs `tests/browser/performance.spec.mjs` through Playwright (Chromium and WebKit) against `bench/`; measures noteOn to audible, dropouts under a mock visual load, control response and engine main thread cost. Numbers in `docs/PERFORMANCE.md`
- `engine.start({ generative: false })` runs the species graph for played notes without starting its generator (`SoundWorldStartOptions`)
- `ENGINE_LOOK_AHEAD_SEC` and `configureContextLatency()`; `getMasterBus()`, `getMasterBusInput()`, `audioNow()`, `AudioAnalyser` and `BAND_EDGES_HZ` on the root export

- **Two tier facade** (ROADMAP decision 5): `plantasia-sound-engine/public` now types the engine as `PlantasiaEngineApi` (exported as `PlantasiaEngine` there): twenty four methods, presets, adapter, events, features, errors. The root export keeps the full class with the v1 preset path and internals; `initialize` is deprecated in favour of `init`. `engine.getControl(control)` added. `docs/API.md` rewritten as the one page public surface; the earlier draft moved to `docs/API_V2_DRAFT.md`
- Demo: sections grouped under Public tier (v2) and Legacy (v1) headings (decision 13)

### Removed

- **Placeholder species** (ROADMAP decision 9): the eight `coming_soon` entries (canopy, moss, spores, mycelium, desert, ocean, rainforest, tundra), `SoundWorldMetadata.status`, `SpeciesStatus`, `getUpcomingSpecies()`, `listUpcoming()`, `registerPlaceholder()`, `createStubSoundWorld()`, `assertValidPlaceholderMetadata()`, `SpeciesNotLoadableError`, `registerFutureSpecies()`, `FUTURE_SPECIES_METADATA`, and the `includeFuture` option on `createSpeciesManager()` and `createSpeciesRegistry()`. A registered species is playable. The former placeholder ids are no longer reserved

### Changed

- `plantasia-sound-engine/public` no longer exports `resolvePresetToSpecies`, `PRESET_SPECIES_MAP`, the species factories, `EngineEventBus`, or the scheduler classes; all remain on the root export
- Scheduling lookahead on the shared Tone context is 0.01 s instead of Tone's 0.1 s default. noteOn to audible in Chromium went from 102 ms to 12 ms with zero dropouts over 60 s
- Demo: bass, mid, treble, centroid and onset meters read the engine analysis instead of waveform thirds; live feed tracks `noteReleased` and `onset`

## [1.0.0-beta.2] - 2026-09-18

### Fixed

- **Master bus** (`src/engine/masterBus.ts`): every output path (v1 synth chain, Plantasonic and Juno raw Web Audio graphs, all four species) now terminates in one Gain with a shared analyser and meter. `getWaveform()` and `getLevel()` read it, so hosts and the demo stage see the whole engine instead of only the v1 chain
- **Bacteria stack overflow**: a host `noteOn` spawned a particle swarm through the generator, whose notes called `noteOn` again without bound. Loading Bacteria while any generative playback ran threw `Maximum call stack size exceeded`. Generator notes now play particles without re-spawning the swarm
- **Bacteria Freeverb rebuild per note**: `dampening` was written on every note, and Tone 15 rebuilds the comb filters on each write. It is now written only when the value changes
- **Demo RMS and band meters** read 100 in silence because the waveform math subtracted 0.5 from samples already centred on 0

### Removed

- Dead per-species `Tone.Analyser` nodes in `seed`, `flowers`, `mold`, `bacteria` effects chains (never read; the master bus analyser replaces them)

### Changed

- `ROADMAP.md` opens with the 2026-09-18 decisions table that ranks the 1.0.0 and 1.1.0 milestones
- Demo Audio Analysis hint and `docs/DEMO_CONTROL_AUDIT.md` mark the stage as working for all paths

### Added (shipped after beta.1, previously unreleased)

- **Complete demo control surface** (`demo/`) — definitive test bench for all wired engine capabilities
  - Collapsible sections: Presets, Sound Worlds, Musical, Layers, Timbre, Effects, Generative, Ecology, Botanical, Audio, Reactive (scaffold), MIDI, Keyboard, Performance, Utilities, Debug
  - Preset browser with categories, favorites (localStorage), prev/next/random, temp save, JSON copy/export/import
  - 12 performance macros with species-specific routing (`applyMacro` in `demo/lib/engineBridge.js`)
  - Per-species layer cards (Seed, Flowers, Mold, Bacteria) with ecology proxy controls
  - Waveform visualization, RMS/peak/bass/mid/treble meters, live event chips
  - Web MIDI enable, keyboard performance (A–K), transport controls
  - Debug panel with live engine state and validation warnings for scaffold APIs
  - Responsive layout — fullscreen stage + collapsible side panel (mobile-friendly)

### Changed

- **Demo validation pass** — removed dead controls; disabled/removed fake layer mute/solo, unwired generative/musical/timbre/effects sliders, mic, MIDI device select, reactive mapping UI
- Debug panel shows measured state only (ecology values, audio lock, MIDI enabled flag)
- Lifecycle errors surfaced for noteOn/MIDI/species before unlock
- [docs/DEMO_CONTROL_AUDIT.md](./docs/DEMO_CONTROL_AUDIT.md) — full control inventory
- `npm run demo` upgraded from v1 smoke test to full control surface reference implementation
- README demo section documents every control section, workflow, and macro behavior
- Vercel site (`build:site`) now deploys `demo/` control surface instead of basic-engine example

## [1.0.0-beta.1] - 2026-06-28

First honest Sound World integration beta. Phases 17–21 complete — lifecycle contract, unified facade, event bus, scheduler, Web MIDI scaffold, and Plantasonic adapter.

### Added

- **Phase 17** — Lifecycle state machine, playable-only default registry, 0–1 control enforcement, reserved species IDs
- **Phase 18** — `PlantasiaEngine` unified facade, `loadPreset()` / `resolvePresetToSpecies()`, `plantasia-sound-engine/public` slim exports
- **Phase 19** — `EngineEventBus` — `speciesChanged`, `notePlayed`, `controlChanged`, `generatorEvent`, `densityChanged`
- **Phase 20** — `EngineScheduler`, `Transport`, `WebMidiManager`, `engine.enableMidi()`
- **Phase 21** — `createPlantasonicAdapter()`, validation gates, [PLANTASONIC_INTEGRATION.md](./docs/PLANTASONIC_INTEGRATION.md)
- Docs: [EVENTS.md](./docs/EVENTS.md), [SCHEDULER.md](./docs/SCHEDULER.md), [LIFECYCLE.md](./docs/LIFECYCLE.md)
- Test scripts: `test-events`, `test-scheduler`, `test-midi`, `validate-species-audio`, `test-performance-budget`, `test-facade`
- Vercel deployment config (`vercel.json`, `build:site`)

### Changed

- Package version **1.0.0-beta.1** (replaces premature 2.0.0 for integration pinning)
- Async `start()` awaits species audio graph readiness
- All four species wire event sink + scheduler via `SoundWorldContext`
- Generative `Generator` uses central scheduler instead of ad-hoc timers

### Pinning

```json
"plantasia-sound-engine": "github:nate-thousand/plantasia-sound-engine#1.0.0-beta.1"
```

## [2.0.0] - 2026-06-28

> **Deprecated for integration.** This tag marks Sound World architecture landing (Phases 8–16), not a host-safe major release. Pin `v1.0.0-beta.1` (planned) or a commit SHA. See [docs/MIGRATION_V1_TO_V2.md](./docs/MIGRATION_V1_TO_V2.md).

Introduces Sound World architecture, Species Manager, ecological controls, generative ecosystem engine, expressive performance engine, and plugin-ready species shape.

### Added

- **Sound World Engine (v2)** — four live species: Seed, Flowers, Mold, Bacteria
- `SpeciesManager`, `createSpeciesManager()`, `createSpeciesRegistry()`, `loadDefaultSpecies()`
- `EcologyControls` — shared growth / bloom / roots / mold / bacteria (0–1)
- **Generative Ecosystem Engine** — phrases, harmony, rhythm, probability, memory
- **Expressive Performance Engine** — velocity, density, macros, per-species expression profiles
- **Plugin architecture** — `SpeciesRegistry`, validation, species template, eight coming_soon placeholders
- v2 quickstart examples: `basic-engine`, `species-switching`, `midi-performance`, `generative-playback`
- `createPlantasiaEngine()` factory; v2 exports from package root
- `npm run test` / `npm run test:v2` — full release validation suite
- Documentation: `PLUGIN_ARCHITECTURE.md`, `CREATING_A_SPECIES.md`, `PERFORMANCE_ENGINE.md`, `GENERATIVE_ENGINE.md`

### Changed

- Package version **2.0.0** — v2 Sound World API alongside preserved v1 preset path
- `SpeciesId` is an open string for plugin extensibility
- `createSpeciesManager()` uses registry bootstrap — no hard-coded species in engine core

### Preserved (v1)

- `PlantasiaEngine`, `playPreset()`, bundled JSON presets, Mold macro, Plantasonic / Juno signature graphs unchanged

## [Unreleased]

## [0.2.0] - 2026

### Added

- **Mold** creative macro — living degradation engine (`src/mold/`)
- `mold` as a first-class control with MIDI-learnable parameter metadata
- `PlantasiaEngine.setMold()`, `getMold()`, `getParameterMetadata()`
- `getPresetMold()` helper

### Changed

- Mold macro redesigned — multi-stage tape wear, granular mutation, spectral decay
- Removed user-facing volume from creative surface; fixed internal master gain

## [0.2.0 prior work]

- Scalable repository architecture: `src/engine`, `src/synths`, `src/effects`, `src/modulation`, `src/midi`, `src/sequencing`, `src/presets`, `src/utils`.
- JSON preset catalog in `presets/` with category folders (flora, ambient, textures, drones, percussion).
- Preset loader, serialization utilities, and `scripts/sync-presets.mjs` build step.
- Placeholder interfaces for effect rack, modulation matrix, MIDI manager, and sequencer.
- Six runnable browser examples under `examples/`.
- Documentation: `docs/API.md`, `docs/ARCHITECTURE.md`, `docs/SOUND_DESIGN.md`, `docs/CONTRIBUTING.md`, `ROADMAP.md`.
- Asset folders: `samples/`, `assets/impulse-responses/`, `assets/wavetables/`, `assets/images/`.

### Changed

- Internal file layout reorganized; **public API unchanged**.
- Presets loaded from JSON instead of inline TypeScript arrays.
- `examples/basic-test` moved to `examples/basic`.

## [0.1.0] - 2026-06-27

First stable browser sound engine.

- Browser demo
- Presets
- Working audio
- Documentation (`README.md`, `TESTING.md`)
- ESM package with NodeNext TypeScript build
- `PlantasiaEngine` class and functional exports
- Tone.js signal chain: PolySynth → Filter → Delay → Reverb

[Unreleased]: https://github.com/nate-thousand/plantasia-sound-engine/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/nate-thousand/plantasia-sound-engine/releases/tag/v0.1.0
