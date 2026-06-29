# Roadmap

Milestones for Plantasia Sound Engine development.

The engine is transitioning from a **preset-centric v1 runtime** (frozen at tag `v1-sound-engine-baseline`) to a **species-centric Sound World Engine** on branch `v2-sound-world-engine`. Architecture vision: [docs/SOUND_WORLD_ENGINE.md](./docs/SOUND_WORLD_ENGINE.md). **Migration:** [docs/MIGRATION_V1_TO_V2.md](./docs/MIGRATION_V1_TO_V2.md).

---

## Current status

| Item | Value |
|------|-------|
| **Package version (package.json)** | `1.0.0-beta.1` |
| **Honest integration target** | `1.0.0-beta.1` — **shipped** |
| **Production branch** | `main` — v1 preset API + mold profiles |
| **Active development branch** | `v2-sound-world-engine` |
| **v1 freeze tag** | `v1-sound-engine-baseline` |
| **Deprecated tag** | `v2.0.0` — architecture milestone only; **do not pin** |
| **Live species** | Seed, Flowers, Mold, Bacteria — integration beta |
| **Public API today** | `createPlantasiaEngine()` facade + `plantasia-sound-engine/public` |
| **Architecture phases** | ✅ Phases 8–21 complete |
| **Integration** | ✅ Beta ready — [PLANTASONIC_INTEGRATION.md](./docs/PLANTASONIC_INTEGRATION.md) |
| **Live demo** | https://sound-engine.xyz — demo control surface (validated) |

### What shipped in 1.0.0-beta.1

Phases 17–21 deliver a host-safe unified facade, lifecycle enforcement, semantic events, central scheduler, Web MIDI scaffold, Plantasonic adapter, validation gates, and Vercel demo deploy.

### Release tags

| Tag | Description |
|-----|-------------|
| `v0.1.0` | First stable browser engine |
| `v0.2.0` | Sound Worlds API, mold profile exports, preset validation |
| `v1-sound-engine-baseline` | Frozen engine before v2 refactor |
| `v2.0.0` | **Deprecated** — Sound World architecture landed; premature major tag |
| `v1.0.0-beta.1` | **Current** — honest Sound World integration beta (Phases 17–21) |

**Plantasonic should pin:** `1.0.0-beta.1` or a commit SHA on `v2-sound-world-engine` — not `v2.0.0`.

---

## Integration blockers (complete)

All blockers shipped in **`1.0.0-beta.1`**:

| Blocker | Phase | Status |
|---------|-------|--------|
| Lifecycle contract — states, throws, `LIFECYCLE.md` | 17 | ✅ |
| Playable-only default registry; remove `coming_soon` from host API | 17 | ✅ |
| Unified `PlantasiaEngine` facade + tiny exports | 18 | ✅ |
| `resolvePresetToSpecies()` adapter | 18 | ✅ |
| `registerSpecies()` for external packages | 18 | ✅ |
| Event bus for visuals | 19 | ✅ |
| Unified scheduler (replace ad-hoc timers) | 20 | ✅ |
| MIDI / transport | 20 | ✅ |
| `MIGRATION_V1_TO_V2.md` | 21 | ✅ |
| Browser sonic test (`validate-species-audio.mjs`) | 21 | ✅ |
| CPU + performance budget test | 21 | ✅ |
| Plantasonic adapter + integration doc | 21 | ✅ |

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
  - `scripts/validate-species-api.mjs` — registration and load smoke test (`npm run test:species`)
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
- [x] **Phase 16** — Architecture milestone (documentation + test suite)
  - v2 exports from root; examples; documentation pass
  - **Note:** tagged `v2.0.0` prematurely — treat as architecture beta, not integration release
  - See [docs/MIGRATION_V1_TO_V2.md](./docs/MIGRATION_V1_TO_V2.md)
- [x] **Phase 17** — Lifecycle contract **(blocker)**
  - Explicit engine states; throw on `noteOn` / `start` / `loadSpecies` when invalid
  - [docs/LIFECYCLE.md](./docs/LIFECYCLE.md)
  - Playable-only default registry; remove `coming_soon` from host-facing list
  - Rename `validate-species.mjs` → `validate-species-api.mjs`
  - 0–1 control scale enforced at boundary
  - Reserved built-in species IDs
