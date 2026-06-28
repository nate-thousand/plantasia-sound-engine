# Presets

Built-in Sound Worlds ship as JSON in `presets/`, synced to `src/presets/bundled/` at build time, and registered in `src/presets/loader.ts`.

## Categories

| Category | Presets | Character |
|----------|---------|-----------|
| `signature` | Plantasonic | Flagship analog ecosystem |
| `soundWorlds` | Seed, Root, Bloom, Fern, Vine, Juno Flowers | Organic melodic species |
| `ambient` | Coral, Mycelium | Spacious, networked tones |
| `textures` | Mutation, Crystal | Edgy / crystalline |

See `presets/default.json` for the authoritative category manifest.

## Preset schema

Each preset includes:

| Field | Required | Description |
|-------|----------|-------------|
| `id` | yes | Unique preset identifier |
| `name` | yes | Display name |
| `species` | yes | Botanical species label |
| `description` | yes | Short description |
| `mood` | yes | Mood tags for UI |
| `asciiState` | yes | Organism lifecycle state for visual apps |
| `synth` | yes | Core synth settings |
| `category` | no | Manifest category |
| `tags` | no | Discovery tags |
| `controls` | no | Macro defaults (`mold`, `tone`, `texture`, …) |
| `moldProfile` | no | Override mold personality (see below) |
| `visual` | no | ASCII theme / palette metadata |
| `midi` | no | MIDI performance defaults |
| `plantasonic` | no | Plantasonic flagship routing block |
| `botanical` | no | Juno Flowers routing block |
| `growth` | no | Juno hold-time growth stages |

## Mold defaults

Every bundled preset includes `controls.mold` — the intentional default Mold position (0–100). Plantasonic ships at `12` for subtle aging out of the box.

```json
"controls": {
  "mold": 12,
  "tone": 42,
  "texture": 48
}
```

## Mold profiles

Mold is not identical across presets. Each Sound World has a **mold personality** that scales internal degradation modules:

| Profile | Sound Worlds | Character |
|---------|--------------|-----------|
| `plantasonic` | Plantasonic, Juno Flowers | Analog tape wear, gentle instability, warm saturation |
| `bloom` | Bloom, Fern | Delicate granular petals, sparkling echoes |
| `roots` | Root, Vine | Heavy analog distortion, earthy crackle |
| `rainforest` | Coral, Mycelium | Dense delay blooms, chaotic ambience |
| `winter` | Crystal | Frozen artifacts, glassy bit reduction |
| `night-bloom` | Mutation | Haunted tape loops, ghost delays, spectral shimmer |
| `generic` | Seed (fallback) | Balanced degradation |

Override in preset JSON:

```json
{
  "id": "crystal",
  "moldProfile": "winter"
}
```

Or resolve programmatically:

```typescript
import { resolveMoldProfile, getPresetById } from 'plantasia-sound-engine';

const profile = resolveMoldProfile(getPresetById('plantasonic'));
```

## Loading presets

```typescript
import { presets, getPresetById, getPresetsByCategory } from 'plantasia-sound-engine';

const flagship = getPresetById('plantasonic');
const signatures = getPresetsByCategory('signature');
```

## Adding a preset

1. Create `presets/<category>/<id>.json`
2. Add the id to `presets/default.json`
3. Import in `src/presets/loader.ts` and append to `BUILTIN_PRESET_DATA`
4. Run `npm run sync-presets && npm run build`

See [CONTRIBUTING.md](./CONTRIBUTING.md) for full steps.
