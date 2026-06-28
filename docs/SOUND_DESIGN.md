# Sound Design

Philosophy and signal architecture for the Plantasia Sound Engine.

## Sound philosophy

Plantasia treats synthesis as **botanical expression** — musicians and apps speak in organism terms (energy, growth, space, texture) rather than raw synth parameters. The engine translates those metaphors into Tone.js values in one place (`audioEngine.ts`), keeping UI layers decoupled from DSP details.

Design goals:

- Warm, organic, contemplative tones suitable for generative and interactive art
- Presets as **organism states** (seed → growth → bloom) not generic synth patches
- Extensibility for species-specific engines (Juno Flowers) without forking the core API

## Signal flow

Default engine path:

```
PolySynth → Filter → [Mold chain] → Delay → Reverb → destination
                         ↑
              tape wear → harmonic distortion → spectral decay → micro-delay
                         ↑
               LFO (filter frequency)
```

Analyser and meter tap the reverb output for visualization.

Juno Flowers bypasses the default PolySynth when `preset.botanical` is set, routing through a dedicated Web Audio graph in `junoFlowersAudio.ts` with chorus, saturation, stereo width, and growth-stage voice behavior.

## Oscillator architecture

Standard presets use `Tone.PolySynth(Tone.Synth)` with oscillator types: sine, triangle, sawtooth, square.

Multi-oscillator detune spreads map to Tone fat oscillators when `detuneCents[]` is provided (Juno Flowers: `[-14, -7, 0, 7, 14]`).

## Filters

Default: lowpass filter with preset-specific `filterHz` and optional `filterQ`. Botanical **Texture** maps to filter cutoff (brightness); **Resonance** maps to filter Q.

## Envelopes

ADSR simplified to attack/release on the PolySynth envelope. Botanical **Growth** lengthens attack and release. Output level is fixed internally — loudness is controlled by the OS / browser.

## Mold macro

**Mold** is Plantasia's signature living degradation macro. A single 0–100 control drives a multi-stage engine that makes sound feel organically consumed, mutated, aged, and transformed — without relying on white noise as the primary effect.

### Multi-stage behavior

| Range | Character | Processes |
|-------|-----------|-----------|
| 0–20% | Aging | Analog drift, tape saturation, wow/flutter, filter instability, stereo movement |
| 20–40% | Decay | Harmonic distortion, soft crackle, pitch slips, delay instability, transient dropouts |
| 40–60% | Mutation | Granular micro-stutter, buffer repeats, delay blooms, resonant bursts |
| 60–80% | Corruption | Bit/sample-rate reduction, spectral smear, ring modulation, buffer scrambling |
| 80–100% | Overgrowth | Controlled glitch bursts, tape chew, reverse echoes, self-oscillating delay, harmonic bloom |

### Internal modules

`src/mold/` resolves Mold into eight modular processes:

- **Tape Wear** — saturation, wow, flutter
- **Harmonic Distortion** — warm drive and bloom
- **Delay Corruption** — feedback instability, blooms, reverse echoes
- **Granular Mutation** — micro-stutter, grain density, buffer repeats
- **Buffer Glitch** — controlled bursts, tape chew, scrambling
- **Spectral Decay** — bit depth, sample-rate reduction, smearing
- **Pitch Instability** — drift, slips, random offsets
- **Texture Engine** — subtle crackle and air (not dominant noise)

### Preset-specific personalities

Each Sound World scales module weights via a **Mold profile** (`MOLD_PROFILES`, `resolveMoldProfile()`). Plantasonic emphasizes tape wear; Bloom emphasizes granular petals; Roots emphasizes earthy distortion; Rainforest emphasizes delay blooms; Winter emphasizes spectral decay; Night Bloom emphasizes haunted delays.

Presets may override with `"moldProfile": "winter"` in JSON.

Mold is stored on presets via `controls.mold`, exposed through `setMold()` / `getMold()`, and included in `ENGINE_PARAMETER_METADATA`. The public API label remains **Mold**.

## Effects routing

| Control / preset field | Target |
|---------------------|--------|
| `effects.delay` | FeedbackDelay wet |
| `effects.echo` | FeedbackDelay feedback |
| `effects.reverb` | Reverb wet |
| Botanical `space` | Delay + reverb wet (live) |
| `drift` | LFO rate + filter sweep range |

Future effect rack (`src/effects/`) will formalize insert order without changing preset JSON schema.

## Botanical → synthesis mapping

| Botanical control | Synth parameter |
|-------------------|-----------------|
| Mold | Living degradation macro (tape wear, mutation, corruption, spectral decay) |
| Growth | Envelope attack / release |
| Life | LFO frequency |
| Space | Delay & reverb wet |
| Texture | Filter cutoff |
| Resonance | Filter Q |
| Energy | Voice density / expressiveness (modulation path) |

## Preset design

Presets live in `presets/` as JSON, organized by category:

| Category | Character |
|----------|-----------|
| flora | Organic melodic species (Seed, Bloom, Juno Flowers, …) |
| ambient | Spacious, networked tones (Coral, Mycelium) |
| textures | Edgy / crystalline (Mutation, Crystal) |
| drones | Reserved for future long-form patches |
| percussion | Reserved for future rhythmic patches |

Each preset includes metadata (`species`, `mood`, `asciiState`) for UI apps like Plantasia 2.0 — audio engine ignores fields it doesn't need.

## Juno Flowers

Signature preset with:

- Detuned sawtooth stack
- Botanical blocks: Morning Mist (reverb), Roots (sub/sat), Pollen (chorus), Photosynthesis (saturation), Canopy (stereo), Wind (modulation)
- Growth stages driven by hold time: seed → sprout → leaves → bud → bloom → pollination
- Living voices with per-note modulation and particle shimmer

## Future sound goals

- Expandable effect rack with serial inserts
- Modulation matrix for complex patches without code changes
- Sample playback from `samples/` and convolution reverb from `assets/impulse-responses/`
- Wavetable oscillators from `assets/wavetables/`
- MPE-aware voice allocation for expressive controllers
- Preset morphing between organism states

See [ROADMAP.md](../ROADMAP.md) for milestone tracking.