- [x] **Phase 18** — Unified `PlantasiaEngine` facade **(blocker)**
  - `engine.loadSpecies()`, `setControl()`, `noteOn`/`noteOff`, `start`/`stop`
  - `engine.registerSpecies()` — external packages without editing bootstrap
  - `resolvePresetToSpecies()` + `loadPreset()` legacy adapter
  - `plantasia-sound-engine/public` slim export surface; full root export preserved
  - Async `start()` awaits species audio readiness
- [x] **Phase 19** — Event bus
  - `speciesChanged`, `notePlayed`, `controlChanged`, `generatorEvent`, `densityChanged`
  - Semantic events for visualization — no Tone node coupling
  - [docs/EVENTS.md](./docs/EVENTS.md), `scripts/test-events.mjs`
- [x] **Phase 20** — Unified scheduler + MIDI / transport **(blocker before Plantasonic)**
  - `EngineScheduler` + `Transport` on facade; generative timers migrated
  - Web MIDI input via `enableMidi()`; transport lifecycle
  - [docs/SCHEDULER.md](./docs/SCHEDULER.md), `scripts/test-scheduler.mjs`, `scripts/test-midi.mjs`
- [x] **Phase 21** — Plantasonic integration
  - `createPlantasonicAdapter()`, validation gates, CPU budget test
  - [docs/PLANTASONIC_INTEGRATION.md](./docs/PLANTASONIC_INTEGRATION.md)
  - Semver `1.0.0-beta.1` — first honest integration beta

Full checklist: [docs/ENGINE_AUDIT.md](./docs/ENGINE_AUDIT.md) §8.

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
| [LIFECYCLE.md](./docs/LIFECYCLE.md) | Engine state machine and host integration contract |
| [MIGRATION_V1_TO_V2.md](./docs/MIGRATION_V1_TO_V2.md) | v1 presets → v2 species migration |
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

Shipped in Phase 20 (scaffold + note input). Remaining items are future milestones.

- [x] Web MIDI input — `engine.enableMidi()`, `engine.midi.devices` *(Phase 20)*
- [ ] MIDI Learn for ecological / botanical controls
- [x] Velocity sensitivity — signature live voices + v2 `VelocityEngine`; Web MIDI note path via `enableMidi()`
- [ ] Aftertouch / channel pressure
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
- [x] Central scheduler — `EngineScheduler` + `Transport` on facade *(Phase 20)*

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
- [x] Ecological control surface — v2 `EcologyControls` (Phase 12); wire into unified facade (Phase 18)
- [ ] Honor extended `SynthSettings` on standard path (`chorus`, `subAmount`, `stereoWidth`)

### Demo control surface (complete)

- [x] Full engine audit — presets, species, ecology, botanical, mold, generative, MIDI, events
- [x] Collapsible panel sections with persisted open/closed state
- [x] Preset browser — categories, favorites, prev/next/random, JSON export
- [x] Species-specific performance macro routing (12 macros × 4 species)
- [x] Layer overview cards per species with ecology proxy routing
- [x] Waveform + multi-band meters, live event feed, debug validation panel
- [x] Keyboard (A–K) + Web MIDI enable + v1 `playPreset` chord preserved
- [x] Debug panel shows real engine state only (no guessed values)
- [x] Validation pass — [docs/DEMO_CONTROL_AUDIT.md](./docs/DEMO_CONTROL_AUDIT.md)
- [ ] Audio reactive mapping — awaits engine `bindSensor()` implementation
- [ ] v2 public analyser getters — waveform meters currently v1-biased

---

## Integration targets

- **Plantasia 2.0** — primary consumer via `file:` or npm dependency
- **Plantasonic** — flagship Seed species host
- **Standalone demo** — `demo/` complete control surface; `examples/` focused snippets
- **Future platforms** — VST, installation, mobile (v2 API designed browser-first, platform-portable)
- **Future npm publish** — semantic versioning with preset JSON shipped in package
