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
