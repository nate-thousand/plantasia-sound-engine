# Roadmap

Milestones for Plantasia Sound Engine development.

The engine is transitioning from a **preset-centric v1 runtime** (frozen at tag `v1-sound-engine-baseline`) to a **species-centric Sound World Engine** on branch `v2-sound-world-engine`. Architecture vision: [docs/SOUND_WORLD_ENGINE.md](./docs/SOUND_WORLD_ENGINE.md). Migration guide: [docs/ENGINE_AUDIT.md](./docs/ENGINE_AUDIT.md).

---

## Current status

| Item | Value |
|------|-------|
| **Package version** | `2.0.0` |
| **Production branch** | `main` — v1 preset API + mold profiles |
| **Active refactor branch** | `v2-sound-world-engine` — **v2.0.0 released** |
| **v1 freeze tag** | `v1-sound-engine-baseline` (commit `0a740b3`) |
| **v2 release tag** | `v2.0.0` — Sound World Engine, species plugins |
| **Bundled Sound Worlds** | 11 JSON presets + 4 live species + 8 coming_soon placeholders |
| **Public API** | v1 (`PlantasiaEngine`) + v2 (`createSpeciesManager`) — see [docs/API.md](./docs/API.md) |
| **v2 target contract** | ✅ Phases 8–16 complete — production-ready for prototype hosts |

### Release tags

| Tag | Description |
|-----|-------------|
| `v0.1.0` | First stable browser engine |
| `v0.2.0` | Sound Worlds API, mold profile exports, preset validation |
| `v1-sound-engine-baseline` | Frozen engine before v2 refactor (includes LFO min-span mold fix) |
| `v2.0.0` | Sound World Engine — four species, generative + performance engines, plugin registry |

---

## v2 Sound World Engine

### Organism archetypes

| Species | Folder | Character |
|---------|--------|-----------|
| **Seed** | `src/species/seed/` | Birth — Plantasonic / Plantasia inspiration |
| **Flowers** | `src/species/flowers/` | Bloom — Juno inspired |
| **Mold** | `src/species/mold/` | Decay — tape, haunted ambient |
| **Bacteria** | `src/species/bacteria/` | Microscopic motion — particles, random life |

### Documentation (complete)

- [x] **Task 2.1** — README Sound World positioning
- [x] **Task 2.2** — [docs/SOUND_WORLD_ENGINE.md](./docs/SOUND_WORLD_ENGINE.md) — architecture, layers, organism archetypes
- [x] **Task 2.3** — [docs/API.md](./docs/API.md) — v2 target public API contract
- [x] **Task 2.3** — [docs/API_V1.md](./docs/API_V1.md) — v1 implementation reference preserved
- [x] **Task 2.4** — [docs/ENGINE_AUDIT.md](./docs/ENGINE_AUDIT.md) — full v1 audit and migration plan

### Implementation

- [x] **Phase 3** — Folder structure and READMEs
  - `src/engine/` — core runtime (existing code + README)
  - `src/species/` — seed, flowers, mold, bacteria (all live)
  - `src/shared/` — cross-species helpers (`syncGeneratorEcology`, `syncPerformanceEcology`)
  - `src/templates/` — species template for new plugins
- [x] **Phase 4** — Sound World interface contract
  - `src/engine/SoundWorld.ts` — `SoundWorld`, `SpeciesId`, `EcologicalControl`, `SoundWorldMetadata`
  - `src/engine/index.ts` — barrel exports
- [x] **Phase 5** — `SpeciesManager`
  - `src/engine/SpeciesManager.ts` — register, load, switch, delegate notes and controls
  - Not yet wired into `PlantasiaEngine` or v1 preset system
- [x] **Phase 6** — Species module scaffolding *(superseded by Phases 8–11)*
  - `src/species/seed|flowers|mold|bacteria/index.ts` — initial `SoundWorld` stubs and metadata
  - `src/species/index.ts` — barrel export (`seedSpecies`, `flowersSpecies`, …)
  - [docs/SPECIES.md](./docs/SPECIES.md) — species reference
- [x] **Phase 7** — Species registration and smoke tests *(superseded by Phases 8–11)*
  - `src/engine/createSpeciesManager.ts` — factory with all four species pre-registered
  - `scripts/validate-species.mjs` — registration and load smoke test (`npm run test:species`)
  - All four species now live with full audio graphs; still not wired to `PlantasiaEngine` or browser demo
