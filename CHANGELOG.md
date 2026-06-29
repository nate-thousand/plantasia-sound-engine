# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

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
