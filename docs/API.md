# Public API

The public tier of Plantasia Sound Engine: what a host builds on. One page, thirty two methods, the shipped presets, the events and features they produce.

Version `1.1.0`. Pin a tag, not `v2.0.0`.

```typescript
import { createPlantasiaEngine } from 'plantasia-sound-engine/public';
```

The root export (`plantasia-sound-engine`) returns the same engine instance with the legacy v1 preset methods and engine internals on top. See [Root export](#root-export) and [API_V1.md](./API_V1.md). Species authors: [CREATING_A_SPECIES.md](./CREATING_A_SPECIES.md). Lifecycle detail: [LIFECYCLE.md](./LIFECYCLE.md).

## Quick start

```typescript
import { createPlantasiaEngine } from 'plantasia-sound-engine/public';

const engine = createPlantasiaEngine();

button.onclick = async () => {
  await engine.init();                 // user gesture unlocks audio
  await engine.loadDefaultSpecies();   // Seed
  await engine.start();                // generative playback begins
};

engine.setControl('bloom', 0.7);       // ecology, 0..1
engine.noteOn('E4', 0.8);              // play on top of the generator
engine.on('notePlayed', ({ note, time }) => visuals.spark(note, time));

function frame() {
  const { bass, onset } = engine.getAudioFeatures();
  visuals.pulse(bass, onset);
  requestAnimationFrame(frame);
}
```

A played instrument with no generator: `await engine.start({ generative: false })`, then `noteOn` and `noteOff` from your keyboard or `enableMidi()`.

## Methods

### Lifecycle

| Method | Signature | Notes |
| --- | --- | --- |
| `createPlantasiaEngine` | `(options?) => PlantasiaEngine` | One engine per page. Cheap; creates no audio nodes |
| `init` | `() => Promise<void>` | Unlocks the audio context. Call from a user gesture |
| `loadSpecies` | `(id: SpeciesId, context?) => Promise<void>` | State becomes `loaded`. Emits `speciesChanged` |
| `loadDefaultSpecies` | `(context?) => Promise<void>` | Seed |
| `loadPreset` | `(presetId: string, context?) => Promise<void>` | Resolves a preset to its species and ecology, loads both |
| `start` | `(options?: { generative?: boolean }) => Promise<void>` | Resolves when the species graph is ready. State becomes `running`. `generative: false` runs the graph without the generator |
| `stop` | `() => void` | Stops playback, releases every voice. State returns to `loaded`. Idempotent |
| `dispose` | `() => void` | State becomes `disposed`. Create a new engine afterwards |
| `getState` | `() => EngineState` | `idle`, `loaded`, `running` or `disposed` |

`noteOn` and `start` throw `EngineLifecycleError` (`code`: `NO_SPECIES_LOADED`, `ENGINE_NOT_STARTED`, `ENGINE_DISPOSED`) when called in the wrong state. `stop` and `allNotesOff` never throw.

### Notes

| Method | Signature | Notes |
| --- | --- | --- |
| `noteOn` | `(note: string, velocity?: number) => void` | Scientific pitch, `'C4'`. Velocity 0..1, default 1. Requires `running` |
| `noteOff` | `(note: string) => void` | |
| `allNotesOff` | `() => void` | Releases every voice, playback continues |

noteOn to audible is measured at 12 ms in Chromium ([PERFORMANCE.md](./PERFORMANCE.md)).

### Ecology

| Method | Signature | Notes |
| --- | --- | --- |
| `setControl` | `(control: EcologicalControl, value: number) => void` | 0..1. Throws `EcologyControlScaleError` outside that range. Emits `controlChanged` |
| `getControl` | `(control: EcologicalControl) => number` | |
| `setTempo` | `(bpm: number) => void` | Generative playback and transport |

The five controls, exported as `ECOLOGICAL_CONTROLS`:

| Control | Meaning |
| --- | --- |
| `growth` | activity and polyphony |
| `bloom` | brightness, harmony, openness |
| `roots` | low end, stability, drones |
| `mold` | decay, degradation, tape wear |
| `bacteria` | microscopic motion, particles |

Each species interprets them in its own character. Controls ramp over about 200 ms.

### Species

| Method | Signature | Notes |
| --- | --- | --- |
| `getCurrentSpecies` | `() => SoundWorldMetadata \| null` | |
| `getAvailableSpecies` | `() => SoundWorldMetadata[]` | `seed`, `flowers`, `mold`, `bacteria` plus anything registered |
| `registerSpecies` | `(factory: () => SoundWorld) => void` | Ids must not collide with the built in set (`ReservedSpeciesIdError`). Contract in [CREATING_A_SPECIES.md](./CREATING_A_SPECIES.md) |

### Events and analysis

| Method | Signature | Notes |
| --- | --- | --- |
| `on` | `(event, handler) => () => void` | Returns the unsubscribe function |
| `off` | `(event, handler) => void` | |
| `getAudioFeatures` | `() => AudioFeatures` | Per frame, from the master bus. Poll from your render loop |
| `getWaveform` | `() => Float32Array` | 1024 samples, -1..1 |
| `getLevel` | `() => number` | 0..1 from a -60 dB floor |

### Modulation (1.1)

| Method | Signature | Notes |
| --- | --- | --- |
| `modulate` | `(source, destination, depth) => ModulationRoute` | Adds to the host's base value; `setControl` and `getControl` are untouched. Returns `{ id, set(partial), remove() }` |
| `removeModulation` | `(id: string) => boolean` | False when there was no such route |
| `getModulationRoutes` | `() => ModulationRouteConfig[]` | Serializable; a host can save routes in a preset |
| `getModulationState` | `() => ModulationState` | `{ time, sources, controls: { base, modulated }, targets, routes }`. Poll per frame |

Sources are plain descriptors. The same `id` used in two routes is one source.

| Source | Fields | Output |
| --- | --- | --- |
| `lfo` | `shape: sine \| triangle \| square \| saw`, `hz` or `beats`, `unipolar?`, `phase?` | -1..1, or 0..1 with `unipolar` |
| `sample-hold` | `hz` or `beats`, `slew?` seconds | -1..1, random each period |
| `follower` | `band: rms \| bass \| mid \| high`, `attack?`, `release?` | 0..1, follows the engine's own output |
| `midi-cc` | `cc`, `channel?` | 0..1 after `enableMidi()` or `feedMidi()`; inactive before |
| `midi-aftertouch` | `channel?` | 0..1 |
| `midi-bend` | `channel?` | -1..1 |

`beats` rates sync to the transport BPM and reset phase on `transport.play()`; `hz` runs free. Destinations are a control name (`'bloom'`) or `target:<name>` for the thirteen numeric performance targets. Depth is -1..1: a control becomes `clamp01(base + depth × source)`; a target gets `depth × source × span` added, spans in `MODULATION_TARGET_SPANS` (`filterCutoffMult` 0.5 means ×0.5 to ×1.5 at full depth). `legato` is not a destination. Routes tick at 30 Hz while the engine is `running`, survive a species switch, and a route to a target the loaded species ignores is a silent no op. `ModulationRouteError` is thrown for unknown destinations or a source id reused with another type.

### Generative preferences (1.1)

| Method | Signature | Notes |
| --- | --- | --- |
| `setGenerativePreferences` | `(partial: Partial<GenerativePreferences>) => void` | Host overrides merged over every species' defaults, now and on every later load |
| `getGenerativePreferences` | `() => Partial<GenerativePreferences>` | Effective preferences of the loaded species, or the overrides alone |

Fields: `preferredScale`, `alternateScale`, `chordVoicings`, `phraseLength`, `probabilityBias`, `dronePreference`, `harmonyStyle`, `rhythmStyle`, `preferredTempo`, `preferredDensity`. Tempo, density, probability bias and drone preference apply now; the rest land at the next phrase boundary so a phrase in flight is not broken.

### Voices (1.2)

| Method | Signature | Notes |
| --- | --- | --- |
| `setPolyphony` | `(voices: number \| null) => void` | Caps the voices a species may allocate, integer 1..64. Each species keeps its own polyphony curve (growth opens it) and clamps to the cap. `null` removes it. Survives a species switch. Throws `RangeError` otherwise |
| `getPolyphony` | `() => number \| null` | The cap, or null |

A host's CPU knob on a phone. The species maxima are Seed 8, Flowers 10, Mold 6, Bacteria 16.

### Input

| Method | Signature | Notes |
| --- | --- | --- |
| `enableMidi` | `(inputId?: string) => Promise<boolean>` | Routes Web MIDI notes to the running species and control messages to `midiControl`. `inputId` picks one input; omitted, the first. Input ids and names are on the root export's `midi.devices` after a first call. Resolves false where Web MIDI or that input is unavailable |

## Events

Every payload carries `time`, the AudioContext second it happened at.

| Event | Payload (plus `time`) | When |
| --- | --- | --- |
| `speciesChanged` | `speciesId`, `previousSpeciesId`, `presetId?` | `loadSpecies` or `loadPreset` completes |
| `notePlayed` | `note`, `velocity`, `source`, `speciesId` | a voice starts. `source` is `host`, `generative` or `midi` |
| `noteReleased` | `note`, `source`, `speciesId` | a voice is released |
| `controlChanged` | `control`, `value`, `speciesId` | `setControl` |
| `generatorEvent` | `kind`, `note?`, `velocity?`, `intensity?`, `speciesId` | the generator plans a `phrase`, `chord`, `drone`, `ornament`, `particle`, `glitch` or `silence` |
| `densityChanged` | `density`, `speciesId` | the performance engine's density estimate moves |
| `onset` | `strength` | a transient on the master bus, 0..1. While `running`, and on every `getAudioFeatures` read |
| `modulationChanged` | `routes` | a route was added, changed or removed. Never per tick; modulated values are in `getModulationState()` |
| `midiControl` | `kind`, `controller?`, `value`, `channel` | CC and aftertouch 0..1, pitch bend -1..1, channel 1..16. Build MIDI Learn on this |

Types: `EngineEventMap`, `EngineEventName`, `EngineEventHandler`, `TimedEvent`, `NoteSource`.

## Audio features

`getAudioFeatures()` returns, for the current frame:

| Field | Range | Meaning |
| --- | --- | --- |
| `time` | seconds | AudioContext time of the read |
| `rms` | 0..1 | waveform RMS |
| `peak` | 0..1 | level with hold, decays 2.5 per second |
| `bass` | 0..1 | peak bin under 200 Hz, -80 dB floor |
| `mid` | 0..1 | peak bin 200 Hz to 2 kHz |
| `high` | 0..1 | peak bin above 2 kHz |
| `centroid` | 0..1 | spectral centroid, log scale 20 Hz to Nyquist |
| `onset` | 0..1 | onset strength this frame, 0 when none |

Raw per frame; the host owns smoothing. Reads within one frame return the same object. `BAND_EDGES_HZ` exports the two edges.

## Presets

`presets` is the shipped list (`PlantasiaPreset[]`), `getPresetById(id)` looks one up, `resolvePresetId(alias)` maps older names. `loadPreset(id)` is how a host uses them; `preset.visual` is for the host's own visuals and the engine never reads it.

## Plantasonic adapter

`createPlantasonicAdapter(engine?)` wraps the engine for the Plantasonic platform: `loadPreset(id)` returning `{ preset, resolution }`, `startWithGesture()`, and `on()`. See [PLANTASONIC_INTEGRATION.md](./PLANTASONIC_INTEGRATION.md).

## Errors

| Error | Thrown by |
| --- | --- |
| `EngineLifecycleError` | `start`, `noteOn`, `noteOff` in the wrong state. `code` says which |
| `EcologyControlScaleError` | `setControl` outside 0..1 |
| `ReservedSpeciesIdError` | `registerSpecies` with a built in id |

## Types

`PlantasiaEngine` (the interface, also exported as `PlantasiaEngineApi`), `CreatePlantasiaEngineOptions`, `SpeciesId`, `EcologicalControl`, `EcologyControlState`, `EngineState`, `EngineLifecycleErrorCode`, `SoundWorld`, `SoundWorldMetadata`, `SoundWorldStartOptions`, `SpeciesModulationFrame`, `AudioFeatures`, `OnsetEvent`, `PlantasiaPreset`, `ModulationSourceDescriptor`, `ModulationDestination`, `ModulationRoute`, `ModulationRouteConfig`, `ModulationState`, `ModulatableTarget`, `GenerativePreferences`, `MidiControlMessage`, and the event types above.

## Root export

`import { createPlantasiaEngine } from 'plantasia-sound-engine'` returns the same instance typed as the full class. On top of the public tier it carries:

- Legacy v1 preset path, documented in [API_V1.md](./API_V1.md): `playPreset`, `triggerChord`, `updateParameter`, `applyBotanicalControls`, `setMold`, `getMold`, `getParameterMetadata`, `presets`, `initialBotanicalControls`, `defaultNotePool`.
- Root only conveniences: `initialize` (alias of `init`), `stopSpecies`, `applyEcology`, `feedMidi` (raw MIDI bytes without hardware), `events`, `scheduler`, `transport`, `midi`.
- Engine internals: `EngineEventBus`, `EngineScheduler`, `Transport`, `SpeciesManager`, `createSpeciesManager`, species factories, `resolvePresetToSpecies`, `getMasterBus`, `AudioAnalyser`, `ModulationEngine`, `configureContextLatency`, the generative and performance engines.

Nothing on the root is scheduled for removal. New hosts should not need it.