- [x] **Phase 8** — Seed Sound World (reference implementation)
  - `src/species/seed/` — `synth.ts`, `effects.ts`, `generator.ts`, `metadata.ts`, live `SoundWorld`
  - Plantasonic-inspired Tone.js PolySynth + effects + pentatonic generator
  - `DEFAULT_SPECIES_ID = 'seed'`, `loadDefaultSpecies()` on `SpeciesManager`
  - v1 `playPreset` / browser demo unchanged
- [x] **Phase 9** — Flowers Sound World (Juno-inspired bloom)
  - `src/species/flowers/` — saw + pulse + sub stack, dual chorus, hall reverb, chord bloom generator
  - `createFlowersSoundWorld()` registered in `createSpeciesManager()`
  - Ecological controls: growth, bloom, roots, mold, bacteria mapped to Flowers DSP
  - Clearly distinct from Seed; chorus central to identity
  - v1 `playPreset` / browser demo unchanged
- [x] **Phase 10** — Mold Sound World (decay / decomposition)
  - `src/species/mold/` — drone + FM + noise layers, degradation effects chain, texture generator
  - `createMoldSoundWorld()` registered in `createSpeciesManager()`
  - `mold` control drives tape wear, flutter, feedback, distortion — species identity
  - `bacteria` control adds microscopic glitches and granular artifacts
  - Clearly distinct from Seed and Flowers; v1 `playPreset` / browser demo unchanged
- [x] **Phase 11** — Bacteria Sound World (microscopic particles)
  - `src/species/bacteria/` — NoiseSynth + FM + sine + pluck micro-voices, probability swarm generator
  - `createBacteriaSoundWorld()` registered in `createSpeciesManager()`
  - `bacteria` control drives particle density, trigger probability, swarm complexity
  - Dedicated procedural Bacteria species (beyond `mycelium` JSON preset)
  - All four species distinct; v1 `playPreset` / browser demo unchanged
- [x] **Phase 12** — Shared ecological controls system
  - `src/engine/EcologyControls.ts` — normalized 0–1 state, clamp, reset, applyTo
  - `SpeciesManager` holds ecology state; applies on `setControl` and `loadSpecies`
  - `scripts/test-ecology-controls.mjs` — defaults, clamping, reset, mock apply, species switch persistence
  - Species mappings unchanged inside each `setControl()`
- [x] **Phase 13** — Generative Ecosystem Engine
  - `src/engine/generative/` — Generator, PhraseEngine, HarmonyEngine, RhythmEngine, ProbabilityEngine, MemoryEngine
  - Species provide `GenerativePreferences` in metadata; thin adapters in `generator.ts`
  - Ecological controls shape composition; `scripts/test-generative-engine.mjs`
  - [docs/GENERATIVE_ENGINE.md](./docs/GENERATIVE_ENGINE.md)
- [x] **Phase 14** — Expressive Performance Engine
  - `src/engine/performance/` — PerformanceEngine, ExpressionRouter, VelocityEngine, DensityEngine, MacroEngine
  - Species expression profiles + `performanceApply.ts` per species
  - Velocity beyond volume; density reactions; ecological macros as expressive behaviors
  - `scripts/test-performance-engine.mjs` — `npm run test:performance`
  - [docs/PERFORMANCE_ENGINE.md](./docs/PERFORMANCE_ENGINE.md)
- [x] **Phase 15** — Plugin Architecture & Species SDK
  - `src/engine/registry/` — SpeciesRegistry, SpeciesLoader, Validation
  - `src/species/registerBuiltinSpecies.ts` — single bootstrap; engine no longer hard-codes species
  - `src/templates/species-template/` — copy-paste starter for new Sound Worlds
  - Eight `coming_soon` future species (canopy, moss, spores, mycelium, desert, ocean, rainforest, tundra)
  - `scripts/test-species-registry.mjs` — `npm run test:registry`
  - [docs/PLUGIN_ARCHITECTURE.md](./docs/PLUGIN_ARCHITECTURE.md), [docs/CREATING_A_SPECIES.md](./docs/CREATING_A_SPECIES.md)
