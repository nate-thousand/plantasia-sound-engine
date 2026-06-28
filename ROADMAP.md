# Roadmap

Milestones for long-term Plantasia Sound Engine development. v0.1.0 delivers the core browser engine; subsequent milestones extend capabilities without breaking the public API.

---

## Milestone 1 — Preset system

- [x] JSON preset files organized by category (`presets/flora`, `ambient`, `textures`, …)
- [x] Preset loader and serialization utilities
- [ ] Preset browser UI component (consumer apps)
- [ ] User preset save/load to localStorage or file
- [ ] Preset morphing between two states

---

## Milestone 2 — Effect rack

Scaffold: `src/effects/`

- [ ] Serial effect rack with insert order
- [x] Reverb (basic — in core engine graph)
- [x] Delay (basic — in core engine graph)
- [ ] Chorus
- [ ] Phaser
- [ ] Distortion / saturation module
- [ ] EQ (parametric)
- [ ] Compression

---

## Milestone 3 — Modulation

Scaffold: `src/modulation/`

- [x] LFO (basic — filter modulation in core engine)
- [x] ADSR envelope (in PolySynth)
- [x] Random drift (Juno Flowers + drift param)
- [ ] Modulation matrix with multiple sources/destinations
- [ ] Sample & hold
- [ ] Envelope followers

---

## Milestone 4 — MIDI

Scaffold: `src/midi/`

- [ ] Web MIDI input
- [ ] MIDI Learn for botanical controls
- [ ] Velocity sensitivity
- [ ] Aftertouch / channel pressure
- [ ] MPE (MIDI Polyphonic Expression)

---

## Milestone 5 — Sequencing

Scaffold: `src/sequencing/`

- [ ] Euclidean sequencer
- [ ] Arpeggiator with multiple modes
- [ ] Probability gates
- [ ] Chord generator
- [ ] Scale quantizer

---

## Milestone 6 — Performance

- [ ] Configurable polyphony limits
- [ ] Voice stealing strategy
- [ ] CPU metering and adaptive quality
- [ ] Preset morphing at runtime
- [ ] Offline rendering / export

---

---

## Milestone 7 — Mold macro & preset registry (2026)

**Status:** Complete

### Completed

- [x] Added flagship **Plantasonic** preset (`presets/signature/plantasonic.json`)
- [x] Dynamic preset registry and category manifest
- [x] Preset metadata architecture (`controls.mold`, species, asciiState)
- [x] Public preset API (`presets`, `getPresetMold`, loader)
- [x] Plantasonic available through engine registry
- [x] **Volume replaced by Mold macro** — fixed internal master gain
- [x] Mold added as a first-class engine parameter (MIDI, automation, presets)
- [x] **Living Degradation Engine** — multi-stage mold macro with eight internal modules and preset-specific personalities

### Mold architecture (2026)

- [x] Multi-stage behavior (aging → decay → mutation → corruption → overgrowth)
- [x] Modular degradation: tape wear, harmonic distortion, delay corruption, granular mutation, buffer glitch, spectral decay, pitch instability, texture engine
- [x] Preset-specific mold profiles (`MOLD_PROFILES`, `resolveMoldProfile`)
- [x] White noise removed as primary mold effect; texture engine provides subtle crackle only

### Planned — future sound-world presets

- [ ] Bloom
- [ ] Roots
- [ ] Canopy
- [ ] Fern
- [ ] Moss
- [ ] Rainforest
- [ ] Desert
- [ ] Winter
- [ ] Night Bloom
- [ ] Aurora
- [ ] Mycelium

### Planned — future engine work

- [ ] Expanded procedural sound worlds
- [ ] Visual metadata
- [ ] ASCII theme metadata
- [ ] Motion metadata
- [ ] Unified audio and visual preset system
- [ ] Procedural preset variation
- [ ] Additional creative macro controls

---

## Integration targets (continued)

- **Plantasia 2.0** — primary consumer via `file:` or npm dependency
- **Standalone demo** — `demo/` and `examples/`
- **Future npm publish** — semantic versioning with preset JSON shipped in package
