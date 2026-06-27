# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-06-27

### Added

- Initial release of the Plantasia botanical synthesis engine as a reusable TypeScript package.
- `PlantasiaEngine` class as the primary public API.
- Functional exports: `initAudio`, `playPreset`, `stopAudio`, `applyBotanicalControls`, `triggerChord`, `setTempo`, `getWaveform`, `getLevel`, `updateParameter`, `defaultNotePool`.
- Nine built-in presets and botanical control types.
- Tone.js-based signal chain: PolySynth → Filter → Delay → Reverb.

[0.1.0]: https://github.com/plantasia/plantasia-sound-engine/releases/tag/v0.1.0
