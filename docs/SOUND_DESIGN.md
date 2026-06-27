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
PolySynth → Filter → Delay → Reverb → destination
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

ADSR simplified to attack/release on the PolySynth envelope. Botanical **Growth** lengthens attack and release; **Energy** adjusts volume.

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
| Energy | Oscillator volume |
| Growth | Envelope attack / release |
| Life | LFO frequency |
| Space | Delay & reverb wet |
| Texture | Filter cutoff |
| Resonance | Filter Q |

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