- [x] **Phase 16** — v2 Release, testing, and documentation
  - Package `2.0.0` — v2 exports from root (`createSpeciesManager`, `createSpeciesRegistry`, species singletons)
  - `scripts/test-v2-engine.mjs` — full release validation (`npm run test`)
  - v2 quickstart examples: `basic-engine`, `species-switching`, `midi-performance`, `generative-playback`
  - Documentation pass across README, API, species, generative, performance, plugin, audit
- [ ] **Phase 17** — Event bus (`speciesChanged`, `notePlayed`, `parameterChanged`, …)
- [ ] **Phase 18** — Wire `SpeciesManager` into `PlantasiaEngine`; unified host facade
- [ ] **Phase 19** — Engine-level MIDI, transport, scheduler
- [ ] **Phase 20** — Remove legacy preset routing; narrow public exports (semver major)

Full checklist: [docs/ENGINE_AUDIT.md](./docs/ENGINE_AUDIT.md) §7.

### Documentation index

| Document | Purpose |
|----------|---------|
| [SOUND_WORLD_ENGINE.md](./docs/SOUND_WORLD_ENGINE.md) | Sound World architecture and v2 vision |
| [API.md](./docs/API.md) | v2 target public API + `SoundWorld` contract |
| [API_V1.md](./docs/API_V1.md) | Current shipped API |
| [ENGINE_AUDIT.md](./docs/ENGINE_AUDIT.md) | v1 audit, technical debt, migration phases |
| [SPECIES.md](./docs/SPECIES.md) | Four species archetypes and synthesis direction |
| [GENERATIVE_ENGINE.md](./docs/GENERATIVE_ENGINE.md) | Shared generative composition system |
| [PERFORMANCE_ENGINE.md](./docs/PERFORMANCE_ENGINE.md) | Expressive performance routing and macros |
| [PLUGIN_ARCHITECTURE.md](./docs/PLUGIN_ARCHITECTURE.md) | Species registry, loader, plugin lifecycle |
| [CREATING_A_SPECIES.md](./docs/CREATING_A_SPECIES.md) | Contributor guide for new Sound Worlds |
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | v1 subsystem layout |
| [PRESETS.md](./docs/PRESETS.md) | Sound World JSON schema |
| [SOUND_DESIGN.md](./docs/SOUND_DESIGN.md) | Signal flow and Mold design |
| [CONTRIBUTING.md](./docs/CONTRIBUTING.md) | Contributor guide |

---

## Milestone 1 — Preset / Sound World system

- [x] JSON Sound Worlds organized by category (`presets/flora`, `ambient`, `textures`, `signature`)
- [x] Preset loader, serialization, aliases, and category manifest
- [x] `getPresetById`, `getPresetsByCategory`, `getPresetControls`, `getPresetMold`
- [x] Visual metadata (ASCII theme, palette, motion) on all bundled worlds
- [x] MIDI performance defaults per world
- [x] Preset validation at build (`validate-presets.mjs`, `themeRegistry.ts`)
- [x] Live voice routing types (`standard` | `botanical` | `plantasonic`)
- [ ] Preset browser UI component (consumer apps)
- [ ] User preset save/load to localStorage or file
- [ ] Preset morphing between two states

---

## Milestone 2 — Effect rack

Scaffold: `src/effects/` · Signature graphs use hand-built WAAPI effects today.

- [ ] Serial effect rack with insert order
- [x] Reverb (basic — standard Tone.js path + signature hall chains)
- [x] Delay (basic — standard Tone.js path + signature FX chains)
- [x] Distortion / saturation (Mold chain + waveshapers in Juno / Plantasonic)
- [x] Compression (Juno master limiter, Plantasonic compressor)
- [ ] Chorus (partial — v2 Flowers/Seed species + custom WAAPI in signature synths)
- [ ] Phaser
- [ ] EQ (parametric)

---

## Milestone 3 — Modulation

Scaffold: `src/modulation/`

- [x] LFO (filter modulation on standard path; multiple LFOs in Mold + signature synths)
- [x] ADSR envelope (PolySynth + per-voice WAAPI envelopes)
- [x] Random drift (Juno / Plantasonic living voice ticks, preset `drift` param)
- [x] Expression routing (partial — v2 `ExpressionRouter` maps velocity, density, and macros to synth targets; see Phase 14)
- [ ] Modulation matrix with multiple sources/destinations
- [ ] Sample & hold
- [ ] Envelope followers

---

## Milestone 4 — MIDI

