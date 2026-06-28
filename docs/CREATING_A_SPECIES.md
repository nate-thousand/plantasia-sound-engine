# Creating a Species

> **v2.0.0** — Copy `src/templates/species-template/`, register in `registerBuiltinSpecies.ts`.

---

## Quick start

```bash
cp -r src/templates/species-template src/species/your-species-id
# Find/replace Template → YourSpecies, template-species → your-species-id
```

Then implement synth, effects, and register in `registerBuiltinSpecies.ts`.

---

## Required files

| File | Required | Purpose |
|------|----------|---------|
| `index.ts` | Yes | `SoundWorld` implementation + `createYourSpeciesSoundWorld()` factory |
| `metadata.ts` | Yes | Identity, generative preferences, supported controls |
| `synth.ts` | Yes | Tone.js voice graph |
| `effects.ts` | Yes | Effects chain |
| `generator.ts` | Yes | Thin adapter to shared `Generator` |
| `expressionProfile.ts` | Recommended | Performance engine weights |
| `performanceApply.ts` | Recommended | Apply performance targets to DSP |
| `README.md` | Optional | Species-specific design notes |

---

## Naming conventions

| Item | Convention | Example |
|------|------------|---------|
| Folder | lowercase, hyphens | `src/species/night-bloom/` |
| Species ID | lowercase, hyphens | `night-bloom` |
| Factory | `create<Name>SoundWorld` | `createNightBloomSoundWorld` |
| Metadata constant | `<NAME>_SOUND_WORLD_METADATA` | `NIGHT_BLOOM_SOUND_WORLD_METADATA` |
| Class | `<Name>SoundWorld` | `NightBloomSoundWorld` |

IDs must match `/^[a-z][a-z0-9-]*$/`.

---

## Metadata requirements

```typescript
export const YOUR_SOUND_WORLD_METADATA: SoundWorldMetadata = {
  id: 'your-species-id',        // unique, lowercase
  name: 'Display Name',         // human-readable
  concept: 'One-line concept',  // non-empty
  description: '...',           // non-empty paragraph
  inspiration: ['refs'],        // non-empty array
  character: ['tags'],          // non-empty array
  status: 'active',             // omit or 'active' when shippable
  version: '0.1.0',             // optional semver
};
```

For WIP plugins use `status: 'coming_soon'` until audio is complete.

---

## Required interface

Your class must implement `SoundWorld`:

| Method | Contract |
|--------|----------|
| `initialize(context)` | Prepare graph; safe to call multiple times after dispose |
| `start()` / `stop()` | Arm / disarm generative output |
| `noteOn(note, velocity?)` | Trigger voice; velocity 0–1 |
| `noteOff(note)` | Release voice |
| `allNotesOff()` | Release all |
| `setControl(control, value)` | Accept 0–100 for all five ecological controls |
| `dispose()` | Release all Tone.js nodes |

---

## Ecological controls

All five controls must be handled in `setControl()`:

- `growth` — temporal / polyphonic expansion
- `bloom` — harmonic and spatial opening
- `roots` — foundation / body
- `mold` — degradation / instability
- `bacteria` — microscopic motion / particles

Map internally to your DSP. Use `syncGeneratorEcology()` and `syncPerformanceEcology()` helpers.

---

## Registration

Add to `src/species/registerBuiltinSpecies.ts`:

```typescript
import { createYourSpeciesSoundWorld } from './your-species-id/index.js';

export function registerBuiltinSpecies(registry: SpeciesRegistry): void {
  // ...existing species...
  registry.register({ factory: createYourSpeciesSoundWorld });
}
```

**Do not** modify `SpeciesManager` or registry internals.

---

## Testing checklist

- [ ] `npm run build` passes
- [ ] `npm run test:registry` — registration and validation
- [ ] `npm run test:species` — load + note smoke test (add species-specific cases if needed)
- [ ] `npm run test:ecology` — setControl routing
- [ ] `npm run test:generative` — if using Generator adapter
- [ ] `npm run test:performance` — if using PerformanceEngine
- [ ] Manual: `createSpeciesManager()` → `loadSpecies('your-id')` → `noteOn('C4', 0.8)`
- [ ] Switch species: load another ID, confirm dispose without errors
- [ ] v1 demos still work (`npm run demo`) — legacy path unchanged

---

## Documentation checklist

- [ ] Update [docs/SPECIES.md](./SPECIES.md) with archetype description
- [ ] Add species section to README if public-facing
- [ ] Document unique ecological mappings in species `README.md`
- [ ] Note inspiration and character tags in metadata

---

## Validation errors

Common failures and fixes:

| Error | Fix |
|-------|-----|
| `metadata.id must be lowercase...` | Use kebab-case ID |
| `metadata.inspiration must be a non-empty string array` | Add at least one inspiration string |
| `species.noteOn must be a function` | Implement all SoundWorld methods |
| `setControl("growth") threw` | Handle all five controls without throwing |
| `Species "x" is already registered` | Choose a unique ID |
| `Species "x" is not loadable (status: coming_soon)` | Set `status: 'active'` when ready |

---

## Best practices

1. **Factory creates fresh instances** — `createYourSpeciesSoundWorld()` must return a new object each call
2. **Lazy audio graph** — build Tone.js nodes in `start()` or first `noteOn`, not at import time
3. **Thin generator adapter** — delegate to shared `Generator`, don't duplicate composition logic
4. **Performance layer** — use `expressionProfile.ts` + `performanceApply.ts`, not hard-coded velocity routing in `index.ts`
5. **Dispose thoroughly** — stop LFOs, dispose nodes, null references in `teardownGraph()`
6. **Keep v1 untouched** — new species live in v2 `SpeciesManager` path only

---

## Example reference implementations

| Species | Character | Start here |
|---------|-----------|------------|
| Seed | Warm poly, reference | `src/species/seed/` |
| Flowers | Chorus bloom | `src/species/flowers/` |
| Mold | Degradation chain | `src/species/mold/` |
| Bacteria | Particle swarm | `src/species/bacteria/` |

---

## Related

- [PLUGIN_ARCHITECTURE.md](./PLUGIN_ARCHITECTURE.md) — registry and loader design
- [GENERATIVE_ENGINE.md](./GENERATIVE_ENGINE.md) — composition system
- [PERFORMANCE_ENGINE.md](./PERFORMANCE_ENGINE.md) — expressive routing
