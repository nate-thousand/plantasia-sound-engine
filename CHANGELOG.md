# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Mold** creative macro — living degradation engine with multi-stage tape wear, granular mutation, delay corruption, spectral decay, and preset-specific personalities (`src/mold/`).
- `mold` as a first-class `BotanicalControls` key with MIDI-learnable parameter metadata export.
- `PresetControlDefaults.controls.mold` on all bundled presets (Plantasonic ships with subtle default `12`).
- `PlantasiaEngine.setMold()`, `getMold()`, and `getParameterMetadata()` public API.
- `getPresetMold()` helper for preset default lookup.

### Changed

- **Mold macro redesigned** as Plantasia's signature living degradation engine — multi-stage behavior across eight internal modules with preset-specific personalities. White noise is no longer the primary effect.
- Removed user-facing volume control from the creative parameter surface; internal master gain is fixed (OS / browser controls loudness).
- **Energy** no longer maps to oscillator output level in `applyBotanicalControls`.

### Added (prior unreleased work)

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
