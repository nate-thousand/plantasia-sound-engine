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

## Integration targets

- **Plantasia 2.0** — primary consumer via `file:` or npm dependency
- **Standalone demo** — `demo/` and `examples/`
- **Future npm publish** — semantic versioning with preset JSON shipped in package
