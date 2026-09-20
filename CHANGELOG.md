# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.0] - 2026-09-20

Hardening, snapshots and the tools for the sound pass. `getSnapshot()` and `applySnapshot()` carry the whole host facing state as one JSON object with a timed morph between two; a polyphony cap and MIDI input select land on the public tier, now thirty four methods, all additive. The Playwright harness runs in CI in Chromium and WebKit, bundle size is measured with a demo budget, Tone is pinned to a minor, and the v1 preset path is deprecated for removal at 2.0. A local lab page for tuning by ear found and fixed a Flowers range error on its first A/B. Measured: zero dropouts through a 5 s morph across a species switch, a switch ready in 50 to 120 ms, 48 control extreme loads without a throw, and 9 to 10 of 20 controls audible on one held note, the input to the 1.3 sound pass ([docs/PERFORMANCE.md](./docs/PERFORMANCE.md)).

### Added

- **Lab page** (`npm run lab`, port 5195; ROADMAP decision 9 after 1.1.0): species select, held note or chord, one control sweep with the species ramp on or off, species A/B that re-holds the notes, a `MODULATION_TARGET_SPANS` editor applied live with Audition routes and JSON out, analyser bands, and a per control A/B over A/A measure (decision 10 bar). Local tool, never deployed
- Root export only: `setControl(control, value, rampSec?)` takes an optional ramp time (`0` applies immediately); `setModulationTargetSpans(partial)` and `getModulationTargetSpans()` override spans at runtime. `SoundWorld.setControl` gains the same optional third argument; species without it are unaffected
- Harness row `control extremes load every species` (blocks): every species at every control extreme loads, starts and takes a note without throwing, Chromium and WebKit
- `docs/INSTRUMENT_BRIEF.md`, the hand off to the first played instrument (decision 20)
- **Snapshots** (decisions 13 and 14): `getSnapshot()` returns `{ version: 1, speciesId, controls, tempo, routes, preferences, polyphony?, presetId? }`; `applySnapshot(snapshot, { morphSec? })` validates (`SnapshotError`: `UNSUPPORTED_VERSION`, `UNKNOWN_SPECIES`, `INVALID`) before changing anything, replaces routes and preference overrides, sets the cap, switches species without crossfade (a running engine restarts with its last start options), then sets controls and tempo now or interpolates them at 30 Hz over `morphSec`. A second call cancels a morph in flight. Gate `scripts/test-snapshot.mjs` (eighteen postbuild gates)
- Harness rows (decision 18): a 5 s morph across a species switch with dropouts counted (blocks); `applySnapshot` species switch, time until ready and until audible (recorded); control audibility, A/B over A/A for every control on every species (recorded until the sound pass)
- **Polyphony cap** (decision 17): `setPolyphony(voices | null)` and `getPolyphony()` on the public tier. Species keep their own growth driven polyphony curve and clamp it to the cap; optional `SoundWorld.setPolyphony` hook, implemented by all four species and the template; applied on every load
- `enableMidi(inputId?)` picks one Web MIDI input; ids from the root export's `midi.devices`
- **CI browser job** (decisions 3 and 11): `.github/workflows/ci.yml` runs the Playwright harness in Chromium and WebKit on every push to `main` and pull request. Dropouts, page errors and control extremes block; noteOn latency is recorded and annotated above 25 ms; the 15 ms bar stays the local release check. Results uploaded as the `bench-results` artifact
- **Size measurement** (decision 12): `npm run size` bundles `dist/public.js` and `dist/index.js` with esbuild (409 and 414 KB minified, 107 and 108 KB gzip, recorded) and builds the demo site (462 KB minified against a 500 KB budget, blocks). `esbuild` is a devDependency

### Deprecated

- The v1 preset path on the root export (decisions 6 and 15): `playPreset`, `applyBotanicalControls`, `triggerChord`, `updateParameter`, `setMold`, `getMold`, `getParameterMetadata`, `stopSpecies`, `initialize` carry `@deprecated` and log one `console.info` per session on the first call. `docs/API_V1.md` carries the banner; the demo's Legacy heading reads "removed at 2.0". Nothing changes in behaviour. Removal is 2.0, after the signature v1 sounds are ported into species

### Changed

- Tone.js pinned to `~15.1.22` (decision 3): a minor bump is now a deliberate change
- The v1 `setTempo` no longer throws without a Web Audio context (Node gates); the engine transport still stores the BPM

### Fixed

- Flowers threw Tone's `RangeError: Value must be within [0, 1]` on load with bloom above about 0.9: chorus depth times the bloom macro passed 1. Every `NormalRange` effect write in all four species (wet, depth, width, resonance, feedback, room size) now goes through `setRampNormal`, which clamps at the one place values reach Tone. Found by the lab on its first A/B

## [1.1.0] - 2026-09-20

Modulation. Six source types routed additively to the five ecology controls or the thirteen numeric performance targets, MIDI CC, aftertouch and pitch bend as events and sources, and host generative preferences that follow the player across species. Public tier grows from twenty four to thirty methods, all additive. Measured in Chromium and WebKit: zero dropouts over 60 s with eight routes under a mock visual load, 0.2 to 0.4 ms per modulation tick, a CC step reaching the engine in one tick ([docs/PERFORMANCE.md](./docs/PERFORMANCE.md)).

### Added

- **Modulation engine** (1.1 step 1, ROADMAP decisions for 1.1.0): `engine.modulate(source, destination, depth)` with descriptor sources `lfo`, `sample-hold`, `follower` (MIDI sources typed, active after step 3), destinations the five controls or `target:<PerformanceTargets key>`, `MODULATION_TARGET_SPANS`, `removeModulation`, `getModulationRoutes`, `getModulationState`, `modulationChanged` event. Additive on the host's base; ticks at 30 Hz on the scheduler while running
- `SoundWorld.applyModulation(frame)` optional hook, implemented by all four species with a one tick ramp and change gated `PolySynth.set` calls; documented in the species template
- `Transport.getPlayCount()` for beat synced sources
- **MIDI control input** (1.1 step 3): `WebMidiManager` decodes CC, channel pressure and pitch bend (0..1, 0..1, -1..1; channels 1..16), keeps the last value per control and channel (`read()`), and takes raw bytes through `feed()`. Facade emits `midiControl { kind, controller?, value, channel, time }` and offers root only `feedMidi(bytes)` for bridges and the harness. `midi-cc`, `midi-aftertouch` and `midi-bend` modulation sources are live after `enableMidi()` or `feedMidi()`
- **Generative preferences** (1.1 step 4): `setGenerativePreferences(partial)` and `getGenerativePreferences()`. Host overrides merge over every species' defaults on load and follow the player across species. Tempo, density, probability bias and drone preference apply now; scale, alternate scale, voicings, phrase length, harmony and rhythm style land at the next phrase boundary (`Generator.setPreferences`). Optional `SoundWorld.setGenerativePreferences` / `getGenerativePreferences` hooks, implemented by all four species
- Sixteenth and seventeenth gates `scripts/test-modulation.mjs`, `scripts/test-preferences.mjs`
- Browser harness rows for modulation: eight route long run (blocks on dropouts), modulation tick cost, wheel to modulation state and to audible. Results in `docs/PERFORMANCE.md`
- Demo **Modulation** section (decision 14): route builder for every source type and destination, live state readout, three route preset. Replaces the unwired Reactive section
- `docs/API.md` covers modulation, preferences, `modulationChanged` and `midiControl`; `CREATING_A_SPECIES.md` documents the optional hooks; `LIFECYCLE.md` the route lifecycle

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
