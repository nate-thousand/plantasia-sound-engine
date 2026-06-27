# Plantasia Sound Engine

Reusable botanical synthesis engine for Plantasia applications. Maps botanical control parameters to a Tone.js synth graph — no UI, React, or visualization code.

## Signal flow

```
PolySynth → Filter → Delay → Reverb → destination
                ↑
               LFO
```

## Installation

Install from a local path while developing across Plantasia apps:

```json
{
  "dependencies": {
    "plantasia-sound-engine": "file:../plantasia-sound-engine"
  }
}
```

Then run `npm install` in the consuming project. The `prepare` script builds `dist/` automatically.

For local development without publishing:

```bash
npm install
npm link
# In the consuming app:
npm link plantasia-sound-engine
```

## Usage

### Class API (recommended)

```typescript
import { PlantasiaEngine } from 'plantasia-sound-engine';

const engine = new PlantasiaEngine();

// Must be called from a user gesture (click / keypress)
await engine.init();

engine.applyBotanicalControls(engine.initialBotanicalControls);
engine.playPreset(engine.presets[0]);
engine.triggerChord(['C3', 'E3', 'G3']);
```

### Functional API

The original function exports remain available for backward compatibility:

```typescript
import {
  initAudio,
  playPreset,
  applyBotanicalControls,
  triggerChord,
  presets,
  initialBotanicalControls,
} from 'plantasia-sound-engine';

await initAudio();
applyBotanicalControls(initialBotanicalControls);
playPreset(presets[0]);
triggerChord(['C3', 'E3', 'G3']);
```

## Public API

| Export | Description |
|--------|-------------|
| `PlantasiaEngine` | Primary facade class wrapping all engine methods |
| `initAudio()` | Start the Tone.js AudioContext (requires user gesture) |
| `playPreset(preset)` | Apply preset synth settings and trigger a chord |
| `stopAudio()` | Release all active voices |
| `applyBotanicalControls(controls)` | Map botanical knobs to synth parameters |
| `triggerChord(notes?)` | Play a short chord (defaults to first three notes in the pool) |
| `setTempo(bpm)` | Set transport tempo |
| `getWaveform()` | Read analyser waveform data |
| `getLevel()` | Normalized output level (0–1) |
| `updateParameter(key, value)` | Update a single synth setting |
| `defaultNotePool` | Default note pool used by `triggerChord` |
| `presets` | All nine Plantasia preset definitions |
| `initialBotanicalControls` | Default botanical control values |

### Types

| Type | Description |
|------|-------------|
| `PlantasiaPreset` | Preset definition with synth settings |
| `SynthSettings` | Oscillator, filter, envelope, and effects config |
| `BotanicalControls` | Live botanical knob values (0–100) |
| `BotanicalControlKey` | Keys for individual botanical controls |
| `SpeciesName` | Preset species identifier |
| `OrganismState` | Lifecycle state metadata on presets |

## Botanical → synthesis mapping

| Control | Synth parameter |
|---------|-----------------|
| Energy | Oscillator volume |
| Growth | Envelope attack / release |
| Life | LFO frequency |
| Space | Delay & reverb wet |
| Texture | Filter cutoff (brightness) |
| Resonance | Filter Q |

## Project structure

```
src/
  index.ts              Public API barrel
  plantasiaEngine.ts    PlantasiaEngine class
  audio/
    audioEngine.ts      Tone.js graph and synthesis logic
  data/
    presets.ts          Built-in preset definitions
  types/
    botanical.ts        Botanical control types
    presets.ts          Preset and synth setting types
demo/
  index.html            Browser smoke test
  main.js               Demo wiring for built dist/
```

## Development

```bash
npm install
npm run build      # Compile to dist/
npm run typecheck  # Type-check without emitting
npm run clean      # Remove dist/
npm run demo       # Browser test page (requires build first)
```

This package is ESM-only (`"type": "module"`). TypeScript source uses `.js` extensions in relative imports so emitted `dist/` files resolve correctly under Node and browser ESM. `tsconfig.json` uses `"module": "NodeNext"` and `"moduleResolution": "NodeNext"`.

## Testing

### 1. Build

```bash
npm run build
```

### 2. Node import smoke test

From the package root, verify the built entry point loads:

```bash
node -e "import('./dist/index.js').then(m => console.log(Object.keys(m)))"
```

Expected output includes `PlantasiaEngine`, `initAudio`, `playPreset`, `presets`, and the other public exports.

### 3. Browser demo

Build first, then start the demo server:

```bash
npm run build
npm run demo
```

Vite opens `demo/index.html`, which imports the built package from `dist/index.js` (via the Vite alias in `vite.demo.config.ts`). In the browser:

1. Click **Start Audio** (required user gesture for Web Audio).
2. Choose a preset from the dropdown.
3. Click **Play Preset**.
4. Click **Stop** to release voices.

The demo lives in `demo/index.html` and `demo/main.js`.

## Dependencies

- [Tone.js](https://tonejs.github.io/) — Web Audio synthesis framework

## License

MIT — see [LICENSE](./LICENSE).
