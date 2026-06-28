# API Reference (v1 — current implementation)

> **Note:** This documents the shipped v1 public API frozen at tag `v1-sound-engine-baseline`.  
> For the v2 target contract, see [API.md](./API.md).

Public exports from `plantasia-sound-engine`. All methods behave identically to v0.1.0 unless noted in CHANGELOG.

---

## Class: `PlantasiaEngine`

Primary facade for the botanical synthesis engine.

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `presets` | `PlantasiaPreset[]` | Built-in preset definitions |
| `initialBotanicalControls` | `BotanicalControls` | Default botanical knob values |
| `defaultNotePool` | `string[]` | Notes used by `triggerChord()` |

### Methods

#### `init(): Promise<void>`

Start the Tone.js AudioContext. **Must be called from a user gesture** (click, keypress).

```typescript
const engine = new PlantasiaEngine();
await engine.init();
```

#### `playPreset(preset: PlantasiaPreset): void`

Apply preset synth settings and trigger audio (chord for standard presets; Juno path for botanical presets).

```typescript
engine.playPreset(engine.presets.find(p => p.id === 'bloom')!);
```

#### `stop(): void`

Release all active voices (including Juno Flowers live voices).

```typescript
engine.stop();
```

#### `applyBotanicalControls(controls: BotanicalControls): void`

Map live botanical knobs onto the synth graph.

```typescript
engine.applyBotanicalControls({
  ...engine.initialBotanicalControls,
  mold: 18,
  space: 80,
  texture: 70,
});
```

#### `triggerChord(notes?: string[]): void`

Play a short chord. Defaults to the first three notes in `defaultNotePool`. Requires `init()` first.

```typescript
engine.triggerChord(['C3', 'E3', 'G3']);
```

#### `setTempo(bpm: number): void`

Set Tone.js Transport tempo.

```typescript
engine.setTempo(120);
```

#### `getWaveform(): Float32Array`

Read analyser waveform data for visualization.

#### `getLevel(): number`

Normalized output level (0–1).

#### `setMold(value: number): void`

Set the Mold macro (0–100). Drives the living degradation engine: tape wear, harmonic distortion, granular mutation, delay corruption, spectral decay, pitch instability, and subtle texture — scaled by the active Sound World's mold profile.

```typescript
engine.setMold(24);
```

#### `resolveMoldParameters(mold, profile?)`

Resolve Mold into all internal module targets. Optional `MoldProfile` override; defaults to the active preset profile.

```typescript
import { resolveMoldParameters, MOLD_PROFILES } from 'plantasia-sound-engine';

const params = resolveMoldParameters(60, MOLD_PROFILES.plantasonic);
```

#### `resolveMoldProfile(preset)`

Get the mold personality for a preset.

```typescript
import { resolveMoldProfile, plantasonicPreset } from 'plantasia-sound-engine';

const profile = resolveMoldProfile(plantasonicPreset);
// { id: 'plantasonic', weights: { tapeWear: 1.35, ... } }
```

#### `getMold(): number`

Read the current Mold value (0–100).

#### `getParameterMetadata(): EngineParameterMeta[]`

Exported parameter metadata for hosts, MIDI Learn, automation, and preset storage.

```typescript
const meta = engine.getParameterMetadata();
// [{ id: 'mold', name: 'Mold', automatable: true, ... }]
```

#### `updateParameter(parameter, value): void`

Update a single synth setting from the active preset.

```typescript
engine.updateParameter('filterHz', 2400);
engine.updateParameter('reverb', 0.5);
```

Supported keys: `oscillator`, `filterHz`, `attack`, `release`, `delay`, `reverb`.

---

## Functional exports

Equivalent to calling methods on `PlantasiaEngine`:

| Function | Description |
|----------|-------------|
| `initAudio()` | Start audio context |
| `playPreset(preset)` | Play a preset |
| `stopAudio()` | Stop all voices |
| `applyBotanicalControls(controls)` | Apply botanical mapping (includes `mold`) |
| `setMold(mold)` | Set Mold macro (0–100) |
| `getMoldValue()` | Read current Mold value |
| `getPresetMold(preset)` | Read preset default Mold |
| `ENGINE_PARAMETER_METADATA` | Parameter metadata export |
| `resolveMoldParameters(mold, profile?)` | Resolve macro → all module targets |
| `resolveMoldProfile(preset)` | Get Sound World mold profile |
| `MOLD_PROFILES` | Built-in mold profile registry |
| `triggerChord(notes?)` | Trigger chord |
| `setTempo(bpm)` | Set tempo |
| `getWaveform()` | Waveform data |
| `getLevel()` | Output level |
| `updateParameter(key, value)` | Update parameter |
| `defaultNotePool` | Default note array |
| `presets` | Preset array |

```typescript
import { initAudio, playPreset, presets, stopAudio } from 'plantasia-sound-engine';

await initAudio();
playPreset(presets[0]);
stopAudio();
```

---

## Preset exports

| Export | Description |
|--------|-------------|
| `junoFlowersPreset` | Full Juno Flowers `PlantasiaPreset` |
| `JUNO_FLOWERS_BOTANICAL` | Botanical routing blocks |
| `JUNO_FLOWERS_GROWTH` | Growth-stage metadata |
| `JUNO_FLOWERS_SCALE` | Scale frequencies (Hz) |

---

## Types

### `PlantasiaPreset`

```typescript
type PlantasiaPreset = {
  id: string;
  name: string;
  species: SpeciesName;
  description: string;
  mood: string;
  asciiState: OrganismState;
  synth: SynthSettings;
  scale?: number[];
  botanical?: JunoBotanicalConfig;
  growth?: JunoGrowthConfig;
};
```

### `SynthSettings`

Oscillator, filter, envelope, and effects configuration. See `src/utils/types/presets.ts`.

### `BotanicalControls`

Record of botanical knob values (0–100): `energy`, `growth`, `density`, `evolution`, `random`, `life`, `space`, `texture`, `harmony`, `resonance`.

### `BotanicalControlKey`, `SpeciesName`, `OrganismState`

String union types for preset metadata and controls.

### `JunoBotanicalConfig`, `JunoGrowthConfig`

Juno Flowers-specific routing and growth configuration.

---

## Internal preset utilities (not in public barrel)

Available under `src/presets/` for future subpath exports:

- `serializePreset(preset)` — JSON string
- `deserializePreset(json)` — parse preset
- `getPresetById(id)` — lookup
- `getPresetsByCategory(category)` — filter by manifest category

---

## Error handling

- `init()` rejects if Tone.js cannot start the AudioContext.
- `playPreset()` before `init()` logs and returns without playing (preset staged).
- `triggerChord()` before `init()` is a no-op.
- `updateParameter()` without an active preset logs and returns.
