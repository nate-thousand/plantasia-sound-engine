# Plantasia Sound Engine

**Sound World architecture (beta)** — Four live species (Seed, Flowers, Mold, Bacteria), generative composition, performance routing, and registry shape. **Not integration-ready** until Phases 17–20 ship.

The v1 preset path (`PlantasiaEngine`, JSON presets, Plantasonic / Juno graphs) remains fully supported on `main`.

> **Do not pin tag `v2.0.0` for Plantasonic.** See [docs/MIGRATION_V1_TO_V2.md](./docs/MIGRATION_V1_TO_V2.md) and [ROADMAP.md](./ROADMAP.md).

## Quick start (v2 — prototype only)

```typescript
import { createSpeciesManager, loadDefaultSpecies } from 'plantasia-sound-engine';

const manager = createSpeciesManager();
await loadDefaultSpecies(manager);

// Requires user gesture + manager.start() before noteOn produces audio
manager.setControl('bloom', 0.65); // 0–1 only
manager.start();
manager.noteOn('C4', 0.8);
```

```bash
npm install
npm run build
npm run test          # full v2 validation suite
npm run example:basic-engine
```

## Documentation

| Document | Description |
|----------|-------------|
| [docs/API.md](./docs/API.md) | v2 public API + v1 compatibility |
| [docs/SOUND_WORLD_ENGINE.md](./docs/SOUND_WORLD_ENGINE.md) | Sound World architecture |
| [docs/SPECIES.md](./docs/SPECIES.md) | Seed, Flowers, Mold, Bacteria reference |
| [docs/GENERATIVE_ENGINE.md](./docs/GENERATIVE_ENGINE.md) | Shared composition system |
| [docs/PERFORMANCE_ENGINE.md](./docs/PERFORMANCE_ENGINE.md) | Expressive performance routing |
| [docs/PLUGIN_ARCHITECTURE.md](./docs/PLUGIN_ARCHITECTURE.md) | Species registry and plugins |
| [docs/CREATING_A_SPECIES.md](./docs/CREATING_A_SPECIES.md) | Add a new Sound World |
| [docs/MIGRATION_V1_TO_V2.md](./docs/MIGRATION_V1_TO_V2.md) | v1 presets → v2 species (required before Plantasonic) |
| [docs/API_V1.md](./docs/API_V1.md) | v1 preset engine reference |
| [ROADMAP.md](./ROADMAP.md) | Milestones and release history |
| [CHANGELOG.md](./CHANGELOG.md) | Version history |

## Public API (v2)

```typescript
import {
  createPlantasiaEngine,   // v1 facade factory
  createSpeciesManager,    // v2 species host
  createSpeciesRegistry,   // plugin discovery
  seedSpecies,
  flowersSpecies,
  moldSpecies,
  bacteriaSpecies,
} from 'plantasia-sound-engine';
```

| Export | Description |
|--------|-------------|
| `createSpeciesManager()` | Manager with all built-in species registered |
| `createSpeciesRegistry()` | Registry only — for custom plugin setups |
| `loadDefaultSpecies()` | Load Seed (default species) |
| `SpeciesManager` | Load/switch species, ecology, notes |
| `EcologyControls` | Normalized 0–1 ecological state |
| `Generator` | Shared generative composition engine |
| `PerformanceEngine` | Velocity, density, macro routing |
| `createPlantasiaEngine()` | v1 preset facade (unchanged) |

See [docs/API.md](./docs/API.md) for the full contract.

## v2 examples

| Command | Description |
|---------|-------------|
| `npm run example:basic-engine` | Load Seed, play notes, bloom control |
| `npm run example:species-switching` | Switch active Sound Worlds |
| `npm run example:midi-performance` | Keyboard performance with velocity |
| `npm run example:generative-playback` | Autonomous generative output |

Legacy v1 examples: `example:basic`, `example:presets`, `example:midi`, etc.

## Installation

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
npm run demo            # v1 browser demo
```

## Repository structure

```
plantasia-sound-engine/
├── src/
│   ├── engine/          Core runtime, registry, generative, performance
│   ├── species/         Sound World plugins (seed, flowers, mold, bacteria)
│   ├── templates/       Species template for new plugins
│   ├── shared/          Cross-species helpers
│   ├── presets/         v1 JSON preset loader
│   ├── synths/          v1 signature graphs (Plantasonic, Juno)
│   └── index.ts         Public API barrel
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
