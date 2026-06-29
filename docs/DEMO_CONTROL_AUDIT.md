# Demo Control Audit

Validation pass for `demo/` — every visible control mapped to real engine behavior.

**Audit date:** 2026-06-28  
**Engine version:** `1.0.0-beta.1`  
**Demo entry:** `npm run build && npm run demo`

---

## Summary

| Category | Active controls | Removed/disabled in pass |
|----------|-----------------|--------------------------|
| Lifecycle | 4 header buttons | — |
| Presets | 10 | — |
| Sound Worlds | 1 select + metadata | — |
| Musical | 5 sliders + 3 transport buttons | 8 removed (swing, probability, phrase length, silence, root/scale/tuning/octave) |
| Layers | 4–5 ecology proxy sliders per species | mute/solo/width/activity/mod removed |
| Timbre | 7 sliders + oscillator | 6 removed (detune, mod depth, harmonic richness, drift, grit, instability) |
| Effects | 3 sliders | 6 removed (chorus, saturation, compressor, EQ×3) |
| Generative | 4 sliders | 5 removed (memory, surprise, repetition, transition, mod evolution) |
| Ecology (v2) | 5 sliders | — |
| Botanical (v1) | 11 sliders | — (labeled v1 path) |
| Audio | 1 button + stage meters | mic checkbox, fake transient text removed |
| Reactive | hint only | 6 disabled selects removed |
| MIDI | 2 buttons + monitor | device select, refresh removed |
| Keyboard | 1 checkbox + key display | layout/octave/velocity removed |
| Performance | 12 macro sliders | — (ecology routes = v2 audible) |
| Utilities | 9 buttons + import textarea | — |
| Debug | 2 buttons + live log | guessed state removed |

**Result:** No active slider or button pretends to work. Unavailable engine APIs are labeled in section hints or Debug → Validate.

---

## Lifecycle

| Control | Location | Engine API | Status |
|---------|----------|------------|--------|
| Start Audio | Header | `engine.init()`, `loadPreset()`, `applyAllControls()` | **Working** — requires user gesture; subtitle shows locked/unlocked |
| Start/Stop Generative | Header | `engine.start()`, `engine.stopSpecies()` | **Working** |
| Play Preset Chord | Header | `engine.playPreset(preset)` | **Working** — v1 path only |
| Stop | Header | `engine.stop()` | **Working** |
| Panic | MIDI + Utilities | `engine.allNotesOff()`, `engine.stop()` | **Working** |

### Lifecycle rules (enforced in demo)

- Audio locked until Start Audio clicked — visible in subtitle + debug
- `loadSpecies` before unlock → status error, no engine call
- `noteOn` before running → error: "Start Generative first"
- MIDI enable before running → error shown
- Species switch errors surfaced in status bar

---

## Control inventory (active controls)

### Presets

| Control | Engine call | Audible / visual result |
|---------|-------------|-------------------------|
| Category filter | `getPresetsByCategory()` | UI list only |
| Preset select | `loadPreset()` when audio started | Species + ecology reload; debug updates |
| Prev / Next / Random | `loadPreset()` | Same |
| Favorite | localStorage | UI only |
| Save Temp | localStorage config export | UI only |
| Copy JSON | `exportPresetJson()` | Clipboard |

### Sound Worlds

| Control | Engine call | Result |
|---------|-------------|--------|
| Active species | `loadSpecies()`, `start()`, `applyEcologyToEngine()` | Switches Seed/Flowers/Mold/Bacteria; generative runs |

### Musical (wired)

| Control | Engine call | Subsystem | Audible on v2? |
|---------|-------------|-----------|----------------|
| Tempo | `setTempo()` | Tone transport + engine.transport | Indirect (transport ticks) |
| Phrase density | `applyBotanicalControls({ density })` | v1 graph | No (v1 only) |
| Melodic complexity | botanical `harmony` | v1 graph | No |
| Rhythmic complexity | botanical `evolution` | v1 graph | No |
| Randomness | botanical `random` | v1 graph | No |
| Transport Play/Pause/Stop | `engine.transport.*` | Host scheduler | Debug transport state |

### Layers

Each card: one slider → `engine.setControl(ecologyKey, value/100)`.

| Species | Cards | Ecology keys |
|---------|-------|--------------|
| Seed | Drone, Melody, Texture, Gesture | roots, growth, bloom, bacteria |
| Flowers | Pulse, Melody, Harmony, Texture, Ambience | bacteria, growth, bloom, roots, mold |
| Mold | Drone, Harmonics, Noise, Glitch | roots, bloom, mold, bacteria |
| Bacteria | Grains, Impulses, Ticks, Noise | bacteria, growth, roots, mold |

**Note:** Multiple cards may write the same ecology key — last slider wins. No per-layer engine API exists.

### Timbre

| Control | Engine call | v2 audible? | v1 audible? |
|---------|-------------|-------------|-------------|
| Filter cutoff | `updateParameter('filterHz')` + botanical.texture | Partial (botanical) | Yes after Play Preset Chord |
| Resonance | botanical.resonance | No | Yes |
| Attack / Release | `updateParameter` | No | Yes |
| FM amount | `setControl('bacteria')` | **Yes** | — |
| Mod speed | botanical.life | No | Yes |
| Stereo spread | `setControl('roots')` | **Yes** | — |
| Oscillator type | `updateParameter('oscillator')` | No | Yes |

### Effects

| Control | Engine call | Audible |
|---------|-------------|---------|
| Reverb | `updateParameter('reverb')` + botanical.space | v1 path + botanical |
| Delay | `updateParameter('delay')` | v1 path |
| Distortion | `setMold()` + ecology.mold | **Yes** (v2 ecology + v1 mold) |

### Generative

