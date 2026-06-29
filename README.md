# Plantasia Sound Engine

**Sound World architecture (beta)** — Four live species (Seed, Flowers, Mold, Bacteria), unified facade, semantic events, generative composition, and expressive performance routing.

**Version:** `1.0.0-beta.1` on branch `v2-sound-world-engine` — first honest integration beta (Phases 17–21 complete).

The v1 preset path (`playPreset()`, JSON presets, Plantasonic / Juno signature graphs) remains available on the root export for legacy hosts.

> Pin **`1.0.0-beta.1`** or a commit SHA on `v2-sound-world-engine`. Do **not** use tag `v2.0.0` for integration.

## Quick start (v2 — recommended)

```typescript
import { createPlantasiaEngine } from 'plantasia-sound-engine/public';

const engine = createPlantasiaEngine();
await engine.initialize();       // user gesture required
await engine.loadPreset('plantasonic'); // or loadSpecies('seed')
await engine.start();

engine.setControl('bloom', 0.65);  // 0–1 only
engine.noteOn('C4', 0.8);

engine.on('notePlayed', ({ note, velocity }) => { /* visuals */ });
engine.on('densityChanged', ({ density }) => { /* motion */ });
```

```bash
npm install
npm run build
npm run test
npm run example:basic-engine
```

