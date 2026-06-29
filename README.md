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

**Live demo:** deploy via Vercel (`npm run build:site`) — v2 basic-engine showcase.

## Documentation

| Document | Description |
|----------|-------------|
| [docs/PLANTASONIC_INTEGRATION.md](./docs/PLANTASONIC_INTEGRATION.md) | Host integration guide |
| [docs/MIGRATION_V1_TO_V2.md](./docs/MIGRATION_V1_TO_V2.md) | v1 presets → v2 species |
| [docs/LIFECYCLE.md](./docs/LIFECYCLE.md) | Engine state machine |
| [docs/EVENTS.md](./docs/EVENTS.md) | Semantic event bus |
| [docs/SCHEDULER.md](./docs/SCHEDULER.md) | Scheduler + transport + MIDI |
| [docs/API.md](./docs/API.md) | v2 public API + v1 compatibility |
| [docs/SOUND_WORLD_ENGINE.md](./docs/SOUND_WORLD_ENGINE.md) | Sound World architecture |
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

## Examples

| Command | Description |
|---------|-------------|
| `npm run example:basic-engine` | v2 Seed — notes + bloom control |
| `npm run example:species-switching` | Switch Sound Worlds |
| `npm run example:midi-performance` | Keyboard + velocity |
| `npm run example:generative-playback` | Autonomous generative output |
| `npm run demo` | v1 preset browser (local dev) |

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