Scaffold: `src/midi/` (types only — no runtime wiring). Engine-level MIDI input planned for v2 Phase 17.

- [ ] Web MIDI input (`enableMIDI`, `getMIDIDevices`)
- [ ] MIDI Learn for ecological / botanical controls
- [x] Velocity sensitivity (partial — signature live voices + v2 `VelocityEngine` on all four species; no Web MIDI path yet)
- [ ] Aftertouch / channel pressure (Plantasonic performance state exists; v2 router ready for extension, no input path)
- [ ] MPE (MIDI Polyphonic Expression)

---

## Milestone 5 — Sequencing

Scaffold: `src/sequencing/` (types only)

- [ ] Euclidean sequencer
- [ ] Arpeggiator with multiple modes
- [ ] Probability gates
- [ ] Chord generator
- [ ] Scale quantizer

---

## Milestone 6 — Performance

v2 **Phase 14** shipped the Expressive Performance Engine — see [docs/PERFORMANCE_ENGINE.md](./docs/PERFORMANCE_ENGINE.md).

### Shipped (v2 Phase 14)

- [x] Velocity beyond volume — filter, envelope, brightness, chorus, reverb, saturation, osc blend (per-species profiles)
- [x] Density engine — active notes, phrase/harmonic/drone activity; species-specific reactions
- [x] Ecological macros — five controls expand into many simultaneous expressive targets
- [x] Legato / staccato / chord-held detection
- [x] Growth-scaled polyphony per species (not yet a host-configurable API)

### Remaining

- [ ] Configurable polyphony limits (host-facing API)
- [ ] Voice stealing strategy
- [ ] CPU metering and adaptive quality
- [ ] Preset morphing at runtime
- [ ] Offline rendering / export
- [ ] Central scheduler (replace ad-hoc `setTimeout` / `setInterval` in signature synths)

---

## Milestone 7 — Mold macro & Sound World registry (2026)

**Status:** Complete on `main` / `v0.2.0`

### Shipped

- [x] Flagship **Plantasonic** preset and WAAPI graph
- [x] **Juno Flowers** botanical preset and WAAPI graph
- [x] Eleven bundled Sound Worlds with `controls`, `visual`, `midi` metadata
- [x] Dynamic preset registry and category manifest
- [x] **Mold** living degradation macro — eight modules, five stages
- [x] Preset-specific mold profiles (`MOLD_PROFILES`, `resolveMoldProfile`)
- [x] Mold on all presets via `controls.mold`; `setMold()` public API
- [x] Fixed internal master gain (volume removed from creative surface)
- [x] `ENGINE_PARAMETER_METADATA` for hosts and future MIDI Learn
- [x] LFO min-span guard for zero-depth Mold modulation (`applyMold.ts`)

### Bundled Sound Worlds

| ID | Display name | Routing | v2 species |
|----|--------------|---------|------------|
| `plantasonic` | Plantasonic | plantasonic | Seed |
| `seed` | Moss | standard | Seed |
| `root` | Roots | standard | Seed |
| `bloom` | Bloom | standard | Flowers |
| `fern` | Canopy | standard | Flowers |
| `juno-flowers` | Night Bloom | botanical | Flowers |
| `vine` | Rainforest | standard | Mold |
| `crystal` | Winter | standard | Mold |
| `mutation` | Mutation | standard | Mold / Bacteria |
| `coral` | Desert | standard | Seed |
| `mycelium` | Mycelium | standard | Bacteria |

### Remaining worlds

- [ ] Aurora

### Future engine work

- [ ] Unified audio + visual consumption in host apps
- [ ] Procedural Sound World variation at runtime
- [x] Ecological control surface (`growth`, `bloom`, `roots`, `mold`, `bacteria`) — v2 `EcologyControls` + `SpeciesManager` (Phase 12); wire into `PlantasiaEngine` (Phase 16)
- [ ] Honor extended `SynthSettings` on standard path (`chorus`, `subAmount`, `stereoWidth`)

---

## Integration targets

- **Plantasia 2.0** — primary consumer via `file:` or npm dependency
- **Plantasonic** — flagship Seed species host
- **Standalone demo** — `demo/` and `examples/`
- **Future platforms** — VST, installation, mobile (v2 API designed browser-first, platform-portable)
- **Future npm publish** — semantic versioning with preset JSON shipped in package