| Control | Maps to | Engine path |
|---------|---------|-------------|
| Phrase evolution | ecology.growth + botanical.evolution | `setControl`, `applyBotanicalControls` |
| Mutation | ecology.bacteria + botanical.random | same |
| Event frequency | botanical.life, density | same |
| Ambient evolution | ecology.bloom | `setControl` |

Generative engine internally reads ecology via species `setControl` → **audible on v2 when generative running**.

### Ecology (v2) — primary v2 surface

| Control | UI range | Engine | Internal range |
|---------|----------|--------|----------------|
| Growth | 0–100 | `setControl('growth', v/100)` | 0–1 |
| Bloom | 0–100 | `setControl('bloom', v/100)` | 0–1 |
| Roots | 0–100 | `setControl('roots', v/100)` | 0–1 |
| Mold | 0–100 | `setControl('mold', v/100)` + `setMold()` | 0–1 + 0–100 |
| Bacteria | 0–100 | `setControl('bacteria', v/100)` | 0–1 |

Debug panel shows ecology values as `growth:0.42 bloom:0.48 …`.

### Botanical (v1)

All 11 keys → `applyBotanicalControls()`. **Audible on Play Preset Chord** (v1 standard / Plantasonic / Juno graphs). Mold key also calls `setMold()` → syncs ecology.mold.

### Performance macros

12 sliders → `applyMacro()` → mix of `setControl`, `setMold`, `applyBotanicalControls`.

| Macro | v2 generative (ecology routes) | v1 only (botanical routes) |
|-------|-------------------------------|----------------------------|
| Bloom, Roots, Growth, Mold, Drift, Rain*, Motion† | Yes | Some also hit botanical |
| Air, Wind, Sunlight, Harmony, Texture | No | Yes |

\*Rain on Seed also sets delay (v1). †Motion on Bacteria sets ecology + botanical.

### MIDI

| Control | Engine call | Status |
|---------|-------------|--------|
| Enable MIDI | `enableMidi()` | **Working** — note on/off when state=`running` |
| Panic | `allNotesOff()`, `stop()` | **Working** |
| Device select | — | **Removed** — API uses first input only |

### Keyboard

| Control | Engine call | Status |
|---------|-------------|--------|
| Enable checkbox | gates key handler | **Working** |
| A–K, W/E/R | `noteOn` / `noteOff` | **Working** — auto-starts generative |
| Key display | DOM `.down` class | Visual feedback |

Fixed velocities in `KEY_MAP`; no octave/layout engine API wired.

### Audio analysis (stage)

| Element | Source | Status |
|---------|--------|--------|
| Waveform canvas | `getWaveform()` | **Partial** — v1 analyser |
| Master / Peak | `getLevel()` | **Partial** — v1 meter |
| RMS | computed from waveform | Demo-only |
| Bass / Mid / Treble | waveform thirds | Demo-only estimate |
| Live feed chips | engine state, events, notes | **Working** |

### Debug panel

Shows only measured state:

- Audio locked/unlocked
- `engine.getState()`
- Preset + species from engine metadata
- Ecology values from bridge (mirrors last `setControl`)
- Active notes (from events + keyboard)
- Transport BPM/state from `engine.transport`
- Scheduler timer count
- MIDI enabled flag + device count
- v1 level meter (labeled)

---

## Removed / not wired (engine gaps)

These were removed from the active UI or replaced with hints:

| Feature | Reason |
|---------|--------|
| Swing, note probability, phrase length, silence | No engine API |
| Root note, scale, tuning, octave | No engine API (keyboard uses fixed map) |
| Layer mute/solo/width/activity/mod | No per-layer API; fake routing removed |
| Chorus, saturation, compressor, EQ | No host-facing effect API on species chains |
| Generative memory/surprise/repetition/transition/mod evolution | No host generative parameter API |
| Microphone, audio upload | Not implemented |
| Audio reactive mapping | `bindSensor()` scaffold only |
| MIDI device select, CC learn, aftertouch | WebMidiManager: note on/off only |
| Keyboard layout, octave shift, velocity curve | Not implemented in demo wiring |
| Tape, granular, glitch direct controls | Species-internal; no facade |

---

## Sound world validation

| Species | Load | Start | Stop | Notes | Ecology | Switch cleanup |
|---------|------|-------|------|-------|---------|----------------|
| Seed | `loadSpecies('seed')` | `start()` | `stopSpecies()` | `noteOn` | 5 controls | `loadSpecies` stops previous |
| Flowers | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Mold | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Bacteria | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

Distinct character: species-specific synth/generator graphs in `src/species/*` — demo exposes via species select + ecology.

---

## Recommended engine tasks (from audit)

1. **v2 analyser getters** — public `getWaveform()` / `getLevel()` for active species output
2. **`bindSensor()`** — audio-reactive routing API
3. **Generative host parameters** — expose memory, probability curves, phrase length on `Generator`
4. **MIDI device selection** — pass `inputId` to `enableMidi()` from UI
5. **MIDI CC → ecology** — mod wheel, expression, sustain
6. **Per-layer controls** — or document ecology as the only layer surface
7. **Botanical → v2 bridge** — or document v1-only scope clearly (done in demo hints)
8. **Keyboard host API** — octave shift, velocity curve, configurable maps

---

## Build & test

```bash
npm run build   # passes
npm test        # passes
npm run demo    # manual browser verification
```

---

## Files changed in validation pass

- `demo/lib/ui.js` — removed dead controls, lifecycle guards, honest hints
- `demo/lib/engineBridge.js` — debug state, noteOn guards, effects cleanup
- `demo/lib/sections.js` — disabled/not-wired field support
- `demo/main.js` — audio lock indicator
- `demo/lib/visualizer.js` — accurate live feed state
- `demo/styles.css` — `.not-wired` styling
