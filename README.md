# Plantasia Sound Engine

Reusable botanical synthesis engine for Plantasia applications — including Plantasia 2.0.

**[Explore the live control surface](https://plantasia-sound-engine.vercel.app/)** Maps botanical control parameters to a Tone.js synth graph with no UI, React, or visualization dependencies.

## Overview

The engine provides a stable public API (`PlantasiaEngine` + functional exports), eleven built-in presets (JSON-serializable), botanical live controls, the **Mold** living degradation macro, and signature synth paths (Plantasonic, Juno Flowers).

## Installation

**Local path (monorepo / adjacent apps):**

```json
{
  "dependencies": {
    "plantasia-sound-engine": "file:../plantasia-sound-engine"
  }
}
```

**From GitHub:**

```json
{
  "dependencies": {
    "plantasia-sound-engine": "github:nate-thousand/plantasia-sound-engine#v0.1.0"
  }
}
```

Then run `npm install`. The `prepare` script builds `dist/` automatically.

## Development

```bash
npm install
npm run sync-presets   # Copy presets/ -> src/presets/bundled/
npm run build          # Compile TypeScript + copy bundled presets to dist/
npm run typecheck      # Type-check without emitting
npm run demo           # Browser demo (requires build)
npm run dev            # Legacy basic example via Vite
```

Run any example (requires build first):

```bash
npm run example:basic
npm run example:presets
npm run example:effects
npm run example:midi
npm run example:sequencing
npm run example:generative
```

## Build

```bash
npm run build
node -e "import('./dist/index.js').then(m => console.log(Object.keys(m)))"
```

This package is ESM-only (`"type": "module"`). Source uses `.js` extensions in relative imports; `tsconfig.json` uses `"module": "NodeNext"`.

## Demo

```bash
npm run build
npm run demo
```

Open the Vite URL, click **Start Audio**, select a preset, **Play Note**, **Stop Note**. See [TESTING.md](./TESTING.md) for full verification steps.
# Plantasia Sound Engine

Reusable botanical synthesis engine for Plantasia applications, including Plantasonic and Plantasia 2.0.

> **Demo access:** The hosted control surface currently requires Vercel authentication. Use the local demo below for public verification of the engine.

## What it demonstrates

- A framework-independent Tone.js audio engine with a stable TypeScript API
- Eleven JSON-serializable presets and botanical performance controls
- The **Mold** macro for controlled sonic degradation
- Reusable signature synth paths for Plantasonic and Juno Flowers
- MIDI, sequencing, and effect-rack foundations designed for extension

## Install

From an adjacent local project:

```json
{
  "dependencies": {
    "plantasia-sound-engine": "file:../plantasia-sound-engine"
  }
}
```

From GitHub:

```json
{
  "dependencies": {
    "plantasia-sound-engine": "github:nate-thousand/plantasia-sound-engine#v0.1.0"
  }
}
```

Then run `npm install`. The package is ESM-only and its `prepare` script builds `dist/` automatically.

## Develop and verify

```bash
npm install
npm run sync-presets
npm run build
npm run typecheck
npm run demo
```

Open the local Vite URL, choose **Start Audio**, select a preset, play a note, and stop it. See [TESTING.md](./TESTING.md) for the complete verification path.

Runnable examples include:

```bash
npm run example:basic
npm run example:presets
npm run example:effects
npm run example:midi
npm run example:sequencing
npm run example:generative
```

## Public API

| Export | Purpose |
| --- | --- |
| `PlantasiaEngine` | Primary facade |
| `initAudio()` | Start Tone.js after a user gesture |
| `playPreset(preset)` / `stopAudio()` | Control playback |
| `applyBotanicalControls(controls)` | Map botanical controls to synthesis |
| `triggerChord(notes?)` | Play a short chord |
| `setTempo(bpm)` | Set transport tempo |
| `getWaveform()` / `getLevel()` | Read visualization data |
| `setMold(mold)` | Apply the Mold macro from 0–100 |
| `ENGINE_PARAMETER_METADATA` | MIDI and automation metadata |
| `presets` | Built-in preset collection |

See [docs/API.md](./docs/API.md) for the full reference and [docs/PRESETS.md](./docs/PRESETS.md) for preset and Mold behavior.

## Example

```typescript
import { PlantasiaEngine } from 'plantasia-sound-engine';

const engine = new PlantasiaEngine();
await engine.init(); // user gesture required
engine.applyBotanicalControls(engine.initialBotanicalControls);
engine.playPreset(engine.presets[0]);
engine.triggerChord(['C3', 'E3', 'G3']);
engine.stop();
```

## Architecture

```text
src/
├── engine/       Core engine and facade
├── synths/       Species-specific synths
├── effects/      Effect-rack foundation
├── mold/         Living degradation macro
├── presets/      Loaders and bundled JSON
├── midi/         Web MIDI foundation
├── sequencing/   Sequencer foundation
└── utils/        Shared types and helpers
```

## Roadmap and license

See [ROADMAP.md](./ROADMAP.md) for planned preset browsing, effects, modulation, MIDI/MPE, sequencing, and performance work.

MIT — see [LICENSE](./LICENSE).

## Repository structure

```
plantasia-sound-engine/
├── src/
│   ├── engine/          Core audio engine + PlantasiaEngine facade
│   ├── synths/          Species-specific synth implementations (Juno Flowers)
│   ├── effects/         Effect rack scaffold (future)
│   ├── mold/            Living degradation macro (Mold)
│   ├── presets/         Preset loader, serialization, bundled JSON
│   ├── midi/            Web MIDI scaffold (future)
│   ├── sequencing/      Sequencer scaffold (future)
│   ├── utils/           Shared types and helpers
│   └── index.ts         Public API barrel
├── presets/             Source-of-truth preset JSON by category
├── samples/             Sample assets (future)
├── assets/              IRs, wavetables, images (future)
├── examples/            Runnable browser examples
├── demo/                Primary browser smoke test
├── docs/                Architecture and API documentation
├── README.md
├── ROADMAP.md
├── CHANGELOG.md
└── TESTING.md
```

## Public API

| Export | Description |
|--------|-------------|
| `PlantasiaEngine` | Primary facade class |
| `initAudio()` | Start Tone.js AudioContext (user gesture required) |
| `playPreset(preset)` | Apply preset and trigger audio |
| `stopAudio()` | Release all voices |
| `applyBotanicalControls(controls)` | Map botanical knobs to synth |
| `triggerChord(notes?)` | Play a short chord |
| `setTempo(bpm)` | Set transport tempo |
| `getWaveform()` | Analyser waveform data |
| `getLevel()` | Normalized output level (0–1) |
| `updateParameter(key, value)` | Update a synth setting |
| `defaultNotePool` | Default note pool |
| `presets` | All built-in presets |
| `initialBotanicalControls` | Default botanical values |
| `setMold(mold)` | Set Mold living degradation macro (0–100) |
| `getMoldValue()` | Read current Mold value |
| `getPresetMold(preset)` | Read preset default Mold |
| `resolveMoldParameters(mold)` | Resolve macro → module targets |
| `resolveMoldProfile(preset)` | Get Sound World mold personality |
| `MOLD_PROFILES` | Built-in mold profile registry |
| `ENGINE_PARAMETER_METADATA` | MIDI / automation parameter metadata |
| `plantasonicPreset`, `PLANTASONIC_*` | Plantasonic flagship preset + constants |
| `junoFlowersPreset`, `JUNO_FLOWERS_*` | Juno Flowers preset + constants |

See [docs/API.md](./docs/API.md) for full reference. See [docs/PRESETS.md](./docs/PRESETS.md) for preset and Mold profile documentation.

## Example usage

```typescript
import { PlantasiaEngine } from 'plantasia-sound-engine';

const engine = new PlantasiaEngine();
await engine.init(); // user gesture required
engine.applyBotanicalControls(engine.initialBotanicalControls);
engine.playPreset(engine.presets[0]);
engine.triggerChord(['C3', 'E3', 'G3']);
engine.stop();
```

## Roadmap summary

See [ROADMAP.md](./ROADMAP.md) for milestones: preset browser, effect rack, modulation matrix, MIDI/MPE, sequencing, and performance optimizations.

## License

MIT — see [LICENSE](./LICENSE).