**Live demo:** https://sound-engine.xyz — full control surface (Vercel, `npm run build:site`).  
**Local:** `npm run demo` — same UI locally (see [Demo control surface](#demo-control-surface)).

## Documentation

| Document | Description |
|----------|-------------|
| [docs/PLANTASONIC_INTEGRATION.md](./docs/PLANTASONIC_INTEGRATION.md) | Host integration guide |
| [docs/MIGRATION_V1_TO_V2.md](./docs/MIGRATION_V1_TO_V2.md) | v1 presets → v2 species |
| [docs/LIFECYCLE.md](./docs/LIFECYCLE.md) | Engine state machine |
| [docs/EVENTS.md](./docs/EVENTS.md) | Semantic event bus |
| [docs/SCHEDULER.md](./docs/SCHEDULER.md) | Scheduler + transport + MIDI |
| [docs/API.md](./docs/API.md) | v2 public API + v1 compatibility |
| [docs/DEMO_CONTROL_AUDIT.md](./docs/DEMO_CONTROL_AUDIT.md) | Demo control wiring audit (validation pass) |
| [docs/SPECIES.md](./docs/SPECIES.md) | Seed, Flowers, Mold, Bacteria |
| [ROADMAP.md](./ROADMAP.md) | Milestones and release history |
| [CHANGELOG.md](./CHANGELOG.md) | Version history |

## Public API

**Slim surface (recommended):**

```typescript
import {
  createPlantasiaEngine,
  createPlantasonicAdapter,
  resolvePresetToSpecies,
  EngineEventBus,
} from 'plantasia-sound-engine/public';
```

**Full surface** (v1 + v2 internals): `import { … } from 'plantasia-sound-engine'`

| Export | Description |
|--------|-------------|
| `createPlantasiaEngine()` | Unified facade — v2 lifecycle + v1 preset compat |
| `createPlantasonicAdapter()` | Preset metadata + v2 audio for Plantasonic hosts |
| `resolvePresetToSpecies()` | Map legacy preset id → species + ecology |
| `engine.on()` / `engine.events` | Semantic events for visualization |
| `engine.scheduler` / `engine.transport` | Central timing |
| `engine.enableMidi()` | Web MIDI input (browser) |

See [docs/API.md](./docs/API.md) for the full contract.

## Demo control surface

`npm run build && npm run demo` opens the definitive Plantasia test bench at `demo/`. It exposes every **wired** engine capability and flags scaffold features in the Debug panel.

| Section | Controls |
|---------|----------|
| **Presets** | Category filter, browser, prev/next/random, favorites, temp save, copy JSON |
| **Sound Worlds** | Active species, upcoming species, preset→species mapping via `loadPreset()` |
| **Musical** | Tempo, swing, density, complexity, transport play/pause/stop |
| **Layers** | Per-species layer cards (drone, pulse, melody, …) routed via ecology proxies |
| **Timbre** | Filter, envelope, detune, FM, modulation, drift, stereo — v1 `updateParameter` + botanical |
| **Effects** | Reverb, delay, chorus, saturation, distortion/mold, EQ — botanical + mold routing |
| **Generative** | Phrase evolution, memory, mutation, surprise, event frequency |
| **Ecology (v2)** | growth, bloom, roots, mold, bacteria (0–100 UI → 0–1 API) |
| **Botanical (v1)** | All 11 botanical controls including mold |
| **Audio** | Waveform canvas, RMS/peak/bass/mid/treble meters, chord trigger |
| **Reactive** | Not wired — section shows hint only |
| **MIDI** | Enable, device list, note monitor, panic |
| **Keyboard** | A–K pentatonic layout, visual key feedback, octave/velocity options |
| **Performance** | 12 macros with **species-specific routing** (Bloom, Mold, Air, Roots, …) |
| **Utilities** | Reset, randomize, export/import JSON, copy engine state |
| **Debug** | Live state, validation warnings, unwired control detection |

### Workflows

- **Sound design (v2):** Start Audio → Start Generative → tune **Ecological Controls** + Performance macros
- **Sound design (v1):** Start Audio → **Play Preset Chord** → tune **Botanical Controls** + timbre (v1 path)
- **Generative:** Start Audio → Start Generative → ecology + generative sliders
- **MIDI performance:** Start Generative → Enable MIDI (requires `running` state)
- **Keyboard:** Start Audio → keys A–K (auto-starts generative)
- **Debugging:** Debug panel → Validate — see [DEMO_CONTROL_AUDIT.md](./docs/DEMO_CONTROL_AUDIT.md)

Every active control is wired to a real engine API. Removed or labeled unavailable: audio reactive, mic, MIDI device select, per-layer mute/solo, and generative parameters with no engine facade. See audit doc for full inventory.

### Macro behavior

Performance macros route differently per active species (`seed`, `flowers`, `mold`, `bacteria`). For example, **Bloom** on Flowers boosts harmony and ecology bloom; on Mold it scales bloom conservatively and favors decay character. See `demo/lib/engineBridge.js` → `applyMacro()`.

### Preserved v1 path

**Play Preset Chord** still calls `engine.playPreset()` for signature Plantasonic/Juno/standard graphs. v2 generative playback uses `loadPreset()` + `start()`.

## Examples

| Command | Description |
|---------|-------------|
| `npm run example:basic-engine` | v2 Seed — notes + bloom control |
| `npm run example:species-switching` | Switch Sound Worlds |
| `npm run example:midi-performance` | Keyboard + velocity |
| `npm run example:generative-playback` | Autonomous generative output |
| `npm run demo` | **Complete control surface** — presets, species, macros, MIDI, keyboard, debug |

## Installation

```json
{
  "dependencies": {
    "plantasia-sound-engine": "github:nate-thousand/plantasia-sound-engine#v2-sound-world-engine"
  }
}
```

Or local development:

```json
{
  "dependencies": {
    "plantasia-sound-engine": "file:../plantasia-sound-engine"
  }
}
```

```bash
npm install   # runs prepare → build
```

## Development

```bash
npm run sync-presets
npm run build
npm run typecheck
npm run test
npm run build:site   # production bundle for Vercel
```

## Repository structure

```
plantasia-sound-engine/
├── src/
│   ├── engine/          Core runtime, events, scheduler, registry
│   ├── species/         Sound World plugins (seed, flowers, mold, bacteria)
│   ├── integration/     Plantasonic adapter
│   ├── public.ts        Slim recommended exports
│   └── index.ts         Full API barrel (v1 + v2)
├── demo/                Complete control surface (npm run demo)
├── examples/            v1 + v2 browser examples
├── docs/                Architecture and API documentation
└── scripts/             Build validation and test suite
```

## v1 API (preserved)

```typescript
import { createPlantasiaEngine } from 'plantasia-sound-engine';

const engine = createPlantasiaEngine();
await engine.init();
engine.playPreset(engine.presets[0]);
```

See [docs/API_V1.md](./docs/API_V1.md).

## License

MIT — see [LICENSE](./LICENSE).
